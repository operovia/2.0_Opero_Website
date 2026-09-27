#!/usr/bin/env python3
"""Dev servers behind this Repl's dev URL: check them at the start of a session, start any that are down.

    scripts/dev-servers.py         report each dev server, whether it hot reloads, and the dev URL
                                   (exits 1 when something needs attention)
    scripts/dev-servers.py serve   start the dev servers that are down and keep them running until stopped

Replit workflows normally run these servers, one per service in artifacts/*/.replit-artifact/artifact.toml.
`serve` is the fallback for when a workflow isn't running: the servers it starts stop when it stops.
"""

import hashlib
import http.client
import json
import os
import re
import shlex
import signal
import socket
import subprocess
import sys
import threading
import time
import tomllib
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEV_DOMAIN = os.environ.get("REPLIT_DEV_DOMAIN") or os.environ.get("REPLIT_DOMAINS", "").split(",")[0] or None
WORKFLOW_LOGS = ROOT / ".local/state/workflow-logs"
STARTUP_TIMEOUT = 90  # seconds `serve` waits for a server to answer
REBUILD_WAIT = 8  # seconds the report waits for a watch-mode rebuild of a just-saved file


@dataclass
class Service:
    artifact: str  # directory under artifacts/
    name: str  # service name in artifact.toml
    label: str
    port: int
    path: str  # first path the Replit router sends to this service
    run: str  # development command
    env: dict

    @property
    def workflow(self):
        # The name Replit gives the workflow it manages for an artifact service
        return f"artifacts/{self.artifact}: {self.name}"

    @property
    def local_url(self):
        return f"http://127.0.0.1:{self.port}{self.path}"

    @property
    def public_url(self):
        return f"https://{DEV_DOMAIN}{self.path}" if DEV_DOMAIN else None

    @property
    def dir(self):
        return ROOT / "artifacts" / self.artifact


def discover():
    services = []
    for toml_path in sorted(ROOT.glob("artifacts/*/.replit-artifact/artifact.toml")):
        artifact = tomllib.loads(toml_path.read_text())
        entries = [s for s in artifact.get("services", []) if s.get("development", {}).get("run") and s.get("localPort")]
        for svc in entries:
            title = artifact.get("title", toml_path.parent.parent.name)
            services.append(Service(
                artifact=toml_path.parent.parent.name,
                name=svc["name"],
                label=title if len(entries) == 1 else f"{title} ({svc['name']})",
                port=svc["localPort"],
                path=svc.get("paths", ["/"])[0],
                run=svc["development"]["run"],
                env={key: str(value) for key, value in svc.get("env", {}).items()},
            ))
    return services


def probe(url, timeout):
    """(HTTP status, body hash) for url, or None when nothing answers with HTTP."""
    if url is None:
        return None
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return response.status, hashlib.sha1(response.read()).hexdigest()
    except urllib.error.HTTPError as err:
        try:
            return err.code, hashlib.sha1(err.read()).hexdigest()
        except (http.client.HTTPException, OSError):
            return err.code, None
    except (urllib.error.URLError, http.client.HTTPException, OSError):
        return None


# --- processes, via /proc (no ps/ss/netstat needed) ---

def argv(pid):
    try:
        return [arg.decode(errors="replace") for arg in Path(f"/proc/{pid}/cmdline").read_bytes().split(b"\0")[:-1]]
    except OSError:
        return []


def stat_fields(pid):
    """Fields of /proc/<pid>/stat after the command name: [0] is field 3 (state), [1] ppid, [19] starttime."""
    try:
        return Path(f"/proc/{pid}/stat").read_text().rsplit(")", 1)[1].split()
    except OSError:
        return []


def parent_pid(pid):
    fields = stat_fields(pid)
    return int(fields[1]) if fields else None


def start_time(pid):
    """When pid started, as a Unix timestamp."""
    fields = stat_fields(pid)
    if not fields:
        return None
    boot = next(int(line.split()[1]) for line in Path("/proc/stat").read_text().splitlines() if line.startswith("btime "))
    return boot + int(fields[19]) / os.sysconf("SC_CLK_TCK")


def env_var(pid, name):
    try:
        entries = Path(f"/proc/{pid}/environ").read_bytes().split(b"\0")
    except OSError:
        return None
    prefix = f"{name}=".encode()
    return next((e[len(prefix):].decode(errors="replace") for e in entries if e.startswith(prefix)), None)


def pgid(pid):
    try:
        return os.getpgid(pid)
    except OSError:
        return None


def all_pids():
    return [int(pid) for pid in os.listdir("/proc") if pid.isdigit()]


def listener_pid(port):
    """PID of the process listening on port."""
    inodes = set()
    for table in ("/proc/net/tcp", "/proc/net/tcp6"):
        try:
            rows = Path(table).read_text().splitlines()[1:]
        except OSError:
            continue
        for row in rows:
            cols = row.split()
            if cols[3] == "0A" and int(cols[1].rsplit(":", 1)[1], 16) == port:  # 0A = LISTEN
                inodes.add(cols[9])
    if not inodes:
        return None
    for pid in all_pids():
        try:
            fds = os.listdir(f"/proc/{pid}/fd")
        except OSError:
            continue
        for fd in fds:
            try:
                match = re.fullmatch(r"socket:\[(\d+)\]", os.readlink(f"/proc/{pid}/fd/{fd}"))
            except OSError:  # closed since listdir
                continue
            if match and match.group(1) in inodes:
                return pid
    return None


def dev_processes(svc):
    """Running copies of this service's dev command (e.g. `pnpm --filter ... run dev` with its PORT), whether a
    workflow or `serve` started them. Each is the leader of its own process group."""
    command = shlex.split(svc.run)
    tail = command[1:]
    return [pid for pid in all_pids()
            if len(args := argv(pid)) > len(tail) and args[len(args) - len(tail):] == tail
            and any(Path(a).name == command[0] for a in args[:2]) and env_var(pid, "PORT") == str(svc.port)]


def is_serve(args):
    return (len(args) == 3 and Path(args[0]).name.startswith("python") and args[1].endswith("dev-servers.py")
            and args[2] == "serve")


def started_by_serve(pid):
    for _ in range(8):
        pid = parent_pid(pid)
        if not pid or pid <= 1:
            return False
        if is_serve(argv(pid)):
            return True
    return False


def serve_lock():
    """Take the lock that marks a running `serve`; None if another one holds it. The kernel drops this abstract
    socket when its process dies, so the lock can't go stale."""
    lock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    try:
        lock.bind(f"\0dev-servers-serve-{hashlib.sha1(str(ROOT).encode()).hexdigest()[:16]}")
    except OSError:
        lock.close()
        return None
    return lock


def hot_reloads(pid):
    """Whether the server process pid is a Vite dev server or was started by a watch-mode build. None if unknown."""
    if pid is None:
        return None
    for args in (argv(pid), argv(parent_pid(pid))):
        if "--watch" in args:
            return True
        if any(a.endswith("/vite/bin/vite.js") for a in args) and not {"preview", "build"} & set(args):
            return True
    return False


def outdated(svc, copy):
    """Why a running copy of the dev command is out of date with the files that define it, or None."""
    script = shlex.split(svc.run)[-1]
    try:
        wanted = json.loads((svc.dir / "package.json").read_text())["scripts"][script]
    except (OSError, ValueError, KeyError):
        wanted = None
    # pnpm runs the package.json script as `sh -c <script>`
    running = next((args[2] for pid in all_pids() if parent_pid(pid) == copy
                    and len(args := argv(pid)) == 3 and Path(args[0]).name == "sh" and args[1] == "-c"), None)
    if wanted and running and running != wanted:
        return f"it runs an old `{script}` script (`{running}`)"
    started = start_time(copy)
    build_script = svc.dir / "build.mjs"
    if started and build_script.exists() and build_script.stat().st_mtime > started:
        return "build.mjs changed after it started"
    return None


def build_status(svc):
    """The status `build.mjs --watch` writes after each build. If a file in the build was saved after it, waits
    briefly for the rebuild; `pending` says the rebuild still hadn't finished."""
    path = svc.dir / "dist/dev-build-status.json"
    deadline = time.monotonic() + REBUILD_WAIT
    while True:
        try:
            status = json.loads(path.read_text())
            built = datetime.fromisoformat(status["at"]).timestamp()
        except (OSError, ValueError, KeyError):
            return None
        saved = max((os.stat(f).st_mtime for f in status.get("inputs", []) if os.path.exists(f)), default=0)
        if built >= saved or time.monotonic() > deadline:
            return {**status, "pending": built < saved}
        time.sleep(0.5)


def log_hint(svc, copy):
    """Where a running copy's output goes, for messages that say to read it."""
    if copy is None:
        return ""
    if started_by_serve(copy):
        return " (its output is in the `serve` background task)"
    started = start_time(copy)
    # Replit writes each workflow run to its own directory, created as the run starts: match it to this copy
    runs = [(abs(log.parent.stat().st_mtime - started), log) for log in WORKFLOW_LOGS.glob(f"*/artifacts_{svc.artifact}__*")]
    gap, log = min(runs, default=(None, None))
    return f" (log: {log.relative_to(ROOT)})" if log and gap < 120 else ""


def describe(pid):
    return f"pid {pid} (`{' '.join(argv(pid))[:100]}`)"


def restart_advice(svc, copy):
    if copy and started_by_serve(copy):
        return "Stop the `serve` background task and start `serve` again."
    return f"Ask the user to restart the \"{svc.workflow}\" workflow in the Workflows pane."


def report(services):
    with ThreadPoolExecutor(max_workers=max(1, 2 * len(services))) as pool:
        local = list(pool.map(lambda s: probe(s.local_url, 3), services))
        public = list(pool.map(lambda s: probe(s.public_url, 10), services))

    problems = []
    if DEV_DOMAIN:
        print(f"Dev URL: https://{DEV_DOMAIN}/")
    else:
        print("Dev URL: unknown")
        problems.append("REPLIT_DEV_DOMAIN is not set, so the dev URL is unknown. Don't guess one: ask the user to open "
                        "the Replit preview pane.")
    print()
    width = max((len(s.label) for s in services), default=0)
    for svc, local_result, public_result in zip(services, local, public):
        copies = dev_processes(svc)
        listener = listener_pid(svc.port)
        serving = next((c for c in copies if listener and pgid(c) is not None and pgid(c) == pgid(listener)), None)
        copy = serving or (copies[0] if len(copies) == 1 else None)
        status = build_status(svc) if copy else None
        via = ""
        if local_result is None:
            if copy and status and not status["ok"] and not status["pending"]:
                state = "BUILD FAILED"
                problems.append(f"{svc.label}: the build failed, so its server hasn't started: {status['errors'][0]}. "
                                f"Fix it and save; the server starts after the next successful build.")
            elif copies:
                state = "NOT ANSWERING"
                problems.append(f"{svc.label}: its dev command is running (pid {', '.join(map(str, copies))}) but nothing "
                                f"answers on :{svc.port}. It may be starting or restarting after a save, so check again in "
                                f"about 10 seconds. If it stays this way, read its output{log_hint(svc, copy)}. "
                                f"Don't run `serve` for it.")
            elif listener:
                state = "PORT TAKEN"
                problems.append(f"{svc.label}: :{svc.port} is held by {describe(listener)}, which doesn't answer HTTP.")
            else:
                state = "DOWN"
                if serve_lock() is None:
                    problems.append(f"{svc.label} is not running, and a `serve` task is already running (it can't "
                                    f"start a second copy). Stop that background task and start `serve` again.")
                else:
                    problems.append(f"{svc.label} is not running. Start it with `scripts/dev-servers.py serve` as a "
                                    f"background task, or ask the user to restart the \"{svc.workflow}\" workflow in "
                                    f"the Workflows pane.")
        else:
            hot = hot_reloads(listener)
            state = {True: "hot reload", False: "NO HOT RELOAD", None: "UNKNOWN"}[hot]
            if hot is None:
                problems.append(f"{svc.label}: couldn't identify the process listening on :{svc.port}. Run this check again.")
            elif not hot:
                problems.append(f"{svc.label} is running without hot reload: :{svc.port} is held by {describe(listener)}. "
                                f"{restart_advice(svc, serving)}")
            elif serving and (reason := outdated(svc, serving)):
                state = "OUTDATED"
                problems.append(f"{svc.label} is running out-of-date dev tooling: {reason}. {restart_advice(svc, serving)}")
            if local_result[0] >= 500:
                problems.append(f"{svc.label} answers HTTP {local_result[0]} at {svc.path}. Read its output"
                                f"{log_hint(svc, copy)}.")
            if DEV_DOMAIN:
                if public_result == local_result:
                    via = "dev URL ok"
                elif public_result is None or public_result[0] in (502, 503, 504):
                    via = f"dev URL FAILS ({public_result[0] if public_result else 'no answer'})"
                    problems.append(f"{svc.label} answers on :{svc.port} but not through the dev URL. "
                                    f"{restart_advice(svc, serving)}")
                else:
                    via = "dev URL MISROUTED"
                    problems.append(f"{svc.label}: the dev URL serves different content at {svc.path} than :{svc.port} "
                                    f"(HTTP {public_result[0]} vs {local_result[0]}), so the router isn't sending "
                                    f"{svc.path} to it. {restart_advice(svc, serving)}")
            if status and status["pending"]:
                problems.append(f"{svc.label}: a saved file hasn't been rebuilt after {REBUILD_WAIT}s. Check again "
                                f"shortly; if it persists, read its output{log_hint(svc, copy)}.")
            elif status and not status["ok"]:
                problems.append(f"{svc.label}: the last build failed ({status['at'][11:19]} UTC), so the dev URL still "
                                f"serves the previous build: {status['errors'][0]}")
        if len(copies) > 1:
            if serving:
                extras = [c for c in copies if c != serving and pgid(c) is not None]
                problems.append(f"{svc.label} has {len(copies)} copies of its dev command running (pid "
                                f"{', '.join(map(str, copies))}); pid {serving} serves :{svc.port}. The others (e.g. from "
                                f"the Run button) fight it for the port. Stop them: "
                                + " ".join(f"`kill -TERM -- -{pgid(c)}`" for c in extras))
            else:
                problems.append(f"{svc.label} has {len(copies)} copies of its dev command running (pid "
                                f"{', '.join(map(str, copies))}) and none serves :{svc.port} yet, so the extra ones can't "
                                f"be told apart. Don't stop any now; check again once one answers.")
        print(f"  {svc.label:<{width}}  {svc.path:<10}  :{svc.port:<5}  {state:<13}  {via}")

    print()
    if not problems:
        print("All dev servers are up with hot reload.")
        return 0
    print("Needs attention:")
    for problem in problems:
        print(f"  - {problem}")
    return 1


def relay(proc, prefix):
    for line in proc.stdout:
        print(prefix, line, end="", flush=True)


def serve(services):
    lock = serve_lock()  # held until this process exits
    if lock is None:
        print("[serve] another `serve` is already running; not starting a second one.")
        return 1
    down = [s for s in services if not dev_processes(s) and listener_pid(s.port) is None]
    if not down:
        print("Every dev server is already running or starting; nothing to start.")
        return 0

    def stop(signum, _frame):
        # Ignore further signals so a second one (Ctrl+C twice, `timeout`) can't cut the cleanup below short
        for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
            signal.signal(sig, signal.SIG_IGN)
        raise SystemExit(128 + signum)

    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, stop)

    started = []
    relays = []
    try:
        for svc in down:
            print(f"[serve] starting {svc.label} on :{svc.port}: {svc.run}", flush=True)
            # Its own process group, so stopping `serve` can stop the whole pnpm -> sh -> node tree
            proc = subprocess.Popen(svc.run, shell=True, cwd=ROOT, env={**os.environ, "PORT": str(svc.port), **svc.env},
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors="replace",
                                    start_new_session=True)
            thread = threading.Thread(target=relay, args=(proc, f"[{svc.artifact}]"), daemon=True)
            thread.start()
            started.append((svc, proc))
            relays.append(thread)

        waiting = list(started)
        deadline = time.monotonic() + STARTUP_TIMEOUT
        while waiting and time.monotonic() < deadline:
            for svc, proc in list(waiting):
                listener = listener_pid(svc.port)
                if listener is not None and pgid(listener) == proc.pid:
                    print(f"[serve] {svc.label} is up: {svc.public_url or svc.local_url}", flush=True)
                    waiting.remove((svc, proc))
                elif listener is not None:
                    print(f"[serve] {describe(listener)} took :{svc.port} first; stopping this copy of {svc.label}", flush=True)
                    os.killpg(proc.pid, signal.SIGTERM)
                    waiting.remove((svc, proc))
                elif proc.poll() is not None:
                    print(f"[serve] {svc.label} exited with code {proc.returncode} before answering", flush=True)
                    waiting.remove((svc, proc))
            time.sleep(0.5)
        for svc, _ in waiting:
            print(f"[serve] {svc.label} is still not answering on :{svc.port} after {STARTUP_TIMEOUT}s", flush=True)

        running = list(started)
        while running:
            for svc, proc in list(running):
                if proc.poll() is not None:
                    print(f"[serve] {svc.label} exited with code {proc.returncode}", flush=True)
                    running.remove((svc, proc))
            time.sleep(1)
        return 1
    finally:
        for _, proc in started:
            try:
                os.killpg(proc.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
        for _, proc in started:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(proc.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
        # Let the relays print the servers' last lines before the interpreter shuts down
        for thread in relays:
            thread.join(timeout=2)


def main():
    services = discover()
    if sys.argv[1:] == ["serve"]:
        return serve(services)
    if sys.argv[1:]:
        print(__doc__)
        return 2
    return report(services)


if __name__ == "__main__":
    sys.exit(main())

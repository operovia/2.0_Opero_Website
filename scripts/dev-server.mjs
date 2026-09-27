#!/usr/bin/env node
/**
 * The site's dev server, checked at the start of every Claude Code session
 * in the Replit shell (see CLAUDE.md).
 *
 *   node scripts/dev-server.mjs         Report whether the dev server is up with hot reload and reachable
 *                                       through the dev URL, and print the dev URL. Exits 1 when something
 *                                       needs attention; each message says what to do.
 *   node scripts/dev-server.mjs serve   Start it (npm install, then npm run dev) when nothing is running,
 *                                       and keep it running until stopped. Run it as a background task.
 *
 * Processes are found through /proc, so it needs Linux but no ps or ss.
 * DEV_SERVER_CHECK_URL stands in for the dev URL, to try the check outside Replit.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, readlinkSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3000;
const LOCAL_URL = `http://127.0.0.1:${PORT}/`;
const domain = process.env.REPLIT_DEV_DOMAIN || (process.env.REPLIT_DOMAINS ?? '').split(',')[0];
const DEV_URL = process.env.DEV_SERVER_CHECK_URL || (domain ? `https://${domain}/` : '');
const STARTUP_TIMEOUT_MS = 180_000;
// Next.js writes its dev server errors here, whoever started it (the Run button or `serve`).
const LOG = '.next/dev/logs/next-development.log';
const LOCK = `\0opero-dev-serve-${createHash('sha1').update(ROOT).digest('hex').slice(0, 12)}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- processes, from /proc ---

function read(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

const allPids = () => readdirSync('/proc').filter((name) => /^\d+$/.test(name)).map(Number);
const argv = (pid) => read(`/proc/${pid}/cmdline`).split('\0').filter(Boolean);
const describe = (pid) => `pid ${pid} (\`${argv(pid).join(' ').slice(0, 100)}\`)`;

function stat(pid) {
  // Fields after the command name: state, parent pid, process group.
  const fields = read(`/proc/${pid}/stat`).split(')').pop().trim().split(/\s+/);
  return { parent: Number(fields[1]) || 0, group: Number(fields[2]) || 0 };
}

function cwd(pid) {
  try {
    return readlinkSync(`/proc/${pid}/cwd`);
  } catch {
    return '';
  }
}

/** The Next.js command a process runs ('dev', 'start', ...), or null if it is not the Next.js CLI. */
function nextCommand(pid) {
  const args = argv(pid);
  const i = args.findIndex((arg) => /(^|\/)next$/.test(arg) || arg.endsWith('/next/dist/bin/next'));
  return i < 0 ? null : (args[i + 1] ?? 'dev');
}

/** Running copies of this site's dev server: `next dev` processes started in this folder, by anyone. */
const devCopies = () => allPids().filter((pid) => nextCommand(pid) === 'dev' && cwd(pid) === ROOT);

/** The Next.js CLI process a pid runs under, if any. */
function nextAncestor(pid) {
  for (let current = pid, depth = 0; current > 1 && depth < 8; current = stat(current).parent, depth++) {
    const command = nextCommand(current);
    if (command) return { pid: current, command, here: cwd(current) === ROOT };
  }
  // `next start` serves from its own process, which renames itself next-server.
  if (argv(pid)[0]?.startsWith('next-server')) return { pid, command: 'start', here: cwd(pid) === ROOT };
  return null;
}

/** The pid listening on a port; 0 if something listens but its process is out of sight; null if nothing does. */
function listener(port) {
  const inodes = new Set();
  for (const table of ['/proc/net/tcp', '/proc/net/tcp6']) {
    for (const row of read(table).trim().split('\n').slice(1)) {
      const cols = row.trim().split(/\s+/);
      if (cols[3] === '0A' && parseInt(cols[1].split(':').pop(), 16) === port) inodes.add(cols[9]); // 0A: listening
    }
  }
  if (!inodes.size) return null;
  for (const pid of allPids()) {
    let fds = [];
    try {
      fds = readdirSync(`/proc/${pid}/fd`);
    } catch {
      continue;
    }
    for (const fd of fds) {
      try {
        const socket = /^socket:\[(\d+)\]$/.exec(readlinkSync(`/proc/${pid}/fd/${fd}`));
        if (socket && inodes.has(socket[1])) return pid;
      } catch {
        // Closed since it was listed.
      }
    }
  }
  return 0;
}

/** The lock a running `serve` holds. The kernel drops it when that process ends, so it never goes stale. */
function takeLock() {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(null));
    server.listen({ path: LOCK }, () => resolve(server));
  });
}

async function serveIsRunning() {
  const lock = await takeLock();
  lock?.close();
  return !lock;
}

async function probe(url, timeoutMs) {
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    return { status: response.status, body: await response.text() };
  } catch {
    return null;
  }
}

// --- check ---

async function check() {
  const problems = [];
  const say = (message) => problems.push(message);
  const stopFirst = 'Claude Code cannot stop the Run button or Replit workflows, so ask the owner to stop it there, then start `serve`.';

  console.log(DEV_URL ? `Dev URL: ${DEV_URL}` : 'Dev URL: unknown');
  if (!DEV_URL) say("REPLIT_DEV_DOMAIN is not set, so the dev URL is unknown. Don't guess one: ask the owner to open Replit's preview pane.");

  const copies = devCopies();
  const pid = listener(PORT);
  const owner = pid ? nextAncestor(pid) : null;
  let state;

  if (pid === null) {
    if (copies.length) {
      state = 'STARTING';
      say(
        `The dev server is running (pid ${copies.join(', ')}) but nothing answers on :${PORT} yet: it is starting or restarting. ` +
          `Check again in about 10 seconds. If it stays this way, read the newest lines of ${LOG}.`,
      );
    } else if (await serveIsRunning()) {
      state = 'DOWN';
      say('A `serve` task is running, but its dev server has stopped. Read that task\'s output, then stop it and start `serve` again.');
    } else {
      state = 'DOWN';
      say('The dev server is not running. Start it with `node scripts/dev-server.mjs serve` as a background task (only one), wait for `[serve] up`, then check again.');
    }
  } else if (!owner || !owner.here) {
    state = 'PORT TAKEN';
    say(
      pid
        ? `:${PORT} is held by ${describe(pid)}, which is not this site's dev server. Stop it, then start \`serve\`.`
        : `:${PORT} is held by a process this shell cannot see, likely the Run button or a Replit workflow. ${stopFirst}`,
    );
  } else if (owner.command !== 'dev') {
    state = 'NO HOT RELOAD';
    say(`:${PORT} is served by \`next ${owner.command}\` (pid ${owner.pid}), which does not hot reload. ${stopFirst}`);
  } else {
    const [page, local, remote] = await Promise.all([
      probe(LOCAL_URL, 120_000), // The first request compiles the home page, which can take a while.
      probe(`${LOCAL_URL}robots.txt`, 60_000),
      DEV_URL ? probe(new URL('robots.txt', DEV_URL).href, 20_000) : null,
    ]);
    state = 'hot reload';
    if (!page || !local) {
      state = 'STARTING';
      say(`The dev server (pid ${owner.pid}) holds :${PORT} but did not answer in time. Check again in about 10 seconds.`);
    } else if (page.status >= 500) {
      say(`The home page answers HTTP ${page.status}. Read the newest lines of ${LOG} and fix the error first.`);
    }
    if (DEV_URL && local) {
      if (remote && remote.status === local.status && remote.body === local.body) {
        state += ', dev URL ok';
      } else if (!remote || remote.status >= 500) {
        state += ', dev URL FAILS';
        say(
          `The site answers on :${PORT} but not through the dev URL (${remote ? `HTTP ${remote.status}` : 'no answer'}). ` +
            'Just after a change of setup Replit can take a minute: check again. If it persists, ask the owner to stop anything left in the Workflows pane and press Run again.',
        );
      } else {
        state += ', dev URL MISROUTED';
        say(
          `The dev URL serves something other than this site (HTTP ${remote.status} for /robots.txt), so Replit sends it elsewhere, ` +
            'likely to a workflow left from the earlier setup. Ask the owner to stop everything in the Workflows pane, then check again.',
        );
      }
    }
  }

  if (copies.length > 1) {
    // Next.js lets only one dev server run per folder; a second copy stops itself within a second or two.
    say(`A second copy of the dev server is starting (pid ${copies.join(', ')}); Next.js stops it by itself. Check again in a few seconds.`);
  }

  console.log(`\n  Site  :${PORT}  ${state}\n`);
  if (!problems.length) {
    console.log('All good: the site is live at the dev URL with hot reload.');
    return 0;
  }
  console.log('Needs attention:');
  for (const problem of problems) console.log(`  - ${problem}`);
  return 1;
}

// --- serve ---

function relay(stream, prefix) {
  createInterface({ input: stream }).on('line', (line) => console.log(`${prefix}${line}`));
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    relay(child.stdout, '[install] ');
    relay(child.stderr, '[install] ');
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

async function serve() {
  const lock = await takeLock(); // Held until this process ends.
  if (!lock) {
    console.log('[serve] Another `serve` is already running; not starting a second one.');
    return 1;
  }
  if (listener(PORT) !== null || devCopies().length) {
    console.log(`[serve] Something is already running or starting on :${PORT}; nothing to start. Run the check instead.`);
    return 0;
  }

  console.log('[serve] npm install');
  const installed = await run('npm', ['install', '--no-audit', '--no-fund']);
  if (installed !== 0) {
    console.log(`[serve] npm install failed (exit ${installed}); see its output above.`);
    return 1;
  }

  console.log(`[serve] starting the dev server on :${PORT}: npm run dev`);
  // Its own process group, so stopping `serve` stops npm, Next.js, and its workers together.
  const child = spawn('npm', ['run', 'dev'], { cwd: ROOT, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(PORT) } });
  relay(child.stdout, '[dev] ');
  relay(child.stderr, '[dev] ');
  const exited = new Promise((resolve) => {
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (error) => {
      console.log(`[serve] Could not start npm: ${error.message}`);
      resolve(1);
    });
  });

  const stop = () => {
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.removeAllListeners(signal).on(signal, () => {});
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        // Already gone.
      }
    }, 5000).unref();
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, stop);

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  for (;;) {
    if (child.exitCode !== null) break;
    const pid = listener(PORT);
    if (pid && stat(pid).group === child.pid) {
      console.log(`[serve] up: ${DEV_URL || LOCAL_URL} (hot reload). The first page load compiles, so it can take a few seconds.`);
      break;
    }
    if (pid !== null) {
      console.log(`[serve] ${pid ? describe(pid) : 'another process'} took :${PORT} first; stopping this copy.`);
      stop();
      break;
    }
    if (Date.now() > deadline) {
      console.log(`[serve] Still not answering on :${PORT} after ${STARTUP_TIMEOUT_MS / 1000}s; see the output above.`);
      break;
    }
    await sleep(500);
  }

  const code = await exited;
  console.log(`[serve] The dev server stopped (exit ${code}).`);
  return 1;
}

const mode = process.argv[2];
if (mode && mode !== 'serve') {
  console.log('Usage: node scripts/dev-server.mjs [serve]');
  process.exit(2);
}
process.exit(await (mode === 'serve' ? serve() : check()));

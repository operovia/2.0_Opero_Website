# CLAUDE.md

## Start every session with the live dev URL

The user watches changes live in the browser while we work, so do this before anything else:

1. Run `scripts/dev-servers.py`. It checks every dev server declared in `artifacts/*/.replit-artifact/artifact.toml` (running, hot reloading, reachable through the dev URL, API build passing), prints the dev URL, and exits 1 if something needs attention.
2. Fix what it flags. Its messages say what to do:
   - **DOWN** (no process at all): run `scripts/dev-servers.py serve` as a background task (`run_in_background`). Wait until its output shows `[serve] <name> is up` for each server it started, then run the check again. Only ever run one `serve`. The servers it starts stop when the session ends.
   - **NOT ANSWERING** (its dev command is running): it is starting, or restarting after a save. Check again in about 10 seconds. If it stays that way, read the log the message names. Don't run `serve` for it.
   - **Extra copies** of a dev command: stop the extras with the `kill` commands in the message (they aren't serving anything), then tell the user.
   - **NO HOT RELOAD, dev URL FAILS, or MISROUTED:** the Replit workflow is running an old command or config. Claude Code can't restart Replit workflows, so ask the user to restart the workflow the message names from the Workflows pane. If `serve` is running that server, stop the background task first so the port is free.
3. Give the user the dev URL (`https://$REPLIT_DEV_DOMAIN/`) and say which servers are live.

Never suggest the Run button: it starts extra copies of every server next to the running workflows instead of restarting them.

## How each part reloads

- **Website** (`artifacts/opero-site`, served at `/`) and **Canvas** (`artifacts/mockup-sandbox`, at `/__mockup`): Vite hot module replacement. Saved edits appear in the browser without a page reload.
- **API** (`artifacts/api-server`, at `/api` and `/media`): the workflow runs `build.mjs --watch`, which rebuilds on every save and restarts the server within a few seconds. If a build fails, the previous server keeps running, so the dev URL still shows the old behavior. After editing API code, run `scripts/dev-servers.py` before telling the user a change is live: it reports a failing build with its first error. The full log is the newest `.local/state/workflow-logs/*/artifacts_api-server__*` file, or the `serve` task output if `serve` started the API.
- Changes to `artifact.toml`, `build.mjs`, a package.json `dev` script, or environment variables take effect only after that server restarts. Ask the user to restart its workflow, or, if `serve` is running it, stop that background task and start `serve` again. Never both: two copies fight over the port.

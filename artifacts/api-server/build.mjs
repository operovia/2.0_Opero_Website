import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild, context } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { mkdir, rm, writeFile } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

// `pnpm run dev` passes --watch: rebuild on every source change and restart the server
const watch = process.argv.includes("--watch");

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  if (watch) await ensureOnlyCopy(process.env.PORT);
  await rm(distDir, { recursive: true, force: true });

  const options = {
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: distDir,
    outExtension: { ".js": ".mjs" },
    logLevel: "info",
    // Some packages may not be bundleable, so we externalize them, we can add more here as needed.
    // Some of the packages below may not be imported or installed, but we're adding them in case they are in the future.
    // Examples of unbundleable packages:
    // - uses native modules and loads them dynamically (e.g. sharp)
    // - use path traversal to read files (e.g. @google-cloud/secret-manager loads sibling .proto files)
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "@node-rs/argon2",
      "fsevents",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
    sourcemap: "linked",
    plugins: [
      // pino relies on workers to handle logging, instead of externalizing it we use a plugin to handle it
      esbuildPluginPino({ transports: ["pino-pretty"] }),
      ...(watch ? [restartServerAfterBuild(path.join(distDir, "index.mjs"))] : []),
    ],
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  };

  if (watch) {
    const ctx = await context(options);
    await ctx.watch();
  } else {
    await esbuild(options);
  }
}

// A second dev copy (e.g. from the Run button next to a running workflow) would rebuild on every save and fight for the port
async function ensureOnlyCopy(rawPort) {
  if (!rawPort) {
    console.error("[dev] PORT is not set. The API Server workflow sets it; to run by hand use PORT=<port> pnpm run dev");
    process.exit(1);
  }
  // Held for the watcher's lifetime, not just while its server listens. The kernel drops an abstract socket when
  // its process dies, so the lock can't go stale. Retries wait out a copy still shutting down during a workflow restart.
  const lockName = `\0api-server-dev-${createHash("sha1").update(artifactDir).digest("hex").slice(0, 16)}`;
  if (!(await retry(() => holdLock(lockName)))) {
    console.error("[dev] Another copy of the API dev server is already running. Exiting.");
    process.exit(1);
  }
  if (!(await retry(() => portIsFree(Number(rawPort))))) {
    console.error(`[dev] Port ${rawPort} is still in use by another process. Exiting.`);
    process.exit(1);
  }
}

async function retry(check) {
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function holdLock(name) {
  return new Promise((resolve) => {
    const lock = createServer();
    lock.once("error", () => resolve(false));
    lock.listen({ path: name }, () => {
      lock.unref();
      resolve(true);
    });
  });
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
}

// scripts/dev-servers.py reads this to report a failing build, which the dev URL hides by serving the previous one.
// `inputs` (the project files in the build) lets it tell when a save hasn't been rebuilt yet.
async function writeBuildStatus(file, errors, inputs) {
  const messages = errors.map((e) => (e.location ? `${e.location.file}:${e.location.line}: ${e.text}` : e.text));
  const status = { ok: errors.length === 0, at: new Date().toISOString(), errors: messages, inputs };
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(status)}\n`);
}

// A failed build leaves the last good server running, so a half-finished edit doesn't take the API down.
function restartServerAfterBuild(entry) {
  const statusFile = path.join(path.dirname(entry), "dev-build-status.json");
  let server;
  let exited;
  let restarting = false;
  let inputs = [];
  // Stopping the dev process (Ctrl+C, workflow stop) stops the server with it
  process.on("exit", () => server?.kill());
  process.on("SIGINT", () => process.exit(130));
  process.on("SIGTERM", () => process.exit(143));

  return {
    name: "restart-server-after-build",
    setup(build) {
      // On a failed rebuild esbuild deletes the previous output, which a server that is still starting needs.
      // Build in memory instead and write the output only once the build succeeds.
      build.initialOptions.write = false;
      build.initialOptions.metafile = true;
      build.onEnd(async (result) => {
        if (result.errors.length > 0) {
          const serving = server?.exitCode === null && server?.signalCode === null;
          console.error(serving ? "[dev] Build failed, still serving the previous build" : "[dev] Build failed, fix the error and save to start the server");
          const errorFiles = result.errors.flatMap((e) => (e.location ? [path.resolve(e.location.file)] : []));
          await writeBuildStatus(statusFile, result.errors, [...new Set([...inputs, ...errorFiles])]);
          return;
        }
        inputs = Object.keys(result.metafile.inputs)
          .filter((input) => !input.includes("node_modules"))
          .map((input) => path.resolve(input));
        if (server) {
          restarting = true;
          server.kill();
          await exited;
          restarting = false;
        }
        await Promise.all(
          result.outputFiles.map(async (file) => {
            await mkdir(path.dirname(file.path), { recursive: true });
            await writeFile(file.path, file.contents);
          }),
        );
        await writeBuildStatus(statusFile, [], inputs);
        server = spawn(process.execPath, ["--enable-source-maps", entry], { stdio: "inherit" });
        exited = once(server, "exit");
        server.on("exit", (code, signal) => {
          if (!restarting) console.error(`[dev] Server stopped (${signal ?? `exit code ${code}`}), it restarts on the next successful build`);
        });
      });
    },
  };
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

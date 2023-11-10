import { spawn } from "child_process";
import {
  saveState,
  info,
  setFailed,
  debug,
  exportVariable,
} from "@actions/core";
import { resolve } from "path";
import { waitUntilUsed } from "tcp-port-used";
import { existsSync, mkdirSync } from "fs";
import { logDir } from "./constants";
import {
  host,
  readOnlyMode,
  storagePath,
  storageProvider,
  teamId,
  token,
} from "./inputs";
import { getPort } from "./getPort";

async function main() {
  if (!existsSync(logDir)) {
    debug(`Creating log directory: "${logDir}"...`);
    mkdirSync(logDir, { recursive: true });
  }

  const port = await getPort();

  debug(`Export environment variables...`);
  exportVariable("TURBO_API", `${host}:${port}`);
  exportVariable("TURBO_TOKEN", token);
  exportVariable("TURBO_TEAM", teamId);

  debug(`Starting Turbo Cache Server...`);
  const env = {
    ...process.env,
    PORT: port.toString(),
    TURBO_TOKEN: token,
    STORAGE_PROVIDER: storageProvider,
    STORAGE_PATH: storagePath,
    READ_ONLY_MODE: readOnlyMode.toString(),
  };
  console.log({ env });
  const subprocess = spawn("node", [resolve(__dirname, "../server")], {
    detached: true,
    stdio: "inherit",
    env,
  });

  const pid = subprocess.pid?.toString();
  subprocess.unref();

    debug(`Waiting for port ${port} to be used...`);
    await waitUntilUsed(port, 250, 5000);

    info("Spawned Turbo Cache Server:");
    info(`  PID: ${pid}`);
    info(`  Listening on port: ${port}`);
    saveState("pid", subprocess.pid?.toString());
}

main().catch(setFailed);

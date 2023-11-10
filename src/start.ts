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
  process.env.PORT = port.toString();
  process.env.TURBO_TOKEN = token;
  process.env.STORAGE_PROVIDER = storageProvider;
  process.env.STORAGE_PATH = storagePath;
  process.env.READ_ONLY_MODE = readOnlyMode.toString();

  require("server");
}

main().catch(setFailed);

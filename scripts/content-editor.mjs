import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(rootDir, "src", "data");
const backupDir = join(rootDir, ".content-editor-backups");
const host = "127.0.0.1";
const preferredPort = Number(process.env.CONTENT_EDITOR_PORT || 5057);

const pageHtml = await readFile(join(rootDir, "scripts", "content-editor.html"), "utf8");

const sendJson = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
};

const sendText = (res, status, body, contentType = "text/plain; charset=utf-8") => {
  res.writeHead(status, {
    "content-type": contentType,
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
};

const readRequestBody = (req) => new Promise((resolveBody, rejectBody) => {
  const chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
  req.on("error", rejectBody);
});

const listJsonFiles = async () => {
  const entries = await readdir(dataDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));
};

const safeFilePath = async (name) => {
  const fileName = basename(name || "");
  const files = await listJsonFiles();
  if (!files.includes(fileName)) {
    throw new Error("Unknown data file");
  }
  return join(dataDir, fileName);
};

const timestamp = () => new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");

const runBuild = () => new Promise((resolveBuild, rejectBuild) => {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  execFile(npmCommand, ["run", "build"], { cwd: rootDir, timeout: 120_000 }, (error, stdout, stderr) => {
    const log = `${stdout || ""}${stderr || ""}`.trim();
    if (error) {
      rejectBuild(new Error(log || error.message));
      return;
    }
    resolveBuild(log);
  });
});

const requestHandler = async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${host}`);

    if (req.method === "GET" && url.pathname === "/") {
      sendText(res, 200, pageHtml, "text/html; charset=utf-8");
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/files") {
      const files = await Promise.all((await listJsonFiles()).map(async (name) => {
        const content = await readFile(join(dataDir, name), "utf8");
        const parsed = JSON.parse(content);
        return { name, count: Array.isArray(parsed) ? parsed.length : 0 };
      }));
      sendJson(res, 200, { files });
      return;
    }

    if (url.pathname === "/api/data") {
      const file = url.searchParams.get("file") || "";
      const path = await safeFilePath(file);

      if (req.method === "GET") {
        const items = JSON.parse(await readFile(path, "utf8"));
        if (!Array.isArray(items)) throw new Error("Only array JSON files are supported");
        sendJson(res, 200, { file: basename(path), items });
        return;
      }

      if (req.method === "POST") {
        const body = JSON.parse(await readRequestBody(req));
        if (!Array.isArray(body.items)) throw new Error("Request body must include an items array");
        await mkdir(backupDir, { recursive: true });
        const backupName = `${basename(path, ".json")}-${timestamp()}.json`;
        await copyFile(path, join(backupDir, backupName));
        await writeFile(path, `${JSON.stringify(body.items, null, 2)}\n`, "utf8");
        sendJson(res, 200, { ok: true, backup: backupName });
        return;
      }
    }

    if (req.method === "POST" && url.pathname === "/api/build") {
      const log = await runBuild();
      sendJson(res, 200, { ok: true, log });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/src/data/")) {
      const path = await safeFilePath(url.pathname.split("/").pop());
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      createReadStream(path).pipe(res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || String(error) });
  }
};

const listen = (port) => new Promise((resolveListen, rejectListen) => {
  const server = createServer(requestHandler);
  server.once("error", rejectListen);
  server.listen(port, host, () => resolveListen(server));
});

let server;
let port = preferredPort;
for (let attempt = 0; attempt < 20; attempt += 1) {
  try {
    server = await listen(port);
    break;
  } catch (error) {
    if (error.code !== "EADDRINUSE") throw error;
    port += 1;
  }
}

if (!server) {
  throw new Error("Could not start content editor");
}

console.log(`Content editor running at http://${host}:${port}/`);

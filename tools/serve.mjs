// Zero-dependency static server for local preview.
// Run: node site/tools/serve.mjs  (then open http://127.0.0.1:4173/)

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Serves the site folder by default. Set ROOT to serve a different folder,
// for example the reports: $env:ROOT='reports'; node site/tools/serve.mjs
const root = process.env.ROOT
  ? resolve(process.env.ROOT)
  : resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";

    // Only public pages and assets are served. Working files, source tooling
    // and concept drafts must never be reachable, even if one is left inside
    // the site folder by mistake.
    const hiddenSegment = /(^|\/)(_|\.)/;
    const hiddenExtension = /\.(md|mjs|tsv|yml|yaml|json|exe|log)$/i;
    if (hiddenSegment.test(path) || hiddenExtension.test(path)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }

    const target = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ""));
    if (!target.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(target).catch(() => null);
    const file = info && info.isDirectory() ? join(target, "index.html") : target;
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(body);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`CredRoof preview: http://127.0.0.1:${port}/`);
  console.log(`Serving ${root}`);
});

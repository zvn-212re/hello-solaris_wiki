const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = process.cwd();
const port = Number(process.argv[2] || process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const types = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(response, status, body, headers = {}) {
  response.writeHead(status, headers);
  response.end(body);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const file = path.resolve(root, pathname.replace(/^\/+/, ""));

  if (!file.startsWith(root)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      send(response, 404, "Not found", { "content-type": "text/plain; charset=utf-8" });
      return;
    }

    send(response, 200, data, {
      "content-type": types[path.extname(file)] || "application/octet-stream"
    });
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});

import net, { Socket } from "node:net";
import fs from "node:fs";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = process.argv[2] ? Number(process.argv[2]) : 8000;

const ROOT_DIR = path.resolve(process.cwd());

interface ParsedRequest {
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  body: string;
}

interface BuiltResponse {
  raw: Buffer;
  statusCode: number;
  contentLength: number;
}

function requestParser(request: string): ParsedRequest {
  const [headerPart, body = ""] = request.split("\r\n\r\n");
  const lines = headerPart.split("\r\n");

  const [method, pathUrl, version] = lines[0].split(" ");
  const headers: Record<string, string> = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) break;

    const sep = line.indexOf(":");
    if (sep === -1) continue;

    const name = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    headers[name] = value;
  }

  return {
    method,
    path: pathUrl,
    version,
    headers,
    body,
  };
}

function resolveSafePath(urlPath: string): string | null {
  const cleanPath = urlPath.split("?")[0];
  const joined = path.join(ROOT_DIR, cleanPath);
  const normalized = path.normalize(joined);

  // prevent directory traversal
  if (path.relative(ROOT_DIR, normalized).startsWith("..")) {
    return null;
  }

  return normalized;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
    ".ico": "image/x-icon",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

function loadDirectory(dirPath: string, requestPath: string): BuiltResponse {
  try {
    const files = fs.readdirSync(dirPath);

    let html = `
      <html>
        <head><title>Index of ${requestPath}</title></head>
        <body>
          <h1>Directory listing for ${requestPath}</h1>
          <ul>
    `;

    if (requestPath !== "/") {
      const parent = path.dirname(requestPath);
      html += `<li><a href="${parent}">..</a></li>`;
    }

    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      const slash = stat.isDirectory() ? "/" : "";

      html += `<li>
        <a href="${path.join(requestPath, file)}${slash}">
          ${file}${slash}
        </a>
      </li>`;
    }

    html += `</ul></body></html>`;

    return buildResponse(200, "OK", Buffer.from(html), "text/html");
  } catch {
    return buildResponse(
      500,
      "Internal Server Error",
      Buffer.from("Error reading directory"),
      "text/plain",
    );
  }
}

function handleRoute(request: ParsedRequest): BuiltResponse {
  const resolved = resolveSafePath(request.path);

  if (!resolved) {
    return buildResponse(403, "Forbidden", Buffer.from("Access denied"));
  }

  if (!fs.existsSync(resolved)) {
    return buildResponse(404, "Not Found", Buffer.from("Not Found"));
  }

  const stat = fs.statSync(resolved);

  if (stat.isDirectory()) {
    return loadDirectory(resolved, request.path);
  }

  if (stat.isFile()) {
    const fileBuffer = fs.readFileSync(resolved);
    const contentType = getContentType(resolved);

    return buildResponse(200, "OK", fileBuffer, contentType);
  }

  return buildResponse(
    500,
    "Internal Server Error",
    Buffer.from("Unknown resource type"),
  );
}

function buildResponse(
  statusCode: number,
  statusText: string,
  body: Buffer,
  contentType = "text/plain",
): BuiltResponse {
  const headers =
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `Content-Length: ${body.length}\r\n` +
    `Connection: close\r\n` +
    `\r\n`;

  const headerBuffer = Buffer.from(headers);

  return {
    raw: Buffer.concat([headerBuffer, body]),
    statusCode,
    contentLength: body.length,
  };
}

function requestLogger(
  socket: Socket,
  request: ParsedRequest,
  statusCode: number,
  contentLength: number,
  startTime: number,
) {
  const now = new Date().toISOString();
  const duration = Date.now() - startTime;

  console.log(
    `[${now}] ${socket.remoteAddress}:${socket.remotePort} ` +
      `"${request.method} ${request.path} ${request.version}" ` +
      `${statusCode} ${contentLength} - ${duration}ms`,
  );
}

const server = net.createServer((socket: Socket) => {
  socket.on("data", (buffer: Buffer) => {
    const startTime = Date.now();

    const rawRequest = buffer.toString();
    const parsed = requestParser(rawRequest);

    const response = handleRoute(parsed);

    socket.end(response.raw);

    requestLogger(
      socket,
      parsed,
      response.statusCode,
      response.contentLength,
      startTime,
    );
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Serving from: ${ROOT_DIR}`);
});

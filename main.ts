import net, { Socket } from "node:net";
import fs from "fs";
import pathModule from "path";

let PORT: number;

const args = process.argv.slice(2);

const HOST = "127.0.0.1";
args.length > 0 ? (PORT = Number(args[0])) : (PORT = 8000);

interface ParsedRequest {
  method: string;
  path: string;
  version: string;
  headers: Record<string, string>;
  body: string;
}

function requestParser(request: string): ParsedRequest {
  const [headerPart, body = ""] = request.split("\r\n\r\n");
  let lines = headerPart.split("\r\n");

  const [method, path, version] = lines[0].split(" ");
  const headers: Record<string, string> = {};

  let idx = 1;

  while (idx < lines.length && lines[idx] !== "") {
    const line = lines[idx++];
    const seperatorIdx = line.indexOf(":");
    if (seperatorIdx === -1) {
      continue;
    }
    const name = line.slice(0, seperatorIdx);
    const value = line.slice(seperatorIdx + 1);

    headers[name.trim()] = value.trim();
  }

  return {
    method,
    path,
    version,
    headers,
    body,
  };
}

function handleRoute(request: ParsedRequest): string {
  console.log(request);
  return buildResponse(200, "OK", "He3llo");
}

function loadDirectory(dirPath: string): string {}

function requestLogger() {}

function buildResponse(
  statusCode: number,
  statusText: string,
  body: string,
  contentType = "text/plain",
): string {
  return (
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
    `Content-Type: ${contentType}\r\n` +
    `Content-Length: ${Buffer.byteLength(body)}\r\n` +
    "\r\n" +
    body
  );
}

const server = net.createServer((socket: Socket) => {
  socket.on("data", (buffer: Buffer) => {
    const rawRequest = buffer.toString();

    const parsed: ParsedRequest = requestParser(rawRequest);
    const response = handleRoute(parsed);

    socket.write(response);
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});

import { Socket } from "node:net";
import { ParsedRequest } from "./types.js";

export function requestLogger(
  socket: Socket,
  request: ParsedRequest,
  statusCode: number,
  contentLength: number,
  startTime: number,
) {
  const now = new Date().toISOString();
  const duration = Date.now() - startTime;

  const ip = socket.remoteAddress ?? "unknown";
  const port = socket.remotePort ?? 0;

  console.log(
    `[${now}] ` +
      `"${request.method} ${request.path} ${request.version}" ` +
      `${statusCode} ${contentLength} - ${duration}ms`,
  );
}

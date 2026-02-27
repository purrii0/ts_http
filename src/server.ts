import * as net from "node:net";
import { handleRouteAsync } from "./router.js";

const HOST = "127.0.0.1";
const PORT = Number(process.argv[2] ?? "3000");

const server = net.createServer((socket) => {
  let requestBuffer = "";

  socket.on("data", async (chunk) => {
    if (socket.writableEnded) return;

    requestBuffer += chunk.toString();

    while (true) {
      const headerEnd = requestBuffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;

      const fullRequest = requestBuffer.slice(0, headerEnd + 4);
      requestBuffer = requestBuffer.slice(headerEnd + 4);

      try {
        await handleRouteAsync(fullRequest, socket);
      } catch (e) {
        console.error(e);
        if (!socket.writableEnded)
          socket.end("HTTP/1.1 500 Internal Server Error\r\n\r\n");
      }
    }
  });

  socket.on("error", (err: Error & { code?: string }) => {
    if (err.code !== "ECONNRESET") console.error(err);
  });
  socket.on("close", () => {
    requestBuffer = "";
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server started on http://${HOST}:${PORT}`);
});

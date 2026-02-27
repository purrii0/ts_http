import {Socket} from "net";
import * as fsp from "fs/promises";
import * as path from "path";
import {getContentType, resolveSafePath} from "./utils";
import {requestParser} from "./parser";
import {buildResponse} from "./response";
import {requestLogger} from "./logger";
import {getCachedOrRead} from "./cache";

export async function handleRouteAsync(rawRequest: string, socket: Socket) {
    if (socket.writableEnded) return;
    
    const req = requestParser(rawRequest);
    const startTime = Date.now();
    const resolved = resolveSafePath(req.path);

    if(!resolved || !(await exists(resolved))) {
        const resp = buildResponse(resolved ? 403: 404, resolved ? "Forbidden" : "Not Found", Buffer.from("error"));
        socket.end(resp.raw, () => requestLogger(socket, req, resp.statusCode, resp.contentLength, startTime));
        return;
    }

    const stat = await fsp.stat(resolved);

    if(stat.isDirectory()) {
        const files = await fsp.readdir(resolved);
        let html =
            `<html lang="en">` +
            `<head><title>Index of ${req.path}</title><style type="text/css">:root {color-scheme: light dark;}</style></head>` +
            `<body>` +
            `<h1>Directory listing for ${req.path}</h1>` +
            `<hr>` +
            `<ul>`;

        if (req.path !== "/") {
            const parent = path.dirname(req.path);
            html += `<li><a href="${parent}">..</a></li>`;
        }

        const stats = await Promise.all(files.map(async (f) => ({f, stat: await fsp.stat(path.join(resolved, f)) })));
        for(const {f, stat} of stats) {
            const slash = stat.isDirectory() ? "/" : "";
            html += `<li><a href="${path.join(req.path, f)}${slash}">${f}${slash}</a></li>`;
        }
        html += `</ul><hr></body></html>`;
        const resp = buildResponse(200, "OK", Buffer.from(html), "text/html");
        socket.end(resp.raw, () => requestLogger(socket, req, resp.statusCode, resp.contentLength, startTime));
        return;
    }

    const contentType = getContentType(resolved);
    
    const cached = await getCachedOrRead(resolved, contentType);
    if (!cached) {
        const resp = buildResponse(500, "Internal Server Error", Buffer.from("error"));
        socket.end(resp.raw, () => requestLogger(socket, req, resp.statusCode, resp.contentLength, startTime));
        return;
    }

    const headers = `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${cached.size}\r\nConnection: close\r\n\r\n`;
    if(socket.writableEnded) return;
    socket.write(headers);
    socket.end(cached.content, () => requestLogger(socket, req, 200, cached.size, startTime));
}

async function exists(filePath: string){
    try {
        await fsp.access(filePath);
        return true;
    } catch { return false; }
}
import {BuiltResponse} from "./types";

export function buildResponse (statusCode: number, statusText: string, body: Buffer, contentType= "text/plain") :BuiltResponse{
    const headers =
        `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
        `Content-Type: ${contentType}\r\n` +
        `Content-Length: ${body.length}\r\n` +
        `Connection: close\r\n` +
        '\r\n';

    const headerBuffer = Buffer.from(headers);

    return {
        raw: Buffer.concat([headerBuffer, body]),
        statusCode,
        contentLength: body.length
    }
}
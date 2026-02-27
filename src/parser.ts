import {ParsedRequest} from "./types";

export function requestParser(request: string): ParsedRequest {
    let [header, body] = request.split('\r\n\r\n');
    const lines = header.split('\r\n');

    const [method, pathUrl, version] = lines[0].split(' ');
    const headers: Record<string, string> = {};

    for(let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if(!line) break;

        const sep = line.indexOf(':');
        if(sep === -1) continue;

        headers[line.slice(0, sep)] = line.slice(sep + 1).trim();
    }

    return {
        method, path:pathUrl, version, headers, body
    };
}
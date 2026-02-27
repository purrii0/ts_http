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

interface CacheEntry {
    content: Buffer;
    size: number;
    mtime: number;
    contentType: string;
}

export {ParsedRequest, BuiltResponse, CacheEntry};
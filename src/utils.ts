import * as path from "node:path";

const ROOT_DIR = path.resolve(process.cwd());

export function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".ico": "image/x-icon",
    ".jsx": "text/javascript",
    ".tsx": "text/javascript",
    ".ts": "text/javascript",
    ".pdf": "application/pdf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".webp": "image/webp",
    ".xml": "application/xml",
    ".md": "text/markdown",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

export function resolveSafePath(urlPath: string): string | null {
  const cleanPath = urlPath.split("?")[0];
  const joined = path.join(ROOT_DIR, cleanPath);
  const normalized = path.normalize(joined);

  if (path.relative(ROOT_DIR, normalized).startsWith("..")) {
    return null;
  }

  return normalized;
}


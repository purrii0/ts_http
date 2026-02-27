import * as fsp from "fs/promises";
import {CacheEntry} from "./types";

const cache = new Map<string, CacheEntry>();

export function getFromCache(filePath: string): CacheEntry | undefined {
    return cache.get(filePath);
}

export function setCache(filePath: string, content: Buffer, size: number, mtime: number, contentType: string) {
    cache.set(filePath, { content, size, mtime, contentType });
}

export async function getCachedOrRead(filePath: string, contentType: string): Promise<{content: Buffer, size: number, mtime: number, fromCache: boolean} | null> {
    const cached = cache.get(filePath);
    
    if (cached) {
        try {
            const stat = await fsp.stat(filePath);
            if (stat.mtimeMs === cached.mtime) {
                return { content: cached.content, size: cached.size, mtime: cached.mtime, fromCache: true };
            }
        } catch {
            cache.delete(filePath);
        }
    }

    try {
        const content = await fsp.readFile(filePath);
        const stat = await fsp.stat(filePath);
        setCache(filePath, content, stat.size, stat.mtimeMs, contentType);
        return { content, size: stat.size, mtime: stat.mtimeMs, fromCache: false };
    } catch {
        return null;
    }
}

export function clearCache() {
    cache.clear();
}

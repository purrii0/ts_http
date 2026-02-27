# TS HTTP Server – System Improvement Roadmap

## Goal
Turn current static TCP-based HTTP server into a more production-like, non-blocking, system-aware server.

Current State:
- Built using `net`
- Manual HTTP parsing
- Directory listing
- MIME type handling
- Logging
- Directory traversal protection
- Uses blocking fs methods 

---

# Phase 1 — Remove Blocking I/O (HIGH PRIORITY)

## Replace Synchronous FS Calls
- [X] Replace `fs.readFileSync` with `fs.createReadStream`
- [X] Replace `fs.statSync` with `fs.promises.stat`
- [X] Replace `fs.readdirSync` with `fs.promises.readdir`
- [X] Remove all `*Sync` calls

Goal:
- No event-loop blocking
- Handle concurrent requests properly

---

# Phase 2 — Proper File Streaming

- [X] Send headers first
- [X] Pipe `createReadStream()` to socket
- [X] Handle stream errors properly
- [ ] Test with large file (100MB+) to verify memory usage
- [ ] Confirm multiple large downloads work concurrently

Goal:
- No full file loaded into memory
- Efficient large file handling

---

# Phase 3 — Robust TCP Handling

## Handle Partial HTTP Requests
- [ ] Accumulate socket chunks
- [X] Detect `\r\n\r\n` properly
- [X] Parse headers only after full header received
- [ ] Support request body using `Content-Length`

Goal:
- Proper HTTP parsing
- Not assuming single packet arrival

---

# Phase 4 — Improve HTTP Features

- [ ] Add `Last-Modified` header
- [ ] Add `ETag` header
- [ ] Implement basic conditional requests (`If-Modified-Since`)
- [ ] Return `304 Not Modified` when appropriate

Goal:
- Understand HTTP caching behavior

---

# Phase 5 — Simple In-Memory File Cache

- [ ] Implement basic LRU cache
- [ ] Cache small frequently accessed files
- [ ] Add TTL expiration
- [ ] Avoid caching large files

Goal:
- Understand memory vs performance tradeoffs

---

# Phase 6 — Basic Rate Limiting

- [ ] Track requests per IP
- [ ] Implement fixed-window rate limiting
- [ ] Return 429 Too Many Requests when exceeded
- [ ] Add logging for blocked requests

Goal:
- Protect server from abuse

---

# Optional Advanced

- [ ] Support Keep-Alive connections
- [ ] Support multiple requests per socket
- [ ] Add gzip compression
- [ ] Add range requests (partial content)

---

# Testing Checklist

- [ ] Test concurrent requests (50+ using curl or autocannon)
- [ ] Test large file downloads
- [X] Test directory traversal attack (`../`)
- [ ] Test invalid HTTP requests
- [ ] Monitor memory usage

---

# Rules

- Do ONE improvement at a time
- Do not introduce Express
- Do not introduce frameworks
- Keep it system-focused
- Maintain daily LeetCode streak


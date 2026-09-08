# DECISIONS.md - Architecture Decision Records

> Reference before proposing architectural changes.

### Vercel over GitHub Pages
- **Decided:** 2026-02-27
- **Choice:** Deploy on Vercel with serverless proxy
- **Why:** GitHub Pages is static-only (no server-side code). The IPTV server is HTTP-only and the site is HTTPS, so browsers block mixed-content requests. A serverless proxy fetches HTTP URLs server-side. Vercel supports serverless functions with zero config.
- **Rejected:** GitHub Pages + client-side CORS proxy (corsproxy.io) — unreliable for streams, corsproxy.io now requires paid plan

### Vanilla JS (no framework)
- **Decided:** pre-existing
- **Choice:** Plain JavaScript with global objects (`Player`, `Cast`, `Favorites`, `M3UParser`)
- **Why:** Simple app with one page, no routing, no complex state. A framework would add unnecessary build steps and dependencies.
- **Rejected:** React/Next.js — overkill for a single-page media player

### No npm dependencies
- **Decided:** pre-existing
- **Choice:** Zero runtime dependencies. HLS.js loaded from CDN. `package.json` exists only for Vercel config.
- **Why:** Keeps deploys fast, no build step, no node_modules. Node 18+ has built-in `fetch` for the proxy function.
- **Rejected:** Installing HLS.js via npm — would require a bundler

### ESM for serverless function
- **Decided:** 2026-02-27
- **Choice:** `"type": "module"` in package.json, `export default` in proxy.js
- **Why:** Avoids Vercel's ESM-to-CommonJS compilation warning. Native ESM is cleaner.
- **Rejected:** CommonJS (`module.exports`) — triggers build warning

### No auto-load on page start
- **Decided:** 2026-02-27
- **Choice:** Credentials saved in localStorage only pre-fill the login form. User must click Login.
- **Why:** User explicitly requested no automatic credential application. Auto-load was causing confusing 404 errors on page load when credentials were stale or the proxy was unreachable.
- **Rejected:** Auto-login from saved credentials on page load

### Proxy architecture: M3U8 rewriting
- **Decided:** 2026-02-27
- **Choice:** Proxy rewrites URLs inside M3U8 manifests to route back through `/api/proxy`. HLS.js `xhrSetup` also rewrites sub-requests.
- **Why:** HLS streams have nested manifests and segment URLs. Safari native HLS can't use `xhrSetup`, so server-side rewriting is needed. Belt-and-suspenders: both server-side rewriting and client-side `xhrSetup` to cover all playback paths.
- **Rejected:** Client-side-only rewriting — doesn't work for Safari native HLS

### IPTV server IP blocking (unresolved)
- **Decided:** 2026-02-27 (under investigation)
- **Choice:** Pending — Cloudflare Worker proxy is proposed
- **Why:** IPTV server (`47174643.tvway.pro`) blocks AWS datacenter IPs. Vercel runs on AWS. corsproxy.io now requires paid plan. Cloudflare Worker IPs are CDN IPs that IPTV servers typically don't block.
- **Rejected:** Forwarding client IP via `X-Forwarded-For` (server ignores headers, checks connection IP). Multiple free CORS proxies (all dead/blocked/unreliable).

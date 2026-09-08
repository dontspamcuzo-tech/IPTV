# CONTEXT.md - IPTV

> **Root Context:** /Users/cuzo/Projects/CONTEXT.md
> **Cross-project tools:** Aris (automation), NUC (crons), Late API (social), Resend (email)
> **Rule:** Project-specific work stays here. Cross-project coordination lives in root CONTEXT.md.

## Current State
| Key | Value |
|-----|-------|
| **Status** | Blocked — proxy IP issue |
| **Branch** | `main` |
| **Deployed** | https://iptv-player-six.vercel.app |
| **Last Update** | 2026-02-27 |

## Recent Changes & Decisions
- Deployed IPTV player to Vercel with a serverless proxy at `/api/proxy`
- Proxy fetches HTTP IPTV URLs server-side so the HTTPS frontend avoids mixed-content blocks
- Proxy rewrites M3U8 manifests and streams binary .ts segments
- Removed `autoLoadPlaylist()` — credentials only pre-fill the login form, never auto-login
- Removed `config.js` script tags from `index.html` (localStorage handles saved credentials)
- Removed duplicate `IPTV/` subdirectory
- Attempted corsproxy.io fallback — corsproxy.io now requires a paid plan (returns 403)
- Attempted forwarding client IP via `X-Forwarded-For` — IPTV server checks connection IP, not headers

## Blocker: IPTV Server Blocks Datacenter IPs
The IPTV server (`http://47174643.tvway.pro`) rejects requests from cloud/datacenter IPs:
- Vercel proxy runs on AWS (`54.226.72.41`) → server returns **404**
- corsproxy.io → now returns **403** (paid plan required)
- allorigins.win → returns **520**
- Server does NOT support HTTPS (connection times out)
- Server ignores `X-Forwarded-For` / `X-Real-IP` headers

**Proposed fix:** Deploy a Cloudflare Worker as the proxy. Cloudflare's CDN IPs are typically not blocked by IPTV servers. Free tier: 100k requests/day.

## Architecture
```
Browser (HTTPS)
  ├─ Static files: Vercel (index.html, js/, css/)
  ├─ API/playlist fetch: needs non-AWS proxy (Cloudflare Worker?)
  └─ HLS streams: /api/proxy on Vercel (stream servers may have different IP rules)
```

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Single-page app shell |
| `js/app.js` | Main controller — login, playlist loading, channel list |
| `js/player.js` | HLS.js video player with proxy URL rewriting |
| `js/parser.js` | M3U/M3U8 playlist parser |
| `js/favorites.js` | Favorites stored in localStorage |
| `js/cast.js` | AirPlay + Chromecast support |
| `api/proxy.js` | Vercel serverless proxy — fetches HTTP URLs, rewrites M3U8 manifests |
| `vercel.json` | Proxy function config (30s timeout) + CORS headers |

## Next Steps
1. **Deploy Cloudflare Worker proxy** — resolve the IP blocking issue
   - User needs Cloudflare account + `npx wrangler` setup
   - Worker does the same as `/api/proxy` but from Cloudflare IPs
   - Update `proxyFetch()` in `app.js` to use the Worker URL
2. **Test full flow** — login → playlist loads → channel plays → HLS streams
3. **Clean up debug code** — remove leftover `console.log` in proxy, extra headers
4. **Consider custom domain** for the Vercel deployment

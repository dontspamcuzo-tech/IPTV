# CLAUDE.md - IPTV Player

## Overview
Web-based IPTV player for streaming live TV from M3U/M3U8 playlists via Xtream Codes servers. Deployed on Vercel with a serverless proxy for mixed-content (HTTPS→HTTP) requests.

## Stack
| Layer | Choice |
|-------|--------|
| Frontend | Vanilla JS (no framework, no build step) |
| Styling | Custom CSS with CSS variables (dark theme) |
| Video | HLS.js for HLS streams, native `<video>` fallback |
| Casting | Chromecast + AirPlay |
| Hosting | Vercel (static files + serverless function) |
| Proxy | `/api/proxy.js` — Vercel serverless function |

**No TypeScript. No bundler. No npm dependencies.** The `package.json` exists only for Vercel deployment config (`"type": "module"`).

## Project Structure
```
├── index.html          # Single-page app (all HTML)
├── css/style.css       # All styles, CSS variables for theming
├── js/
│   ├── app.js          # Main controller — init, events, login, playlist loading
│   ├── player.js       # Video player (HLS.js + native), proxy URL rewriting
│   ├── parser.js       # M3U/M3U8 playlist parser → channel objects
│   ├── favorites.js    # Favorites in localStorage
│   └── cast.js         # Chromecast + AirPlay
├── api/
│   └── proxy.js        # Vercel serverless proxy (ESM, Node 24)
├── vercel.json         # Function config + CORS headers
├── package.json        # Minimal — no dependencies
├── config.example.js   # Example Xtream credentials (gitignored: config.js)
└── sample/             # Sample M3U playlist for testing
```

## Conventions
- `.js` files, no TypeScript
- No semicolons
- Global objects: `Player`, `Cast`, `Favorites`, `M3UParser` (plain objects, not classes)
- `app.js` wraps everything in an IIFE to avoid polluting global scope
- `$()` is a local alias for `document.getElementById()` (not jQuery)
- Proxy function uses ESM (`export default`)

## Key Patterns

### Proxy flow (mixed-content)
The IPTV server is HTTP-only. The Vercel site is HTTPS. Browser blocks mixed content.
- `proxyFetch(url)` in `app.js` — for API/playlist requests
- `Player._proxyUrl(url)` in `player.js` — for HLS stream URLs
- Both route through `/api/proxy?url=<encoded>` when on HTTPS
- The proxy rewrites M3U8 manifest URLs to also go through `/api/proxy`
- HLS.js `xhrSetup` rewrites sub-requests (segments, sub-manifests)

### Data flow
1. User logs in with Xtream credentials (server, username, password)
2. `loadFromXtream()` fetches M3U playlist via proxy
3. `M3UParser.parse()` extracts channel objects (name, url, logo, group, id)
4. Channels rendered in sidebar with search/filter/favorites
5. Click channel → `Player.play()` → HLS.js or native `<video>`

### localStorage keys
- `iptv_xtream` — saved Xtream credentials (server, username, password)
- `iptv_favorites` — array of favorite channel IDs

## Context Files
- **[CONTEXT.md](./CONTEXT.md)** — Current session state, blockers, next steps
- **[PLAYBOOK.md](./PLAYBOOK.md)** — Repeatable procedures
- **[DECISIONS.md](./DECISIONS.md)** — Architecture decision records

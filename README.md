# IPTV Player

A modern, web-based IPTV player for streaming live TV channels from M3U/M3U8 playlists.

## Features

- **M3U/M3U8 Playlist Support** — Load playlists from URL or local file
- **HLS Streaming** — Powered by HLS.js with automatic error recovery
- **4K Video Support** — Optimized buffer and quality selection for 4K/UHD streams
- **Auto-Load Playlist** — Configure your IPTV provider in `config.js` for instant startup
- **Channel Browser** — Searchable, filterable channel list with category grouping
- **Favorites** — Save your favorite channels (persisted in localStorage)
- **Picture-in-Picture** — Watch in a floating window while you work
- **Keyboard Shortcuts** — `/` to search, `Esc` to close modals
- **Responsive Design** — Works on desktop and mobile
- **No Backend Required** — Runs entirely in the browser

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/dontspamcuzo-tech/IPTV.git
   cd IPTV
   ```

2. Open `index.html` in your browser, or serve it locally:
   ```bash
   # Python
   python -m http.server 8080

   # Node.js
   npx serve .
   ```

3. (Optional) Set up your IPTV provider for auto-loading:
   ```bash
   cp config.example.js config.js
   # Edit config.js with your server, username, and password
   ```

4. Load a playlist:
   - Click **Load M3U Playlist**
   - Enter a URL to an M3U/M3U8 playlist, or upload a local file
   - A sample playlist is included at `sample/playlist.m3u`

## Project Structure

```
IPTV/
├── index.html              # Main HTML page
├── config.example.js       # Config template (copy to config.js)
├── config.js               # Your credentials (gitignored)
├── css/
│   └── style.css           # Styles (dark theme)
├── js/
│   ├── app.js              # Main application controller
│   ├── parser.js           # M3U/M3U8 playlist parser
│   ├── player.js           # Video player (HLS.js + 4K support)
│   └── favorites.js        # Favorites manager (localStorage)
├── sample/
│   └── playlist.m3u        # Sample playlist with free streams
└── README.md
```

## Keyboard Shortcuts

| Key   | Action              |
|-------|---------------------|
| `/`   | Focus search bar    |
| `Esc` | Close modal / blur  |

## Tech Stack

- **HLS.js** — HTTP Live Streaming playback
- **Vanilla JS** — No frameworks, no build step
- **CSS Custom Properties** — Themeable dark UI

## License

MIT

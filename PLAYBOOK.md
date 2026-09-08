# PLAYBOOK.md - Repeatable Task Procedures

> Reference before executing any repeatable task.

## Deployment

### Deploy to Vercel
**When to use:** After pushing changes to `main` branch.

**Steps:**
1. Git integration is connected — pushing to `main` auto-deploys
2. `git push` triggers build + deploy automatically

**Verify:**
- Check deployment status: `vercel ls` or Vercel dashboard
- Visit https://iptv-player-six.vercel.app
- Check runtime logs: use Vercel MCP `get_runtime_logs` tool

### Manual Deploy (CLI)
**When to use:** Deploy local changes without pushing to GitHub.

**Steps:**
1. `vercel deploy --prod` from project root

**Verify:**
- CLI prints production URL when complete

## Debugging

### Check Proxy Logs
**When to use:** Proxy requests failing or returning unexpected status codes.

**Steps:**
1. Use Vercel MCP tool: `get_runtime_logs` with `projectId: prj_TwhnQITH6gNbKD1DuoU4VKLWVg3Q`, `teamId: team_EVwZrZMQM1xsEd195ODt7T8j`
2. Filter by `statusCode: "404"` or `level: ["error"]` for issues
3. To add temporary logging, edit `api/proxy.js` and push

**Note:** MCP log messages are truncated. For full output, use `vercel inspect <deployment-id>` or add `console.log` to the proxy.

### Test Proxy Directly
**When to use:** Verify the proxy function works independently of the frontend.

**Steps:**
1. No URL param (expect 400): `curl -s "https://iptv-player-six.vercel.app/api/proxy"`
2. With URL (expect 200): `curl -s "https://iptv-player-six.vercel.app/api/proxy?url=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("http://httpbin.org/get", safe=""))')"`
3. Check proxy IP: proxy `http://httpbin.org/ip` — currently returns AWS IP `54.226.x.x`

### Check Deployed Code
**When to use:** Verify the latest deployment has your changes (CDN caching, stale builds).

**Steps:**
1. Fetch deployed JS: use Vercel MCP `web_fetch_vercel_url` with the file URL
2. Or: `curl -s https://iptv-player-six.vercel.app/js/app.js | head -20`
3. Compare to local file

## Project Config

### Vercel Project Info
| Key | Value |
|-----|-------|
| Project ID | `prj_TwhnQITH6gNbKD1DuoU4VKLWVg3Q` |
| Team ID | `team_EVwZrZMQM1xsEd195ODt7T8j` |
| Production domains | `iptv-player-six.vercel.app`, `iptv-player-cuzos-projects.vercel.app` |
| GitHub repo | `dontspamcuzo-tech/IPTV` |
| Git integration | Connected — push to `main` auto-deploys |

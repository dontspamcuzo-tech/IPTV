/**
 * Serverless proxy for mixed-content IPTV requests.
 * Fetches HTTP URLs server-side so the HTTPS frontend avoids browser blocks.
 *
 * Usage: GET /api/proxy?url=<encoded_url>
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const targetUrl = req.query.url
  if (!targetUrl) {
    res.status(400).json({ error: 'Missing ?url= parameter' })
    return
  }

  try {
    // Forward relevant client headers so upstream servers don't reject us
    const forwardHeaders = {}
    const passthrough = ['user-agent', 'accept', 'accept-language', 'range']
    for (const key of passthrough) {
      if (req.headers[key]) forwardHeaders[key] = req.headers[key]
    }
    if (!forwardHeaders['user-agent']) {
      forwardHeaders['user-agent'] = 'IPTV-Proxy/1.0'
    }

    const upstream = await fetch(targetUrl, {
      headers: forwardHeaders,
      redirect: 'follow',
    })

    console.log(`Proxy: ${upstream.status} ${targetUrl.substring(0, 120)}`)
    if (!upstream.ok) {
      res.status(upstream.status).end(`Upstream error: ${upstream.status}`)
      return
    }

    const contentType = upstream.headers.get('content-type') || ''

    // M3U8 manifests: rewrite internal HTTP URLs to go through this proxy
    if (contentType.includes('mpegurl') || targetUrl.match(/\.m3u8?(\?|$)/i)) {
      let body = await upstream.text()
      body = rewriteManifest(body, targetUrl, req)
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
      res.status(200).send(body)
      return
    }

    // Binary streams (.ts segments, etc): pipe through
    const buffer = Buffer.from(await upstream.arrayBuffer())
    if (contentType) {
      res.setHeader('Content-Type', contentType)
    }
    res.status(200).send(buffer)
  } catch (err) {
    res.status(502).json({ error: 'Proxy fetch failed', detail: err.message })
  }
}

/**
 * Rewrite URLs inside an M3U8 manifest so relative and absolute HTTP URLs
 * route back through /api/proxy.
 */
function rewriteManifest(body, manifestUrl, req) {
  const base = new URL(manifestUrl)
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proxyBase = `${proto}://${host}/api/proxy?url=`

  return body.split('\n').map(line => {
    const trimmed = line.trim()

    // Skip comments/tags (but process URI= attributes inside tags)
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/URI="([^"]+)"/gi, (match, uri) => {
        const absolute = resolveUrl(uri, base)
        return `URI="${proxyBase}${encodeURIComponent(absolute)}"`
      })
    }

    // Skip empty lines
    if (!trimmed) return line

    // This is a URL line — resolve and proxy it
    const absolute = resolveUrl(trimmed, base)
    return `${proxyBase}${encodeURIComponent(absolute)}`
  }).join('\n')
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
function resolveUrl(url, base) {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return new URL(url, base).href
}

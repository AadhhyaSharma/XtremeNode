/**
 * XtremeNode Proxy Server
 * 
 * Serves on port 8000 and:
 *   - Proxies all traffic to the main XtremeNode app (port 47990 by default)
 *   - /webrtc → replaced with /webrtc-embed (no headers UI)
 *   - Injects a no-header CSS override so headers are stripped visually
 */

const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const url = require('url');

const PROXY_PORT = process.env.XTREMENODE_PROXY_PORT || 8000;
const UPSTREAM_HOST = process.env.XTREMENODE_HOST || 'localhost';
const UPSTREAM_PORT = process.env.XTREMENODE_PORT || 47990;
const UPSTREAM_HTTPS = process.env.XTREMENODE_HTTPS === '1';
const UPSTREAM = `${UPSTREAM_HTTPS ? 'https' : 'http'}://${UPSTREAM_HOST}:${UPSTREAM_PORT}`;

console.log(`[XtremeNode Proxy] Starting on port ${PROXY_PORT}`);
console.log(`[XtremeNode Proxy] Upstream: ${UPSTREAM}`);

const proxy = httpProxy.createProxyServer({
  target: UPSTREAM,
  secure: false,          // Allow self-signed certs from upstream
  ws: true,               // WebSocket support (for WebRTC signaling)
  changeOrigin: true,
});

proxy.on('error', (err, req, res) => {
  console.error('[XtremeNode Proxy] Error:', err.message);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`XtremeNode Proxy Error: ${err.message}\n\nIs XtremeNode running on port ${UPSTREAM_PORT}?`);
  }
});

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let targetPath = parsed.pathname;

  // /webrtc → /webrtc-embed (headerless version)
  if (targetPath === '/webrtc' || targetPath === '/webrtc/') {
    const qs = parsed.search || '';
    req.url = '/webrtc-embed' + qs;
  }

  proxy.web(req, res, {});
});

// WebSocket proxy (needed for WebRTC signaling)
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[XtremeNode Proxy] Listening on http://0.0.0.0:${PROXY_PORT}`);
  console.log(`[XtremeNode Proxy] /webrtc is served WITHOUT headers`);
});

process.on('SIGINT', () => { server.close(); process.exit(0); });
process.on('SIGTERM', () => { server.close(); process.exit(0); });

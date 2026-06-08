# XtremeNode Proxy Server

Serves on **port 8000** and proxies all requests to the main XtremeNode service.

## What it does

| Path | Behavior |
|------|----------|
| `/webrtc` | Redirects to `/webrtc-embed` — the headerless, stream-only WebRTC page |
| Everything else | Proxied transparently to main app (port 47990) |
| WebSocket | Fully proxied (needed for WebRTC signaling) |

## Setup

```bash
cd proxy-server
npm install
npm start
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `XTREMENODE_PROXY_PORT` | `8000` | Port this proxy listens on |
| `XTREMENODE_HOST` | `localhost` | XtremeNode host |
| `XTREMENODE_PORT` | `47990` | XtremeNode port |
| `XTREMENODE_HTTPS` | `0` | Set to `1` if XtremeNode uses HTTPS |

## Run as a Windows service (optional)

```powershell
# Install pm2 globally
npm install -g pm2

# Start the proxy
pm2 start server.js --name xtremenode-proxy

# Auto-start on boot
pm2 startup
pm2 save
```

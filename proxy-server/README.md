# XtremeNode — Independent Stream Server (port 8000)

A **completely standalone** WebRTC stream server. No dependency on the Sunshine Vue UI.  
Open `http://host:8000/?key=YOUR_KEY` from any browser — anywhere in the world.

## Quick start

```powershell
cd "C:\Program Files\XtremeNode\proxy-server"
node server.js --add-key "alice"
# → Key: abc123...
# → URL: http://YOUR_HOST:8000/?key=abc123...

node server.js
# Server starts on port 8000
```

## Key management

| Command | Description |
|---|---|
| `node server.js --add-key "name"` | Generate a new key for a person |
| `node server.js --list-keys` | Show all active keys |
| `node server.js --remove-key "name"` | Revoke a key |

## How keys work

- Keys are stored in `keys.json` next to `server.js`
- Pass a key in the URL: `http://host:8000/?key=YOUR_KEY`
- Or via header: `X-Stream-Key: YOUR_KEY`
- No keys configured = **open access** (useful for LAN-only setups)

## Share with anyone

Send the URL `http://YOUR_PUBLIC_IP:8000/?key=YOUR_KEY` to anyone — they open it  
in Chrome/Edge/Firefox and the stream loads instantly, no install needed.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `XTREMENODE_PROXY_PORT` | `8000` | Port this server listens on |
| `XTREMENODE_HOST` | `127.0.0.1` | Sunshine host |
| `XTREMENODE_PORT` | `47990` | Sunshine port |
| `XTREMENODE_HTTPS` | `0` | Set to `1` if Sunshine uses HTTPS |

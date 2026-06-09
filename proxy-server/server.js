/**
 * XtremeNode — Independent WebRTC Stream Server (port 8000)
 *
 * Features:
 *  - No authentication — page is open to anyone who can reach port 8000
 *  - Self-contained streaming UI at http://host:8000/
 *  - Proxies /api/webrtc/* and /api/apps to Sunshine backend (port 47990)
 *  - No dependency on the main Sunshine Vue UI
 */

'use strict';

const http   = require('http');
const https  = require('https');
const url    = require('url');

const PROXY_PORT     = parseInt(process.env.XTREMENODE_PROXY_PORT || '8000', 10);
const UPSTREAM_HOST  = process.env.XTREMENODE_HOST  || '127.0.0.1';
const UPSTREAM_PORT  = parseInt(process.env.XTREMENODE_PORT || '47990', 10);
const UPSTREAM_HTTPS = process.env.XTREMENODE_HTTPS === '1';

// ── Proxy to Sunshine ────────────────────────────────────────────────────────

function proxyToSunshine(req, res) {
  const opts = {
    hostname: UPSTREAM_HOST,
    port: UPSTREAM_PORT,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers, { host: UPSTREAM_HOST + ':' + UPSTREAM_PORT }),
    rejectUnauthorized: false,
  };
  const transport = UPSTREAM_HTTPS ? https : http;
  const pr = transport.request(opts, function(pres) {
    res.writeHead(pres.statusCode, Object.assign({}, pres.headers, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With',
    }));
    pres.pipe(res, { end: true });
  });
  pr.on('error', function(err) {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Cannot reach Sunshine on port ' + UPSTREAM_PORT + ': ' + err.message }));
    }
  });
  req.pipe(pr, { end: true });
}

// ── Stream UI ────────────────────────────────────────────────────────────────

function serveUI(res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>XtremeNode Stream</title><style>' +
'*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html,body{width:100%;height:100%;background:#07070f;color:#e0e0e0;font-family:system-ui,sans-serif;overflow:hidden}' +
'#setup{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:linear-gradient(135deg,#0d0d1a,#080f20);transition:opacity .35s;z-index:10}' +
'#setup.gone{opacity:0;pointer-events:none}.logo{font-size:1.7rem;font-weight:800;letter-spacing:.06em;color:#4f8ef7}.logo span{color:#a78bfa}.tag{font-size:.75rem;color:#555;letter-spacing:.08em;text-transform:uppercase}' +
'.card{background:#111126;border:1px solid #1e1e38;border-radius:12px;padding:22px 28px;width:320px;display:flex;flex-direction:column;gap:14px}label{font-size:.8rem;color:#7a8a9a;display:block;margin-bottom:4px}' +
'select{width:100%;padding:9px 12px;border-radius:7px;border:1px solid #222240;background:#0d0d20;color:#ddd;font-size:.9rem;outline:none}select:focus{border-color:#4f8ef7}' +
'.row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.btn{padding:11px;border-radius:8px;border:none;font-size:.95rem;font-weight:700;cursor:pointer;transition:background .2s}' +
'.btn.primary{background:#4f8ef7;color:#fff}.btn.primary:hover{background:#3a7be0}.btn.primary:disabled{background:#1e2a40;color:#4a5a7a;cursor:not-allowed}' +
'#status{font-size:.82rem;text-align:center;padding:7px 14px;border-radius:20px;background:#10101e;border:1px solid #1e1e38}#status.ok{border-color:#22c55e;color:#22c55e}#status.err{border-color:#ef4444;color:#ef4444}' +
'#surface{position:fixed;inset:0;background:#000;z-index:1;display:none;align-items:center;justify-content:center}#surface.on{display:flex}' +
'video{width:100%;height:100%;object-fit:contain;display:block}' +
'#hud{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);backdrop-filter:blur(8px);border-radius:20px;padding:5px 18px;font-size:.75rem;color:#aaa;z-index:20;display:flex;gap:16px;align-items:center;opacity:0;transition:opacity .3s;pointer-events:none}' +
'#stop-btn{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:9px 26px;border-radius:8px;background:rgba(239,68,68,.85);color:#fff;border:none;font-size:.85rem;font-weight:600;cursor:pointer;z-index:20;opacity:0;transition:opacity .3s;pointer-events:none}' +
'body.hud-on #hud,body.hud-on #stop-btn{opacity:1;pointer-events:all}' +
'</style></head><body>' +
'<div id="setup"><div class="logo">Xtreme<span>Node</span></div><div class="tag">Independent Stream &middot; Port 8000</div>' +
'<div class="card"><div><label>Application</label><select id="app-sel"><option value="">Loading&hellip;</option></select></div>' +
'<div class="row2"><div><label>Resolution</label><select id="res-sel"><option value="1920x1080">1080p</option><option value="2560x1440">1440p</option><option value="3840x2160">4K</option><option value="1280x720">720p</option></select></div>' +
'<div><label>FPS</label><select id="fps-sel"><option value="60">60</option><option value="120">120</option><option value="30">30</option></select></div></div>' +
'<div><label>Codec</label><select id="codec-sel"><option value="h264">H.264</option><option value="hevc">H.265 / HEVC</option><option value="av1">AV1</option></select></div>' +
'<button class="btn primary" id="start-btn" disabled>&#9654; Start Stream</button><div id="status">Connecting&hellip;</div></div></div>' +
'<div id="surface"><video id="vid" autoplay playsinline muted></video><audio id="aud" autoplay style="display:none"></audio></div>' +
'<div id="hud"><span id="h-res">&ndash;</span><span id="h-fps">&ndash; fps</span><span id="h-codec">&ndash;</span><span id="h-bw">&ndash;</span></div>' +
'<button id="stop-btn" onclick="disconnect()">&#9209; Disconnect</button>' +
'<script>' +
'function apiFetch(p,m,b){return fetch(p,{method:m||"GET",headers:{"Content-Type":"application/json","X-Requested-With":"XMLHttpRequest"},body:b!=null?JSON.stringify(b):undefined}).then(function(r){return r.json().catch(function(){return{};})});}' +
'var sessionId=null,pc=null,cancelIce=null,statsTimer=null,prevBytes=0;' +
'function setStatus(msg,cls){var el=document.getElementById("status");el.textContent=msg;el.className=cls||"";}' +
'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}' +
'async function loadApps(){try{var r=await fetch("/api/apps",{headers:{"X-Requested-With":"XMLHttpRequest"}});if(!r.ok)throw new Error("HTTP "+r.status);var data=await r.json();var apps=Array.isArray(data)?data:(data.apps||[]);var sel=document.getElementById("app-sel");sel.innerHTML="<option value=\"\">-- Select application --</option>";apps.forEach(function(a){var o=document.createElement("option");o.value=a.uuid||a.id||"";o.textContent=a.title||a.name||o.value;sel.appendChild(o);});setStatus("Ready - "+apps.length+" app(s)","ok");document.getElementById("start-btn").disabled=false;}catch(e){setStatus("Cannot reach XtremeNode: "+e.message,"err");setTimeout(loadApps,3500);}}' +
'document.getElementById("start-btn").addEventListener("click",startStream);' +
'async function startStream(){document.getElementById("start-btn").disabled=true;setStatus("Creating session...");var wh=document.getElementById("res-sel").value.split("x");var w=Number(wh[0]),h=Number(wh[1]);var fps=Number(document.getElementById("fps-sel").value);var codec=document.getElementById("codec-sel").value;var appId=document.getElementById("app-sel").value||undefined;var sess=await apiFetch("/api/webrtc/sessions","POST",{audio:true,video:true,encoded:true,width:w,height:h,fps:fps,bitrate_kbps:10000,codec:codec,app_id:appId});if(!sess||!sess.session||!sess.session.id){setStatus("Session failed: "+JSON.stringify(sess),"err");document.getElementById("start-btn").disabled=false;return;}sessionId=sess.session.id;var iceServers=sess.ice_servers&&sess.ice_servers.length?sess.ice_servers:[{urls:"stun:stun.l.google.com:19302"}];pc=new RTCPeerConnection({iceServers:iceServers,bundlePolicy:"max-bundle",rtcpMuxPolicy:"require"});pc.ontrack=function(e){document.getElementById("surface").classList.add("on");document.getElementById("setup").classList.add("gone");flashHud();var el=e.track.kind==="video"?document.getElementById("vid"):document.getElementById("aud");el.srcObject=e.streams[0]||new MediaStream([e.track]);};pc.onicecandidate=async function(e){if(!e.candidate)return;await apiFetch("/api/webrtc/sessions/"+sessionId+"/ice","POST",{candidates:[{candidate:e.candidate.candidate,sdpMid:e.candidate.sdpMid,sdpMLineIndex:e.candidate.sdpMLineIndex}]});};pc.onconnectionstatechange=function(){if(pc.connectionState==="connected"){setStatus("Streaming","ok");startStats();}if(["failed","disconnected","closed"].includes(pc.connectionState))disconnect();};cancelIce=subscribeIce(sessionId,function(c){pc.addIceCandidate(new RTCIceCandidate(c)).catch(function(){});});setStatus("Negotiating...");var offer=await pc.createOffer();await pc.setLocalDescription(offer);var ans=await apiFetch("/api/webrtc/sessions/"+sessionId+"/offer","POST",{type:offer.type,sdp:offer.sdp});if(!ans||!ans.sdp)ans=await pollAnswer(sessionId);if(!ans||!ans.sdp){setStatus("No SDP answer","err");return;}await pc.setRemoteDescription(new RTCSessionDescription({type:ans.type||"answer",sdp:ans.sdp}));}' +
'async function pollAnswer(sid){var t=Date.now();while(Date.now()-t<30000){await sleep(800);var r=await apiFetch("/api/webrtc/sessions/"+sid+"/answer");if(r&&r.sdp)return r;}return null;}' +
'function subscribeIce(sid,onC){var stopped=false,last=0,timer,es=null;try{es=new EventSource("/api/webrtc/sessions/"+sid+"/ice/stream?since=0");es.addEventListener("candidate",function(ev){try{var c=JSON.parse(ev.data);onC(c);if(ev.lastEventId)last=Math.max(last,Number(ev.lastEventId));}catch(e){}});es.onerror=function(){if(es){es.close();es=null;}poll();};}catch(e){poll();}async function poll(){if(stopped)return;try{var r=await apiFetch("/api/webrtc/sessions/"+sid+"/ice?since="+last);(r&&r.candidates||[]).forEach(function(c){onC(c);if(c.index!=null)last=Math.max(last,c.index);});if(r&&r.next_since!=null)last=Math.max(last,r.next_since);}catch(e){}if(!stopped)timer=setTimeout(poll,1000);}return function(){stopped=true;clearTimeout(timer);if(es)es.close();};}' +
'async function disconnect(){if(cancelIce){cancelIce();cancelIce=null;}if(statsTimer){clearInterval(statsTimer);statsTimer=null;prevBytes=0;}if(sessionId){await apiFetch("/api/webrtc/sessions/"+sessionId,"DELETE").catch(function(){});sessionId=null;}if(pc){pc.close();pc=null;}document.getElementById("vid").srcObject=null;document.getElementById("aud").srcObject=null;document.getElementById("surface").classList.remove("on");document.getElementById("setup").classList.remove("gone");document.getElementById("start-btn").disabled=false;setStatus("Disconnected");}' +
'function startStats(){statsTimer=setInterval(async function(){if(!pc)return;var stats=await pc.getStats();stats.forEach(function(s){if(s.type==="inbound-rtp"&&s.kind==="video"){if(s.frameWidth)document.getElementById("h-res").textContent=s.frameWidth+"x"+s.frameHeight;document.getElementById("h-fps").textContent=(s.framesPerSecond||0).toFixed(0)+" fps";var bps=((s.bytesReceived-prevBytes)*8/1000).toFixed(0);document.getElementById("h-bw").textContent=bps+" kbps";prevBytes=s.bytesReceived;if(s.codecId){var c=stats.get(s.codecId);if(c)document.getElementById("h-codec").textContent=c.mimeType?c.mimeType.replace("video/",""):"--";}}});},1000);}' +
'var hudTimer;function flashHud(){document.body.classList.add("hud-on");clearTimeout(hudTimer);hudTimer=setTimeout(function(){document.body.classList.remove("hud-on");},3000);}document.addEventListener("mousemove",flashHud);document.addEventListener("touchstart",flashHud);' +
'loadApps();' +
'<\/script></body></html>');
}

// ── Server ───────────────────────────────────────────────────────────────────

var server = http.createServer(function(req, res) {
  var parsed  = url.parse(req.url, true);
  var reqPath = parsed.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With',
    });
    res.end();
    return;
  }

  // Proxy API calls straight through — no auth check
  if (reqPath.startsWith('/api/')) {
    proxyToSunshine(req, res);
    return;
  }

  // Serve the stream UI for any root-ish path
  if (reqPath === '/' || reqPath === '/webrtc' || reqPath === '/stream') {
    serveUI(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PROXY_PORT, '0.0.0.0', function() {
  console.log('\n[XtremeNode] Stream server ready');
  console.log('  URL     : http://0.0.0.0:' + PROXY_PORT + '/');
  console.log('  Upstream: ' + (UPSTREAM_HTTPS ? 'https' : 'http') + '://' + UPSTREAM_HOST + ':' + UPSTREAM_PORT);
  console.log('  Auth    : NONE (open access)');
  console.log('');
});

process.on('SIGINT',  function() { server.close(); process.exit(0); });
process.on('SIGTERM', function() { server.close(); process.exit(0); });

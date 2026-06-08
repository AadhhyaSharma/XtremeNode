<template>
  <div class="tunnel-page">
    <div class="tunnel-header">
      <h1><i class="fas fa-network-wired"></i> Public Access — Make Port 8000 Reachable</h1>
      <p class="subtitle">
        Expose your local XtremeNode WebRTC stream to the internet using one of the methods below.
        No cloud account needed for most options.
      </p>
    </div>

    <!-- Status Card -->
    <div class="status-card" :class="tunnelStatus">
      <div class="status-icon">
        <i :class="statusIcon"></i>
      </div>
      <div class="status-info">
        <p class="status-label">{{ statusLabel }}</p>
        <p v-if="publicUrl" class="public-url">
          <a :href="publicUrl" target="_blank" rel="noopener">{{ publicUrl }}</a>
          <button class="copy-btn" @click="copyUrl(publicUrl)">
            <i class="fas fa-copy"></i>
          </button>
        </p>
      </div>
    </div>

    <!-- Method Tabs -->
    <div class="method-tabs">
      <button
        v-for="m in methods"
        :key="m.id"
        :class="['tab-btn', { active: activeMethod === m.id }]"
        @click="activeMethod = m.id"
      >
        <i :class="m.icon"></i> {{ m.label }}
      </button>
    </div>

    <!-- Cloudflare Tunnel -->
    <div v-if="activeMethod === 'cloudflare'" class="method-card">
      <h2><img src="https://www.cloudflare.com/favicon.ico" class="favicon" /> Cloudflare Tunnel <span class="badge free">Free</span></h2>
      <p>Uses <code>cloudflared</code> to create a secure public HTTPS URL with zero config. No port forwarding needed.</p>
      <div class="step-list">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Install cloudflared</strong><br>
            <code>winget install --id Cloudflare.cloudflared</code>
            <span class="os-tag">Windows</span><br>
            <code>brew install cloudflared</code>
            <span class="os-tag">macOS</span><br>
            <code>sudo apt install cloudflared</code>
            <span class="os-tag">Linux</span>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Run the tunnel</strong><br>
            <code>cloudflared tunnel --url http://localhost:8000</code>
            <button class="copy-btn" @click="copyUrl('cloudflared tunnel --url http://localhost:8000')"><i class="fas fa-copy"></i></button>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Paste your public URL here</strong><br>
            <n-input v-model:value="publicUrl" placeholder="https://xxxx.trycloudflare.com" />
          </div>
        </div>
      </div>
      <n-alert type="info" :show-icon="true">
        The public URL changes each time you run cloudflared without a named tunnel. For a permanent URL, <a href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/" target="_blank">set up a named tunnel</a>.
      </n-alert>
    </div>

    <!-- ngrok -->
    <div v-if="activeMethod === 'ngrok'" class="method-card">
      <h2><i class="fas fa-globe"></i> ngrok <span class="badge free">Free tier</span></h2>
      <p>Battle-tested tunneling. Free tier gives you a random subdomain.</p>
      <div class="step-list">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Install ngrok</strong> — <a href="https://ngrok.com/download" target="_blank">ngrok.com/download</a>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Authenticate</strong> (one-time, free account)<br>
            <code>ngrok config add-authtoken &lt;YOUR_TOKEN&gt;</code>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Start tunnel</strong><br>
            <code>ngrok http 8000</code>
            <button class="copy-btn" @click="copyUrl('ngrok http 8000')"><i class="fas fa-copy"></i></button>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Paste your forwarding URL</strong><br>
            <n-input v-model:value="publicUrl" placeholder="https://xxxx.ngrok-free.app" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tailscale -->
    <div v-if="activeMethod === 'tailscale'" class="method-card">
      <h2><i class="fas fa-shield-alt"></i> Tailscale <span class="badge free">Free</span></h2>
      <p>Private WireGuard mesh VPN — best for personal use between your own devices. Devices must all have Tailscale installed.</p>
      <div class="step-list">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Install Tailscale</strong> — <a href="https://tailscale.com/download" target="_blank">tailscale.com/download</a>
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Sign in & connect</strong><br>
            <code>tailscale up</code>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Get your Tailscale IP</strong><br>
            <code>tailscale ip -4</code>
            <button class="copy-btn" @click="copyUrl('tailscale ip -4')"><i class="fas fa-copy"></i></button>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Access XtremeNode from other Tailscale devices at:</strong><br>
            <code>http://&lt;tailscale-ip&gt;:8000</code>
          </div>
        </div>
      </div>
      <n-alert type="success" :show-icon="true">
        Tailscale is encrypted end-to-end and the traffic never leaves Tailscale's relay unless you enable MagicDNS. Great for streaming between your own machines.
      </n-alert>
    </div>

    <!-- Port Forward -->
    <div v-if="activeMethod === 'portforward'" class="method-card">
      <h2><i class="fas fa-server"></i> Router Port Forwarding <span class="badge manual">Manual</span></h2>
      <p>Directly expose port 8000 through your router. Requires a static or DDNS IP.</p>
      <div class="step-list">
        <div class="step">
          <span class="step-num">1</span>
          <div>
            <strong>Find your local IP</strong><br>
            <code>ipconfig</code> (Windows) / <code>ip addr</code> (Linux)
          </div>
        </div>
        <div class="step">
          <span class="step-num">2</span>
          <div>
            <strong>Log into your router</strong> (usually <code>192.168.1.1</code>) and create a port forward rule:
            <ul class="rule-list">
              <li>External port: <strong>8000</strong></li>
              <li>Internal IP: <strong>your machine's LAN IP</strong></li>
              <li>Internal port: <strong>8000</strong></li>
              <li>Protocol: <strong>TCP</strong></li>
            </ul>
          </div>
        </div>
        <div class="step">
          <span class="step-num">3</span>
          <div>
            <strong>Find your public IP</strong><br>
            <n-button size="small" @click="fetchPublicIp" :loading="fetchingIp">
              <i class="fas fa-search"></i> Detect my public IP
            </n-button>
            <span v-if="detectedIp" class="detected-ip">{{ detectedIp }}</span>
          </div>
        </div>
        <div class="step">
          <span class="step-num">4</span>
          <div>
            <strong>Access URL:</strong>
            <code v-if="detectedIp">http://{{ detectedIp }}:8000</code>
            <code v-else>http://&lt;your-public-ip&gt;:8000</code>
          </div>
        </div>
      </div>
      <n-alert type="warning" :show-icon="true">
        Port forwarding exposes your machine directly to the internet. Make sure XtremeNode has authentication enabled and consider using a firewall.
      </n-alert>
    </div>

    <!-- Quick Start Panel -->
    <div class="quick-start">
      <h3><i class="fas fa-rocket"></i> Quick Launch Commands</h3>
      <p>Recommended: <strong>Cloudflare Tunnel</strong> (free, no account for temp URLs)</p>
      <div class="cmd-row">
        <code>cloudflared tunnel --url http://localhost:8000</code>
        <button class="copy-btn" @click="copyUrl('cloudflared tunnel --url http://localhost:8000')">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
      <div class="cmd-row">
        <code>ngrok http 8000</code>
        <button class="copy-btn" @click="copyUrl('ngrok http 8000')">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMessage } from 'naive-ui';

const message = useMessage();
const activeMethod = ref('cloudflare');
const publicUrl = ref('');
const detectedIp = ref('');
const fetchingIp = ref(false);

const methods = [
  { id: 'cloudflare', label: 'Cloudflare Tunnel', icon: 'fas fa-cloud' },
  { id: 'ngrok', label: 'ngrok', icon: 'fas fa-globe' },
  { id: 'tailscale', label: 'Tailscale VPN', icon: 'fas fa-shield-alt' },
  { id: 'portforward', label: 'Port Forward', icon: 'fas fa-server' },
];

const tunnelStatus = computed(() => (publicUrl.value ? 'active' : 'idle'));
const statusIcon = computed(() => (publicUrl.value ? 'fas fa-check-circle' : 'fas fa-circle'));
const statusLabel = computed(() =>
  publicUrl.value ? 'Public URL configured' : 'No public URL set yet — choose a method below',
);

async function fetchPublicIp() {
  fetchingIp.value = true;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    detectedIp.value = data.ip;
  } catch {
    message.error('Could not detect public IP');
  } finally {
    fetchingIp.value = false;
  }
}

function copyUrl(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    message.success('Copied!');
  });
}
</script>

<style scoped>
.tunnel-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: system-ui, sans-serif;
}
.tunnel-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}
.subtitle {
  color: #888;
  margin-bottom: 1.5rem;
}
.status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  background: #1a1a2e;
  border: 1px solid #333;
}
.status-card.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}
.status-icon i { font-size: 1.6rem; color: #888; }
.status-card.active .status-icon i { color: #22c55e; }
.status-label { font-weight: 600; }
.public-url { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
.public-url a { color: #60a5fa; text-decoration: none; }
.method-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.tab-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #333;
  background: transparent;
  color: #ccc;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}
.tab-btn:hover { background: #222; }
.tab-btn.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.method-card {
  background: #111827;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.method-card h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge.free { background: #22c55e22; color: #22c55e; }
.badge.manual { background: #f59e0b22; color: #f59e0b; }
.step-list { display: flex; flex-direction: column; gap: 1rem; margin: 1rem 0; }
.step { display: flex; gap: 1rem; align-items: flex-start; }
.step-num {
  min-width: 28px; height: 28px;
  background: #2563eb; color: #fff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem; flex-shrink: 0;
}
code {
  display: inline-block;
  background: #0f172a;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.83rem;
  font-family: 'Fira Code', monospace;
  color: #93c5fd;
  margin: 2px 0;
}
.os-tag {
  font-size: 0.72rem;
  background: #334155;
  color: #94a3b8;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}
.copy-btn {
  background: transparent;
  border: 1px solid #444;
  color: #94a3b8;
  border-radius: 6px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
  margin-left: 6px;
}
.copy-btn:hover { background: #1e293b; color: #fff; }
.rule-list { margin: 0.5rem 0 0 1.2rem; line-height: 1.7; }
.detected-ip {
  background: #0f172a;
  color: #22c55e;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: monospace;
  margin-left: 10px;
}
.quick-start {
  background: #0f172a;
  border: 1px dashed #334155;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}
.quick-start h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
.cmd-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0;
}
.favicon { width: 16px; height: 16px; }
</style>

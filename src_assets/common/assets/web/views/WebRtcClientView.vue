<template>
  <div class="xn-root" :class="{ 'stream-active': isConnected || isConnecting }">

    <!-- ══════════════════════════════════════════════
         TOP NAV BAR
    ══════════════════════════════════════════════ -->
    <header class="xn-nav">
      <div class="xn-nav-left">
        <div class="xn-logo">
          <i class="fas fa-play-circle xn-logo-icon"></i>
          <span class="xn-logo-brand">Xtreme<span class="xn-logo-accent">Node</span></span>
          <span class="xn-logo-divider">|</span>
          <span class="xn-logo-sub">CLOUD GAMING</span>
        </div>
      </div>
      <div class="xn-nav-right">
        <button class="xn-nav-btn" @click="showSettings = !showSettings" :class="{ active: showSettings }" title="Settings">
          <i class="fas fa-sliders-h"></i>
        </button>
        <div class="xn-status-badge" :class="connectionPillClass">
          <span class="xn-status-dot"></span>
          <span>{{ connectionStatusLabel }}</span>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════
         HERO SECTION — selected app spotlight
    ══════════════════════════════════════════════ -->
    <section class="xn-hero" v-if="selectedApp">
      <div class="xn-hero-bg">
        <img
          v-if="appHasCover(selectedApp)"
          :src="coverUrl(selectedApp)"
          class="xn-hero-bg-img"
          @error="onCoverError(selectedApp!)"
          alt=""
        />
        <div class="xn-hero-overlay"></div>
      </div>
      <div class="xn-hero-content">
        <div class="xn-hero-meta">
          <div class="xn-hero-tag"><i class="fas fa-gamepad"></i> XtremeNode</div>
          <h1 class="xn-hero-title">{{ selectedApp.name }}</h1>
          <p class="xn-hero-sub">{{ appSubtitle(selectedApp) }}</p>
          <div class="xn-hero-badges">
            <span class="xn-badge"><i class="fas fa-desktop"></i> Stream to browser</span>
            <span class="xn-badge"><i class="fas fa-bolt"></i> Low latency</span>
          </div>
        </div>
        <div class="xn-hero-actions">
          <button
            class="xn-play-btn"
            :disabled="isConnecting"
            @click="isConnected ? disconnect() : connect()"
          >
            <i v-if="isConnecting" class="fas fa-circle-notch fa-spin"></i>
            <i v-else-if="isConnected" class="fas fa-stop"></i>
            <i v-else class="fas fa-play"></i>
            {{ isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Play' }}
          </button>
          <button class="xn-hero-icon-btn" @click="clearSelection" title="Back to library">
            <i class="fas fa-arrow-left"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════
         MAIN BODY
    ══════════════════════════════════════════════ -->
    <div class="xn-body">

      <!-- Search bar -->
      <div class="xn-search-row">
        <div class="xn-search-box">
          <i class="fas fa-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('webrtc.search_placeholder') || 'Search games...'"
            class="xn-search-input"
          />
          <button v-if="searchQuery" class="xn-search-clear" @click="searchQuery = ''">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="appsList.length === 0" class="xn-empty">
        <i class="fas fa-spinner fa-spin xn-empty-icon"></i>
        <p>Loading your library…</p>
      </div>

      <!-- No search results -->
      <div v-else-if="filteredApps.length === 0" class="xn-empty">
        <i class="fas fa-search xn-empty-icon"></i>
        <p>No games match "{{ searchQuery }}"</p>
        <button class="xn-clear-btn" @click="searchQuery = ''">Clear search</button>
      </div>

      <template v-else>

        <!-- ── Row: Apps with cover art ── -->
        <section class="xn-row" v-if="appsWithCovers.length > 0">
          <div class="xn-row-header">
            <h2 class="xn-row-title">Your Library</h2>
            <span class="xn-row-count">{{ appsWithCovers.length }} games</span>
          </div>
          <div class="xn-tiles-track">
            <div
              v-for="app in appsWithCovers"
              :key="appKey(app)"
              class="xn-tile"
              :class="{ selected: selectedAppId === appNumericId(app), running: hasRunningSession && selectedAppId === appNumericId(app) }"
              @click="selectApp(app)"
              @dblclick="onAppDoubleClick(app)"
              :title="app.name + '\nDouble-click to launch'"
            >
              <div class="xn-tile-cover">
                <img
                  :src="coverUrl(app)"
                  :alt="app.name"
                  @load="onCoverLoad(app)"
                  @error="onCoverError(app)"
                  class="xn-tile-img"
                />
                <div class="xn-tile-hover">
                  <i class="fas fa-play xn-tile-play"></i>
                </div>
              </div>
              <div class="xn-tile-footer">
                <div class="xn-tile-badge xn-badge-xn"><i class="fas fa-play-circle"></i></div>
                <div class="xn-tile-badge xn-badge-ctrl"><i class="fas fa-gamepad"></i></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Row: Apps without cover art ── -->
        <section class="xn-row" v-if="appsWithoutCovers.length > 0">
          <div class="xn-row-header">
            <h2 class="xn-row-title">{{ appsWithCovers.length > 0 ? 'More Apps' : 'Your Library' }}</h2>
            <span class="xn-row-count">{{ appsWithoutCovers.length }} apps</span>
          </div>
          <div class="xn-list-grid">
            <div
              v-for="app in appsWithoutCovers"
              :key="appKey(app)"
              class="xn-list-item"
              :class="{ selected: selectedAppId === appNumericId(app) }"
              @click="selectApp(app)"
              @dblclick="onAppDoubleClick(app)"
            >
              <div class="xn-list-icon">
                <i class="fas fa-desktop"></i>
              </div>
              <div class="xn-list-info">
                <span class="xn-list-name">{{ app.name }}</span>
                <span class="xn-list-sub">{{ appSubtitle(app) }}</span>
              </div>
              <button class="xn-list-play" @click.stop="onAppDoubleClick(app)" title="Launch">
                <i class="fas fa-play"></i>
              </button>
            </div>
          </div>
        </section>

      </template>

      <!-- Resume banner -->
      <div v-if="resumeAvailable && !selectedApp" class="xn-resume-bar">
        <i class="fas fa-circle-play"></i>
        <span>A session is already running</span>
        <button class="xn-resume-btn" @click="connect()">Resume</button>
      </div>

    </div><!-- /xn-body -->

    <!-- ══════════════════════════════════════════════
         SETTINGS PANEL (slide-in)
    ══════════════════════════════════════════════ -->
    <transition name="settings-slide">
      <aside class="xn-settings" v-if="showSettings">
        <div class="xn-settings-header">
          <h3>Stream Settings</h3>
          <button class="xn-close-btn" @click="showSettings = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="xn-settings-body">

          <div class="xn-setting-group">
            <label class="xn-setting-label">Resolution</label>
            <div class="xn-preset-row">
              <button class="xn-preset-btn" :class="{ active: config.width===1280 && config.height===720 }" @click="setResolution(1280,720)">720p</button>
              <button class="xn-preset-btn" :class="{ active: config.width===1920 && config.height===1080 }" @click="setResolution(1920,1080)">1080p</button>
              <button class="xn-preset-btn" :class="{ active: config.width===2560 && config.height===1440 }" @click="setResolution(2560,1440)">1440p</button>
              <button class="xn-preset-btn" :class="{ active: config.width===3840 && config.height===2160 }" @click="setResolution(3840,2160)">4K</button>
            </div>
          </div>

          <div class="xn-setting-group">
            <label class="xn-setting-label">Frame Rate</label>
            <div class="xn-preset-row">
              <button class="xn-preset-btn" :class="{ active: config.fps===30 }" @click="config.fps=30">30 fps</button>
              <button class="xn-preset-btn" :class="{ active: config.fps===60 }" @click="config.fps=60">60 fps</button>
              <button class="xn-preset-btn" :class="{ active: config.fps===120 }" @click="config.fps=120">120 fps</button>
            </div>
          </div>

          <div class="xn-setting-group">
            <label class="xn-setting-label">Codec</label>
            <div class="xn-preset-row">
              <button
                v-for="opt in encodingOptions"
                :key="opt.value"
                class="xn-preset-btn"
                :class="{ active: config.encoding===opt.value }"
                @click="config.encoding=opt.value"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="xn-setting-group">
            <label class="xn-setting-label">Bitrate (kbps)</label>
            <n-input-number
              v-model:value="config.bitrateKbps"
              :min="1000"
              :max="150000"
              :step="1000"
              size="small"
              style="width:100%"
            />
          </div>

          <div class="xn-setting-group">
            <label class="xn-setting-label">Pacing Mode</label>
            <div class="xn-preset-row">
              <button
                v-for="opt in pacingOptions"
                :key="opt.value"
                class="xn-preset-btn"
                :class="{ active: config.videoPacingMode===opt.value }"
                @click="applyPacingPreset(opt.value)"
              >{{ opt.label }}</button>
            </div>
          </div>

          <div class="xn-setting-group xn-setting-row">
            <label class="xn-setting-label">HDR</label>
            <n-switch v-model:value="config.hdr" size="small" />
          </div>


          <div class="xn-setting-group xn-setting-row">
            <label class="xn-setting-label">Mute host audio</label>
            <n-switch v-model:value="config.muteHostAudio" size="small" />
          </div>

          <!-- GStreamer Low-Latency -->
          <div class="xn-setting-group">
            <div class="xn-setting-row" style="margin-bottom:6px">
              <label class="xn-setting-label">GStreamer Low-Latency</label>
              <n-switch v-model:value="gstEnabled" size="small" @update:value="onGstToggle" />
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span
                class="xn-gst-badge"
                :class="gstInstalled ? 'installed' : gstInstalling ? 'installing' : 'missing'"
              >
                <i class="fas" :class="gstInstalled ? 'fa-check-circle' : gstInstalling ? 'fa-circle-notch fa-spin' : 'fa-exclamation-circle'"></i>
                {{ gstInstalled ? 'GStreamer installed' : gstInstalling ? (gstInstallState === 'downloading' ? 'Downloading...' : 'Installing...') : 'Not installed' }}
              </span>
              <button
                v-if="!gstInstalled && !gstInstalling"
                class="xn-gst-install-btn"
                @click="autoInstallGst"
              >
                <i class="fas fa-download"></i> Auto-Install
              </button>
            </div>
            <p v-if="gstEnabled && !gstInstalled" style="font-size:.72rem;color:#f87171;margin-top:4px">
              Install GStreamer on the host for low-latency encoding.
            </p>
            <p v-if="gstInstalled && gstEnabled" style="font-size:.72rem;color:#4ade80;margin-top:4px">
              Enabled — using high-bitrate low-latency pipeline.
            </p>
          </div>

        </div>
      </aside>
    </transition>

    <!-- Settings backdrop -->
    <div v-if="showSettings" class="xn-backdrop" @click="showSettings = false"></div>

    <!-- ══════════════════════════════════════════════
         STREAM OVERLAY (fullscreen video)
    ══════════════════════════════════════════════ -->
    <div class="xn-stream-overlay" v-show="isConnected || isConnecting">
      <div class="xn-starting-screen" v-if="showStartingOverlay">
        <div class="xn-starting-logo">
          <i class="fas fa-play-circle"></i>
          <span>Xtreme<span>Node</span></span>
        </div>
        <div class="xn-starting-spinner"><i class="fas fa-circle-notch fa-spin"></i></div>
        <p class="xn-starting-label">{{ selectedAppName ? 'Launching ' + selectedAppName : 'Connecting...' }}</p>
      </div>

      <div ref="inputTarget" class="xn-video-container" :class="{ visible: isConnected && !showStartingOverlay }">
        <video
          ref="videoEl"
          class="xn-video"
          autoplay
          playsinline
          :muted="!isConnected"
        ></video>
        <audio ref="audioEl" autoplay style="display:none"></audio>
      </div>

      <!-- HUD bar -->
      <div class="xn-hud" :class="{ show: showOverlay && isConnected }">
        <div class="xn-hud-left">
          <span class="xn-hud-app"><i class="fas fa-play-circle"></i> {{ selectedAppName || 'XtremeNode' }}</span>
        </div>
        <div class="xn-hud-stats" v-if="isConnected">
          <span v-if="displayVideoFps">{{ Math.round(displayVideoFps) }} fps</span>
          <span v-if="smoothedLatencyMs">{{ Math.round(smoothedLatencyMs) }} ms</span>
          <span v-if="stats.videoBitrateKbps">{{ Math.round(stats.videoBitrateKbps) }} kbps</span>
        </div>
        <div class="xn-hud-right">
          <button class="xn-hud-btn" @click="disconnect()" title="Disconnect">
            <i class="fas fa-stop"></i> Disconnect
          </button>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <transition name="notif-fade">
      <div v-if="activeNotification" class="xn-notif" :class="activeNotification.type">
        <i :class="notificationIcon"></i>
        <div class="xn-notif-text">
          <strong>{{ activeNotification.title }}</strong>
          <span v-if="activeNotification.message">{{ activeNotification.message }}</span>
        </div>
        <button class="xn-notif-close" @click="dismissNotification"><i class="fas fa-times"></i></button>
      </div>
    </transition>

  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onBeforeUnmount, onMounted, watch, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { NTag, NSwitch, NInputNumber, NAlert, useDialog, useMessage } from 'naive-ui';
import { WebRtcHttpApi } from '@/services/webrtcApi';
import { WebRtcClient } from '@/utils/webrtc/client';
import { computeVideoFrameRenderDelayMs, decideLatencyFenceReset } from '@/utils/webrtc/latency';
import {
  applyGamepadFeedback,
  attachInputCapture,
  type InputCaptureMetrics,
  releaseKeyboardLock,
  requestKeyboardLock,
} from '@/utils/webrtc/input';
import {
  EncodingType,
  InputMessage,
  StreamConfig,
  WebRtcSessionState,
  WebRtcStatsSnapshot,
} from '@/types/webrtc';
import { http } from '@/http';
import { useAppsStore } from '@/stores/apps';
import { storeToRefs } from 'pinia';
import type { App } from '@/stores/apps';

const { t } = useI18n();
const dialog = useDialog();
const message = useMessage();

// UI State
const showSettings = ref(false);
const streamMinimized = ref(false);

// ============================================
// GSTREAMER
// ============================================
const gstEnabled      = ref(false);
const gstInstalled    = ref(false);
const gstInstalling   = ref(false);
const gstInstallState = ref<string>('idle');

async function checkGstStatus() {
  try {
    const r = await fetch('/api/gstreamer/status');
    const d = await r.json();
    gstInstalled.value    = d.installed === true;
    gstInstallState.value = d.state || 'idle';
    gstInstalling.value   = d.state === 'downloading' || d.state === 'installing';
    if (gstInstalling.value) {
      setTimeout(checkGstStatus, 4000);
    }
  } catch (_) {}
}

async function autoInstallGst() {
  gstInstalling.value = true;
  gstInstallState.value = 'downloading';
  try {
    await fetch('/api/gstreamer/install', { method: 'POST' });
    setTimeout(checkGstStatus, 3000);
  } catch (_) {
    gstInstalling.value = false;
  }
}

function onGstToggle(val: boolean) {
  gstEnabled.value = val;
}

// Check on mount
checkGstStatus();

// ============================================
// NOTIFICATION SYSTEM
// ============================================
type NotificationType = 'error' | 'warning' | 'success' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
}

const activeNotification = ref<Notification | null>(null);
let notificationId = 0;
let notificationTimeout: number | null = null;

const notificationIcon = computed(() => {
  if (!activeNotification.value) return 'fas fa-info-circle';
  switch (activeNotification.value.type) {
    case 'error':
      return 'fas fa-circle-exclamation';
    case 'warning':
      return 'fas fa-triangle-exclamation';
    case 'success':
      return 'fas fa-circle-check';
    default:
      return 'fas fa-circle-info';
  }
});

function showNotification(type: NotificationType, title: string, msg?: string, duration = 5000) {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
  notificationId++;
  activeNotification.value = { id: notificationId, type, title, message: msg };
  if (duration > 0) {
    notificationTimeout = window.setTimeout(() => dismissNotification(), duration);
  }
}

function dismissNotification() {
  activeNotification.value = null;
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
}

function notifyError(title: string, msg?: string) {
  showNotification('error', title, msg, 8000);
}
function notifyWarning(title: string, msg?: string) {
  showNotification('warning', title, msg, 6000);
}
function notifySuccess(title: string, msg?: string) {
  showNotification('success', title, msg, 4000);
}
function notifyInfo(title: string, msg?: string) {
  showNotification('info', title, msg, 5000);
}

// Helper function for resolution presets
function setResolution(width: number, height: number) {
  config.width = width;
  config.height = height;
}

// Connection status computed properties
const connectionPillClass = computed(() => {
  if (isConnected.value) return 'connected';
  if (isConnecting.value) return 'connecting';
  return 'idle';
});

const connectionStatusLabel = computed(() => {
  if (isConnected.value) return 'Connected';
  if (isConnecting.value) return 'Connecting...';
  return 'Ready';
});

type EncodingOption = { label: string; value: EncodingType };

const baseEncodingOptions: EncodingOption[] = [
  { label: 'H.264', value: 'h264' },
  { label: 'HEVC', value: 'hevc' },
  { label: 'AV1', value: 'av1' },
];

const encodingMimes: Record<EncodingType, string[]> = {
  h264: ['video/h264'],
  hevc: ['video/h265', 'video/hevc'],
  av1: ['video/av1'],
};

function detectEncodingSupport(): Record<EncodingType, boolean> {
  const support: Record<EncodingType, boolean> = { h264: true, hevc: true, av1: true };
  const caps =
    (typeof RTCRtpReceiver !== 'undefined' ? RTCRtpReceiver.getCapabilities?.('video') : null) ??
    (typeof RTCRtpSender !== 'undefined' ? RTCRtpSender.getCapabilities?.('video') : null);
  if (!caps?.codecs) return support;
  const mimeTypes = caps.codecs.map((codec) => codec.mimeType.toLowerCase());
  (Object.keys(encodingMimes) as EncodingType[]).forEach((encoding) => {
    support[encoding] = encodingMimes[encoding].some((mime) => mimeTypes.includes(mime));
  });
  return support;
}

const encodingSupport = ref<Record<EncodingType, boolean>>(detectEncodingSupport());

const encodingOptions = computed(() =>
  baseEncodingOptions.map((opt) => {
    const supported = opt.value === 'av1' ? encodingSupport.value[opt.value] : true;
    const hint = supported ? '' : `${opt.label} may be unsupported by this browser.`;
    return { ...opt, supported, hint };
  }),
);

const pacingOptions = [
  { label: 'Latency', value: 'latency' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Smooth', value: 'smoothness' },
] as const;

type PacingMode = (typeof pacingOptions)[number]['value'];

const pacingPresets: Record<PacingMode, { slackMs: number; maxAgeFrames: number }> = {
  latency: { slackMs: 0, maxAgeFrames: 1 },
  useGstreamer: false,
  balanced: { slackMs: 2, maxAgeFrames: 1 },
  smoothness: { slackMs: 3, maxAgeFrames: 3 },
};

const MIN_FRAME_AGE_MS = 5;
const MAX_FRAME_AGE_MS = 100;
const MAX_FRAME_AGE_FRAMES = 10;

function maxAllowedFramesForFps(fps: number): number {
  const safeFps = fps > 0 ? fps : 60;
  const maxByMs = Math.floor((MAX_FRAME_AGE_MS * safeFps) / 1000);
  return Math.max(1, Math.min(MAX_FRAME_AGE_FRAMES, maxByMs));
}

function clampMaxAgeFrames(
  value: number | null | undefined,
  fps: number,
  mode?: PacingMode,
): number {
  const resolvedMode = mode ?? 'balanced';
  const preset = pacingPresets[resolvedMode].maxAgeFrames;
  const maxAllowed = maxAllowedFramesForFps(fps);
  if (value == null || !Number.isFinite(value)) return Math.min(preset, maxAllowed);
  return Math.min(maxAllowed, Math.max(1, Math.round(value)));
}

function maxFrameAgeMsFromFrames(fps: number, frames: number): number {
  const safeFps = fps > 0 ? fps : 60;
  return Math.round((1000 / safeFps) * frames);
}

function applyPacingPreset(mode: PacingMode) {
  const preset = pacingPresets[mode];
  config.videoPacingMode = mode;
  config.videoPacingSlackMs = preset.slackMs;
  config.videoMaxFrameAgeMs = undefined;
  config.videoMaxFrameAgeFrames = clampMaxAgeFrames(preset.maxAgeFrames, config.fps, mode);
}

const hdrCodecAdvertised = computed(() => {
  if (config.encoding === 'av1') return encodingSupport.value.av1;
  return encodingSupport.value.hevc;
});

const hdrInlineWarning = computed(() => {
  if (!config.hdr) return null;
  if (hdrRuntimeWarning.value) return hdrRuntimeWarning.value;
  if (!hdrCodecAdvertised.value) {
    return `This browser reports no ${config.encoding.toUpperCase()} decode support. If you get a black screen, switch codecs or disable HDR.`;
  }
  return null;
});

function ensureHdrEncoding(): void {
  if (config.encoding === 'h264') config.encoding = 'hevc';
}

const config = reactive<StreamConfig>({
  width: 1920,
  height: 1080,
  fps: 60,
  encoding: 'h264',
  hdr: false,
  bitrateKbps: 20000,
  muteHostAudio: true,
  videoPacingMode: 'balanced',
  videoPacingSlackMs: pacingPresets.balanced.slackMs,
  videoMaxFrameAgeFrames: pacingPresets.balanced.maxAgeFrames,
});

const negotiatedEncoding = ref<EncodingType | null>(null);
const hdrRuntimeWarning = ref<string | null>(null);

const CLIENT_CONFIG_STORAGE_KEY = 'sunshine.webrtc.session_config';

function normalizeProfileConfig(profileConfig: StreamConfig): StreamConfig {
  const normalized = { ...profileConfig };
  const fps =
    typeof normalized.fps === 'number' && Number.isFinite(normalized.fps) ? normalized.fps : 60;
  if (typeof normalized.hdr !== 'boolean') normalized.hdr = false;
  if (
    normalized.encoding !== 'h264' &&
    normalized.encoding !== 'hevc' &&
    normalized.encoding !== 'av1'
  ) {
    normalized.encoding = 'h264';
  }
  if (normalized.hdr && normalized.encoding === 'h264') normalized.encoding = 'hevc';

  if (typeof normalized.videoMaxFrameAgeMs === 'number') {
    if (normalized.videoMaxFrameAgeFrames == null) {
      normalized.videoMaxFrameAgeFrames = Math.max(
        1,
        Math.round((normalized.videoMaxFrameAgeMs / 1000) * fps),
      );
    }
    delete normalized.videoMaxFrameAgeMs;
  }

  const modeRaw = normalized.videoPacingMode;
  const mode: PacingMode =
    modeRaw === 'latency' || modeRaw === 'balanced' || modeRaw === 'smoothness'
      ? modeRaw
      : 'balanced';
  normalized.videoPacingMode = mode;

  const slackRaw = normalized.videoPacingSlackMs;
  const slack =
    typeof slackRaw === 'number' && Number.isFinite(slackRaw)
      ? Math.round(slackRaw)
      : pacingPresets[mode].slackMs;
  normalized.videoPacingSlackMs = Math.max(0, Math.min(10, slack));

  normalized.videoMaxFrameAgeFrames = clampMaxAgeFrames(
    normalized.videoMaxFrameAgeFrames ?? null,
    fps,
    mode,
  );
  return normalized;
}

function loadCachedConfig(): void {
  try {
    const raw = window.localStorage.getItem(CLIENT_CONFIG_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    Object.assign(config, normalizeProfileConfig(parsed as StreamConfig));
  } catch {
    /* ignore */
  }
}

function persistCachedConfig(): void {
  try {
    const snapshot = normalizeProfileConfig({ ...config });
    window.localStorage.setItem(CLIENT_CONFIG_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

const maxFrameAgeFrames = computed({
  get() {
    return clampMaxAgeFrames(
      config.videoMaxFrameAgeFrames ?? null,
      config.fps,
      (config.videoPacingMode as PacingMode | undefined) ?? 'balanced',
    );
  },
  set(value: number | null) {
    config.videoMaxFrameAgeMs = undefined;
    config.videoMaxFrameAgeFrames = clampMaxAgeFrames(
      value,
      config.fps,
      (config.videoPacingMode as PacingMode | undefined) ?? 'balanced',
    );
  },
});

watch(
  () => config.hdr,
  (enabled) => {
    if (enabled) ensureHdrEncoding();
  },
);
watch(
  () => config.encoding,
  () => {
    if (config.hdr) ensureHdrEncoding();
  },
);
watch(
  () => config.hdr,
  (enabled) => {
    if (!enabled) hdrRuntimeWarning.value = null;
  },
);
watch(
  () => config.encoding,
  () => {
    hdrRuntimeWarning.value = null;
  },
);
watch(
  () => ({ ...config }),
  () => {
    persistCachedConfig();
  },
  { deep: true },
);

const appsStore = useAppsStore();
const { apps } = storeToRefs(appsStore);
const appsList = computed(() => (apps.value || []).slice());

// Search and filtering
const searchQuery = ref('');

// Track which apps have valid cover images (loaded successfully)
const appCoverStatus = ref<Map<string, boolean>>(new Map());

function onCoverLoad(app: App) {
  if (app.uuid) appCoverStatus.value.set(app.uuid, true);
}

function onCoverError(app: App) {
  if (app.uuid) appCoverStatus.value.set(app.uuid, false);
}

function appHasCover(app: App): boolean {
  // Check if we've already loaded this cover
  if (app.uuid && appCoverStatus.value.has(app.uuid)) {
    return appCoverStatus.value.get(app.uuid) === true;
  }
  // Assume apps with image-path or playnite-id have covers until proven otherwise
  return !!(app['image-path'] || app['playnite-id']);
}

const filteredApps = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return appsList.value;
  return appsList.value.filter((app) => {
    const name = (app.name || '').toLowerCase();
    return name.includes(query);
  });
});

const appsWithCovers = computed(() => filteredApps.value.filter((app) => appHasCover(app)));
const appsWithoutCovers = computed(() => filteredApps.value.filter((app) => !appHasCover(app)));

const selectedAppId = ref<number | null>(null);
const resumeOnConnect = ref(true);
const terminatePending = ref(false);
const sessionStatus = ref<{ activeSessions: number; appRunning: boolean; paused: boolean } | null>(
  null,
);
let sessionStatusTimer: number | null = null;

function appKey(app: App): string {
  return `${app.uuid || ''}-${app.name || 'app'}`;
}

function coverUrl(app: App): string {
  if (!app.uuid) return '';
  return `/api/apps/${encodeURIComponent(app.uuid)}/cover`;
}

function appSubtitle(app: App): string {
  if (app['playnite-id']) return 'Playnite';
  if (app['working-dir']) return String(app['working-dir']);
  return 'Custom';
}

function appNumericId(app: App): number | null {
  const raw = (app as any).id ?? (app as any).index;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function selectApp(app: App) {
  const id = appNumericId(app);
  if (id == null) return;
  selectedAppId.value = id;
  resumeOnConnect.value = false;
}

async function onAppDoubleClick(app: App) {
  if (isConnected.value || isConnecting.value) return;
  selectApp(app);
  await connect();
}

function clearSelection() {
  selectedAppId.value = null;
  resumeOnConnect.value = true;
}

const selectedAppLabel = computed(() => {
  if (!selectedAppId.value) return 'No app selected';
  const selected = appsList.value.find((app) => appNumericId(app) === selectedAppId.value);
  return selected?.name ? selected.name : `App ${selectedAppId.value}`;
});

const selectedAppName = computed(() => {
  if (!selectedAppId.value) return null;
  const selected = appsList.value.find((app) => appNumericId(app) === selectedAppId.value);
  return selected?.name ?? null;
});


const selectedApp = computed(() => {
  if (!selectedAppId.value) return null;
  return appsList.value.find((app) => appNumericId(app) === selectedAppId.value) ?? null;
});
const hasRunningSession = computed(() => {
  if (!sessionStatus.value) return false;
  return sessionStatus.value.appRunning || sessionStatus.value.activeSessions > 0;
});

const resumeAvailable = computed(() => {
  if (selectedAppId.value) return false;
  if (!sessionStatus.value) return false;
  return sessionStatus.value.activeSessions > 0 || sessionStatus.value.paused;
});

const api = new WebRtcHttpApi();
const client = new WebRtcClient(api);

const isConnecting = ref(false);
const isConnected = ref(false);

function setWebRtcActive(active: boolean): void {
  try {
    (window as any).__sunshine_webrtc_active = active;
  } catch {
    /* ignore */
  }
}

watch(
  () => [isConnecting.value, isConnected.value] as const,
  ([connecting, connected]) => {
    setWebRtcActive(connecting || connected);
  },
  { immediate: true },
);

const connectLabelKey = computed(() => {
  if (isConnecting.value) return 'webrtc.connecting';
  if (isConnected.value) return 'webrtc.disconnect';
  if (resumeAvailable.value) return 'webrtc.resume';
  if (selectedAppId.value) return 'webrtc.connect';
  return 'webrtc.stream_desktop';
});

const showStartingOverlay = computed(() => {
  if (isConnected.value) return false;
  return isConnecting.value || connectionState.value === 'connecting';
});

const connectionState = ref<RTCPeerConnectionState | null>(null);
const iceState = ref<RTCIceConnectionState | null>(null);
const inputChannelState = ref<RTCDataChannelState | null>(null);
const stats = ref<WebRtcStatsSnapshot>({});
const inputEnabled = ref(true);
const showOverlay = ref(false);
const inputTarget = ref<HTMLElement | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
const isFullscreen = ref(false);
const pseudoFullscreen = ref(false);
const nativeVideoFullscreen = ref(false);
const autoFullscreen = ref(true);
const sessionId = ref<string | null>(null);
const serverSession = ref<WebRtcSessionState | null>(null);
const serverVideoFps = ref<number | undefined>(undefined);

let lastServerSample: { ts: number; videoPackets?: number } | null = null;
const remoteStreamInfo = ref<{ id: string; videoTracks: number; audioTracks: number } | null>(null);
const videoEvents = ref<string[]>([]);
const videoStateTick = ref(0);

const videoDebug = computed(() => {
  void videoStateTick.value;
  const el = videoEl.value;
  if (!el) return null;
  return {
    readyState: el.readyState,
    width: el.videoWidth,
    height: el.videoHeight,
    currentTime: el.currentTime,
    paused: el.paused,
  };
});

const videoSizeLabel = computed(() => {
  const width = videoDebug.value?.width ?? 0;
  const height = videoDebug.value?.height ?? 0;
  return width > 0 && height > 0 ? `${width}x${height}` : '--';
});

const inputMetrics = ref<InputCaptureMetrics>({});
const inputBufferedAmount = ref<number | null>(null);
const INPUT_BUFFER_DROP_THRESHOLD_BYTES = 1024;

const shouldDropInput = (payload: InputMessage) => {
  const buffered = client.inputChannelBufferedAmount ?? 0;
  inputBufferedAmount.value = buffered;
  if (buffered <= INPUT_BUFFER_DROP_THRESHOLD_BYTES) return false;
  if (payload.type === 'mouse_move') return true;
  if (payload.type === 'gamepad_state' || payload.type === 'gamepad_motion') return true;
  return false;
};

const videoFrameMetrics = ref<{
  lastIntervalMs?: number;
  avgIntervalMs?: number;
  maxIntervalMs?: number;
  p98IntervalMs?: number;
  avg98IntervalMs?: number;
  p99IntervalMs?: number;
  avg99IntervalMs?: number;
  lastDelayMs?: number;
  avgDelayMs?: number;
  maxDelayMs?: number;
}>({});

const videoPacingMetrics = ref<{
  dtMs?: number | null;
  presentedDelta?: number | null;
  now?: number;
  expectedDisplayTime?: number;
  mediaTime?: number;
  processingDuration?: number;
  receiveTime?: number;
  rtpTimestamp?: number;
}>({});

const inboundVideoStats = ref<{
  fpsReceived?: number;
  fpsDecoded?: number;
  framesDropped?: number;
  avgJitterBufferMs?: number | null;
  avgDecodeMsPerFrame?: number | null;
  packetsLostDelta?: number;
  jitter?: number;
}>({});

type DiagnosticsSample = {
  ts: number;
  pacingDtMs?: number | null;
  presentedDelta?: number | null;
  renderIntervalMs?: number;
  renderDelayMs?: number;
  fpsReceived?: number;
  fpsDecoded?: number;
  framesDropped?: number;
  avgJitterBufferMs?: number | null;
  avgDecodeMsPerFrame?: number | null;
  packetsLostDelta?: number;
  jitter?: number;
  serverQueue?: number;
  serverInflight?: number;
  serverVideoAgeMs?: number;
  serverFps?: number;
};

const DIAGNOSTICS_WINDOW_MS = 30000;
const diagnosticsSamples = ref<DiagnosticsSample[]>([]);
let diagnosticsSampleTimer: number | null = null;

const renderFps = computed(() => {
  const intervalMs =
    videoFrameMetrics.value.lastIntervalMs ?? videoFrameMetrics.value.avgIntervalMs;
  if (typeof intervalMs !== 'number' || !Number.isFinite(intervalMs) || intervalMs <= 0)
    return undefined;
  return 1000 / intervalMs;
});

const renderFps98 = computed(() => {
  const intervalMs =
    videoFrameMetrics.value.avg98IntervalMs ?? videoFrameMetrics.value.p98IntervalMs;
  if (typeof intervalMs !== 'number' || !Number.isFinite(intervalMs) || intervalMs <= 0)
    return undefined;
  return 1000 / intervalMs;
});

const renderFps99 = computed(() => {
  const intervalMs =
    videoFrameMetrics.value.avg99IntervalMs ?? videoFrameMetrics.value.p99IntervalMs;
  if (typeof intervalMs !== 'number' || !Number.isFinite(intervalMs) || intervalMs <= 0)
    return undefined;
  return 1000 / intervalMs;
});

const renderDelayMs = computed(
  () => videoFrameMetrics.value.lastDelayMs ?? videoFrameMetrics.value.avgDelayMs,
);
const renderIntervalMs = computed(
  () => videoFrameMetrics.value.lastIntervalMs ?? videoFrameMetrics.value.avgIntervalMs,
);

const LATENCY_SAMPLE_WINDOW_MS = 30000;
const LATENCY_SMOOTH_TAU_MS = 2000;
const LATENCY_FAST_TAU_MS = 300;
const LATENCY_FAST_TRIGGER_MS = 12;
const LATENCY_FAST_TRIGGER_RATIO = 1.15;
const VIDEO_FPS_SMOOTH_TAU_MS = 1500;
const latencySamples = ref<{ ts: number; value: number }[]>([]);
const smoothedLatencyMs = ref<number | undefined>(undefined);
let lastLatencySampleAt: number | null = null;
const videoJitterBufferMs = computed(() => stats.value.videoJitterBufferMs);
const oneWayRttMs = computed(() =>
  stats.value.roundTripTimeMs ? stats.value.roundTripTimeMs / 2 : undefined,
);
const videoPlayoutDelayMs = computed(
  () => stats.value.videoPlayoutDelayMs ?? stats.value.videoJitterBufferMs,
);
const smoothedVideoFps = ref<number | undefined>(undefined);
let lastVideoFpsSampleAt: number | null = null;

const displayVideoFps = computed(
  () =>
    renderFps99.value ??
    renderFps98.value ??
    renderFps.value ??
    smoothedVideoFps.value ??
    stats.value.videoFps,
);

const estimatedLatencyMs = computed(() => {
  const parts = [oneWayRttMs.value, videoPlayoutDelayMs.value, stats.value.videoDecodeMs].filter(
    (value) => typeof value === 'number',
  ) as number[];
  if (!parts.length) return undefined;
  return parts.reduce((total, value) => total + value, 0);
});

watch(
  () => estimatedLatencyMs.value,
  (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return;
    const now = Date.now();
    const lastAt = lastLatencySampleAt ?? now;
    const deltaMs = Math.max(0, now - lastAt);
    const current = smoothedLatencyMs.value;
    const jumpMs =
      typeof current === 'number' && Number.isFinite(current) ? value - current : undefined;
    const jumpRatio =
      typeof current === 'number' && Number.isFinite(current) && current > 0
        ? value / current
        : undefined;
    const useFastTau =
      jumpMs != null &&
      (jumpMs >= LATENCY_FAST_TRIGGER_MS ||
        (jumpRatio != null && jumpRatio >= LATENCY_FAST_TRIGGER_RATIO));
    const tauMs = useFastTau ? LATENCY_FAST_TAU_MS : LATENCY_SMOOTH_TAU_MS;
    const alpha = 1 - Math.exp(-deltaMs / tauMs);
    if (smoothedLatencyMs.value == null || !Number.isFinite(smoothedLatencyMs.value)) {
      smoothedLatencyMs.value = value;
    } else {
      smoothedLatencyMs.value = smoothedLatencyMs.value + alpha * (value - smoothedLatencyMs.value);
    }
    lastLatencySampleAt = now;
    latencySamples.value.push({ ts: now, value });
    const cutoff = now - LATENCY_SAMPLE_WINDOW_MS;
    while (latencySamples.value.length && latencySamples.value[0].ts < cutoff) {
      latencySamples.value.shift();
    }
  },
);

watch(
  () => stats.value.videoFps,
  (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return;
    const now = Date.now();
    const lastAt = lastVideoFpsSampleAt ?? now;
    const deltaMs = Math.max(0, now - lastAt);
    const alpha = 1 - Math.exp(-deltaMs / VIDEO_FPS_SMOOTH_TAU_MS);
    if (smoothedVideoFps.value == null || !Number.isFinite(smoothedVideoFps.value)) {
      smoothedVideoFps.value = value;
    } else {
      smoothedVideoFps.value = smoothedVideoFps.value + alpha * (value - smoothedVideoFps.value);
    }
    lastVideoFpsSampleAt = now;
  },
);

const overlayLines = computed(() => {
  const fps = displayVideoFps.value ? displayVideoFps.value.toFixed(0) : '--';
  const bitrate = formatKbps(stats.value.videoBitrateKbps);
  const latency = formatMs(smoothedLatencyMs.value);
  const dropped = stats.value.videoFramesDropped ?? '--';
  const codec = stats.value.videoCodec ?? '--';
  return [
    `FPS: ${fps} | Bitrate: ${bitrate}`,
    `Latency: ${latency} | Dropped: ${dropped}`,
    `Codec: ${codec} | Size: ${videoSizeLabel.value}`,
  ];
});

// Video/Audio stream handling
let videoStream: MediaStream | null = null;
let audioStream: MediaStream | null = null;
let audioAutoplayRequested = false;
let audioPlaybackUnlocked = false;
let lastAudioPlayAttemptAtMs = 0;
let lastAudioPlayErrorAtMs = 0;
let audioPlayRetryTimer: number | null = null;
let audioPlayRetryUntilMs: number | null = null;
let detachInput: (() => void) | null = null;
let detachVideoEvents: (() => void) | null = null;
let detachVideoFrames: (() => void) | null = null;
let detachVideoPacing: (() => void) | null = null;
let detachVideoFullscreenEvents: (() => void) | null = null;
let stopInboundVideoStatsTimer: (() => void) | null = null;
let lastTrackSnapshot: { videoReady?: string; audioReady?: string } | null = null;

const AUDIO_TARGET_BUFFER_MS = 20;
const AUDIO_TARGET_PLAYOUT_MS = 20;
const AUDIO_DRAIN_TARGET_MS = 10;
const AUDIO_DRAIN_PLAYOUT_MS = 0;
const AUDIO_DRAIN_TRIGGER_MS = 45;
const AUDIO_DRAIN_RELEASE_MS = 25;
const AUDIO_DRAIN_SUSTAIN_MS = 800;
const AUDIO_DRAIN_RELEASE_SUSTAIN_MS = 1200;
const AUDIO_BUFFER_RESET_THRESHOLD_MS = 120;
const AUDIO_BUFFER_RESET_SUSTAIN_MS = 3000;
const AUDIO_BUFFER_RESET_COOLDOWN_MS = 15000;
const VIDEO_BUFFER_RESET_THRESHOLD_MS = 140;
const VIDEO_RENDER_RESET_THRESHOLD_MS = 100;
const VIDEO_INTERVAL_RESET_THRESHOLD_MS = 100;
const VIDEO_BUFFER_RESET_FRAME_MARGIN = 6;
const VIDEO_RENDER_RESET_FRAME_MARGIN = 5;
const VIDEO_BUFFER_RESET_SUSTAIN_MS = 900;
const VIDEO_RENDER_RESET_SUSTAIN_MS = 900;
const VIDEO_BUFFER_RESET_COOLDOWN_MS = 4000;
type VideoLatencyProfile = {
  drainSustainMs: number;
  drainReleaseSustainMs: number;
  startupDrainMs: number;
  startupReleaseSustainMs: number;
  modeSwitchDrainMs: number;
  riseGuardMs: number;
  riseLimitMultiplier: number;
  riseLimitMinMs: number;
  drainFrameReduction: number;
  playbackRateMax: number;
  playbackRateBoostMax: number;
  playbackRateDecayPerSec: number;
  targetFallRateMsPerSec: number;
  targetRiseRateMsPerSec: number;
  startupTargetMs: number;
  runawayDrainTriggerMs?: number;
  runawayDrainSustainMs?: number;
  runawayDrainWindowMs?: number;
  runawayResetThresholdMs?: number;
  runawayResetSustainMs?: number;
  runawayResetFrameMargin?: number;
};

function isSafariBrowser(): boolean {
  try {
    const ua = navigator.userAgent ?? '';
    const vendor = navigator.vendor ?? '';
    if (!/\bsafari\//i.test(ua)) return false;
    if (!/apple/i.test(vendor)) return false;
    if (/\b(chrome|chromium|crios|fxios|edgios|edg|opr|opera)\b/i.test(ua)) return false;
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_VIDEO_LATENCY_PROFILE: VideoLatencyProfile = {
  drainSustainMs: 350,
  drainReleaseSustainMs: 800,
  startupDrainMs: 20000,
  startupReleaseSustainMs: 1000,
  modeSwitchDrainMs: 8000,
  riseGuardMs: 6000,
  riseLimitMultiplier: 1.5,
  riseLimitMinMs: 8,
  drainFrameReduction: 0.5,
  playbackRateMax: 1.12,
  playbackRateBoostMax: 1.2,
  playbackRateDecayPerSec: 0.12,
  targetFallRateMsPerSec: Number.POSITIVE_INFINITY,
  targetRiseRateMsPerSec: Number.POSITIVE_INFINITY,
  startupTargetMs: 0,
  runawayDrainTriggerMs: 90,
  runawayDrainSustainMs: 350,
  runawayDrainWindowMs: 10000,
  runawayResetThresholdMs: 220,
  runawayResetSustainMs: 900,
  runawayResetFrameMargin: 10,
};

const SAFARI_VIDEO_LATENCY_PROFILE: VideoLatencyProfile = {
  drainSustainMs: 180,
  drainReleaseSustainMs: 550,
  startupDrainMs: 25000,
  startupReleaseSustainMs: 1400,
  modeSwitchDrainMs: 9000,
  riseGuardMs: 10000,
  riseLimitMultiplier: 1.1,
  riseLimitMinMs: 6,
  drainFrameReduction: 1.0,
  playbackRateMax: 1.16,
  playbackRateBoostMax: 1.24,
  playbackRateDecayPerSec: 0.15,
  targetFallRateMsPerSec: 240,
  targetRiseRateMsPerSec: 80,
  startupTargetMs: 0,
  runawayDrainTriggerMs: 80,
  runawayDrainSustainMs: 250,
  runawayDrainWindowMs: 12000,
  runawayResetThresholdMs: 160,
  runawayResetSustainMs: 1500,
  runawayResetFrameMargin: 8,
};

const safariLatencyTuningEnabled = isSafariBrowser();
const videoLatencyProfile: VideoLatencyProfile = safariLatencyTuningEnabled
  ? SAFARI_VIDEO_LATENCY_PROFILE
  : DEFAULT_VIDEO_LATENCY_PROFILE;
let audioDrainOverloadedSince: number | null = null;
let audioDrainReleaseSince: number | null = null;
let audioDrainActive = false;
let audioBufferOverloadedSince: number | null = null;
let lastAudioBufferResetAt: number | null = null;
let videoDrainOverloadedSince: number | null = null;
let videoDrainReleaseSince: number | null = null;
let videoDrainMode: 'off' | 'adaptive' | 'startup' = 'off';
let videoBufferOverloadedSince: number | null = null;
let videoRenderOverloadedSince: number | null = null;
let videoRunawayOverloadedSince: number | null = null;
let lastVideoBufferResetAt: number | null = null;
let lastVideoTargetMs: number | undefined = undefined;
let desiredVideoTargetMs: number | undefined = undefined;
let effectiveVideoTargetMs: number | undefined = undefined;
let lastVideoTargetAdjustAt: number | null = null;
let videoStartupDrainUntil: number | null = null;
let videoStartupDrainReleaseSince: number | null = null;
let lastVideoPlayoutSample: { ts: number; value: number } | null = null;
let lastPlaybackRateUpdateAt: number | null = null;
let modeSwitchDrainUntil: number | null = null;
let videoRunawayDrainSince: number | null = null;
let videoRunawayDrainLatched = false;

function setAudioDrainActive(active: boolean): void {
  if (audioDrainActive === active) return;
  audioDrainActive = active;
  client.setAudioLatencyTargets(
    active ? AUDIO_DRAIN_TARGET_MS : AUDIO_TARGET_BUFFER_MS,
    active ? AUDIO_DRAIN_PLAYOUT_MS : AUDIO_TARGET_PLAYOUT_MS,
  );
  pushVideoEvent(active ? 'audio-drain-on' : 'audio-drain-off');
}

function resetAudioDrainState(): void {
  audioDrainOverloadedSince = null;
  audioDrainReleaseSince = null;
  if (audioDrainActive) {
    setAudioDrainActive(false);
  }
}

function resolveVideoBaseTargetMs(): number {
  const fps = typeof config.fps === 'number' && Number.isFinite(config.fps) ? config.fps : 60;
  const frames = clampMaxAgeFrames(
    config.videoMaxFrameAgeFrames ?? null,
    fps,
    (config.videoPacingMode as PacingMode | undefined) ?? 'balanced',
  );
  const fromFrames = maxFrameAgeMsFromFrames(fps, frames);
  const explicit =
    typeof config.videoMaxFrameAgeMs === 'number' && Number.isFinite(config.videoMaxFrameAgeMs)
      ? Math.round(config.videoMaxFrameAgeMs)
      : fromFrames;
  return Math.min(MAX_FRAME_AGE_MS, Math.max(MIN_FRAME_AGE_MS, explicit));
}

function resolveVideoDrainTargetMs(baseTargetMs: number): number {
  const fps = typeof config.fps === 'number' && Number.isFinite(config.fps) ? config.fps : 60;
  const frameMs = maxFrameAgeMsFromFrames(fps, 1);
  return Math.max(
    MIN_FRAME_AGE_MS,
    Math.min(MAX_FRAME_AGE_MS, baseTargetMs - frameMs * videoLatencyProfile.drainFrameReduction),
  );
}

function resolveVideoStartupTargetMs(): number {
  return videoLatencyProfile.startupTargetMs;
}

function applyVideoTargetMs(targetMs?: number): void {
  const now = Date.now();
  const normalizedTarget =
    typeof targetMs === 'number' && Number.isFinite(targetMs)
      ? Math.min(MAX_FRAME_AGE_MS, Math.max(MIN_FRAME_AGE_MS, targetMs))
      : undefined;
  desiredVideoTargetMs = normalizedTarget;

  if (desiredVideoTargetMs == null) {
    effectiveVideoTargetMs = undefined;
    lastVideoTargetAdjustAt = now;
    if (lastVideoTargetMs === undefined) return;
    lastVideoTargetMs = undefined;
    client.setVideoLatencyTarget(undefined);
    return;
  }

  if (effectiveVideoTargetMs == null || !Number.isFinite(effectiveVideoTargetMs)) {
    effectiveVideoTargetMs = desiredVideoTargetMs;
  } else if (effectiveVideoTargetMs !== desiredVideoTargetMs) {
    const lastAt = lastVideoTargetAdjustAt ?? now;
    const elapsedMs = Math.max(1, now - lastAt);
    const movingDown = desiredVideoTargetMs < effectiveVideoTargetMs;
    const slewRate = movingDown
      ? videoLatencyProfile.targetFallRateMsPerSec
      : videoLatencyProfile.targetRiseRateMsPerSec;
    const maxStep = Number.isFinite(slewRate)
      ? (slewRate * elapsedMs) / 1000
      : Math.abs(desiredVideoTargetMs - effectiveVideoTargetMs);

    if (maxStep > 0) {
      const delta = desiredVideoTargetMs - effectiveVideoTargetMs;
      if (Math.abs(delta) <= maxStep) {
        effectiveVideoTargetMs = desiredVideoTargetMs;
      } else {
        effectiveVideoTargetMs += Math.sign(delta) * maxStep;
      }
    }
  }

  lastVideoTargetAdjustAt = now;
  const nextTargetMs = Math.round(effectiveVideoTargetMs);
  if (lastVideoTargetMs === nextTargetMs) return;
  lastVideoTargetMs = nextTargetMs;
  client.setVideoLatencyTarget(nextTargetMs);
}

function setVideoDrainMode(
  mode: 'off' | 'adaptive' | 'startup',
  baseTargetMs: number,
  overrideTargetMs?: number,
): void {
  const target =
    mode === 'off' ? baseTargetMs : (overrideTargetMs ?? resolveVideoDrainTargetMs(baseTargetMs));
  if (videoDrainMode === mode) {
    applyVideoTargetMs(target);
    return;
  }
  videoDrainMode = mode;
  applyVideoTargetMs(target);
  if (mode === 'startup') {
    pushVideoEvent('video-drain-startup-on');
  } else if (mode === 'adaptive') {
    pushVideoEvent('video-drain-on');
  } else {
    pushVideoEvent('video-drain-off');
  }
}

function resetVideoDrainState(): void {
  videoDrainOverloadedSince = null;
  videoDrainReleaseSince = null;
  videoBufferOverloadedSince = null;
  videoRenderOverloadedSince = null;
  videoRunawayOverloadedSince = null;
  videoStartupDrainUntil = null;
  videoStartupDrainReleaseSince = null;
  lastVideoPlayoutSample = null;
  videoRunawayDrainSince = null;
  videoRunawayDrainLatched = false;
  const baseTargetMs = resolveVideoBaseTargetMs();
  setVideoDrainMode('off', baseTargetMs);
}

function triggerVideoDrainWindow(durationMs: number, reason: string): void {
  if (!isConnected.value) return;
  const now = Date.now();
  const until = now + Math.max(0, durationMs);
  videoStartupDrainUntil =
    videoStartupDrainUntil != null ? Math.max(videoStartupDrainUntil, until) : until;
  videoStartupDrainReleaseSince = null;
  const baseTargetMs = resolveVideoBaseTargetMs();
  setVideoDrainMode('startup', baseTargetMs, resolveVideoStartupTargetMs());
  pushVideoEvent(`video-drain-${reason}`);
}

function resolveFrameBoundedThresholdMs(
  fixedThresholdMs: number,
  baseTargetMs: number,
  frameMs: number,
  frameMargin: number,
): number {
  const frameBounded = baseTargetMs + frameMs * frameMargin;
  return Math.max(MIN_FRAME_AGE_MS, Math.min(fixedThresholdMs, frameBounded));
}

function resetVideoLatencyFenceState(): void {
  videoBufferOverloadedSince = null;
  videoRenderOverloadedSince = null;
  videoRunawayOverloadedSince = null;
}

function handleVideoLatencyReset(label: string, drainReason: string): void {
  resetVideoLatencyFenceState();
  pushVideoEvent(label);
  resetVideoElement();
  triggerVideoDrainWindow(
    videoLatencyProfile.runawayDrainWindowMs ?? videoLatencyProfile.modeSwitchDrainMs,
    drainReason,
  );
}

function setVideoPlaybackRate(rate: number): void {
  const el = videoEl.value;
  if (!el) return;
  const clamped = Math.max(1, Math.min(videoLatencyProfile.playbackRateBoostMax, rate));
  if (Math.abs((el.playbackRate ?? 1) - clamped) < 0.001) return;
  try {
    el.playbackRate = clamped;
  } catch {
    /* ignore */
  }
}

watch(
  () => stats.value.audioJitterBufferMs,
  (audioValue) => {
    if (!isConnected.value || !isTabActive()) {
      resetAudioDrainState();
      audioBufferOverloadedSince = null;
      return;
    }
    if (typeof audioValue !== 'number' || !Number.isFinite(audioValue)) return;
    const now = Date.now();
    if (audioValue >= AUDIO_DRAIN_TRIGGER_MS) {
      if (audioDrainOverloadedSince == null) {
        audioDrainOverloadedSince = now;
      }
      audioDrainReleaseSince = null;
      if (!audioDrainActive && now - audioDrainOverloadedSince >= AUDIO_DRAIN_SUSTAIN_MS) {
        setAudioDrainActive(true);
      }
    } else if (audioDrainActive && audioValue <= AUDIO_DRAIN_RELEASE_MS) {
      if (audioDrainReleaseSince == null) {
        audioDrainReleaseSince = now;
      }
      if (now - audioDrainReleaseSince >= AUDIO_DRAIN_RELEASE_SUSTAIN_MS) {
        setAudioDrainActive(false);
      }
    } else {
      audioDrainOverloadedSince = null;
      audioDrainReleaseSince = null;
    }

    const audioOverloaded = audioValue >= AUDIO_BUFFER_RESET_THRESHOLD_MS;
    if (!audioOverloaded) {
      audioBufferOverloadedSince = null;
      return;
    }
    if (audioBufferOverloadedSince == null) {
      audioBufferOverloadedSince = now;
      return;
    }
    if (now - audioBufferOverloadedSince < AUDIO_BUFFER_RESET_SUSTAIN_MS) return;
    if (
      lastAudioBufferResetAt != null &&
      now - lastAudioBufferResetAt < AUDIO_BUFFER_RESET_COOLDOWN_MS
    ) {
      return;
    }
    lastAudioBufferResetAt = now;
    audioBufferOverloadedSince = null;
    pushVideoEvent('audio-buffer-reset');
    resetAudioElement();
  },
);

watch(
  () => videoPlayoutDelayMs.value,
  (videoValue) => {
    if (!isConnected.value || !isTabActive()) {
      resetVideoDrainState();
      return;
    }
    if (typeof videoValue !== 'number' || !Number.isFinite(videoValue)) return;
    const now = Date.now();
    const baseTargetMs = resolveVideoBaseTargetMs();
    const fps = typeof config.fps === 'number' && Number.isFinite(config.fps) ? config.fps : 60;
    const frameMs = maxFrameAgeMsFromFrames(fps, 1);
    if (
      typeof videoLatencyProfile.runawayDrainTriggerMs === 'number' &&
      videoValue >= videoLatencyProfile.runawayDrainTriggerMs
    ) {
      if (videoRunawayDrainSince == null) {
        videoRunawayDrainSince = now;
      }
      if (
        !videoRunawayDrainLatched &&
        typeof videoLatencyProfile.runawayDrainSustainMs === 'number' &&
        now - videoRunawayDrainSince >= videoLatencyProfile.runawayDrainSustainMs
      ) {
        videoRunawayDrainLatched = true;
        triggerVideoDrainWindow(
          videoLatencyProfile.runawayDrainWindowMs ?? videoLatencyProfile.startupDrainMs,
          'runaway',
        );
      }
    } else if (videoValue <= baseTargetMs + frameMs) {
      videoRunawayDrainSince = null;
      videoRunawayDrainLatched = false;
    }

    const profileResetThreshold =
      typeof videoLatencyProfile.runawayResetThresholdMs === 'number'
        ? resolveFrameBoundedThresholdMs(
            videoLatencyProfile.runawayResetThresholdMs,
            baseTargetMs,
            frameMs,
            videoLatencyProfile.runawayResetFrameMargin ?? 10,
          )
        : undefined;
    if (profileResetThreshold != null) {
      const decision = decideLatencyFenceReset({
        valueMs: videoValue,
        thresholdMs: profileResetThreshold,
        sustainMs: videoLatencyProfile.runawayResetSustainMs ?? VIDEO_BUFFER_RESET_SUSTAIN_MS,
        cooldownMs: VIDEO_BUFFER_RESET_COOLDOWN_MS,
        overloadedSinceMs: videoRunawayOverloadedSince,
        lastResetAtMs: lastVideoBufferResetAt,
        nowMs: now,
      });
      videoRunawayOverloadedSince = decision.overloadedSinceMs;
      lastVideoBufferResetAt = decision.lastResetAtMs;
      if (decision.shouldReset) {
        handleVideoLatencyReset('video-runaway-reset', 'runaway-reset');
        return;
      }
    }
    if (lastVideoPlayoutSample) {
      const deltaMs = now - lastVideoPlayoutSample.ts;
      const deltaValue = videoValue - lastVideoPlayoutSample.value;
      if (deltaMs > 0 && deltaValue > 0) {
        const riseRate = (deltaValue * 1000) / deltaMs;
        const riseLimit = Math.max(
          videoLatencyProfile.riseLimitMinMs,
          frameMs * videoLatencyProfile.riseLimitMultiplier,
        );
        if (riseRate > riseLimit && videoValue > baseTargetMs + frameMs) {
          const until = now + videoLatencyProfile.riseGuardMs;
          videoStartupDrainUntil =
            videoStartupDrainUntil != null ? Math.max(videoStartupDrainUntil, until) : until;
          videoStartupDrainReleaseSince = null;
        }
      }
    }
    lastVideoPlayoutSample = { ts: now, value: videoValue };

    if (videoEl.value) {
      const lastAt = lastPlaybackRateUpdateAt ?? now;
      const deltaMs = Math.max(0, now - lastAt);
      lastPlaybackRateUpdateAt = now;

      const errorMs = Math.max(0, videoValue - (baseTargetMs + frameMs));
      const boostActive = modeSwitchDrainUntil != null && now <= modeSwitchDrainUntil;
      if (boostActive) {
        const boosted =
          1 +
          Math.min(
            videoLatencyProfile.playbackRateBoostMax - 1,
            errorMs / Math.max(1, frameMs * 6),
          );
        setVideoPlaybackRate(
          Math.min(videoLatencyProfile.playbackRateBoostMax, Math.max(1, boosted)),
        );
      } else if (errorMs > 0) {
        const desired =
          1 +
          Math.min(videoLatencyProfile.playbackRateMax - 1, errorMs / Math.max(1, frameMs * 10));
        setVideoPlaybackRate(Math.min(videoLatencyProfile.playbackRateMax, Math.max(1, desired)));
      } else {
        const current = videoEl.value.playbackRate ?? 1;
        if (current > 1 && deltaMs > 0) {
          const decay = (videoLatencyProfile.playbackRateDecayPerSec * deltaMs) / 1000;
          setVideoPlaybackRate(Math.max(1, current - decay));
        } else {
          setVideoPlaybackRate(1);
        }
      }
    }
    if (videoStartupDrainUntil != null) {
      if (now > videoStartupDrainUntil) {
        videoStartupDrainUntil = null;
        videoStartupDrainReleaseSince = null;
        setVideoDrainMode('off', baseTargetMs);
      } else {
        const startupTargetMs = resolveVideoStartupTargetMs();
        setVideoDrainMode('startup', baseTargetMs, startupTargetMs);
        if (videoValue <= baseTargetMs + frameMs) {
          if (videoStartupDrainReleaseSince == null) {
            videoStartupDrainReleaseSince = now;
          } else if (
            now - videoStartupDrainReleaseSince >=
            videoLatencyProfile.startupReleaseSustainMs
          ) {
            videoStartupDrainUntil = null;
            videoStartupDrainReleaseSince = null;
            setVideoDrainMode('off', baseTargetMs);
          }
        } else {
          videoStartupDrainReleaseSince = null;
        }
        return;
      }
    }
    const triggerMs = Math.max(baseTargetMs + frameMs, frameMs * 2);
    const releaseMs = Math.max(baseTargetMs + frameMs * 0.5, frameMs);

    if (videoValue >= triggerMs) {
      if (videoDrainOverloadedSince == null) {
        videoDrainOverloadedSince = now;
      }
      videoDrainReleaseSince = null;
      if (
        videoDrainMode !== 'adaptive' &&
        now - videoDrainOverloadedSince >= videoLatencyProfile.drainSustainMs
      ) {
        setVideoDrainMode('adaptive', baseTargetMs);
      }
    } else if (videoDrainMode === 'adaptive' && videoValue <= releaseMs) {
      if (videoDrainReleaseSince == null) {
        videoDrainReleaseSince = now;
      }
      if (now - videoDrainReleaseSince >= videoLatencyProfile.drainReleaseSustainMs) {
        setVideoDrainMode('off', baseTargetMs);
      }
    } else {
      videoDrainOverloadedSince = null;
      videoDrainReleaseSince = null;
      if (videoDrainMode !== 'adaptive') {
        setVideoDrainMode('off', baseTargetMs);
      }
    }
  },
);

watch(
  () => [videoPlayoutDelayMs.value, renderDelayMs.value, renderIntervalMs.value] as const,
  ([videoValue, delayValue, intervalValue]) => {
    if (!isConnected.value || !isTabActive()) {
      videoBufferOverloadedSince = null;
      videoRenderOverloadedSince = null;
      return;
    }
    const now = Date.now();
    const baseTargetMs = resolveVideoBaseTargetMs();
    const fps = typeof config.fps === 'number' && Number.isFinite(config.fps) ? config.fps : 60;
    const frameMs = maxFrameAgeMsFromFrames(fps, 1);
    const videoThresholdMs = resolveFrameBoundedThresholdMs(
      VIDEO_BUFFER_RESET_THRESHOLD_MS,
      baseTargetMs,
      frameMs,
      VIDEO_BUFFER_RESET_FRAME_MARGIN,
    );
    const videoDecision = decideLatencyFenceReset({
      valueMs: videoValue,
      thresholdMs: videoThresholdMs,
      sustainMs: VIDEO_BUFFER_RESET_SUSTAIN_MS,
      cooldownMs: VIDEO_BUFFER_RESET_COOLDOWN_MS,
      overloadedSinceMs: videoBufferOverloadedSince,
      lastResetAtMs: lastVideoBufferResetAt,
      nowMs: now,
    });
    videoBufferOverloadedSince = videoDecision.overloadedSinceMs;
    lastVideoBufferResetAt = videoDecision.lastResetAtMs;
    if (videoDecision.shouldReset) {
      handleVideoLatencyReset('video-buffer-reset', 'buffer-reset');
      return;
    }

    const renderThresholdMs = resolveFrameBoundedThresholdMs(
      VIDEO_RENDER_RESET_THRESHOLD_MS,
      baseTargetMs,
      frameMs,
      VIDEO_RENDER_RESET_FRAME_MARGIN,
    );
    const intervalThresholdMs = resolveFrameBoundedThresholdMs(
      VIDEO_INTERVAL_RESET_THRESHOLD_MS,
      baseTargetMs,
      frameMs,
      VIDEO_RENDER_RESET_FRAME_MARGIN,
    );
    const renderLagValue =
      typeof delayValue === 'number' &&
      Number.isFinite(delayValue) &&
      delayValue >= renderThresholdMs
        ? delayValue
        : typeof intervalValue === 'number' &&
            Number.isFinite(intervalValue) &&
            intervalValue >= intervalThresholdMs
          ? intervalValue
          : undefined;
    const renderDecision = decideLatencyFenceReset({
      valueMs: renderLagValue,
      thresholdMs:
        renderLagValue === intervalValue && renderLagValue !== delayValue
          ? intervalThresholdMs
          : renderThresholdMs,
      sustainMs: VIDEO_RENDER_RESET_SUSTAIN_MS,
      cooldownMs: VIDEO_BUFFER_RESET_COOLDOWN_MS,
      overloadedSinceMs: videoRenderOverloadedSince,
      lastResetAtMs: lastVideoBufferResetAt,
      nowMs: now,
    });
    videoRenderOverloadedSince = renderDecision.overloadedSinceMs;
    lastVideoBufferResetAt = renderDecision.lastResetAtMs;
    if (!renderDecision.shouldReset) {
      return;
    }
    handleVideoLatencyReset('video-render-reset', 'render-reset');
  },
);
function resetServerRates(): void {
  lastServerSample = null;
  serverVideoFps.value = undefined;
}

let serverSessionTimer: number | null = null;

function stopServerSessionPolling(): void {
  if (serverSessionTimer) {
    window.clearInterval(serverSessionTimer);
    serverSessionTimer = null;
  }
}

function startServerSessionPolling(): void {
  stopServerSessionPolling();
  if (!sessionId.value) return;
  const poll = async () => {
    if (!sessionId.value) return;
    try {
      const result = await api.getSessionState(sessionId.value);
      if (result.session) {
        serverSession.value = result.session;
        const now = Date.now();
        if (lastServerSample && typeof result.session.video_packets === 'number') {
          const dt = (now - lastServerSample.ts) / 1000;
          const packets = result.session.video_packets - (lastServerSample.videoPackets ?? 0);
          if (dt > 0) serverVideoFps.value = packets / dt;
        }
        lastServerSample = { ts: now, videoPackets: result.session.video_packets };
      }
    } catch {
      /* ignore */
    }
  };
  void poll();
  serverSessionTimer = window.setInterval(poll, 1000);
}

let webrtcDiagTimer: number | null = null;
const WEBRTC_DIAG_LOG_INTERVAL_MS = 5000;

function startWebrtcDiagnostics(): void {
  stopWebrtcDiagnostics();
  webrtcDiagTimer = window.setInterval(() => {
    if (!isConnected.value) return;
    // Diagnostics logging (simplified)
  }, WEBRTC_DIAG_LOG_INTERVAL_MS);
}

function stopWebrtcDiagnostics(): void {
  if (webrtcDiagTimer != null) {
    window.clearInterval(webrtcDiagTimer);
    webrtcDiagTimer = null;
  }
}

function stopDiagnosticsSampling(): void {
  if (diagnosticsSampleTimer != null) {
    window.clearInterval(diagnosticsSampleTimer);
    diagnosticsSampleTimer = null;
  }
}

function startDiagnosticsSampling(): void {
  stopDiagnosticsSampling();
  diagnosticsSampleTimer = window.setInterval(() => {
    if (!isConnected.value) return;
    const now = Date.now();
    const sample: DiagnosticsSample = {
      ts: now,
      pacingDtMs: videoPacingMetrics.value.dtMs ?? null,
      presentedDelta: videoPacingMetrics.value.presentedDelta ?? null,
      renderIntervalMs: renderIntervalMs.value,
      renderDelayMs: renderDelayMs.value,
      fpsReceived: inboundVideoStats.value.fpsReceived,
      fpsDecoded: inboundVideoStats.value.fpsDecoded,
      framesDropped: inboundVideoStats.value.framesDropped,
      avgJitterBufferMs: inboundVideoStats.value.avgJitterBufferMs ?? null,
      avgDecodeMsPerFrame: inboundVideoStats.value.avgDecodeMsPerFrame ?? null,
      packetsLostDelta: inboundVideoStats.value.packetsLostDelta,
      jitter: inboundVideoStats.value.jitter,
      serverQueue: serverSession.value?.video_queue_frames,
      serverInflight: serverSession.value?.video_inflight_frames,
      serverVideoAgeMs: serverSession.value?.last_video_age_ms,
      serverFps: serverVideoFps.value,
    };
    diagnosticsSamples.value.push(sample);
    const cutoff = now - DIAGNOSTICS_WINDOW_MS;
    while (diagnosticsSamples.value.length && diagnosticsSamples.value[0].ts < cutoff) {
      diagnosticsSamples.value.shift();
    }
  }, 1000);
}

function stopAudioPlayRetry(): void {
  if (audioPlayRetryTimer != null) {
    window.clearInterval(audioPlayRetryTimer);
    audioPlayRetryTimer = null;
  }
  audioPlayRetryUntilMs = null;
}

function ensureAudioPlayback(reason: string): void {
  if (!audioAutoplayRequested) return;
  if (!audioEl.value) return;
  if (!audioStream) audioStream = new MediaStream();
  if (audioEl.value.srcObject !== audioStream) audioEl.value.srcObject = audioStream;
  audioEl.value.volume = 1;
  const hasTrack = audioStream.getAudioTracks().length > 0;
  if (!hasTrack) audioEl.value.muted = true;
  const now = Date.now();
  if (now - lastAudioPlayAttemptAtMs < 250) return;
  lastAudioPlayAttemptAtMs = now;
  const playPromise = (() => {
    try {
      return audioEl.value.play();
    } catch (error) {
      const name = error && typeof error === 'object' ? (error as any).name : '';
      if (now - lastAudioPlayErrorAtMs > 1500) {
        lastAudioPlayErrorAtMs = now;
        pushVideoEvent(`audio-play-throw${name ? `:${name}` : ''}:${reason}`);
      }
      return null;
    }
  })();
  if (!playPromise || typeof (playPromise as any).then !== 'function') return;
  playPromise
    .then(() => {
      if (!audioEl.value) return;
      if (!audioEl.value.paused) {
        audioPlaybackUnlocked = true;
        if (hasTrack) stopAudioPlayRetry();
      }
    })
    .catch((error) => {
      const name = error && typeof error === 'object' ? (error as any).name : '';
      if (now - lastAudioPlayErrorAtMs > 1500) {
        lastAudioPlayErrorAtMs = now;
        pushVideoEvent(`audio-play-error${name ? `:${name}` : ''}:${reason}`);
      }
    });
}

function primeAudioAutoplay(): void {
  if (!audioEl.value) return;
  if (!audioStream) audioStream = new MediaStream();
  audioPlaybackUnlocked = false;
  audioEl.value.srcObject = audioStream;
  audioEl.value.volume = 1;
  audioEl.value.muted = true;
  stopAudioPlayRetry();
  audioPlayRetryUntilMs = Date.now() + 8000;
  audioPlayRetryTimer = window.setInterval(() => {
    if (!audioAutoplayRequested) {
      stopAudioPlayRetry();
      return;
    }
    if (audioPlayRetryUntilMs != null && Date.now() > audioPlayRetryUntilMs) {
      stopAudioPlayRetry();
      return;
    }
    ensureAudioPlayback('retry');
  }, 500);
  ensureAudioPlayback('prime');
}

function stopSessionStatusPolling(): void {
  if (sessionStatusTimer) {
    window.clearInterval(sessionStatusTimer);
    sessionStatusTimer = null;
  }
}

async function fetchSessionStatus(): Promise<void> {
  if (isConnected.value) return;
  try {
    const result = await http.get('/api/session/status', { validateStatus: () => true });
    if (result.status === 200 && result.data?.status) {
      sessionStatus.value = {
        activeSessions: Number(result.data.activeSessions ?? 0),
        appRunning: Boolean(result.data.appRunning),
        paused: Boolean(result.data.paused),
      };
      return;
    }
  } catch {
    /* ignore */
  }
  sessionStatus.value = null;
}

function startSessionStatusPolling(): void {
  stopSessionStatusPolling();
  if (isConnected.value) return;
  void fetchSessionStatus();
  sessionStatusTimer = window.setInterval(fetchSessionStatus, 5000);
}

const ESC_HOLD_MS = 2000;
let escHoldTimer: number | null = null;
let fullscreenKeyboardLockRequested = false;

function getFullscreenElement(): Element | null {
  return document.fullscreenElement ?? (document as any).webkitFullscreenElement ?? null;
}

function isIosPhone(): boolean {
  try {
    const ua = navigator.userAgent ?? '';
    return /\b(iPhone|iPod)\b/i.test(ua);
  } catch {
    return false;
  }
}

function isNativeVideoFullscreenActive(): boolean {
  if (nativeVideoFullscreen.value) return true;
  try {
    const anyVideo = videoEl.value as any;
    return Boolean(anyVideo?.webkitDisplayingFullscreen);
  } catch {
    return false;
  }
}

async function requestFullscreen(target: HTMLElement): Promise<boolean> {
  const anyTarget = target as any;
  if (typeof target.requestFullscreen === 'function') {
    try {
      await target.requestFullscreen();
      return true;
    } catch {
      /* try fallback */
    }
  }
  if (typeof anyTarget.webkitRequestFullscreen === 'function') {
    try {
      const result = anyTarget.webkitRequestFullscreen();
      if (result && typeof result.then === 'function') await result;
      return true;
    } catch {
      /* try fallback */
    }
  }
  return false;
}

function tryEnterNativeVideoFullscreen(): boolean {
  const video = videoEl.value;
  if (!video) return false;
  const anyVideo = video as any;
  const enter = anyVideo?.webkitEnterFullscreen ?? anyVideo?.webkitEnterFullScreen;
  if (typeof enter !== 'function') return false;
  try {
    enter.call(video);
    return true;
  } catch {
    return false;
  }
}

async function tryEnterFullscreen(target: HTMLElement): Promise<boolean> {
  const video = videoEl.value;
  // iOS phones are the most restrictive; prefer native video fullscreen there.
  if (isIosPhone() && video) {
    if (await requestFullscreen(video)) return true;
    if (tryEnterNativeVideoFullscreen()) return true;
    if (await requestFullscreen(target)) return true;
    return false;
  }

  if (await requestFullscreen(target)) return true;
  if (video) {
    if (await requestFullscreen(video)) return true;
    if (tryEnterNativeVideoFullscreen()) return true;
  }
  return false;
}

async function exitFullscreen(): Promise<void> {
  const anyDoc = document as any;
  if (typeof document.exitFullscreen === 'function') {
    await document.exitFullscreen();
    return;
  }
  if (typeof anyDoc.webkitExitFullscreen === 'function') {
    const result = anyDoc.webkitExitFullscreen();
    if (result && typeof result.then === 'function') await result;
  }
}

function isFullscreenActive(): boolean {
  if (isNativeVideoFullscreenActive()) return true;
  const fullscreenEl = getFullscreenElement();
  return fullscreenEl === inputTarget.value || fullscreenEl === videoEl.value;
}

function isTabActive(): boolean {
  try {
    const visible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
    const focus = typeof document !== 'undefined' && document.hasFocus ? document.hasFocus() : true;
    return visible && focus;
  } catch {
    return true;
  }
}

const onFullscreenChange = () => {
  const active = isFullscreenActive();
  if (active) pseudoFullscreen.value = false;
  isFullscreen.value = active || pseudoFullscreen.value;
  if (!isFullscreen.value) {
    cancelEscHold();
    releaseFullscreenKeyboardLock();
  }
  modeSwitchDrainUntil = Date.now() + videoLatencyProfile.modeSwitchDrainMs;
  triggerVideoDrainWindow(videoLatencyProfile.modeSwitchDrainMs, 'fullscreen');
  ensureAudioPlayback('fullscreen');
};

const onOverlayHotkey = (event: KeyboardEvent) => {
  if (!event.ctrlKey || !event.altKey || !event.shiftKey) return;
  if (event.code !== 'KeyS') return;
  event.preventDefault();
  event.stopPropagation();
  showOverlay.value = !showOverlay.value;
};

const onPageHide = () => {
  void client.disconnect({ keepalive: true });
};

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    modeSwitchDrainUntil = Date.now() + videoLatencyProfile.modeSwitchDrainMs;
    triggerVideoDrainWindow(videoLatencyProfile.modeSwitchDrainMs, 'resume');
  }
  ensureAudioPlayback('visibility');
};

const onAudioUserGesture = () => {
  if (!audioAutoplayRequested) return;
  if (audioPlayRetryUntilMs != null && Date.now() <= audioPlayRetryUntilMs) {
    ensureAudioPlayback('gesture');
    return;
  }
  if (!audioPlaybackUnlocked && isConnected.value) ensureAudioPlayback('gesture');
};

const onFullscreenEscapeDown = (event: KeyboardEvent) => {
  if (event.code !== 'Escape') return;
  if (!isFullscreen.value) return;
  if (escHoldTimer) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  escHoldTimer = window.setTimeout(async () => {
    escHoldTimer = null;
    if (getFullscreenElement()) {
      try {
        await exitFullscreen();
      } catch {
        /* ignore */
      }
    }
  }, ESC_HOLD_MS);
};

const onFullscreenEscapeUp = (event: KeyboardEvent) => {
  if (event.code !== 'Escape') return;
  if (!isFullscreen.value) return;
  event.preventDefault();
  event.stopPropagation();
  cancelEscHold();
};

function cancelEscHold() {
  if (escHoldTimer) {
    window.clearTimeout(escHoldTimer);
    escHoldTimer = null;
  }
}

function requestFullscreenKeyboardLock(): void {
  if (fullscreenKeyboardLockRequested) return;
  fullscreenKeyboardLockRequested = true;
  void requestKeyboardLock().then((locked) => {
    if (!locked) fullscreenKeyboardLockRequested = false;
  });
}

function releaseFullscreenKeyboardLock(): void {
  if (!fullscreenKeyboardLockRequested) return;
  fullscreenKeyboardLockRequested = false;
  releaseKeyboardLock();
}

function formatKbps(value?: number): string {
  return value ? `${value.toFixed(0)} kbps` : '--';
}
function formatMs(value?: number): string {
  return value != null ? `${value.toFixed(1)} ms` : '--';
}
function displayValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? '--' : String(value);
}

function pushVideoEvent(label: string): void {
  const stamp = new Date().toLocaleTimeString();
  videoEvents.value = [`${stamp} ${label}`, ...videoEvents.value].slice(0, 8);
  videoStateTick.value += 1;
}

function updateRemoteStreamInfo(stream: MediaStream): void {
  remoteStreamInfo.value = {
    id: stream.id,
    videoTracks: stream.getVideoTracks().length,
    audioTracks: stream.getAudioTracks().length,
  };
}

function updateVideoElement(stream: MediaStream): boolean {
  if (!videoEl.value) return false;
  const videoTracks = stream.getVideoTracks();
  if (!videoTracks.length) return false;
  if (!videoStream) videoStream = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => videoStream!.removeTrack(t));
  videoTracks.forEach((t) => videoStream!.addTrack(t));
  videoEl.value.srcObject = videoStream;
  return true;
}

function updateAudioElement(stream: MediaStream): void {
  if (!audioEl.value) return;
  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) return;
  if (!audioStream) audioStream = new MediaStream();
  audioStream.getAudioTracks().forEach((t) => audioStream!.removeTrack(t));
  audioTracks.forEach((t) => audioStream!.addTrack(t));
  audioEl.value.srcObject = audioStream;
  audioEl.value.muted = false;
}

function resetVideoElement(): void {
  const el = videoEl.value;
  const stream =
    videoStream ?? (el?.srcObject instanceof MediaStream ? (el.srcObject as MediaStream) : null);
  if (!el || !stream || stream.getVideoTracks().length === 0) return;

  videoFrameMetrics.value = {};
  videoPacingMetrics.value = {};
  lastPlaybackRateUpdateAt = null;

  try {
    el.pause();
  } catch {
    /* ignore */
  }
  try {
    el.srcObject = null;
    el.load();
  } catch {
    /* ignore */
  }

  window.requestAnimationFrame(() => {
    if (videoEl.value !== el) return;
    try {
      el.srcObject = stream;
      el.muted = false;
      el.volume = 1;
      el.playbackRate = 1;
    } catch {
      /* ignore */
    }
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        const name = error && typeof error === 'object' ? (error as any).name : '';
        pushVideoEvent(`play-reset-error${name ? `:${name}` : ''}`);
      });
    }
  });
}

function resetAudioElement(): void {
  const el = audioEl.value;
  const stream =
    audioStream ?? (el?.srcObject instanceof MediaStream ? (el.srcObject as MediaStream) : null);
  if (!el || !stream) return;

  try {
    el.pause();
  } catch {
    /* ignore */
  }
  try {
    el.srcObject = null;
    el.load();
  } catch {
    /* ignore */
  }

  audioPlaybackUnlocked = false;
  window.requestAnimationFrame(() => {
    if (audioEl.value !== el) return;
    const hasTrack = stream.getAudioTracks().length > 0;
    try {
      el.srcObject = stream;
      el.volume = 1;
      el.muted = !hasTrack;
    } catch {
      /* ignore */
    }
    ensureAudioPlayback('reset');
  });
}

function attachVideoDebug(el: HTMLVideoElement): () => void {
  const events = [
    'loadedmetadata',
    'canplay',
    'playing',
    'waiting',
    'stalled',
    'suspend',
    'error',
    'ended',
  ];
  const handlers = events.map((event) => {
    const handler = () => {
      pushVideoEvent(event);
      videoStateTick.value++;
    };
    el.addEventListener(event, handler);
    return { event, handler };
  });
  return () => {
    handlers.forEach(({ event, handler }) => el.removeEventListener(event, handler));
  };
}

function attachVideoFrameMetrics(el: HTMLVideoElement): () => void {
  const intervalSamples: number[] = [];
  const delaySamples: number[] = [];
  const maxSamples = 120;
  let lastTs: number | null = null;

  if ('requestVideoFrameCallback' in el) {
    let handle = 0;
    const cb = (now: number, meta: VideoFrameCallbackMetadata) => {
      const interval = lastTs != null ? now - lastTs : null;
      lastTs = now;
      const delay = computeVideoFrameRenderDelayMs(now, meta.expectedDisplayTime);
      const nextMetrics = { ...videoFrameMetrics.value };
      if (interval != null) {
        intervalSamples.push(interval);
        if (intervalSamples.length > maxSamples) intervalSamples.shift();
        const sorted = [...intervalSamples].sort((a, b) => a - b);
        const p98Idx = Math.floor(sorted.length * 0.98);
        const p99Idx = Math.floor(sorted.length * 0.99);
        Object.assign(nextMetrics, {
          lastIntervalMs: interval,
          avgIntervalMs: sorted.reduce((a, b) => a + b, 0) / sorted.length,
          maxIntervalMs: sorted[sorted.length - 1],
          p98IntervalMs: sorted[p98Idx],
          avg98IntervalMs: sorted.slice(0, p98Idx + 1).reduce((a, b) => a + b, 0) / (p98Idx + 1),
          p99IntervalMs: sorted[p99Idx],
          avg99IntervalMs: sorted.slice(0, p99Idx + 1).reduce((a, b) => a + b, 0) / (p99Idx + 1),
        });
      }
      if (delay != null) {
        delaySamples.push(delay);
        if (delaySamples.length > maxSamples) delaySamples.shift();
        const sortedDelay = [...delaySamples].sort((a, b) => a - b);
        Object.assign(nextMetrics, {
          lastDelayMs: delay,
          avgDelayMs: sortedDelay.reduce((a, b) => a + b, 0) / sortedDelay.length,
          maxDelayMs: sortedDelay[sortedDelay.length - 1],
        });
      }
      if (interval != null || delay != null) {
        videoFrameMetrics.value = nextMetrics;
      }
      handle = el.requestVideoFrameCallback(cb);
    };
    handle = el.requestVideoFrameCallback(cb);
    return () => {
      if (handle) el.cancelVideoFrameCallback(handle);
    };
  }

  let rafId = 0;
  let lastT = el.currentTime;
  const raf = (now: number) => {
    if (el.currentTime !== lastT) {
      const interval = lastTs != null ? now - lastTs : null;
      lastTs = now;
      lastT = el.currentTime;
      if (interval != null) {
        intervalSamples.push(interval);
        if (intervalSamples.length > maxSamples) intervalSamples.shift();
        videoFrameMetrics.value = {
          lastIntervalMs: interval,
          avgIntervalMs: intervalSamples.reduce((a, b) => a + b, 0) / intervalSamples.length,
        };
      }
    }
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
  return () => cancelAnimationFrame(rafId);
}

function attachVideoPacingProbe(
  el: HTMLVideoElement,
  onSample: (sample: {
    dtMs?: number | null;
    presentedDelta?: number | null;
    now?: number;
    expectedDisplayTime?: number;
    mediaTime?: number;
    processingDuration?: number;
    receiveTime?: number;
    rtpTimestamp?: number;
  }) => void,
): () => void {
  if ('requestVideoFrameCallback' in el) {
    let handle = 0;
    let lastNow: number | null = null;
    let lastPresented: number | null = null;
    const cb = (now: number, meta: VideoFrameCallbackMetadata) => {
      const dtMs = lastNow != null ? now - lastNow : null;
      const presentedFrames = (meta as any).presentedFrames;
      const presentedDelta =
        lastPresented != null && typeof presentedFrames === 'number'
          ? presentedFrames - lastPresented
          : null;
      const metaAny = meta as any;
      onSample({
        dtMs,
        presentedDelta,
        now,
        expectedDisplayTime: meta.expectedDisplayTime,
        mediaTime: meta.mediaTime,
        processingDuration: metaAny.processingDuration,
        receiveTime: metaAny.receiveTime,
        rtpTimestamp: metaAny.rtpTimestamp,
      });
      lastPresented = presentedFrames ?? lastPresented;
      lastNow = now;
      handle = el.requestVideoFrameCallback(cb);
    };
    handle = el.requestVideoFrameCallback(cb);
    return () => {
      if (handle) el.cancelVideoFrameCallback(handle);
    };
  }

  let rafId = 0;
  let lastT = el.currentTime;
  const raf = (now: number) => {
    if (el.currentTime !== lastT) {
      onSample({ dtMs: null, presentedDelta: null, now, mediaTime: el.currentTime });
      lastT = el.currentTime;
    }
    rafId = requestAnimationFrame(raf);
  };
  rafId = requestAnimationFrame(raf);
  return () => cancelAnimationFrame(rafId);
}

function startInboundVideoStats(
  pc: RTCPeerConnection,
  onStats: (stats: {
    fpsReceived?: number;
    fpsDecoded?: number;
    framesDropped?: number;
    avgJitterBufferMs?: number | null;
    avgDecodeMsPerFrame?: number | null;
    packetsLostDelta?: number;
    jitter?: number;
  }) => void,
  intervalMs = 1000,
): () => void {
  let prev: {
    now: number;
    framesReceived?: number;
    framesDecoded?: number;
    framesDropped?: number;
    packetsLost?: number;
    jitter?: number;
    jitterBufferDelay?: number;
    jitterBufferEmittedCount?: number;
    totalDecodeTime?: number;
  } | null = null;
  const id = window.setInterval(async () => {
    try {
      const report = await pc.getStats();
      let best: any = null;
      report.forEach((s) => {
        if (s.type !== 'inbound-rtp') return;
        if (s.kind !== 'video' && s.mediaType !== 'video') return;
        const frames = typeof s.framesReceived === 'number' ? s.framesReceived : 0;
        if (!best || frames > (best.framesReceived ?? 0)) best = s;
      });
      if (!best) return;
      const now = performance.now();
      const cur = {
        now,
        framesReceived: best.framesReceived,
        framesDecoded: best.framesDecoded,
        framesDropped: best.framesDropped,
        packetsLost: best.packetsLost,
        jitter: best.jitter,
        jitterBufferDelay: best.jitterBufferDelay,
        jitterBufferEmittedCount: best.jitterBufferEmittedCount,
        totalDecodeTime: best.totalDecodeTime,
      };
      if (prev) {
        const dt = (cur.now - prev.now) / 1000;
        const dRecv =
          typeof cur.framesReceived === 'number' && typeof prev.framesReceived === 'number'
            ? cur.framesReceived - prev.framesReceived
            : undefined;
        const dDec =
          typeof cur.framesDecoded === 'number' && typeof prev.framesDecoded === 'number'
            ? cur.framesDecoded - prev.framesDecoded
            : undefined;
        const dDrop =
          typeof cur.framesDropped === 'number' && typeof prev.framesDropped === 'number'
            ? cur.framesDropped - prev.framesDropped
            : undefined;
        const avgJbMs =
          typeof cur.jitterBufferDelay === 'number' &&
          typeof cur.jitterBufferEmittedCount === 'number' &&
          cur.jitterBufferEmittedCount > 0
            ? (cur.jitterBufferDelay / cur.jitterBufferEmittedCount) * 1000
            : null;
        const avgDecodeMs =
          typeof cur.totalDecodeTime === 'number' &&
          typeof cur.framesDecoded === 'number' &&
          cur.framesDecoded > 0
            ? (cur.totalDecodeTime / cur.framesDecoded) * 1000
            : null;
        onStats({
          fpsReceived: typeof dRecv === 'number' ? dRecv / dt : undefined,
          fpsDecoded: typeof dDec === 'number' ? dDec / dt : undefined,
          framesDropped: typeof dDrop === 'number' ? dDrop : undefined,
          avgJitterBufferMs: avgJbMs,
          avgDecodeMsPerFrame: avgDecodeMs,
          packetsLostDelta:
            typeof cur.packetsLost === 'number' && typeof prev.packetsLost === 'number'
              ? cur.packetsLost - prev.packetsLost
              : undefined,
          jitter: cur.jitter,
        });
      }
      prev = cur;
    } catch {
      /* ignore */
    }
  }, intervalMs);
  return () => {
    window.clearInterval(id);
  };
}

async function confirmTerminateAndConnect(): Promise<void> {
  dialog.warning({
    title: t('webrtc.terminate_confirm_title'),
    content: t('webrtc.terminate_confirm_message', {
      app: selectedAppName.value ?? t('webrtc.terminate_confirm_app_fallback'),
    }),
    positiveText: t('webrtc.terminate_confirm_action'),
    negativeText: t('_common.cancel'),
    onPositiveClick: async () => {
      await terminateSession();
      await startConnect();
    },
  });
}

async function waitForSpinnerFrame(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function startConnect() {
  isConnecting.value = true;
  // Yield to allow the connecting spinner to render and start animating before heavy work
  await waitForSpinnerFrame();
  negotiatedEncoding.value = null;
  hdrRuntimeWarning.value = null;
  audioAutoplayRequested = true;
  primeAudioAutoplay();
  resetAudioDrainState();
  client.setAudioLatencyTargets(AUDIO_TARGET_BUFFER_MS, AUDIO_TARGET_PLAYOUT_MS);
  if (autoFullscreen.value && inputTarget.value && !isFullscreen.value) {
    try {
      const target = inputTarget.value;
      const entered = await tryEnterFullscreen(target);
      if (!entered) pseudoFullscreen.value = true;
      onFullscreenChange();
      try {
        target.focus();
      } catch {
        /* ignore */
      }
      requestFullscreenKeyboardLock();
    } catch {
      /* ignore */
    }
  }
  ensureAudioPlayback('connect');
  stopServerSessionPolling();
  sessionId.value = null;
  serverSession.value = null;
  resetServerRates();
  try {
    // Determine app launch mode:
    // - If an app is selected, launch that app (appId = selectedAppId, resume = false)
    // - If no app selected but session can be resumed, resume it (appId = undefined, resume = true)
    // - If no app selected and nothing to resume, start desktop (appId = undefined, resume = false)
    const shouldResume = !selectedAppId.value && resumeOnConnect.value && resumeAvailable.value;
    const effectiveAppId = selectedAppId.value ?? undefined;
    const id = await client.connect(
      { ...config, appId: effectiveAppId, resume: shouldResume },
      {
        onRemoteStream: (stream) => {
          if (videoEl.value) {
            const hasVideo = updateVideoElement(stream);
            videoEl.value.muted = false;
            videoEl.value.volume = 1;
            updateRemoteStreamInfo(stream);
            updateAudioElement(stream);
            ensureAudioPlayback('remote-stream');
            if (hasVideo) {
              videoStartupDrainUntil = Date.now() + videoLatencyProfile.startupDrainMs;
              videoStartupDrainReleaseSince = null;
              const baseTargetMs = resolveVideoBaseTargetMs();
              setVideoDrainMode('startup', baseTargetMs, resolveVideoStartupTargetMs());
              const playPromise = videoEl.value.play();
              if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((error) => {
                  const name = error && typeof error === 'object' ? (error as any).name : '';
                  pushVideoEvent(`play-error${name ? `:${name}` : ''}`);
                });
              }
            }
          }
        },
        onConnectionState: (state) => {
          connectionState.value = state;
          isConnected.value = state === 'connected';
          if (state === 'connected') {
            applyVideoTargetMs(resolveVideoBaseTargetMs());
            if (!stopInboundVideoStatsTimer) {
              const pc = client.peerConnection;
              if (pc)
                stopInboundVideoStatsTimer = startInboundVideoStats(pc, (sample) => {
                  inboundVideoStats.value = sample;
                });
            }
            if (!diagnosticsSampleTimer) startDiagnosticsSampling();
          } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            if (stopInboundVideoStatsTimer) {
              stopInboundVideoStatsTimer();
              stopInboundVideoStatsTimer = null;
            }
            inboundVideoStats.value = {};
            stopDiagnosticsSampling();
            diagnosticsSamples.value = [];
          }
        },
        onIceState: (state) => {
          iceState.value = state;
        },
        onInputChannelState: (state) => {
          inputChannelState.value = state;
        },
        onInputMessage: (message) => {
          applyGamepadFeedback(message);
        },
        onStats: (snapshot) => {
          stats.value = snapshot;
        },
        onNegotiatedEncoding: (encoding) => {
          if (encoding === 'h264' || encoding === 'hevc' || encoding === 'av1')
            negotiatedEncoding.value = encoding;
        },
        onWarning: (warning) => {
          notifyWarning('Configuration Warning', warning);
          if (config.hdr && /^hdr\b/i.test(warning)) hdrRuntimeWarning.value = warning;
        },
      },
      { inputPriority: isFullscreenActive() || isTabActive() ? 'high' : 'low' },
    );
    sessionId.value = id;
    startServerSessionPolling();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to establish WebRTC session.';
    notifyError('Connection Failed', msg);
    console.error(error);
    audioAutoplayRequested = false;
    stopAudioPlayRetry();
  } finally {
    isConnecting.value = false;
    if (!isConnected.value) startSessionStatusPolling();
  }
}

async function connect() {
  if (isConnecting.value) return;
  // Always fetch session status to know if we can resume
  if (!sessionStatus.value) await fetchSessionStatus();
  if (selectedAppId.value && hasRunningSession.value) {
    await confirmTerminateAndConnect();
    return;
  }
  await startConnect();
}

async function disconnect() {
  await client.disconnect();
  stopServerSessionPolling();
  isConnected.value = false;
  connectionState.value = null;
  iceState.value = null;
  inputChannelState.value = null;
  stats.value = {};
  inputMetrics.value = {};
  inputBufferedAmount.value = null;
  videoFrameMetrics.value = {};
  videoPacingMetrics.value = {};
  inboundVideoStats.value = {};
  diagnosticsSamples.value = [];
  stopDiagnosticsSampling();
  if (stopInboundVideoStatsTimer) {
    stopInboundVideoStatsTimer();
    stopInboundVideoStatsTimer = null;
  }
  smoothedVideoFps.value = undefined;
  lastVideoFpsSampleAt = null;
  lastPlaybackRateUpdateAt = null;
  modeSwitchDrainUntil = null;
  detachInputCapture();
  if (videoEl.value) {
    try {
      videoEl.value.playbackRate = 1;
    } catch {
      /* ignore */
    }
    videoEl.value.srcObject = null;
  }
  if (audioEl.value) audioEl.value.srcObject = null;
  videoStream = null;
  audioStream = null;
  audioAutoplayRequested = false;
  stopAudioPlayRetry();
  resetAudioDrainState();
  resetVideoDrainState();
  lastVideoTargetMs = undefined;
  desiredVideoTargetMs = undefined;
  effectiveVideoTargetMs = undefined;
  lastVideoTargetAdjustAt = null;
  videoStartupDrainUntil = null;
  videoStartupDrainReleaseSince = null;
  videoRunawayDrainSince = null;
  videoRunawayDrainLatched = false;
  resetVideoLatencyFenceState();
  lastVideoBufferResetAt = null;
  sessionId.value = null;
  serverSession.value = null;
  resetServerRates();
  remoteStreamInfo.value = null;
  lastTrackSnapshot = null;
  videoEvents.value = [];
  videoStateTick.value += 1;
  startSessionStatusPolling();
}

async function terminateSession() {
  if (terminatePending.value) return;
  terminatePending.value = true;
  try {
    await http.post('/api/apps/close', {}, { validateStatus: () => true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to terminate session.';
    notifyError('Termination Failed', msg);
  } finally {
    await disconnect();
    terminatePending.value = false;
  }
}

async function toggleFullscreen() {
  try {
    if (pseudoFullscreen.value && !isFullscreenActive()) {
      pseudoFullscreen.value = false;
      onFullscreenChange();
      releaseFullscreenKeyboardLock();
      return;
    }
    if (isFullscreenActive()) {
      await exitFullscreen();
      releaseFullscreenKeyboardLock();
      return;
    }
    if (!inputTarget.value) return;
    const target = inputTarget.value;
    const entered = await tryEnterFullscreen(target);
    if (!entered) pseudoFullscreen.value = true;
    onFullscreenChange();
    requestFullscreenKeyboardLock();
    try {
      target.focus();
    } catch {
      /* ignore */
    }
    requestFullscreenKeyboardLock();
  } catch {
    /* ignore */
  }
}

async function onFullscreenDblClick() {
  if (isFullscreenActive()) return;
  await toggleFullscreen();
}

function detachInputCapture() {
  if (detachInput) {
    detachInput();
    detachInput = null;
  }
}

watch(
  () => [inputEnabled.value, isConnected.value],
  ([enabled, connected]) => {
    detachInputCapture();
    if (!enabled || !connected || !inputTarget.value) {
      releaseFullscreenKeyboardLock();
      return;
    }
    detachInput = attachInputCapture(
      inputTarget.value,
      (payload) => {
        client.sendInput(payload);
        inputBufferedAmount.value = client.inputChannelBufferedAmount ?? null;
      },
      {
        video: videoEl.value,
        onMetrics: (metrics) => {
          inputMetrics.value = metrics;
        },
        shouldDrop: shouldDropInput,
      },
    );
    if (isFullscreenActive()) requestFullscreenKeyboardLock();
  },
);

function attachVideoFullscreenEvents(el: HTMLVideoElement): () => void {
  const onBegin = () => {
    nativeVideoFullscreen.value = true;
    onFullscreenChange();
  };
  const onEnd = () => {
    nativeVideoFullscreen.value = false;
    onFullscreenChange();
  };
  el.addEventListener('webkitbeginfullscreen', onBegin as EventListener);
  el.addEventListener('webkitendfullscreen', onEnd as EventListener);
  return () => {
    el.removeEventListener('webkitbeginfullscreen', onBegin as EventListener);
    el.removeEventListener('webkitendfullscreen', onEnd as EventListener);
  };
}

watch(videoEl, (el) => {
  if (detachVideoEvents) {
    detachVideoEvents();
    detachVideoEvents = null;
  }
  if (detachVideoFrames) {
    detachVideoFrames();
    detachVideoFrames = null;
  }
  if (detachVideoPacing) {
    detachVideoPacing();
    detachVideoPacing = null;
  }
  if (detachVideoFullscreenEvents) {
    detachVideoFullscreenEvents();
    detachVideoFullscreenEvents = null;
  }
  if (!el) return;
  detachVideoEvents = attachVideoDebug(el);
  detachVideoFrames = attachVideoFrameMetrics(el);
  detachVideoPacing = attachVideoPacingProbe(el, (sample) => {
    videoPacingMetrics.value = sample;
  });
  detachVideoFullscreenEvents = attachVideoFullscreenEvents(el);
});

onBeforeUnmount(() => {
  setWebRtcActive(false);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('pointerdown', onAudioUserGesture as EventListener, true);
  window.removeEventListener('keydown', onAudioUserGesture as EventListener, true);
  window.removeEventListener('keydown', onOverlayHotkey, true);
  window.removeEventListener('keydown', onFullscreenEscapeDown, true);
  window.removeEventListener('keyup', onFullscreenEscapeUp, true);
  window.removeEventListener('pagehide', onPageHide);
  cancelEscHold();
  if (detachVideoEvents) {
    detachVideoEvents();
    detachVideoEvents = null;
  }
  if (detachVideoFrames) {
    detachVideoFrames();
    detachVideoFrames = null;
  }
  if (detachVideoPacing) {
    detachVideoPacing();
    detachVideoPacing = null;
  }
  if (detachVideoFullscreenEvents) {
    detachVideoFullscreenEvents();
    detachVideoFullscreenEvents = null;
  }
  if (stopInboundVideoStatsTimer) {
    stopInboundVideoStatsTimer();
    stopInboundVideoStatsTimer = null;
  }
  stopDiagnosticsSampling();
  stopWebrtcDiagnostics();
  stopSessionStatusPolling();
  releaseFullscreenKeyboardLock();
  stopServerSessionPolling();
  void disconnect();
});

onMounted(async () => {
  loadCachedConfig();
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pointerdown', onAudioUserGesture as EventListener, true);
  window.addEventListener('keydown', onAudioUserGesture as EventListener, true);
  window.addEventListener('keydown', onOverlayHotkey, true);
  window.addEventListener('keydown', onFullscreenEscapeDown, true);
  window.addEventListener('keyup', onFullscreenEscapeUp, true);
  window.addEventListener('pagehide', onPageHide);
  try {
    await appsStore.loadApps(true);
  } catch {
    /* ignore */
  }
  encodingSupport.value = detectEncodingSupport();
  if (config.hdr) ensureHdrEncoding();
  startSessionStatusPolling();
});

watch(
  () => isConnected.value,
  (connected) => {
    if (connected) {
      stopSessionStatusPolling();
      startWebrtcDiagnostics();
      return;
    }
    stopWebrtcDiagnostics();
    startSessionStatusPolling();
  },
);
</script>
<style scoped>
/* ═══════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════ */
.xn-root {
  position: relative;
  min-height: 100vh;
  background: #0e0e0e;
  color: #f0f0f0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}

/* ═══════════════════════════════════════════════════════
   TOP NAV
═══════════════════════════════════════════════════════ */
.xn-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 56px;
  background: rgba(14,14,14,0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.xn-nav-left { display: flex; align-items: center; }
.xn-nav-right { display: flex; align-items: center; gap: 1rem; }

.xn-logo { display: flex; align-items: center; gap: 0.5rem; }
.xn-logo-icon { color: #107c10; font-size: 1.3rem; }
.xn-logo-brand { font-weight: 800; font-size: 1rem; letter-spacing: 0.05em; color: #fff; }
.xn-logo-accent { color: #107c10; }
.xn-logo-divider { color: #444; margin: 0 0.25rem; }
.xn-logo-sub { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.15em; color: #888; text-transform: uppercase; }

.xn-nav-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  color: #ccc;
  border-radius: 6px;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.xn-nav-btn:hover, .xn-nav-btn.active { background: rgba(255,255,255,0.1); color: #fff; border-color: rgba(255,255,255,0.25); }

.xn-status-badge {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.75rem; font-weight: 600;
  padding: 4px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #999;
}
.xn-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #555; }
.xn-status-badge.connected { color: #4ade80; border-color: rgba(74,222,128,0.3); background: rgba(74,222,128,0.08); }
.xn-status-badge.connected .xn-status-dot { background: #4ade80; box-shadow: 0 0 6px #4ade80; }
.xn-status-badge.connecting { color: #fbbf24; border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.08); }
.xn-status-badge.connecting .xn-status-dot { background: #fbbf24; }

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
.xn-hero {
  position: relative;
  height: 340px;
  overflow: hidden;
}
.xn-hero-bg { position: absolute; inset: 0; }
.xn-hero-bg-img {
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: blur(2px) brightness(0.55);
  transform: scale(1.05);
}
.xn-hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(14,14,14,0.95) 35%, rgba(14,14,14,0.4) 70%, rgba(14,14,14,0.1) 100%),
              linear-gradient(to top, rgba(14,14,14,1) 0%, transparent 50%);
}
.xn-hero-content {
  position: relative; z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 2.5rem 2.5rem;
  gap: 1.25rem;
}
.xn-hero-meta { display: flex; flex-direction: column; gap: 0.4rem; max-width: 480px; }
.xn-hero-tag { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #107c10; }
.xn-hero-title { font-size: 2.4rem; font-weight: 800; line-height: 1.1; color: #fff; margin: 0; }
.xn-hero-sub { font-size: 0.85rem; color: #aaa; margin: 0; }
.xn-hero-badges { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.xn-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.72rem; font-weight: 600;
  padding: 3px 10px; border-radius: 4px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #ccc;
}
.xn-hero-actions { display: flex; align-items: center; gap: 0.75rem; }
.xn-play-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 28px; border-radius: 4px;
  background: #107c10;
  color: #fff;
  border: none;
  font-size: 1rem; font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  letter-spacing: 0.02em;
}
.xn-play-btn:hover:not(:disabled) { background: #13a013; }
.xn-play-btn:disabled { background: #1a4a1a; color: #5a8a5a; cursor: not-allowed; }
.xn-hero-icon-btn {
  width: 44px; height: 44px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #ccc;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 1rem;
  transition: all 0.2s;
}
.xn-hero-icon-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

/* ═══════════════════════════════════════════════════════
   BODY
═══════════════════════════════════════════════════════ */
.xn-body { padding: 1.5rem 2rem 4rem; }

/* Search */
.xn-search-row { margin-bottom: 1.75rem; }
.xn-search-box {
  position: relative;
  max-width: 360px;
  display: flex; align-items: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0 12px;
  gap: 8px;
  transition: border-color 0.2s;
}
.xn-search-box:focus-within { border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.08); }
.xn-search-box i { color: #666; font-size: 0.85rem; flex-shrink: 0; }
.xn-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #f0f0f0;
  font-size: 0.9rem;
  padding: 10px 0;
}
.xn-search-input::placeholder { color: #555; }
.xn-search-clear { background: transparent; border: none; color: #666; cursor: pointer; padding: 4px; }
.xn-search-clear:hover { color: #aaa; }

/* Rows */
.xn-row { margin-bottom: 2.5rem; }
.xn-row-header {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 1rem;
}
.xn-row-title { font-size: 1.1rem; font-weight: 700; color: #f0f0f0; }
.xn-row-count { font-size: 0.75rem; color: #666; }

/* Tile track — horizontal scroll */
.xn-tiles-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: #333 transparent;
}
.xn-tiles-track::-webkit-scrollbar { height: 4px; }
.xn-tiles-track::-webkit-scrollbar-track { background: transparent; }
.xn-tiles-track::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

/* Individual tile */
.xn-tile {
  position: relative;
  flex-shrink: 0;
  width: 150px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}
.xn-tile:hover { transform: scale(1.05); box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
.xn-tile.selected { border-color: #107c10; box-shadow: 0 0 0 1px #107c10, 0 8px 24px rgba(16,124,16,0.4); }
.xn-tile.running { border-color: #4ade80; }
.xn-tile-cover { position: relative; aspect-ratio: 3/4; background: #1a1a1a; }
.xn-tile-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.xn-tile-hover {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s;
}
.xn-tile:hover .xn-tile-hover { opacity: 1; }
.xn-tile-play { font-size: 2rem; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.8); }
.xn-tile-footer {
  position: absolute; bottom: 6px; left: 6px;
  display: flex; gap: 4px;
}
.xn-tile-badge {
  width: 22px; height: 22px;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem;
}
.xn-badge-xn { background: #107c10; color: #fff; }
.xn-badge-ctrl { background: rgba(0,0,0,0.7); color: #ccc; border: 1px solid rgba(255,255,255,0.1); }

/* List grid for apps without cover */
.xn-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }
.xn-list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.xn-list-item:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
.xn-list-item.selected { border-color: #107c10; background: rgba(16,124,16,0.1); }
.xn-list-icon {
  width: 40px; height: 40px; border-radius: 6px;
  background: rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  color: #888; font-size: 1rem; flex-shrink: 0;
}
.xn-list-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.xn-list-name { font-size: 0.9rem; font-weight: 600; color: #f0f0f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.xn-list-sub { font-size: 0.72rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.xn-list-play {
  width: 32px; height: 32px; border-radius: 50%;
  background: #107c10; color: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; cursor: pointer; flex-shrink: 0;
  opacity: 0; transition: opacity 0.15s;
}
.xn-list-item:hover .xn-list-play { opacity: 1; }

/* Empty state */
.xn-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem 2rem; color: #555; text-align: center; }
.xn-empty-icon { font-size: 2.5rem; }
.xn-clear-btn { padding: 8px 20px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #ccc; cursor: pointer; }

/* Resume banner */
.xn-resume-bar {
  display: flex; align-items: center; gap: 1rem;
  padding: 14px 20px; border-radius: 8px;
  background: rgba(16,124,16,0.15);
  border: 1px solid rgba(16,124,16,0.3);
  color: #ccc; font-size: 0.9rem;
  margin-bottom: 1.5rem;
}
.xn-resume-bar i { color: #4ade80; }
.xn-resume-btn {
  margin-left: auto; padding: 7px 18px; border-radius: 5px;
  background: #107c10; color: #fff; border: none;
  font-weight: 700; cursor: pointer; font-size: 0.85rem;
}

/* ═══════════════════════════════════════════════════════
   SETTINGS PANEL
═══════════════════════════════════════════════════════ */
.xn-settings {
  position: fixed; top: 56px; right: 0; bottom: 0;
  width: 320px; z-index: 200;
  background: #161616;
  border-left: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column;
  overflow-y: auto;
}
.xn-settings-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.xn-settings-header h3 { font-size: 1rem; font-weight: 700; color: #f0f0f0; margin: 0; }
.xn-close-btn { background: transparent; border: none; color: #888; font-size: 1rem; cursor: pointer; padding: 4px; }
.xn-close-btn:hover { color: #fff; }
.xn-settings-body { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
.xn-setting-group { display: flex; flex-direction: column; gap: 0.5rem; }
.xn-setting-row { flex-direction: row !important; align-items: center; justify-content: space-between; }
.xn-setting-label { font-size: 0.8rem; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.06em; }
.xn-preset-row { display: flex; gap: 6px; flex-wrap: wrap; }
.xn-preset-btn {
  padding: 6px 14px; border-radius: 5px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #ccc; font-size: 0.82rem; cursor: pointer;
  transition: all 0.15s;
}
.xn-preset-btn:hover { background: rgba(255,255,255,0.12); }
.xn-preset-btn.active { background: #107c10; border-color: #107c10; color: #fff; font-weight: 700; }
.xn-backdrop {
  position: fixed; inset: 0; z-index: 190;
  background: rgba(0,0,0,0.4);
}

/* Settings slide animation */
.settings-slide-enter-active, .settings-slide-leave-active { transition: transform 0.25s ease; }
.settings-slide-enter-from, .settings-slide-leave-to { transform: translateX(100%); }

/* ═══════════════════════════════════════════════════════
   STREAM OVERLAY
═══════════════════════════════════════════════════════ */
.xn-stream-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: #000;
  display: flex; align-items: center; justify-content: center;
}
.xn-starting-screen {
  display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
  color: #ccc;
}
.xn-starting-logo { display: flex; align-items: center; gap: 0.5rem; font-size: 1.5rem; font-weight: 800; }
.xn-starting-logo i { color: #107c10; }
.xn-starting-logo span span { color: #107c10; }
.xn-starting-spinner { font-size: 2rem; color: #107c10; }
.xn-starting-label { font-size: 0.9rem; color: #777; }
.xn-video-container { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
.xn-video-container.visible { opacity: 1; }
.xn-video { width: 100%; height: 100%; object-fit: contain; display: block; }

/* HUD */
.xn-hud {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
}
.xn-hud.show { opacity: 1; pointer-events: all; }
.xn-hud-left, .xn-hud-right, .xn-hud-stats { display: flex; align-items: center; gap: 1rem; }
.xn-hud-app { font-size: 0.85rem; font-weight: 600; color: #ddd; }
.xn-hud-stats span { font-size: 0.75rem; color: #aaa; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; }
.xn-hud-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 5px;
  background: rgba(239,68,68,0.85); color: #fff;
  border: none; font-size: 0.82rem; font-weight: 600;
  cursor: pointer;
}
.xn-hud-btn:hover { background: rgba(239,68,68,1); }

/* Notifications */
.xn-notif {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border-radius: 10px; max-width: 380px;
  background: #1e1e1e; border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  color: #f0f0f0;
}
.xn-notif.error { border-color: rgba(239,68,68,0.4); background: rgba(30,10,10,0.95); }
.xn-notif.error i { color: #f87171; }
.xn-notif.success { border-color: rgba(74,222,128,0.4); }
.xn-notif.success i { color: #4ade80; }
.xn-notif.warning i { color: #fbbf24; }
.xn-notif.info i { color: #60a5fa; }
.xn-notif i:first-child { font-size: 1rem; margin-top: 2px; flex-shrink: 0; }
.xn-notif-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.xn-notif-text strong { font-size: 0.85rem; }
.xn-notif-text span { font-size: 0.78rem; color: #999; }
.xn-notif-close { background: transparent; border: none; color: #666; cursor: pointer; font-size: 0.8rem; flex-shrink: 0; }
.notif-fade-enter-active, .notif-fade-leave-active { transition: all 0.3s ease; }
.notif-fade-enter-from, .notif-fade-leave-to { opacity: 0; transform: translateY(10px); }

/* ── GStreamer badge + install button ── */
.xn-gst-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .72rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.xn-gst-badge.installed  { background: #0f2a0f; color: #4ade80; border: 1px solid #166534; }
.xn-gst-badge.missing    { background: #2a0f0f; color: #f87171; border: 1px solid #991b1b; }
.xn-gst-badge.installing { background: #1a1a0f; color: #fbbf24; border: 1px solid #854d0e; }
.xn-gst-install-btn {
  padding: 4px 12px;
  background: #1e2a40;
  color: #93c5fd;
  border: 1px solid #2d3a50;
  border-radius: 6px;
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
}
.xn-gst-install-btn:hover { background: #243450; }
</style>

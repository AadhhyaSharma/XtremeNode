<!-- WebRtcEmbedView.vue — Headerless /webrtc page served on port 8000 -->
<template>
  <div class="webrtc-embed-wrapper">
    <WebRtcClientView :embedded="true" />
  </div>
</template>

<script setup lang="ts">
import WebRtcClientView from '@/views/WebRtcClientView.vue';
</script>

<style scoped>
.webrtc-embed-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}
</style>

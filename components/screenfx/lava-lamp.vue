<!-- /components/content/screenfx/lava-lamp.vue -->
<template>
  <div class="lava-container">
    <svg width="0" height="0" style="position: absolute">
      <filter id="lava-goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
        <feColorMatrix
          in="blur"
          mode="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12"
        />
      </filter>
    </svg>
    <div class="lava-goo-layer">
      <div
        v-for="blob in blobs"
        :key="blob.id"
        class="blob"
        :style="blobStyle(blob)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Blob {
  id: number
  size: number
  left: number
  color: string
  duration: number
  delay: number
  xSwing: number
}

const COLORS = [
  'hsl(275,80%,62%)',
  'hsl(315,80%,60%)',
  'hsl(195,80%,58%)',
  'hsl(155,70%,52%)',
  'hsl(35,90%,58%)',
  'hsl(0,80%,62%)',
  'hsl(240,75%,65%)',
  'hsl(90,70%,52%)',
  'hsl(350,80%,62%)',
  'hsl(60,80%,58%)',
]

const blobs = ref<Blob[]>([])

onMounted(() => {
  blobs.value = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    size: 60 + Math.random() * 90,
    left: 5 + Math.random() * 80,
    color: COLORS[i % COLORS.length]!,
    duration: 8 + Math.random() * 10,
    delay: -(Math.random() * 18),
    xSwing: (Math.random() - 0.5) * 60,
  }))
})

const blobStyle = (blob: Blob) => ({
  width: `${blob.size}px`,
  height: `${blob.size}px`,
  left: `${blob.left}%`,
  background: blob.color,
  animationDuration: `${blob.duration}s`,
  animationDelay: `${blob.delay}s`,
  '--x-swing': `${blob.xSwing}px`,
})
</script>

<style scoped>
.lava-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}

.lava-goo-layer {
  position: absolute;
  inset: 0;
  filter: url(#lava-goo);
}

.blob {
  position: absolute;
  bottom: -20%;
  border-radius: 50%;
  animation: lava-rise linear infinite;
  will-change: transform;
}

@keyframes lava-rise {
  0% {
    transform: translateY(0) translateX(0) scale(1);
  }
  25% {
    transform: translateY(-30vh) translateX(calc(var(--x-swing) * 0.5))
      scale(1.18);
  }
  50% {
    transform: translateY(-62vh) translateX(var(--x-swing)) scale(0.88);
  }
  75% {
    transform: translateY(-95vh) translateX(calc(var(--x-swing) * 0.3))
      scale(1.12);
  }
  100% {
    transform: translateY(-130vh) translateX(0) scale(0.78);
  }
}
</style>

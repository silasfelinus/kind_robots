<!-- /components/content/screenfx/matrix-rain.vue -->
<template>
  <canvas ref="canvasRef" class="effect-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId: number | null = null

const GLYPHS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKL0123456789@#$%&'

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const FS = 14
  let cols = 0
  let drops: number[] = []

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    cols = Math.floor(canvas.width / FS)
    drops = Array.from({ length: cols }, () =>
      Math.floor((Math.random() * canvas.height) / FS),
    )
    ctx.fillStyle = '#001400'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  resize()
  window.addEventListener('resize', resize)

  const tick = () => {
    ctx.fillStyle = 'rgba(0,10,0,0.06)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = `${FS}px monospace`

    for (let i = 0; i < cols; i++) {
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0'
      const highlight = Math.random() > 0.92
      ctx.fillStyle = highlight
        ? 'rgba(160,255,160,0.95)'
        : 'rgba(0,200,0,0.85)'
      ctx.fillText(ch, i * FS, drops[i]! * FS)
      if (drops[i]! * FS > canvas.height && Math.random() > 0.975) drops[i] = 0
      else drops[i]!++
    }

    rafId = requestAnimationFrame(tick)
  }

  tick()

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style scoped>
.effect-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 50;
}
</style>

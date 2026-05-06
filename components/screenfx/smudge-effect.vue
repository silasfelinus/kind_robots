<!-- /components/content/screenfx/smudge-effect.vue -->
<!-- NOTE: This effect intentionally captures pointer events. -->
<!-- The screen-fx.vue escape button sits at z-index:9999 above this canvas -->
<!-- and remains fully clickable to dismiss all effects. -->
<template>
  <div class="smudge-stage">
    <canvas ref="canvasRef" class="smudge-canvas" />
    <!-- Brush cursor indicator -->
    <div
      class="brush-cursor"
      :class="{ painting: isPainting }"
      :style="{
        left: `${cursorX}px`,
        top: `${cursorY}px`,
        width: `${brushRadius * 2}px`,
        height: `${brushRadius * 2}px`,
        borderColor: isPainting
          ? `hsla(${brushHue},90%,70%,0.9)`
          : 'rgba(255,255,255,0.7)',
        boxShadow: isPainting
          ? `0 0 8px hsla(${brushHue},90%,60%,0.6)`
          : '0 0 6px rgba(0,0,0,0.4)',
      }"
    />
    <!-- Hint text -->
    <div class="smudge-hint" :class="{ hidden: hintHidden }">
      <span>Drag to smudge</span>
      <span class="sep">·</span>
      <span>Shift + drag to paint</span>
      <span class="sep">·</span>
      <span>Scroll to resize brush</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (a: number, b: number) => a + Math.random() * (b - a)

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ]
}

// ─── State ────────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
const cursorX = ref(-999)
const cursorY = ref(-999)
const brushRadius = ref(36)
const brushHue = ref(0)
const isPainting = ref(false) // shift held = paint mode
const hintHidden = ref(false)

let isDown = false
let lastX = 0
let lastY = 0
let hintTimer: ReturnType<typeof setTimeout> | null = null

// ── Temp canvas reused for smudge blits ───────────────────────────────────────
let smudgeTemp: HTMLCanvasElement | null = null
let smudgeTempCtx: CanvasRenderingContext2D | null = null

// ─── Init painting ────────────────────────────────────────────────────────────

const initPainting = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) => {
  const w = canvas.width,
    h = canvas.height

  // Dark base
  ctx.fillStyle = '#0a080c'
  ctx.fillRect(0, 0, w, h)

  // Large paint blob layer
  for (let i = 0; i < 40; i++) {
    const x = rand(0, w)
    const y = rand(0, h)
    const r = rand(80, Math.min(w, h) * 0.4)
    const hue = rand(0, 360)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `hsla(${hue},80%,55%,0.85)`)
    g.addColorStop(0.6, `hsla(${(hue + 40) % 360},70%,40%,0.4)`)
    g.addColorStop(1, `hsla(${(hue + 80) % 360},60%,30%,0)`)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()
  }

  // Paint stroke layer — directional brushmarks
  for (let i = 0; i < 80; i++) {
    const x1 = rand(0, w),
      y1 = rand(0, h)
    const len = rand(60, 280),
      angle = rand(0, Math.PI * 2)
    const x2 = x1 + Math.cos(angle) * len
    const y2 = y1 + Math.sin(angle) * len
    const hue = rand(0, 360)
    const g = ctx.createLinearGradient(x1, y1, x2, y2)
    g.addColorStop(0, `hsla(${hue},75%,60%,0)`)
    g.addColorStop(0.5, `hsla(${hue},85%,65%,0.5)`)
    g.addColorStop(1, `hsla(${hue},75%,55%,0)`)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = g
    ctx.lineWidth = rand(4, 28)
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Fine texture pass — small bright flecks
  for (let i = 0; i < 120; i++) {
    const x = rand(0, w),
      y = rand(0, h)
    const r = rand(2, 10)
    const hue = rand(0, 360)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue},90%,75%,${rand(0.1, 0.4)})`
    ctx.fill()
  }

  // Vignette
  const vg = ctx.createRadialGradient(
    w / 2,
    h / 2,
    h * 0.3,
    w / 2,
    h / 2,
    h * 0.9,
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

// ─── Smudge ───────────────────────────────────────────────────────────────────

const smudge = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
) => {
  const speed = Math.sqrt(dx * dx + dy * dy)
  if (speed < 0.4) return

  const r = brushRadius.value
  const dirX = dx / speed
  const dirY = dy / speed

  // Sample from slightly behind the cursor (what the finger is dragging)
  const srcX = Math.round(x - dirX * Math.min(speed, r * 0.7))
  const srcY = Math.round(y - dirY * Math.min(speed, r * 0.7))

  const sx = Math.max(0, srcX - r)
  const sy = Math.max(0, srcY - r)
  const sw = Math.min(ctx.canvas.width - sx, r * 2)
  const sh = Math.min(ctx.canvas.height - sy, r * 2)
  if (sw <= 0 || sh <= 0) return

  try {
    const sampleData = ctx.getImageData(sx, sy, sw, sh)

    if (!smudgeTemp || smudgeTemp.width < sw || smudgeTemp.height < sh) {
      smudgeTemp = document.createElement('canvas')
      smudgeTempCtx = smudgeTemp.getContext('2d')
    }
    smudgeTemp.width = sw
    smudgeTemp.height = sh
    smudgeTempCtx!.putImageData(sampleData, 0, 0)

    // Soft circular mask — blend center stronger, edges softer
    ctx.save()

    // Outer soft edge
    const mask = ctx.createRadialGradient(x, y, r * 0.1, x, y, r)
    mask.addColorStop(0, 'rgba(0,0,0,0.88)')
    mask.addColorStop(0.7, 'rgba(0,0,0,0.6)')
    mask.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 0.92

    // Clip to circle
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.clip()

    // Draw sampled pixels at cursor position (displaced forward)
    ctx.drawImage(smudgeTemp, x - r, y - r, r * 2, r * 2)

    ctx.restore()
  } catch (_) {
    // Out-of-bounds getImageData throws in some browsers — silently skip
  }
}

// ─── Paint mode ───────────────────────────────────────────────────────────────

const paint = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  brushHue.value = (brushHue.value + 1.2) % 360
  const r = brushRadius.value
  const hue = brushHue.value

  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `hsla(${hue},95%,70%,0.55)`)
  g.addColorStop(0.5, `hsla(${(hue + 30) % 360},85%,60%,0.25)`)
  g.addColorStop(1, `hsla(${(hue + 60) % 360},80%,50%,0)`)

  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = () => {
    // Preserve painting on resize by saving/restoring
    if (canvas.width > 0 && canvas.height > 0) {
      const tmp = document.createElement('canvas')
      tmp.width = canvas.width
      tmp.height = canvas.height
      tmp.getContext('2d')!.drawImage(canvas, 0, 0)
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      ctx.drawImage(tmp, 0, 0)
    } else {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initPainting(canvas, ctx)
    }
  }

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initPainting(canvas, ctx)
  window.addEventListener('resize', resize)

  // Hide hint after 4 seconds
  hintTimer = setTimeout(() => {
    hintHidden.value = true
  }, 4000)

  // ── Mouse events ─────────────────────────────────────────────────────────

  const onMouseMove = (e: MouseEvent) => {
    cursorX.value = e.clientX
    cursorY.value = e.clientY

    if (!isDown) return

    const dx = e.clientX - lastX
    const dy = e.clientY - lastY

    if (isPainting.value) {
      paint(ctx, e.clientX, e.clientY)
    } else {
      smudge(ctx, e.clientX, e.clientY, dx, dy)
    }

    lastX = e.clientX
    lastY = e.clientY
  }

  const onMouseDown = (e: MouseEvent) => {
    // Don't capture right-click
    if (e.button === 2) return
    isDown = true
    lastX = e.clientX
    lastY = e.clientY
  }

  const onMouseUp = () => {
    isDown = false
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    brushRadius.value = Math.max(
      8,
      Math.min(120, brushRadius.value - e.deltaY * 0.08),
    )
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') isPainting.value = true
  }

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') isPainting.value = false
  }

  // Touch support
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]!
    isDown = true
    lastX = t.clientX
    lastY = t.clientY
    cursorX.value = t.clientX
    cursorY.value = t.clientY
  }

  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    const t = e.touches[0]!
    const dx = t.clientX - lastX,
      dy = t.clientY - lastY
    cursorX.value = t.clientX
    cursorY.value = t.clientY
    smudge(ctx, t.clientX, t.clientY, dx, dy)
    lastX = t.clientX
    lastY = t.clientY
  }

  const onTouchEnd = () => {
    isDown = false
  }

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onTouchEnd)
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  onBeforeUnmount(() => {
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mousedown', onMouseDown)
    canvas.removeEventListener('mouseup', onMouseUp)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('touchstart', onTouchStart)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('resize', resize)
    if (hintTimer) clearTimeout(hintTimer)
  })
})
</script>

<style scoped>
.smudge-stage {
  position: fixed;
  inset: 0;
  z-index: 54; /* above most effects, below escape button */
  pointer-events: auto;
}

.smudge-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: none;
  display: block;
}

.brush-cursor {
  position: fixed;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition:
    width 0.1s ease,
    height 0.1s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  z-index: 55;
  mix-blend-mode: difference;
}

.brush-cursor.painting {
  border-width: 2px;
}

.smudge-hint {
  position: fixed;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.55);
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: none;
  z-index: 56;
  transition: opacity 0.6s ease;
}

.smudge-hint.hidden {
  opacity: 0;
}

.sep {
  opacity: 0.3;
}
</style>

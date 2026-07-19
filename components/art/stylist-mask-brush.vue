<!-- /components/art/stylist-mask-brush.vue -->
<!--
  Freehand "paint the hair" mask tool for stylist-restyle.vue (conductor
  superkate-hairstyle-ai/t-018). The Kontext graph already accepts a mask
  (workflow.ts's LoadImageMask reads the red channel — white = repaint, black =
  keep) but nothing produced one. This paints it: strokes are recorded on an
  offscreen canvas at the source photo's NATURAL resolution, independent of how
  the visible preview is letterboxed, so the exported mask lines up pixel-for-
  pixel with the photo the relay uploads regardless of the preview's aspect fit.
-->
<template>
  <div class="stylist-mask-brush flex flex-col gap-2">
    <canvas
      ref="viewCanvas"
      class="block h-64 w-full touch-none rounded-lg border border-base-300 bg-base-300"
      style="cursor: crosshair"
      @pointerdown="startStroke"
      @pointermove="continueStroke"
      @pointerup="endStroke"
      @pointerleave="endStroke"
      @pointercancel="endStroke"
    />
    <div class="flex flex-wrap items-center gap-2 text-xs">
      <label class="flex items-center gap-1">
        <span class="font-bold text-base-content/70">Brush size</span>
        <input
          v-model.number="brushSize"
          type="range"
          min="8"
          max="80"
          step="2"
          aria-label="Brush size"
          class="range range-primary range-xs w-24"
        />
      </label>
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        :disabled="!hasPainted"
        @click="clear"
      >
        <Icon name="mdi:eraser" class="h-3.5 w-3.5" /> Clear
      </button>
      <span class="text-base-content/50">
        {{
          hasPainted
            ? 'Painted area will be restyled — everything else stays untouched.'
            : 'Paint over the hair to restrict the change to just that area.'
        }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  sourceImageData: string
}>()

const emit = defineEmits<{
  (e: 'update:maskData', value: string | null): void
}>()

const viewCanvas = ref<HTMLCanvasElement | null>(null)
const brushSize = ref(32)
const hasPainted = ref(false)

const photoImg = new Image()
let photoReady = false

// The mask itself, at the photo's natural resolution — the source of truth.
// White strokes on a transparent background; only visible pixels count.
let maskCanvas: HTMLCanvasElement | null = null
let maskCtx: CanvasRenderingContext2D | null = null

// object-contain-style fit of the natural photo into the visible canvas box,
// recomputed whenever either changes. Both drawing and pointer→natural-space
// coordinate mapping go through this so they can never disagree.
let fit = { scale: 1, offsetX: 0, offsetY: 0, drawW: 0, drawH: 0 }

let isDrawing = false
let lastNatural: { x: number; y: number } | null = null
let resizeObserver: ResizeObserver | null = null

function computeFit() {
  const canvas = viewCanvas.value
  if (!canvas || !photoReady) return
  const boxW = canvas.width
  const boxH = canvas.height
  const natW = photoImg.naturalWidth
  const natH = photoImg.naturalHeight
  if (!boxW || !boxH || !natW || !natH) return
  const scale = Math.min(boxW / natW, boxH / natH)
  const drawW = natW * scale
  const drawH = natH * scale
  fit = {
    scale,
    offsetX: (boxW - drawW) / 2,
    offsetY: (boxH - drawH) / 2,
    drawW,
    drawH,
  }
}

function ensureMaskCanvas() {
  if (!photoReady) return
  const natW = photoImg.naturalWidth
  const natH = photoImg.naturalHeight
  if (!natW || !natH) return
  if (maskCanvas && maskCanvas.width === natW && maskCanvas.height === natH)
    return
  maskCanvas = document.createElement('canvas')
  maskCanvas.width = natW
  maskCanvas.height = natH
  maskCtx = maskCanvas.getContext('2d')
  hasPainted.value = false
}

function syncCanvasBox() {
  const canvas = viewCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const width = Math.max(1, Math.round(rect.width))
  const height = Math.max(1, Math.round(rect.height))
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  computeFit()
  redraw()
}

function redraw() {
  const canvas = viewCanvas.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!photoReady) return
  ctx.drawImage(photoImg, fit.offsetX, fit.offsetY, fit.drawW, fit.drawH)
  if (maskCanvas) {
    ctx.globalAlpha = 0.55
    ctx.drawImage(maskCanvas, fit.offsetX, fit.offsetY, fit.drawW, fit.drawH)
    ctx.globalAlpha = 1
  }
}

function loadPhoto(src: string) {
  photoReady = false
  hasPainted.value = false
  maskCanvas = null
  maskCtx = null
  photoImg.onload = () => {
    photoReady = true
    ensureMaskCanvas()
    computeFit()
    redraw()
  }
  photoImg.src = src
  emit('update:maskData', null)
}

function naturalPointFromEvent(
  event: PointerEvent,
): { x: number; y: number } | null {
  const canvas = viewCanvas.value
  if (!canvas || !photoReady || fit.scale <= 0) return null
  const rect = canvas.getBoundingClientRect()
  const canvasX = ((event.clientX - rect.left) / rect.width) * canvas.width
  const canvasY = ((event.clientY - rect.top) / rect.height) * canvas.height
  const natW = photoImg.naturalWidth
  const natH = photoImg.naturalHeight
  const x = (canvasX - fit.offsetX) / fit.scale
  const y = (canvasY - fit.offsetY) / fit.scale
  return {
    x: Math.min(Math.max(x, 0), natW),
    y: Math.min(Math.max(y, 0), natH),
  }
}

function strokeAt(
  point: { x: number; y: number },
  from: { x: number; y: number } | null,
) {
  if (!maskCtx) return
  const radius = brushSize.value / 2 / fit.scale
  maskCtx.fillStyle = '#fff'
  maskCtx.strokeStyle = '#fff'
  maskCtx.lineWidth = radius * 2
  maskCtx.lineCap = 'round'
  maskCtx.lineJoin = 'round'
  if (from) {
    maskCtx.beginPath()
    maskCtx.moveTo(from.x, from.y)
    maskCtx.lineTo(point.x, point.y)
    maskCtx.stroke()
  } else {
    maskCtx.beginPath()
    maskCtx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    maskCtx.fill()
  }
}

function startStroke(event: PointerEvent) {
  if (!photoReady) return
  ensureMaskCanvas()
  const point = naturalPointFromEvent(event)
  if (!point) return
  isDrawing = true
  hasPainted.value = true
  lastNatural = point
  strokeAt(point, null)
  redraw()
  viewCanvas.value?.setPointerCapture(event.pointerId)
}

function continueStroke(event: PointerEvent) {
  if (!isDrawing) return
  const point = naturalPointFromEvent(event)
  if (!point) return
  strokeAt(point, lastNatural)
  lastNatural = point
  redraw()
}

function endStroke() {
  if (!isDrawing) return
  isDrawing = false
  lastNatural = null
  emitMask()
}

function emitMask() {
  if (!maskCanvas || !hasPainted.value) {
    emit('update:maskData', null)
    return
  }
  // Composite onto solid black: workflow.ts's LoadImageMask reads the red
  // channel, and a black backdrop avoids any alpha-decoding ambiguity.
  const out = document.createElement('canvas')
  out.width = maskCanvas.width
  out.height = maskCanvas.height
  const outCtx = out.getContext('2d')
  if (!outCtx) {
    emit('update:maskData', null)
    return
  }
  outCtx.fillStyle = '#000'
  outCtx.fillRect(0, 0, out.width, out.height)
  outCtx.drawImage(maskCanvas, 0, 0)
  emit('update:maskData', out.toDataURL('image/png'))
}

function clear() {
  ensureMaskCanvas()
  if (maskCtx && maskCanvas) {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
  }
  hasPainted.value = false
  redraw()
  emit('update:maskData', null)
}

watch(
  () => props.sourceImageData,
  (next) => {
    if (next) loadPhoto(next)
  },
)

onMounted(() => {
  if (props.sourceImageData) loadPhoto(props.sourceImageData)
  const canvas = viewCanvas.value
  if (canvas && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => syncCanvasBox())
    resizeObserver.observe(canvas)
  }
  syncCanvasBox()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  photoImg.onload = null
})

defineExpose({ clear })
</script>

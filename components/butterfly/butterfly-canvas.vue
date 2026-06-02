<!-- /components/content/butterfly/butterfly-canvas.vue -->
<template>
  <div
    ref="containerRef"
    class="relative h-full min-h-0 w-full overflow-hidden"
  >
    <div
      v-if="!butterfliesExist"
      class="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-4"
    >
      <p class="text-center text-lg font-semibold text-white">
        Press the button to start animations
      </p>
    </div>

    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      aria-label="Butterfly animation canvas"
    />
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-canvas.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const devicePixelRatioValue = ref(1)

let resizeObserver: ResizeObserver | null = null
let animationFrame: number | null = null

const butterfliesExist = computed(() => {
  return butterflyStore.butterflies.length > 0
})

function queueRender() {
  if (typeof window === 'undefined') return

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
  }

  animationFrame = requestAnimationFrame(() => {
    animationFrame = null
    renderButterflies()
  })
}

function resizeCanvas() {
  const container = containerRef.value
  const canvas = canvasRef.value
  if (!container || !canvas) return

  const rect = container.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1

  canvasWidth.value = Math.max(1, Math.round(rect.width))
  canvasHeight.value = Math.max(1, Math.round(rect.height))
  devicePixelRatioValue.value = ratio

  canvas.width = Math.max(1, Math.round(rect.width * ratio))
  canvas.height = Math.max(1, Math.round(rect.height * ratio))
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  queueRender()
}

function renderButterflies() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const ratio = devicePixelRatioValue.value

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  for (const butterfly of butterflyStore.butterflies) {
    if (butterfly.isExiting) continue

    const x = Number.isFinite(butterfly.x) ? butterfly.x : canvasWidth.value / 2
    const y = Number.isFinite(butterfly.y)
      ? butterfly.y
      : canvasHeight.value / 2
    const rotation = Number.isFinite(butterfly.rotation)
      ? butterfly.rotation
      : 0
    const scale = Number.isFinite(butterfly.scale) ? butterfly.scale : 1

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)

    ctx.fillStyle = butterfly.wingTopColor || '#ffffff'
    ctx.beginPath()
    ctx.ellipse(-10, -5, 14, 22, -0.45, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(10, -5, 14, 22, 0.45, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle =
      butterfly.wingBottomColor || butterfly.wingTopColor || '#ffffff'
    ctx.beginPath()
    ctx.ellipse(-7, 14, 10, 15, 0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(7, 14, 10, 15, -0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#111111'
    ctx.beginPath()
    ctx.ellipse(0, 4, 4, 20, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

watch(
  () => butterflyStore.butterflies,
  () => {
    queueRender()
  },
  { deep: true },
)

onMounted(async () => {
  await nextTick()

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })

    resizeObserver.observe(containerRef.value)
  }

  window.addEventListener('resize', resizeCanvas, { passive: true })
  window.visualViewport?.addEventListener('resize', resizeCanvas, {
    passive: true,
  })

  resizeCanvas()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (typeof window === 'undefined') return

  window.removeEventListener('resize', resizeCanvas)
  window.visualViewport?.removeEventListener('resize', resizeCanvas)
})
</script>

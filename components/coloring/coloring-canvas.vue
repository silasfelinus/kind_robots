<!-- /components/coloring/coloring-canvas.vue -->
<template>
  <svg
    v-if="page.mode === 'svg-regions'"
    :viewBox="`0 0 ${page.viewBox.width} ${page.viewBox.height}`"
    class="h-auto w-full select-none rounded-2xl border border-base-300 bg-white"
    role="img"
    :aria-label="page.title || 'Coloring page'"
  >
    <image
      v-if="page.layers.underlay"
      :href="page.layers.underlay"
      x="0"
      y="0"
      :width="page.viewBox.width"
      :height="page.viewBox.height"
    />

    <path
      v-for="region in page.regions ?? []"
      :key="region.id"
      :d="region.d"
      :fill="fillFor(region.id)"
      stroke="#171312"
      stroke-width="3"
      stroke-linejoin="round"
      :class="interactive ? 'cursor-pointer transition-opacity' : ''"
      :opacity="
        selectedRegionIds?.length && !selectedRegionIds.includes(region.id)
          ? 0.92
          : 1
      "
      @click="interactive && emit('regionClick', region.id)"
    >
      <title v-if="region.label">{{ region.label }}</title>
    </path>

    <path
      v-if="page.layers.decor"
      :d="page.layers.decor"
      fill="none"
      stroke="#171312"
      stroke-width="4"
      stroke-linecap="round"
      pointer-events="none"
    />

    <image
      v-if="page.layers.lineArt"
      :href="page.layers.lineArt"
      x="0"
      y="0"
      :width="page.viewBox.width"
      :height="page.viewBox.height"
      pointer-events="none"
    />

    <template v-if="selectedRegionIds?.length">
      <path
        v-for="region in selectedRegions"
        :key="`ring-${region.id}`"
        :d="region.d"
        fill="none"
        stroke="oklch(var(--p))"
        stroke-width="6"
        stroke-dasharray="12 8"
        pointer-events="none"
      />
    </template>
  </svg>

  <div
    v-else-if="page.mode === 'raster-flood' && page.fillBase"
    class="relative overflow-hidden rounded-2xl border border-base-300 bg-white"
  >
    <canvas
      ref="rasterCanvas"
      class="h-auto w-full"
      :class="interactive ? 'cursor-pointer' : ''"
      @click="onRasterClick"
    />
    <img
      v-if="page.layers.lineArt"
      :src="page.layers.lineArt"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full"
    />
    <div
      v-if="!rasterReady"
      class="absolute inset-0 flex items-center justify-center bg-base-200/60"
    >
      <span class="loading loading-spinner loading-md text-primary" />
    </div>
  </div>

  <div
    v-else
    class="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center"
  >
    <Icon name="kind-icon:alert" class="h-8 w-8 text-warning" />
    <p class="text-sm font-semibold text-warning">
      This page definition is missing its artwork — check the set's page JSON.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { BLANK_COLOR_VALUE } from '@/stores/helpers/coloring'
import { floodFillRgba, hexToRgb } from '@/stores/helpers/floodFill'
import type {
  ColoringFillOp,
  ColoringPageDefinition,
  ColoringRegion,
} from '@/stores/helpers/coloring'

const props = withDefaults(
  defineProps<{
    page: ColoringPageDefinition
    /** regionId -> colorId; the canvas is controlled and never mutates this. */
    fills: Record<string, string>
    /** raster-flood mode: replayable fill ops (store-owned, controlled). */
    fillOps?: ColoringFillOp[]
    selectedRegionIds?: string[]
    interactive?: boolean
    /** Resolves a colorId to a hex value (store-owned palette lookup). */
    paletteResolver: (colorId: string) => string
  }>(),
  { fillOps: () => [], selectedRegionIds: () => [], interactive: true },
)

const emit = defineEmits<{
  regionClick: [regionId: string]
  /** raster-flood mode: user clicked at image coordinates. */
  fillRequest: [coords: { x: number; y: number }]
}>()

// --- raster-flood mode ---

const rasterCanvas = ref<HTMLCanvasElement | null>(null)
const rasterReady = ref(false)

let baseImageData: ImageData | null = null
let appliedOpCount = 0

function rasterContext(): CanvasRenderingContext2D | null {
  return (
    rasterCanvas.value?.getContext('2d', { willReadFrequently: true }) ?? null
  )
}

function applyOp(ctx: CanvasRenderingContext2D, op: ColoringFillOp) {
  const { width, height } = ctx.canvas
  const imageData = ctx.getImageData(0, 0, width, height)

  floodFillRgba(
    imageData.data,
    width,
    height,
    op.x,
    op.y,
    hexToRgb(props.paletteResolver(op.colorId)),
  )

  ctx.putImageData(imageData, 0, 0)
}

function replayOps(fromScratch: boolean) {
  const ctx = rasterContext()
  if (!ctx || !baseImageData) return

  if (fromScratch) {
    ctx.putImageData(baseImageData, 0, 0)
    appliedOpCount = 0
  }

  const ops = props.fillOps ?? []
  for (let i = appliedOpCount; i < ops.length; i++) {
    applyOp(ctx, ops[i]!)
  }
  appliedOpCount = ops.length
}

function loadRasterBase() {
  if (props.page.mode !== 'raster-flood' || !props.page.fillBase) return

  rasterReady.value = false
  baseImageData = null
  appliedOpCount = 0

  const image = new Image()
  image.crossOrigin = 'anonymous'

  image.onload = () => {
    const canvas = rasterCanvas.value
    if (!canvas) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    const ctx = rasterContext()
    if (!ctx) return

    ctx.drawImage(image, 0, 0)
    baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    rasterReady.value = true
    replayOps(true)
  }

  image.onerror = () => {
    rasterReady.value = true
  }

  image.src = props.page.fillBase
}

function onRasterClick(event: MouseEvent) {
  if (!props.interactive || !rasterReady.value) return

  const canvas = rasterCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height

  emit('fillRequest', { x, y })
}

watch(
  () => props.fillOps?.length ?? 0,
  (next) => {
    if (!baseImageData) return
    // Incremental for appends; full replay for undo/reset (shrink or rewrite).
    replayOps(next < appliedOpCount)
  },
)

watch(
  () => props.page.id,
  () => loadRasterBase(),
)

onMounted(() => {
  loadRasterBase()
})

const selectedRegions = computed<ColoringRegion[]>(() => {
  if (!props.selectedRegionIds?.length) return []

  return (props.page.regions ?? []).filter((region) =>
    props.selectedRegionIds!.includes(region.id),
  )
})

function fillFor(regionId: string): string {
  const colorId = props.fills[regionId]
  if (!colorId) return BLANK_COLOR_VALUE
  return props.paletteResolver(colorId)
}
</script>

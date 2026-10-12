<template>
  <section class="kr-panel space-y-3 p-4" aria-label="Insert light map">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="font-serif text-lg font-bold">Insert light map</h3>
      <p class="text-xs opacity-70">
        Drag an insert, or select it and nudge with the arrow keys (Shift for 5
        mm). Copy the lines below into the table's inserts.
      </p>
    </div>
    <svg
      ref="svgRef"
      class="light-map w-full rounded-xl border border-base-content/15 bg-base-300"
      :viewBox="`0 0 ${frame.width} ${frame.height}`"
      role="application"
      aria-label="Playfield with its inserts, flashers and LED rail"
      tabindex="0"
      @keydown="onKey"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <image
        v-if="map.art"
        :href="map.art"
        x="0"
        y="0"
        :width="frame.width"
        :height="frame.height"
        preserveAspectRatio="none"
        :opacity="artOpacity"
      />
      <polyline
        v-if="railPath"
        :points="railPath"
        fill="none"
        stroke="#ffd25a"
        stroke-opacity="0.35"
        stroke-width="1"
      />
      <circle
        v-for="(led, i) in ledDots"
        :key="`led-${i}`"
        :cx="led[0]"
        :cy="led[1]"
        r="1.4"
        fill="#ffd25a"
        fill-opacity="0.8"
      />
      <g
        v-for="flasher in flasherDots"
        :key="flasher.id"
        :transform="`translate(${flasher.x} ${flasher.y})`"
      >
        <circle r="5" :fill="flasher.color" fill-opacity="0.35" />
        <circle r="2" :fill="flasher.color" />
        <title>{{ flasher.id }} (flasher)</title>
      </g>
      <g
        v-for="insert in insertShapes"
        :key="insert.id"
        class="light-map-insert"
        :transform="`translate(${insert.x} ${insert.y}) rotate(${insert.angle})`"
        @pointerdown="onDown($event, insert.id)"
      >
        <circle
          v-if="insert.shape === 'circle'"
          :r="insert.w / 2"
          :fill="insert.color"
          fill-opacity="0.8"
          :stroke="insert.id === selected ? '#ffffff' : '#000000'"
          :stroke-width="insert.id === selected ? 1.6 : 0.6"
        />
        <rect
          v-else-if="insert.shape === 'rect'"
          :x="-insert.w / 2"
          :y="-insert.h / 2"
          :width="insert.w"
          :height="insert.h"
          :fill="insert.color"
          fill-opacity="0.8"
          :stroke="insert.id === selected ? '#ffffff' : '#000000'"
          :stroke-width="insert.id === selected ? 1.6 : 0.6"
        />
        <polygon
          v-else
          :points="insert.points"
          :fill="insert.color"
          fill-opacity="0.8"
          :stroke="insert.id === selected ? '#ffffff' : '#000000'"
          :stroke-width="insert.id === selected ? 1.6 : 0.6"
        />
        <title>{{ insert.id }}</title>
      </g>
    </svg>
    <div class="flex flex-wrap items-center gap-3 text-xs">
      <label class="flex items-center gap-2">
        Art
        <input
          v-model.number="artOpacity"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="range range-xs w-32"
          aria-label="Playfield art opacity"
        />
      </label>
      <span v-if="selectedInsert" class="font-mono">
        {{ selectedInsert.id }} at [{{ selectedInsert.at[0].toFixed(3) }},
        {{ selectedInsert.at[1].toFixed(3) }}]
      </span>
      <span v-else class="opacity-60">Nothing selected</span>
      <button
        type="button"
        class="kr-btn-ghost-xs"
        :disabled="!moves.length"
        @click="reset"
      >
        Reset
      </button>
      <button
        type="button"
        class="kr-btn-ghost-xs"
        :disabled="!moves.length"
        @click="copy"
      >
        {{ copied ? 'Copied' : 'Copy changes' }}
      </button>
    </div>
    <pre
      class="max-h-48 overflow-auto rounded-lg bg-base-300 p-3 text-xs"
      aria-label="Moved inserts as table data"
      >{{ snippet }}</pre>
  </section>
</template>

<script setup lang="ts">
// /components/arcade/arcade-pinball-light-map.vue
//
// The insert light-map editor (conductor zuzu-pinball/t-017): a table's
// inserts, flashers and LED rail over its painted playfield, in the private
// workshop. Drag an insert or nudge it with the arrow keys; the moves come
// back as table data to paste into the table's source. The model and its
// maths are in utils/arcade/pinball/lightMap.ts.

import { computed, ref } from 'vue'
import {
  cssColor,
  insertSnippet,
  lightMapOf,
  mapFrame,
  movedInserts,
  nudged,
} from '~/utils/arcade/pinball/lightMap'
import type { InsertDef, TableDef } from '~/utils/arcade/pinball/types'

const props = defineProps<{ table: TableDef }>()

/** Map pixels across; the height follows the table's proportions. */
const WIDTH = 600

const map = lightMapOf(props.table)
const frame = mapFrame(map.bounds, WIDTH)
const inserts = ref<InsertDef[]>(map.inserts.map((i) => ({ ...i })))
const selected = ref<string | null>(null)
const dragging = ref<string | null>(null)
const artOpacity = ref(0.85)
const copied = ref(false)
const svgRef = ref<SVGSVGElement | null>(null)

const px = (metres: number) => metres / frame.metresPerPixel

const railPath = computed(() =>
  map.rail.points
    .map((p) => frame.toMap(p))
    .map(([x, y]) => `${x},${y}`)
    .join(' '),
)
const ledDots = computed(() => map.rail.leds.map((p) => frame.toMap(p)))
const flasherDots = computed(() =>
  map.flashers.map((f) => {
    const [x, y] = frame.toMap(f.at)
    return { id: f.id, x, y, color: cssColor(f.color) }
  }),
)
const insertShapes = computed(() =>
  inserts.value.map((i) => {
    const [x, y] = frame.toMap(i.at)
    const w = px(i.size)
    const h = px(i.depth ?? i.size * 0.6)
    const half = w / 2
    const points =
      i.shape === 'arrow'
        ? `0,${-half} ${half * 0.7},${half} 0,${half * 0.5} ${-half * 0.7},${half}`
        : `0,${-half * 0.6} ${half},${half * 0.4} ${half * 0.5},${half * 0.4} 0,${-half * 0.1} ${-half * 0.5},${half * 0.4} ${-half},${half * 0.4}`
    return {
      id: i.id,
      shape: i.shape,
      x,
      y,
      w,
      h,
      points,
      angle: (-(i.yaw ?? 0) * 180) / Math.PI,
      color: cssColor(i.color),
    }
  }),
)
const selectedInsert = computed(
  () => inserts.value.find((i) => i.id === selected.value) ?? null,
)
const moves = computed(() => movedInserts(map.inserts, inserts.value))
const snippet = computed(() => insertSnippet(moves.value))

function moveTo(id: string, at: [number, number]) {
  inserts.value = inserts.value.map((i) => (i.id === id ? { ...i, at } : i))
  copied.value = false
}

function pointerAt(event: PointerEvent): [number, number] | null {
  const svg = svgRef.value
  if (!svg) return null
  const box = svg.getBoundingClientRect()
  if (!box.width || !box.height) return null
  return frame.toTable([
    ((event.clientX - box.left) * frame.width) / box.width,
    ((event.clientY - box.top) * frame.height) / box.height,
  ])
}

function onDown(event: PointerEvent, id: string) {
  selected.value = id
  dragging.value = id
  svgRef.value?.setPointerCapture?.(event.pointerId)
  svgRef.value?.focus()
}

function onMove(event: PointerEvent) {
  if (!dragging.value) return
  const at = pointerAt(event)
  if (at) moveTo(dragging.value, at)
}

function onUp() {
  dragging.value = null
}

function onKey(event: KeyboardEvent) {
  const insert = selectedInsert.value
  if (!insert) return
  if (
    event.key !== 'ArrowLeft' &&
    event.key !== 'ArrowRight' &&
    event.key !== 'ArrowUp' &&
    event.key !== 'ArrowDown'
  )
    return
  event.preventDefault()
  moveTo(insert.id, nudged(insert.at, event.key, event.shiftKey))
}

function reset() {
  inserts.value = map.inserts.map((i) => ({ ...i }))
  copied.value = false
}

async function copy() {
  try {
    await navigator.clipboard.writeText(snippet.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>

<style scoped>
.light-map {
  touch-action: none;
}

.light-map-insert {
  cursor: grab;
}

.light-map-insert:active {
  cursor: grabbing;
}
</style>

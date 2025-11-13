<!-- /components/experiments/flip-test.vue -->
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="runExchange"
    >
      <!-- Background panel: never moves, only its image swaps -->
      <div class="absolute inset-0 z-0">
        <img
          :src="backgroundPanelSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <!-- Front panel segments (flaps): exist only during animation -->
      <flip-flap-grid v-if="showFlaps" :tiles="tileViews" :flipped="flipped" />

      <div
        class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/25"
      ></div>
      <div
        class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/15"
      ></div>

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
      >
        {{
          isAnimating
            ? `Dropping col ${activeColLabel} • 2×2 over 3 segments`
            : 'Ready • click to run magic flip-flap reveal'
        }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Background panel</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/20"
            >backgroundPanelSrc</span
          >
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">
          {{ backgroundPanelSrc }}
        </div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${backgroundPanelSrc}')` }"
          ></div>
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Front panel (current face)</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20"
            >frontPanelSrc</span
          >
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">
          {{ frontPanelSrc }}
        </div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${frontPanelSrc}')` }"
          ></div>
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Flip config</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-info/20"
            >2 rows animated, 3 segments</span
          >
        </div>
        <div class="mt-1 text-[11px] opacity-80">
          visible rows: {{ visibleRows }} • total segments:
          {{ totalSegments }} • cols: {{ cols }}
        </div>
        <div class="mt-1 text-[11px] opacity-80">
          order: top-right → mid-right → top-left → mid-left
        </div>
        <div class="mt-1 text-[11px] opacity-80">logoSrc: {{ logoSrc }}</div>
        <div class="mt-2 grid grid-cols-2 gap-1 text-[11px]">
          <div
            v-for="(s, i) in status"
            :key="i"
            class="rounded border border-base-300 px-2 py-1"
          >
            col {{ i + 1 }}: <b>{{ s }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2 flex items-center justify-between text-xs opacity-80">
      <span class="truncate">
        Click to toggle between image1 and image2 with a 2×2 drop over 3
        segments
      </span>
      <span>{{ isAnimating ? 'Animating…' : 'Idle' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import FlipFlapGrid, {
  type FlipTileView,
} from '@/components/navigation/flip-animation.vue'

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')
const logoSrc = ref<string>('/images/logo_old.webp')

const cols = ref<number>(2)
const visibleRows = ref<number>(3)
const totalSegments = ref<number>(3)

interface TileDef {
  id: string
  row: number
  col: number
  index: number
}

const tiles = computed<TileDef[]>(() => {
  const result: TileDef[] = []
  let index = 0
  for (let r = 0; r < visibleRows.value; r += 1) {
    for (let c = 0; c < cols.value; c += 1) {
      result.push({
        id: `${r}-${c}`,
        row: r,
        col: c,
        index,
      })
      index += 1
    }
  }
  return result
})

const isAnimating = ref(false)
const showFlaps = ref(false)
const flipped = ref<boolean[]>([])
const status = ref<string[]>([])
const activeCol = ref<number | null>(null)

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running 2×2 flip over 3 stacked segments'
    : 'Image ready; click to start 2×2 flip-flap reveal',
)

const activeColLabel = computed(() =>
  activeCol.value === null ? '-' : `${activeCol.value + 1}/${cols.value}`,
)

function initState() {
  flipped.value = tiles.value.map(() => false)
  status.value = Array.from({ length: cols.value }, () => 'idle')
  activeCol.value = null
}

initState()

function tileVars(tile: TileDef): Record<string, string> {
  const colWidth = 100 / cols.value
  const segHeight = 100 / totalSegments.value

  const left = colWidth * tile.col
  const right = 100 - colWidth * (tile.col + 1)

  const top = segHeight * tile.row
  const bottom = 100 - segHeight * (tile.row + 1)

  const colCenter = left + colWidth / 2
  const rowCenterFront = top + segHeight / 2

  // For the back:
  //  - row 0: logo strip
  //  - row 1: bottom third of backgroundPanelSrc
  //  - row 2: not animated, but safe default
  let rowCenterBack = rowCenterFront
  if (tile.row === 1) {
    rowCenterBack = 100 - segHeight / 2
  }

  const isTopRow = tile.row === 0
  const isMiddleRow = tile.row === 1

  let backImage = backgroundPanelSrc.value
  if (isTopRow) {
    backImage = logoSrc.value
  } else if (isMiddleRow) {
    backImage = backgroundPanelSrc.value
  }

  return {
    '--flip-image-front': `url("${frontPanelSrc.value}")`,
    '--flip-image-back': `url("${backImage}")`,
    '--col-left': `${left}%`,
    '--col-right': `${right}%`,
    '--row-top': `${top}%`,
    '--row-bottom': `${bottom}%`,
    '--col-center': `${colCenter}%`,
    '--row-center-front': `${rowCenterFront}%`,
    '--row-center-back': `${rowCenterBack}%`,
  }
}

const tileViews = computed<FlipTileView[]>(() =>
  tiles.value.map((tile) => ({
    id: tile.id,
    index: tile.index,
    style: tileVars(tile),
  })),
)

async function runExchange() {
  if (isAnimating.value) return

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  // Snapshot the trick: front still looks like fromSrc.
  frontPanelSrc.value = fromSrc
  backgroundPanelSrc.value = fromSrc

  showFlaps.value = true
  initState()
  await nextTick()

  // Now background quietly becomes the new image,
  // fully hidden under the front-panel flaps.
  backgroundPanelSrc.value = toSrc

  const columnOrder: number[] = []
  for (let c = cols.value - 1; c >= 0; c -= 1) {
    columnOrder.push(c)
  }

  const rowDelay = 320
  const betweenColumnsDelay = 180

  for (const col of columnOrder) {
    activeCol.value = col
    status.value[col] = 'dropping'

    // Only animate top and middle rows (0 and 1).
    for (let r = 0; r < 2; r += 1) {
      const index = r * cols.value + col
      flipped.value[index] = true
      await wait(rowDelay)
    }

    status.value[col] = 'done'
    await wait(betweenColumnsDelay)
  }

  // Swap which image is "current" so next click reverses.
  currentImage.value = toSrc
  otherImage.value = fromSrc

  backgroundPanelSrc.value = currentImage.value
  frontPanelSrc.value = currentImage.value

  activeCol.value = null
  await wait(120)

  showFlaps.value = false
  initState()
  isAnimating.value = false
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
</script>

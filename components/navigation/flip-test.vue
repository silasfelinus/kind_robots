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

      <!-- Front panel pieces: only exist during the flip -->
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
          <span class="text-xs opacity-80">Background panel (visible)</span>
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
            >2 rows, 3 segments</span
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
const visibleRows = ref<number>(2)
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

/**
 * currentImage: what the user considers "the current panel"
 * otherImage: the one we will reveal next
 *
 * Each completed animation swaps them, so clicks alternate A → B → A → B…
 */
const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

/**
 * backgroundPanelSrc: what the never-moving background panel is currently showing.
 * frontPanelSrc: what the front panel shows on its face (what gets shredded).
 */
const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)

/**
 * For the back of the front panel:
 * - top third: logo
 * - middle third: bottom third of backgroundPanelSrc
 */
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
  const rowCenterBack =
    tile.row === 0 ? top + segHeight / 2 : 100 - segHeight / 2

  const isMiddleRow = tile.row === 1
  const backImage = isMiddleRow ? backgroundPanelSrc.value : logoSrc.value

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

  /**
   * Snapshot the trick:
   * - Front panel still LOOKS like fromSrc (image1, say).
   * - Background panel quietly becomes toSrc (image2), but is fully covered.
   * - Back-of-front uses logo on top row, bottom-third-of-toSrc on middle row.
   */
  frontPanelSrc.value = fromSrc
  backgroundPanelSrc.value = toSrc

  showFlaps.value = true
  initState()
  await nextTick()

  const columnOrder: number[] = []
  for (let c = cols.value - 1; c >= 0; c -= 1) {
    columnOrder.push(c)
  }

  const rowDelay = 320
  const betweenColumnsDelay = 180

  for (const col of columnOrder) {
    activeCol.value = col
    status.value[col] = 'dropping'

    for (let r = 0; r < visibleRows.value; r += 1) {
      const index = r * cols.value + col
      flipped.value[index] = true
      await wait(rowDelay)
    }

    status.value[col] = 'done'
    await wait(betweenColumnsDelay)
  }

  /**
   * After the flip is done, the background panel is already toSrc.
   * We now just swap "current vs other" so the next click reverses the trick.
   */
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

<!-- /components/experiments/flip-test.vue -->
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="runExchange"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="currentSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <div v-if="showFlaps" class="absolute inset-0 z-10">
        <div
          v-for="tile in tiles"
          :key="tile.id"
          class="flap-wrapper"
          :class="{ 'is-flipped': flipped[tile.index] }"
          :style="tileVars(tile)"
        >
          <div class="face face-front"></div>
          <div class="face face-back"></div>
        </div>
      </div>

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
          <span class="text-xs opacity-80">Rear panel (visible)</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/20"
            >currentSrc</span
          >
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">
          {{ currentSrc }}
        </div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${currentSrc}')` }"
          ></div>
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Next hidden panel</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20"
            >nextSrc</span
          >
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">
          {{ nextSrc }}
        </div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${nextSrc}')` }"
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
          visible rows: 2 • total vertical segments: 3 • cols: {{ cols }}
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
        Each click swaps panels, then runs a 2×2 drop over a 3-part stack
      </span>
      <span>{{ isAnimating ? 'Animating…' : 'Idle' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const imgA = ref<string>('/images/backtree.webp')
const imgB = ref<string>('/images/botcafe.webp')
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

const currentSrc = ref(imgA.value)
const nextSrc = ref(imgB.value)
const frontSrc = ref(currentSrc.value)

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

function tileVars(tile: TileDef) {
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
  const backImage = isMiddleRow ? currentSrc.value : logoSrc.value

  return {
    '--flip-image-front': `url("${frontSrc.value}")`,
    '--flip-image-back': `url("${backImage}")`,
    '--col-left': `${left}%`,
    '--col-right': `${right}%`,
    '--row-top': `${top}%`,
    '--row-bottom': `${bottom}%`,
    '--col-center': `${colCenter}%`,
    '--row-center-front': `${rowCenterFront}%`,
    '--row-center-back': `${rowCenterBack}%`,
  } as Record<string, string>
}

async function runExchange() {
  if (isAnimating.value) return

  isAnimating.value = true

  const previousCurrent = currentSrc.value
  frontSrc.value = previousCurrent
  currentSrc.value = nextSrc.value

  showFlaps.value = true
  initState()
  await nextTick()

  const columnOrder: number[] = []
  for (let c = cols.value - 1; c >= 0; c -= 1) {
    columnOrder.push(c)
  }

  const flipDuration = 700
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

  nextSrc.value = previousCurrent

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

<style scoped>
.flap-wrapper {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  perspective: 1200px;
  transform-origin: 50% 100%;
  transition: transform 700ms cubic-bezier(0.2, 0.7, 0.3, 1);
  clip-path: inset(
    var(--row-top) var(--col-right) var(--row-bottom) var(--col-left)
  );
}

.flap-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), transparent);
  mix-blend-mode: multiply;
  transition: opacity 700ms ease;
  clip-path: inset(
    var(--row-top) var(--col-right) var(--row-bottom) var(--col-left)
  );
}

.flap-wrapper.is-flipped {
  transform: rotateX(-180deg);
}

.flap-wrapper.is-flipped::after {
  opacity: 0.28;
}

.face {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  clip-path: inset(
    var(--row-top) var(--col-right) var(--row-bottom) var(--col-left)
  );
}

.face-front {
  transform: rotateX(0deg) translateZ(0.01px);
  background-image: var(--flip-image-front);
  background-position: var(--col-center) var(--row-center-front);
}

.face-back {
  transform: rotateX(180deg);
  background-image: var(--flip-image-back);
  background-position: var(--col-center) var(--row-center-back);
  filter: brightness(0.96);
}
</style>

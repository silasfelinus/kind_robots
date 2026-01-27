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
          :src="backgroundPanelSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <div
        v-if="showFlaps"
        class="absolute inset-0 z-10 grid"
        :style="gridStyle"
      >
        <div
          v-for="cell in flip.cells"
          :key="cell.id"
          class="relative overflow-hidden"
        >
          <div
            class="absolute inset-0 z-0 bg-no-repeat"
            :style="flip.getCellStyle(frontPanelSrc, cell, 'full')"
          />

          <template v-if="flip.isAnimating">
            <div
              class="absolute inset-0 z-0 bg-no-repeat"
              :style="flip.getCellStyle(backgroundPanelSrc, cell, 'full')"
            />

            <div
              class="absolute left-0 right-0 top-1/2 bottom-0 z-20 bg-no-repeat"
              :style="flip.getCellStyle(frontPanelSrc, cell, 'bottom')"
            />

            <div class="absolute left-0 right-0 top-0 h-1/2 z-25 flip-persp">
              <div
                class="absolute inset-0 flip-inner"
                :style="cellAnimStyle(cell)"
                @animationend="flip.markCellDone(cell.id)"
              >
                <div
                  class="absolute inset-0 flip-face flip-front bg-no-repeat"
                  :style="flip.getCellStyle(frontPanelSrc, cell, 'top')"
                />
                <div
                  class="absolute inset-0 flip-face flip-back bg-no-repeat"
                  :style="
                    flip.getCellStyle(backSrcForRow(cell.row), cell, 'bottom')
                  "
                />
              </div>
            </div>
          </template>

          <div
            class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/25 z-30"
          />
        </div>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-1/6 h-px bg-black/25 z-15"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-2/6 h-px bg-black/25 z-15"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-3/6 h-px bg-black/25 z-15"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-4/6 h-px bg-black/25 z-15"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-5/6 h-px bg-black/25 z-15"
      />

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
      >
        {{
          flip.isAnimating
            ? `Dropping col ${activeColLabel} • 2×6 segments`
            : 'Ready • click to run 2×6 flip-flap reveal'
        }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Background panel</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/20">
            backgroundPanelSrc
          </span>
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">
          {{ backgroundPanelSrc }}
        </div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${backgroundPanelSrc}')` }"
          />
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Front panel (current face)</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20">
            frontPanelSrc
          </span>
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">
          {{ frontPanelSrc }}
        </div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${frontPanelSrc}')` }"
          />
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Flip config</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-info/20">
            2 columns • 6 visual rows • 6 segment rows
          </span>
        </div>
        <div class="mt-1 text-[11px] opacity-80">
          visible rows: {{ rows }} • segment tiles: {{ tileCount }} • cols:
          {{ cols }}
        </div>
        <div class="mt-1 text-[11px] opacity-80">
          order: top-right → bottom-right → top-left → bottom-left
        </div>
        <div class="mt-1 text-[11px] opacity-80">logo A: {{ logoSrcA }}</div>
        <div class="mt-1 text-[11px] opacity-80">logo B: {{ logoSrcB }}</div>
        <div class="mt-2 grid grid-cols-2 gap-1 text-[11px]">
          <div
            v-for="(s, i) in status"
            :key="i"
            class="rounded border border-base-300 px-2 py-1"
          >
            col {{ i + 1 }}:
            <b>{{ s }}</b>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2 flex items-center justify-between text-xs opacity-80">
      <span class="truncate">
        Click to toggle between image1 and image2 with a 2×6 flip-flap reveal
      </span>
      <span>{{ flip.isAnimating ? 'Animating…' : 'Idle' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-test.vue
import { ref, computed, onMounted } from 'vue'
import { useFlipStore } from '@/stores/flipStore'

const flip = useFlipStore()

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')

const logoSrcA = ref<string>('/images/old_logo.webp')
const logoSrcB = ref<string>('/images/chest1.webp')

const showFlaps = ref(false)
const status = ref<string[]>(['idle', 'idle'])
const activeCol = ref<number | null>(null)

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)

const cols = computed(() => 2)
const rows = computed(() => 6)
const tileCount = computed(() => rows.value * cols.value)

const rowDelay = ref<number>(200)
const betweenColumnsDelay = ref<number>(180)

const ariaLabel = computed(() =>
  flip.isAnimating
    ? 'Running 2×6 flip-flap reveal'
    : 'Image ready; click to start 2×6 flip-flap reveal',
)

const activeColLabel = computed(() =>
  activeCol.value === null ? '-' : `${activeCol.value + 1}/${cols.value}`,
)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${cols.value}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${rows.value}, minmax(0, 1fr))`,
}))

onMounted(() => {
  flip.setImages([image1.value, image2.value], 0)
  flip.setGrid(rows.value, cols.value, 0, 700)
  frontPanelSrc.value = flip.currentSrc
  backgroundPanelSrc.value = flip.currentSrc
  status.value = Array.from({ length: cols.value }, () => 'idle')
})

const colOrder = computed(() => {
  const order: number[] = []
  for (let c = cols.value - 1; c >= 0; c -= 1) order.push(c)
  return order
})

const colStartMs = (col: number) => {
  const idx = colOrder.value.indexOf(col)
  const perCol = rows.value * rowDelay.value + betweenColumnsDelay.value
  return Math.max(0, idx) * perCol
}

const cellDelayMs = (row: number, col: number) => {
  return colStartMs(col) + row * rowDelay.value
}

function cellAnimStyle(cell: { row: number; col: number }) {
  return {
    '--flip-delay': `${cellDelayMs(cell.row, cell.col)}ms`,
    '--flip-duration': `${flip.grid.durationMs}ms`,
  } as Record<string, string>
}

function backSrcForRow(row: number) {
  const lastRow = rows.value - 1
  if (row === lastRow) return otherImage.value

  if (row === 0) return logoSrcA.value
  if (row === 1) return logoSrcB.value
  if (row === 2) return logoSrcA.value
  if (row === 3) return logoSrcB.value

  return ''
}

function scheduleStatusTimers() {
  status.value = Array.from({ length: cols.value }, () => 'idle')
  activeCol.value = null

  const colDuration = rows.value * rowDelay.value

  for (const col of colOrder.value) {
    const start = colStartMs(col)
    const end = start + colDuration

    window.setTimeout(() => {
      activeCol.value = col
      status.value[col] = 'dropping'
    }, start)

    window.setTimeout(() => {
      status.value[col] = 'done'
      const nextIdx = colOrder.value.indexOf(col) + 1
      activeCol.value =
        nextIdx < colOrder.value.length ? colOrder.value[nextIdx] : null
    }, end)
  }
}

async function runExchange() {
  if (flip.isAnimating) return

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  frontPanelSrc.value = fromSrc
  backgroundPanelSrc.value = fromSrc

  otherImage.value = toSrc

  flip.setGrid(rows.value, cols.value, 0, flip.grid.durationMs)
  flip.startFlip()
  showFlaps.value = true

  scheduleStatusTimers()

  backgroundPanelSrc.value = toSrc

  const totalMs =
    colOrder.value.length *
      (rows.value * rowDelay.value + betweenColumnsDelay.value) +
    flip.grid.durationMs +
    50

  window.setTimeout(() => {
    currentImage.value = toSrc
    otherImage.value = fromSrc

    frontPanelSrc.value = currentImage.value
    backgroundPanelSrc.value = currentImage.value

    showFlaps.value = false
    status.value = Array.from({ length: cols.value }, () => 'idle')
    activeCol.value = null

    flip.setImages([currentImage.value, otherImage.value], 0)
  }, totalMs)
}
</script>

<style scoped>
.flip-persp {
  transform-style: preserve-3d;
  perspective: 1600px;
}

.flip-inner {
  transform-style: preserve-3d;
  transform-origin: 50% 100%;
  animation-name: flip-fold;
  animation-duration: var(--flip-duration);
  animation-delay: var(--flip-delay);
  animation-timing-function: cubic-bezier(0.24, 0.9, 0.23, 1.01);
  animation-fill-mode: forwards;
}

.flip-face {
  backface-visibility: hidden;
}

.flip-back {
  transform: rotateX(180deg);
}

@keyframes flip-fold {
  0% {
    transform: rotateX(0deg);
  }
  60% {
    transform: rotateX(-210deg);
  }
  100% {
    transform: rotateX(-180deg);
  }
}
</style>

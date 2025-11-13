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

      <FlipFlapGrid v-if="showFlaps" />

      <div
        class="pointer-events-none absolute inset-x-0 top-1/6 h-px bg-black/25"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-2/6 h-px bg-black/25"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-3/6 h-px bg-black/25"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-4/6 h-px bg-black/25"
      />
      <div
        class="pointer-events-none absolute inset-x-0 top-5/6 h-px bg-black/25"
      />

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
      >
        {{
          isAnimating
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
            2 columns • 6 visual rows • {{ segmentRows }} segment rows
          </span>
        </div>
        <div class="mt-1 text-[11px] opacity-80">
          visible rows: {{ visibleRows }} • segment tiles: {{ tileCount }} •
          cols: {{ cols }}
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
      <span>{{ isAnimating ? 'Animating…' : 'Idle' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-test.vue
import { ref, computed, nextTick, onMounted } from 'vue'
import FlipFlapGrid from '@/components/navigation/flip-animation.vue'
import { useFlipStore } from '@/stores/flipStore'

const flipStore = useFlipStore()
flipStore.setConfig(6, 2)

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')

const logoSrcA = ref<string>('/images/old_logo.webp')
const logoSrcB = ref<string>('/images/chest1.webp')

const isAnimating = ref(false)
const showFlaps = ref(false)
const status = ref<string[]>([])
const activeCol = ref<number | null>(null)

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)

const specialBottomSrc = ref<string>(otherImage.value)

const cols = computed(() => flipStore.config.cols)
const visibleRows = computed(() => flipStore.config.rows)
const segmentRows = computed(() => flipStore.segmentRows)
const tileCount = computed(() => flipStore.tileCount)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running 2×6 flip-flap reveal'
    : 'Image ready; click to start 2×6 flip-flap reveal',
)

const activeColLabel = computed(() =>
  activeCol.value === null ? '-' : `${activeCol.value + 1}/${cols.value}`,
)

onMounted(() => {
  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }
  initState()
})

function initState() {
  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }

  const count = tileCount.value
  const colsCount = cols.value

  const nextFlipped: boolean[] = []
  for (let i = 0; i < count; i += 1) {
    nextFlipped.push(false)
  }
  flipStore.flipped = nextFlipped

  status.value = Array.from({ length: colsCount }, () => 'idle')
  activeCol.value = null
}

function prepareTileStyles(fromSrc: string, toSrc: string) {
  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }

  const colsCount = cols.value
  const segCount = segmentRows.value
  const tiles = flipStore.tiles

  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index]
    const segRow = Math.floor(index / colsCount)

    tile.style['--flip-image-front'] = `url("${fromSrc}")`

    let backImage: string | null = null

    if (segRow === 0) {
      backImage = logoSrcA.value
    } else if (segRow === 1) {
      backImage = logoSrcB.value
    } else if (segRow === 2) {
      backImage = logoSrcA.value
    } else if (segRow === 3) {
      backImage = logoSrcB.value
    } else if (segRow === segCount - 1) {
      backImage = toSrc
    } else {
      backImage = null
    }

    if (backImage) {
      tile.style['--flip-image-back'] = `url("${backImage}")`
      tile.style['--flip-back-has-image'] = '1'
    } else {
      delete tile.style['--flip-image-back']
      tile.style['--flip-back-has-image'] = '0'
    }
  }

  const _ = specialBottomSrc.value
}

async function runExchange() {
  if (isAnimating.value) return

  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  frontPanelSrc.value = fromSrc
  backgroundPanelSrc.value = fromSrc
  specialBottomSrc.value = toSrc

  prepareTileStyles(fromSrc, toSrc)

  showFlaps.value = true
  initState()
  await nextTick()

  backgroundPanelSrc.value = toSrc

  const columnOrder: number[] = []
  for (let c = cols.value - 1; c >= 0; c -= 1) {
    columnOrder.push(c)
  }

  const rowDelay = 200
  const betweenColumnsDelay = 180

  for (const col of columnOrder) {
    activeCol.value = col
    status.value[col] = 'dropping'

    for (let seg = 0; seg < segmentRows.value; seg += 1) {
      const index = seg * cols.value + col
      if (flipStore.flipped[index] !== undefined) {
        flipStore.flipped[index] = true
      }
      await wait(rowDelay)
    }

    status.value[col] = 'done'
    await wait(betweenColumnsDelay)
  }

  currentImage.value = toSrc
  otherImage.value = fromSrc

  backgroundPanelSrc.value = currentImage.value
  frontPanelSrc.value = currentImage.value
  specialBottomSrc.value = otherImage.value

  activeCol.value = null
  await wait(150)

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

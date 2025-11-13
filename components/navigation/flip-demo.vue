<!-- /components/experiments/flip-demo.vue -->
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      @click="runCycle"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="backgroundPanelSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <FlipFlapGrid v-if="showFlaps" :tiles="tileViews" :flipped="flipped" />

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold flex items-center gap-1"
      >
        <span>Flip repeat demo</span>
        <span class="opacity-70">click to toggle</span>
        <span class="ml-1 px-1.5 py-0.5 rounded bg-primary/70 text-[10px]">
          {{ isImage2 ? 'Showing image 2' : 'Showing image 1' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-demo.vue
import { ref, computed, nextTick } from 'vue'
import FlipFlapGrid from '@/components/navigation/flip-animation.vue'
import { type FlipTileView } from '@/stores/flipStore'

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')

const logoSrcA = ref<string>('/images/old_logo.webp')
const logoSrcB = ref<string>('/images/chest1.webp')

const cols = ref<number>(2)
const visibleRows = ref<number>(6)

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
const isImage2 = ref(false)
const showFlaps = ref(false)
const flipped = ref<boolean[]>([])

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)
const specialBottomSrc = ref<string>(otherImage.value)

function initState() {
  flipped.value = tiles.value.map(() => false)
}

initState()

function tileVars(tile: TileDef): Record<string, string> {
  const colWidth = 100 / cols.value
  const rowHeight = 100 / visibleRows.value

  const left = colWidth * tile.col
  const right = 100 - colWidth * (tile.col + 1)

  const top = rowHeight * tile.row
  const bottom = 100 - rowHeight * (tile.row + 1)

  let backImage: string | null = null

  if (tile.row === 0) {
    backImage = logoSrcA.value
  } else if (tile.row === 1) {
    backImage = logoSrcB.value
  } else if (tile.row === 2) {
    backImage = logoSrcA.value
  } else if (tile.row === 3) {
    backImage = logoSrcB.value
  } else if (tile.row === 4) {
    backImage = specialBottomSrc.value || backgroundPanelSrc.value
  } else {
    backImage = null
  }

  return {
    '--flip-image-front': `url("${frontPanelSrc.value}")`,
    '--flip-image-back': backImage ? `url("${backImage}")` : 'none',
    '--flip-back-has-image': backImage ? '1' : '0',
    '--col-left': `${left}%`,
    '--col-right': `${right}%`,
    '--row-top': `${top}%`,
    '--row-bottom': `${bottom}%`,
  }
}

const tileViews = computed<FlipTileView[]>(() =>
  tiles.value.map((tile) => ({
    id: tile.id,
    index: tile.index,
    style: tileVars(tile),
  })),
)

async function runCycle() {
  if (isAnimating.value) return

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  frontPanelSrc.value = fromSrc
  backgroundPanelSrc.value = fromSrc
  specialBottomSrc.value = toSrc

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
    for (let r = 0; r < visibleRows.value - 1; r += 1) {
      const index = r * cols.value + col
      flipped.value[index] = true
      await wait(rowDelay)
    }
    await wait(betweenColumnsDelay)
  }

  currentImage.value = toSrc
  otherImage.value = fromSrc
  isImage2.value = currentImage.value === image2.value

  backgroundPanelSrc.value = currentImage.value
  frontPanelSrc.value = currentImage.value
  specialBottomSrc.value = otherImage.value

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

<!-- /components/experiments/flip-repeat.vue -->
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      @click="handleClick"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="baseImageSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <div
        v-if="showFlaps"
        class="absolute inset-0 z-10 pointer-events-none flip-tiles-container"
      >
        <div
          v-for="tile in tiles"
          :key="tile.id"
          class="flip-tile"
          :class="{ 'flip-tile--flipped': flipState[tile.index] }"
          :style="tileRegionStyle(tile)"
        >
          <div class="flip-tile-inner">
            <div
              class="flip-tile-face flip-tile-face-front"
              :style="frontStyleForTile(tile)"
            />
            <div
              class="flip-tile-face flip-tile-face-back"
              :style="backStyleForTile(tile)"
            />
          </div>
        </div>
      </div>

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold flex items-center gap-1"
      >
        <span>Flip repeat demo</span>
        <span class="opacity-70">• Click to toggle</span>
        <span class="ml-1 px-1.5 py-0.5 rounded bg-primary/70 text-[10px]">
          {{ isImage2 ? 'Showing image 2' : 'Showing image 1' }}
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-repeat.vue
import { computed, ref } from 'vue'

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')
const logoSrc = ref<string>('/images/logo_old.webp')
const chestSrc = ref<string>('/images/chest1.webp')

const rows = 3
const cols = 2
const totalPanels = rows * cols

interface TileDef {
  id: string
  index: number
  row: number
  col: number
}

const tiles = computed<TileDef[]>(() => {
  const result: TileDef[] = []
  let index = 0
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      result.push({
        id: `${r}-${c}`,
        index,
        row: r,
        col: c,
      })
      index += 1
    }
  }
  return result
})

const isImage2 = ref(false)
const isAnimating = ref(false)
const showFlaps = ref(false)

const currentFrontImage = ref<string>(image1.value)
const transitionFrom = ref<string>(currentFrontImage.value)
const transitionTo = ref<string>(image2.value)

const flipState = ref<boolean[]>(
  Array.from({ length: totalPanels }, () => false),
)

const baseImageSrc = computed<string>(() =>
  isAnimating.value ? transitionTo.value : currentFrontImage.value,
)

function tileRegionStyle(tile: TileDef): Record<string, string> {
  const colWidth = 100 / cols
  const rowHeight = 100 / rows

  const left = colWidth * tile.col
  const right = 100 - colWidth * (tile.col + 1)
  const top = rowHeight * tile.row
  const bottom = 100 - rowHeight * (tile.row + 1)

  return {
    left: `${left}%`,
    right: `${right}%`,
    top: `${top}%`,
    bottom: `${bottom}%`,
  }
}

function frontStyleForTile(tile: TileDef): Record<string, string> {
  const bgSizeX = cols * 100
  const bgSizeY = rows * 100
  const posX = (tile.col / (cols - 1)) * 100
  const posY = (tile.row / (rows - 1)) * 100

  return {
    backgroundImage: `url("${transitionFrom.value}")`,
    backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
    backgroundPosition: `${posX}% ${posY}%`,
  }
}

function backStyleForTile(tile: TileDef): Record<string, string> {
  const panelNumber = tile.index + 1
  let backgroundImage = ''
  let backgroundSize = 'cover'
  let backgroundPosition = 'center center'
  let transform = ''

  if (panelNumber === 5) {
    const bgSizeX = cols * 100
    const bgSizeY = rows * 100
    const posX = 100
    const posY = 100
    backgroundImage = `url("${image2.value}")`
    backgroundSize = `${bgSizeX}% ${bgSizeY}%`
    backgroundPosition = `${posX}% ${posY}%`
    transform = 'scaleY(-1)'
  } else if (panelNumber % 2 === 1) {
    backgroundImage = `url("${logoSrc.value}")`
  } else {
    backgroundImage = `url("${chestSrc.value}")`
  }

  return {
    backgroundImage,
    backgroundSize,
    backgroundPosition,
    transform,
  }
}

function resetFlipState() {
  flipState.value = Array.from({ length: totalPanels }, () => false)
}

function animateFlip(targetFlipped: boolean, done: () => void) {
  const baseDelay = 140
  const rowGap = 130
  const colOffset = 80
  const transitionTime = 700

  const timeouts: number[] = []

  tiles.value.forEach((tile) => {
    const delay =
      tile.row * rowGap + (tile.col === 0 ? 0 : colOffset) + baseDelay
    const id = window.setTimeout(() => {
      flipState.value[tile.index] = targetFlipped
    }, delay)
    timeouts.push(id)
  })

  const maxDelay = tiles.value.reduce((max, tile) => {
    const delay =
      tile.row * rowGap + (tile.col === 0 ? 0 : colOffset) + baseDelay
    return Math.max(max, delay)
  }, 0)

  const totalDuration = maxDelay + transitionTime + 80

  const finalTimeout = window.setTimeout(() => {
    timeouts.forEach((id) => window.clearTimeout(id))
    done()
  }, totalDuration)

  timeouts.push(finalTimeout)
}

function startCycle() {
  if (isAnimating.value) return
  isAnimating.value = true
  showFlaps.value = true

  transitionFrom.value = currentFrontImage.value
  transitionTo.value = isImage2.value ? image1.value : image2.value

  resetFlipState()

  animateFlip(true, () => {
    currentFrontImage.value = transitionTo.value
    isImage2.value = !isImage2.value
    animateFlip(false, () => {
      showFlaps.value = false
      resetFlipState()
      isAnimating.value = false
    })
  })
}

function handleClick() {
  startCycle()
}
</script>

<style scoped>
.flip-tiles-container {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  perspective: 1600px;
}

.flip-tile {
  position: absolute;
  transform-style: preserve-3d;
}

.flip-tile-inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform-origin: 50% 0%;
  transition:
    transform 0.7s cubic-bezier(0.24, 0.9, 0.23, 1.01),
    opacity 0.35s ease-out;
}

.flip-tile--flipped .flip-tile-inner {
  transform: rotateX(180deg);
}

.flip-tile-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  background-repeat: no-repeat;
}

.flip-tile-face-back {
  transform: rotateX(180deg);
}
</style>

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

      <FlipFlapGrid v-if="showFlaps" />

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
import { ref, nextTick, onMounted } from 'vue'
import FlipFlapGrid from '@/components/navigation/flip-animation.vue'
import { useFlipStore } from '@/stores/flipStore'

const flipStore = useFlipStore()

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')

const logoSrcA = ref<string>('/images/old_logo.webp')
const logoSrcB = ref<string>('/images/chest1.webp')

const isAnimating = ref(false)
const isImage2 = ref(false)
const showFlaps = ref(false)

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)

onMounted(() => {
  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }
})

function prepareTileStyles(fromSrc: string, toSrc: string) {
  const rows = flipStore.config.rows
  const cols = flipStore.config.cols
  const segRows = flipStore.segmentRows

  const tiles = flipStore.tiles

  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index]
    const segRow = Math.floor(index / cols)

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
    } else if (segRow === segRows - 1) {
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

  const _ = rows
}

async function runCycle() {
  if (isAnimating.value) return

  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }

  isAnimating.value = true

  const fromSrc = currentImage.value
  const toSrc = otherImage.value

  frontPanelSrc.value = fromSrc
  backgroundPanelSrc.value = fromSrc

  prepareTileStyles(fromSrc, toSrc)

  showFlaps.value = true
  await nextTick()

  backgroundPanelSrc.value = toSrc

  if (!isImage2.value) {
    flipStore.flipForward()
  } else {
    flipStore.flipBackward()
  }

  const tileCount = flipStore.tileCount
  const baseDelay = 80
  const transformDuration = 700
  const fudge = 250
  const totalDuration = (tileCount - 1) * baseDelay + transformDuration + fudge

  setTimeout(() => {
    currentImage.value = toSrc
    otherImage.value = fromSrc
    isImage2.value = currentImage.value === image2.value

    backgroundPanelSrc.value = currentImage.value
    frontPanelSrc.value = currentImage.value

    showFlaps.value = false
    isAnimating.value = false
  }, totalDuration)
}
</script>

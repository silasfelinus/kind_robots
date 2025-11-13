// /components/experiments/flip-stepper.vue
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="backgroundPanelSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <flip-animation v-if="showFlaps" :tiles="tileViews" :flipped="flipped" />

      <div
        class="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-black/25"
      ></div>
      <div
        class="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-black/15"
      ></div>

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
      >
        Step {{ currentStepNumber }} of {{ totalSteps }} •
        {{ currentStepLabel }}
      </div>
    </div>

    <div
      class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-3 flex flex-col gap-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-xs sm:btn-sm btn-primary rounded-full"
          @click="runNextStep"
        >
          {{ nextButtonLabel }}
        </button>
        <button
          type="button"
          class="btn btn-xs sm:btn-sm btn-ghost rounded-full"
          @click="hardReset"
        >
          Hard reset
        </button>
        <span class="text-[11px] opacity-70">
          Current image:
          <span class="font-semibold">{{ currentImage }}</span> • Next image:
          <span class="font-semibold">{{ otherImage }}</span>
        </span>
      </div>

      <div class="text-[12px] leading-snug bg-base-300/60 rounded-xl px-3 py-2">
        <p class="font-semibold mb-1">What just happened:</p>
        <p>{{ currentExplanation }}</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        <div class="rounded-xl border border-base-300 bg-base-100/60 p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="opacity-80">Background panel</span>
            <span class="px-1.5 py-0.5 rounded bg-primary/20">
              backgroundPanelSrc
            </span>
          </div>
          <div class="break-all opacity-75">{{ backgroundPanelSrc }}</div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-100/60 p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="opacity-80">Front panel face</span>
            <span class="px-1.5 py-0.5 rounded bg-secondary/20">
              frontPanelSrc
            </span>
          </div>
          <div class="break-all opacity-75">{{ frontPanelSrc }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FlipAnimation, {
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

const showFlaps = ref(false)
const flipped = ref<boolean[]>([])

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const backgroundPanelSrc = ref<string>(currentImage.value)
const frontPanelSrc = ref<string>(currentImage.value)

function initFlaps() {
  flipped.value = tiles.value.map(() => false)
}

initFlaps()

function tileVars(tile: TileDef): Record<string, string> {
  const colWidth = 100 / cols.value
  const segHeight = 100 / totalSegments.value

  const left = colWidth * tile.col
  const right = 100 - colWidth * (tile.col + 1)

  const top = segHeight * tile.row
  const bottom = 100 - segHeight * (tile.row + 1)

  const colCenter = left + colWidth / 2
  const rowCenterFront = top + segHeight / 2

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

type StepKind = 'prepare' | 'swapBackground' | 'flipTile' | 'finalize'

interface Step {
  id: number
  kind: StepKind
  label: string
  description: string
  tileIndex?: number
}

const steps: Step[] = [
  {
    id: 0,
    kind: 'prepare',
    label: 'Prepare flaps over the current image',
    description:
      'We take the current image and build a full front panel of flaps that exactly match it, so the picture does not appear to change yet.',
  },
  {
    id: 1,
    kind: 'swapBackground',
    label: 'Swap the hidden background to the next image',
    description:
      'Behind the flaps, we quietly swap the unmoving background panel to the next image, but the viewer still sees only the original image on the flaps.',
  },
  {
    id: 2,
    kind: 'flipTile',
    tileIndex: 1,
    label: 'Flip the top-right segment',
    description:
      'The top-right segment flips down, first exposing its back face, then revealing a glimpse of the next image underneath.',
  },
  {
    id: 3,
    kind: 'flipTile',
    tileIndex: 3,
    label: 'Flip the middle-right segment',
    description:
      'The middle-right segment flips down, using a patch of the new image on its back so the bottom third of the next image appears to grow upward.',
  },
  {
    id: 4,
    kind: 'flipTile',
    tileIndex: 0,
    label: 'Flip the top-left segment',
    description:
      'Now the top-left segment flips, mirroring the motion on the right and extending the reveal of the new image across the top.',
  },
  {
    id: 5,
    kind: 'flipTile',
    tileIndex: 2,
    label: 'Flip the middle-left segment',
    description:
      'The middle-left segment completes the drop, so the visible panel now matches the next image everywhere the animation touched.',
  },
  {
    id: 6,
    kind: 'finalize',
    label: 'Finalize and reset to a clean new panel',
    description:
      'We remove the flaps and commit the new image as the current panel, ready to run the same sequence in reverse on the next toggle.',
  },
]

const nextStepIndex = ref<number>(0)
const currentStepLabel = ref<string>('Idle')
const currentExplanation = ref<string>(
  'No step has run yet. Press “Next step” to see how the flip is constructed.',
)
const currentStepNumber = ref<number>(0)

const totalSteps = computed(() => steps.length)

const nextButtonLabel = computed(() =>
  nextStepIndex.value === 0 && currentStepNumber.value === 0
    ? 'Start sequence'
    : nextStepIndex.value === 0
      ? 'Restart sequence'
      : 'Next step',
)

function applyStep(step: Step) {
  if (step.kind === 'prepare') {
    frontPanelSrc.value = currentImage.value
    backgroundPanelSrc.value = currentImage.value
    showFlaps.value = true
    initFlaps()
  } else if (step.kind === 'swapBackground') {
    backgroundPanelSrc.value = otherImage.value
  } else if (step.kind === 'flipTile' && step.tileIndex != null) {
    if (flipped.value[step.tileIndex] !== undefined) {
      flipped.value[step.tileIndex] = true
    }
  } else if (step.kind === 'finalize') {
    const temp = currentImage.value
    currentImage.value = otherImage.value
    otherImage.value = temp
    backgroundPanelSrc.value = currentImage.value
    frontPanelSrc.value = currentImage.value
    showFlaps.value = false
    initFlaps()
  }

  currentStepLabel.value = step.label
  currentExplanation.value = step.description
}

function runNextStep() {
  const step = steps[nextStepIndex.value]
  applyStep(step)

  currentStepNumber.value = step.id + 1

  nextStepIndex.value += 1
  if (nextStepIndex.value >= steps.length) {
    nextStepIndex.value = 0
  }
}

function hardReset() {
  currentImage.value = image1.value
  otherImage.value = image2.value
  backgroundPanelSrc.value = currentImage.value
  frontPanelSrc.value = currentImage.value
  showFlaps.value = false
  nextStepIndex.value = 0
  currentStepNumber.value = 0
  currentStepLabel.value = 'Idle'
  currentExplanation.value =
    'Hard reset: the panel is back to the first image with no flaps active.'
  initFlaps()
}
</script>

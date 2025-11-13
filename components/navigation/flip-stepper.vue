<!-- /components/experiments/flip-stepper.vue -->
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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
        <div class="rounded-xl border border-base-300 bg-base-100/60 p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="opacity-80">Main panel • front face</span>
            <span class="px-1.5 py-0.5 rounded bg-secondary/20">
              frontPanelSrc
            </span>
          </div>
          <div class="break-all opacity-75 mb-1">
            {{ frontPanelSrc }}
          </div>
          <div class="mt-1 space-y-0.5">
            <div
              v-for="row in frontFaceRows"
              :key="row.id"
              class="flex items-center justify-between"
            >
              <span class="opacity-70">{{ row.label }}</span>
              <span class="opacity-80 truncate max-w-[10rem]">
                {{ row.image }}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-100/60 p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="opacity-80">Main panel • back / reverse</span>
            <span class="px-1.5 py-0.5 rounded bg-accent/20">
              reverse (back)
            </span>
          </div>
          <div class="break-all opacity-75 mb-1">
            Top: logo, middle: bottom third of next, bottom: none
          </div>
          <div class="mt-1 space-y-0.5">
            <div
              v-for="row in frontBackRows"
              :key="row.id"
              class="flex items-center justify-between"
            >
              <span class="opacity-70">{{ row.label }}</span>
              <span class="opacity-80 truncate max-w-[10rem]">
                {{ row.image || '(none)' }}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-100/60 p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="opacity-80">Rear panel</span>
            <span class="px-1.5 py-0.5 rounded bg-primary/20">
              backgroundPanelSrc
            </span>
          </div>
          <div class="break-all opacity-75 mb-1">
            {{ backgroundPanelSrc }}
          </div>
          <div class="mt-1 space-y-0.5">
            <div
              v-for="row in rearRows"
              :key="row.id"
              class="flex items-center justify-between"
            >
              <span class="opacity-70">{{ row.label }}</span>
              <span class="opacity-80 truncate max-w-[10rem]">
                {{ row.image }}
              </span>
            </div>
          </div>
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
  const rowCenterBack = 100 - segHeight / 2

  const isTopRow = tile.row === 0
  const isMiddleRow = tile.row === 1
  const isBottomRow = tile.row === 2

  let backImageSrc = ''
  if (isTopRow) {
    backImageSrc = logoSrc.value
  } else if (isMiddleRow) {
    backImageSrc = otherImage.value
  } else if (isBottomRow) {
    backImageSrc = ''
  }

  const hasBackImage = backImageSrc ? '1' : '0'

  return {
    '--flip-image-front': `url("${frontPanelSrc.value}")`,
    '--flip-image-back': backImageSrc ? `url("${backImageSrc}")` : 'none',
    '--flip-back-has-image': hasBackImage,
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

type StepKind = 'prepare' | 'flipRow' | 'finalize'

interface Step {
  id: number
  kind: StepKind
  label: string
  description: string
  rowIndex?: number
}

const steps: Step[] = [
  {
    id: 0,
    kind: 'prepare',
    label: 'Create rear panel and reverse collage',
    description:
      'We keep the current image on the front, add the next image as a rear panel, and build the reverse of the main panel: logo on top, bottom third of the next image in the middle, and an empty bottom strip.',
  },
  {
    id: 1,
    kind: 'flipRow',
    rowIndex: 0,
    label: 'Drop the top row of flaps',
    description:
      'The top row of flaps flips down, showing the upside-down logo first and then exposing the new image behind where the flaps no longer cover.',
  },
  {
    id: 2,
    kind: 'flipRow',
    rowIndex: 1,
    label: 'Drop the middle row of flaps',
    description:
      'The middle row flips, using the bottom-third strip of the next image on its back, so visually the new image now fills the top two-thirds of the panel.',
  },
  {
    id: 3,
    kind: 'finalize',
    label: 'Commit to the new image',
    description:
      'We remove the flaps and rebuild the main panel so the entire front matches the new image. Rear and reverse are ready to be rebuilt on the next sequence.',
  },
]

const nextStepIndex = ref<number>(0)
const currentStepLabel = ref<string>('Idle')
const currentExplanation = ref<string>(
  'No step has run yet. Press “Next step” to walk through the flip sequence.',
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
    backgroundPanelSrc.value = otherImage.value
    showFlaps.value = true
    initFlaps()
  } else if (step.kind === 'flipRow' && step.rowIndex != null) {
    tiles.value.forEach((tile) => {
      if (
        tile.row === step.rowIndex &&
        flipped.value[tile.index] !== undefined
      ) {
        flipped.value[tile.index] = true
      }
    })
  } else if (step.kind === 'finalize') {
    const temp = currentImage.value
    currentImage.value = otherImage.value
    otherImage.value = temp
    frontPanelSrc.value = currentImage.value
    backgroundPanelSrc.value = currentImage.value
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

interface PanelRowDebug {
  id: string
  label: string
  image: string
}

const frontFaceRows = computed<PanelRowDebug[]>(() => [
  {
    id: 'front-top',
    label: 'Top row',
    image: frontPanelSrc.value,
  },
  {
    id: 'front-middle',
    label: 'Middle row',
    image: frontPanelSrc.value,
  },
  {
    id: 'front-bottom',
    label: 'Bottom row',
    image: frontPanelSrc.value,
  },
])

const frontBackRows = computed<PanelRowDebug[]>(() => [
  {
    id: 'back-top',
    label: 'Top row (logo, upside-down)',
    image: logoSrc.value,
  },
  {
    id: 'back-middle',
    label: 'Middle row (bottom third of next, upside-down)',
    image: otherImage.value,
  },
  {
    id: 'back-bottom',
    label: 'Bottom row (empty, shows rear)',
    image: '',
  },
])

const rearRows = computed<PanelRowDebug[]>(() => [
  {
    id: 'rear-top',
    label: 'Top row',
    image: backgroundPanelSrc.value,
  },
  {
    id: 'rear-middle',
    label: 'Middle row',
    image: backgroundPanelSrc.value,
  },
  {
    id: 'rear-bottom',
    label: 'Bottom row',
    image: backgroundPanelSrc.value,
  },
])
</script>

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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
        <div
          class="rounded-xl border border-base-300 bg-base-100/60 p-2 space-y-1.5"
        >
          <div class="flex items-center justify-between">
            <span class="opacity-80">Main panel • front face</span>
            <span class="px-1.5 py-0.5 rounded bg-secondary/20">
              front
            </span>
          </div>
          <div
            class="aspect-[4/3] rounded-lg overflow-hidden border border-base-300/70"
          >
            <div class="w-full h-full" :style="frontPreviewStyle"></div>
          </div>
          <p class="opacity-70 truncate">
            {{ frontPanelSrc }}
          </p>
        </div>

        <div
          class="rounded-xl border border-base-300 bg-base-100/60 p-2 space-y-1.5"
        >
          <div class="flex items-center justify-between">
            <span class="opacity-80">Main panel • reverse</span>
            <span class="px-1.5 py-0.5 rounded bg-accent/20">
              back collage
            </span>
          </div>
          <div
            class="aspect-[4/3] rounded-lg overflow-hidden border border-base-300/70 grid grid-rows-3"
          >
            <div
              v-for="row in backRowStyles"
              :key="row.id"
              class="w-full h-full"
              :style="row.style"
            ></div>
          </div>
          <ul class="space-y-0.5 opacity-75">
            <li v-for="row in backRowStyles" :key="row.id + '-label'">
              {{ row.label }}
            </li>
          </ul>
        </div>

        <div
          class="rounded-xl border border-base-300 bg-base-100/60 p-2 space-y-1.5"
        >
          <div class="flex items-center justify-between">
            <span class="opacity-80">Rear panel</span>
            <span class="px-1.5 py-0.5 rounded bg-primary/20">
              background
            </span>
          </div>
          <div
            class="aspect-[4/3] rounded-lg overflow-hidden border border-base-300/70"
          >
            <div class="w-full h-full" :style="rearPreviewStyle"></div>
          </div>
          <p class="opacity-70 truncate">
            {{ backgroundPanelSrc }}
          </p>
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

const cols = ref<number>(1)
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
      'We keep the current image on the front, add the next image as the rear panel, and build the reverse of the main panel: upside-down logo on top, upside-down bottom third of the next image in the middle, and an empty bottom strip.',
  },
  {
    id: 1,
    kind: 'flipRow',
    rowIndex: 0,
    label: 'Drop the top row of flaps',
    description:
      'The top row of flaps flips down, showing the upside-down logo first and then exposing the new image where it no longer covers.',
  },
  {
    id: 2,
    kind: 'flipRow',
    rowIndex: 1,
    label: 'Drop the middle row of flaps',
    description:
      'The middle row flips, using the bottom-third strip of the next image on its back, so visually the new image now fills the top two-thirds.',
  },
  {
    id: 3,
    kind: 'finalize',
    label: 'Commit to the new image',
    description:
      'We remove the flaps and rebuild the main panel so the entire front matches the new image, ready for the next sequence.',
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
    backgroundPanelSrc.value = otherImage.value
    currentStepLabel.value = step.label
    currentExplanation.value = step.description
    return
  }

  if (step.kind === 'flipRow' && step.rowIndex != null) {
    if (!showFlaps.value) {
      showFlaps.value = true
      initFlaps()
    }
    tiles.value.forEach((tile) => {
      if (tile.row === step.rowIndex && flipped.value[tile.index] !== undefined) {
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

interface BackRowStyle {
  id: string
  label: string
  style: Record<string, string>
}

const frontPreviewStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url("${frontPanelSrc.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}))

const rearPreviewStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url("${backgroundPanelSrc.value}")`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}))

const backRowStyles = computed<BackRowStyle[]>(() => [
  {
    id: 'back-top',
    label: 'Top: upside-down logo ×3',
    style: {
      backgroundImage: `url("${logoSrc.value}"), url("${logoSrc.value}"), url("${logoSrc.value}")`,
      backgroundSize: '100% 33%, 100% 33%, 100% 33%',
      backgroundPosition: 'top center, center center, bottom center',
      backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
      transform: 'scaleY(-1)',
      backgroundColor: 'transparent',
    },
  },
  {
    id: 'back-middle',
    label: 'Middle: upside-down bottom third of next image',
    style: {
      backgroundImage: `url("${otherImage.value}")`,
      backgroundSize: '100% 300%',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat',
      transform: 'scaleY(-1)',
      backgroundColor: 'transparent',
    },
  },
  {
    id: 'back-bottom',
    label: 'Bottom: empty (rear shows through)',
    style: {
      backgroundImage:
        'repeating-linear-gradient(45deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 4px, transparent 4px, transparent 8px)',
      backgroundSize: '16px 16px',
      backgroundPosition: 'center',
      backgroundRepeat: 'repeat',
      transform: 'none',
      backgroundColor: 'rgba(0,0,0,0.03)',
    },
  },
])
</script>
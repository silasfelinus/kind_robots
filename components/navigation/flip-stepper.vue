// /components/experiments/flip-stepper.vue
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl"
    >
      <div class="absolute inset-0 z-0">
        <img
          :src="frontPanelSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <FlipAnimation v-if="showFlaps" />

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
            <span class="px-1.5 py-0.5 rounded bg-secondary/20"> front </span>
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
            <span class="opacity-80">Main panel • reverse collage</span>
            <span class="px-1.5 py-0.5 rounded bg-accent/20">
              logos + special strip
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
            {{ hasRearPanel ? backgroundPanelSrc : 'none (no rear panel yet)' }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/experiments/flip-stepper.vue
import { ref, computed } from 'vue'
import FlipAnimation from '@/components/navigation/flip-animation.vue'
import { useFlipStore } from '@/stores/flipStore'

const flipStore = useFlipStore()

const image1 = ref<string>('/images/backtree.webp')
const image2 = ref<string>('/images/botcafe.webp')
const logoSrcA = ref<string>('/images/old_logo.webp')
const logoSrcB = ref<string>('/images/chest1.webp')

const currentImage = ref<string>(image1.value)
const otherImage = ref<string>(image2.value)

const frontPanelSrc = ref<string>(currentImage.value)
const backgroundPanelSrc = ref<string>('')
const hasRearPanel = ref(false)
const showFlaps = ref(false)

type StepKind = 'prepare' | 'flipSegments' | 'finalize'

interface Step {
  id: number
  kind: StepKind
  label: string
  description: string
  segments?: number[]
}

const steps: Step[] = [
  {
    id: 0,
    kind: 'prepare',
    label: 'Build rear panel and 2×6 reverse collage',
    description:
      'We keep the current image on the front, quietly swap the rear panel to the next image, and build a 2×6 reverse collage on the back of the flaps: alternating logo rows, then a special bottom strip sampled from the new image.',
  },
  {
    id: 1,
    kind: 'flipSegments',
    segments: [0, 1],
    label: 'Drop the top segments',
    description:
      'The upper segments flip down first, like the top rows of a split-flap display. They briefly show logo panels on their backs, then reveal more of the new image underneath.',
  },
  {
    id: 2,
    kind: 'flipSegments',
    segments: [2, 3, 4],
    label: 'Drop the remaining segments',
    description:
      'The lower segments follow in sequence until the special bottom strip flips, completing the reveal of the new image across the whole panel.',
  },
  {
    id: 3,
    kind: 'finalize',
    label: 'Commit to the new image',
    description:
      'We remove the flaps, promote the rear panel to be the new front, clear the rear, and reset everything so the next click can run the effect in reverse.',
  },
]

const nextStepIndex = ref<number>(0)
const currentStepLabel = ref<string>('Idle')
const currentExplanation = ref<string>(
  'No step has run yet. Press “Start sequence” to walk through the flip animation.',
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

function prepareTileStyles(fromSrc: string, toSrc: string) {
  if (!flipStore.isPrepared) {
    flipStore.buildTiles()
  }

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
}

function clearFlips() {
  if (!flipStore.isPrepared) return
  const count = flipStore.tileCount
  const next: boolean[] = []
  for (let i = 0; i < count; i += 1) {
    next.push(false)
  }
  flipStore.flipped = next
}

function applyStep(step: Step) {
  if (step.kind === 'prepare') {
    if (!flipStore.isPrepared) {
      flipStore.buildTiles()
    }

    backgroundPanelSrc.value = otherImage.value
    hasRearPanel.value = true

    prepareTileStyles(currentImage.value, otherImage.value)

    clearFlips()
    showFlaps.value = true

    currentStepLabel.value = step.label
    currentExplanation.value = step.description
    return
  }

  if (step.kind === 'flipSegments' && step.segments && step.segments.length) {
    if (!flipStore.isPrepared) {
      flipStore.buildTiles()
    }

    showFlaps.value = true

    const cols = flipStore.config.cols

    step.segments.forEach((segRow) => {
      for (let col = 0; col < cols; col += 1) {
        const index = segRow * cols + col
        if (flipStore.flipped[index] !== undefined) {
          flipStore.flipped[index] = true
        }
      }
    })
  } else if (step.kind === 'finalize') {
    const temp = currentImage.value
    currentImage.value = otherImage.value
    otherImage.value = temp

    frontPanelSrc.value = currentImage.value
    backgroundPanelSrc.value = ''
    hasRearPanel.value = false
    showFlaps.value = false

    clearFlips()
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
  frontPanelSrc.value = currentImage.value
  backgroundPanelSrc.value = ''
  hasRearPanel.value = false
  showFlaps.value = false

  nextStepIndex.value = 0
  currentStepNumber.value = 0
  currentStepLabel.value = 'Idle'
  currentExplanation.value =
    'Hard reset: the panel is back to the first image with no rear panel and no flaps active.'

  clearFlips()
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

const rearPreviewStyle = computed<Record<string, string>>(() =>
  hasRearPanel.value
    ? {
        backgroundImage: `url("${backgroundPanelSrc.value}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 4px, transparent 4px, transparent 8px)',
        backgroundSize: '16px 16px',
        backgroundPosition: 'center',
      },
)

const backRowStyles = computed<BackRowStyle[]>(() => [
  {
    id: 'back-top',
    label: 'Upper bands: upside-down logos and chest panels',
    style: {
      backgroundImage: `url("${logoSrcA.value}"), url("${logoSrcB.value}")`,
      backgroundSize: '100% 50%, 100% 50%',
      backgroundPosition: 'top center, bottom center',
      backgroundRepeat: 'no-repeat, no-repeat',
      transform: 'scaleY(-1)',
      backgroundColor: 'transparent',
    },
  },
  {
    id: 'back-middle',
    label: 'Middle: alternating logo / chest segments',
    style: {
      backgroundImage: `url("${logoSrcA.value}"), url("${logoSrcB.value}")`,
      backgroundSize: '50% 100%, 50% 100%',
      backgroundPosition: 'left center, right center',
      backgroundRepeat: 'no-repeat, no-repeat',
      transform: 'scaleY(-1)',
      backgroundColor: 'transparent',
    },
  },
  {
    id: 'back-bottom',
    label: 'Bottom: special strip from the next image (final reveal)',
    style: {
      backgroundImage: `url("${otherImage.value}")`,
      backgroundSize: '100% 300%',
      backgroundPosition: 'center bottom',
      backgroundRepeat: 'no-repeat',
      transform: 'scaleY(-1)',
      backgroundColor: 'transparent',
    },
  },
])
</script>

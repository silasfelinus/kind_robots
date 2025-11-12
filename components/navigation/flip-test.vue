<!-- /components/experiments/flip-test.vue -->
<template>
  <section class="relative w-full max-w-4xl mx-auto">
    <div
      class="relative w-full aspect-[16/9] rounded-2xl border border-base-300 bg-base-200 overflow-hidden shadow-xl cursor-pointer"
      :aria-label="ariaLabel"
      aria-live="polite"
      @click="runExchange"
    >
      <div class="absolute inset-0">
        <img
          :src="currentSrc"
          alt=""
          class="w-full h-full object-cover select-none pointer-events-none"
          draggable="false"
        />
      </div>

      <div
        v-for="(col, i) in columns"
        :key="i"
        class="flap-wrapper"
        :class="{ 'is-flipped': flipped[i] }"
        :style="columnVars(i)"
      >
        <div class="face face-front"></div>
        <div class="face face-back"></div>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/20"
      ></div>

      <div
        class="absolute left-2 top-2 z-20 px-2 py-1 rounded-md bg-base-300/85 text-[11px] font-semibold"
      >
        {{
          isAnimating
            ? `Flipping col ${activeColLabel} • phase: ${
                isLogoPhaseComputed ? 'logo' : 'swap'
              }`
            : hasShownLogo
              ? 'Phase 2 • click to reveal background'
              : 'Phase 1 • click to reveal logo grid'
        }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Image 1 (current)</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-primary/20"
            >front/top-half</span
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
          <span class="text-xs opacity-80">Image 2 (next)</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20"
            >back/bottom-half</span
          >
        </div>
        <div class="mt-1 text-[11px] break-all opacity-80">{{ nextSrc }}</div>
        <div class="mt-2 h-20 w-full overflow-hidden rounded-lg">
          <div
            class="h-full w-full bg-cover bg-center"
            :style="{ backgroundImage: `url('${nextSrc}')` }"
          ></div>
        </div>
      </div>

      <div class="rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="flex items-center justify-between">
          <span class="text-xs opacity-80">Run config</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-info/20"
            >debug</span
          >
        </div>
        <div class="mt-1 text-[11px] opacity-80">
          columns: {{ cols }} • chain: right→left • phase:
          {{ isLogoPhaseComputed ? 'logo (logo_old.webp)' : 'swap (bg)' }}
        </div>
        <div class="mt-2 flex items-center gap-2 text-[11px]">
          <label class="inline-flex items-center gap-1">
            <input
              type="checkbox"
              class="toggle toggle-xs"
              v-model="usePlaceholderBackForNonLast"
            />
            <span>placeholder on non-last</span>
          </label>
          <span class="opacity-60">placeholder: {{ placeholderBackSrc }}</span>
        </div>
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
        Click the image to run phased top-flip exchange
      </span>
      <span>
        {{
          isAnimating
            ? 'Animating…'
            : hasShownLogo
              ? 'Idle • next click = background phase'
              : 'Idle • next click = logo phase'
        }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const imgA = ref<string>('/images/backtree.webp')
const imgB = ref<string>('/images/botcafe.webp')
const logoSrc = ref<string>('/images/logo_old.webp')
const placeholderBackSrc = ref<string>('/images/botcafe.webp')

const cols = ref<number>(2)
const columns = computed(() => Array.from({ length: cols.value }, (_, i) => i))

const isAnimating = ref(false)
const flipped = ref<boolean[]>([])
const status = ref<string[]>([])
const activeCol = ref<number | null>(null)

const currentSrc = ref(imgA.value)
const nextSrc = ref(imgB.value)

const usePlaceholderBackForNonLast = ref(true)
const hasShownLogo = ref(false)

const ariaLabel = computed(() =>
  isAnimating.value
    ? 'Running phased vertical flip exchange'
    : 'Image ready; click to start phased vertical flip exchange',
)

const activeColLabel = computed(() =>
  activeCol.value === null ? '-' : `${activeCol.value + 1}/${cols.value}`,
)

const isLogoPhaseComputed = computed(() => !hasShownLogo.value)

function initState() {
  flipped.value = columns.value.map(() => false)
  status.value = columns.value.map(() => 'pending')
  activeCol.value = null
}

initState()

function columnVars(i: number) {
  const left = (100 / cols.value) * i
  const right = 100 - (100 / cols.value) * (i + 1)
  const center = left + 100 / cols.value / 2

  const isLastCol = i === 0
  const isLogoPhase = isLogoPhaseComputed.value

  const backSrc = isLogoPhase
    ? logoSrc.value
    : usePlaceholderBackForNonLast.value && !isLastCol
      ? placeholderBackSrc.value
      : nextSrc.value

  return {
    '--flip-image-front': `url("${currentSrc.value}")`,
    '--flip-image-back': `url("${backSrc}")`,
    '--col-left': `${left}%`,
    '--col-right': `${right}%`,
    '--col-center': `${center}%`,
  } as Record<string, string>
}

async function runExchange() {
  if (isAnimating.value) return

  isAnimating.value = true
  const isLogoPhase = isLogoPhaseComputed.value

  initState()
  await nextTick()

  const order = [...columns.value].reverse()

  for (const i of order) {
    activeCol.value = i
    status.value[i] = isLogoPhase ? 'logo' : 'swap'
    flipped.value[i] = true
    await wait(900)
    flipped.value[i] = false
    await wait(140)
  }

  if (isLogoPhase) {
    hasShownLogo.value = true
  } else {
    const oldCurrent = currentSrc.value
    currentSrc.value = nextSrc.value
    nextSrc.value = oldCurrent
    hasShownLogo.value = false
  }

  activeCol.value = null
  await wait(60)
  initState()
  isAnimating.value = false
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
</script>

<style scoped>
.flap-wrapper {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  perspective: 1200px;
  transform-origin: 50% 100%;
  transition: transform 900ms cubic-bezier(0.2, 0.7, 0.3, 1);
  clip-path: inset(0 var(--col-right) 50% var(--col-left));
}
.flap-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0));
  mix-blend-mode: multiply;
  transition: opacity 900ms ease;
  clip-path: inset(0 var(--col-right) 50% var(--col-left));
}
.flap-wrapper.is-flipped {
  transform: rotateX(-180deg);
}
.flap-wrapper.is-flipped::after {
  opacity: 0.22;
}

.face {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  clip-path: inset(0 var(--col-right) 50% var(--col-left));
}

.face-front {
  transform: rotateX(0deg) translateZ(0.01px);
  background-image: var(--flip-image-front);
  background-position: var(--col-center) top;
}

.face-back {
  transform: rotateX(180deg);
  background-image: var(--flip-image-back);
  background-position: var(--col-center) bottom;
  filter: brightness(0.96);
}
</style>

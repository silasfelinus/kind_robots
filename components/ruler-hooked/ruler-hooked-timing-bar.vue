<!-- components/ruler-hooked/ruler-hooked-timing-bar.vue
     The sliding-marker timing minigame that IS the "on the line" beat now
     (ruler-hooked/t-026). Silas, 2026-09-11, twice: "The fishing game aspect
     should be a sliding animation that requires stopping in the green for
     optimal percentage chance ... visual, not text based" / "on the line
     section should be visual experience." This replaces the old three-button
     Reel/Slack/Wait menu outright -- there is no button-choice step before
     this; the marker's stop position IS the input, resolved by
     resolveTimingStop() in utils/rulerHooked/timingBar.ts.

     The animation itself is purely client-side display: only the recorded
     stop position (emitted via `stop`) ever reaches the pure reducer
     (applyFishingStop in encounter.ts), so game-state determinism never
     depends on frame rate, device speed, or animation timing -- exactly the
     same "framework-free ... never elapsed milliseconds" contract the rest
     of the engine already keeps (encounter.ts's own file header). -->
<template>
  <div class="rounded-xl border border-base-300 bg-base-200/50 p-3">
    <div class="mb-2 flex items-center justify-between text-xs font-semibold">
      <span class="opacity-70">Stop the marker in the green</span>
      <span class="kr-badge-outline">{{ zoneLabel }}</span>
    </div>

    <button
      type="button"
      class="relative block h-10 w-full cursor-pointer overflow-hidden rounded-full border border-base-300 bg-base-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default"
      :disabled="stopped"
      :aria-label="`Stop the fishing timing bar. Current zone: ${zoneLabel}.`"
      @click="stop"
      @keydown.space.prevent="stop"
      @keydown.enter.prevent="stop"
    >
      <!-- SLACK zone -->
      <span
        class="absolute inset-y-0 left-0 flex items-center justify-start pl-2 text-sm opacity-70"
        :style="{ width: profile.bandStart + '%' }"
      >
        🨢
      </span>
      <!-- REEL zone (the green target band) -->
      <span
        class="absolute inset-y-0 flex items-center justify-center bg-success/30 text-sm"
        :style="{
          left: profile.bandStart + '%',
          width: profile.bandWidth + '%',
        }"
      >
        🎣
      </span>
      <!-- WAIT zone -->
      <span
        class="absolute inset-y-0 flex items-center justify-end pr-2 text-sm opacity-70"
        :style="{ left: profile.bandStart + profile.bandWidth + '%', right: 0 }"
      >
        👀
      </span>

      <!-- sliding marker -->
      <span
        class="absolute top-0 h-full w-1 -translate-x-1/2 rounded-full bg-neutral shadow"
        :class="{ 'bg-error': stopped }"
        :style="{ left: position + '%' }"
        aria-hidden="true"
      />
    </button>

    <p class="kr-text-faded-xs-55 mt-2" role="status" aria-live="polite">
      <template v-if="!stopped">
        Tap or press Space/Enter to stop the marker. Where it lands decides the
        outcome — the same seed and the same stops always reproduce the same
        catch.
      </template>
      <template v-else>
        Stopped in the {{ zoneLabel.toLowerCase() }} zone ({{
          Math.round(lastQuality * 100)
        }}% quality).
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import type {
  FishingAction,
  FishingEncounter,
} from '~/utils/rulerHooked/encounter'
import {
  resolveTimingStop,
  timingProfileFor,
} from '~/utils/rulerHooked/timingBar'

const props = defineProps<{ encounter: FishingEncounter }>()
const emit = defineEmits<{ stop: [position: number] }>()

const profile = computed(() => timingProfileFor(props.encounter))

const position = ref(0)
const stopped = ref(false)
const lastQuality = ref(0)
const ACTION_LABEL: Record<FishingAction, string> = {
  REEL: 'Reel',
  SLACK: 'Slack',
  WAIT: 'Wait',
}
const zoneLabel = computed(
  () => ACTION_LABEL[resolveTimingStop(position.value, profile.value).action],
)

let rafId: number | null = null
let startTime: number | null = null

function tick(now: number) {
  if (startTime === null) startTime = now
  const sweepMs = profile.value.sweepMs
  // Sunspoke Koi's APPROACH cue already says it "circles the lure without
  // committing" (buildEncounter() in encounter.ts) -- give the marker a
  // brief dwell at each end of its sweep so that hesitation is something the
  // player actually sees, not just reads. Display-only: only the recorded
  // stop position ever reaches applyFishingStop, so this never affects
  // outcome/determinism, matching the REVERSE_CONTROL mirror below.
  const isPatienceApproach =
    props.encounter.family === 'PATIENCE' &&
    props.encounter.phase === 'APPROACH'
  const dwellMs = isPatienceApproach ? sweepMs * 0.25 : 0
  const period = (sweepMs + dwellMs) * 2
  const elapsed = (now - startTime) % period
  let raw: number
  if (elapsed < dwellMs) {
    raw = 0
  } else if (elapsed < dwellMs + sweepMs) {
    raw = ((elapsed - dwellMs) / sweepMs) * 100
  } else if (elapsed < dwellMs * 2 + sweepMs) {
    raw = 100
  } else {
    raw = 100 - ((elapsed - dwellMs * 2 - sweepMs) / sweepMs) * 100
  }
  // REVERSE_CONTROL fish flip REEL/SLACK under the hood once `reversed` goes
  // true (effectiveAction() in encounter.ts) -- mirror the sweep itself so
  // the marker visibly starts from the opposite side instead of only the
  // zone meaning changing invisibly underneath an unchanged animation.
  position.value = props.encounter.reversed ? 100 - raw : raw
  rafId = requestAnimationFrame(tick)
}

function startSweep() {
  stopped.value = false
  startTime = null
  position.value = 0
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(tick)
}

function stop() {
  if (stopped.value) return
  stopped.value = true
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  lastQuality.value = resolveTimingStop(position.value, profile.value).quality
  emit('stop', position.value)
}

onMounted(startSweep)
onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})

// A fresh beat (new encounter.beat, still the same fishing attempt) means
// the parent has processed the previous stop and moved on -- start a new
// sweep with that beat's own (possibly harder) profile.
watch(() => props.encounter.beat, startSweep)
</script>

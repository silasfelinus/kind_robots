<template>
  <section class="rounded-2xl border border-primary/30 bg-base-100 p-4 shadow-sm" aria-labelledby="fishing-encounter-title">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-wide opacity-55">On the line</p>
        <h3 id="fishing-encounter-title" class="text-xl font-black">{{ encounter.fishName }}</h3>
        <p class="mt-1 text-xs opacity-65">{{ encounter.rarity }} · {{ encounter.affinity }} · {{ familyLabel }}</p>
      </div>
      <span class="badge badge-outline">Beat {{ encounter.beat }}/{{ encounter.maxBeats }}</span>
    </div>

    <p class="mt-3 text-sm opacity-80">{{ encounter.catchBehavior }}</p>

    <div class="mt-4 grid gap-3">
      <label class="grid gap-1 text-xs font-semibold">
        <span class="flex justify-between gap-2">
          <span>Landing progress</span>
          <span>{{ Math.round(encounter.progress) }}%</span>
        </span>
        <progress class="progress progress-success w-full" :value="encounter.progress" max="100" />
      </label>

      <label class="grid gap-1 text-xs font-semibold">
        <span class="flex justify-between gap-2">
          <span>Line tension</span>
          <span>{{ Math.round(encounter.tension) }}%</span>
        </span>
        <progress class="progress progress-warning w-full" :value="encounter.tension" max="100" />
      </label>
    </div>

    <div
      class="mt-4 kr-panel-tint-compact text-sm font-semibold"
      role="status"
      aria-live="polite"
    >
      <span v-if="encounter.reversed" class="badge badge-error badge-sm mr-2">Controls reversed</span>
      {{ encounter.cue }}
    </div>

    <div class="mt-4 flex flex-wrap gap-2" aria-label="Fishing actions">
      <button type="button" class="btn btn-primary flex-1" @click="emit('action', 'REEL')">
        🎣 Reel
      </button>
      <button type="button" class="btn btn-secondary flex-1" @click="emit('action', 'SLACK')">
        🪢 Give slack
      </button>
      <button type="button" class="btn btn-ghost flex-1" @click="emit('action', 'WAIT')">
        👀 Wait
      </button>
    </div>

    <p class="mt-3 text-xs opacity-55">
      Fishing is beat-based, not twitch-based. Read the cue, choose an action, and the same action sequence will reproduce the same encounter.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { FishingAction, FishingEncounter } from '~/utils/rulerHooked/encounter'

const props = defineProps<{ encounter: FishingEncounter }>()
const emit = defineEmits<{ action: [action: FishingAction] }>()

const familyLabel = computed(() => ({
  STANDARD_TENSION: 'steady tension',
  PATIENCE: 'patience',
  REVERSE_CONTROL: 'inside-out line',
}[props.encounter.family]))
</script>

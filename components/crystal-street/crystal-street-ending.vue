<template>
  <section
    v-if="run?.ending && ending"
    class="kr-panes grid-cols-1 gap-3 @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
    aria-label="The end of the week"
  >
    <crystal-street-art
      class="cs-frame min-h-48 @3xl:min-h-0"
      frame="h-full"
      kind="ending"
      :seed="`${villain.id}:${run.ending.tier}`"
      :src="`/crystal-street/endings/${villain.id}-${run.ending.tier}.webp`"
      :palette="villain.palette"
      :sigil="villain.sigil"
      :alt="ending.art"
      :brief="ending.art"
    >
      <span
        class="cs-stamp absolute right-3 top-3"
        :class="`cs-stamp-${run.ending.tier}`"
        >{{ TIER_LABELS[run.ending.tier] }}</span
      >
    </crystal-street-art>
    <div class="kr-pane cs-frame">
      <div class="kr-pane-scroll space-y-3 p-4">
        <p class="cs-kicker">
          {{ villain.name }} · {{ DAY_NAMES[run.day - 1] }}
        </p>
        <h2 class="cs-display text-3xl leading-tight">{{ ending.title }}</h2>
        <p class="leading-relaxed">{{ ending.text }}</p>
        <ul class="flex flex-wrap gap-1 text-xs">
          <li class="cs-pill">Leads {{ run.clues.length }}/3</li>
          <li class="cs-pill">Night wins {{ run.wins }}/{{ BEST_WINS }}</li>
          <li class="cs-pill">Crew {{ run.crew.length }}</li>
          <li class="cs-pill cs-pill-good">Pasted into your scrapbook</li>
        </ul>
        <p v-if="hint" class="text-sm opacity-80">{{ hint }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            @click="$emit('again')"
          >
            Another week
          </button>
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-2xl"
            @click="$emit('scrapbook')"
          >
            Open the scrapbook
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  BEST_WINS,
  DAY_NAMES,
  TIER_LABELS,
  endingOf,
  villainOf,
} from '~/utils/crystalStreet/rules'

defineEmits<{ again: []; scrapbook: [] }>()

const store = useCrystalStreetStore()
const run = computed(() => store.run)
const villain = computed(() => villainOf(store.run!))
const ending = computed(() => (store.run ? endingOf(store.run) : null))
const hint = computed(() => {
  const r = store.run
  if (!r?.ending || r.ending.tier === 'best') return ''
  if (r.clues.length < 3)
    return 'The Best ending needs all three leads. Somebody in town knows the real story.'
  if (r.wins < BEST_WINS)
    return `You understood the nightmare. Win ${BEST_WINS} night rolls in a week and reach its heart for the Best ending.`
  return 'You had everything you needed. Reach for its heart on Halloween.'
})
</script>

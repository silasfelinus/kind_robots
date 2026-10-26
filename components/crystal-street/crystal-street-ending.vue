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
      :seed="`${villain.id}:${run.ending.special ?? run.ending.tier}`"
      :src="
        collapse
          ? `/crystal-street/endings/special-${run.ending.special}.webp`
          : `/crystal-street/villains/${villain.id}-ending.webp`
      "
      :palette="villain.palette"
      :sigil="villain.sigil"
      :alt="collapse ? special!.art : villain.endingPhoto"
    >
      <span
        class="cs-stamp absolute right-3 top-3"
        :class="`cs-stamp-${run.ending.tier}`"
        >{{ collapse ? 'Special ending' : TIER_LABELS[run.ending.tier] }}</span
      >
      <span
        v-if="run.ending.special === 'final-girl'"
        class="cs-stamp cs-stamp-best absolute left-3 top-3"
        data-testid="cs-final-girl"
        >Final Girl</span
      >
    </crystal-street-art>
    <div class="kr-pane cs-frame">
      <div class="kr-pane-scroll space-y-3 p-4">
        <p class="cs-kicker">
          {{ villain.name }} · {{ DAY_NAMES[run.day - 1] }}
        </p>
        <h2 class="cs-display text-3xl leading-tight">
          {{ collapse ? special!.title : ending.title }}
        </h2>
        <p class="leading-relaxed">
          {{ collapse ? special!.text : ending.text }}
        </p>
        <p
          v-if="run.ending.special === 'final-girl' && special"
          class="cs-card p-3 text-sm leading-relaxed"
        >
          <strong>{{ special.title }}.</strong> {{ special.text }}
        </p>
        <ul class="flex flex-wrap gap-1 text-xs">
          <li class="cs-pill">Leads {{ run.clues.length }}/3</li>
          <li class="cs-pill">Night wins {{ run.wins }}/{{ BEST_WINS }}</li>
          <li class="cs-pill">Crew {{ run.crew.length }}</li>
          <li v-if="loyal.length" class="cs-pill cs-pill-good">
            Loyal: {{ loyal.join(', ') }}
          </li>
          <li class="cs-pill cs-pill-good">Pasted into your scrapbook</li>
        </ul>
        <p v-if="hint" class="text-sm opacity-80">{{ hint }}</p>
        <PlaybookRunReview
          game="crystal-street"
          :run="run"
          :ending="run.ending.special ?? run.ending.tier"
        />
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
  companionById,
  endingOf,
  isLoyal,
  shortName,
  specialEndingOf,
  villainOf,
} from '~/utils/crystalStreet/rules'

defineEmits<{ again: []; scrapbook: [] }>()

const store = useCrystalStreetStore()
const run = computed(() => store.run)
const villain = computed(() => villainOf(store.run!))
const ending = computed(() => (store.run ? endingOf(store.run) : null))
const special = computed(() => (store.run ? specialEndingOf(store.run) : null))
const collapse = computed(
  () =>
    !!store.run?.ending?.special && store.run.ending.special !== 'final-girl',
)
const hint = computed(() => {
  const r = store.run
  if (!r?.ending || r.ending.tier === 'best') return ''
  if (collapse.value)
    return 'Every group in town has a limit. Keep an eye on the standing meters on the You screen.'
  if (r.clues.length < 3)
    return 'The Best ending needs all three leads. Somebody in town knows the real story.'
  if (r.wins < BEST_WINS)
    return `You understood the nightmare. Win ${BEST_WINS} night rolls in a week and reach its heart for the Best ending.`
  return 'You had everything you needed. Reach for its heart on Halloween.'
})
const loyal = computed(() =>
  run.value
    ? run.value.crew
        .filter((id) => isLoyal(run.value!, id))
        .map((id) => shortName(companionById(id)?.name ?? ''))
    : [],
)
</script>

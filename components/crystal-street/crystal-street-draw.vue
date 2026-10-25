<template>
  <section
    v-if="run && villain"
    class="kr-panes grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-3"
    aria-label="Choose tonight's deck"
    data-testid="cs-draw"
  >
    <header class="cs-frame flex flex-wrap items-center gap-2 px-3 py-2">
      <div class="mr-auto">
        <p class="cs-kicker">
          Night {{ run.day }} · Act {{ ROMAN[act] }} · card
          {{ NIGHT_DRAWS - (run.draws ?? 0) + 1 }} of {{ NIGHT_DRAWS }}
        </p>
        <h2 class="cs-display text-xl leading-tight @3xl:text-2xl">
          What finds you tonight?
        </h2>
      </div>
      <p
        class="flex items-center gap-1 text-xs"
        aria-label="Edges for Halloween"
      >
        <span class="opacity-75">Edges for Halloween</span>
        <span
          v-for="n in [1, 2, 3]"
          :key="n"
          class="cs-pill"
          :class="edges.includes(n) ? 'cs-pill-good' : 'opacity-50'"
          :title="
            edges.includes(n)
              ? `You beat the nightmare in Act ${ROMAN[n]}`
              : `Beat a nightmare card in Act ${ROMAN[n]}`
          "
          >{{ ROMAN[n] }}</span
        >
      </p>
    </header>

    <div
      class="kr-panes min-h-0 grid-cols-1 grid-rows-2 gap-3 @2xl:grid-cols-2 @2xl:grid-rows-1"
    >
      <button
        type="button"
        class="cs-frame cs-deck relative min-h-0 overflow-hidden text-left"
        :disabled="!villainLeft"
        data-testid="cs-draw-villain"
        @click="store.drawFrom('villain')"
      >
        <crystal-street-art
          class="absolute inset-0"
          frame="h-full"
          kind="villain"
          :seed="villain.id"
          :src="`/crystal-street/villains/${villain.id}-poster.webp`"
          :palette="villain.palette"
          :sigil="villain.sigil"
          :alt="villain.poster"
        />
        <span
          class="absolute inset-x-0 bottom-0 block space-y-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 pt-10 text-white"
        >
          <span class="cs-kicker block text-secondary"
            >The nightmare's deck</span
          >
          <span class="cs-display block text-2xl leading-tight"
            >Face {{ faceName }}</span
          >
          <span class="block text-sm">
            {{
              villainLeft
                ? `Act ${ROMAN[act]}: ${villainLeft} of ${actSize} cards left. Harder, and every win carries an edge into Halloween.`
                : `You have faced every Act ${ROMAN[act]} card. It waits for the next act.`
            }}
          </span>
        </span>
      </button>

      <button
        type="button"
        class="cs-frame cs-deck relative min-h-0 overflow-hidden text-left"
        data-testid="cs-draw-street"
        @click="store.drawFrom('street')"
      >
        <crystal-street-art
          class="absolute inset-0"
          frame="h-full"
          kind="night"
          :seed="`street:${run.day}`"
          src="/crystal-street/locations/crystal-street.webp"
          :alt="'Crystal Street at night'"
        />
        <span
          class="absolute inset-x-0 bottom-0 block space-y-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 pt-10 text-white"
        >
          <span class="cs-kicker block text-secondary">The street deck</span>
          <span class="cs-display block text-2xl leading-tight"
            >Ride out the night</span
          >
          <span class="block text-sm">
            The ordinary terrors its kind brings to Crystal Street:
            {{
              villain.tags.map((t) => TAG_LABELS[t].toLowerCase()).join(', ')
            }}. Steadier, and every win still counts toward the Best ending.
          </span>
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  NIGHT_DRAWS,
  TAG_LABELS,
  actOf,
  edgesOf,
  shortName,
  villainDeck,
} from '~/utils/crystalStreet/rules'

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' }
const store = useCrystalStreetStore()
const run = computed(() => store.run)
const villain = computed(() => store.villain)
const act = computed(() => actOf(run.value?.day ?? 1))
const edges = computed(() => (run.value ? edgesOf(run.value) : []))
const villainLeft = computed(() =>
  run.value ? villainDeck(run.value).length : 0,
)
// "The Sugarlings" stays whole; "Counselor Jess" becomes Jess.
const faceName = computed(() => {
  const name = villain.value?.name ?? ''
  return name.startsWith('The ') ? name : shortName(name)
})
const actSize = computed(
  () => villain.value?.signature.filter((e) => e.act === act.value).length ?? 0,
)
</script>

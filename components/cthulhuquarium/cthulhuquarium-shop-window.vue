<!-- components/cthulhuquarium/cthulhuquarium-shop-window.vue
     What a visitor who is not signed in sees: the shop's own display tank,
     alive, through the window -- a curated cast drawn from every movement
     mode and plate -- with Charlotte at the door. The game itself needs an
     account, because a tank is persisted server-side; this is the reason to
     make one. -->
<template>
  <div class="flex flex-col gap-3">
    <cthulhuquarium-tank-view
      :occupants="occupants"
      background-key="parlour"
      :decor="[]"
    />

    <div
      class="flex flex-wrap items-end gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
    >
      <img
        :src="portraitFor('charlotte', 'welcome') ?? undefined"
        alt="Charlotte Fishmonger"
        class="-mt-16 h-40 w-28 shrink-0 object-contain object-bottom drop-shadow-xl"
      />
      <div class="flex min-w-60 flex-1 flex-col gap-2">
        <p class="font-serif text-base leading-snug">
          Come in, come in, out of all that. Whatever it is out there, it will
          keep. The first creature is on the house, darling; the tank is yours
          the moment you have a name I can write in the book.
        </p>
        <p class="text-xs italic opacity-60">
          Charlotte Fishmonger, of the Portsmouth Fishmongers
        </p>
      </div>
      <NuxtLink to="/login" class="btn btn-primary min-h-11">
        Step inside
      </NuxtLink>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
      <div
        v-for="occupant in occupants"
        :key="occupant.id"
        class="flex flex-col items-center gap-1 rounded-2xl border border-base-300 bg-base-200 p-2"
      >
        <cthulhuquarium-sprite
          :slug="occupant.slug"
          :label="occupant.name"
          :size="72"
          class="size-18"
        />
        <p class="truncate text-center text-xs font-bold">
          {{ occupant.name }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { portraitFor } from '~/utils/cthulhuquariumArt'
import { CTHULHUQUARIUM_SPECIES } from '~/utils/cthulhuquariumCanon.generated'

const SHOWCASE = [
  'guppy-common',
  'gravel-tetra',
  'penny-bream',
  'drifting-bell',
  'lamplight-angler',
  'bailiff-eel',
  'ledger-crab',
  'pane-limpet',
  'rainbow-nudibranch',
  'folding-fry',
  'kitchen-perch',
  'glass-shrimp',
]

const occupants = computed(() =>
  SHOWCASE.flatMap((slug, index) => {
    const species = CTHULHUQUARIUM_SPECIES[slug]
    return species
      ? [
          {
            id: index + 1,
            slug,
            name: species.name,
            behavior: species.behavior,
            size: species.size,
            hue: species.hue,
            hunger: 100,
          },
        ]
      : []
  }),
)
</script>

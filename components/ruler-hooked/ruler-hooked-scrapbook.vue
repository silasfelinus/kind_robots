<template>
  <section class="rh-scroll grid min-h-0 gap-3" aria-label="Royal Scrapbook">
    <header>
      <p class="rh-eyebrow">Treasures across every reign</p>
      <h2 class="rh-title rh-title--big">Royal Scrapbook</h2>
      <p class="text-sm">
        Discoveries survive new reigns and save deletion on this device.
      </p>
    </header>
    <div
      class="flex flex-wrap gap-2"
      role="group"
      aria-label="Scrapbook collection"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="rh-btn rh-btn--small"
        :aria-pressed="page === tab.id"
        @click="page = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <template v-if="page === 'endings'">
      <p class="font-bold">
        {{ summary.endings.size }} / {{ store.bundle.endings.length }} endings
      </p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article
          v-for="ending in store.bundle.endings"
          :key="ending.outcomeKey"
          class="overflow-hidden rounded-xl border p-2"
        >
          <template v-if="summary.endings.has(ending.outcomeKey)">
            <RulerHookedArt
              class="aspect-video rounded-lg"
              :candidates="endingCandidates(ending.outcomeKey)"
              :alt="ending.title"
            />
            <h3 class="rh-title mt-2">{{ ending.title }}</h3>
            <p>{{ ending.body }}</p>
          </template>
          <div
            v-else
            class="grid aspect-video place-items-center rounded-lg bg-slate-900 text-white"
          >
            <span class="text-3xl" aria-hidden="true">?</span>
            <span>Undiscovered ending</span>
          </div>
        </article>
      </div>
    </template>
    <template v-else-if="page === 'fish'">
      <p class="font-bold">
        {{ summary.fish.size }} / {{ roster.length }} species caught
      </p>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <article
          v-for="fish in roster"
          :key="fish.slug"
          class="overflow-hidden rounded-xl border p-2"
        >
          <template v-if="summary.fish.has(fish.slug)">
            <RulerHookedArt
              class="aspect-square rounded-lg"
              :candidates="fishCandidates(fish.slug)"
              :alt="fish.name"
            />
            <h3 class="font-bold">{{ fish.name }}</h3>
            <p class="text-xs">
              {{ summary.fish.get(fish.slug)?.count }} caught ·
              {{ summary.fish.get(fish.slug)?.bestSizeCm.toFixed(1) }} cm record
            </p>
          </template>
          <div
            v-else
            class="grid aspect-square place-items-center rounded-lg bg-slate-900 text-white"
          >
            <span class="text-3xl" aria-hidden="true">?</span>
            <span class="text-xs">{{ fish.rarity.toLowerCase() }} fish</span>
          </div>
        </article>
      </div>
    </template>
    <template v-else-if="page === 'characters'">
      <p class="font-bold">
        {{ summary.characters.size }} /
        {{ store.bundle.characters.length }} petitioners met
      </p>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <article
          v-for="character in store.bundle.characters"
          :key="character.slug"
          class="overflow-hidden rounded-xl border p-2"
        >
          <template v-if="summary.characters.has(character.slug)">
            <RulerHookedArt
              class="aspect-[3/4] rounded-lg"
              :candidates="characterCandidates(character.slug)"
              :alt="character.name"
            />
            <h3 class="font-bold">{{ character.name }}</h3>
            <p class="text-xs">{{ character.role }}</p>
          </template>
          <div
            v-else
            class="grid aspect-[3/4] place-items-center rounded-lg bg-slate-900 text-white"
          >
            <span class="text-3xl" aria-hidden="true">?</span>
            <span class="text-xs">Not yet met</span>
          </div>
        </article>
      </div>
    </template>
    <template v-else>
      <p v-if="!summary.reigns.length">Your first reign awaits.</p>
      <article
        v-for="reign in summary.reigns"
        :key="reign.saveId"
        class="rounded-xl border p-3"
      >
        <h3 class="font-bold">{{ reign.name }}</h3>
        <p>
          {{ reign.turnCount }} turns ·
          {{ Object.keys(reign.fish).length }} species ·
          {{ reign.endingKeys.length }} endings
        </p>
        <p
          v-if="!store.slots.some((slot) => slot.saveId === reign.saveId)"
          class="text-xs"
        >
          Archived discoveries; save no longer exists.
        </p>
      </article>
    </template>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  characterCandidates,
  endingCandidates,
  fishCandidates,
} from '~/utils/rulerHooked/artLibrary'
import { RULER_HOOKED_FISH } from '~/utils/rulerHooked/fish'
import { scrapbookSummary } from '~/utils/rulerHooked/scrapbook'

const store = useRulerHookedStore()
const roster = RULER_HOOKED_FISH
const summary = computed(() => scrapbookSummary(store.scrapbook))
const tabs = [
  { id: 'endings', label: 'Endings' },
  { id: 'fish', label: 'Fish' },
  { id: 'characters', label: 'People' },
  { id: 'reigns', label: 'Reigns' },
] as const
const page = ref<(typeof tabs)[number]['id']>('endings')
</script>

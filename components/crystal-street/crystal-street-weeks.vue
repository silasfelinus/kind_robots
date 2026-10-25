<template>
  <section class="kr-panes grid-cols-1" aria-label="Weeks on Crystal Street">
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h3 class="cs-display text-lg">
          Weeks on Crystal Street ({{ store.scrapbook.runs.length }})
        </h3>
        <span class="cs-pill cs-pill-good ml-auto"
          >Best endings {{ store.bestFound }}/{{ VILLAINS.length }}</span
        >
      </div>
      <div class="kr-pane-scroll p-3">
        <ul
          v-if="store.scrapbook.runs.length"
          class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3"
        >
          <li
            v-for="entry in store.scrapbook.runs"
            :key="entry.seed"
            class="cs-polaroid"
          >
            <crystal-street-art
              frame="aspect-[3/4]"
              kind="ending"
              :seed="`${entry.villain}:${entry.tier}`"
              :src="`/crystal-street/villains/${entry.villain}-ending.webp`"
              :palette="villainById(entry.villain)?.palette ?? []"
              :sigil="villainById(entry.villain)?.sigil ?? ''"
              :alt="villainById(entry.villain)?.endingPhoto"
            />
            <p class="mt-2 font-semibold leading-tight">
              {{ villainById(entry.villain)?.endings[entry.tier].title }}
            </p>
            <p class="text-xs opacity-75">
              {{ entry.name }} vs {{ villainById(entry.villain)?.name }} ·
              {{ TIER_LABELS[entry.tier] }} ·
              {{ new Date(entry.endedAt).toLocaleDateString() }}
            </p>
            <p class="text-xs opacity-75">
              Leads {{ entry.clues }}/3 · night wins {{ entry.wins }} · crew
              {{
                entry.crew
                  .map((id) => shortName(companionById(id)?.name ?? ''))
                  .join(', ') || 'none'
              }}
            </p>
            <ul class="mt-1 space-y-1 text-xs">
              <li
                v-for="h in entry.highlights"
                :key="`${h.encounterId}${h.choiceId}`"
              >
                <span :class="h.success ? 'text-success' : 'text-error'"
                  >●</span
                >
                {{ h.title }}: {{ h.label }}
              </li>
            </ul>
          </li>
        </ul>
        <p v-else class="text-sm opacity-75">
          Survive (or don't) a week on Crystal Street and it lands here.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  TIER_LABELS,
  VILLAINS,
  companionById,
  shortName,
  villainById,
} from '~/utils/crystalStreet/rules'

const store = useCrystalStreetStore()
</script>

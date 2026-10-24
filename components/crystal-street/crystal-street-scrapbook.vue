<template>
  <section class="kr-panes grid-cols-1" aria-label="Scrapbook">
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">Scrapbook</h2>
        <span class="cs-pill cs-pill-good ml-auto"
          >Best endings {{ store.bestFound }}/{{ VILLAINS.length }}</span
        >
      </div>
      <div class="kr-pane-scroll space-y-4 p-3">
        <ul
          class="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2"
          aria-label="Nightmares"
        >
          <li v-for="v in VILLAINS" :key="v.id" class="cs-card overflow-hidden">
            <crystal-street-art
              frame="aspect-[3/4]"
              :kind="met(v.id) ? 'villain' : 'night'"
              :seed="met(v.id) ? v.id : `locked:${v.id}`"
              :src="
                met(v.id) ? `/crystal-street/villains/${v.id}-poster.webp` : ''
              "
              :palette="met(v.id) ? v.palette : []"
              :sigil="met(v.id) ? v.sigil : '?'"
              :alt="met(v.id) ? v.name : 'An unmet nightmare'"
            />
            <div class="p-2">
              <p class="truncate text-xs font-semibold">
                {{ met(v.id) ? v.name : '???' }}
              </p>
              <p class="flex gap-1" aria-label="Endings found">
                <span
                  v-for="tier in TIERS"
                  :key="tier"
                  class="h-2 flex-1 rounded-full"
                  :class="
                    found(v.id, tier) ? `cs-bar-${tier}` : 'bg-base-content/15'
                  "
                  :title="TIER_LABELS[tier]"
                />
              </p>
            </div>
          </li>
        </ul>

        <h3 class="cs-kicker">
          Weeks on Crystal Street ({{ store.scrapbook.runs.length }})
        </h3>
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
              frame="aspect-[4/3]"
              kind="ending"
              :seed="`${entry.villain}:${entry.tier}`"
              :src="`/crystal-street/endings/${entry.villain}-${entry.tier}.webp`"
              :palette="villainById(entry.villain)?.palette ?? []"
              :sigil="villainById(entry.villain)?.sigil ?? ''"
              :alt="villainById(entry.villain)?.endings[entry.tier].art"
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
  endingKey,
  villainById,
  shortName,
} from '~/utils/crystalStreet/rules'
import type { EndingTier } from '~/utils/crystalStreet/types'

const TIERS: EndingTier[] = ['best', 'good', 'bittersweet', 'bad']
const store = useCrystalStreetStore()
const met = (id: string) => store.metVillains.has(id)
const found = (id: string, tier: EndingTier) =>
  store.scrapbook.endings.includes(endingKey(id, tier))
</script>

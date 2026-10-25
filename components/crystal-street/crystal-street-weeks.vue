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
            <ul
              v-if="entry.highlights.length"
              class="mt-2 flex gap-2 overflow-x-auto pb-1"
              aria-label="Highlights"
              data-testid="cs-highlights"
            >
              <li
                v-for="h in entry.highlights"
                :key="`${h.encounterId}${h.choiceId}`"
                class="cs-polaroid w-24 shrink-0"
              >
                <crystal-street-art
                  frame="aspect-square"
                  :kind="h.phase === 'night' ? 'night' : 'day'"
                  :seed="`${h.encounterId}:${h.choiceId}`"
                  :src="outcomeArt(h)"
                  :palette="
                    h.phase === 'night'
                      ? (villainById(entry.villain)?.palette ?? [])
                      : []
                  "
                  :alt="h.art"
                />
                <p class="mt-1 line-clamp-2 cs-micro leading-tight">
                  <span :class="h.success ? 'text-success' : 'text-error'"
                    >●</span
                  >
                  {{ h.title }}
                </p>
              </li>
            </ul>
            <button
              type="button"
              class="btn btn-xs btn-outline mt-2 rounded-2xl"
              :data-testid="`cs-share-${entry.seed}`"
              @click="share(entry)"
            >
              {{
                copied === entry.seed
                  ? 'Link copied: send it to a friend'
                  : 'Share this week'
              }}
            </button>
            <p
              v-if="manual === entry.seed"
              class="mt-1 break-all cs-micro opacity-80"
            >
              {{ linkFor(entry) }}
            </p>
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
import { ref } from 'vue'
import {
  useCrystalStreetStore,
  type ScrapbookRun,
} from '~/stores/crystalStreetStore'
import {
  TIER_LABELS,
  VILLAINS,
  companionById,
  shareLink,
  shortName,
  villainById,
  type LogEntry,
} from '~/utils/crystalStreet/rules'
import type { VillainId } from '~/utils/crystalStreet/ids'

const store = useCrystalStreetStore()
const copied = ref('')
const manual = ref('')

// Each highlight's outcome plate (art round 3); the drawn scene fills in
// until it is rendered.
function outcomeArt(h: LogEntry): string {
  return `/crystal-street/outcomes/${h.encounterId}--${h.choiceId}-${h.success ? 'success' : 'failure'}.webp`
}

function linkFor(entry: ScrapbookRun): string {
  return `${window.location.origin}${shareLink({ seed: entry.seed, villain: entry.villain as VillainId })}`
}

// A shared link replays the same nightmare and deck order with the friend's
// own look and clique.
async function share(entry: ScrapbookRun): Promise<void> {
  try {
    await navigator.clipboard.writeText(linkFor(entry))
    copied.value = entry.seed
    manual.value = ''
  } catch {
    manual.value = entry.seed
  }
}
</script>

<template>
  <div class="kr-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-6 px-1 pb-2">
    <section v-if="forge.draftList.length" class="flex flex-col gap-3">
      <p class="pf-kicker text-secondary">Your drafts</p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      >
        <li v-for="draft in forge.draftList" :key="draft.slug" class="relative">
          <button
            type="button"
            data-nav
            class="pf-tile pf-focusable"
            @click="forge.openDraft(draft.slug)"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
          >
            <img :src="coverFor(draft.genre)" alt="" class="pf-tile-art" />
            <span class="pf-tile-text">
              <span class="pf-display text-lg">{{ draft.title }}</span>
              <span class="pf-kicker opacity-70">{{
                genreLabel(draft.genre)
              }}</span>
            </span>
          </button>
          <button
            type="button"
            class="pf-tile-remove"
            :title="`Delete the ${draft.title} draft`"
            @click="forge.deleteDraft(draft.slug)"
          >
            <Icon name="kind-icon:close" class="size-4" />
          </button>
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="pf-kicker text-secondary">
          Load a game
          <span v-if="forge.libraryLoading" class="opacity-60"
            >· counting {{ countedLabel }}</span
          >
        </p>
        <div
          class="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Sort games"
        >
          <span class="pf-kicker text-[0.6rem] opacity-60">Sort</span>
          <button
            v-for="option in LIBRARY_SORTS"
            :key="option.id"
            type="button"
            data-nav
            class="pf-chip pf-focusable"
            :class="
              forge.librarySort === option.id
                ? 'border-primary text-primary'
                : 'border-base-content/20 opacity-80'
            "
            :aria-pressed="forge.librarySort === option.id"
            @click="forge.setLibrarySort(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <TransitionGroup
        tag="ul"
        name="pf-xfade"
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      >
        <li v-for="(game, i) in forge.libraryGames" :key="game.slug">
          <button
            type="button"
            data-nav
            :data-autofocus="
              !forge.draftList.length && i === 0 ? '' : undefined
            "
            class="pf-tile pf-focusable"
            :aria-label="`${game.title}: ${percentLabel(game.slug)} complete`"
            @click="forge.openLedger(game.slug)"
            @mouseenter="($event.currentTarget as HTMLElement).focus()"
          >
            <img :src="game.cover" alt="" class="pf-tile-art" />
            <span
              class="pf-tile-badge"
              :class="badgeClass(game.slug)"
              aria-hidden="true"
            >
              <span v-if="stat(game.slug)?.shine === 'super'">★</span>
              {{ percentLabel(game.slug) }}
            </span>
            <span class="pf-tile-text">
              <span class="pf-display text-lg">{{ game.title }}</span>
              <span class="pf-kicker opacity-70">{{ detail(game.slug) }}</span>
              <span class="mt-1 block h-1 w-full overflow-hidden bg-white/15">
                <span
                  class="block h-full"
                  :class="
                    stat(game.slug)?.shine === 'super'
                      ? 'pf-shine-bar'
                      : 'bg-primary'
                  "
                  :style="{
                    width: `${(stat(game.slug)?.progress ?? 0) * 100}%`,
                  }"
                />
              </span>
            </span>
          </button>
        </li>
      </TransitionGroup>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  LIBRARY_SORTS,
  usePlaybookForgeStore,
} from '~/stores/playbookForgeStore'
import { formatDuration } from '~/utils/playbookForge/estimate'
import { completionPercent } from '~/utils/playbookForge/ledger'
import { EXISTING_PLAYBOOKS } from '~/utils/playbookForge/existing'
import { GENRES } from '~/utils/playbookForge/presets'

const forge = usePlaybookForgeStore()

onMounted(() => void forge.loadLibraryStats())

const stat = (slug: string) => forge.libraryStats[slug]
const countedLabel = computed(
  () =>
    `${Object.keys(forge.libraryStats).length} of ${EXISTING_PLAYBOOKS.length}`,
)

function percentLabel(slug: string) {
  const s = stat(slug)
  return s ? `${completionPercent(s.progress)}%` : '…'
}

function detail(slug: string) {
  const s = stat(slug)
  if (!s) return 'Counting beats…'
  if (s.shine === 'super') return `Super shiny · ${s.units} beats`
  const left = s.remainingSeconds
    ? ` · ${formatDuration(s.remainingSeconds)} render left`
    : ''
  const pct = (n: number) => `${Math.round(n * 100)}%`
  return `Written ${pct(s.writtenShare)} · painted ${pct(s.paintedShare)}${left}`
}

function badgeClass(slug: string) {
  const s = stat(slug)
  if (!s) return 'opacity-60'
  return s.shine === 'super'
    ? 'pf-shine-text'
    : s.progress >= 1
      ? 'text-warning'
      : ''
}

const coverFor = (genre: string) =>
  (GENRES.find((g) => g.id === genre) ?? GENRES[0]!).cover
const genreLabel = (genre: string) =>
  (GENRES.find((g) => g.id === genre) ?? GENRES[0]!).label
</script>

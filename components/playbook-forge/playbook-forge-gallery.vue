<template>
  <div
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1.4fr)_minmax(0,1fr)] gap-3 @5xl:grid-cols-[minmax(0,1.8fr)_minmax(20rem,1fr)] @5xl:grid-rows-[auto_auto_minmax(0,1fr)] @5xl:gap-4"
  >
    <header class="flex min-w-0 flex-col gap-2 @5xl:col-span-2">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div class="min-w-0">
          <p class="pf-kicker text-secondary">
            Gallery · {{ forge.existing?.title }}
          </p>
          <p class="pf-display mt-1 truncate text-2xl @3xl:text-3xl">
            {{ forge.galleryTile?.label ?? 'Opening the gallery…' }}
            <span
              v-if="forge.galleryTile"
              class="text-base tabular-nums opacity-60"
              >· {{ forge.galleryTile.painted }} of
              {{ forge.galleryTile.count }} painted</span
            >
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <div class="flex gap-1" role="group" aria-label="Show">
            <button
              v-for="f in FILTERS"
              :key="f.id"
              type="button"
              class="pf-tab"
              :class="forge.galleryFilter === f.id ? 'pf-tab-on' : ''"
              :aria-pressed="forge.galleryFilter === f.id"
              @click="forge.galleryFilter = f.id"
            >
              {{ f.label }}
            </button>
          </div>
          <button
            v-if="!forge.galleryBook?.artPipeline"
            type="button"
            data-nav
            class="pf-tab pf-focusable"
            :title="`Art lane: ${laneLabel}. Click to change.`"
            @click="forge.cycleLane(1)"
          >
            Lane · {{ laneLabel }}
          </button>
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm pf-focusable"
            :class="toPaint ? 'btn-primary' : 'btn-ghost'"
            :disabled="forge.busy || !forge.gallerySection"
            @click="forge.askSubmit('art')"
          >
            Submit the missing · {{ toPaint }}
          </button>
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm pf-focusable"
            :class="toWrite ? 'btn-secondary' : 'btn-ghost'"
            :disabled="forge.busy || !forge.gallerySection"
            @click="forge.askSubmit('text')"
          >
            Send writing · {{ toWrite }}
          </button>
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm btn-ghost pf-focusable"
            @click="forge.back()"
          >
            Ledger
          </button>
        </div>
      </div>
      <div
        v-if="forge.ledgerConfirm"
        class="pf-help flex flex-wrap items-center gap-2"
        role="alertdialog"
        aria-label="Confirm submit"
      >
        <p class="min-w-0 flex-1 text-sm leading-snug">{{ confirmText }}</p>
        <button
          type="button"
          data-nav
          data-autofocus
          class="pf-label btn btn-primary btn-sm pf-focusable"
          :disabled="forge.busy"
          @click="forge.confirmSubmit()"
        >
          Send
        </button>
        <button
          type="button"
          data-nav
          class="pf-label btn btn-ghost btn-sm pf-focusable"
          @click="forge.ledgerConfirm = null"
        >
          Cancel
        </button>
      </div>
      <p
        v-else-if="forge.status && !forge.galleryFocus"
        class="text-xs opacity-80"
        role="status"
      >
        {{ forge.status }}
      </p>
    </header>

    <PlaybookForgeGalleryStrip class="@5xl:col-span-2" />

    <section class="kr-scroll -mx-1 min-h-0 px-1 py-1" aria-label="Entries">
      <div v-if="castGroups.length > 1" class="mb-3">
        <p class="pf-kicker mb-2 text-secondary">
          Explore the cast by origin ·
          {{ forge.galleryEntries.length }} character cards
        </p>
        <div
          class="flex gap-2 overflow-x-auto pb-2"
          role="group"
          aria-label="Cast origin"
        >
          <button
            v-for="group in castGroups"
            :key="group.name"
            type="button"
            data-nav
            class="pf-art-card pf-focusable relative w-32 shrink-0 overflow-hidden"
            :class="forge.galleryGroup === group.name ? 'pf-art-card-on' : ''"
            :aria-pressed="forge.galleryGroup === group.name"
            @click="forge.galleryGroup = group.name"
          >
            <span class="pf-art-card-frame relative block h-20">
              <img
                v-if="group.cover"
                :src="group.cover"
                alt=""
                class="pf-art-card-img"
              />
              <img
                v-else-if="forge.existing"
                :src="forge.existing.cover"
                alt=""
                class="pf-art-card-img opacity-25"
              />
              <span
                v-if="!group.cover"
                class="absolute inset-x-1 bottom-1 bg-base-300/80 px-1 text-[0.6rem]"
                >Group art pending</span
              >
            </span>
            <span class="pf-label block truncate px-2 py-1.5 text-left text-xs"
              >{{ group.name }} · {{ group.count }}</span
            >
          </button>
        </div>
      </div>
      <p v-if="forge.ledgerLoading" class="text-sm opacity-70">
        Reading the game…
      </p>
      <p v-else-if="!groupEntries.length" class="text-sm opacity-70">
        {{
          forge.galleryEntries.length
            ? 'Nothing here matches the selected group or art filter.'
            : 'No beats here yet.'
        }}
      </p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      >
        <li v-for="entry in shown" :key="entry.key">
          <PlaybookForgeGalleryCard
            :entry="entry"
            :selected="forge.galleryFocus === entry.key"
            :notes="openNotes(entry.key)"
            @select="forge.focusEntry(entry.key)"
          />
        </li>
      </ul>
      <button
        v-if="groupEntries.length > shown.length"
        type="button"
        class="pf-label btn btn-sm btn-ghost mt-3"
        @click="limit += 90"
      >
        Show more ({{ groupEntries.length - shown.length }} left)
      </button>
    </section>

    <PlaybookForgeGalleryInspector />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { usePlaybookStore } from '~/stores/playbookStore'
import { PLAYBOOK_ART_LANES } from '~/utils/playbook/artLanes'
import { formatDuration } from '~/utils/playbookForge/estimate'
import type { GalleryFilter } from '~/utils/playbookForge/gallery'
import { unitsToPaint, unitsToWrite } from '~/utils/playbookForge/ledger'

// The gallery: a game's sections and people as large art. Pick a shelf, pick
// a beat; review its prompt, render or flag it, and leave notes on the beat,
// the section or the person (Silas, 2026-10-27).
const forge = usePlaybookForgeStore()
const studio = usePlaybookStore()

const FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'missing', label: 'Missing' },
  { id: 'painted', label: 'Painted' },
]

const limit = ref(90)
watch(
  () => [forge.galleryTarget, forge.galleryFilter, forge.galleryGroup],
  () => (limit.value = 90),
)
const castGroups = computed(() => {
  if (
    forge.galleryTarget?.type !== 'section' ||
    forge.galleryTarget.id !== 'follower'
  )
    return []
  const people = forge.galleryEntries
  const groups = [...new Set(people.map((entry) => entry.group))]
  if (groups.length < 2) return []
  return [
    {
      name: 'All',
      count: people.length,
      cover: people.find((entry) => entry.imageUrl)?.imageUrl ?? null,
    },
    ...groups.map((name) => {
      const members = people.filter((entry) => entry.group === name)
      return {
        name,
        count: members.length,
        cover: members.find((entry) => entry.imageUrl)?.imageUrl ?? null,
      }
    }),
  ]
})
const groupEntries = computed(() =>
  forge.galleryGroup === 'All'
    ? forge.galleryShown
    : forge.galleryShown.filter((entry) => entry.group === forge.galleryGroup),
)
const shown = computed(() => groupEntries.value.slice(0, limit.value))

const laneLabel = computed(() =>
  (
    PLAYBOOK_ART_LANES.find((l) => l.key === forge.ledgerLane)?.label ??
    forge.ledgerLane
  ).replace(/ \(.*\)$/, ''),
)
const toPaint = computed(() =>
  forge.gallerySection ? unitsToPaint(forge.gallerySection).length : 0,
)
const toWrite = computed(() =>
  forge.gallerySection ? unitsToWrite(forge.gallerySection).length : 0,
)

function openNotes(key: string) {
  return studio.notesFor(key).filter((n) => !n.resolved).length
}

const confirmText = computed(() => {
  const pending = forge.ledgerConfirm
  if (!pending) return ''
  if (pending.kind === 'text')
    return `Send ${pending.count} beats of ${forge.galleryTile?.label} (about ${pending.words} words) to the next agent as a writing Todo?`
  const ready = Math.max(0, pending.count - pending.unprompted)
  return [
    ready
      ? `Render ${ready} picture${ready === 1 ? '' : 's'} with written prompts on ${laneLabel.value} (about ${formatDuration((pending.seconds / Math.max(1, pending.count)) * ready)}).`
      : '',
    pending.unprompted
      ? `${pending.unprompted} without a prompt go to the agents to write first.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
})
</script>

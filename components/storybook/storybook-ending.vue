<!-- /components/storybook/storybook-ending.vue -->
<!--
  THE ENDING, and the album row it lands in (storybook/t-036).

  Silas, 2026-09-12: a story ends "at one of the predetermined endpoint endings,
  which they get credit for in a collection of their adventures." So the reveal
  and the credit are one screen: the ending you got, then immediately how many
  of that deck's endings you now hold and which ones are still dark.

  UNFOUND ENDINGS ARE SILHOUETTES, NOT SPOILERS. The server sends an unfound
  ending as an id, a slug and a victory type with no title and no summary --
  there is nothing here to leak even by accident, which is deliberate: the whole
  point of a deck is that you do not know what else was in it.

  A 1,024-ending life album and an 8-ending genre album share this row. The grid
  wraps and caps what it draws rather than laying out a thousand tiles, because
  the number is the interesting part at that size, not the tiles.
-->
<template>
  <section
    class="relative h-full min-h-0 overflow-y-auto overscroll-contain rounded-[2rem] border border-base-300 bg-base-100 shadow-xl"
  >
    <div class="space-y-5 p-4 sm:p-5 lg:p-6">
      <!-- The ending you got -->
      <div
        class="rounded-[1.5rem] border-2 border-primary/40 bg-primary/5 p-4"
        data-testid="storybook-ending-card"
      >
        <p class="kr-text-eyebrow">{{ victoryLabel }}</p>
        <h2 class="kr-text-black-xl">{{ endingTitle }}</h2>
        <p v-if="endingSummary" class="kr-text-dim-sm mt-2">
          {{ endingSummary }}
        </p>
      </div>

      <!-- The credit -->
      <div v-if="collection" data-testid="storybook-album">
        <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="kr-text-semibold-sm">
            {{ collection.deck.title }} endings
          </h3>
          <p class="kr-text-dim-xs">
            Added to your collection · {{ collection.found }} of
            {{ collection.total }}
            <span v-if="collection.total < collection.expected">
              (of {{ collection.expected }} once the deck is complete)
            </span>
          </p>
        </div>

        <div class="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1.5">
          <div
            v-for="entry in shownEndings"
            :key="entry.id"
            class="flex aspect-[2/3] flex-col items-center justify-center rounded-xl border p-1 text-center"
            :class="
              entry.unlocked
                ? 'border-primary/40 bg-base-200'
                : 'border-base-300 bg-base-200/40 opacity-60'
            "
            :title="entry.unlocked ? entry.title : 'Not found yet'"
          >
            <Icon
              :name="entry.unlocked ? 'kind-icon:sparkles' : 'kind-icon:lock'"
              class="kr-icon-4"
              :class="entry.unlocked ? 'text-primary' : 'text-base-content/40'"
            />
            <span v-if="entry.unlocked" class="kr-text-dim-xs line-clamp-2">
              {{ entry.title }}
            </span>
          </div>
        </div>

        <p v-if="hiddenCount > 0" class="kr-text-dim-xs mt-2">
          and {{ hiddenCount }} more in this deck.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary" @click="emit('again')">
          Play again with this table
        </button>
        <button type="button" class="btn btn-ghost" @click="emit('newTable')">
          New table
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStorybookRunStore } from '@/stores/storybookRunStore'

/** Beyond this the album is a number, not a wall of tiles. */
const MAX_ALBUM_TILES = 60

const emit = defineEmits<{ again: []; newTable: [] }>()

const runStore = useStorybookRunStore()

const ending = computed(
  () =>
    (runStore.ending?.ending as Record<string, unknown> | undefined) ??
    runStore.ending ??
    null,
)
const endingTitle = computed(
  () => (ending.value?.title as string) || 'An ending',
)
const endingSummary = computed(() => (ending.value?.summary as string) || '')
const victoryLabel = computed(() =>
  String(ending.value?.victoryType || 'ending').toLowerCase(),
)

const collection = computed(() => runStore.collection)

/**
 * The tiles actually drawn. Found endings come first so a reader with three of
 * a thousand sees their three, not the first thousandth of the dark.
 */
const shownEndings = computed(() => {
  const all = collection.value?.endings ?? []
  const found = all.filter((entry) => entry.unlocked)
  const rest = all.filter((entry) => !entry.unlocked)
  return [...found, ...rest].slice(0, MAX_ALBUM_TILES)
})

const hiddenCount = computed(() =>
  Math.max(0, (collection.value?.endings.length ?? 0) - shownEndings.value.length),
)

onMounted(() => {
  const deckKey = runStore.run?.deck?.key
  if (deckKey) void runStore.fetchCollection(deckKey)
})
</script>

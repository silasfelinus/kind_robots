<template>
  <form
    class="kr-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-5 px-1 pb-2"
    @submit.prevent="submit"
  >
    <div class="grid gap-4 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <label class="flex flex-col gap-2">
        <span class="pf-kicker text-secondary">Title</span>
        <input
          v-model="title"
          data-nav
          data-autofocus
          maxlength="80"
          placeholder="Moon Laundry"
          class="pf-field pf-display text-2xl @3xl:text-4xl"
          autocomplete="off"
        />
      </label>
      <label class="flex flex-col gap-2">
        <span class="pf-kicker text-secondary">The idea, in plain words</span>
        <textarea
          v-model="idea"
          data-nav
          rows="3"
          maxlength="1200"
          placeholder="A laundromat on the moon where every lost sock is a portal, and the night manager has one week to close them all."
          class="pf-field resize-none text-base"
        />
      </label>
    </div>

    <fieldset class="flex flex-col gap-3">
      <legend class="pf-kicker mb-3 text-secondary">
        Genre: a starting loadout from the playbook that pioneered it
      </legend>
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3"
      >
        <button
          v-for="entry in GENRES"
          :key="entry.id"
          type="button"
          data-nav
          role="radio"
          :aria-checked="genre === entry.id"
          class="pf-tile pf-focusable"
          :class="genre === entry.id ? 'pf-tile-on' : ''"
          @click="pickPreset(entry.id)"
          @mouseenter="($event.currentTarget as HTMLElement).focus()"
        >
          <img :src="entry.cover" alt="" class="pf-tile-art" />
          <span class="pf-tile-text">
            <span class="pf-display text-base">{{ entry.label }}</span>
            <span class="text-xs leading-snug opacity-85">{{
              entry.pitch
            }}</span>
            <span class="pf-kicker text-[0.6rem] opacity-60">{{
              entry.lineage
            }}</span>
          </span>
          <Icon
            v-if="genre === entry.id"
            name="kind-icon:check"
            class="absolute right-2 top-2 size-6 rounded-full bg-primary p-1 text-primary-content"
          />
        </button>
      </div>

      <div v-if="forge.genreFacets.length" class="flex flex-col gap-2">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="pf-kicker text-[0.65rem] opacity-80">
            More genres from Facets · {{ forge.genreFacets.length }}
          </p>
          <input
            v-model="genreSearch"
            type="search"
            class="pf-field w-48 py-1 text-xs"
            placeholder="Find a genre"
            aria-label="Find a genre Facet"
          />
        </div>
        <div
          class="flex flex-wrap gap-1.5"
          role="radiogroup"
          aria-label="Genre Facets"
        >
          <button
            v-for="card in shownGenres"
            :key="card.id"
            type="button"
            role="radio"
            :aria-checked="forge.ideaGenre?.facetId === card.id"
            class="pf-chip pf-focusable"
            :class="
              forge.ideaGenre?.facetId === card.id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-base-content/20 opacity-85'
            "
            :title="card.flavorText || card.description || ''"
            @click="pickFacetGenre(card)"
          >
            {{ card.title }}
          </button>
          <button
            v-if="hiddenGenres > 0"
            type="button"
            class="pf-chip pf-focusable border-secondary/50 text-secondary"
            @click="showAllGenres = true"
          >
            Show all {{ forge.genreFacets.length }}
          </button>
        </div>
        <p v-if="forge.ideaGenre" class="pf-help text-xs leading-snug">
          <span class="font-semibold">{{ forge.ideaGenre.title }}</span>
          starts from the
          <span class="font-semibold">{{ presetLabel }}</span> loadout.
          {{ forge.ideaGenre.description }}
        </p>
      </div>
    </fieldset>

    <section class="flex flex-col gap-3" aria-label="Spark deck">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <p class="pf-kicker text-secondary">
          Spark deck: Facets dealt into the design
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm btn-ghost pf-focusable"
            :disabled="forge.facetsState !== 'ready'"
            @click="forge.dealIdeaSparks()"
          >
            Deal again
          </button>
          <button
            type="button"
            data-nav
            class="pf-label btn btn-sm btn-secondary pf-focusable"
            :disabled="!forge.ideaSparks.length && !forge.ideaGenre"
            title="Replace the idea with a draft written from the genre and sparks"
            @click="writeIdea"
          >
            Write the idea from these
          </button>
        </div>
      </div>
      <p
        v-if="forge.facetsState === 'loading' || forge.facetsState === 'idle'"
        class="text-sm opacity-70"
      >
        Loading Facets…
      </p>
      <p v-else-if="forge.facetsState === 'error'" class="text-sm text-warning">
        Facets could not load ({{ forge.facetsError }}). The genres above still
        work.
      </p>
      <ul
        v-else
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-2"
        aria-label="Sparks"
      >
        <li
          v-for="slot in SPARK_SLOTS"
          :key="slot.id"
          class="pf-panel flex min-h-[8.5rem] flex-col gap-1 p-3"
          :class="sparkFor(slot.id)?.locked ? 'border-primary/70' : ''"
        >
          <span class="flex items-baseline justify-between gap-2">
            <span class="pf-kicker text-[0.6rem] text-secondary">{{
              slot.label
            }}</span>
            <span class="text-[0.6rem] opacity-50">{{
              sparkFor(slot.id)?.taxonomy.toLowerCase().replace(/_/g, ' ')
            }}</span>
          </span>
          <template v-if="sparkFor(slot.id)">
            <span class="pf-display text-base leading-tight">{{
              sparkFor(slot.id)!.title
            }}</span>
            <span class="line-clamp-2 text-xs leading-snug opacity-75">{{
              sparkFor(slot.id)!.description || slot.feeds
            }}</span>
          </template>
          <span v-else class="text-xs opacity-60">{{ slot.feeds }}</span>
          <span class="mt-auto flex gap-1.5 pt-1">
            <button
              type="button"
              class="pf-chip pf-focusable text-[0.65rem]"
              :class="
                sparkFor(slot.id)?.locked
                  ? 'border-primary text-primary'
                  : 'border-base-content/20'
              "
              :aria-pressed="!!sparkFor(slot.id)?.locked"
              :disabled="!sparkFor(slot.id)"
              @click="forge.toggleSparkLock(slot.id)"
            >
              {{ sparkFor(slot.id)?.locked ? 'Kept' : 'Keep' }}
            </button>
            <button
              type="button"
              class="pf-chip pf-focusable border-base-content/20 text-[0.65rem]"
              :disabled="!!sparkFor(slot.id)?.locked"
              @click="forge.dealIdeaSparks(slot.id)"
            >
              Redraw
            </button>
            <button
              v-if="sparkFor(slot.id)"
              type="button"
              class="pf-chip pf-focusable border-base-content/20 text-[0.65rem]"
              :aria-label="`Leave ${slot.label} out`"
              @click="forge.dropSpark(slot.id)"
            >
              ×
            </button>
          </span>
        </li>
      </ul>
    </section>

    <section
      v-if="forge.pendingDesigns.length"
      class="flex flex-col gap-2"
      aria-label="Designs from the tray"
    >
      <p class="pf-kicker text-secondary">
        From your tray · {{ forge.pendingDesigns.length }} designs come with
        this playbook
      </p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-2"
      >
        <li v-for="d in forge.pendingDesigns" :key="d.id">
          <PlaybookForgeArtCard
            :title="d.title"
            :label="d.kind"
            :image-url="d.imageUrl"
            :prompt="d.prompt"
          />
        </li>
      </ul>
    </section>

    <div class="flex flex-wrap items-center gap-4">
      <button type="submit" data-nav class="pf-cta pf-focusable">
        <span class="pf-display text-lg">Forge the loadout</span>
        <Icon name="kind-icon:arrow-right" class="size-5" />
      </button>
      <span class="text-sm opacity-70">
        Everything stays adjustable. Nothing is created until you launch.
      </span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import {
  SPARK_SLOTS,
  composeIdea,
  type FacetCard,
  type SparkSlot,
} from '~/utils/playbookForge/facets'
import { GENRES } from '~/utils/playbookForge/presets'

const forge = usePlaybookForgeStore()
const title = ref('')
const idea = ref('')
const genre = ref(GENRES[0]!.id)
const genreSearch = ref('')

onMounted(() => void forge.loadFacets())

const showAllGenres = ref(false)
const GENRE_PREVIEW = 24

const matchingGenres = computed(() => {
  const q = genreSearch.value.trim().toLowerCase()
  return q
    ? forge.genreFacets.filter((card) => card.title.toLowerCase().includes(q))
    : forge.genreFacets
})
/** One page of chips until asked for all, keeping the chosen genre in view. */
const shownGenres = computed(() => {
  const all = matchingGenres.value
  if (showAllGenres.value || genreSearch.value.trim()) return all
  const first = all.slice(0, GENRE_PREVIEW)
  const chosen = all.find((card) => card.id === forge.ideaGenre?.facetId)
  return chosen && !first.includes(chosen) ? [...first, chosen] : first
})
const hiddenGenres = computed(
  () => matchingGenres.value.length - shownGenres.value.length,
)
const presetLabel = computed(
  () => GENRES.find((g) => g.id === genre.value)?.label ?? 'Open idea',
)

function sparkFor(slot: SparkSlot) {
  return forge.ideaSparks.find((s) => s.slot === slot)
}

function pickPreset(id: string) {
  genre.value = id
  forge.chooseGenreFacet(null)
}

function pickFacetGenre(card: FacetCard) {
  const preset =
    forge.ideaGenre?.facetId === card.id ? null : forge.chooseGenreFacet(card)
  if (!preset) forge.chooseGenreFacet(null)
  genre.value = preset ?? genre.value
}

function writeIdea() {
  idea.value = composeIdea(
    [...(forge.ideaGenre ? [forge.ideaGenre] : []), ...forge.ideaSparks],
    presetLabel.value,
  )
}

function submit() {
  forge.forge(title.value, idea.value, genre.value)
}
</script>

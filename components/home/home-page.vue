<!-- /components/home/home-page.vue -->
<!--
  The front door.

  Silas, 2026-08-28: "I want a home page that really shows off all the little
  parts of our website and its progress ... These displays should always lead to
  something, not just static displays of images and text." Everything on this
  page is a link.

  THE SECOND PASS IS ABOUT DENSITY. The first version worked but was about five
  screens tall. Silas, 2026-08-29: "I'm not sure if we can get this down to one
  page, but I definitely don't want it larger than two. We should be condensing
  this, that initial banner shouldn't be an entire page, gutters too large, and
  things should be combined." What changed, in order of how much height it
  bought back:

    1. The eight rails moved from a vertical stack into a multi-column grid.
       Stacked at ~200px each they were 1600px on their own; at three columns
       they are three rows. This is a page component, so a viewport breakpoint
       is the right tool here -- the rails themselves must not gate columns that
       way (layout contract, viewport-grid), and they don't.
    2. The hero and its cast became one side-by-side panel instead of a
       full-width 16:9 plate with a strip beneath it.
    3. The orientation row is gone entirely. Silas: "nothing on that very first
       row below the header nav is needed: the text, refresh, and dashboard
       link." Refresh went with it -- a page reload does the same job, and the
       store already caches for a minute either way.
    4. Tile sizes, paddings and label sizes all came down a step.

  EVERY SECTION IS A PANEL. Silas: "the lack of backgrounds around text is
  merging it with the background." kr-page-backdrop paints generated art behind
  the whole route, so text with no ground of its own dissolved into it.

  WHAT THIS COMPONENT DOES NOT DO. It renders no <h1> -- workspace-header
  already puts "Kind Robots / Dashboard Room" at the top of every page from
  content/index.md's frontmatter (design brief rule 1, enforced by the
  one-header rule). It owns no scroll region either: this mounts inside
  pages/[...slug].vue's content-host, which is already the page's single scroll
  owner, which is what .kr-unbound on the root declares.

  EMPTY RAILS ARE NOT RENDERED. A shelf with nothing on it is an apology; the
  store drops them, so a fresh database shows a shorter page rather than eight
  empty boxes. That is also how "if we are still making new animations" resolves
  itself: the animations rail appears on days the pipeline produced clips.
-->
<template>
  <div class="kr-unbound gap-2 pb-4">
    <div v-if="showcaseStore.errorMessage" class="kr-note kr-note-warning">
      {{ showcaseStore.errorMessage }}
    </div>

    <!--
      The top band is the dream, its cast, and whatever is waiting on Silas.
      He asked for the dream to give up horizontal space for the third
      (2026-08-29: "Dream entry should take up less horizontal space to leave
      room for a vertical notification scroll").
    -->
    <div class="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      <home-dream-hero
        v-if="showcaseStore.hero"
        class="min-w-0 lg:flex-1"
        :hero="showcaseStore.hero"
        @select="openCard"
      />

      <div
        v-else-if="!showcaseStore.hasLoaded"
        class="h-40 w-full animate-pulse rounded-2xl bg-base-200 lg:flex-1"
        aria-hidden="true"
      />

      <home-attention />
    </div>

    <!--
      The rails. `auto-rows-fr` so neighbouring shelves in a row share a height
      rather than each sizing to its own longest caption, which is what made the
      grid look ragged before.
    -->
    <div
      v-if="visibleRails.length"
      class="grid auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      <template v-for="entry in visibleRails" :key="entry.key">
        <!--
          The art cell is the one shelf with two modes behind it. Silas,
          2026-08-29: "let me togle between the fresh from art queue and to see
          the current progress, and choose from active to failed, etc, keeping
          the layout, which otherwise is great." home-art-shelf renders the SAME
          home-rail in the same two-row cell and only swaps what fills it, so
          "keeping the layout" is structural rather than a thing to re-check.
        -->
        <home-art-shelf
          v-if="entry.key === 'art'"
          :class="entry.cellClass"
          :fresh="entry.items"
          @select="openCard"
        />

        <home-rail
          v-else
          :class="entry.cellClass"
          :label="entry.label"
          :icon="entry.icon"
          :items="entry.items"
          :see-all-href="entry.href"
          :shape="entry.shape"
          :plate-variant="entry.plateVariant"
          :placeholder-icon="entry.placeholderIcon"
          :rows="entry.rows ?? 1"
          :fit="entry.fit ?? 'cover'"
          interactive
          @select="openCard"
        />
      </template>
    </div>

    <div
      v-else-if="!showcaseStore.hasLoaded"
      class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      aria-hidden="true"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="h-44 animate-pulse rounded-2xl bg-base-200"
      />
    </div>

    <!--
      The projects strip. Silas, 2026-08-29: "I do like how projects appear
      differently than the rest" -- so this deliberately keeps its horizontal
      icon-plus-text card shape rather than being folded into the rail grid.
    -->
    <section
      v-if="showcaseStore.projects.length"
      class="flex flex-col gap-1.5 kr-panel-flat p-3"
    >
      <header class="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          class="text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary"
        >
          What we're building
        </h2>

        <NuxtLink
          to="/conductor"
          class="link link-hover text-[0.7rem] font-bold text-base-content/50 hover:text-primary"
        >
          every project →
        </NuxtLink>
      </header>

      <div
        class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]"
      >
        <NuxtLink
          v-for="project in showcaseStore.projects"
          :key="project.id"
          :to="showcaseHref(project)"
          class="group flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-1.5 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <div class="size-10 shrink-0 overflow-hidden rounded-lg">
            <kr-art-plate
              :source="project.art"
              variant="icon"
              shape="square"
              frame="none"
              :alt="project.title"
              :fallback="fallbackFor(project)"
              placeholder-icon="kind-icon:blueprint"
              fit="cover"
            />
          </div>

          <!--
            Silas, 2026-08-29: "project titles are still getting cut off ...
            they are the most important part, and we should see progress
            indicator, the priority rating could be a simple single letter.
            description is not needed, these are things I'm well aquainted
            with." So the description is gone, the priority is one glyph, and
            everything the title was competing with for width went with them.

            Progress comes from conductorStore, which already computes it per
            project; the two are joined on conductorSlug.
          -->
          <div class="min-w-0 flex-1">
            <p
              class="truncate text-xs font-black leading-tight group-hover:text-primary"
              :title="project.title"
            >
              {{ project.title }}
            </p>

            <div class="mt-1 flex items-center gap-1.5">
              <span
                v-if="priorityLetter(project)"
                class="grid size-3.5 shrink-0 place-items-center rounded bg-primary text-[0.5rem] font-black text-primary-content"
                :title="`${project.badge || 'Priority'}`"
              >
                {{ priorityLetter(project) }}
              </span>

              <template v-if="progressFor(project) !== null">
                <span
                  class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-base-300"
                  :title="`${progressFor(project)}% complete`"
                >
                  <span
                    class="block h-full rounded-full bg-primary"
                    :style="{ width: `${progressFor(project)}%` }"
                  />
                </span>

                <span
                  class="shrink-0 text-[0.6rem] font-bold tabular-nums text-base-content/55"
                >
                  {{ progressFor(project) }}%
                </span>
              </template>

              <span v-else class="min-w-0 flex-1" />
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!--
      The feed, still whole -- but its heading now sits IN its control strip
      rather than in a section header above it. Silas, 2026-08-29: "The
      selections like all ai news, etc, and the other icons, should be in line
      with the From around the web and newsfeed tab section." That was two full
      rows of chrome before the first story; the `lead`/`trail` slots on
      newsfeed-feed make it one.

      The scroller is bounded rather than however tall the feed wants to be
      ("newsfeeds should scroll vertically, and take up less height"). The
      contract's one-scroll rule deliberately does not count a `max-h-*` region
      -- those are nested previews, not the page's scroll owner, which is still
      pages/[...slug].vue's content-host.
    -->
    <section class="flex flex-col kr-panel-flat p-3">
      <NewsfeedFeed :initial-limit="24" compact>
        <template #lead>
          <h2
            class="hidden shrink-0 text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary lg:block"
          >
            From around the web
          </h2>
        </template>

        <template #trail>
          <NuxtLink
            to="/plan/newsfeed"
            class="link link-hover shrink-0 text-[0.7rem] font-bold text-base-content/50 hover:text-primary"
          >
            lab →
          </NuxtLink>
        </template>
      </NewsfeedFeed>
    </section>

    <!--
      The interstitial. Silas, 2026-08-29: "Whenever I click on one of the new
      objects, I want it to expand to tell me about it ... with clicking outside
      the container returning to the homepage."

      Mounted only while something is selected, so its detail fetch happens on
      the click rather than on page load.
    -->
    <home-object-sheet
      v-if="selectedCard"
      :card="selectedCard"
      @close="selectedCard = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'
import { useHomeShowcaseStore } from '@/stores/homeShowcaseStore'
import {
  showcaseHref,
  type RailItem,
  type ShowcaseCard,
  type ShowcaseRailKey,
} from '@/utils/homeShowcase'
import { defaultArtFor } from '@/utils/defaultArtPool'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'

type RailDefinition = {
  key: ShowcaseRailKey
  /**
   * Still required, still not printed. Silas, 2026-08-29: "Would love to
   * replace the words for new dreams, characters, etc with just an icon." The
   * shelf renders `icon` and keeps this as its tooltip and accessible name --
   * the words leave the screen, not the accessibility tree.
   */
  label: string
  /** The glyph shown in place of the label. */
  icon: string
  /** Shown inside a plate that resolved no art at all -- never in the header. */
  placeholderIcon: string
  href: string
  shape: ArtPlateShape
  plateVariant: ArtVariant
  /** Extra grid classes for this shelf's cell, and its internal row count. */
  cellClass?: string
  rows?: 1 | 2
  fit?: 'cover' | 'contain'
}

const showcaseStore = useHomeShowcaseStore()
const conductorStore = useConductorStore()

/**
 * The card the interstitial is showing, or null.
 *
 * Held here rather than in a store because nothing outside this page reads it,
 * and because a page-scoped ref is cleared by navigation for free -- a store
 * would keep the sheet "open" behind a route change.
 */
const selectedCard = ref<RailItem | null>(null)

function openCard(card: RailItem): void {
  selectedCard.value = card
}

/**
 * Percent complete for a project, joined to conductor's own figure on
 * conductorSlug. Conductor computes it from the roadmap (done weight plus half
 * for in-progress), which is the number Silas already reads elsewhere -- so
 * this shows the same one rather than inventing a second definition.
 */
function progressFor(project: ShowcaseCard): number | null {
  const slug = project.conductorSlug
  if (!slug) return null

  const match = conductorStore.projects.find((entry) => entry.slug === slug)
  /*
   * NULL, not 0, when there is no match. A project conductor has never heard of
   * is of UNKNOWN progress; rendering an empty bar at 0% asserts that no work
   * has been done on it, which is a different and probably false claim. The bar
   * is omitted instead.
   */
  if (typeof match?.progress !== 'number') return null

  return Math.max(0, Math.min(100, Math.round(match.progress)))
}

/** HIGH -> H. The word cost more width than the title could spare. */
function priorityLetter(project: ShowcaseCard): string {
  return (project.badge || '').trim().charAt(0).toUpperCase()
}

/*
 * ORDER IS THE ARGUMENT. Art first because it is the most immediately legible
 * proof that something is happening here; then the six schema objects roughly
 * in the order the dream cycle creates them, with bots alongside; animations
 * wherever they exist.
 *
 * Shapes differ on purpose: renders and clips are landscape work and get the
 * wide plate, authored objects are portrait cards. A rail of mismatched aspect
 * ratios reads as a junk drawer.
 */
const RAILS: RailDefinition[] = [
  {
    key: 'art',
    label: 'Fresh from the art queue',
    icon: 'kind-icon:palette-color',
    placeholderIcon: 'kind-icon:palette-color',
    href: '/art',
    shape: 'wide',
    plateVariant: 'card',
    // Twice the height, two rows of tiles. Silas, 2026-08-29: "on desktop, art
    // queue can take up twice the height, so we have an even spacing for the
    // other six objects" -- one tall art cell on the left, the six object
    // shelves filling a tidy 3x2 beside it.
    cellClass: 'lg:row-span-2',
    rows: 2,
    fit: 'contain',
  },
  {
    key: 'animations',
    label: 'Moving pictures',
    icon: 'kind-icon:movie',
    placeholderIcon: 'kind-icon:movie',
    href: '/art',
    shape: 'wide',
    plateVariant: 'card',
  },
  {
    key: 'dreams',
    label: 'New dreams',
    icon: 'kind-icon:dream',
    placeholderIcon: 'kind-icon:dream',
    href: '/dreams',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'characters',
    label: 'New characters',
    icon: 'kind-icon:character',
    placeholderIcon: 'kind-icon:character',
    href: '/characters',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'scenarios',
    label: 'New scenarios',
    icon: 'kind-icon:scenario',
    placeholderIcon: 'kind-icon:scenario',
    href: '/stories',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'rewards',
    label: 'New items and skills',
    icon: 'kind-icon:treasure',
    placeholderIcon: 'kind-icon:treasure',
    href: '/rewards',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'bots',
    label: 'New bots',
    icon: 'kind-icon:robot',
    placeholderIcon: 'kind-icon:robot',
    href: '/bots',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'facets',
    label: 'New facets',
    icon: 'kind-icon:shapes',
    placeholderIcon: 'kind-icon:shapes',
    href: '/facets',
    shape: 'square',
    plateVariant: 'card',
  },
]

const visibleRails = computed(() =>
  RAILS.map((definition) => ({
    ...definition,
    items: showcaseStore.rail(definition.key),
  })).filter((entry) => entry.items.length > 0),
)

function fallbackFor(card: ShowcaseCard): string {
  return defaultArtFor(`${card.kind}-${card.id}`)
}

onMounted(() => {
  void showcaseStore.load()
})
</script>

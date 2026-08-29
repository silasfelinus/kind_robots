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

    <home-dream-hero v-if="showcaseStore.hero" :hero="showcaseStore.hero" />

    <div
      v-else-if="!showcaseStore.hasLoaded"
      class="h-48 w-full animate-pulse rounded-2xl bg-base-200 lg:h-64"
      aria-hidden="true"
    />

    <!--
      The rails. `auto-rows-fr` so neighbouring shelves in a row share a height
      rather than each sizing to its own longest caption, which is what made the
      grid look ragged before.
    -->
    <div
      v-if="visibleRails.length"
      class="grid auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      <home-rail
        v-for="entry in visibleRails"
        :key="entry.key"
        :label="entry.label"
        :items="entry.items"
        :see-all-href="entry.href"
        :shape="entry.shape"
        :plate-variant="entry.plateVariant"
        :placeholder-icon="entry.placeholderIcon"
      />
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

          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1">
              <span
                class="truncate text-xs font-black group-hover:text-primary"
                :title="project.title"
              >
                {{ project.title }}
              </span>
              <span
                v-if="project.badge"
                class="badge badge-primary badge-xs shrink-0 font-bold"
              >
                {{ project.badge }}
              </span>
            </p>
            <p
              v-if="project.subtitle"
              class="truncate text-[0.65rem] text-base-content/55"
              :title="project.subtitle"
            >
              {{ project.subtitle }}
            </p>
          </div>

          <Icon
            name="kind-icon:chevron-right"
            class="size-3.5 shrink-0 text-base-content/30 group-hover:text-primary"
          />
        </NuxtLink>
      </div>
    </section>

    <!-- The feed, still whole. -->
    <section class="flex flex-col gap-1.5 kr-panel-flat p-3">
      <header class="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          class="text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary"
        >
          From around the web
        </h2>

        <NuxtLink
          to="/plan/newsfeed"
          class="link link-hover text-[0.7rem] font-bold text-base-content/50 hover:text-primary"
        >
          newsfeed lab →
        </NuxtLink>
      </header>

      <NewsfeedFeed :initial-limit="6" compact />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useHomeShowcaseStore } from '@/stores/homeShowcaseStore'
import {
  showcaseHref,
  type ShowcaseCard,
  type ShowcaseRailKey,
} from '@/utils/homeShowcase'
import { defaultArtFor } from '@/utils/defaultArtPool'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'

type RailDefinition = {
  key: ShowcaseRailKey
  label: string
  /** Shown inside a plate that resolved no art at all -- never in the header. */
  placeholderIcon: string
  href: string
  shape: ArtPlateShape
  plateVariant: ArtVariant
}

const showcaseStore = useHomeShowcaseStore()

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
    placeholderIcon: 'kind-icon:palette-color',
    href: '/art',
    shape: 'wide',
    plateVariant: 'card',
  },
  {
    key: 'animations',
    label: 'Moving pictures',
    placeholderIcon: 'kind-icon:movie',
    href: '/art',
    shape: 'wide',
    plateVariant: 'card',
  },
  {
    key: 'dreams',
    label: 'New dreams',
    placeholderIcon: 'kind-icon:dream',
    href: '/dreams',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'characters',
    label: 'New characters',
    placeholderIcon: 'kind-icon:character',
    href: '/characters',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'scenarios',
    label: 'New scenarios',
    placeholderIcon: 'kind-icon:scenario',
    href: '/stories',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'rewards',
    label: 'New items and skills',
    placeholderIcon: 'kind-icon:treasure',
    href: '/rewards',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'bots',
    label: 'New bots',
    placeholderIcon: 'kind-icon:robot',
    href: '/bots',
    shape: 'square',
    plateVariant: 'card',
  },
  {
    key: 'facets',
    label: 'New facets',
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

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

  FILLS THE SCREEN ON DESKTOP. Silas, 2026-09-01: "We still have some dead space
  at the bottom of the screen. it would be better to specifically choose
  percentages, at least on desktop, so we are using maximum space." From `xl` the
  root is `h-full` and every band divides that height by percentage, so the page
  ends exactly where the viewport does. Below `xl` it is the ordinary stacking
  column it always was -- a fixed-height layout on a phone crushes content rather
  than filling space, and he has not asked for a small-screen design yet ("I do
  not have an ideal layout for tablet and mobile yet").

  The note has to live up here rather than above the root element: the layout
  contract's root-surface rule reads the FIRST element in the template, and a
  comment sitting in front of it reads as the root and fails the rule.

  EMPTY RAILS ARE NOT RENDERED. A shelf with nothing on it is an apology; the
  store drops them, so a fresh database shows a shorter page rather than eight
  empty boxes. That is also how "if we are still making new animations" resolves
  itself: the animations rail appears on days the pipeline produced clips.
-->
<template>
  <div class="kr-unbound gap-2 pb-4 xl:h-full xl:min-h-0 xl:pb-0">
    <div v-if="showcaseStore.errorMessage" class="kr-note kr-note-warning">
      {{ showcaseStore.errorMessage }}
    </div>

    <!--
      TWO COLUMNS ON DESKTOP. Silas, 2026-09-01: "Needs you, project progress,
      and newsfeed should be in one column on the right side ... the dream hero
      gets the extra room ... Then in the lower left corner that remains we
      should have the six galleries ... in 3 columns and two rows."

      Left is the dream and the galleries; right is everything that is a list
      rather than a picture. The right column is 22% -- "The needs you section is
      still too wide" applied to what was a third of the band, and narrow enough
      that the newsfeed reads as a vertical feed rather than a grid.

      Below `xl` the two columns stack and each band keeps its natural height,
      which is also where the galleries fall back to one swipe-scrollable row
      ("ideally we will be able to do something close to this with tablet but
      have swipe scrolling to show the different object galleries").
    -->
    <div class="flex flex-col gap-2 xl:min-h-0 xl:flex-1 xl:flex-row">
      <div class="flex min-w-0 flex-col gap-2 xl:min-h-0 xl:w-[78%]">
        <!--
          The dream band. 46/54 rather than half and half: the galleries below
          are two rows of cards and need the larger share, while the hero is one
          card and one scrolling cast row.
        -->
        <div
          class="flex flex-col gap-2 lg:h-96 lg:flex-row lg:items-stretch xl:h-[46%] xl:min-h-0 xl:shrink-0"
        >
          <home-dream-hero
            v-if="showcaseStore.hero"
            class="min-w-0 lg:flex-1"
            :hero="showcaseStore.hero"
            @select="openCard"
          />

          <div
            v-else-if="!showcaseStore.hasLoaded"
            class="h-40 w-full animate-pulse rounded-2xl bg-base-200 lg:h-full lg:flex-1"
            aria-hidden="true"
          />
        </div>

        <!--
          THE SIX GALLERIES, 3x2. Silas named exactly six: "art images, dreams,
          character, rewards (items and skills combined) scenario, and facets".
          Bots and animations are no longer on the page as a result -- flagged
          rather than quietly kept, since dropping a kind is a content decision.

          A page component MAY gate grid-cols on a viewport breakpoint (the
          layout contract's viewport-grid rule binds shared components, which
          get embedded in hosts narrower than the viewport implies). Below xl
          this stays the one horizontally scrolling row it was, which is the
          swipe behaviour asked for on tablet.
        -->
        <div
          v-if="visibleRails.length"
          class="no-scrollbar flex gap-2 overflow-x-auto pb-1 xl:grid xl:min-h-0 xl:flex-1 xl:grid-cols-3 xl:grid-rows-2 xl:overflow-visible xl:pb-0"
        >
          <template v-for="entry in visibleRails" :key="entry.key">
            <!--
              The art cell is the one shelf with two modes behind it. Silas,
              2026-08-29: "let me togle between the fresh from art queue and to
              see the current progress, and choose from active to failed, etc,
              keeping the layout, which otherwise is great." home-art-shelf
              renders the SAME home-rail and only swaps what fills it.
            -->
            <home-art-shelf
              v-if="entry.key === 'art'"
              class="min-w-[17rem] shrink-0 basis-[calc(25%-0.375rem)] xl:min-h-0 xl:min-w-0 xl:basis-auto"
              :fresh="entry.items"
              @select="openCard"
            />

            <home-rail
              v-else
              class="min-w-[17rem] shrink-0 basis-[calc(25%-0.375rem)] xl:min-h-0 xl:min-w-0 xl:basis-auto"
              :label="entry.label"
              :icon="entry.icon"
              :items="entry.items"
              :see-all-href="entry.href"
              :shape="entry.shape"
              :plate-variant="entry.plateVariant"
              :placeholder-icon="entry.placeholderIcon"
              :fit="entry.fit ?? 'cover'"
              interactive
              @select="openCard"
            />
          </template>
        </div>

        <div
          v-else-if="!showcaseStore.hasLoaded"
          class="flex gap-2 overflow-hidden xl:grid xl:min-h-0 xl:flex-1 xl:grid-cols-3 xl:grid-rows-2"
          aria-hidden="true"
        >
          <div
            v-for="n in 6"
            :key="n"
            class="h-44 min-w-[17rem] shrink-0 basis-[calc(25%-0.375rem)] animate-pulse rounded-2xl bg-base-200 xl:h-auto xl:min-w-0 xl:basis-auto"
          />
        </div>
      </div>

      <!--
        THE RIGHT COLUMN: the three things that are lists rather than pictures.
        Needs-you and the newsfeed both scroll and share the leftover height;
        the project strip sits between them at its natural height because it is
        six short rows and scrolling it would be silly.
      -->
      <div class="flex min-w-0 flex-col gap-2 xl:min-h-0 xl:w-[22%]">
        <home-attention class="xl:min-h-0 xl:flex-1" />

        <!--
          The projects strip. Silas, 2026-08-29: "I do like how projects appear
          differently than the rest" -- so this keeps its horizontal
          icon-plus-text card shape. In a narrow column that becomes one card
          per row, which is what the container-width columns already do.
        -->
        <section
          v-if="showcaseStore.projects.length"
          class="flex shrink-0 flex-col gap-1.5 kr-panel-flat p-3"
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
          The feed, its heading inside its own control strip rather than in a
          section header above it (Silas, 2026-08-29). Bounded on small screens
          by max-h; on xl it simply fills whatever the column has left, which is
          the "use maximum space" ask. The contract's one-scroll rule does not
          count a `max-h-*` region -- nested preview, not the page's scroll
          owner, which is still pages/[...slug].vue's content-host.
        -->
        <section
          class="flex max-h-80 flex-col overflow-y-auto overscroll-contain kr-panel-flat p-3 xl:max-h-full xl:min-h-0 xl:flex-1"
        >
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
      </div>
    </div>

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
 * SIX GALLERIES, NAMED. Silas, 2026-09-01: "the six galleries (art images,
 * dreams, character, rewards (items and skills combined) scenario, and facets,
 * in 3 columns and two rows."
 *
 * That list is exactly six, and it does not include bots or animations -- both
 * were on the page before and are not any more. Worth stating plainly rather
 * than leaving to be noticed: dropping a kind from the front page is a content
 * decision, and if bots should be back, one of these six has to give up its
 * cell or the grid stops being 3x2.
 *
 * ORDER IS THE ARGUMENT. Art first because it is the most immediately legible
 * proof that something is happening here; then the objects roughly in the order
 * the dream cycle creates them.
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
    // Was a double-height cell spanning two grid rows ("on desktop, art queue
    // can take up twice the height", 2026-08-29). The shelves are one scrolling
    // row now (2026-08-30), so there is no second row to span and the art shelf
    // is an ordinary single-row shelf like the rest.
    fit: 'contain',
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
    // "rewards (items and skills combined)" -- they already are: Reward is one
    // model with a rewardType of ITEM or SKILL, and this rail has always shown
    // both. The label says so.
    label: 'New items and skills',
    icon: 'kind-icon:treasure',
    placeholderIcon: 'kind-icon:treasure',
    href: '/rewards',
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

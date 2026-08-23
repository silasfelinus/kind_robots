<!-- /components/gallery/kr-gallery.vue -->
<!--
  Shared browse/filter gallery shell, extracted from the proven recipe in
  conductor-project-gallery-page.vue (interface-vision/t-008): one scroll
  owner, four view modes driven off three computed class strings, aspect-
  locked art with a hover-scale scrim, and skeleton/error/empty states.
  Purely presentational and controlled -- the parent owns data fetching,
  filtering, and mode persistence (see stores/galleryPreferenceStore.ts).
-->
<template>
  <!--
    data-kr-gallery marks THE GALLERY, as data-kr-gallery-grid below marks its
    grid. Both exist for utils/scripts/auditGalleryChrome.ts, and the second one
    alone turned out not to be enough.

    The grid renders only when a gallery HAS items, so on a route that mounts
    several galleries the audit's `first marked grid on the page` silently
    resolved to whichever gallery happened to be populated. /servers measured
    742px that way: server-overview stacks four galleries, the first three were
    empty ("No matching servers"), and the number reported as that route's
    chrome was the offset of the FOURTH. The true chrome above its first gallery
    is ~106px -- comfortably inside budget, and the opposite conclusion.

    Same failure family as the fallback selectors removed in #1595: a confident
    number measured off the wrong element. Marking the gallery root -- which
    renders whether or not the API answered -- lets the audit name the first
    gallery, measure the chrome above it without needing data, and say
    `no-cards` about THAT gallery instead of skipping to a later one.
  -->
  <div class="flex w-full flex-col gap-3" data-kr-gallery>
    <!--
      STICKY, because the shell does not own the scroll container -- the parent
      does, and every adopting parent scrolls the whole gallery including this
      bar. Silas, 2026-08-05: "the layout toggle ... are improperly placed
      inside the scrollable container so we cannot see after scrolling down."
      Sticking to the top of whatever ancestor scrolls keeps the control
      reachable without requiring each parent to restructure its panes. The
      background is required: without it the grid shows through as it passes
      under the buttons.
    -->
    <!--
      ONE ROW, NOT TWO. Silas, 2026-08-07, on a 1366x768 desktop: "the choose
      your reward, pick a story reward text, maturity toggle and search bar, and
      card hero icons sections should be at most 1-2 rows. This is taking up a
      significant amount of real estate."

      He was right, and the mode bar was half of it -- a full row of its own for
      three small buttons, above whatever filter row the parent had already
      drawn. The `#toolbar` slot lets a gallery put its filters HERE instead, so
      filters and modes share one line and the parent's second row disappears.
      The bar still renders alone when nothing is slotted, so galleries that
      have not adopted it are unaffected.
    -->
    <div
      v-if="modes.length || $slots.toolbar || pageCount > 1"
      class="sticky top-0 z-20 -mx-1 flex shrink-0 flex-wrap items-center gap-1 bg-(--kr-surface-sunken) px-1 py-1 backdrop-blur"
    >
      <!--
        interface-vision/t-117: this was `min-w-0 flex-1` (flex-basis 0%), the
        same shape as #1890's channel-select/tab-select bug. flex-wrap decides
        whether an item fits the current line using its HYPOTHETICAL main
        size, which for a flex-basis:0 item is always 0 -- so the browser
        never sees this slot as "too big" and never wraps it to its own line.
        Instead every pixel the toolbar's own filters (type toggle, status
        select, search box) couldn't fit landed on this div via min-w-0,
        which crushed it to a few px wide on /bots once the pager (`shrink-0`,
        so it never gives ground) and the mode buttons were also on the line.
        `flex-auto` (basis: auto) makes the hypothetical size the slot's real
        content width, so when it doesn't fit next to the pager/modes it
        wraps to a second line -- which `flex-wrap` on the bar above already
        intended -- instead of being squeezed in place. min-w-0 stays so it
        can still shrink normally on lines where it fits.
      -->
      <div v-if="$slots.toolbar" class="min-w-0 flex-auto">
        <slot name="toolbar" />
      </div>

      <!--
        THE PAGER RIDES THIS BAR rather than sitting in a band under the grid.
        The bar is `sticky` inside whatever ancestor scrolls, so on a big
        collection the control stays reachable instead of living a thousand
        cards below the fold -- and a band of its own would spend a row, which
        is the opposite of what this stage is for.

        It renders only when there IS a second page, so every gallery that fits
        on one is visually unchanged. That is also why `pageCount > 1` joins the
        bar's own v-if above: theme-gallery's two grids pass `:modes="[]"` and
        no toolbar, so without it they would page with no way to turn the page.
      -->
      <div
        v-if="pageCount > 1"
        class="ml-auto flex shrink-0 items-center gap-1"
      >
        <span class="text-xs tabular-nums text-base-content/60">
          {{ pageRangeLabel }}
        </span>

        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-xl"
          :disabled="page === 0"
          aria-label="Previous page"
          @click="page--"
        >
          <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
        </button>

        <span class="text-xs font-bold tabular-nums">
          {{ page + 1 }}/{{ pageCount }}
        </span>

        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-xl"
          :disabled="page >= pageCount - 1"
          aria-label="Next page"
          @click="page++"
        >
          <Icon name="kind-icon:arrow-right" class="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        v-for="entry in modes"
        :key="entry.value"
        type="button"
        class="btn btn-xs px-2"
        :class="mode === entry.value ? 'btn-primary' : 'btn-ghost'"
        :title="entry.label"
        :aria-label="entry.label"
        :aria-pressed="mode === entry.value"
        @click="emit('update:mode', entry.value)"
      >
        <!--
          GLYPH BELOW lg, glyph AND word from lg. Silas, 2026-08-10: "Cards
          heroes icons should be icons on sm and md displays."

          This used to be a single letter below sm and the full word above it,
          and the letter was the weakest part: "C H I" tells a first-time
          visitor nothing, and three words are ~200px of a 390px row. A glyph
          says what a letter cannot in the same space, and it stays on screen at
          every width, so the control does not change identity as the window
          grows -- it just gains a label. `title` and `aria-label` carry the
          word at every size, so nothing is lost when it is not drawn.

          `abbr` stays in the vocabulary for callers that still want a letter;
          it simply is not what this bar reaches for any more.
        -->
        <Icon :name="entry.icon" class="h-3.5 w-3.5 shrink-0" />
        <span class="hidden lg:inline">{{ entry.label }}</span>
      </button>
    </div>

    <div
      v-if="loading && !items.length"
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
    >
      <div
        v-for="n in skeletonCount"
        :key="n"
        class="h-56 animate-pulse rounded-2xl bg-base-200"
      />
    </div>

    <div
      v-else-if="error"
      class="flex min-h-64 flex-col items-center justify-center gap-2 text-error"
    >
      <Icon name="kind-icon:warning" class="size-10" />
      <b>{{ error }}</b>
    </div>

    <!--
      The empty state is slotted for the same reason `item` is: a generic
      "No scenarios." is a downgrade for a gallery that had search-aware copy
      and an Add call-to-action, and losing that to adopt the shell would make
      adoption cost the user something. Callers with nothing special to say
      omit the slot and get the default below.
    -->
    <div
      v-else-if="!items.length"
      class="flex min-h-64 flex-col items-center justify-center text-center"
    >
      <slot name="empty">
        <Icon name="kind-icon:cards" class="size-12 text-base-content/20" />
        <b>No {{ emptyLabel }}.</b>
      </slot>
    </div>

    <!--
      data-kr-gallery-grid marks THE grid for utils/scripts/auditGalleryChrome.ts,
      which measures how much vertical space a route spends before its first
      card. That audit used to find the grid by heuristic -- "the element with
      display:grid and the most children" -- and the heuristic was wrong: it
      picked the same app-shell grid on every route, so six different galleries
      reported byte-identical numbers (34px phone, 31px laptop). A measurement
      that agrees across pages that look nothing alike is measuring the layout,
      not the pages.

      An attribute is cheap and unambiguous, and it lives here because this is
      the component that knows which element is the gallery grid.
    -->
    <section v-else :class="gridClass" data-kr-gallery-grid>
      <!--
        An `item` slot, so a gallery can keep its own object card inside this
        shell instead of trading it away to adopt the shell.

        Without it the two halves of the design brief fight each other: t-064
        put all five object cards on kr-entity-card-body (reactions, earned
        karma, edit/archive actions), and t-060 wants all seven core objects on
        one gallery. Adopting this shell with only the built-in rendering below
        would have meant Dreams, Bots, Characters, Rewards and Scenarios losing
        their reviews and actions -- a regression wearing an adoption's clothes.

        So the split is: this component owns the SHELL (mode bar, grid, one
        scroll owner, skeleton/error/empty, art fallback), and the caller owns
        the CARD. Galleries whose rows have no reactable card -- facets,
        projects -- pass no slot and keep the built-in rendering below
        unchanged, which is why this is additive rather than a breaking change.
      -->
      <template v-if="$slots.item">
        <slot
          v-for="item in pagedItems"
          :key="`slot-${item.id}`"
          name="item"
          :item="item"
          :mode="mode"
          :art-src="artSrc(item)"
          :open="() => emit('open', item)"
        />
      </template>

      <template v-else>
        <template v-for="item in pagedItems" :key="item.id">
          <button
            v-if="mode === 'icons'"
            type="button"
            :data-theme="themed ? itemTheme(item) : undefined"
            class="group flex min-w-0 items-center gap-3 rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface) p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            @click="emit('open', item)"
          >
            <div
              class="relative size-16 shrink-0 overflow-hidden rounded-xl bg-(--kr-surface-sunken)"
            >
              <img
                v-if="artSrc(item)"
                :src="artSrc(item)"
                :alt="item.title"
                class="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                @error="onArtError(artSrc(item))"
              />
              <div
                v-else
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-linear-to-br from-base-200 to-base-300 text-base-content/40"
              >
                <Icon
                  :name="item.placeholderIcon || 'kind-icon:image'"
                  class="size-7"
                />
                <span
                  v-if="item.placeholderLabel"
                  class="text-[9px] uppercase tracking-wide"
                >
                  {{ item.placeholderLabel }}
                </span>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div
                v-if="item.badges?.length"
                class="mb-1 flex flex-wrap gap-1"
              >
                <span
                  v-for="badge in item.badges"
                  :key="badge.label"
                  class="badge badge-xs"
                  :class="badge.class"
                >
                  {{ badge.label }}
                </span>
              </div>

              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <h2 class="break-words font-black leading-tight">
                    {{ item.title }}
                  </h2>
                  <p
                    v-if="item.description"
                    class="mt-0.5 line-clamp-2 text-xs text-base-content/55"
                  >
                    {{ item.description }}
                  </p>
                </div>
                <slot name="item-trailing" :item="item" />
              </div>

              <p
                v-if="item.meta"
                class="mt-1.5 text-xs text-base-content/45"
              >
                {{ item.meta }}
              </p>
              <div
                v-if="item.progressPercent !== undefined"
                class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"
              >
                <div
                  class="h-full bg-primary"
                  :style="{ width: `${item.progressPercent}%` }"
                />
              </div>
            </div>
          </button>

          <button
            v-else
            type="button"
            :data-theme="themed ? itemTheme(item) : undefined"
            class="group overflow-hidden rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface) text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
            @click="emit('open', item)"
          >
            <div
              class="relative overflow-hidden bg-(--kr-surface-sunken)"
              :class="mode === 'cards' ? 'aspect-2/3' : 'aspect-video'"
            >
              <img
                v-if="artSrc(item)"
                :src="artSrc(item)"
                :alt="item.title"
                class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                @error="onArtError(artSrc(item))"
              />
              <div
                v-else
                class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-linear-to-br from-base-200 to-base-300 text-base-content/40"
              >
                <Icon
                  :name="item.placeholderIcon || 'kind-icon:image'"
                  class="size-8"
                />
                <span
                  v-if="item.placeholderLabel"
                  class="text-[10px] uppercase tracking-wide"
                >
                  {{ item.placeholderLabel }}
                </span>
              </div>
              <div
                class="absolute inset-0 bg-linear-to-t from-base-300/90 via-transparent to-transparent"
              />
              <div
                v-if="item.badges?.length"
                class="absolute left-2 top-2 flex flex-wrap gap-1"
              >
                <span
                  v-for="badge in item.badges"
                  :key="badge.label"
                  class="badge badge-xs"
                  :class="badge.class"
                >
                  {{ badge.label }}
                </span>
              </div>
              <img
                v-if="item.icon && !failedArt.has(item.icon)"
                :src="item.icon"
                alt=""
                class="absolute bottom-2 left-2 size-11 rounded-xl border border-white/25 object-cover shadow"
                @error="onArtError(item.icon)"
              />
            </div>

            <div class="p-3">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <h2 class="break-words font-black leading-tight">
                    {{ item.title }}
                  </h2>
                  <p
                    v-if="item.description"
                    class="line-clamp-2 text-xs text-base-content/55"
                  >
                    {{ item.description }}
                  </p>
                </div>
                <slot name="item-trailing" :item="item" />
              </div>
              <p v-if="item.meta" class="mt-2 text-xs text-base-content/45">
                {{ item.meta }}
              </p>
              <div
                v-if="item.progressPercent !== undefined"
                class="mt-1.5 h-1 overflow-hidden rounded-full bg-base-content/10"
              >
                <div
                  class="h-full bg-primary"
                  :style="{ width: `${item.progressPercent}%` }"
                />
              </div>
            </div>
          </button>
        </template>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { resolveEntityTheme } from '@/utils/entityTheme'
import {
  resolveArtVariantSrc,
  type ArtImageSrcLike,
  type ArtVariant,
} from '@/utils/artImageSrc'

// The vocabulary lives in utils/galleryVocabulary.ts — a plain module, because
// <script setup> cannot carry value exports and because four other components
// need these without importing a component. Re-exported here so existing
// `import type { GalleryMode } from '.../kr-gallery.vue'` call sites keep
// working; new code should import from the util directly.
import {
  DENSITY_GRID_CLASS,
  GALLERY_MODES,
  MODE_GRID_CLASS,
  MODE_VARIANT,
  type GalleryDensity,
  type GalleryMode,
  type GalleryModeOption,
} from '@/utils/galleryVocabulary'

export type { GalleryDensity, GalleryMode, GalleryModeOption }

export interface GalleryItem {
  id: string | number
  title: string
  description?: string
  /*
   * Pre-resolved variant URLs. Use these when the caller's resolution is
   * genuinely domain-specific -- conductor-project-gallery-page.vue, for one,
   * merges a remote conductor record, detects canonical paths and appends a
   * cache-busting revision, none of which a generic resolver can do.
   */
  icon?: string
  card?: string
  hero?: string
  /*
   * The raw record instead, for the ordinary case. kr-gallery resolves it
   * through resolveArtVariantSrc, so a consumer stops hand-rolling the
   * cardPath || imagePath || heroPath || iconPath chain -- six components were
   * each carrying their own copy of exactly that when this was added.
   */
  source?: ArtImageSrcLike
  meta?: string
  progressPercent?: number
  badges?: Array<{ label: string; class?: string }>
  /** Shown when nothing resolves. Defaults to a generic image glyph. */
  placeholderIcon?: string
  placeholderLabel?: string
}

const props = withDefaults(
  defineProps<{
    items: GalleryItem[]
    mode?: GalleryMode
    modes?: GalleryModeOption[]
    loading?: boolean
    error?: string
    emptyLabel?: string
    skeletonCount?: number
    /**
     * How many items to RENDER at once. Pass 0 to render every item.
     *
     * ON BY DEFAULT, DELIBERATELY. The original split gave this shell the grid
     * and left paging to each caller, on the reasoning that pagination is the
     * parent's business. In practice it meant every caller had to remember, and
     * eleven of the thirteen did not: bot, character, dream, reward, scenario,
     * icon, server, checkpoint, stylist-client, theme and achievement all
     * handed over their whole filtered set. Only art-gallery paged; only
     * facet-gallery capped, per taxonomy group.
     *
     * It surfaced on /resources first because that is the biggest table --
     * Silas, 2026-08-08: "There seems to be no pagination. Are we trying to
     * load thousands on one page? It freezes." Every other gallery had the same
     * defect and was waiting to grow into it, which is the argument for fixing
     * it HERE instead of pasting a slice into eleven more files.
     *
     * A default you opt OUT of is the right way round: forgetting it now costs
     * a pager nobody needed, rather than a frozen tab.
     */
    /**
     * Paint each built-in tile with its record's daisyUI theme.
     *
     * OPT-IN, because this renderer draws more than the themed objects. Silas,
     * 2026-08-10, naming the ones that get a theme column -- "rewards, dreams,
     * characters" plus Facets -- and the ones that do not: "themes does not
     * need a theme. Icons don't need themes. Achievements don't need themes."
     * Those all reach this same built-in tile, so a default-on version would
     * have themed exactly the galleries that were excluded.
     *
     * Galleries that pass an `item` slot theme their own card instead (see
     * bot-card and its four siblings); this flag is for the ones with no card
     * component of their own, which today means Facets.
     */
    themed?: boolean
    pageSize?: number
    /**
     * How many tiles per row, independent of which image `mode` loads. Omit to
     * let mode pick the grid, which is what every gallery but art-gallery does.
     * See the GalleryDensity note in utils/galleryVocabulary.ts for why this is
     * a fourth axis and why it is a closed enum rather than a class string.
     */
    density?: GalleryDensity
  }>(),
  {
    mode: 'cards',
    modes: () => [...GALLERY_MODES],
    loading: false,
    error: '',
    emptyLabel: 'items',
    skeletonCount: 8,
    themed: false,
    pageSize: 48,
    density: undefined,
  },
)

const emit = defineEmits<{
  open: [item: GalleryItem]
  'update:mode': [mode: GalleryMode]
}>()

/*
 * Density wins when the caller sets it, otherwise mode picks the grid. Both
 * maps live in galleryVocabulary.ts, so neither is a class string invented
 * here -- the shell has no bespoke-grid escape hatch, by design.
 */
const gridClass = computed(() =>
  props.density
    ? DENSITY_GRID_CLASS[props.density]
    : MODE_GRID_CLASS[props.mode],
)
const page = ref(0)

const pageCount = computed(() => {
  if (props.pageSize <= 0) return 1
  return Math.max(1, Math.ceil(props.items.length / props.pageSize))
})

const pagedItems = computed(() => {
  if (props.pageSize <= 0) return props.items
  const start = page.value * props.pageSize
  return props.items.slice(start, start + props.pageSize)
})

/*
 * CLAMP, do not reset. `items` is recomputed on every keystroke of a parent's
 * search box, so resetting to page 0 whenever it changed would make any page
 * but the first unreachable. Clamping moves you only when the page you are on
 * has genuinely stopped existing -- narrow 2,000 rows to 30 while on page 12
 * and every later render would otherwise be an empty grid with no way back.
 *
 * pageCount is pinned to 1 while paging is off, so this is inert for opted-out
 * callers rather than something they have to reason about.
 */
watch(pageCount, (count) => {
  if (page.value > count - 1) page.value = count - 1
})

const pageRangeLabel = computed(() => {
  const total = props.items.length
  if (!total) return ''

  const first = page.value * props.pageSize + 1
  const last = Math.min(first + props.pageSize - 1, total)

  return `${first}–${last} of ${total}`
})

const modeVariant = computed<ArtVariant>(() => MODE_VARIANT[props.mode])

/**
 * Sources that 404'd or otherwise failed. Keyed by URL rather than item id, so
 * one missing file is remembered across a mode switch that re-resolves the same
 * path, and two items sharing a placeholder path fail once between them.
 */
const failedArt = ref(new Set<string>())

/** The art to show, or '' when there is none — including "there was, and it broke". */
function artSrc(item: GalleryItem): string {
  const src = displayImage(item)
  return src && !failedArt.value.has(src) ? src : ''
}

function onArtError(src: string): void {
  if (!src || failedArt.value.has(src)) return
  // A fresh Set: mutating in place would not trip reactivity, and the card
  // would keep rendering its broken <img> with the alt text showing.
  failedArt.value = new Set(failedArt.value).add(src)
}

function displayImage(item: GalleryItem): string {
  const preResolved =
    modeVariant.value === 'hero'
      ? item.hero
      : modeVariant.value === 'icon'
        ? item.icon
        : item.card

  // A caller that pre-resolved wins outright; only fall back across variants
  // for callers that pre-resolved SOME of them.
  if (preResolved) return preResolved
  if (item.source) return resolveArtVariantSrc(item.source, modeVariant.value)
  return item.card || item.icon || item.hero || ''
}

/*
 * The record's own theme, or a stable id-derived one. Only consulted when the
 * caller opts in via `themed` -- see the prop's note for why this is not the
 * default.
 */
function itemTheme(item: GalleryItem): string {
  return resolveEntityTheme({
    id: item.id,
    theme: (item.source as { theme?: string | null } | undefined)?.theme,
  })
}
</script>

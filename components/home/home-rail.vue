<!-- /components/home/home-rail.vue -->
<!--
  One shelf on the home page: an icon, a destination, and a row of plates that
  scrolls sideways.

  Silas, 2026-08-28: "These displays should always lead to something, not just
  static displays of images and text." So every tile is an <a>, and
  `showcaseHref` (one function, in utils/homeShowcase.ts) is the only thing that
  decides where it goes.

  THE SHELF IS A PANEL, not bare content on the page. Silas, 2026-08-29: "the
  lack of backgrounds around text is merging it with the background." The app
  paints full-page generated art behind every route (kr-page-backdrop), so a
  label and a caption sitting directly on that had no ground of their own and
  dissolved into whatever the backdrop happened to be doing. The panel is that
  ground.

  THE HEADER IS TWO GLYPHS. Silas, 2026-08-29: "Would love to replace the words
  for new dreams, characters, etc with just an icon, same with see all, and slim
  it does even more." The words cost a full text line per shelf across eight
  shelves; the icons say the same thing in the height of the row they share with
  the count. The label survives as the link's accessible name and its tooltip --
  it is removed from the screen, not from the accessibility tree.

  CHEVRONS, NOT A SCROLLBAR. Silas, same message: "Could we use <> chevrons
  instead of a scrollbar, or at least, only show the scrollbar if highlighted,
  there is a lot of space taken up by them overall." Eight shelves each reserving
  a horizontal scrollbar gutter is eight rows of nothing. The track is
  `.no-scrollbar` and the two chevrons sit IN the header row, which was already
  there -- so the control costs no height at all, and disappears entirely on a
  shelf whose tiles already fit.

  EVERY TILE WEARS ITS RECORD'S OWN THEME. Silas, 2026-08-29: "The lack of
  different theme colors is notable, it would give us more variety easily" --
  and earlier, 2026-08-10, on the object cards: "each card when viewed should
  have a theme shift to distinguish it from neighbours." That mechanism already
  existed (utils/entityTheme.ts, the `theme` column on all six object models);
  this puts the rails on it. data-theme goes on the WRAPPER, above the surface
  that reads the tokens, for the same reason character-card.vue documents.

  WHY SIDEWAYS AND NOT A GRID. A grid of eight kinds stacked vertically is a
  very long page that buries the last kind. The rail scrolls with
  overflow-x-auto, which the layout contract's one-scroll rule deliberately does
  not count (it counts overflow-y-auto / overflow-auto) -- vertical scroll
  ownership stays entirely with the page host.

  NO SCROLL SNAP. It used to carry `snap-x snap-mandatory`; mandatory snapping
  re-aligns the track to the nearest snap point on layout, and with the padding
  this row needs that landed mid-tile, clipping the first card. Silas, 2026-08-29:
  "Weird gutters are hiding content." A browse rail gains nothing from snapping,
  so it is gone rather than tuned.
-->
<template>
  <section class="flex h-full min-w-0 flex-col gap-1 kr-panel-flat p-2">
    <header class="flex shrink-0 items-center gap-1">
      <!--
        The shelf's identity, as one glyph. `title` and `aria-label` carry the
        words so a screen reader and a hover both still get "New characters".
      -->
      <span
        class="flex shrink-0 items-center gap-1 text-primary"
        :title="label"
        :aria-label="label"
      >
        <Icon :name="icon || placeholderIcon" class="size-4" />
        <span
          v-if="items.length"
          class="text-[0.6rem] font-black tabular-nums text-base-content/40"
          >{{ items.length }}</span
        >
      </span>

      <!-- Anything the host wants in this row (the art shelf's mode toggle). -->
      <div class="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        <slot name="controls" />
      </div>

      <!--
        Both chevrons and the destination, all icon-sized, all in the row the
        header already occupied. `v-show` rather than `v-if` on the chevrons so
        the header's width does not jump as a shelf becomes scrollable.
      -->
      <span v-show="canScroll" class="flex shrink-0 items-center">
        <button
          type="button"
          class="grid size-5 place-items-center rounded text-base-content/45 transition-colors hover:text-primary disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :disabled="atStart"
          :aria-label="`Scroll ${label} backwards`"
          @click="scrollBy(-1)"
        >
          <Icon name="kind-icon:chevron-left" class="size-3.5" />
        </button>
        <button
          type="button"
          class="grid size-5 place-items-center rounded text-base-content/45 transition-colors hover:text-primary disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :disabled="atEnd"
          :aria-label="`Scroll ${label} forwards`"
          @click="scrollBy(1)"
        >
          <Icon name="kind-icon:chevron-right" class="size-3.5" />
        </button>
      </span>

      <NuxtLink
        :to="seeAllHref"
        class="grid size-5 shrink-0 place-items-center rounded text-base-content/45 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        :title="`${label} — ${seeAllLabel}`"
        :aria-label="`${label} — ${seeAllLabel}`"
      >
        <Icon name="kind-icon:arrow-right" class="size-3.5" />
      </NuxtLink>
    </header>

    <!--
      No negative margin. The old `-mx-1 px-1` pulled the track outside its
      container to keep focus rings from clipping; inside a panel that just
      pushed the first tile under the panel's own edge. The ring is handled with
      `outline-offset-0` on the tiles instead, which needs no bleed.

      `rows="2"` lays the tiles out as a two-row grid flowing sideways rather
      than a single row. Silas, 2026-08-29: "on desktop, art queue can take up
      twice the height, so we have an even spacing for the other six objects" --
      the art rail spans two grid rows on the page, and this is what fills that
      cell instead of one row floating in it.
    -->
    <div
      ref="track"
      class="no-scrollbar min-h-0 flex-1 overflow-x-auto scroll-smooth"
      :class="
        rows === 2
          ? 'grid grid-flow-col grid-rows-2 auto-cols-max content-between gap-2'
          : 'flex gap-2'
      "
      @scroll.passive="measure"
    >
      <!--
        border-2 in the record's own PRIMARY, not base-300. Silas, 2026-08-29:
        "slightly larger colored borders around those objects, if they are theme
        colors, it's very hard to tell." A hairline in base-300 is theme-derived,
        but every theme's base-300 is a near-neutral grey, so the variety was
        invisible; primary is the token that actually differs between themes.
      -->
      <component
        :is="interactive ? 'button' : 'NuxtLink'"
        v-for="item in items"
        :key="`${item.kind}-${item.id}`"
        :type="interactive ? 'button' : undefined"
        :to="interactive ? undefined : showcaseHref(item)"
        :data-theme="themeFor(item)"
        class="group flex shrink-0 flex-col overflow-hidden rounded-xl border-2 border-primary/70 bg-base-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5"
        :class="cardWidthClass"
        :title="item.subtitle ? `${item.title} — ${item.subtitle}` : item.title"
        @click="interactive ? emit('select', item) : undefined"
      >
        <kr-art-plate
          :source="item.art"
          :variant="plateVariant"
          :shape="shape"
          frame="none"
          :alt="item.title"
          :fallback="fallbackFor(item)"
          :placeholder-icon="placeholderIcon"
          hover-zoom
          :fit="fit"
        >
          <!--
            A queue tile's state, as a corner chip. Only the art shelf's queue
            mode sets this; every other shelf shows objects that are simply
            finished and passes nothing.
          -->
          <template v-if="item.status" #overlay>
            <span
              class="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded px-1 text-[0.45rem] font-black uppercase tracking-[0.08em] backdrop-blur"
              :class="statusChipClass(item.status)"
            >
              {{ item.status }}
            </span>
          </template>
        </kr-art-plate>

        <!--
          Title only. The subtitle used to sit under it, but at a 5rem tile it
          truncated to "a short line of co…" on every card -- a line of height
          per rail spent on nothing. It survives as the link's tooltip.
        -->
        <div class="min-w-0 px-1.5 py-1">
          <p
            class="truncate text-xs font-bold leading-tight text-base-content group-hover:text-primary"
          >
            {{ item.title }}
          </p>
        </div>
      </component>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { showcaseHref, type RailItem } from '@/utils/homeShowcase'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'
import { defaultArtFor } from '@/utils/defaultArtPool'
import { resolveEntityTheme } from '@/utils/entityTheme'

const props = withDefaults(
  defineProps<{
    label: string
    items: RailItem[]
    seeAllHref: string
    seeAllLabel?: string
    /** The glyph that replaces the shelf's written label on screen. */
    icon?: string
    /** 'card' is the 2:3 portrait shelf; 'wide' is the 4:3 art shelf. */
    shape?: ArtPlateShape
    plateVariant?: ArtVariant
    placeholderIcon?: string
    /** 2 lays the tiles out in two rows, for a rail spanning two grid rows. */
    rows?: 1 | 2
    /**
     * 'contain' shows the whole frame. Silas, 2026-08-29, on the art queue:
     * "we sghould get full views of the images". Cropping a render to a tile's
     * aspect is fine for an object whose card art was composed for that box,
     * and wrong for the queue, where the point is what was actually made.
     */
    fit?: 'cover' | 'contain'
    /**
     * Tiles emit `select` instead of navigating. Silas, 2026-08-29: "Whenever I
     * click on one of the new objects, I want it to expand to tell me about it
     * ... with clicking outside the container returning to the homepage."
     */
    interactive?: boolean
  }>(),
  {
    seeAllLabel: 'see all',
    fit: 'cover',
    shape: 'card',
    plateVariant: 'card',
    placeholderIcon: 'kind-icon:image',
    icon: '',
    rows: 1,
    interactive: false,
  },
)

const emit = defineEmits<{ select: [item: RailItem] }>()

const track = ref<HTMLElement | null>(null)
const canScroll = ref(false)
const atStart = ref(true)
const atEnd = ref(false)

/*
 * Fixed tile widths, not a responsive column count: a rail's job is to leave a
 * partial tile at the right edge so the row reads as continuing. Deliberately
 * NOT `grid-cols-*` at a breakpoint -- this is a shared component and the
 * layout contract's viewport-grid rule exists because such a component gets
 * embedded in hosts narrower than the viewport implies. These rails now sit in
 * a multi-column grid, which is exactly that case.
 *
 * The landscape rails run wider than the portrait ones because the art rail is
 * the one that spans two grid rows: at w-40 its two rows of 4:3 tiles came up
 * ~90px short of the cell the six object shelves define beside it, leaving a
 * dead corner. w-48 fills it, and bigger plates suit the art queue anyway.
 */
const cardWidthClass = computed(() =>
  props.shape === 'wide' || props.shape === 'hero' ? 'w-48' : 'w-32',
)

function fallbackFor(item: RailItem): string {
  return defaultArtFor(`${item.kind}-${item.id}`)
}

/**
 * The record's own theme, or none.
 *
 * resolveEntityTheme falls back to an id-derived pick when a record has no
 * stored theme, which is what gives the object shelves their variety. ArtImage
 * has no `theme` column at all, so every render was being dressed in an
 * arbitrary theme -- harmless while plates were cropped, and obvious once they
 * switched to `contain`, because the letterbox bars took that theme's base
 * colour and the art queue turned into a row of bright pink and navy frames.
 *
 * Art and clips keep the page theme, so a letterboxed render sits on warm paper
 * like everything else.
 */
function themeFor(item: RailItem): string | undefined {
  if (item.kind === 'art' || item.kind === 'animation') return undefined

  return resolveEntityTheme({ id: item.id, theme: item.theme })
}

/*
 * Tone the queue chip by what it is telling you, using daisyUI's semantic
 * tokens so it reads correctly in every theme rather than in the one it was
 * designed against.
 */
function statusChipClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'FAILED':
      return 'bg-error text-error-content'
    case 'RUNNING':
      return 'bg-warning text-warning-content'
    case 'DONE':
      return 'bg-success text-success-content'
    case 'CANCELLED':
      return 'bg-base-300 text-base-content/70'
    default:
      return 'bg-base-100/90 text-base-content'
  }
}

/**
 * Whether the track overflows, and which ends it has reached — the chevrons'
 * visible and disabled states.
 *
 * The 2px slack absorbs sub-pixel layout rounding: without it a track scrolled
 * fully right reports `scrollLeft + clientWidth` a fraction under `scrollWidth`
 * forever, and the forward chevron never disables.
 */
function measure(): void {
  const element = track.value
  if (!element) return

  const max = element.scrollWidth - element.clientWidth
  canScroll.value = max > 2
  atStart.value = element.scrollLeft <= 2
  atEnd.value = element.scrollLeft >= max - 2
}

/** One press moves about a screenful of shelf, keeping a tile of context. */
function scrollBy(direction: 1 | -1): void {
  const element = track.value
  if (!element) return

  element.scrollBy({
    left: direction * Math.max(element.clientWidth * 0.8, 160),
    behavior: 'smooth',
  })
}

let observer: ResizeObserver | null = null

onMounted(() => {
  measure()
  if (typeof ResizeObserver === 'undefined') return

  // The shelf's width changes with the page grid, not just with its contents,
  // so a content watcher alone would leave stale chevrons after a resize.
  observer = new ResizeObserver(() => measure())
  if (track.value) observer.observe(track.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(
  () => props.items.length,
  () => {
    void nextTick(measure)
  },
)
</script>

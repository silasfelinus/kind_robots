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

  THE HEADER IS ONE ROW: a glyph, the shelf's name, its count, and the chevrons.
  It began as two glyphs and no words -- Silas, 2026-08-29: "Would love to
  replace the words for new dreams, characters, etc with just an icon, same with
  see all, and slim it does even more" -- because eight shelves each spending a
  text line on a heading was eight wasted rows.

  There are six shelves now, in a 3x2 grid with room to spare, and the words
  came back at his request on 2026-09-01 and 09-02. The saving that justified
  dropping them is gone, and an icon alone made you learn which glyph meant
  scenarios. The name doubles as the see-all link, so the row is still one line
  and still carries exactly one destination.

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
      <NuxtLink
        :to="seeAllHref"
        class="flex min-w-0 shrink items-center gap-1 rounded text-primary transition-colors hover:text-primary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        :title="`${label} — ${seeAllLabel}`"
        :aria-label="`${label} — ${seeAllLabel}`"
      >
        <Icon :name="icon || placeholderIcon" class="size-4 shrink-0" />
        <!--
          THE WORDS COME BACK WHERE THERE IS ROOM. Silas, 2026-09-01: "objects
          section should be labeled if the screen supports it."

          The HOST decides, via `showLabel`, rather than this component guessing
          with a breakpoint -- that is the t-089 lesson: a breakpoint asks how
          big the WINDOW is, which is only the same question as how big this
          shelf is when the shelf is the window. It is not: below xl these
          shelves are 17rem cells in a scrolling row, and at xl they are ~480px
          cells in a 3x2 grid. Only the page knows which.

          AND THEN IT WAS GATED TWICE ANYWAY. This carried `hidden xl:inline` on
          top of `showLabel`, so the prop the host sets was overruled by the very
          breakpoint the note above says not to use, and the words never appeared
          below xl. Silas, 2026-09-02: "we are still missing text labels on the
          objects when we have room." The prop is now the only gate, as written.

          THE LABEL IS THE LINK. Silas, same message: "the see all link on the
          objects should not be there, it can be a link on the text that you will
          add instead." A separate arrow was a second control saying what the
          heading already says, and on a phone it competed with the chevrons for
          a strip only a few hundred pixels wide. The whole icon-label-count
          group is the destination now, which is also a far bigger tap target
          than a 20px glyph.
        -->
        <span
          v-if="showLabel"
          class="truncate text-[0.6rem] font-black uppercase tracking-[0.14em]"
          >{{ label }}</span
        >
        <span
          v-if="items.length"
          class="shrink-0 text-[0.6rem] font-black tabular-nums text-base-content/40"
          >{{ items.length }}</span
        >
      </NuxtLink>

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
      <!--
        STILL A LINK, even when it opens the interstitial. `interactive` once
        swapped this element for a <button>, which threw away the href: no
        middle-click, no "open in new tab", no destination in the status bar,
        and nothing for a crawler -- on the page whose whole brief is "These
        displays should always lead to something". Intercepting the plain click
        keeps the anchor and its address and still opens the sheet, and a
        modified click (cmd, ctrl, shift, middle) falls through to the browser
        exactly as it should.

      A PLAIN ANCHOR, NOT NuxtLink, AND THAT IS THE BUG FIX. Silas, 2026-08-30:
        "right now if I ckck something, I see a popup start, but then it jumps
        me to the dedicated page for that object".

        The tile was a NuxtLink with an `@click` that called preventDefault.
        RouterLink renders its OWN click handler, and a parent's fallthrough
        listener is merged AFTER it, so RouterLink's navigate ran first and saw
        `defaultPrevented === false`. It routed away; our handler then opened the
        sheet on a page that was already leaving. Exactly the flicker he
        describes. `.capture` does not fix it either -- for listeners on the
        event's own target, capture and bubble both fire in registration order.

        A plain <a> has no handler of its own, so preventDefault is the whole
        decision. The href stays real (middle-click, cmd-click, "open in new
        tab", the status bar, crawlers), and the non-interactive case still gets
        SPA routing because the handler calls router.push itself rather than
        letting the browser do a full page load.
      -->
      <a
        v-for="item in items"
        :key="`${item.kind}-${item.id}`"
        :href="showcaseHref(item)"
        :data-theme="themeFor(item)"
        class="group flex h-full shrink-0 flex-col overflow-hidden rounded-xl border-2 border-primary/70 bg-base-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5"
        :class="cardWidthClass"
        :style="tileStyle"
        :title="item.subtitle ? `${item.title} — ${item.subtitle}` : item.title"
        @click="onTileClick($event, item)"
      >
        <!--
          THE PICTURE TAKES WHATEVER THE CAPTION LEAVES. Silas, 2026-09-01:
          "there is wayyyy to much negative space on the object galleries ... we
          should also just have the space for the text and the images fill the
          rest."

          The tile used to be its plate's natural height plus one caption line,
          sitting inside a grid cell much taller than that -- so every gallery
          card had a band of empty panel under it. `min-h-0 flex-1` on the plate
          plus `h-full` on the tile inverts that: the caption claims its two
          lines and the plate expands into everything else. An aspect-ratio only
          sizes a box while a dimension is auto, so giving the plate a definite
          height makes `shape` inert here and the art crops to fill.
        -->
        <kr-art-plate
          class="min-h-12 flex-1"
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
          AS MANY LINES AS THE NAME NEEDS. Silas, 2026-09-01: "if we had two
          lines allocated we wouldn't have to cut so much text", and then
          2026-09-02: "if the title is larger than two lines, I'd rather we push
          to take up vertical space than truncate."

          So no clamp at all. The caption is `shrink-0` and the plate above it is
          `min-h-0 flex-1`, which means a third or fourth line takes its room
          from the picture rather than from the name -- the name is the part you
          are reading. The plate keeps a floor so a pathological title cannot
          squeeze the artwork out of existence entirely.
        -->
        <div class="min-w-0 shrink-0 px-1.5 py-1">
          <p
            class="text-xs font-bold leading-tight text-base-content group-hover:text-primary"
          >
            {{ item.title }}
          </p>
        </div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
    /**
     * Show the written label beside the glyph. The host sets this when its
     * layout gives the shelf room for words; see the note in the template for
     * why this is a prop rather than a breakpoint decided in here.
     */
    showLabel?: boolean
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
    showLabel: false,
    rows: 1,
    interactive: false,
  },
)

const emit = defineEmits<{ select: [item: RailItem] }>()

const router = useRouter()

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
/*
 * WHOLE TILES ONLY. Silas, 2026-09-02: "the other new objects should be properly
 * sized to fit their container space, no allow those partial cutoffs."
 *
 * A fixed tile width leaves whatever the track's width happens not to divide by.
 * Measured at 1920: a 465px shelf fitted three 128px tiles and left 65px, which
 * rendered as a 57px sliver of a fourth card at every shelf edge, on all six
 * shelves at once.
 *
 * The sliver used to be deliberate -- it was the only thing telling you the row
 * continued. That argument expired when the chevrons landed (2026-09-01, at
 * Silas's "we need an actual scroll selector"): the affordance now has its own
 * control, so the sliver is just a broken-looking edge.
 *
 * IDEAL_TILE is a target, not a size. The track is divided into however many
 * whole tiles land nearest it, so a shelf always ends on a tile boundary at any
 * width. `Math.round` rather than `floor`: flooring would rather grow tiles 40%
 * than fit one more, which reads worse than a slightly narrow tile.
 *
 * MAX_GROWTH is the other half of that, and it was missing. Rounding down to one
 * column is the same "grow the tile enormously" move the comment above rejects:
 * a 256px mobile shelf against the 192px wide ideal rounds to a single 256px
 * tile, a third over target and most of a phone screen. Silas, 2026-09-02:
 * "Still weird use of whitespace on the facet section on mobile when I scroll."
 * So a tile may run up to a quarter over the ideal and no further; past that,
 * fit one more column instead. Desktop is unaffected -- its shelves land at 149
 * and 228 against ceilings of 160 and 240.
 */
const GAP = 8 // gap-2
const IDEAL_TILE = { wide: 192, portrait: 128 } as const
const MAX_GROWTH = 1.25

const measuredTileWidth = ref(0)

const cardWidthClass = computed(() =>
  props.shape === 'wide' || props.shape === 'hero' ? 'w-48' : 'w-32',
)

/*
 * The class above stays as the pre-measurement value, so server-rendered markup
 * and the first paint are already the right ballpark rather than zero-width;
 * the inline width takes over on mount and on every resize.
 */
const tileStyle = computed(() =>
  measuredTileWidth.value
    ? { width: `${measuredTileWidth.value}px` }
    : undefined,
)

/** How many whole tiles the track is currently divided into. */
function fitTiles(available: number): { columns: number; width: number } {
  const ideal =
    props.shape === 'wide' || props.shape === 'hero'
      ? IDEAL_TILE.wide
      : IDEAL_TILE.portrait
  let columns = Math.max(1, Math.round((available + GAP) / (ideal + GAP)))
  const widthAt = (n: number) => Math.floor((available - (n - 1) * GAP) / n)

  // One extra column rather than one oversized tile. Guarded on the resulting
  // width staying usable, so a very narrow track still yields a single tile
  // instead of shrinking towards zero.
  if (widthAt(columns) > ideal * MAX_GROWTH && widthAt(columns + 1) >= 96) {
    columns += 1
  }

  return { columns, width: widthAt(columns) }
}

/**
 * What a plain left click on a tile does: open the interstitial on an
 * interactive shelf, or route to the record on any other.
 *
 * The modifier checks are what keep cmd/ctrl-click ("open in a new tab"),
 * shift-click ("open in a new window") and middle-click working: preventing
 * those would break the ordinary browser affordances the anchor exists to
 * provide. Everything else is prevented and handled here, which is only
 * reliable because this is a plain <a> -- see the note in the template.
 */
function onTileClick(event: MouseEvent, item: RailItem): void {
  if (event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  event.preventDefault()

  if (props.interactive) {
    emit('select', item)
    return
  }

  void router.push(showcaseHref(item))
}

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

  // Sized before the overflow is read, because the width IS what decides
  // whether the track overflows at all.
  measuredTileWidth.value = fitTiles(element.clientWidth).width

  const max = element.scrollWidth - element.clientWidth
  canScroll.value = max > 2
  atStart.value = element.scrollLeft <= 2
  atEnd.value = element.scrollLeft >= max - 2
}

/**
 * One press moves a whole page of whole tiles.
 *
 * Deliberately the full page rather than the 80% it used to scroll: 80% of a
 * track that holds exactly N tiles lands mid-tile, which would put back the
 * clipped edge this all exists to remove.
 */
function scrollBy(direction: 1 | -1): void {
  const element = track.value
  if (!element) return

  const { columns, width } = fitTiles(element.clientWidth)
  element.scrollBy({
    left: direction * columns * (width + GAP),
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

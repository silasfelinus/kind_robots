<!-- /components/home/home-dream-hero.vue -->
<!--
  The marquee: the most recent dream whose art is actually finished, with the
  cast the dream cycle built around it.

  WHY "MOST RECENT WITH ART" AND NOT "TODAY'S". Silas, 2026-08-28: "I want the
  dream, but there is a problem, it isn't always ready with art. So instead of
  Today's dream, it needs to be the most recent dream that has full art." The
  render queue runs days behind the authoring, so the newest dream is routinely
  a title with an empty plate. The choosing happens server-side in
  /api/showcase/home; this renders what it was handed.

  ONE PANEL, SIDE BY SIDE, at about a fifth to four fifths. The first cut gave the plate the full content width
  at 16:9 and stacked the cast beneath it, which came to roughly a full viewport
  before anything else appeared -- Silas, 2026-08-29: "that initial banner
  shouldn't be an entire page ... things should be combined." The plate and the
  cast are now one panel, in a row from `lg` up: the dream holds the light on
  the left, its cast reads as a column of small players on the right, and the
  whole band costs about a third of what it did.

  `lg:flex-row` rather than a grid on purpose -- the layout contract's
  viewport-grid rule forbids a shared component from gating grid-cols on a
  breakpoint, since it can be embedded in a host narrower than the viewport
  implies. Flex direction carries no such hazard.

  Everything in here is a link: the plate to the dream, each cast chip to its
  own object.
-->
<template>
  <!--
    THE CAST TAKES THE SLACK, which was the open question of the previous pass.
    A dream card at 20% plus small tiles plus a Needs-you column at a third came
    to about 65% of the band, and the leftover went to whitespace between the
    two groups because it was not clear which element should grow. Silas,
    2026-08-30, answered it: "the dream cards for the latest gen should fill up
    the rest of the space. It's the hero that we wanted to limit."

    So the card stays pinned at 20% of the screen, Needs-you keeps its third,
    and the cast is the flexible middle.
  -->
  <section class="flex flex-col gap-2 kr-panel-flat p-3 lg:flex-row">
    <!--
      NARROWER STILL, and it is the part that gives. Silas, 2026-08-29: "the
      dream elements are matched according to the dream hero, and that leaves a
      bunch of dead space, it would be better if the dream hero shrunk rather
      than the others gained, to save room" -- and "Dream entry should take up
      less horizontal space to leave room for a vertical notification scroll."

      So the cast went back to square plates (portrait ones had made the CAST
      set the band height, which is the reverse of what he asked for), and this
      card is a fixed width rather than a fifth of the page, freeing the width
      the Needs-you column now occupies.

      THEN MEASURED, because two passes of "a little wider" never got there.
      Silas, 2026-08-29: "that dream hero is absolutely not 20%." He was right,
      and it was checkable all along: at 1920 the card was 256px, which is 13.3%
      of the screen, while the cast tiles beside it were 157px EACH. The card
      read as subordinate to its own cast.

      `20vw` states the requirement he actually gave ("something that fits about
      20% width of screen") instead of approximating it with a rem width that is
      only correct at one viewport. The clamp keeps it sane at the extremes: no
      narrower than 14rem on a small laptop, no wider than 26rem on an ultrawide
      where 20% would be a poster. `vw` is fine here -- the layout contract's
      no-viewport rule bans viewport HEIGHT units (h-screen/100vh/100dvh) inside
      the h-dvh shell, not vw.

      WIDER AGAIN AT xl, because that is where the room went. Silas, 2026-09-01:
      "the dream hero gets the extra room, allowing for larger text on the
      description." Moving the newsfeed and project strip into a narrow right
      column freed most of the band, and this is where he asked it to land --
      26vw rather than 20vw, and the description below steps up a size with it.

      ABOUT A FIFTH OF THE WIDTH, in its natural proportion. Silas, 2026-08-29:
      "Obviously the dream hero is horribly proportioned, It would be better to
      have something that fits about 20% width of screen, properly fitted
      height, and then the other cards are to it's right."

      The previous shape gave the plate the full content width at 16:9, which at
      a desktop width is a 1300x200 letterbox -- a slot, not a picture. A 4:3
      plate in a one-fifth column is roughly 260x195, which is a shape the art
      was actually composed for, and it leaves four fifths for the cast.

      The caption moved OUT of the plate. Scrim-over-art works at 1300px wide
      and not at 260px, where a title plus a hook covers the picture entirely.
    -->
    <NuxtLink
      :to="showcaseHref(hero.dream)"
      class="group flex shrink-0 flex-col gap-1 rounded-xl border-2 border-primary/70 bg-base-100 p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 lg:h-full lg:w-[clamp(14rem,20vw,26rem)] xl:w-[clamp(18rem,26vw,34rem)]"
    >
      <!--
        `h-full` inside a flexible box, so the PLATE fills whatever height the
        band has left after the text rather than setting the card's height from
        its own aspect ratio. An aspect-ratio only sizes a box while one
        dimension is auto; giving it a definite height makes the ratio inert and
        the image crops to fit. This is what lets the three columns of the band
        share one height instead of the tallest one winning.
      -->
      <div class="min-h-0 flex-1 overflow-hidden rounded-lg">
        <kr-art-plate
          class="h-full"
          :source="hero.dream.art"
          variant="hero"
          shape="wide"
          frame="none"
          :alt="hero.dream.title"
          :fallback="dreamFallback"
          eager
          hover-zoom
          fit="cover"
        />
      </div>

      <div class="min-w-0 shrink-0">
        <p
          class="text-[0.6rem] font-black uppercase tracking-[0.18em] text-primary"
        >
          {{ kicker }}
        </p>

        <h2
          class="text-sm font-black leading-tight text-base-content xl:text-base"
        >
          {{ hero.dream.title }}
        </h2>

        <!--
          THE DESCRIPTION, which was simply never rendered. Silas, 2026-08-29:
          "we want to add the descrition for the dream, that is missing."

          It is clamped rather than truncated server-side so the text reflows
          with the card instead of ending in a hard ellipsis at a fixed
          character count.

          It also REPLACED the one-line `hook` that used to sit above it. Both
          are summarized from the same source fields, so on most dreams they
          were the same sentence printed twice at two lengths -- and the
          duplicate line was 20px of the height the band is now trying to
          budget. `hook` is the fallback when there is no description.
        -->
        <p
          v-if="hero.description || hero.hook"
          class="mt-1 line-clamp-4 text-[0.7rem] leading-snug text-base-content/65 xl:line-clamp-6 xl:text-sm xl:leading-relaxed"
        >
          {{ hero.description || hero.hook }}
        </p>

        <span
          class="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-bold text-primary"
        >
          Open the dream
          <Icon
            name="kind-icon:chevron-right"
            class="size-3 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
          />
        </span>
      </div>
    </NuxtLink>

    <!--
      Container-width columns, not a wrapping flex row. Wrapping made the cast
      column roughly three times the plate's height, and since the panel sizes
      to its tallest child that left a large empty field under the plate --
      exactly the "gutters too large" complaint, in vertical form. Three columns
      of six chips is two rows, which is about the plate's own height, so the
      panel has no slack in it.

      `grid-cols-3` with no breakpoint prefix on purpose: the layout contract
      forbids a SHARED component from gating its column count on a viewport
      breakpoint (it can be embedded in a narrower host), and a static count is
      not that.

      ONE ROW OF FULL-HEIGHT CARDS THAT SCROLLS. Silas, 2026-08-30: "Then the
      cards, single row, scrollable horizontally depending on room in the
      middle."

      Each tile is as tall as the row (`h-full`) with a FIXED width. It used to
      derive its width from `aspect-2/3`, which made a handsome card and left no
      say over how much of it was text. Silas, 2026-09-01: "having a little more
      vertical space for larger text would be great on those, with some width
      cut back so we can fit the location entry." A fixed 11rem is narrower than
      the ~15rem the aspect produced -- enough to fit the newly-added location
      card on screen -- and the plate simply takes whatever height the caption
      does not, so widening the caption no longer fights the picture for room.

      So the cards fill the space (measured at 1920: 176px wide and 420px tall,
      not 72px thumbnails), the row is as tall as the dream card beside it by
      construction, and however many cast members a dream has, they scroll
      sideways instead of shrinking or wrapping.

      This replaces a three-row grid of 4.5rem tiles. That grid existed to solve
      two earlier problems -- tiles that would not stay small (`minmax(X,1fr)`
      stretches every track, so lowering the minimum did nothing), and a cast
      shorter than the card beside it. Both are answered better by sizing from
      the height: nothing can stretch a tile whose width comes from its aspect
      ratio, and a full-height row cannot be shorter than the row.

      NO VISIBLE SCROLLBAR, on the same argument home-rail.vue makes: a partial
      card at the right edge is the affordance, and eight shelves each reserving
      a scrollbar gutter was a complaint in its own right.
    -->
    <!--
      A REAL SCROLL CONTROL, because the row genuinely does not always fit.
      Silas, 2026-09-01: "it's reasonable that there will be a need to scroll on
      smaller displays, but if so, we need an actual scroll selector."

      Six full-height slots at 11rem come to more than the middle column has at
      1920, and narrower screens are worse. The track stays `.no-scrollbar` for
      the reason home-rail.vue gives -- a reserved scrollbar gutter is a row of
      nothing -- so the affordance is a pair of chevrons instead.

      They OVERLAY the ends of the row rather than sitting in a header, because
      unlike a rail this panel has no header row to put them in and adding one
      would cost the height the cards just gained. `v-show` keeps the buttons out
      of the tab order's way only when there is nothing to scroll.
    -->
    <div
      v-if="hero.cast.length"
      class="relative lg:h-full lg:min-w-0 lg:flex-1"
    >
      <div
        ref="castTrack"
        class="no-scrollbar flex h-full gap-1.5 overflow-x-auto scroll-smooth"
        @scroll.passive="measureCast"
      >
        <!--
        A cast member opens the interstitial rather than navigating away. Silas,
        2026-08-29: "Whenever I click on one of the new objects, I want it to
        expand to tell me about it ... with clicking outside the container
        returning to the homepage." The dream plate above still navigates,
        because its own caption says "Open the dream" and that is a promise
        worth keeping.

        It stays an anchor with a real destination and intercepts the plain
        click -- see the same note in home-rail.vue for why the <button> version
        of this was worse, and why it is a plain <a> rather than a NuxtLink.
      -->
        <a
          v-for="member in principals"
          :key="`${member.kind}-${member.id}`"
          :href="showcaseHref(member)"
          :data-theme="themeFor(member)"
          class="group flex h-full w-44 shrink-0 flex-col overflow-hidden rounded-lg border-2 border-primary/70 bg-base-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
          :title="
            member.subtitle
              ? `${member.title} — ${member.subtitle}`
              : member.title
          "
          @click="onCastClick($event, member)"
        >
          <kr-art-plate
            class="min-h-0 flex-1"
            :source="member.art"
            variant="card"
            shape="square"
            frame="none"
            :alt="member.title"
            :fallback="fallbackFor(member)"
            hover-zoom
            fit="cover"
          >
            <!--
            The kind rides on the plate rather than taking a line of its own
            beneath it. Two text lines per chip made the cast column taller than
            the plate beside it, which is where the panel's dead space came from.
          -->
            <template v-if="member.badge" #overlay>
              <!--
              text-base-content, not text-primary: each chip sits inside its
              record's own daisyUI theme, and several themes' primary is far too
              pale to read on base-100 (the "Facet" chip on a pastel tile
              vanished entirely). base-content is the one token daisyUI
              guarantees contrasts with base-100 in every theme. The colour
              variety still comes through in the tile itself.

              max-w + truncate because "CHARACTER" is wider than a 4rem tile.
            -->
              <span
                class="absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded bg-base-100/90 px-1 text-[0.45rem] font-black uppercase tracking-[0.08em] text-base-content backdrop-blur"
              >
                {{ member.badge }}
              </span>
            </template>
          </kr-art-plate>

          <!--
          THE CARD SAYS WHAT THE THING IS. Silas, 2026-09-01: "we should see
          description text on the character, item, skill, etc for the daily
          dream (facets is just the title)."

          The server sends `subtitle: null` for facets precisely so this needs no
          per-kind branch here -- a facet is a one-word tag on the dream rather
          than a character in it, and its flavour text read as filler beside a
          character's backstory. Everything else gets two clamped lines under
          its name.
        -->
          <!--
          The caption gets a definite share of the card rather than whatever is
          left after the picture. Silas, 2026-09-01: "having a little more
          vertical space for larger text". Two lines of name and three of
          description at a readable size; the plate above flexes into the rest,
          so this is the half of the card that sets the split.
        -->
          <div class="min-w-0 shrink-0 px-2 py-1.5">
            <p
              class="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary"
            >
              {{ member.title }}
            </p>
            <p
              v-if="member.subtitle"
              class="mt-0.5 line-clamp-3 text-xs leading-snug text-base-content/65"
            >
              {{ member.subtitle }}
            </p>
          </div>
        </a>

        <!--
        THE FACETS SHARE ONE CARD'S SLOT, as a 2x2 of picture-and-title. Silas,
        2026-09-01: "since facets are just images ... we should have a 2x2 grid
        with image and title in the space the other cards have image, title, and
        description."

        Same width as a cast card (w-44) so the row keeps its rhythm, and each
        cell is still a link that opens the interstitial. A facet is a one-word
        tag on the dream rather than a character in it, which is why it gets a
        quarter of a card while a character gets a whole one.
      -->
        <div v-if="facets.length" class="flex h-full w-44 shrink-0 flex-col">
          <div class="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1">
            <a
              v-for="facet in facets.slice(0, 4)"
              :key="`facet-${facet.id}`"
              :href="showcaseHref(facet)"
              :data-theme="themeFor(facet)"
              class="group/facet flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border-2 border-primary/60 bg-base-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              :title="facet.title"
              @click="onCastClick($event, facet)"
            >
              <kr-art-plate
                class="min-h-0 flex-1"
                :source="facet.art"
                variant="card"
                shape="square"
                frame="none"
                :alt="facet.title"
                :fallback="fallbackFor(facet)"
                fit="cover"
              />
              <p
                class="shrink-0 truncate px-1 py-0.5 text-[0.6rem] font-bold leading-tight group-hover/facet:text-primary"
              >
                {{ facet.title }}
              </p>
            </a>
          </div>
        </div>
      </div>

      <button
        v-show="castCanScroll"
        type="button"
        class="absolute left-0 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-base-300 bg-base-100/90 text-base-content/60 shadow backdrop-blur transition-colors hover:text-primary disabled:opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        :disabled="castAtStart"
        aria-label="Scroll the cast backwards"
        @click="scrollCast(-1)"
      >
        <Icon name="kind-icon:chevron-left" class="size-4" />
      </button>
      <button
        v-show="castCanScroll"
        type="button"
        class="absolute right-0 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-base-300 bg-base-100/90 text-base-content/60 shadow backdrop-blur transition-colors hover:text-primary disabled:opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        :disabled="castAtEnd"
        aria-label="Scroll the cast forwards"
        @click="scrollCast(1)"
      >
        <Icon name="kind-icon:chevron-right" class="size-4" />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  showcaseHref,
  type ShowcaseCard,
  type ShowcaseHero,
} from '@/utils/homeShowcase'
import { defaultArtFor } from '@/utils/defaultArtPool'
import { resolveEntityTheme } from '@/utils/entityTheme'

const props = defineProps<{ hero: ShowcaseHero }>()

/*
 * THE CAST IS TWO KINDS OF THING, and only one of them is a character.
 *
 * A daily dream's cast runs to nine: a location, a character, an item, a skill,
 * a scenario -- and four FACETS, which are one-word tags on the dream ("Noir",
 * "Hacker"). Nine full cards do not fit the middle column at a readable size:
 * measured at 1920 only 5.1 of nine were on screen, so Silas saw a sixth card
 * clipped ("I can tell that there is a sixth entry cut off").
 *
 * Shrinking every card until nine fit would undo the larger text he asked for
 * in the same breath. So the split follows what he already said about facets --
 * "(facets is just the title)" -- and gives the five real cast members the cards
 * while the four facets share ONE card's slot as a 2x2 of picture-and-title.
 * Nothing is hidden; the thing that gave up room is the thing that was only
 * ever a word.
 *
 * SIX SLOTS STILL DO NOT ALL FIT (six x 182px against a ~933px middle at 1920),
 * and that is fine now: "it's reasonable that there will be a need to scroll on
 * smaller displays, but if so, we need an actual scroll selector." The row has
 * chevrons.
 */
const principals = computed(() =>
  props.hero.cast.filter((member) => member.kind !== 'facet'),
)

const facets = computed(() =>
  props.hero.cast.filter((member) => member.kind === 'facet'),
)
const emit = defineEmits<{ select: [card: ShowcaseCard] }>()

/*
 * Dated while the date still means something, plain otherwise. A hero that is
 * three weeks old because the queue was backed up should not be labelled as
 * though it were today's.
 */
const kicker = computed(() => {
  const created = new Date(props.hero.dream.createdAt)
  if (Number.isNaN(created.getTime())) return 'From the dream cycle'

  const ageDays = (Date.now() - created.getTime()) / 86_400_000
  if (ageDays > 3) return 'From the dream cycle'

  return `Dream of ${created.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  })}`
})

const dreamFallback = computed(() =>
  defaultArtFor(`dream-${props.hero.dream.id}`),
)

/** See home-rail.vue's onTileClick: same rule, same reasons. */
function onCastClick(event: MouseEvent, member: ShowcaseCard): void {
  if (event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

  event.preventDefault()
  emit('select', member)
}

function fallbackFor(member: ShowcaseCard): string {
  return defaultArtFor(`${member.kind}-${member.id}`)
}

function themeFor(member: ShowcaseCard): string {
  return resolveEntityTheme({ id: member.id, theme: member.theme })
}

/*
 * The cast row's chevrons, same mechanism as home-rail.vue's -- deliberately a
 * copy of about twenty lines rather than a shared composable, because the two
 * differ in every respect that matters (a rail puts its buttons in a header it
 * already has; this overlays them on a track that has none) and the shared part
 * is three DOM measurements.
 */
const castTrack = ref<HTMLElement | null>(null)
const castCanScroll = ref(false)
const castAtStart = ref(true)
const castAtEnd = ref(false)

/** The 2px slack absorbs sub-pixel rounding; see the same note in home-rail. */
function measureCast(): void {
  const element = castTrack.value
  if (!element) return

  const max = element.scrollWidth - element.clientWidth
  castCanScroll.value = max > 2
  castAtStart.value = element.scrollLeft <= 2
  castAtEnd.value = element.scrollLeft >= max - 2
}

/** One press moves about a screenful, keeping a card of context. */
function scrollCast(direction: 1 | -1): void {
  const element = castTrack.value
  if (!element) return

  element.scrollBy({
    left: direction * Math.max(element.clientWidth * 0.8, 176),
    behavior: 'smooth',
  })
}

let castObserver: ResizeObserver | null = null

onMounted(() => {
  measureCast()
  if (typeof ResizeObserver === 'undefined') return

  // The row's width is set by the page band, not by its contents, so a content
  // watcher alone leaves stale chevrons after a resize.
  castObserver = new ResizeObserver(() => measureCast())
  if (castTrack.value) castObserver.observe(castTrack.value)
})

onBeforeUnmount(() => {
  castObserver?.disconnect()
  castObserver = null
})

watch(
  () => props.hero.cast.length,
  () => {
    void nextTick(measureCast)
  },
)
</script>

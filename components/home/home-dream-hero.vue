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
    `lg:justify-between` because the two numbers Silas gave under-specify the
    row. A dream card at 20% of the screen plus a cast of 4.5rem tiles plus a
    Needs-you column at a third comes to about 65% of the band -- something has
    to absorb the other 35%, and the three candidates are the card (which
    becomes a 4:1 letterbox, "a slot, not a picture"), the tiles (the thing he
    asked to shrink), or whitespace. Whitespace wins, but only if it sits
    BETWEEN the two content groups rather than trailing after them: the card
    holds the left edge, the cast sits against the Needs-you column, and the gap
    reads as deliberate rather than as a hole where something failed to load.
  -->
  <section
    class="flex flex-col gap-2 kr-panel-flat p-3 lg:flex-row lg:justify-between"
  >
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
      class="group flex shrink-0 flex-col gap-1 rounded-xl border-2 border-primary/70 bg-base-100 p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 lg:h-full lg:w-[clamp(14rem,20vw,26rem)]"
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

        <h2 class="text-sm font-black leading-tight text-base-content">
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
          class="mt-1 line-clamp-3 text-[0.7rem] leading-snug text-base-content/65"
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

      FIXED TRACKS, and this is the fix for a change that did nothing. Silas,
      2026-08-29: "the other elements on the daily dream can be 50% slimmer, to
      make room for a better human gate needs you section." The first attempt
      lowered the minimum in `minmax(min(100%,7rem),1fr)` to 4.5rem and changed
      NOTHING, because the `1fr` maximum stretches every track to fill the
      container: with eight cast members in a wide row each tile was
      container/8, measured at 157px, whatever the minimum said. Silas, next
      pass: "I'm wondering if anything actually got done." Fair.

      `auto-cols-[4.5rem]` is a fixed track size with no `1fr` to stretch it, so
      a tile is 72px and stays 72px. That is the "50% slimmer" actually applied
      -- and it is what frees the width the Needs-you column now takes, because
      this panel no longer stretches to fill the row (see home-page.vue).

      THREE ROWS, flowing sideways, for the height. One row of small tiles left
      ~150px of dead space under the cast while the dream card set the band
      height -- Silas: "still a discrepancy betwen hero dream height and the
      rest." `grid-rows-3` with `auto-rows-fr` and `h-full` makes the rows share
      the band height exactly, so the cast is as tall as the card beside it by
      construction rather than by luck. At 4.5rem wide and a third of the band
      tall, a tile lands near 2:3 -- the portrait card shape these objects are
      drawn at anyway.
    -->
    <div
      v-if="hero.cast.length"
      class="no-scrollbar grid grid-flow-col grid-rows-3 auto-cols-[4.5rem] auto-rows-fr gap-1 overflow-x-auto lg:h-full lg:shrink-0"
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
        v-for="member in hero.cast"
        :key="`${member.kind}-${member.id}`"
        :href="showcaseHref(member)"
        :data-theme="themeFor(member)"
        class="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border-2 border-primary/70 bg-base-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
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

        <div class="min-w-0 shrink-0 px-1 py-0.5">
          <p
            class="truncate text-[0.65rem] font-bold leading-tight group-hover:text-primary"
          >
            {{ member.title }}
          </p>
        </div>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  showcaseHref,
  type ShowcaseCard,
  type ShowcaseHero,
} from '@/utils/homeShowcase'
import { defaultArtFor } from '@/utils/defaultArtPool'
import { resolveEntityTheme } from '@/utils/entityTheme'

const props = defineProps<{ hero: ShowcaseHero }>()
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
</script>

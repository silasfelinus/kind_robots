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
  <section class="flex flex-col gap-2 kr-panel-flat p-3 lg:flex-row">
    <!--
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
      class="group flex shrink-0 flex-col gap-1 rounded-xl border-2 border-primary/70 bg-base-100 p-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 lg:w-1/5"
    >
      <kr-art-plate
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

      <div class="min-w-0">
        <p
          class="text-[0.6rem] font-black uppercase tracking-[0.18em] text-primary"
        >
          {{ kicker }}
        </p>

        <h2 class="text-sm font-black leading-tight text-base-content">
          {{ hero.dream.title }}
        </h2>

        <p
          v-if="hero.hook"
          class="mt-0.5 line-clamp-2 text-[0.7rem] leading-snug text-base-content/65"
        >
          {{ hero.hook }}
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
    -->
    <div
      v-if="hero.cast.length"
      class="grid content-start gap-1.5 grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] lg:min-w-0 lg:flex-1"
    >
      <NuxtLink
        v-for="member in hero.cast"
        :key="`${member.kind}-${member.id}`"
        :to="showcaseHref(member)"
        :data-theme="themeFor(member)"
        class="group flex min-w-0 flex-col overflow-hidden rounded-lg border-2 border-primary/70 bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        :title="
          member.subtitle
            ? `${member.title} — ${member.subtitle}`
            : member.title
        "
      >
        <kr-art-plate
          :source="member.art"
          variant="card"
          shape="card"
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

        <div class="min-w-0 px-1 py-0.5">
          <p
            class="truncate text-xs font-bold leading-tight group-hover:text-primary"
          >
            {{ member.title }}
          </p>
        </div>
      </NuxtLink>
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

function fallbackFor(member: ShowcaseCard): string {
  return defaultArtFor(`${member.kind}-${member.id}`)
}

function themeFor(member: ShowcaseCard): string {
  return resolveEntityTheme({ id: member.id, theme: member.theme })
}
</script>

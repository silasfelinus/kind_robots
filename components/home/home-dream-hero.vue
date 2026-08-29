<!-- /components/home/home-dream-hero.vue -->
<!--
  The marquee: the most recent dream whose art is actually finished, with the
  cast the dream cycle built around it docked along the bottom.

  WHY "MOST RECENT WITH ART" AND NOT "TODAY'S". Silas, 2026-08-28: "I want the
  dream, but there is a problem, it isn't always ready with art. So instead of
  Today's dream, it needs to be the most recent dream that has full art." The
  render queue runs days behind the authoring (conductor RENDER-BACKLOG.md), so
  the newest dream is routinely a title with an empty plate. The choosing
  happens server-side in /api/showcase/home — this component renders whatever it
  was handed and never has to reason about readiness.

  STAGING, not decoration. Design brief: "One thing holds the light at a time."
  The plate is the light; the words sit in a scrim over its foot at a 65ch
  measure; the cast is a quiet row beneath, small enough to read as supporting
  players. Everything in here is a link — the plate to the dream, each cast
  chip to its own object.
-->
<template>
  <section class="flex flex-col gap-3">
    <NuxtLink
      :to="showcaseHref(hero.dream)"
      class="group relative block h-64 overflow-hidden rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:h-80 lg:h-[26rem]"
    >
      <!--
        FIXED HEIGHT, not the plate's own 16:9. At a desktop content width the
        aspect box came out ~750px tall, which filled the viewport on its own --
        the hero held all the light and nothing else was even hinted at, so the
        page looked like a single picture rather than a way in. The rails have
        to peek. The plate keeps object-cover, so capping the height crops the
        frame rather than squashing it.
      -->
      <kr-art-plate
        class="h-full"
        :source="hero.dream.art"
        variant="hero"
        shape="hero"
        frame="none"
        :alt="hero.dream.title"
        :fallback="dreamFallback"
        eager
        hover-zoom
        fit="cover"
      />

      <!--
        The caption block is a sibling of the plate rather than its `caption`
        slot: the slot's scrim is sized for a one-line figcaption, and this
        needs room for a kicker, a title, a hook and a call to action without
        the gradient stopping halfway up the text.
      -->
      <div
        class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-20 sm:px-6 sm:pb-6"
      >
        <p
          class="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/70"
        >
          {{ kicker }}
        </p>

        <h2
          class="mt-1 text-2xl font-black leading-tight text-white sm:text-4xl"
        >
          {{ hero.dream.title }}
        </h2>

        <p
          v-if="hero.hook"
          class="kr-prose mt-2 text-sm text-white/85 sm:text-base"
        >
          {{ hero.hook }}
        </p>

        <span
          class="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-white/90 group-hover:text-white"
        >
          Open the dream
          <Icon
            name="kind-icon:chevron-right"
            class="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
          />
        </span>
      </div>
    </NuxtLink>

    <!--
      The cast strip. Horizontal scroll (never overflow-y — vertical scroll
      ownership stays with the page host), and every chip is its own link, so
      the hero is a hub into five objects rather than one picture.
    -->
    <div
      v-if="hero.cast.length"
      class="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
    >
      <NuxtLink
        v-for="member in hero.cast"
        :key="`${member.kind}-${member.id}`"
        :to="showcaseHref(member)"
        class="group flex w-32 shrink-0 snap-start flex-col gap-1 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        :title="
          member.subtitle
            ? `${member.title} — ${member.subtitle}`
            : member.title
        "
      >
        <kr-art-plate
          :source="member.art"
          variant="card"
          shape="square"
          frame="thin"
          :alt="member.title"
          :fallback="fallbackFor(member)"
          hover-zoom
          fit="cover"
        />

        <div class="min-w-0">
          <p
            v-if="member.badge"
            class="truncate text-[0.6rem] font-black uppercase tracking-[0.14em] text-primary"
          >
            {{ member.badge }}
          </p>
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

const props = defineProps<{ hero: ShowcaseHero }>()

/*
 * Dated when the dream is recent enough for the date to mean something, plain
 * otherwise. A hero that is three weeks old because the queue was backed up
 * should not be labelled with a stale date as though it were today's — the
 * kicker says what it is, and the date only appears while it is still news.
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
</script>

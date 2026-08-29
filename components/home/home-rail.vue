<!-- /components/home/home-rail.vue -->
<!--
  One shelf on the home page: a label, a destination, and a row of plates that
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
  <section class="flex min-w-0 flex-col gap-1 kr-panel-flat p-2">
    <header class="flex flex-wrap items-baseline justify-between gap-x-3">
      <h2
        class="text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary"
      >
        {{ label }}
      </h2>

      <NuxtLink
        :to="seeAllHref"
        class="link link-hover text-[0.7rem] font-bold text-base-content/50 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {{ seeAllLabel }} →
      </NuxtLink>
    </header>

    <!--
      No negative margin. The old `-mx-1 px-1` pulled the track outside its
      container to keep focus rings from clipping; inside a panel that just
      pushed the first tile under the panel's own edge. The ring is handled with
      `outline-offset-0` on the tiles instead, which needs no bleed.
    -->
    <div class="flex gap-2 overflow-x-auto pb-1">
      <NuxtLink
        v-for="item in items"
        :key="`${item.kind}-${item.id}`"
        :to="showcaseHref(item)"
        :data-theme="themeFor(item)"
        class="group flex shrink-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-0.5"
        :class="cardWidthClass"
        :title="item.subtitle ? `${item.title} — ${item.subtitle}` : item.title"
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
          fit="cover"
        />

        <!--
          Title only. The subtitle used to sit under it, but at a 5rem tile it
          truncated to "a short line of co…" on every card -- a line of height
          per rail spent on nothing. It survives as the link's tooltip.
        -->
        <div class="min-w-0 px-1.5 py-1">
          <p
            class="truncate text-[0.7rem] font-bold leading-tight text-base-content group-hover:text-primary"
          >
            {{ item.title }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { showcaseHref, type ShowcaseCard } from '@/utils/homeShowcase'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'
import { defaultArtFor } from '@/utils/defaultArtPool'
import { resolveEntityTheme } from '@/utils/entityTheme'

const props = withDefaults(
  defineProps<{
    label: string
    items: ShowcaseCard[]
    seeAllHref: string
    seeAllLabel?: string
    /** 'card' is the 2:3 portrait shelf; 'wide' is the 4:3 art shelf. */
    shape?: ArtPlateShape
    plateVariant?: ArtVariant
    placeholderIcon?: string
  }>(),
  {
    seeAllLabel: 'see all',
    shape: 'card',
    plateVariant: 'card',
    placeholderIcon: 'kind-icon:image',
  },
)

/*
 * Fixed tile widths, not a responsive column count: a rail's job is to leave a
 * partial tile at the right edge so the row reads as continuing. Deliberately
 * NOT `grid-cols-*` at a breakpoint -- this is a shared component and the
 * layout contract's viewport-grid rule exists because such a component gets
 * embedded in hosts narrower than the viewport implies. These rails now sit in
 * a multi-column grid, which is exactly that case.
 */
const cardWidthClass = computed(() =>
  props.shape === 'wide' || props.shape === 'hero' ? 'w-32' : 'w-24',
)

function fallbackFor(item: ShowcaseCard): string {
  return defaultArtFor(`${item.kind}-${item.id}`)
}

function themeFor(item: ShowcaseCard): string {
  return resolveEntityTheme({ id: item.id, theme: item.theme })
}
</script>

<!-- /components/home/home-rail.vue -->
<!--
  One shelf on the home page: a label, a destination, and a row of plates that
  scrolls sideways.

  Silas, 2026-08-28: "These displays should always lead to something, not just
  static displays of images and text." So every tile here is an <a>, not a
  <figure> — the whole card is the hit target, and `showcaseHref` (one function,
  in utils/homeShowcase.ts) is the only thing that decides where it goes.

  WHY SIDEWAYS AND NOT A GRID. A grid of six kinds stacked vertically is a very
  long page that buries the last kind; a rail keeps each kind to one screen
  line, so "everything we build" is legible in a couple of scrolls. The rail
  scrolls with overflow-x-auto, which the layout contract's one-scroll rule
  deliberately does not count (it counts overflow-y-auto / overflow-auto) —
  vertical scroll ownership still belongs entirely to the page host.

  The arrow buttons are progressive enhancement, not the mechanism: touch and
  trackpad users just swipe, keyboard users tab through the links themselves
  and the browser scrolls the focused card into view. They are hidden until
  there is actually somewhere to scroll to.
-->
<template>
  <section class="flex flex-col gap-2">
    <header
      class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
    >
      <!--
        No icon beside the label. The kind-icon set is full-colour by design,
        and a row of unrelated coloured glyphs down the left edge of the page
        fought the terracotta small-caps rather than supporting it (several
        rendered as flat coloured squares at 16px). The label alone is the
        Storybook signature; the icons still do real work inside the plates,
        where an artless card needs something to show.
      -->
      <h2 class="text-xs font-black uppercase tracking-[0.18em] text-primary">
        {{ label }}
      </h2>

      <div class="flex items-center gap-1">
        <NuxtLink
          :to="seeAllHref"
          class="link link-hover text-xs font-bold text-base-content/60 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {{ seeAllLabel }} →
        </NuxtLink>

        <span class="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square"
            :disabled="!canScrollBack"
            :aria-label="`Scroll ${label} backwards`"
            @click="scrollBy(-1)"
          >
            <Icon name="kind-icon:chevron-left" class="size-4" />
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-square"
            :disabled="!canScrollForward"
            :aria-label="`Scroll ${label} forwards`"
            @click="scrollBy(1)"
          >
            <Icon name="kind-icon:chevron-right" class="size-4" />
          </button>
        </span>
      </div>
    </header>

    <p v-if="blurb" class="text-xs text-base-content/50">{{ blurb }}</p>

    <!--
      `-mx-1 px-1` so a focused card's outline ring isn't clipped by the
      scroll container's own edge, and `pb-2` leaves room for the hover lift.
    -->
    <div
      ref="track"
      class="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2"
      @scroll.passive="syncScrollState"
    >
      <NuxtLink
        v-for="item in items"
        :key="`${item.kind}-${item.id}`"
        :to="showcaseHref(item)"
        class="group flex shrink-0 snap-start flex-col gap-1.5 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1"
        :class="cardWidthClass"
        :title="item.subtitle ? `${item.title} — ${item.subtitle}` : item.title"
      >
        <kr-art-plate
          :source="item.art"
          :variant="plateVariant"
          :shape="shape"
          :alt="item.title"
          :fallback="fallbackFor(item)"
          :placeholder-icon="placeholderIcon"
          hover-zoom
          fit="cover"
        >
          <template v-if="item.badge" #overlay>
            <span
              class="absolute left-2 top-2 badge badge-xs border-none bg-base-100/85 font-bold text-base-content backdrop-blur"
            >
              {{ item.badge }}
            </span>
          </template>
        </kr-art-plate>

        <div class="min-w-0 px-0.5">
          <p
            class="truncate text-sm font-bold leading-tight text-base-content group-hover:text-primary"
          >
            {{ item.title }}
          </p>
          <p
            v-if="item.subtitle"
            class="truncate text-xs leading-tight text-base-content/55"
          >
            {{ item.subtitle }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { showcaseHref, type ShowcaseCard } from '@/utils/homeShowcase'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'
import { defaultArtFor } from '@/utils/defaultArtPool'

const props = withDefaults(
  defineProps<{
    label: string
    items: ShowcaseCard[]
    seeAllHref: string
    seeAllLabel?: string
    blurb?: string
    /** 'card' is the 2:3 portrait shelf; 'wide' is the 4:3 art shelf. */
    shape?: ArtPlateShape
    plateVariant?: ArtVariant
    placeholderIcon?: string
  }>(),
  {
    seeAllLabel: 'see all',
    blurb: '',
    shape: 'card',
    plateVariant: 'card',
    placeholderIcon: 'kind-icon:image',
  },
)

/*
 * Fixed tile widths, not a responsive column count: a rail's job is to show a
 * partial card at the right edge so the row reads as continuing. Deliberately
 * NOT `grid-cols-*` at a breakpoint — this is a shared component and the
 * layout contract's viewport-grid rule exists precisely because such a
 * component can be embedded in a host narrower than the viewport implies.
 */
const cardWidthClass = computed(() =>
  props.shape === 'wide' || props.shape === 'hero'
    ? 'w-52 sm:w-64'
    : 'w-36 sm:w-40',
)

const track = ref<HTMLElement | null>(null)
const canScrollBack = ref(false)
const canScrollForward = ref(false)

function syncScrollState(): void {
  const element = track.value
  if (!element) return

  const max = element.scrollWidth - element.clientWidth
  canScrollBack.value = element.scrollLeft > 4
  canScrollForward.value = element.scrollLeft < max - 4
}

function scrollBy(direction: 1 | -1): void {
  const element = track.value
  if (!element) return

  // A bit less than a full pane, so one card stays on screen as an anchor.
  element.scrollBy({
    left: direction * element.clientWidth * 0.8,
    behavior: 'smooth',
  })
}

function fallbackFor(item: ShowcaseCard): string {
  return defaultArtFor(`${item.kind}-${item.id}`)
}

let observer: ResizeObserver | null = null

onMounted(() => {
  syncScrollState()

  if (typeof ResizeObserver !== 'undefined' && track.value) {
    observer = new ResizeObserver(syncScrollState)
    observer.observe(track.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

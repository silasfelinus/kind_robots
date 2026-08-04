<!-- /components/gallery/kr-entity-card-body.vue -->
<!--
  The inside of an object card.

  Silas, 2026-08-02: "the custom cards are a big aspect to the ui refactor,
  while they all do have custom fields, a lot of the customization is the same
  stuff with variations for the schema objects. the final version obviously is
  wanting a single display that is consistent across galleries, all with those
  bells and whistles."

  The bells and whistles were already shared -- fourteen cards wrap
  wonderlab/reactable-card.vue, which owns the <article>, the selected border,
  the karma badge, the reaction button and the review panel. What stayed
  copy-pasted was the BODY inside it, and it is the same body five times over:

      art plate, with badges over one corner and the title in a scrim
      a no-art fallback carrying the same title and chips
      a description block
      a row of meta chips
      then whatever that object alone needs

  scenario-card.vue:81's scrim class string was character-for-character
  identical to kr-art-plate.vue:41, and both scenario-card and character-card
  already imported resolveArtVariantSrc and then hand-rolled the frame around
  it anyway.

  So this is the body, parameterised. Everything genuinely per-object -- a bot's
  personality panel, a reward's stat block, a scenario's inspirations -- goes in
  the default slot, below. What the objects share is settled here so it stops
  drifting apart one card at a time.

  TWO CONVERGENCE DECISIONS worth naming, because they change how a card looks
  rather than just where its markup lives:

  1. Badges all sit top-LEFT. scenario-card used to split them, "Yours" left and
     "Mature" right -- but reactable-card puts the actions row and the karma
     badge top-right, so anything else there is one prop away from colliding
     with them. Left is the only corner a card body actually owns.
  2. The selected check sits below that actions row (top-9, not top-2) for the
     same reason.
-->
<template>
  <!--
    ICON is a text-forward ROW, not a small card.

    Silas, 2026-08-04: "Icons should be simple text focused displays with an
    icon as the visual layer." Rendering icon through the column layout below
    gave a cramped little art box with a caption over it — the "cramped
    displays" complaint. Here the square art is a fixed-size intro piece on the
    left and the text is the content, so the row stays readable at any width
    and the icons grid can pack tightly without squeezing anything.
  -->
  <div
    v-if="variant === 'icon'"
    class="flex w-full items-center gap-3 px-1 py-1.5"
  >
    <kr-art-plate
      v-if="showImage"
      :source="source"
      :variant="variant"
      :fallback="fallback"
      :alt="title"
      shape="square"
      frame="none"
      :fit="fit"
      :placeholder-icon="placeholderIcon"
      class="size-12 shrink-0 overflow-hidden rounded-xl"
    />

    <div class="min-w-0 flex-1">
      <h2 class="truncate text-sm font-black leading-tight" :title="title">
        {{ title }}
      </h2>

      <p v-if="subtitle" class="truncate text-xs text-base-content/60">
        {{ subtitle }}
      </p>

      <div v-if="badges.length" class="mt-1 flex flex-wrap gap-1">
        <span
          v-for="badge in badges"
          :key="badge.label"
          class="badge badge-xs"
          :class="badge.class || 'badge-primary'"
        >
          {{ badge.label }}
        </span>
      </div>
    </div>
  </div>

  <div v-else class="flex w-full flex-col">
    <kr-art-plate
      v-if="showImage"
      :source="source"
      :variant="variant"
      :fallback="fallback"
      :alt="title"
      :shape="resolvedShape"
      frame="none"
      :fit="fit"
      hover-zoom
      :placeholder-icon="placeholderIcon"
      class="rounded-xl"
    >
      <template #caption>
        <h2
          :class="[
            'font-black leading-tight text-white drop-shadow',
            compact ? 'line-clamp-1 text-base' : 'line-clamp-2 text-lg',
          ]"
          :title="title"
        >
          {{ title }}
        </h2>

        <p
          v-if="subtitle"
          class="mt-0.5 line-clamp-1 text-xs font-medium text-white/75"
        >
          {{ subtitle }}
        </p>
      </template>

      <template #overlay>
        <div
          v-if="badges.length"
          class="absolute left-2 top-2 flex flex-wrap gap-1"
        >
          <span
            v-for="badge in badges"
            :key="badge.label"
            class="badge badge-sm rounded-xl shadow"
            :class="badge.class || 'badge-primary'"
          >
            {{ badge.label }}
          </span>
        </div>

        <!-- top-9, clearing reactable-card's actions row. See the note above. -->
        <div
          v-if="selected"
          class="absolute right-2 top-9 rounded-full bg-primary p-1.5 text-primary-content shadow-lg"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" aria-hidden="true" />
        </div>
      </template>
    </kr-art-plate>

    <!-- No art: the same title and chips, without the frame. Cards used to
         repeat these two branches in full; the difference between them is
         genuinely just the scrim and the aspect box. -->
    <div v-else class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h2
          class="line-clamp-2 text-base font-black leading-tight text-base-content"
          :title="title"
        >
          {{ title }}
        </h2>

        <p
          v-if="subtitle"
          class="mt-0.5 line-clamp-1 text-xs font-medium text-base-content/60"
        >
          {{ subtitle }}
        </p>

        <div v-if="badges.length" class="mt-1.5 flex flex-wrap gap-1">
          <span
            v-for="badge in badges"
            :key="badge.label"
            class="badge badge-sm"
            :class="badge.class || 'badge-primary'"
          >
            {{ badge.label }}
          </span>
        </div>
      </div>

      <Icon
        v-if="selected"
        name="kind-icon:check"
        class="h-5 w-5 shrink-0 text-primary"
        aria-hidden="true"
      />
    </div>

    <div v-if="showDescription && !compact" class="px-0.5 pt-2.5">
      <p class="line-clamp-3 text-sm leading-relaxed text-base-content/70">
        {{ description || descriptionFallback }}
      </p>
    </div>

    <div v-if="meta.length" class="flex flex-wrap gap-1.5 px-0.5 pt-2">
      <span
        v-for="chip in meta"
        :key="chip.label"
        class="badge badge-sm max-w-full truncate"
        :class="chip.class || 'badge-ghost'"
        :title="chip.title || chip.label"
      >
        <Icon v-if="chip.icon" :name="chip.icon" class="mr-1 h-3 w-3" />
        {{ chip.label }}
      </span>
    </div>

    <!-- Whatever this object alone needs. -->
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { ArtImageSrcLike, ArtVariant } from '@/utils/artImageSrc'
import { VARIANT_SHAPE, type ArtPlateShape } from '@/utils/galleryVocabulary'

export type EntityCardChip = {
  label: string
  /** daisyUI badge modifier(s). Falls back to a sensible default per row. */
  class?: string
  icon?: string
  title?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    description?: string
    descriptionFallback?: string
    /** Any record carrying imagePath / cardPath / heroPath / iconPath. */
    source?: ArtImageSrcLike
    variant?: ArtVariant
    /** Used when the source resolves to nothing at all. */
    fallback?: string
    showImage?: boolean
    showDescription?: boolean
    compact?: boolean
    selected?: boolean
    /** Corner badges over the art (state: Yours, Mature, Public, Building...). */
    badges?: EntityCardChip[]
    /** Chips below the art, on the card surface. */
    meta?: EntityCardChip[]
    shape?: ArtPlateShape
    compactShape?: ArtPlateShape
    /** 'contain' for portrait art whose edges matter (Characters). */
    fit?: 'cover' | 'contain'
    placeholderIcon?: string
  }>(),
  {
    subtitle: '',
    description: '',
    descriptionFallback: 'No description yet.',
    source: null,
    variant: 'card',
    fallback: '',
    showImage: true,
    showDescription: true,
    compact: false,
    selected: false,
    badges: () => [],
    meta: () => [],
    shape: undefined,
    compactShape: undefined,
    fit: 'cover',
    placeholderIcon: 'kind-icon:image',
  },
)

/**
 * The box the art is drawn in, DERIVED from the variant unless a caller
 * overrides it.
 *
 * This used to default to `wide` (4:3 horizontal) for every variant, so
 * choosing Cards loaded the vertical card art and then letterboxed it in a
 * horizontal frame -- Silas, 2026-08-04: "Card and icon are wack, yo. Small
 * images, terrible layout, cramped displays." Hero looked fine only because
 * 4:3 is near enough to 16:9 to hide the mistake.
 *
 * Deriving is the point. `variant` and `shape` were two hand-passed props with
 * nothing tying them together, which is two chances to disagree on every call
 * site. VARIANT_SHAPE is the single answer; `shape` remains available for the
 * surfaces that genuinely want a hero image in a card-shaped plate.
 */
const resolvedShape = computed<ArtPlateShape>(() => {
  if (props.compact && props.compactShape) return props.compactShape
  if (props.shape) return props.shape
  return VARIANT_SHAPE[props.variant] ?? 'square'
})
</script>

<!-- /components/narrative/kr-art-plate.vue -->
<!--
  The framed image plate — "a plate tipped into warm paper", the gesture the
  whole Storybook aesthetic is named for.

  Extracted because five interact surfaces each hand-rolled an <img> with their
  own aspect box, their own gradient scrim and their own fallback chain. The
  fallback chain in particular is worth centralising: cardPath/heroPath/iconPath
  shipped in t-007 and sat invisible for a day precisely because each surface
  had its own idea of which field to read.

  Uses resolveArtVariantSrc (utils/artImageSrc.ts) rather than re-implementing
  that chain. Pass an entity (Bot, Character, Reward, Scenario, Dream…) and the
  variant you want; it degrades variant path -> variant base64 -> full-size ->
  fallback, so a slot the render queue has not reached yet still shows something.
-->
<template>
  <figure
    :class="['relative overflow-hidden bg-base-300', frameClass, aspectClass]"
  >
    <kr-deferred-image
      v-if="src"
      :src="src"
      :alt="alt"
      :class="[
        'h-full w-full',
        fit === 'contain' ? 'object-contain' : 'object-cover',
        hoverZoom
          ? 'transition-transform duration-300 group-hover:scale-105'
          : '',
      ]"
      :eager="eager"
      :style="objectPosition ? { objectPosition } : undefined"
      @error="onError"
    />

    <div
      v-else
      class="flex h-full w-full items-center justify-center text-base-content/40"
    >
      <Icon :name="placeholderIcon" class="size-8" aria-hidden="true" />
    </div>

    <!-- Scrim only when there is a caption to keep legible. An unconditional
         gradient dims art that has nothing sitting on top of it. -->
    <div
      v-if="$slots.caption"
      class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-3 pb-3 pt-12"
    >
      <figcaption>
        <slot name="caption" />
      </figcaption>
    </div>

    <slot name="overlay" />
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ART_VARIANT_FOCUS,
  resolveArtVariantSource,
  type ArtVariant,
  type ArtImageSrcLike,
} from '@/utils/artImageSrc'
import type { ArtPlateShape } from '@/utils/galleryVocabulary'

const props = withDefaults(
  defineProps<{
    /** Any record carrying imagePath / cardPath / heroPath / iconPath. */
    source?: ArtImageSrcLike
    variant?: ArtVariant
    /** Used when the source resolves to nothing at all. */
    fallback?: string
    alt?: string
    /**
     * The aspect the frame is drawn at. Distinct from `variant`, which picks
     * WHICH stored image to load (cardPath / heroPath / iconPath) — shape only
     * decides the box it goes in, so a hero image can sit in a card-shaped
     * plate. card is 2:3 portrait, hero 16:9, wide 4:3, plate the 3:2 mockup
     * shape.
     */
    shape?: ArtPlateShape
    compact?: boolean
    /**
     * 'plate' is the white tipped-photo border the aesthetic is named for.
     * 'thin' is a plain hairline for inline thumbnails.
     * 'none' draws no border and no rounding, for a caller that already owns
     * the frame — an inner radius inside an outer one leaves visible notches,
     * so "unframed" has to mean genuinely unframed, not thinly framed.
     */
    frame?: 'plate' | 'thin' | 'none'
    /**
     * Portrait art with meaningful edges (a Character's full figure) wants
     * 'contain' so nothing is cropped away; scene art wants 'cover' so it
     * fills the frame. character-gallery and character-interact both ask for
     * contain, which is why this is a prop and not a constant.
     */
    fit?: 'cover' | 'contain'
    /**
     * CSS object-position for the crop. Left unset, a purpose-built variant is
     * shown as composed and a primary standing in for a missing variant gets
     * that variant's ART_VARIANT_FOCUS. Set it to art-direct one surface.
     */
    position?: string
    /** The gallery-card lift: art scales slightly on the ancestor's :hover. */
    hoverZoom?: boolean
    eager?: boolean
    placeholderIcon?: string
  }>(),
  {
    source: null,
    variant: 'card',
    fallback: '',
    alt: '',
    shape: 'plate',
    compact: false,
    frame: 'plate',
    fit: 'cover',
    position: '',
    hoverZoom: false,
    eager: false,
    placeholderIcon: 'kind-icon:image',
  },
)

const frameClass = computed(() => {
  switch (props.frame) {
    case 'thin':
      return 'rounded-2xl border border-base-300'
    case 'none':
      return ''
    default:
      return 'rounded-2xl border-[6px] border-base-100 shadow-[0_18px_44px_-18px_rgba(58,49,40,0.5)]'
  }
})

const failedSources = ref<string[]>([])
watch(
  () => [props.source, props.variant, props.fallback],
  () => {
    failedSources.value = []
  },
)

function onError(event: Event): void {
  const failedSrc =
    (event.currentTarget as HTMLImageElement | null)?.getAttribute('src') || ''
  if (failedSrc && !failedSources.value.includes(failedSrc)) {
    failedSources.value = [...failedSources.value, failedSrc]
  }
}

const resolved = computed(() =>
  resolveArtVariantSource(props.source, props.variant, props.fallback),
)

const src = computed(() => {
  const candidate = resolved.value.src
  if (candidate && !failedSources.value.includes(candidate)) return candidate
  if (
    props.fallback &&
    props.fallback !== candidate &&
    !failedSources.value.includes(props.fallback)
  ) {
    return props.fallback
  }
  return ''
})

/*
 * A purpose-built variant is already composed FOR this frame -- the card prompt
 * asks for breathing room around the subject, the hero for the subject inside
 * the centre region -- so it is shown exactly as stored. A primary standing in
 * for a missing variant is a different situation: object-cover is cropping it,
 * and a centred crop of a square portrait into 2:3 or 16:9 reliably cuts the
 * head off. That case, and only that case, gets the variant's focus.
 *
 * 'contain' never crops, so it never needs repositioning.
 */
const objectPosition = computed(() => {
  if (props.position) return props.position
  if (props.fit === 'contain') return undefined
  return resolved.value.origin === 'primary'
    ? ART_VARIANT_FOCUS[props.variant]
    : undefined
})

/*
 * Silas's four shapes, 2026-08-04 — the spec that had never been written down,
 * which is why card and icon kept coming out wrong:
 *
 *   imagePath  SQUARE      the plain stored image, and the honest default
 *   hero       HORIZONTAL  16:9
 *   card       VERTICAL    2:3
 *   icon       SQUARE      small, as the intro piece to a text-forward row
 *
 * `icon` previously had no case here at all and fell through to 3:2, so an icon
 * rendered in a horizontal box. `wide` and `plate` are kept for the two
 * non-gallery surfaces that ask for them by name.
 */
const aspectClass = computed(() => {
  if (props.compact) return 'h-16 w-full shrink-0'

  switch (props.shape) {
    case 'card':
      return 'aspect-2/3 w-full'
    case 'hero':
      return 'aspect-video w-full'
    case 'square':
      return 'aspect-square w-full'
    case 'wide':
      return 'aspect-4/3 w-full'
    case 'plate':
      return 'aspect-3/2 w-full'
    default:
      return 'aspect-square w-full'
  }
})
</script>

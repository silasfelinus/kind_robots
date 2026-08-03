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
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      :class="[
        'h-full w-full',
        fit === 'contain' ? 'object-contain' : 'object-cover',
        hoverZoom ? 'transition-transform duration-300 group-hover:scale-105' : '',
      ]"
      :loading="eager ? 'eager' : 'lazy'"
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
  resolveArtVariantSrc,
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
    frame: 'plate',
    fit: 'cover',
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

// A broken URL should fall back rather than leave a dead frame. Reset whenever
// the source changes, or one bad image would poison every later one.
const failed = ref(false)
watch(
  () => [props.source, props.variant, props.fallback],
  () => {
    failed.value = false
  },
)

function onError(): void {
  failed.value = true
}

const src = computed(() => {
  const resolved = resolveArtVariantSrc(
    props.source,
    props.variant,
    props.fallback,
  )
  if (!failed.value) return resolved
  // Only fall back if the fallback is not itself the thing that just failed.
  return resolved === props.fallback ? '' : props.fallback
})

const aspectClass = computed(() => {
  switch (props.shape) {
    case 'card':
      return 'aspect-2/3 w-full'
    case 'hero':
      return 'aspect-video w-full'
    case 'wide':
      return 'aspect-4/3 w-full'
    default:
      return 'aspect-3/2 w-full'
  }
})
</script>

<template>
  <div class="relative overflow-hidden bg-black" :class="frame">
    <img
      :src="townPainting"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <img
      v-if="shown && !failed"
      :key="shown"
      :ref="settleArt"
      :src="shown"
      :alt="shown === source ? alt : fallbackLabel"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      :class="[
        loaded ? 'opacity-100' : 'opacity-0',
        // Posters are portrait: keep the face when a wide frame crops them.
        kind === 'villain' ? 'object-[center_20%]' : '',
      ]"
      @load="loaded = true"
      @error="onError"
    />
    <p
      v-if="brief && (!loaded || shown !== source)"
      class="absolute inset-x-2 bottom-2 line-clamp-2 rounded-lg bg-black/60 px-2 py-1 cs-micro italic leading-snug text-white/80"
    >
      {{ brief }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCrystalStreetArtStore } from '~/stores/crystalStreetArtStore'
import { CRYSTAL_STREET_TOWN_PAINTING } from '~/utils/crystalStreet/artPresentation'

const props = withDefaults(
  defineProps<{
    seed: string
    src?: string
    fallback?: string
    kind?: 'night' | 'day' | 'dream' | 'villain' | 'location' | 'ending'
    palette?: readonly string[]
    sigil?: string
    alt?: string
    brief?: string
    frame?: string
  }>(),
  {
    src: '',
    fallback: '',
    kind: 'night',
    palette: () => [],
    sigil: '',
    alt: '',
    brief: '',
    frame: 'aspect-[4/3]',
  },
)

const townPainting = CRYSTAL_STREET_TOWN_PAINTING
const fallbackLabel = computed(() =>
  shown.value === townPainting
    ? 'Painted view of Crystal Street'
    : 'Alternate painting',
)
const art = useCrystalStreetArtStore()
const source = computed(() => art.sourceFor(props.src))
const fallback = computed(() => art.sourceFor(props.fallback))
const loaded = ref(false)
const failed = ref(false)
const shown = ref(source.value || fallback.value)

watch(
  () => [props.src, props.fallback, art.canLoad, art.sessionToken] as const,
  ([src, alternate]) => {
    void art.ensure(src)
    void art.ensure(alternate)
  },
  { immediate: true },
)
watch([source, fallback], () => {
  shown.value = source.value || fallback.value
  loaded.value = false
  failed.value = false
})

function onError(): void {
  loaded.value = false
  if (fallback.value && shown.value !== fallback.value)
    shown.value = fallback.value
  else failed.value = true
}

// An image that settles before hydration (or straight from cache) never fires
// @load/@error for Vue, which left generated art at opacity 0 behind its
// fallback. The function ref runs on every mount, so read the element itself.
function settleArt(el: unknown): void {
  if (!(el instanceof HTMLImageElement) || !el.complete) return
  if (el.naturalWidth > 0) loaded.value = true
  else onError()
}
</script>

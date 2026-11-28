<template>
  <div
    class="relative overflow-hidden rounded-2xl"
    :class="[frame, shaken ? 'grayscale' : '']"
    :style="{ background: companion.palette[0] }"
  >
    <img
      :src="neutral"
      alt=""
      aria-hidden="true"
      class="absolute inset-0 h-full w-full object-cover object-top"
    />
    <img
      v-if="!failed"
      :key="src"
      :ref="settleArt"
      :src="src"
      :alt="`${companion.name}, ${emotion}`"
      class="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Companion, Emotion } from '~/utils/crystalStreet/types'

const props = withDefaults(
  defineProps<{
    companion: Companion
    emotion?: Emotion
    format?: 'portrait' | 'poster'
    frame?: string
    shaken?: boolean
  }>(),
  {
    emotion: 'neutral',
    format: 'portrait',
    frame: 'aspect-[4/5]',
    shaken: false,
  },
)

const neutral = computed(
  () => `/crystal-street/companions/${props.companion.id}-neutral.webp`,
)
const loaded = ref(false)
const failed = ref(false)
const src = computed(() =>
  props.format === 'poster'
    ? `/crystal-street/companions/${props.companion.id}-poster.webp`
    : `/crystal-street/companions/${props.companion.id}-${props.emotion}.webp`,
)
watch(src, () => {
  loaded.value = false
  failed.value = false
})

// An image that settles before hydration (or straight from cache) never fires
// @load/@error for Vue, which left generated art at opacity 0 behind its
// fallback. The function ref runs on every mount, so read the element itself.
function settleArt(el: unknown): void {
  if (!(el instanceof HTMLImageElement) || !el.complete) return
  if (el.naturalWidth > 0) loaded.value = true
  else failed.value = true
}
</script>

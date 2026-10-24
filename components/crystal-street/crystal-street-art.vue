<template>
  <div class="relative overflow-hidden bg-black" :class="frame">
    <crystal-street-scene
      class="absolute inset-0"
      :seed="seed"
      :kind="kind"
      :palette="palette"
      :sigil="sigil"
      :label="alt"
    />
    <img
      v-if="src && !failed"
      :key="src"
      :src="src"
      :alt="alt"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    />
    <p
      v-if="brief && !loaded"
      class="absolute inset-x-2 bottom-2 line-clamp-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] italic leading-snug text-white/80"
    >
      {{ brief }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    seed: string
    src?: string
    kind?: 'night' | 'day' | 'dream' | 'villain' | 'location' | 'ending'
    palette?: readonly string[]
    sigil?: string
    alt?: string
    brief?: string
    frame?: string
  }>(),
  {
    src: '',
    kind: 'night',
    palette: () => [],
    sigil: '',
    alt: '',
    brief: '',
    frame: 'aspect-[4/3]',
  },
)

const loaded = ref(false)
const failed = ref(false)

watch(
  () => props.src,
  () => {
    loaded.value = false
    failed.value = false
  },
)
</script>

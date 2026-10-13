<template>
  <img
    v-if="!failed"
    ref="img"
    :src="src"
    :alt="alt"
    loading="lazy"
    decoding="async"
    class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
    :class="loaded ? 'opacity-100' : 'opacity-0'"
    @load="loaded = true"
    @error="failed = true"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ src: string; alt: string }>()

const img = ref<HTMLImageElement | null>(null)
const loaded = ref(false)
const failed = ref(false)

// An image that settled before hydration never fires @load/@error for Vue.
function settle() {
  const el = img.value
  if (!el || !el.complete) return
  if (el.naturalWidth > 0) loaded.value = true
  else failed.value = true
}

onMounted(settle)
watch(
  () => props.src,
  () => {
    loaded.value = false
    failed.value = false
  },
)
</script>

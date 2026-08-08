<!-- /components/navigation/navigation-artwork.vue -->
<template>
  <img
    v-if="resolvedSrc"
    :src="resolvedSrc"
    :alt="alt"
    loading="lazy"
    class="h-full w-full object-cover"
  />
</template>

<script setup lang="ts">
import { useDedupedArtwork } from '@/composables/useDedupedArtwork'

const props = defineProps<{
  src?: string
  alt?: string
}>()

const resolvedSrc = useDedupedArtwork(() => props.src)
</script>

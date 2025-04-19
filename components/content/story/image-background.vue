<!-- /components/content/story/image-background.vue -->
<template>
  <img
    v-if="image"
    :src="`/images/${image}`"
    class="h-full w-auto object-cover"
    alt="Ambient Background"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
const { image } = storeToRefs(usePageStore())
</script>

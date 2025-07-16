<!-- /components/content/story/image-background.vue -->

<template>
  <img
    v-if="image"
    :src="`/images/${image}`"
    class="w-full h-full object-cover opacity-40 z-0"
    alt="Ambient Background"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
const { image } = storeToRefs(usePageStore())
</script>

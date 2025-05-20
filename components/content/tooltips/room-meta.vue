<!-- /components/content/tooltips/room-meta.vue -->
<template>
  <div class="flex flex-col justify-center items-center">
    <!-- Image -->
    <div class="flex justify-center items-center m-1">
      <img
        v-if="image"
        :src="'/images/' + image"
        alt="Main Image"
        class="rounded-2xl border shadow-md medium"
      />
    </div>

    <!-- Title and Subtitle -->
    <div class="flex flex-col justify-center items-center">
      <room-title class="text-lg font-semibold m-2" />
      <h2 v-if="subtitle" class="text-md font-medium">
        {{ subtitle }}
      </h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const { image, subtitle } = storeToRefs(usePageStore())
</script>

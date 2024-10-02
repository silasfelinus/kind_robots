<template>
  <!-- User's Collected Art Display -->
  <div v-if="collectedArt.length > 0" class="mt-10">
    <h2 class="text-xl text-center mb-6 font-semibold text-primary">
      🖼️ Your Art Collection
    </h2>
    <div class="grid grid-cols-1 gap-6">
      <ArtCard
        v-for="artItem in collectedArt"
        :key="artItem.id"
        :art="artItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArtStore } from '@/stores/artStore'
const artStore = useArtStore()
const collectedArt = computed(() => artStore.collectedArt)
</script>

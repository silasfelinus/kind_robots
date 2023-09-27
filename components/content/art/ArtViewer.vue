<!-- /components/ArtViewer.vue -->
<template>
  <div>
    <img :src="art.path" alt="Artwork" />
    <p>{{ art.prompt }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()
const art = computed(artStore.artAssets) // Replace with actual logic
</script>

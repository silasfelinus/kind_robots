<template>
  <div class="bg-base-200 rounded-2xl p-4">
    <h1 class="text-lg">Art Gallery</h1>
    <pitch-tags />
    <div class="flex flex-wrap">
      <!-- Loop through the array of art assets -->
      <div v-for="art in artAssetsArray" :key="art.id" class="m-2">
        <ArtCard :art="art" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'

const artStore = useArtStore()

onMounted(() => {
  artStore.init() // Fetch all art assets when the component is mounted
})

const artAssetsArray = computed(() => Array.from(artStore.artAssets.values()))
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
    <StoreTest 
      label="Display Store" 
      :loadStore="loadDisplayStore" 
    />
    <StoreTest 
      label="User Store" 
      :loadStore="loadUserStore" 
    />
    <StoreTest 
      label="Pitch Store" 
      :loadStore="loadPitchStore" 
    />
    <StoreTest 
      label="Prompt Store" 
      :loadStore="loadPromptStore" 
    />
    <StoreTest 
      label="Art Store" 
      :loadStore="loadArtStore" 
    />
    <StoreTest 
      label="Bot Store" 
      :loadStore="loadBotStore" 
    />
    <StoreTest 
      label="Gallery Store" 
      :loadStore="loadGalleryStore" 
    />
    <StoreTest 
      label="Component Store" 
      :loadStore="loadComponentStore" 
    />
    <StoreTest 
      label="Tag Store" 
      :loadStore="loadTagStore" 
    />
  </div>
</template>

<script setup lang="ts">
import { 
  loadDisplayStore, 
  loadUserStore, 
  loadPitchStore, 
  loadPromptStore, 
  loadArtStore, 
  loadBotStore, 
  loadGalleryStore, 
  loadComponentStore, 
  loadTagStore 
} from '@/stores'

// Import the base component
import StoreTest from '@/components/StoreTest.vue'
</script>

<style scoped>
.grid {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

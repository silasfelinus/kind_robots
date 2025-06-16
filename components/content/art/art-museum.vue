<template>
  <div class="w-full max-w-full flex flex-col items-center space-y-4 overflow-x-hidden">
    <!-- Toggle Button -->
    <button class="btn btn-sm btn-outline w-full sm:w-auto" @click="showGallery = !showGallery">
      {{ showGallery ? '🖼️ Show Collection' : '🖼️ Show Gallery' }}
    </button>

    <!-- Conditional Sections -->
    <div class="w-full max-w-full">
      <art-gallery v-if="showGallery" />
      <div v-else class="space-y-4">
        <collection-display />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showGallery = ref(false)
</script>

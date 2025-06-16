<!-- /components/content/art/art-museum.vue -->
<template>
  <generate-button />
  <div class="text-center">
    <button class="btn btn-sm btn-outline" @click="showGallery = !showGallery">
      {{ showGallery ? '🖼️ Show Collection' : '🖼️ Show Gallery' }}
    </button>
  </div>
  <div v-if="showGallery">
    <art-gallery />
  </div>
  <div v-else>
    <collection-display />
  </div>
</template>

<script setup lang="ts">
// /components/content/art/add-art.vue
import { ref } from 'vue'

const showGallery = ref(false)
</script>

<!-- /components/content/art/image-view.vue -->
<template>
  <div class="relative w-full">
    <img
      v-if="image"
      :src="imageUrl"
      alt="Uploaded art preview"
      class="w-full h-auto rounded-lg shadow-md object-contain"
    />
    <div v-else class="text-center text-base-content/70 italic py-4">
      No image to display.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArtImage } from '@/stores/artStore'

interface Props {
  image: ArtImage | null
}

const props = defineProps<Props>()

const imageUrl = computed(() =>
  props.image ? `/api/art/image/${props.image.id}` : '',
)
</script>

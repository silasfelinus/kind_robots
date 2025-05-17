// /components/content/art/image-view.vue
<template>
  <div class="relative w-full">
    <img
      v-if="image?.url"
      :src="image.url"
      alt="Uploaded art preview"
      class="w-full h-auto rounded-lg shadow-md object-contain"
    />
    <div v-else class="text-center text-base-content/70 italic py-4">
      No image to display.
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  image: {
    url: string
    id: number
  } | null
}

defineProps<Props>()
</script>

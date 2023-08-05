<template>
  <div class="grid grid-cols-3 gap-4">
    <div
      v-for="gallery in galleries"
      :key="gallery.id"
      class="bg-base p-4 rounded-lg shadow-lg cursor-pointer hover:bg-accent transition"
      @click="openGallery(gallery.id)"
    >
      <img
        :src="gallery.highlightImage"
        alt="Gallery Highlight"
        class="w-full h-32 object-cover rounded"
      />
      <h3 class="text-lg font-semibold mt-2">{{ gallery.name }}</h3>
    </div>
  </div>
</template>

<script setup>
import { useGalleryStore } from '../../stores/galleryStore'

const galleryStore = useGalleryStore()
const { galleries } = galleryStore

const openGallery = (id) => {
  $nuxt.$router.push({ name: 'gallery-view', params: { id } })
}
</script>

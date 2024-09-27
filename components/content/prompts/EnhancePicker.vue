<template>
  <div class="image-selector">
    <h2>Select an Image to Enhance</h2>
    <div class="image-grid">
      <div
        v-for="image in imageList"
        :key="image.name"
        class="image-item"
        :class="{ selected: image.name === selectedImage }"
        @click="selectImage(image.name)"
      >
        <img
          :src="`/images/${image.file}`"
          :alt="image.name"
          class="image-preview"
        />
        <p>{{ image.displayName }}</p>
      </div>
    </div>
    <div v-if="selectedImage" class="selected-image-info">
      <h3>Selected Image: {{ selectedImage }}</h3>
      <button @click="confirmSelection">Enhance Image</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDeforumStore } from './../../../stores/deforumStore'

// List of available images
const imageList = [
  { name: 'arcade', file: 'arcade.webp', displayName: 'Arcade' },
  { name: 'bodyhumor', file: 'bodyhumor.webp', displayName: 'Body Humor' },
  { name: 'buccolic1', file: 'buccolic1.webp', displayName: 'Bucolic 1' },
  { name: 'buccolic2', file: 'buccolic2.webp', displayName: 'Bucolic 2' },
  { name: 'clay', file: 'clay.webp', displayName: 'Claymation' },
  { name: 'heavenhell', file: 'heavenhell.webp', displayName: 'Heaven & Hell' },
  {
    name: 'highfantasy',
    file: 'highfantasy.webp',
    displayName: 'High Fantasy',
  },
  {
    name: 'lovecraftian',
    file: 'lovecraftian.webp',
    displayName: 'Lovecraftian',
  },
  {
    name: 'maturefantasy',
    file: 'maturefantasy.webp',
    displayName: 'Mature Fantasy',
  },
  {
    name: 'playfulfantasy',
    file: 'playfulfantasy.webp',
    displayName: 'Playful Fantasy',
  },
  { name: 'playland', file: 'playland.webp', displayName: 'Playland' },
  { name: 'suburbia', file: 'suburbia.webp', displayName: 'Suburbia' },
  { name: 'underwater', file: 'underwater.webp', displayName: 'Underwater' },
  { name: 'weirdwest', file: 'weirdwest.webp', displayName: 'Weird West' },
  { name: 'wonderland', file: 'wonderland.webp', displayName: 'Wonderland' },
]

// Selected image state
const selectedImage = ref<string | null>(null)
const deforumStore = useDeforumStore()

// Function to select an image
const selectImage = (imageName: string) => {
  selectedImage.value = imageName
}

// Function to confirm and store the selected image
const confirmSelection = () => {
  if (selectedImage.value) {
    deforumStore.selectedVideo = selectedImage.value // Store selected image in deforumStore
    alert(`Selected image: ${selectedImage.value}`)
  }
}
</script>

<style scoped>
.image-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 20px 0;
}
.image-item {
  cursor: pointer;
  text-align: center;
}
.image-item.selected {
  border: 2px solid #4caf50;
}
.image-preview {
  width: 100%;
  height: auto;
  border-radius: 8px;
  transition: transform 0.3s ease;
}
.image-preview:hover {
  transform: scale(1.05);
}
.selected-image-info {
  margin-top: 20px;
}
</style>

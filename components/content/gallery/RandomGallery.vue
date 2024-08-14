<template>
  <div class="tv-container">
    <div class="tv-body">
      <div class="tv-screen">
        <img
          v-if="currentImage"
          :src="currentImage"
          alt="Random Image from Gallery"
          class="tv-image"
        />
        <div v-else class="tv-error">No Image Available</div>
      </div>
      <div class="tv-knobs">
        <button class="tv-button" @click="changeToRandomImage">
          Change Image
        </button>
        <button class="tv-button" @click="setRandomGallery">
          Change Gallery
        </button>
      </div>
    </div>
    <div class="tv-base" />
  </div>
</template>

<script setup>
import { useGalleryStore } from '@/stores/galleryStore' // adjust path as necessary

const galleryStore = useGalleryStore()
const currentImage = computed(() => galleryStore.currentImage)

const changeToRandomImage = () => {
  galleryStore.changeToRandomImage()
}

const setRandomGallery = () => {
  galleryStore.setRandomGallery()
}
</script>

<style scoped>
.tv-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #111;
}

.tv-body {
  display: flex;
  flex-direction: column;
  background-color: #333;
  border-radius: 20% 20% 10% 10%;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  width: 600px;
  height: 450px;
  position: relative;
}

.tv-screen {
  flex: 4;
  background-color: #000;
  margin: 20px;
  padding: 10px;
  border: 5px solid #555;
  border-radius: 10px;
  overflow: hidden;
}

.tv-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.8);
}

.tv-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.tv-knobs {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding-right: 30px;
}

.tv-button {
  background-color: #555;
  color: white;
  padding: 5px 20px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.tv-button:hover {
  background-color: #777;
}

.tv-base {
  width: 50%;
  height: 20px;
  background-color: #222;
  border-radius: 0 0 10% 10%;
  box-shadow: 0 5px 5px rgba(0, 0, 0, 0.3);
}
</style>

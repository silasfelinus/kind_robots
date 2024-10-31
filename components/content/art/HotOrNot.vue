<template>
  <div class="art-gallery-layout">
    <div class="splash-section"></div>

    <div v-show="!showSplash" class="gallery-section">
      <gallery-selector />
      <div class="art-container">
        <img
          v-if="currentImage"
          :src="currentImage.url"
          alt="Current Art"
          class="art-image"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showSplash = ref(true)

interface ArtImage {
  id: number
  url: string
}

const currentImage = ref<ArtImage | null>(null)
</script>

<style scoped>
/* Flex layout for the entire component, with flex-grow and max-width to ensure content doesn’t overflow */

.art-gallery-layout {
  display: flex;
  flex-direction: column;
  width: 100%; /* Ensure it takes the full width of the parent container */
  max-width: 100vw; /* Constrain content to the viewport width */
  gap: 16px;
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .art-gallery-layout {
    flex-direction: row; /* Switch to row layout on wider screens */
    justify-content: space-between;
  }
}

.splash-section {
  flex: 1; /* Allows this section to grow and shrink */
  min-width: 200px; /* Ensures the splash image has a minimum size */
  max-width: 25%; /* The image will take up no more than 25% of the screen width */
  text-align: center;
}

.splash-image {
  width: 100%;
  height: auto;
  cursor: pointer;
}

.gallery-section {
  flex: 3; /* The gallery section takes up the remaining space */
  width: 100%; /* Fill available width */
  max-width: 70vw; /* Make sure it doesn’t exceed 70% of the viewport width */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.art-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%; /* Full width of its container */
}

.art-image {
  max-width: 100%; /* Ensure the image respects its container's width */
  height: auto;
  margin: 0 auto;
}

.button-container {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap; /* Buttons wrap to new lines if there’s not enough space */
}

.gallery-button {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-grow: 1; /* Buttons will grow to fill available space */
  min-width: 120px; /* Ensure buttons are not too small */
}

.gallery-button:hover {
  background-color: #ddd;
}

.vote-icon {
  font-size: 48px;
  animation: fade-in-out 1s ease-in-out;
}

@keyframes fade-in-out {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>

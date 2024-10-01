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
        <div class="button-container">
          <button class="gallery-button" @click="vote(ReactionTypeEnum.HATED)">
            Hate
            <Icon name="mdi-delete" />
          </button>
          <button class="gallery-button" @click="vote(ReactionTypeEnum.LOVED)">
            Love
            <Icon name="mdi-heart" />
          </button>
          <button class="gallery-button" @click="vote(ReactionTypeEnum.BOOED)">
            Boo
            <Icon name="mdi-thumb-down-outline" />
          </button>
          <button
            class="gallery-button"
            @click="vote(ReactionTypeEnum.FLAGGED)"
          >
            Flag
            <Icon name="mdi-flag" />
          </button>
        </div>
        <Icon v-if="activeIcon" :name="activeIcon" class="vote-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGalleryStore } from './../../../stores/galleryStore'
import {
  useReactionStore,
  ReactionTypeEnum,
} from './../../../stores/reactionStore'

const showSplash = ref(true)
const galleryStore = useGalleryStore()
const reactionStore = useReactionStore()

interface ArtImage {
  id: number
  url: string
}

const currentImage = ref<ArtImage | null>(null)
const activeIcon = ref<string | null>(null)

// Assume userId is available in the session or store
const userId = 1 // Replace with actual logic to get the logged-in user ID

// Vote function to handle reactions
const vote = async (reactionType: ReactionTypeEnum) => {
  if (currentImage.value) {
    try {
      // Call the reactionStore to create a reaction using ReactionTypeEnum
      await reactionStore.createReaction({
        userId,
        reactionType,
        artId: currentImage.value.id,
        reactionCategory: 'ART',
      })

      // Change to a random image in the current gallery
      await galleryStore.changeToRandomImage()

      // Update active icon based on vote choice
      switch (reactionType) {
        case ReactionTypeEnum.LOVED:
          activeIcon.value = 'mdi-heart'
          break
        case ReactionTypeEnum.HATED:
          activeIcon.value = 'mdi-delete'
          break
        case ReactionTypeEnum.BOOED:
          activeIcon.value = 'mdi-thumb-down-outline'
          break
        case ReactionTypeEnum.FLAGGED:
          activeIcon.value = 'mdi-flag'
          break
      }

      // Reset icon after 1 second
      setTimeout(() => (activeIcon.value = null), 1000)
    } catch (error) {
      console.error('Error recording reaction or fetching new image:', error)
    }
  }
}
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

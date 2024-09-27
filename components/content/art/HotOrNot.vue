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
          <button class="gallery-button" @click="vote('hate')">Hate</button>
          <button class="gallery-button" @click="vote('love')">Love</button>
          <button class="gallery-button" @click="vote('not')">Not</button>
          <button class="gallery-button" @click="vote('hot')">Hot</button>
        </div>
        <Icon v-if="activeIcon" :name="activeIcon" class="vote-icon" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useReactionStore } from './../../../stores/reactionStore'

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

// Touch coordinates
let touchstartX = 0
let touchendX = 0
let touchstartY = 0
let touchendY = 0

// Define the touch start function
const handleTouchStart = (event: TouchEvent) => {
  touchstartX = event.touches[0].screenX
  touchstartY = event.touches[0].screenY
}

// Define the touch end function
const handleTouchEnd = (event: TouchEvent) => {
  touchendX = event.changedTouches[0].screenX
  touchendY = event.changedTouches[0].screenY
  handleSwipeGesture()
}

// Swipe logic to determine action based on swipe direction
const handleSwipeGesture = () => {
  const deltaX = touchendX - touchstartX
  const deltaY = touchendY - touchstartY

  if (deltaX > 0) {
    vote('hot')
  } else {
    vote('not')
  }

  if (deltaY > 0) {
    vote('hate')
  } else {
    vote('love')
  }
}

// Vote function to handle reactions
type VoteChoice = 'hate' | 'love' | 'not' | 'hot'

const vote = async (choice: VoteChoice) => {
  if (currentImage.value) {
    try {
      // Call the reactionStore to create a reaction
      await reactionStore.createReaction({
        userId,
        reactionType: getReactionType(choice),
        artId: currentImage.value.id,
        reactionCategory: 'ART',
      })

      // Change to a random image in the current gallery
      await galleryStore.changeToRandomImage()

      // Update active icon based on vote choice
      switch (choice) {
        case 'hot':
          activeIcon.value = 'mdi-fire'
          break
        case 'love':
          activeIcon.value = 'mdi-heart'
          break
        case 'not':
          activeIcon.value = 'mdi-thumb-down-outline'
          break
        case 'hate':
          activeIcon.value = 'mdi-delete'
          break
      }

      // Reset icon after 1 second
      setTimeout(() => (activeIcon.value = null), 1000)
    } catch (error) {
      console.error('Error recording reaction or fetching new image:', error)
    }
  }
}

// Helper function to map vote choices to reaction types
const getReactionType = (choice: VoteChoice) => {
  switch (choice) {
    case 'hot':
      return 'LOVED'
    case 'love':
      return 'LOVED'
    case 'not':
      return 'BOOED'
    case 'hate':
      return 'HATED'
    default:
      return 'NEUTRAL'
  }
}

onMounted(() => {
  const imageElement = document.querySelector('.art-image') as HTMLImageElement
  if (imageElement) {
    imageElement.addEventListener(
      'touchstart',
      handleTouchStart as EventListener,
    )
    imageElement.addEventListener('touchend', handleTouchEnd as EventListener)
  }
})

onUnmounted(() => {
  const imageElement = document.querySelector('.art-image') as HTMLImageElement
  if (imageElement) {
    imageElement.removeEventListener(
      'touchstart',
      handleTouchStart as EventListener,
    )
    imageElement.removeEventListener(
      'touchend',
      handleTouchEnd as EventListener,
    )
  }
})
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

<template>
  <div class="splash-container" :class="{ 'is-hidden': !showSplash }">
    <img
      src="/images/artsplash3.webp"
      alt="Art Splash"
      class="splash-image"
      @click="loadFirstImage"
    />
    <div v-show="!showSplash" class="gallery-container">
      <GallerySelector v-model="selectedGallery" :options="galleryOptions" />
      <div class="art-container">
        <img :src="currentImage.url" alt="Current Art" class="art-image" />
        <Icon v-if="activeIcon" :name="activeIcon" class="vote-icon" />
        <button class="corner-button top-left" @click="vote('hate')">
          Hate
        </button>
        <button class="corner-button top-right" @click="vote('love')">
          Love
        </button>
        <button class="corner-button bottom-left" @click="vote('not')">
          Not
        </button>
        <button class="corner-button bottom-right" @click="vote('hot')">
          Hot
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useArtStore } from './../../../stores/artStore'

const showSplash = ref(true)
const selectedGallery = ref('')
const galleryStore = useGalleryStore()
const artStore = useArtStore()
const currentImage = ref({})

// Touch coordinates
let touchstartX = 0
let touchendX = 0
let touchstartY = 0
let touchendY = 0

// Define the touch start function
const handleTouchStart = (event) => {
  touchstartX = event.touches[0].screenX
  touchstartY = event.touches[0].screenY
}

// Define the touch end function
const handleTouchEnd = (event) => {
  touchendX = event.changedTouches[0].screenX
  touchendY = event.changedTouches[0].screenY
  handleSwipeGesture()
}

// Swipe logic to determine action based on swipe direction
const handleSwipeGesture = () => {
  const deltaX = touchendX - touchstartX
  const deltaY = touchendY - touchstartY

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) vote('hot')
    else vote('not')
  } else {
    if (deltaY > 0) vote('hate')
    else vote('love')
  }
}

const activeIcon = ref(null)

const vote = (choice) => {
  artStore.recordReaction(currentImage.value.id, choice)
  galleryStore.moveToNextImage()

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
  // Reset icon after a short duration to display it temporarily
  setTimeout(() => (activeIcon.value = null), 1000)
}

// Load the first image
const loadFirstImage = () => {
  showSplash.value = false
  galleryStore.sortAndSelectFirstImage(selectedGallery.value)
  currentImage.value = galleryStore.currentImage
}

// Set up and tear down event listeners
onMounted(() => {
  const imageElement = document.querySelector('.art-image')
  imageElement.addEventListener('touchstart', handleTouchStart)
  imageElement.addEventListener('touchend', handleTouchEnd)
})

onUnmounted(() => {
  const imageElement = document.querySelector('.art-image')
  imageElement.removeEventListener('touchstart', handleTouchStart)
  imageElement.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
.vote-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 48px; /* Adjust size as necessary */
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

.splash-container {
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.art-container {
  position: relative;
}

.corner-button {
  position: absolute;
  padding: 8px 16px;
}

.top-left {
  top: 10px;
  left: 10px;
}
.top-right {
  top: 10px;
  right: 10px;
}
.bottom-left {
  bottom: 10px;
  left: 10px;
}
.bottom-right {
  bottom: 10px;
  right: 10px;
}

.art-image {
  max-width: 90%;
  height: auto;
  margin: auto;
}
</style>

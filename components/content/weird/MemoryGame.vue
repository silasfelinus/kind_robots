<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import confetti from 'canvas-confetti'
import { useUserStore } from '../../../stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user)
const username = computed(() => userStore.username)
const matchRecord = computed(() => userStore.matchRecord)

interface GalleryImage {
  id: number
  galleryName: string
  imagePath: string
  flipped: boolean
  matched: boolean
}
interface CustomNotification {
  type: 'error' | 'info' // add more types if needed
  message: string
}

const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  })
}
const galleryImages = ref<GalleryImage[]>([])
const difficulties = [
  { label: 'Easy', value: 8 },
  { label: 'Medium', value: 12 },
  { label: 'Hard', value: 16 },
]
const selectedDifficulty = ref(difficulties[0]) // Default to 'Easy'
const gameWon = ref(false)

const notification = ref<CustomNotification | null>(null)
const shouldShowMilestoneCheck = ref(false)
const isLoading = ref(true)

function isClientSide() {
  return typeof window !== 'undefined'
}

const highScore = ref<number>(0) // Default to 0

if (isClientSide()) {
  const savedHighScore = user.value?.matchRecord
  if (savedHighScore) {
    highScore.value = Number(savedHighScore)
  }
}
let firstSelected: GalleryImage | null = null

async function generateMemoryGameImages() {
  try {
    isLoading.value = true

    gameWon.value = false

    const imageCount = Math.ceil(selectedDifficulty.value.value / 2)

    const response = await fetch(`/api/galleries/random/count/${imageCount}`)
    const data = await response.json()

    if (data.images.length !== imageCount) {
      throw new Error('Received an unexpected number of images.')
    }

    galleryImages.value = data.images
      .concat(data.images) // Duplicate the images for matching pairs
      .map((imagePath: string, index: number) => ({
        id: index,
        galleryName: '', // Adjust this if the API returns a gallery name or description
        imagePath,
        flipped: false,
        matched: false,
      }))
      .sort(() => 0.5 - Math.random())
    isLoading.value = false
  }
  catch (error) {
    isLoading.value = false

    console.error('Error generating images:', error)
    notification.value = {
      type: 'error',
      message: 'Error generating images. Please try again later.',
    }
  }
}

const score = ref(0) // Initialize score to 0
function handleGalleryClick(clickedGallery: GalleryImage) {
  if (clickedGallery.flipped || clickedGallery.matched) return

  clickedGallery.flipped = true

  if (!firstSelected) {
    firstSelected = clickedGallery
  }
  else if (firstSelected && firstSelected.imagePath === clickedGallery.imagePath) {
    // Match found
    clickedGallery.matched = true
    firstSelected.matched = true
    score.value += 10 // Increase score by 10

    setTimeout(() => {
      firstSelected = null
    }, 500)

    // Check for game win condition
    if (galleryImages.value.every(g => g.matched)) {
      gameWon.value = true
      triggerConfetti()
      if (matchRecord.value < score.value || matchRecord.value === null) {
        userStore.updateMatchRecord(score.value)
      }
      if (score.value >= 50) {
        shouldShowMilestoneCheck.value = true
      }
      // Update high score if needed
      if (score.value > highScore.value || score.value > matchRecord.value) {
        highScore.value = score.value
        if (isClientSide()) {
          localStorage.setItem('highScore', highScore.value.toString())
        }
      }
    }
  }
  else {
    // No match found
    score.value -= 5 // Deduct score by 5

    setTimeout(() => {
      clickedGallery.flipped = false
      if (firstSelected) {
        // Ensure firstSelected is not null before accessing its properties
        firstSelected.flipped = false
      }
      firstSelected = null
    }, 500)
  }
}

const notificationClasses = computed(() => {
  const baseClasses = 'notification py-2 px-4 rounded-lg mb-2'
  if (!notification.value) return baseClasses
  return notification.value.type === 'error'
    ? `${baseClasses} bg-red-200 text-red-700`
    : `${baseClasses} bg-green-200 text-green-700`
})

function resetGame() {
  galleryImages.value.forEach((img) => {
    img.flipped = false
    img.matched = false
  })
  score.value = 0
  firstSelected = null
  generateMemoryGameImages()
}

onMounted(generateMemoryGameImages)
watch(selectedDifficulty, resetGame)
</script>

<template>
  <div class="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center space-y-6">
    <header class="text-center space-y-2">
      <h1 class="text-4xl font-bold">
        Kind Robots Memory Game
      </h1>
      <p class="text-gray-600">
        Match the images and test your memory!
      </p>
      <match-leaderboard />
      <div class="difficulty-controls">
        <label for="difficulty">Select Difficulty: </label>
        <select
          id="difficulty"
          v-model="selectedDifficulty"
        >
          <option
            v-for="difficulty in difficulties"
            :key="difficulty.label"
            :value="difficulty"
          >
            {{ difficulty.label }}
          </option>
        </select>
        <button
          class="rounded-2xl text-white bg-primary p-2 m-1 border"
          @click="resetGame"
        >
          Start New Game
        </button>
        <milestone-reward
          v-if="shouldShowMilestoneCheck"
          :id="5"
        />
      </div>
    </header>

    <div class="game-board w-full max-w-4xl flex flex-wrap justify-center items-center">
      <!-- Loader -->
      <div
        v-if="isLoading"
        class="loader mt-4"
      />

      <!-- Game Cards -->
      <div
        v-for="galleryImage in galleryImages"
        :key="galleryImage.id"
        class="gallery-display m-4 hover:scale-105 transform transition-transform duration-300 relative rounded-xl overflow-hidden w-screen cursor-pointer"
        @click="handleGalleryClick(galleryImage)"
      >
        <div :class="{ flipped: galleryImage.flipped || galleryImage.matched }">
          <!-- This is the back of the card -->
          <img
            class="card-back absolute inset-0 w-full h-full object-cover"
            src="/images/kindtitle.webp"
            alt="Memory Card"
          >
          <!-- This is the front of the card -->
          <img
            class="card-front absolute inset-0 w-full h-full object-cover"
            :src="galleryImage.imagePath"
            :alt="galleryImage.galleryName"
          >
        </div>
      </div>
    </div>

    <!-- Game Controls -->
    <div
      class="game-controls mt-4 flex flex-col items-center space-y-2"
      aria-live="polite"
      role="status"
    >
      <div
        v-if="notification"
        :class="notificationClasses"
      >
        {{ notification.message }}
      </div>
      <div>Score: {{ score }}</div>
      <div>High Score: {{ highScore }}</div>
      <div
        v-if="gameWon"
        class="mt-2 space-y-2 text-center"
      >
        Congratulations! You've won!
        <button
          class="btn btn-info mt-2 px-4 py-2 bg-blue-500 text-default rounded hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200 transition-colors"
          @click="resetGame"
        >
          Play Again?
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles related to card flipping animations and structure, since Tailwind does not directly cover 3D transforms and backface-visibility */
.gallery-display {
  transform-style: preserve-3d;
  width: 200px;
  height: 200px;
  margin: 0.5rem;
}

img {
  backface-visibility: hidden;
  transition: transform 0.3s;
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: transform 0.7s;
  border-radius: 12px;
}

.card-front {
  transform: rotateY(180deg);
}

.card-back {
  transform: rotateY(0deg);
}

.flipped .card-front {
  transform: rotateY(0deg);
}

.flipped .card-back {
  transform: rotateY(-180deg);
}

/* Loader styles */
.loader {
  display: inline-block;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #2563eb;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Media query for responsiveness */
@media (min-width: 1024px) {
  .grid-cols-3 .gallery-display {
    width: 120px;
    height: 168px;
  }

  .grid-cols-5 .gallery-display {
    width: 100px;
    height: 140px;
  }

  .grid-cols-7 .gallery-display {
    width: 90px;
    height: 126px;
  }
}
</style>

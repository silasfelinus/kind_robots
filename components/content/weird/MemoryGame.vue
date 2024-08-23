<template>
  <div
    class="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center space-y-6"
  >
    <div
      class="w-full flex flex-col md:flex-row justify-between space-y-6 md:space-y-0 md:space-x-6"
    >
      <!-- Left Column for Leaderboard -->
      <div class="md:w-1/2">
        <match-leaderboard />
      </div>
      <!-- Right Column for Title, Instructions, and Controls -->
      <div class="md:w-1/2 space-y-4">
        <header class="text-center md:text-left space-y-2">
          <h1 class="text-4xl font-bold">Kind Robots Memory Game</h1>
          <p class="text-gray-600">Match the images and test your memory!</p>
        </header>
        <div class="difficulty-controls space-y-2">
          <label for="difficulty" class="block">Select Difficulty:</label>
          <select
            id="difficulty"
            v-model="selectedDifficulty"
            class="mt-1 block w-full"
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
            class="rounded-xl text-white bg-blue-500 p-2 mt-1 border border-transparent hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 w-full"
            @click="resetGame"
          >
            Start New Game
          </button>
          <milestone-reward v-if="shouldShowMilestoneCheck" :id="5" />
        </div>
      </div>
    </div>

    <!-- Game Board Section -->
    <div class="game-board flex flex-wrap justify-center gap-4">
      <div v-if="isLoading" class="loader mt-4"></div>
      <div
        v-for="galleryImage in galleryImages"
        :key="galleryImage.id"
        class="gallery-display m-2 hover:scale-105 transform transition-transform duration-300 relative rounded-xl overflow-hidden cursor-pointer"
        :class="{ flipped: galleryImage.flipped || galleryImage.matched }"
        :style="{
          width: `${layout.cardSize}px`,
          height: `${layout.cardSize}px`,
        }"
        @click="handleGalleryClick(galleryImage)"
      >
        <img
          class="card-back absolute inset-0 w-full h-full object-cover"
          src="/images/kindtitle.webp"
          alt="Memory Card"
        />
        <img
          class="card-front absolute inset-0 w-full h-full object-cover"
          :src="galleryImage.imagePath"
          :alt="galleryImage.galleryName"
        />
      </div>
    </div>

    <div class="game-controls mt-4 flex flex-col items-center space-y-2">
      <div v-if="notification" :class="notificationClasses">
        {{ notification.message }}
      </div>
      <div>Score: {{ score }}</div>
      <div>High Score: {{ highScore }}</div>
      <div v-if="gameWon" class="mt-2 space-y-2 text-center">
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

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import confetti from 'canvas-confetti'
import { useUserStore } from '../../../stores/userStore'

const layout = computed(() => {
  const idealCardWidth = 150 // Ideal width for each card
  const maxCardWidth = 200 // Maximum width each card can have
  const cardWidth = Math.min(maxCardWidth, Math.max(100, idealCardWidth))
  return { cardSize: cardWidth }
})

const numberOfCards = computed(() => selectedDifficulty.value.value * 2)

const userStore = useUserStore()
const user = computed(() => userStore.user)
const matchRecord = computed(() => userStore.matchRecord)

interface GalleryImage {
  id: number
  galleryName: string
  imagePath: string
  flipped: boolean
  matched: boolean
}

interface CustomNotification {
  type: 'error' | 'info'
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
  { label: 'Expert', value: 24 },
]
const selectedDifficulty = ref(difficulties[1]) // Default to 'Medium'
const gameWon = ref(false)
const notification = ref<CustomNotification | null>(null)
const shouldShowMilestoneCheck = ref(false)
const isLoading = ref(true)

const pairsNeeded = computed(() =>
  Math.min(
    selectedDifficulty.value.value / 2,
    Math.floor(numberOfCards.value / 2),
  ),
)

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

    const response = await fetch(
      `/api/galleries/random/count/${pairsNeeded.value}`,
    )
    const data = await response.json()

    if (data.images.length !== pairsNeeded.value) {
      throw new Error('Received an unexpected number of images.')
    }

    galleryImages.value = [...data.images, ...data.images]
      .map((image, index) => ({
        id: index,
        galleryName: '',
        imagePath: image,
        flipped: false,
        matched: false,
      }))
      .sort(() => 0.5 - Math.random())

    isLoading.value = false
  } catch (error) {
    isLoading.value = false
    console.error('Error generating images:', error)
    notification.value = {
      type: 'error',
      message: 'Error generating images. Please try again later.',
    }
  }
}

const score = ref(0)
function handleGalleryClick(clickedGallery: GalleryImage) {
  if (clickedGallery.flipped || clickedGallery.matched) return

  clickedGallery.flipped = true

  if (!firstSelected) {
    firstSelected = clickedGallery
  } else if (
    firstSelected &&
    firstSelected.imagePath === clickedGallery.imagePath
  ) {
    clickedGallery.matched = true
    firstSelected.matched = true
    score.value += 10

    setTimeout(() => {
      firstSelected = null
    }, 500)

    if (galleryImages.value.every((g) => g.matched)) {
      gameWon.value = true
      triggerConfetti()
      if (matchRecord.value < score.value || matchRecord.value === null) {
        userStore.updateMatchRecord(score.value)
      }
      if (score.value >= 50) {
        shouldShowMilestoneCheck.value = true
      }
      if (score.value > highScore.value || score.value > matchRecord.value) {
        highScore.value = score.value
        if (typeof window !== 'undefined') {
          localStorage.setItem('highScore', highScore.value.toString())
        }
      }
    }
  } else {
    score.value -= 5

    setTimeout(() => {
      clickedGallery.flipped = false
      if (firstSelected) {
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

<style scoped>
.loader {
  @apply inline-block rounded-full text-blue-500;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
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

/* You may need to keep custom styles for 3D card flipping */
.gallery-display {
  transform-style: preserve-3d;
  transition: transform 0.3s;
}

.card-front,
.card-back {
  @apply absolute inset-0 w-full h-full;
  backface-visibility: hidden;
  transition: transform 0.7s;
  border-radius: 0.75rem; /* Equivalent to 12px */
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
</style>

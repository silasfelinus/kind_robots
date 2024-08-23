<template>
  <div
    class="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center space-y-6"
  >
    <header class="text-center space-y-2">
      <h1 class="text-4xl font-bold">Kind Robots Memory Game</h1>
      <p class="text-gray-600">Match the images and test your memory!</p>
      <match-leaderboard />
      <div class="difficulty-controls">
        <label for="difficulty">Select Difficulty: </label>
        <select id="difficulty" v-model="selectedDifficulty">
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
        <milestone-reward v-if="shouldShowMilestoneCheck" :id="5" />
      </div>
    </header>
    <div
      class="game-board"
      :style="{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }"
    >
      <div v-if="isLoading" class="loader mt-4" />
      <div
        v-for="galleryImage in galleryImages"
        :key="galleryImage.id"
        class="gallery-display m-4 hover:scale-105 transform transition-transform duration-300 relative rounded-xl overflow-hidden w-screen cursor-pointer"
        :style="{
          width: layout.cardSize + 'px',
          height: layout.cardSize + 'px',
        }"
        @click="handleGalleryClick(galleryImage)"
      >
        <div :class="{ flipped: galleryImage.flipped || galleryImage.matched }">
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
import { useWindowSize } from '@vueuse/core'

const { width, height } = useWindowSize()

const layout = computed(() => {
  const maxWidth = 200 // max width each card can have
  const minWidth = 100 // minimum width for each card
  const desiredCardWidth = 150 // initially desired width for each card
  const availableWidth = width.value - 32 // subtracting some margin, adjust as needed

  let columns = Math.floor(availableWidth / desiredCardWidth)
  let cardWidth = Math.max(
    minWidth,
    Math.min(maxWidth, Math.floor(availableWidth / columns)),
  )

  // Adjust columns if cardWidth hits its max width and still overflows
  if (cardWidth === maxWidth && maxWidth * columns > availableWidth) {
    columns = Math.floor(availableWidth / maxWidth)
    cardWidth = maxWidth
  }

  return { columns, cardSize: cardWidth }
})

const rows = computed(() => Math.floor(height.value / layout.value.cardSize))
const numberOfCards = computed(() => rows.value * layout.value.columns)

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
watch(layout.value, () => {
  console.log('Computed card size:', layout.value.cardSize)
  console.log('Computed columns:', layout.value.columns)
})
</script>

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

.container {
  display: grid;
  gap: 20px;
  width: 100%;
  height: 100%;
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
  .game-board {
    grid-template-columns: repeat(
      auto-fill,
      minmax(120px, 1fr)
    ); /* Example adjustment */
  }
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

.game-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--card-size), 1fr));
  gap: 1rem;
}
</style>

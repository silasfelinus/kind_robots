<!-- /components/content/weird/memory-game.vue -->
<template>
  <div class="container mx-auto flex flex-col h-full space-y-4 no-scrollbar">
    <!-- Top Section: Leaderboard and Difficulty Selection -->
    <div class="flex justify-between w-full">
      <!-- Leaderboard Section -->
      <div class="leaderboard-container justify-center w-full md:w-1/2">
        <match-leaderboard />
      </div>

      <!-- Game Controls Section -->
      <div
        class="controls-container w-full md:w-1/3 p-4 rounded-lg text-center"
      >
        <h1 class="text-lg font-bold mb-2">Kind Robots Memory Game</h1>
        <p class="text-gray-600 mb-4">Match the images and test your memory!</p>

        <label for="difficulty" class="block mb-2">Select Difficulty:</label>
        <select
          id="difficulty"
          v-model="selectedDifficulty"
          class="mb-2 p-2 w-full border border-gray-300 rounded"
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
          class="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          @click="resetGame"
        >
          Start New Game
        </button>
      </div>
    </div>

    <!-- Game Board Section: Takes up remaining space -->
    <div
      class="game-board-container flex-1 overflow-y-auto flex justify-center items-center"
    >
      <div class="game-board grid gap-4" :style="gameBoardStyle">
        <div v-if="isLoading" class="loader"></div>
        <div
          v-for="galleryImage in galleryImages"
          :key="galleryImage.id"
          class="gallery-display hover:scale-105 transform transition-transform duration-300 relative rounded-xl overflow-hidden cursor-pointer"
          :style="{ width: cardSize + 'px', height: cardSize + 'px' }"
          @click="handleGalleryClick(galleryImage)"
        >
          <div
            :class="{ flipped: galleryImage.flipped || galleryImage.matched }"
          >
            <!-- Card Back -->
            <img
              class="card-back absolute inset-0 w-full h-full object-cover"
              src="/images/kindtitle.webp"
              alt="Memory Card"
            />
            <!-- Card Front -->
            <img
              class="card-front absolute inset-0 w-full h-full object-cover"
              :src="galleryImage.imagePath"
              :alt="galleryImage.galleryName"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Game End / Score Section -->
    <div class="game-controls text-center p-4">
      <div v-if="notification" :class="notificationClasses">
        {{ notification.message }}
      </div>
      <div>Score: {{ score }}</div>
      <div>High Score: {{ highScore }}</div>
      <div v-if="gameWon" class="mt-4">
        <p>Congratulations! You've won!</p>
        <button
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          @click="resetGame"
        >
          Play Again?
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import confetti from 'canvas-confetti'
import { useUserStore } from '../../stores/userStore'

const windowSize = useState(() => ({
  width: import.meta.client ? window.innerWidth : 0,
  height: import.meta.client ? window.innerHeight : 0,
}))

if (import.meta.client) {
  window.addEventListener('resize', () => {
    windowSize.value = {
      width: window.innerWidth,
      height: window.innerHeight,
    }
  })
}

// Extract width and height for local usage
const width = computed(() => windowSize.value.width)
const height = computed(() => windowSize.value.height)

const milestoneStore = useMilestoneStore()

const difficulties = [
  { label: 'Easy', value: 8 },
  { label: 'Medium', value: 12 },
  { label: 'Hard', value: 16 },
  { label: 'Expert', value: 24 },
]
const selectedDifficulty = ref(difficulties[0])

// reduce last two numbes for baseSize and minSize to reduce cards
const cardSize = computed(() => {
  const numPairs = selectedDifficulty.value.value
  const baseSize = width.value > 768 ? 160 : 80 // Larger base size for wider screens
  const minSize = width.value > 768 ? 100 : 60 // Minimum size for cards
  const sizeReduction = (numPairs / 8) * (width.value > 768 ? 8 : 4) // Larger reduction on wider screens
  const heightReduction = height.value < 600 ? 10 : 0 // Reduce further if height is constrained

  return Math.max(minSize, baseSize - sizeReduction - heightReduction)
})

interface GalleryImage {
  id: number
  galleryName: string
  imagePath: string
  flipped: boolean
  matched: boolean
}

const gameBoardStyle = computed(() => {
  const numPairs = selectedDifficulty.value.value
  const columns = Math.min(numPairs, 4)
  return {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
  }
})

const galleryImages = ref<GalleryImage[]>([])
const gameWon = ref(false)
const isLoading = ref(true)
const userStore = useUserStore()

const numberOfCards = computed(() => selectedDifficulty.value.value * 2)

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

const notification = ref<CustomNotification | null>(null)
const shouldShowMilestoneCheck = ref(false)

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
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const data = await response.json()

    // Check for success and that data is an array
    if (!data.success || !Array.isArray(data.data)) {
      throw new Error(data.message || 'Failed to fetch images.')
    }

    // Use the data array directly
    galleryImages.value = [...data.data, ...data.data]
      .map((image, index) => ({
        id: index,
        galleryName: '',
        imagePath: typeof image === 'string' ? image : '',
        flipped: false,
        matched: false,
      }))
      .sort(() => 0.5 - Math.random())

    isLoading.value = false
  } catch (error) {
    isLoading.value = false
    notification.value = {
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred. Please try again later.',
    }
    console.error('Error generating images:', error)
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

      // Set default value of 0 for matchRecord if it is null
      const currentMatchRecord = matchRecord.value ?? 0

      if (currentMatchRecord < score.value) {
        milestoneStore.updateMatchRecord(score.value)
      }

      if (score.value >= 50) {
        milestoneStore.rewardMilestone(5)
      }

      // Ensure highScore and matchRecord have default values for comparison
      if (
        score.value > (highScore.value ?? 0) ||
        score.value > currentMatchRecord
      ) {
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
.container {
  display: grid;
  gap: 20px;
  width: 100%;
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
.gallery-display {
  transform-style: preserve-3d;
}

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
</style>

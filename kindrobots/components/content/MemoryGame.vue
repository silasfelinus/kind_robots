<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'

// Define gallery image structure
interface GalleryImage {
  id: number
  galleryName: string
  imagePath: string
  flipped: boolean
  matched: boolean
}

function isClientSide() {
  return typeof window !== 'undefined'
}

const galleryImages = ref<GalleryImage[]>([])
const difficulty = ref(8)
const score = ref(0)
const gameWon = ref(false)
interface Notification {
  message: string
  type: string
}

const notification = ref<Notification | null>(null)

const highScore = ref<number>(
  isClientSide() && localStorage.getItem('highScore')
    ? parseInt(localStorage.getItem('highScore')!)
    : 0
)

let firstSelected: GalleryImage | null = null

const gridClass = computed(() => {
  switch (difficulty.value) {
    case 9:
      return 'grid grid-cols-3 gap-4'
    case 25:
      return 'grid grid-cols-5 gap-4'
    case 35:
      return 'grid grid-cols-7 gap-5'
    default:
      return 'grid grid-cols-3 gap-4'
  }
})

function isCenter(id: number): boolean {
  switch (difficulty.value) {
    case 9:
      return id === 4
    case 25:
      return id === 12
    case 35:
      return id === 17
    default:
      return false
  }
}

async function generateMemoryGameImages() {
  try {
    gameWon.value = false

    // Directly fetch the images based on the difficulty
    const imageCount = difficulty.value
    const imagesResponse = await fetch(`/api/gallery/random/images/${imageCount}`)
    const imagePaths: string[] = await imagesResponse.json()

    // Check if we received the expected amount of images
    if (imagePaths.length !== imageCount) {
      throw new Error('Received an unexpected number of images.')
    }

    galleryImages.value = JSON.parse(
      JSON.stringify(
        imagePaths
          .map((imagePath, index) => ({
            id: index,
            galleryName: '', // You might need to adjust this based on the new response format
            imagePath: '/images/fulltitle.png', // Placeholder image
            alternateImagePath: imagePath,
            flipped: false,
            matched: false
          }))
          .concat(
            imagePaths.map((imagePath, index) => ({
              id: index + imageCount, // To ensure unique ids
              galleryName: '', // Adjust as needed
              imagePath: '/images/fulltitle.png', // Placeholder image
              alternateImagePath: imagePath,
              flipped: false,
              matched: false
            }))
          )
          .sort(() => 0.5 - Math.random())
      )
    )
  } catch (error) {
    console.error('Error generating images:', error)
    notification.value = {
      type: 'error',
      message: 'Error generating images. Please try again later.'
    }
  }
}

function handleGalleryClick(clickedGallery: GalleryImage) {
  if (clickedGallery.flipped || clickedGallery.matched) return

  clickedGallery.flipped = true
  score.value++

  if (!firstSelected) {
    firstSelected = clickedGallery
  } else if (firstSelected && firstSelected.galleryName === clickedGallery.galleryName) {
    clickedGallery.matched = true
    if (firstSelected) firstSelected.matched = true

    if (galleryImages.value.every((g) => g.matched)) {
      gameWon.value = true

      if (score.value < highScore.value || highScore.value === 0) {
        highScore.value = score.value
        if (isClientSide()) {
          localStorage.setItem('highScore', highScore.value.toString())
        }
      }
    }
  } else {
    setTimeout(() => {
      clickedGallery.flipped = false
      if (firstSelected) {
        firstSelected.flipped = false
        firstSelected = null
      }
    }, 500)
  }
}

// Reset game state
function resetGame() {
  score.value = 0
  firstSelected = null
  generateMemoryGameImages()
}

onMounted(generateMemoryGameImages)
watch(difficulty, resetGame)
</script>

<template>
  <div class="container mx-auto p-4">
    <div class="game-board flex flex-col items-center justify-center">
      <!-- Galleries Display -->
      <div :class="gridClass">
        <!-- Game Controls (Centered) -->
        <div
          v-if="isCenter(galleryImages.length / 2)"
          class="game-controls center-card border border-blue-300 rounded-full shadow-lg"
        >
          <div class="mb-4 text-xl font-bold">Memory Game</div>
          <div v-if="notification" :class="`notification ${notification.type}`">
            {{ notification.message }}
          </div>
          <div>Score: {{ score }}</div>
          <div>High Score: {{ highScore }}</div>
          <div v-if="gameWon" class="mt-2">
            Congratulations! You've won!
            <button class="btn btn-info" @click="resetGame">Play Again?</button>
          </div>
        </div>

        <!-- Gallery Images -->
        <div
          v-for="galleryImage in galleryImages"
          :key="galleryImage.id"
          class="gallery-display transform transition-transform duration-500"
          @click="handleGalleryClick(galleryImage)"
        >
          <img
            v-if="!galleryImage.flipped && !galleryImage.matched"
            src="/images/kindtitle.webp"
            alt="Memory Card"
            class="w-full h-full object-cover"
          />
          <img
            v-if="galleryImage.flipped || galleryImage.matched"
            :alt="galleryImage.galleryName"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-display {
  cursor: pointer;
  overflow: hidden;
  border: 2px solid transparent;
  transition:
    border-color 0.3s,
    transform 0.3s;
  perspective: 2000px;
  border-radius: 12px; /* Rounded corners */
}

.gallery-display:hover {
  transform: scale(1.05);
  border-color: #2563eb; /* Blue border on hover */
}

img {
  border-radius: 12px; /* Rounded corners for images */
  transition: transform 0.3s;
}

.win-message {
  background-color: #f3f4f6; /* Light gray background */
  padding: 1rem;
  border: 1px solid #d1d5db; /* Gray border */
  border-radius: 0.5rem;
}

.game-board {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.center-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.gallery-display {
  transform-style: preserve-3d;
}

img {
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.gallery-display:hover img {
  transform: rotateY(180deg);
}
</style>

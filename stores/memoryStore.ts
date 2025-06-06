// /stores/memoryStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from './userStore'
import { useMilestoneStore } from './milestoneStore'
import confetti from 'canvas-confetti'
import { useDisplayStore } from './displayStore'

const displayStore = useDisplayStore()

interface GalleryImage {
  id: number
  galleryName: string
  imagePath: string
  flipped: boolean
  matched: boolean
}

interface DifficultyOption {
  label: string
  value: number
}

interface CustomNotification {
  type: 'error' | 'info'
  message: string
}

export const useMemoryStore = defineStore('memoryStore', () => {
  const userStore = useUserStore()
  const milestoneStore = useMilestoneStore()

  const difficulties: DifficultyOption[] = [
    { label: 'Easy', value: 8 },
    { label: 'Medium', value: 12 },
    { label: 'Hard', value: 16 },
    { label: 'Expert', value: 24 },
  ]

  const selectedDifficulty = ref<DifficultyOption>(difficulties[0])
  const galleryImages = ref<GalleryImage[]>([])
  const gameWon = ref(false)
  const isLoading = ref(true)
  const score = ref(0)
  const highScore = ref(0)
  const notification = ref<CustomNotification | null>(null)
  let firstSelected: GalleryImage | null = null
  const matchRecord = computed(() => userStore.matchRecord)

  const numberOfCards = computed(() => selectedDifficulty.value.value * 2)

  const pairsNeeded = computed(() =>
    Math.min(
      selectedDifficulty.value.value / 2,
      Math.floor(numberOfCards.value / 2),
    ),
  )

const cardSize = computed(() => {
  const screen = displayStore.viewportSize
  const difficulty = selectedDifficulty.value.label
  const isBig = displayStore.bigMode

  const sizeMap: Record<
    string,
    Record<'small' | 'medium' | 'large' | 'extraLarge', number>
  > = {
    Easy: {
      small: 90,
      medium: 100,
      large: 110,
      extraLarge: 130,
    },
    Medium: {
      small: 80,
      medium: 90,
      large: 100,
      extraLarge: 120,
    },
    Hard: {
      small: 70,
      medium: 80,
      large: 90,
      extraLarge: 110,
    },
    Expert: {
      small: 60,
      medium: 70,
      large: 80,
      extraLarge: 100,
    },
  }

  const baseSize = sizeMap[difficulty]?.[screen] || 90
  return isBig ? Math.round(baseSize * 1.2) : baseSize
})


  const gameBoardStyle = computed(() => {
    const columns = Math.min(numberOfCards.value, 9)
    return {
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
    }
  })

  const notificationClasses = computed(() => {
    const base = 'notification py-2 px-4 rounded-lg mb-2'
    if (!notification.value) return base
    return notification.value.type === 'error'
      ? `${base} bg-red-200 text-red-700`
      : `${base} bg-green-200 text-green-700`
  })

  function triggerConfetti() {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
  }

  async function generateMemoryGameImages() {
    try {
      isLoading.value = true
      gameWon.value = false

      const res = await fetch(
        `/api/galleries/random/count/${pairsNeeded.value}`,
      )
      const data = await res.json()

      if (!data.success || !Array.isArray(data.data)) {
        throw new Error(data.message || 'Failed to load images')
      }

      galleryImages.value = [...data.data, ...data.data]
        .map((image: string, index: number) => ({
          id: index,
          galleryName: '',
          imagePath:
            typeof image === 'string'
              ? image.startsWith('http') || image.startsWith('/')
                ? image
                : `/images/gallery/${image}`
              : '',
          flipped: false,
          matched: false,
        }))
        .sort(() => 0.5 - Math.random())

      isLoading.value = false
    } catch (error: any) {
      isLoading.value = false
      notification.value = {
        type: 'error',
        message: error.message || 'An unknown error occurred',
      }
    }
  }

  function handleGalleryClick(card: GalleryImage) {
    if (card.flipped || card.matched) return

    card.flipped = true
    if (!firstSelected) {
      firstSelected = card
    } else if (firstSelected.imagePath === card.imagePath) {
      card.matched = true
      firstSelected.matched = true
      score.value += 10

      setTimeout(() => {
        firstSelected = null
        checkForWin()
      }, 500)
    } else {
      score.value -= 5
      setTimeout(() => {
        card.flipped = false
        if (firstSelected) firstSelected.flipped = false
        firstSelected = null
      }, 500)
    }
  }

  function checkForWin() {
    if (galleryImages.value.every((g) => g.matched)) {
      gameWon.value = true
      triggerConfetti()

      const currentMatchRecord = matchRecord.value ?? 0

      if (score.value > (highScore.value ?? 0)) {
        highScore.value = score.value
        if (typeof window !== 'undefined') {
          localStorage.setItem('highScore', score.value.toString())
        }
      }

      if (score.value > currentMatchRecord) {
        milestoneStore.updateMatchRecord(score.value)
      }

      if (score.value >= 50) {
        milestoneStore.rewardMilestone(5)
      }
    }
  }

  function resetGame() {
    galleryImages.value.forEach((img) => {
      img.flipped = false
      img.matched = false
    })
    score.value = 0
    firstSelected = null
    generateMemoryGameImages()
  }

  onMounted(() => {
    const saved = localStorage.getItem('highScore')
    if (saved) highScore.value = Number(saved)
    generateMemoryGameImages()
  })

  watch(selectedDifficulty, resetGame)

  return {
    difficulties,
    selectedDifficulty,
    galleryImages,
    gameWon,
    isLoading,
    score,
    highScore,
    cardSize,
    gameBoardStyle,
    notification,
    notificationClasses,
    handleGalleryClick,
    resetGame,
  }
})

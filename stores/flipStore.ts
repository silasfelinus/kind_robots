// /stores/flipStore.ts
import { defineStore } from 'pinia'
import { reactive, ref, computed } from 'vue'
import { useErrorStore, ErrorType } from './errorStore'

export interface FlipTileView {
  id: string
  index: number
  style: Record<string, string>
}

interface FlipConfig {
  rows: number
  cols: number
}

type FlipDirection = 'forward' | 'backward'

export const useFlipStore = defineStore('flipStore', () => {
  const errorStore = useErrorStore()

  const config = reactive<FlipConfig>({
    rows: 6,
    cols: 2,
  })

  const tiles = ref<FlipTileView[]>([])
  const flipped = ref<boolean[]>([])
  const isAnimating = ref(false)
  const isPrepared = ref(false)
  const isShowingFirstImage = ref(true)

  const activeTimeouts = ref<ReturnType<typeof setTimeout>[]>([])

  const tileCount = computed(() => config.rows * config.cols)
  const hasTiles = computed(() => tiles.value.length === tileCount.value)

  const logError = (error: unknown, context: string) => {
    const message =
      error instanceof Error ? `${context}: ${error.message}` : context
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }

  const buildTiles = () => {
    try {
      const results: FlipTileView[] = []
      const nextFlipped: boolean[] = []

      const { rows, cols } = config

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const index = row * cols + col

          const colLeft = (col / cols) * 100
          const colRight = ((cols - col - 1) / cols) * 100
          const rowTop = (row / rows) * 100
          const rowBottom = ((rows - row - 1) / rows) * 100

          const style: Record<string, string> = {
            '--col-left': `${colLeft}%`,
            '--col-right': `${colRight}%`,
            '--row-top': `${rowTop}%`,
            '--row-bottom': `${rowBottom}%`,
            '--flip-back-has-image': '0',
          }

          results.push({
            id: `tile-${row}-${col}`,
            index,
            style,
          })

          nextFlipped[index] = false
        }
      }

      tiles.value = results
      flipped.value = nextFlipped
      isPrepared.value = true
    } catch (error) {
      logError(error, 'Failed to build flip tiles')
    }
  }

  const ensureTiles = () => {
    if (!hasTiles.value) {
      buildTiles()
    }
  }

  const clearTimers = () => {
    if (activeTimeouts.value.length === 0) return
    activeTimeouts.value.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    activeTimeouts.value = []
  }

  const resetFlip = () => {
    clearTimers()
    flipped.value = Array(tileCount.value).fill(false)
    isAnimating.value = false
    isPrepared.value = false
    isShowingFirstImage.value = true
  }

  const setConfig = (rows: number, cols: number) => {
    try {
      config.rows = Math.max(2, rows)
      config.cols = Math.max(1, cols)
      buildTiles()
    } catch (error) {
      logError(error, 'Failed to update flip configuration')
    }
  }

  const setBackImages = (images: (string | null | undefined)[]) => {
    try {
      ensureTiles()
      const count = tileCount.value

      for (let index = 0; index < count; index += 1) {
        const tile = tiles.value[index]
        const image = images[index]
        if (!tile) continue

        if (image) {
          tile.style['--flip-image-back'] = `url("${image}")`
          tile.style['--flip-back-has-image'] = '1'
        } else {
          delete tile.style['--flip-image-back']
          tile.style['--flip-back-has-image'] = '0'
        }
      }
    } catch (error) {
      logError(error, 'Failed to set flip back images')
    }
  }

  const getFlipOrder = () => {
    const order: number[] = []
    const { rows, cols } = config

    for (let col = cols - 1; col >= 0; col -= 1) {
      for (let row = 0; row < rows; row += 1) {
        const index = row * cols + col
        order.push(index)
      }
    }

    return order
  }

  const runFlip = (direction: FlipDirection) => {
    try {
      if (isAnimating.value) return

      ensureTiles()

      const baseOrder = getFlipOrder()
      const order =
        direction === 'forward' ? baseOrder : [...baseOrder].reverse()
      const baseDelay = 80

      order.forEach((index, position) => {
        const timeoutId = setTimeout(() => {
          flipped.value[index] = direction === 'forward'

          if (position === order.length - 1) {
            isAnimating.value = false
            isShowingFirstImage.value = direction !== 'forward'
          }
        }, position * baseDelay)

        activeTimeouts.value.push(timeoutId)
      })

      isAnimating.value = true
    } catch (error) {
      logError(error, 'Failed to run flip animation')
    }
  }

  const flipForward = () => {
    if (!isShowingFirstImage.value) return
    runFlip('forward')
  }

  const flipBackward = () => {
    if (isShowingFirstImage.value) return
    runFlip('backward')
  }

  const toggleFlip = () => {
    if (isShowingFirstImage.value) {
      flipForward()
    } else {
      flipBackward()
    }
  }

  return {
    config,
    tiles,
    flipped,
    tileCount,
    isAnimating,
    isPrepared,
    isShowingFirstImage,
    setConfig,
    setBackImages,
    resetFlip,
    flipForward,
    flipBackward,
    toggleFlip,
    buildTiles,
  }
})

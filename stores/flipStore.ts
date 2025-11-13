// /stores/flipStore.ts
/**
 * Flip animation overview for future helpers:
 *
 * - This store controls a split flap style vertical flip animation, like an airport or train board.
 * - config.rows represents visual rows of the panel. For example, 6 rows of content.
 * - The actual flipping tiles are segments between rows, not the rows themselves.
 *   - If rows = 6, there are 5 segment rows:
 *     - segment 0 spans visual rows 0 and 1
 *     - segment 1 spans visual rows 1 and 2
 *     - segment 2 spans visual rows 2 and 3
 *     - segment 3 spans visual rows 3 and 4
 *     - segment 4 spans visual rows 4 and 5
 * - Each FlipTileView represents one of these segments for a given column:
 *   - It is absolutely positioned using CSS vars:
 *     - --col-left, --col-right for horizontal clipping
 *     - --row-top, --row-bottom for vertical clipping
 *   - The tile is twice as tall as a single visual row, so when it rotates it behaves like a hinge
 *     between the two rows it spans.
 *
 * Image responsibilities:
 * - The front face uses --flip-image-front and always shows the current full image.
 *   Clipping is handled by the geometry of each tile.
 * - The back face uses --flip-image-back and --flip-back-has-image (0 or 1).
 *   Callers are responsible for writing the collage pattern into tile.style:
 *   for example, alternating logo rows with a special bottom row derived from the next image.
 *
 * Animation flow in runFlip:
 * - Tiles are indexed as segmentRow * cols + col.
 * - getFlipOrder returns indices ordered by column then segmentRow:
 *   - Right column first, from top segment to bottom segment.
 *   - Then left column, from top segment to bottom segment.
 * - runFlip walks that order with a baseDelay per tile and toggles flipped[index]
 *   to true (forward) or false (backward).
 * - Higher level components:
 *   - swap the background panel image just before the animation
 *   - set tile.style variables (front and back images)
 *   - call flipForward, flipBackward, or toggleFlip to run the sequence.
 */

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

  const segmentRows = computed(() => {
    const safeRows = Math.max(config.rows, 2)
    return safeRows - 1
  })

  const tileCount = computed(() => segmentRows.value * config.cols)

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
      const segRows = segmentRows.value
      const rowHeight = 100 / rows

      for (let seg = 0; seg < segRows; seg += 1) {
        for (let col = 0; col < cols; col += 1) {
          const index = seg * cols + col

          const colLeft = (col / cols) * 100
          const colRight = ((cols - col - 1) / cols) * 100

          const top = rowHeight * seg
          const height = rowHeight * 2
          const bottom = 100 - (top + height)

          const style: Record<string, string> = {
            '--col-left': `${colLeft}%`,
            '--col-right': `${colRight}%`,
            '--row-top': `${top}%`,
            '--row-bottom': `${bottom}%`,
            '--flip-back-has-image': '0',
          }

          results.push({
            id: `tile-${seg}-${col}`,
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
    const segRows = segmentRows.value
    const { cols } = config

    for (let col = cols - 1; col >= 0; col -= 1) {
      for (let seg = 0; seg < segRows; seg += 1) {
        const index = seg * cols + col
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
    segmentRows,
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

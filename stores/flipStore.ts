// /stores/flipStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useErrorStore, ErrorType } from './errorStore'

export type FlipStatus = 'ready' | 'animating'

export type FlipPart = 'full' | 'top' | 'bottom'

export interface FlipGridConfig {
  rows: number
  cols: number
  staggerMs: number
  durationMs: number
}

export interface FlipCell {
  id: string
  row: number
  col: number
  delayMs: number
  done: boolean
}

const clampInt = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.floor(value)))

const pct = (value: number) => `${value}%`

const makeCellId = (row: number, col: number) => `r${row}c${col}`

const posPct = (index: number, count: number) => {
  if (count <= 1) return 0
  return (index / (count - 1)) * 100
}

export const useFlipStore = defineStore('flipStore', () => {
  const errorStore = useErrorStore()

  const status = ref<FlipStatus>('ready')

  const images = ref<string[]>([
    '/images/backtree.webp',
    '/images/botcafe.webp',
  ])
  const currentIndex = ref<number>(0)
  const nextIndex = ref<number>(1)

  const grid = ref<FlipGridConfig>({
    rows: 3,
    cols: 6,
    staggerMs: 35,
    durationMs: 700,
  })

  const cells = ref<FlipCell[]>([])
  const completedCount = ref<number>(0)

  const isAnimating = computed(() => status.value === 'animating')

  const currentSrc = computed(() => images.value[currentIndex.value] || '')
  const nextSrc = computed(() => images.value[nextIndex.value] || '')

  const totalCells = computed(() => grid.value.rows * grid.value.cols)

  const ariaLabel = computed(() =>
    isAnimating.value
      ? 'Animating flip-board grid'
      : 'Click to flip the grid and reveal the next image',
  )

  const ensureGrid = (rows: number, cols: number) => {
    const r = clampInt(rows, 1, 40)
    const c = clampInt(cols, 1, 40)

    grid.value.rows = r
    grid.value.cols = c

    const nextCells: FlipCell[] = []
    let i = 0

    for (let row = 0; row < r; row++) {
      for (let col = 0; col < c; col++) {
        const delayMs = i * Math.max(0, Math.floor(grid.value.staggerMs))
        nextCells.push({
          id: makeCellId(row, col),
          row,
          col,
          delayMs,
          done: false,
        })
        i++
      }
    }

    cells.value = nextCells
    completedCount.value = 0
  }

  const setImages = (srcs: string[], startIndex = 0) => {
    try {
      const cleaned = (srcs || [])
        .map((s) => `${s || ''}`.trim())
        .filter(Boolean)
      if (cleaned.length < 2) {
        errorStore.setError(
          ErrorType.INTERACTION_ERROR,
          'Flip board needs at least 2 images',
        )
        return
      }

      images.value = cleaned
      currentIndex.value = clampInt(startIndex, 0, cleaned.length - 1)
      nextIndex.value = (currentIndex.value + 1) % cleaned.length
      status.value = 'ready'
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to set flip images'
      errorStore.setError(ErrorType.INTERACTION_ERROR, message)
    }
  }

  const setGrid = (
    rows: number,
    cols: number,
    staggerMs?: number,
    durationMs?: number,
  ) => {
    try {
      if (typeof staggerMs === 'number')
        grid.value.staggerMs = Math.max(0, Math.floor(staggerMs))
      if (typeof durationMs === 'number')
        grid.value.durationMs = clampInt(durationMs, 200, 2000)
      ensureGrid(rows, cols)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to set grid'
      errorStore.setError(ErrorType.INTERACTION_ERROR, message)
    }
  }

  const cellDelayStyle = (cell: FlipCell) => ({
    '--flip-delay': `${cell.delayMs}ms`,
    '--flip-duration': `${grid.value.durationMs}ms`,
  })

  const sliceStyle = (src: string, row: number, col: number) => {
    const rows = grid.value.rows
    const cols = grid.value.cols

    const posX = posPct(col, cols)
    const posY = posPct(row, rows)

    return {
      backgroundImage: `url("${src}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${pct(cols * 100)} ${pct(rows * 100)}`,
      backgroundPosition: `${pct(posX)} ${pct(posY)}`,
    } as Record<string, string>
  }

  const sliceStyleBottomHalf = (src: string, row: number, col: number) => {
    const rows = grid.value.rows
    const cols = grid.value.cols

    const posX = posPct(col, cols)
    const posY = rows <= 1 ? 0 : ((row + 0.5) / (rows - 1)) * 100

    return {
      backgroundImage: `url("${src}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${pct(cols * 100)} ${pct(rows * 100)}`,
      backgroundPosition: `${pct(posX)} ${pct(posY)}`,
    } as Record<string, string>
  }

  const getCellStyle = (src: string, cell: FlipCell, part: FlipPart) => {
    if (part === 'full') return sliceStyle(src, cell.row, cell.col)
    if (part === 'top') return sliceStyle(src, cell.row, cell.col)
    return sliceStyleBottomHalf(src, cell.row, cell.col)
  }

  const startFlip = () => {
    try {
      if (isAnimating.value) return
      if (!currentSrc.value || !nextSrc.value) return
      if (!cells.value.length) ensureGrid(grid.value.rows, grid.value.cols)

      status.value = 'animating'
      completedCount.value = 0
      cells.value = cells.value.map((c) => ({ ...c, done: false }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start flip'
      errorStore.setError(ErrorType.INTERACTION_ERROR, message)
      status.value = 'ready'
    }
  }

  const markCellDone = (cellId: string) => {
    if (!isAnimating.value) return

    const idx = cells.value.findIndex((c) => c.id === cellId)
    if (idx === -1) return
    if (cells.value[idx].done) return

    cells.value[idx] = { ...cells.value[idx], done: true }
    completedCount.value++

    if (completedCount.value >= totalCells.value) {
      currentIndex.value = nextIndex.value
      nextIndex.value = (currentIndex.value + 1) % images.value.length
      status.value = 'ready'
    }
  }

  const toggleFlip = () => startFlip()

  ensureGrid(grid.value.rows, grid.value.cols)

  return {
    status,
    isAnimating,
    ariaLabel,
    images,
    currentIndex,
    nextIndex,
    currentSrc,
    nextSrc,
    grid,
    cells,
    setImages,
    setGrid,
    cellDelayStyle,
    getCellStyle,
    startFlip,
    markCellDone,
    toggleFlip,
  }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  makeSlidingTilePuzzle,
  restoreSlidingTilePuzzle,
  slideTile,
  utcPuzzleDay,
  type SlidingTileKeepsake,
  type SlidingTilePuzzle,
} from '~/utils/slidingTileGallery/engine'

const STORAGE_KEY = 'kr.slidingTileGallery.preview.v1'
const KEEP_LIMIT = 24

function currentDay() {
  return utcPuzzleDay(new Date())
}

function sanitizeKeepsakes(value: unknown): SlidingTileKeepsake[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  return value
    .filter((row): row is SlidingTileKeepsake => {
      if (!row || typeof row !== 'object') return false
      const keep = row as Partial<SlidingTileKeepsake>
      if (
        typeof keep.key !== 'string' ||
        typeof keep.day !== 'string' ||
        (keep.mode !== 'daily' && keep.mode !== 'practice') ||
        typeof keep.moves !== 'number' ||
        !Number.isInteger(keep.moves) ||
        keep.moves < 1 ||
        keep.moves > 100000 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(keep.day) ||
        seen.has(keep.key)
      )
        return false
      seen.add(keep.key)
      return true
    })
    .slice(0, KEEP_LIMIT)
}

export const useSlidingTileGalleryStore = defineStore(
  'slidingTileGallery',
  () => {
    const puzzle = ref<SlidingTilePuzzle>(makeSlidingTilePuzzle(currentDay()))
    const keepsakes = ref<SlidingTileKeepsake[]>([])
    const loaded = ref(false)
    let practiceCount = 0

    const solvedCount = computed(() => keepsakes.value.length)
    const canMove = (index: number) =>
      !puzzle.value.solved &&
      Math.abs(
        Math.floor(index / 3) - Math.floor(puzzle.value.tiles.indexOf(0) / 3),
      ) +
        Math.abs((index % 3) - (puzzle.value.tiles.indexOf(0) % 3)) ===
        1

    function persist() {
      if (!import.meta.client) return
      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            puzzle: puzzle.value,
            keepsakes: keepsakes.value,
          }),
        )
      } catch {
        // The board still plays in browsers with storage disabled.
      }
    }

    function initialize() {
      if (loaded.value) return
      loaded.value = true
      if (!import.meta.client) return
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const value: unknown = JSON.parse(saved)
          if (value && typeof value === 'object') {
            const object = value as { puzzle?: unknown; keepsakes?: unknown }
            keepsakes.value = sanitizeKeepsakes(object.keepsakes)
            const restored = restoreSlidingTilePuzzle(object.puzzle)
            if (
              restored &&
              (restored.mode === 'practice' || restored.day === currentDay())
            ) {
              puzzle.value = restored
            }
          }
        }
      } catch {
        // Malformed saved data starts a new puzzle without breaking the page.
      }
    }

    function move(index: number) {
      if (!canMove(index)) return false
      const before = puzzle.value
      puzzle.value = slideTile(before, index)
      if (before !== puzzle.value && puzzle.value.solved) {
        const completed: SlidingTileKeepsake = {
          key: puzzle.value.key,
          day: puzzle.value.day,
          mode: puzzle.value.mode,
          moves: puzzle.value.moves,
        }
        keepsakes.value = [
          completed,
          ...keepsakes.value.filter((row) => row.key !== completed.key),
        ].slice(0, KEEP_LIMIT)
      }
      persist()
      return true
    }

    function openDaily() {
      const day = currentDay()
      if (puzzle.value.key === `daily:${day}`) return
      puzzle.value = makeSlidingTilePuzzle(day)
      persist()
    }

    function restart() {
      const current = puzzle.value
      puzzle.value = makeSlidingTilePuzzle(
        current.day,
        current.mode,
        current.mode === 'practice'
          ? current.key.slice('practice:'.length)
          : '',
      )
      persist()
    }

    function newPractice() {
      practiceCount += 1
      puzzle.value = makeSlidingTilePuzzle(
        currentDay(),
        'practice',
        `${Date.now()}-${practiceCount}`,
      )
      persist()
    }

    return {
      puzzle,
      keepsakes,
      loaded,
      solvedCount,
      canMove,
      initialize,
      move,
      openDaily,
      restart,
      newPractice,
    }
  },
)

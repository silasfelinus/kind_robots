import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import {
  MAKER_SAVE_KEY,
  decodeMakerLevel,
  encodeMakerLevel,
  makerId,
  newMakerLevel,
  paintMakerTile,
  validateMakerLevel,
  type MakerLevel,
} from '~/utils/arcade/games/savePlumberMaker'

type Draft = { id: string; level: MakerLevel; updated: number }
type Library = { v: 1; drafts: Draft[] }
export type PlumberReview = {
  id: number
  rating: number
  comment: string | null
  username: string
  updatedAt: string | null
}
export type PlumberReviewSummary = {
  courseId: number | null
  average: number
  count: number
  myRating: number
  reviews: PlumberReview[]
}
const blankReviewSummary = (): PlumberReviewSummary => ({
  courseId: null,
  average: 0,
  count: 0,
  myRating: 0,
  reviews: [],
})
const clone = (level: MakerLevel): MakerLevel => ({
  ...level,
  rows: level.rows.slice(),
})

export const useSavePlumberMakerStore = defineStore('savePlumberMaker', () => {
  const level = ref<MakerLevel>(newMakerLevel())
  const drafts = ref<Draft[]>([])
  const userStore = useUserStore()
  const reviewSummary = ref<PlumberReviewSummary>(blankReviewSummary())
  const reviewComment = ref('')
  const ratingBusy = ref(false)
  const reviewsBusy = ref(false)
  const currentDraft = ref<string | null>(null)
  const imported = ref(false)
  const error = ref('')
  const message = ref('')
  const undoStack = ref<MakerLevel[]>([])
  const redoStack = ref<MakerLevel[]>([])
  const selectedTile = ref('#')
  const selectedGroup = ref('Terrain')
  const panel = ref<'tools' | 'library' | 'settings'>('tools')
  const hasChanges = computed(
    () =>
      !currentDraft.value ||
      JSON.stringify(
        drafts.value.find((item) => item.id === currentDraft.value)?.level,
      ) !== JSON.stringify(level.value),
  )
  const courseId = computed(() => makerId(level.value))
  const myRating = computed(() => reviewSummary.value.myRating)
  const ratingAverage = computed(() => reviewSummary.value.average)
  const ratingCount = computed(() => reviewSummary.value.count)
  const reviews = computed(() => reviewSummary.value.reviews)

  function readLibrary() {
    if (!import.meta.client) return
    try {
      const raw = JSON.parse(localStorage.getItem(MAKER_SAVE_KEY) || '{}')
      if (raw?.v !== 1 || !Array.isArray(raw.drafts)) return
      drafts.value = raw.drafts.slice(0, 24).flatMap((entry: unknown) => {
        if (!entry || typeof entry !== 'object') return []
        const candidate = entry as Record<string, unknown>
        try {
          if (typeof candidate.id !== 'string' || candidate.id.length > 64)
            return []
          return [
            {
              id: candidate.id,
              level: validateMakerLevel(candidate.level),
              updated:
                typeof candidate.updated === 'number' ? candidate.updated : 0,
            },
          ]
        } catch {
          return []
        }
      })
    } catch {
      error.value = 'Some saved courses could not be read.'
    }
  }

  function persist() {
    if (!import.meta.client) return
    try {
      const data: Library = {
        v: 1,
        drafts: drafts.value,
      }
      localStorage.setItem(MAKER_SAVE_KEY, JSON.stringify(data))
    } catch {
      error.value =
        'Device storage is full or disabled. Use Share to back up this course.'
    }
  }

  function initialize(shareCode?: string) {
    readLibrary()
    if (shareCode) loadShare(shareCode)
  }

  function pushUndo() {
    undoStack.value.push(clone(level.value))
    if (undoStack.value.length > 40) undoStack.value.shift()
    redoStack.value = []
  }

  function beginStroke() {
    pushUndo()
    error.value = ''
    message.value = ''
  }

  function paint(x: number, y: number) {
    level.value = paintMakerTile(level.value, x, y, selectedTile.value)
  }

  function undo() {
    const previous = undoStack.value.pop()
    if (!previous) return
    redoStack.value.push(clone(level.value))
    level.value = previous
  }

  function redo() {
    const next = redoStack.value.pop()
    if (!next) return
    undoStack.value.push(clone(level.value))
    level.value = next
  }

  function updateSettings(
    patch: Partial<Pick<MakerLevel, 'title' | 'author' | 'theme' | 'dark'>>,
  ) {
    pushUndo()
    level.value = validateMakerLevel({ ...level.value, ...patch })
  }

  function newDraft() {
    reviewSummary.value = blankReviewSummary()
    reviewComment.value = ''
    level.value = newMakerLevel()
    currentDraft.value = null
    imported.value = false
    undoStack.value = []
    redoStack.value = []
    error.value = ''
    message.value = 'New course ready.'
  }

  function saveDraft() {
    try {
      level.value = validateMakerLevel(level.value)
      const id =
        currentDraft.value ||
        'draft-' +
          Date.now().toString(36) +
          '-' +
          Math.floor(Math.random() * 100000).toString(36)
      const entry = { id, level: clone(level.value), updated: Date.now() }
      drafts.value = [
        entry,
        ...drafts.value.filter((draft) => draft.id !== id),
      ].slice(0, 24)
      currentDraft.value = id
      imported.value = false
      persist()
      message.value = 'Course saved on this device.'
      error.value = ''
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Course cannot be saved'
      return false
    }
  }

  function loadDraft(id: string) {
    const found = drafts.value.find((entry) => entry.id === id)
    if (!found) return false
    level.value = clone(found.level)
    reviewSummary.value = blankReviewSummary()
    reviewComment.value = ''
    currentDraft.value = found.id
    imported.value = false
    undoStack.value = []
    redoStack.value = []
    error.value = ''
    message.value = 'Course loaded for editing.'
    return true
  }

  function deleteDraft(id: string) {
    drafts.value = drafts.value.filter((entry) => entry.id !== id)
    if (currentDraft.value === id) currentDraft.value = null
    persist()
  }

  function loadShare(code: string) {
    try {
      level.value = decodeMakerLevel(code)
      reviewSummary.value = blankReviewSummary()
      reviewComment.value = ''
      currentDraft.value = null
      imported.value = true
      undoStack.value = []
      redoStack.value = []
      error.value = ''
      message.value = 'Shared course loaded. Play or save a copy to edit.'
      return true
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Invalid share link'
      return false
    }
  }

  function shareUrl(): string {
    const code = encodeMakerLevel(level.value)
    return (
      (import.meta.client ? window.location.origin : 'https://kindrobots.org') +
      '/play/save-the-plumber?level=' +
      code
    )
  }

  async function copyShareLink(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(shareUrl())
      message.value = 'Playable course link copied.'
      error.value = ''
      return true
    } catch {
      error.value =
        'Clipboard unavailable. Use the share link field to copy manually.'
      return false
    }
  }

  async function fetchReviews() {
    let code: string
    try {
      code = encodeMakerLevel(level.value)
    } catch {
      reviewSummary.value = blankReviewSummary()
      return
    }
    reviewsBusy.value = true
    try {
      const res = await performFetch<PlumberReviewSummary>(
        '/api/plumber-levels/reviews?code=' + encodeURIComponent(code),
      )
      if (code !== encodeMakerLevel(level.value)) return
      if (!res.success || !res.data) {
        error.value = res.message || 'Unable to load course reviews.'
        return
      }
      reviewSummary.value = res.data
      error.value = ''
    } finally {
      reviewsBusy.value = false
    }
  }

  async function rate(stars: number): Promise<boolean> {
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return false
    if (userStore.isGuest) {
      error.value = 'Log in to rate and review this course.'
      return false
    }
    if (ratingBusy.value) return false
    ratingBusy.value = true
    try {
      const code = encodeMakerLevel(level.value)
      const res = await performFetch<PlumberReviewSummary>(
        '/api/plumber-levels/reviews',
        {
          method: 'POST',
          body: JSON.stringify({
            code,
            rating: stars,
            comment: reviewComment.value,
          }),
        },
      )
      if (!res.success || !res.data) {
        error.value = res.message || 'Could not save your review.'
        return false
      }
      if (code === encodeMakerLevel(level.value)) {
        reviewSummary.value = res.data
        message.value = 'Review saved in Kind Robots.'
        error.value = ''
      }
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not save review.'
      return false
    } finally {
      ratingBusy.value = false
    }
  }

  return {
    level,
    drafts,
    currentDraft,
    imported,
    error,
    message,
    undoStack,
    redoStack,
    selectedTile,
    selectedGroup,
    panel,
    hasChanges,
    courseId,
    myRating,
    reviewSummary,
    reviewComment,
    ratingBusy,
    reviewsBusy,
    ratingAverage,
    ratingCount,
    reviews,
    initialize,
    beginStroke,
    paint,
    undo,
    redo,
    updateSettings,
    newDraft,
    saveDraft,
    loadDraft,
    deleteDraft,
    loadShare,
    shareUrl,
    copyShareLink,
    fetchReviews,
    rate,
  }
})

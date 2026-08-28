// /stores/artSlideshowStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, toRefs } from 'vue'
import { performFetch } from '@/stores/utils'
import { useArtJobStore, type ArtJobRecord } from '@/stores/artJobStore'
import {
  mergeSlideshowPool,
  pickRandomJobId,
  rememberShownId,
  unseenJobIds,
} from '~/utils/artSlideshowRotation'

export type SlideshowFitMode = 'contain' | 'cover'

export type SlideshowOverlayField =
  'title' | 'fileName' | 'prompt' | 'settings' | 'timestamp' | 'progress'

export type SlideshowSettings = {
  depth: number
  intervalSeconds: number
  fitMode: SlideshowFitMode
  interruptOnArrival: boolean
  overlay: Record<SlideshowOverlayField, boolean>
}

type ArtSlideshowState = {
  pool: ArtJobRecord[]
  seenIds: number[]
  freshIds: number[]
  history: number[]
  currentId: number | null
  loadingPool: boolean
  pollingArrivals: boolean
  error: string | null
  initialized: boolean
  settings: SlideshowSettings
}

export const SLIDESHOW_DEPTH_CHOICES = [12, 25, 50, 100, 200]
export const SLIDESHOW_INTERVAL_CHOICES = [3, 5, 8, 12, 20, 30, 60]

const MIN_DEPTH = 1
const MAX_DEPTH = 200
const MIN_INTERVAL_SECONDS = 1
const MAX_INTERVAL_SECONDS = 600
const ARRIVAL_HEAD_SIZE = 12
const STORAGE_KEY = 'kr-artjob-slideshow'

const DEFAULT_SETTINGS: SlideshowSettings = {
  depth: 50,
  intervalSeconds: 8,
  fitMode: 'contain',
  interruptOnArrival: true,
  overlay: {
    title: true,
    fileName: true,
    prompt: false,
    settings: false,
    timestamp: true,
    progress: true,
  },
}

const OVERLAY_FIELDS: SlideshowOverlayField[] = [
  'title',
  'fileName',
  'prompt',
  'settings',
  'timestamp',
  'progress',
]

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.round(parsed), min), max)
}

function sanitizeSettings(value: unknown): SlideshowSettings {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const overlaySource =
    source.overlay &&
    typeof source.overlay === 'object' &&
    !Array.isArray(source.overlay)
      ? (source.overlay as Record<string, unknown>)
      : {}

  const overlay = {} as Record<SlideshowOverlayField, boolean>
  for (const field of OVERLAY_FIELDS) {
    const stored = overlaySource[field]
    overlay[field] =
      typeof stored === 'boolean' ? stored : DEFAULT_SETTINGS.overlay[field]
  }

  return {
    depth: clampInteger(
      source.depth,
      MIN_DEPTH,
      MAX_DEPTH,
      DEFAULT_SETTINGS.depth,
    ),
    intervalSeconds: clampInteger(
      source.intervalSeconds,
      MIN_INTERVAL_SECONDS,
      MAX_INTERVAL_SECONDS,
      DEFAULT_SETTINGS.intervalSeconds,
    ),
    fitMode: source.fitMode === 'cover' ? 'cover' : 'contain',
    interruptOnArrival:
      typeof source.interruptOnArrival === 'boolean'
        ? source.interruptOnArrival
        : DEFAULT_SETTINGS.interruptOnArrival,
    overlay,
  }
}

export const useArtSlideshowStore = defineStore('artSlideshowStore', () => {
  const state = reactive<ArtSlideshowState>({
    pool: [],
    seenIds: [],
    freshIds: [],
    history: [],
    currentId: null,
    loadingPool: false,
    pollingArrivals: false,
    error: null,
    initialized: false,
    settings: sanitizeSettings(null),
  })

  const poolIds = computed<number[]>(() => state.pool.map((job) => job.id))

  const currentJob = computed<ArtJobRecord | null>(
    () => state.pool.find((job) => job.id === state.currentId) ?? null,
  )

  const currentIndex = computed<number>(() =>
    state.currentId === null
      ? -1
      : state.pool.findIndex((job) => job.id === state.currentId),
  )

  const hasPreviousSlide = computed<boolean>(() => state.history.length > 1)

  const pendingArrivalCount = computed<number>(() => state.freshIds.length)

  function persist(): void {
    if (!import.meta.client || !state.initialized) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings))
    } catch {
      return
    }
  }

  function initialize(): void {
    if (!import.meta.client || state.initialized) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      state.settings = sanitizeSettings(stored ? JSON.parse(stored) : null)
    } catch {
      state.settings = sanitizeSettings(null)
    }
    state.initialized = true
  }

  function ingest(jobs: ArtJobRecord[], seedAsSeen: boolean): void {
    const renderable = jobs.filter((job) => typeof job.artImageId === 'number')
    const arrivals = seedAsSeen ? [] : unseenJobIds(state.seenIds, renderable)

    state.pool = mergeSlideshowPool(
      state.pool,
      renderable,
      state.settings.depth,
    )
    state.seenIds = [
      ...new Set([...state.seenIds, ...renderable.map((job) => job.id)]),
    ]
    if (arrivals.length) state.freshIds = [...state.freshIds, ...arrivals]

    useArtJobStore().cachePublicImageUrls(renderable)
  }

  async function fetchDoneJobs(
    pageSize: number,
  ): Promise<ArtJobRecord[] | null> {
    const params = new URLSearchParams({
      status: 'DONE',
      page: '1',
      pageSize: String(pageSize),
    })
    const res = await performFetch<{ jobs: ArtJobRecord[] }>(
      `/api/art/queue?${params.toString()}`,
    )
    if (!res.success || !res.data) {
      state.error = res.message || 'Failed to load finished art.'
      return null
    }
    state.error = null
    return res.data.jobs
  }

  /**
   * Reload the whole depth window. This never announces arrivals: raising the
   * depth pulls in jobs that finished hours ago, and treating those as "new"
   * would queue the entire widened window as cut-to-front slides. Genuinely new
   * renders come from pollArrivals, which watches the head of the queue.
   */
  async function refreshPool(): Promise<void> {
    if (state.loadingPool) return
    state.loadingPool = true
    try {
      const jobs = await fetchDoneJobs(state.settings.depth)
      if (!jobs) return
      ingest(jobs, true)
      if (state.currentId === null) advance()
    } finally {
      state.loadingPool = false
    }
  }

  async function pollArrivals(): Promise<void> {
    if (state.pollingArrivals || state.loadingPool) return
    state.pollingArrivals = true
    try {
      const jobs = await fetchDoneJobs(ARRIVAL_HEAD_SIZE)
      if (!jobs) return
      ingest(jobs, !state.seenIds.length)
    } finally {
      state.pollingArrivals = false
    }
  }

  function show(id: number | null): void {
    if (id === null) return
    state.currentId = id
    state.history = rememberShownId(state.history, id)
  }

  function advance(): void {
    const fresh = state.freshIds[0]
    if (typeof fresh === 'number') {
      state.freshIds = state.freshIds.slice(1)
      show(fresh)
      return
    }
    show(pickRandomJobId(poolIds.value, state.history))
  }

  function stepBack(): void {
    if (state.history.length < 2) return
    const trimmed = state.history.slice(0, -1)
    state.history = trimmed
    state.currentId = trimmed[trimmed.length - 1] ?? null
  }

  async function setDepth(depth: number): Promise<void> {
    const next = clampInteger(
      depth,
      MIN_DEPTH,
      MAX_DEPTH,
      DEFAULT_SETTINGS.depth,
    )
    if (next === state.settings.depth) return
    state.settings.depth = next
    persist()
    state.pool = mergeSlideshowPool(state.pool, [], next)
    await refreshPool()
  }

  function setIntervalSeconds(seconds: number): void {
    state.settings.intervalSeconds = clampInteger(
      seconds,
      MIN_INTERVAL_SECONDS,
      MAX_INTERVAL_SECONDS,
      DEFAULT_SETTINGS.intervalSeconds,
    )
    persist()
  }

  function setFitMode(mode: SlideshowFitMode): void {
    state.settings.fitMode = mode === 'cover' ? 'cover' : 'contain'
    persist()
  }

  function setInterruptOnArrival(value: boolean): void {
    state.settings.interruptOnArrival = value
    persist()
  }

  function setOverlayField(field: SlideshowOverlayField, value: boolean): void {
    state.settings.overlay[field] = value
    persist()
  }

  function setAllOverlayFields(value: boolean): void {
    for (const field of OVERLAY_FIELDS) state.settings.overlay[field] = value
    persist()
  }

  function reset(): void {
    state.pool = []
    state.seenIds = []
    state.freshIds = []
    state.history = []
    state.currentId = null
    state.error = null
  }

  return {
    ...toRefs(state),
    poolIds,
    currentJob,
    currentIndex,
    hasPreviousSlide,
    pendingArrivalCount,
    initialize,
    refreshPool,
    pollArrivals,
    advance,
    stepBack,
    show,
    setDepth,
    setIntervalSeconds,
    setFitMode,
    setInterruptOnArrival,
    setOverlayField,
    setAllOverlayFields,
    reset,
  }
})

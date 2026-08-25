import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import { useUserStore } from './userStore'
import {
  VIDEO_PRESETS,
  getDefaultVideoPreset,
  getVideoPreset,
  type VideoEngine,
  type VideoPresetId,
} from '@/utils/videoPresets'

export type SceneAnimatorSourceStatus =
  | 'missing'
  | 'queued'
  | 'rendering'
  | 'done'
  | 'failed'
  | 'cancelled'

export type SceneAnimatorFolder = {
  name: string
  imageCount: number
}

export type SceneAnimatorSource = {
  name: string
  bytes: number
  hash: string
  mime: string
  sourceUrl: string
  dedupeKey: string
  status: SceneAnimatorSourceStatus
  jobId: number | null
  artImageId: number | null
  resultPath: string | null
  resultFileType: string | null
  error: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type SceneAnimatorFolderStat = {
  total: number
  done: number
  active: number
  failed: number
}

type SceneAnimatorConfig = {
  engine: VideoEngine
  presetId: VideoPresetId
  durationSeconds: number
  fps: number
  width: number
  height: number
  outputFormat: 'webp' | 'mp4' | 'webm'
  loop: boolean
  renderScale: number
  isMature: boolean
}

type SceneAnimatorIndexData = {
  rootAvailable: boolean
  folders: SceneAnimatorFolder[]
  selectedFolder: string | null
  config: SceneAnimatorConfig
  configKey: string
  sources: SceneAnimatorSource[]
  folderStats: Record<string, SceneAnimatorFolderStat>
}

type SceneAnimatorEnqueueData = {
  folder: string
  config: SceneAnimatorConfig
  configKey: string
  total: number
  queued: Array<{ sourceFile: string; jobId: number }>
  skipped: Array<{ sourceFile: string; jobId: number | null; reason: string }>
  errors: Array<{ sourceFile: string; message: string }>
}

type ArtImagePreview = {
  id: number
  imageData?: string | null
  imagePath?: string | null
  fileType?: string | null
}

function errorMessage(value: unknown, fallback: string): string {
  return value instanceof Error ? value.message : fallback
}

function mimeFromFileType(fileType: string | null | undefined): string {
  const normalized = String(fileType ?? '').toLowerCase().replace(/^\./, '')
  if (normalized.includes('/')) return normalized
  if (normalized === 'mp4') return 'video/mp4'
  if (normalized === 'webm') return 'video/webm'
  if (normalized === 'jpg' || normalized === 'jpeg') return 'image/jpeg'
  if (normalized === 'png') return 'image/png'
  if (normalized === 'gif') return 'image/gif'
  return 'image/webp'
}

function asDataUrl(data: string, fileType: string | null | undefined): string {
  return data.startsWith('data:') ? data : `data:${mimeFromFileType(fileType)};base64,${data}`
}

export const useSceneAnimatorStore = defineStore('sceneAnimatorStore', () => {
  const defaultPreset = getDefaultVideoPreset('wan')

  const folders = ref<SceneAnimatorFolder[]>([])
  const folderStats = ref<Record<string, SceneAnimatorFolderStat>>({})
  const sources = ref<SceneAnimatorSource[]>([])
  const selectedFolder = ref('')
  const engine = ref<VideoEngine>('wan')
  const presetId = ref<VideoPresetId>(defaultPreset.id)
  const durationSeconds = ref<number>(defaultPreset.durationSeconds)
  const isMature = ref(false)
  const configKey = ref('')
  const sourcePreviewUrls = ref<Record<string, string>>({})
  const resultPreviewUrls = ref<Record<number, string>>({})
  const loading = ref(false)
  const queueing = ref(false)
  const retryingSource = ref<string | null>(null)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  const lastEnqueue = ref<SceneAnimatorEnqueueData | null>(null)

  const presets = computed(() => VIDEO_PRESETS.filter((preset) => preset.engine === engine.value))
  const selectedPreset = computed(
    () => getVideoPreset(presetId.value) ?? getDefaultVideoPreset(engine.value),
  )
  const totalCount = computed(() => sources.value.length)
  const missingCount = computed(
    () => sources.value.filter((source) => source.status === 'missing').length,
  )
  const activeCount = computed(
    () =>
      sources.value.filter(
        (source) => source.status === 'queued' || source.status === 'rendering',
      ).length,
  )
  const doneCount = computed(
    () => sources.value.filter((source) => source.status === 'done').length,
  )
  const failedCount = computed(
    () =>
      sources.value.filter(
        (source) => source.status === 'failed' || source.status === 'cancelled',
      ).length,
  )
  const completionPercent = computed(() =>
    totalCount.value ? Math.round((doneCount.value / totalCount.value) * 100) : 0,
  )

  function clearError() {
    error.value = null
  }

  function clearSourcePreviews() {
    if (import.meta.client) {
      for (const url of Object.values(sourcePreviewUrls.value)) URL.revokeObjectURL(url)
    }
    sourcePreviewUrls.value = {}
  }

  async function fetchProtectedBlob(url: string): Promise<string | null> {
    if (!import.meta.client) return null
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token || ''
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(url, { headers })
    if (!response.ok) return null
    return URL.createObjectURL(await response.blob())
  }

  async function hydrateSourcePreviews() {
    clearSourcePreviews()
    const pairs = await Promise.all(
      sources.value.map(async (source) => [source.name, await fetchProtectedBlob(source.sourceUrl)] as const),
    )
    const next: Record<string, string> = {}
    for (const [name, url] of pairs) {
      if (url) next[name] = url
    }
    sourcePreviewUrls.value = next
  }

  async function hydrateResultPreview(source: SceneAnimatorSource) {
    if (!source.artImageId || source.status !== 'done') return
    if (source.resultPath) {
      resultPreviewUrls.value[source.artImageId] = source.resultPath
      return
    }

    const response = await performFetch<ArtImagePreview>(
      `/api/art/image/${source.artImageId}?includeImageData=true&showMature=true`,
      {},
      1,
      15_000,
    )
    if (!response.success || !response.data) return
    if (response.data.imagePath) {
      resultPreviewUrls.value[source.artImageId] = response.data.imagePath
      return
    }
    if (response.data.imageData) {
      resultPreviewUrls.value[source.artImageId] = asDataUrl(
        response.data.imageData,
        response.data.fileType || source.resultFileType,
      )
    }
  }

  async function hydrateResultPreviews() {
    const doneSources = sources.value.filter(
      (source) => source.status === 'done' && source.artImageId,
    )
    await Promise.all(doneSources.map(hydrateResultPreview))
  }

  function buildQuery(folder = selectedFolder.value): string {
    const params = new URLSearchParams({
      folder,
      engine: engine.value,
      presetId: presetId.value,
      durationSeconds: String(durationSeconds.value),
      isMature: String(isMature.value),
    })
    return params.toString()
  }

  async function load(folder = selectedFolder.value): Promise<void> {
    loading.value = true
    clearError()
    try {
      const response = await performFetch<SceneAnimatorIndexData>(
        `/api/scene-animator?${buildQuery(folder)}`,
        {},
        1,
        30_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load Scene Animator.')
      }

      if (!response.data.rootAvailable) {
        // Root not mounted/reachable yet — not a request failure (the API
        // still answered normally), so this is reported through the same
        // error banner rather than thrown, with the server's specific reason.
        folders.value = []
        folderStats.value = {}
        sources.value = []
        initialized.value = true
        error.value =
          response.message || 'Scene Animator source root is unavailable.'
        return
      }

      folders.value = response.data.folders
      folderStats.value = response.data.folderStats
      configKey.value = response.data.configKey
      engine.value = response.data.config.engine
      presetId.value = response.data.config.presetId
      durationSeconds.value = response.data.config.durationSeconds
      isMature.value = response.data.config.isMature

      const firstFolder = response.data.selectedFolder === null ? response.data.folders[0] : null
      if (firstFolder) {
        selectedFolder.value = firstFolder.name
        loading.value = false
        return load(selectedFolder.value)
      }

      selectedFolder.value = response.data.selectedFolder ?? folder
      sources.value = response.data.sources
      initialized.value = true
      await Promise.all([hydrateSourcePreviews(), hydrateResultPreviews()])
    } catch (cause) {
      error.value = errorMessage(cause, 'Failed to load Scene Animator.')
      sources.value = []
    } finally {
      loading.value = false
    }
  }

  async function enqueue(retryFailed = false): Promise<SceneAnimatorEnqueueData | null> {
    queueing.value = true
    clearError()
    try {
      const response = await performFetch<SceneAnimatorEnqueueData>(
        '/api/scene-animator/enqueue',
        {
          method: 'POST',
          body: JSON.stringify({
            folder: selectedFolder.value,
            engine: engine.value,
            presetId: presetId.value,
            durationSeconds: durationSeconds.value,
            isMature: isMature.value,
            retryFailed,
          }),
        },
        1,
        120_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to enqueue Scene Animator batch.')
      }
      lastEnqueue.value = response.data
      if (response.data.errors.length) {
        error.value = response.data.errors
          .map((item) => `${item.sourceFile}: ${item.message}`)
          .join('\n')
      }
      await load()
      return response.data
    } catch (cause) {
      error.value = errorMessage(cause, 'Failed to enqueue Scene Animator batch.')
      return null
    } finally {
      queueing.value = false
    }
  }

  async function retrySource(sourceFile: string): Promise<boolean> {
    queueing.value = true
    retryingSource.value = sourceFile
    clearError()
    try {
      const response = await performFetch<SceneAnimatorEnqueueData>(
        '/api/scene-animator/enqueue',
        {
          method: 'POST',
          body: JSON.stringify({
            folder: selectedFolder.value,
            engine: engine.value,
            presetId: presetId.value,
            durationSeconds: durationSeconds.value,
            isMature: isMature.value,
            retryFailed: true,
            sourceFile,
          }),
        },
        1,
        120_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to retry this scene.')
      }
      lastEnqueue.value = response.data
      if (response.data.errors.length) {
        error.value = response.data.errors
          .map((item) => `${item.sourceFile}: ${item.message}`)
          .join('\n')
        return false
      }
      await load()
      return true
    } catch (cause) {
      error.value = errorMessage(cause, 'Failed to retry this scene.')
      return false
    } finally {
      queueing.value = false
      retryingSource.value = null
    }
  }

  async function selectFolder(folder: string) {
    selectedFolder.value = folder
    await load(folder)
  }

  async function setEngine(next: VideoEngine) {
    engine.value = next
    const preset = getDefaultVideoPreset(next)
    presetId.value = preset.id
    durationSeconds.value = preset.durationSeconds
    await load()
  }

  async function setPreset(next: VideoPresetId) {
    const preset = getVideoPreset(next)
    if (!preset) return
    engine.value = preset.engine
    presetId.value = preset.id
    durationSeconds.value = preset.durationSeconds
    await load()
  }

  async function setDuration(next: number) {
    if (!Number.isFinite(next)) return
    durationSeconds.value = Math.min(30, Math.max(0.25, next))
    await load()
  }

  async function setMaturity(next: boolean) {
    isMature.value = next
    await load()
  }

  function resultUrl(source: SceneAnimatorSource): string | null {
    if (!source.artImageId) return source.resultPath
    return resultPreviewUrls.value[source.artImageId] || source.resultPath
  }

  return {
    folders,
    folderStats,
    sources,
    selectedFolder,
    engine,
    presetId,
    durationSeconds,
    isMature,
    configKey,
    sourcePreviewUrls,
    resultPreviewUrls,
    loading,
    queueing,
    retryingSource,
    initialized,
    error,
    lastEnqueue,
    presets,
    selectedPreset,
    totalCount,
    missingCount,
    activeCount,
    doneCount,
    failedCount,
    completionPercent,
    clearError,
    load,
    enqueue,
    retrySource,
    selectFolder,
    setEngine,
    setPreset,
    setDuration,
    setMaturity,
    resultUrl,
    clearSourcePreviews,
  }
})

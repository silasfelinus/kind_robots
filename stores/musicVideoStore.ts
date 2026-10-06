import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoDoc,
  type MusicVideoStatus,
} from '@/utils/musicVideoDoc'

export type MusicVideoSummary = {
  id: number
  title: string
  status: MusicVideoStatus
  createdAt: string
  updatedAt: string
  finalArtImageId: number | null
}

export type MusicVideo = {
  id: number
  userId: number
  title: string
  status: MusicVideoStatus
  createdAt: string
  updatedAt: string
  finalArtImageId: number | null
  doc: MusicVideoDoc
}

export type KeyframeOutcome = {
  sceneId: string
  status: 'assigned' | 'failed'
  attemptId?: number
  artImageId?: number
  cropLoss?: number
  reason?: string
}

type ArtImagePreview = {
  id: number
  imagePath?: string | null
}

function errorMessage(value: unknown, fallback: string): string {
  return value instanceof Error ? value.message : fallback
}

/** Owns every /api/music-video call; components never fetch directly. */
export const useMusicVideoStore = defineStore('musicVideoStore', () => {
  const videos = ref<MusicVideoSummary[]>([])
  const current = ref<MusicVideo | null>(null)
  const previewUrls = ref<Record<number, string>>({})
  const loading = ref(false)
  const saving = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)

  const sceneCount = computed(() => current.value?.doc.scenes.length ?? 0)
  const scenesWithImage = computed(
    () =>
      current.value?.doc.scenes.filter((scene) => scene.image.artImageId)
        .length ?? 0,
  )
  const lyricLineCount = computed(
    () =>
      current.value?.doc.lyrics.sections.reduce(
        (total, section) => total + section.lines.length,
        0,
      ) ?? 0,
  )

  function clearError() {
    error.value = null
  }

  async function loadList(): Promise<void> {
    loading.value = true
    clearError()
    try {
      const response = await performFetch<MusicVideoSummary[]>(
        '/api/music-video',
        {},
        1,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load music videos.')
      }
      videos.value = response.data
      initialized.value = true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to load music videos.')
    } finally {
      loading.value = false
    }
  }

  async function hydratePreview(artImageId: number) {
    if (previewUrls.value[artImageId]) return
    const response = await performFetch<ArtImagePreview>(
      `/api/art/image/${artImageId}?showMature=true`,
      {},
      1,
      15_000,
    )
    const path = response.success ? response.data?.imagePath : null
    if (path) previewUrls.value[artImageId] = path
  }

  async function hydratePreviews(video: MusicVideo) {
    const ids = new Set<number>()
    if (video.finalArtImageId) ids.add(video.finalArtImageId)
    if (video.doc.song?.artImageId) ids.add(video.doc.song.artImageId)
    for (const scene of video.doc.scenes) {
      if (scene.image.artImageId) ids.add(scene.image.artImageId)
    }
    await Promise.all([...ids].map((id) => hydratePreview(id)))
  }

  async function select(id: number): Promise<void> {
    loading.value = true
    clearError()
    try {
      const response = await performFetch<MusicVideo>(
        `/api/music-video/${id}`,
        {},
        1,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load the music video.')
      }
      current.value = response.data
      void hydratePreviews(response.data)
    } catch (e) {
      error.value = errorMessage(e, 'Failed to load the music video.')
    } finally {
      loading.value = false
    }
  }

  async function create(title: string, pitch: string): Promise<boolean> {
    saving.value = true
    clearError()
    try {
      const response = await performFetch<MusicVideo>(
        '/api/music-video',
        { method: 'POST', body: JSON.stringify({ title, pitch }) },
        0,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create the music video.')
      }
      current.value = response.data
      await loadList()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to create the music video.')
      return false
    } finally {
      saving.value = false
    }
  }

  async function savePitch(title: string, pitch: string): Promise<boolean> {
    const video = current.value
    if (!video) return false
    saving.value = true
    clearError()
    try {
      const response = await performFetch<MusicVideo>(
        `/api/music-video/${video.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title,
            doc: {
              ...video.doc,
              pitch: pitch.slice(0, MUSIC_VIDEO_LIMITS.maxPitch),
            },
          }),
        },
        0,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save the music video.')
      }
      current.value = response.data
      await loadList()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to save the music video.')
      return false
    } finally {
      saving.value = false
    }
  }

  /** The song's length in seconds, read by the browser; null when it cannot tell. */
  function readAudioDuration(file: File): Promise<number | null> {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return Promise.resolve(null)
    }
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const audio = new Audio()
      const finish = (value: number | null) => {
        URL.revokeObjectURL(url)
        resolve(value)
      }
      audio.preload = 'metadata'
      audio.onloadedmetadata = () =>
        finish(Number.isFinite(audio.duration) ? audio.duration : null)
      audio.onerror = () => finish(null)
      audio.src = url
    })
  }

  async function uploadSong(file: File, bpm?: number | null): Promise<boolean> {
    const video = current.value
    if (!video) return false
    saving.value = true
    clearError()
    try {
      const form = new FormData()
      form.append('file', file)
      const durationSec = await readAudioDuration(file)
      if (durationSec) form.append('durationSec', String(durationSec))
      if (bpm) form.append('bpm', String(bpm))
      const response = await performFetch<{ video: MusicVideo }>(
        `/api/music-video/${video.id}/song-upload`,
        { method: 'POST', body: form },
        0,
        120_000,
      )
      if (!response.success || !response.data?.video) {
        throw new Error(response.message || 'Failed to upload the song.')
      }
      current.value = response.data.video
      await loadList()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to upload the song.')
      return false
    } finally {
      saving.value = false
    }
  }

  /** Merge settings into the doc (aspect, comic series and lane, banned terms…). */
  async function saveSettings(
    settings: Partial<MusicVideoDoc['settings']>,
  ): Promise<boolean> {
    const video = current.value
    if (!video) return false
    saving.value = true
    clearError()
    try {
      const response = await performFetch<MusicVideo>(
        `/api/music-video/${video.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            doc: {
              ...video.doc,
              settings: { ...video.doc.settings, ...settings },
            },
          }),
        },
        0,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save the settings.')
      }
      current.value = response.data
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to save the settings.')
      return false
    } finally {
      saving.value = false
    }
  }

  /** Save the beat grid, scene markers and the scenes' times and lyric lines. */
  async function saveTimeline(
    payload: Pick<MusicVideoDoc, 'timeline' | 'scenes'>,
  ): Promise<boolean> {
    const video = current.value
    if (!video) return false
    saving.value = true
    clearError()
    try {
      const response = await performFetch<MusicVideo>(
        `/api/music-video/${video.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            doc: {
              ...video.doc,
              timeline: payload.timeline,
              scenes: payload.scenes,
            },
          }),
        },
        0,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save the timeline.')
      }
      current.value = response.data
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to save the timeline.')
      return false
    } finally {
      saving.value = false
    }
  }

  /** Use vetted Comic Studio art as scene stills (attempt ids, or slots' picks). */
  async function assignKeyframes(
    assignments: { sceneId: string; attemptId?: number; slotId?: number }[],
  ): Promise<KeyframeOutcome[]> {
    const video = current.value
    if (!video) return []
    saving.value = true
    clearError()
    try {
      const response = await performFetch<{
        video: MusicVideo
        outcomes: KeyframeOutcome[]
      }>(
        `/api/music-video/${video.id}/scenes/keyframes`,
        { method: 'POST', body: JSON.stringify({ assignments }) },
        0,
        20_000,
      )
      if (!response.success || !response.data?.video) {
        throw new Error(response.message || 'Failed to assign keyframes.')
      }
      current.value = response.data.video
      return response.data.outcomes ?? []
    } catch (e) {
      error.value = errorMessage(e, 'Failed to assign keyframes.')
      return []
    } finally {
      saving.value = false
    }
  }

  async function remove(id: number): Promise<boolean> {
    saving.value = true
    clearError()
    try {
      const response = await performFetch(
        `/api/music-video/${id}`,
        { method: 'DELETE' },
        0,
        20_000,
      )
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete the music video.')
      }
      if (current.value?.id === id) current.value = null
      await loadList()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to delete the music video.')
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    videos,
    current,
    previewUrls,
    loading,
    saving,
    initialized,
    error,
    sceneCount,
    scenesWithImage,
    lyricLineCount,
    clearError,
    loadList,
    select,
    create,
    savePitch,
    uploadSong,
    saveSettings,
    saveTimeline,
    assignKeyframes,
    remove,
  }
})

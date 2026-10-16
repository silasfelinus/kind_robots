import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { VideoRestyleJob } from '@/server/utils/videoRestyleJobs'
import {
  RESTYLE_MAX_BYTES,
  RESTYLE_MAX_DURATION_SEC,
  type RestyleQuality,
  type RestyleStyleId,
} from '@/utils/videoRestylePlan'

export const useVideoRestyleStore = defineStore('videoRestyle', () => {
  const jobs = ref<VideoRestyleJob[]>([])
  const selectedId = ref<string | null>(null)
  const busy = ref(false)
  const syncing = ref(false)
  const registrationError = ref('')
  const sourceBusy = ref(false)
  const error = ref('')
  const notice = ref('')
  const previewUrl = ref<string | null>(null)
  const selected = computed(
    () => jobs.value.find((job) => job.id === selectedId.value) ?? null,
  )

  function clearPreview() {
    if (previewUrl.value && import.meta.client)
      URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  function preview(file: File) {
    clearPreview()
    if (import.meta.client) previewUrl.value = URL.createObjectURL(file)
  }

  async function refresh() {
    if (syncing.value) return
    syncing.value = true
    try {
      // Registration is an explicit owner-authorized write. A read-only list
      // cannot backfill a pilot that was queued before ArtJob mirroring existed.
      const response = await performFetch<VideoRestyleJob[]>(
        '/api/video-restyle/reconcile',
        { method: 'POST' },
        1,
        30_000,
      )
      if (response.success && Array.isArray(response.data)) {
        jobs.value = response.data
        registrationError.value = jobs.value.some(
          (job) => job.pilot && !job.pilot.artJobId,
        )
          ? 'The server returned a pilot without an ArtJob ID.'
          : ''
      } else {
        // Preserve the ability to view an uploaded film if the database or
        // registration endpoint is unavailable, but never hide that failure.
        registrationError.value =
          response.message || 'Unable to register pilots in ArtJob.'
        const fallback = await performFetch<VideoRestyleJob[]>(
          '/api/video-restyle',
          {},
          1,
          30_000,
        )
        if (fallback.success && Array.isArray(fallback.data)) {
          jobs.value = fallback.data
        } else {
          error.value = fallback.message || 'Cannot load your restyle projects.'
        }
      }
      if (
        jobs.value.length &&
        !jobs.value.some((job) => job.id === selectedId.value)
      ) {
        selectedId.value = jobs.value[0]!.id
      }
    } finally {
      syncing.value = false
    }
  }

  async function stage(input: {
    file: File
    title: string
    durationSec: number
    style: RestyleStyleId
    quality: RestyleQuality
  }): Promise<boolean> {
    error.value = ''
    notice.value = ''
    if (input.file.size > RESTYLE_MAX_BYTES || input.file.size <= 0) {
      error.value = 'Choose a video under 128 MiB.'
      return false
    }
    if (!(
      input.durationSec >= 1 && input.durationSec <= RESTYLE_MAX_DURATION_SEC
    )) {
      error.value = 'Choose a video between one second and fifteen minutes.'
      return false
    }
    busy.value = true
    try {
      const form = new FormData()
      form.append('file', input.file)
      form.append('title', input.title)
      form.append('durationSec', String(input.durationSec))
      form.append('style', input.style)
      form.append('quality', input.quality)
      const response = await performFetch<VideoRestyleJob>(
        '/api/video-restyle',
        { method: 'POST', body: form },
        1,
        180_000,
      )
      if (!response.success || !response.data) {
        error.value = response.message || 'Upload failed.'
        return false
      }
      selectedId.value = response.data.id
      notice.value =
        'Source saved privately. The motion-conditioned renderer is not connected yet.'
      await refresh()
      return true
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Upload failed.'
      return false
    } finally {
      busy.value = false
    }
  }

  async function loadSourcePreview(id: string): Promise<boolean> {
    if (!import.meta.client) return false
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token
    if (!token) {
      error.value = 'Sign in to play your saved private video.'
      return false
    }
    error.value = ''
    sourceBusy.value = true
    clearPreview()
    try {
      const response = await fetch(
        `/api/video-restyle/${encodeURIComponent(id)}/source`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (!response.ok) {
        const details = (await response.json().catch(() => null)) as {
          message?: string
        } | null
        throw new Error(
          details?.message ||
            `Source video request failed (${response.status}).`,
        )
      }
      const file = await response.blob()
      if (!file.type.startsWith('video/'))
        throw new Error('The stored file is not a video.')
      if (selectedId.value !== id) return false
      previewUrl.value = URL.createObjectURL(file)
      return true
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Unable to open saved video.'
      return false
    } finally {
      sourceBusy.value = false
    }
  }

  async function queuePilot(id: string): Promise<boolean> {
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await performFetch<VideoRestyleJob>(
        `/api/video-restyle/${encodeURIComponent(id)}/pilot`,
        { method: 'POST', body: JSON.stringify({}) },
        1,
        30_000,
      )
      if (!response.success || !response.data) {
        error.value = response.message || 'Unable to queue the pilot.'
        return false
      }
      jobs.value = jobs.value.map((job) =>
        job.id === id ? response.data! : job,
      )
      notice.value =
        'Pilot queued for KR Relay when ComfyUI is ready.'
      return true
    } finally {
      busy.value = false
    }
  }

  async function retryPilot(id: string): Promise<boolean> {
    if (busy.value) return false
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await performFetch<VideoRestyleJob>(
        `/api/video-restyle/${encodeURIComponent(id)}/pilot/retry`,
        { method: 'POST', body: JSON.stringify({}) },
        1,
        30_000,
      )
      if (!response.success || !response.data) {
        error.value = response.message || 'Unable to retry the pilot.'
        return false
      }
      jobs.value = jobs.value.map((job) =>
        job.id === id ? response.data! : job,
      )
      notice.value = 'Existing ArtJob requeued for KR Relay; source preserved.'
      return true
    } finally {
      busy.value = false
    }
  }

  async function loadPilotPreview(id: string): Promise<boolean> {
    if (!import.meta.client) return false
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token
    if (!token) {
      error.value = 'Sign in to view your private pilot.'
      return false
    }
    sourceBusy.value = true
    error.value = ''
    clearPreview()
    try {
      const response = await fetch(
        `/api/video-restyle/${encodeURIComponent(id)}/result`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!response.ok) throw new Error('Pilot video is unavailable.')
      const file = await response.blob()
      if (!file.type.startsWith('video/'))
        throw new Error('Pilot result was not a video.')
      if (selectedId.value !== id) return false
      previewUrl.value = URL.createObjectURL(file)
      return true
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Unable to load pilot.'
      return false
    } finally {
      sourceBusy.value = false
    }
  }

  async function saveSettings(
    id: string,
    style: RestyleStyleId,
    quality: RestyleQuality,
  ): Promise<boolean> {
    busy.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await performFetch<VideoRestyleJob>(
        `/api/video-restyle/${encodeURIComponent(id)}`,
        { method: 'PATCH', body: JSON.stringify({ style, quality }) },
      )
      if (!response.success || !response.data) {
        error.value = response.message || 'Could not save restyle settings.'
        return false
      }
      jobs.value = jobs.value.map((job) =>
        job.id === id ? response.data! : job,
      )
      notice.value = 'Animation look and output target saved to this project.'
      return true
    } finally {
      busy.value = false
    }
  }

  return {
    jobs,
    selected,
    selectedId,
    busy,
    syncing,
    registrationError,
    sourceBusy,
    error,
    notice,
    previewUrl,
    refresh,
    stage,
    saveSettings,
    queuePilot,
    retryPilot,
    loadPilotPreview,
    loadSourcePreview,
    preview,
    clearPreview,
  }
})

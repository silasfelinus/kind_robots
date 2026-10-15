import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
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
    const response = await performFetch<VideoRestyleJob[]>(
      '/api/video-restyle',
      {},
      1,
      30_000,
    )
    if (response.success && response.data) {
      jobs.value = response.data
      if (!selectedId.value && jobs.value.length)
        selectedId.value = jobs.value[0]!.id
    } else {
      error.value = response.message || 'Cannot load your restyle projects.'
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

  return {
    jobs,
    selected,
    selectedId,
    busy,
    error,
    notice,
    previewUrl,
    refresh,
    stage,
    preview,
    clearPreview,
  }
})

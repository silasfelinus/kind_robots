import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { performFetch } from '~/stores/utils'

type FeedbackResult = {
  issue: number
  url: string
  screenshotUrl: string
}

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function feedbackProjectForPath(path: string): string {
  if (path.startsWith('/play/memory') || path.startsWith('/admin/memory'))
    return 'memory-dungeon'
  if (
    path.startsWith('/play/space-couch') ||
    path.startsWith('/play/game-of-captains')
  )
    return 'game-of-captains'
  if (
    path.startsWith('/play/ecotone') ||
    path.startsWith('/play/weird-humboldt')
  )
    return 'weird-humboldt'
  if (
    path.startsWith('/admin/monstrique') ||
    path.startsWith('/play/monstrique')
  )
    return 'monstress-convention'
  if (
    path.startsWith('/play/prom-of-doom') ||
    path.startsWith('/play/comet-city-academy')
  )
    return 'comet-city-academy'
  if (path.startsWith('/admin/')) return path.split('/')[2] || 'kind-robots'
  if (path.startsWith('/play/')) return path.split('/')[2] || 'kind-robots'
  if (path.startsWith('/conductor')) return 'conductor'
  return 'kind-robots'
}

export const useSiteFeedbackStore = defineStore('siteFeedback', () => {
  const open = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const result = shallowRef<FeedbackResult | null>(null)
  const screenshot = shallowRef<File | null>(null)
  const previewUrl = ref('')
  const title = ref('')
  const note = ref('')
  const project = ref('kind-robots')
  const path = ref('/')
  const viewport = ref('')

  const canCapture = computed(
    () =>
      import.meta.client &&
      typeof navigator.mediaDevices?.getDisplayMedia === 'function',
  )

  function setScreenshot(file: File | null): void {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    screenshot.value = null
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_BYTES) {
      error.value = 'Choose a PNG, JPEG or WebP screenshot under 5 MB.'
      return
    }
    screenshot.value = file
    previewUrl.value = URL.createObjectURL(file)
    error.value = ''
  }

  function close(): void {
    open.value = false
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
    screenshot.value = null
  }

  function begin(): void {
    close()
    path.value = window.location.pathname
    viewport.value = window.innerWidth + ' × ' + window.innerHeight + ' CSS px'
    title.value = ''
    note.value = ''
    project.value = feedbackProjectForPath(path.value)
    error.value = ''
    result.value = null
    open.value = true
  }

  async function capture(): Promise<void> {
    if (!canCapture.value) {
      error.value =
        'This browser requires an uploaded screenshot. Use Choose screenshot.'
      return
    }

    open.value = false
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
      const video = document.createElement('video')
      video.muted = true
      video.srcObject = stream
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () =>
          reject(new Error('Could not read the captured screen.'))
      })
      await video.play()
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      )
      const width = video.videoWidth
      const height = video.videoHeight
      if (!width || !height) throw new Error('The captured screen was empty.')
      const scale = Math.min(1, 1920 / width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Screen capture is unavailable.')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error('Could not encode screenshot.')),
          'image/webp',
          0.82,
        ),
      )
      setScreenshot(
        new File([blob], 'site-screenshot.webp', { type: 'image/webp' }),
      )
    } catch (reason) {
      error.value =
        reason instanceof Error
          ? 'Capture cancelled or unavailable: ' + reason.message
          : 'Screen capture was cancelled. You can upload a screenshot instead.'
    } finally {
      stream?.getTracks().forEach((track) => track.stop())
      open.value = true
    }
  }

  async function submit(): Promise<void> {
    if (submitting.value) return
    if (!screenshot.value || !title.value.trim() || !note.value.trim()) {
      error.value = 'Include a screenshot, a title and a note.'
      return
    }
    submitting.value = true
    error.value = ''
    const form = new FormData()
    form.append('screenshot', screenshot.value)
    form.append('title', title.value.trim())
    form.append('note', note.value.trim())
    form.append('project', project.value.trim())
    form.append('path', path.value)
    form.append('viewport', viewport.value)
    try {
      const response = await performFetch<FeedbackResult>(
        '/api/site-feedback',
        { method: 'POST', body: form },
        1,
        30000,
      )
      if (!response.success || !response.data?.url) {
        error.value = response.message || 'Could not create the issue.'
        return
      }
      result.value = response.data
    } finally {
      submitting.value = false
    }
  }

  return {
    open,
    submitting,
    error,
    result,
    screenshot,
    previewUrl,
    title,
    note,
    project,
    path,
    viewport,
    canCapture,
    begin,
    close,
    capture,
    setScreenshot,
    submit,
  }
})

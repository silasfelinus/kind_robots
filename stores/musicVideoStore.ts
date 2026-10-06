import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import { useUserStore } from './userStore'
import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoDoc,
  type MusicVideoMotionPreset,
  type MusicVideoScene,
  type MusicVideoSection,
  type MusicVideoStatus,
} from '@/utils/musicVideoDoc'
import { briefHasGaps } from '@/utils/musicVideoBrief'

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

export type SceneJobStatus = {
  sceneId: string
  jobId: number | null
  status: string
  artImageId: number | null
  error: string | null
  clipJobId: number | null
  clipStatus: string | null
  clipArtImageId: number | null
  clipError: string | null
}

export type SongJobStatus = {
  id: number
  status: string
  artImageId: number | null
  error: string | null
}

export type SceneActionOutcome = {
  sceneId: string
  status: string
  jobId?: number
  reason?: string
}

const PENDING_JOB_STATUSES = new Set(['PENDING', 'RUNNING'])

/** A finished image the scene picker can offer (t-032). */
export type RecentArt = { artImageId: number; jobId: number; prompt: string }

/** One edited lyric line, addressed the way scene.lyricRefs address it. */
export type LyricLineEdit = { sectionId: string; lineIdx: number; text: string }

const CLIP_OR_AUDIO_ENGINES = new Set(['acestep', 'ltx', 'wan'])

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
  /** Which pipeline step is in flight ('lyrics', 'song', 'render', …), for the buttons. */
  const busyAction = ref('')
  /** Short result of the last pipeline step, shown under the pipeline bar. */
  const actionMessage = ref('')
  const sceneStatuses = ref<Record<string, SceneJobStatus>>({})
  const recentArt = ref<RecentArt[]>([])
  const loadingRecentArt = ref(false)
  const songJob = ref<SongJobStatus | null>(null)
  let watchTimer: ReturnType<typeof setInterval> | null = null
  /** Produce (t-031): drive the whole pipeline from the page. */
  const producing = ref(false)
  const produceStage = ref('')
  const exportProgress = ref(0)
  let produceTimer: ReturnType<typeof setInterval> | null = null
  let producingId: number | null = null
  let produceAttempts: Record<string, number> = {}

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

  const hasPendingJobs = computed(
    () =>
      Boolean(
        songJob.value && PENDING_JOB_STATUSES.has(songJob.value.status),
      ) ||
      Object.values(sceneStatuses.value).some(
        (row) =>
          PENDING_JOB_STATUSES.has(row.status) ||
          PENDING_JOB_STATUSES.has(row.clipStatus ?? ''),
      ),
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
    // The row's own file route is private-capable but Bearer-only, so it gets
    // the blob treatment below like a row with no path at all.
    if (path && !path.includes(`/api/art/images/${artImageId}/file`)) {
      previewUrls.value[artImageId] = path
      return
    }
    // A still that never left the database (an upload, a fresh render) has no
    // imagePath; an <img> cannot send the Bearer token the file route needs for
    // a private row, so fetch the bytes here and hand the page a blob URL.
    if (!response.success || typeof window === 'undefined') return
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token || ''
    try {
      const file = await fetch(`/api/art/images/${artImageId}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (file.ok) {
        previewUrls.value[artImageId] = URL.createObjectURL(await file.blob())
      }
    } catch {
      // No preview is not an error: the scene still shows "no art yet".
    }
  }

  async function hydratePreviews(video: MusicVideo) {
    const ids = new Set<number>()
    if (video.finalArtImageId) ids.add(video.finalArtImageId)
    if (video.doc.song?.artImageId) ids.add(video.doc.song.artImageId)
    for (const scene of video.doc.scenes) {
      if (scene.image.artImageId) ids.add(scene.image.artImageId)
      if (scene.motion.clipArtImageId) ids.add(scene.motion.clipArtImageId)
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
      sceneStatuses.value = {}
      songJob.value = null
      actionMessage.value = ''
      void hydratePreviews(response.data)
      // Finished renders only reach the doc when something asks for their
      // status, so opening a video asks (t-027).
      void syncStatus()
      // A production left running in this browser picks up where it was.
      if (readProducingId() === id) startProduce()
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

  /*
   * PIPELINE STEPS (music-video/t-027).
   *
   * Every step was API-only, so the admin page could show a video but not move
   * it forward, and finished renders never reached the doc unless the headless
   * script asked for their status. Each step posts to its route, keeps the
   * returned video, and refreshes previews.
   */
  async function runStep<T>(
    action: string,
    url: string,
    body: unknown,
    pickVideo: (data: T) => MusicVideo | null | undefined,
    timeout = 60_000,
  ): Promise<{ data: T; message: string } | null> {
    const video = current.value
    if (!video || busyAction.value) return null
    busyAction.value = action
    actionMessage.value = ''
    clearError()
    try {
      const response = await performFetch<T>(
        url,
        { method: 'POST', body: JSON.stringify(body ?? {}) },
        0,
        timeout,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || `The ${action} step failed.`)
      }
      const next = pickVideo(response.data)
      if (next) {
        current.value = next
        void hydratePreviews(next)
      }
      actionMessage.value = response.message || ''
      return { data: response.data, message: response.message || '' }
    } catch (e) {
      error.value = errorMessage(e, `The ${action} step failed.`)
      return null
    } finally {
      busyAction.value = ''
    }
  }

  async function writeLyrics(): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<{ video: MusicVideo }>(
      'lyrics',
      `/api/music-video/${id}/lyrics`,
      {},
      (data) => data.video,
      120_000,
    )
    return Boolean(result)
  }

  async function generateSong(force = false): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<{ video: MusicVideo }>(
      'song',
      `/api/music-video/${id}/song`,
      { force },
      (data) => data.video,
    )
    if (result) void syncStatus()
    return Boolean(result)
  }

  async function planScenes(replace = false): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<MusicVideo>(
      'plan',
      `/api/music-video/${id}/scenes/plan`,
      { replace },
      (data) => data,
    )
    return Boolean(result)
  }

  async function writeScenePrompts(): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<{ video: MusicVideo }>(
      'prompts',
      `/api/music-video/${id}/scenes/prompts`,
      {},
      (data) => data.video,
      180_000,
    )
    return Boolean(result)
  }

  async function renderScenes(
    sceneIds?: string[],
    force = false,
  ): Promise<SceneActionOutcome[]> {
    const id = current.value?.id
    const result = await runStep<{
      video: MusicVideo
      outcomes: SceneActionOutcome[]
    }>(
      'render',
      `/api/music-video/${id}/scenes/render`,
      { sceneIds, force },
      (data) => data.video,
      120_000,
    )
    if (result) void syncStatus()
    return result?.data.outcomes ?? []
  }

  /** Queue image-to-video clips for the chosen hero scenes (at most 8 per call). */
  async function animateScenes(
    sceneIds: string[],
    presetId?: string,
    force = false,
  ): Promise<SceneActionOutcome[]> {
    const id = current.value?.id
    if (!sceneIds.length) return []
    const result = await runStep<{
      video: MusicVideo
      outcomes: SceneActionOutcome[]
    }>(
      'animate',
      `/api/music-video/${id}/scenes/clips`,
      { sceneIds: sceneIds.slice(0, 8), presetId, force },
      (data) => data.video,
      120_000,
    )
    if (result) void syncStatus()
    return result?.data.outcomes ?? []
  }

  async function setSceneImage(
    sceneId: string,
    artImageId: number,
  ): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<{ video: MusicVideo }>(
      'image',
      `/api/music-video/${id}/scenes/image`,
      { sceneId, artImageId },
      (data) => data.video,
    )
    return Boolean(result)
  }

  /** Upload a file as a private ArtImage and put it on the scene. */
  async function uploadSceneImage(
    sceneId: string,
    file: File,
  ): Promise<boolean> {
    const video = current.value
    if (!video || busyAction.value) return false
    busyAction.value = 'image'
    clearError()
    let artImageId: number
    try {
      const scene = video.doc.scenes.find((item) => item.id === sceneId)
      const form = new FormData()
      form.append('file', file)
      form.append('designer', 'music-video')
      form.append('isPublic', 'false')
      if (scene?.prompt)
        form.append('promptString', scene.prompt.slice(0, 2000))
      const response = await performFetch<{ id: number }>(
        '/api/art/upload',
        { method: 'POST', body: form },
        0,
        120_000,
      )
      const uploadedId = response.success ? response.data?.id : undefined
      if (!uploadedId) {
        throw new Error(response.message || 'Failed to upload the image.')
      }
      artImageId = uploadedId
    } catch (e) {
      error.value = errorMessage(e, 'Failed to upload the image.')
      return false
    } finally {
      busyAction.value = ''
    }
    return setSceneImage(sceneId, artImageId)
  }

  /*
   * Ask the server where every render stands. GET /scenes/status copies a
   * finished still or clip into the doc, and GET /song does the same for the
   * song, so this is also how the page catches up with renders that finished
   * while nobody was looking.
   */
  async function syncStatus(): Promise<void> {
    const video = current.value
    if (!video) return
    try {
      const [scenes, song] = await Promise.all([
        video.doc.scenes.length
          ? performFetch<{ scenes: SceneJobStatus[]; synced: boolean }>(
              `/api/music-video/${video.id}/scenes/status`,
              {},
              1,
              20_000,
            )
          : Promise.resolve(null),
        video.doc.song?.jobId
          ? performFetch<{ job: SongJobStatus | null; synced: boolean }>(
              `/api/music-video/${video.id}/song`,
              {},
              1,
              20_000,
            )
          : Promise.resolve(null),
      ])
      if (current.value?.id !== video.id) return
      if (scenes?.success && scenes.data) {
        sceneStatuses.value = Object.fromEntries(
          scenes.data.scenes.map((row) => [row.sceneId, row]),
        )
      }
      if (song?.success && song.data) songJob.value = song.data.job
      if (scenes?.data?.synced || song?.data?.synced) {
        const fresh = await performFetch<MusicVideo>(
          `/api/music-video/${video.id}`,
          {},
          1,
          20_000,
        )
        if (fresh.success && fresh.data && current.value?.id === video.id) {
          current.value = fresh.data
          void hydratePreviews(fresh.data)
        }
      }
    } catch {
      // A missed poll is retried by the next one.
    }
  }

  /** Poll while renders are queued; the page calls stop on unmount. */
  function startWatching(intervalMs = 20_000): void {
    stopWatching()
    if (typeof window === 'undefined') return
    watchTimer = setInterval(() => {
      if (hasPendingJobs.value) void syncStatus()
    }, intervalMs)
  }

  function stopWatching(): void {
    if (watchTimer) clearInterval(watchTimer)
    watchTimer = null
  }

  /** PATCH the whole doc with one part replaced; the server re-validates it. */
  async function patchDoc(
    change: Partial<MusicVideoDoc>,
    failure: string,
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
          body: JSON.stringify({ doc: { ...video.doc, ...change } }),
        },
        0,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || failure)
      }
      current.value = response.data
      void hydratePreviews(response.data)
      return true
    } catch (e) {
      error.value = errorMessage(e, failure)
      return false
    } finally {
      saving.value = false
    }
  }

  /** Title, pitch and settings in one save (t-032: one brief panel). */
  async function saveBrief(
    title: string,
    pitch: string,
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
            title,
            doc: {
              ...video.doc,
              pitch: pitch.slice(0, MUSIC_VIDEO_LIMITS.maxPitch),
              settings: { ...video.doc.settings, ...settings },
            },
          }),
        },
        0,
        20_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save the brief.')
      }
      current.value = response.data
      void loadList()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to save the brief.')
      return false
    } finally {
      saving.value = false
    }
  }

  /** Lyric line edits applied to a copy of the sections; out-of-range lines are ignored. */
  function withLyricEdits(edits: LyricLineEdit[]): MusicVideoSection[] {
    const sections = current.value?.doc.lyrics.sections ?? []
    return sections.map((section) => {
      const mine = edits.filter((edit) => edit.sectionId === section.id)
      if (!mine.length) return section
      const lines = [...section.lines]
      for (const edit of mine) {
        const text = edit.text.trim().slice(0, MUSIC_VIDEO_LIMITS.maxLine)
        // An emptied line is left alone: dropping it would shift every
        // scene's lyricRefs that point past it.
        if (text && edit.lineIdx >= 0 && edit.lineIdx < lines.length) {
          lines[edit.lineIdx] = text
        }
      }
      return { ...section, lines }
    })
  }

  /*
   * Recent finished images for "Replace image" (t-032: "replace image should
   * give us a choice from uploading or selecting from recent artjobs"). Clips
   * and songs are left out; previews load through the authenticated route.
   */
  async function loadRecentArt(): Promise<void> {
    if (loadingRecentArt.value) return
    loadingRecentArt.value = true
    try {
      const response = await performFetch<{
        jobs: {
          id: number
          artImageId: number | null
          engine?: string | null
          payload?: unknown
        }[]
      }>('/api/art/queue?status=DONE&limit=60', {}, 1, 20_000)
      if (!response.success || !response.data) return
      const seen = new Set<number>()
      recentArt.value = response.data.jobs
        .filter(
          (job) =>
            typeof job.artImageId === 'number' &&
            !CLIP_OR_AUDIO_ENGINES.has(String(job.engine ?? '').toLowerCase()),
        )
        .filter((job) => {
          const id = job.artImageId as number
          if (seen.has(id)) return false
          seen.add(id)
          return true
        })
        .slice(0, 24)
        .map((job) => {
          const payload =
            job.payload && typeof job.payload === 'object'
              ? (job.payload as Record<string, unknown>)
              : {}
          return {
            artImageId: job.artImageId as number,
            jobId: job.id,
            prompt: String(payload.promptString ?? '').slice(0, 160),
          }
        })
      await Promise.all(
        recentArt.value.map((art) => hydratePreview(art.artImageId)),
      )
    } finally {
      loadingRecentArt.value = false
    }
  }

  /** Save hand-edited lyrics (music-video/t-030). */
  function saveLyrics(sections: MusicVideoSection[]): Promise<boolean> {
    return patchDoc({ lyrics: { sections } }, 'Failed to save the lyrics.')
  }

  /** Rewrite one unlocked lyric section with the LLM, leaving the rest. */
  async function regenerateLyricSection(sectionId: string): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<{ video: MusicVideo }>(
      'lyrics',
      `/api/music-video/${id}/lyrics`,
      { sectionId },
      (data) => data.video,
      120_000,
    )
    return Boolean(result)
  }

  /**
   * Change one scene's prompt, motion, transition or framing, plus any lyric
   * lines edited inline under its image (t-032), in one save.
   */
  function updateScene(
    sceneId: string,
    change: (scene: MusicVideoScene) => MusicVideoScene,
    lyricEdits: LyricLineEdit[] = [],
  ): Promise<boolean> {
    const doc = current.value?.doc
    const scenes = doc?.scenes ?? []
    if (!doc || !scenes.some((scene) => scene.id === sceneId)) {
      return Promise.resolve(false)
    }
    return patchDoc(
      {
        scenes: scenes.map((scene) =>
          scene.id === sceneId ? change(scene) : scene,
        ),
        ...(lyricEdits.length
          ? { lyrics: { ...doc.lyrics, sections: withLyricEdits(lyricEdits) } }
          : {}),
      },
      'Failed to save the scene.',
    )
  }

  function saveMotionPresets(
    motionPresets: MusicVideoMotionPreset[],
  ): Promise<boolean> {
    return saveSettings({ motionPresets })
  }

  /** Ask the LLM to fill the settings the pitch leaves open (t-031). */
  async function fillBrief(): Promise<boolean> {
    const id = current.value?.id
    const result = await runStep<{ video: MusicVideo }>(
      'brief',
      `/api/music-video/${id}/brief`,
      {},
      (data) => data.video,
      120_000,
    )
    return Boolean(result)
  }

  function authHeaders(): Headers {
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token || ''
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  }

  /*
   * Render the final cut in this browser and attach it to the video, the
   * front-end replacement for the headless script's ffmpeg step. Stills, clips
   * and the song all come through the Bearer-authenticated file route.
   */
  async function exportAndAttach(): Promise<boolean> {
    const video = current.value
    if (!video || busyAction.value) return false
    busyAction.value = 'export'
    exportProgress.value = 0
    actionMessage.value = ''
    clearError()
    try {
      const fileUrl = (artImageId?: number) =>
        artImageId ? `/api/art/images/${artImageId}/file` : null
      const sceneById = new Map(
        video.doc.scenes.map((scene) => [scene.id, scene]),
      )
      const { exportMusicVideoMp4 } =
        await import('./helpers/musicVideoExporter')
      const blob = await exportMusicVideoMp4({
        doc: video.doc,
        songUrl: fileUrl(video.doc.song?.artImageId),
        imageUrlFor: (sceneId) =>
          fileUrl(sceneById.get(sceneId)?.image.artImageId),
        clipUrlFor: (sceneId) =>
          fileUrl(sceneById.get(sceneId)?.motion.clipArtImageId),
        headers: authHeaders(),
        onProgress: (fraction, label) => {
          exportProgress.value = fraction
          produceStage.value = label
        },
      })
      const form = new FormData()
      form.append(
        'file',
        new File([blob], `music-video-${video.id}.mp4`, { type: 'video/mp4' }),
      )
      const response = await performFetch<{ video: MusicVideo }>(
        `/api/music-video/${video.id}/final`,
        { method: 'POST', body: form },
        0,
        300_000,
      )
      if (!response.success || !response.data?.video) {
        throw new Error(response.message || 'Failed to attach the final cut.')
      }
      current.value = response.data.video
      void hydratePreviews(response.data.video)
      void loadList()
      actionMessage.value = `Final cut attached (${(blob.size / 1_048_576).toFixed(1)} MB).`
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Failed to export the final cut.')
      return false
    } finally {
      busyAction.value = ''
    }
  }

  const PRODUCING_KEY = 'kr-music-video-producing'

  function readProducingId(): number | null {
    try {
      const raw = window.localStorage.getItem(PRODUCING_KEY)
      return raw ? Number(raw) : null
    } catch {
      return null
    }
  }

  function writeProducingId(id: number | null) {
    try {
      if (id) window.localStorage.setItem(PRODUCING_KEY, String(id))
      else window.localStorage.removeItem(PRODUCING_KEY)
    } catch {
      // Without storage a reload simply ends the run; the doc keeps its state.
    }
  }

  /*
   * PRODUCE (music-video/t-031). Silas, 2026-10-06: "I should ideally not need
   * to run a script to stitch together things, it should happen automatically
   * when directed from the front end when all the images are created."
   *
   * One tick looks at where the video stands and does the next missing step:
   * brief -> lyrics -> song -> scenes -> prompts -> stills -> marked clips ->
   * export and attach. Renders run on the Comfy box, so most ticks just wait.
   * It runs while this page is open (and resumes after a reload); a server-side
   * runner for a closed tab is the follow-up.
   */
  function startProduce(): void {
    const video = current.value
    if (!video || typeof window === 'undefined') return
    producing.value = true
    producingId = video.id
    produceAttempts = {}
    produceStage.value = 'Starting'
    writeProducingId(video.id)
    if (produceTimer) clearInterval(produceTimer)
    produceTimer = setInterval(() => void produceTick(), 15_000)
    void produceTick()
  }

  function stopProduce(message = ''): void {
    producing.value = false
    producingId = null
    if (produceTimer) clearInterval(produceTimer)
    produceTimer = null
    writeProducingId(null)
    produceStage.value = message
  }

  /** Count an attempt at a step; false once it has used its tries. */
  function tryStep(key: string, max: number): boolean {
    produceAttempts[key] = (produceAttempts[key] ?? 0) + 1
    return (produceAttempts[key] ?? 0) <= max
  }

  let ticking = false
  async function produceTick(): Promise<void> {
    if (!producing.value || ticking) return
    if (busyAction.value || saving.value) return
    const video = current.value
    if (!video || video.id !== producingId) return
    ticking = true
    try {
      await syncStatus()
      const doc = current.value?.doc
      if (!doc) return
      const settings = doc.settings
      const status = sceneStatuses.value
      const pending = (value?: string | null) =>
        PENDING_JOB_STATUSES.has(value ?? '')

      if (briefHasGaps(settings) && tryStep('brief', 1)) {
        produceStage.value = 'Filling in the brief from the pitch'
        await fillBrief()
        return
      }

      const instrumental = settings.vocal === 'instrumental'
      const hasLyrics = doc.lyrics.sections.some((s) => s.lines.length)
      if (!instrumental && !hasLyrics) {
        if (!tryStep('lyrics', 2)) return stopProduce('Lyrics failed twice.')
        produceStage.value = 'Writing lyrics'
        await writeLyrics()
        return
      }

      if (!doc.song?.artImageId) {
        if (songJob.value && pending(songJob.value.status)) {
          produceStage.value = 'Waiting for the song'
          return
        }
        if (!tryStep('song', 2)) {
          return stopProduce(
            `The song failed${songJob.value?.error ? `: ${songJob.value.error}` : '.'}`,
          )
        }
        produceStage.value = 'Generating the song'
        await generateSong(Boolean(doc.song?.jobId))
        return
      }

      if (!doc.scenes.length) {
        if (!tryStep('plan', 2)) return stopProduce('Scene planning failed.')
        produceStage.value = 'Planning scenes on the beat grid'
        await planScenes(false)
        return
      }

      const generated = doc.scenes.filter((s) => s.image.source === 'generated')
      if (generated.some((s) => !s.prompt.trim())) {
        if (!tryStep('prompts', 3)) {
          return stopProduce('Some scene prompts were rejected three times.')
        }
        produceStage.value = 'Writing scene prompts'
        await writeScenePrompts()
        return
      }

      const stillless = doc.scenes.filter((s) => !s.image.artImageId)
      if (stillless.some((s) => pending(status[s.id]?.status))) {
        produceStage.value = `Waiting for stills (${doc.scenes.length - stillless.length}/${doc.scenes.length} done)`
        return
      }
      if (stillless.length) {
        const retry = stillless.filter((s) => tryStep(`still:${s.id}`, 2))
        if (!retry.length) {
          return stopProduce(
            `Stills failed twice for scene ${stillless.map((s) => s.id).join(', ')}.`,
          )
        }
        produceStage.value = `Rendering ${retry.length} still${retry.length === 1 ? '' : 's'}`
        await renderScenes(retry.map((s) => s.id))
        return
      }

      // Nothing marked to animate yet: pick the brief's hero shots, spread
      // evenly across the video, once.
      const heroes = settings.heroShots ?? 0
      if (
        heroes > 0 &&
        !doc.scenes.some((s) => s.motion.kind === 'clip') &&
        tryStep('heroes', 1)
      ) {
        produceStage.value = `Choosing ${heroes} hero shot${heroes === 1 ? '' : 's'}`
        const count = Math.min(heroes, doc.scenes.length)
        const picks = new Set(
          Array.from({ length: count }, (_, i) =>
            Math.floor(((i + 0.5) * doc.scenes.length) / count),
          ),
        )
        await patchDoc(
          {
            scenes: doc.scenes.map((scene, index) =>
              picks.has(index)
                ? { ...scene, motion: { ...scene.motion, kind: 'clip' } }
                : scene,
            ),
          },
          'Failed to mark the hero shots.',
        )
        return
      }

      const toAnimate = doc.scenes.filter(
        (s) => s.motion.kind === 'clip' && !s.motion.clipArtImageId,
      )
      if (toAnimate.some((s) => pending(status[s.id]?.clipStatus))) {
        produceStage.value = 'Waiting for hero-shot clips'
        return
      }
      // A clip that fails twice is dropped: that scene pans and zooms instead.
      const animate = toAnimate.filter((s) => tryStep(`clip:${s.id}`, 2))
      if (animate.length) {
        produceStage.value = `Animating ${animate.length} hero shot${animate.length === 1 ? '' : 's'}`
        await animateScenes(animate.slice(0, 8).map((s) => s.id))
        return
      }

      if (!tryStep('export', 2)) return stopProduce('The export failed twice.')
      produceStage.value = 'Exporting the final cut'
      if (await exportAndAttach()) {
        stopProduce('Done: the final cut is attached.')
      }
    } finally {
      ticking = false
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
    busyAction,
    actionMessage,
    sceneStatuses,
    songJob,
    hasPendingJobs,
    sceneCount,
    scenesWithImage,
    lyricLineCount,
    clearError,
    loadList,
    select,
    create,
    uploadSong,
    saveSettings,
    saveTimeline,
    assignKeyframes,
    writeLyrics,
    generateSong,
    planScenes,
    writeScenePrompts,
    renderScenes,
    animateScenes,
    setSceneImage,
    uploadSceneImage,
    syncStatus,
    saveLyrics,
    saveBrief,
    recentArt,
    loadingRecentArt,
    loadRecentArt,
    regenerateLyricSection,
    updateScene,
    saveMotionPresets,
    fillBrief,
    exportAndAttach,
    producing,
    produceStage,
    exportProgress,
    startProduce,
    stopProduce,
    startWatching,
    stopWatching,
    remove,
  }
})

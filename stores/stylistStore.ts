// /stores/stylistStore.ts
//
// Hair Studio (Superkate) state. Lives at store level on purpose so a styling
// job survives the user leaving and returning to the /stylist tab — the
// component is just a view over this store. See conductor superkate-hairstyle-ai
// t-007 (navigable async) and t-008 (durable per-client gallery).
//
// Client photos are always generated with isPublic:false and tagged
// designer:"stylist:<client>", so results stay private (never in public
// galleries or the memory-match game) and can be grouped per client later.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import type { ArtImage } from '~/prisma/generated/prisma/client'

export const STYLIST_DESIGNER_PREFIX = 'stylist:'

export type StylistJobStatus = 'pending' | 'done' | 'failed'

export type StylistJob = {
  id: number
  client: string
  before: string // data URL of the source photo (session-only)
  after: string | null // data URL of the result
  prompt: string
  status: StylistJobStatus
  error?: string
  artImageId?: number
  createdAt: number
}

export type StylistRunInput = {
  client: string
  before: string // data URL of the source photo
  prompt: string
}

/** designer tag stored on each generated ArtImage for a given client. */
export function stylistDesignerFor(client: string): string {
  const trimmed = client.trim()
  return trimmed ? `${STYLIST_DESIGNER_PREFIX}${trimmed}` : 'stylist'
}

/** The client name encoded in a stylist ArtImage's designer field, or ''. */
export function clientFromDesigner(designer?: string | null): string {
  if (!designer) return ''
  if (designer === 'stylist') return ''
  return designer.startsWith(STYLIST_DESIGNER_PREFIX)
    ? designer.slice(STYLIST_DESIGNER_PREFIX.length)
    : ''
}

function isStylistImage(image: ArtImage): boolean {
  return (image.designer ?? '').startsWith('stylist')
}

/** Turn a raw generation error into something Superkate can act on. */
export function friendlyError(raw: string): string {
  const message = (raw || '').toLowerCase()
  if (
    message.includes('mana') ||
    message.includes('balance') ||
    message.includes('insufficient') ||
    message.includes('afford')
  ) {
    return 'Not enough mana to style this photo — top up and try again.'
  }
  if (message.includes('timed out') || message.includes('timeout')) {
    return 'That took too long and timed out. Give it another try in a moment.'
  }
  if (
    message.includes('no active image generation server') ||
    message.includes('no art server') ||
    message.includes('server selected') ||
    message.includes('not active')
  ) {
    return 'No art server is responding right now. Check that a Comfy/Kontext server is active, then retry.'
  }
  if (message.includes('sign') || message.includes('account') || message.includes('auth')) {
    return 'Please sign in to use Hair Studio, then try again.'
  }
  return raw || 'Styling failed. Please try again.'
}

export const useStylistStore = defineStore('stylistStore', () => {
  const artStore = useArtStore()
  const userStore = useUserStore()

  // Live jobs from this session (before/after both available in memory).
  const jobs = ref<StylistJob[]>([])
  // Durable results loaded from the user's saved private stylist images.
  const history = ref<ArtImage[]>([])
  // Durable befores: the source photo of each finished styling travels in
  // its ArtJob payload, so past looks can show true before/after pairs
  // without any schema change. Keyed by result artImageId.
  const befores = ref<Record<number, string>>({})
  const isLoadingHistory = ref(false)
  const historyError = ref('')

  let seq = 0

  const pendingCount = computed(
    () => jobs.value.filter((job) => job.status === 'pending').length,
  )
  const isBusy = computed(() => pendingCount.value > 0)

  function jobsForClient(client: string): StylistJob[] {
    const target = client.trim().toLowerCase()
    if (!target) return jobs.value
    return jobs.value.filter(
      (job) => job.client.trim().toLowerCase() === target,
    )
  }

  function historyForClient(client: string): ArtImage[] {
    const target = client.trim().toLowerCase()
    if (!target) return history.value
    return history.value.filter(
      (image) => clientFromDesigner(image.designer).toLowerCase() === target,
    )
  }

  function patchJob(id: number, patch: Partial<StylistJob>) {
    jobs.value = jobs.value.map((job) =>
      job.id === id ? { ...job, ...patch } : job,
    )
  }

  // Generation goes through the durable ArtJob queue, NOT the direct
  // /api/comfy/kontext/generate route: the deployed backend is not on the
  // home tailnet, so dialing the Comfy server from it fails (ENOTFOUND on
  // ts.net names). The home relay agent claims queued jobs outward instead.
  const QUEUE_POLL_MS = 5_000
  const QUEUE_TIMEOUT_MS = 10 * 60_000

  type QueuedArtJob = {
    id: number
    status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
    artImageId?: number | null
    error?: string | null
  }

  function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function waitForQueuedJob(jobId: number): Promise<QueuedArtJob> {
    const startedAt = Date.now()

    while (Date.now() - startedAt < QUEUE_TIMEOUT_MS) {
      const response = await performFetch<{ job: QueuedArtJob }>(
        `/api/art/queue/${jobId}`,
        { method: 'GET' },
        2,
        20_000,
      )

      const job = response.success ? response.data?.job : null

      if (job?.status === 'DONE' || job?.status === 'FAILED') {
        return job
      }

      await sleep(QUEUE_POLL_MS)
    }

    throw new Error(
      'Styling timed out. The studio queue may be catching up — check Past looks in a few minutes.',
    )
  }

  async function runStylist(input: StylistRunInput): Promise<number> {
    const id = ++seq
    const client = input.client.trim()
    const before = input.before

    jobs.value = [
      {
        id,
        client,
        before,
        after: null,
        prompt: input.prompt,
        status: 'pending',
        createdAt: Date.now(),
      },
      ...jobs.value,
    ]

    try {
      const enqueue = await performFetch<{ jobId: number }>(
        '/api/comfy/kontext/enqueue',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: input.prompt,
            imageData: before,
            // Private: never public, never in the memory game.
            isPublic: false,
            isMature: false,
            designer: stylistDesignerFor(client),
            filenamePrefix: 'kindrobots_stylist',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
        2,
        60_000,
      )

      if (!enqueue.success || !enqueue.data?.jobId) {
        throw new Error(enqueue.message || 'Could not queue the styling job.')
      }

      const finished = await waitForQueuedJob(enqueue.data.jobId)

      if (finished.status !== 'DONE' || !finished.artImageId) {
        throw new Error(finished.error || 'Styling failed.')
      }

      const image = (await artStore.getArtImageById(finished.artImageId, {
        includeImageData: true,
        includeThumbnailData: true,
      })) as (ArtImage & { imageData?: string | null }) | null

      if (!image) {
        throw new Error('Styled image could not be loaded.')
      }

      const after = image.imageData
        ? `data:image/${image.fileType || 'png'};base64,${image.imageData}`
        : before

      patchJob(id, { status: 'done', after, artImageId: image.id })
      // Surface the new result in the durable history immediately.
      history.value = [image, ...history.value.filter((i) => i.id !== image.id)]
      befores.value = { ...befores.value, [image.id]: before }
    } catch (error) {
      patchJob(id, {
        status: 'failed',
        error: friendlyError(
          error instanceof Error ? error.message : 'Styling failed.',
        ),
      })
    }

    return id
  }

  async function retryJob(id: number): Promise<number | null> {
    const job = jobs.value.find((entry) => entry.id === id)
    if (!job) return null
    // Drop the failed job and re-run with the same inputs.
    jobs.value = jobs.value.filter((entry) => entry.id !== id)
    return runStylist({
      client: job.client,
      before: job.before,
      prompt: job.prompt,
    })
  }

  function dismissJob(id: number) {
    jobs.value = jobs.value.filter((job) => job.id !== id)
  }

  function beforeFor(artImageId: number): string {
    return befores.value[artImageId] || ''
  }

  type HistoricJob = {
    artImageId?: number | null
    payload?: {
      images?: Array<{ imageData?: string | null }>
      save?: { designer?: string | null }
    } | null
  }

  /** Recover before photos from the user's finished stylist ArtJobs. */
  async function loadBefores(): Promise<void> {
    try {
      const response = await performFetch<{ jobs: HistoricJob[] }>(
        '/api/art/queue?status=DONE&limit=50',
        { method: 'GET' },
        1,
        30_000,
      )

      if (!response.success || !Array.isArray(response.data?.jobs)) return

      const next: Record<number, string> = {}

      for (const job of response.data.jobs) {
        const designer = job.payload?.save?.designer || ''
        if (!designer.startsWith('stylist')) continue

        const raw = job.payload?.images?.[0]?.imageData || ''
        if (!job.artImageId || !raw) continue

        next[job.artImageId] = raw.startsWith('data:')
          ? raw
          : `data:image/png;base64,${raw}`
      }

      befores.value = next
    } catch {
      // Befores are an enhancement — history still renders without them.
    }
  }

  /**
   * Load the current user's saved stylist results (private) so past looks show
   * across sessions. Idempotent-ish: pass force to refetch.
   */
  async function loadHistory(force = false): Promise<void> {
    const userId = userStore.userId ?? userStore.user?.id ?? null
    if (!userId) return
    if (isLoadingHistory.value) return
    if (history.value.length && !force) return

    isLoadingHistory.value = true
    historyError.value = ''
    try {
      const response = await performFetch<{ art: ArtImage[] }>(
        `/api/art/user/${userId}`,
        { method: 'GET' },
        2,
        20000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load past looks.')
      }
      const art = Array.isArray(response.data.art) ? response.data.art : []
      history.value = art.filter(isStylistImage)
      void loadBefores()
    } catch (error) {
      historyError.value =
        error instanceof Error ? error.message : 'Could not load past looks.'
    } finally {
      isLoadingHistory.value = false
    }
  }

  return {
    jobs,
    history,
    befores,
    isLoadingHistory,
    historyError,
    pendingCount,
    isBusy,
    jobsForClient,
    historyForClient,
    beforeFor,
    runStylist,
    retryJob,
    dismissJob,
    loadHistory,
  }
})

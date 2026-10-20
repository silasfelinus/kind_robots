// /stores/helpers/narrativeArtJobsHelper.ts
import { useArtStore, type QueuedArtJob } from '@/stores/artStore'
import { useServerStore } from '@/stores/serverStore'
import { performFetch } from '@/stores/utils'
import {
  applyQueuedArtJobToNarrativeState,
  buildNarrativeArtGenerationData,
  createNarrativeArtJobState,
  type NarrativeArtJobState,
  type NarrativeArtPromptContext,
} from '@/utils/narrativeArtJobs'

const POLL_INTERVAL_MS = 5_000
const MAX_POLL_ATTEMPTS = 120
const pollTimers = new Map<string, ReturnType<typeof setTimeout>>()

/*
 * One poll chain per dedupeKey. `retry()`, `enqueue()` and `resume()` each start
 * a new chain for a key, but `clearPoll()` can only cancel the timer between
 * polls -- it cannot cancel a `getArtJobStatus()` / `getArtImageById()` that
 * is already awaiting. Before this epoch, a response from the replaced job
 * could land after the new chain had begun and `update()` the reader's state
 * back to the old jobId (and re-schedule polling for it). Every chain captures
 * the epoch it was started under and drops its result if the key has moved on.
 */
const pollEpochs = new Map<string, number>()

function currentEpoch(dedupeKey: string): number {
  return pollEpochs.get(dedupeKey) ?? 0
}

function bumpEpoch(dedupeKey: string): number {
  const next = currentEpoch(dedupeKey) + 1
  pollEpochs.set(dedupeKey, next)
  return next
}

type NarrativeArtUpdate = (state: NarrativeArtJobState) => void

function nowIso(): string {
  return new Date().toISOString()
}

function clearPoll(dedupeKey: string): void {
  const timer = pollTimers.get(dedupeKey)
  if (timer) clearTimeout(timer)
  pollTimers.delete(dedupeKey)
}

export function createNarrativeArtJobsController() {
  const artStore = useArtStore()
  const serverStore = useServerStore()

  async function ensureQueueReady(): Promise<void> {
    await artStore.initialize({
      fetchRemote: false,
      hydrateImages: false,
      initializeServerStore: false,
      initializeCollections: false,
    })
    if (!serverStore.hasLoaded) {
      await serverStore.initialize({ fetchRemote: true })
    }
  }

  async function recoverExistingJob(
    state: NarrativeArtJobState,
  ): Promise<QueuedArtJob | null> {
    const generationData = buildNarrativeArtGenerationData(state)
    const query = new URLSearchParams({
      product: state.product,
      sessionId: state.sessionId,
      beatId: state.beatId,
      moment: state.moment,
      dedupeKey: state.dedupeKey,
    })
    if (generationData.projectSlug) {
      query.set('projectSlug', generationData.projectSlug)
    }

    const response = await performFetch<{ job: QueuedArtJob | null }>(
      `/api/art/queue/narrative?${query.toString()}`,
      { method: 'GET' },
      1,
      20_000,
    )
    return response.success ? (response.data?.job ?? null) : null
  }

  function schedulePoll(
    state: NarrativeArtJobState,
    update: NarrativeArtUpdate,
    attempt: number,
    epoch: number,
  ): void {
    clearPoll(state.dedupeKey)
    if (epoch !== currentEpoch(state.dedupeKey)) return
    if (attempt >= MAX_POLL_ATTEMPTS) {
      update({
        ...state,
        error:
          'The illustration is still queued. It will resume checking when this story is opened again.',
        updatedAt: nowIso(),
      })
      return
    }

    const timer = setTimeout(() => {
      pollTimers.delete(state.dedupeKey)
      void poll(state, update, attempt + 1, epoch)
    }, POLL_INTERVAL_MS)
    pollTimers.set(state.dedupeKey, timer)
  }

  async function poll(
    state: NarrativeArtJobState,
    update: NarrativeArtUpdate,
    attempt = 0,
    epoch = currentEpoch(state.dedupeKey),
  ): Promise<void> {
    if (!state.jobId) return

    const job = await artStore.getArtJobStatus(state.jobId)
    if (epoch !== currentEpoch(state.dedupeKey)) return
    if (!job) {
      schedulePoll(state, update, attempt, epoch)
      return
    }

    let next = applyQueuedArtJobToNarrativeState(state, job)

    if (job.status === 'DONE' && job.artImageId) {
      const image = await artStore.getArtImageById(job.artImageId, { force: true })
      if (epoch !== currentEpoch(state.dedupeKey)) return
      const imagePath =
        image?.imagePath ||
        ((image as { path?: string | null } | undefined)?.path ?? null)
      if (!image || !imagePath) {
        next = {
          ...next,
          status: 'rendering',
          artImageId: job.artImageId,
          error: 'The rendered image record is still being finalized.',
          updatedAt: nowIso(),
        }
        update(next)
        schedulePoll(next, update, attempt, epoch)
        return
      }

      next = {
        ...next,
        status: 'done',
        artImageId: image.id,
        imagePath,
        error: null,
        updatedAt: nowIso(),
      }
      clearPoll(next.dedupeKey)
      update(next)
      return
    }

    update(next)
    if (next.status === 'queued' || next.status === 'rendering') {
      schedulePoll(next, update, attempt, epoch)
    } else {
      clearPoll(next.dedupeKey)
    }
  }

  async function submit(
    state: NarrativeArtJobState,
    update: NarrativeArtUpdate,
  ): Promise<void> {
    const epoch = currentEpoch(state.dedupeKey)
    try {
      await ensureQueueReady()
      const result = await artStore.enqueueArtGeneration(
        buildNarrativeArtGenerationData(state),
      )
      if (epoch !== currentEpoch(state.dedupeKey)) return

      if (!result.success || !result.jobId) {
        update({
          ...state,
          status: 'failed',
          error: result.message || 'The illustration could not be queued.',
          updatedAt: nowIso(),
        })
        return
      }

      const queued: NarrativeArtJobState = {
        ...state,
        jobId: result.jobId,
        status: 'queued',
        error: null,
        updatedAt: nowIso(),
      }
      update(queued)
      void poll(queued, update, 0, epoch)
    } catch (error) {
      if (epoch !== currentEpoch(state.dedupeKey)) return
      update({
        ...state,
        status: 'failed',
        error:
          error instanceof Error
            ? error.message
            : 'The illustration queue could not be prepared.',
        updatedAt: nowIso(),
      })
    }
  }

  async function enqueue(
    context: NarrativeArtPromptContext,
    update: NarrativeArtUpdate,
  ): Promise<void> {
    const state = createNarrativeArtJobState(context)
    bumpEpoch(state.dedupeKey)
    update(state)
    await submit(state, update)
  }

  async function recoverOrSubmit(
    state: NarrativeArtJobState,
    update: NarrativeArtUpdate,
  ): Promise<void> {
    const epoch = currentEpoch(state.dedupeKey)
    try {
      const recovered = await recoverExistingJob(state)
      if (epoch !== currentEpoch(state.dedupeKey)) return
      if (recovered) {
        const recoveredState = applyQueuedArtJobToNarrativeState(state, recovered)
        update(recoveredState)
        void poll(recoveredState, update, 0, epoch)
        return
      }
    } catch {
      // Recovery is best-effort. The enqueue endpoint has a second idempotency
      // check, so falling through remains safe.
    }
    await submit(state, update)
  }

  function resume(
    state: NarrativeArtJobState | null | undefined,
    update: NarrativeArtUpdate,
  ): void {
    if (!state || state.status === 'done') return
    if (state.status === 'failed' || state.status === 'cancelled') return

    // A reopened story starts a fresh chain; any chain still awaiting from the
    // previous mount drops its result instead of racing this one.
    bumpEpoch(state.dedupeKey)

    if (!state.jobId) {
      // Recover the already-paid job before invoking the mana-gated enqueue path.
      void recoverOrSubmit(state, update)
      return
    }

    void poll(state, update)
  }

  function retry(
    state: NarrativeArtJobState,
    update: NarrativeArtUpdate,
  ): void {
    clearPoll(state.dedupeKey)
    bumpEpoch(state.dedupeKey)
    const retryState: NarrativeArtJobState = {
      ...state,
      status: 'queueing',
      jobId: undefined,
      artImageId: undefined,
      imagePath: null,
      error: null,
      requestedAt: nowIso(),
      updatedAt: nowIso(),
    }
    update(retryState)
    void submit(retryState, update)
  }

  return {
    enqueue,
    resume,
    retry,
  }
}

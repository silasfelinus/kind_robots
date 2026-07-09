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
import { useServerStore } from '@/stores/serverStore'
import type { ArtImage, Server } from '~/prisma/generated/prisma/client'

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
  const serverStore = useServerStore()

  // Live jobs from this session (before/after both available in memory).
  const jobs = ref<StylistJob[]>([])
  // Durable results loaded from the user's saved private stylist images.
  const history = ref<ArtImage[]>([])
  const isLoadingHistory = ref(false)
  const historyError = ref('')

  let seq = 0

  const pendingCount = computed(
    () => jobs.value.filter((job) => job.status === 'pending').length,
  )
  const isBusy = computed(() => pendingCount.value > 0)

  function isUsableKontextServer(
    server: Server | null | undefined,
  ): server is Server {
    if (!server) return false
    if (!server.isActive) return false
    if (server.serverType !== 'COMFY') return false
    return true
  }

  const kontextServer = computed<Server | null>(() => {
    if (isUsableKontextServer(serverStore.activeArtServer)) {
      return serverStore.activeArtServer
    }
    const servers = Array.isArray(serverStore.servers)
      ? (serverStore.servers as Server[])
      : []
    return servers.find(isUsableKontextServer) || null
  })

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

    const base64Payload = before.includes(',')
      ? (before.split(',')[1] ?? before)
      : before

    try {
      const result = await artStore.generateArt({
        promptString: input.prompt,
        userId: userStore.userId ?? undefined,
        serverId: kontextServer.value?.id ?? null,
        serverName: kontextServer.value?.title ?? null,
        engine: 'kontext',
        transport: 'backend',
        // Private: never public, never in the memory game.
        isPublic: false,
        isMature: false,
        designer: stylistDesignerFor(client),
        sourceImageBase64: base64Payload,
      })

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Styling failed.')
      }

      const image = result.data
      const after = image.imageData
        ? `data:image/${image.fileType || 'png'};base64,${image.imageData}`
        : before

      patchJob(id, { status: 'done', after, artImageId: image.id })
      // Surface the new result in the durable history immediately.
      history.value = [image, ...history.value.filter((i) => i.id !== image.id)]
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
    isLoadingHistory,
    historyError,
    pendingCount,
    isBusy,
    kontextServer,
    jobsForClient,
    historyForClient,
    runStylist,
    retryJob,
    dismissJob,
    loadHistory,
  }
})

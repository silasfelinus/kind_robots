// /stores/advertStore.ts
//
// Advert Studio state (pages/admin/adverts.vue). The posters themselves are the
// typed registry in utils/adverts/posters.ts; this store layers the chosen art
// on top of it, queues new renders for a poster slot, syncs finished renders
// into the slot's candidates, files edit requests as AGENT todos on the game's
// Project row, and exports posters as PNGs.
//
// Art for slot `adverts/<poster>/<image>`: the slot's chosen ArtImage
// (GET /api/art/slots/selected) when there is one, else the registry default.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { handleError, performFetch } from '@/stores/utils'
import {
  useArtSlotStore,
  type ArtSlot,
  type ArtSlotCandidate,
} from '@/stores/artSlotStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTodoStore, type Todo, type TodoPriority } from '@/stores/todoStore'
import {
  ADVERT_DEFAULT_ENGINE,
  ADVERT_EXPORT_PIXEL_RATIO,
  ADVERT_POSTER_HEIGHT,
  ADVERT_POSTER_WIDTH,
  ADVERT_POSTERS,
  ADVERT_PROJECT_SLUG,
  ADVERT_SLOT_PREFIX,
  advertEditDescription,
  advertEditMarker,
  advertEditTitle,
  advertPosterBySlug,
  advertPromptNegations,
  advertRequestKey,
  advertSlots,
  advertSlotByKey,
  type AdvertEditField,
  type AdvertEngine,
  type AdvertPoster,
} from '@/utils/adverts/posters'

const BUNDLED_ART = import.meta.glob<string>(
  [
    '../assets/images/cthulhuquarium/backgrounds/flooded-conservatory.webp',
    '../assets/images/cthulhuquarium/cthulhuquarium-char-charlotte-fishmonger.webp',
  ],
  { eager: true, query: '?url', import: 'default' },
)

function bundledArt(src: string): string {
  if (!src.startsWith('asset:')) return src
  const path = `../assets/images/${src.slice('asset:'.length)}`
  return BUNDLED_ART[path] ?? ''
}

function artImageFile(artImageId: number): string {
  return `/api/art/images/${artImageId}/file`
}

export type AdvertPosterView = {
  poster: AdvertPoster
  images: Record<string, string>
}

export type AdvertRenderRequest = {
  posterSlug: string
  slotKey: string
  prompt: string
  engine: AdvertEngine
  width: number
  height: number
  seed: number | null
}

export type AdvertQueuedRender = {
  slotKey: string
  jobId: number
  status: string
  queuedAt: string
}

export type AdvertSyncSummary = {
  scanned: number
  matched: number
  created: number
  existing: number
  missing: number
}

export type AdvertEditRequest = {
  posterSlug: string
  field: AdvertEditField
  text: string
  priority: TodoPriority
}

export const useAdvertStore = defineStore('advertStore', () => {
  const selections = ref<Record<string, number>>({})
  const slots = ref<Record<string, ArtSlot>>({})
  const queued = ref<AdvertQueuedRender[]>([])
  const selectedSlug = ref<string | null>(null)
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const isQueueing = ref(false)
  const isFiling = ref(false)
  const exportingSlug = ref<string | null>(null)
  const errorMessage = ref('')
  const notice = ref('')
  const lastSync = ref<AdvertSyncSummary | null>(null)
  const posterElements = new Map<string, HTMLElement>()

  function imageForSlot(slotKey: string, defaultSrc: string): string {
    const chosen = selections.value[slotKey]
    return chosen ? artImageFile(chosen) : bundledArt(defaultSrc)
  }

  const posters = computed<AdvertPosterView[]>(() =>
    ADVERT_POSTERS.map((entry) => ({
      poster: entry,
      images: Object.fromEntries(
        advertSlots(entry).map((slot) => [
          slot.key,
          imageForSlot(slot.key, slot.defaultSrc),
        ]),
      ),
    })),
  )

  const selected = computed(
    () =>
      posters.value.find((view) => view.poster.slug === selectedSlug.value) ??
      null,
  )

  function select(slug: string | null): void {
    selectedSlug.value = advertPosterBySlug(slug) ? slug : null
  }

  function step(offset: number): void {
    const index = ADVERT_POSTERS.findIndex(
      (entry) => entry.slug === selectedSlug.value,
    )
    const next =
      (index + offset + ADVERT_POSTERS.length) % ADVERT_POSTERS.length
    selectedSlug.value = ADVERT_POSTERS[next]?.slug ?? null
  }

  function slotFor(slotKey: string): ArtSlot | null {
    return slots.value[slotKey] ?? null
  }

  function candidatesFor(slotKey: string): ArtSlotCandidate[] {
    return (slotFor(slotKey)?.candidates ?? []).filter(
      (candidate) => candidate.verdict !== 'duplicate' && candidate.isActive,
    )
  }

  function queuedFor(slotKey: string): AdvertQueuedRender[] {
    return queued.value.filter((entry) => entry.slotKey === slotKey)
  }

  async function loadSelections(): Promise<void> {
    const res = await performFetch<{
      slots: Array<{ slotKey: string; artImageId: number }>
    }>(
      `/api/art/slots/selected?prefix=${encodeURIComponent(ADVERT_SLOT_PREFIX)}`,
    )
    if (!res.success || !res.data)
      throw new Error(res.message || 'Could not read the chosen poster art.')
    selections.value = Object.fromEntries(
      res.data.slots.map((slot) => [slot.slotKey, slot.artImageId]),
    )
  }

  async function loadPublicSelections(): Promise<void> {
    try {
      const res = await performFetch<{
        slots: Array<{ slotKey: string; artImageId: number }>
      }>('/api/adverts/public-art')
      if (!res.success || !res.data)
        throw new Error(res.message || 'Could not read public poster art.')
      selections.value = Object.fromEntries(
        res.data.slots.map((slot) => [slot.slotKey, slot.artImageId]),
      )
    } catch (error) {
      handleError(error, 'loading public advert art')
    }
  }

  async function loadSlots(): Promise<void> {
    const params = new URLSearchParams({
      prefix: ADVERT_SLOT_PREFIX,
      pageSize: '100',
    })
    const res = await performFetch<{ slots: ArtSlot[] }>(
      `/api/art/slots?${params.toString()}`,
    )
    if (!res.success || !res.data)
      throw new Error(res.message || 'Could not load the poster art slots.')
    slots.value = Object.fromEntries(
      res.data.slots.map((slot) => [slot.slotKey, slot]),
    )
  }

  async function refreshArt(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      await Promise.all([loadSelections(), loadSlots()])
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load poster art.'
      handleError(error, 'loading advert art')
    } finally {
      isLoading.value = false
    }
  }

  async function syncRenders(): Promise<AdvertSyncSummary | null> {
    isSyncing.value = true
    errorMessage.value = ''
    try {
      const res = await performFetch<AdvertSyncSummary>(
        '/api/adverts/art/sync',
        { method: 'POST' },
        1,
        30000,
      )
      if (!res.success || !res.data)
        throw new Error(res.message || 'Could not check for new renders.')
      lastSync.value = res.data
      notice.value = res.data.created
        ? `${res.data.created} new render(s) ready to choose.`
        : 'No new renders yet.'
      await refreshArt()
      return res.data
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not sync renders.'
      handleError(error, 'syncing advert renders')
      return null
    } finally {
      isSyncing.value = false
    }
  }

  async function open(): Promise<void> {
    await refreshArt()
    await syncRenders()
  }

  async function chooseCandidate(
    slotKey: string,
    candidate: ArtSlotCandidate,
  ): Promise<boolean> {
    const slot = slotFor(slotKey)
    if (!slot) return false
    const artSlotStore = useArtSlotStore()
    const ok = await artSlotStore.choose(slot, candidate)
    if (!ok) {
      errorMessage.value =
        artSlotStore.errorMessage || 'Could not choose that render.'
      return false
    }
    selections.value = {
      ...selections.value,
      [slotKey]: candidate.artImageId,
    }
    notice.value = `Poster now uses render #${candidate.artImageId}.`
    return true
  }

  async function queueRender(request: AdvertRenderRequest): Promise<boolean> {
    errorMessage.value = ''
    const match = advertSlotByKey(request.slotKey)
    const prompt = request.prompt.trim()
    if (!match || match.poster.slug !== request.posterSlug) {
      errorMessage.value = 'That slot is not part of this poster.'
      return false
    }
    if (!prompt) {
      errorMessage.value = 'Describe the picture to render.'
      return false
    }
    const negations = advertPromptNegations(prompt)
    if (negations.length) {
      errorMessage.value = `Describe only what should be in the picture. Remove: ${negations.join(', ')}.`
      return false
    }
    isQueueing.value = true
    try {
      const body: Record<string, unknown> = {
        engine: request.engine || ADVERT_DEFAULT_ENGINE,
        promptString: prompt,
        width: request.width,
        height: request.height,
        isPublic: false,
        projectSlug: ADVERT_PROJECT_SLUG,
        designer: `Advert Studio: ${match.poster.name}`,
        requestKey: advertRequestKey(request.slotKey, Date.now().toString(36)),
      }
      if (request.seed !== null && Number.isSafeInteger(request.seed))
        body.seed = request.seed
      const res = await performFetch<{ jobId?: number; status?: string }>(
        '/api/art/enqueue',
        { method: 'POST', body: JSON.stringify(body) },
        1,
        30000,
      )
      const jobId = Number(res.data?.jobId)
      if (!res.success || !Number.isInteger(jobId))
        throw new Error(res.message || 'The render was not queued.')
      queued.value = [
        {
          slotKey: request.slotKey,
          jobId,
          status: res.data?.status ?? 'PENDING',
          queuedAt: new Date().toISOString(),
        },
        ...queued.value,
      ]
      notice.value = `Queued ArtJob #${jobId}. Check for new renders once it finishes.`
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not queue the render.'
      handleError(error, 'queueing advert art')
      return false
    } finally {
      isQueueing.value = false
    }
  }

  async function projectIdFor(entry: AdvertPoster): Promise<number | null> {
    const projectStore = useProjectStore()
    if (!projectStore.projectForSlug(entry.conductorSlug))
      await projectStore.fetchProjects({
        includeInactive: true,
        includeMature: true,
      })
    return projectStore.projectForSlug(entry.conductorSlug)?.id ?? null
  }

  async function loadRequests(posterSlug: string): Promise<void> {
    const entry = advertPosterBySlug(posterSlug)
    if (!entry) return
    const projectId = await projectIdFor(entry)
    if (projectId) await useTodoStore().fetchProjectTodos(projectId)
  }

  function requestsFor(posterSlug: string): Todo[] {
    const marker = advertEditMarker(posterSlug)
    return useTodoStore()
      .todos.filter((todo) => todo.description?.includes(marker))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8)
  }

  async function fileEditRequest(request: AdvertEditRequest): Promise<boolean> {
    errorMessage.value = ''
    const entry = advertPosterBySlug(request.posterSlug)
    const text = request.text.trim()
    if (!entry || !text) {
      errorMessage.value = 'Say what should change on the poster.'
      return false
    }
    isFiling.value = true
    try {
      const projectId = await projectIdFor(entry)
      const todoStore = useTodoStore()
      const todo = await todoStore.createTodo({
        title: advertEditTitle(text),
        description: advertEditDescription(entry, request.field, text),
        category: 'AGENT',
        priority: request.priority,
        icon: 'kind-icon:megaphone',
        projectId,
      })
      if (!todo)
        throw new Error(todoStore.lastError || 'The request was not filed.')
      notice.value = projectId
        ? `Filed for ${entry.name}.`
        : `Filed, but no Project row matches "${entry.conductorSlug}", so it is unlinked.`
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not file the request.'
      handleError(error, 'filing an advert edit request')
      return false
    } finally {
      isFiling.value = false
    }
  }

  function registerPosterElement(slug: string, element: HTMLElement): void {
    posterElements.set(slug, element)
  }

  function releasePosterElement(slug: string, element: HTMLElement): void {
    if (posterElements.get(slug) === element) posterElements.delete(slug)
  }

  async function renderPng(slug: string): Promise<string> {
    const element = posterElements.get(slug)
    const entry = advertPosterBySlug(slug)
    if (!element || !entry) throw new Error('That poster is not on screen.')
    await document.fonts?.ready
    const { domToPng } = await import('modern-screenshot')
    return domToPng(element, {
      width: ADVERT_POSTER_WIDTH,
      height: ADVERT_POSTER_HEIGHT,
      scale: ADVERT_EXPORT_PIXEL_RATIO,
      backgroundColor: entry.palette.bg,
      timeout: 30000,
    })
  }

  function saveDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function exportPng(slug: string): Promise<boolean> {
    exportingSlug.value = slug
    errorMessage.value = ''
    try {
      saveDataUrl(await renderPng(slug), `kind-robots-${slug}-splash.png`)
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not build the PNG.'
      handleError(error, 'exporting an advert poster')
      return false
    } finally {
      exportingSlug.value = null
    }
  }

  async function exportAll(): Promise<number> {
    let saved = 0
    for (const entry of ADVERT_POSTERS) {
      if (await exportPng(entry.slug)) saved += 1
    }
    notice.value = `Saved ${saved} of ${ADVERT_POSTERS.length} posters.`
    return saved
  }

  return {
    selections,
    slots,
    queued,
    selectedSlug,
    isLoading,
    isSyncing,
    isQueueing,
    isFiling,
    exportingSlug,
    errorMessage,
    notice,
    lastSync,
    posters,
    selected,
    select,
    step,
    slotFor,
    candidatesFor,
    queuedFor,
    refreshArt,
    loadPublicSelections,
    syncRenders,
    open,
    chooseCandidate,
    queueRender,
    loadRequests,
    requestsFor,
    fileEditRequest,
    registerPosterElement,
    releasePosterElement,
    exportPng,
    exportAll,
  }
})

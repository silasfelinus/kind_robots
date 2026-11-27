import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import type {
  TarotArtEnqueueBody,
  TarotArtRecord,
  TarotCardEdit,
  TarotCardRecord,
  TarotDeckEdit,
  TarotDeckRecord,
  TarotDesignEdit,
  TarotDesignRecord,
} from '~/types/tarotStudio'
import { TAROT_SAMPLE_CARD_KEYS } from '~/utils/tarotStudio'

export type TarotArtScope = 'samples' | 'set' | 'cards' | 'back'

type PreparedArt = { art: TarotArtRecord; request: TarotArtEnqueueBody }

const ENQUEUE_CONCURRENCY = 3
const AUTO_SYNC_MS = 20000

export const useTarotStudioStore = defineStore('tarotStudio', () => {
  const userStore = useUserStore()
  const decks = ref<TarotDeckRecord[]>([])
  const activeSlug = ref('superkate')
  const selectedCardId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const syncing = ref(false)
  const error = ref('')
  const notice = ref('')
  const enqueueProgress = ref({ done: 0, total: 0, failed: 0 })
  let autoSyncTimer: ReturnType<typeof setInterval> | null = null

  const activeDeck = computed(
    () => decks.value.find((deck) => deck.slug === activeSlug.value) ?? null,
  )
  const cards = computed(() => activeDeck.value?.Cards ?? [])
  const designs = computed(() => activeDeck.value?.Designs ?? [])
  const art = computed(() => activeDeck.value?.Art ?? [])
  const selectedCard = computed(
    () => cards.value.find((card) => card.id === selectedCardId.value) ?? null,
  )
  const approvedDesign = computed(
    () =>
      designs.value.find(
        (design) => design.id === activeDeck.value?.approvedDesignId,
      ) ?? null,
  )
  const approvedCount = computed(
    () => cards.value.filter((card) => card.status === 'APPROVED').length,
  )
  const renderedCount = computed(
    () => cards.value.filter((card) => Boolean(card.selectedArtId)).length,
  )
  const openArtCount = computed(
    () =>
      art.value.filter(
        (entry) => entry.status === 'PENDING' || entry.status === 'QUEUED',
      ).length,
  )
  const checkpoints = computed(() => [
    'all',
    'default',
    ...new Set(
      cards.value
        .map((card) => card.checkpoint)
        .filter((name): name is string => Boolean(name)),
    ),
  ])
  const sampleCards = computed(() =>
    TAROT_SAMPLE_CARD_KEYS.map((key) =>
      cards.value.find((card) => card.key === key),
    ).filter((card): card is TarotCardRecord => Boolean(card)),
  )
  const backArt = computed(
    () =>
      art.value.find((entry) => entry.id === activeDeck.value?.backArtId) ??
      null,
  )
  const backVariants = computed(() =>
    art.value.filter((entry) => entry.side === 'BACK'),
  )

  function artUrl(entry: Pick<TarotArtRecord, 'id'>) {
    return `/api/tarot/art/${entry.id}/image`
  }

  function artForCard(cardId: number) {
    return art.value.filter((entry) => entry.cardId === cardId)
  }

  /** Latest art per sample slot ('back' or a card key) for one design. */
  function samplesForDesign(designId: number) {
    const slots: Record<string, TarotArtRecord | null> = { back: null }
    for (const card of sampleCards.value) slots[card.key] = null
    for (const entry of art.value) {
      if (entry.designId !== designId || entry.status === 'REJECTED') continue
      const key =
        entry.side === 'BACK'
          ? 'back'
          : cards.value.find((card) => card.id === entry.cardId)?.key
      if (!key || !(key in slots) || slots[key]) continue
      slots[key] = entry
    }
    return slots
  }

  function designById(id: number | null) {
    return designs.value.find((design) => design.id === id) ?? null
  }

  function replaceDeck(deck: TarotDeckRecord) {
    const index = decks.value.findIndex((entry) => entry.slug === deck.slug)
    if (index === -1) decks.value.push(deck)
    else decks.value[index] = deck
  }

  function selectDeck(slug: string) {
    if (!decks.value.some((deck) => deck.slug === slug)) return
    activeSlug.value = slug
    selectedCardId.value =
      decks.value.find((deck) => deck.slug === slug)?.Cards[0]?.id ?? null
  }

  function selectCard(id: number) {
    selectedCardId.value = id
    notice.value = ''
  }

  function fail(caught: unknown, fallback: string) {
    error.value = caught instanceof Error ? caught.message : fallback
    return false
  }

  async function load(): Promise<boolean> {
    if (!userStore.isAdmin || loading.value) return false
    loading.value = true
    error.value = ''
    try {
      let response = await performFetch<TarotDeckRecord[]>('/api/tarot', {
        cache: 'no-store',
      })
      const needsSeed =
        response.success &&
        (!response.data?.length ||
          response.data.some((deck) => !deck.Designs?.length))
      if (needsSeed) {
        const initial = await performFetch<string[]>(
          '/api/tarot/bootstrap',
          { method: 'POST' },
          1,
          45000,
        )
        if (!initial.success) {
          throw new Error(
            initial.message || 'Could not initialize tarot decks.',
          )
        }
        response = await performFetch<TarotDeckRecord[]>('/api/tarot', {
          cache: 'no-store',
        })
      }
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load the deck bible.')
      }
      decks.value = response.data
      if (!decks.value.some((deck) => deck.slug === activeSlug.value)) {
        activeSlug.value = decks.value[0]?.slug ?? ''
      }
      if (!cards.value.some((card) => card.id === selectedCardId.value)) {
        selectedCardId.value = cards.value[0]?.id ?? null
      }
      return true
    } catch (caught) {
      return fail(caught, 'Deck loading failed.')
    } finally {
      loading.value = false
    }
  }

  function patchCard(card: TarotCardRecord) {
    const deck = activeDeck.value
    if (!deck) return
    const index = deck.Cards.findIndex((entry) => entry.id === card.id)
    if (index !== -1) deck.Cards[index] = card
  }

  function patchArt(entry: TarotArtRecord) {
    const deck = activeDeck.value
    if (!deck) return
    const index = deck.Art.findIndex((item) => item.id === entry.id)
    if (index === -1) deck.Art.unshift(entry)
    else deck.Art[index] = entry
  }

  async function saveCard(id: number, edit: TarotCardEdit): Promise<boolean> {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const patch: Partial<TarotCardEdit> = { ...edit }
      if (!['DRAFT', 'REVIEW', 'REJECTED'].includes(patch.status ?? '')) {
        delete patch.status
      }
      const result = await performFetch<TarotCardRecord>(
        `/api/tarot/cards/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Card save failed.')
      }
      patchCard(result.data)
      notice.value = `${result.data.title} saved to the private bible.`
      return true
    } catch (caught) {
      return fail(caught, 'Card save failed.')
    } finally {
      saving.value = false
    }
  }

  async function saveDeck(edit: TarotDeckEdit): Promise<boolean> {
    if (!userStore.isAdmin || !activeDeck.value) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<TarotDeckRecord>(
        `/api/tarot/decks/${activeSlug.value}`,
        { method: 'PATCH', body: JSON.stringify(edit) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Deck save failed.')
      }
      replaceDeck(result.data)
      notice.value = `${result.data.title} bible saved.`
      return true
    } catch (caught) {
      return fail(caught, 'Deck save failed.')
    } finally {
      saving.value = false
    }
  }

  async function createDeck(title: string): Promise<boolean> {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<TarotDeckRecord>('/api/tarot/decks', {
        method: 'POST',
        body: JSON.stringify({ title }),
      })
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Deck creation failed.')
      }
      decks.value.push(result.data)
      selectDeck(result.data.slug)
      notice.value = 'New private 78-card deck initialized with five designs.'
      return true
    } catch (caught) {
      return fail(caught, 'Deck creation failed.')
    } finally {
      saving.value = false
    }
  }

  async function createDesign(title: string, stylePrompt: string) {
    if (!userStore.isAdmin || !activeDeck.value) return false
    saving.value = true
    error.value = ''
    try {
      const result = await performFetch<TarotDesignRecord>(
        '/api/tarot/designs',
        {
          method: 'POST',
          body: JSON.stringify({
            deckSlug: activeSlug.value,
            title,
            stylePrompt,
          }),
        },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Design creation failed.')
      }
      activeDeck.value.Designs.push(result.data)
      notice.value = result.message || 'Design added.'
      return true
    } catch (caught) {
      return fail(caught, 'Design creation failed.')
    } finally {
      saving.value = false
    }
  }

  async function saveDesign(
    id: number,
    edit: Partial<TarotDesignEdit> & { status?: 'EXPLORING' | 'ARCHIVED' },
  ) {
    if (!userStore.isAdmin || !activeDeck.value) return false
    saving.value = true
    error.value = ''
    try {
      const result = await performFetch<TarotDesignRecord>(
        `/api/tarot/designs/${id}`,
        { method: 'PATCH', body: JSON.stringify(edit) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Design save failed.')
      }
      const list = activeDeck.value.Designs
      const index = list.findIndex((design) => design.id === id)
      if (index !== -1) list[index] = result.data
      if (edit.status && activeDeck.value.approvedDesignId === id) {
        activeDeck.value.approvedDesignId = null
      }
      notice.value = result.message || 'Design saved.'
      return true
    } catch (caught) {
      return fail(caught, 'Design save failed.')
    } finally {
      saving.value = false
    }
  }

  async function approveDesign(id: number) {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    try {
      const result = await performFetch<TarotDeckRecord>(
        `/api/tarot/designs/${id}/approve`,
        { method: 'POST' },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Design approval failed.')
      }
      replaceDeck(result.data)
      notice.value = result.message || 'Design approved.'
      return true
    } catch (caught) {
      return fail(caught, 'Design approval failed.')
    } finally {
      saving.value = false
    }
  }

  async function enqueueOne(item: PreparedArt) {
    const enqueued = await performFetch<{ jobId?: number }>(
      '/api/art/enqueue',
      { method: 'POST', body: JSON.stringify(item.request) },
      2,
      60000,
    )
    const jobId = enqueued.data?.jobId
    if (enqueued.success && jobId) {
      const recorded = await performFetch<TarotArtRecord>(
        `/api/tarot/art/${item.art.id}`,
        { method: 'PATCH', body: JSON.stringify({ artJobId: jobId }) },
      )
      if (recorded.success && recorded.data) patchArt(recorded.data)
      return true
    }
    const failed = await performFetch<TarotArtRecord>(
      `/api/tarot/art/${item.art.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'FAILED',
          error: enqueued.message || 'Enqueue failed.',
        }),
      },
    )
    if (failed.success && failed.data) patchArt(failed.data)
    return false
  }

  async function requestArt(
    scope: TarotArtScope,
    options: { designId?: number; cardIds?: number[]; force?: boolean } = {},
  ): Promise<boolean> {
    if (!userStore.isAdmin || !activeDeck.value) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const prepared = await performFetch<PreparedArt[]>(
        '/api/tarot/art',
        {
          method: 'POST',
          body: JSON.stringify({
            deckSlug: activeSlug.value,
            scope,
            ...options,
          }),
        },
        1,
        45000,
      )
      if (!prepared.success || !prepared.data) {
        throw new Error(prepared.message || 'Could not prepare art requests.')
      }
      const items = prepared.data
      for (const item of items) patchArt(item.art)
      enqueueProgress.value = { done: 0, total: items.length, failed: 0 }
      const queue = [...items]
      const worker = async () => {
        while (queue.length) {
          const item = queue.shift()
          if (!item) break
          const ok = await enqueueOne(item)
          enqueueProgress.value.done++
          if (!ok) enqueueProgress.value.failed++
        }
      }
      await Promise.all(
        Array.from(
          { length: Math.min(ENQUEUE_CONCURRENCY, items.length) },
          worker,
        ),
      )
      const { total, failed } = enqueueProgress.value
      notice.value = total
        ? `${total - failed} of ${total} queued as ArtJobs${failed ? `; ${failed} failed to enqueue` : ''}. Renders appear here as they are delivered.`
        : prepared.message || 'Nothing new to render.'
      startAutoSync()
      return failed === 0
    } catch (caught) {
      return fail(caught, 'Art request failed.')
    } finally {
      saving.value = false
    }
  }

  async function syncArt(quiet = false): Promise<boolean> {
    if (!userStore.isAdmin || !activeDeck.value || syncing.value) return false
    syncing.value = true
    if (!quiet) error.value = ''
    try {
      const result = await performFetch<{ deck: TarotDeckRecord }>(
        '/api/tarot/art/sync',
        {
          method: 'POST',
          body: JSON.stringify({ deckSlug: activeSlug.value }),
        },
        1,
        30000,
      )
      if (!result.success || !result.data?.deck) {
        throw new Error(result.message || 'Art sync failed.')
      }
      replaceDeck(result.data.deck)
      if (!quiet) notice.value = result.message || 'Art synced.'
      if (!openArtCount.value) stopAutoSync()
      return true
    } catch (caught) {
      return quiet ? false : fail(caught, 'Art sync failed.')
    } finally {
      syncing.value = false
    }
  }

  function startAutoSync() {
    if (autoSyncTimer || typeof window === 'undefined') return
    autoSyncTimer = setInterval(() => {
      if (!openArtCount.value) {
        stopAutoSync()
        return
      }
      void syncArt(true)
    }, AUTO_SYNC_MS)
  }

  function stopAutoSync() {
    if (!autoSyncTimer) return
    clearInterval(autoSyncTimer)
    autoSyncTimer = null
  }

  async function selectArt(cardId: number, artId: number, approve = false) {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    try {
      const result = await performFetch<TarotCardRecord>(
        `/api/tarot/cards/${cardId}/select-art`,
        { method: 'POST', body: JSON.stringify({ artId, approve }) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Could not choose that art.')
      }
      patchCard(result.data)
      notice.value = result.message || 'Default art updated.'
      return true
    } catch (caught) {
      return fail(caught, 'Could not choose that art.')
    } finally {
      saving.value = false
    }
  }

  async function setArtStatus(artId: number, status: 'REJECTED' | 'RENDERED') {
    if (!userStore.isAdmin) return false
    error.value = ''
    try {
      const result = await performFetch<TarotArtRecord>(
        `/api/tarot/art/${artId}`,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Art update failed.')
      }
      patchArt(result.data)
      return true
    } catch (caught) {
      return fail(caught, 'Art update failed.')
    }
  }

  async function setBack(artId: number) {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    try {
      const result = await performFetch<TarotDeckRecord>(
        `/api/tarot/decks/${activeSlug.value}/back`,
        { method: 'POST', body: JSON.stringify({ artId }) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Could not set the back.')
      }
      replaceDeck(result.data)
      notice.value = 'Deck back updated.'
      return true
    } catch (caught) {
      return fail(caught, 'Could not set the back.')
    } finally {
      saving.value = false
    }
  }

  return {
    decks,
    activeSlug,
    activeDeck,
    cards,
    designs,
    art,
    selectedCard,
    selectedCardId,
    approvedDesign,
    loading,
    saving,
    syncing,
    error,
    notice,
    enqueueProgress,
    approvedCount,
    renderedCount,
    openArtCount,
    checkpoints,
    sampleCards,
    backArt,
    backVariants,
    artUrl,
    artForCard,
    samplesForDesign,
    designById,
    selectDeck,
    selectCard,
    load,
    saveCard,
    saveDeck,
    createDeck,
    createDesign,
    saveDesign,
    approveDesign,
    requestArt,
    syncArt,
    startAutoSync,
    stopAutoSync,
    selectArt,
    setArtStatus,
    setBack,
  }
})

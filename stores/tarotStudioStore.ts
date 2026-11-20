import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '~/stores/utils'
import { useUserStore } from '~/stores/userStore'
import type {
  TarotCardEdit,
  TarotCardRecord,
  TarotDeckEdit,
  TarotDeckRecord,
} from '~/types/tarotStudio'

export const useTarotStudioStore = defineStore('tarotStudio', () => {
  const userStore = useUserStore()
  const decks = ref<TarotDeckRecord[]>([])
  const activeSlug = ref('superkate')
  const selectedCardId = ref<number | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const notice = ref('')

  const activeDeck = computed(
    () => decks.value.find((deck) => deck.slug === activeSlug.value) ?? null,
  )
  const cards = computed(() => activeDeck.value?.Cards ?? [])
  const selectedCard = computed(
    () =>
      cards.value.find((card) => card.id === selectedCardId.value) ?? null,
  )
  const approvedCount = computed(
    () => cards.value.filter((card) => card.status === 'APPROVED').length,
  )
  const renderedCount = computed(
    () => cards.value.filter((card) => Boolean(card.artImageId)).length,
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

  async function load(): Promise<boolean> {
    if (!userStore.isAdmin || loading.value) return false
    loading.value = true
    error.value = ''
    try {
      let response = await performFetch<TarotDeckRecord[]>('/api/tarot', {
        cache: 'no-store',
      })
      if (response.success && response.data?.length === 0) {
        const initial = await performFetch<string[]>('/api/tarot/bootstrap', {
          method: 'POST',
        })
        if (!initial.success) {
          throw new Error(initial.message || 'Could not initialize tarot decks.')
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
      error.value =
        caught instanceof Error ? caught.message : 'Deck loading failed.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function saveCard(
    id: number,
    edit: TarotCardEdit,
  ): Promise<boolean> {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const result = await performFetch<TarotCardRecord>(
        `/api/tarot/cards/${id}`,
        { method: 'PATCH', body: JSON.stringify(edit) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Card save failed.')
      }
      const deck = activeDeck.value
      if (deck) {
        const index = deck.Cards.findIndex((card) => card.id === id)
        if (index !== -1) deck.Cards[index] = result.data
      }
      notice.value = `${result.data.title} saved to the private bible.`
      return true
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Card save failed.'
      return false
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
      const index = decks.value.findIndex(
        (deck) => deck.slug === activeSlug.value,
      )
      if (index !== -1) decks.value[index] = result.data
      notice.value = `${result.data.title} bible saved.`
      return true
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Deck save failed.'
      return false
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
      const result = await performFetch<TarotDeckRecord>(
        '/api/tarot/decks',
        { method: 'POST', body: JSON.stringify({ title }) },
      )
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Deck creation failed.')
      }
      decks.value.push(result.data)
      selectDeck(result.data.slug)
      notice.value = 'New private 78-card deck initialized.'
      return true
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Deck creation failed.'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    decks,
    activeSlug,
    activeDeck,
    cards,
    selectedCard,
    selectedCardId,
    loading,
    saving,
    error,
    notice,
    approvedCount,
    renderedCount,
    checkpoints,
    selectDeck,
    selectCard,
    load,
    saveCard,
    saveDeck,
    createDeck,
  }
})

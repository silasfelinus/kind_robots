import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ColoringBookPromptUpdate,
  ColoringBookRenderRequest,
  ColoringBookStudioBook,
  ColoringBookStudioData,
} from '~/types/coloringBookStudio'
import { performFetch } from '@/stores/utils'

export const useColoringBookStudioStore = defineStore(
  'coloringBookStudioStore',
  () => {
    const books = ref<ColoringBookStudioBook[]>([])
    const selectedBookSlug = ref('monster-recast')
    const selectedProposalId = ref('')
    const loading = ref(false)
    const savingPrompt = ref(false)
    const requestingRender = ref(false)
    const error = ref<string | null>(null)
    const message = ref<string | null>(null)
    const fetchedAt = ref<string | null>(null)

    const selectedBook = computed(
      () =>
        books.value.find((book) => book.slug === selectedBookSlug.value) ??
        books.value[0] ??
        null,
    )

    const selectedProposal = computed(() => {
      const book = selectedBook.value
      if (!book) return null
      return (
        book.proposals.find(
          (proposal) => proposal.id === selectedProposalId.value,
        ) ??
        book.proposals[0] ??
        null
      )
    })

    const queueProblems = computed(() =>
      books.value.flatMap((book) =>
        book.proposals
          .filter(
            (proposal) =>
              proposal.queue.semanticGateError ||
              proposal.queue.status === 'needs_review',
          )
          .map((proposal) => ({
            bookSlug: book.slug,
            bookTitle: book.title,
            proposal,
          })),
      ),
    )

    function keepSelectionValid(): void {
      const book = selectedBook.value
      if (!book) {
        selectedProposalId.value = ''
        return
      }
      if (
        !book.proposals.some(
          (proposal) => proposal.id === selectedProposalId.value,
        )
      ) {
        selectedProposalId.value = book.proposals[0]?.id ?? ''
      }
    }

    async function fetchStudio(): Promise<boolean> {
      loading.value = true
      error.value = null
      try {
        const response = await performFetch<ColoringBookStudioData>(
          '/api/conductor/coloring-books',
        )
        if (!response.success || !response.data) {
          error.value = response.message || 'Failed to load the Coloring Book Studio.'
          return false
        }
        books.value = response.data.books
        fetchedAt.value = response.data.fetchedAt
        if (
          !books.value.some((book) => book.slug === selectedBookSlug.value)
        ) {
          selectedBookSlug.value = books.value[0]?.slug ?? ''
        }
        keepSelectionValid()
        return true
      } finally {
        loading.value = false
      }
    }

    function selectBook(bookSlug: string): void {
      selectedBookSlug.value = bookSlug
      keepSelectionValid()
      message.value = null
      error.value = null
    }

    function selectProposal(proposalId: string): void {
      selectedProposalId.value = proposalId
      message.value = null
      error.value = null
    }

    async function savePrompt(prompt: string): Promise<boolean> {
      const book = selectedBook.value
      const proposal = selectedProposal.value
      if (!book || !proposal || savingPrompt.value) return false

      savingPrompt.value = true
      error.value = null
      message.value = null
      try {
        const body: ColoringBookPromptUpdate = {
          bookSlug: book.slug,
          proposalId: proposal.id,
          prompt,
        }
        const response = await performFetch<ColoringBookPromptUpdate>(
          '/api/conductor/coloring-books/prompt',
          { method: 'POST', body: JSON.stringify(body) },
        )
        if (!response.success) {
          error.value = response.message || 'Failed to save the prompt.'
          return false
        }
        message.value = response.message || `${proposal.id} prompt saved.`
        await fetchStudio()
        return true
      } finally {
        savingPrompt.value = false
      }
    }

    async function requestColorRender(
      force = false,
      note = '',
    ): Promise<boolean> {
      const book = selectedBook.value
      const proposal = selectedProposal.value
      if (!book || !proposal || requestingRender.value) return false

      requestingRender.value = true
      error.value = null
      message.value = null
      try {
        const body: ColoringBookRenderRequest = {
          bookSlug: book.slug,
          proposalId: proposal.id,
          force,
          note,
        }
        const response = await performFetch<ColoringBookRenderRequest>(
          '/api/conductor/coloring-books/request',
          { method: 'POST', body: JSON.stringify(body) },
        )
        if (!response.success) {
          error.value = response.message || 'Failed to request the render.'
          return false
        }
        message.value =
          response.message || `${proposal.id} render request queued.`
        await fetchStudio()
        return true
      } finally {
        requestingRender.value = false
      }
    }

    function clearNotice(): void {
      error.value = null
      message.value = null
    }

    return {
      books,
      selectedBookSlug,
      selectedProposalId,
      selectedBook,
      selectedProposal,
      queueProblems,
      loading,
      savingPrompt,
      requestingRender,
      error,
      message,
      fetchedAt,
      fetchStudio,
      selectBook,
      selectProposal,
      savePrompt,
      requestColorRender,
      clearNotice,
    }
  },
)

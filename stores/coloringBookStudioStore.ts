import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ColoringBookPackageData } from '~/types/coloringBookPackage'
import type {
  ColoringBookCoverPromptUpdate,
  ColoringBookCoverState,
  ColoringBookProductionData,
  ColoringBookProductionState,
  ColoringBookPromptUpdate,
  ColoringBookRenderRequest,
  ColoringBookStudioBook,
  ColoringBookStudioData,
  ColoringBookStudioOperation,
} from '~/types/coloringBookStudio'
import { performFetch } from '@/stores/utils'
import { reconcileColoringBookPackageData } from '@/utils/coloringBookPackage'

const COVER_OPERATIONS = new Set<ColoringBookStudioOperation>([
  'generate-cover',
  'accept-cover',
  'finalize-cover',
])

export const useColoringBookStudioStore = defineStore(
  'coloringBookStudioStore',
  () => {
    const books = ref<ColoringBookStudioBook[]>([])
    const productionStates = ref<Record<string, ColoringBookProductionState>>({})
    const coverStates = ref<Record<string, ColoringBookCoverState>>({})
    const packageData = ref<ColoringBookPackageData | null>(null)
    const selectedBookSlug = ref('monster-recast')
    const selectedProposalId = ref('')
    const loading = ref(false)
    const savingPrompt = ref(false)
    const savingCoverPrompt = ref(false)
    const requestingAction = ref(false)
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

    const selectedProductionState = computed<ColoringBookProductionState | null>(() => {
      const book = selectedBook.value
      const proposal = selectedProposal.value
      if (!book || !proposal) return null
      return productionStates.value[`${book.slug}:${proposal.id}`] ?? null
    })

    const selectedCover = computed<ColoringBookCoverState | null>(() =>
      selectedBook.value
        ? (coverStates.value[selectedBook.value.slug] ?? null)
        : null,
    )

    const selectedPackage = computed(() =>
      packageData.value?.books.find(
        (book) => book.slug === selectedBookSlug.value,
      ) ?? null,
    )

    const requestingRender = computed(() => requestingAction.value)

    const queueProblems = computed(() =>
      books.value.flatMap((book) =>
        book.proposals
          .filter((proposal) => {
            const production = productionStates.value[`${book.slug}:${proposal.id}`]
            return Boolean(
              proposal.queue.semanticGateError ||
                proposal.queue.status === 'needs_review' ||
                production?.bwStatus === 'needs_review' ||
                production?.pairStatus === 'needs_review',
            )
          })
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
        const [studioResponse, productionResponse, packageResponse] = await Promise.all([
          performFetch<ColoringBookStudioData>('/api/conductor/coloring-books'),
          performFetch<ColoringBookProductionData>(
            '/api/conductor/coloring-books/production',
          ),
          performFetch<ColoringBookPackageData>(
            '/api/conductor/coloring-books/package',
          ),
        ])
        if (!studioResponse.success || !studioResponse.data) {
          error.value =
            studioResponse.message || 'Failed to load the Coloring Book Studio.'
          return false
        }
        if (!productionResponse.success || !productionResponse.data) {
          error.value =
            productionResponse.message ||
            'Failed to load coloring-book production actions.'
          return false
        }
        books.value = studioResponse.data.books
        productionStates.value = productionResponse.data.states
        coverStates.value = productionResponse.data.covers ?? {}
        packageData.value =
          packageResponse.success && packageResponse.data
            ? reconcileColoringBookPackageData(
                packageResponse.data,
                books.value,
                coverStates.value,
                productionStates.value,
              )
            : null
        fetchedAt.value = studioResponse.data.fetchedAt
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

    async function saveCoverPrompt(prompt: string): Promise<boolean> {
      const book = selectedBook.value
      if (!book || savingCoverPrompt.value) return false

      savingCoverPrompt.value = true
      error.value = null
      message.value = null
      try {
        const body: ColoringBookCoverPromptUpdate = {
          bookSlug: book.slug,
          prompt,
        }
        const response = await performFetch<ColoringBookCoverPromptUpdate>(
          '/api/conductor/coloring-books/cover-prompt',
          { method: 'POST', body: JSON.stringify(body) },
        )
        if (!response.success) {
          error.value = response.message || 'Failed to save the cover prompt.'
          return false
        }
        message.value = response.message || `${book.title} cover prompt saved.`
        await fetchStudio()
        return true
      } finally {
        savingCoverPrompt.value = false
      }
    }

    async function requestProductionAction(
      operation: ColoringBookStudioOperation,
      options: { force?: boolean; note?: string; sourcePath?: string } = {},
    ): Promise<boolean> {
      const book = selectedBook.value
      const proposal = selectedProposal.value
      const coverOperation = COVER_OPERATIONS.has(operation)
      if (!book || (!coverOperation && !proposal) || requestingAction.value) return false

      requestingAction.value = true
      error.value = null
      message.value = null
      try {
        const body: ColoringBookRenderRequest = {
          operation,
          bookSlug: book.slug,
          proposalId: coverOperation ? undefined : proposal?.id,
          sourcePath: options.sourcePath || undefined,
          force: options.force === true,
          note: options.note || '',
        }
        const response = await performFetch<ColoringBookRenderRequest>(
          '/api/conductor/coloring-books/request',
          { method: 'POST', body: JSON.stringify(body) },
        )
        if (!response.success) {
          error.value = response.message || 'Failed to request the production action.'
          return false
        }
        message.value =
          response.message ||
          `${coverOperation ? book.title : proposal?.id} production action queued.`
        await fetchStudio()
        return true
      } finally {
        requestingAction.value = false
      }
    }

    function requestColorRender(force = false, note = ''): Promise<boolean> {
      return requestProductionAction('generate-color-proposals', { force, note })
    }

    function acceptColor(note = '', sourcePath = ''): Promise<boolean> {
      return requestProductionAction('accept-color', { note, sourcePath })
    }

    function requestBw(force = false, note = ''): Promise<boolean> {
      return requestProductionAction('generate-bw', { force, note })
    }

    function acceptBw(note = '', sourcePath = ''): Promise<boolean> {
      return requestProductionAction('accept-bw', { note, sourcePath })
    }

    function finalizePair(note = ''): Promise<boolean> {
      return requestProductionAction('finalize-pair', { note })
    }

    function requestCover(force = false, note = ''): Promise<boolean> {
      return requestProductionAction('generate-cover', { force, note })
    }

    function acceptCover(note = '', sourcePath = ''): Promise<boolean> {
      return requestProductionAction('accept-cover', { note, sourcePath })
    }

    function finalizeCover(note = ''): Promise<boolean> {
      return requestProductionAction('finalize-cover', { note })
    }

    function clearNotice(): void {
      error.value = null
      message.value = null
    }

    return {
      books,
      productionStates,
      coverStates,
      packageData,
      selectedBookSlug,
      selectedProposalId,
      selectedBook,
      selectedProposal,
      selectedProductionState,
      selectedCover,
      selectedPackage,
      queueProblems,
      loading,
      savingPrompt,
      savingCoverPrompt,
      requestingAction,
      requestingRender,
      error,
      message,
      fetchedAt,
      fetchStudio,
      selectBook,
      selectProposal,
      savePrompt,
      saveCoverPrompt,
      requestProductionAction,
      requestColorRender,
      acceptColor,
      requestBw,
      acceptBw,
      finalizePair,
      requestCover,
      acceptCover,
      finalizeCover,
      clearNotice,
    }
  },
)

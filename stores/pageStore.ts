import { defineStore } from 'pinia'
import { errorHandler, type ErrorHandlerOutput } from '@/server/api/utils/error'

interface Page {
  _id?: string;
  _path?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  layout?: string;
  image?: string;
  gallery?: string;
  tags?: string[];
  icon?: string;
  tooltip?: string;
  amiold?: string;
  category?: string;
  sort?: string;
  dottitip?: string;
  amitip?: string;
  underConstruction?: boolean;
  [key: string]: unknown; // Use unknown for more type safety
}

type ErrorState = ErrorHandlerOutput | null

export const usePageStore = defineStore('pageStore', () => {
  const page = ref<Page>({})
  const pages = ref<Page[]>([])
  const toc = ref({})
  const type = ref('')
  const initialized = ref(false)
  const error = ref<ErrorState>(null)
  const showTooltip = ref(true)
  const showAmitip = ref(false)
  const showInfo = ref(true)

  const currentPage = computed(() => {
    const content = useContent()
    return content.page as Page // Ensure the returned type matches Page
  })

  const tooltip = computed(() => page.value.tooltip ?? null)
  const amitip = computed(() => page.value.amitip ?? null)

  const pagesByTagAndSort = computed(() => (tag: string, sort: string) => {
    return pages.value.filter((page) => page.tags?.includes(tag) && page.sort === sort)
  })

  const pagesUnderConstruction = computed(() => {
    return pages.value.filter((page) => page.underConstruction)
  })

  const highlightPages = computed(() => {
    return pages.value.filter((page) => page.sort === 'highlight')
  })

  async function loadPages() {
    if (initialized.value) return
    try {
      const content = await useContent()
      page.value = content.page as Page
      pages.value = await queryContent().find()
      initialized.value = true
    } catch (err) {
      error.value = errorHandler({ error: err, message: 'Failed to initialize page store' })
      console.error('Failed to initialize page store', err)
    }
  }

  function toggleTooltip() {
    showTooltip.value = !showTooltip.value
  }

  function toggleInfo() {
    showInfo.value = !showInfo.value
  }

  function toggleAmitip() {
    showAmitip.value = !showAmitip.value
  }

  return {
    page,
    pages,
    toc,
    type,
    initialized,
    error,
    showTooltip,
    showAmitip,
    showInfo,
    currentPage,
    tooltip,
    amitip,
    pagesByTagAndSort,
    pagesUnderConstruction,
    highlightPages,
    loadPages,
    toggleTooltip,
    toggleInfo,
    toggleAmitip,
  }
})

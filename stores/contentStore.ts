// ~/stores/contentStore.ts
import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'

export interface Page {
  _id?: string
  _path?: string
  title?: string
  subtitle?: string
  description?: string
  layout?: string
  image?: string
  gallery?: string
  tags?: string[]
  icon?: string
  tooltip?: string
  amiold?: string
  category?: string
  sort?: string
  dottitip?: string
  amitip?: string
  underConstruction?: boolean
  [key: string]: unknown // Use unknown for more type safety
}

interface ContentState {
  page: Page
  pages: Page[]
  showTooltip: boolean
  showAmitip: boolean
  showInfo: boolean
}

export const useContentStore = defineStore({
  id: 'content',
  state: (): ContentState => ({
    page: {},
    pages: [],
    showTooltip: true,
    showAmitip: false,
    showInfo: true,
  }),
  getters: {
    currentPage: (state) => state.page,
    tooltip: (state) => state.page.tooltip ?? null,
    amitip: (state) => state.page.amitip ?? null,
    pagesByTagAndSort: (state) => (tag: string, sort: string) =>
      state.pages.filter(
        (page) => page.tags?.includes(tag) && page.sort === sort,
      ),
    pagesUnderConstruction: (state) =>
      state.pages.filter((page) => page.underConstruction),
    highlightPages: (state) =>
      state.pages.filter((page) => page.sort === 'highlight'),
  },
  actions: {
    async loadStore() {
      const errorStore = useErrorStore()
      const statusStore = useStatusStore()
      statusStore.setStatus(StatusType.INFO, 'Initializing content store...')

      await errorStore.handleError(
        async () => {
          this.page = this.currentPage
          this.pages = (await queryContent().find()) as Page[]

          statusStore.setStatus(
            StatusType.SUCCESS,
            'Content store initialized successfully',
          )
          statusStore.clearStatus()
        },
        ErrorType.NETWORK_ERROR,
        'Failed to initialize content store',
      )
    },
    getPages() {
      return this.pages // Add this method if it's supposed to be used
    },
    async refreshContent() {
      await this.loadStore()
    },
    toggleTooltip() {
      this.showTooltip = !this.showTooltip
    },
    toggleInfo() {
      this.showInfo = !this.showInfo
    },
    toggleAmitip() {
      this.showAmitip = !this.showAmitip
    },
  },
})

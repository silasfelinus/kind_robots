import { defineStore } from 'pinia'
import { errorHandler, type ErrorHandlerOutput } from '@/server/api/utils/error'

interface Page {
  tooltip?: string
  amitip?: string
  [key: string]: any
}

type ErrorState = ErrorHandlerOutput | null

export const usePageStore = defineStore({
  id: 'pageStore',
  state: () => ({
    page: {} as Page,
    pages: [] as Page[],
    toc: {},
    type: '',
    initialized: false,
    error: null as ErrorState,
    showTooltip: true,
    showAmitip: false,
    showInfo: true as boolean,
  }),
  getters: {
    currentPage: () => {
      const { page } = useContent()
      return page
    },
    tooltip: state => state.page?.tooltip ?? null,
    amitip: state => state.page?.amitip ?? null,
    pagesByTagAndSort: state => (tag: string, sort: string) => {
      return state.pages.filter((page: any) => page.tags?.includes(tag) && page.sort === sort)
    },
    pagesUnderConstruction: (state) => {
      return state.pages.filter((page: any) => page.underConstruction)
    },
    highlightPages: (state) => {
      return state.pages.filter((page: any) => page.sort === 'highlight')
    },
  },
  actions: {
    async loadPages() {
      if (this.initialized) return
      try {
        const { page } = await useContent()
        this.page = page
        const pages = await queryContent().find()
        this.pages = pages
        this.initialized = true
      }
      catch (error) {
        this.error = errorHandler({ error, message: 'Failed to initialize page store' })
        console.error('Failed to initialize page store', error)
      }
    },
    // Toggles the visibility of the tooltip
    toggleTooltip() {
      this.showTooltip = !this.showTooltip
    },
    // Toggles the visibility of the information panel
    toggleInfo() {
      this.showInfo = !this.showInfo
    },
    // Toggles the visibility of the amitip
    toggleAmitip() {
      this.showAmitip = !this.showAmitip
    },
  },
})

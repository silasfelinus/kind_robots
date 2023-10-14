// ~/store/pageStore.ts
import { defineStore } from 'pinia'
import { errorHandler } from '@/server/api/utils/error'

interface PageState {
  pages: any[]
  initialized: boolean
  error: any
}

export const usePageStore = defineStore({
  id: 'pageStore',
  state: (): PageState => ({
    pages: [],
    initialized: false,
    error: null
  }),
  getters: {
    pagesByTagAndSort: (state) => (tag: string, sort: string) => {
      return state.pages.filter((page: any) => page.tags?.includes(tag) && page.sort === sort)
    },
    pagesUnderConstruction: (state) => {
      return state.pages.filter((page: any) => page.underConstruction)
    },
    currentPage: (state) => {
      const router = useRouter()
      const currentPath = router.currentRoute.value.path
      return state.pages.find((page: any) => page._path === currentPath)
    },
    highlightPages: (state) => {
      return state.pages.filter((page: any) => page.sort === 'highlight')
    }
  },
  actions: {
    async getPages() {
      if (this.initialized) return

      try {
        const pages = await queryContent()
          .where({ $not: { _path: '/' } })
          .find()
        this.pages = pages
        this.initialized = true
      } catch (error) {
        this.error = errorHandler({ error, message: 'Failed to fetch pages' })
        console.error('Failed to fetch pages', error)
      }
    }
  }
})

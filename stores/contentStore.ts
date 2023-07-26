// ~/store/content.ts
import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'
import { useErrorStore, ErrorType } from '../stores/errorStore'

interface ContentState {
  globals: any
  navigation: any
  surround: any
  page: any
  excerpt: string
  toc: any
  type: string
  layout: string
  next: any
  prev: any
}

export const useContentStore = defineStore({
  id: 'content',
  state: (): ContentState => ({
    globals: {},
    navigation: {},
    surround: {},
    page: {},
    excerpt: '',
    toc: {},
    type: '',
    layout: '',
    next: {},
    prev: {}
  }),
  actions: {
    async initStore() {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const content = useContent()
          this.globals = content.globals
          this.navigation = content.navigation
          this.surround = content.surround
          this.page = content.page
          this.excerpt = content.excerpt
          this.toc = content.toc
          this.type = content.type
          this.layout = content.layout
          this.next = content.next
          this.prev = content.prev
        },
        ErrorType.NETWORK_ERROR,
        'Failed to initialize content store'
      )
    },
    async getPageByTitle(title: string) {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const page = await queryContent().where({ title }).findOne()
          this.page = page
        },
        ErrorType.NETWORK_ERROR,
        `Failed to get page by title: ${title}`
      )
    },
    async fetchCurrentPage() {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const route = useRoute()
          const page = await queryContent().where({ _path: route.path }).findOne()
          this.page = page
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch current page'
      )
    },
    async refreshContent() {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          await this.initStore()
        },
        ErrorType.NETWORK_ERROR,
        'Failed to refresh content'
      )
    }
  }
})

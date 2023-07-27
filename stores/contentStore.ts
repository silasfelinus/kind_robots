// ~/store/content.ts
import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'

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
  pages: any
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
    prev: {},
    pages: []
  }),
  actions: {
    async loadStore() {
      const errorStore = useErrorStore()
      const statusStore = useStatusStore()
      statusStore.setStatus(StatusType.INFO, 'Initializing content store...')

      await errorStore.handleError(
        async () => {
          const content = await useContent()
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
          this.pages = await queryContent()
            .where({ $not: { _path: '/' } })
            .find()

          statusStore.setStatus(StatusType.SUCCESS, 'Content store initialized successfully')
          statusStore.clearStatus()
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
    async getPages() {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const pages = await queryContent()
            .where({ $not: { _path: '/' } })
            .find()
          this.pages = pages
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch pages'
      )
    },
    async getCurrentPage(path: string) {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const page = await queryContent().where({ _path: path }).findOne()
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
          await this.loadStore()
        },
        ErrorType.NETWORK_ERROR,
        'Failed to refresh content'
      )
    }
  }
})

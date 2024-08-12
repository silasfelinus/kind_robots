import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'
import { unref } from 'vue' // Import unref to unwrap ComputedRef

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
    pages: [],
  }),
  actions: {
    async loadStore() {
      const errorStore = useErrorStore()
      const statusStore = useStatusStore()
      statusStore.setStatus(StatusType.INFO, 'Initializing content store...')

      await errorStore.handleError(
        async () => {
          const content = unref(await useContent()) // Unwrap ComputedRef
          this.globals = content.globals
          this.navigation = content.navigation
          this.surround = content.surround
          this.page = content.page
          this.excerpt = String(content.excerpt || '') // Ensure it's a string
          this.toc = content.toc
          this.type = String(content.type || '') // Ensure it's a string
          this.layout = String(content.layout || '') // Ensure it's a string
          this.next = content.next
          this.prev = content.prev
          this.pages = unref(await queryContent().find()) // Unwrap ComputedRef

          statusStore.setStatus(StatusType.SUCCESS, 'Content store initialized successfully')
          statusStore.clearStatus()
        },
        ErrorType.NETWORK_ERROR,
        'Failed to initialize content store',
      )
    },
    async getPageByTitle(title: string) {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const page = unref(await queryContent().where({ title }).findOne()) // Unwrap ComputedRef
          this.page = page
        },
        ErrorType.NETWORK_ERROR,
        `Failed to get page by title: ${title}`,
      )
    },
    async getPages() {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const pages = unref(await queryContent()
            .where({ $not: { _path: '/' } })
            .find()) // Unwrap ComputedRef
          this.pages = pages
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch pages',
      )
    },
    async getCurrentPage(path: string) {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          const page = unref(await queryContent().where({ _path: path }).findOne()) // Unwrap ComputedRef
          this.page = page
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch current page',
      )
    },
    async refreshContent() {
      const errorStore = useErrorStore()
      await errorStore.handleError(
        async () => {
          await this.loadStore()
        },
        ErrorType.NETWORK_ERROR,
        'Failed to refresh content',
      )
    },
  },
})

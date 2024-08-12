// ~/stores/contentStore.ts
import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'

interface Page {
  _id?: string;
  _path?: string;
  title?: string;
  content?: string;
  // Add other properties as needed
}

interface ContentState {
  page: Page
  pages: Page[]
}

export const useContentStore = defineStore({
  id: 'content',
  state: (): ContentState => ({
    page: {},
    pages: [],
  }),
  actions: {
    async loadStore() {
      const errorStore = useErrorStore()
      const statusStore = useStatusStore()
      statusStore.setStatus(StatusType.INFO, 'Initializing content store...')

      await errorStore.handleError(
        async () => {
          const content = await useContent()
          this.page = content.page as Page // Type assertion if needed
          this.pages = (await queryContent().find()) as Page[] // Type assertion if needed

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
          const page = await queryContent().where({ title }).findOne() as Page // Type assertion if needed
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
          const pages = await queryContent()
            .where({ $not: { _path: '/' } })
            .find() as Page[] // Type assertion if needed
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
          const page = await queryContent().where({ _path: path }).findOne() as Page // Type assertion if needed
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

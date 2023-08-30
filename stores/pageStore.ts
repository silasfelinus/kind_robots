// ~/store/pageStore.ts
import { defineStore } from 'pinia'

interface PageState {
  pages: any[]
}

export const usePageStore = defineStore({
  id: 'pageStore',
  state: (): PageState => ({
    pages: []
  }),
  actions: {
    async getPages() {
      try {
        const pages = await queryContent()
          .where({ $not: { _path: '/' } })
          .find()
        this.pages = pages
      } catch (error) {
        console.error('Failed to fetch pages', error)
      }
    }
  }
})

// ~/stores/footerStore.ts
import { defineStore } from 'pinia'

interface FooterState {
  isExtended: boolean
}

export const useFooterStore = defineStore({
  id: 'footerStore',
  state: (): FooterState => ({
    isExtended: false,
  }),
  actions: {
    toggleIsExtended() {
      this.isExtended = !this.isExtended
    },
  },
})

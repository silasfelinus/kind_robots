import { defineStore } from 'pinia'

export const useFilterStore = defineStore({
  id: 'filter',

  state: () => ({
    showMature: false,
    showPublic: true,
    showFooter: false,
    showChat: false
  }),

  actions: {
    toggleMature() {
      this.showMature = !this.showMature
    },
    togglePublic() {
      this.showPublic = !this.showPublic
    },
    toggleFooter() {
      this.showFooter = !this.showFooter
    },
    toggleChat() {
      this.showChat = !this.showChat
    }
  }
})

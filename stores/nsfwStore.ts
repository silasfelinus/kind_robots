// @/stores/nsfwStore.ts
import { defineStore } from 'pinia'

export const useNsfwStore = defineStore('nsfwStore', {
  state: () => ({
    showNsfw: false // Initialize with a default value
  }),

  actions: {
    toggleNsfw() {
      this.showNsfw = !this.showNsfw
      localStorage.setItem('showNsfw', JSON.stringify(this.showNsfw))
    },

    initialize() {
      const storedValue = localStorage.getItem('showNsfw')
      if (storedValue !== null) {
        this.showNsfw = JSON.parse(storedValue)
      }
    }
  }
})

export default useNsfwStore

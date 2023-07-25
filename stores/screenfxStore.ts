// ~/store/screenfx.ts
import { defineStore } from 'pinia'

export const useScreenfxStore = defineStore({
  id: 'screenfx',
  state: () => ({
    showAmiSwarm: false,
    showRainEffect: false,
    showSoapBubbles: false
  }),
  getters: {
    anyEffectActive(): boolean {
      return this.showAmiSwarm || this.showRainEffect || this.showSoapBubbles
    }
  },
  actions: {
    toggleAmiSwarm() {
      this.showAmiSwarm = !this.showAmiSwarm
    },
    toggleRainEffect() {
      this.showRainEffect = !this.showRainEffect
    },
    toggleSoapBubbles() {
      this.showSoapBubbles = !this.showSoapBubbles
    },
    disableAllEffects() {
      this.showAmiSwarm = false
      this.showRainEffect = false
      this.showSoapBubbles = false
    },
    checkConnection() {
      return new Promise((resolve, reject) => {
        if (this) {
          // Change this condition based on what indicates a successful "connection"
          resolve(true)
        } else {
          reject(new Error('Cannot connect to Error store.'))
        }
      })
    }
  }
})

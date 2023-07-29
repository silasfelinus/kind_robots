// ~/stores/screenStore.ts
import { defineStore } from 'pinia'
import { ModelType } from '@prisma/client'

export const useScreenStore = defineStore({
  id: 'screen',
  state: () => ({
    showAmiSwarm: false,
    showRainEffect: false,
    showSoapBubbles: false,
    currentModelType: ModelType.BOT
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
    },
    async loadStore() {
      try {
        return 'loaded screen'
      } catch (error) {
        console.error('Error loading store:', error)
        throw error
      }
    }
  }
})

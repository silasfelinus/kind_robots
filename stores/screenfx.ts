// ~/stores/screenfx.ts
import { defineStore } from 'pinia'

export const useFxStore = defineStore('fx', {
  state: () => ({
    showAmiSwarm: false,
    showRainEffect: false,
    showSoapBubbles: false
  }),
  actions: {
    toggleAmiSwarm() {
      this.showAmiSwarm = !this.showAmiSwarm
    },
    toggleRainEffect() {
      this.showRainEffect = !this.showRainEffect
    },
    toggleSoapBubbles() {
      this.showSoapBubbles = !this.showSoapBubbles
    }
  }
})

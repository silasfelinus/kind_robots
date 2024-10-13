// ~/stores/butterflyStore.ts
import { defineStore } from 'pinia'

interface Butterfly {
  id: number
  x: number // Position in percentage of container width
  y: number // Position in percentage of container height
  z: number // Scale for visual size
  zIndex: number // Z-index for visual stacking order
  rotation: number // Current rotation angle
  wingTopColor: string
  wingBottomColor: string
  speed: number // Movement speed
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
}

interface ButterflyState {
  butterflies: Butterfly[]
  scaleModifier: number // Global scale modifier
}

export const useButterflyStore = defineStore({
  id: 'butterfly',
  state: (): ButterflyState => ({
    butterflies: [],
    scaleModifier: 1 // Default modifier to 1x
  }),
  actions: {
    // Add a new butterfly with scale adjustment
    addButterfly(butterfly: Butterfly) {
      // Apply scale modifier to the initial scale
      butterfly.z = butterfly.z * this.scaleModifier
      this.butterflies.push(butterfly)
    },

    // Update butterfly position and scale based on screen size and noise input
    updateButterflyPosition(id: number, x: number, y: number, z: number) {
      const butterfly = this.butterflies.find(b => b.id === id)
      if (butterfly) {
        butterfly.x = x
        butterfly.y = y
        butterfly.z = z * this.scaleModifier // Apply scale modifier during updates
      }
    },

    // Update zIndex for visual stacking
    updateButterflyZIndex(id: number, zIndex: number) {
      const butterfly = this.butterflies.find(b => b.id === id)
      if (butterfly) {
        butterfly.zIndex = zIndex
      }
    },

    // Set a new scale modifier
    setScaleModifier(modifier: number) {
      this.scaleModifier = modifier
    },

    // Set a goal for a butterfly to move towards
    setGoal(id: number, x: number, y: number) {
      const butterfly = this.butterflies.find(b => b.id === id)
      if (butterfly) {
        butterfly.x = x
        butterfly.y = y
      }
    },

    // Remove a butterfly by id
    removeButterfly(id: number) {
      this.butterflies = this.butterflies.filter(b => b.id !== id)
    }
  },
  getters: {
    // Get all butterflies
    getAllButterflies: (state) => state.butterflies,

    // Get a specific butterfly by id
    getButterflyById: (state) => (id: number) =>
      state.butterflies.find(b => b.id === id),

    // Get the scale modifier
    getScaleModifier: (state) => state.scaleModifier
  }
})

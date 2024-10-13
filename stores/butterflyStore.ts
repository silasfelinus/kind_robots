import { defineStore } from 'pinia'
import { makeNoise2D } from 'open-simplex-noise'

export interface Butterfly {
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
  noise2D: (x: number, y: number) => number // Noise generator for movement
  animationFrameId: number | null // Store the animation frame ID
  t: number // Time for noise generation
}

export const useButterflyStore = defineStore({
  id: 'butterfly',
  state: (): ButterflyState => ({
    butterflies: [],
    scaleModifier: 1, // Default modifier to 1x
    noise2D: makeNoise2D(Date.now()), // Noise generator for movement
    animationFrameId: null,
    t: 0
  }),
  actions: {
    // Utility function for generating random colors
    randomColor(): string {
      const h = Math.floor(Math.random() * 360)
      const s = Math.floor(Math.random() * 50 + 50)
      const l = Math.floor(Math.random() * 40 + 30)
      return `hsl(${h},${s}%,${l}%)`
    },

    // Add a new butterfly with scale adjustment
    addButterfly(butterfly: Butterfly) {
      butterfly.z = butterfly.z * this.scaleModifier // Apply scale modifier
      this.butterflies.push(butterfly)
    },

    // Update butterfly position using noise
    updateButterflyPosition(butterfly: Butterfly) {
      this.t += 0.01
      const angle = this.noise2D(butterfly.x * 0.01, butterfly.y * 0.01 + this.t) * Math.PI * 2
      const dx = Math.cos(angle) * butterfly.speed
      const dy = Math.sin(angle) * butterfly.speed

      butterfly.x = (butterfly.x + dx) % 100
      butterfly.y = (butterfly.y + dy) % 100

      // Ensure the butterfly stays within boundaries
      butterfly.x = Math.max(Math.min(butterfly.x, 100), 0)
      butterfly.y = Math.max(Math.min(butterfly.y, 100), 0)

      // Update rotation based on movement direction
      butterfly.rotation = dx >= 0 ? 120 : 30
    },

    // Animate all butterflies
    animateButterflies() {
      const animate = () => {
        this.butterflies.forEach(butterfly => {
          this.updateButterflyPosition(butterfly)
        })
        this.animationFrameId = requestAnimationFrame(animate)
      }

      // Start the animation
      animate()
    },

    // Stop animation
    stopAnimation() {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    },

    // Set a new scale modifier
    setScaleModifier(modifier: number) {
      this.scaleModifier = modifier
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

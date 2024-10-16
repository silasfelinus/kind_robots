import { defineStore } from 'pinia'
import { makeNoise2D } from 'open-simplex-noise'

export interface Butterfly {
  id: number
  x: number
  y: number
  z: number
  zIndex: number
  rotation: number
  wingTopColor: string
  wingBottomColor: string
  speed: number
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
}

interface ButterflyState {
  butterflies: Butterfly[]
  scaleModifier: number
  animationFrameId: number | null
  t: number
}

const noise2D = makeNoise2D(Date.now())

export const useButterflyStore = defineStore({
  id: 'butterfly',
  state: (): ButterflyState => ({
    butterflies: [],
    scaleModifier: 1,
    animationFrameId: null,
    t: 0
  }),
  actions: {
    randomColor(): string {
      const h = Math.floor(Math.random() * 360)
      const s = Math.floor(Math.random() * 50 + 50)
      const l = Math.floor(Math.random() * 40 + 30)
      return `hsl(${h},${s}%,${l}%)`
    },

    clearButterflies() {
      this.butterflies = []
    },

    addButterfly(butterfly: Butterfly) {
      butterfly.z = butterfly.z * this.scaleModifier
      this.butterflies.push(butterfly)
    },

    removeButterfly(id: number) {
      this.butterflies = this.butterflies.filter(b => b.id !== id)
    },

    // This is the new method to generate a specific number of initial butterflies
    generateInitialButterflies(count: number) {
      for (let i = 0; i < count; i++) {
        this.addButterfly({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * 0.5 + 0.75,
          zIndex: i,
          rotation: Math.random() * 360,
          wingTopColor: this.randomColor(),
          wingBottomColor: this.randomColor(),
          speed: Math.random() * 2 + 1,
          status: 'random'
        })
      }
    },

    updateButterflyPosition(butterfly: Butterfly) {
      this.t += 0.01
      const angle = noise2D(butterfly.x * 0.01, butterfly.y * 0.01 + this.t) * Math.PI * 2
      const dx = Math.cos(angle) * butterfly.speed
      const dy = Math.sin(angle) * butterfly.speed

      butterfly.x = (butterfly.x + dx) % 100
      butterfly.y = (butterfly.y + dy) % 100

      butterfly.x = Math.max(Math.min(butterfly.x, 100), 0)
      butterfly.y = Math.max(Math.min(butterfly.y, 100), 0)

      butterfly.rotation = dx >= 0 ? 120 : 30
    },

    animateButterflies() {
      const animate = () => {
        this.butterflies.forEach(butterfly => {
          this.updateButterflyPosition(butterfly)
        })
        this.animationFrameId = requestAnimationFrame(animate)
      }
      animate()
    },

    stopAnimation() {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    }
  },
  getters: {
    getAllButterflies: (state) => state.butterflies,
    getButterflyById: (state) => (id: number) =>
      state.butterflies.find(b => b.id === id),
    getScaleModifier: (state) => state.scaleModifier
  }
})

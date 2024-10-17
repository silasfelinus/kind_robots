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
  wingSpeed: number // Flutter speed
  sway: boolean // For swaying effect
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
}

interface ButterflyState {
  butterflies: Butterfly[]
  scaleModifier: number
  animationFrameId: number | null
  t: number
  newButterflySettings: {
    minSize: number
    maxSize: number
    minSpeed: number
    maxSpeed: number
    minRotation: number
    maxRotation: number
    colorScheme: 'random' | 'complementary' | 'analogous' | 'same'
  }
  presets: {
    minSize: number
    maxSize: number
    minSpeed: number
    maxSpeed: number
    minRotation: number
    maxRotation: number
    colorScheme: 'random' | 'complementary' | 'analogous' | 'same'
  }[]
}

const noise2D = makeNoise2D(Date.now())

// Utility functions for colors
const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 50 + 50)
  const l = Math.floor(Math.random() * 40 + 30)
  return `hsl(${h},${s}%,${l}%)`
}

const analogousColor = (hsl: string): string => {
  const hslMatch = hsl.match(/\d+/g)
  if (!hslMatch) {
    throw new Error('Invalid color format')
  }
  const [h, s, l] = hslMatch.map(Number)
  const newH = (h + 30) % 360
  return `hsl(${newH},${s}%,${l}%)`
}

const complementaryColor = (hsl: string): string => {
  const [h, s, l] = hsl.replace('hsl(', '').replace(')', '').split(',')
  const newH = (parseInt(h) + 180) % 360
  return `hsl(${newH},${s},${l})`
}

export const useButterflyStore = defineStore({
  id: 'butterfly',
  state: (): ButterflyState => ({
    butterflies: [],
    scaleModifier: 1,
    animationFrameId: null,
    t: 0,
    newButterflySettings: {
      minSize: 0.5,
      maxSize: 1.5,
      minSpeed: 1,
      maxSpeed: 3,
      minRotation: 0,
      maxRotation: 360,
      colorScheme: 'random', // New option for color scheme
    },
    presets: [], // Stored presets, can be loaded from localStorage
  }),
  actions: {
    clearButterflies() {
      this.butterflies = []
    },

    // Add a butterfly with color scheme control
    addButterfly(butterfly: Butterfly) {
      let primaryColor = randomColor()
      let secondaryColor = primaryColor

      // Adjust the color scheme for the butterfly based on the user's choice
      if (this.newButterflySettings.colorScheme === 'complementary') {
        secondaryColor = complementaryColor(primaryColor)
      } else if (this.newButterflySettings.colorScheme === 'analogous') {
        secondaryColor = analogousColor(primaryColor)
      }

      butterfly.z = butterfly.z * this.scaleModifier
      butterfly.wingTopColor = primaryColor
      butterfly.wingBottomColor = secondaryColor
      this.butterflies.push(butterfly)
    },

    removeButterfly(id: number) {
      this.butterflies = this.butterflies.filter(b => b.id !== id)
    },

    // Generate butterflies using min/max settings and color scheme
    generateInitialButterflies(count: number) {
      for (let i = 0; i < count; i++) {
        this.addButterfly({
          id: Date.now() + i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          z: Math.random() * (this.newButterflySettings.maxSize - this.newButterflySettings.minSize) + this.newButterflySettings.minSize,
          zIndex: i,
          rotation: Math.random() * (this.newButterflySettings.maxRotation - this.newButterflySettings.minRotation) + this.newButterflySettings.minRotation,
          wingTopColor: '',
          wingBottomColor: '',
          speed: Math.random() * (this.newButterflySettings.maxSpeed - this.newButterflySettings.minSpeed) + this.newButterflySettings.minSpeed,
          wingSpeed: Math.floor(Math.random() * 3), // Wing speed randomness
          sway: Math.random() > 0.5, // Random sway
          status: 'random',
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
    },

    // Save settings as a preset
    savePreset() {
      this.presets.push({ ...this.newButterflySettings })
      localStorage.setItem('butterflyPresets', JSON.stringify(this.presets))
    },

    // Load presets from localStorage
    loadPresets() {
      const storedPresets = localStorage.getItem('butterflyPresets')
      if (storedPresets) {
        this.presets = JSON.parse(storedPresets)
      }
    },

    // Apply a preset by index
    applyPreset(index: number) {
      if (index >= 0 && index < this.presets.length) {
        this.newButterflySettings = { ...this.presets[index] }
      }
    },
  },
  getters: {
    getAllButterflies: (state) => state.butterflies,
    getButterflyById: (state) => (id: number) =>
      state.butterflies.find(b => b.id === id),
    getScaleModifier: (state) => state.scaleModifier,
  },
})

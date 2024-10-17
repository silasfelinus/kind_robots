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
  sway: number // 0 to 1, for swaying effect
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
    minWingSpeed: number // Range 1-5
    maxWingSpeed: number
    minSway: number // Range 0-1
    maxSway: number
    minZIndex: number // zIndex range 1-50
    maxZIndex: number
    colorScheme: 'random' | 'complementary' | 'analogous' | 'same'
  }
  presets: {
    minSize: number
    maxSize: number
    minSpeed: number
    maxSpeed: number
    minRotation: number
    maxRotation: number
    minWingSpeed: number
    maxWingSpeed: number
    minSway: number
    maxSway: number
    minZIndex: number
    maxZIndex: number
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
      minWingSpeed: 1, // Flutter speed range 1-5
      maxWingSpeed: 5,
      minSway: 0, // Sway range 0-1
      maxSway: 1,
      minZIndex: 1, // zIndex range 1-50
      maxZIndex: 50,
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

    // Generate butterflies using the range values from user presets
    generateInitialButterflies(count: number) {
      for (let i = 0; i < count; i++) {
        this.addButterfly({
          id: Date.now() + i,
          x: Math.random() * 100, // Use random x and y between 0 and 100 (viewport)
          y: Math.random() * 100,
          z: Math.random() * (this.newButterflySettings.maxSize - this.newButterflySettings.minSize) + this.newButterflySettings.minSize, // Butterfly size
          zIndex: Math.floor(Math.random() * (this.newButterflySettings.maxZIndex - this.newButterflySettings.minZIndex + 1)) + this.newButterflySettings.minZIndex, // Random zIndex
          rotation: Math.random() * (this.newButterflySettings.maxRotation - this.newButterflySettings.minRotation) + this.newButterflySettings.minRotation, // Rotation based on preset
          wingTopColor: '', // Color will be assigned in addButterfly
          wingBottomColor: '',
          speed: Math.random() * (this.newButterflySettings.maxSpeed - this.newButterflySettings.minSpeed) + this.newButterflySettings.minSpeed, // Speed based on preset
          wingSpeed: Math.random() * (this.newButterflySettings.maxWingSpeed - this.newButterflySettings.minWingSpeed) + this.newButterflySettings.minWingSpeed, // Flutter speed
          sway: Math.random() * (this.newButterflySettings.maxSway - this.newButterflySettings.minSway) + this.newButterflySettings.minSway, // Sway range
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

    // Save settings as a preset (called automatically when settings are updated)
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

    // Update the newButterflySettings when the user changes values in the sliders
    updateButterflySettings(newSettings: Partial<ButterflyState['newButterflySettings']>) {
      this.newButterflySettings = {
        ...this.newButterflySettings,
        ...newSettings,
      }
      this.savePreset() // Automatically save the updated settings
    },
  },
    getters: {
    // Return all butterflies
    getAllButterflies: (state) => state.butterflies,

    // Find a butterfly by id
    getButterflyById: (state) => (id: number) =>
      state.butterflies.find(b => b.id === id),

    // Return the current scale modifier
    getScaleModifier: (state) => state.scaleModifier,

    // Return the current butterfly settings
    getNewButterflySettings: (state) => state.newButterflySettings,

    // Return available presets
    getPresets: (state) => state.presets,
  }
})

   

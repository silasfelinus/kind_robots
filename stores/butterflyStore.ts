import { defineStore } from 'pinia'
import { makeNoise2D } from 'open-simplex-noise'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

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
  wingSpeed: number
  sway: number
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
}

interface ButterflyState {
  butterflies: Butterfly[]
  scaleModifier: number
  animationFrameId: number | null
  t: number
  animationPaused: boolean
  newButterflySettings: {
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
    minX: number
    maxX: number
    minY: number
    maxY: number
    status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
    colorScheme: 'random' | 'complementary' | 'analogous' | 'same' | 'primary'
  }
  presets: Array<ButterflyState['newButterflySettings']>
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

const randomPrimaryColor = (): string => {
  const rainbowHues = [0, 60, 120, 180, 240, 300]
  const randomHue = rainbowHues[Math.floor(Math.random() * rainbowHues.length)]
  return `hsl(${randomHue}, 100%, 50%)`
}

export const useButterflyStore = defineStore({
  id: 'butterfly',
  state: (): ButterflyState => ({
    butterflies: [],
    scaleModifier: 1,
    animationFrameId: null,
    t: 0,
    animationPaused: false,
    newButterflySettings: {
      minSize: 0.5,
      maxSize: 1.5,
      minSpeed: 1,
      maxSpeed: 3,
      minRotation: 0,
      maxRotation: 360,
      minWingSpeed: 1,
      maxWingSpeed: 5,
      minSway: 0,
      maxSway: 1,
      minZIndex: 1,
      maxZIndex: 50,
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
      status: 'random',
      colorScheme: 'random',
    },
    presets: [],
  }),
  actions: {
    clearButterflies() {
      this.butterflies = []
    },

    addError(type: ErrorType, message: unknown) {
      const errorStore = useErrorStore()
      errorStore.addError(type, message)
    },

    addButterfly(butterfly: Butterfly) {
      let primaryColor = randomColor()
      let secondaryColor = primaryColor

      try {
        if (this.newButterflySettings.colorScheme === 'complementary') {
          secondaryColor = complementaryColor(primaryColor)
        } else if (this.newButterflySettings.colorScheme === 'analogous') {
          secondaryColor = analogousColor(primaryColor)
        } else if (this.newButterflySettings.colorScheme === 'primary') {
          primaryColor = randomPrimaryColor()
          secondaryColor = this.newButterflySettings.colorScheme === 'same' ? primaryColor : randomPrimaryColor()
        }
      } catch (error) {
        this.addError(ErrorType.STORE_ERROR, error)
      }

      butterfly.wingTopColor = primaryColor
      butterfly.wingBottomColor = secondaryColor
      this.butterflies.push(butterfly)
    },

    generateInitialButterflies(count: number) {
      try {
        for (let i = 0; i < count; i++) {
          this.addButterfly({
            id: Date.now() + i,
            x: Math.random() * (this.newButterflySettings.maxX - this.newButterflySettings.minX) + this.newButterflySettings.minX,
            y: Math.random() * (this.newButterflySettings.maxY - this.newButterflySettings.minY) + this.newButterflySettings.min
            y: Math.random() * (this.newButterflySettings.maxY - this.newButterflySettings.minY) + this.newButterflySettings.minY,
            z: Math.random() * (this.newButterflySettings.maxSize - this.newButterflySettings.minSize) + this.newButterflySettings.minSize,
            zIndex: Math.floor(Math.random() * (this.newButterflySettings.maxZIndex - this.newButterflySettings.minZIndex + 1)) + this.newButterflySettings.minZIndex,
            rotation: Math.random() * (this.newButterflySettings.maxRotation - this.newButterflySettings.minRotation) + this.newButterflySettings.minRotation,
            wingTopColor: '',
            wingBottomColor: '',
            speed: Math.random() * (this.newButterflySettings.maxSpeed - this.newButterflySettings.minSpeed) + this.newButterflySettings.minSpeed,
            wingSpeed: Math.random() * (this.newButterflySettings.maxWingSpeed - this.newButterflySettings.minWingSpeed) + this.newButterflySettings.minWingSpeed,
            sway: Math.random() * (this.newButterflySettings.maxSway - this.newButterflySettings.minSway) + this.newButterflySettings.minSway,
            status: this.newButterflySettings.status,
          })
        }
      } catch (error) {
        this.addError(ErrorType.STORE_ERROR, error)
      }
    },

    // New Action: Pause the animation
    pauseAnimation() {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationPaused = true
        this.animationFrameId = null
      }
    },

    // New Action: Resume the animation from the paused state
    resumeAnimation() {
      if (this.animationPaused) {
        this.animationPaused = false
        this.animateButterflies()
      }
    },

    // New Action: Reset all butterflies to their default state without removing them
    resetButterflyState() {
      this.butterflies.forEach(butterfly => {
        butterfly.x = Math.random() * 100
        butterfly.y = Math.random() * 100
        butterfly.z = Math.random() * (this.newButterflySettings.maxSize - this.newButterflySettings.minSize) + this.newButterflySettings.minSize
        butterfly.speed = Math.random() * (this.newButterflySettings.maxSpeed - this.newButterflySettings.minSpeed) + this.newButterflySettings.minSpeed
        butterfly.rotation = Math.random() * (this.newButterflySettings.maxRotation - this.newButterflySettings.minRotation) + this.newButterflySettings.minRotation
        butterfly.wingSpeed = Math.random() * (this.newButterflySettings.maxWingSpeed - this.newButterflySettings.minWingSpeed) + this.newButterflySettings.minWingSpeed
        butterfly.sway = Math.random() * (this.newButterflySettings.maxSway - this.newButterflySettings.minSway) + this.newButterflySettings.minSway
      })
    },

    // New Action: Smoothly remove all butterflies with transitions (pseudo-code, would require front-end)
    smoothlyRemoveAllButterflies() {
      this.butterflies.forEach(butterfly => {
        // Use front-end transitions or CSS animations to fade out or remove butterflies
        // Example: butterfly.fadeOut = true
      })
      setTimeout(() => this.clearButterflies(), 500) // Delay the clear action to allow for transitions
    },

    // Save the current butterflies in localStorage to allow the user to restore them later
    saveButterfliesToLocalStorage() {
      try {
        const savedButterflies = JSON.stringify(this.butterflies)
        localStorage.setItem('butterflies', savedButterflies)
      } catch (error) {
        this.addError(ErrorType.STORE_ERROR, error)
      }
    },

    // Load butterflies from localStorage
    loadButterfliesFromLocalStorage() {
      try {
        const storedButterflies = localStorage.getItem('butterflies')
        if (storedButterflies) {
          this.butterflies = JSON.parse(storedButterflies)
        }
      } catch (error) {
        this.addError(ErrorType.STORE_ERROR, error)
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

    // Return the total number of butterflies
    getButterflyCount: (state) => state.butterflies.length,

    // Check if the animation is currently running or paused
    getActiveAnimationState: (state) => (state.animationFrameId !== null ? 'running' : state.animationPaused ? 'paused' : 'stopped'),

    // Get butterflies by a specific status
    getButterfliesByStatus: (state) => (status: Butterfly['status']) =>
      state.butterflies.filter(b => b.status === status),

    // Get the current preset name or index for reference
    getCurrentPresetName: (state) => (index: number) => (state.presets[index] ? `Preset ${index + 1}` : 'No Preset Selected'),
  },
})

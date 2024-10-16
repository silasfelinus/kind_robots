import { defineStore } from 'pinia'
import { makeNoise2D } from 'open-simplex-noise'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { generateFunnyName } from '@/utils/generateButterflyNames'

export interface Butterfly {
  id: string
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
  scale: number
}
interface ButterflyState {
  butterflies: Butterfly[]
  scaleModifier: number
  animationFrameId: number | null
  t: number
  animationPaused: boolean
  showNames: boolean
  selectedButterflyId: string
  newButterflySettings: {
    sizeRange: { min: number; max: number }
    speedRange: { min: number; max: number }
    rotationRange: { min: number; max: number }
    wingSpeedRange: { min: number; max: number }
    xRange: { min: number; max: number }
    yRange: { min: number; max: number }
    swayRange: { min: number; max: number } 
    zIndexRange: { min: number; max: number }
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
  if (!hslMatch) throw new Error('Invalid color format')
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
    showNames: true,
    selectedButterflyId: '',
    newButterflySettings: {
      sizeRange: { min: 0.5, max: 1.5 },
      speedRange: { min: 1, max: 3 },
      rotationRange: { min: 0, max: 360 },
      wingSpeedRange: { min: 1, max: 5 },
      xRange: { min: 0, max: 100 },
      yRange: { min: 0, max: 100 },
      swayRange: {min: 0.0, max: 1.0 },
      zIndexRange: { min: 0,  max: 50  },
      status: 'random',
      colorScheme: 'random',
    },
    presets: [],
  }),
  actions: {
    clearButterflies() {
      this.butterflies = []
      this.selectedButterflyId = ''
    },
    toggleShowNames() {
      this.showNames = !this.showNames
    },
    addError(type: ErrorType, message: unknown) {
      const errorStore = useErrorStore()
      errorStore.addError(type, message)
    },
    addButterfly(butterfly?: Butterfly) {
      if (!butterfly) {

        butterfly = {
          id: generateFunnyName(this.usedNames),
          x: Math.random() * (this.newButterflySettings.xRange.max - this.newButterflySettings.xRange.min) + this.newButterflySettings.xRange.min,
          y: Math.random() * (this.newButterflySettings.yRange.max - this.newButterflySettings.yRange.min) + this.newButterflySettings.yRange.min,
          z: Math.random() * (this.newButterflySettings.sizeRange.max - this.newButterflySettings.sizeRange.min) + this.newButterflySettings.sizeRange.min,
          zIndex: Math.floor(Math.random() * (this.newButterflySettings.zIndexRange.max - this.newButterflySettings.zIndexRange.min + 1)) + this.newButterflySettings.zIndexRange.min, // Updated zIndexRange
          rotation: Math.random() * (this.newButterflySettings.rotationRange.max - this.newButterflySettings.rotationRange.min) + this.newButterflySettings.rotationRange.min,
          wingTopColor: '',
          wingBottomColor: '',
          speed: Math.random() * (this.newButterflySettings.speedRange.max - this.newButterflySettings.speedRange.min) + this.newButterflySettings.speedRange.min,
          wingSpeed: Math.random() * (this.newButterflySettings.wingSpeedRange.max - this.newButterflySettings.wingSpeedRange.min) + this.newButterflySettings.wingSpeedRange.min,
          sway: Math.random() * (this.newButterflySettings.swayRange.max - this.newButterflySettings.swayRange.min) + this.newButterflySettings.swayRange.min, // Updated swayRange
          scale: Math.random() * 0.5 + 0.75,
          status: this.newButterflySettings.status,
        }
      }
    
      // Assign colors based on settings
      let primaryColor = randomColor()
      let secondaryColor = primaryColor
    
      // Color scheme logic (complementary, analogous, etc.)
      switch (this.newButterflySettings.colorScheme) {
        case 'complementary':
          secondaryColor = complementaryColor(primaryColor)
          break
        case 'analogous':
          secondaryColor = analogousColor(primaryColor)
          break
        case 'primary':
          primaryColor = randomPrimaryColor()
          secondaryColor = randomPrimaryColor()
          break
        case 'same':
          secondaryColor = primaryColor
          break
      }
    
      butterfly.wingTopColor = primaryColor
      butterfly.wingBottomColor = secondaryColor
    
      this.butterflies.push(butterfly)
      this.selectedButterflyId = butterfly.id
    },
    setSelectedButterfly(id: string) {
      this.selectedButterflyId = id
    },
    
    removeLastButterfly() {
      if (this.butterflies.length > 0) {
        const removedButterfly = this.butterflies.pop()

        if (removedButterfly?.id === this.selectedButterflyId) {
          this.selectedButterflyId = this.butterflies.length
            ? this.butterflies[this.butterflies.length - 1].id
            : ''
        }
      }
    },
    getColorSchemeColor(colorScheme: string): string {
      const primaryColor = randomColor()

      switch (colorScheme) {
        case 'complementary':
          return complementaryColor(primaryColor)
        case 'analogous':
          return analogousColor(primaryColor)
        case 'primary':
          return randomPrimaryColor()
        case 'same':
          return primaryColor
        case 'random':
        default:
          return primaryColor
      }
    },
    updateButterflyId(id: string, newId: string) {
      const butterfly = this.butterflies.find((b) => b.id === id)
      if (butterfly) {
        butterfly.id = newId
      }
    },

    generateInitialButterflies(count: number) {
      try {
        for (let i = 0; i < count; i++) {
          this.addButterfly({
            id: generateFunnyName(this.usedNames),
            x: Math.random() * (this.newButterflySettings.xRange.max - this.newButterflySettings.xRange.min) + this.newButterflySettings.xRange.min,
            y: Math.random() * (this.newButterflySettings.yRange.max - this.newButterflySettings.yRange.min) + this.newButterflySettings.yRange.min,
            z: Math.random() * (this.newButterflySettings.sizeRange.max - this.newButterflySettings.sizeRange.min) + this.newButterflySettings.sizeRange.min,
            zIndex: Math.floor(Math.random() * (this.newButterflySettings.zIndexRange.max - this.newButterflySettings.zIndexRange.min + 1)) + this.newButterflySettings.zIndexRange.min, // Updated to use zIndexRange
            rotation: Math.random() * (this.newButterflySettings.rotationRange.max - this.newButterflySettings.rotationRange.min) + this.newButterflySettings.rotationRange.min,
            wingTopColor: '',
            wingBottomColor: '',
            speed: Math.random() * (this.newButterflySettings.speedRange.max - this.newButterflySettings.speedRange.min) + this.newButterflySettings.speedRange.min,
            wingSpeed: Math.random() * (this.newButterflySettings.wingSpeedRange.max - this.newButterflySettings.wingSpeedRange.min) + this.newButterflySettings.wingSpeedRange.min,
            sway: Math.random() * (this.newButterflySettings.swayRange.max - this.newButterflySettings.swayRange.min) + this.newButterflySettings.swayRange.min, // Updated sway
            scale: Math.random() * 0.5 + 0.75,
            status: this.newButterflySettings.status,
          })
        }
      } catch (error) {
        this.addError(ErrorType.STORE_ERROR, error)
      }
    },
    

    // Update butterfly positions using noise2D
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
      butterfly.scale =
        0.33 +
        ((2 - (butterfly.x / window.innerWidth + butterfly.y / window.innerHeight)) / 2) * 0.67
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

    pauseAnimation() {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationPaused = true
        this.animationFrameId = null
      }
    },

    resumeAnimation() {
      if (this.animationPaused) {
        this.animationPaused = false
        this.animateButterflies()
      }
    },

    savePreset() {
      this.presets.push({ ...this.newButterflySettings })
      localStorage.setItem('butterflyPresets', JSON.stringify(this.presets))
    },

    loadPresets() {
      const storedPresets = localStorage.getItem('butterflyPresets')
      if (storedPresets) {
        this.presets = JSON.parse(storedPresets)
      }
    },

    applyPreset(index: number) {
      if (index >= 0 && index < this.presets.length) {
        this.newButterflySettings = { ...this.presets[index] }
      }
    },

    updateButterflySettings(newSettings: Partial<ButterflyState['newButterflySettings']>) {
      this.newButterflySettings = {
        ...this.newButterflySettings,
        ...newSettings,
      }
      this.savePreset()
    },
  },
  getters: {
    usedNames: (state) => state.butterflies.map(butterfly => butterfly.id),
  

    getAllButterflies: (state) => state.butterflies,

    getButterflyById: (state) => (id: string) =>
      state.butterflies.find(b => b.id === id),

    getScaleModifier: (state) => state.scaleModifier,

    getNewButterflySettings: (state) => state.newButterflySettings,

    getPresets: (state) => state.presets,

    getButterflyCount: (state) => state.butterflies.length,

    getActiveAnimationState: (state) => (state.animationFrameId !== null ? 'running' : state.animationPaused ? 'paused' : 'stopped'),

    getSelectedButterfly: (state) => state.butterflies.find(b => b.id === state.selectedButterflyId),
    
    getButterfliesByStatus: (state) => (status: Butterfly['status']) =>
      state.butterflies.filter(b => b.status === status),
  },
})

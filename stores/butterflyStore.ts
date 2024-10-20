import { defineStore } from 'pinia'
import { makeNoise2D } from 'open-simplex-noise'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { generateFunnyName } from '@/utils/generateButterflyNames'
import { generateMessage } from '@/utils/generateMessage'

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
  status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
  scale: number
  message: string
  goal: {
    x: number,
    y: number,
  },
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
    zIndexRange: { min: number; max: number }
    status: 'random' | 'float' | 'mouse' | 'spaz' | 'flock' | 'clear'
    colorScheme: 'random' | 'complementary' | 'analogous' | 'same' | 'primary'
  }
  presets: Array<ButterflyState['newButterflySettings']>
}

const noise2D = makeNoise2D(Date.now())

// Utility functions
const clampToTwoDecimals = (value: number): number => Math.round(value * 100) / 100



// Color helpers (extracted for reusability)
export const randomColor = (): string => {
  const h = Math.floor(Math.random() * 360)
  const s = Math.floor(Math.random() * 50 + 50)
  const l = Math.floor(Math.random() * 40 + 30)
  return `hsl(${h},${s}%,${l}%)`
}

export const analogousColor = (hsl: string): string => {
  const hslMatch = hsl.match(/\d+/g)
  if (!hslMatch) throw new Error('Invalid color format')
  const [h, s, l] = hslMatch.map(Number)
  const newH = (h + 30) % 360
  return `hsl(${newH},${s}%,${l}%)`
}

export const complementaryColor = (hsl: string): string => {
  const [h, s, l] = hsl.replace('hsl(', '').replace(')', '').split(',')
  const newH = (parseInt(h) + 180) % 360
  return `hsl(${newH},${s},${l})`
}

export const randomPrimaryColor = (): string => {
  const rainbowHues = [0, 60, 120, 180, 240, 300]
  const randomHue = rainbowHues[Math.floor(Math.random() * rainbowHues.length)]
  return `hsl(${randomHue}, 100%, 50%)`
}

export const applyColorScheme = (scheme: string, primaryColor: string): string => {
  switch (scheme) {
    case 'complementary':
      return complementaryColor(primaryColor)
    case 'analogous':
      return analogousColor(primaryColor)
    case 'primary':
      return randomPrimaryColor()
    case 'same':
      return primaryColor
    default:
      return primaryColor
  }
}

export const createNewButterfly = async (settings: ButterflyState['newButterflySettings'], usedNames: string[]): Promise<Butterfly> => {
  const primaryColor = randomColor()
  const secondaryColor = applyColorScheme(settings.colorScheme, primaryColor)

  // Await the message from the async generateMessage function
  const message = await generateMessage()

  return {
    id: generateFunnyName(usedNames),
    x: clampToTwoDecimals(Math.random() * (settings.xRange.max - settings.xRange.min) + settings.xRange.min),
    y: clampToTwoDecimals(Math.random() * (settings.yRange.max - settings.yRange.min) + settings.yRange.min),
    z: clampToTwoDecimals(Math.random() * (settings.sizeRange.max - settings.sizeRange.min) + settings.sizeRange.min),
    zIndex: Math.floor(Math.random() * (settings.zIndexRange.max - settings.zIndexRange.min + 1)) + settings.zIndexRange.min,
    rotation: clampToTwoDecimals(Math.random() * (settings.rotationRange.max - settings.rotationRange.min) + settings.rotationRange.min),
    wingTopColor: primaryColor,
    wingBottomColor: secondaryColor,
    speed: clampToTwoDecimals(Math.random() * (settings.speedRange.max - settings.speedRange.min) + settings.speedRange.min),
    wingSpeed: clampToTwoDecimals(Math.random() * (settings.wingSpeedRange.max - settings.wingSpeedRange.min) + settings.wingSpeedRange.min),
    scale: clampToTwoDecimals(Math.random() * 0.5 + 0.75),
    status: settings.status,
    message,  // Use the awaited message
    goal: {
      x: clampToTwoDecimals(Math.random() * 100),
      y: clampToTwoDecimals(Math.random() * 100),
    }
  }
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
      rotationRange: { min: 110, max: 110 },
      wingSpeedRange: { min: 1, max: 5 },
      xRange: { min: 0, max: 100 },
      yRange: { min: 0, max: 100 },
      zIndexRange: { min: 0, max: 50 },
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
      async addButterfly(butterfly?: Butterfly) {
        try {
          const usedNames = this.usedNames
          const newButterfly = butterfly || await createNewButterfly(this.newButterflySettings, usedNames)
          this.butterflies.push(newButterfly)
        } catch (error) {
          this.addError(ErrorType.STORE_ERROR, error)
        }
      },
    
      async generateInitialButterflies(count: number) {
        try {
          for (let i = 0; i < count; i++) {
            await this.addButterfly()  // Ensure each butterfly is created asynchronously
          }
        } catch (error) {
          this.addError(ErrorType.STORE_ERROR, error)
        }
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
    updateButterflyPosition(butterfly: Butterfly) {
      let t = 0
      t += 0.01
      const angle = noise2D(butterfly.goal.x * 0.01, butterfly.goal.y * 0.01 + t) * Math.PI * 2
      const dx = Math.cos(angle) * butterfly.speed
      const dy = Math.sin(angle) * butterfly.speed

      butterfly.goal.x = Math.max(Math.min(butterfly.goal.x + dx, window.innerWidth - 100), 0)
      butterfly.goal.y = Math.max(Math.min(butterfly.goal.y + dy, window.innerHeight - 100), 0)

      butterfly.scale = 0.33 + (2 - (butterfly.goal.x / window.innerWidth + butterfly.goal.y / window.innerHeight)) / 2 * 0.67
      butterfly.rotation = dx >= 0 ? 120 : 30
    },
    animateButterflies() {
      const animate = () => {
        this.butterflies.forEach(butterfly => this.updateButterflyPosition(butterfly))
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
      this.newButterflySettings = { ...this.newButterflySettings, ...newSettings }
      this.savePreset()
    },
  },
  getters: {
    usedNames: state => state.butterflies.map(butterfly => butterfly.id),
    getAllButterflies: state => state.butterflies,
    getButterflyById: state => (id: string) => state.butterflies.find(b => b.id === id),
    getScaleModifier: state => state.scaleModifier,
    getNewButterflySettings: state => state.newButterflySettings,
    getPresets: state => state.presets,
    getButterflyCount: state => state.butterflies.length,
    getActiveAnimationState: state => state.animationFrameId !== null ? 'running' : state.animationPaused ? 'paused' : 'stopped',
    getSelectedButterfly: state => state.butterflies.find(b => b.id === state.selectedButterflyId),
    getButterfliesByStatus: state => (status: Butterfly['status']) => state.butterflies.filter(b => b.status === status),
  },
})

// /stores/butterflyStore.ts

import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useErrorStore, ErrorType } from './errorStore'
import {
  type Butterfly,
  type ButterflySettingsWithOptions,
  type ButterflyState,
  createNewButterfly,
  clampToTwoDecimals,
  randomColor,
  randomPrimaryColor,
  complementaryColor,
  analogousColor,
  applyColorScheme,
  getNoise,
} from './helpers/butterflyHelper'

export const useButterflyStore = defineStore('butterflyStore', () => {
  const butterflies = ref<Butterfly[]>([])
  const scaleModifier = ref(1)
  const animationFrameId = ref<number | null>(null)
  const t = ref(0)
  const animationPaused = ref(false)
  const showNames = ref(true)
  const selectedButterflyId = ref('')
  const targetCount = ref(20)
  const initialized = ref(false)
  const drainIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
  const drainStartTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)

  const originalButterflySettings = reactive({
    sizeRange: { min: 0.5, max: 1.5 },
    speedRange: { min: 1, max: 3 },
    rotationRange: { min: 110, max: 110 },
    wingSpeedRange: { min: 1, max: 5 },
    xRange: { min: 0, max: 100 },
    yRange: { min: 0, max: 100 },
    zIndexRange: { min: 0, max: 50 },
  })

  const newButterflySettings = reactive<ButterflySettingsWithOptions>({
    ...originalButterflySettings,
    status: 'random',
    colorScheme: 'random',
  })

  const presets = ref<ButterflySettingsWithOptions[]>([])

  const usedNames = computed(() => butterflies.value.map((b) => b.id))
  const getAllButterflies = computed(() => butterflies.value)
  const getButterflyById = (id: string) =>
    butterflies.value.find((b) => b.id === id)
  const getScaleModifier = computed(() => scaleModifier.value)
  const getNewButterflySettings = computed(() => newButterflySettings)
  const getPresets = computed(() => presets.value)
  const getButterflyCount = computed(() => butterflies.value.length)
  const getActiveAnimationState = computed(() => {
    return animationFrameId.value !== null
      ? 'running'
      : animationPaused.value
        ? 'paused'
        : 'stopped'
  })
  const getSelectedButterfly = computed(() =>
    butterflies.value.find((b) => b.id === selectedButterflyId.value),
  )
  const getButterfliesByStatus = (status: Butterfly['status']) =>
    butterflies.value.filter((b) => b.status === status)
  const getOriginalButterflySettings = computed(() => originalButterflySettings)
  const getSettings = computed(() => ({
    current: newButterflySettings,
    original: originalButterflySettings,
  }))

  function clearButterflies() {
    butterflies.value = []
    selectedButterflyId.value = ''
  }

  function toggleShowNames() {
    showNames.value = !showNames.value
  }

  function addError(type: ErrorType, message: unknown) {
    useErrorStore().addError(type, message)
  }

  async function addButterfly(butterfly?: Butterfly) {
    try {
      const newButterfly =
        butterfly ||
        (await createNewButterfly(newButterflySettings, usedNames.value))
      butterflies.value.push(newButterfly)
      selectedButterflyId.value = newButterfly.id
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function syncButterflyCount() {
    try {
      const diff = targetCount.value - butterflies.value.length

      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          await addButterfly()
        }
      }

      if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          removeLastButterfly()
        }
      }
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function generateInitialButterflies(count: number) {
    try {
      for (let i = 0; i < count; i++) {
        await addButterfly()
      }
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function removeLastButterfly() {
    const removed = butterflies.value.pop()
    if (removed?.id === selectedButterflyId.value) {
      selectedButterflyId.value = butterflies.value.at(-1)?.id || ''
    }
  }

  function removeRandomButterfly() {
    if (!butterflies.value.length) return

    const index = Math.floor(Math.random() * butterflies.value.length)
    const removed = butterflies.value.splice(index, 1)[0]

    if (!removed) return

    if (removed.id === selectedButterflyId.value) {
      selectedButterflyId.value =
        butterflies.value.at(-1)?.id || butterflies.value.at(0)?.id || ''
    }
  }

  function stopDrain() {
    if (drainStartTimeoutId.value) {
      clearTimeout(drainStartTimeoutId.value)
      drainStartTimeoutId.value = null
    }

    if (drainIntervalId.value) {
      clearInterval(drainIntervalId.value)
      drainIntervalId.value = null
    }
  }

  function startDrain(delay = 1200, interval = 450) {
    stopDrain()

    drainStartTimeoutId.value = setTimeout(() => {
      drainStartTimeoutId.value = null

      drainIntervalId.value = setInterval(() => {
        if (!butterflies.value.length) {
          stopDrain()
          return
        }

        removeRandomButterfly()
      }, interval)
    }, delay)
  }

  async function initialize() {
    if (initialized.value) return

    try {
      clearButterflies()
      targetCount.value = 20
      await generateInitialButterflies(targetCount.value)
      startDrain()
      initialized.value = true
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function resetButterflySettings() {
    Object.assign(newButterflySettings, {
      ...originalButterflySettings,
      status: 'random',
      colorScheme: 'random',
    })
  }

  function updateButterflyPosition(butterfly: Butterfly) {
    t.value += 0.01
    const noise2D = getNoise()
    const angle =
      noise2D(butterfly.goal.x * 0.01, butterfly.goal.y * 0.01 + t.value) *
      Math.PI *
      2
    const dx = Math.cos(angle) * butterfly.speed
    const dy = Math.sin(angle) * butterfly.speed

    butterfly.goal.x = Math.max(
      Math.min(butterfly.goal.x + dx, window.innerWidth - 100),
      0,
    )
    butterfly.goal.y = Math.max(
      Math.min(butterfly.goal.y + dy, window.innerHeight - 100),
      0,
    )

    butterfly.scale =
      0.33 +
      ((2 -
        (butterfly.goal.x / window.innerWidth +
          butterfly.goal.y / window.innerHeight)) /
        2) *
        0.67
    butterfly.rotation = dx >= 0 ? 120 : 30
  }

  function animateButterflies() {
    const animate = () => {
      butterflies.value.forEach(updateButterflyPosition)
      animationFrameId.value = requestAnimationFrame(animate)
    }
    animate()
  }

  function pauseAnimation() {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationPaused.value = true
      animationFrameId.value = null
    }
  }

  function resumeAnimation() {
    if (animationPaused.value) {
      animationPaused.value = false
      animateButterflies()
    }
  }

  function savePreset() {
    presets.value.push({ ...newButterflySettings })
    localStorage.setItem('butterflyPresets', JSON.stringify(presets.value))
  }

  function loadPresets() {
    const stored = localStorage.getItem('butterflyPresets')
    if (stored) presets.value = JSON.parse(stored)
  }

  function resetPresets() {
    presets.value = []
    localStorage.removeItem('butterflyPresets')
  }

  function applyPreset(index: number) {
    if (index >= 0 && index < presets.value.length) {
      Object.assign(newButterflySettings, presets.value[index])
    }
  }

  function updateButterflySettings(
    newSettings: Partial<ButterflySettingsWithOptions>,
  ) {
    Object.assign(newButterflySettings, newSettings)
    if (Object.keys(newSettings).length) savePreset()
  }

  return {
    butterflies,
    scaleModifier,
    animationFrameId,
    t,
    animationPaused,
    showNames,
    selectedButterflyId,
    originalButterflySettings,
    newButterflySettings,
    presets,
    targetCount,
    initialized,
    drainIntervalId,
    drainStartTimeoutId,

    usedNames,
    getAllButterflies,
    getButterflyById,
    getScaleModifier,
    getNewButterflySettings,
    getPresets,
    getButterflyCount,
    getActiveAnimationState,
    getSelectedButterfly,
    getButterfliesByStatus,
    getOriginalButterflySettings,
    getSettings,

    clearButterflies,
    toggleShowNames,
    addError,
    addButterfly,
    syncButterflyCount,
    generateInitialButterflies,
    removeLastButterfly,
    removeRandomButterfly,
    startDrain,
    stopDrain,
    initialize,
    resetButterflySettings,
    updateButterflyPosition,
    animateButterflies,
    pauseAnimation,
    resumeAnimation,
    savePreset,
    loadPresets,
    resetPresets,
    applyPreset,
    updateButterflySettings,

    createNewButterfly,
    clampToTwoDecimals,
    randomColor,
    randomPrimaryColor,
    complementaryColor,
    analogousColor,
    applyColorScheme,
  }
})

export type { Butterfly }

// /stores/butterflyStore.ts

import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { ErrorType, useErrorStore } from './errorStore'
import {
  type Butterfly,
  type ButterflySettingsWithOptions,
  analogousColor,
  applyColorScheme,
  clampToTwoDecimals,
  complementaryColor,
  createNewButterfly,
  randomColor,
  randomPrimaryColor,
} from './helpers/butterflyHelper'
import { createButterflyEffects } from './helpers/butterflyEffects'

type StartupButterflyMode = 'legacy' | 'dynamic'

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
  const initializing = ref(false)
  const initializePromise = ref<Promise<void> | null>(null)
  const gameInitialized = ref(false)
  const gameLoading = ref(false)
  const initGamePromise = ref<Promise<void> | null>(null)
  const startupSwarmPromise = ref<Promise<void> | null>(null)
  const loaderDebug = ref(false)
  const lastError = ref<string | null>(null)
  const drainIntervalId = ref<ReturnType<typeof setInterval> | null>(null)
  const drainStartTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
  const showSwarm = ref(true)
  const startupButterflyMode = ref<StartupButterflyMode>('legacy')
  const loaderEffectName = ref('startup-exit')
  const presets = ref<ButterflySettingsWithOptions[]>([])
  const gameOpen = ref(false)
  const capturedButterflyIds = ref<Set<string>>(new Set())
  const inspectedButterfly = ref<Butterfly | null>(null)
  const discoveryButterfly = ref<Butterfly | null>(null)

  const originalButterflySettings = reactive({
    sizeRange: { min: 0.5, max: 1.5 },
    speedRange: { min: 1, max: 3 },
    rotationRange: { min: 110, max: 110 },
    wingSpeedRange: { min: 1, max: 5 },
    xRange: { min: 0, max: 100 },
    yRange: { min: 0, max: 100 },
    zIndexRange: { min: 50, max: 50 },
  })

  const newButterflySettings = reactive<ButterflySettingsWithOptions>({
    ...originalButterflySettings,
    status: 'random',
    colorScheme: 'random',
  })

  const usedNames = computed(() => butterflies.value.map((b) => b.id))
  const getAllButterflies = computed(() => butterflies.value)
  const getButterflyById = (id: string) =>
    butterflies.value.find((butterfly) => butterfly.id === id)

  function addError(type: ErrorType, message: unknown) {
    useErrorStore().addError(type, message)
  }

  const effects = createButterflyEffects({
    butterflies,
    selectedButterflyId,
    drainIntervalId,
    drainStartTimeoutId,
    newButterflySettings,
    usedNames,
    getButterflyById,
    addError,
  })

  const {
    updateButterflyPosition,
    isOutsideRemovalBounds,
    stopDrain,
    startDrain,
    markButterflyForExit,
    markAllButterfliesForExit,
    sendButterflyAway,
    sendRandomButterflyAway,
    sendAllButterfliesAway,
    destroyToggleButterflies,
    isToggleButterfly,
    handleToggleButterflyClick,
    relocateToggleButterfly,
    spawnLoaderButterflies,
    requestLoaderRelease,
    clearButterflyMotionState,
    clearLoaderStates,
  } = effects

  function logLoaderEffect(event: string, details: Record<string, unknown> = {}) {
    if (import.meta.server || !loaderDebug.value) return
    console.info('[butterfly-loader]', event, {
      effect: loaderEffectName.value,
      count: butterflies.value.length,
      initialized: initialized.value,
      ...details,
    })
  }

  function animateButterflies() {
    if (import.meta.server || animationFrameId.value !== null) return
    animationPaused.value = false

    const animate = () => {
      if (!butterflies.value.length) {
        animationFrameId.value = null
        if (startupButterflyMode.value !== 'legacy') showSwarm.value = false
        return
      }

      const now = performance.now()

      for (let i = butterflies.value.length - 1; i >= 0; i--) {
        const butterfly = butterflies.value[i]!
        updateButterflyPosition(butterfly, now)

        if (butterfly.isExiting && isOutsideRemovalBounds(butterfly)) {
          clearButterflyMotionState(butterfly.id)
          butterflies.value.splice(i, 1)

          if (selectedButterflyId.value === butterfly.id) {
            selectedButterflyId.value =
              butterflies.value.find((entry) => !entry.isExiting)?.id || ''
          }
        }
      }

      animationFrameId.value = butterflies.value.length
        ? requestAnimationFrame(animate)
        : null
    }

    animationFrameId.value = requestAnimationFrame(animate)
  }

  function pauseAnimation() {
    if (animationFrameId.value === null) return
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
    animationPaused.value = true
  }

  function clearLoaderExitTimer() {
    if (!drainStartTimeoutId.value) return
    clearTimeout(drainStartTimeoutId.value)
    drainStartTimeoutId.value = null
  }

  function clearAllButterflies() {
    stopDrain()
    clearLoaderExitTimer()
    butterflies.value = []
    selectedButterflyId.value = ''
  }

  function clearButterflies() {
    clearAllButterflies()
  }

  function clearRandomButterfly() {
    const butterfly = butterflies.value[Math.floor(Math.random() * butterflies.value.length)]
    if (butterfly) removeButterflyById(butterfly.id)
  }

  function removeRandomButterfly() {
    sendRandomButterflyAway()
  }

  function removeLastButterfly() {
    const removed = butterflies.value.pop()
    if (removed?.id === selectedButterflyId.value) {
      selectedButterflyId.value = butterflies.value.at(-1)?.id || ''
    }
  }

  function removeButterflyById(id: string) {
    const index = butterflies.value.findIndex((butterfly) => butterfly.id === id)
    if (index === -1) return
    butterflies.value.splice(index, 1)

    if (selectedButterflyId.value === id) {
      selectedButterflyId.value =
        butterflies.value.find((butterfly) => !butterfly.isExiting)?.id || ''
    }
  }

  function clearButterflyById(id: string) {
    removeButterflyById(id)
  }

  async function addButterfly(butterfly?: Butterfly) {
    try {
      const nextButterfly =
        butterfly ||
        (await createNewButterfly(newButterflySettings, usedNames.value))
      butterflies.value.push(nextButterfly)
      selectedButterflyId.value = nextButterfly.id
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function addButterflies(amount: number, incoming?: Butterfly[]) {
    try {
      const safeAmount = Math.max(0, Math.floor(amount))
      if (!safeAmount) return

      const nextButterflies = incoming?.length
        ? incoming.slice(0, safeAmount)
        : await Promise.all(
            Array.from({ length: safeAmount }, () =>
              createNewButterfly(newButterflySettings, usedNames.value),
            ),
          )

      butterflies.value.push(...nextButterflies)
      selectedButterflyId.value =
        nextButterflies.at(-1)?.id || selectedButterflyId.value
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function syncButterflyCount() {
    const diff = targetCount.value - butterflies.value.length
    if (diff > 0) await addButterflies(diff)
    if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) removeRandomButterfly()
    }
  }

  async function generateInitialButterflies(count: number) {
    await addButterflies(count)
  }

  async function initialize(force = false) {
    if (initialized.value && !force) return
    if (initializePromise.value && !force) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        initializing.value = true
        lastError.value = null

        if (force) {
          pauseAnimation()
          stopDrain()
          clearLoaderExitTimer()
          destroyToggleButterflies()
          butterflies.value = []
          selectedButterflyId.value = ''
        }

        loadPresets()
        animateButterflies()
        initialized.value = true
      } catch (error) {
        initialized.value = false
        lastError.value = error instanceof Error ? error.message : 'Failed to initialize butterflies'
        addError(ErrorType.STORE_ERROR, error)
      } finally {
        initializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function spawnStartupSwarm(amount = 20, force = false) {
    if (startupSwarmPromise.value && !force) return startupSwarmPromise.value

    startupSwarmPromise.value = (async () => {
      try {
        if (!initialized.value) await initialize()
        else animateButterflies()

        stopDrain()
        clearLoaderExitTimer()
        clearLoaderStates()
        butterflies.value = []
        selectedButterflyId.value = ''
        targetCount.value = amount
        showSwarm.value = true

        if (startupButterflyMode.value === 'legacy') {
          loaderEffectName.value = 'startup-legacy-css'
          logLoaderEffect('legacy:start', { amount })
          triggerLoaderButterflyExit(5000)
          return
        }

        loaderEffectName.value = 'startup-immediate-exit'
        logLoaderEffect('spawn:start', { amount })
        await spawnLoaderButterflies(amount, 'inside-drift')
        animateButterflies()
        markAllButterfliesForExit()
      } catch (error) {
        lastError.value = error instanceof Error ? error.message : 'Failed to spawn startup swarm'
        addError(ErrorType.STORE_ERROR, error)
      } finally {
        startupSwarmPromise.value = null
      }
    })()

    return startupSwarmPromise.value
  }

  function triggerLoaderButterflyExit(delay = 0) {
    clearLoaderExitTimer()
    const safeDelay = Math.max(0, Math.floor(delay))
    logLoaderEffect('exit:triggered', { delay: safeDelay })

    if (startupButterflyMode.value === 'legacy') {
      if (safeDelay === 0) {
        showSwarm.value = false
        clearLoaderStates()
        butterflies.value = []
        selectedButterflyId.value = ''
        return
      }

      drainStartTimeoutId.value = setTimeout(() => {
        drainStartTimeoutId.value = null
        showSwarm.value = false
        clearLoaderStates()
        butterflies.value = []
        selectedButterflyId.value = ''
      }, safeDelay)

      return
    }

    if (safeDelay === 0) {
      markAllButterfliesForExit()
      return
    }

    drainStartTimeoutId.value = setTimeout(() => {
      drainStartTimeoutId.value = null
      markAllButterfliesForExit()
    }, safeDelay)
  }

  async function toggleSwarm(amount = 20) {
    if (butterflies.value.length === 0) {
      showSwarm.value = true
      await addButterflies(amount)
      return
    }

    showSwarm.value = !showSwarm.value
  }

  function resetButterflyLayer() {
    pauseAnimation()
    stopDrain()
    clearLoaderExitTimer()
    destroyToggleButterflies()
    butterflies.value = []
    selectedButterflyId.value = ''
    animationPaused.value = false
    animateButterflies()
  }

  function toggleShowNames() {
    showNames.value = !showNames.value
  }

  function setShowNames(value: boolean) {
    showNames.value = value
  }

  function resetButterflySettings() {
    Object.assign(newButterflySettings, {
      ...originalButterflySettings,
      status: 'random',
      colorScheme: 'random',
    })
  }

  function resumeAnimation() {
    if (!animationPaused.value) return
    animationPaused.value = false
    animateButterflies()
  }

  function safeGetLocalStorage(key: string): string | null {
    if (import.meta.server) return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  function safeSetLocalStorage(key: string, value: string) {
    if (import.meta.server) return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function safeRemoveLocalStorage(key: string) {
    if (import.meta.server) return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function savePreset() {
    safeSetLocalStorage('butterflyPresets', JSON.stringify(presets.value))
  }

  function loadPresets() {
    const stored = safeGetLocalStorage('butterflyPresets')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) presets.value = parsed
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function resetPresets() {
    presets.value = []
    safeRemoveLocalStorage('butterflyPresets')
  }

  function applyPreset(index: number) {
    if (index >= 0 && index < presets.value.length) {
      Object.assign(newButterflySettings, presets.value[index])
    }
  }

  function updateButterflySettings(
    newSettings: Partial<ButterflySettingsWithOptions>,
    options: { save?: boolean } = {},
  ) {
    Object.assign(newButterflySettings, newSettings)

    if (options.save) {
      presets.value.push({ ...newButterflySettings })
      savePreset()
    }
  }

  async function initGame(force = false) {
    if (gameInitialized.value && !force) return
    if (initGamePromise.value && !force) return initGamePromise.value

    initGamePromise.value = (async () => {
      try {
        gameLoading.value = true
        lastError.value = null
        gameInitialized.value = true
      } catch (error) {
        gameInitialized.value = false
        lastError.value = error instanceof Error ? error.message : 'Failed to initialize butterfly interactibles'
        addError(ErrorType.STORE_ERROR, error)
      } finally {
        gameLoading.value = false
        initGamePromise.value = null
      }
    })()

    return initGamePromise.value
  }

  function resetInitialization() {
    pauseAnimation()
    stopDrain()
    clearLoaderExitTimer()
    destroyToggleButterflies()
    butterflies.value = []
    selectedButterflyId.value = ''
    initialized.value = false
    initializing.value = false
    initializePromise.value = null
    gameInitialized.value = false
    gameLoading.value = false
    initGamePromise.value = null
    startupSwarmPromise.value = null
    capturedButterflyIds.value = new Set()
    discoveryButterfly.value = null
    lastError.value = null
  }

  async function recordCapture(butterfly: Butterfly) {
    capturedButterflyIds.value = new Set([
      ...capturedButterflyIds.value,
      butterfly.id,
    ])
    discoveryButterfly.value = butterfly
  }

  function clearDiscovery() {
    discoveryButterfly.value = null
  }

  function setShowSwarm(value: boolean) {
    showSwarm.value = value
  }

  function setStartupButterflyMode(mode: StartupButterflyMode) {
    startupButterflyMode.value = mode
  }

  function toggleStartupButterflyMode() {
    startupButterflyMode.value = startupButterflyMode.value === 'legacy' ? 'dynamic' : 'legacy'
  }

  function setInspected(butterfly: Butterfly) {
    inspectedButterfly.value = butterfly
  }

  const getScaleModifier = computed(() => scaleModifier.value)
  const getNewButterflySettings = computed(() => newButterflySettings)
  const getPresets = computed(() => presets.value)
  const getButterflyCount = computed(() => butterflies.value.length)
  const getActiveAnimationState = computed(() =>
    animationFrameId.value !== null
      ? 'running'
      : animationPaused.value
        ? 'paused'
        : 'stopped',
  )
  const getSelectedButterfly = computed(() =>
    butterflies.value.find((butterfly) => butterfly.id === selectedButterflyId.value),
  )
  const getButterfliesByStatus = (status: Butterfly['status']) =>
    butterflies.value.filter((butterfly) => butterfly.status === status)
  const getOriginalButterflySettings = computed(() => originalButterflySettings)
  const getSettings = computed(() => ({
    current: newButterflySettings,
    original: originalButterflySettings,
  }))
  const useLegacyStartupButterflies = computed(
    () => startupButterflyMode.value === 'legacy',
  )

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
    gameOpen,
    capturedButterflyIds,
    inspectedButterfly,
    discoveryButterfly,
    clearDiscovery,
    spawnStartupSwarm,
    toggleSwarm,
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
    relocateToggleButterfly,
    clearButterflies,
    toggleShowNames,
    addError,
    addButterfly,
    addButterflies,
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
    initGame,
    recordCapture,
    setInspected,
    resetButterflyLayer,
    createNewButterfly,
    clampToTwoDecimals,
    randomColor,
    randomPrimaryColor,
    complementaryColor,
    analogousColor,
    applyColorScheme,
    setShowNames,
    markButterflyForExit,
    handleToggleButterflyClick,
    destroyToggleButterflies,
    isToggleButterfly,
    showSwarm,
    setShowSwarm,
    sendAllButterfliesAway,
    clearRandomButterfly,
    clearAllButterflies,
    sendRandomButterflyAway,
    sendButterflyAway,
    clearButterflyById,
    markAllButterfliesForExit,
    clearLoaderExitTimer,
    triggerLoaderButterflyExit,
    loaderEffectName,
    logLoaderEffect,
    initializing,
    initializePromise,
    gameInitialized,
    gameLoading,
    initGamePromise,
    startupSwarmPromise,
    loaderDebug,
    lastError,
    resetInitialization,
    clearLoaderStates,
    startupButterflyMode,
    useLegacyStartupButterflies,
    setStartupButterflyMode,
    toggleStartupButterflyMode,
    requestLoaderRelease,
  }
})

export type { Butterfly }

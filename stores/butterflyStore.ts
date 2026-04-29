// /stores/butterflyStore.ts

import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useErrorStore, ErrorType } from './errorStore'
import { useUserStore } from './userStore'
import {
  type Butterfly,
  type ButterflySettingsWithOptions,
  createNewButterfly,
  clampToTwoDecimals,
  randomColor,
  randomPrimaryColor,
  complementaryColor,
  analogousColor,
  applyColorScheme,
} from './helpers/butterflyHelper'

import { createButterflyEffects } from './helpers/butterflyEffects'

interface DbButterfly {
  id: number
  name: string
  message: string
  wingTopColor: string
  wingBottomColor: string
  speed: number
  wingSpeed: number
  scale: number
  rarityNumber: number
  artImageId?: number
  designer?: string
  userId?: number
}

interface DbButterflyRecord {
  id: number
  butterflyId: number
  userId: number
}

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

  const showSwarm = ref(true)

  const loaderEffectName = ref('startup-exit')

  function logLoaderEffect(
    event: string,
    details: Record<string, unknown> = {},
  ) {
    if (import.meta.server) return

    console.info('[butterfly-loader]', event, {
      effect: loaderEffectName.value,
      count: butterflies.value.length,
      initialized: initialized.value,
      ...details,
    })
  }

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

  const presets = ref<ButterflySettingsWithOptions[]>([])

  const gameOpen = ref(false)
  const dbButterflies = ref<DbButterfly[]>([])
  const userCaughtIds = ref<Set<number>>(new Set())
  const inspectedButterfly = ref<Butterfly | null>(null)

  function clearRandomButterfly() {
    if (!butterflies.value.length) return

    const butterfly =
      butterflies.value[Math.floor(Math.random() * butterflies.value.length)]

    if (!butterfly) return
    removeButterflyById(butterfly.id)
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

  function removeRandomButterfly() {
    sendRandomButterflyAway()
  }

  function hydrateButterfly(db: DbButterfly): Butterfly {
    const baseZIndex = 50

    return {
      id: db.name,
      name: db.name,
      message: db.message,
      wingTopColor: db.wingTopColor,
      wingBottomColor: db.wingBottomColor,
      speed: db.speed,
      wingSpeed: db.wingSpeed,
      scale: db.scale,
      scaleMod: 1,
      rarity: db.rarityNumber,
      artImageId: db.artImageId,
      noiseOffsetX: Math.random() * 1000,
      noiseOffsetY: Math.random() * 1000,
      x: clampToTwoDecimals(Math.random() * 100),
      y: clampToTwoDecimals(Math.random() * 100),
      z: clampToTwoDecimals(Math.random() * 0.5 + 0.5),
      baseZIndex,
      zIndex: baseZIndex,
      rotation: 110,
      status: 'random',
      isExiting: false,
      userId: db.userId,
      designer: db.designer,
      goal: {
        x: clampToTwoDecimals(Math.random() * 100),
        y: clampToTwoDecimals(Math.random() * 100),
      },
    }
  }

  function animateButterflies() {
    if (animationFrameId.value !== null) return

    animationPaused.value = false

    const animate = () => {
      const next = butterflies.value.filter((butterfly) => {
        updateButterflyPosition(butterfly)

        const shouldRemove =
          butterfly.isExiting && isOutsideRemovalBounds(butterfly)

        if (shouldRemove) {
          clearButterflyMotionState(butterfly.id)
        }

        return !shouldRemove
      })

      if (
        selectedButterflyId.value &&
        !next.some((butterfly) => butterfly.id === selectedButterflyId.value)
      ) {
        selectedButterflyId.value =
          next.find((butterfly) => !butterfly.isExiting)?.id || ''
      }

      butterflies.value = next
      animationFrameId.value = requestAnimationFrame(animate)
    }

    animationFrameId.value = requestAnimationFrame(animate)
  }

  function pauseAnimation() {
    if (animationFrameId.value === null) return

    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
    animationPaused.value = true
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

  function addError(type: ErrorType, message: unknown) {
    useErrorStore().addError(type, message)
  }

  async function addButterfly(butterfly?: Butterfly) {
    try {
      const currentUserStore = useUserStore()

      const newButterfly =
        butterfly ||
        (await createNewButterfly(newButterflySettings, usedNames.value))

      if (newButterfly.userId == null && currentUserStore.userId != null) {
        newButterfly.userId = currentUserStore.userId
      }

      butterflies.value.push(newButterfly)
      selectedButterflyId.value = newButterfly.id
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function addButterflies(amount: number, incoming?: Butterfly[]) {
    try {
      const currentUserStore = useUserStore()
      const safeAmount = Math.max(0, Math.floor(amount))
      if (safeAmount === 0) return

      if (incoming?.length) {
        const nextButterflies = incoming
          .slice(0, safeAmount)
          .map((butterfly) => ({
            ...butterfly,
            userId: butterfly.userId ?? currentUserStore.userId ?? undefined,
          }))

        butterflies.value.push(...nextButterflies)
        selectedButterflyId.value =
          nextButterflies.at(-1)?.id || selectedButterflyId.value
        return
      }

      const nextButterflies: Butterfly[] = []
      const localUsedNames = [...usedNames.value]

      for (let i = 0; i < safeAmount; i++) {
        const newButterfly = await createNewButterfly(
          newButterflySettings,
          localUsedNames,
        )

        if (newButterfly.userId == null && currentUserStore.userId != null) {
          newButterfly.userId = currentUserStore.userId
        }

        nextButterflies.push(newButterfly)
        localUsedNames.push(newButterfly.id)
      }

      butterflies.value.push(...nextButterflies)
      selectedButterflyId.value =
        nextButterflies.at(-1)?.id || selectedButterflyId.value
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function syncButterflyCount() {
    try {
      const diff = targetCount.value - butterflies.value.length
      if (diff > 0) {
        await addButterflies(diff)
      }
      if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          removeRandomButterfly()
        }
      }
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function generateInitialButterflies(count: number) {
    try {
      await addButterflies(count)
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

  async function initialize() {
    if (initialized.value) return

    try {
      butterflies.value = []
      selectedButterflyId.value = ''
      animateButterflies()
      initialized.value = true
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function spawnStartupSwarm(amount = 20) {
    try {
      stopDrain()
      clearLoaderExitTimer()
      butterflies.value = []
      selectedButterflyId.value = ''
      targetCount.value = amount
      loaderEffectName.value = 'startup-random-spawn-immediate-exit'

      logLoaderEffect('spawn:start', { amount })

      await addButterflies(amount)

      logLoaderEffect('spawn:complete', {
        spawned: butterflies.value.length,
        exitMode: 'mark-all',
      })

      markAllButterfliesForExit()

      logLoaderEffect('exit:requested', {
        exiting: butterflies.value.filter((butterfly) => butterfly.isExiting)
          .length,
      })
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function clearLoaderExitTimer() {
    if (!drainStartTimeoutId.value) return

    clearTimeout(drainStartTimeoutId.value)
    drainStartTimeoutId.value = null
  }

  function triggerLoaderButterflyExit(delay = 0) {
    clearLoaderExitTimer()

    const safeDelay = Math.max(0, Math.floor(delay))

    logLoaderEffect('exit:triggered', {
      delay: safeDelay,
      mode: safeDelay === 0 ? 'immediate' : 'delayed',
    })

    if (safeDelay === 0) {
      markAllButterfliesForExit()

      logLoaderEffect('exit:marked', {
        exiting: butterflies.value.filter((butterfly) => butterfly.isExiting)
          .length,
      })

      return
    }

    drainStartTimeoutId.value = setTimeout(() => {
      drainStartTimeoutId.value = null
      markAllButterfliesForExit()

      logLoaderEffect('exit:marked-after-delay', {
        exiting: butterflies.value.filter((butterfly) => butterfly.isExiting)
          .length,
      })
    }, safeDelay)
  }

  async function initializeLoaderButterflies(amount = 20) {
    if (!initialized.value) {
      await initialize()
    }

    stopDrain()
    clearLoaderExitTimer()
    butterflies.value = []
    selectedButterflyId.value = ''
    targetCount.value = amount

    await spawnLoaderButterflies(amount, 'random')
  }

  function removeButterflyById(id: string) {
    const index = butterflies.value.findIndex(
      (butterfly) => butterfly.id === id,
    )
    if (index === -1) return

    butterflies.value.splice(index, 1)

    if (selectedButterflyId.value === id) {
      selectedButterflyId.value =
        butterflies.value.find((b) => !b.isExiting)?.id || ''
    }
  }

  function clearButterflyById(id: string) {
    removeButterflyById(id)
  }

  async function toggleSwarm(amount = 20) {
    try {
      const activeButterflies = butterflies.value.filter((b) => !b.isExiting)

      if (activeButterflies.length > 0) {
        clearButterflies()
        return
      }

      stopDrain()
      await addButterflies(amount)
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

  const usedNames = computed(() => butterflies.value.map((b) => b.id))
  const getAllButterflies = computed(() => butterflies.value)
  const getButterflyById = (id: string) =>
    butterflies.value.find((b) => b.id === id)

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
  } = effects

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

  const spawnableButterflies = computed<Butterfly[]>(() => {
    const safe = Array.isArray(dbButterflies.value) ? dbButterflies.value : []

    return safe
      .filter((db) => !userCaughtIds.value.has(db.id))
      .map(hydrateButterfly)
  })

  const gallerySlots = computed(() => {
    const safe = Array.isArray(dbButterflies.value) ? dbButterflies.value : []

    return [...safe]
      .sort((a, b) => a.rarityNumber - b.rarityNumber)
      .map((db) => ({
        rarityNumber: db.rarityNumber,
        butterfly: userCaughtIds.value.has(db.id) ? hydrateButterfly(db) : null,
      }))
  })

  async function initGame() {
    try {
      const userStore = useUserStore()
      const userId = userStore.userId

      if (!userId) {
        dbButterflies.value = []
        userCaughtIds.value = new Set()
        return
      }

      const [allRes, recordRes] = await Promise.all([
        $fetch<DbButterfly[]>('/api/butterflies'),
        $fetch<DbButterflyRecord[]>('/api/butterfly-records', {
          query: { userId },
        }),
      ])

      const safeButterflies = Array.isArray(allRes) ? allRes : []
      const safeRecords = Array.isArray(recordRes) ? recordRes : []

      dbButterflies.value = safeButterflies
      userCaughtIds.value = new Set(
        safeRecords
          .map((record) => record.butterflyId)
          .filter((id): id is number => typeof id === 'number'),
      )
    } catch (error) {
      dbButterflies.value = []
      userCaughtIds.value = new Set()
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  const discoveryButterfly = ref<Butterfly | null>(null)

  async function recordCapture(butterfly: Butterfly) {
    const existingDb = dbButterflies.value.find(
      (db) => db.name === butterfly.id,
    )

    if (existingDb) {
      const alreadyCaught = userCaughtIds.value.has(existingDb.id)
      if (alreadyCaught) return

      try {
        await $fetch('/api/butterfly-records', {
          method: 'POST',
          body: { butterflyId: existingDb.id },
        })
        userCaughtIds.value.add(existingDb.id)
      } catch (error) {
        addError(ErrorType.STORE_ERROR, error)
      }
      return
    }

    const nameCollides = dbButterflies.value.some(
      (db) => db.name === butterfly.id,
    )
    const messageCollides = dbButterflies.value.some(
      (db) => db.message === butterfly.message,
    )

    if (nameCollides || messageCollides) {
      return
    }

    try {
      const userStore = useUserStore()

      const created = await $fetch<DbButterfly>('/api/butterflies', {
        method: 'POST',
        body: {
          name: butterfly.id,
          message: butterfly.message,
          wingTopColor: butterfly.wingTopColor,
          wingBottomColor: butterfly.wingBottomColor,
          speed: butterfly.speed,
          wingSpeed: butterfly.wingSpeed,
          scale: butterfly.scale,
          rarityNumber: dbButterflies.value.length + 1,
          isPublic: true,
          userId: userStore.userId,
        },
      })

      dbButterflies.value.push(created)

      await $fetch('/api/butterfly-records', {
        method: 'POST',
        body: { butterflyId: created.id },
      })

      userCaughtIds.value.add(created.id)
      discoveryButterfly.value = butterfly
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function clearDiscovery() {
    discoveryButterfly.value = null
  }

  function setShowSwarm(value: boolean) {
    showSwarm.value = value
  }

  function setInspected(butterfly: Butterfly) {
    inspectedButterfly.value = butterfly
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
    gameOpen,
    dbButterflies,
    userCaughtIds,
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
    spawnableButterflies,
    gallerySlots,
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
    initializeLoaderButterflies,
    loaderEffectName,
    logLoaderEffect,
  }
})

export type { Butterfly }

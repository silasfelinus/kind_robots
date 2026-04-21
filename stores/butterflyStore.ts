// /stores/butterflyStore.ts

import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useErrorStore, ErrorType } from './errorStore'
import { useUserStore } from './userStore'
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

  const gameOpen = ref(false)
  const dbButterflies = ref<DbButterfly[]>([])
  const userCaughtIds = ref<Set<number>>(new Set())
  const inspectedButterfly = ref<Butterfly | null>(null)

  function hydrateButterfly(db: DbButterfly): Butterfly {
    return {
      id: db.name,
      name: db.name,
      message: db.message,
      wingTopColor: db.wingTopColor,
      wingBottomColor: db.wingBottomColor,
      speed: db.speed,
      wingSpeed: db.wingSpeed,
      scale: db.scale,
      rarity: db.rarityNumber,
      artImageId: db.artImageId,
      x: clampToTwoDecimals(Math.random() * 100),
      y: clampToTwoDecimals(Math.random() * 100),
      z: clampToTwoDecimals(Math.random() * 0.5 + 0.5),
      zIndex: Math.floor(Math.random() * 50),
      rotation: 110,
      status: 'random',
      isExiting: false,
      goal: {
        x: clampToTwoDecimals(Math.random() * 100),
        y: clampToTwoDecimals(Math.random() * 100),
      },
    }
  }

  function pickExitSide(): 'left' | 'right' | 'top' | 'bottom' {
    const sides: Array<'left' | 'right' | 'top' | 'bottom'> = [
      'left',
      'right',
      'top',
      'bottom',
    ]
    return sides[Math.floor(Math.random() * sides.length)] || 'right'
  }

  function markButterflyForExit(butterfly: Butterfly) {
    if (butterfly.isExiting) return

    butterfly.isExiting = true

    const overshoot = 18
    const side = pickExitSide()

    if (side === 'left') {
      butterfly.goal.x = -overshoot
      butterfly.goal.y = clampToTwoDecimals(Math.random() * 100)
      return
    }

    if (side === 'right') {
      butterfly.goal.x = 100 + overshoot
      butterfly.goal.y = clampToTwoDecimals(Math.random() * 100)
      return
    }

    if (side === 'top') {
      butterfly.goal.x = clampToTwoDecimals(Math.random() * 100)
      butterfly.goal.y = -overshoot
      return
    }

    butterfly.goal.x = clampToTwoDecimals(Math.random() * 100)
    butterfly.goal.y = 100 + overshoot
  }

  function markAllButterfliesForExit() {
    butterflies.value.forEach((butterfly, index) => {
      if (butterfly.isExiting) return

      markButterflyForExit(butterfly)

      const stagger = index * 0.7
      butterfly.goal.x = clampToTwoDecimals(
        butterfly.goal.x + (Math.random() - 0.5) * stagger,
      )
      butterfly.goal.y = clampToTwoDecimals(
        butterfly.goal.y + (Math.random() - 0.5) * stagger,
      )
    })

    selectedButterflyId.value = ''
  }

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

  function clearButterflies() {
    markAllButterfliesForExit()
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
      const newButterfly =
        butterfly ||
        (await createNewButterfly(newButterflySettings, usedNames.value))
      butterflies.value.push(newButterfly)
      selectedButterflyId.value = newButterfly.id
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function addButterflies(amount: number, incoming?: Butterfly[]) {
    try {
      const safeAmount = Math.max(0, Math.floor(amount))
      if (safeAmount === 0) return

      if (incoming?.length) {
        const nextButterflies = incoming.slice(0, safeAmount)
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

  function removeRandomButterfly() {
    const available = butterflies.value.filter((b) => !b.isExiting)
    if (!available.length) return

    const butterfly = available[Math.floor(Math.random() * available.length)]

    if (!butterfly) return

    markButterflyForExit(butterfly)

    if (butterfly.id === selectedButterflyId.value) {
      selectedButterflyId.value =
        butterflies.value.find((b) => !b.isExiting && b.id !== butterfly.id)
          ?.id || ''
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
      butterflies.value = []
      selectedButterflyId.value = ''
      targetCount.value = 20
      await generateInitialButterflies(targetCount.value)
      animateButterflies()
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

    if (butterfly.isExiting) {
      const targetX = butterfly.goal.x
      const targetY = butterfly.goal.y

      const dx = targetX - butterfly.x
      const dy = targetY - butterfly.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      const exitSpeed = Math.max(butterfly.speed * 1.4, 1.2)
      const wobble = 0.35

      const nx = noise2D(butterfly.x * 0.05, t.value)
      const ny = noise2D(butterfly.y * 0.05, t.value + 10)

      butterfly.x = clampToTwoDecimals(
        butterfly.x + (dx / distance) * exitSpeed + nx * wobble,
      )
      butterfly.y = clampToTwoDecimals(
        butterfly.y + (dy / distance) * exitSpeed + ny * wobble,
      )

      butterfly.rotation = dx >= 0 ? 120 : 30

      butterfly.scale =
        0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67

      const removeBuffer = 28
      const isOutOfBounds =
        butterfly.x < -removeBuffer ||
        butterfly.x > 100 + removeBuffer ||
        butterfly.y < -removeBuffer ||
        butterfly.y > 100 + removeBuffer

      if (isOutOfBounds) {
        const index = butterflies.value.findIndex((b) => b.id === butterfly.id)
        if (index !== -1) {
          butterflies.value.splice(index, 1)
        }
      }

      return
    }

    const angle =
      noise2D(butterfly.goal.x * 0.01, butterfly.goal.y * 0.01 + t.value) *
      Math.PI *
      2

    const dx = Math.cos(angle) * butterfly.speed
    const dy = Math.sin(angle) * butterfly.speed

    butterfly.goal.x = Math.max(Math.min(butterfly.goal.x + dx, 100), 0)
    butterfly.goal.y = Math.max(Math.min(butterfly.goal.y + dy, 100), 0)

    butterfly.x = clampToTwoDecimals(
      butterfly.x + (butterfly.goal.x - butterfly.x) * 0.02,
    )
    butterfly.y = clampToTwoDecimals(
      butterfly.y + (butterfly.goal.y - butterfly.y) * 0.02,
    )

    butterfly.scale =
      0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67

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

  // add to state refs
  const discoveryButterfly = ref<Butterfly | null>(null)

  // replace recordCapture with this
  async function recordCapture(butterfly: Butterfly) {
    const existingDb = dbButterflies.value.find(
      (db) => db.name === butterfly.id,
    )

    // ── known species: just record the catch ──────────────────────────────────
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

    // ── unknown species: name + message are both novel → discover it ──────────
    const nameCollides = dbButterflies.value.some(
      (db) => db.name === butterfly.id,
    )
    const messageCollides = dbButterflies.value.some(
      (db) => db.message === butterfly.message,
    )

    if (nameCollides || messageCollides) {
      // Partial collision — don't persist, treat as a known catch without a DB row
      return
    }

    try {
      const userStore = useUserStore()

      // Create the species in the DB — this user is its discoverer
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

      // Add it to the local roster immediately so the gallery slot appears
      dbButterflies.value.push(created)

      // Record the catch
      await $fetch('/api/butterfly-records', {
        method: 'POST',
        body: { butterflyId: created.id },
      })

      userCaughtIds.value.add(created.id)

      // Signal discovery to the UI
      discoveryButterfly.value = butterfly
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function clearDiscovery() {
    discoveryButterfly.value = null
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

    createNewButterfly,
    clampToTwoDecimals,
    randomColor,
    randomPrimaryColor,
    complementaryColor,
    analogousColor,
    applyColorScheme,
    setShowNames,
  }
})

export type { Butterfly }

// /stores/butterflyStore.ts

import { defineStore } from 'pinia'
import { ref, reactive, computed, type CSSProperties } from 'vue'
import { useErrorStore, ErrorType } from './errorStore'
import { useUserStore } from './userStore'
import { useDisplayStore } from './displayStore'
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

  type ToggleButterflyKey =
    | 'header'
    | 'footer'
    | 'left-sidebar'
    | 'right-sidebar'

  type ToggleButterflyMode = 'approaching' | 'hover' | 'fleeing' | 'returning'

  type ToggleAnchor = {
    x: number
    y: number
  }

  type ToggleButterflyState = {
    id: string
    key: ToggleButterflyKey
    mode: ToggleButterflyMode
    anchor: ToggleAnchor
    home: ToggleAnchor
    idleSeed: number
    returnTimeoutId: ReturnType<typeof setTimeout> | null
  }

  const toggleButterflyIds = ref<Record<ToggleButterflyKey, string | null>>({
    header: null,
    footer: null,
    'left-sidebar': null,
    'right-sidebar': null,
  })

  const toggleAnchors = ref<Record<ToggleButterflyKey, ToggleAnchor>>({
    header: { x: 50, y: 6 },
    footer: { x: 50, y: 94 },
    'left-sidebar': { x: 4, y: 50 },
    'right-sidebar': { x: 96, y: 50 },
  })

  const toggleStates = ref<Partial<Record<string, ToggleButterflyState>>>({})

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

  function clampPercent(value: number) {
    return clampToTwoDecimals(Math.max(-20, Math.min(120, value)))
  }

  function viewportPointToPercent(clientX: number, clientY: number) {
    if (typeof window === 'undefined') {
      return { x: 50, y: 50 }
    }

    const width = window.innerWidth || 1
    const height = window.innerHeight || 1

    return {
      x: clampPercent((clientX / width) * 100),
      y: clampPercent((clientY / height) * 100),
    }
  }

  function syncToggleAnchorFromDisplayStore(
    key: ToggleButterflyKey,
    style: CSSProperties,
  ) {
    if (typeof window === 'undefined') return

    const parsePercent = (value?: string | number) => {
      if (typeof value === 'number') return value
      if (typeof value !== 'string') return null

      const match = value.match(/-?\d+(\.\d+)?/)
      if (!match) return null

      const parsed = Number(match[0])
      return Number.isFinite(parsed) ? parsed : null
    }

    const top = parsePercent(style.top)
    const left = parsePercent(style.left)
    const right = parsePercent(style.right)

    let x = 50
    let y = 50

    if (top != null) y = top

    if (left != null) {
      x = left
    } else if (right != null) {
      x = 100 - right
    }

    toggleAnchors.value[key] = {
      x: clampPercent(x),
      y: clampPercent(y),
    }

    const butterflyId = toggleButterflyIds.value[key]
    if (!butterflyId) return

    const state = toggleStates.value[butterflyId]
    if (!state) return

    state.anchor = { ...toggleAnchors.value[key] }
    state.home = { ...toggleAnchors.value[key] }

    const butterfly = getButterflyById(butterflyId)
    if (!butterfly || butterfly.isExiting) return

    if (
      state.mode === 'hover' ||
      state.mode === 'approaching' ||
      state.mode === 'returning'
    ) {
      butterfly.goal.x = state.anchor.x
      butterfly.goal.y = state.anchor.y
    }
  }

  function syncToggleAnchors() {
    try {
      const displayStore = useDisplayStore()

      syncToggleAnchorFromDisplayStore('header', displayStore.headerToggleStyle)
      syncToggleAnchorFromDisplayStore('footer', displayStore.footerToggleStyle)
      syncToggleAnchorFromDisplayStore(
        'left-sidebar',
        displayStore.leftToggleStyle,
      )
      syncToggleAnchorFromDisplayStore(
        'right-sidebar',
        displayStore.rightToggleStyle,
      )
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function createToggleButterflyState(
    id: string,
    key: ToggleButterflyKey,
  ): ToggleButterflyState {
    const anchor = toggleAnchors.value[key]

    return {
      id,
      key,
      mode: 'approaching',
      anchor: { ...anchor },
      home: { ...anchor },
      idleSeed: Math.random() * Math.PI * 2,
      returnTimeoutId: null,
    }
  }

  function getToggleButterflyState(butterflyId: string) {
    return toggleStates.value[butterflyId] || null
  }

  function isToggleButterfly(butterfly: Butterfly) {
    return Boolean(toggleStates.value[butterfly.id])
  }

  function getToggleSpawnPoint(key: ToggleButterflyKey) {
    if (key === 'header') {
      return {
        x: clampToTwoDecimals(Math.random() * 80 + 10),
        y: -10,
      }
    }

    if (key === 'footer') {
      return {
        x: clampToTwoDecimals(Math.random() * 80 + 10),
        y: 110,
      }
    }

    if (key === 'left-sidebar') {
      return {
        x: -10,
        y: clampToTwoDecimals(Math.random() * 60 + 20),
      }
    }

    return {
      x: 110,
      y: clampToTwoDecimals(Math.random() * 60 + 20),
    }
  }

  function applyToggleButterflySetup(
    butterfly: Butterfly,
    key: ToggleButterflyKey,
  ) {
    const spawn = getToggleSpawnPoint(key)
    const anchor = toggleAnchors.value[key]

    butterfly.x = spawn.x
    butterfly.y = spawn.y
    butterfly.goal.x = anchor.x
    butterfly.goal.y = anchor.y
    butterfly.status = 'float'
    butterfly.isExiting = false
    butterfly.baseZIndex = 120
    butterfly.zIndex = 120
    butterfly.scaleMod = 1
    butterfly.rotation = butterfly.x < anchor.x ? 120 : 30

    toggleButterflyIds.value[key] = butterfly.id
    toggleStates.value[butterfly.id] = createToggleButterflyState(
      butterfly.id,
      key,
    )
  }

  async function spawnToggleButterflies() {
    const keys: ToggleButterflyKey[] = [
      'header',
      'footer',
      'left-sidebar',
      'right-sidebar',
    ]

    for (const key of keys) {
      const existingId = toggleButterflyIds.value[key]
      const existingButterfly = existingId ? getButterflyById(existingId) : null

      if (existingButterfly && !existingButterfly.isExiting) {
        continue
      }

      const butterfly = await createNewButterfly(
        newButterflySettings,
        usedNames.value,
      )
      applyToggleButterflySetup(butterfly, key)
      butterflies.value.push(butterfly)
    }
  }

  function idleToggleButterfly(
    butterfly: Butterfly,
    state: ToggleButterflyState,
  ) {
    const now = Date.now() * 0.0025
    const driftX = Math.cos(now + state.idleSeed) * 1.4
    const driftY = Math.sin(now * 1.3 + state.idleSeed) * 0.9

    butterfly.goal.x = clampPercent(state.anchor.x + driftX)
    butterfly.goal.y = clampPercent(state.anchor.y + driftY)

    const dx = butterfly.goal.x - butterfly.x
    const targetRotation = dx >= 0 ? 120 : 30
    butterfly.rotation = clampToTwoDecimals(
      butterfly.rotation + (targetRotation - butterfly.rotation) * 0.08,
    )
  }

  function sendToggleButterflyAway(key: ToggleButterflyKey) {
    const butterflyId = toggleButterflyIds.value[key]
    if (!butterflyId) return

    const butterfly = getButterflyById(butterflyId)
    const state = getToggleButterflyState(butterflyId)

    if (!butterfly || !state) return

    if (state.returnTimeoutId) {
      clearTimeout(state.returnTimeoutId)
      state.returnTimeoutId = null
    }

    state.mode = 'fleeing'

    const overshoot = 24

    if (key === 'header') {
      butterfly.goal.x = clampToTwoDecimals(Math.random() * 100)
      butterfly.goal.y = -overshoot
    } else if (key === 'footer') {
      butterfly.goal.x = clampToTwoDecimals(Math.random() * 100)
      butterfly.goal.y = 100 + overshoot
    } else if (key === 'left-sidebar') {
      butterfly.goal.x = -overshoot
      butterfly.goal.y = clampToTwoDecimals(Math.random() * 100)
    } else {
      butterfly.goal.x = 100 + overshoot
      butterfly.goal.y = clampToTwoDecimals(Math.random() * 100)
    }

    state.returnTimeoutId = setTimeout(
      () => {
        state.mode = 'returning'
        butterfly.isExiting = false
        butterfly.goal.x = state.home.x
        butterfly.goal.y = state.home.y
        state.returnTimeoutId = null
      },
      900 + Math.floor(Math.random() * 600),
    )
  }

  function handleToggleButterflyClick(key: ToggleButterflyKey) {
    const displayStore = useDisplayStore()

    if (key === 'header') displayStore.toggleHeader()
    if (key === 'footer') displayStore.toggleFooter()
    if (key === 'left-sidebar') displayStore.toggleLeftSidebar()
    if (key === 'right-sidebar') displayStore.toggleRightSidebar()

    syncToggleAnchors()
    sendToggleButterflyAway(key)
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
      animateButterflies()
      initialized.value = true

      await spawnStartupSwarm(20)
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function spawnStartupSwarm(amount = 20) {
    try {
      stopDrain()
      butterflies.value = []
      selectedButterflyId.value = ''
      targetCount.value = amount
      await addButterflies(amount)
      startDrain()
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  async function summonSwarm(amount = 20) {
    try {
      stopDrain()
      await addButterflies(amount)
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
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

  function updateButterflyPosition(butterfly: Butterfly) {
    const noise2D = getNoise()
    const now = Date.now() * 0.001

    const toggleState = getToggleButterflyState(butterfly.id)

    if (toggleState) {
      const dx = butterfly.goal.x - butterfly.x
      const dy = butterfly.goal.y - butterfly.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

      if (toggleState.mode === 'hover') {
        idleToggleButterfly(butterfly, toggleState)
      } else if (
        toggleState.mode === 'approaching' ||
        toggleState.mode === 'returning'
      ) {
        butterfly.goal.x = toggleState.anchor.x
        butterfly.goal.y = toggleState.anchor.y
      }

      const speedBoost =
        toggleState.mode === 'fleeing'
          ? 0.22
          : toggleState.mode === 'returning'
            ? 0.16
            : 0.12

      butterfly.x = clampToTwoDecimals(
        butterfly.x + (dx / distance) * butterfly.speed * (1 + speedBoost),
      )
      butterfly.y = clampToTwoDecimals(
        butterfly.y + (dy / distance) * butterfly.speed * (1 + speedBoost),
      )

      const targetRotation = dx >= 0 ? 120 : 30
      butterfly.rotation = clampToTwoDecimals(
        butterfly.rotation + (targetRotation - butterfly.rotation) * 0.08,
      )

      butterfly.scaleMod = clampToTwoDecimals(
        0.9 + Math.sin(Date.now() * 0.01 + toggleState.idleSeed) * 0.04,
      )
      butterfly.zIndex = 120

      const closeEnough =
        Math.abs(butterfly.x - toggleState.anchor.x) < 2.2 &&
        Math.abs(butterfly.y - toggleState.anchor.y) < 2.2

      if (
        (toggleState.mode === 'approaching' ||
          toggleState.mode === 'returning') &&
        closeEnough
      ) {
        toggleState.mode = 'hover'
      }

      const offscreenBuffer = 30

      if (
        toggleState.mode === 'fleeing' &&
        (butterfly.x < -offscreenBuffer ||
          butterfly.x > 100 + offscreenBuffer ||
          butterfly.y < -offscreenBuffer ||
          butterfly.y > 100 + offscreenBuffer)
      ) {
        butterfly.x = butterfly.goal.x
        butterfly.y = butterfly.goal.y
      }

      return
    }

    const angle =
      noise2D(
        butterfly.x * 0.15 + butterfly.noiseOffsetX,
        butterfly.y * 0.15 + butterfly.noiseOffsetY + now,
      ) *
      Math.PI *
      2

    const moveScale = 0.08
    const noiseDx = Math.cos(angle) * butterfly.speed * moveScale
    const noiseDy = Math.sin(angle) * butterfly.speed * moveScale

    const targetRotation = noiseDx >= 0 ? 120 : 30
    butterfly.rotation = clampToTwoDecimals(
      butterfly.rotation + (targetRotation - butterfly.rotation) * 0.05,
    )

    if (butterfly.isExiting) {
      butterfly.zIndex = Math.max(1, butterfly.zIndex - 0.75)

      const goalDx = butterfly.goal.x - butterfly.x
      const goalDy = butterfly.goal.y - butterfly.y
      const goalDist = Math.sqrt(goalDx * goalDx + goalDy * goalDy) || 1
      const pull = butterfly.speed * moveScale * 0.6

      butterfly.x = clampToTwoDecimals(
        butterfly.x + noiseDx + (goalDx / goalDist) * pull,
      )
      butterfly.y = clampToTwoDecimals(
        butterfly.y + noiseDy + (goalDy / goalDist) * pull,
      )
      butterfly.scaleMod = clampToTwoDecimals(
        0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67,
      )

      const removeBuffer = 28
      if (
        butterfly.x < -removeBuffer ||
        butterfly.x > 100 + removeBuffer ||
        butterfly.y < -removeBuffer ||
        butterfly.y > 100 + removeBuffer
      ) {
        const index = butterflies.value.findIndex((b) => b.id === butterfly.id)
        if (index !== -1) butterflies.value.splice(index, 1)
      }
      return
    }

    butterfly.x = clampToTwoDecimals(
      Math.max(0, Math.min(butterfly.x + noiseDx, 100)),
    )
    butterfly.y = clampToTwoDecimals(
      Math.max(0, Math.min(butterfly.y + noiseDy, 100)),
    )
    butterfly.scaleMod = clampToTwoDecimals(
      0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67,
    )
  }

  function animateButterflies() {
    const animate = () => {
      butterflies.value.forEach(updateButterflyPosition)
      animationFrameId.value = requestAnimationFrame(animate)
    }
    animate()
  }

  function destroyToggleButterflies() {
    Object.values(toggleStates.value).forEach((state) => {
      if (state?.returnTimeoutId) {
        clearTimeout(state.returnTimeoutId)
        state.returnTimeoutId = null
      }
    })

    toggleStates.value = {}
    toggleButterflyIds.value = {
      header: null,
      footer: null,
      'left-sidebar': null,
      'right-sidebar': null,
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', syncToggleAnchors)
    }
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
    summonSwarm,
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
    markButterflyForExit,

    handleToggleButterflyClick,
    destroyToggleButterflies,
    isToggleButterfly,
  }
})

export type { Butterfly }

// /stores/helpers/butterflyEffects.ts
import { ref, type ComputedRef, type Ref, type CSSProperties } from 'vue'
import { useDisplayStore } from '../displayStore'
import { ErrorType } from '../errorStore'
import {
  type Butterfly,
  type ButterflySettingsWithOptions,
  clampToTwoDecimals,
  createNewButterfly,
  getNoise,
} from './butterflyHelper'

export type ToggleButterflyKey =
  | 'header'
  | 'footer'
  | 'left-sidebar'
  | 'right-sidebar'

export type ToggleButterflyMode =
  | 'approaching'
  | 'hover'
  | 'fleeing'
  | 'returning'

export type ToggleAnchor = {
  x: number
  y: number
}

export type ToggleButterflyState = {
  id: string
  key: ToggleButterflyKey
  mode: ToggleButterflyMode
  anchor: ToggleAnchor
  home: ToggleAnchor
  idleSeed: number
  returnTimeoutId: ReturnType<typeof setTimeout> | null
}

type ButterflyEffectsInput = {
  butterflies: Ref<Butterfly[]>
  selectedButterflyId: Ref<string>
  drainIntervalId: Ref<ReturnType<typeof setInterval> | null>
  drainStartTimeoutId: Ref<ReturnType<typeof setTimeout> | null>
  newButterflySettings: ButterflySettingsWithOptions
  usedNames: ComputedRef<string[]>
  getButterflyById: (id: string) => Butterfly | undefined
  addError: (type: ErrorType, message: unknown) => void
}

export function createButterflyEffects(input: ButterflyEffectsInput) {
  const {
    butterflies,
    selectedButterflyId,
    drainIntervalId,
    drainStartTimeoutId,
    newButterflySettings,
    usedNames,
    getButterflyById,
    addError,
  } = input

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

  function clampPercent(value: number) {
    return clampToTwoDecimals(Math.max(-20, Math.min(120, value)))
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
    butterfly.baseZIndex = 50
    butterfly.zIndex = 50
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

      if (existingButterfly && !existingButterfly.isExiting) continue

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

  function relocateToggleButterfly(key: ToggleButterflyKey, el: HTMLElement) {
    if (typeof window === 'undefined') return

    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const x = clampPercent((cx / window.innerWidth) * 100)
    const y = clampPercent((cy / window.innerHeight) * 100)

    toggleAnchors.value[key] = { x, y }

    const butterflyId = toggleButterflyIds.value[key]
    if (!butterflyId) return

    const state = toggleStates.value[butterflyId]
    const butterfly = getButterflyById(butterflyId)
    if (!state || !butterfly || butterfly.isExiting) return

    state.anchor = { x, y }
    state.home = { x, y }
    state.mode = 'returning'
    butterfly.goal.x = x
    butterfly.goal.y = y
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

  function getNearestExitGoal(butterfly: Butterfly) {
    const overshoot = 18

    const distanceToLeft = butterfly.x
    const distanceToRight = 100 - butterfly.x
    const distanceToTop = butterfly.y
    const distanceToBottom = 100 - butterfly.y

    const nearestDistance = Math.min(
      distanceToLeft,
      distanceToRight,
      distanceToTop,
      distanceToBottom,
    )

    if (nearestDistance === distanceToLeft) {
      return { x: -overshoot, y: butterfly.y }
    }

    if (nearestDistance === distanceToRight) {
      return { x: 100 + overshoot, y: butterfly.y }
    }

    if (nearestDistance === distanceToTop) {
      return { x: butterfly.x, y: -overshoot }
    }

    return { x: butterfly.x, y: 100 + overshoot }
  }

  function markButterflyForExit(butterfly: Butterfly) {
    if (butterfly.isExiting) return

    const goal = getNearestExitGoal(butterfly)

    butterfly.isExiting = true
    butterfly.goal.x = clampToTwoDecimals(goal.x)
    butterfly.goal.y = clampToTwoDecimals(goal.y)
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

  function sendButterflyAway(butterfly: Butterfly) {
    markButterflyForExit(butterfly)

    if (butterfly.id === selectedButterflyId.value) {
      selectedButterflyId.value =
        butterflies.value.find((b) => !b.isExiting && b.id !== butterfly.id)
          ?.id || ''
    }
  }

  function sendRandomButterflyAway() {
    const available = butterflies.value.filter((b) => !b.isExiting)
    if (!available.length) return

    const butterfly = available[Math.floor(Math.random() * available.length)]
    if (!butterfly) return

    sendButterflyAway(butterfly)
  }

  function sendAllButterfliesAway() {
    butterflies.value.forEach((butterfly) => {
      if (!butterfly.isExiting) markButterflyForExit(butterfly)
    })

    selectedButterflyId.value =
      butterflies.value.find((b) => !b.isExiting)?.id || ''
  }

  function isOutsideRemovalBounds(butterfly: Butterfly) {
    const buffer = 12
    return (
      butterfly.x < -buffer ||
      butterfly.x > 112 ||
      butterfly.y < -buffer ||
      butterfly.y > 112
    )
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
      butterfly.zIndex = 50

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
      const goalDx = butterfly.goal.x - butterfly.x
      const goalDy = butterfly.goal.y - butterfly.y
      const goalDist = Math.sqrt(goalDx * goalDx + goalDy * goalDy) || 1
      const exitSpeed = Math.max(1.8, butterfly.speed * 1.35)

      butterfly.x = clampToTwoDecimals(
        butterfly.x + (goalDx / goalDist) * exitSpeed,
      )
      butterfly.y = clampToTwoDecimals(
        butterfly.y + (goalDy / goalDist) * exitSpeed,
      )

      const targetRotation = goalDx >= 0 ? 120 : 30
      butterfly.rotation = clampToTwoDecimals(
        butterfly.rotation + (targetRotation - butterfly.rotation) * 0.12,
      )

      butterfly.scaleMod = clampToTwoDecimals(
        Math.max(0.25, butterfly.scaleMod * 0.985),
      )

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
        const available = butterflies.value.filter(
          (butterfly) => !butterfly.isExiting && !isToggleButterfly(butterfly),
        )

        if (!available.length) {
          stopDrain()
          return
        }

        const butterfly =
          available[Math.floor(Math.random() * available.length)]
        if (butterfly) sendButterflyAway(butterfly)
      }, interval)
    }, delay)
  }

  return {
    toggleButterflyIds,
    toggleAnchors,
    toggleStates,
    clampPercent,
    syncToggleAnchorFromDisplayStore,
    syncToggleAnchors,
    createToggleButterflyState,
    getToggleButterflyState,
    isToggleButterfly,
    getToggleSpawnPoint,
    spawnToggleButterflies,
    idleToggleButterfly,
    handleToggleButterflyClick,
    relocateToggleButterfly,
    destroyToggleButterflies,
    getNearestExitGoal,
    markButterflyForExit,
    markAllButterfliesForExit,
    sendButterflyAway,
    sendRandomButterflyAway,
    sendAllButterfliesAway,
    isOutsideRemovalBounds,
    updateButterflyPosition,
    stopDrain,
    startDrain,
  }
}

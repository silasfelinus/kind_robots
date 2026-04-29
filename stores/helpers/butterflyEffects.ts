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

export type LoaderSpawnSide =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type LoaderRouteMode = 'drift' | 'orbit'
export type LoaderGoalSpread = 'tight' | 'wide'
export type LoaderSwarmPreset =
  | 'random'
  | 'inside-drift'
  | 'edge-cross'
  | 'corner-sweep'
  | 'orbit-release'

type LoaderPhase = 'entering' | 'orbiting' | 'holding' | 'released'

type LoaderButterflyState = {
  id: string
  phase: LoaderPhase
  routeMode: LoaderRouteMode
  entryGoal: ToggleAnchor | null
  holdAnchor: ToggleAnchor | null
  exitGoal: ToggleAnchor | null
  releaseRequested: boolean
  releaseOnGoal: boolean
  holdUntil: number
  idleSeed: number
  orbitCenter: ToggleAnchor | null
  orbitRadius: number
  orbitAngle: number
  orbitStep: number
  orbitDirection: 1 | -1
  orbitExitAngle: number
}

type LoaderScene = {
  preset: Exclude<LoaderSwarmPreset, 'random'>
  routeMode: LoaderRouteMode
  spawnMode: 'inside' | 'shared-side' | 'shared-corner'
  spawnSide?: LoaderSpawnSide
  goalMode: 'none' | 'shared' | 'individual'
  goalSpread: LoaderGoalSpread
  releaseOnGoal: boolean
  holdRange: { min: number; max: number }
  orbitSharedDirection: boolean
  orbitSharedRotation: boolean
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
  const loaderStates = ref<Partial<Record<string, LoaderButterflyState>>>({})
  const activeLoaderPreset = ref<LoaderSwarmPreset>('random')

  function clampPercent(value: number) {
    return clampToTwoDecimals(Math.max(-20, Math.min(120, value)))
  }

  function randomBetween(min: number, max: number) {
    return clampToTwoDecimals(min + Math.random() * (max - min))
  }

  function randomInt(min: number, max: number) {
    return Math.floor(min + Math.random() * (max - min + 1))
  }

  function pickOne<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)] as T
  }

  function pointWithin(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
  ): ToggleAnchor {
    return {
      x: clampPercent(randomBetween(minX, maxX)),
      y: clampPercent(randomBetween(minY, maxY)),
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

  function getLoaderButterflyState(butterflyId: string) {
    return loaderStates.value[butterflyId] || null
  }

  function isToggleButterfly(butterfly: Butterfly) {
    return Boolean(toggleStates.value[butterfly.id])
  }

  function isLoaderButterfly(butterfly: Butterfly) {
    return Boolean(loaderStates.value[butterfly.id])
  }

  function clearButterflyMotionState(id: string) {
    const toggleState = toggleStates.value[id]
    if (toggleState?.returnTimeoutId) {
      clearTimeout(toggleState.returnTimeoutId)
    }

    delete toggleStates.value[id]
    delete loaderStates.value[id]

    const keys = Object.keys(toggleButterflyIds.value) as ToggleButterflyKey[]
    for (const key of keys) {
      if (toggleButterflyIds.value[key] === id) {
        toggleButterflyIds.value[key] = null
      }
    }
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

  function clearLoaderStates() {
    loaderStates.value = {}
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

  function getSpawnPointFromSide(side: LoaderSpawnSide) {
    if (side === 'top') return pointWithin(10, 90, -12, -4)
    if (side === 'bottom') return pointWithin(10, 90, 104, 112)
    if (side === 'left') return pointWithin(-12, -4, 18, 82)
    if (side === 'right') return pointWithin(104, 112, 18, 82)
    if (side === 'top-left') return pointWithin(-12, -4, -12, -4)
    if (side === 'top-right') return pointWithin(104, 112, -12, -4)
    if (side === 'bottom-left') return pointWithin(-12, -4, 104, 112)
    return pointWithin(104, 112, 104, 112)
  }

  function getOppositeSide(side: LoaderSpawnSide): LoaderSpawnSide {
    if (side === 'top') return 'bottom'
    if (side === 'bottom') return 'top'
    if (side === 'left') return 'right'
    if (side === 'right') return 'left'
    if (side === 'top-left') return 'bottom-right'
    if (side === 'top-right') return 'bottom-left'
    if (side === 'bottom-left') return 'top-right'
    return 'top-left'
  }

  function getCornerGoalRect(
    corner: LoaderSpawnSide,
    spread: LoaderGoalSpread,
  ): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    const margin = spread === 'tight' ? 14 : 28

    if (corner === 'top-left') {
      return {
        minX: 4,
        maxX: margin,
        minY: 4,
        maxY: margin,
      }
    }

    if (corner === 'top-right') {
      return {
        minX: 100 - margin,
        maxX: 96,
        minY: 4,
        maxY: margin,
      }
    }

    if (corner === 'bottom-left') {
      return {
        minX: 4,
        maxX: margin,
        minY: 100 - margin,
        maxY: 96,
      }
    }

    return {
      minX: 100 - margin,
      maxX: 96,
      minY: 100 - margin,
      maxY: 96,
    }
  }

  function getSideBandGoalRect(
    side: LoaderSpawnSide,
    spread: LoaderGoalSpread,
  ): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    const margin = spread === 'tight' ? 16 : 32

    if (side === 'top') {
      return {
        minX: 14,
        maxX: 86,
        minY: 4,
        maxY: margin,
      }
    }

    if (side === 'bottom') {
      return {
        minX: 14,
        maxX: 86,
        minY: 100 - margin,
        maxY: 96,
      }
    }

    if (side === 'left') {
      return {
        minX: 4,
        maxX: margin,
        minY: 16,
        maxY: 84,
      }
    }

    return {
      minX: 100 - margin,
      maxX: 96,
      minY: 16,
      maxY: 84,
    }
  }

  function chooseLoaderScene(
    preset: LoaderSwarmPreset = 'random',
  ): LoaderScene {
    if (preset === 'inside-drift') {
      return {
        preset: 'inside-drift',
        routeMode: 'drift',
        spawnMode: 'inside',
        goalMode: 'individual',
        goalSpread: pickOne(['tight', 'wide']),
        releaseOnGoal: false,
        holdRange: { min: 900, max: 1800 },
        orbitSharedDirection: false,
        orbitSharedRotation: false,
      }
    }

    if (preset === 'edge-cross') {
      return {
        preset: 'edge-cross',
        routeMode: 'drift',
        spawnMode: 'shared-side',
        spawnSide: pickOne(['top', 'bottom', 'left', 'right']),
        goalMode: 'individual',
        goalSpread: pickOne(['tight', 'wide']),
        releaseOnGoal: true,
        holdRange: { min: 100, max: 350 },
        orbitSharedDirection: false,
        orbitSharedRotation: false,
      }
    }

    if (preset === 'corner-sweep') {
      return {
        preset: 'corner-sweep',
        routeMode: 'drift',
        spawnMode: 'shared-corner',
        spawnSide: pickOne([
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
        ]),
        goalMode: 'shared',
        goalSpread: pickOne(['tight', 'wide']),
        releaseOnGoal: true,
        holdRange: { min: 120, max: 320 },
        orbitSharedDirection: false,
        orbitSharedRotation: false,
      }
    }

    if (preset === 'orbit-release') {
      return {
        preset: 'orbit-release',
        routeMode: 'orbit',
        spawnMode: 'inside',
        goalMode: 'shared',
        goalSpread: 'tight',
        releaseOnGoal: true,
        holdRange: { min: 900, max: 1800 },
        orbitSharedDirection: true,
        orbitSharedRotation: true,
      }
    }

    return chooseLoaderScene(
      pickOne(['inside-drift', 'edge-cross', 'corner-sweep', 'orbit-release']),
    )
  }

  function getLoaderEntryGoal(
    scene: LoaderScene,
    sharedGoal: ToggleAnchor | null,
  ) {
    if (scene.goalMode === 'none') return null
    if (sharedGoal) return { ...sharedGoal }

    if (scene.spawnMode === 'shared-corner' && scene.spawnSide) {
      const opposite = getOppositeSide(scene.spawnSide)
      const rect = getCornerGoalRect(opposite, scene.goalSpread)
      return pointWithin(rect.minX, rect.maxX, rect.minY, rect.maxY)
    }

    if (scene.spawnMode === 'shared-side' && scene.spawnSide) {
      const opposite = getOppositeSide(scene.spawnSide)
      const rect = getSideBandGoalRect(opposite, scene.goalSpread)
      return pointWithin(rect.minX, rect.maxX, rect.minY, rect.maxY)
    }

    return pointWithin(20, 80, 20, 80)
  }

  function getLoaderSpawnPoint(
    scene: LoaderScene,
    sharedSide: LoaderSpawnSide | null,
  ) {
    if (scene.spawnMode === 'inside') {
      return pointWithin(12, 88, 12, 88)
    }

    const side = sharedSide || scene.spawnSide || 'top'
    return getSpawnPointFromSide(side)
  }

  function getLoaderHoldAnchor(
    scene: LoaderScene,
    entryGoal: ToggleAnchor | null,
  ) {
    if (scene.routeMode === 'orbit') {
      return pointWithin(36, 64, 34, 66)
    }

    if (entryGoal) {
      return {
        x: clampPercent(entryGoal.x + randomBetween(-3, 3)),
        y: clampPercent(entryGoal.y + randomBetween(-3, 3)),
      }
    }

    return pointWithin(18, 82, 18, 82)
  }

  function beginLoaderButterflyExit(
    butterfly: Butterfly,
    state: LoaderButterflyState,
  ) {
    if (butterfly.isExiting) return

    const goal = getNearestExitGoal(butterfly)

    butterfly.isExiting = true
    butterfly.goal.x = clampPercent(goal.x + randomBetween(-4, 4))
    butterfly.goal.y = clampPercent(goal.y + randomBetween(-4, 4))
    state.phase = 'released'
  }

  function createLoaderButterflyState(
    butterfly: Butterfly,
    scene: LoaderScene,
    sharedSpawnSide: LoaderSpawnSide | null,
    sharedGoal: ToggleAnchor | null,
    sharedOrbitDirection: 1 | -1,
  ) {
    const entryGoal = getLoaderEntryGoal(scene, sharedGoal)
    const holdAnchor = getLoaderHoldAnchor(scene, entryGoal)

    const orbitCenter =
      scene.routeMode === 'orbit' ? pointWithin(38, 62, 38, 62) : null

    const holdUntil =
      Date.now() + randomInt(scene.holdRange.min, scene.holdRange.max)

    const exitGoal = null

    loaderStates.value[butterfly.id] = {
      id: butterfly.id,
      phase: 'entering',
      routeMode: scene.routeMode,
      entryGoal,
      holdAnchor,
      exitGoal,
      releaseRequested: false,
      releaseOnGoal: scene.releaseOnGoal,
      holdUntil,
      idleSeed: Math.random() * Math.PI * 2,
      orbitCenter,
      orbitRadius: randomBetween(8, 22),
      orbitAngle: Math.random() * Math.PI * 2,
      orbitStep: randomBetween(0.02, 0.05),
      orbitDirection: scene.orbitSharedDirection
        ? sharedOrbitDirection
        : pickOne([1, -1]),
      orbitExitAngle: Math.random() * Math.PI * 2,
    }

    const spawn = getLoaderSpawnPoint(scene, sharedSpawnSide)
    butterfly.x = spawn.x
    butterfly.y = spawn.y
    butterfly.goal.x = entryGoal?.x ?? holdAnchor?.x ?? spawn.x
    butterfly.goal.y = entryGoal?.y ?? holdAnchor?.y ?? spawn.y
    butterfly.isExiting = false
    butterfly.status = 'float'
    butterfly.baseZIndex = 50
    butterfly.zIndex = 50
    butterfly.scaleMod = 1
    butterfly.rotation =
      butterfly.goal.x >= butterfly.x
        ? 120
        : scene.routeMode === 'orbit'
          ? 110
          : 30
  }

  async function spawnLoaderButterflies(
    amount = 20,
    preset: LoaderSwarmPreset = 'random',
  ) {
    const safeAmount = Math.max(0, Math.floor(amount))
    if (safeAmount === 0) return

    clearLoaderStates()

    const scene = chooseLoaderScene(preset)
    activeLoaderPreset.value = preset

    const sharedSpawnSide =
      scene.spawnMode === 'shared-side' || scene.spawnMode === 'shared-corner'
        ? scene.spawnSide || null
        : null

    const sharedGoal =
      scene.goalMode === 'shared' ? getLoaderEntryGoal(scene, null) : null

    const sharedOrbitDirection = pickOne([1, -1]) as 1 | -1

    const incoming: Butterfly[] = []
    const localUsedNames = [...usedNames.value]

    for (let i = 0; i < safeAmount; i++) {
      const butterfly = await createNewButterfly(
        newButterflySettings,
        localUsedNames,
      )

      createLoaderButterflyState(
        butterfly,
        scene,
        sharedSpawnSide,
        sharedGoal,
        sharedOrbitDirection,
      )

      incoming.push(butterfly)
      localUsedNames.push(butterfly.id)
    }

    butterflies.value.push(...incoming)
  }

  function requestLoaderRelease() {
    Object.values(loaderStates.value).forEach((state) => {
      if (!state) return
      state.releaseRequested = true

      const butterfly = getButterflyById(state.id)
      if (!butterfly || butterfly.isExiting) return

      if (state.phase === 'holding' && !state.releaseOnGoal) {
        beginLoaderButterflyExit(butterfly, state)
      }
    })
  }

  function markButterflyForExit(butterfly: Butterfly) {
    if (butterfly.isExiting) return

    const loaderState = getLoaderButterflyState(butterfly.id)
    if (loaderState) {
      beginLoaderButterflyExit(butterfly, loaderState)
      return
    }

    const goal = getNearestExitGoal(butterfly)
    const stagger = randomBetween(-4, 4)

    butterfly.isExiting = true
    butterfly.goal.x = clampPercent(goal.x + stagger)
    butterfly.goal.y = clampPercent(goal.y + randomBetween(-4, 4))
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

  function moveTowardGoalWithNoise(butterfly: Butterfly, intensity = 1) {
    const noise2D = getNoise()
    const now = Date.now() * 0.001
    const angle =
      noise2D(
        butterfly.x * 0.15 + butterfly.noiseOffsetX,
        butterfly.y * 0.15 + butterfly.noiseOffsetY + now,
      ) *
      Math.PI *
      2

    const moveScale = 0.08
    const noiseDx = Math.cos(angle) * butterfly.speed * moveScale * intensity
    const noiseDy = Math.sin(angle) * butterfly.speed * moveScale * intensity

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

    const targetRotation =
      Math.abs(goalDx) > 0.5
        ? goalDx >= 0
          ? 120
          : 30
        : noiseDx >= 0
          ? 120
          : 30

    butterfly.rotation = clampToTwoDecimals(
      butterfly.rotation + (targetRotation - butterfly.rotation) * 0.05,
    )

    butterfly.scaleMod = clampToTwoDecimals(
      0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67,
    )
  }

  function updateLoaderButterflyPosition(
    butterfly: Butterfly,
    state: LoaderButterflyState,
  ) {
    const reachedGoal = (goal: ToggleAnchor | null, threshold = 3.5) => {
      if (!goal) return true
      return (
        Math.abs(butterfly.x - goal.x) <= threshold &&
        Math.abs(butterfly.y - goal.y) <= threshold
      )
    }

    if (state.phase === 'entering') {
      butterfly.goal.x =
        state.entryGoal?.x ?? state.holdAnchor?.x ?? butterfly.x
      butterfly.goal.y =
        state.entryGoal?.y ?? state.holdAnchor?.y ?? butterfly.y

      moveTowardGoalWithNoise(butterfly)

      if (reachedGoal(state.entryGoal, 4)) {
        if (state.routeMode === 'orbit' && state.orbitCenter) {
          state.phase = 'orbiting'
          return
        }

        if (state.releaseOnGoal || state.releaseRequested) {
          beginLoaderButterflyExit(butterfly, state)
          return
        }

        state.phase = 'holding'
      }

      return
    }

    if (state.phase === 'orbiting' && state.orbitCenter) {
      state.orbitAngle += state.orbitStep * state.orbitDirection

      const orbitX =
        state.orbitCenter.x + Math.cos(state.orbitAngle) * state.orbitRadius
      const orbitY =
        state.orbitCenter.y +
        Math.sin(state.orbitAngle) * state.orbitRadius * 0.72

      butterfly.goal.x = clampPercent(orbitX)
      butterfly.goal.y = clampPercent(orbitY)

      moveTowardGoalWithNoise(butterfly, 0.75)

      const tangentDx =
        -Math.sin(state.orbitAngle) * state.orbitDirection * state.orbitRadius
      butterfly.rotation = clampToTwoDecimals(
        butterfly.rotation +
          ((tangentDx >= 0 ? 120 : 30) - butterfly.rotation) * 0.06,
      )

      const angleDiff = Math.abs(
        Math.atan2(
          Math.sin(state.orbitAngle - state.orbitExitAngle),
          Math.cos(state.orbitAngle - state.orbitExitAngle),
        ),
      )

      const orbitReady = Date.now() >= state.holdUntil && angleDiff < 0.24

      if (orbitReady && (state.releaseOnGoal || state.releaseRequested)) {
        beginLoaderButterflyExit(butterfly, state)
        return
      }

      return
    }

    if (state.phase === 'holding') {
      const anchor = state.holdAnchor ||
        state.entryGoal || {
          x: butterfly.x,
          y: butterfly.y,
        }

      const wobble = Date.now() * 0.0018
      butterfly.goal.x = clampPercent(
        anchor.x + Math.cos(wobble + state.idleSeed) * 1.8,
      )
      butterfly.goal.y = clampPercent(
        anchor.y + Math.sin(wobble * 1.2 + state.idleSeed) * 1.4,
      )

      moveTowardGoalWithNoise(butterfly, 0.55)

      if (
        Date.now() >= state.holdUntil &&
        (state.releaseRequested || state.releaseOnGoal)
      ) {
        beginLoaderButterflyExit(butterfly, state)
        return
      }
    }
  }

  function updateButterflyPosition(butterfly: Butterfly) {
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

    const loaderState = getLoaderButterflyState(butterfly.id)
    if (loaderState && !butterfly.isExiting) {
      updateLoaderButterflyPosition(butterfly, loaderState)
      return
    }

    const noise2D = getNoise()
    const now = Date.now() * 0.001

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
          (butterfly) =>
            !butterfly.isExiting &&
            !isToggleButterfly(butterfly) &&
            !isLoaderButterfly(butterfly),
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

  function logButterflyEffect(
    event: string,
    details: Record<string, unknown> = {},
  ) {
    if (import.meta.server) return

    console.info('[butterfly-effects]', event, {
      active: butterflies.value.length,
      exiting: butterflies.value.filter((butterfly) => butterfly.isExiting)
        .length,
      ...details,
    })
  }

  function startStartupExit() {
    requestLoaderRelease()
  }

  return {
    toggleButterflyIds,
    toggleAnchors,
    toggleStates,
    loaderStates,
    activeLoaderPreset,
    clampPercent,
    syncToggleAnchorFromDisplayStore,
    syncToggleAnchors,
    createToggleButterflyState,
    getToggleButterflyState,
    getLoaderButterflyState,
    isToggleButterfly,
    isLoaderButterfly,
    clearButterflyMotionState,
    getToggleSpawnPoint,
    spawnToggleButterflies,
    spawnLoaderButterflies,
    requestLoaderRelease,
    idleToggleButterfly,
    handleToggleButterflyClick,
    relocateToggleButterfly,
    destroyToggleButterflies,
    clearLoaderStates,
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
    startStartupExit,
  }
}

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
  createLoaderButterfly,
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

type ExitWanderState = {
  id: string
  seed: number
  nextDecisionAt: number
  headingAngle: number
  wanderStrength: number
  directness: number
  wobbleSpeed: number
  wobbleWidth: number
  hesitationUntil: number
  burstUntil: number
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

export type LoaderRouteMode = 'drift' | 'orbit'
export type LoaderGoalSpread = 'tight' | 'wide'
export type LoaderSwarmPreset =
  | 'random'
  | 'inside-drift'
  | 'edge-cross'
  | 'corner-sweep'
  | 'orbit-release'

type LoaderPhase = 'entering' | 'orbiting' | 'holding' | 'released'

export type LoaderExitMode =
  | 'random-exit'
  | 'nearest-exit'
  | 'shared-exit'
  | 'mixed-exit'

type LoaderButterflyState = {
  id: string
  phase: LoaderPhase
  routeMode: LoaderRouteMode
  entryGoal: ToggleAnchor | null
  holdAnchor: ToggleAnchor | null
  exitGoal: ToggleAnchor | null
  exitMode: LoaderExitMode
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
  goalMode: 'none' | 'shared' | 'individual'
  goalSpread: LoaderGoalSpread
  exitMode: LoaderExitMode
  releaseOnGoal: boolean
  holdRange: { min: number; max: number }
  orbitSharedDirection: boolean
  orbitSharedRotation: boolean
}

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function shortestAngleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180
}

function lerpDegrees(from: number, to: number, amount: number) {
  return normalizeDegrees(from + shortestAngleDelta(from, to) * amount)
}

function getHeadingFromMotion(dx: number, dy: number, fallback = 0) {
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance < 0.01) return fallback

  return normalizeDegrees(Math.atan2(dy, dx) * (180 / Math.PI) + 90)
}

function applyButterflyOrientation(
  butterfly: Butterfly,
  previousX: number,
  previousY: number,
  options: {
    headingEase?: number
    bankEase?: number
    bankStrength?: number
  } = {},
) {
  const headingEase = options.headingEase ?? 0.12
  const bankEase = options.bankEase ?? 0.08
  const bankStrength = options.bankStrength ?? 1

  const motionDx = butterfly.x - previousX
  const motionDy = butterfly.y - previousY
  const targetHeading = getHeadingFromMotion(
    motionDx,
    motionDy,
    butterfly.heading,
  )

  butterfly.heading = clampToTwoDecimals(
    lerpDegrees(butterfly.heading, targetHeading, headingEase),
  )

  const targetBank = motionDx >= 0 ? 120 : 30

  butterfly.rotation = clampToTwoDecimals(
    butterfly.rotation +
      (targetBank - butterfly.rotation) * bankEase * bankStrength,
  )
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

// Helper to clear a plain object in-place (avoids reassigning const)
function clearPlainObject(obj: Record<string, unknown>) {
  for (const key of Object.keys(obj)) {
    delete obj[key]
  }
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

  // Reactive: these are read by templates / external callers
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

  const activeLoaderPreset = ref<LoaderSwarmPreset>('random')

  // Plain objects — not reactive, only touched in the rAF hot path
  const toggleStates: Partial<Record<string, ToggleButterflyState>> = {}
  const loaderStates: Partial<Record<string, LoaderButterflyState>> = {}
  const exitWanderStates: Partial<Record<string, ExitWanderState>> = {}

  // ─── Utilities ────────────────────────────────────────────────────────────

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

  // ─── Toggle anchor sync ───────────────────────────────────────────────────

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

    toggleAnchors.value[key] = { x: clampPercent(x), y: clampPercent(y) }

    const butterflyId = toggleButterflyIds.value[key]
    if (!butterflyId) return

    const state = toggleStates[butterflyId]
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

  // ─── Toggle butterfly state ───────────────────────────────────────────────

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
    return toggleStates[butterflyId] || null
  }

  function getLoaderButterflyState(butterflyId: string) {
    return loaderStates[butterflyId] || null
  }

  function getExitWanderState(butterfly: Butterfly): ExitWanderState {
    if (!exitWanderStates[butterfly.id]) {
      exitWanderStates[butterfly.id] = createExitWanderState(butterfly)
    }
    return exitWanderStates[butterfly.id] as ExitWanderState
  }

  function isToggleButterfly(butterfly: Butterfly) {
    return Boolean(toggleStates[butterfly.id])
  }

  function isLoaderButterfly(butterfly: Butterfly) {
    return Boolean(loaderStates[butterfly.id])
  }

  function clearButterflyMotionState(id: string) {
    const toggleState = toggleStates[id]
    if (toggleState?.returnTimeoutId) {
      clearTimeout(toggleState.returnTimeoutId)
    }

    delete toggleStates[id]
    delete loaderStates[id]
    delete exitWanderStates[id]

    const keys = Object.keys(toggleButterflyIds.value) as ToggleButterflyKey[]
    for (const key of keys) {
      if (toggleButterflyIds.value[key] === id) {
        toggleButterflyIds.value[key] = null
      }
    }
  }

  function getToggleSpawnPoint(key: ToggleButterflyKey) {
    if (key === 'header') {
      return { x: clampToTwoDecimals(Math.random() * 80 + 10), y: -10 }
    }
    if (key === 'footer') {
      return { x: clampToTwoDecimals(Math.random() * 80 + 10), y: 110 }
    }
    if (key === 'left-sidebar') {
      return { x: -10, y: clampToTwoDecimals(Math.random() * 60 + 20) }
    }
    return { x: 110, y: clampToTwoDecimals(Math.random() * 60 + 20) }
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
    butterfly.heading = getHeadingFromMotion(
      anchor.x - spawn.x,
      anchor.y - spawn.y,
      butterfly.heading,
    )
    butterfly.rotation = butterfly.x < anchor.x ? 120 : 30

    toggleButterflyIds.value[key] = butterfly.id
    toggleStates[butterfly.id] = createToggleButterflyState(butterfly.id, key)
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

  // ─── Per-frame movement — all accept now (ms) from the rAF loop ──────────

  function idleToggleButterfly(
    butterfly: Butterfly,
    state: ToggleButterflyState,
    now: number,
  ) {
    const t = now * 0.0025
    const driftX = Math.cos(t + state.idleSeed) * 1.4
    const driftY = Math.sin(t * 1.3 + state.idleSeed) * 0.9

    butterfly.goal.x = clampPercent(state.anchor.x + driftX)
    butterfly.goal.y = clampPercent(state.anchor.y + driftY)
  }

  function moveTowardGoalWithNoise(
    butterfly: Butterfly,
    intensity: number,
    pullMultiplier: number,
    now: number,
  ) {
    const noise2D = getNoise()
    const t = now * 0.001
    const previousX = butterfly.x
    const previousY = butterfly.y

    const angle =
      noise2D(
        butterfly.x * 0.15 + butterfly.noiseOffsetX,
        butterfly.y * 0.15 + butterfly.noiseOffsetY + t,
      ) *
      Math.PI *
      2

    const moveScale = 0.08
    const goalDx = butterfly.goal.x - butterfly.x
    const goalDy = butterfly.goal.y - butterfly.y
    const goalDist = Math.sqrt(goalDx * goalDx + goalDy * goalDy) || 1

    const goalUnitX = goalDx / goalDist
    const goalUnitY = goalDy / goalDist

    const tangentX = -goalUnitY
    const tangentY = goalUnitX

    const rawNoiseDx = Math.cos(angle) * butterfly.speed * moveScale * intensity
    const rawNoiseDy = Math.sin(angle) * butterfly.speed * moveScale * intensity

    const tangentNoise = rawNoiseDx * tangentX + rawNoiseDy * tangentY
    const maxSway = butterfly.speed * moveScale * intensity
    const sway = Math.max(-maxSway, Math.min(tangentNoise, maxSway))

    const pull = butterfly.speed * moveScale * pullMultiplier

    butterfly.x = clampToTwoDecimals(
      butterfly.x + goalUnitX * pull + tangentX * sway,
    )
    butterfly.y = clampToTwoDecimals(
      butterfly.y + goalUnitY * pull + tangentY * sway,
    )

    applyButterflyOrientation(butterfly, previousX, previousY, {
      headingEase: 0.1,
      bankEase: 0.06,
    })

    butterfly.scaleMod = clampToTwoDecimals(
      0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67,
    )
  }

  function refreshExitWanderDecision(
    butterfly: Butterfly,
    state: ExitWanderState,
    now: number,
  ) {
    if (now < state.nextDecisionAt) return

    const goalDx = butterfly.goal.x - butterfly.x
    const goalDy = butterfly.goal.y - butterfly.y
    const goalAngle = Math.atan2(goalDy, goalDx)

    const randomPanic = Math.random() < 0.18
    const sideFlutter = Math.random() < 0.42
    const angleSwing = randomPanic
      ? randomBetween(-Math.PI, Math.PI)
      : sideFlutter
        ? randomBetween(-1.25, 1.25)
        : randomBetween(-0.42, 0.42)

    state.headingAngle = goalAngle + angleSwing
    state.wanderStrength = randomBetween(0.18, randomPanic ? 1.1 : 0.68)
    state.directness = randomPanic
      ? randomBetween(0.32, 0.58)
      : randomBetween(0.62, 0.92)
    state.nextDecisionAt = now + randomInt(130, 620)

    if (Math.random() < 0.16) state.hesitationUntil = now + randomInt(70, 230)
    if (Math.random() < 0.22) state.burstUntil = now + randomInt(180, 520)
  }

  function moveExitingButterfly(butterfly: Butterfly, now: number) {
    const noise2D = getNoise()
    const state = getExitWanderState(butterfly)
    const previousX = butterfly.x
    const previousY = butterfly.y

    refreshExitWanderDecision(butterfly, state, now)

    const goalDx = butterfly.goal.x - butterfly.x
    const goalDy = butterfly.goal.y - butterfly.y
    const goalDist = Math.sqrt(goalDx * goalDx + goalDy * goalDy) || 1

    const forwardX = goalDx / goalDist
    const forwardY = goalDy / goalDist
    const tangentX = -forwardY
    const tangentY = forwardX

    const flutterNoise = noise2D(
      butterfly.x * 0.11 + butterfly.noiseOffsetX,
      butterfly.y * 0.11 + butterfly.noiseOffsetY + now * 0.0017 + state.seed,
    )

    const wobble =
      Math.sin(now * state.wobbleSpeed + state.seed) *
      state.wobbleWidth *
      state.wanderStrength

    const chosenX = Math.cos(state.headingAngle)
    const chosenY = Math.sin(state.headingAngle)

    const pullScale = now < state.hesitationUntil ? 0.25 : state.directness
    const burstScale = now < state.burstUntil ? 1.35 : 1
    const moveScale = 0.095

    const pull = butterfly.speed * moveScale * pullScale * burstScale
    const wander = butterfly.speed * moveScale * state.wanderStrength
    const sway = butterfly.speed * moveScale * 0.85

    butterfly.x = clampToTwoDecimals(
      butterfly.x +
        forwardX * pull +
        chosenX * wander * 0.48 +
        tangentX * (flutterNoise * sway + wobble * 0.18),
    )
    butterfly.y = clampToTwoDecimals(
      butterfly.y +
        forwardY * pull +
        chosenY * wander * 0.48 +
        tangentY * (flutterNoise * sway + wobble * 0.18),
    )

    applyButterflyOrientation(butterfly, previousX, previousY, {
      headingEase: 0.16,
      bankEase: 0.08,
      bankStrength: now < state.burstUntil ? 1.25 : 1,
    })

    butterfly.scaleMod = clampToTwoDecimals(
      0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67,
    )
    butterfly.zIndex = Math.max(1, butterfly.zIndex - 0.65)
  }

  function updateLoaderButterflyPosition(
    butterfly: Butterfly,
    state: LoaderButterflyState,
    now: number,
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

      moveTowardGoalWithNoise(butterfly, 0.55, 1.2, now)

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

      moveTowardGoalWithNoise(butterfly, 0.45, 1.15, now)

      const angleDiff = Math.abs(
        Math.atan2(
          Math.sin(state.orbitAngle - state.orbitExitAngle),
          Math.cos(state.orbitAngle - state.orbitExitAngle),
        ),
      )

      if (
        now >= state.holdUntil &&
        angleDiff < 0.24 &&
        (state.releaseOnGoal || state.releaseRequested)
      ) {
        beginLoaderButterflyExit(butterfly, state)
      }
      return
    }

    if (state.phase === 'holding') {
      const anchor = state.holdAnchor ||
        state.entryGoal || { x: butterfly.x, y: butterfly.y }
      const wobble = now * 0.0018

      butterfly.goal.x = clampPercent(
        anchor.x + Math.cos(wobble + state.idleSeed) * 1.8,
      )
      butterfly.goal.y = clampPercent(
        anchor.y + Math.sin(wobble * 1.2 + state.idleSeed) * 1.4,
      )

      moveTowardGoalWithNoise(butterfly, 0.35, 1.1, now)

      if (
        now >= state.holdUntil &&
        (state.releaseRequested || state.releaseOnGoal)
      ) {
        beginLoaderButterflyExit(butterfly, state)
      }
    }
  }

  // ─── Main per-butterfly dispatch (now threaded from rAF loop) ────────────

  function updateButterflyPosition(butterfly: Butterfly, now: number) {
    const toggleState = getToggleButterflyState(butterfly.id)

    if (toggleState) {
      const previousX = butterfly.x
      const previousY = butterfly.y

      if (toggleState.mode === 'hover') {
        idleToggleButterfly(butterfly, toggleState, now)
      } else if (
        toggleState.mode === 'approaching' ||
        toggleState.mode === 'returning'
      ) {
        butterfly.goal.x = toggleState.anchor.x
        butterfly.goal.y = toggleState.anchor.y
      }

      const dx = butterfly.goal.x - butterfly.x
      const dy = butterfly.goal.y - butterfly.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 1

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

      applyButterflyOrientation(butterfly, previousX, previousY, {
        headingEase: toggleState.mode === 'fleeing' ? 0.18 : 0.1,
        bankEase: 0.08,
      })

      butterfly.scaleMod = clampToTwoDecimals(
        0.9 + Math.sin(now * 0.01 + toggleState.idleSeed) * 0.04,
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
      updateLoaderButterflyPosition(butterfly, loaderState, now)
      return
    }

    if (butterfly.isExiting) {
      moveExitingButterfly(butterfly, now)
      return
    }

    // Free-roaming noise drift
    const noise2D = getNoise()
    const t = now * 0.001
    const angle =
      noise2D(
        butterfly.x * 0.15 + butterfly.noiseOffsetX,
        butterfly.y * 0.15 + butterfly.noiseOffsetY + t,
      ) *
      Math.PI *
      2

    const moveScale = 0.08
    const noiseDx = Math.cos(angle) * butterfly.speed * moveScale
    const noiseDy = Math.sin(angle) * butterfly.speed * moveScale

    const previousX = butterfly.x
    const previousY = butterfly.y

    butterfly.x = clampToTwoDecimals(
      Math.max(0, Math.min(butterfly.x + noiseDx, 100)),
    )
    butterfly.y = clampToTwoDecimals(
      Math.max(0, Math.min(butterfly.y + noiseDy, 100)),
    )

    applyButterflyOrientation(butterfly, previousX, previousY, {
      headingEase: 0.07,
      bankEase: 0.05,
    })
    butterfly.scaleMod = clampToTwoDecimals(
      0.33 + ((2 - (butterfly.x / 100 + butterfly.y / 100)) / 2) * 0.67,
    )
  }

  // ─── Exit wander state ────────────────────────────────────────────────────

  function createExitWanderState(butterfly: Butterfly): ExitWanderState {
    const goalDx = butterfly.goal.x - butterfly.x
    const goalDy = butterfly.goal.y - butterfly.y
    const goalAngle = Math.atan2(goalDy, goalDx)
    const now = Date.now()

    return {
      id: butterfly.id,
      seed: Math.random() * Math.PI * 2,
      nextDecisionAt: now + randomInt(120, 520),
      headingAngle: goalAngle + randomBetween(-0.9, 0.9),
      wanderStrength: randomBetween(0.16, 0.72),
      directness: randomBetween(0.58, 0.9),
      wobbleSpeed: randomBetween(0.0016, 0.0048),
      wobbleWidth: randomBetween(0.2, 1.25),
      hesitationUntil: Math.random() < 0.2 ? now + randomInt(80, 260) : 0,
      burstUntil: Math.random() < 0.24 ? now + randomInt(180, 520) : 0,
    }
  }

  // ─── Loader scenes ────────────────────────────────────────────────────────

  function chooseLoaderScene(
    preset: LoaderSwarmPreset = 'random',
  ): LoaderScene {
    const randomExitMode = (): LoaderExitMode => 'nearest-exit'

    if (preset === 'inside-drift') {
      return {
        preset: 'inside-drift',
        routeMode: 'drift',
        goalMode: 'individual',
        goalSpread: pickOne(['tight', 'wide']),
        exitMode: randomExitMode(),
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
        goalMode: 'individual',
        goalSpread: pickOne(['tight', 'wide']),
        exitMode: randomExitMode(),
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
        goalMode: 'shared',
        goalSpread: pickOne(['tight', 'wide']),
        exitMode: randomExitMode(),
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
        goalMode: 'shared',
        goalSpread: 'tight',
        exitMode: randomExitMode(),
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
    if (scene.goalMode === 'shared') {
      const spread = scene.goalSpread === 'tight' ? 10 : 24
      return pointWithin(50 - spread, 50 + spread, 50 - spread, 50 + spread)
    }
    if (scene.goalSpread === 'tight') return pointWithin(28, 72, 28, 72)
    return pointWithin(12, 88, 12, 88)
  }

  function getLoaderSpawnPoint() {
    return pointWithin(8, 92, 8, 92)
  }

  function getLoaderHoldAnchor(
    scene: LoaderScene,
    entryGoal: ToggleAnchor | null,
  ) {
    if (scene.routeMode === 'orbit') return pointWithin(36, 64, 34, 66)
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
    const goal = getLoaderExitGoal(butterfly, state)
    butterfly.isExiting = true
    butterfly.goal.x = goal.x
    butterfly.goal.y = goal.y
    state.phase = 'released'
    exitWanderStates[butterfly.id] = createExitWanderState(butterfly)
  }

  function createLoaderButterflyState(
    butterfly: Butterfly,
    scene: LoaderScene,
    sharedGoal: ToggleAnchor | null,
    sharedExitGoal: ToggleAnchor | null,
    sharedOrbitDirection: 1 | -1,
  ) {
    const entryGoal = getLoaderEntryGoal(scene, sharedGoal)
    const holdAnchor = getLoaderHoldAnchor(scene, entryGoal)
    const orbitCenter =
      scene.routeMode === 'orbit' ? pointWithin(38, 62, 38, 62) : null
    const holdUntil =
      Date.now() + randomInt(scene.holdRange.min, scene.holdRange.max)
    const exitGoal =
      scene.exitMode === 'shared-exit' || scene.exitMode === 'mixed-exit'
        ? sharedExitGoal
        : null

    loaderStates[butterfly.id] = {
      id: butterfly.id,
      phase: 'entering',
      routeMode: scene.routeMode,
      entryGoal,
      holdAnchor,
      exitGoal,
      exitMode: scene.exitMode,
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

    const spawn = getLoaderSpawnPoint()
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
    butterfly.heading = getHeadingFromMotion(
      butterfly.goal.x - butterfly.x,
      butterfly.goal.y - butterfly.y,
      butterfly.heading,
    )
  }

  async function spawnLoaderButterflies(
    amount = 20,
    preset: LoaderSwarmPreset = 'random',
  ) {
    try {
      const safeAmount = Math.max(0, Math.floor(amount))
      if (safeAmount === 0) return

      clearLoaderStates()

      const scene = chooseLoaderScene(preset)
      activeLoaderPreset.value = scene.preset

      const sharedGoal =
        scene.goalMode === 'shared' ? getLoaderEntryGoal(scene, null) : null
      const sharedExitGoal =
        scene.exitMode === 'shared-exit' || scene.exitMode === 'mixed-exit'
          ? getSharedExitGoal()
          : null
      const sharedOrbitDirection = pickOne([1, -1]) as 1 | -1
      const incoming: Butterfly[] = []
      const localUsedNames = [...usedNames.value]

      for (let i = 0; i < safeAmount; i++) {
        const butterfly = createLoaderButterfly(
          newButterflySettings,
          localUsedNames,
        )
        createLoaderButterflyState(
          butterfly,
          scene,
          sharedGoal,
          sharedExitGoal,
          sharedOrbitDirection,
        )
        incoming.push(butterfly)
        localUsedNames.push(butterfly.id)
      }

      butterflies.value.push(...incoming)
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  // ─── Exit goal helpers ────────────────────────────────────────────────────

  function getNearestExitGoal(butterfly: Butterfly) {
    const overshoot = 24
    const spread = 34
    const goesLeft = butterfly.x <= 50
    const goesTop = butterfly.y <= 50

    const x = goesLeft
      ? randomBetween(-overshoot - spread, Math.min(-overshoot, butterfly.x))
      : randomBetween(
          Math.max(100 + overshoot, butterfly.x),
          100 + overshoot + spread,
        )

    const y = goesTop
      ? randomBetween(-overshoot - spread, Math.min(-overshoot, butterfly.y))
      : randomBetween(
          Math.max(100 + overshoot, butterfly.y),
          100 + overshoot + spread,
        )

    return { x: clampToTwoDecimals(x), y: clampToTwoDecimals(y) }
  }

  function getRandomExitGoal(): ToggleAnchor {
    type ExitSide = 'top' | 'bottom' | 'left' | 'right'
    const overshoot = 18
    const side = pickOne<ExitSide>(['top', 'bottom', 'left', 'right'])

    if (side === 'top') return { x: randomBetween(-8, 108), y: -overshoot }
    if (side === 'bottom')
      return { x: randomBetween(-8, 108), y: 100 + overshoot }
    if (side === 'left') return { x: -overshoot, y: randomBetween(-8, 108) }
    return { x: 100 + overshoot, y: randomBetween(-8, 108) }
  }

  function getSharedExitGoal(): ToggleAnchor {
    return getRandomExitGoal()
  }

  function getLoaderExitGoal(
    butterfly: Butterfly,
    state: LoaderButterflyState,
  ) {
    if (state.exitMode === 'nearest-exit') return getNearestExitGoal(butterfly)
    if (state.exitMode === 'random-exit') return getRandomExitGoal()
    if (state.exitMode === 'shared-exit')
      return state.exitGoal || getNearestExitGoal(butterfly)
    const useShared = Math.random() >= 0.5
    if (useShared && state.exitGoal) return state.exitGoal
    return pickOne([getNearestExitGoal(butterfly), getRandomExitGoal()])
  }

  function isOutsideRemovalBounds(butterfly: Butterfly) {
    const buffer = 10
    return (
      butterfly.x < -buffer ||
      butterfly.x > 100 + buffer ||
      butterfly.y < -buffer ||
      butterfly.y > 100 + buffer
    )
  }

  // ─── Lifecycle actions ────────────────────────────────────────────────────

  function requestLoaderRelease() {
    try {
      for (const state of Object.values(loaderStates)) {
        if (!state) continue
        state.releaseRequested = true
        const butterfly = getButterflyById(state.id)
        if (!butterfly || butterfly.isExiting) continue
        if (state.phase === 'holding' && !state.releaseOnGoal) {
          beginLoaderButterflyExit(butterfly, state)
        }
      }
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
  }

  function markButterflyForExit(butterfly: Butterfly) {
    if (butterfly.isExiting) return

    const loaderState = getLoaderButterflyState(butterfly.id)
    if (loaderState) {
      beginLoaderButterflyExit(butterfly, loaderState)
      return
    }

    const goal = getNearestExitGoal(butterfly)
    butterfly.isExiting = true
    butterfly.goal.x = goal.x
    butterfly.goal.y = goal.y
    exitWanderStates[butterfly.id] = createExitWanderState(butterfly)
  }

  function markAllButterfliesForExit() {
    try {
      for (const butterfly of butterflies.value) {
        if (butterfly.isExiting) continue
        const loaderState = getLoaderButterflyState(butterfly.id)
        if (loaderState) {
          beginLoaderButterflyExit(butterfly, loaderState)
          continue
        }
        const exitGoal = getNearestExitGoal(butterfly)
        butterfly.goal.x = exitGoal.x
        butterfly.goal.y = exitGoal.y
        butterfly.isExiting = true
        exitWanderStates[butterfly.id] = createExitWanderState(butterfly)
      }
      selectedButterflyId.value = ''
    } catch (error) {
      addError(ErrorType.STORE_ERROR, error)
    }
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
    if (butterfly) sendButterflyAway(butterfly)
  }

  function sendAllButterfliesAway() {
    for (const butterfly of butterflies.value) {
      if (!butterfly.isExiting) markButterflyForExit(butterfly)
    }
    selectedButterflyId.value =
      butterflies.value.find((b) => !b.isExiting)?.id || ''
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

    const state = toggleStates[butterflyId]
    const butterfly = getButterflyById(butterflyId)
    if (!state || !butterfly || butterfly.isExiting) return

    state.anchor = { x, y }
    state.home = { x, y }
    state.mode = 'returning'
    butterfly.goal.x = x
    butterfly.goal.y = y
  }

  function destroyToggleButterflies() {
    for (const state of Object.values(toggleStates)) {
      if (state?.returnTimeoutId) {
        clearTimeout(state.returnTimeoutId)
        state.returnTimeoutId = null
      }
    }

    clearPlainObject(toggleStates as Record<string, unknown>)

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
    clearPlainObject(loaderStates as Record<string, unknown>)
    clearPlainObject(exitWanderStates as Record<string, unknown>)
  }

  // ─── Drain ────────────────────────────────────────────────────────────────

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
        try {
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
        } catch (error) {
          stopDrain()
          addError(ErrorType.STORE_ERROR, error)
        }
      }, interval)
    }, delay)
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

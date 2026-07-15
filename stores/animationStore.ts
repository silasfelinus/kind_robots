// /stores/animationStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'
import {
  animationEffects,
  type AnimationEffect,
  type AnimationEffectId,
  type FxRegion,
} from './animationCatalog'

export type FxPlacement = 'behind' | 'front'
export type FxPlacementState = 'off' | FxPlacement
export type FxSurfaceMap = Record<FxRegion, Record<FxPlacement, boolean>>

export const FX_REGIONS: FxRegion[] = ['header', 'sheet', 'page', 'hand']

export interface AnimationLayerOptions {
  effectId?: AnimationEffectId
  surfaces?: Partial<Record<FxRegion, Partial<Record<FxPlacement, boolean>>>>
  message?: string
  durationMs?: number | null
}

interface AnimationStoreState {
  isActive: boolean
  activeEffectId: AnimationEffectId | null
  message: string
  generationSurfaces: FxSurfaceMap
  startedAt: number | null
  screenEffectIds: AnimationEffectId[]
  screenSurfaces: FxSurfaceMap
}

function emptySurfaces(): FxSurfaceMap {
  return {
    header: { behind: false, front: false },
    sheet: { behind: false, front: false },
    page: { behind: false, front: false },
    hand: { behind: false, front: false },
  }
}

function defaultScreenSurfaces(): FxSurfaceMap {
  const surfaces = emptySurfaces()
  surfaces.page.front = true
  return surfaces
}

function mergeSurfaces(
  base: FxSurfaceMap,
  patch?: AnimationLayerOptions['surfaces'],
): FxSurfaceMap {
  if (!patch) return base

  const merged = emptySurfaces()

  FX_REGIONS.forEach((region) => {
    merged[region].behind = patch[region]?.behind ?? base[region].behind
    merged[region].front = patch[region]?.front ?? base[region].front
  })

  return merged
}

function pickRandomEffect(): AnimationEffectId {
  const safeEffects = animationEffects.filter((effect) => effect.generationSafe)
  const index = Math.floor(Math.random() * safeEffects.length)
  return safeEffects[index]?.id || 'starfield-effect'
}

function surfacesForEffect(effect: AnimationEffect | null): FxSurfaceMap {
  const surfaces = emptySurfaces()

  if (!effect || effect.preferredSurface === 'fullscreen') {
    FX_REGIONS.forEach((region) => {
      surfaces[region].front = true
    })

    return surfaces
  }

  surfaces[effect.preferredSurface ?? 'page'].front = true

  return surfaces
}

export const useAnimationStore = defineStore('animationStore', () => {
  const stopTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const state = reactive<AnimationStoreState>({
    isActive: false,
    activeEffectId: null,
    message: '',
    generationSurfaces: emptySurfaces(),
    startedAt: null,
    screenEffectIds: [],
    screenSurfaces: defaultScreenSurfaces(),
  })
  const effects = computed(() => animationEffects)

  const safeEffects = computed(() => {
    return effects.value.filter((effect) => effect.generationSafe)
  })

  const activeEffect = computed(() => {
    return (
      effects.value.find((effect) => effect.id === state.activeEffectId) || null
    )
  })

  const screenEffects = computed(() => {
    return state.screenEffectIds
      .map((id) => effects.value.find((effect) => effect.id === id))
      .filter((effect): effect is AnimationEffect => Boolean(effect))
  })

  const screenEffectCount = computed(() => state.screenEffectIds.length)

  const hasBlockingScreenEffect = computed(() => {
    return screenEffects.value.some((effect) => effect.blocksInput)
  })

  const isFullscreen = computed(() => {
    return FX_REGIONS.every((region) => state.generationSurfaces[region].front)
  })

  const preferredSurface = computed(() => {
    return activeEffect.value?.preferredSurface || 'page'
  })

  function isScreenEffectActive(id: AnimationEffectId): boolean {
    return state.screenEffectIds.includes(id)
  }

  function toggleScreenEffect(id: AnimationEffectId): void {
    if (isScreenEffectActive(id)) {
      state.screenEffectIds = state.screenEffectIds.filter(
        (effectId) => effectId !== id,
      )
      return
    }

    state.screenEffectIds = [...state.screenEffectIds, id]
  }

  function clearScreenEffects(): void {
    state.screenEffectIds = []
  }

  function toggleSurface(region: FxRegion, placement: FxPlacement): void {
    state.screenSurfaces[region][placement] =
      !state.screenSurfaces[region][placement]
  }

  function setSurface(
    region: FxRegion,
    placement: FxPlacement,
    value: boolean,
  ): void {
    state.screenSurfaces[region][placement] = value
  }

  function getSurfacePlacement(region: FxRegion): FxPlacementState {
    const surface = state.screenSurfaces[region]
    if (surface.front) return 'front'
    if (surface.behind) return 'behind'
    return 'off'
  }

  function setSurfacePlacement(
    region: FxRegion,
    placement: FxPlacementState,
  ): void {
    state.screenSurfaces[region] = {
      behind: placement === 'behind',
      front: placement === 'front',
    }
  }

  function resetSurfaces(): void {
    state.screenSurfaces = defaultScreenSurfaces()
  }

  function clearStopTimer(): void {
    if (!stopTimer.value) return
    clearTimeout(stopTimer.value)
    stopTimer.value = null
  }

  function start(options: AnimationLayerOptions = {}): void {
    clearStopTimer()

    state.activeEffectId = options.effectId || pickRandomEffect()

    const selectedEffect =
      effects.value.find((effect) => effect.id === state.activeEffectId) || null

    state.message = options.message || selectedEffect?.label || 'Generating...'
    state.generationSurfaces = mergeSurfaces(
      surfacesForEffect(selectedEffect),
      options.surfaces,
    )
    state.startedAt = Date.now()
    state.isActive = true

    if (typeof options.durationMs === 'number' && options.durationMs > 0) {
      stopTimer.value = setTimeout(() => stop(), options.durationMs)
    }
  }

  function startGeneration(options: AnimationLayerOptions = {}): void {
    start({
      message: 'Generating art...',
      durationMs: null,
      ...options,
    })
  }

  function nextEffect(): void {
    const all = effects.value
    const currentIndex = all.findIndex(
      (effect) => effect.id === state.activeEffectId,
    )
    const next = all[(currentIndex + 1) % all.length]

    if (!next) return

    state.activeEffectId = next.id
    state.message = next.label
    state.generationSurfaces = surfacesForEffect(next)
  }

  function prevEffect(): void {
    const all = effects.value
    const currentIndex = all.findIndex(
      (effect) => effect.id === state.activeEffectId,
    )
    const previous = all[(currentIndex - 1 + all.length) % all.length]

    if (!previous) return

    state.activeEffectId = previous.id
    state.message = previous.label
    state.generationSurfaces = surfacesForEffect(previous)
  }

  function stop(): void {
    clearStopTimer()
    state.isActive = false
    state.activeEffectId = null
    state.message = ''
    state.startedAt = null
    state.generationSurfaces = emptySurfaces()
  }

  return {
    ...toRefs(state),
    effects,
    safeEffects,
    activeEffect,
    screenEffects,
    screenEffectCount,
    hasBlockingScreenEffect,
    isFullscreen,
    preferredSurface,
    isScreenEffectActive,
    toggleScreenEffect,
    clearScreenEffects,
    toggleSurface,
    setSurface,
    getSurfacePlacement,
    setSurfacePlacement,
    resetSurfaces,
    start,
    startGeneration,
    stop,
    nextEffect,
    prevEffect,
  }
})

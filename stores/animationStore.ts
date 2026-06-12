// /stores/animationStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'

export type FxRegion = 'header' | 'sheet' | 'page' | 'hand'
export type FxPlacement = 'behind' | 'front'
export type FxSurfaceMap = Record<FxRegion, Record<FxPlacement, boolean>>

export const FX_REGIONS: FxRegion[] = ['header', 'sheet', 'page', 'hand']

export type AnimationEffectId =
  | 'aurora-effect'
  | 'starfield-effect'
  | 'constellation-effect'
  | 'wishing-stars'
  | 'orbit-effect'
  | 'butterfly-animation'
  | 'firefly-effect'
  | 'rain-effect'
  | 'snow-effect'
  | 'fizzy-bubbles'
  | 'ripple-effect'
  | 'floating-hearts'
  | 'plasma-effect'
  | 'pixel-rain'
  | 'matrix-rain'
  | 'glitch-effect'
  | 'kaleidoscope-effect'
  | 'toaster-effect'
  | 'fireworks-effect'
  | 'lightning-effect'
  | 'fire-effect'
  | 'nyan-trail'
  | 'pixel-explosion'
  | 'wandering-creatures'
  | 'ascii-aquarium'
  | 'pacbot-effect'
  | 'pocket-gremlin'
  | 'siege-engine'

export interface AnimationEffect {
  id: AnimationEffectId
  label: string
  reveal: string
  icon: string
  tooltip: string
  color: string
  generationSafe: boolean
  blocksInput?: boolean
  preferredSurface?: FxRegion | 'fullscreen'
}

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

const allEffects: AnimationEffect[] = [
  {
    id: 'aurora-effect',
    label: 'Aurora',
    reveal: 'Borealis!',
    icon: 'kind-icon:rainbow',
    tooltip: 'Northern lights drift across the sky 🌌',
    color: '#14b8a6',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'starfield-effect',
    label: 'Warp Drive',
    reveal: 'Hyperspace!',
    icon: 'kind-icon:star',
    tooltip: 'Punch it, Chewie ✨',
    color: '#6366f1',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'constellation-effect',
    label: 'Constellation',
    reveal: 'Star map',
    icon: 'kind-icon:sparkle',
    tooltip: 'Drifting stars connect into patterns 🔭',
    color: '#60a5fa',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'wishing-stars',
    label: 'Wishing Stars',
    reveal: '✨ Wish granted',
    icon: 'kind-icon:star',
    tooltip: 'Shooting stars streak across the sky 🌠',
    color: '#fbbf24',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'orbit-effect',
    label: 'Orrery',
    reveal: 'Solar system',
    icon: 'kind-icon:orbit',
    tooltip: 'Glowing orbs trace orbital paths 🪐',
    color: '#a855f7',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    reveal: 'Happy butterflies',
    icon: 'kind-icon:butterfly',
    tooltip: 'Release AMI into the world 🦋',
    color: '#e879f9',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'firefly-effect',
    label: 'Fireflies',
    reveal: 'Golden hour',
    icon: 'kind-icon:sparkle',
    tooltip: 'Organic warm glow drifting through the dark 🌿',
    color: '#f59e0b',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    reveal: 'Just a drizzle',
    icon: 'kind-icon:raindrop',
    tooltip: "Rain doesn't have to be sad 🌧️",
    color: '#7ba7c0',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'snow-effect',
    label: 'Snow Globe',
    reveal: 'Cozy ❄️',
    icon: 'kind-icon:snowflake',
    tooltip: 'Soft particle snowfall ❄️',
    color: '#93c5fd',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'floating-hearts',
    label: 'Love Bomb',
    reveal: 'So much love',
    icon: 'kind-icon:heart',
    tooltip: 'Click anywhere to burst 💖',
    color: '#f43f5e',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    reveal: 'Carbonation!',
    icon: 'kind-icon:soda',
    tooltip: 'Float away with fizzy bubbles 🍾',
    color: '#38bdf8',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'ripple-effect',
    label: 'Ripple',
    reveal: 'Still waters',
    icon: 'kind-icon:raindrop',
    tooltip: 'Move your cursor to ripple the surface 💧',
    color: '#0ea5e9',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'fireworks-effect',
    label: 'Fireworks',
    reveal: '🎆 Celebration!',
    icon: 'kind-icon:sparkle',
    tooltip: 'Click anywhere to fire 🎆',
    color: '#ef4444',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'lightning-effect',
    label: 'Storm Caller',
    reveal: 'Feel the power',
    icon: 'kind-icon:lightning',
    tooltip: 'Recursive arc strikes from the sky ⚡',
    color: '#eab308',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fire-effect',
    label: 'Wildfire',
    reveal: 'Everything is fine',
    icon: 'kind-icon:flame',
    tooltip: 'This is fine 🔥',
    color: '#ea580c',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'glitch-effect',
    label: 'Glitch',
    reveal: 'ERR_404',
    icon: 'kind-icon:lightning',
    tooltip: 'Signal corruption detected 📺',
    color: '#7c3aed',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'kaleidoscope-effect',
    label: 'Kaleidoscope',
    reveal: 'Infinite mirror',
    icon: 'kind-icon:gem',
    tooltip: 'Sacred geometry in motion 🔮',
    color: '#9333ea',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'plasma-effect',
    label: 'Plasma',
    reveal: 'Sine wave soup',
    icon: 'kind-icon:wave',
    tooltip: 'Summed sine waves, After Dark plasma 🌊',
    color: '#8b5cf6',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'nyan-trail',
    label: 'Nyan Trail',
    reveal: 'Nyan nyan nyan',
    icon: 'kind-icon:rainbow',
    tooltip: 'Rainbow particle trail follows your cursor 🌈',
    color: '#ec4899',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'matrix-rain',
    label: 'Matrix Rain',
    reveal: 'There is no spoon',
    icon: 'kind-icon:code',
    tooltip: 'Follow the white rabbit 🐇',
    color: '#22c55e',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'pixel-rain',
    label: 'Pixel Rain',
    reveal: "It's raining bits",
    icon: 'kind-icon:pixel',
    tooltip: 'Retro pixel blocks fall and pile up 🕹️',
    color: '#06b6d4',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'pixel-explosion',
    label: 'Pixel Smash',
    reveal: 'Everything is pixels',
    icon: 'kind-icon:pixel',
    tooltip: 'Click anything to shatter it into pixels 💥',
    color: '#dc2626',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'wandering-creatures',
    label: 'Creatures',
    reveal: 'They live here now',
    icon: 'kind-icon:butterfly',
    tooltip: 'Critters with distinct personalities roam the screen 🐾',
    color: '#10b981',
    generationSafe: true,
    preferredSurface: 'page',
  },
  {
    id: 'toaster-effect',
    label: 'Flying Toasters',
    reveal: 'Toast incoming!',
    icon: 'kind-icon:toast',
    tooltip: 'After Dark tribute, the original screensaver 🍞',
    color: '#f97316',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'ascii-aquarium',
    label: 'Aquarium',
    reveal: 'Glub glub',
    icon: 'kind-icon:fish',
    tooltip: 'Click to feed, Move cursor to spook 🐠',
    color: '#06b6d4',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
  {
    id: 'pacbot-effect',
    label: 'Pac-Bot',
    reveal: 'Nom nom nom',
    icon: 'kind-icon:robot',
    tooltip:
      'Move to leave crumbs, Click for power, Dbl-click for crumb storm 🤖',
    color: '#eab308',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
  {
    id: 'pocket-gremlin',
    label: 'Gremlin',
    reveal: 'beep?',
    icon: 'kind-icon:ghost',
    tooltip: 'Click it to pet it, Ignore it at your peril 👾',
    color: '#a78bfa',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
  {
    id: 'siege-engine',
    label: 'Siege Engine',
    reveal: 'FIRE!!!',
    icon: 'kind-icon:flame',
    tooltip: 'Hold to charge, Release to launch 🪨',
    color: '#b45309',
    generationSafe: false,
    blocksInput: true,
    preferredSurface: 'page',
  },
]

function pickRandomEffect(): AnimationEffectId {
  const safeEffects = allEffects.filter((effect) => effect.generationSafe)
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

  const effects = computed(() => allEffects)

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
    resetSurfaces,
    start,
    startGeneration,
    stop,
    nextEffect,
    prevEffect,
  }
})

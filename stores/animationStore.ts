// /stores/animationStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'

export type AnimationLayerZone =
  | 'header'
  | 'left'
  | 'center'
  | 'right'
  | 'footer'

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
  icon: string
  generationSafe: boolean
  preferredSurface?: AnimationLayerZone | 'fullscreen'
}

export interface AnimationLayerOptions {
  effectId?: AnimationEffectId
  zones?: Partial<Record<AnimationLayerZone, boolean>>
  message?: string
  durationMs?: number | null
}

interface AnimationStoreState {
  isActive: boolean
  activeEffectId: AnimationEffectId | null
  message: string
  zones: Record<AnimationLayerZone, boolean>
  startedAt: number | null
}

const defaultZones: Record<AnimationLayerZone, boolean> = {
  header: false,
  left: false,
  center: true,
  right: false,
  footer: false,
}

const fullscreenZones: Record<AnimationLayerZone, boolean> = {
  header: true,
  left: true,
  center: true,
  right: true,
  footer: true,
}

const generationEffects: AnimationEffect[] = [
  {
    id: 'aurora-effect',
    label: 'Aurora',
    icon: 'kind-icon:rainbow',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'starfield-effect',
    label: 'Warp Drive',
    icon: 'kind-icon:star',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'constellation-effect',
    label: 'Constellation',
    icon: 'kind-icon:sparkle',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'wishing-stars',
    label: 'Wishing Stars',
    icon: 'kind-icon:star',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'orbit-effect',
    label: 'Orrery',
    icon: 'kind-icon:orbit',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    icon: 'kind-icon:butterfly',
    generationSafe: true,
    preferredSurface: 'center',
  },
  {
    id: 'firefly-effect',
    label: 'Fireflies',
    icon: 'kind-icon:sparkle',
    generationSafe: true,
    preferredSurface: 'center',
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    icon: 'kind-icon:raindrop',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'snow-effect',
    label: 'Snow Globe',
    icon: 'kind-icon:snowflake',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'floating-hearts',
    label: 'Love Bomb',
    icon: 'kind-icon:heart',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    icon: 'kind-icon:soda',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'ripple-effect',
    label: 'Ripple',
    icon: 'kind-icon:raindrop',
    generationSafe: true,
    preferredSurface: 'center',
  },
  {
    id: 'fireworks-effect',
    label: 'Fireworks',
    icon: 'kind-icon:sparkle',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'lightning-effect',
    label: 'Storm Caller',
    icon: 'kind-icon:lightning',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'fire-effect',
    label: 'Wildfire',
    icon: 'kind-icon:flame',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'glitch-effect',
    label: 'Glitch',
    icon: 'kind-icon:lightning',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'kaleidoscope-effect',
    label: 'Kaleidoscope',
    icon: 'kind-icon:gem',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'plasma-effect',
    label: 'Plasma',
    icon: 'kind-icon:wave',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'nyan-trail',
    label: 'Nyan Trail',
    icon: 'kind-icon:rainbow',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'matrix-rain',
    label: 'Matrix Rain',
    icon: 'kind-icon:code',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'pixel-rain',
    label: 'Pixel Rain',
    icon: 'kind-icon:pixel',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'pixel-explosion',
    label: 'Pixel Smash',
    icon: 'kind-icon:pixel',
    generationSafe: true,
    preferredSurface: 'center',
  },
  {
    id: 'wandering-creatures',
    label: 'Creatures',
    icon: 'kind-icon:butterfly',
    generationSafe: true,
    preferredSurface: 'center',
  },
  {
    id: 'toaster-effect',
    label: 'Flying Toasters',
    icon: 'kind-icon:toast',
    generationSafe: true,
    preferredSurface: 'fullscreen',
  },
  {
    id: 'ascii-aquarium',
    label: 'Aquarium',
    icon: 'kind-icon:fish',
    generationSafe: false,
    preferredSurface: 'center',
  },
  {
    id: 'pacbot-effect',
    label: 'Pac-Bot',
    icon: 'kind-icon:robot',
    generationSafe: false,
    preferredSurface: 'center',
  },
  {
    id: 'pocket-gremlin',
    label: 'Gremlin',
    icon: 'kind-icon:ghost',
    generationSafe: false,
    preferredSurface: 'center',
  },
  {
    id: 'siege-engine',
    label: 'Siege Engine',
    icon: 'kind-icon:flame',
    generationSafe: false,
    preferredSurface: 'center',
  },
]

function pickRandomEffect(): AnimationEffectId {
  const safeEffects = generationEffects.filter(
    (effect) => effect.generationSafe,
  )
  const index = Math.floor(Math.random() * safeEffects.length)
  return safeEffects[index]?.id || 'starfield-effect'
}

function zonesForEffect(effect: AnimationEffect | null) {
  if (effect?.preferredSurface === 'fullscreen') return { ...fullscreenZones }

  if (
    effect?.preferredSurface === 'header' ||
    effect?.preferredSurface === 'left' ||
    effect?.preferredSurface === 'center' ||
    effect?.preferredSurface === 'right' ||
    effect?.preferredSurface === 'footer'
  ) {
    return {
      header: effect.preferredSurface === 'header',
      left: effect.preferredSurface === 'left',
      center: effect.preferredSurface === 'center',
      right: effect.preferredSurface === 'right',
      footer: effect.preferredSurface === 'footer',
    }
  }

  return { ...defaultZones }
}

export const useAnimationStore = defineStore('animationStore', () => {
  const stopTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const state = reactive<AnimationStoreState>({
    isActive: false,
    activeEffectId: null,
    message: '',
    zones: { ...defaultZones },
    startedAt: null,
  })

  const effects = computed(() => generationEffects)

  const safeEffects = computed(() => {
    return effects.value.filter((effect) => effect.generationSafe)
  })

  const activeEffect = computed(() => {
    return (
      effects.value.find((effect) => effect.id === state.activeEffectId) || null
    )
  })

  const isFullscreen = computed(() => {
    return Object.values(state.zones).every(Boolean)
  })

  const preferredSurface = computed(() => {
    return activeEffect.value?.preferredSurface || 'center'
  })

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
    state.zones = {
      ...zonesForEffect(selectedEffect),
      ...options.zones,
    }
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
    state.zones = zonesForEffect(next)
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
    state.zones = zonesForEffect(previous)
  }

  function stop(): void {
    clearStopTimer()
    state.isActive = false
    state.activeEffectId = null
    state.message = ''
    state.startedAt = null
    state.zones = { ...defaultZones }
  }

  function setZones(zones: Partial<Record<AnimationLayerZone, boolean>>): void {
    state.zones = { ...state.zones, ...zones }
  }

  function setSurface(zone: AnimationLayerZone | 'fullscreen'): void {
    if (zone === 'fullscreen') {
      state.zones = { ...fullscreenZones }
      return
    }

    state.zones = {
      header: zone === 'header',
      left: zone === 'left',
      center: zone === 'center',
      right: zone === 'right',
      footer: zone === 'footer',
    }
  }

  function toggleZone(zone: AnimationLayerZone): void {
    state.zones[zone] = !state.zones[zone]
  }

  function resetZones(): void {
    state.zones = activeEffect.value
      ? zonesForEffect(activeEffect.value)
      : { ...defaultZones }
  }

  return {
    ...toRefs(state),
    effects,
    safeEffects,
    activeEffect,
    isFullscreen,
    preferredSurface,
    start,
    startGeneration,
    stop,
    setZones,
    setSurface,
    toggleZone,
    resetZones,
    nextEffect,
    prevEffect,
  }
})

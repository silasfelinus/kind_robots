// /stores/animationStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref, toRefs } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

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
  | 'smudge-effect'
  | 'ascii-aquarium'
  | 'pacbot-effect'
  | 'pocket-gremlin'
  | 'siege-engine'

export interface AnimationEffect {
  id: AnimationEffectId
  label: string
  icon: string
  generationSafe: boolean
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

const generationEffects: AnimationEffect[] = [
  // ── Atmospheric ──────────────────────────────────────────────────────────
  {
    id: 'aurora-effect',
    label: 'Aurora',
    icon: 'kind-icon:rainbow',
    generationSafe: true,
  },
  {
    id: 'starfield-effect',
    label: 'Warp Drive',
    icon: 'kind-icon:star',
    generationSafe: true,
  },
  {
    id: 'constellation-effect',
    label: 'Constellation',
    icon: 'kind-icon:sparkle',
    generationSafe: true,
  },
  {
    id: 'wishing-stars',
    label: 'Wishing Stars',
    icon: 'kind-icon:star',
    generationSafe: true,
  },
  {
    id: 'orbit-effect',
    label: 'Orrery',
    icon: 'kind-icon:orbit',
    generationSafe: true,
  },
  // ── Nature ───────────────────────────────────────────────────────────────
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
    icon: 'kind-icon:butterfly',
    generationSafe: true,
  },
  {
    id: 'firefly-effect',
    label: 'Fireflies',
    icon: 'kind-icon:sparkle',
    generationSafe: true,
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
    icon: 'kind-icon:raindrop',
    generationSafe: true,
  },
  {
    id: 'snow-effect',
    label: 'Snow Globe',
    icon: 'kind-icon:snowflake',
    generationSafe: true,
  },
  {
    id: 'floating-hearts',
    label: 'Love Bomb',
    icon: 'kind-icon:heart',
    generationSafe: true,
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
    icon: 'kind-icon:soda',
    generationSafe: true,
  },
  {
    id: 'ripple-effect',
    label: 'Ripple',
    icon: 'kind-icon:raindrop',
    generationSafe: true,
  },
  // ── Energy ───────────────────────────────────────────────────────────────
  {
    id: 'fireworks-effect',
    label: 'Fireworks',
    icon: 'kind-icon:sparkle',
    generationSafe: true,
  },
  {
    id: 'lightning-effect',
    label: 'Storm Caller',
    icon: 'kind-icon:lightning',
    generationSafe: true,
  },
  {
    id: 'fire-effect',
    label: 'Wildfire',
    icon: 'kind-icon:flame',
    generationSafe: true,
  },
  {
    id: 'glitch-effect',
    label: 'Glitch',
    icon: 'kind-icon:lightning',
    generationSafe: true,
  },
  // ── Creative ─────────────────────────────────────────────────────────────
  {
    id: 'kaleidoscope-effect',
    label: 'Kaleidoscope',
    icon: 'kind-icon:gem',
    generationSafe: true,
  },
  {
    id: 'plasma-effect',
    label: 'Plasma',
    icon: 'kind-icon:wave',
    generationSafe: true,
  },
  {
    id: 'nyan-trail',
    label: 'Nyan Trail',
    icon: 'kind-icon:rainbow',
    generationSafe: true,
  },
  {
    id: 'matrix-rain',
    label: 'Matrix Rain',
    icon: 'kind-icon:code',
    generationSafe: true,
  },
  {
    id: 'pixel-rain',
    label: 'Pixel Rain',
    icon: 'kind-icon:pixel',
    generationSafe: true,
  },
  {
    id: 'pixel-explosion',
    label: 'Pixel Smash',
    icon: 'kind-icon:pixel',
    generationSafe: true,
  },
  // ── Fun ──────────────────────────────────────────────────────────────────
  {
    id: 'wandering-creatures',
    label: 'Creatures',
    icon: 'kind-icon:butterfly',
    generationSafe: true,
  },
  {
    id: 'toaster-effect',
    label: 'Flying Toasters',
    icon: 'kind-icon:toast',
    generationSafe: true,
  },
  // ── Interactive ───────────────────────────────────────────────────────────
  {
    id: 'smudge-effect',
    label: 'Smudge',
    icon: 'kind-icon:brush',
    generationSafe: false,
  },
  {
    id: 'ascii-aquarium',
    label: 'Aquarium',
    icon: 'kind-icon:fish',
    generationSafe: false,
  },
  {
    id: 'pacbot-effect',
    label: 'Pac-Bot',
    icon: 'kind-icon:robot',
    generationSafe: false,
  },
  {
    id: 'pocket-gremlin',
    label: 'Gremlin',
    icon: 'kind-icon:ghost',
    generationSafe: false,
  },
  {
    id: 'siege-engine',
    label: 'Siege Engine',
    icon: 'kind-icon:flame',
    generationSafe: false,
  },
]

function pickRandomEffect(): AnimationEffectId {
  const safeEffects = generationEffects.filter((e) => e.generationSafe)
  const index = Math.floor(Math.random() * safeEffects.length)
  return safeEffects[index]?.id || 'starfield-effect'
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export const useAnimationStore = defineStore('animationStore', () => {
  const displayStore = useDisplayStore()
  const display = displayStore as unknown as Record<string, unknown>
  const stopTimer = ref<ReturnType<typeof setTimeout> | null>(null)

  const state = reactive<AnimationStoreState>({
    isActive: false,
    activeEffectId: null,
    message: '',
    zones: { ...defaultZones },
    startedAt: null,
  })

  const effects = computed(() => generationEffects)

  const activeEffect = computed(
    () => effects.value.find((e) => e.id === state.activeEffectId) || null,
  )

  const layerStyle = computed(() => {
    const showLeft = getBoolean(display.showLeft, false)
    const showRight = getBoolean(display.showRight, false)
    const headerHeight = getNumber(
      display.headerHeight,
      getNumber(display.headerHeightPx, 0),
    )
    const footerHeight = getNumber(
      display.footerHeight,
      getNumber(display.footerHeightPx, 0),
    )
    const leftWidth = showLeft
      ? getNumber(display.leftWidth, getNumber(display.leftWidthPx, 0))
      : 0
    const rightWidth = showRight
      ? getNumber(display.rightWidth, getNumber(display.rightWidthPx, 0))
      : 0

    return {
      top: state.zones.header
        ? '0px'
        : `var(--app-header-height, ${headerHeight}px)`,
      bottom: state.zones.footer
        ? '0px'
        : `var(--app-footer-height, ${footerHeight}px)`,
      left: state.zones.left
        ? '0px'
        : `var(--app-left-width,   ${leftWidth}px)`,
      right: state.zones.right
        ? '0px'
        : `var(--app-right-width,  ${rightWidth}px)`,
    }
  })

  function clearStopTimer(): void {
    if (!stopTimer.value) return
    clearTimeout(stopTimer.value)
    stopTimer.value = null
  }

  function start(options: AnimationLayerOptions = {}): void {
    clearStopTimer()
    state.activeEffectId = options.effectId || pickRandomEffect()
    state.message =
      options.message || activeEffect.value?.label || 'Generating...'
    state.zones = { ...defaultZones, ...options.zones }
    state.startedAt = Date.now()
    state.isActive = true

    if (typeof options.durationMs === 'number' && options.durationMs > 0) {
      stopTimer.value = setTimeout(() => stop(), options.durationMs)
    }
  }

  function startGeneration(options: AnimationLayerOptions = {}): void {
    start({ message: 'Generating art...', durationMs: null, ...options })
  }

  function stop(): void {
    clearStopTimer()
    state.isActive = false
    state.activeEffectId = null
    state.message = ''
    state.startedAt = null
  }

  function setZones(zones: Partial<Record<AnimationLayerZone, boolean>>): void {
    state.zones = { ...state.zones, ...zones }
  }

  function toggleZone(zone: AnimationLayerZone): void {
    state.zones[zone] = !state.zones[zone]
  }

  function resetZones(): void {
    state.zones = { ...defaultZones }
  }

  return {
    ...toRefs(state),
    effects,
    activeEffect,
    layerStyle,
    start,
    startGeneration,
    stop,
    setZones,
    toggleZone,
    resetZones,
  }
})

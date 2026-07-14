// /stores/animationPreferenceStore.ts
import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import {
  isAnimationEffectId,
  type AnimationEffectId,
} from './animationCatalog'

export type StartupAnimationChoice = AnimationEffectId | 'random' | 'none'

export interface ButterflyAnimationPreferences {
  adaptive: boolean
  count: number
  fps: number
  flapSpeedMs: number
  movementSpeed: number
  size: number
  fadeCycleMs: number
  minOpacity: number
  maxOpacity: number
}

export interface AnimationPreferences {
  startupEffect: StartupAnimationChoice
  butterflies: ButterflyAnimationPreferences
}

const STORAGE_KEY = 'kind-robots-animation-preferences-v1'

export const DEFAULT_PREFERENCES: AnimationPreferences = {
  startupEffect: 'butterfly-animation',
  butterflies: {
    adaptive: true,
    count: 76,
    fps: 60,
    flapSpeedMs: 420,
    movementSpeed: 1,
    size: 0.82,
    fadeCycleMs: 7200,
    minOpacity: 0.04,
    maxOpacity: 0.82
  }
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function sanitizeStartupEffect(value: unknown): StartupAnimationChoice {
  if (value === 'random' || value === 'none' || isAnimationEffectId(value)) {
    return value
  }

  return DEFAULT_PREFERENCES.startupEffect
}

function sanitizePreferences(value: unknown): AnimationPreferences {
  const source: Partial<AnimationPreferences> =
    value && typeof value === 'object'
      ? (value as Partial<AnimationPreferences>)
      : {}
  const butterflies: Partial<ButterflyAnimationPreferences> =
    source.butterflies && typeof source.butterflies === 'object'
      ? source.butterflies
      : {}

  return {
    startupEffect: sanitizeStartupEffect(source.startupEffect),
    butterflies: {
      adaptive:
        typeof butterflies.adaptive === 'boolean'
          ? butterflies.adaptive
          : DEFAULT_PREFERENCES.butterflies.adaptive,
      count: Math.round(
        clamp(
          butterflies.count,
          0,
          140,
          DEFAULT_PREFERENCES.butterflies.count
        )
      ),
      fps: Math.round(
        clamp(butterflies.fps, 15, 120, DEFAULT_PREFERENCES.butterflies.fps)
      ),
      flapSpeedMs: Math.round(
        clamp(
          butterflies.flapSpeedMs,
          160,
          1000,
          DEFAULT_PREFERENCES.butterflies.flapSpeedMs
        )
      ),
      movementSpeed: clamp(
        butterflies.movementSpeed,
        0.4,
        2,
        DEFAULT_PREFERENCES.butterflies.movementSpeed
      ),
      size: clamp(
        butterflies.size,
        0.45,
        1.4,
        DEFAULT_PREFERENCES.butterflies.size
      ),
      fadeCycleMs: Math.round(
        clamp(
          butterflies.fadeCycleMs,
          2500,
          18000,
          DEFAULT_PREFERENCES.butterflies.fadeCycleMs
        )
      ),
      minOpacity: clamp(
        butterflies.minOpacity,
        0,
        0.5,
        DEFAULT_PREFERENCES.butterflies.minOpacity
      ),
      maxOpacity: clamp(
        butterflies.maxOpacity,
        0.35,
        1,
        DEFAULT_PREFERENCES.butterflies.maxOpacity
      )
    }
  }
}

export const useAnimationPreferenceStore = defineStore(
  'animationPreferenceStore',
  () => {
    const preferences = reactive<AnimationPreferences>(
      structuredClone(DEFAULT_PREFERENCES)
    )
    const initialized = ref(false)

    const butterflies = computed(() => preferences.butterflies)
    const startupEffect = computed(() => preferences.startupEffect)

    function persist(): void {
      if (!import.meta.client || !initialized.value) return

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      } catch {
        return
      }
    }

    function applyPreferences(next: AnimationPreferences): void {
      preferences.startupEffect = next.startupEffect
      Object.assign(preferences.butterflies, next.butterflies)
    }

    function initialize(): void {
      if (!import.meta.client || initialized.value) return

      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        applyPreferences(
          sanitizePreferences(stored ? JSON.parse(stored) : null)
        )
      } catch {
        applyPreferences(structuredClone(DEFAULT_PREFERENCES))
      }

      initialized.value = true
      persist()
    }

    function setStartupEffect(value: StartupAnimationChoice): void {
      preferences.startupEffect = sanitizeStartupEffect(value)
      persist()
    }

    function updateButterflies(
      patch: Partial<ButterflyAnimationPreferences>
    ): void {
      const next = sanitizePreferences({
        ...preferences,
        butterflies: {
          ...preferences.butterflies,
          ...patch
        }
      })

      Object.assign(preferences.butterflies, next.butterflies)
      persist()
    }

    function reset(): void {
      applyPreferences(structuredClone(DEFAULT_PREFERENCES))
      initialized.value = true
      persist()
    }

    function resolveStartupEffect(
      availableEffectIds: AnimationEffectId[]
    ): AnimationEffectId | null {
      if (preferences.startupEffect === 'none') return null

      if (preferences.startupEffect === 'random') {
        const index = Math.floor(Math.random() * availableEffectIds.length)
        return availableEffectIds[index] || 'butterfly-animation'
      }

      return availableEffectIds.includes(preferences.startupEffect)
        ? preferences.startupEffect
        : 'butterfly-animation'
    }

    if (import.meta.client) initialize()

    return {
      storageKey: STORAGE_KEY,
      preferences,
      butterflies,
      startupEffect,
      initialized,
      initialize,
      setStartupEffect,
      updateButterflies,
      reset,
      resolveStartupEffect
    }
  }
)
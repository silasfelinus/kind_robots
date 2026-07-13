<!-- /components/screenfx/animation-selector.vue -->
<template>
  <section
    class="flex min-w-0 flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary"
        >
          <Icon name="kind-icon:sparkles" class="h-6 w-6" />
        </span>

        <div class="min-w-0">
          <h2 class="text-lg font-black text-base-content">
            Animation preferences
          </h2>
          <p class="text-xs text-base-content/55">
            Startup effects and butterfly behavior for this browser only.
          </p>
        </div>
      </div>

      <span class="badge badge-outline badge-sm gap-1 border-info/40 text-info">
        <Icon name="kind-icon:save" class="h-3 w-3" />
        local storage
      </span>
    </header>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
      <label class="form-control min-w-0">
        <span class="label-text mb-1 text-xs font-black text-base-content/70">
          Startup animation
        </span>

        <select
          class="select select-bordered w-full rounded-xl bg-base-200"
          :value="preferenceStore.startupEffect"
          @change="setStartupEffect"
        >
          <option value="none">No startup animation</option>
          <option value="random">Randomize available animations</option>
          <option
            v-for="effect in availableEffects"
            :key="effect.id"
            :value="effect.id"
          >
            {{ effect.label }}
          </option>
        </select>
      </label>

      <div class="flex items-end gap-2">
        <button
          class="btn btn-secondary rounded-xl"
          type="button"
          @click="preview"
        >
          <Icon name="kind-icon:play" class="h-4 w-4" />
          Preview
        </button>

        <button
          class="btn btn-ghost rounded-xl border border-base-300"
          type="button"
          @click="preferenceStore.reset()"
        >
          Reset
        </button>
      </div>
    </div>

    <label
      class="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
    >
      <span>
        <span class="block text-sm font-black text-base-content">
          Adaptive guardrails
        </span>
        <span class="block text-xs text-base-content/55">
          Treat your values as maximums and step down only when frames repeatedly
          struggle.
        </span>
      </span>

      <input
        class="toggle toggle-primary shrink-0"
        type="checkbox"
        :checked="settings.adaptive"
        @change="setAdaptive"
      />
    </label>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label
        v-for="control in controls"
        :key="control.key"
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <span class="flex items-center justify-between gap-2 text-xs">
          <span class="font-black text-base-content/70">{{ control.label }}</span>
          <span class="badge badge-ghost badge-sm font-mono">
            {{ formatValue(control.key) }}
          </span>
        </span>

        <input
          class="range range-primary range-xs"
          type="range"
          :min="control.min"
          :max="control.max"
          :step="control.step"
          :value="settings[control.key]"
          @input="setNumber(control.key, $event)"
        />

        <span class="text-[0.68rem] leading-snug text-base-content/45">
          {{ control.help }}
        </span>
      </label>
    </div>

    <footer
      class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-3 text-[0.68rem] text-base-content/45"
    >
      <span>Nothing here is sent to the server or attached to your account.</span>
      <code class="rounded-lg bg-base-200 px-2 py-1">
        {{ preferenceStore.storageKey }}
      </code>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  useAnimationPreferenceStore,
  type ButterflyAnimationPreferences,
  type StartupAnimationChoice
} from '@/stores/animationPreferenceStore'
import { useAnimationStore } from '@/stores/animationStore'

interface RangeControl {
  key: keyof Omit<ButterflyAnimationPreferences, 'adaptive'>
  label: string
  min: number
  max: number
  step: number
  help: string
}

const animationStore = useAnimationStore()
const preferenceStore = useAnimationPreferenceStore()

preferenceStore.initialize()

const settings = computed(() => preferenceStore.butterflies)
const availableEffects = computed(() => {
  return animationStore.safeEffects.filter((effect) => !effect.blocksInput)
})

const controls: RangeControl[] = [
  {
    key: 'count',
    label: 'Butterflies',
    min: 0,
    max: 140,
    step: 1,
    help: 'Maximum visible population.'
  },
  {
    key: 'fps',
    label: 'Frame rate',
    min: 15,
    max: 120,
    step: 5,
    help: 'Motion update ceiling.'
  },
  {
    key: 'flapSpeedMs',
    label: 'Flap speed',
    min: 160,
    max: 1000,
    step: 20,
    help: 'Lower milliseconds flap faster.'
  },
  {
    key: 'movementSpeed',
    label: 'Flight speed',
    min: 0.4,
    max: 2,
    step: 0.05,
    help: 'How quickly butterflies cross the screen.'
  },
  {
    key: 'size',
    label: 'Butterfly size',
    min: 0.45,
    max: 1.4,
    step: 0.05,
    help: 'Base scale before natural variation.'
  },
  {
    key: 'fadeCycleMs',
    label: 'Fade cycle',
    min: 2500,
    max: 18000,
    step: 250,
    help: 'How long each staggered appearance cycle lasts.'
  },
  {
    key: 'minOpacity',
    label: 'Ghost opacity',
    min: 0,
    max: 0.5,
    step: 0.01,
    help: 'How faint butterflies become.'
  },
  {
    key: 'maxOpacity',
    label: 'Tangible opacity',
    min: 0.35,
    max: 1,
    step: 0.01,
    help: 'How solid butterflies become.'
  }
]

function setStartupEffect(event: Event): void {
  const target = event.target as HTMLSelectElement
  preferenceStore.setStartupEffect(target.value as StartupAnimationChoice)
}

function setAdaptive(event: Event): void {
  const target = event.target as HTMLInputElement
  preferenceStore.updateButterflies({ adaptive: target.checked })
}

function setNumber(
  key: keyof Omit<ButterflyAnimationPreferences, 'adaptive'>,
  event: Event
): void {
  const target = event.target as HTMLInputElement
  preferenceStore.updateButterflies({ [key]: Number(target.value) })
}

function formatValue(
  key: keyof Omit<ButterflyAnimationPreferences, 'adaptive'>
): string {
  const value = settings.value[key]

  if (key === 'fps') return `${Math.round(value)} fps`
  if (key === 'flapSpeedMs' || key === 'fadeCycleMs') {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`
  }
  if (key === 'movementSpeed' || key === 'size') return `${value.toFixed(2)}×`
  if (key === 'minOpacity' || key === 'maxOpacity') {
    return `${Math.round(value * 100)}%`
  }

  return `${Math.round(value)}`
}

function preview(): void {
  const effectId = preferenceStore.resolveStartupEffect(
    availableEffects.value.map((effect) => effect.id)
  )

  if (!effectId) {
    animationStore.stop()
    return
  }

  animationStore.start({
    effectId,
    message: `${availableEffects.value.find((effect) => effect.id === effectId)?.label || 'Animation'} preview`,
    durationMs: 6000
  })
}
</script>

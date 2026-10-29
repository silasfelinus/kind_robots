<template>
  <main class="kr-surface">
    <div
      class="kr-scroll mx-auto h-full min-h-0 w-full max-w-6xl space-y-2 p-2 sm:p-3"
    >
      <details class="kr-panel rounded-2xl p-2 sm:p-3">
        <summary
          class="cursor-pointer select-none text-sm font-bold"
          aria-label="Open match setup and training options"
        >
          Match setup &amp; training
        </summary>
        <section class="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <label
            v-for="side in sides"
            :key="side.index"
            class="flex items-center gap-2 text-sm"
          >
            <span class="font-semibold">{{ side.label }}</span>
            <select
              class="kr-select-sm"
              :value="store.fighters[side.index]"
              :aria-label="side.label"
              @change="onFighter(side.index, $event)"
            >
              <option
                v-for="fighter in FIGHTERS"
                :key="fighter.slug"
                :value="fighter.slug"
              >
                {{ fighter.name }}
              </option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <span class="font-semibold">Opponent</span>
            <select
              class="kr-select-sm"
              :value="opponentValue"
              aria-label="Opponent"
              @change="onMode"
            >
              <option
                v-for="level in CPU_LEVELS"
                :key="level"
                :value="`cpu:${level}`"
              >
                CPU · {{ CPU_LEVEL_NAMES[level] }}
              </option>
              <option value="dummy">Training dummy</option>
              <option value="versus">Player 2</option>
              <option
                v-for="level in CPU_LEVELS"
                :key="`arcade-${level}`"
                :value="`arcade:${level}`"
              >
                Story · {{ CPU_LEVEL_NAMES[level] }}
              </option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <span class="font-semibold">Look</span>
            <select
              class="kr-select-sm"
              :value="store.renderStyle"
              aria-label="Look"
              @change="onStyle"
            >
              <option
                v-for="style in RENDER_STYLES"
                :key="style"
                :value="style"
              >
                {{ RENDER_STYLE_NAMES[style] }}
              </option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.easySpecials"
              @change="store.setEasySpecials(checked($event))"
            />
            Easy Specials
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="!store.muted"
              @change="store.setMuted(!checked($event))"
            />
            Sound
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.crt"
              @change="store.setCrt(checked($event))"
            />
            CRT lines
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.showBoxes"
              @change="store.setShowBoxes(checked($event))"
            />
            Hitboxes
          </label>
        </section>

        <section
          v-if="store.mode === 'dummy'"
          class="kr-panel flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl p-4"
          aria-label="Training"
        >
          <span class="font-bold">Training</span>
          <label class="flex items-center gap-2 text-sm">
            <span class="font-semibold">Dummy</span>
            <select
              class="kr-select-sm"
              :value="store.dummy"
              aria-label="Dummy"
              @change="onDummy"
            >
              <option v-for="mode in DUMMY_MODES" :key="mode" :value="mode">
                {{ DUMMY_NAMES[mode] }}
              </option>
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.infiniteMeter"
              @change="store.setInfiniteMeter(checked($event))"
            />
            Infinite meter
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="toggle toggle-sm"
              :checked="store.infiniteHealth"
              @change="store.setInfiniteHealth(checked($event))"
            />
            Health refills
          </label>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="font-semibold">Reset</span>
            <button
              v-for="place in PLACES"
              :key="place.value"
              type="button"
              class="kr-btn-xs"
              @click="store.resetPositions(place.value)"
            >
              {{ place.label }}
            </button>
            <span class="opacity-60">(R repeats the last one)</span>
          </div>
        </section>
      </details>

      <ZuzuShowdownStage />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useZuzuShowdownStore } from '~/stores/zuzuShowdownStore'
import { FIGHTERS } from '~/utils/zuzuShowdown/fighters'
import { CPU_LEVELS, type CpuLevel } from '~/utils/zuzuShowdown/cpu'
import {
  RENDER_STYLES,
  RENDER_STYLE_NAMES,
  type RenderStyle,
} from '~/utils/arcade/display'
import {
  DUMMY_MODES,
  DUMMY_NAMES,
  type DummyMode,
  type TrainingPlace,
} from '~/utils/zuzuShowdown/training'

const store = useZuzuShowdownStore()

const sides = [
  { index: 0 as const, label: 'Player 1' },
  { index: 1 as const, label: 'Player 2' },
]

function onFighter(side: 0 | 1, event: Event) {
  store.setFighter(side, (event.target as HTMLSelectElement).value)
}

function checked(event: Event) {
  return (event.target as HTMLInputElement).checked
}

const CPU_LEVEL_NAMES: Record<CpuLevel, string> = {
  kid: 'Kid',
  normal: 'Normal',
  hard: 'Hard',
  showdown: 'Showdown',
}

const opponentValue = computed(() =>
  store.mode === 'cpu' || store.mode === 'arcade'
    ? `${store.mode}:${store.cpuLevel}`
    : store.mode,
)

function onMode(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const [mode, level] = value.split(':')
  if (level && (mode === 'cpu' || mode === 'arcade')) {
    store.setCpuLevel(level as CpuLevel)
    store.setMode(mode)
  } else store.setMode(value === 'versus' ? 'versus' : 'dummy')
}

const PLACES: Array<{ value: TrainingPlace; label: string }> = [
  { value: 'center', label: 'Centre' },
  { value: 'p1-corner', label: 'P1 in the corner' },
  { value: 'p2-corner', label: 'P2 in the corner' },
]

function onStyle(event: Event) {
  store.setRenderStyle((event.target as HTMLSelectElement).value as RenderStyle)
}

function onDummy(event: Event) {
  store.setDummy((event.target as HTMLSelectElement).value as DummyMode)
}

useSeoMeta(
  gameLinkPreviewMeta('zuzu-showdown', useRuntimeConfig().public.appBaseUrl) ??
    {},
)
useHead({ title: 'Zuzu Showdown' })
</script>

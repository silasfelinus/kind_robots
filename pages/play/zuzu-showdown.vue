<template>
  <main class="kr-surface">
    <div class="kr-scroll kr-container max-w-6xl space-y-4 p-2 sm:p-4 lg:p-6">
      <div v-if="!ready" class="grid place-items-center p-12">
        <span class="kr-spinner-lg-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center"
      >
        <p class="kr-text-black-xl">Administrator access required</p>
        <p class="kr-text-dim-sm mt-2">
          Zuzu Showdown is still in the workshop.
        </p>
      </div>

      <template v-else>
        <ZuzuShowdownStage />

        <section
          class="kr-panel flex flex-wrap gap-x-6 gap-y-3 rounded-2xl p-4"
        >
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
                Arcade · {{ CPU_LEVEL_NAMES[level] }}
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

        <section class="grid gap-4 md:grid-cols-2">
          <div class="kr-panel rounded-2xl p-4 text-sm">
            <h2 class="mb-2 font-bold">Controls</h2>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt class="font-semibold">Player 1</dt>
              <dd>
                WASD (or arrows when solo) · U I punch · J K kick · Space dodge
                · O special · Enter pause
              </dd>
              <dt class="font-semibold">Player 2</dt>
              <dd>
                Arrows · numpad 4 5 punch · 1 2 kick · 0 dodge · 6 special
              </dd>
              <dt class="font-semibold">Gamepad</dt>
              <dd>X Y punch · A B kick · LB dodge · RB special</dd>
              <dt class="font-semibold">Throw</dt>
              <dd>LP + LK up close (press it back to tech)</dd>
              <dt class="font-semibold">Taunt</dt>
              <dd>Dodge + HK</dd>
            </dl>
          </div>
          <div class="kr-panel rounded-2xl p-4 text-sm">
            <h2 class="mb-2 font-bold">{{ p1.name }}'s moves</h2>
            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <template v-for="row in moves" :key="row.id">
                <dt class="font-semibold">{{ row.input }}</dt>
                <dd>
                  {{ row.name }}
                  <span v-if="row.note" class="opacity-60"
                    >({{ row.note }})</span
                  >
                </dd>
              </template>
              <dt class="font-semibold">↓ + HK</dt>
              <dd>Launcher, then hold ↑ to chase into an air combo</dd>
            </dl>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useZuzuShowdownStore } from '~/stores/zuzuShowdownStore'
import { FIGHTERS, findFighter, moveList } from '~/utils/zuzuShowdown/fighters'
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

const userStore = useUserStore()
const store = useZuzuShowdownStore()
const ready = computed(() => userStore.initialized)

const sides = [
  { index: 0 as const, label: 'Player 1' },
  { index: 1 as const, label: 'Player 2' },
]
const p1 = computed(() => findFighter(store.fighters[0]))
const moves = computed(() => moveList(p1.value))

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

useHead({ title: 'Zuzu Showdown' })
</script>

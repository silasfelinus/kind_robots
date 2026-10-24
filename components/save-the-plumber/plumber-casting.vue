<template>
  <div
    class="@container flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-3xl border border-base-300 bg-[#fff3dc] p-3 text-[#1f2d3a] dark:bg-[#2a2236] dark:text-[#fff4e4]"
  >
    <div
      class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @2xl:grid-rows-1"
    >
      <figure
        class="relative min-h-0 overflow-hidden rounded-2xl border-4 border-white dark:border-[#3a3350]"
        :style="{
          background: `radial-gradient(circle at 50% 35%, ${backdrop[0]}, ${backdrop[1]})`,
        }"
      >
        <Transition name="plumber-swap" mode="out-in">
          <PlumberHeroineFace
            :key="heroine.seed"
            :heroine="heroine"
            class="absolute inset-0 h-full w-full"
          />
        </Transition>
      </figure>

      <div class="flex min-h-0 flex-col justify-center gap-3">
        <div>
          <p
            class="text-xs font-black uppercase tracking-[.25em] text-[#d9468f]"
          >
            {{ caption }}
          </p>
          <h3 class="plumber-display text-4xl leading-none @2xl:text-6xl">
            {{ heroine.name }}
          </h3>
        </div>

        <dl class="flex flex-wrap gap-2 text-xs">
          <div
            v-for="trait in traits"
            :key="trait.label"
            class="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold shadow-sm dark:bg-[#3a3350]"
          >
            <span
              v-if="trait.colour"
              class="h-3.5 w-3.5 rounded-full ring-2 ring-black/10"
              :style="{ background: trait.colour }"
            />
            <dt class="opacity-60">{{ trait.label }}</dt>
            <dd>{{ trait.value }}</dd>
          </div>
        </dl>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="btn border-0 bg-[#d9468f] text-white hover:bg-[#c03479] @2xl:btn-lg"
            @click="plumber.setScreen('play')"
          >
            ▶ Choose her in the cabinet
          </button>
          <p v-if="plumber.chosen" class="text-sm opacity-75">
            Saved run: {{ plumber.heroine.name }}, {{ plumber.nextStage }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid shrink-0 grid-cols-8 gap-2" aria-label="Preview a heroine">
      <button
        v-for="(option, i) in PLUMBER_ROSTER"
        :key="option.key"
        type="button"
        :aria-pressed="shown === i"
        :aria-label="`Preview ${option.name}`"
        :title="option.name"
        class="relative aspect-square max-h-20 overflow-hidden rounded-2xl border-[3px] bg-white shadow-sm transition hover:-translate-y-0.5 dark:bg-[#3a3350]"
        :class="
          shown === i
            ? 'border-[#d9468f] ring-4 ring-[#d9468f]/25'
            : 'border-white dark:border-[#3a3350]'
        "
        @pointerenter="previewing = i"
        @focus="previewing = i"
        @click="previewing = i"
      >
        <PlumberHeroineFace
          :heroine="rosterLook(i)"
          face
          class="absolute inset-0 h-full w-full"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSavePlumberStore } from '~/stores/savePlumberStore'
import type { Heroine } from '~/utils/arcade/games/savePlumberHeroine'
import {
  PLUMBER_ROSTER,
  rosterFor,
} from '~/utils/arcade/games/savePlumberRoster'

const plumber = useSavePlumberStore()
const previewing = ref<number | null>(null)
const shown = computed(() => previewing.value ?? plumber.rosterSlot)
const heroine = computed(() =>
  previewing.value === null ? plumber.heroine : rosterLook(previewing.value),
)
const caption = computed(() =>
  previewing.value === null && plumber.chosen
    ? 'Your heroine'
    : member.value.build,
)

const member = computed(() => rosterFor(heroine.value))

const traits = computed(() => [
  { label: 'Build', value: member.value.build, colour: '' },
  { label: 'Special', value: member.value.special.name, colour: '' },
  { label: 'Look', value: member.value.signature, colour: heroine.value.hair },
  { label: 'Workwear', value: '', colour: heroine.value.outfit },
  { label: 'Scarf', value: '', colour: heroine.value.scarf },
])

const backdrop = computed(() => [heroine.value.scarf, heroine.value.outfit])

function rosterLook(index: number): Heroine {
  const m = PLUMBER_ROSTER[index]!
  return { seed: index, name: m.name, roster: m.key, ...m.look }
}
</script>

<style scoped>
.plumber-swap-enter-active,
.plumber-swap-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.plumber-swap-enter-from {
  transform: translateY(14px) scale(0.96);
  opacity: 0;
}

.plumber-swap-leave-to {
  transform: translateY(-10px) scale(1.03);
  opacity: 0;
}
</style>

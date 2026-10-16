<template>
  <div
    class="@container relative overflow-hidden rounded-[2rem] border border-base-content/10 bg-gradient-to-br from-[#fff3dc] via-[#ffe3e0] to-[#dff4ef] p-5 text-[#1f2d3a] shadow-lg sm:p-8 dark:from-[#2a2236] dark:via-[#2c2a3f] dark:to-[#173a3f] dark:text-[#fff4e4]"
  >
    <div
      class="grid items-center gap-6 @2xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)] @4xl:gap-10"
    >
      <figure
        class="relative mx-auto w-full max-w-[300px] -rotate-2 rounded-[1.5rem] border-[6px] border-white bg-white shadow-xl transition-transform duration-300 hover:rotate-0 dark:border-[#3a3350] dark:bg-[#3a3350]"
      >
        <div
          class="relative aspect-[10/11] overflow-hidden rounded-[1rem]"
          :style="{
            background: `radial-gradient(circle at 50% 35%, ${backdrop[0]}, ${backdrop[1]})`,
          }"
        >
          <svg
            viewBox="0 0 200 220"
            class="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <g fill="#fff" opacity=".22">
              <circle
                v-for="i in 7"
                :key="i"
                :cx="20 + i * 26"
                :cy="30 + ((i * 37) % 60)"
                r="3"
              />
            </g>
          </svg>
          <Transition name="plumber-swap" mode="out-in">
            <PlumberHeroineFace
              :key="heroine.seed"
              :heroine="heroine"
              class="absolute inset-0 h-full w-full"
            />
          </Transition>
        </div>
        <figcaption class="px-2 pb-1 pt-3 text-center">
          <p
            class="plumber-display text-2xl leading-tight text-[#1f2d3a] dark:text-white"
          >
            {{ heroine.name }}
          </p>
          <p
            class="text-[11px] font-bold uppercase tracking-widest text-[#1f2d3a]/60 dark:text-white/60"
          >
            {{ caption }}
          </p>
        </figcaption>
      </figure>

      <div class="space-y-4">
        <p class="text-xs font-black uppercase tracking-[.25em] text-[#d9468f]">
          The crew
        </p>
        <h3 class="plumber-display text-4xl leading-none sm:text-5xl">
          Eight heroines. One of them is yours.
        </h3>
        <p class="max-w-xl text-base leading-relaxed opacity-80">
          Each one is hand-painted with her own build, look and run cycle. Press
          Start in the cabinet to choose her, and she stays herself for the
          whole save.
        </p>

        <div
          class="grid grid-cols-4 gap-2 @lg:grid-cols-8"
          aria-label="Preview a heroine"
        >
          <button
            v-for="(option, i) in PLUMBER_ROSTER"
            :key="option.key"
            type="button"
            :aria-pressed="shown === i"
            :aria-label="`Preview ${option.name}`"
            :title="option.name"
            class="group relative aspect-square overflow-hidden rounded-2xl border-[3px] bg-white/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-white/10"
            :class="
              shown === i
                ? 'border-[#d9468f] ring-4 ring-[#d9468f]/25'
                : 'border-white/80 dark:border-white/10'
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

        <dl class="flex flex-wrap gap-2 text-xs">
          <div
            v-for="trait in traits"
            :key="trait.label"
            class="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 font-semibold shadow-sm dark:bg-white/10"
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
          <a
            href="#plumber-play"
            class="plumber-press btn btn-lg border-0 bg-[#d9468f] text-white hover:bg-[#c03479]"
          >
            ▶ Choose her in the cabinet
          </a>
          <p class="text-sm opacity-75">
            {{
              plumber.chosen
                ? `Saved run: ${plumber.heroine.name}, continue from ${plumber.nextStage}.`
                : 'On the heroine select, B picks one at random.'
            }}
          </p>
        </div>

        <div
          class="flex flex-col items-center gap-4 rounded-2xl bg-white/60 p-4 sm:flex-row sm:items-end dark:bg-white/5"
        >
          <svg
            viewBox="0 0 300 120"
            class="h-20 w-48 shrink-0 sm:w-56"
            role="img"
            aria-label="Three different heroines inside identical dashed collision boxes"
          >
            <g
              v-for="(h, i) in lineup"
              :key="h.seed"
              :transform="`translate(${50 + i * 100} 112)`"
            >
              <rect
                :x="-HEROINE_HITBOX.width * 1.55"
                :y="-HEROINE_HITBOX.height * 3.6"
                :width="HEROINE_HITBOX.width * 3.1"
                :height="HEROINE_HITBOX.height * 3.6"
                fill="none"
                stroke="#d9468f"
                stroke-width="2"
                stroke-dasharray="5 4"
                rx="4"
              />
              <g :transform="`scale(${rosterFor(h).scale})`">
                <PlumberHeroineRunner :heroine="h" :running="false" />
              </g>
            </g>
          </svg>
          <p class="text-sm leading-snug">
            <span class="font-bold">Looks are cosmetic.</span>
            Tall or short, every heroine has the same hitbox, the same jump and
            the same odds, so no choice ever makes the game harder.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSavePlumberStore } from '~/stores/savePlumberStore'
import {
  HEROINE_HITBOX,
  type Heroine,
} from '~/utils/arcade/games/savePlumberHeroine'
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
  { label: 'Look', value: member.value.signature, colour: heroine.value.hair },
  { label: 'Workwear', value: '', colour: heroine.value.outfit },
  { label: 'Scarf', value: '', colour: heroine.value.scarf },
])

const backdrop = computed(() => [heroine.value.scarf, heroine.value.outfit])

function rosterLook(index: number): Heroine {
  const m = PLUMBER_ROSTER[index]!
  return { seed: index, name: m.name, roster: m.key, ...m.look }
}

const lineup = [2, 3, 5].map(rosterLook)
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

.plumber-press:active .plumber-die {
  display: inline-block;
  transform: rotate(180deg);
}

.plumber-die {
  display: inline-block;
  font-size: 1.4em;
  line-height: 1;
  transition: transform 0.25s ease;
}

.plumber-press:hover .plumber-die {
  transform: rotate(-20deg);
}
</style>

<template>
  <div class="@container">
    <div class="grid gap-5 @4xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div class="@container min-w-0 space-y-3">
        <div
          class="relative overflow-hidden rounded-[1.75rem] border-4 border-[#e2bc7c] bg-[#0f3446] shadow-[0_18px_40px_-18px_rgba(8,32,44,.8)]"
        >
          <svg
            viewBox="0 0 1000 620"
            xmlns="http://www.w3.org/2000/svg"
            class="block h-auto w-full"
            role="group"
            aria-label="Overworld map of the eight worlds"
            @keydown="onKey"
          >
            <defs>
              <pattern
                id="plumber-map-waves"
                width="60"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M0 20q15-10 30 0t30 0"
                  stroke="#1d5568"
                  stroke-width="2"
                  fill="none"
                />
              </pattern>
              <radialGradient id="plumber-map-vignette" r=".75">
                <stop offset=".6" stop-color="#000" stop-opacity="0" />
                <stop offset="1" stop-color="#000" stop-opacity=".45" />
              </radialGradient>
            </defs>
            <rect width="1000" height="620" fill="#123f52" />
            <rect width="1000" height="620" fill="url(#plumber-map-waves)" />

            <g transform="translate(920 540)" opacity=".7">
              <circle r="34" fill="none" stroke="#e2bc7c" stroke-width="2" />
              <path d="M0-30l7 30-7 30-7-30Z" fill="#e2bc7c" />
              <path d="M0-30l7 30H-7Z" fill="#f5bb83" />
            </g>

            <path
              :d="route"
              stroke="#0b2a37"
              stroke-width="30"
              fill="none"
              stroke-linecap="round"
            />
            <path
              :d="route"
              stroke="#4fa7a6"
              stroke-width="22"
              fill="none"
              stroke-linecap="round"
            />
            <path
              :d="route"
              stroke="#d9f6ec"
              stroke-width="4"
              fill="none"
              stroke-linecap="round"
              opacity=".7"
            />
            <path
              :d="route"
              class="plumber-map-flow"
              stroke="#bff3f1"
              stroke-width="6"
              stroke-dasharray="4 26"
              stroke-linecap="round"
              fill="none"
            />

            <g
              v-for="(world, index) in PLUMBER_WORLDS"
              :key="world.slug"
              :transform="`translate(${nodes[index]![0]} ${nodes[index]![1]})`"
              class="plumber-map-node cursor-pointer outline-none"
              :class="{ 'plumber-map-node--active': index === selected }"
              role="button"
              tabindex="0"
              :aria-label="`World ${world.id}: ${world.name}`"
              :aria-pressed="index === selected"
              @click="select(index)"
              @keydown.enter.prevent="select(index)"
              @keydown.space.prevent="select(index)"
            >
              <ellipse
                cy="34"
                :rx="index === 7 ? 92 : 70"
                ry="16"
                fill="#000"
                opacity=".25"
              />
              <g class="plumber-map-island">
                <ellipse
                  v-if="index === selected"
                  cy="10"
                  :rx="index === 7 ? 104 : 84"
                  :ry="index === 7 ? 50 : 42"
                  fill="none"
                  stroke="#ffe7a8"
                  stroke-width="4"
                  stroke-dasharray="10 8"
                  class="plumber-map-ring"
                />
                <path
                  :d="
                    index === 7
                      ? 'M-86 10q0-30 86-30t86 30l-30 34q-56 18-112 0Z'
                      : 'M-64 10q0-24 64-24t64 24l-22 26q-42 14-84 0Z'
                  "
                  :fill="world.palette.ground"
                />
                <ellipse
                  cy="8"
                  :rx="index === 7 ? 84 : 62"
                  :ry="index === 7 ? 24 : 19"
                  :fill="world.palette.far"
                />
                <g
                  :transform="`translate(0 -14) scale(${index === 7 ? 1.6 : 1.2})`"
                >
                  <PlumberWorldGlyph :world="world" />
                </g>
              </g>
              <g :transform="`translate(${index === 7 ? -78 : -58} -20)`">
                <circle
                  r="17"
                  :fill="world.palette.accent"
                  stroke="#0b2a37"
                  stroke-width="4"
                />
                <text
                  text-anchor="middle"
                  dy="7"
                  font-size="20"
                  font-weight="900"
                  fill="#0b2a37"
                  class="plumber-map-text"
                >
                  {{ world.id }}
                </text>
              </g>
              <text
                text-anchor="middle"
                :y="index === 7 ? 74 : 62"
                font-size="19"
                font-weight="800"
                fill="#fff6df"
                stroke="#0b2a37"
                stroke-width="5"
                paint-order="stroke"
                class="plumber-map-text plumber-map-label"
              >
                {{ world.name }}
              </text>
            </g>

            <g
              :transform="`translate(${nodes[0]![0] + 62} ${nodes[0]![1] - 4})`"
              class="plumber-map-you"
            >
              <g transform="scale(.55)">
                <PlumberHeroineRunner
                  :heroine="plumber.heroine"
                  :running="false"
                />
              </g>
            </g>

            <rect
              width="1000"
              height="620"
              fill="url(#plumber-map-vignette)"
              pointer-events="none"
            />
          </svg>
        </div>

        <div
          class="grid grid-cols-4 gap-2 @lg:grid-cols-8"
          role="tablist"
          aria-label="Choose a world"
        >
          <button
            v-for="(world, index) in PLUMBER_WORLDS"
            :key="world.slug"
            type="button"
            role="tab"
            :aria-selected="index === selected"
            class="group flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2 text-[11px] font-bold leading-tight transition"
            :class="
              index === selected
                ? 'border-[#e2bc7c] bg-[#123f52] text-[#fff6df] shadow-md'
                : 'border-base-content/10 bg-base-200 hover:border-[#e2bc7c]/60'
            "
            @click="select(index)"
          >
            <svg viewBox="-26 -26 52 52" class="h-9 w-9" aria-hidden="true">
              <circle r="25" :fill="world.palette.skyTop" />
              <PlumberWorldGlyph :world="world" />
            </svg>
            <span>World {{ world.id }}</span>
          </button>
        </div>
      </div>

      <article
        class="min-w-0 overflow-hidden rounded-[1.75rem] border border-base-content/10 bg-base-200 shadow-lg"
        aria-live="polite"
      >
        <div class="relative aspect-[16/9] overflow-hidden">
          <PlumberWorldScene
            :key="active.slug"
            :world="active"
            class="absolute inset-0 h-full w-full"
          />
          <PlumberPainted
            :key="active.art"
            :src="active.art"
            :alt="`${active.name} painted vignette`"
          />
          <div
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4 pt-12"
          >
            <p
              class="text-xs font-bold uppercase tracking-[.2em] text-white/80"
            >
              World {{ active.id }} · {{ active.mechanic }}
            </p>
            <h4
              class="plumber-display text-3xl text-white drop-shadow sm:text-4xl"
            >
              {{ active.name }}
            </h4>
          </div>
        </div>
        <div class="space-y-4 p-5">
          <p class="text-base italic opacity-80">{{ active.tagline }}</p>

          <ol class="space-y-2">
            <li
              v-for="stage in active.stages"
              :key="stage.code"
              class="flex items-start gap-3 rounded-xl bg-base-100/70 p-3"
            >
              <span
                class="mt-0.5 grid h-9 w-11 shrink-0 place-items-center rounded-lg font-mono text-sm font-black"
                :style="{
                  background: active.palette.ground,
                  color: active.palette.accent,
                }"
              >
                {{ stage.code }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-bold">{{ stage.name }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    :class="beatClass[stage.beat]"
                    >{{ stage.beat }}</span
                  >
                  <a
                    v-if="stage.playable"
                    href="#plumber-play"
                    class="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-600"
                    >▶ Playable</a
                  >
                </div>
                <p class="text-sm leading-snug opacity-75">{{ stage.idea }}</p>
              </div>
            </li>
          </ol>

          <div
            class="flex items-center gap-3 rounded-xl border-2 border-dashed p-3"
            :style="{ borderColor: active.palette.accent }"
            @pointerenter="bossHurt = true"
            @pointerleave="bossHurt = false"
          >
            <PlumberSheetSprite
              :key="active.boss.name"
              :animation="bossAnimation(active.boss.name)"
              :acting="bossHurt"
              :fps="5"
              class="h-28 w-24 shrink-0"
            />
            <div>
              <p
                class="text-[10px] font-black uppercase tracking-[.2em] text-error"
              >
                World boss
              </p>
              <p class="plumber-display text-xl">{{ active.boss.name }}</p>
              <p class="text-sm leading-snug opacity-75">
                <span class="font-semibold">Read the tell:</span>
                {{ active.boss.tell }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-bold uppercase tracking-wider opacity-60"
              >Locals</span
            >
            <span
              v-for="enemy in active.enemies"
              :key="enemy"
              class="rounded-full bg-base-300 px-2.5 py-1 font-semibold"
              >{{ enemy }}</span
            >
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSavePlumberStore } from '~/stores/savePlumberStore'
import { bossAnimation } from '~/utils/arcade/games/savePlumberAnimations'
import {
  PLUMBER_WORLDS,
  type StageBeat,
} from '~/utils/arcade/games/savePlumberWorlds'

const plumber = useSavePlumberStore()

const selected = ref(0)
const bossHurt = ref(false)
const active = computed(() => PLUMBER_WORLDS[selected.value]!)

const nodes: [number, number][] = [
  [130, 520],
  [350, 480],
  [580, 530],
  [830, 450],
  [660, 320],
  [400, 330],
  [190, 210],
  [700, 120],
]
const route =
  'M130 520C230 560 260 470 350 480S500 560 580 530 760 480 830 450 780 340 660 320 480 300 400 330 170 290 190 210 500 110 700 120'

const beatClass: Record<StageBeat, string> = {
  Introduce: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  Combine: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Subvert: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300',
  Boss: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
}

function select(index: number) {
  selected.value = (index + PLUMBER_WORLDS.length) % PLUMBER_WORLDS.length
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault()
    select(selected.value + 1)
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault()
    select(selected.value - 1)
  }
}
</script>

<style scoped>
.plumber-map-flow {
  animation: plumber-map-flow 1.4s linear infinite;
}

.plumber-map-island {
  transition: transform 0.25s ease;
}

.plumber-map-node:hover .plumber-map-island,
.plumber-map-node:focus-visible .plumber-map-island,
.plumber-map-node--active .plumber-map-island {
  transform: translateY(-6px);
}

.plumber-map-node:focus-visible .plumber-map-island {
  filter: drop-shadow(0 0 8px #ffe7a8);
}

.plumber-map-ring {
  animation: plumber-map-flow 3s linear infinite;
}

.plumber-map-text {
  font-family: 'Lilita One', ui-rounded, ui-sans-serif, system-ui, sans-serif;
  pointer-events: none;
}

.plumber-map-you {
  animation: plumber-map-hop 1.6s ease-in-out infinite;
}

@keyframes plumber-map-flow {
  to {
    stroke-dashoffset: -60;
  }
}

@keyframes plumber-map-hop {
  0%,
  100% {
    transform: translate(192px, 516px);
  }

  50% {
    transform: translate(192px, 504px);
  }
}

@media (max-width: 640px) {
  .plumber-map-label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plumber-map-flow,
  .plumber-map-ring,
  .plumber-map-you {
    animation: none;
  }
}
</style>

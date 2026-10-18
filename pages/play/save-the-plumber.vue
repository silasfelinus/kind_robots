<template>
  <main class="kr-surface plumber-page">
    <div
      class="kr-scroll mx-auto max-w-[1500px] space-y-14 px-3 pb-16 pt-5 sm:px-6"
    >
      <section
        class="plumber-title relative isolate overflow-hidden rounded-[2rem] border-4 border-[#e2bc7c] bg-[#0c2f47] text-[#fff8e5] shadow-[0_30px_60px_-30px_rgba(6,30,44,.9)]"
        aria-label="Save the Plumber title screen"
        @pointermove="onTilt"
        @pointerleave="tilt = { x: 0, y: 0 }"
      >
        <div
          class="absolute inset-x-0 bottom-0 -z-10 h-[400px] md:inset-0 md:h-auto"
        >
          <PlumberTitleScene :heroine="heroine" :tilt="tilt" />
        </div>
        <div
          class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(12,47,71,1)_0%,rgba(12,47,71,.9)_45%,rgba(12,47,71,0)_62%)] md:bg-[linear-gradient(90deg,rgba(8,34,50,.92)_0%,rgba(8,34,50,.6)_40%,rgba(8,34,50,0)_68%)]"
          aria-hidden="true"
        />

        <div
          class="flex min-h-[640px] flex-col justify-start gap-5 px-6 pb-[340px] pt-8 sm:px-10 md:min-h-[600px] md:justify-center md:pb-10 lg:min-h-[640px]"
        >
          <p
            class="w-fit rounded-full border border-amber-100/30 bg-[#0e4255]/80 px-4 py-1 text-[11px] font-bold uppercase tracking-[.22em] text-amber-100 backdrop-blur"
          >
            <span
              class="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 align-middle"
            />
            Work in progress · eight worlds playable, thirty-two stages and the
            rescue
          </p>

          <h2 class="plumber-logo select-none" aria-label="Save the Plumber!">
            <span class="plumber-logo-line">SAVE</span>
            <span class="plumber-logo-the">THE</span>
            <span class="plumber-logo-line plumber-logo-big">PLUMBER!</span>
          </h2>

          <p
            class="max-w-[460px] text-base leading-relaxed text-amber-50/90 sm:text-lg"
          >
            The rivers are running uphill. Your boyfriend went to find out why
            and never came back. Eight strange worlds, one fearless heroine, and
            a very badly behaved waterworks corporation.
          </p>

          <div class="flex flex-wrap gap-3">
            <a
              href="#plumber-play"
              class="plumber-start btn btn-lg border-0 bg-[#ffcf82] text-[#123c44] hover:bg-white"
            >
              ▶ Press Start
            </a>
            <a
              href="#plumber-map"
              class="btn btn-lg border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              World map
            </a>
            <a
              href="#plumber-casting"
              class="btn btn-lg border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              Meet the heroines
            </a>
          </div>

          <dl
            class="grid grid-cols-2 gap-x-6 gap-y-1 pt-1 sm:flex sm:flex-wrap"
          >
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="flex items-baseline gap-2"
            >
              <dt class="sr-only">{{ stat.label }}</dt>
              <dd class="plumber-display text-3xl text-[#ffcf82]">
                {{ stat.value }}
              </dd>
              <span
                class="text-xs font-bold uppercase tracking-widest text-amber-50/70"
                >{{ stat.label }}</span
              >
            </div>
          </dl>
        </div>

        <a
          href="#plumber-casting"
          class="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/30 bg-[#0b2a3a]/75 py-1.5 pl-1.5 pr-4 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#0b2a3a]"
        >
          <span class="h-9 w-9 overflow-hidden rounded-full bg-[#ffcf82]">
            <PlumberHeroineFace :heroine="heroine" face class="h-full w-full" />
          </span>
          <span class="leading-tight">
            <span
              class="block text-[10px] font-bold uppercase tracking-widest text-amber-100/80"
              >Starring</span
            >
            <span class="font-bold">{{ heroine.name }}</span>
          </span>
        </a>
      </section>

      <section aria-labelledby="plumber-prologue" class="space-y-4">
        <header class="max-w-2xl">
          <p class="plumber-kicker">Previously, in the pipes</p>
          <h3
            id="plumber-prologue"
            class="plumber-display text-3xl sm:text-4xl"
          >
            One morning, the water went the wrong way.
          </h3>
        </header>
        <ol class="grid gap-4 md:grid-cols-3">
          <li
            v-for="(panel, index) in prologue"
            :key="panel.caption"
            class="plumber-panel relative overflow-hidden rounded-2xl border-[5px] border-[#1f2d3a] bg-[#1f2d3a] shadow-[6px_6px_0_#e2bc7c]"
            :class="index === 1 ? 'md:translate-y-4' : ''"
          >
            <div
              class="relative aspect-[4/3] overflow-hidden rounded-lg"
              :style="{ background: panel.backdrop }"
            >
              <PlumberWorldScene
                v-if="panel.world"
                :world="panel.world"
                class="absolute inset-0 h-full w-full"
              />
              <PlumberCastPortrait
                v-if="panel.who"
                :who="panel.who"
                class="absolute bottom-0 left-1/2 h-[92%] -translate-x-1/2"
              />
            </div>
            <p
              class="absolute left-3 top-3 max-w-[78%] rounded-md border-2 border-[#1f2d3a] bg-[#fff1c4] px-3 py-1.5 text-sm font-bold leading-snug text-[#1f2d3a] shadow"
            >
              {{ panel.caption }}
            </p>
            <span
              class="plumber-display absolute bottom-2 right-3 text-4xl text-white/90 drop-shadow"
              aria-hidden="true"
              >{{ index + 1 }}</span
            >
          </li>
        </ol>
      </section>

      <section
        id="plumber-map"
        class="scroll-mt-8 space-y-4"
        aria-labelledby="plumber-map-title"
      >
        <header class="flex flex-wrap items-end justify-between gap-3">
          <div class="max-w-2xl">
            <p class="plumber-kicker">The rescue itinerary</p>
            <h3
              id="plumber-map-title"
              class="plumber-display text-3xl sm:text-4xl"
            >
              Eight worlds. Thirty-two stages. All uphill.
            </h3>
            <p class="mt-1 opacity-75">
              Each world teaches a trick, mixes it up, turns it inside out, then
              throws a boss at you. Pick an island to scout it.
            </p>
          </div>
        </header>
        <PlumberWorldMap />
      </section>

      <section
        id="plumber-casting"
        class="scroll-mt-8"
        aria-label="Heroine casting"
      >
        <PlumberCasting />
      </section>

      <section class="space-y-8" aria-labelledby="plumber-cast-title">
        <header class="max-w-2xl">
          <p class="plumber-kicker">Who is who</p>
          <h3
            id="plumber-cast-title"
            class="plumber-display text-3xl sm:text-4xl"
          >
            A plumber worth saving. A villain worth beating.
          </h3>
        </header>

        <div class="grid gap-5 md:grid-cols-2">
          <article
            v-for="member in PLUMBER_CAST"
            :key="member.key"
            class="flex overflow-hidden rounded-[1.75rem] border border-base-content/10 bg-base-200 shadow-md"
          >
            <div
              class="relative w-2/5 shrink-0 overflow-hidden"
              :class="
                member.key === 'teo'
                  ? 'bg-gradient-to-b from-[#9ad9f0] to-[#3f6fd1]'
                  : 'bg-gradient-to-b from-[#463a66] to-[#d99a5a]'
              "
            >
              <PlumberCastPortrait
                :who="member.key"
                class="absolute bottom-0 left-1/2 h-[88%] -translate-x-1/2"
              />
              <PlumberPainted
                :src="member.art"
                :alt="`${member.name} portrait`"
              />
            </div>
            <div class="space-y-2 p-5">
              <p
                class="text-[11px] font-black uppercase tracking-[.2em]"
                :class="member.key === 'teo' ? 'text-info' : 'text-error'"
              >
                {{ member.role }}
              </p>
              <h4 class="plumber-display text-3xl leading-none">
                {{ member.name }}
              </h4>
              <p class="text-sm font-semibold italic opacity-80">
                {{ member.line }}
              </p>
              <p class="text-sm leading-relaxed opacity-75">{{ member.bio }}</p>
            </div>
          </article>
        </div>

        <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div class="space-y-3">
            <h4 class="plumber-display text-2xl">Every enemy is a toy</h4>
            <p class="text-sm opacity-70">
              Fourteen families, each with a tell. Hover or tap one to see its
              move.
            </p>
            <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <li
                v-for="enemy in PLUMBER_ENEMIES"
                :key="enemy.key"
                class="group cursor-pointer rounded-2xl border border-base-content/10 bg-base-200 p-3 transition hover:-translate-y-1 hover:shadow-lg"
                @pointerenter="poked = enemy.key"
                @pointerleave="poked = null"
                @click="poked = poked === enemy.key ? null : enemy.key"
              >
                <div
                  class="mb-2 overflow-hidden rounded-xl bg-gradient-to-b from-[#d6f2ee] to-[#f8e7c9] dark:from-[#1d3c46] dark:to-[#3a3046]"
                >
                  <PlumberSheetSprite
                    v-if="ENEMY_ANIMATIONS[enemy.key]"
                    :animation="ENEMY_ANIMATIONS[enemy.key]!"
                    :acting="poked === enemy.key"
                    class="h-28 w-full"
                  >
                    <PlumberSprite
                      v-if="DRAWN_ENEMIES.has(enemy.key)"
                      :kind="enemy.key"
                      class="h-24 w-24"
                    />
                    <span
                      v-else
                      class="h-14 w-14 animate-pulse rounded-full bg-white/60 dark:bg-white/10"
                    />
                  </PlumberSheetSprite>
                  <div v-else class="grid h-28 place-items-center">
                    <PlumberSprite :kind="enemy.key" class="h-24 w-24" />
                  </div>
                </div>
                <p class="font-bold">{{ enemy.name }}</p>
                <p class="text-xs leading-snug opacity-70">{{ enemy.toy }}</p>
              </li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="plumber-display text-2xl">Three ways to get stronger</h4>
            <ul class="space-y-3">
              <li
                v-for="power in PLUMBER_POWERS"
                :key="power.key"
                class="flex items-center gap-3 rounded-2xl border border-base-content/10 bg-base-200 p-3"
              >
                <div
                  class="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#123f52]"
                >
                  <PlumberSprite :kind="power.key" class="h-16 w-16" />
                </div>
                <div>
                  <p class="font-bold">{{ power.name }}</p>
                  <p class="text-xs leading-snug opacity-70">
                    {{ power.does }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="plumber-play"
        class="scroll-mt-8 overflow-hidden rounded-[2rem] border-4 border-[#e2bc7c] bg-gradient-to-b from-[#0f3446] to-[#0b2433] p-4 text-[#fff6df] shadow-xl sm:p-6"
        aria-labelledby="plumber-play-title"
      >
        <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div class="min-w-0 space-y-3">
            <div class="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p
                  class="text-xs font-bold uppercase tracking-[.22em] text-[#ffcf82]"
                >
                  Worlds 1 to 8 · Bluebell Pipeworks to Stardrain Citadel
                </p>
                <h3
                  id="plumber-play-title"
                  class="plumber-display text-3xl sm:text-4xl"
                >
                  Thirty-two stages, eight bosses
                </h3>
              </div>
              <span
                class="rounded-full border border-white/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80"
              >
                {{
                  plumber.nextStage
                    ? `Saved at ${plumber.nextStage} · ⚙ ${plumber.gearCount}/${plumber.gearTotal} gears`
                    : 'Pick your heroine in the cabinet'
                }}
              </span>
            </div>
            <ArcadeCabinet slug="save-the-plumber" />
          </div>

          <aside class="space-y-4" aria-label="How to play">
            <div class="rounded-2xl bg-white/5 p-5">
              <h4 class="plumber-display mb-3 text-xl">Controls</h4>
              <ul class="space-y-2.5 text-sm">
                <li
                  v-for="control in controls"
                  :key="control.does"
                  class="flex items-center gap-3"
                >
                  <span class="flex gap-1">
                    <kbd
                      v-for="key in control.keys"
                      :key="key"
                      class="plumber-key"
                      >{{ key }}</kbd
                    >
                  </span>
                  <span class="text-white/85">{{ control.does }}</span>
                </li>
              </ul>
            </div>
            <div class="rounded-2xl bg-white/5 p-5">
              <h4 class="plumber-display mb-3 text-xl">Your goals</h4>
              <ul class="space-y-2 text-sm text-white/85">
                <li class="flex gap-2">
                  <span class="text-[#ffcf82]">◆</span> Press Start, then pick
                  one of eight heroines.
                </li>
                <li class="flex gap-2">
                  <span class="text-[#ffcf82]">◆</span> Bop pumpbugs from above,
                  or splash them with your wrench.
                </li>
                <li class="flex gap-2">
                  <span class="text-[#ffcf82]">◆</span> Stun a rivet roller,
                  then kick it into its friends.
                </li>
                <li class="flex gap-2">
                  <span class="text-[#ffcf82]">◆</span> Wrench a valve to open
                  water gates; press down on a pipe to find a secret room.
                </li>
                <li class="flex gap-2">
                  <span class="text-[#ffcf82]">◆</span> Turn the goal valve to
                  clear a stage, and stomp Madame Pressure while she wobbles.
                </li>
              </ul>
            </div>
            <p class="px-1 text-xs leading-relaxed text-white/60">
              The whole campaign is playable, from the Rainy Courtyard to Lady
              Spigot and Teo's rescue. The cabinet saves your heroine and stage
              on this device, so Continue picks up where you left off.
            </p>
          </aside>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSavePlumberStore } from '~/stores/savePlumberStore'
import { ENEMY_ANIMATIONS } from '~/utils/arcade/games/savePlumberAnimations'
import {
  PLUMBER_CAST,
  PLUMBER_ENEMIES,
  PLUMBER_POWERS,
  PLUMBER_STAGE_COUNT,
  PLUMBER_WORLDS,
} from '~/utils/arcade/games/savePlumberWorlds'

const plumber = useSavePlumberStore()
const heroine = computed(() => plumber.heroine)

const tilt = ref({ x: 0, y: 0 })
const poked = ref<string | null>(null)
const DRAWN_ENEMIES = new Set([
  'pumpbug',
  'rivet-roller',
  'umbrella-mite',
  'moss-lantern',
  'glass-gull',
  'cork-crab',
])
let reducedMotion = false

function onTilt(event: PointerEvent) {
  if (reducedMotion || event.pointerType === 'touch') return
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  tilt.value = {
    x: ((event.clientX - box.left) / box.width) * 2 - 1,
    y: ((event.clientY - box.top) / box.height) * 2 - 1,
  }
}

const stats = [
  { value: PLUMBER_WORLDS.length, label: 'Worlds' },
  { value: PLUMBER_STAGE_COUNT, label: 'Stages' },
  { value: PLUMBER_WORLDS.length, label: 'Bosses' },
  { value: 8, label: 'Heroines' },
]

const prologue = [
  {
    caption: 'The rivers of Bluebell started running uphill.',
    world: PLUMBER_WORLDS[0],
    backdrop: '#7fd3d1',
  },
  {
    caption: 'Teo, the local plumber, went to find out why.',
    who: 'teo' as const,
    backdrop: 'radial-gradient(circle at 50% 30%, #bfe3ff, #3f6fd1)',
  },
  {
    caption: 'Lady Spigot took him to her sky-pump. Your move.',
    world: PLUMBER_WORLDS[7],
    backdrop: '#1c2946',
  },
]

const controls = [
  { keys: ['A', '↑'], does: 'Jump (hold for higher)' },
  {
    keys: ['B'],
    does: 'Duck and slide under beams and gliders; in the air, drop fast',
  },
  { keys: ['X'], does: 'Wrench splash: stun, break crates, turn valves' },
  { keys: ['Y'], does: 'Your heroine’s special' },
  {
    keys: ['←', '→'],
    does: 'Move, in boss arenas only (she runs on her own everywhere else)',
  },
]

onMounted(() => {
  reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  if (!document.getElementById('plumber-display-font')) {
    const link = document.createElement('link')
    link.id = 'plumber-display-font'
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Lilita+One&display=swap'
    document.head.appendChild(link)
  }
})

useHead({ title: 'Save the Plumber · Private Arcade' })
</script>

<style>
.plumber-page .plumber-display,
.plumber-page .plumber-logo {
  font-family:
    'Lilita One', ui-rounded, 'Arial Rounded MT Bold', ui-sans-serif, system-ui,
    sans-serif;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.plumber-page .plumber-kicker {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #d9468f;
}
</style>

<style scoped>
.plumber-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 0.86;
  transform: rotate(-3deg);
  transform-origin: left center;
}

.plumber-logo-line {
  font-size: clamp(3.6rem, 9vw, 6.5rem);
  color: #fff3d6;
  -webkit-text-stroke: 3px #0b2a3a;
  paint-order: stroke fill;
  text-shadow:
    0 3px 0 #e2bc7c,
    0 6px 0 #b98a4a,
    0 9px 0 #7c5a2c,
    0 16px 22px rgba(0, 0, 0, 0.45);
}

.plumber-logo-big {
  font-size: clamp(4.4rem, 12vw, 8.6rem);
  color: #ffcf82;
}

.plumber-logo-the {
  margin: 0.25rem 0 0.35rem 0.4rem;
  padding: 0.15rem 1.1rem 0.25rem;
  font-size: clamp(1.4rem, 3vw, 2rem);
  color: #0b2a3a;
  background: linear-gradient(180deg, #8fe3dc, #3fa5a3);
  border: 3px solid #0b2a3a;
  border-radius: 999px;
  box-shadow:
    inset 0 3px 0 rgba(255, 255, 255, 0.55),
    0 4px 0 #0b2a3a;
}

.plumber-start {
  animation: plumber-start 1.6s ease-in-out infinite;
  box-shadow: 0 6px 0 #b98a4a;
}

.plumber-start:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #b98a4a;
}

@keyframes plumber-start {
  0%,
  100% {
    filter: brightness(1);
  }

  50% {
    filter: brightness(1.12) drop-shadow(0 0 14px rgba(255, 207, 130, 0.6));
  }
}

.plumber-key {
  display: inline-grid;
  min-width: 2rem;
  height: 2rem;
  place-items: center;
  padding: 0 0.45rem;
  border-radius: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-bottom-width: 4px;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 800;
  font-size: 0.85rem;
  color: #fff6df;
}

@media (prefers-reduced-motion: reduce) {
  .plumber-start {
    animation: none;
  }
}
</style>

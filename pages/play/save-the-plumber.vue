<template>
  <main class="kr-surface plumber-page">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-2 p-2 sm:p-3"
    >
      <ConsoleTabs
        :model-value="plumber.screen"
        :tabs="screens"
        label="Save the Plumber"
        id-prefix="plumber"
        @update:model-value="plumber.setScreen($event as PlumberScreen)"
      >
        <span
          v-if="plumber.nextStage"
          class="hidden shrink-0 rounded-full border border-base-300 bg-base-200 px-3 py-2 text-xs font-bold @4xl:inline"
        >
          {{ plumber.nextStage }} · {{ plumber.percent }}% · ⚙
          {{ plumber.gearCount }}/{{ plumber.gearTotal }}
        </span>
        <button
          type="button"
          class="btn btn-circle btn-ghost shrink-0 border border-base-300 bg-base-200"
          aria-label="Open the Save the Plumber guide in the sidebar"
          title="How to play"
          @click="navStore.openWorkspaceSheet()"
        >
          <Icon name="kind-icon:question" class="kr-icon-5" />
        </button>
      </ConsoleTabs>

      <section
        v-if="plumber.screen === 'title'"
        id="plumber-title"
        role="tabpanel"
        aria-labelledby="plumber-title-tab"
        class="@container relative isolate flex min-h-0 flex-1 flex-col justify-end overflow-hidden rounded-3xl border-4 border-[#e2bc7c] bg-[#06131e] p-4 text-[#fff8e5] @2xl:justify-center @2xl:p-8"
      >
        <div class="plumber-motion -z-10" aria-hidden="true">
          <img
            :src="poster"
            alt=""
            decoding="async"
            class="plumber-motion-media"
          />
          <video
            v-if="!reducedMotion"
            :key="clipRoot"
            autoplay
            loop
            muted
            playsinline
            preload="metadata"
            :poster="poster"
            class="plumber-motion-media plumber-motion-video"
          >
            <source :src="`${clipRoot}.webm`" type="video/webm" />
            <source :src="`${clipRoot}.mp4`" type="video/mp4" />
          </video>
        </div>

        <div
          v-if="beat === null"
          class="flex max-w-xl flex-col items-start gap-4"
        >
          <h2 class="plumber-logo select-none" aria-label="Save the Plumber!">
            <span class="plumber-logo-line">SAVE</span>
            <span class="plumber-logo-the">THE</span>
            <span class="plumber-logo-line plumber-logo-big">PLUMBER!</span>
          </h2>
          <p class="text-sm leading-relaxed @2xl:text-lg">
            Eight worlds. One fearless heroine. A missing boyfriend. A very
            badly behaved waterworks corporation.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="plumber-start btn border-0 bg-[#ffcf82] text-[#123c44] hover:bg-white @2xl:btn-lg"
              @click="plumber.setScreen('play')"
            >
              ▶ {{ plumber.chosen ? 'Continue' : 'Press Start' }}
            </button>
            <button
              type="button"
              class="btn border-[#e2bc7c] bg-[#0c2f47] text-[#fff8e5] hover:bg-[#123f52] @2xl:btn-lg"
              @click="beat = 0"
            >
              The story ›
            </button>
          </div>
        </div>

        <div
          v-else
          class="flex max-w-xl flex-col gap-3 rounded-2xl border-2 border-[#e2bc7c] bg-[#0c2f47] p-4 @2xl:p-6"
        >
          <p class="text-xs font-black tracking-[.2em] text-[#ffcf82]">
            PROLOGUE · {{ beat + 1 }} / {{ storyBeats.length }}
          </p>
          <h3 class="plumber-display text-2xl leading-tight @2xl:text-4xl">
            {{ storyBeats[beat]!.title }}
          </h3>
          <p class="text-sm leading-relaxed @2xl:text-base">
            {{ storyBeats[beat]!.text }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-sm border-[#e2bc7c] bg-transparent text-[#fff8e5] hover:bg-[#123f52]"
              @click="beat = beat === 0 ? null : beat - 1"
            >
              ‹ Back
            </button>
            <button
              type="button"
              class="btn btn-sm border-0 bg-[#ffcf82] text-[#123c44] hover:bg-white"
              @click="
                beat === storyBeats.length - 1
                  ? plumber.setScreen('play')
                  : (beat = beat + 1)
              "
            >
              {{ beat === storyBeats.length - 1 ? 'Play ▶' : 'Next ›' }}
            </button>
          </div>
        </div>
      </section>

      <section
        v-show="plumber.screen === 'play'"
        id="plumber-play"
        role="tabpanel"
        aria-labelledby="plumber-play-tab"
        class="plumber-stage flex min-h-0 flex-1 flex-col"
      >
        <ArcadeCabinet
          slug="save-the-plumber"
          contained
          :suspended="plumber.screen !== 'play'"
        />
      </section>

      <section
        v-if="plumber.screen === 'map'"
        id="plumber-map"
        role="tabpanel"
        aria-labelledby="plumber-map-tab"
        class="flex min-h-0 flex-1 flex-col"
      >
        <PlumberWorldMap />
      </section>

      <section
        v-if="plumber.screen === 'heroines'"
        id="plumber-casting"
        role="tabpanel"
        aria-labelledby="plumber-heroines-tab"
        class="flex min-h-0 flex-1 flex-col"
      >
        <PlumberCasting />
      </section>

      <section
        v-if="plumber.screen === 'cast'"
        id="plumber-cast"
        role="tabpanel"
        aria-labelledby="plumber-cast-tab"
        class="@container flex min-h-0 flex-1 flex-col gap-2"
      >
        <div class="grid shrink-0 grid-cols-2 gap-2">
          <article
            v-for="member in PLUMBER_CAST"
            :key="member.key"
            class="flex overflow-hidden rounded-2xl border border-base-300 bg-base-200"
          >
            <div
              class="relative aspect-square w-24 shrink-0 overflow-hidden @3xl:w-40"
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
            <div class="min-w-0 space-y-1 p-3">
              <p
                class="text-[11px] font-black uppercase tracking-[.2em]"
                :class="member.key === 'teo' ? 'text-info' : 'text-error'"
              >
                {{ member.role }}
              </p>
              <h3 class="plumber-display text-xl leading-none @3xl:text-3xl">
                {{ member.name }}
              </h3>
              <p class="hidden text-sm font-semibold italic @3xl:block">
                {{ member.line }}
              </p>
            </div>
          </article>
        </div>

        <ul
          class="kr-scroll grid auto-rows-max grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2 rounded-2xl border border-base-300 bg-base-200 p-2"
          aria-label="Enemies and powers"
        >
          <li
            v-for="enemy in PLUMBER_ENEMIES"
            :key="enemy.key"
            class="cursor-pointer rounded-xl bg-base-100 p-2 text-center"
            :title="enemy.toy"
            @pointerenter="poked = enemy.key"
            @pointerleave="poked = null"
            @click="poked = poked === enemy.key ? null : enemy.key"
          >
            <PlumberSheetSprite
              v-if="ENEMY_ANIMATIONS[enemy.key]"
              :animation="ENEMY_ANIMATIONS[enemy.key]!"
              :acting="poked === enemy.key"
              class="h-20 w-full"
            >
              <PlumberSprite
                v-if="DRAWN_ENEMIES.has(enemy.key)"
                :kind="enemy.key"
                class="h-20 w-20"
              />
              <span
                v-else
                class="h-12 w-12 animate-pulse rounded-full bg-base-300"
              />
            </PlumberSheetSprite>
            <div v-else class="grid h-20 place-items-center">
              <PlumberSprite :kind="enemy.key" class="h-20 w-20" />
            </div>
            <p class="truncate text-sm font-bold">{{ enemy.name }}</p>
          </li>
          <li
            v-for="power in PLUMBER_POWERS"
            :key="power.key"
            class="rounded-xl bg-[#123f52] p-2 text-center text-[#fff6df]"
            :title="power.does"
          >
            <div class="grid h-20 place-items-center">
              <PlumberSprite :kind="power.key" class="h-16 w-16" />
            </div>
            <p class="truncate text-sm font-bold">{{ power.name }}</p>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useNavStore } from '~/stores/navStore'
import {
  useSavePlumberStore,
  type PlumberScreen,
} from '~/stores/savePlumberStore'
import { ENEMY_ANIMATIONS } from '~/utils/arcade/games/savePlumberAnimations'
import {
  PLUMBER_CAST,
  PLUMBER_ENEMIES,
  PLUMBER_POWERS,
} from '~/utils/arcade/games/savePlumberWorlds'

const plumber = useSavePlumberStore()
const navStore = useNavStore()

const screens = [
  { key: 'title', label: 'Title', icon: 'kind-icon:sparkles' },
  { key: 'play', label: 'Play', icon: 'kind-icon:play' },
  { key: 'map', label: 'Map', icon: 'kind-icon:map' },
  { key: 'heroines', label: 'Heroines', icon: 'kind-icon:users' },
  { key: 'cast', label: 'Cast', icon: 'kind-icon:star' },
] as const

const poked = ref<string | null>(null)
const DRAWN_ENEMIES = new Set([
  'pumpbug',
  'rivet-roller',
  'umbrella-mite',
  'moss-lantern',
  'glass-gull',
  'cork-crab',
])
const reducedMotion = ref(false)
const beat = ref<number | null>(null)

const storyBeats = [
  {
    title: 'The water went the wrong way.',
    text: 'One morning the rivers of Bluebell began flowing uphill. No rain, no warning and no explanation.',
  },
  {
    title: 'Teo did not come home.',
    text: 'Teo, the local plumber, followed the reversed current to its source. The trail ended at the old pumping works, and so did his last message.',
  },
  {
    title: 'Eight worlds to cross.',
    text: 'Lady Spigot has taken Teo to her sky-pump. The valves are turning, the worlds are changing, and the rescue belongs to you.',
  },
]
const clipRoot = computed(
  () => `/save-the-plumber/maps/world-${beat.value === 2 ? 8 : 1}`,
)
const poster = computed(() => `${clipRoot.value}.webp`)

onMounted(() => {
  reducedMotion.value =
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
</style>

<style scoped>
.plumber-stage :deep(.cabinet-marquee),
.plumber-stage :deep(.cabinet-title-plate),
.plumber-stage :deep(.cabinet-hint) {
  display: none;
}

.plumber-motion {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.plumber-motion::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(6, 19, 30, 0.94) 0%,
      rgba(6, 19, 30, 0.8) 34%,
      rgba(6, 19, 30, 0.2) 78%
    ),
    linear-gradient(0deg, rgba(6, 19, 30, 0.85), transparent 45%);
}

.plumber-motion-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@container (max-width: 42rem) {
  .plumber-motion-media {
    object-position: 62% center;
  }

  .plumber-motion::after {
    background: linear-gradient(
      0deg,
      rgba(6, 19, 30, 0.98) 0%,
      rgba(6, 19, 30, 0.85) 50%,
      rgba(6, 19, 30, 0.15) 100%
    );
  }
}

.plumber-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 0.86;
  transform: rotate(-3deg);
  transform-origin: left center;
}

.plumber-logo-line {
  font-size: clamp(2.6rem, 8cqw, 6rem);
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
  font-size: clamp(3.2rem, 11cqw, 8rem);
  color: #ffcf82;
}

.plumber-logo-the {
  margin: 0.25rem 0 0.35rem 0.4rem;
  padding: 0.15rem 1.1rem 0.25rem;
  font-size: clamp(1.1rem, 2.6cqw, 2rem);
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

@media (prefers-reduced-motion: reduce) {
  .plumber-start {
    animation: none;
  }
}
</style>

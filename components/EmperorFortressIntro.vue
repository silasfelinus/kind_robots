<template>
  <section
    class="eod-intro @container absolute inset-0 z-20 flex flex-col overflow-hidden bg-base-200"
    aria-label="Introduction"
    aria-roledescription="slideshow"
  >
    <Transition name="eod-scene" mode="out-in">
      <div :key="index" class="absolute inset-0" aria-hidden="true">
        <img
          :src="scene.backdrop"
          alt=""
          class="eod-intro-backdrop h-full w-full object-cover"
          :class="scene.figure ? 'eod-intro-dim' : ''"
        />
        <div class="eod-intro-veil absolute inset-0" />
      </div>
    </Transition>

    <header
      class="relative z-10 flex shrink-0 items-center justify-between gap-2 p-3"
    >
      <ol class="flex gap-1.5" aria-label="Scenes">
        <li
          v-for="(entry, i) in SCENES"
          :key="entry.title"
          class="h-1.5 w-6 rounded-full transition-colors"
          :class="i <= index ? 'bg-warning' : 'bg-base-content/25'"
          :aria-current="i === index ? 'step' : undefined"
        >
          <span class="sr-only">{{ entry.title }}</span>
        </li>
      </ol>
      <button
        type="button"
        class="btn btn-ghost btn-xs uppercase tracking-widest"
        @click="emit('done')"
      >
        Skip introduction
      </button>
    </header>

    <div
      class="relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] items-end gap-3 p-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)] @3xl:p-6 @7xl:grid-cols-[minmax(0,1fr)_minmax(28rem,38rem)] @7xl:p-10"
    >
      <figure
        class="pointer-events-none flex h-full min-h-0 items-end justify-center"
      >
        <Transition name="eod-figure" mode="out-in">
          <img
            v-if="scene.figure"
            :key="scene.figure"
            :src="scene.figure"
            :alt="scene.figureAlt"
            class="eod-figure block max-h-56 w-auto object-contain @3xl:h-full @3xl:max-h-none"
          />
          <ul
            v-else-if="scene.cast"
            :key="'cast'"
            class="flex max-h-full flex-wrap items-end justify-center gap-2 @3xl:gap-4"
            aria-label="Your first followers"
          >
            <li
              v-for="member in starters"
              :key="member.id"
              class="flex flex-col items-center gap-1"
            >
              <img
                v-if="member.art"
                :src="member.art"
                :alt="member.name"
                class="eod-figure h-36 w-auto object-contain @3xl:h-72"
              />
              <span
                class="kr-panel px-2 py-0.5 font-serif text-xs @3xl:text-sm"
                >{{ member.name }}</span
              >
            </li>
          </ul>
        </Transition>
      </figure>

      <article class="kr-panel space-y-3 p-4 @3xl:p-5" aria-live="polite">
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.25em] text-warning"
        >
          {{ scene.kicker }}
        </p>
        <h2
          class="font-serif text-2xl font-bold text-warning @3xl:text-3xl @7xl:text-4xl"
        >
          {{ scene.title }}
        </h2>
        <button
          type="button"
          class="block min-h-32 w-full text-left font-serif text-base italic leading-relaxed @3xl:text-lg @7xl:text-xl"
          :aria-label="streaming ? 'Show the whole passage' : 'Passage shown'"
          @click="complete"
        >
          {{ shown }}
        </button>
        <ul
          v-if="scene.rooms && !streaming"
          class="grid grid-cols-1 gap-1 text-sm @xl:grid-cols-2"
        >
          <li
            v-for="room in ROOMS.filter(
              (entry) => entry.id !== 'chronicle' && entry.id !== 'briefing',
            )"
            :key="room.id"
            class="flex items-start gap-2"
          >
            <Icon
              :name="room.icon"
              class="mt-1 h-4 w-4 shrink-0 text-warning"
            />
            <span
              ><strong>{{ room.label }}</strong>
              <span class="block text-xs opacity-75">{{
                ROOM_DUTIES[room.id]
              }}</span></span
            >
          </li>
        </ul>
        <div class="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="index === 0"
            @click="go(index - 1)"
          >
            Back
          </button>
          <button
            v-if="index < SCENES.length - 1"
            type="button"
            class="eod-finish px-5 py-1.5 text-sm"
            @click="next"
          >
            {{ streaming ? 'Show all' : 'Continue' }}
          </button>
          <button
            v-else
            type="button"
            class="eod-finish px-5 py-1.5 text-sm"
            @click="streaming ? complete() : emit('done')"
          >
            {{ streaming ? 'Show all' : 'Begin your reign' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import {
  followerPortrait,
  illustration,
} from '~/utils/emperorOfDust/fortress/castArt'
import { FOLLOWERS } from '~/utils/emperorOfDust/fortress/followers'
import { ROOMS } from '~/utils/emperorOfDust/fortress/rooms'
import type { RoomId } from '~/utils/emperorOfDust/fortress/rooms'

const emit = defineEmits<{ done: [] }>()
const court = useEmperorFortressStore()

type Scene = {
  kicker: string
  title: string
  text: string
  backdrop: string
  figure?: string
  figureAlt?: string
  cast?: boolean
  rooms?: boolean
}

const MAP = '/emperor-of-dust/map/wasteland.webp'
const FORTRESS = '/emperor-of-dust/intro/fortress.webp'

const SCENES: Scene[] = [
  {
    kicker: 'Before Zuzu',
    title: 'The Wasteland',
    text: 'Before the bell stopped ringing, someone had to answer it. Salt flats, rail canyons and little towns built from the bones of an older world. Ten peoples share the dust, and not one of them asked for an emperor.',
    backdrop: MAP,
  },
  {
    kicker: 'Your advisor',
    title: 'Young Komodo',
    text: 'Your Majesty. Congratulations on the crown, and my condolences. I am Komodo. I keep the ledgers, I read the roads, and I will be honest with you whenever I can.',
    backdrop: FORTRESS,
    figure: illustration('npcs', 'young-komodo'),
    figureAlt: 'Young Komodo, the emperor’s advisor',
  },
  {
    kicker: 'Your seat',
    title: 'The Fortress',
    text: 'This is your seat: a fortress of salvage on a red mesa, with the Saltroad at its gate. Five rooms run the kingdom, and every one of them is waiting for you.',
    backdrop: FORTRESS,
    rooms: true,
  },
  {
    kicker: 'A day at court',
    title: 'Every Morning',
    text: 'Each dawn I bring you the reports that came up the roads overnight. Read them closely; the roads are full of talk. Then the petitioners come: mayors, merchants, priests, raiders with manners. Whatever you promise them, they remember.',
    backdrop: FORTRESS,
    figure: illustration('npcs', 'mara-reedbell'),
    figureAlt: 'Mara Reedbell, Mayor of Hollow Bell, waiting to be heard',
  },
  {
    kicker: 'Your people',
    title: 'The Followers',
    text: 'Four souls followed you here. Send one to four of them out on quests that last a day or three. They come back richer, wiser, hurt, or not at all. Mostly, they come back.',
    backdrop: MAP,
    cast: true,
  },
  {
    kicker: 'Fifty days',
    title: 'The Reign Begins',
    text: 'Fifty days, in five acts. When the day’s work is done, press Finish and let the night do the rest. If a day goes badly, the Chronicle can return you to an earlier dawn, though the wasteland never rolls the same way twice. Shall we begin?',
    backdrop: MAP,
    figure: illustration('npcs', 'young-komodo', 'happy'),
    figureAlt: 'Young Komodo, smiling',
  },
]

const ROOM_DUTIES: Partial<Record<RoomId, string>> = {
  throne: 'Hear petitions and make promises',
  quests: 'Send followers into the wasteland',
  barracks: 'Know your people, arm them, heal them',
  market: 'Spend brass on tools and charms',
  map: 'Watch the factions, taxes and borders',
}

const starters = computed(() =>
  FOLLOWERS.filter((def) => def.starter).map((def) => ({
    id: def.id,
    name: def.name,
    art: illustration('followers', def.id) ?? followerPortrait(def.id),
  })),
)

const index = ref(0)
const visible = ref(0)
const scene = computed(() => SCENES[index.value]!)
const shown = computed(() => scene.value.text.slice(0, visible.value))
const streaming = computed(() => visible.value < scene.value.text.length)
let timer: ReturnType<typeof setInterval> | null = null

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function stream() {
  stop()
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (court.textSpeed === 'instant' || reduced) {
    visible.value = scene.value.text.length
    return
  }
  visible.value = 0
  const step = court.textSpeed === 'fast' ? 3 : 1
  timer = setInterval(() => {
    visible.value = Math.min(scene.value.text.length, visible.value + step)
    if (visible.value >= scene.value.text.length) stop()
  }, 22)
}

function complete() {
  stop()
  visible.value = scene.value.text.length
}

function go(to: number) {
  index.value = Math.max(0, Math.min(SCENES.length - 1, to))
}

function next() {
  if (streaming.value) complete()
  else go(index.value + 1)
}

watch(index, stream, { immediate: true })
onBeforeUnmount(stop)
</script>

<style>
.eod .eod-intro-backdrop {
  animation: eod-pan 22s ease-in-out infinite alternate;
  filter: brightness(0.7);
}

.eod .eod-intro-dim {
  filter: brightness(0.62) saturate(0.9) blur(1.5px);
}

.eod .eod-intro-veil {
  background:
    linear-gradient(to bottom, oklch(12% 0.02 255 / 0.6), transparent 25%),
    linear-gradient(to top, oklch(12% 0.02 255 / 0.85), transparent 55%);
}

.eod .eod-scene-enter-active,
.eod .eod-scene-leave-active,
.eod .eod-figure-enter-active,
.eod .eod-figure-leave-active {
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}

.eod .eod-scene-enter-from,
.eod .eod-scene-leave-to {
  opacity: 0;
}

.eod .eod-figure-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.eod .eod-figure-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .eod .eod-intro-backdrop {
    animation: none;
  }
}
</style>

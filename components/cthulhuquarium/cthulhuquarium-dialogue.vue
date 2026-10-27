<!-- Cthulhuquarium: the story is a game scene, not a toast over the shop.
     Non-interactive beats use the entire viewport, and tutorial beats that
     request a tank/shop action remain in a reachable dialogue sheet. -->
<template>
  <Transition name="cq-dialogue">
    <div
      v-if="beat && scene && tankStore.storyShowing"
      class="pointer-events-none fixed z-50"
      :class="
        cinematic
          ? 'inset-0 bg-black'
          : 'inset-x-0 bottom-0 flex justify-center px-2 pb-2 sm:px-4 sm:pb-4'
      "
      role="dialog"
      :aria-modal="cinematic ? true : undefined"
      aria-live="polite"
      :aria-label="`${speakerName} speaks`"
    >
      <div v-if="cinematic" class="cq-vn-stage pointer-events-auto">
        <img
          v-if="plateUrl && !heroPlate"
          :key="plateKey ?? ''"
          :src="plateUrl"
          alt=""
          class="cq-vn-background"
        />
        <div class="cq-vn-atmosphere" aria-hidden="true" />
        <img
          v-if="plateUrl && heroPlate"
          :key="plateKey ?? ''"
          :src="plateUrl"
          :alt="heroAlt"
          class="cq-vn-character"
          :class="isCharlotte ? 'cq-vn-left' : 'cq-vn-right'"
        />
        <img
          v-else-if="portraitUrl"
          :key="portraitUrl ?? beat.pose"
          :src="portraitUrl"
          :alt="`${speakerName}, ${beat.pose}`"
          class="cq-vn-character"
          :class="isCharlotte ? 'cq-vn-left' : 'cq-vn-right'"
        />

        <header class="cq-vn-masthead">
          <span
            class="text-[0.65rem] font-black uppercase tracking-[0.2em] text-teal-200 sm:text-xs"
          >
            Portsmouth · After closing
          </span>
          <h1
            class="font-serif text-3xl font-black leading-none text-white drop-shadow-lg sm:text-5xl"
          >
            Cthulhuquarium
          </h1>
        </header>

        <section
          class="cq-vn-dialogue"
          :aria-label="`${speakerName}'s dialogue`"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <div class="flex items-baseline gap-3">
              <h2
                class="font-serif text-xl font-black text-teal-200 sm:text-2xl"
              >
                {{ speakerName }}
              </h2>
              <span class="text-xs italic text-white/65">{{
                speakerRole
              }}</span>
            </div>
            <span
              class="text-xs font-bold uppercase tracking-widest text-white/55"
            >
              {{ scene.id === 'intro' ? 'A beginning' : 'An encounter' }}
            </span>
          </div>
          <p
            class="cq-vn-line font-serif text-lg leading-relaxed text-white sm:text-2xl"
          >
            {{ beat.text }}
          </p>
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs italic text-white/60">
              {{ isLastBeat ? 'The tank awaits' : 'A story in progress' }}
            </p>
            <button
              type="button"
              class="btn btn-primary min-h-12 min-w-32"
              @click="tankStore.advanceBeat()"
            >
              {{ isLastBeat ? 'Enter aquarium' : 'Continue' }}
              <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
            </button>
          </div>
        </section>
      </div>

      <div
        v-else
        class="pointer-events-auto relative w-full max-w-3xl rounded-2xl border border-base-content/20 bg-base-100/95 p-3 shadow-2xl backdrop-blur"
      >
        <div
          class="flex items-end gap-3"
          :class="isCharlotte ? 'flex-row' : 'flex-row-reverse'"
        >
          <img
            v-if="portraitUrl"
            :key="portraitUrl ?? beat.pose"
            :src="portraitUrl"
            :alt="`${speakerName}, ${beat.pose}`"
            class="cq-portrait -mt-12 h-32 w-24 shrink-0 object-contain object-bottom sm:-mt-20 sm:h-52 sm:w-36"
          />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div class="flex flex-wrap items-baseline gap-2">
              <h2 class="font-serif text-lg font-black">{{ speakerName }}</h2>
              <span class="text-xs italic opacity-60">{{ speakerRole }}</span>
            </div>
            <p class="font-serif text-sm leading-relaxed sm:text-base">
              {{ beat.text }}
            </p>
            <div
              v-if="handover && isLastBeat"
              class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-2"
            >
              <img
                v-if="handoverUrl"
                :src="handoverUrl"
                alt=""
                class="aspect-[16/9] w-24 shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="text-xs uppercase opacity-60">A new background</p>
                <p class="truncate text-sm font-bold">{{ handover.name }}</p>
                <p class="line-clamp-2 font-serif text-xs italic opacity-70">
                  {{ handover.fieldNote }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm min-h-11"
                :disabled="tankStore.backgroundSaving"
                @click="hangHandover"
              >
                Hang it
              </button>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <p v-if="awaitHint" class="mr-auto text-xs italic opacity-70">
                {{ awaitHint }}
              </p>
              <button
                v-if="beat.await"
                type="button"
                class="btn btn-ghost btn-sm min-h-11"
                @click="tankStore.advanceBeat()"
              >
                Skip
              </button>
              <button
                v-else
                type="button"
                class="btn btn-primary btn-sm min-h-11 min-w-24"
                @click="tankStore.advanceBeat()"
              >
                {{ isLastBeat ? 'Return to the tank' : 'Continue' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCthulhuquariumTankStore } from '@/stores/cthulhuquariumTankStore'
import {
  backgroundArt,
  isHeroPlate,
  movingArt,
  plateArt,
  portraitFor,
} from '~/utils/cthulhuquariumArt'
import { prefersReducedMotion } from '~/utils/cthulhuquariumSprites'
import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_CHARACTERS,
  type CanonSpeaker,
} from '~/utils/cthulhuquariumCanon.generated'

const tankStore = useCthulhuquariumTankStore()

const scene = computed(() => tankStore.activeScene)
const beat = computed(() => tankStore.activeBeat)
const isLastBeat = computed(() => tankStore.isLastBeat)
const isCharlotte = computed(() => beat.value?.speaker === 'charlotte')
const speakerName = computed(() =>
  beat.value ? CTHULHUQUARIUM_CHARACTERS[beat.value.speaker].name : '',
)
const speakerRole = computed(() =>
  beat.value ? CTHULHUQUARIUM_CHARACTERS[beat.value.speaker].role : '',
)
const portraitUrl = computed(() =>
  beat.value ? portraitFor(beat.value.speaker, beat.value.pose) : null,
)

// The first encounter and illustrated interstitials fill the viewport.
// Beats asking players to interact with the tank use a small, accessible
// dialogue sheet instead so Feed/Buy/Clean controls remain reachable.
const cinematic = computed(
  () =>
    !!beat.value &&
    !beat.value.focus &&
    !beat.value.await &&
    (scene.value?.id === 'intro' || !!(beat.value.plate ?? scene.value?.plate)),
)
const plateKey = computed(() =>
  cinematic.value ? (beat.value?.plate ?? scene.value?.plate ?? null) : null,
)
const plateUrl = computed(() =>
  plateKey.value
    ? ((prefersReducedMotion() ? null : movingArt(plateKey.value)) ??
      plateArt(plateKey.value))
    : null,
)
const heroPlate = computed(() => isHeroPlate(plateKey.value))
const HERO_SPEAKERS: Record<string, CanonSpeaker> = {
  'charlotte-fishmonger-hero': 'charlotte',
  'wilbur-stint-hero': 'wilbur',
}
const heroAlt = computed(() => {
  const speaker = plateKey.value ? HERO_SPEAKERS[plateKey.value] : undefined
  const who = speaker ? CTHULHUQUARIUM_CHARACTERS[speaker] : undefined
  return who ? `${who.name}, ${who.role}` : ''
})

const handover = computed(() =>
  scene.value?.background
    ? (CTHULHUQUARIUM_BACKGROUNDS.find(
        (entry) => entry.key === scene.value?.background,
      ) ?? null)
    : null,
)
const handoverUrl = computed(() => backgroundArt(handover.value?.key))

const AWAIT_HINTS: Record<string, string> = {
  unlock: 'Choose a free creature in the shop below.',
  feed: 'Press Feed hungriest.',
  clean: 'Press Clean.',
}
const awaitHint = computed(() =>
  beat.value?.await ? (AWAIT_HINTS[beat.value.await] ?? '') : '',
)

async function hangHandover() {
  if (!handover.value) return
  await tankStore.chooseBackground(handover.value.key)
  await tankStore.advanceBeat()
}
</script>

<style scoped>
.cq-vn-stage {
  position: relative;
  isolation: isolate;
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background: radial-gradient(
    ellipse at center 35%,
    #17494f 0%,
    #071a26 65%,
    #050c16 100%
  );
}
.cq-vn-background {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  object-position: center;
}
.cq-vn-atmosphere {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgb(2 13 20 / 0.55) 0%,
    transparent 22%,
    rgb(2 10 19 / 0.25) 52%,
    rgb(2 10 19 / 0.94) 100%
  );
}
.cq-vn-character {
  position: absolute;
  bottom: min(16rem, 25%);
  height: 82%;
  max-width: 96vw;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 1rem 2.5rem rgb(0 0 0 / 0.65));
  animation: cq-portrait-in 0.4s ease-out;
}
.cq-vn-left {
  left: max(1%, calc(50% - 37rem));
}
.cq-vn-right {
  right: max(1%, calc(50% - 37rem));
}
.cq-vn-masthead {
  position: absolute;
  top: max(1.5rem, env(safe-area-inset-top));
  left: clamp(1rem, 5vw, 5rem);
  display: grid;
  gap: 0.35rem;
  filter: drop-shadow(0 0.25rem 0.8rem rgb(0 0 0 / 0.9));
}
.cq-vn-dialogue {
  position: relative;
  z-index: 1;
  display: flex;
  max-height: min(40%, 21rem);
  min-height: 10rem;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  margin: 0 clamp(0.5rem, 4vw, 4rem) max(0.5rem, env(safe-area-inset-bottom));
  padding: clamp(0.9rem, 2vw, 1.5rem);
  border: 1px solid rgb(122 202 208 / 0.55);
  border-radius: 1.3rem;
  background: rgb(5 17 29 / 0.94);
  box-shadow: 0 1rem 4rem rgb(0 0 0 / 0.55);
  backdrop-filter: blur(14px);
}
.cq-vn-line {
  min-height: 0;
  overflow-y: auto;
}
.cq-dialogue-enter-active,
.cq-dialogue-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.cq-dialogue-enter-from,
.cq-dialogue-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}
.cq-portrait {
  animation: cq-portrait-in 0.35s ease-out;
}
@keyframes cq-portrait-in {
  from {
    opacity: 0;
    transform: translateY(0.75rem);
  }
}
@media (max-height: 550px) {
  .cq-vn-dialogue {
    max-height: 50%;
  }
  .cq-vn-character {
    bottom: 20%;
    height: 82%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cq-dialogue-enter-active,
  .cq-dialogue-leave-active,
  .cq-portrait,
  .cq-vn-character {
    animation: none;
    transition: none;
  }
}
</style>

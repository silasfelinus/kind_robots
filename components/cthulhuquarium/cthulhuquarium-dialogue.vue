<!-- Cthulhuquarium: the story is a game scene, not a toast over the shop.
     Every scene beat that does not ask for a tank action is a full-screen,
     staged visual-novel moment (conductor cthulhuquarium/t-103): the scene's
     plate or its floor's room behind, both shopkeepers on stage with the
     speaker lit, the line typed out, and, on a floor-opening scene, the
     player's reply as a hand of cards. Tutorial beats that ask for Feed or
     Buy stay in a reachable sheet so those controls remain usable. -->
<template>
  <!-- Teleported: the site's header bar has its own stacking context above
       the game, and a scene is a modal moment that sits over everything. -->
  <Teleport to="body">
    <Transition name="cq-dialogue">
      <div
        v-if="beat && scene && tankStore.storyShowing"
        class="pointer-events-none fixed z-[80]"
        :class="
          cinematic
            ? 'inset-0 bg-black'
            : 'inset-x-0 bottom-0 flex justify-center px-2 pb-2 sm:px-4 sm:pb-4'
        "
        role="dialog"
        :aria-modal="cinematic ? true : undefined"
        :aria-label="cinematic ? scene.title : `${speakerName} speaks`"
      >
        <div
          v-if="cinematic"
          class="cq-vn-stage pointer-events-auto"
          @click="onStageClick"
        >
          <Transition name="cq-fade">
            <img
              v-if="backdropUrl"
              :key="backdropUrl"
              :src="backdropUrl"
              alt=""
              class="cq-vn-background"
            />
          </Transition>
          <div class="cq-vn-atmosphere" aria-hidden="true" />

          <!-- A character's full-length hero plate, on the intro's two beats. -->
          <img
            v-if="heroUrl"
            :key="heroUrl"
            :src="heroUrl"
            :alt="heroAlt"
            class="cq-vn-character cq-vn-lit"
            :class="isCharlotte ? 'cq-vn-left' : 'cq-vn-right'"
          />
          <template v-else>
            <Transition
              v-for="side in stageSides"
              :key="side.speaker"
              name="cq-pose"
            >
              <img
                v-if="side.url"
                :key="side.url"
                :src="side.url"
                :alt="side.lit ? `${speakerName}, ${beat.pose}` : ''"
                :aria-hidden="side.lit ? undefined : 'true'"
                class="cq-vn-character"
                :class="[
                  side.speaker === 'charlotte' ? 'cq-vn-left' : 'cq-vn-right',
                  side.lit ? 'cq-vn-lit' : 'cq-vn-dim',
                ]"
              />
            </Transition>
          </template>

          <header class="cq-vn-masthead">
            <span class="cq-vn-eyebrow">{{ eyebrow }}</span>
            <h1 class="cq-vn-title">{{ scene.title }}</h1>
          </header>
          <button
            type="button"
            class="cq-vn-skip btn btn-ghost btn-sm min-h-11"
            @click.stop="tankStore.skipScene()"
          >
            {{ tankStore.isReplaying ? 'Close memory' : 'Skip scene' }}
            <kbd class="cq-vn-kbd" aria-hidden="true">Esc</kbd>
          </button>

          <section
            class="cq-vn-dialogue"
            :class="{ 'cq-vn-dialogue-choosing': showChoices }"
            :aria-label="`${speakerName}'s dialogue`"
          >
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                class="cq-vn-name"
                :class="{ 'cq-vn-name-wilbur': !isCharlotte }"
              >
                {{ speakerName }}
              </h2>
              <span class="text-xs italic text-white/65">{{
                speakerRole
              }}</span>
            </div>
            <!-- The whole line for screen readers at once; the typed copy is
               what sighted players watch arrive. -->
            <p class="sr-only" aria-live="polite">{{ beat.text }}</p>
            <p class="cq-vn-line" aria-hidden="true">
              {{ typedText }}<span v-if="!lineDone" class="cq-vn-caret">▍</span>
            </p>

            <div
              v-if="showHandover && handover"
              class="cq-vn-handover"
              @click.stop
            >
              <img
                v-if="handoverUrl"
                :src="handoverUrl"
                alt=""
                class="aspect-[16/9] w-24 shrink-0 rounded-lg object-cover sm:w-32"
              />
              <div class="min-w-0 flex-1">
                <p class="text-xs uppercase tracking-wider text-teal-200/80">
                  A new background
                </p>
                <p class="truncate font-serif text-base font-bold text-white">
                  {{ handover.name }}
                </p>
                <p class="line-clamp-2 font-serif text-xs italic text-white/70">
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

            <div v-if="showChoices" class="cq-vn-choices" @click.stop>
              <kr-choice-hand
                :choices="handChoices"
                question="Your reply"
                :deal-key="`${scene.id}-reply`"
                :animate="!reducedMotion"
                testid-prefix="cq-reply"
                @play="onReply"
              />
            </div>
            <div v-else class="flex items-center justify-between gap-3">
              <p class="text-xs italic text-white/55">
                {{ progressLabel }}
              </p>
              <button
                type="button"
                class="btn btn-primary min-h-12 min-w-32"
                @click.stop="onContinue"
              >
                {{ continueLabel }}
                <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
              </button>
            </div>
          </section>
        </div>

        <div
          v-else
          class="pointer-events-auto relative w-full max-w-3xl rounded-2xl border border-base-content/20 bg-base-100/95 p-3 shadow-2xl backdrop-blur"
          aria-live="polite"
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
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCthulhuquariumTankStore } from '@/stores/cthulhuquariumTankStore'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'
import {
  backgroundArt,
  isHeroPlate,
  movingArt,
  plateArt,
  portraitFor,
} from '~/utils/cthulhuquariumArt'
import { prefersReducedMotion } from '~/utils/cthulhuquariumSprites'
import { floorInfo } from '~/utils/cthulhuquariumFloors'
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
const reducedMotion = ref(false)

// The floor the scene belongs to sets its room; Wilbur's portraits follow the
// deepest floor the player has opened (canon art.floor_variants), so a replay
// of an early scene shows him as he is now.
const sceneFloor = computed(() => scene.value?.floor ?? tankStore.storyFloor)
const portraitFloor = computed(() => tankStore.storyFloor)
const portraitUrl = computed(() =>
  beat.value
    ? portraitFor(beat.value.speaker, beat.value.pose, portraitFloor.value)
    : null,
)

// Every beat that asks for no tank action is staged full-screen. Beats that
// ask players to Feed or Buy use the small sheet so those controls stay
// reachable.
const cinematic = computed(
  () => !!beat.value && !beat.value.focus && !beat.value.await,
)

const plateKey = computed(() =>
  cinematic.value ? (beat.value?.plate ?? scene.value?.plate ?? null) : null,
)
const heroPlate = computed(() => isHeroPlate(plateKey.value))
function stillOrMoving(key: string | null): string | null {
  if (!key) return null
  return (reducedMotion.value ? null : movingArt(key)) ?? plateArt(key)
}
const heroUrl = computed(() =>
  heroPlate.value ? stillOrMoving(plateKey.value) : null,
)
// Behind the characters: the beat's or scene's plate, else the room the
// scene hands over, else the room of the floor it belongs to.
const backdropUrl = computed(() => {
  if (!cinematic.value) return null
  const sceneLevelPlate = heroPlate.value
    ? (scene.value?.plate ?? null)
    : plateKey.value
  return (
    stillOrMoving(sceneLevelPlate) ??
    backgroundArt(scene.value?.background) ??
    backgroundArt(floorInfo(sceneFloor.value).background)
  )
})
const HERO_SPEAKERS: Record<string, CanonSpeaker> = {
  'charlotte-fishmonger-hero': 'charlotte',
  'wilbur-stint-hero': 'wilbur',
}
const heroAlt = computed(() => {
  const speaker = plateKey.value ? HERO_SPEAKERS[plateKey.value] : undefined
  const who = speaker ? CTHULHUQUARIUM_CHARACTERS[speaker] : undefined
  return who ? `${who.name}, ${who.role}` : ''
})

// Both shopkeepers stay on stage once they have spoken in this scene: the
// speaker lit on their own side, the other dimmed on theirs, holding the
// last pose they spoke in.
function lastPoseOf(speaker: CanonSpeaker): string | undefined {
  const spoken = tankStore.spokenBeats
  for (let index = spoken.length - 1; index >= 0; index--) {
    if (spoken[index]?.speaker === speaker) return spoken[index]?.pose
  }
  return undefined
}
const stageSides = computed(() =>
  (['charlotte', 'wilbur'] as const).map((speaker) => {
    const lit = beat.value?.speaker === speaker
    const pose = lit ? beat.value?.pose : lastPoseOf(speaker)
    return {
      speaker,
      lit,
      url: pose ? portraitFor(speaker, pose, portraitFloor.value) : null,
    }
  }),
)

const eyebrow = computed(() => {
  if (tankStore.isReplaying) return 'A memory'
  const floor = scene.value?.floor
  return floor
    ? `Floor ${floorInfo(floor).numeral} · ${floorInfo(floor).name}`
    : 'Portsmouth · After closing'
})

// --- typewriter ------------------------------------------------------------
// About 45 characters a second; the first tap or key finishes the line, the
// next one moves on. Reduced motion shows the line whole.
const CHARS_PER_TICK = 2
const TICK_MS = 40
const revealed = ref(0)
let typeTimer: ReturnType<typeof setInterval> | null = null
const fullText = computed(() => beat.value?.text ?? '')
const lineDone = computed(() => revealed.value >= fullText.value.length)
const typedText = computed(() => fullText.value.slice(0, revealed.value))

function stopTyping() {
  if (typeTimer) clearInterval(typeTimer)
  typeTimer = null
}
function finishLine() {
  stopTyping()
  revealed.value = fullText.value.length
}
function startTyping() {
  stopTyping()
  if (reducedMotion.value || !cinematic.value) {
    revealed.value = fullText.value.length
    return
  }
  revealed.value = 0
  typeTimer = setInterval(() => {
    revealed.value = Math.min(
      fullText.value.length,
      revealed.value + CHARS_PER_TICK,
    )
    if (lineDone.value) stopTyping()
  }, TICK_MS)
}
watch(
  () => [scene.value?.id, beat.value, cinematic.value] as const,
  () => startTyping(),
  { immediate: true },
)

// --- choices, handover, continue -------------------------------------------
const showChoices = computed(
  () => tankStore.activeChoices.length > 0 && lineDone.value,
)
const handChoices = computed<KrHandChoice[]>(() =>
  tankStore.activeChoices.map((choice) => {
    const answer = choice.reply[0]
    return {
      id: choice.id,
      label: choice.label,
      hint: answer
        ? `${CTHULHUQUARIUM_CHARACTERS[answer.speaker].name} answers`
        : undefined,
      image: answer
        ? portraitFor(answer.speaker, answer.pose, portraitFloor.value)
        : null,
      icon: '💬',
    }
  }),
)
function onReply(choice: KrHandChoice) {
  tankStore.chooseReply(choice.id)
}

const handover = computed(() =>
  scene.value?.background
    ? (CTHULHUQUARIUM_BACKGROUNDS.find(
        (entry) => entry.key === scene.value?.background,
      ) ?? null)
    : null,
)
const handoverUrl = computed(() => backgroundArt(handover.value?.key))
const showHandover = computed(
  () =>
    !!handover.value &&
    isLastBeat.value &&
    lineDone.value &&
    !tankStore.isReplaying,
)

const continueLabel = computed(() => {
  if (!lineDone.value) return 'Continue'
  if (isLastBeat.value) {
    return tankStore.isReplaying ? 'Close memory' : 'Return to the tank'
  }
  return 'Continue'
})
const progressLabel = computed(() => {
  if (tankStore.isReplaying) return 'Remembered in the Memory Book'
  return isLastBeat.value ? 'The tank awaits' : 'Tap or press Space'
})

function onContinue() {
  if (!lineDone.value) {
    finishLine()
    return
  }
  if (tankStore.activeChoices.length) return
  void tankStore.advanceBeat()
}

function onStageClick() {
  // Anywhere on the stage finishes the line; moving on needs the button,
  // Space or Enter, so a stray tap never skips a line nobody has read.
  if (!lineDone.value) finishLine()
}

async function hangHandover() {
  if (!handover.value) return
  await tankStore.chooseBackground(handover.value.key)
  await tankStore.advanceBeat()
}

function onKey(event: KeyboardEvent) {
  if (!cinematic.value || !tankStore.storyShowing || !beat.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select')) return
  if (event.key === 'Escape') {
    event.preventDefault()
    void tankStore.skipScene()
    return
  }
  if (event.key === ' ' || event.key === 'Enter') {
    // A focused button (a reply card, Hang it) handles its own key.
    if (target?.closest('button') && lineDone.value) return
    event.preventDefault()
    onContinue()
  }
}

const AWAIT_HINTS: Record<string, string> = {
  unlock: 'Open the Fish market and choose a free creature.',
  feed: 'Press Feed.',
  clean: 'Press Clean.',
}
const awaitHint = computed(() =>
  beat.value?.await ? (AWAIT_HINTS[beat.value.await] ?? '') : '',
)

onMounted(() => {
  reducedMotion.value = prefersReducedMotion()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  stopTyping()
  window.removeEventListener('keydown', onKey)
})
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
    rgb(2 13 20 / 0.6) 0%,
    transparent 22%,
    rgb(2 10 19 / 0.2) 52%,
    rgb(2 10 19 / 0.94) 100%
  );
}
.cq-vn-character {
  position: absolute;
  bottom: min(15rem, 24%);
  height: 78%;
  max-width: 62vw;
  object-fit: contain;
  object-position: bottom;
  filter: drop-shadow(0 1rem 2.5rem rgb(0 0 0 / 0.65));
  transition:
    filter 0.25s ease,
    opacity 0.25s ease,
    transform 0.25s ease;
}
.cq-vn-lit {
  z-index: 1;
  animation: cq-portrait-in 0.35s ease-out;
}
.cq-vn-dim {
  z-index: 0;
  opacity: 0.55;
  filter: brightness(0.45) saturate(0.6)
    drop-shadow(0 1rem 2.5rem rgb(0 0 0 / 0.65));
  transform: scale(0.94);
  transform-origin: bottom center;
}
.cq-vn-left {
  left: max(0%, calc(50% - 38rem));
}
.cq-vn-right {
  right: max(0%, calc(50% - 38rem));
}
.cq-vn-masthead {
  position: absolute;
  z-index: 3;
  top: max(1.25rem, env(safe-area-inset-top));
  left: clamp(1rem, 5vw, 5rem);
  right: 9rem;
  display: grid;
  gap: 0.3rem;
  filter: drop-shadow(0 0.25rem 0.8rem rgb(0 0 0 / 0.9));
}
.cq-vn-eyebrow {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(153 246 228);
}
.cq-vn-title {
  font-family: var(--cq-display, ui-serif, Georgia, serif);
  font-size: clamp(1.6rem, 4.5vw, 3rem);
  font-weight: 900;
  line-height: 1;
  color: white;
}
.cq-vn-skip {
  position: absolute;
  top: max(1rem, env(safe-area-inset-top));
  right: clamp(0.75rem, 3vw, 2.5rem);
  z-index: 2;
  gap: 0.4rem;
  color: rgb(255 255 255 / 0.8);
  background: rgb(5 17 29 / 0.55);
}
.cq-vn-kbd {
  border: 1px solid rgb(255 255 255 / 0.35);
  border-radius: 0.3rem;
  padding: 0 0.3rem;
  font-size: 0.65rem;
}
.cq-vn-dialogue {
  position: relative;
  z-index: 2;
  display: flex;
  max-height: min(46%, 26rem);
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
.cq-vn-name {
  font-family: var(--cq-display, ui-serif, Georgia, serif);
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  font-weight: 900;
  color: rgb(153 246 228);
}
.cq-vn-name-wilbur {
  color: rgb(253 230 138);
}
.cq-vn-line {
  min-height: 3.2em;
  font-family: var(--cq-display, ui-serif, Georgia, serif);
  font-size: clamp(1.05rem, 2.3vw, 1.5rem);
  line-height: 1.55;
  color: white;
}
.cq-vn-caret {
  margin-left: 0.1em;
  opacity: 0.7;
  animation: cq-caret 0.9s steps(2) infinite;
}
.cq-vn-handover {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgb(216 181 106 / 0.5);
  border-radius: 0.9rem;
  background: rgb(10 30 40 / 0.8);
  padding: 0.5rem;
}
.cq-vn-dialogue-choosing {
  max-height: min(78%, 44rem);
}
.cq-vn-choices {
  --hand-card-max: 10rem;
  --hand-card-vh: 22vh;
  --hand-card-cqw: 30cqw;
  flex-shrink: 0;
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
.cq-fade-enter-active,
.cq-fade-leave-active {
  transition: opacity 0.4s ease;
}
.cq-fade-enter-from,
.cq-fade-leave-to {
  opacity: 0;
}
.cq-pose-enter-active,
.cq-pose-leave-active {
  transition: opacity 0.18s ease;
}
.cq-pose-leave-active {
  position: absolute;
}
.cq-pose-enter-from,
.cq-pose-leave-to {
  opacity: 0;
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
@keyframes cq-caret {
  50% {
    opacity: 0;
  }
}
@media (max-height: 550px) {
  .cq-vn-dialogue {
    max-height: 55%;
  }
  .cq-vn-character {
    bottom: 20%;
    height: 80%;
  }
}
@media (max-width: 640px) {
  .cq-vn-character {
    max-width: 70vw;
  }
  .cq-vn-dim {
    opacity: 0.35;
  }
  .cq-vn-masthead {
    right: 7.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cq-dialogue-enter-active,
  .cq-dialogue-leave-active,
  .cq-fade-enter-active,
  .cq-fade-leave-active,
  .cq-pose-enter-active,
  .cq-pose-leave-active,
  .cq-portrait,
  .cq-vn-character,
  .cq-vn-caret {
    animation: none;
    transition: none;
  }
}
</style>

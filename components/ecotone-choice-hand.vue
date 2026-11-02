<!-- /components/ecotone-choice-hand.vue -->
<!--
  ECOTONE'S CHOICES, AS A HAND OF CARDS.

  Silas, 2026-11-02: "When there is a set of choices, I want them to appear as
  a hand of cards that show what can be done. using our card hand style.
  cards can show images of the result."

  Same card-hand language as components/navigation/workspace-hand.vue and
  components/slime-city-hand.vue: portrait 2:3 art cards fanned along the
  bottom edge, hover or focus lifts and enlarges a card, new hands deal in
  face-down and flip over, and a played card flips with a sparkle burst and
  flies up toward the story. Each card's face is the picture of what that
  choice leads to (its outcome art, then the beat's own art, then the drawn
  scene).

  One tap plays, exactly like the old list did (no confirm step; Undo is the
  safety net). The full hint for whichever card is hovered or focused shows
  in the strip above the hand, and every card carries its whole text in its
  aria-label and title, so nothing is only readable on a hover device.

  No touch-action and no :active lift, for the iOS reasons documented in
  workspace-hand.vue.
-->
<template>
  <div
    class="ech"
    data-testid="ecotone-choice-hand"
    :style="{ '--count': options.length }"
  >
    <p class="ech-question">{{ question }}</p>
    <p
      :id="detailId"
      class="ech-detail"
      :class="{ 'is-live': shown }"
      aria-live="polite"
    >
      <template v-if="shown">
        <strong>{{ shown.label }}</strong>
        <span v-for="line in detailLines(shown)" :key="line">{{ line }}</span>
      </template>
    </p>

    <div class="ech-scroll">
      <TransitionGroup
        tag="div"
        name="ech-deal"
        class="ech-fan"
        role="list"
        :aria-label="question"
      >
        <button
          v-for="(option, index) in options"
          :key="`${dealKey}:${option.id}`"
          type="button"
          role="listitem"
          class="ech-card"
          :class="{
            'is-lead': index === 0 && !option.disabled,
            'is-locked': option.disabled,
            'is-playing': playing === option.id,
            'is-focused': focused === option.id,
          }"
          :style="fanStyle(index)"
          :disabled="option.disabled || Boolean(playing)"
          :aria-disabled="option.disabled ? 'true' : undefined"
          :aria-label="ariaFor(option)"
          :aria-describedby="detailId"
          :title="ariaFor(option)"
          :data-testid="`ecotone-choice-${option.id}`"
          @mouseenter="focused = option.id"
          @mouseleave="focused = focused === option.id ? '' : focused"
          @focus="focused = option.id"
          @blur="focused = focused === option.id ? '' : focused"
          @click="play(option)"
        >
          <span class="ech-flip">
            <span class="ech-face ech-front">
              <EcotoneScene
                v-if="option.thumb"
                :kind="option.thumb.scene"
                :art="option.thumb.art"
                :label="option.label"
                class="ech-art"
              />
              <span v-else class="ech-art ech-art-plain" aria-hidden="true" />
              <span v-if="option.perkEligible" class="ech-perk">Perk</span>
              <span class="ech-title">
                <strong>{{ option.label }}</strong>
                <small v-if="option.chip">{{ option.chip }}</small>
              </span>
              <em v-if="option.hint" class="ech-hint">{{ option.hint }}</em>
            </span>
            <span
              class="ech-face ech-back"
              aria-hidden="true"
              :style="backStyle"
            />
          </span>
          <span
            v-if="playing === option.id"
            class="ech-sparkles"
            aria-hidden="true"
          >
            <span
              v-for="n in 10"
              :key="n"
              class="ech-sparkle"
              :style="sparkleStyle(n)"
            />
            <span class="ech-swirl ech-swirl-a" />
            <span class="ech-swirl ech-swirl-b" />
          </span>
        </button>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { SceneKind } from '~/utils/ecotone/content'
import { ecotoneArtSrc } from '~/utils/ecotone/artStyles'

export type EcotoneHandOption = {
  id: string
  label: string
  hint?: string
  chip?: string
  chipTitle?: string
  preview?: string
  possibilities?: string
  disabled?: boolean
  perkEligible?: boolean
  thumb?: { scene: SceneKind; art?: string | string[] }
}

const props = defineProps<{
  options: EcotoneHandOption[]
  question: string
  /** Changes whenever a new hand is dealt, so the cards deal in again. */
  dealKey: string
  artStyle?: unknown
}>()

const emit = defineEmits<{ play: [option: EcotoneHandOption] }>()

const detailId = `ech-${(useId() ?? 'hand').replace(/[^a-zA-Z0-9-]/g, '')}`
const focused = ref('')
const playing = ref('')

const shown = computed(() => {
  const option =
    props.options.find((o) => o.id === playing.value) ??
    props.options.find((o) => o.id === focused.value)
  return option && (option.preview || option.possibilities) ? option : null
})

watch(
  () => props.dealKey,
  () => {
    focused.value = ''
    playing.value = ''
  },
)

const backStyle = computed(() => {
  const url = ecotoneArtSrc('ui/card-back', props.artStyle)
  return url ? { backgroundImage: `url(${url})` } : undefined
})

function detailLines(option: EcotoneHandOption): string[] {
  return [
    option.chip,
    option.perkEligible ? 'Origin perk available' : '',
    option.hint,
    option.preview,
    option.possibilities,
  ].filter((line): line is string => Boolean(line))
}

function ariaFor(option: EcotoneHandOption): string {
  return [option.label, ...detailLines(option)].join('. ')
}

/** Fan like held cards: a gentle arc, centre card highest. */
function fanStyle(index: number): Record<string, string> {
  const n = props.options.length
  const mid = (n - 1) / 2
  const offset = index - mid
  const spread = n <= 3 ? 5 : n <= 5 ? 4 : 2.5
  return {
    '--rot': (offset * spread).toFixed(2) + 'deg',
    '--drop':
      (Math.abs(offset) ** 2 * (n <= 5 ? 0.22 : 0.06)).toFixed(3) + 'rem',
    '--i': String(index),
    // Small hands sit side by side; big ones overlap like a held hand.
    '--overlap':
      n <= 3 ? '0.04' : n === 4 ? '-0.05' : n === 5 ? '-0.14' : '-0.24',
  }
}

const PLAY_MS = 420
let playTimer: ReturnType<typeof setTimeout> | null = null

function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

function play(option: EcotoneHandOption): void {
  if (option.disabled || playing.value) return
  if (reducedMotion()) {
    emit('play', option)
    return
  }
  playing.value = option.id
  if (playTimer) clearTimeout(playTimer)
  playTimer = setTimeout(() => {
    playTimer = null
    emit('play', option)
    playing.value = ''
  }, PLAY_MS)
}

onBeforeUnmount(() => {
  if (playTimer) clearTimeout(playTimer)
})

function sparkleStyle(n: number): Record<string, string> {
  const angle = (n / 10) * Math.PI * 2
  const r = 38 + (n % 3) * 10
  return {
    left: 50 + Math.cos(angle) * r + '%',
    top: 50 + Math.sin(angle) * r * 0.8 + '%',
    animationDelay: n * 22 + 'ms',
  }
}
</script>

<style scoped>
.ech {
  /* Sized from both the board width and the window height, so the hand never
     crowds the story text out of a short laptop screen. */
  --card-w: min(
    clamp(5.75rem, min(10cqw, 18vh), 9.25rem),
    calc((55cqw - 5rem) / (var(--count, 3) * 0.78))
  );
  --card-h: calc(var(--card-w) * 1.5);
  /* Resting cards tuck their lower part below the edge, like a held hand,
     and rise fully into view on hover or focus. */
  --peek: calc(var(--card-h) * 0.3);
  --gold: #d9b877;
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.ech-question {
  overflow: hidden;
  padding: 0 0.25rem;
  color: var(--gold);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
/* The hovered or focused card's full text floats just above its lifted
   position, so it never sits under the cards. */
.ech-detail {
  position: absolute;
  inset: auto 0 calc(var(--card-h) * 1.17 + 1rem);
  z-index: 12;
  max-height: 7.5em;
  overflow: hidden;
  border: 1px solid #d9b87766;
  border-radius: 0.75rem;
  background: #071016f2;
  padding: 0.5rem 0.7rem;
  color: #f3e6c8cc;
  font-size: 0.8rem;
  line-height: 1.35;
  box-shadow: 0 10px 24px #000a;
  pointer-events: none;
}
.ech-detail:not(.is-live) {
  display: none;
}
.ech-detail strong {
  display: block;
  color: #f3e6c8;
  font-family: ui-serif, Georgia, serif;
  font-size: 0.9rem;
}
.ech-detail span + span::before {
  content: ' · ';
  color: #8fb8b0;
}
.ech-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  /* Room above for the lift and enlarge. It overhangs the story, so the
     overhang ignores the pointer and only the cards themselves take clicks. */
  padding-top: calc(var(--peek) + var(--card-w) * 0.45);
  margin-top: calc((var(--peek) + var(--card-w) * 0.45) * -1);
  pointer-events: none;
}
.ech-scroll::-webkit-scrollbar {
  display: none;
}
/* Wide screens tuck the cards below the edge. A scroll box would scroll
   itself to reveal them when one lifts, so clip the paint instead. */
@container (min-width: 64rem) {
  .ech-scroll {
    overflow: visible;
    clip-path: inset(-200rem -200rem 0 -200rem);
  }
}
.ech-fan {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: calc(var(--card-h) - var(--peek));
  min-width: max-content;
  margin-inline: auto;
  padding: 0.35rem 1rem 0;
}
.ech-card {
  --lift: 0rem;
  --scale: 1;
  position: relative;
  flex: none;
  width: var(--card-w);
  margin-inline: calc(var(--card-w) * var(--overlap, 0));
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transform-origin: 50% 120%;
  transform: translateY(calc(var(--drop) - var(--lift))) rotate(var(--rot))
    scale(var(--scale));
  transition:
    transform 0.22s cubic-bezier(0.2, 0.9, 0.25, 1.2),
    filter 0.2s,
    opacity 0.3s;
  perspective: 700px;
  pointer-events: auto;
}
.ech-card:hover:not(:disabled),
.ech-card:focus-visible,
.ech-card.is-focused:not(:disabled) {
  --lift: calc(var(--peek) + 0.6rem);
  --scale: 1.12;
  --rot: 0deg;
  z-index: 10;
}
.ech-card:focus-visible {
  outline: none;
}
.ech-card:focus-visible .ech-front {
  outline: 2px solid var(--gold);
  outline-offset: 3px;
}
.ech-card.is-locked {
  cursor: not-allowed;
  filter: saturate(0.25) brightness(0.6);
}
.ech-card.is-playing {
  --lift: calc(var(--peek) + 7rem);
  --scale: 0.7;
  --rot: 0deg;
  z-index: 11;
  opacity: 0;
  transition:
    transform 0.42s cubic-bezier(0.5, 0, 0.75, 0),
    opacity 0.42s ease-in;
}
.ech-card:disabled:not(.is-locked):not(.is-playing) {
  cursor: default;
}
.ech-flip {
  position: relative;
  display: block;
  transform-style: preserve-3d;
}
.ech-face {
  display: block;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 0.6rem;
}
.ech-front {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  border: 2px solid color-mix(in srgb, var(--gold) 55%, #0000);
  background: #10212e;
  box-shadow:
    0 6px 14px #000a,
    inset 0 0 0 1px #0008;
}
.ech-card.is-lead .ech-front,
.ech-card:hover:not(:disabled) .ech-front,
.ech-card.is-focused:not(:disabled) .ech-front {
  border-color: var(--gold);
  box-shadow:
    0 0 0 1px #d9b87766,
    0 0 18px #d9b87755,
    0 10px 20px #000b;
}
.ech-art {
  position: absolute;
  inset: 0;
}
.ech-art-plain {
  background:
    radial-gradient(circle at 50% 35%, #8fb8b055, transparent 60%),
    linear-gradient(160deg, #1d3a44, #0b1d27);
}
.ech-perk {
  position: absolute;
  bottom: 0.3rem;
  right: 0.3rem;
  z-index: 1;
  border-radius: 999px;
  background: var(--gold);
  padding: 0.05rem 0.4rem;
  color: #09141c;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ech-title {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.4rem 0.45rem 1.4rem;
  background: linear-gradient(#071016f2, #071016cc 60%, transparent);
}
.ech-title strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: #f3e6c8;
  font-family: ui-serif, Georgia, serif;
  font-size: calc(0.68rem * var(--eco-text-scale, 1.2));
  font-weight: 900;
  line-height: 1.15;
}
.ech-title small {
  color: var(--gold);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}
.ech-hint {
  position: absolute;
  inset: auto 0 0;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  padding: 1.2rem 0.45rem 0.4rem;
  background: linear-gradient(transparent, #071016e6 40%);
  color: #f3e6c8cc;
  font-size: 0.56rem;
  font-style: normal;
  line-height: 1.25;
}
.ech-flip .ech-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  border: 2px solid #d9b87799;
  background:
    radial-gradient(circle at 50% 42%, #d9b877 0 12%, transparent 13%),
    repeating-linear-gradient(45deg, #ffffff0d 0 6px, transparent 6px 12px),
    linear-gradient(160deg, #1d3a44, #0b1d27 60%, #071016);
  background-size: cover;
  background-position: center;
}

/* Deal: each new hand arrives face-down and flips over. */
.ech-deal-enter-active {
  transition:
    transform 0.5s cubic-bezier(0.2, 0.9, 0.25, 1.1),
    opacity 0.3s;
  transition-delay: calc(var(--i) * 70ms);
}
.ech-deal-enter-active .ech-flip {
  animation: ech-deal-flip 0.55s calc(var(--i) * 70ms) both
    cubic-bezier(0.4, 0.1, 0.2, 1);
}
.ech-deal-enter-from {
  opacity: 0;
  transform: translate(0, 4rem) rotate(-12deg) scale(0.7);
}
@keyframes ech-deal-flip {
  from {
    transform: rotateY(180deg);
  }
  to {
    transform: rotateY(0deg);
  }
}
.ech-deal-leave-active {
  display: none;
}

/* Play: the chosen card flips with sparkles on its way up to the story. */
.is-playing .ech-flip {
  animation: ech-spin 420ms cubic-bezier(0.4, 0.1, 0.2, 1);
}
@keyframes ech-spin {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
.ech-sparkles {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.ech-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff3cf 0%, transparent 70%);
  box-shadow:
    0 0 6px 2px #d9b877cc,
    0 0 12px 4px #8fb8b099;
  opacity: 0;
  animation: ech-sparkle-pop 420ms ease-out forwards;
}
@keyframes ech-sparkle-pop {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(0deg);
  }
  35% {
    opacity: 1;
    transform: scale(1.4) rotate(90deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.4) rotate(180deg);
  }
}
.ech-swirl {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 2px solid transparent;
  opacity: 0;
}
.ech-swirl-a {
  border-top-color: #d9b877e6;
  border-right-color: #8fb8b0b3;
  animation: ech-swirl 420ms ease-out forwards;
}
.ech-swirl-b {
  inset: 20%;
  border-bottom-color: #8fb8b0e6;
  border-left-color: #d9b87799;
  animation: ech-swirl 420ms ease-out reverse forwards;
}
@keyframes ech-swirl {
  0% {
    opacity: 0;
    transform: rotate(0deg) scale(0.6);
  }
  40% {
    opacity: 1;
    transform: rotate(220deg) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: rotate(420deg) scale(1.3);
  }
}

@container (max-width: 1023px) {
  .ech {
    --card-w: clamp(6.25rem, 24cqw, 8.5rem);
    --peek: 0rem;
  }
}
@container (max-width: 600px) {
  .ech {
    --card-w: clamp(6rem, 30cqw, 7.5rem);
  }
  .ech-fan {
    justify-content: flex-start;
    padding-inline: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ech-card,
  .ech-card.is-playing,
  .ech-deal-enter-active {
    transition: none;
  }
  .ech-deal-enter-active .ech-flip,
  .is-playing .ech-flip {
    animation: none;
  }
  .ech-sparkle,
  .ech-swirl {
    animation: none;
    opacity: 0;
  }
}
</style>

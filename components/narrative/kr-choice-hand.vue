<!-- /components/narrative/kr-choice-hand.vue -->
<!--
  THE SHARED CHOICE HAND — any game's set of choices, as a hand of cards.

  Silas, 2026-11-02, after Ecotone's choices became a hand: "i love this fix
  and i want it as a general interface upgrade for all our relevant games".

  Card-hand language shared with workspace-hand.vue and slime-city-hand.vue:
  portrait 2:3 art cards fanned in an arc; a new hand deals in face down and
  flips over; hover or focus lifts and enlarges a card; a played card flips
  with a sparkle burst and flies up. One tap plays (no confirm step).

  Each game supplies the art through the `art` slot (its own scene or artwork
  component), or a plain `image` URL, or just an `icon` for the drawn
  fallback. Colors come from the daisyUI theme unless the game sets
  --hand-accent / --hand-band / --hand-band-ink / --hand-accent-2 on an
  ancestor. `tuck` (or --hand-tuck: 1 from a container query) lets resting
  cards sit partly below the hand's bottom edge, like a held hand; the
  ancestor that clips them should use overflow: clip, not hidden, so a
  focused card can't scroll it.

  No touch-action and no :active lift, for the iOS reasons documented in
  workspace-hand.vue.
-->
<template>
  <div
    class="krh"
    :class="{ 'is-tucked': tuck }"
    :style="{ '--count': choices.length }"
    data-testid="kr-choice-hand"
  >
    <p v-if="question" class="krh-question">{{ question }}</p>
    <p
      :id="detailId"
      class="krh-detail"
      :class="{ 'is-live': shown }"
      aria-live="polite"
    >
      <template v-if="shown">
        <strong>{{ shown.label }}</strong>
        <span v-for="line in linesOf(shown)" :key="line">{{ line }}</span>
      </template>
    </p>

    <div class="krh-scroll">
      <TransitionGroup
        tag="div"
        name="krh-deal"
        class="krh-fan"
        role="list"
        :aria-label="question || 'Choices'"
      >
        <button
          v-for="(choice, index) in choices"
          :key="`${dealKey}:${choice.id}`"
          type="button"
          role="listitem"
          class="krh-card"
          :class="{
            'is-lead': index === 0 && !choice.disabled,
            'is-locked': choice.disabled,
            'is-playing': playing === choice.id,
            'is-focused': focused === choice.id,
          }"
          :style="fanStyle(index)"
          :disabled="choice.disabled || Boolean(playing)"
          :aria-disabled="choice.disabled ? 'true' : undefined"
          :aria-label="ariaFor(choice)"
          :aria-describedby="detailId"
          :title="ariaFor(choice)"
          :data-testid="`${testidPrefix}-${choice.id}`"
          @mouseenter="focused = choice.id"
          @mouseleave="focused = focused === choice.id ? '' : focused"
          @focus="focused = choice.id"
          @blur="focused = focused === choice.id ? '' : focused"
          @click="play(choice)"
        >
          <span class="krh-flip">
            <span class="krh-face krh-front">
              <span class="krh-art">
                <slot name="art" :choice="choice">
                  <img
                    v-if="choice.image && !failed.includes(choice.id)"
                    :src="choice.image"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    @error="failed.push(choice.id)"
                  />
                  <span v-else class="krh-art-plain" aria-hidden="true">{{
                    choice.icon ?? ''
                  }}</span>
                </slot>
              </span>
              <span v-if="choice.badge" class="krh-badge">{{
                choice.badge
              }}</span>
              <span class="krh-title">
                <strong>{{ choice.label }}</strong>
                <small v-if="choice.chip">{{ choice.chip }}</small>
              </span>
              <em v-if="choice.hint" class="krh-hint">{{ choice.hint }}</em>
            </span>
            <span
              class="krh-face krh-back"
              aria-hidden="true"
              :style="
                backImage ? { backgroundImage: `url(${backImage})` } : undefined
              "
            />
          </span>
          <span
            v-if="playing === choice.id"
            class="krh-sparkles"
            aria-hidden="true"
          >
            <span
              v-for="n in 10"
              :key="n"
              class="krh-sparkle"
              :style="sparkleStyle(n)"
            />
            <span class="krh-swirl krh-swirl-a" />
            <span class="krh-swirl krh-swirl-b" />
          </span>
        </button>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

export type KrHandChoice = {
  id: string
  label: string
  /** Short line under the title: a cost, roll, chapter or "No roll". */
  chip?: string
  /** One or two lines at the bottom of the card. */
  hint?: string
  /** Longer text that only fits in the caption above the lifted card. */
  details?: string[]
  disabled?: boolean
  /** A small corner tag, e.g. "Perk". */
  badge?: string
  /** Picture of the result or subject; the `art` slot overrides it. */
  image?: string | null
  /** Emoji or glyph for the drawn fallback when there is no picture. */
  icon?: string
}

const props = withDefaults(
  defineProps<{
    choices: KrHandChoice[]
    question?: string
    /** Change it whenever a new hand is offered, so the cards deal in again. */
    dealKey?: string
    tuck?: boolean
    backImage?: string | null
    testidPrefix?: string
  }>(),
  {
    question: '',
    dealKey: '',
    tuck: false,
    backImage: null,
    testidPrefix: 'choice-hand',
  },
)

const emit = defineEmits<{ play: [choice: KrHandChoice] }>()

const detailId = `krh-${(useId() ?? 'hand').replace(/[^a-zA-Z0-9-]/g, '')}`
const focused = ref('')
const playing = ref('')
const failed = ref<string[]>([])

const shown = computed(() => {
  const choice =
    props.choices.find((c) => c.id === playing.value) ??
    props.choices.find((c) => c.id === focused.value)
  return choice?.details?.length ? choice : null
})

watch(
  () => props.dealKey,
  () => {
    focused.value = ''
    playing.value = ''
  },
)

function linesOf(choice: KrHandChoice): string[] {
  return [choice.chip, choice.badge, choice.hint, ...(choice.details ?? [])]
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line))
}

function ariaFor(choice: KrHandChoice): string {
  return [choice.label, ...linesOf(choice)].join('. ')
}

/** Fan like held cards: a gentle arc, centre card highest. */
function fanStyle(index: number): Record<string, string> {
  const n = props.choices.length
  const offset = index - (n - 1) / 2
  const spread = n <= 3 ? 5 : n <= 5 ? 4 : 2.5
  return {
    '--rot': (offset * spread).toFixed(2) + 'deg',
    '--drop':
      (Math.abs(offset) ** 2 * (n <= 5 ? 0.22 : 0.06)).toFixed(3) + 'rem',
    '--i': String(index),
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

function play(choice: KrHandChoice): void {
  if (choice.disabled || playing.value) return
  if (reducedMotion()) {
    emit('play', choice)
    return
  }
  playing.value = choice.id
  if (playTimer) clearTimeout(playTimer)
  playTimer = setTimeout(() => {
    playTimer = null
    emit('play', choice)
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
.krh {
  --accent: var(--hand-accent, var(--color-primary, #d9b877));
  --accent-2: var(--hand-accent-2, var(--color-secondary, #8fb8b0));
  --band: var(--hand-band, var(--color-neutral, #071016));
  --band-ink: var(--hand-band-ink, var(--color-neutral-content, #f3e6c8));
  --tuck: var(--hand-tuck, 0);
  /* The hand measures itself, so cards always fit its width without a
     scrollbar, and stay modest on short screens. */
  --card-w: min(
    clamp(5.5rem, min(36cqw, 18vh), var(--hand-card-max, 9.25rem)),
    calc((100cqw - 2rem) / (var(--count, 3) * 0.8))
  );
  --card-h: calc(var(--card-w) * 1.5);
  --peek: calc(var(--card-h) * 0.3 * var(--tuck));
  container-type: inline-size;
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.krh.is-tucked {
  --tuck: 1;
}
.krh-question {
  overflow: hidden;
  padding: 0 0.25rem;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
/* A hovered or focused card's longer text floats just above its lifted
   position, so it never sits under the cards. */
.krh-detail {
  position: absolute;
  inset: auto 0 calc(var(--card-h) * 1.17 + 1rem);
  z-index: 12;
  max-height: 7.5em;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--accent) 45%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in oklab, var(--band) 95%, transparent);
  padding: 0.5rem 0.7rem;
  color: color-mix(in oklab, var(--band-ink) 82%, transparent);
  font-size: 0.8rem;
  line-height: 1.35;
  box-shadow: 0 10px 24px #000a;
  pointer-events: none;
}
.krh-detail:not(.is-live) {
  display: none;
}
.krh-detail strong {
  display: block;
  color: var(--band-ink);
  font-size: 0.9rem;
}
.krh-detail span + span::before {
  content: ' · ';
  color: var(--accent-2);
}
/* Room above for the lift. It overhangs whatever sits above the hand, so the
   overhang ignores the pointer and only the cards take clicks. The bottom is
   clipped by paint (clip-path), never by a scroll box, which would scroll
   itself to reveal a tucked card when one lifts or takes focus. */
.krh-scroll {
  padding-top: calc(var(--peek) + var(--card-w) * 0.45);
  margin-top: calc((var(--peek) + var(--card-w) * 0.45) * -1);
  clip-path: inset(-200rem -200rem 0 -200rem);
  pointer-events: none;
}
.krh-fan {
  box-sizing: content-box;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: calc(var(--card-h) - var(--peek));
  padding: 0.35rem 1rem calc(var(--card-w) * 0.16 * (1 - var(--tuck)));
}
.krh-card {
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
.krh-card:hover:not(:disabled),
.krh-card:focus-visible,
.krh-card.is-focused:not(:disabled) {
  --lift: calc(var(--peek) + 0.6rem);
  --scale: 1.12;
  --rot: 0deg;
  z-index: 10;
}
.krh-card:focus-visible {
  outline: none;
}
.krh-card:focus-visible .krh-front {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
.krh-card.is-locked {
  cursor: not-allowed;
  filter: saturate(0.25) brightness(0.6);
}
.krh-card.is-playing {
  --lift: calc(var(--peek) + 7rem);
  --scale: 0.7;
  --rot: 0deg;
  z-index: 11;
  opacity: 0;
  transition:
    transform 0.42s cubic-bezier(0.5, 0, 0.75, 0),
    opacity 0.42s ease-in;
}
.krh-card:disabled:not(.is-locked):not(.is-playing) {
  cursor: default;
}
.krh-flip {
  position: relative;
  display: block;
  transform-style: preserve-3d;
}
.krh-face {
  display: block;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 0.6rem;
}
.krh-front {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  border: 2px solid color-mix(in oklab, var(--accent) 55%, transparent);
  background: var(--band);
  box-shadow:
    0 6px 14px #000a,
    inset 0 0 0 1px #0008;
}
.krh-card.is-lead .krh-front,
.krh-card:hover:not(:disabled) .krh-front,
.krh-card.is-focused:not(:disabled) .krh-front {
  border-color: var(--accent);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--accent) 40%, transparent),
    0 0 18px color-mix(in oklab, var(--accent) 33%, transparent),
    0 10px 20px #000b;
}
.krh-art {
  position: absolute;
  inset: 0;
  display: block;
}
.krh-art > :deep(*) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.krh-art img,
.krh-art :deep(img) {
  object-fit: cover;
}
.krh-art-plain {
  display: grid;
  place-items: center;
  padding-bottom: 15%;
  background:
    radial-gradient(
      circle at 50% 40%,
      color-mix(in oklab, var(--accent-2) 35%, transparent),
      transparent 60%
    ),
    linear-gradient(
      160deg,
      color-mix(in oklab, var(--accent-2) 30%, var(--band)),
      var(--band)
    );
  font-size: calc(var(--card-w) * 0.38);
  line-height: 1;
}
.krh-badge {
  position: absolute;
  bottom: 0.3rem;
  right: 0.3rem;
  z-index: 1;
  border-radius: 999px;
  background: var(--accent);
  padding: 0.05rem 0.4rem;
  color: var(--band);
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.krh-title {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.4rem 0.45rem 1.4rem;
  background: linear-gradient(
    color-mix(in oklab, var(--band) 95%, transparent),
    color-mix(in oklab, var(--band) 80%, transparent) 60%,
    transparent
  );
}
.krh-title strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--band-ink);
  font-size: calc(0.68rem * var(--hand-text-scale, 1.2));
  font-weight: 900;
  line-height: 1.15;
}
.krh-title small {
  color: var(--accent);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}
.krh-hint {
  position: absolute;
  inset: auto 0 0;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  padding: 1.2rem 0.45rem 0.4rem;
  background: linear-gradient(
    transparent,
    color-mix(in oklab, var(--band) 90%, transparent) 40%
  );
  color: color-mix(in oklab, var(--band-ink) 80%, transparent);
  font-size: 0.56rem;
  font-style: normal;
  line-height: 1.25;
}
.krh-flip .krh-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
  border: 2px solid color-mix(in oklab, var(--accent) 60%, transparent);
  background:
    radial-gradient(circle at 50% 42%, var(--accent) 0 12%, transparent 13%),
    repeating-linear-gradient(45deg, #ffffff0d 0 6px, transparent 6px 12px),
    linear-gradient(
      160deg,
      color-mix(in oklab, var(--accent-2) 25%, var(--band)),
      var(--band)
    );
  background-size: cover;
  background-position: center;
}

.krh-deal-enter-active {
  transition:
    transform 0.5s cubic-bezier(0.2, 0.9, 0.25, 1.1),
    opacity 0.3s;
  transition-delay: calc(var(--i) * 70ms);
}
.krh-deal-enter-active .krh-flip {
  animation: krh-deal-flip 0.55s calc(var(--i) * 70ms) both
    cubic-bezier(0.4, 0.1, 0.2, 1);
}
.krh-deal-enter-from {
  opacity: 0;
  transform: translate(0, 4rem) rotate(-12deg) scale(0.7);
}
@keyframes krh-deal-flip {
  from {
    transform: rotateY(180deg);
  }
  to {
    transform: rotateY(0deg);
  }
}
.krh-deal-leave-active {
  display: none;
}

.is-playing .krh-flip {
  animation: krh-spin 420ms cubic-bezier(0.4, 0.1, 0.2, 1);
}
@keyframes krh-spin {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
.krh-sparkles {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.krh-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff7df 0%, transparent 70%);
  box-shadow:
    0 0 6px 2px color-mix(in oklab, var(--accent) 80%, transparent),
    0 0 12px 4px color-mix(in oklab, var(--accent-2) 60%, transparent);
  opacity: 0;
  animation: krh-sparkle-pop 420ms ease-out forwards;
}
@keyframes krh-sparkle-pop {
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
.krh-swirl {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 2px solid transparent;
  opacity: 0;
}
.krh-swirl-a {
  border-top-color: var(--accent);
  border-right-color: var(--accent-2);
  animation: krh-swirl 420ms ease-out forwards;
}
.krh-swirl-b {
  inset: 20%;
  border-bottom-color: var(--accent-2);
  border-left-color: var(--accent);
  animation: krh-swirl 420ms ease-out reverse forwards;
}
@keyframes krh-swirl {
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

@media (prefers-reduced-motion: reduce) {
  .krh-card,
  .krh-card.is-playing,
  .krh-deal-enter-active {
    transition: none;
  }
  .krh-deal-enter-active .krh-flip,
  .is-playing .krh-flip {
    animation: none;
  }
  .krh-sparkle,
  .krh-swirl {
    animation: none;
    opacity: 0;
  }
}
</style>

<!-- /components/slime-city-hand.vue -->
<!--
  THE HAND, ON THE FLOOR OF THE ARENA.

  Silas, 2026-11-01, on the arena sidebar list of cards: "it's funny that we
  have a custom card hand style effect that we've used for things like
  storybook, but when it came time to have an actual CCG we didn't use it. We
  need card animations, there obviously should be the hand of cards at the
  bottom of the screen."

  So this borrows the workspace hand's language (components/navigation/
  workspace-hand.vue): portrait 2:3 art cards sitting on the bottom edge,
  hover lifts and enlarges a card, and a selection gets the same flip with
  sparkle and swirl burst. On top of that a card game needs three motions the
  nav hand never did: cards DEAL in face-down and flip over, a PLAYED card
  flies up toward the board, and the hand FANS so it reads as held cards.

  No touch-action and no :active lift, for the same iOS reasons documented in
  workspace-hand.vue.
-->
<template>
  <div
    class="sch"
    :class="'tone-' + lab.team.color"
    data-testid="slime-hand"
    :aria-label="
      lab.mode === 'blackout' ? 'Your four-card hand' : 'Arcade card rack'
    "
  >
    <div
      v-if="lab.mode === 'blackout'"
      class="sch-pile"
      data-testid="slime-deck-count"
      :title="
        'Draw pile ' +
        lab.match.piles.player.length +
        ' · discard ' +
        lab.match.discards.player.length +
        ' · next deal on END ROUND'
      "
    >
      <span class="sch-back sch-back-stack" aria-hidden="true"></span>
      <b>{{ lab.match.piles.player.length }}</b>
      <small>DECK</small>
    </div>

    <div class="sch-mana" :title="lab.match.mana + ' mana available'">
      <b>{{ lab.match.mana }}</b>
      <small>MANA</small>
    </div>

    <div class="sch-scroll">
      <TransitionGroup
        tag="div"
        name="sch-deal"
        class="sch-fan"
        :style="{ '--count': cards.length }"
      >
        <button
          v-for="(card, index) in cards"
          :key="card.id"
          type="button"
          class="sch-card"
          :class="{
            selected: lab.selectedCard === card.id,
            unavailable: card.cost > lab.match.mana || !lab.ready(card.id),
            spent: !lab.ready(card.id),
            'is-flipping': flipping === card.id,
          }"
          :style="fanStyle(index)"
          :data-testid="'slime-card-' + card.id"
          :aria-pressed="lab.selectedCard === card.id"
          :aria-label="
            card.name + ', ' + card.kind + ', costs ' + card.cost + ' mana'
          "
          @click="pick(card.id)"
        >
          <span class="sch-flip">
            <span class="sch-face sch-front">
              <SlimeCityArtwork
                class="sch-art"
                :image-id="slimeArtId('cards', card.id)"
                :alt="card.name + ' card art'"
                :fallback="card.symbol"
                compact
              />
              <b class="sch-cost">{{ card.cost }}</b>
              <span class="sch-label">
                <strong>{{ card.name }}</strong>
                <small>{{ card.kind }}</small>
              </span>
              <i v-if="!lab.ready(card.id)" class="sch-used">USED</i>
            </span>
            <span class="sch-face sch-back" aria-hidden="true"></span>
          </span>
          <span
            v-if="flipping === card.id"
            class="sch-sparkles"
            aria-hidden="true"
          >
            <span
              v-for="n in 10"
              :key="n"
              class="sch-sparkle"
              :style="sparkleStyle(n)"
            />
            <span class="sch-swirl sch-swirl-a" />
            <span class="sch-swirl sch-swirl-b" />
          </span>
        </button>
      </TransitionGroup>
    </div>

    <div
      v-if="lab.mode === 'blackout'"
      class="sch-pile sch-discard"
      :title="lab.match.discards.player.length + ' in the discard pile'"
    >
      <span class="sch-back" aria-hidden="true"></span>
      <b>{{ lab.match.discards.player.length }}</b>
      <small>DISCARD</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId } from '~/utils/slimeCity/artManifest'

const lab = useSlimeCityStore()

const cards = computed(() => (lab.mode === 'blackout' ? lab.hand : lab.cards))

/** Fan the hand like held cards: a gentle arc, centre card highest. */
function fanStyle(index: number): Record<string, string> {
  const n = cards.value.length
  const mid = (n - 1) / 2
  const offset = index - mid
  // A full four-card hand fans wider than a ten-card arcade rack.
  const spread = n <= 5 ? 6 : 2.5
  return {
    '--rot': (offset * spread).toFixed(2) + 'deg',
    '--drop':
      (Math.abs(offset) ** 2 * (n <= 5 ? 0.18 : 0.022)).toFixed(3) + 'rem',
    '--i': String(index),
    // Big racks overlap like a held hand instead of scrolling off-screen.
    '--overlap': n <= 5 ? '-0.06' : '-0.24',
  }
}

const FLIP_MS = 650
const flipping = ref('')
let flipTimer: ReturnType<typeof setTimeout> | null = null

function pick(id: string): void {
  const choosing = lab.selectedCard !== id
  lab.chooseCard(id)
  if (!choosing) return
  flipping.value = id
  if (flipTimer) clearTimeout(flipTimer)
  flipTimer = setTimeout(() => {
    flipping.value = ''
  }, FLIP_MS)
}

onBeforeUnmount(() => {
  if (flipTimer) clearTimeout(flipTimer)
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
.sch {
  --card-w: clamp(4.6rem, 9cqw, 7.4rem);
  position: relative;
  z-index: 4;
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  padding: 0.35rem 0.75rem 0.45rem;
  background: linear-gradient(#0b111b00, #0b111bee 40%);
}
.sch-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  /* Room above for the lift and enlarge. It overhangs the board, so the
     overhang ignores the pointer and only the cards themselves take clicks. */
  padding-top: calc(var(--card-w) * 0.75);
  margin-top: calc(var(--card-w) * -0.75);
  pointer-events: none;
}
.sch-scroll::-webkit-scrollbar {
  display: none;
}
.sch-fan {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-width: max-content;
  margin-inline: auto;
  /* Room below for the fan's dropped, rotated outer cards. */
  padding: 0 1rem calc(var(--card-w) * 0.22);
}
.sch-card {
  --lift: 0rem;
  --scale: 1;
  position: relative;
  flex: none;
  width: var(--card-w);
  margin-inline: calc(var(--card-w) * var(--overlap, -0.06));
  padding: 0;
  border: 0;
  background: none;
  transform-origin: 50% 120%;
  transform: translateY(calc(var(--drop) - var(--lift))) rotate(var(--rot))
    scale(var(--scale));
  transition:
    transform 0.22s cubic-bezier(0.2, 0.9, 0.25, 1.2),
    filter 0.2s;
  perspective: 700px;
  pointer-events: auto;
}
.sch-card:hover,
.sch-card:focus-visible,
.sch-card.selected {
  z-index: 10;
}
.sch-card:hover,
.sch-card:focus-visible {
  --lift: 1.3rem;
  --scale: 1.28;
  --rot: 0deg;
  z-index: 10;
}
.sch-card.selected {
  --lift: 1.7rem;
  --scale: 1.2;
  --rot: 0deg;
  z-index: 9;
}
.sch-card.unavailable {
  filter: saturate(0.35) brightness(0.7);
}
.sch-flip {
  position: relative;
  display: block;
  transform-style: preserve-3d;
}
.sch-face {
  display: block;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 0.55rem;
}
.sch-front {
  position: relative;
  overflow: hidden;
  aspect-ratio: 2 / 3;
  border: 2px solid color-mix(in srgb, var(--tone) 70%, #fff);
  background: #121a26;
  box-shadow:
    0 6px 14px #000a,
    inset 0 0 0 1px #0008;
}
.sch-card.selected .sch-front {
  border-color: #f8ffad;
  box-shadow:
    0 0 0 2px #f8ffad66,
    0 0 22px color-mix(in srgb, var(--tone) 80%, transparent),
    0 10px 20px #000b;
}
.sch-front .sch-art {
  position: absolute;
  inset: 0;
  font-size: 2rem;
}
.sch-front .sch-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sch-cost {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  display: grid;
  place-items: center;
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f2ffb8, #8bd136 60%, #3d6a12);
  color: #10200a;
  font-size: 0.78rem;
  font-weight: 1000;
  box-shadow: 0 2px 5px #000a;
}
.sch-label {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  padding: 1.1rem 0.3rem 0.3rem;
  background: linear-gradient(transparent, #070b12f0 45%);
  text-align: left;
}
.sch-label strong {
  color: #fff;
  font-size: 0.6rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 0.02em;
}
.sch-label small {
  color: color-mix(in srgb, var(--tone) 75%, #fff);
  font-size: 0.48rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.sch-used {
  position: absolute;
  inset: 40% 0 auto;
  padding: 0.15rem 0;
  background: #000c;
  color: #ffd0a8;
  font-size: 0.55rem;
  font-style: normal;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-align: center;
}
.sch-back,
.sch-flip .sch-back {
  background:
    radial-gradient(circle at 50% 42%, #c5ff59 0 14%, transparent 15%),
    radial-gradient(circle at 50% 42%, #0e1420 0 22%, transparent 23%),
    repeating-linear-gradient(45deg, #ffffff0d 0 6px, transparent 6px 12px),
    linear-gradient(160deg, #3a2a5c, #13303a 60%, #0a141d);
  border: 2px solid #c5ff5999;
}
.sch-flip .sch-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}

/* Deal: cards arrive face-down from the deck and flip over. */
.sch-deal-enter-active {
  transition:
    transform 0.5s cubic-bezier(0.2, 0.9, 0.25, 1.1),
    opacity 0.3s;
  transition-delay: calc(var(--i) * 70ms);
}
.sch-deal-enter-active .sch-flip {
  animation: sch-deal-flip 0.55s calc(var(--i) * 70ms) both
    cubic-bezier(0.4, 0.1, 0.2, 1);
}
.sch-deal-enter-from {
  opacity: 0;
  transform: translate(-40vw, 2rem) rotate(-25deg) scale(0.7);
}
@keyframes sch-deal-flip {
  from {
    transform: rotateY(180deg);
  }
  to {
    transform: rotateY(0deg);
  }
}
/* Play: the card leaves upward, toward the board. */
.sch-deal-leave-active {
  position: absolute;
  transition:
    transform 0.45s cubic-bezier(0.5, 0, 0.75, 0),
    opacity 0.45s;
}
.sch-deal-leave-to {
  opacity: 0;
  transform: translateY(-14rem) rotate(8deg) scale(0.55);
}
.sch-deal-move {
  transition: transform 0.35s ease;
}

/* Selection: the workspace-hand flip with sparkles. */
.is-flipping .sch-flip {
  animation: sch-spin 650ms cubic-bezier(0.4, 0.1, 0.2, 1);
}
@keyframes sch-spin {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  50% {
    transform: rotateY(180deg) scale(1.08);
  }
  100% {
    transform: rotateY(360deg) scale(1);
  }
}
.sch-sparkles {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.sch-sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 50%;
  background: radial-gradient(circle, #efffb0 0%, transparent 70%);
  box-shadow:
    0 0 6px 2px #c5ff59cc,
    0 0 12px 4px color-mix(in srgb, var(--tone) 60%, transparent);
  opacity: 0;
  animation: sch-sparkle-pop 650ms ease-out forwards;
}
@keyframes sch-sparkle-pop {
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
.sch-swirl {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 2px solid transparent;
  opacity: 0;
}
.sch-swirl-a {
  border-top-color: #c5ff59e6;
  border-right-color: color-mix(in srgb, var(--tone) 70%, transparent);
  animation: sch-swirl 650ms ease-out forwards;
}
.sch-swirl-b {
  inset: 20%;
  border-bottom-color: color-mix(in srgb, var(--tone) 90%, transparent);
  border-left-color: #c5ff5999;
  animation: sch-swirl 650ms ease-out reverse forwards;
}
@keyframes sch-swirl {
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

/* Deck, discard and mana sit either side of the fan. */
.sch-pile,
.sch-mana {
  flex: none;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  color: #dfe8f2;
}
.sch-pile .sch-back {
  display: block;
  width: calc(var(--card-w) * 0.62);
  aspect-ratio: 2 / 3;
  border-radius: 0.4rem;
}
.sch-back-stack {
  box-shadow:
    2px 2px 0 #0b111b,
    3px 3px 0 #c5ff5955,
    5px 5px 0 #0b111b,
    6px 6px 0 #c5ff5933;
}
.sch-pile b {
  position: absolute;
  top: 30%;
  font-size: 1rem;
  font-weight: 1000;
  color: #fff;
  text-shadow: 0 1px 4px #000;
}
.sch-pile small,
.sch-mana small {
  font-size: 0.48rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  color: #a6b4c4;
}
.sch-discard .sch-back {
  opacity: 0.55;
  transform: rotate(7deg);
}
.sch-mana b {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f2ffb8, #8bd136 55%, #2b4c0c);
  color: #10200a;
  font-size: 1.15rem;
  font-weight: 1000;
  box-shadow:
    0 0 18px #c5ff5966,
    0 3px 8px #000a;
}

@container (max-width: 600px) {
  .sch {
    --card-w: 4.1rem;
    gap: 0.3rem;
    padding: 0 0.3rem 0.3rem;
  }
  .sch-fan {
    justify-content: flex-start;
    padding: 0 0.5rem;
  }
  .sch-discard {
    display: none;
  }
  .sch-mana b {
    width: 2rem;
    height: 2rem;
    font-size: 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sch-card,
  .sch-deal-enter-active,
  .sch-deal-leave-active,
  .sch-deal-move {
    transition: none;
  }
  .sch-deal-enter-active .sch-flip,
  .is-flipping .sch-flip {
    animation: none;
  }
  .sch-sparkle,
  .sch-swirl {
    animation: none;
    opacity: 0;
  }
}
</style>

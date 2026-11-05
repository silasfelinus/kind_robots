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

  Silas, 2026-11-02: "let the user manually drop cards into the discard pile,
  instead of that keep/discard button … make it simple." So cards DRAG: onto
  the board to play them, onto the DISCARD pile to cycle them at the next draw.
  Tap still works everywhere: tap a card, then a square or the pile; tap the
  pile alone to take the last tossed card back.
-->
<template>
  <div
    class="sch"
    :class="'tone-' + lab.team.color"
    data-testid="slime-hand"
    :aria-label="arena ? 'Your five-card hand' : 'Arcade card rack'"
  >
    <div
      v-if="arena"
      class="sch-pile"
      data-testid="slime-deck-count"
      :title="'Draw pile ' + lab.match.piles.player.length"
    >
      <span class="sch-back sch-back-stack" aria-hidden="true"
        ><SlimeCityArtwork
          v-if="backArt"
          class="sch-back-art"
          :image-id="backArt"
          alt=""
          compact
      /></span>
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
            unavailable:
              card.cost > lab.match.mana ||
              !lab.ready(card.id) ||
              (card.kind === 'creature' && fieldFull),
            spent: !lab.ready(card.id),
            'is-flipping': flipping === card.id,
            lifted: drag?.id === card.id,
          }"
          :style="fanStyle(index)"
          :data-testid="'slime-card-' + card.id"
          :aria-pressed="lab.selectedCard === card.id"
          :aria-label="
            card.name + ', ' + card.kind + ', costs ' + card.cost + ' mana'
          "
          :title="
            lab.mode === 'turf'
              ? 'TURF: ' + turfText(card, lab.sight.parity)
              : undefined
          "
          @pointerdown="grab($event, card.id)"
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
              <b v-if="!lab.sight.parity" class="sch-cost">{{ card.cost }}</b>
              <b
                v-else-if="card.kind === lab.sight.freeKind"
                class="sch-cost sch-free"
                title="Faction bonus: does not use up your play this turn"
                >FREE</b
              >
              <span class="sch-label">
                <strong>{{ card.name }}</strong>
                <small>{{ card.kind }}</small>
              </span>
              <i v-if="!lab.ready(card.id)" class="sch-used">USED</i>
            </span>
            <span class="sch-face sch-back" aria-hidden="true"
              ><SlimeCityArtwork
                v-if="backArt"
                class="sch-back-art"
                :image-id="backArt"
                alt=""
                compact
            /></span>
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

    <button
      v-if="arena"
      type="button"
      class="sch-pile sch-discard"
      :class="{ hot: drag?.over === 'discard', armed: !!lab.selectedCard }"
      data-drop="discard"
      data-testid="slime-discard-pile"
      :aria-label="discardLabel"
      :title="discardLabel"
      @click="tapDiscard"
    >
      <span v-if="tossed" class="sch-tossed" aria-hidden="true"
        ><SlimeCityArtwork
          :image-id="slimeArtId('cards', tossed.id)"
          alt=""
          :fallback="tossed.symbol"
          compact
        /><i>↩</i></span
      >
      <span v-else class="sch-back" aria-hidden="true"
        ><SlimeCityArtwork
          v-if="backArt"
          class="sch-back-art"
          :image-id="backArt"
          alt=""
          compact
      /></span>
      <b>{{ lab.match.markedDiscards.player.length || '' }}</b>
      <small>{{ tossed ? 'TAP TO UNDO' : 'DISCARD' }}</small>
    </button>

    <Teleport to="body">
      <div
        v-if="drag && dragged"
        class="sch-ghost"
        :class="'tone-' + lab.team.color"
        :style="{ left: drag.x + 'px', top: drag.y + 'px' }"
        aria-hidden="true"
      >
        <SlimeCityArtwork
          :image-id="slimeArtId('cards', dragged.id)"
          alt=""
          :fallback="dragged.symbol"
          compact
        />
        <b>{{ dragged.cost }}</b>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { cardById, turfText } from '~/utils/slimeCity/prototypes'

const lab = useSlimeCityStore()
/** Painted card back once art round 4 renders; the CSS back until then. */
const backArt = slimeArtId('ui', 'card-back')

/** BLACKOUT, BLOODRUSH and TURF deal a hand; the lane fixture shows a rack. */
const arena = computed(() => lab.sight.dealt)
/** The field cap is reached: creature cards cannot deploy (Silas, 2026-11-05). */
const fieldFull = computed(
  () =>
    lab.mode !== 'turf' &&
    lab.sight.units.filter((u) => u.side === 'player').length >=
      lab.sight.fieldCap,
)
/** Tossed cards leave the fan and sit on the discard pile until the draw. */
const cards = computed(() =>
  arena.value
    ? lab.hand.filter((c) => !lab.match.markedDiscards.player.includes(c.id))
    : lab.cards,
)
const tossed = computed(() => {
  const id = lab.match.markedDiscards.player.at(-1)
  return id ? cardById(id) : null
})
const discardLabel = computed(() =>
  lab.selectedCard
    ? 'Discard the selected card'
    : tossed.value
      ? 'Take ' + tossed.value.name + ' back'
      : 'Drag a card here to replace it at the next draw',
)
function tapDiscard(): void {
  if (lab.selectedCard) lab.markHandDiscard(lab.selectedCard)
  else lab.undoDiscard()
}

/** Pointer drag: onto a board square or token to play, onto the pile to toss. */
const drag = ref<{
  id: string
  x: number
  y: number
  over: 'discard' | 'board' | null
} | null>(null)
const dragged = computed(() => (drag.value ? cardById(drag.value.id) : null))
let pressed: { id: string; x: number; y: number; pointer: number } | null = null
let swallowClick = false

type Drop = { kind: 'discard' } | { kind: 'board'; x: number; y: number }
function dropAt(x: number, y: number): Drop | null {
  const el = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>('[data-drop], [data-drop-x]')
  if (!el) return null
  if (el.dataset.drop === 'discard') return { kind: 'discard' }
  return {
    kind: 'board',
    x: Number(el.dataset.dropX),
    y: Number(el.dataset.dropY),
  }
}
function grab(event: PointerEvent, id: string): void {
  if (!arena.value || event.button !== 0 || lab.match.victor) return
  pressed = { id, x: event.clientX, y: event.clientY, pointer: event.pointerId }
  window.addEventListener('pointermove', follow)
  window.addEventListener('pointerup', release)
  window.addEventListener('pointercancel', abandon)
}
function follow(event: PointerEvent): void {
  if (!pressed || event.pointerId !== pressed.pointer) return
  if (
    !drag.value &&
    Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) < 10
  )
    return
  if (!drag.value) lab.dragCard = pressed.id
  drag.value = {
    id: pressed.id,
    x: event.clientX,
    y: event.clientY,
    over: dropAt(event.clientX, event.clientY)?.kind ?? null,
  }
}
function release(event: PointerEvent): void {
  if (pressed && event.pointerId === pressed.pointer && drag.value) {
    const id = pressed.id
    const target = dropAt(event.clientX, event.clientY)
    if (target?.kind === 'discard') lab.markHandDiscard(id)
    else if (target?.kind === 'board') lab.dropCard(id, target.x, target.y)
    swallowClick = true
  }
  abandon()
}
function abandon(): void {
  pressed = null
  drag.value = null
  lab.dragCard = null
  window.removeEventListener('pointermove', follow)
  window.removeEventListener('pointerup', release)
  window.removeEventListener('pointercancel', abandon)
}

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
  if (swallowClick) {
    swallowClick = false
    return
  }
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
  abandon()
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
.sch-free {
  width: auto;
  padding: 0 0.4rem;
  border-radius: 999px;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
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

.sch-back {
  overflow: hidden;
}
.sch-back .sch-back-art {
  width: 100%;
  height: 100%;
}
.sch-back .sch-back-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.sch-card.lifted {
  opacity: 0.25;
}
.sch-discard {
  padding: 0.2rem;
  border-radius: 0.6rem;
  border: 2px dashed transparent;
  transition:
    border-color 0.15s,
    transform 0.15s;
}
.sch-discard.armed,
.sch-discard.hot {
  border-color: #ffd34d;
  transform: scale(1.08);
  box-shadow: 0 0 22px #ffd34d55;
}
.sch-tossed {
  position: relative;
  display: block;
  overflow: hidden;
  width: calc(var(--card-w) * 0.62);
  aspect-ratio: 2 / 3;
  border-radius: 0.4rem;
  border: 2px solid #ffd34d;
  transform: rotate(7deg);
  filter: saturate(0.6) brightness(0.8);
}
.sch-tossed i {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 1.3rem;
  font-style: normal;
  text-shadow: 0 1px 4px #000;
}
.sch-ghost {
  position: fixed;
  z-index: 1000;
  width: 5.5rem;
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border-radius: 0.55rem;
  border: 2px solid #f8ffad;
  translate: -50% -60%;
  rotate: -6deg;
  pointer-events: none;
  box-shadow:
    0 18px 30px #000c,
    0 0 26px #c5ff5988;
}
.sch-ghost b {
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
}
</style>

<!--
  DECK HAND. Silas, 2026-11-11 PT (iPad Collection): "Should have the 20 deck
  cards as an actual hand at the bottom of the screen, with the ability to
  remove, add, etc." and then "seeing them as a hand of cards at the bottom of
  the screen. The same effect we have in battle games."
  The deck being built fans up from the bottom edge of the Collection the way
  the Clash hand does: twenty slots on an arc, empty ones as ghost cards.
  Hover lifts a card; tap brings it up full size with ✕ OUT, INFO and ‹ ›
  to step through the hand. Gallery cards join with their + ADD ribbon.
-->
<template>
  <section
    class="sdh"
    :class="{ full: cards.length >= size, holding: !!lifted }"
    aria-label="Your deck"
    data-testid="slime-deck-hand"
    @keydown.esc="lifted = null"
  >
    <header class="sdh-head">
      <b class="sdh-count"
        >{{ cards.length }}<small>/{{ size }}</small></b
      >
      <span class="sdh-title">{{ title }}</span>
    </header>
    <ol
      class="sdh-fan"
      aria-label="Cards in this deck"
      @click.self="lifted = null"
    >
      <li
        v-for="(id, index) in cards"
        :key="id"
        class="sdh-slot"
        :class="{ big: lifted === id }"
        :style="fanStyle(index)"
        :data-testid="'slime-hand-card-' + id"
      >
        <button
          type="button"
          class="sdh-card"
          :aria-pressed="lifted === id"
          :aria-label="cardName(id) + ' in your deck. Tap for options'"
          @click="lifted = lifted === id ? null : id"
        >
          <SlimeCityClashCardFace :card-id="id" />
        </button>
        <span v-if="lifted === id" class="sdh-actions">
          <button
            type="button"
            aria-label="Previous card"
            :disabled="index === 0"
            @click="step(-1)"
          >
            ‹
          </button>
          <button
            type="button"
            class="sdh-out"
            :data-testid="'slime-hand-remove-' + id"
            @click="remove(id)"
          >
            ✕ OUT
          </button>
          <button type="button" @click="emit('inspect', id)">INFO</button>
          <button
            type="button"
            aria-label="Next card"
            :disabled="index === cards.length - 1"
            @click="step(1)"
          >
            ›
          </button>
        </span>
      </li>
      <li
        v-for="n in Math.max(0, size - cards.length)"
        :key="'empty-' + n"
        class="sdh-slot sdh-ghost"
        :style="fanStyle(cards.length + n - 1)"
        aria-hidden="true"
      >
        <span>＋</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { ALLIANCE_DECK_SIZE } from '~/utils/slimeCity/alliance'
import { cardById } from '~/utils/slimeCity/prototypes'

const emit = defineEmits<{ inspect: [id: string] }>()
const lab = useSlimeCityStore()
const lifted = ref<string | null>(null)

const alliance = computed(() => lab.deckFormat === 'alliance')
const cards = computed<string[]>(() =>
  alliance.value ? lab.currentAlliance.cards : lab.currentSolo,
)
const size = ALLIANCE_DECK_SIZE
const title = computed(() => {
  if (!alliance.value) return lab.team.name.split(' ')[0] + ' · SOLO'
  const named = lab.library.find((deck) => deck.id === lab.libraryId)
  if (named) return named.name
  const ally = lab.teams.find((team) => team.id === lab.currentAlliance.ally)
  return (
    lab.team.name.split(' ')[0] + ' + ' + (ally?.name.split(' ')[0] ?? 'ALLY')
  )
})
watch(
  () => [lab.deckFormat, lab.activeTeam, lab.libraryId],
  () => {
    lifted.value = null
  },
)
/** Twenty slots on an arc, like the Clash hand: offset, tilt and dip. */
function fanStyle(index: number): Record<string, string> {
  const middle = (size - 1) / 2
  const offset = index - middle
  return {
    '--o': offset.toFixed(2),
    '--rot': (offset * 2.4).toFixed(2) + 'deg',
    '--drop': ((offset / middle) ** 2 * 0.9).toFixed(3) + 'rem',
    '--z': String(index + 1),
  }
}
function cardName(id: string): string {
  return cardById(id)?.name ?? id
}
function step(by: number): void {
  const at = cards.value.indexOf(lifted.value ?? '')
  const next = cards.value[at + by]
  if (next) lifted.value = next
}
/** Take a card out; the next one comes up so the hand stays in hand. */
function remove(id: string): void {
  const at = cards.value.indexOf(id)
  if (alliance.value) lab.toggleAllianceCard(id)
  else lab.toggleSoloCard(id)
  lifted.value = cards.value[Math.min(at, cards.value.length - 1)] ?? null
}
</script>

<style scoped>
.sdh {
  --W: clamp(7rem, 17vmin, 13rem);
  --rest: 0.62;
  --peek: 0.7;
  --ease: cubic-bezier(0.2, 0.9, 0.25, 1.12);
  flex: none;
  position: relative;
  display: flex;
  align-items: flex-end;
  height: calc(var(--W) * 1.5 * var(--rest) * var(--peek) + 0.5rem);
  margin: 0 -0.6rem;
  border-top: 1px solid #c5ff5955;
  background: linear-gradient(180deg, #0b1219ee, #05090ef8);
  box-shadow: 0 -10px 24px #0009;
  clip-path: inset(-60rem 0 0 0);
}
.sdh-head {
  position: relative;
  z-index: 30;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  width: 4.4rem;
  padding: 0 0 0.5rem 0.6rem;
}
.sdh-count {
  font-size: 1.5rem;
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  color: #ffd6a1;
}
.sdh.full .sdh-count {
  color: #c5ff59;
}
.sdh-count small {
  font-size: 0.55em;
  color: #a6c7bc;
}
.sdh-title {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: #dfe7f2;
}
.sdh-fan {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  margin: 0;
  padding: 0;
  list-style: none;
  container-type: inline-size;
}
.sdh-slot {
  --step: min(
    var(--W) * var(--rest) * 0.74,
    (100cqw - var(--W) * var(--rest) * 1.35 - 1rem) / 19
  );
  --x: calc(var(--o) * var(--step));
  --y: calc(var(--W) * 1.5 * var(--rest) * (1 - var(--peek)) + var(--drop));
  --s: var(--rest);
  --r: var(--rot);
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: var(--z);
  width: var(--W);
  aspect-ratio: 2 / 3;
  transform-origin: 50% 100%;
  transform: translate(calc(-50% + var(--x)), var(--y)) rotate(var(--r))
    scale(var(--s));
  transition: transform 0.4s var(--ease);
}
@media (hover: hover) {
  .sdh:not(.holding) .sdh-slot:not(.sdh-ghost):hover {
    --y: calc(var(--W) * 1.5 * var(--rest) * (1 - var(--peek)) * 0.15);
    --s: calc(var(--rest) * 1.1);
    --r: 0deg;
    z-index: 40;
  }
}
.sdh.holding .sdh-slot:not(.big) {
  --y: calc(var(--W) * 1.5 * var(--rest) * 0.82);
}
.sdh-slot.big {
  --x: 0px;
  --y: -0.6rem;
  --s: 1;
  --r: 0deg;
  z-index: 50;
}
.sdh-card {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0.9rem;
  background: none;
  cursor: pointer;
  container-type: inline-size;
  box-shadow:
    -4px 0 10px #000b,
    0 6px 18px #000a;
}
.big .sdh-card {
  outline: 3px solid #c5ff59;
  outline-offset: 2px;
  box-shadow:
    0 0 30px #c5ff5955,
    0 18px 40px #000d;
}
.sdh-ghost {
  display: grid;
  place-items: center;
  border: 3px dashed #4d6a5f;
  border-radius: 0.9rem;
  background: #0f1a1fe6;
  color: #6f8f84;
  font-size: 2.4rem;
  font-weight: 900;
}
.sdh-ghost span {
  margin-bottom: 40%;
}
.sdh-actions {
  position: absolute;
  inset: auto 0.4rem 0.5rem;
  z-index: 2;
  display: flex;
  gap: 0.3rem;
}
.sdh-actions button {
  flex: 1 1 auto;
  padding: 0.5rem 0.3rem;
  border: 1px solid #586e68;
  border-radius: 0.55rem;
  background: #16262bf2;
  color: #eef4ee;
  font: inherit;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  white-space: nowrap;
  cursor: pointer;
}
.sdh-actions button:disabled {
  opacity: 0.35;
  cursor: default;
}
.sdh-actions button:first-child,
.sdh-actions button:last-child {
  flex: none;
  min-width: 1.9rem;
}
.sdh-actions .sdh-out {
  border-color: #ff6f7a;
  background: #4b1f26f2;
  color: #ffd6dc;
}
@container (max-width: 600px) {
  .sdh-head {
    width: 2.9rem;
    padding-left: 0.5rem;
  }
  .sdh-count {
    font-size: 1.15rem;
  }
  .sdh-title {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sdh-slot {
    transition: none;
  }
}
</style>

<!--
  DECK HAND. Silas, 2026-11-11 PT (iPad Collection): "Should have the 20 deck
  cards as an actual hand at the bottom of the screen, with the ability to
  remove, add, etc." The deck being built sits along the bottom edge of the
  Collection as a fanned hand: tap a card to lift it, then take it out or
  inspect it. Gallery cards add with their + ADD ribbon; empty slots show how
  many cards are still missing.
-->
<template>
  <section
    class="sdh"
    :class="{ full: cards.length >= size }"
    aria-label="Your deck"
    data-testid="slime-deck-hand"
  >
    <header class="sdh-head">
      <b class="sdh-count"
        >{{ cards.length }}<small>/{{ size }}</small></b
      >
      <span class="sdh-title">{{ title }}</span>
    </header>
    <ol class="sdh-cards" aria-label="Cards in this deck">
      <li
        v-for="(id, index) in cards"
        :key="id"
        :class="{ lifted: lifted === id }"
        :style="{ zIndex: lifted === id ? 60 : index + 1 }"
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
            class="sdh-out"
            :data-testid="'slime-hand-remove-' + id"
            @click="remove(id)"
          >
            ✕ OUT
          </button>
          <button type="button" @click="emit('inspect', id)">INFO</button>
        </span>
      </li>
      <li
        v-for="n in Math.max(0, size - cards.length)"
        :key="'empty-' + n"
        class="sdh-empty"
        aria-hidden="true"
      >
        <span>＋</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
function cardName(id: string): string {
  return cardById(id)?.name ?? id
}
function remove(id: string): void {
  lifted.value = null
  if (alliance.value) lab.toggleAllianceCard(id)
  else lab.toggleSoloCard(id)
}
</script>

<style scoped>
.sdh {
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin: 0 -0.6rem;
  padding: 0.35rem 0.6rem 0.4rem;
  border-top: 1px solid #c5ff5955;
  background: linear-gradient(180deg, #0b1219ee, #05090ef8);
  box-shadow: 0 -10px 24px #0009;
}
.sdh-head {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  width: 4.6rem;
  padding-bottom: 0.3rem;
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
.sdh-cards {
  --card: 5.6rem;
  --overlap: -1.55rem;
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  margin: 0;
  padding: 2.4rem 0.4rem 0;
  list-style: none;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}
.sdh-cards li {
  position: relative;
  flex: none;
  width: var(--card);
  transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.25, 1.2);
}
.sdh-cards li + li {
  margin-left: var(--overlap);
}
.sdh-cards li:hover,
.sdh-cards li:focus-within {
  transform: translateY(-0.6rem);
}
.sdh-cards li.lifted {
  transform: translateY(-1.3rem) scale(1.08);
}
.sdh-card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  container-type: inline-size;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: 0.55rem;
  background: none;
  cursor: pointer;
  filter: drop-shadow(-3px 0 6px #000c);
}
.sdh-card :deep(.scc) {
  border-radius: 0.55rem;
}
.lifted .sdh-card {
  outline: 2px solid #c5ff59;
  outline-offset: 1px;
}
.sdh-actions {
  position: absolute;
  inset: auto 0.25rem 0.35rem;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.sdh-actions button {
  padding: 0.3rem 0.45rem;
  border: 1px solid #586e68;
  border-radius: 0.45rem;
  background: #16262b;
  color: #eef4ee;
  font: inherit;
  font-size: 0.58rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  white-space: nowrap;
  cursor: pointer;
}
.sdh-actions .sdh-out {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
}
.sdh-empty {
  display: grid;
  place-items: center;
  aspect-ratio: 2 / 3;
  border: 2px dashed #3d5550;
  border-radius: 0.55rem;
  background: #0f1a1f;
  color: #4d6a5f;
  font-size: 1.2rem;
  font-weight: 900;
}
@container (max-width: 600px) {
  .sdh {
    gap: 0.35rem;
  }
  .sdh-head {
    width: 2.8rem;
  }
  .sdh-count {
    font-size: 1.15rem;
  }
  .sdh-title {
    display: none;
  }
  .sdh {
    padding-top: 0.2rem;
  }
  .sdh-cards {
    --card: 3.7rem;
    --overlap: -1.35rem;
    padding-top: 1.35rem;
  }
  .sdh-cards li.lifted {
    transform: translateY(-1rem) scale(1.04);
  }
  .sdh-cards li:hover {
    transform: none;
  }
}
@container (min-width: 1100px) {
  .sdh-cards {
    --card: 6.4rem;
    --overlap: -1.9rem;
  }
}
</style>

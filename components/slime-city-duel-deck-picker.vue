<template>
  <section class="sc-duel-decks" aria-label="Choose duel deck">
    <b>YOUR DUEL DECK</b>
    <div class="sc-duel-modes" role="group" aria-label="Deck format">
      <button
        v-for="item in modes"
        :key="item.id"
        type="button"
        :aria-pressed="mode === item.id"
        :data-testid="'slime-duel-' + item.id"
        @click="mode = item.id"
      >
        {{ item.name }}
      </button>
    </div>
    <div
      v-if="mode === 'alliance-classic' && classicDeck"
      class="sc-duel-starter"
      data-testid="slime-duel-classic-starter"
    >
      <SlimeCityArtwork
        :image-id="slimeArtId('crews', classicDeck.general)"
        alt=""
        compact
      />
      <SlimeCityArtwork
        :image-id="slimeArtId('crews', classicDeck.ally ?? classicDeck.general)"
        alt=""
        compact
      />
      <span>
        <b>{{ classicDeck.name }}</b>
        <small>20 cards · Alliance starter</small>
      </span>
    </div>
    <label v-if="mode === 'alliance-constructed'" class="sc-duel-option">
      Saved alliance deck
      <select v-model="deckId" class="select w-full">
        <option value="">Choose a saved deck</option>
        <option v-for="deck in decks" :key="deck.id" :value="deck.id">
          {{ deck.name }}
        </option>
      </select>
    </label>
    <p class="sc-duel-hint">{{ hint }}</p>
    <NuxtLink
      v-if="mode.endsWith('constructed') && !setup"
      to="/play/slime-city"
      class="link"
    >
      Build a legal deck in Collection
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import type { ClashRewardSetup } from '~/utils/slimeCity/clashRewards'
import type { TeamId } from '~/utils/slimeCity/prototypes'
import { slimeArtId } from '~/utils/slimeCity/artManifest'

const props = defineProps<{
  team: TeamId
  modelValue: ClashRewardSetup | null
}>()
const emit = defineEmits<{
  'update:modelValue': [setup: ClashRewardSetup | null]
}>()
const lab = useSlimeCityStore()
const modes = [
  { id: 'faction-classic', name: 'Faction Classic' },
  { id: 'faction-constructed', name: 'Faction Constructed' },
  { id: 'alliance-classic', name: 'Alliance Classic' },
  { id: 'alliance-constructed', name: 'Alliance Constructed' },
] as const
const mode = ref<(typeof modes)[number]['id']>('alliance-classic')
const classicDeck = computed(() =>
  lab.starterDecks.find(
    (deck) => deck.general === props.team && deck.ally !== null,
  ),
)
const deckId = ref('')
const decks = computed(() =>
  lab.library.filter(
    (deck) =>
      deck.general === props.team &&
      lab.libraryDeckReady(deck.id) &&
      deck.cards.every(lab.isCardUnlocked),
  ),
)
watch(
  [decks, () => lab.libraryId],
  ([available, selected]) => {
    if (available.some((deck) => deck.id === deckId.value)) return
    deckId.value =
      available.find((deck) => deck.id === selected)?.id ??
      available[0]?.id ??
      ''
  },
  { immediate: true },
)
const setup = computed(() =>
  lab.duelDeck(
    props.team,
    mode.value,
    classicDeck.value?.ally ?? undefined,
    deckId.value,
  ),
)
const hint = computed(() => {
  switch (mode.value) {
    case 'faction-classic':
      return 'The original 20 faction starter cards.'
    case 'faction-constructed':
      return setup.value
        ? 'Your saved legal faction deck.'
        : 'No legal saved faction deck yet.'
    case 'alliance-classic':
      return 'Choose a leading faction above to switch between the six starters.'
    case 'alliance-constructed':
      return setup.value
        ? 'Your selected named Alliance deck.'
        : 'Choose a legal saved Alliance deck.'
  }
  return ''
})
watch(setup, (value) => emit('update:modelValue', value), { immediate: true })
</script>

<style scoped>
.sc-duel-decks {
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem;
  border: 1px solid #586e68;
  border-radius: 0.6rem;
  background: #112933;
  font-size: 0.8rem;
}
.sc-duel-modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
}
.sc-duel-modes button {
  border: 1px solid #586e68;
  border-radius: 0.4rem;
  padding: 0.45rem 0.25rem;
  font-weight: 850;
}
.sc-duel-modes button[aria-pressed='true'] {
  background: #c5ff59;
  color: #12200c;
}
.sc-duel-starter {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid #c5ff59;
  border-radius: 0.4rem;
  padding: 0.3rem;
}
.sc-duel-starter :deep(.slime-art) {
  flex: none;
  width: 3rem;
  height: 3rem;
  margin: 0;
}
.sc-duel-starter span {
  display: grid;
  min-width: 0;
}
.sc-duel-starter small {
  color: #c6dcd4;
}
.sc-duel-option {
  display: grid;
  gap: 0.2rem;
}
.sc-duel-hint {
  margin: 0;
  color: #c6dcd4;
}
</style>

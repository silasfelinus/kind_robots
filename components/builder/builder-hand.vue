<!-- /components/builder/builder-hand.vue -->
<template>
  <div class="flex h-full min-h-0 items-center gap-2 overflow-x-auto px-1 py-1">
    <button
      v-for="card in handCards"
      :key="card.key"
      type="button"
      class="group relative flex min-w-24 max-w-24 shrink-0 flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
      :class="thumbClass(card.key)"
      @click="handleCardClick(card)"
    >
      <div class="relative aspect-2/3 w-full overflow-hidden bg-base-300">
        <img
          v-if="card.deckImage"
          :src="card.deckImage"
          :alt="card.label"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div v-else class="flex h-full w-full items-center justify-center">
          <Icon
            :name="card.icon || 'kind-icon:cards'"
            class="h-8 w-8 text-base-content/25"
          />
        </div>

        <div
          v-if="store.completedCards[card.key]"
          class="absolute inset-0 flex items-center justify-center bg-success/20 backdrop-blur-[1px]"
        >
          <Icon
            name="kind-icon:check"
            class="h-6 w-6 rounded-full bg-success p-1 text-success-content"
          />
        </div>
      </div>

      <div class="w-full bg-base-100 px-2 py-1.5">
        <p class="truncate text-center text-xs font-black text-base-content/70">
          {{ card.label }}
        </p>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import { NAV_CARDS } from '@/stores/helpers/navCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

const store = useBuilderStore()

// builder cards when a real stage is active; otherwise the nav deck
const sourceCards = computed<BuilderCard[]>(() => {
  return store.cards.length ? store.cards : NAV_CARDS
})

const handCards = computed(() => {
  const map = new Map(sourceCards.value.map((card) => [card.key, card]))

  const active = store.activeCardKey
    ? sourceCards.value.filter((card) => card.key === store.activeCardKey)
    : []

  const completed = sourceCards.value.filter(
    (card) => store.completedCards[card.key],
  )

  const available = sourceCards.value.filter(
    (card) =>
      !store.completedCards[card.key] && card.key !== store.activeCardKey,
  )

  return [...active, ...completed, ...available].filter(
    (card, index, list) =>
      list.findIndex((entry) => entry.key === card.key) === index &&
      map.has(card.key),
  )
})

function getCardPath(card: BuilderCard): string {
  const path = card.payload?.path
  return typeof path === 'string' ? path : ''
}

function handleCardClick(card: BuilderCard): void {
  const path = getCardPath(card)
  if (path) {
    void navigateTo(path)
    return
  }
  store.selectCard(card.key)
}

function thumbClass(cardKey: string): string {
  if (store.activeCardKey === cardKey) {
    return 'border-primary bg-primary/10 shadow shadow-primary/20'
  }
  if (store.completedCards[cardKey]) {
    return 'border-success/60 bg-success/5'
  }
  return 'border-base-300 bg-base-200 hover:border-primary/60'
}
</script>

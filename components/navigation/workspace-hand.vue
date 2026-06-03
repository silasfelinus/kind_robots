<!-- /components/navigation/workspace-hand.vue -->
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
          :src="normalizeImagePath(card.deckImage)"
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
          v-if="isCardComplete(card.key)"
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
import { useRoute } from 'vue-router'
import { useBuilderStore } from '@/stores/builderStore'
import { usePageStore } from '@/stores/pageStore'
import { NAV_CARDS } from '@/stores/helpers/navCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

const route = useRoute()
const builderStore = useBuilderStore()
const pageStore = usePageStore()

const isBuilderDeck = computed(() => pageStore.cardsKey === 'builderCards')

const builderCards = computed<BuilderCard[]>(() => {
  return builderStore.visibleCards.length
    ? builderStore.visibleCards
    : builderStore.cards
})

const sourceCards = computed<BuilderCard[]>(() => {
  if (isBuilderDeck.value && builderCards.value.length) {
    return builderCards.value
  }

  if (pageStore.cards.length) {
    return pageStore.cards
  }

  return NAV_CARDS
})

const routeCardKey = computed(() => {
  return (
    sourceCards.value.find((card) => getCardPath(card) === route.path)?.key ??
    sourceCards.value[0]?.key ??
    ''
  )
})

const activeCardKey = computed(() => {
  if (isBuilderDeck.value) {
    return builderStore.activeCardKey || sourceCards.value[0]?.key || ''
  }

  return pageStore.workspaceCardKey || routeCardKey.value
})

const handCards = computed(() => {
  const active = sourceCards.value.filter(
    (card) => card.key === activeCardKey.value,
  )

  const completed = sourceCards.value.filter(
    (card) => isCardComplete(card.key) && card.key !== activeCardKey.value,
  )

  const available = sourceCards.value.filter(
    (card) => !isCardComplete(card.key) && card.key !== activeCardKey.value,
  )

  return [...active, ...completed, ...available].filter(
    (card, index, list) =>
      list.findIndex((entry) => entry.key === card.key) === index,
  )
})

function getCardPath(card: BuilderCard): string {
  const path = card.payload?.path ?? card.payload?.to ?? card.payload?.href
  return typeof path === 'string' ? path : ''
}

function handleCardClick(card: BuilderCard): void {
  pageStore.setWorkspaceCardKey(card.key)

  const path = getCardPath(card)

  if (path) {
    void navigateTo(path)
    return
  }

  if (isBuilderDeck.value) {
    builderStore.selectCard(card.key)
  }
}

function isCardComplete(cardKey: string): boolean {
  return isBuilderDeck.value
    ? Boolean(builderStore.completedCards[cardKey])
    : false
}

function thumbClass(cardKey: string): string {
  if (activeCardKey.value === cardKey) {
    return 'border-primary bg-primary/10 shadow shadow-primary/20'
  }

  if (isCardComplete(cardKey)) {
    return 'border-success/60 bg-success/5'
  }

  return 'border-base-300 bg-base-200 hover:border-primary/60'
}

function normalizeImagePath(path: string): string {
  if (!path) return ''
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `/images/${path}`
}
</script>

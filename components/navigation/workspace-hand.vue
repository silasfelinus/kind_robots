<!-- /components/navigation/workspace-hand.vue -->
<template>
  <div
    ref="handEl"
    class="absolute inset-x-0 bottom-0 z-30 overflow-x-auto overscroll-x-contain px-1 py-1"
  >
    <div
      class="flex min-w-full items-end gap-2"
      :class="handJustifyClass"
      :style="handStyle"
    >
      <button
        v-for="card in handCards"
        :key="card.key"
        type="button"
        class="group relative flex shrink-0 flex-col overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
        :class="thumbClass(card.key)"
        :style="{ width: 'var(--workspace-card-w)' }"
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
          <p
            class="truncate text-center text-xs font-black text-base-content/70"
          >
            {{ card.label }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBuilderStore } from '@/stores/builderStore'
import { usePageStore } from '@/stores/pageStore'
import { NAV_CARDS } from '@/stores/helpers/navCards'
import type { BuilderCard } from '@/stores/helpers/builderCards'

const route = useRoute()
const builderStore = useBuilderStore()
const pageStore = usePageStore()

const handEl = ref<HTMLElement | null>(null)
const handWidth = ref(0)

let observer: ResizeObserver | null = null

const gapPx = 8
const horizontalPaddingPx = 8
const minCardWidthPx = 96

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

const maxCardWidthPx = computed(() => {
  const count = handCards.value.length

  if (count <= 2) return 176
  if (count <= 4) return 208

  return 240
})

const cardWidthPx = computed(() => {
  const count = handCards.value.length

  if (!count || !handWidth.value) {
    return minCardWidthPx
  }

  const totalGap = gapPx * Math.max(0, count - 1)
  const availableWidth = Math.max(
    minCardWidthPx,
    handWidth.value - horizontalPaddingPx - totalGap,
  )

  const idealWidth = Math.floor(availableWidth / count)

  return Math.min(maxCardWidthPx.value, Math.max(minCardWidthPx, idealWidth))
})

const handContentWidth = computed(() => {
  const count = handCards.value.length

  if (!count) return 0

  return cardWidthPx.value * count + gapPx * Math.max(0, count - 1)
})

const handJustifyClass = computed(() => {
  return handContentWidth.value <= handWidth.value - horizontalPaddingPx
    ? 'justify-center'
    : 'justify-start'
})

const handStyle = computed<CSSProperties>(() => {
  return {
    '--workspace-card-w': `${cardWidthPx.value}px`,
  } as CSSProperties
})

function publishHeight(): void {
  if (!handEl.value) return

  handWidth.value = handEl.value.clientWidth

  const h = handEl.value.scrollHeight
  document.documentElement.style.setProperty('--hand-h', `${h}px`)
}

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

function handleWheel(event: WheelEvent): void {
  const el = handEl.value
  if (!el) return

  const horizontalOverflow = el.scrollWidth > el.clientWidth
  if (!horizontalOverflow) return

  const primaryDelta =
    Math.abs(event.deltaY) >= Math.abs(event.deltaX)
      ? event.deltaY
      : event.deltaX

  if (!primaryDelta) return

  const maxScrollLeft = el.scrollWidth - el.clientWidth
  const nextScrollLeft = Math.min(
    maxScrollLeft,
    Math.max(0, el.scrollLeft + primaryDelta),
  )

  const canMove = nextScrollLeft !== el.scrollLeft
  if (!canMove) return

  event.preventDefault()
  el.scrollLeft = nextScrollLeft
}

onMounted(() => {
  if (!import.meta.client) return

  publishHeight()

  observer = new ResizeObserver(() => publishHeight())

  if (handEl.value) {
    observer.observe(handEl.value)
    handEl.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

watch(
  [handCards, cardWidthPx],
  () => {
    void nextTick(publishHeight)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()

  if (handEl.value) {
    handEl.value.removeEventListener('wheel', handleWheel)
  }

  document.documentElement.style.removeProperty('--hand-h')
})
</script>

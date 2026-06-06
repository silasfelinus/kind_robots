<!-- /components/navigation/workspace-hand.vue -->
<template>
  <div
    ref="handEl"
    class="absolute inset-x-0 bottom-0 z-40 pointer-events-none overflow-visible px-1"
    :style="handFrameStyle"
  >
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-circle absolute bottom-2 left-1 z-40 sm:hidden"
      aria-label="Previous expanded workspace card"
      @click.stop="cycleExpandedCard(-1)"
    >
      <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
    </button>

    <button
      type="button"
      class="btn btn-ghost btn-xs btn-circle absolute bottom-2 right-1 z-40 sm:hidden"
      aria-label="Next expanded workspace card"
      @click.stop="cycleExpandedCard(1)"
    >
      <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
    </button>

    <div
      ref="scrollEl"
      class="pointer-events-auto flex h-full items-end overflow-x-auto overscroll-x-contain overflow-y-visible"
    >
      <div
        class="flex min-w-full items-end gap-2 px-8 sm:px-0"
        :class="handJustifyClass"
        :style="handStyle"
      >
        <button
          v-for="(card, index) in handCards"
          :key="card.key"
          type="button"
          class="group relative flex shrink-0 flex-col overflow-visible rounded-2xl border transition-all duration-200 hover:z-40 hover:-translate-y-2 hover:scale-[2.1] active:z-40 active:-translate-y-2 active:scale-[2.1]"
          :class="[
            thumbClass(card.key),
            expandedClass(card.key),
            originClass(index),
          ]"
          :style="{ width: 'var(--workspace-card-rest-w)' }"
          @click="handleCardClick(card)"
        >
          <div
            class="relative flex w-full flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg"
          >
            <div class="relative aspect-2/3 w-full overflow-hidden bg-base-300">
              <img
                v-if="card.deckImage"
                :src="normalizeImagePath(card.deckImage)"
                :alt="card.label"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <div
                v-else
                class="flex h-full w-full items-center justify-center"
              >
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

            <div class="w-full bg-base-100 px-1.5 py-1.5">
              <p
                class="truncate text-center text-[0.65rem] font-black leading-none text-base-content/75 sm:text-xs"
                :title="card.label"
              >
                {{ card.label }}
              </p>
            </div>
          </div>
        </button>
      </div>
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
const scrollEl = ref<HTMLElement | null>(null)
const handWidth = ref(0)
const selectedCardKey = ref('')
const expandedCardKey = ref('')

let observer: ResizeObserver | null = null

const gapPx = 8
const horizontalPaddingPx = 16
const mobileChevronPaddingPx = 64
const minRestingCardWidthPx = 72
const fallbackRestingCardWidthPx = 88
const expandedScale = 2.1
const footerHeightPx = 36
const verticalPaddingPx = 8
const expansionSafetyPx = 128

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

const storedActiveCardKey = computed(() => {
  if (isBuilderDeck.value) {
    return builderStore.activeCardKey || sourceCards.value[0]?.key || ''
  }

  return pageStore.workspaceCardKey || routeCardKey.value
})

const activeCardKey = computed(() => {
  const selectedExists = sourceCards.value.some(
    (card) => card.key === selectedCardKey.value,
  )

  if (selectedExists) {
    return selectedCardKey.value
  }

  return storedActiveCardKey.value
})

const handCards = computed(() => {
  return sourceCards.value.filter(
    (card, index, list) =>
      list.findIndex((entry) => entry.key === card.key) === index,
  )
})

const maxRestingCardWidthPx = computed(() => {
  const count = handCards.value.length

  if (count <= 3) return 144
  if (count <= 5) return 132
  if (count <= 7) return 120

  return 112
})

const restingCardWidthPx = computed(() => {
  const count = handCards.value.length

  if (!count || !handWidth.value) {
    return fallbackRestingCardWidthPx
  }

  const totalGap = gapPx * Math.max(0, count - 1)
  const reservedPadding =
    horizontalPaddingPx + (handWidth.value < 640 ? mobileChevronPaddingPx : 0)

  const availableWidth = Math.max(
    minRestingCardWidthPx,
    handWidth.value - reservedPadding - totalGap,
  )

  const idealWidth = Math.floor(availableWidth / count)

  return Math.min(
    maxRestingCardWidthPx.value,
    Math.max(minRestingCardWidthPx, idealWidth),
  )
})

const restingHandHeightPx = computed(() => {
  return Math.ceil(
    restingCardWidthPx.value * 1.5 + footerHeightPx + verticalPaddingPx,
  )
})

const expandedHandHeightPx = computed(() => {
  return Math.ceil(
    restingHandHeightPx.value * expandedScale + expansionSafetyPx,
  )
})

const handContentWidth = computed(() => {
  const count = handCards.value.length

  if (!count) return 0

  return restingCardWidthPx.value * count + gapPx * Math.max(0, count - 1)
})

const handJustifyClass = computed(() => {
  return handContentWidth.value <= handWidth.value - horizontalPaddingPx
    ? 'justify-center'
    : 'justify-start'
})

const handStyle = computed<CSSProperties>(() => {
  return {
    '--workspace-card-rest-w': `${restingCardWidthPx.value}px`,
    '--workspace-card-rest-h': `${restingHandHeightPx.value}px`,
    '--workspace-card-expanded-h': `${expandedHandHeightPx.value}px`,
  } as CSSProperties
})

const handFrameStyle = computed<CSSProperties>(() => {
  return {
    height: `${expandedHandHeightPx.value}px`,
  }
})

function publishHeight(): void {
  if (!import.meta.client) return

  handWidth.value =
    scrollEl.value?.clientWidth ?? handEl.value?.clientWidth ?? 0

  document.documentElement.style.setProperty(
    '--hand-h',
    `${restingHandHeightPx.value}px`,
  )
}

function getCardPath(card: BuilderCard): string {
  const path = card.payload?.path ?? card.payload?.to ?? card.payload?.href
  return typeof path === 'string' ? path : ''
}

function handleCardClick(card: BuilderCard): void {
  selectedCardKey.value = card.key
  pageStore.setWorkspaceCardKey(card.key)

  if (isBuilderDeck.value) {
    builderStore.selectCard(card.key)
  }

  const path = getCardPath(card)

  if (path && path !== route.path) {
    void navigateTo(path)
  }
}

function cycleExpandedCard(direction: 1 | -1): void {
  const cards = handCards.value
  const count = cards.length

  if (!count) {
    expandedCardKey.value = ''
    return
  }

  const currentIndex = cards.findIndex(
    (card) => card.key === expandedCardKey.value,
  )

  if (direction > 0) {
    if (currentIndex < 0) {
      expandedCardKey.value = cards[0]?.key ?? ''
      return
    }

    if (currentIndex >= count - 1) {
      expandedCardKey.value = ''
      return
    }

    expandedCardKey.value = cards[currentIndex + 1]?.key ?? ''
    return
  }

  if (currentIndex < 0) {
    expandedCardKey.value = cards[count - 1]?.key ?? ''
    return
  }

  if (currentIndex <= 0) {
    expandedCardKey.value = ''
    return
  }

  expandedCardKey.value = cards[currentIndex - 1]?.key ?? ''
}

function isCardComplete(cardKey: string): boolean {
  return isBuilderDeck.value
    ? Boolean(builderStore.completedCards[cardKey])
    : false
}

function thumbClass(cardKey: string): string {
  if (activeCardKey.value === cardKey) {
    return 'z-30 border-primary bg-primary/10 shadow shadow-primary/20'
  }

  if (isCardComplete(cardKey)) {
    return 'z-10 border-success/60 bg-success/5'
  }

  return 'z-10 border-base-300 bg-base-200 hover:border-primary/60'
}

function expandedClass(cardKey: string): string {
  if (expandedCardKey.value !== cardKey) return ''

  return 'z-40 -translate-y-2 scale-[2.1] sm:z-30 sm:translate-y-0 sm:scale-100'
}

function originClass(index: number): string {
  if (index === 0) return 'origin-bottom-left'
  if (index === handCards.value.length - 1) return 'origin-bottom-right'

  return 'origin-bottom'
}

function normalizeImagePath(path: string): string {
  if (!path) return ''
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `/images/${path}`
}

function handleWheel(event: WheelEvent): void {
  const el = scrollEl.value
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

watch(
  storedActiveCardKey,
  (cardKey) => {
    if (!selectedCardKey.value && cardKey) {
      selectedCardKey.value = cardKey
    }
  },
  { immediate: true },
)

watch(
  sourceCards,
  () => {
    const selectedExists = sourceCards.value.some(
      (card) => card.key === selectedCardKey.value,
    )

    const expandedExists = sourceCards.value.some(
      (card) => card.key === expandedCardKey.value,
    )

    if (!selectedExists) {
      selectedCardKey.value = storedActiveCardKey.value
    }

    if (!expandedExists) {
      expandedCardKey.value = ''
    }
  },
  { deep: true },
)

onMounted(() => {
  if (!import.meta.client) return

  publishHeight()

  observer = new ResizeObserver(() => publishHeight())

  if (handEl.value) {
    observer.observe(handEl.value)
  }

  if (scrollEl.value) {
    observer.observe(scrollEl.value)
    scrollEl.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

watch(
  [handCards, restingCardWidthPx],
  () => {
    void nextTick(publishHeight)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()

  if (scrollEl.value) {
    scrollEl.value.removeEventListener('wheel', handleWheel)
  }

  document.documentElement.style.removeProperty('--hand-h')
})
</script>

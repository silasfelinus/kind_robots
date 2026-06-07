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
            flippingCardKey === card.key ? 'is-flipping' : '',
          ]"
          :style="{ width: 'var(--workspace-card-rest-w)' }"
          @click="handleCardClick(card)"
        >
          <!-- 3D flip wrapper -->
          <div class="card-flip relative w-full">
            <!-- FRONT -->
            <div
              class="card-face card-front relative flex w-full flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg"
            >
              <div
                class="relative aspect-2/3 w-full overflow-hidden bg-base-300"
              >
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

            <!-- BACK -->
            <div
              class="card-face card-back absolute inset-0 flex w-full flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg"
            >
              <div
                class="relative aspect-2/3 w-full overflow-hidden bg-base-300"
              >
                <img
                  :src="cardBackSrc(cardBack)"
                  :alt="`Card back ${cardBack}`"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="w-full bg-base-100 px-1.5 py-1.5">
                <p class="text-center text-[0.65rem] leading-none sm:text-xs">
                  &nbsp;
                </p>
              </div>
            </div>
          </div>

          <!-- Magic sparkle overlay during flip -->
          <div
            v-if="flippingCardKey === card.key"
            class="sparkle-layer pointer-events-none absolute inset-0 z-50"
            aria-hidden="true"
          >
            <span
              v-for="n in 10"
              :key="n"
              class="sparkle"
              :style="sparkleStyle(n)"
            />
            <span class="swirl swirl-a" />
            <span class="swirl swirl-b" />
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

// --- Card back selection -------------------------------------------------
// The preferred card back is chosen elsewhere (user dashboard) and persisted
// to localStorage. Here we only read it to render the flip's reverse face.
const CARD_BACKS = [1, 2, 3, 4, 5] as const
type CardBack = (typeof CARD_BACKS)[number]

const CARD_BACK_STORAGE_KEY = 'kr.workspaceCardBack'
const cardBack = ref<CardBack>(1)

function cardBackSrc(back: CardBack): string {
  return `/images/adventure/card/card-back${back}.webp`
}

// --- Flip animation state ------------------------------------------------
const flippingCardKey = ref('')
const FLIP_DURATION_MS = 650
let flipTimer: ReturnType<typeof setTimeout> | null = null

function triggerFlip(cardKey: string): void {
  if (flipTimer) clearTimeout(flipTimer)
  flippingCardKey.value = cardKey
  flipTimer = setTimeout(() => {
    flippingCardKey.value = ''
    flipTimer = null
  }, FLIP_DURATION_MS)
}

function sparkleStyle(n: number): CSSProperties {
  const angle = (n / 10) * Math.PI * 2
  const radius = 28 + (n % 3) * 8
  const x = 50 + Math.cos(angle) * radius
  const y = 50 + Math.sin(angle) * radius
  return {
    left: `${x}%`,
    top: `${y}%`,
    animationDelay: `${(n % 5) * 40}ms`,
  } as CSSProperties
}

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

  triggerFlip(card.key)

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

  // Restore preferred card back
  try {
    const stored = window.localStorage.getItem(CARD_BACK_STORAGE_KEY)
    const parsed = stored ? Number(stored) : NaN
    if (CARD_BACKS.includes(parsed as CardBack)) {
      cardBack.value = parsed as CardBack
    }
  } catch {
    /* ignore storage failures */
  }

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

  if (flipTimer) clearTimeout(flipTimer)

  document.documentElement.style.removeProperty('--hand-h')
})
</script>

<style scoped>
/* 3D flip rig ----------------------------------------------------------- */
.card-flip {
  transform-style: preserve-3d;
  transition: transform 0s;
}

.card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* Back is pre-rotated so it faces away until the flip passes 180deg */
.card-back {
  transform: rotateY(180deg);
}

/* When flipping, spin the whole rig a full 360deg (front -> back -> front) */
.is-flipping .card-flip {
  animation: card-spin 650ms cubic-bezier(0.4, 0.1, 0.2, 1);
}

@keyframes card-spin {
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

/* Sparkles -------------------------------------------------------------- */
.sparkle {
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 9999px;
  background: radial-gradient(
    circle,
    hsl(var(--p, 280 90% 70%)) 0%,
    transparent 70%
  );
  box-shadow:
    0 0 6px 2px hsl(var(--p, 280 90% 70%) / 0.8),
    0 0 12px 4px hsl(var(--s, 200 90% 70%) / 0.5);
  opacity: 0;
  animation: sparkle-pop 650ms ease-out forwards;
}

@keyframes sparkle-pop {
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

/* Magic swirls ---------------------------------------------------------- */
.swirl {
  position: absolute;
  inset: 8%;
  border-radius: 9999px;
  border: 2px solid transparent;
  opacity: 0;
}

.swirl-a {
  border-top-color: hsl(var(--p, 280 90% 70%) / 0.9);
  border-right-color: hsl(var(--s, 200 90% 70%) / 0.6);
  animation: swirl-spin 650ms ease-out forwards;
}

.swirl-b {
  inset: 20%;
  border-bottom-color: hsl(var(--a, 320 90% 70%) / 0.9);
  border-left-color: hsl(var(--p, 280 90% 70%) / 0.6);
  animation: swirl-spin-rev 650ms ease-out forwards;
}

@keyframes swirl-spin {
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

@keyframes swirl-spin-rev {
  0% {
    opacity: 0;
    transform: rotate(0deg) scale(0.6);
  }
  40% {
    opacity: 1;
    transform: rotate(-220deg) scale(1.05);
  }
  100% {
    opacity: 0;
    transform: rotate(-420deg) scale(1.25);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-flipping .card-flip {
    animation: none;
  }
  .sparkle,
  .swirl {
    animation: none;
    opacity: 0;
  }
}
</style>

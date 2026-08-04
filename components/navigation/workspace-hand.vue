<!-- /components/navigation/workspace-hand.vue -->
<template>
  <div
    ref="handEl"
    class="pointer-events-none absolute inset-x-0 bottom-0 z-90 h-full overflow-visible px-1"
    :style="handFrameStyle"
  >
    <fx-region region="hand" />

    <!--
      Two things are deliberately ABSENT here, both of which broke touch
      scrolling on iOS while measuring perfectly fine in Chromium:

      1. `touch-pan-x`. touch-action: pan-x is a strict directional gate — a
         gesture whose opening vector falls outside the horizontal cone is
         dropped outright rather than interpreted. This hand sits on the bottom
         edge, so it is driven by a thumb, and a thumb arcs. The default
         (`auto`) lets the browser route the horizontal component to this
         scroller and the vertical component to the page, with the tolerance it
         already ships. `overscroll-x-contain` stays: it stops a swipe from
         chaining into browser back-navigation.

      2. `active:` variants on the cards (see the button below). Tailwind v4
         gates `hover:` behind @media (hover: hover), so on a touch device only
         `:active` ever matched — and :active fires on finger-DOWN. Measured
         with CSS.forcePseudoState on an emulated touch device, the card went
         112px -> 235px and z-10 -> z-40 the instant it was pressed, mid-gesture
         and mid-200ms-transition. Desktop loses nothing by dropping it: `hover:`
         already applies the identical values with a real pointer.

      overflow-y is `hidden`, not `visible`: both engines were already coercing
      it to `auto` (per spec, once one axis is non-visible the other computes to
      auto), so `visible` described something the browser never did — and the
      `auto` it silently became gave the strip a second scroll axis to compete
      for the same gesture.
    -->
    <div
      ref="scrollEl"
      class="workspace-hand-scroll pointer-events-auto absolute inset-x-0 bottom-0 flex items-end overflow-x-auto overscroll-x-contain overflow-y-hidden"
      :style="scrollFrameStyle"
    >
      <div
        ref="stripEl"
        class="pointer-events-auto flex min-w-full items-end gap-2 px-3 sm:px-0"
        :class="handJustifyClass"
        :style="handStyle"
      >
        <button
          v-for="(card, index) in handCards"
          :key="card.key"
          type="button"
          class="group pointer-events-auto relative flex shrink-0 flex-col overflow-visible rounded-2xl border transition-all duration-200 hover:z-40 hover:-translate-y-2 hover:scale-[2.1]"
          :class="[
            thumbClass(card.key),
            originClass(index),
            flippingCardKey === card.key ? 'is-flipping' : '',
          ]"
          :style="{ width: 'var(--workspace-card-rest-w)' }"
          @click="handleCardClick(card)"
        >
          <div class="card-flip relative w-full">
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
const stripEl = ref<HTMLElement | null>(null)
const handWidth = ref(0)
/** The strip's real rendered height, used to size the scroll box. */
const measuredStripHeightPx = ref(0)
const selectedCardKey = ref('')

const CARD_BACKS = [1, 2, 3, 4, 5] as const
type CardBack = (typeof CARD_BACKS)[number]

const CARD_BACK_STORAGE_KEY = 'kr.workspaceCardBack'
const cardBack = ref<CardBack>(1)

function cardBackSrc(back: CardBack): string {
  return `/images/adventure/card/card-back${back}.webp`
}

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
  }
}

let observer: ResizeObserver | null = null

/**
 * The hand's resting height, so app.vue can reserve exactly that much page
 * padding instead of a constant that drifts from what actually renders.
 */
const emit = defineEmits<{ 'resting-height': [px: number] }>()

const gapPx = 8
const horizontalPaddingPx = 16
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

/**
 * Cards keep a legible width and the strip SCROLLS when they do not fit. This
 * used to divide the available width by the card count, which guaranteed they
 * always fit — and produced the worst of both outcomes on a phone.
 *
 * Measured at 428px with four cards, before this change: ideal width came out
 * at 71px, clamped up to the 72px floor, so the cards were at their smallest
 * AND the strip was exactly as wide as its scroller — scrollWidth 324,
 * clientWidth 324, scrollRange ZERO. Silas: "horizontal scrolling is still
 * non-responsive, I can only see those four cards." There was nothing to
 * scroll, by construction, and the cards were tiny for the privilege.
 *
 * A fit-to-count rule cannot win here: making four cards scroll requires them
 * to be wider than a quarter of the screen, which is the opposite of what
 * dividing by the count does. So size cards for legibility and let the
 * overflow scroll — which is what a hand of cards should do anyway.
 *
 * The only clamp left is a safety one: a single card must never be wider than
 * the hand itself.
 */
const restingCardWidthPx = computed(() => {
  const count = handCards.value.length

  if (!count || !handWidth.value) {
    return fallbackRestingCardWidthPx
  }

  const widest = Math.max(
    minRestingCardWidthPx,
    handWidth.value - horizontalPaddingPx,
  )

  return Math.min(maxRestingCardWidthPx.value, widest)
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

/**
 * The scroller is exactly as tall as the cards at rest — NOT the expanded
 * hover-zoom height.
 *
 * It used to be the expanded height (447px at four cards) with the difference
 * as paddingTop (295px), so the cards sat at the bottom of a mostly-empty box.
 * That oversized box then had to be `pointer-events-none` or it would have
 * swallowed clicks on the page behind it — and THAT is what stopped iOS Safari
 * scrolling the hand by touch. Safari will not touch-scroll an
 * `overflow-x: auto` element with `pointer-events: none`, even when its
 * children are `pointer-events: auto`; Chromium will, which is why every
 * headless test passed while Silas's iPhone could not drag the cards
 * (2026-08-04, three cards visible with the third clipped mid-card).
 *
 * `overflow-y: visible` is what makes this safe: the 2.1x zoom still paints
 * outside the box, so the headroom was never needed for painting — only the
 * height was, and only because the box was the wrong size. Sizing it to the
 * cards lets it be pointer-events-auto without covering anything.
 */
const scrollFrameStyle = computed<CSSProperties>(() => {
  /*
   * MEASURED height, with the formula only as the first-paint fallback.
   * restingHandHeightPx overshoots what the cards actually render by ~23px
   * (measured 212 vs 189 at four cards) — harmless when this box was
   * pointer-events-none, but now that it is interactive that overhang would
   * sit over page content and swallow clicks meant for it. Same lesson as the
   * page-padding reservation: read offsetHeight, do not compute it.
   */
  return {
    height: `${measuredStripHeightPx.value || restingHandHeightPx.value}px`,
  }
})

function publishHeight(): void {
  if (!import.meta.client) return

  // Width drives card sizing.
  handWidth.value =
    scrollEl.value?.clientWidth ?? handEl.value?.clientWidth ?? 0

  /*
   * Height flows back up. app.vue reserves --footer-h as padding under the
   * page, and it used to be a fixed 11.5rem that had no relationship to what
   * the hand actually renders: measured at 428px, the cards came to 129px tall
   * inside a 184px reservation, leaving a 67px dead band between the page
   * content and the cards. Silas photographed exactly that gap.
   *
   * Reporting the resting height cannot loop, because card width depends on
   * the hand's WIDTH and the count, never on its height.
   *
   * MEASURED, not computed. restingHandHeightPx is a formula
   * (cardWidth * 1.5 + label + padding) and it overshoots what the cards
   * actually render by ~23px, which is dead band by another name. The strip's
   * own offsetHeight is the truth; `transform: scale` on hover does not affect
   * it, so this stays the resting height even mid-zoom.
   */
  measuredStripHeightPx.value = stripEl.value?.offsetHeight ?? 0

  emit(
    'resting-height',
    measuredStripHeightPx.value || restingHandHeightPx.value,
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

    if (!selectedExists) {
      selectedCardKey.value = storedActiveCardKey.value
    }
  },
  { deep: true },
)

watch(
  [handCards, restingCardWidthPx],
  () => {
    void nextTick(publishHeight)
  },
  { deep: true },
)

onMounted(() => {
  if (!import.meta.client) return

  try {
    const stored = window.localStorage.getItem(CARD_BACK_STORAGE_KEY)
    const parsed = stored ? Number(stored) : NaN

    if (CARD_BACKS.includes(parsed as CardBack)) {
      cardBack.value = parsed as CardBack
    }
  } catch {
    // localStorage can throw in private mode / blocked-cookie contexts. The
    // card back is cosmetic, so falling back to the default is the whole
    // recovery.
  }

  publishHeight()

  observer = new ResizeObserver(() => publishHeight())

  if (handEl.value) {
    observer.observe(handEl.value)
  }

  /*
   * The strip too, not just the frame. The frame's height comes from the
   * expandedHandHeightPx formula, so it does not change when the CARDS do —
   * and the cards are what the reported resting height measures. Without this,
   * the first measurement (taken before the art has loaded and the cards have
   * reached full height) is the only one that ever lands, and the page reserves
   * too little space: measured -54px, i.e. content running under the hand.
   *
   * No feedback loop: the reported height drives page padding and the footer
   * slot, while card size derives from the hand's WIDTH.
   */
  if (stripEl.value) {
    observer.observe(stripEl.value)
  }

  if (scrollEl.value) {
    observer.observe(scrollEl.value)
  }

  if (stripEl.value) {
    stripEl.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()

  if (stripEl.value) {
    stripEl.value.removeEventListener('wheel', handleWheel)
  }

  if (flipTimer) clearTimeout(flipTimer)
})
</script>

<style scoped>
.workspace-hand-scroll {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  /* No touch-action here — see the note in the template. It was set in BOTH
     this block and a `touch-pan-x` utility on the element, so removing only the
     utility changed nothing and measured as still `pan-x`. */
  cursor: grab;
}

.workspace-hand-scroll:active {
  cursor: grabbing;
}

.workspace-hand-scroll::-webkit-scrollbar {
  display: none;
}

.card-flip {
  transform-style: preserve-3d;
  transition: transform 0s;
}

.card-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

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

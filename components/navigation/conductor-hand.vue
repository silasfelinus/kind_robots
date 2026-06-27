<!-- /components/navigation/conductor-hand.vue -->
<template>
  <div class="conductor-hand flex min-h-0 w-full flex-col gap-4">
    <!-- Header row with active card detail -->
    <Transition name="card-detail-fade" mode="out-in">
      <div
        v-if="activeCard"
        :key="activeCard.key"
        class="flex min-h-0 shrink-0 items-start gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        <div
          class="relative aspect-2/3 w-20 shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-300 shadow-md"
        >
          <img
            v-if="activeCard.deckImage"
            :src="activeCard.deckImage"
            :alt="activeCard.label"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center"
          >
            <Icon :name="activeCard.icon || 'kind-icon:cards'" class="h-8 w-8 text-base-content/30" />
          </div>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="badge badge-sm font-bold uppercase tracking-widest"
              :class="kindClass(activeCard.projectKind)"
            >
              {{ KIND_LABEL[activeCard.projectKind] }}
            </span>

            <span
              class="badge badge-sm font-bold"
              :class="STATUS_CLASS[activeCard.taskStatus]"
            >
              {{ STATUS_LABEL[activeCard.taskStatus] }}
            </span>
          </div>

          <h3 class="text-lg font-black leading-tight text-base-content">
            {{ activeCard.title }}
          </h3>

          <p class="text-sm font-semibold leading-relaxed text-base-content/60">
            {{ activeCard.description }}
          </p>
        </div>
      </div>
    </Transition>

    <!-- Card tray -->
    <div
      ref="scrollEl"
      class="conductor-scroll pointer-events-auto flex touch-pan-x items-end gap-2 overflow-x-auto overscroll-x-contain overflow-y-visible px-1 pb-4"
    >
      <button
        v-for="(card, index) in cards"
        :key="card.key"
        type="button"
        class="group relative flex shrink-0 flex-col overflow-visible rounded-2xl border transition-all duration-200 hover:z-40 hover:-translate-y-3 hover:scale-[1.15] active:z-40 active:-translate-y-3 active:scale-[1.15]"
        :class="[
          thumbClass(card.key),
          originClass(index),
          flippingCardKey === card.key ? 'is-flipping' : '',
        ]"
        style="width: var(--conductor-card-w, 108px)"
        @click="handleCardClick(card)"
      >
        <div class="card-flip relative w-full">
          <!-- Card front -->
          <div
            class="card-face card-front relative flex w-full flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg"
          >
            <div class="relative aspect-2/3 w-full overflow-hidden bg-base-300">
              <img
                v-if="card.deckImage"
                :src="card.deckImage"
                :alt="card.label"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center"
              >
                <Icon
                  :name="card.icon || 'kind-icon:cards'"
                  class="h-10 w-10 text-base-content/25"
                />
              </div>

              <!-- Kind badge overlay -->
              <div class="absolute left-1.5 top-1.5">
                <span
                  class="badge badge-xs font-bold uppercase tracking-widest opacity-90"
                  :class="kindClass(card.projectKind)"
                >
                  {{ card.projectKind[0] }}
                </span>
              </div>

              <!-- Needs-human glow -->
              <div
                v-if="card.taskStatus === 'needs-human'"
                class="absolute inset-0 animate-pulse bg-primary/15"
              />
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

          <!-- Card back -->
          <div
            class="card-face card-back absolute inset-0 flex w-full flex-col overflow-hidden rounded-2xl bg-base-100 shadow-lg"
          >
            <div class="relative aspect-2/3 w-full overflow-hidden bg-base-300">
              <img
                :src="cardBackSrc"
                alt="Card back"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="w-full bg-base-100 px-1.5 py-1.5">
              <p class="text-center text-[0.65rem] leading-none sm:text-xs">&nbsp;</p>
            </div>
          </div>
        </div>

        <!-- Sparkle layer -->
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
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  KIND_LABEL,
  STATUS_CLASS,
  STATUS_LABEL,
  type ConductorCard,
  type ConductorProjectKind,
} from '@/stores/helpers/conductorCards'
import { useConductorStore } from '@/stores/conductorStore'
import { usePageStore } from '@/stores/pageStore'

const conductorStore = useConductorStore()
const pageStore = usePageStore()

const scrollEl = ref<HTMLElement | null>(null)
const flippingCardKey = ref('')
const FLIP_DURATION_MS = 650
let flipTimer: ReturnType<typeof setTimeout> | null = null

const cardBackSrc = '/images/adventure/card/card-back1.webp'

const cards = computed(() => conductorStore.conductorCards)

const activeCardKey = computed(
  () => pageStore.workspaceCardKey || cards.value[0]?.key || '',
)

const activeCard = computed(
  () => cards.value.find((c) => c.key === activeCardKey.value) ?? null,
)

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

function triggerFlip(cardKey: string): void {
  if (flipTimer) clearTimeout(flipTimer)

  flippingCardKey.value = cardKey

  flipTimer = setTimeout(() => {
    flippingCardKey.value = ''
    flipTimer = null
  }, FLIP_DURATION_MS)
}

function handleCardClick(card: ConductorCard): void {
  pageStore.setWorkspaceCardKey(card.key)
  triggerFlip(card.key)
}

function thumbClass(cardKey: string): string {
  if (activeCardKey.value === cardKey) {
    return 'z-30 border-primary bg-primary/10 shadow-lg shadow-primary/20'
  }

  return 'z-10 border-base-300 bg-base-200 hover:border-primary/60'
}

function originClass(index: number): string {
  if (index === 0) return 'origin-bottom-left'
  if (index === cards.value.length - 1) return 'origin-bottom-right'

  return 'origin-bottom'
}

function kindClass(kind: ConductorProjectKind): string {
  if (kind === 'software') return 'badge-info'
  if (kind === 'content') return 'badge-secondary'

  return 'badge-warning'
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

  if (nextScrollLeft === el.scrollLeft) return

  event.preventDefault()
  el.scrollLeft = nextScrollLeft
}

onMounted(() => {
  if (scrollEl.value) {
    scrollEl.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onBeforeUnmount(() => {
  if (scrollEl.value) {
    scrollEl.value.removeEventListener('wheel', handleWheel)
  }

  if (flipTimer) clearTimeout(flipTimer)
})
</script>

<style scoped>
.conductor-scroll {
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  cursor: grab;
}

.conductor-scroll:active {
  cursor: grabbing;
}

.conductor-scroll::-webkit-scrollbar {
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

.card-detail-fade-enter-active,
.card-detail-fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.card-detail-fade-enter-from,
.card-detail-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
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

  .card-detail-fade-enter-active,
  .card-detail-fade-leave-active {
    transition: none;
  }
}
</style>

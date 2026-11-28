<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTarotReaderStore } from '~/stores/tarotReaderStore'
import type { OracleReading } from '~/utils/oracle/types'

const props = defineProps<{ reading: OracleReading }>()
const store = useTarotReaderStore()
const revealed = ref(0)
let timers: ReturnType<typeof setTimeout>[] = []

const cards = computed(() =>
  props.reading.cards.map((drawn) => {
    const deckCard = store.cardByOracleId[drawn.card.id]
    return {
      ...drawn,
      key: deckCard?.key ?? '',
      imageUrl: deckCard?.imageUrl ?? null,
    }
  }),
)

function clearTimers() {
  timers.forEach((timer) => clearTimeout(timer))
  timers = []
}

watch(
  () => `${props.reading.seed}:${props.reading.spread}:${store.activeDeckSlug}`,
  () => {
    clearTimers()
    revealed.value = 0
    if (!store.revealDelay) {
      revealed.value = props.reading.cards.length
      return
    }
    props.reading.cards.forEach((_, index) => {
      timers.push(
        setTimeout(
          () => {
            revealed.value = index + 1
            store.playSfx('flip')
          },
          250 + index * store.revealDelay,
        ),
      )
    })
  },
  { immediate: true },
)

onBeforeUnmount(clearTimers)

function revealAll() {
  clearTimers()
  revealed.value = props.reading.cards.length
}
</script>

<template>
  <div
    class="tarot-spread flex flex-wrap items-start justify-center gap-3"
    :data-count="cards.length"
    @click="revealAll"
  >
    <figure
      v-for="(drawn, index) in cards"
      :key="`${reading.seed}-${drawn.position.id}`"
      class="tarot-slot min-w-0"
    >
      <div class="tarot-flip" :class="{ 'is-revealed': index < revealed }">
        <div class="tarot-flip-face tarot-flip-back">
          <tarot-card-face
            :title="drawn.card.title"
            side="back"
            :back-url="store.tableBackUrl"
          />
        </div>
        <div class="tarot-flip-face tarot-flip-front">
          <tarot-card-face
            :title="drawn.card.title"
            :card-key="drawn.key"
            :image-url="drawn.imageUrl"
            :reversed="drawn.orientation === 'reversed'"
          />
        </div>
      </div>
      <figcaption class="mt-1 text-center">
        <span class="block text-[10px] uppercase tracking-widest opacity-75">
          {{ drawn.position.label }}
        </span>
        <span class="block truncate text-xs font-bold">
          {{ drawn.card.title }}
          <span v-if="drawn.orientation === 'reversed'" class="opacity-75">
            ↺
          </span>
        </span>
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.tarot-slot {
  width: clamp(78px, 26%, 190px);
}

.tarot-spread[data-count='1'] .tarot-slot {
  width: clamp(130px, 46%, 240px);
}

.tarot-spread[data-count='5'] .tarot-slot {
  width: clamp(70px, 18%, 170px);
}

.tarot-flip {
  position: relative;
  aspect-ratio: 2 / 3;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tarot-flip.is-revealed {
  transform: rotateY(180deg);
}

.tarot-flip-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}

.tarot-flip-front {
  transform: rotateY(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .tarot-flip {
    transition: none;
  }
}
</style>

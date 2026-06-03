<!-- components/adventure/adventure-hand.vue -->
<!--
  The hand tray: horizontal scroll of all visible cards.
  Pinned to the bottom of adventure-builder.
  Active card lifts. Completed cards dim. Locked cards ghost out.
  No emits. Card selection via adventure-card → store.selectCard.
-->
<template>
  <div class="hand-tray relative w-full">
    <!-- Fade edges — left -->
    <div
      class="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-linear-to-r from-base-200 to-transparent"
      :class="{ 'opacity-0': scrolledToStart }"
    />

    <!-- Fade edges — right -->
    <div
      class="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-linear-to-l from-base-200 to-transparent"
      :class="{ 'opacity-0': scrolledToEnd }"
    />

    <!-- Scroll container -->
    <div
      ref="scrollEl"
      class="flex items-end gap-2 overflow-x-auto px-4 pb-3 pt-2 scroll-smooth"
      style="scrollbar-width: none; -ms-overflow-style: none"
      @scroll="onScroll"
    >
      <!-- All visible cards -->
      <adventure-card
        v-for="card in store.visibleCards"
        :key="card.key"
        :card="card"
      />

      <!-- Spacer so the last card doesn't butt against the edge -->
      <div class="w-2 shrink-0" aria-hidden="true" />
    </div>

    <!-- Empty state — all cards complete, portrait not started -->
    <Transition name="fade">
      <div
        v-if="!store.visibleCards.length"
        class="flex items-center justify-center px-4 py-4 text-center"
      >
        <p class="text-sm italic text-base-content/40">
          All cards played. The sheet is complete. The portrait awaits, if you
          want one.
        </p>
      </div>
    </Transition>

    <!-- Card count badge -->
    <div
      v-if="store.visibleCards.length > 0"
      class="pointer-events-none absolute right-10 top-2 rounded-full bg-base-300 px-2 py-0.5 text-[0.6rem] font-bold text-base-content/40"
    >
      {{ store.visibleCards.length }} remaining
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'

const store = useAdventureStore()
const scrollEl = ref<HTMLElement | null>(null)

const scrolledToStart = ref(true)
const scrolledToEnd = ref(false)

function onScroll() {
  if (!scrollEl.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollEl.value
  scrolledToStart.value = scrollLeft <= 4
  scrolledToEnd.value = scrollLeft + clientWidth >= scrollWidth - 4
}

onMounted(() => onScroll())
</script>

<style scoped>
/* Hide scrollbar cross-browser */
div::-webkit-scrollbar {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 300ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

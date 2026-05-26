<!-- components/pitches/pitch-hand.vue -->
<!-- Scrollable card tray for the pitch builder. -->
<template>
  <div
    class="flex items-center gap-2 overflow-x-auto px-4 py-2.5 scrollbar-thin"
  >
    <button
      v-for="card in store.visibleCards"
      :key="card.key"
      type="button"
      class="relative flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-3 py-2 text-center transition-all duration-200"
      :class="cardClass(card.key)"
      @click="store.selectCard(card.key)"
    >
      <Icon :name="card.icon" class="h-5 w-5" />
      <span class="text-xs font-bold leading-tight">{{ card.label }}</span>

      <!-- Completed dot -->
      <span
        v-if="store.completedCards[card.key]"
        class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-content"
      >
        <Icon name="kind-icon:check" class="h-2.5 w-2.5" />
      </span>

      <!-- Optional badge -->
      <span
        v-if="!card.required && !store.completedCards[card.key]"
        class="absolute -right-1 -top-1 rounded-full bg-base-300 px-1.5 py-0.5 text-[10px] font-bold text-base-content/50"
      >
        opt
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePitchStore } from '@/stores/pitchStore'
import type { PitchCard } from '@/stores/helpers/pitchCards'

const store = usePitchStore()

function cardClass(key: string): string {
  if (store.activeCardKey === key)
    return 'border-primary bg-primary/10 text-primary scale-105 shadow-md shadow-primary/20'
  if (store.completedCards[key])
    return 'border-success/40 bg-success/5 text-success/80 hover:border-success hover:shadow-sm'
  return 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 hover:shadow-sm'
}
</script>

<!-- /components/builder/builder-card-grid.vue -->
<template>
  <section class="flex min-h-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-primary/70">Choose a card</p>
        <h2 class="text-2xl font-black text-base-content">{{ store.activeConfig.title }}</h2>
        <p class="max-w-3xl text-sm leading-relaxed text-base-content/60">{{ store.splash.tagline }}</p>
      </div>

      <button type="button" class="btn btn-sm btn-ghost rounded-xl border border-base-300" @click="store.randomCard()">
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        Random card
      </button>
    </div>

    <div v-if="store.visibleCards.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <builder-card v-for="card in store.visibleCards" :key="card.key" :card="card" />
    </div>

    <div v-else class="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-8 text-center">
      <Icon name="kind-icon:check" class="h-12 w-12 text-success" />
      <h3 class="text-xl font-black text-base-content">Deck complete</h3>
      <p class="max-w-lg text-sm text-base-content/60">Everything required is filled. The sheet is either ready for final interaction or ready to become a much larger problem.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
</script>

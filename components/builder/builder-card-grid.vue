<!-- /components/builder/builder-card-grid.vue -->
<template>
  <section
    class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
  >
    <div
      class="flex shrink-0 flex-col gap-2 border-b border-base-300 p-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-widest text-primary/70">
          Choose a card
        </p>
        <h2 class="truncate text-2xl font-black text-base-content">
          {{ store.activeConfig.title }}
        </h2>
        <p class="max-w-3xl text-sm leading-relaxed text-base-content/60">
          {{ store.splash.tagline }}
        </p>
      </div>

      <button
        type="button"
        class="btn btn-sm btn-ghost shrink-0 rounded-xl border border-base-300"
        @click="store.randomCard()"
      >
        <Icon name="kind-icon:dice" class="h-4 w-4" />
        Random card
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
      <div
        v-if="store.visibleCards.length"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <builder-card
          v-for="card in store.visibleCards"
          :key="card.key"
          :card="card"
        />
      </div>

      <div
        v-else
        class="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-8 text-center"
      >
        <Icon name="kind-icon:check" class="h-12 w-12 text-success" />
        <h3 class="text-xl font-black text-base-content">Deck complete</h3>
        <p class="max-w-lg text-sm text-base-content/60">
          Everything required is filled. The sheet is either ready for final
          interaction or ready to become a much larger problem.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()
</script>

<!-- /components/builder/builder-card.vue -->
<template>
  <button
    type="button"
    class="group flex min-h-52 overflow-hidden rounded-2xl border-2 bg-base-200 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    :class="cardClass"
    @click="store.selectCard(card.key)"
  >
    <div class="relative w-28 shrink-0 overflow-hidden bg-base-300 sm:w-32">
      <img
        v-if="card.deckImage"
        :src="card.deckImage"
        :alt="card.label"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center bg-base-300">
        <Icon :name="card.icon || 'kind-icon:cards'" class="h-10 w-10 text-base-content/30" />
      </div>

      <div v-if="isCompleted" class="absolute inset-0 flex items-center justify-center bg-success/25 backdrop-blur-[2px]">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-content shadow-lg">
          <Icon name="kind-icon:check" class="h-5 w-5" />
        </div>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2 p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-black uppercase tracking-widest text-primary/70">{{ card.label }}</p>
          <h3 class="line-clamp-2 text-lg font-black leading-tight text-base-content">{{ card.title }}</h3>
        </div>
        <Icon :name="card.icon" class="h-5 w-5 shrink-0 text-primary/70" />
      </div>

      <p class="line-clamp-2 text-sm font-semibold text-secondary">{{ card.tagline }}</p>
      <p class="line-clamp-4 text-sm leading-relaxed text-base-content/60">{{ card.narrative }}</p>

      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <span class="text-xs font-bold text-base-content/40">{{ card.steps.length }} step{{ card.steps.length === 1 ? '' : 's' }}</span>
        <span class="badge rounded-xl" :class="isCompleted ? 'badge-success' : 'badge-primary badge-outline'">
          {{ isCompleted ? 'done' : 'open' }}
        </span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'

const props = defineProps<{ card: BuilderCard }>()
const store = useBuilderStore()

const isCompleted = computed(() => Boolean(store.completedCards[props.card.key]))
const isActive = computed(() => store.activeCardKey === props.card.key)

const cardClass = computed(() => {
  if (isActive.value) return 'border-primary bg-primary/5'
  if (isCompleted.value) return 'border-success/50 bg-success/5'
  return 'border-base-300 hover:border-primary/60'
})
</script>

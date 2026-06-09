<!-- /components/builder/builder-card.vue -->
<template>
  <button
    type="button"
    class="group flex min-h-56 w-full flex-col overflow-hidden rounded-2xl border-2 bg-base-200 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:min-h-60 lg:min-h-64 xl:flex-row"
    :class="cardClass"
    @click="store.selectCard(card.key)"
  >
    <div
      class="relative flex min-h-48 w-full shrink-0 items-center justify-center overflow-hidden bg-base-300 sm:min-h-56 lg:min-h-64 xl:min-h-full xl:w-2/5 xl:max-w-sm"
    >
      <img
        v-if="card.deckImage"
        :src="card.deckImage"
        :alt="card.label"
        class="h-full max-h-full w-full max-w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        decoding="async"
      />

      <div
        v-else
        class="flex h-full min-h-48 w-full items-center justify-center bg-base-300 sm:min-h-56 lg:min-h-64"
      >
        <Icon
          :name="card.icon || 'kind-icon:cards'"
          class="h-12 w-12 text-base-content/30"
        />
      </div>

      <div
        v-if="isCompleted"
        class="absolute inset-0 flex items-center justify-center bg-success/25 backdrop-blur-[2px]"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-content shadow-lg"
        >
          <Icon name="kind-icon:check" class="h-6 w-6" />
        </div>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p
            class="text-xs font-black uppercase tracking-widest text-primary/70"
          >
            {{ card.label }}
          </p>

          <h3 class="line-clamp-2 text-xl font-black leading-tight text-base-content">
            {{ card.title }}
          </h3>
        </div>

        <Icon
          :name="card.icon || 'kind-icon:cards'"
          class="h-6 w-6 shrink-0 text-primary/70"
        />
      </div>

      <div class="min-h-0 flex-1 space-y-2">
        <p class="line-clamp-2 text-sm font-bold leading-snug text-secondary">
          {{ card.tagline }}
        </p>

        <p class="line-clamp-3 text-sm leading-relaxed text-base-content/60 sm:line-clamp-4">
          {{ card.narrative }}
        </p>
      </div>

      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <span class="text-xs font-bold text-base-content/40">
          {{ card.steps.length }} step{{ card.steps.length === 1 ? '' : 's' }}
        </span>

        <span
          class="badge rounded-xl font-black"
          :class="isCompleted ? 'badge-success' : 'badge-primary badge-outline'"
        >
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
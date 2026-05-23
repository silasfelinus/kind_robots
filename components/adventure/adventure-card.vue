<!-- components/adventure/adventure-card.vue -->
<!--
  Single card thumbnail in the hand tray.
  Reads its own completion and active state from adventureStore.
  No props beyond the card key — everything else comes from the store.
  No emits. Calls store.selectCard directly.
-->
<template>
  <button
    type="button"
    class="card-thumb group relative flex shrink-0 flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200 select-none"
    :class="thumbClass"
    :aria-label="`${card.label}${isCompleted ? ' (completed)' : isActive ? ' (active)' : ''}`"
    @click="store.selectCard(card.key)"
  >
    <!-- Card image -->
    <div class="relative aspect-2/3 w-full overflow-hidden bg-base-300">
      <img
        v-if="card.deckImage"
        :src="card.deckImage"
        :alt="card.label"
        class="h-full w-full object-cover transition-transform duration-300"
        :class="isActive ? 'scale-105' : 'group-hover:scale-103'"
      />

      <!-- Fallback: large flourish -->
      <div v-else class="flex h-full w-full items-center justify-center">
        <span
          class="text-5xl opacity-20 transition-opacity group-hover:opacity-35 select-none"
        >
          {{ card.flourish }}
        </span>
      </div>

      <!-- Completed overlay -->
      <Transition name="complete-fade">
        <div
          v-if="isCompleted"
          class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-success/20 backdrop-blur-[2px]"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-success shadow-md shadow-success/30"
          >
            <Icon name="kind-icon:check" class="h-4 w-4 text-success-content" />
          </div>
          <span
            class="text-[0.6rem] font-black uppercase tracking-widest text-success drop-shadow"
          >
            done
          </span>
        </div>
      </Transition>

      <!-- Active indicator -->
      <div
        v-if="isActive && !isCompleted"
        class="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-sm shadow-primary/50"
      />

      <!-- Unlock locked state -->
      <div
        v-if="isLocked"
        class="absolute inset-0 flex items-center justify-center bg-base-300/60 backdrop-blur-[1px]"
      >
        <Icon name="kind-icon:lock" class="h-5 w-5 text-base-content/30" />
      </div>
    </div>

    <!-- Label strip -->
    <div
      class="flex flex-col items-center gap-0.5 px-2 py-2 transition-colors"
      :class="isActive ? 'bg-primary/10' : 'bg-base-100'"
    >
      <p
        class="w-full truncate text-center text-xs font-black leading-tight transition-colors"
        :class="
          isActive
            ? 'text-primary'
            : isCompleted
              ? 'text-success'
              : isLocked
                ? 'text-base-content/30'
                : 'text-base-content/75 group-hover:text-base-content'
        "
      >
        {{ card.label }}
      </p>

      <p
        class="text-center text-[0.55rem] uppercase tracking-widest opacity-40"
      >
        {{ card.flourish }}
      </p>
    </div>

    <!-- Active glow ring -->
    <div
      v-if="isActive"
      class="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary ring-offset-1 ring-offset-base-100"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import type { AdventureCard } from '@/stores/helpers/adventureCards'

const props = defineProps<{
  card: AdventureCard
}>()

const store = useAdventureStore()

const isActive = computed(() => store.activeCardKey === props.card.key)
const isCompleted = computed(() =>
  Boolean(store.completedCards[props.card.key]),
)

// Locked = unlock condition not yet met
const isLocked = computed(() => {
  const cond = props.card.unlockCondition
  if (!cond || cond === 'always') return false
  if (cond === 'coreComplete') return !store.coreComplete
  if (cond === 'allComplete') return !store.allComplete
  return false
})

const thumbClass = computed(() => {
  if (isLocked.value) {
    return 'border-base-300 bg-base-200 opacity-40 cursor-not-allowed w-24'
  }
  if (isActive.value) {
    return 'border-primary shadow-lg shadow-primary/25 -translate-y-2 w-24 z-10'
  }
  if (isCompleted.value) {
    return 'border-success/40 bg-base-100 w-24 opacity-70 hover:opacity-100 hover:-translate-y-1'
  }
  return 'border-base-300 bg-base-100 w-24 hover:border-primary/40 hover:-translate-y-1 hover:shadow-md cursor-pointer'
})
</script>

<style scoped>
.card-thumb {
  -webkit-tap-highlight-color: transparent;
}

.scale-103 {
  --tw-scale-x: 1.03;
  --tw-scale-y: 1.03;
  transform: var(--tw-transform);
}

.complete-fade-enter-active {
  transition: opacity 250ms ease;
}
.complete-fade-leave-active {
  transition: opacity 150ms ease;
}
.complete-fade-enter-from,
.complete-fade-leave-to {
  opacity: 0;
}
</style>

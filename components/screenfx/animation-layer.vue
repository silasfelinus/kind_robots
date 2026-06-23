<!-- /components/content/animation/animation-layer.vue -->
<template>
  <Teleport to="body">
    <Transition name="animation-layer-fade">
      <div
        v-if="animationStore.isActive"
        class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
        aria-live="polite"
      >
        <div
          class="pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-base-content shadow-xl backdrop-blur-md"
        >
          <span class="loading loading-spinner loading-sm text-primary" />

          <Icon
            :name="animationStore.activeEffect?.icon || 'kind-icon:sparkles'"
            class="h-5 w-5 shrink-0 text-secondary"
          />

          <animation-interact class="pointer-events-auto shrink-0" />

          <span class="min-w-0 truncate">
            {{ animationStore.message || 'Generating art...' }}
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// /components/content/animation/animation-layer.vue
// The generation effect itself now renders through <fx-region /> surfaces
// inside the header, sheet, page, and hand. This layer is only the status
// pill and effect controls.
import { useAnimationStore } from '@/stores/animationStore'

const animationStore = useAnimationStore()
</script>

<style scoped>
.animation-layer-fade-enter-active,
.animation-layer-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.animation-layer-fade-enter-from,
.animation-layer-fade-leave-to {
  opacity: 0;
  transform: scale(0.985);
}

.animation-layer-fade-enter-to,
.animation-layer-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>

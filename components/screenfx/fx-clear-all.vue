<!-- /components/content/screenfx/fx-clear-all.vue -->
<template>
  <Teleport to="body">
    <Transition name="fade-up">
      <button
        v-if="animationStore.screenEffectCount > 0"
        class="escape-btn"
        title="Clear all effects"
        type="button"
        @click="animationStore.clearScreenEffects()"
      >
        <Icon name="kind-icon:close" class="h-5 w-5" />
        <span>clear all</span>
        <strong>{{ animationStore.screenEffectCount }}</strong>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// /components/content/screenfx/fx-clear-all.vue
import { useAnimationStore } from '@/stores/animationStore'

const animationStore = useAnimationStore()
</script>

<style scoped>
.escape-btn {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, hsl(var(--er)) 45%, white 15%);
  border-radius: 999px;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(255, 255, 255, 0.22),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      hsl(var(--er)),
      color-mix(in srgb, hsl(var(--er)) 70%, black 30%)
    );
  color: hsl(var(--erc));
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  box-shadow:
    0 1.25rem 3rem rgba(0, 0, 0, 0.35),
    0 0 0 0.25rem rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.escape-btn:hover {
  transform: translateY(-2px) scale(1.03);
  filter: saturate(1.2);
  box-shadow:
    0 1.5rem 3.5rem rgba(0, 0, 0, 0.42),
    0 0 0 0.3rem rgba(255, 255, 255, 0.12);
}

.escape-btn:active {
  transform: translateY(0) scale(0.98);
}

.escape-btn strong {
  display: grid;
  min-width: 1.55rem;
  height: 1.55rem;
  place-items: center;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.24);
  font-size: 0.8rem;
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.96);
}

@media (max-width: 480px) {
  .escape-btn {
    right: max(0.75rem, env(safe-area-inset-right));
    bottom: max(0.75rem, env(safe-area-inset-bottom));
    min-height: 2.75rem;
    padding: 0.65rem 0.85rem;
    font-size: 0.75rem;
  }
}
</style>

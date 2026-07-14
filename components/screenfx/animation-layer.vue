<!-- /components/screenfx/animation-layer.vue -->
<template>
  <Teleport to="body">
    <Transition name="animation-layer-fade">
      <div
        v-if="animationStore.isActive && activeComponent"
        class="animation-effect-layer"
        aria-hidden="true"
      >
        <component
          :is="activeComponent"
          :key="animationStore.activeEffectId"
          class="animation-effect-layer__effect"
        />
      </div>
    </Transition>

    <Transition name="animation-layer-fade">
      <div
        v-if="animationStore.isActive"
        class="animation-status-layer pointer-events-none flex justify-center px-4"
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
import { computed, resolveComponent } from 'vue'
import {
  getAnimationComponentName,
  type AnimationEffectId,
} from '@/stores/animationCatalog'
import { useAnimationStore } from '@/stores/animationStore'

const animationStore = useAnimationStore()

const componentsMap = new Map<
  AnimationEffectId,
  ReturnType<typeof resolveComponent>
>(
  animationStore.effects.map((effect) => [
    effect.id,
    resolveComponent(getAnimationComponentName(effect.id)),
  ]),
)

const activeComponent = computed(() => {
  const effectId = animationStore.activeEffectId
  if (!effectId) return null
  return componentsMap.get(effectId) || null
})
</script>

<style scoped>
.animation-effect-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
}

.animation-effect-layer__effect {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.animation-status-layer {
  position: fixed;
  inset-inline: 0;
  bottom: 1rem;
  z-index: 90;
}

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
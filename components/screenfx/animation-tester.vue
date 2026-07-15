<!-- /components/screenfx/animation-tester.vue -->
<template>
  <div
    class="animation-tester-container mx-auto max-w-lg rounded-2xl bg-base-200 p-8"
  >
    <h2 class="mb-6 text-4xl font-bold text-primary">Animation Tester</h2>

    <div class="mb-4 text-lg font-bold text-info">
      Current Animation:
      <span v-if="animationStore.isActive">{{ currentAnimationLabel }}</span>
      <span v-else>None</span>
    </div>

    <div class="flex flex-col space-y-4">
      <button
        v-for="effect in effects"
        :key="effect.id"
        class="btn text-white"
        :class="{
          'bg-secondary hover:bg-secondary-focus':
            animationStore.activeEffectId !== effect.id,
          'bg-primary hover:bg-primary-focus':
            animationStore.activeEffectId === effect.id && animationStore.isActive,
        }"
        type="button"
        @click="startAnimation(effect.id)"
      >
        Start {{ effect.label }} Animation
      </button>
    </div>

    <div class="mt-6">
      <button
        class="btn bg-accent text-white hover:bg-accent-focus"
        type="button"
        @click="startRandomAnimation"
      >
        Start Random Animation
      </button>
    </div>

    <div class="mt-6">
      <button
        class="btn bg-error text-white hover:bg-error-focus"
        type="button"
        @click="animationStore.stop()"
      >
        Stop Animation
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAnimationStore } from '@/stores/animationStore'
import type { AnimationEffectId } from '@/stores/animationCatalog'

const animationStore = useAnimationStore()

const effects = computed(() => animationStore.safeEffects)

const currentAnimationLabel = computed(() => {
  return animationStore.activeEffect?.label || 'None'
})

function startAnimation(effectId: AnimationEffectId): void {
  const effect = effects.value.find((entry) => entry.id === effectId)
  if (!effect) return

  animationStore.start({
    effectId,
    message: `${effect.label} test`,
    durationMs: null,
  })
}

function startRandomAnimation(): void {
  const available = effects.value
  if (!available.length) return

  const effect = available[Math.floor(Math.random() * available.length)]
  if (!effect) return

  startAnimation(effect.id)
}
</script>

<style scoped>
.animation-tester-container {
  max-width: 400px;
}

.btn {
  padding: 0.5rem 1rem;
  font-weight: 700;
  border-radius: 0.5rem;
  transition: transform 0.2s ease;
}

.btn:hover {
  transform: scale(1.05);
}

.btn:active {
  transform: scale(0.95);
}
</style>

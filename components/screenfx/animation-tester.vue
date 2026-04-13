<!-- /components/content/screenfx/animation-tester.vue -->
<template>
  <div
    class="animation-tester-container bg-base-200 p-8 rounded-lg max-w-lg mx-auto"
  >
    <h2 class="text-4xl font-bold mb-6 text-primary">Animation Tester</h2>

    <div class="text-lg mb-4 font-bold text-info">
      Current Animation:
      <span v-if="isAnimating">{{ currentAnimationLabel }}</span>
      <span v-else>None</span>
    </div>

    <div class="flex flex-col space-y-4">
      <button
        v-for="effect in effects"
        :key="effect.id"
        class="btn text-white"
        :class="{
          'bg-secondary hover:bg-secondary-focus':
            currentAnimation !== effect.id,
          'bg-primary hover:bg-primary-focus':
            currentAnimation === effect.id && isAnimating,
        }"
        @click="startAnimation(effect.id)"
      >
        Start {{ effect.label }} Animation
      </button>
    </div>

    <div class="mt-6">
      <button
        class="btn bg-accent hover:bg-accent-focus text-white"
        @click="startRandomAnimation"
      >
        Start Random Animation
      </button>
    </div>

    <div class="mt-6">
      <button
        class="btn bg-error hover:bg-error-focus text-white"
        @click="stopAnimation"
      >
        Stop Animation
      </button>
    </div>

    <div v-if="errorMessage" class="mt-6 text-error text-lg font-semibold">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type { EffectId } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const errorStore = useErrorStore()

const errorMessage = ref<string | null>(null)

const effects = ref<Array<{ id: EffectId; label: string }>>([
  { id: 'bubble-effect', label: 'Bubble Fiesta' },
  { id: 'fizzy-bubbles', label: 'Fizzy Lifting' },
  { id: 'rain-effect', label: 'Rainmaker' },
  { id: 'butterfly-animation', label: 'Butterfly Scouts' },
])

const isAnimating = computed(() => displayStore.isAnimating)
const currentAnimation = computed(() => displayStore.currentAnimation)
const currentAnimationLabel = computed(() => {
  const effect = effects.value.find((e) => e.id === currentAnimation.value)
  return effect ? effect.label : 'None'
})

watch(
  () => errorStore.getError,
  (newError) => {
    if (newError) {
      errorMessage.value = `Error: ${newError}`
    } else {
      errorMessage.value = null
    }
  },
)

const startAnimation = (animationId: EffectId) => {
  try {
    displayStore.toggleAnimationById(animationId)
  } catch (error) {
    reportError('Failed to start the animation', error)
  }
}

const startRandomAnimation = () => {
  try {
    displayStore.toggleRandomAnimation()
  } catch (error) {
    reportError('Failed to start a random animation', error)
  }
}

const stopAnimation = () => {
  try {
    displayStore.stopAnimation()
  } catch (error) {
    reportError('Failed to stop the animation', error)
  }
}

const reportError = (contextMessage: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  errorStore.setError(ErrorType.GENERAL_ERROR, `${contextMessage}: ${message}`)
}
</script>

<style scoped>
.animation-tester-container {
  padding: 2rem;
  background-color: var(--bg-base-200);
  border-radius: 0.5rem;
  max-width: 400px;
  margin: auto;
}

.text-error {
  color: var(--error);
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

<template>
  <div
    class="animation-tester-container bg-base-200 p-8 rounded-lg max-w-lg mx-auto"
  >
    <h2 class="text-4xl font-bold mb-6 text-primary">Animation Tester</h2>

    <!-- Current Animation State -->
    <div class="text-lg mb-4 font-bold text-info">
      Current Animation:
      <span v-if="isAnimating">{{ currentAnimationLabel }}</span>
      <span v-else>None</span>
    </div>

    <!-- Buttons to trigger specific animations -->
    <div class="flex flex-col space-y-4">
      <button
        v-for="effect in effects"
        :key="effect.id"
        class="btn text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 active:scale-95"
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

    <!-- Button to start a random animation -->
    <div class="mt-6">
      <button
        class="btn bg-accent hover:bg-accent-focus text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 active:scale-95"
        @click="startRandomAnimation"
      >
        Start Random Animation
      </button>
    </div>

    <!-- Button to stop the animation -->
    <div class="mt-6">
      <button
        class="btn bg-error hover:bg-error-focus text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 active:scale-95"
        @click="stopAnimation"
      >
        Stop Animation
      </button>
    </div>

    <!-- Display any errors encountered -->
    <div v-if="errorMessage" class="mt-6 text-error text-lg font-semibold">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type { EffectId } from '@/stores/displayStore' // Importing the EffectId type

// Fetch the display store to control animations
const displayStore = useDisplayStore()
const errorStore = useErrorStore()

// Reactive state for errors
const errorMessage = ref<string | null>(null)

// Define the available effects
const effects = ref<Array<{ id: EffectId; label: string }>>([
  { id: 'bubble-effect', label: 'Bubble Fiesta' },
  { id: 'fizzy-bubbles', label: 'Fizzy Lifting' },
  { id: 'rain-effect', label: 'Rainmaker' },
  { id: 'butterfly-animation', label: 'Butterfly Scouts' },
])

// Computed properties to track the current animation state
const isAnimating = computed(() => displayStore.isAnimating)
const currentAnimation = computed(() => displayStore.currentAnimation)
const currentAnimationLabel = computed(() => {
  const effect = effects.value.find((e) => e.id === currentAnimation.value)
  return effect ? effect.label : 'None'
})

// Watch the error store for any new errors
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

// Start a specific animation by calling the displayStore action
const startAnimation = (animationId: EffectId) => {
  try {
    displayStore.toggleAnimationById(animationId)
  } catch (error) {
    reportError('Failed to start the animation', error)
  }
}

// Start a random animation by calling the displayStore action
const startRandomAnimation = () => {
  try {
    displayStore.toggleRandomAnimation()
  } catch (error) {
    reportError('Failed to start a random animation', error)
  }
}

// Stop the current animation
const stopAnimation = () => {
  try {
    displayStore.stopAnimation()
  } catch (error) {
    reportError('Failed to stop the animation', error)
  }
}

// Function to report errors to the error store and set the local error message
const reportError = (contextMessage: string, error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  errorStore.setError(ErrorType.GENERAL_ERROR, `${contextMessage}: ${message}`)
}
</script>

<style scoped>
/* Adding global spacing for buttons and text, and utility classes */
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

/* Additional classes for hover and button interactions using DaisyUI and Tailwind */
.btn {
  @apply py-2 px-4 font-bold rounded-lg transition-transform transform hover:scale-105 active:scale-95;
}
</style>

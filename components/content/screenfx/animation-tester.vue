<template>
  <div class="animation-tester-container">
    <h2 class="text-2xl font-bold mb-4">Animation Tester</h2>

    <!-- Buttons to trigger specific animations -->
    <div class="flex flex-col space-y-4">
      <button
        v-for="effect in effects"
        :key="effect.id"
        class="btn btn-primary"
        @click="startAnimation(effect.id)"
      >
        Start {{ effect.label }} Animation
      </button>
    </div>

    <!-- Button to start a random animation -->
    <div class="mt-4">
      <button class="btn btn-secondary" @click="startRandomAnimation">
        Start Random Animation
      </button>
    </div>

    <!-- Button to stop the animation -->
    <div class="mt-4">
      <button class="btn btn-danger" @click="stopAnimation">
        Stop Animation
      </button>
    </div>

    <!-- Display any errors encountered -->
    <div v-if="errorMessage" class="mt-4 text-red-500 text-sm">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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
  {
    id: 'bubble-effect',
    label: 'Bubble Fiesta',
  },
  {
    id: 'fizzy-bubbles',
    label: 'Fizzy Lifting',
  },
  {
    id: 'rain-effect',
    label: 'Rainmaker',
  },
  {
    id: 'butterfly-animation',
    label: 'Butterfly Scouts',
  },
])

// Watch the error store for any new errors
watch(
  () => errorStore.getError, // Correct getter for error message
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
.animation-tester-container {
  padding: 2rem;
  background-color: var(--bg-base-200);
  border-radius: 0.5rem;
  max-width: 400px;
  margin: auto;
}

/* Tailwind or DaisyUI utility classes for buttons */
.btn {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 0.375rem;
}

.btn-primary {
  background-color: var(--bg-primary);
  color: white;
}

.btn-secondary {
  background-color: var(--bg-secondary);
  color: white;
}

.btn-danger {
  background-color: var(--bg-warning);
  color: white;
}

/* Error message styling */
.text-red-500 {
  color: #f56565;
}

.text-sm {
  font-size: 0.875rem;
}
</style>

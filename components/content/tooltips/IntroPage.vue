<template>
  <transition name="fade">
    <div
      v-if="currentStep < steps.length"
      class="absolute top-0 left-0 w-full h-full z-40"
      :class="steps[currentStep].bgClass"
    >
      
      <img
        :src="steps[currentStep].image"
        :alt="steps[currentStep].altText"
        class="absolute top-0 left-0 w-full h-full object-contain"
      />

      <!-- Overlay for text and buttons -->
      <div
        class="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-50 bg-black bg-opacity-40 rounded-xl"
      >
        <h1 class="text-3xl font-bold mb-4 text-white">
          {{ steps[currentStep].title }}
        </h1>
        <p class="text-lg mb-6 text-white">
          {{ steps[currentStep].description }}
        </p>
        <div class="flex gap-4">
          
          <button
            v-if="currentStep > 0"
            class="bg-secondary p-3 rounded-lg text-white"
            @click.stop="previousStep"
          >
            Back
          </button>
          <!-- Next or Finish button -->
          <button
            class="bg-primary p-3 rounded-lg text-white"
            @click.stop="nextStep"
          >
            {{ steps[currentStep].buttonText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { steps } from '@/training/steps.js'

const currentStep = ref(0)

const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
  if (currentStep.value === steps.length) {
    emit('finished')
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}
</script>

<style scoped>
.object-contain {
  object-fit: contain; /* Ensures the image is fully visible */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.bg-primary {
  background-color: #3498db; /* Example primary color */
}

.bg-secondary {
  background-color: #e74c3c; /* Example secondary color */
}
</style>

<template>
  <transition name="fade">
    <div
      v-if="currentStep < steps.length"
      class="absolute top-0 left-0 w-full h-full z-50"
      :class="steps[currentStep].bgClass"
    >
      <img
        :src="steps[currentStep].image"
        :alt="steps[currentStep].altText"
        class="absolute top-0 left-0 w-full h-full object-contain"
      />

      <!-- Overlay for text and buttons -->
      <div
        class="absolute inset-0 flex flex-col justify-end items-center text-center p-8 bg-base-200 bg-opacity-10 rounded-xl"
      >
        <h1 class="text-4xl font-bold mb-2 text-white text-shadow-lg">
          {{ steps[currentStep].title }}
        </h1>
        <p class="text-lg mb-6 text-white text-shadow-md">
          {{ steps[currentStep].description }}
        </p>
        <div class="flex gap-4 mb-8">
          <button
            v-if="currentStep > 0"
            class="bg-secondary p-3 rounded-lg text-white"
            @click.stop="previousStep"
          >
            Back
          </button>
          <!-- Next or Finish button -->
          <button
            v-if="currentStep === steps.length - 1"
            class="bg-primary p-3 rounded-lg text-white"
          >
            <!-- NuxtLink for Finish -->
            <NuxtLink to="/" class="text-white">Finish</NuxtLink>
          </button>
          <button
            v-else
            class="bg-primary p-3 rounded-lg text-white"
            @click.stop="nextStep"
          >
            {{ steps[currentStep].buttonText }}
          </button>
        </div>
      </div>

      <!-- Fast-forward button -->
      <NuxtLink
        to="/"
        class="absolute bottom-4 right-4 bg-accent p-4 rounded-full text-white shadow-lg hover:bg-accent-focus z-60"
      >
        <Icon name="material-symbols:fast-forward-rounded" class="w-6 h-6" />
      </NuxtLink>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
import { steps } from '@/training/steps.js'

const currentStep = ref(0)

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
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
  object-fit: contain;
}

.object-cover {
  object-fit: cover;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.text-shadow-lg {
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
}

.text-shadow-md {
  text-shadow: 1px 1px 6px rgba(0, 0, 0, 0.6);
}
</style>

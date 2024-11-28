<template>
  <transition name="fade">
    <div
      v-if="currentStep < steps.length"
      class="absolute top-0 left-0 w-full h-full z-50"
      :class="steps[currentStep].bgClass"
    >
      <!-- Background Image -->
      <img
        :src="steps[currentStep].image"
        :alt="steps[currentStep].altText"
        class="absolute top-0 left-0 w-full h-full object-cover"
      />

      <!-- Centered Text and Buttons -->
      <div
        class="absolute inset-x-0 bottom-0 mb-12 flex flex-col justify-center items-center text-center p-8 bg-base-300 bg-opacity-70 rounded-xl max-w-lg mx-auto"
        style="width: 80%; transform: translateY(-50%)"
      >
        <h1 class="text-4xl font-bold mb-2 text-white text-shadow-lg">
          {{ steps[currentStep].title }}
        </h1>
        <p class="text-lg mb-6 text-white text-shadow-md">
          {{ steps[currentStep].description }}
        </p>
        <div class="flex gap-4 mb-4">
          <button
            v-if="currentStep > 0"
            class="bg-secondary p-3 rounded-lg text-white"
            @click.stop="previousStep"
          >
            Back
          </button>
          <!-- Next or Finish button -->
          <NuxtLink
            v-if="currentStep === steps.length - 1"
            :to="redirectPath"
            class="bg-primary p-3 rounded-lg text-white"
            @click="finishIntro"
          >
            Finish
          </NuxtLink>
          <button
            v-else
            class="bg-primary p-3 rounded-lg text-white"
            @click.stop="nextStep"
          >
            {{ steps[currentStep].buttonText }}
          </button>
        </div>
      </div>

      <!-- Fast-forward button with Skip label -->
      <NuxtLink
        :to="redirectPath"
        class="absolute bottom-4 right-4 bg-accent p-4 rounded-full text-white shadow-lg hover:bg-accent-focus z-60 flex flex-col items-center"
        @click="skipIntro"
      >
        <Icon name="kind-icon:fast-forward" class="w-6 h-6" />
        <span class="text-sm mt-1">Skip</span>
      </NuxtLink>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplayStore } from '~/stores/displayStore'
import { useUserStore } from '~/stores/userStore'
import { steps } from '@/training/steps.js'

const displayStore = useDisplayStore()
const userStore = useUserStore()
const currentStep = ref(0)

const redirectPath = computed(() => {
  return userStore.isLoggedIn ? '/dashboard' : '/register'
})

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

const finishIntro = () => {
  displayStore.toggleIntro()
}

const skipIntro = () => {
  displayStore.toggleIntro()
}
</script>

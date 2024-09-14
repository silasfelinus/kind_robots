<template>
  <div id="app" class="relative h-screen w-screen">
    <!-- Loader -->
    <div v-if="loading" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Dynamic Full-Screen Section -->
    <transition name="fade">
      <div
        v-if="!loading && currentStep < steps.length"
        class="absolute top-0 left-0 w-full h-full z-40"
        :class="steps[currentStep].bgClass"
      >
        <!-- Full-screen image with maximum width and height consideration -->
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
            <!-- Back button only appears after the first step -->
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

    <!-- Center Content Container with rounded-2xl border to display Nuxt Page -->
    <transition name="fade">
      <div v-if="currentStep === steps.length" class="absolute inset-0 flex justify-center items-center z-40">
        <div class="w-full max-w-4xl p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-lg">
          <nuxt-page />
        </div>

        <!-- Subtle Toggle in the corner to repeat intro -->
        <button class="absolute bottom-8 right-8 bg-gray-200 text-gray-800 p-2 rounded-lg text-sm hover:bg-gray-300" @click="restartExperience">
          Repeat Intro?
        </button>
      </div>
    </transition>

    <!-- Header (Minimal Text Navigation) -->
    <header class="fixed top-0 left-0 w-full p-4 bg-black bg-opacity-60 z-50 flex justify-center">
      <nav class="flex gap-8">
        <nuxt-link to="/home" class="text-white text-lg hover:underline">Home</nuxt-link>
        <nuxt-link to="/artgallery" class="text-white text-lg hover:underline">Art Gallery</nuxt-link>
        <nuxt-link to="/botcafe" class="text-white text-lg hover:underline">Bot Cafe</nuxt-link>
        <nuxt-link to="/amibot" class="text-white text-lg hover:underline">AMIBot</nuxt-link>
      </nav>
    </header>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { steps } from '@/training/steps.js'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.loadState()
  loading.value = false
})

const loading = ref(true)
const currentStep = ref(0)

// Move to next step
const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
  if (currentStep.value === steps.length) {
    displayStore.introSeen = true
    displayStore.saveState()
  }
}

// Go to previous step
const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Restart the experience
const restartExperience = () => {
  currentStep.value = 0
  displayStore.introSeen = false
  displayStore.saveState()
}
</script>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.object-cover {
  object-fit: cover;
}

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

.bg-accent {
  background-color: #f39c12; /* Example accent color */
}

.border-2xl {
  border-radius: 1rem;
}

.hover\:underline:hover {
  text-decoration: underline;
}

.text-lg {
  font-size: 1.125rem;
}

.text-sm {
  font-size: 0.875rem;
}

.rounded-2xl {
  border-radius: 1rem;
}
</style>
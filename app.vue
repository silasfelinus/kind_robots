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

    <!-- Display Icons for Section Toggles after the slideshow ends -->
    <transition name="fade">
      <div
        v-if="!loading && currentStep === steps.length"
        class="absolute top-0 left-0 w-full h-full z-40 flex flex-col justify-center items-center p-8 bg-black bg-opacity-60"
      >
        <div
          class="absolute inset-0 flex justify-center items-center gap-8 text-center text-white z-50"
        >
          <h1 class="text-3xl font-bold mb-4">
            Welcome to the Main Experience
          </h1>
          <p class="mb-6">
            Explore different sections using the toggles below:
          </p>
          <div class="flex gap-4">
            <!-- Icons for the respective sections -->
            <icon name="home" class="text-white" @click="toggleHome" />
            <icon name="brush" class="text-white" @click="toggleArt" />
            <icon name="chat" class="text-white" @click="toggleChat" />
            <icon name="settings" class="text-white" @click="toggleSettings" />
          </div>
        </div>
      </div>
    </transition>

    <!-- Sidebar (Transparent Overlay) -->
    <aside
      class="fixed top-0 left-0 h-full w-16 p-4 bg-black bg-opacity-50 z-40 flex flex-col items-center gap-4"
    >
      <icon name="home" class="text-white" />
      <icon name="brush" class="text-white" />
      <icon name="chat" class="text-white" />
    </aside>

    <!-- Header (Transparent Overlay) -->
    <header class="fixed top-0 left-0 w-full p-4 bg-black bg-opacity-60 z-50">
      <div class="flex justify-between items-center">
        <h2 class="text-white">Kind Robots</h2>
        <div class="flex items-center gap-4">
          <icon name="bell" class="text-white" />
          <icon name="user" class="text-white" />
        </div>
      </div>
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

// Navigate to more features (replace with actual logic)
const toggleHome = () => {
  // Logic for navigating to the Home section
}
const toggleArt = () => {
  // Logic for navigating to the Art section
}
const toggleChat = () => {
  // Logic for navigating to the Chat section
}
const toggleSettings = () => {
  // Logic for navigating to the Settings section
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
</style>

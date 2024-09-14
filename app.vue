<template>
  <div
    id="app"
    class="flex flex-col h-screen w-screen overflow-hidden bg-base-400 relative"
    @click="nextStep"
  >
    <div v-if="loading" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Dynamic Section -->
    <transition name="fade">
      <div
        v-if="!loading && currentStep < steps.length"
        class="absolute top-0 left-0 w-full h-full z-40 flex flex-col justify-center items-center p-4"
        :class="steps[currentStep].bgClass"
      >
        <img
          :src="steps[currentStep].image"
          :alt="steps[currentStep].altText"
          class="step-img mb-4 w-auto h-auto max-w-full max-h-96 object-cover"
        />
        <h1 class="text-xl font-bold mb-2 animate-text-fade">
          {{ steps[currentStep].title }}
        </h1>
        <p class="text-center mb-4 animate-text-fade">
          {{ steps[currentStep].description }}
        </p>
        <div class="flex gap-4">
          <button
            v-if="currentStep > 0"
            class="bg-secondary p-2 rounded-xl animate-button-fade"
            @click.stop="previousStep"
          >
            Back
          </button>
          <button
            class="bg-primary p-2 rounded-xl animate-button-fade"
            @click.stop="nextStep"
          >
            {{ steps[currentStep].buttonText }}
          </button>
        </div>
      </div>
    </transition>

    <!-- Final Section with Footer -->
    <transition name="fade">
      <div
        v-if="!loading && currentStep === steps.length"
        class="absolute top-0 left-0 w-full h-full z-40 flex flex-col justify-center items-center p-4 bg-accent"
      >
        <img
          src="/images/intro/footer.webp"
          alt="Thank You Image"
          class="outro-img mb-4 animate-image-fade w-auto h-auto max-w-full max-h-96 object-cover"
        />
        <h1 class="text-2xl font-bold mb-2 animate-text-fade">
          Singular Philanthropy
        </h1>
        <p class="text-center mb-4 animate-text-fade">
          Kind Robots was created by Silas Knight. It is intended primarily as a
          fundraiser for malaria nets.
          <a
            href="https://againstmalaria.com/amibot"
            class="text-primary underline"
            target="_blank"
          >
            https://againstmalaria.com/amibot
          </a>
        </p>
        <div class="flex gap-4">
          <button
            class="bg-primary p-2 rounded-xl animate-button-fade"
            @click="restartExperience"
          >
            Restart Experience
          </button>
          <button
            class="bg-secondary p-2 rounded-xl animate-button-fade"
            @click="navigateToMoreFeatures"
          >
            Explore More Features
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { steps } from '@/training/steps.js'

const displayStore = useDisplayStore()

onMounted(() => {
  if (!displayStore.introSeen) {
    loading.value = false
  } else {
    currentStep.value = steps.length // Skip intro if it's already seen
  }
  displayStore.loadState()
})

const loading = ref(true)
const currentStep = ref(0)

// Next Step
const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++
  }
  if (currentStep.value === steps.length) {
    // Update store after user completes the walkthrough
    displayStore.introSeen = true
    displayStore.saveState()
  }
}

// Previous Step
const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Handle restart experience
const restartExperience = () => {
  currentStep.value = 0
  displayStore.introSeen = false
  displayStore.saveState()
}

// Navigate to more features
const navigateToMoreFeatures = () => {
  // Logic to direct the user to other features or pages
}
</script>

<style scoped>
.transition-all {
  transition:
    width 0.3s ease,
    height 0.3s ease;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-image {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fade-button {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-text-fade {
  animation: fade-in 0.8s ease-in-out forwards;
}

.animate-image-fade {
  animation: fade-image 1.5s ease-in-out forwards;
}

.animate-button-fade {
  animation: fade-button 0.6s ease-in-out forwards;
  animation-delay: 0.5s;
}
</style>

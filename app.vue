<template>
  <div
    id="app"
    class="flex flex-col h-screen w-screen overflow-hidden bg-base-400 relative"
  >
    <!-- Ami-loader as an overlay, hidden once intro starts -->
    <div
      v-if="!showIntro && !showOutro"
      class="absolute top-0 left-0 w-full h-full z-50"
    >
      <ami-loader />
    </div>

    <!-- Main Intro Section -->
    <transition name="fade">
      <div
        v-if="showIntro"
        class="absolute top-0 left-0 w-full h-full z-40 bg-accent flex flex-col justify-center items-center p-4"
        @click.self="revealNextSection"
      >
        <img
          src="/images/intro/welcome.webp"
          alt="Intro Image"
          class="intro-img mb-4 w-auto h-auto max-w-full max-h-96 object-cover"
        />
        <h1 class="text-xl font-bold mb-2 fade-in">Welcome to Kind Robots</h1>
        <p class="text-center mb-4 fade-in">
          We bring people and AI together to do amazing things.
        </p>
        <button
          class="bg-primary p-2 rounded-xl mt-4 fade-in"
          aria-label="Start the Experience"
          @click.stop="handleIntroClick"
        >
          Let’s Begin
        </button>
      </div>
    </transition>

    <!-- Secondary Intro -->
    <transition name="fade">
      <div
        v-if="showSecondaryIntro"
        class="absolute top-0 left-0 w-full h-full z-40 bg-base-100 flex flex-col justify-center items-center p-4"
        @click.self="revealFinalSection"
      >
        <h2 class="text-lg font-bold mb-4">Discover More</h2>
        <p class="text-center mb-4">Explore our sections and learn more.</p>
        <button
          class="bg-secondary p-2 rounded-xl mt-4"
          aria-label="Next Section"
          @click.stop="revealFinalSection"
        >
          Next <icon name="arrow_right" class="ml-2" />
        </button>
      </div>
    </transition>

    <!-- Outro Section -->
    <transition name="fade">
      <div
        v-if="showOutro"
        class="absolute top-0 left-0 w-full h-full z-40 bg-accent flex flex-col justify-center items-center p-4"
      >
        <img
          src="/images/outro/thank_you.webp"
          alt="Outro Image"
          class="outro-img mb-4 animate-image-fade w-auto h-auto max-w-full max-h-96 object-cover"
        />
        <h1 class="text-2xl font-bold mb-2 animate-text-fade">
          Thank You for Joining Us!
        </h1>
        <p class="text-center mb-4 animate-text-fade">
          We’re so grateful for your support and hope you enjoyed the
          experience!
        </p>
        <div class="flex gap-4">
          <button
            class="bg-primary p-2 rounded-xl mt-4 animate-button-fade"
            aria-label="Restart"
            @click="restartExperience"
          >
            Restart Experience
          </button>
          <button
            class="bg-secondary p-2 rounded-xl mt-4 animate-button-fade"
            aria-label="Explore More"
            @click="navigateToMoreFeatures"
          >
            Explore More Features <icon name="arrow_right" class="ml-2" />
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.loadState()
})

// Manage the visibility of the intro, sections, and outro
const showIntro = ref(true)
const showSecondaryIntro = ref(false)
const showOutro = ref(false)
const currentStep = ref(0)

// Define the sequence of steps
const sections = [
  { id: 'intro', component: showIntro },
  { id: 'secondary', component: showSecondaryIntro },
  { id: 'final', component: displayStore },
  { id: 'outro', component: showOutro },
]

// Handle intro click to transition from the first section
const handleIntroClick = () => {
  revealNextSection()
}

// Reveal next section based on current step
const revealNextSection = () => {
  if (currentStep.value < sections.length - 1) {
    sections[currentStep.value].component.value = false
    currentStep.value++
    sections[currentStep.value].component.value = true
  } else {
    showOutro.value = true // Reveal outro when all sections are complete
  }
}

// Handle restart experience
const restartExperience = () => {
  showOutro.value = false
  currentStep.value = 0
  sections[currentStep.value].component.value = true
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

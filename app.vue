<template>
  <div
    id="app"
    class="flex flex-col h-screen w-screen overflow-hidden bg-base-400 relative"
  >
    <div
      v-if="!showIntro && !showOutro"
      class="absolute top-0 left-0 w-full h-full z-50"
    >
      <ami-loader />
    </div>

    <transition name="fade">
      <div
        v-if="showIntro"
        class="absolute top-0 left-0 w-full h-full z-40 bg-accent flex flex-col justify-center items-center p-4"
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
        >
          Let’s Begin
        </button>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="showSecondaryIntro"
        class="absolute top-0 left-0 w-full h-full z-40 bg-base-100 flex flex-col justify-center items-center p-4"
      >
        <h2 class="text-lg font-bold mb-4">Discover More</h2>
        <p class="text-center mb-4">Explore our sections and learn more.</p>
        <button
          class="bg-secondary p-2 rounded-xl mt-4"
          aria-label="Next Section"
        >
          Next <icon name="arrow_right" class="ml-2" />
        </button>
      </div>
    </transition>

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

const showIntro = ref(true)
const showSecondaryIntro = ref(false)
const showOutro = ref(false)
const currentStep = ref(0)

const sections = [
  { id: 'intro', component: showIntro },
  { id: 'secondary', component: showSecondaryIntro },
  { id: 'outro', component: showOutro },
]

const restartExperience = () => {
  showOutro.value = false
  currentStep.value = 0
  sections[currentStep.value].component.value = true
}

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

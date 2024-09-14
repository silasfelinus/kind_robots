<template>
  <div
    id="app"
    class="flex flex-col h-screen w-screen overflow-hidden bg-base-400 relative"
  >
    <!-- Ami-loader as an overlay, hidden once intro starts -->
    <div v-if="!showIntro" class="absolute top-0 left-0 w-full h-full z-50">
      <ami-loader />
    </div>

    <!-- Main Intro Section with click-outside handler -->
    <div
      v-if="showIntro"
      class="absolute top-0 left-0 w-full h-full z-40 bg-accent flex flex-col justify-center items-center p-4"
      @click.self="revealNextSection"
    >
      <img src="/images/intro/welcome.webp" alt="Intro Image" class="mb-4" />
      <h1 class="text-xl font-bold mb-2">Welcome to Kind Robots</h1>
      <p class="text-center mb-4">
        We bring people and AI together to do amazing things.
      </p>
      <button
        class="bg-primary p-2 rounded-xl mt-4"
        aria-label="Start the Experience"
        @click.stop="handleIntroClick"
      >
        Let’s Begin
      </button>
    </div>

    <!-- Secondary Intro after clicking outside -->
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

    <!-- Main Layout -->
    <div
      v-if="!showIntro && !showSecondaryIntro"
      class="flex flex-grow overflow-hidden gap-2"
    >
      <!-- Sidebar Left -->
      <aside
        v-if="isSidebarLeftVisible"
        class="transition-all duration-300"
        :style="{ width: sidebarWidth(displayStore.sidebarLeft) }"
      >
        <!-- Content of sidebar left -->
      </aside>

      <!-- Main content area -->
      <main :class="[mainContentClass]">
        <nuxt-page />
      </main>

      <!-- Sidebar Right -->
      <aside
        v-if="isSidebarRightVisible"
        class="transition-all duration-300"
        :style="{ width: sidebarWidth(displayStore.sidebarRight) }"
      >
        <!-- Content of sidebar right -->
      </aside>
    </div>

    <!-- Footer Navigation with dynamic icons -->
    <footer v-if="isFooterVisible" class="transition-all duration-300">
      <div class="p-4 text-center">
        <button class="bg-primary p-2 rounded-xl" @click="navigateNextSection">
          Next <icon :name="nextIcon" class="ml-2" />
        </button>
      </div>
    </footer>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.loadState()
})

// Manage the visibility of the intro and sections
const showIntro = ref(true)
const showSecondaryIntro = ref(false)

// Navigation icon dynamic handling
const nextIcon = ref('arrow_right') // Dynamic icon for navigation

// Handle intro click to transition from the first section
const handleIntroClick = () => {
  showIntro.value = false
  showSecondaryIntro.value = true
}

// Handle focus transitions for the intro sections
const revealNextSection = () => {
  if (showSecondaryIntro.value) return
  showIntro.value = false
  showSecondaryIntro.value = true
}

const revealFinalSection = () => {
  showSecondaryIntro.value = false
}

// Handle dynamic movement between sections with icons
const navigateNextSection = () => {
  // Update the next icon based on the next section
  nextIcon.value = nextIcon.value === 'arrow_right' ? 'check' : 'arrow_right'

  // Example navigation logic: move from sidebar to main to footer
  if (displayStore.sidebarLeft === 'hidden') {
    displayStore.changeState('sidebarLeft', 'open')
    displayStore.changeState('mainContent', 'compact')
  } else if (displayStore.sidebarRight === 'hidden') {
    displayStore.changeState('sidebarLeft', 'compact')
    displayStore.changeState('sidebarRight', 'open')
  } else {
    displayStore.changeState('sidebarRight', 'compact')
    displayStore.changeState('footer', 'open')
  }
}
</script>

<style>
.transition-all {
  transition:
    width 0.3s ease,
    height 0.3s ease;
}
</style>

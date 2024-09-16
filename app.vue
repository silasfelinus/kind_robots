<template>
  <div id="app" class="flex flex-col h-screen w-screen">
    <!-- Loader -->
    <div class="absolute inset-0 z-50">
      <ami-loader />
    </div>

    <!-- Intro Component -->
    <div
      v-if="displayStore.showIntro"
      class="absolute inset-0 z-20 flex justify-center items-center bg-base-200 bg-opacity-70"
    >
      <IntroPage @finished="onIntroFinished" />
    </div>

    <header
  class="flex-none w-full z-40 bg-base-200 bg-opacity-60 flex justify-between items-center transition-all duration-500 ease-in-out"
  :style="{ height: `${displayStore.headerVh}vh` }"
>
  <!-- Sidebar Toggle -->
  <div class="absolute top-4 left-4 p-3 z-50 bg-primary text-white rounded-lg shadow-md cursor-pointer">
    <sidebar-toggle class="text-4xl" />
  </div>

  <!-- Navigation Links (Centered) -->
  <nav class="flex gap-8 items-center mx-auto text-center">
    <nuxt-link to="/" class="text-accent text-lg hover:underline">Home</nuxt-link>
    <nuxt-link to="/match" class="text-accent text-lg hover:underline">Art Gallery</nuxt-link>
    <nuxt-link to="/botcafe" class="text-accent text-lg hover:underline">Bot Cafe</nuxt-link>
    <nuxt-link to="/amibot" class="text-accent text-lg hover:underline">AMIBot</nuxt-link>
  </nav>

  <!-- Intro Toggle Component -->
  <div class="absolute right-8 top-1/2 -translate-y-1/2">
    <IntroToggle />
  </div>
</header>


    <!-- Main Layout -->
    <div class="flex flex-1 w-full overflow-hidden">
      <!-- Sidebar (Left) -->
      <aside
        v-if="displayStore.sidebarLeft !== 'hidden'"
        :style="{ width: `${displayStore.sidebarVw}vw` }"
        class="p-4 bg-gray-100 shadow-lg transition-all duration-500 ease-in-out"
      >
        <kind-sidebar />
      </aside>

      <!-- Main Content -->
      <main
        class="flex-grow p-8 transition-all duration-500 ease-in-out overflow-y-auto"
      >
        <transition name="fade" mode="out-in">
          <div v-if="!displayStore.showIntro" class="flex justify-center items-center">
            <div class="w-full max-w-4xl p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-lg">
              <nuxt-page />
            </div>
          </div>
        </transition>
      </main>
    </div>

    <!-- Footer -->
    <footer
      v-if="displayStore.footer !== 'hidden'"
      :style="{ height: `${displayStore.footerVh}vh` }"
      class="flex-none w-full bg-gray-800 text-accent"
    >
      <!-- Footer content goes here -->
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const loading = ref(true)

// Add a flag to prevent double triggers of onIntroFinished
const isProcessing = ref(false)

onMounted(() => {
  displayStore.loadState()
  displayStore.updateViewport() // Call to update viewport dimensions
  window.addEventListener('resize', displayStore.updateViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', displayStore.updateViewport)
})

// Ensure onIntroFinished is only processed once
const onIntroFinished = () => {
  if (isProcessing.value) return

  isProcessing.value = true
  displayStore.changeState('headerState', 'open') // Ensure header state is updated
  displayStore.changeState('sidebarLeft', 'hidden') // Example of changing state
  displayStore.changeState('footer', 'hidden') // Example of changing state
  displayStore.toggleIntroState() // Hides the intro

  setTimeout(() => {
    isProcessing.value = false // Reset after processing is done
  }, 300) // Adjust the time as per the animation length
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>

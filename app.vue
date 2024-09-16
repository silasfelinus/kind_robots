<template>
  <div id="app" class="relative h-screen w-screen">
    <!-- Loader -->
    <div v-if="loading" class="absolute inset-0 z-50">
      <ami-loader />
    </div>

    <!-- Intro Component -->
    <div
      v-if="!loading && displayStore.showIntro"
      class="absolute inset-0 z-20 flex justify-center items-center bg-base-200 bg-opacity-70"
    >
      <IntroPage @finished="onIntroFinished" />
    </div>

    <!-- Header (Visibility and Dynamic Height) -->
    <header
      class="fixed top-0 left-0 w-full z-40 bg-base-200 bg-opacity-60 flex justify-between items-center transition-all duration-500 ease-in-out"
      :style="{
        height: `${displayStore.headerVh}vh`,
        visibility: displayStore.headerState !== 'hidden' ? 'visible' : 'hidden',
      }"
    >
      <!-- Sidebar Toggle (Fixed Position, Always Visible) -->
      <div class="fixed top-2 left-2 p-2 z-50">
        <sidebar-toggle class="text-accent text-3xl hover:text-secondary transition-colors" />
      </div>

      <!-- Navigation Links (Centered) -->
      <nav class="flex gap-8 items-center mx-auto">
        <nuxt-link
          to="/"
          class="text-accent text-lg hover:underline"
          @click="onIntroFinished"
        >Home</nuxt-link>
        <nuxt-link
          to="/artgallery"
          class="text-accent text-lg hover:underline"
          @click="onIntroFinished"
        >Art Gallery</nuxt-link>
        <nuxt-link
          to="/botcafe"
          class="text-accent text-lg hover:underline"
          @click="onIntroFinished"
        >Bot Cafe</nuxt-link>
        <nuxt-link
          to="/amibot"
          class="text-accent text-lg hover:underline"
          @click="onIntroFinished"
        >AMIBot</nuxt-link>
      </nav>

      <!-- Intro Toggle Component -->
      <div class="absolute right-8 top-1/2 -translate-y-1/2">
        <IntroToggle />
      </div>
    </header>

    <!-- Main Layout -->
    <div
      class="flex flex-row relative"
      :style="{ top: `${displayStore.headerVh}vh` }"
    >
      <!-- Sidebar (Left) -->
      <aside
        v-if="displayStore.sidebarLeft !== 'hidden'"
        :style="{ width: `${displayStore.sidebarVw}vw` }"
        class="p-4 bg-gray-100 shadow-lg"
      >
        <kind-sidebar />
      </aside>

      <!-- Main Content -->
      <main
        :class="[displayStore.sidebarLeft !== 'hidden' ? 'w-3/4' : 'w-full']"
        class="p-8 transition-all duration-500 ease-in-out"
      >
        <transition name="fade" mode="out-in">
          <div
            v-if="!displayStore.showIntro"
            class="flex justify-center items-center"
          >
            <div
              class="w-full max-w-4xl p-8 rounded-2xl border-2 border-gray-300 bg-white shadow-lg"
            >
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
      class="fixed bottom-0 w-full bg-gray-800 text-white"
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
  loading.value = false
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

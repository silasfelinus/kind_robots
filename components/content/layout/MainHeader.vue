<template>
  <div id="app" class="flex flex-col h-screen w-screen bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header -->
    <header class="sticky top-0 z-30 w-full bg-base-200" :style="{ height: `${displayStore.headerVh}vh` }">
      <!-- Sidebar Toggle -->
      <div class="absolute top-2 left-4 p-1 z-40 text-white">
        <sidebar-toggle class="text-4xl" />
      </div>

      <nav-links />

      <!-- Tutorial and Back Buttons -->
      <button
        v-if="showTutorial"
        class="fixed top-1 right-4 bg-info text-base-200 rounded-lg shadow-md hover:bg-info-focus transition duration-300 z-50 p-1"
        @click="toggleTutorial"
      >
        Launch
      </button>

      <button
        v-else
        class="fixed top-1 right-4 bg-secondary text-base-200 rounded-lg shadow-md hover:bg-secondary-focus transition duration-300 z-50 p-1"
        @click="toggleTutorial"
      >
        <span>Instructions</span>
      </button>
    </header>

    <!-- Main Layout Wrapper -->
    <div class="flex flex-grow relative overflow-hidden">
      <!-- Left Sidebar -->
      <kind-sidebar-simple class="h-full" :style="{ width: `${displayStore.sidebarLeftWidth}vw` }" />

      <!-- Main Content Area -->
      <main class="relative flex-grow overflow-y-auto flex justify-center items-center">
        <MainFlip :show-tutorial="showTutorial" />
      </main>

      <!-- Right Sidebar -->
      <kind-sidebar-right class="h-full" :style="{ width: `${displayStore.sidebarRightWidth}vw` }" />
    </div>

    <!-- Footer -->
    <footer class="w-full bg-base-200 flex items-center justify-center" :style="{ height: `${displayStore.footerVh}vh` }">
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import MainFlip from '@/components/MainFlip.vue'

// Initialize stores and states
const displayStore = useDisplayStore()
const showTutorial = ref(true)
const isPageReady = ref(false)
const router = useRouter()

// Handle when page is ready
const handlePageReady = (ready: boolean) => {
  isPageReady.value = ready
}

// Toggle between tutorial and main content
const toggleTutorial = () => {
  showTutorial.value = !showTutorial.value
}

// Auto-reset tutorial on route changes
router.beforeEach((to, from, next) => {
  showTutorial.value = true
  next()
})

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

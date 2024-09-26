<template>
  <div id="app" class="flex flex-col h-screen w-screen bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header (refactored into MainHeader) -->
    <MainHeader
      :show-tutorial="displayStore.showTutorial"
      :style="{ height: `${displayStore.headerVh}vh` }"
      @toggle-tutorial="toggleTutorial"
    />

    <!-- Main Layout Wrapper -->
    <div class="flex flex-grow relative overflow-hidden">
      <!-- Left Sidebar -->
      <kind-sidebar-simple
        class="h-full"
        :style="{
          width: `${displayStore.sidebarLeftVw}vw`,
          height: `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`,
        }"
      />

      <!-- Main Content Area -->
      <main
        class="relative flex-grow overflow-y-auto flex justify-center items-center"
        :style="{
          height: `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`,
        }"
      >
        <MainFlip :show-tutorial="displayStore.showTutorial" />
      </main>

      <!-- Right Sidebar -->
      <aside
        class="h-full"
        :style="{
          width: `${displayStore.sidebarRightVw}vw`,
          height: `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`,
        }"
      />
    </div>

    <!-- Footer -->
    <footer
      class="w-full bg-base-200 flex items-center justify-center"
      :style="{ height: `${displayStore.footerVh}vh` }"
    >
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize stores and states
const displayStore = useDisplayStore()
const isPageReady = ref(false)
const router = useRouter()

// Handle when page is ready
const handlePageReady = (ready: boolean) => {
  isPageReady.value = ready
}

// Toggle between tutorial and main content (linked to displayStore)
const toggleTutorial = () => {
  displayStore.showTutorial = !displayStore.showTutorial
}

// Auto-reset tutorial on route changes (linked to displayStore)
router.beforeEach((to, from, next) => {
  displayStore.showTutorial = true
  next()
})

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>

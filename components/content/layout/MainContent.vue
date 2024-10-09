<template>
  <div class="relative h-full flex flex-col">
    <!-- Main Content Area -->
    <div
      class="relative flex-grow h-full flex flex-col"
      :style="{ width: mainContentWidth, height: mainContentHeight }"
    >
      <!-- Fullscreen Toggle (Top Center) -->
      <fullscreen-toggle
        class="absolute top-0 right-2 transform -translate-x-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />

      <!-- Left Toggle Button (inside content) -->
      <left-toggle
        class="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />

      <!-- Right Sidebar Toggle (inside content) -->
      <right-toggle
        class="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />

      <!-- Main Content (Tutorial or Content) -->
      <div v-if="isMobile" class="flex-grow overflow-y-auto">
        <SplashTutorial
          v-if="showTutorial"
          class="h-full w-full z-10 rounded-2xl"
        />
        <NuxtPage v-else class="h-full w-full z-10 rounded-2xl" />
      </div>

      <!-- Fullscreen Mode (Desktop, Content Only) -->
      <div
        v-else-if="isFullScreen"
        class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow"
      >
        <NuxtPage class="h-full w-full" />
      </div>

      <!-- Flip-card Mode (Desktop with Sidebar for Tutorial) -->
      <div v-else class="relative flex-grow z-10 flex flex-col">
        <div class="flip-card flex-grow">
          <div class="flip-card-inner" :class="{ flipped: showTutorial }">
            <!-- Main Content (NuxtPage) -->
            <div
              class="flip-card-front rounded-2xl overflow-y-auto h-full w-full"
            >
              <NuxtPage class="h-full w-full" />
            </div>

            <!-- Splash Tutorial -->
            <div
              class="flip-card-back rounded-2xl overflow-y-auto h-full w-full"
            >
              <SplashTutorial class="h-full w-full" />
            </div>
          </div>
        </div>

        <!-- Right Sidebar (Tutorial) -->
        <aside
          class="bg-secondary fixed top-0 right-0 h-full transition-all duration-500 ease-in-out"
          :style="{ width: sidebarRightWidth }"
        >
          <SplashTutorial class="h-full w-full" />
        </aside>
      </div>

      <!-- Footer Toggle (Bottom Center) -->
      <footer-toggle
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 z-20 text-accent cursor-pointer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access layout-related data and state from displayStore
const displayStore = useDisplayStore()

// Layout dimensions and state
const isMobile = computed(() => displayStore.isMobileViewport)
const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)

// Computed function to get the sidebar width from the store
const sidebarRightWidth = computed(() => `${displayStore.sidebarRightVw}vw`)

// Calculate main content width (subtract sidebar widths)
const mainContentWidth = computed(() => {
  return `calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw)`
})

// Calculate main content height (subtract header and footer heights)
const mainContentHeight = computed(() => {
  return `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`
})
</script>

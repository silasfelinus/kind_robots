<template>
  <div class="relative h-full flex flex-col rounded-2xl p-1 box-border">
    <!-- Main Content Area -->
    <div
      class="relative flex-grow h-full flex flex-col box-border"
      :style="{ width: mainContentWidth, height: mainContentHeight }"
    >
      <!-- Left Toggle Button (inside content) -->
      <left-toggle
        class="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 z-20 text-accent cursor-pointer box-border"
      />

      <!-- Right Sidebar Toggle (inside content) -->
      <right-toggle
        class="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 z-20 text-accent cursor-pointer box-border"
      />

      <!-- Main Content (Tutorial or Content) -->
      <div v-if="isMobile" class="flex-grow overflow-y-auto box-border">
        <SplashTutorial
          v-if="showTutorial"
          class="h-full w-full z-10 rounded-2xl box-border"
        />
        <NuxtPage v-else class="h-full w-full z-10 rounded-2xl box-border" />
      </div>

      <!-- Fullscreen Mode (Desktop, Content Only) -->
      <div
        v-else-if="isFullScreen"
        class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow box-border"
      >
        <NuxtPage class="h-full w-full overflow-y-auto box-border" />
      </div>

      <!-- Flip-card Mode (Desktop with Sidebar for Tutorial) -->
      <div v-else class="relative flex-grow z-10 flex flex-col box-border">
        <div class="flip-card flex-grow box-border">
          <div
            class="flip-card-inner box-border"
            :class="{ flipped: showTutorial }"
          >
            <!-- Main Content (NuxtPage) -->
            <div
              class="flip-card-front rounded-2xl overflow-y-auto h-full w-full box-border"
            >
              <NuxtPage class="h-full w-full overflow-y-auto box-border" />
            </div>

            <!-- Splash Tutorial -->
            <div
              class="flip-card-back rounded-2xl h-full w-full box-border"
              :style="{ height: splashTutorialHeight }"
            >
              <SplashTutorial class="h-full w-full box-border" />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Toggle (Bottom Center) -->
      <footer-toggle
        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 z-20 text-accent cursor-pointer box-border"
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

// Calculate main content width (subtract sidebar widths)
const mainContentWidth = computed(() => {
  return `calc(100vw - ${displayStore.sidebarLeftVw}vw - ${displayStore.sidebarRightVw}vw)`
})

// Calculate main content height (subtract header and footer heights)
const mainContentHeight = computed(() => {
  return `calc(100vh - ${displayStore.headerVh}vh - ${displayStore.footerVh}vh)`
})

// Calculate height for SplashTutorial (covers main content and footer height, but respects header)
const splashTutorialHeight = computed(() => {
  return `calc(100vh - ${displayStore.headerVh}vh)`
})
</script>

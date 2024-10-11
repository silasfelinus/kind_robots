<template>
  <div class="relative h-full flex flex-col rounded-2xl bg-base-300">
    <!-- Main Content Area -->
    <div
      class="relative flex-grow h-full flex flex-col box-border overflow-hidden"
      :style="{ width: mainContentWidth, height: mainContentHeight }"
    >
      <!-- Left Toggle Button (inside content) -->
      <left-toggle
        class="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 z-40 text-accent cursor-pointer box-border"
      />

      <!-- Right Sidebar Toggle (inside content) -->
      <right-toggle
        class="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 z-40 text-accent cursor-pointer box-border"
      />

      <!-- Main Content (Tutorial or Content) -->
      <div v-if="isMobile" class="flex-grow box-border">
        <SplashTutorial
          v-if="showTutorial"
          class="h-full w-full z-10 rounded-2xl box-border"
        />
        <NuxtPage
          v-else
          class="overflow-y-auto h-full w-full z-10 rounded-2xl border-4 box-border"
        />
      </div>

      <!-- Fullscreen Mode (Desktop, Content Only) -->
      <div
        v-else-if="isFullScreen"
        class="h-full w-full overflow-y-auto hide-scrollbar rounded-2xl z-10 flex-grow box-border"
      >
        <NuxtPage
          class="overflow-y-auto h-full w-full rounded-2xl border-4 box-border"
        />
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
              class="flip-card-front rounded-2xl hide-scrollbar h-full w-full box-border"
            >
              <NuxtPage
                class="overflow-y-auto h-full w-full border-4 box-border"
              />
            </div>

            <!-- Splash Tutorial -->
            <div
              class="flip-card-back rounded-2xl h-full w-full box-border"
              :style="{ height: mainContentHeight }"
            >
              <SplashTutorial class="h-full w-full box-border" />
            </div>
          </div>
        </div>
      </div>

      
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
const mainContentWidth = computed(() => displayStore.mainWidth)

// Calculate main content height (subtract header and footer heights)
const mainContentHeight = computed(() => displayStore.mainHeight)
</script>

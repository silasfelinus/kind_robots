<template>
  <!-- Main container -->
  <div class="h-full flex flex-col">
    <!-- Mobile View (no flip card) -->
    <div v-if="isMobile" class="flex-grow overflow-y-auto">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl"
      />
      <NuxtPage v-else class="h-full w-full z-10 overflow-y-auto rounded-2xl" />
    </div>

    <!-- Fullscreen Mode (Desktop) -->
    <div
      v-else
      class="h-full w-full overflow-y-auto rounded-2xl z-10 flex-grow"
    >
      <NuxtPage class="h-full w-full" />
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
const showTutorial = computed(() => displayStore.showTutorial)
</script>

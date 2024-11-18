<template>
  <!-- Main container -->
  <div class="h-full flex flex-col relative z-10">
    <!-- Mobile View (no flip card) -->
    <div v-if="isMobile" class="flex-grow overflow-y-auto">
      <SplashTutorial
        v-if="showTutorial"
        class="h-full w-full z-10 rounded-2xl border-4"
      />
      <NuxtPage
        v-else
        class="h-full w-full z-10 no-scrollbar rounded-2xl bg-base-300"
      />
    </div>

    <!-- Fullscreen Mode (Desktop) -->
    <div
      v-else
      class="h-full w-full overflow-y-auto no-scrollbar z-10 flex-grow"
    >
      <NuxtPage
        class="h-full w-full rounded-2xl bg-base-300"
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
const showTutorial = computed(() => displayStore.showTutorial)
</script>

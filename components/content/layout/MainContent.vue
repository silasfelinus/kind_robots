<template>
  <!-- Main container -->
  <div class="h-full flex flex-col relative z-10">
    <!-- Transition Wrapper -->
    <transition name="flip" mode="out-in">
      <!-- Mobile View (no flip card) -->
      <div
        v-if="isMobile"
        key="mobile-view"
        class="flex-grow overflow-y-auto"
        :style="viewStyle"
      >
        <SplashTutorial
          v-if="showTutorial"
          class="h-full w-full z-10 rounded-2xl border-4"
        />
        <NuxtPage
          v-else
          class="h-full w-full z-10 no-scrollbar rounded-2xl box-border bg-base-300 border-1 border-accent"
        />
      </div>

      <!-- Fullscreen Mode (Desktop) -->
      <div
        v-else
        key="desktop-view"
        class="h-full w-full overflow-y-auto no-scrollbar z-10 flex-grow"
        :style="viewStyle"
      >
        <NuxtPage
          class="h-full w-full rounded-2xl box-border bg-base-300 border-1 border-accent"
        />
      </div>
    </transition>
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

const viewStyle = computed(() => ({
  height: displayStore.centerHeight, // Use the specific field from the store
  padding: `${displayStore.sectionPaddingNumeric}px`, // Consistent padding
}))

</script>

<style scoped>
/* Flip transition effect */
.flip-enter-active,
.flip-leave-active {
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.6s ease-in-out;
}

.flip-enter,
.flip-leave-to {
  transform: rotateY(90deg);
}

.flip-leave,
.flip-enter-to {
  transform: rotateY(0deg);
}
</style>

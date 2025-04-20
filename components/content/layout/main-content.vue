<template>
  <div
    class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300 border border-accent"
  >
    <transition name="flip" mode="out-in">
      <div
        v-if="displayStore.isMobileViewport"
        key="mobile-view"
        class="h-full w-full"
      >
        <splash-tutorial
          v-if="displayStore.showTutorial"
          class="h-full w-full"
        />
        <NuxtPage
          :key="$route.fullPath"
          v-else
          class="h-full w-full overflow-y-auto no-scrollbar"
        />
      </div>

      <div v-else key="desktop-view" class="h-full w-full">
        <NuxtPage
          :key="$route.fullPath"
          class="h-full w-full overflow-y-auto"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
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

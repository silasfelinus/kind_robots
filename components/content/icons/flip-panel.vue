<!-- /components/content/icons/main-content.vue -->
<template>
  <div
    class="relative flex flex-col min-h-[100dvh] w-full rounded-2xl bg-base-300"
  >
    <!-- Mobile -->
    <div
      v-if="displayStore.isMobileViewport"
      class="relative flex-1 h-full w-full"
    >
      <flip-panel :flipped="sidebarRightOpen">
        <template #front>
          <NuxtPage :key="$route.fullPath" class="w-full min-h-[100dvh]" />
        </template>
        <template #back>
          <splash-tutorial />
        </template>
      </flip-panel>
    </div>

    <!-- Desktop -->
    <div v-else class="absolute inset-0 overflow-y-auto">
      <NuxtPage :key="$route.fullPath" class="min-h-[100dvh] w-full" />
    </div>

    <!-- Toggle -->
    <right-toggle class="fixed bottom-4 right-4 z-50" />
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () => displayStore.sidebarRightState === 'open',
)
// /components/content/icons/flip-panel.vue
defineProps<{
  flipped: boolean
}>()
</script>

<style scoped>
.flip-panel-wrapper {
  position: relative;
  width: 100%;
  height: 100dvh;
  perspective: 1000px;
  overflow: hidden;
}

.flip-panel-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-panel-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-panel-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  will-change: transform;
  overflow: hidden;
  contain: layout paint;
  display: flex;
  flex-direction: column;
}

.flip-panel-front {
  z-index: 2;
}

.flip-panel-back {
  transform: rotateY(180deg);
  z-index: 1;
}
</style>

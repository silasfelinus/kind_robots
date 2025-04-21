<!-- /components/content/layout/main-content.vue -->
<template>
  <div
    class="relative h-full w-full rounded-2xl overflow-hidden bg-base-300 border border-accent"
  >
    <!-- Mobile Flip View -->
    <div v-if="displayStore.isMobileViewport" class="relative h-full w-full">
      <div class="flip-card h-full w-full">
        <div
          class="flip-card-inner"
          :class="{ 'is-flipped': sidebarRightOpen }"
        >
          <div class="flip-card-front">
            <NuxtPage
              :key="$route.fullPath"
              class="h-full w-full overflow-y-auto"
            />
          </div>
          <!-- Back face (Splash) -->
          <div class="flip-card-back">
            <div
              class="w-full h-full bg-pink-500/30 p-6 rounded-xl border-4 border-yellow-500"
            >
              <splash-tutorial />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: both shown -->
    <div v-else class="h-full w-full" key="desktop">
      <NuxtPage :key="$route.fullPath" class="h-full w-full overflow-y-auto" />
    </div>

    <!-- Toggle + Sidebar -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-200 shadow': !sidebarRightOpen,
      }"
    />
    <aside
      v-if="!displayStore.isMobileViewport && sidebarRightOpen"
      class="fixed z-30 rounded-2xl border-6 border-secondary"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

watchEffect(() => {
  console.log('[main-content] sidebarRightOpen:', sidebarRightOpen.value)
  if (displayStore.isMobileViewport) {
    console.log(
      '[main-content] flip state:',
      sidebarRightOpen.value ? 'Flipping to Splash' : 'Flipping to Page',
    )
  }
})
</script>

<style scoped>
.flip-card {
  perspective: 1000px;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: visible;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s ease-in-out;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flip-card-front {
  z-index: 2;
  background-color: rgba(0, 0, 0, 0.1);
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
  background-color: rgba(255, 0, 0, 0.3); /* 🍓 RED DEBUG BACKGROUND */
}
</style>

<template>
  <div
    class="w-full rounded-2xl bg-base-300 relative shadow-lg min-h-screen"
    :class="{
      'grid grid-cols-2 gap-4': isLargeViewport,
      'flip-card': !isLargeViewport,
    }"
  >
    <!-- Flip-card Layout for small and medium viewports -->
    <div
      v-if="!isLargeViewport"
      class="flip-card-inner"
      :class="{ 'is-flipped': !displayStore.showTutorial }"
    >
      <!-- Front side: Splash Tutorial -->
      <div class="flip-card-front">
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content (with scrolling) -->
      <div class="flip-card-back overflow-y-auto h-screen">
        <NuxtPage></NuxtPage>
      </div>
    </div>

    <!-- Two-column layout for large and extra-large viewports -->
    <div
      v-if="isLargeViewport"
      class="flex flex-col overflow-y-auto min-h-screen"
    >
      <splash-tutorial />
    </div>
    <div
      v-if="isLargeViewport"
      class="flex flex-col overflow-y-auto min-h-screen border rounded-2xl"
    >
      <NuxtPage></NuxtPage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Initialize the display store
const displayStore = useDisplayStore()

// Watch for changes in viewport size
const isLargeViewport = computed(
  () =>
    displayStore.viewportSize === 'large' ||
    displayStore.viewportSize === 'extraLarge',
)

// Ensure initialization happens on component mount
onMounted(() => {
  if (!displayStore.isInitialized) {
    displayStore.initialize()
  }
})
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
}

.flip-card-inner {
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
  position: relative;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  overflow-y: auto; /* Ensure this element is scrollable */
}

/* Ensure grid layout height takes full available space */
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 100%;
}
</style>

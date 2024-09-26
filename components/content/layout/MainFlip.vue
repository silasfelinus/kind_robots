<template>
  <div
    class="w-full rounded-2xl bg-base-300 relative shadow-lg h-full"
    :class="{
      'grid grid-cols-2 gap-4': isLargeViewport,
      'flip-card':
        displayStore.viewportSize !== 'large' &&
        displayStore.viewportSize !== 'extraLarge',
    }"
  >
    <!-- Flip-card Layout for small and medium viewports -->
    <div
      v-if="
        displayStore.viewportSize !== 'large' &&
        displayStore.viewportSize !== 'extraLarge'
      "
      class="flip-card-inner"
      :class="{ 'is-flipped': !displayStore.showTutorial }"
    >
      <!-- Front side: Splash Tutorial -->
      <div class="flip-card-front">
        <splash-tutorial />
      </div>

      <!-- Back side: NuxtPage content (with scrolling) -->
      <div class="flip-card-back h-full">
        <NuxtPage />
      </div>
    </div>

    <!-- Two-column layout for large and extra-large viewports -->
    <div v-if="isLargeViewport" class="flex flex-col overflow-y-auto h-full">
      <splash-tutorial />
    </div>
    <div v-if="isLargeViewport" class="flex flex-col overflow-y-auto h-full">
      <NuxtPage />
    </div>
  </div>
</template>
<style scoped>
.flip-card {
  width: 100%;
  height: 100%; /* Ensure the flip-card takes full height */
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
  display: flex; /* Allow flexible content */
  flex-direction: column;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  overflow-y: auto; /* Enable vertical scrolling */
}

/* Ensure grid layout height takes full available space */
.grid-cols-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 100%;
}
</style>

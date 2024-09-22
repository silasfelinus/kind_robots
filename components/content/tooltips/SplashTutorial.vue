<template>
  <div class="tutorial-wrapper" :style="tutorialStyle">
    <div class="tutorial-content">
      <h1 class="text-3xl font-bold text-secondary">
        Welcome to the Tutorial!
      </h1>
      <p class="text-lg text-base-content">
        This is an introductory guide to help you get started. Click next to
        continue to the content.
      </p>
      <button class="next-button" @click="startPageTransition">
        <div class="triangle"></div>
        <span>Next</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access displayStore to compute space below header and sidebar
const displayStore = useDisplayStore()

// Compute tutorial wrapper style based on available space
const tutorialStyle = computed(() => ({
  height: `${100 - displayStore.headerVh}vh`,
  width: `${100 - displayStore.sidebarVw}vw`,
}))

// Method to trigger the transition to the actual page content
const startPageTransition = () => {
  // Trigger the page transition (parent will handle this)
  emit('page-transition')
}
</script>

<style scoped>
.tutorial-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--tw-bg-opacity, 1);
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;
}

.tutorial-content {
  text-align: center;
  padding: 20px;
}

.next-button {
  display: flex;
  align-items: center;
  background-color: var(--tw-bg-opacity, 1);
  color: var(--tw-text-opacity, 1);
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 16px;
  margin-top: 20px;
}

.next-button:hover {
  background-color: var(--tw-bg-opacity, 0.9);
}

.triangle {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 12px solid var(--tw-bg-opacity, 1);
  margin-right: 8px;
}

.tutorial-wrapper.flip {
  transform: rotateY(180deg);
  transition: transform 0.6s;
}
</style>

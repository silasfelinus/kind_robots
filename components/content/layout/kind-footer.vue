<!-- /components/content/layout/kind-footer.vue -->
<template>
  <div
    v-if="displayStore.footerState !== 'hidden'"
    class="kind-footer w-full bg-primary text-white flex justify-center items-center transition-all duration-500"
    :style="{
      height: displayStore.footerHeight,
      width: '100%',
    }"
  >
    <p class="text-center text-sm flex items-center space-x-2">
      <!-- Icon with dynamic sizing -->
      <Icon name="copyright" :class="iconClass" />
      <span>© 2024 My Project. All rights reserved.</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'
import { computed } from 'vue'

const displayStore = useDisplayStore()

// Computed property to dynamically calculate the icon size based on the displayStore
const iconClass = computed(() => {
  const size = 15
  return {
    [`h-${size} w-${size}`]: size > 0, // Dynamically apply Tailwind class based on `iconSize`
    'h-6 w-6': displayStore.footerState === 'compact',
    'h-8 w-8': displayStore.footerState === 'open',
  }
})
</script>

<style scoped>
.kind-footer {
  background-color: var(--tw-bg-primary);
  color: var(--tw-text-white);
  padding: 1rem;
}
</style>

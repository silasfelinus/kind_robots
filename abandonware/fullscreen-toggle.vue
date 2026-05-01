<!-- /components/content/layout/fullscreen-toggle.vue -->
<template>
  <div
    v-if="!displayStore.isMobileViewport"
    class="z-50 flex items-center space-x-2"
  >
    <button
      type="button"
      class="icon-button"
      :class="{
        'text-accent': isFullScreen,
        'text-info': !isFullScreen,
      }"
      :title="buttonTitle"
      @click="toggleFullScreen"
    >
      <Icon
        :name="isFullScreen ? 'mdi-monitor' : 'mdi-view-column'"
        class="h-5 w-5"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/content/layout/fullscreen-toggle.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isFullScreen = computed(() => displayStore.isFullScreen)

const buttonTitle = computed(() =>
  isFullScreen.value ? 'Return to column layout' : 'Use fullscreen layout',
)

function toggleFullScreen() {
  displayStore.isFullScreen = !displayStore.isFullScreen
}
</script>

<style scoped>
.icon-button {
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 9999px;
  transition: background-color 0.3s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.icon-button:hover {
  filter: brightness(1.1);
}
</style>

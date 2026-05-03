<!-- /components/content/layout/kind-buttons.vue -->
<template>
  <div class="kind-buttons">
    <button
      v-if="!isFullScreen"
      type="button"
      class="fixed right-4 top-30 z-50 rounded-lg bg-primary p-1 text-base-200 shadow-md transition duration-300 hover:bg-accent"
      @click="toggleTutorial"
    >
      Show {{ showTutorial ? 'Nuxt Page' : 'Tutorial' }}
    </button>

    <div
      v-if="!displayStore.isMobileViewport"
      class="fixed bottom-4 right-4 z-50 items-center space-x-2 rounded-lg p-2 text-base-200 shadow-md transition duration-300 lg:flex"
    >
      <button
        type="button"
        class="icon-button"
        :class="{
          'bg-info text-base-200': !isFullScreen,
          'bg-gray-400 text-gray-700': isFullScreen,
        }"
        title="Use two-column layout"
        @click="setFullScreen(false)"
      >
        <Icon name="kind-icon:grid" class="h-6 w-6" />
      </button>

      <button
        type="button"
        class="icon-button"
        :class="{
          'bg-info text-base-200': isFullScreen,
          'bg-gray-400 text-gray-700': !isFullScreen,
        }"
        title="Use fullscreen layout"
        @click="setFullScreen(true)"
      >
        <Icon name="kind-icon:fullscreen" class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/layout/kind-buttons.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const isFullScreen = computed(() => displayStore.isFullScreen)
const showTutorial = computed(() => displayStore.showTutorial)

function setFullScreen(value: boolean) {
  displayStore.isFullScreen = value
}

function toggleTutorial() {
  displayStore.toggleTutorial()
}
</script>

<style scoped>
.kind-buttons {
  pointer-events: auto;
}

.icon-button {
  cursor: pointer;
  padding: 8px;
  border-radius: 9999px;
  transition: background-color 0.3s;
}

.icon-button:hover {
  filter: brightness(1.1);
}
</style>

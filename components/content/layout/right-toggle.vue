<!-- /components/TutorialToggle.vue -->
<template>
  <div class="z-50 p-1">
    <button
      class="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 hover:rotate-12 duration-300 ease-in-out"
      @click="toggleTutorialSidebar"
    >
      <Icon
        :name="rightIconText"
        class="w-6 h-6 text-primary text-info"
        style="
          background: linear-gradient(to bottom right, #f472b6, #fbbf24);
          background-clip: text;
          -webkit-background-clip: text;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        "
      />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/TutorialToggle.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const rightIconText = computed(() =>
  displayStore.sidebarRightState === 'hidden'
    ? 'kind-icon:question'
    : 'kind-icon:question-glow',
)

const toggleTutorialSidebar = () => {
  displayStore.toggleTutorial()

  if (!displayStore.isMobileViewport) {
    const isHidden = displayStore.sidebarRightState === 'hidden'
    displayStore.setSidebarRight(isHidden)
    displayStore.saveState()
  }
}
</script>

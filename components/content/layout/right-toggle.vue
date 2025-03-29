<!-- /components/content/layout/right-toggle.vue -->
<template>
  <div class="relative">
    <button
      @click="handleClick"
      class="w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 duration-300 ease-in-out"
      :class="isHighlighted ? 'bg-warning text-primary' : 'bg-primary text-secondary'"
    >
      <Icon
        :name="isHighlighted ? 'kind-icon:question-glow' : 'kind-icon:question'"
        class="w-6 h-6"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/InfoToggle.vue
import { ref } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const isHighlighted = ref(false)
const displayStore = useDisplayStore()

const handleClick = () => {
  isHighlighted.value = !isHighlighted.value
  displayStore.toggleTutorial()

  if (!displayStore.isMobileViewport) {
    const isHidden = displayStore.sidebarRightState === 'hidden'
    displayStore.setSidebarRight(isHidden)
    displayStore.saveState()
  }
}
</script>

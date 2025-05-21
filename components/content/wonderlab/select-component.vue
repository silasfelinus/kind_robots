<!-- /components/content/wonderlab/select-component.vue -->
<template>
  <div
    class="relative w-full h-full min-h-[100dvh] bg-base-100 text-base-content"
  >
    <!-- Fullscreen Component Display -->
    <component
      :is="resolvedComponent"
      v-if="resolvedComponent"
      class="w-full h-full"
    />

    <!-- Floating Back Button -->
    <button
      class="fixed bottom-4 left-4 z-30 btn btn-sm btn-outline btn-primary shadow-md"
      @click="handleBack"
    >
      <Icon name="kind-icon:arrow-left" class="mr-1" />
      Back to WonderLab
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

const componentStore = useComponentStore()

const resolvedComponent = computed(() => {
  return componentStore.selectedComponent?.componentName || null
})

const handleBack = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
</script>

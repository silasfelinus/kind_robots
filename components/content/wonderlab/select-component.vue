<template>
  <div
    class="w-full h-full bg-base-100 text-base-content flex flex-col items-center justify-center"
  >
    <component
      :is="resolvedComponent"
      v-if="resolvedComponent"
      class="w-full max-w-4xl p-4"
    />

    <button
      class="fixed bottom-4 left-4 z-50 btn btn-sm btn-outline btn-primary shadow-md"
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

const resolvedComponent = computed(
  () => componentStore.selectedComponent?.componentName || null,
)

const handleBack = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
</script>

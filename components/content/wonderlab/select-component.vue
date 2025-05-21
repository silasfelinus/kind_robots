<!-- /components/content/wonderlab/select-component.vue -->
<template>
  <div
    class="relative w-full h-full min-h-[100dvh] bg-base-100 text-base-content"
  >
    <!-- Fullscreen Component Display -->
    <component
      :is="component.componentName"
      v-if="component?.componentName"
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
import { toRef } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import type { KindComponent as Component } from '@/stores/componentStore'

const props = defineProps<{
  component: Component
}>()

const component = toRef(props, 'component')
const componentStore = useComponentStore()

const handleBack = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
</script>

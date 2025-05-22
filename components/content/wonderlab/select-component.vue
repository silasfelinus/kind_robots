<!-- /components/content/wonderlab/select-component.vue -->
<template>
  <div class="relative w-full min-h-[80vh]">

    <!-- Scrollable Component Container -->
    <div class="w-full h-full max-h-[calc(100dvh-6rem)] overflow-auto rounded-2xl border border-base-300 bg-base-100 shadow-md">
      <component
        :is="resolvedComponent"
        v-if="resolvedComponent"
        class="w-full h-full"
      />
    </div>

    <!-- Back Button (always visible, top-left inside flow) -->
    <button
      class="absolute top-4 left-4 z-30 btn btn-primary btn-sm px-4 py-2 shadow-lg"
      @click="handleBack"
    >
      <Icon name="kind-icon:arrow-left" class="mr-2" />
      Back
    </button>

    <!-- Reaction Icon -->
    <button
      class="absolute bottom-4 left-4 z-30 btn btn-accent btn-sm btn-circle"
      @click="showReactions = !showReactions"
      title="Toggle Reactions"
    >
      <Icon name="kind-icon:emoji" class="text-xl" />
    </button>

    <!-- Reactions Panel -->
    <transition name="fade">
      <div
        v-if="showReactions && componentStore.selectedComponent"
        class="absolute bottom-0 left-0 right-0 z-20 bg-base-200 border-t border-base-300 p-4 shadow-xl"
      >
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold">
            Reactions: {{ componentStore.selectedComponent.title }}
          </h2>
          <button class="btn btn-xs btn-outline" @click="showReactions = false">
            Close
          </button>
        </div>
        <component-reactions />
      </div>
    </transition>
  </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const componentStore = useComponentStore()
const showReactions = ref(false)

const resolvedComponent = computed(() => {
  return componentStore.selectedComponent?.componentName || null
})

function handleBack() {
  showReactions.value = false
  componentStore.clearSelectedComponent()
  
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

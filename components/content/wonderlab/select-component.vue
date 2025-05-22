<!-- /components/content/wonderlab/full-screen-component.vue -->
<template>
  <div class="relative w-full h-full">
    <!-- Full-Screen Overlay -->
    <div
      class="fixed inset-0 z-40 bg-base-100 text-base-content"
      :class="{
        'w-[100vw] h-[100dvh] max-w-[100vw] max-h-[100dvh]': displayStore.isFullScreen,
      }"
    >
      <!-- Scrollable Component Container -->
      <div class="absolute inset-0 w-full h-full overflow-hidden">
        <component
          :is="resolvedComponent"
          v-if="resolvedComponent"
          class="w-full h-full overflow-auto"
        />
      </div>

      <!-- Reaction Icon (bottom-left, always visible) -->
      <button
        v-if="componentStore.selectedComponent"
        class="fixed bottom-4 left-4 z-50 btn btn-accent btn-sm btn-circle"
        @click="showReactions = !showReactions"
        title="Toggle Reactions"
      >
        <Icon name="kind-icon:emoji" class="text-xl" />
      </button>

      <!-- Reactions Panel (overlays bottom area) -->
      <transition name="fade">
        <div
          v-if="showReactions && componentStore.selectedComponent"
          class="fixed bottom-0 left-0 right-0 z-50 bg-base-200 border-t border-base-300 p-4 shadow-xl"
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

    <!-- Back Button (independent, always visible) -->
    <button
      v-if="componentStore.selectedComponent"
      class="fixed top-4 left-4 z-[999] btn btn-primary btn-sm px-4 py-2 shadow-lg"
      @click="handleBack"
    >
      <Icon name="kind-icon:arrow-left" class="mr-2" />
      Back
    </button>
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
  componentStore.clearSelectedFolder()
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

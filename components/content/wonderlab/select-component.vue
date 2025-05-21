<template>
  <div
    class="fixed inset-0 z-40 bg-base-100 text-base-content"
    :class="{ 'fullscreen-mode': displayStore.isFullScreen }"
  >
    <div class="absolute inset-0 w-[100vw] h-[100dvh] overflow-hidden">
      <component
        :is="resolvedComponent"
        v-if="resolvedComponent"
        class="w-full h-full overflow-auto"
      />

      <!-- Back Button -->
      <button
        class="absolute top-4 left-4 z-50 btn btn-sm btn-outline btn-primary shadow-md"
        @click="handleBack"
      >
        <Icon name="kind-icon:arrow-left" class="mr-1" />
        Back
      </button>

      <!-- Reactions Toggle -->
      <button
        v-if="componentStore.selectedComponent"
        class="absolute bottom-4 right-4 z-50 btn btn-accent btn-sm btn-circle"
        @click="showReactions = !showReactions"
        title="Toggle Reactions"
      >
        <Icon name="kind-icon:emoji" class="text-xl" />
      </button>

      <!-- Reactions Panel -->
      <transition name="fade">
        <div
          v-if="showReactions && componentStore.selectedComponent"
          class="absolute bottom-0 left-0 right-0 z-40 bg-base-200 border-t border-base-300 p-4 shadow-xl"
        >
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-lg font-semibold">
              Reactions: {{ componentStore.selectedComponent.title }}
            </h2>
            <button
              class="btn btn-xs btn-outline"
              @click="showReactions = false"
            >
              Close
            </button>
          </div>
          <component-reactions :component="componentStore.selectedComponent" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useDisplayStore } from '@/stores/displayStore'
const displayStore = useDisplayStore()

const showReactions = ref(false)
const componentStore = useComponentStore()

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

.fullscreen-mode {
  width: 100vw;
  height: 100dvh;
  max-height: 100dvh;
  max-width: 100vw;
  overflow: hidden;
}
</style>

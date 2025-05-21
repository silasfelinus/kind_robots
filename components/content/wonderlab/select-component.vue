<!-- /components/content/wonderlab/select-component.vue -->
<template>
  <div
    class="fixed inset-0 z-50 bg-base-100 text-base-content w-[100vw] h-[100vh] overflow-hidden"
  >
    <!-- Inner Component Display Area -->
    <div class="relative w-full h-full">
      <component
        :is="resolvedComponent"
        v-if="resolvedComponent"
        class="w-full h-full overflow-auto"
      />

      <!-- Back Button (TOP LEFT) -->
      <button
        class="absolute top-4 left-4 btn btn-sm btn-outline btn-primary shadow-md z-50"
        @click="handleBack"
      >
        <Icon name="kind-icon:arrow-left" class="mr-1" />
        Back to WonderLab
      </button>

      <!-- Reactions Toggle (BOTTOM RIGHT) -->
      <button
        class="absolute bottom-4 right-4 btn btn-sm btn-accent btn-circle z-50"
        @click="showReactions = !showReactions"
        title="Toggle Reactions"
      >
        <Icon name="kind-icon:emoji" class="text-xl" />
      </button>

      <!-- Reactions Panel -->
      <transition name="fade">
        <div
          v-if="showReactions && componentStore.selectedComponent"
          class="absolute bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 p-4 shadow-xl z-40"
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

const showReactions = ref(false)
const componentStore = useComponentStore()

const resolvedComponent = computed(
  () => componentStore.selectedComponent?.componentName || null,
)

const handleBack = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

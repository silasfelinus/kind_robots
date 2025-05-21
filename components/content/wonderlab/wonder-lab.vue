<!-- /components/content/wonderlab.vue -->
<template>
  <div
    class="relative flex flex-col min-h-[100dvh] bg-base-100 text-base-content"
  >
    <!-- Sticky Header -->
    <div
      v-if="!componentStore.selectedComponent"
      class="sticky top-0 z-10 bg-base-200 border-b border-base-300 p-4 flex flex-col gap-2"
    >
      <div class="flex items-center justify-between">
        <wonderlab-launch />
      </div>
    </div>

    <!-- Main Content Area (Hidden when in full-screen component mode) -->
    <div
      v-if="!componentStore.selectedComponent"
      class="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-7xl w-full mx-auto"
    >
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
        <span class="ml-2">Loading components…</span>
      </div>

      <div v-if="errorMessages.length" class="text-error text-center">
        🚨 {{ errorMessages.join(', ') }}
      </div>

      <lab-gallery />
    </div>

    <!-- Fullscreen component view -->
    <select-component
      v-if="componentStore.selectedComponent"
      class="absolute inset-0 z-30"
    />

    <!-- Floating Reactions Panel -->
    <transition name="fade">
      <div
        v-if="showReactions && componentStore.selectedComponent"
        class="fixed bottom-0 left-0 right-0 z-40 bg-base-200 border-t border-base-300 p-4 shadow-xl"
      >
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold">
            Reactions: {{ componentStore.selectedComponent.title }}
          </h2>
          <button class="btn btn-xs btn-outline" @click="showReactions = false">
            Close
          </button>
        </div>
        <component-reactions :component="componentStore.selectedComponent" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

const isLoading = ref(true)
const showReactions = ref(false)
const errorMessages = ref<string[]>([])
const componentStore = useComponentStore()

onMounted(async () => {
  isLoading.value = true
  try {
    await componentStore.initialize()
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error('Error during initialization:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <div class="relative flex flex-col min-h-[100dvh] bg-base-100 text-base-content">
    <!-- Sticky Header -->
    <div class="sticky top-0 z-10 bg-base-200 border-b border-base-300 p-4 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Welcome to the WonderLab</h1>
        <component-count v-if="!componentStore.selectedComponent" />
        <button
          v-if="componentStore.selectedComponent"
          class="btn btn-sm btn-circle btn-accent"
          @click="showReactions = !showReactions"
        >
          <Icon name="kind-icon:emoji" class="text-xl" />
        </button>
      </div>
    </div>

    <!-- Main Area -->
    <div class="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-7xl w-full mx-auto">
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <Icon name="kind-icon:bubble-loading" class="animate-spin text-4xl" />
        <span class="ml-2">Loading components…</span>
      </div>

      <!-- Errors -->
      <div v-if="errorMessages.length" class="text-error text-center">
        🚨 {{ errorMessages.join(', ') }}
      </div>

      <!-- Debug (gallery only) -->
      <div
        v-if="!componentStore.selectedComponent"
        class="bg-warning text-black p-4 rounded-xl shadow-xl space-y-2"
      >
        <h2 class="text-lg font-bold">🪵 Debug: WonderLab State</h2>
        <p><strong>Selected Folder:</strong> {{ componentStore.selectedFolder }}</p>
        <p><strong>Total Components:</strong> {{ componentStore.components.length }}</p>
        <div class="bg-white text-xs p-2 rounded shadow max-h-48 overflow-y-auto">
          <strong>All Components:</strong>
          <pre>{{ JSON.stringify(componentStore.components, null, 2) }}</pre>
        </div>
      </div>

      <!-- Gallery or Component -->
      <lab-gallery
        v-if="!componentStore.selectedComponent"
      />

      <main-component
        v-else
        :component="componentStore.selectedComponent"
        class="component-screen w-full"
      />
    </div>

    <!-- Floating Back Button -->
    <transition name="fade">
      <button
        v-if="componentStore.selectedComponent"
        class="fixed bottom-4 left-4 z-30 btn btn-sm btn-outline btn-primary shadow-md"
        @click="handleComponentClose"
      >
        <Icon name="kind-icon:arrow-left" class="mr-1" />
        Back to WonderLab
      </button>
    </transition>

    <!-- Floating Reactions Panel -->
    <transition name="fade">
      <div
        v-if="showReactions && componentStore.selectedComponent"
        class="fixed bottom-0 left-0 right-0 z-20 bg-base-200 border-t border-base-300 p-4 shadow-xl"
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
import type { KindComponent as Component } from '@/stores/componentStore'

const isLoading = ref(true)
const showReactions = ref(false)
const errorMessages = ref<string[]>([])
const componentStore = useComponentStore()

onMounted(async () => {
  isLoading.value = true
  try {
    await componentStore.initializeComponents()
  } catch (error) {
    errorMessages.value.push('Failed to initialize components')
    console.error('Error during initialization:', error)
  } finally {
    isLoading.value = false
  }
})

const handleComponentClose = () => {
  componentStore.clearSelectedComponent()
  componentStore.clearSelectedFolder()
}
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

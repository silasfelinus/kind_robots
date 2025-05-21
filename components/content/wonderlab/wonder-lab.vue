<!-- /components/content/wonderlab.vue -->
<template>
  <div
    class="relative flex flex-col min-h-[100dvh] bg-base-100 text-base-content"
  >
    <!-- Header + Launch Block -->
    <div
      v-if="!componentStore.selectedComponent"
      class="sticky top-0 z-10 bg-base-200 border-b border-base-300 p-4 flex flex-col gap-4"
    >
      <!-- Welcome + Stats -->
      <div
        class="w-full max-w-4xl mx-auto bg-base-200 border border-base-300 rounded-2xl px-6 py-5 text-center shadow-md flex flex-col items-center gap-4"
      >
        <div
          class="text-xl sm:text-2xl font-bold tracking-tight text-primary-content"
        >
          ✨ Welcome to the WonderLab
        </div>
        <div class="text-base-content text-sm sm:text-md">
          Where components come alive—and sometimes crash gloriously.
        </div>
        <div
          class="flex flex-col items-center bg-base-100 border border-dashed border-accent p-4 rounded-xl w-full max-w-md"
        >
          <p class="font-mono text-base sm:text-lg text-accent mb-1">
            🗃️ Total Components in Database:
          </p>
          <p class="text-4xl sm:text-5xl font-bold text-secondary font-mono">
            {{ componentCount }}
          </p>
          <component-sync v-if="isAdmin" class="mt-4" />
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'

const isLoading = ref(true)
const errorMessages = ref<string[]>([])

const componentStore = useComponentStore()
const userStore = useUserStore()

const componentCount = computed(() => componentStore.allComponents.length)
const isAdmin = computed(() => userStore.isAdmin)

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

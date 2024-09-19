<template>
  <div>
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading and no errors -->
    <transition name="flip">
      <div v-if="!isLoading && !errorMessages.length">
        <!-- Intro Section with random image and component count -->
        <div
          v-if="!componentStore.selectedComponent"
          class="intro-section text-center"
        >
          <random-image class="mb-4" />
          <p class="text-lg px-4">
            Welcome to the WonderLab! Select a folder to view components.
          </p>
          <component-count />
        </div>

        <!-- LabGallery component -->
        <lab-gallery v-if="!componentStore.selectedComponent" />

        <!-- Component Screen -->
        <component-screen
          v-if="componentStore.selectedComponent"
          :component="componentStore.selectedComponent"
          @close="componentStore.clearSelectedComponent"
        />
      </div>
    </transition>

    <!-- Error Reporting -->
    <div v-if="errorMessages.length" class="col-span-3 text-red-500 mt-4">
      🚨 Error loading data: {{ errorMessages.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import LabGallery from './LabGallery.vue'
import ComponentScreen from './ComponentScreen.vue'

// State variables
const isLoading = ref(false)
const errorMessages = ref<string[]>([])

// Access the component store
const componentStore = useComponentStore()
</script>

<style scoped>
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

.intro-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

<template>
  <div class="p-6 bg-base-200 min-h-screen flex flex-col items-center">
    <div
      v-if="selectedComponent"
      class="w-full max-w-3xl bg-white p-6 rounded-lg shadow-md"
    >
      <h2 class="text-3xl font-bold mb-4">
        {{ selectedComponent.title || selectedComponent.componentName }}
      </h2>

      <div class="mb-6">
        <label class="font-semibold">Title:</label>
        <input
          v-if="isAdmin"
          v-model="selectedComponent.title"
          type="text"
          class="input input-bordered w-full"
        />
        <p v-else>{{ selectedComponent.title }}</p>
      </div>

      <div class="mb-6">
        <label class="font-semibold">Notes:</label>
        <textarea
          v-if="isAdmin"
          v-model="selectedComponent.notes"
          class="textarea textarea-bordered w-full"
        ></textarea>
        <p v-else>{{ selectedComponent.notes }}</p>
      </div>

      <!-- Include the component reaction bar -->
      <div class="mb-6">
        <ComponentReaction :component-id="selectedComponent.id" />
      </div>

      <button class="btn btn-error" @click="leaveComponent">Leave</button>
    </div>
    <div v-else>
      <p>No component selected</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'

// Access the component store and the user store
const componentStore = useComponentStore()
const userStore = useUserStore()

// Computed properties
const selectedComponent = computed(() => componentStore.selectedComponent)
const isAdmin = computed(() => userStore.user?.Role === 'ADMIN')

// Function to leave the component view
const leaveComponent = () => {
  componentStore.clearSelectedComponent()
}
</script>

<template>
  <div class="relative w-full bg-white rounded-lg shadow-md">
    <!-- Display component information dynamically -->
    <h2 v-if="selectedComponent" class="text-xl font-semibold">
      {{ selectedComponent?.componentName }}
    </h2>
    <p v-else class="text-lg">Loading component...</p>

    <!-- Display form fields for title, notes, and boolean toggles -->
    <div v-if="selectedComponent" class="mt-2">
      <label class="block mb-2 text-sm font-medium">Title:</label>
      <input
        v-model="selectedComponent.title"
        type="text"
        class="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary focus:border-primary"
        @input="updateComponent"
      />

      <label class="block mt-4 mb-2 text-sm font-medium">Notes:</label>
      <textarea
        v-model="selectedComponent.notes"
        class="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-primary focus:border-primary"
        @input="updateComponent"
      ></textarea>

      <div class="mt-4 flex items-center space-x-4">
        <label class="flex items-center space-x-2">
          <input
            v-model="selectedComponent.isWorking"
            type="checkbox"
            class="form-checkbox"
            @change="updateComponent"
          />
          <span>Is Working</span>
        </label>

        <label class="flex items-center space-x-2">
          <input
            v-model="selectedComponent.underConstruction"
            type="checkbox"
            class="form-checkbox"
            @change="updateComponent"
          />
          <span>Under Construction</span>
        </label>

        <label class="flex items-center space-x-2">
          <input
            v-model="selectedComponent.isBroken"
            type="checkbox"
            class="form-checkbox"
            @change="updateComponent"
          />
          <span>Is Broken</span>
        </label>
      </div>
    </div>
    <reaction-card />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useComponentStore } from './../../../stores/componentStore'
import { useUserStore } from './../../../stores/userStore'

// Pinia stores
const reactionStore = useReactionStore()
const componentStore = useComponentStore()
const userStore = useUserStore()

// State for reaction and comments
const reactionType = ref<string | null>(null)

// Get the selected component from the store
const selectedComponent = computed(() => componentStore.selectedComponent)

// Get the user ID
const userId = computed(() => userStore.user?.id || 10) // Default to guest user ID 10 if not logged in

// Watch the selectedComponent to update the local reaction state
watch(selectedComponent, (newComponent) => {
  if (newComponent) {
    fetchReactions(newComponent.id)
  }
})

// Fetch reactions for the selected component
const fetchReactions = async (componentId: number) => {
  await reactionStore.fetchReactionsByComponentId(componentId)
  const userReaction = reactionStore.getUserReactionForComponent(
    componentId,
    userId.value,
  )
  if (userReaction) {
    reactionType.value = userReaction.reactionType // Now using ReactionType directly
  } else {
    reactionType.value = 'NEUTRAL' // Default reaction if none exists
  }
}

// Function to update the component when fields change
const updateComponent = async () => {
  if (selectedComponent.value) {
    await componentStore.createOrUpdateComponent(
      selectedComponent.value,
      'update',
    )
  }
}

// Fetch reactions and initialize when component is mounted
onMounted(() => {
  if (selectedComponent.value) {
    fetchReactions(selectedComponent.value.id)
  }
})
</script>

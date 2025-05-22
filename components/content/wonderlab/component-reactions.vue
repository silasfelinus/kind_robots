<!-- /components/content/wonderlab/component-reactions.vue -->
<template>
  <div class="relative w-full bg-base-200 border border-base-300 rounded-2xl shadow-lg p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 v-if="selectedComponent" class="text-2xl font-bold text-primary-content">
        {{ selectedComponent?.componentName }}
      </h2>
      <p v-else class="text-lg text-base-content/70">Loading component...</p>
    </div>

    <!-- Editable Fields -->
    <div v-if="selectedComponent" class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <!-- Title -->
      <div>
        <label class="block mb-1 text-sm font-semibold text-base-content">Title</label>
        <input
          v-model="selectedComponent.title"
          type="text"
          class="input input-bordered w-full"
          @input="updateComponent"
        />
      </div>

      <!-- Notes -->
      <div class="sm:col-span-2">
        <label class="block mb-1 text-sm font-semibold text-base-content">Notes</label>
        <textarea
          v-model="selectedComponent.notes"
          class="textarea textarea-bordered w-full"
          rows="3"
          @input="updateComponent"
        ></textarea>
      </div>

      <!-- Toggles -->
      <div class="sm:col-span-2 flex flex-wrap gap-4">
        <label class="flex items-center gap-2">
          <input
            v-model="selectedComponent.isWorking"
            type="checkbox"
            class="checkbox"
            @change="updateComponent"
          />
          <span class="text-base-content">Is Working</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="selectedComponent.underConstruction"
            type="checkbox"
            class="checkbox"
            @change="updateComponent"
          />
          <span class="text-base-content">Under Construction</span>
        </label>

        <label class="flex items-center gap-2">
          <input
            v-model="selectedComponent.isBroken"
            type="checkbox"
            class="checkbox"
            @change="updateComponent"
          />
          <span class="text-base-content">Is Broken</span>
        </label>
      </div>
    </div>

    <!-- Reaction Display -->
    <reaction-card />
  </div>
</template>


<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useComponentStore } from '../../../stores/componentStore'
import { useUserStore } from '../../../stores/userStore'

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

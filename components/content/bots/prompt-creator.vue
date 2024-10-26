<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields and remove buttons -->
    <div
      v-for="(prompt, index) in localPrompts"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <input
        v-model="localPrompts[index]"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter user prompt"
        @input="markAsChanged(index)"
      />
      <button class="text-red-500" @click="removePrompt(index)">
        <Icon name="kind-icon:trash" class="w-6 h-6" />
      </button>
      <!-- Show save button when the prompt has been changed -->
      <button
        v-if="changedPrompts[index]"
        class="btn btn-primary"
        @click="savePrompt(index)"
      >
        Save
      </button>
    </div>

    <!-- Button to add new prompts -->
    <button class="btn btn-primary mt-4" @click="addPrompt">
      Add New Prompt
    </button>

    <!-- Display final prompt string -->
    <h3 class="text-lg font-medium mt-4">Final Prompt String</h3>
    <p>{{ finalPromptString }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePromptStore } from '@/stores/promptStore'

// Access the promptStore
const promptStore = usePromptStore()

// Local copy of the prompt array to handle input before committing changes
const localPrompts = ref([...promptStore.promptArray])

// Track which prompts have unsaved changes
const changedPrompts = ref<boolean[]>([])

// Sync localPrompts with promptStore on mount
onMounted(() => {
  localPrompts.value = [...promptStore.promptArray] // Sync on mount
  resetChangedPrompts()
})

// Watch for changes in promptStore.promptArray and update localPrompts accordingly
watch(() => promptStore.promptArray, (newPrompts) => {
  localPrompts.value = [...newPrompts]
  resetChangedPrompts()
})

// Add new prompt to the local array and the store
function addPrompt() {
  localPrompts.value.push('') // Add an empty prompt locally
  promptStore.addPrompt('') // Add an empty prompt to the store
  changedPrompts.value.push(false) // Initialize as not changed
}

// Mark a prompt as changed when user modifies it
function markAsChanged(index: number) {
  changedPrompts.value[index] = true
}

// Save the prompt to the store when user clicks "Save"
function savePrompt(index: number) {
  const updatedPrompt = localPrompts.value[index]
  promptStore.updatePromptAtIndex(index, updatedPrompt) // Commit to store
  changedPrompts.value[index] = false // Mark as saved
}

// Remove a prompt from both the local array and the store
function removePrompt(index: number) {
  localPrompts.value.splice(index, 1) // Remove from local array
  promptStore.removePromptFromArray(index) // Remove from store
  changedPrompts.value.splice(index, 1) // Remove change tracking
}

// Reset change tracking for all prompts (after syncing)
function resetChangedPrompts() {
  changedPrompts.value = localPrompts.value.map(() => false)
}

// Computed property to display the final constructed prompt string
const finalPromptString = computed(() => promptStore.getFinalPromptString())
</script>

<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields and remove buttons -->
    <div
      v-for="(prompt, index) in promptStore.promptArray"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <input
        v-model="localPrompts[index]"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter user prompt"
        @input="updatePrompt(index, localPrompts[index])"
      />
      <button class="text-red-500" @click="removePrompt(index)">
        <Icon name="kind-icon:trash" class="w-6 h-6" />
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
import { ref, computed, onMounted } from 'vue'
import { usePromptStore } from '@/stores/promptStore'

// Access the promptStore
const promptStore = usePromptStore()

// Local copy of the prompt array to handle input before committing changes
const localPrompts = ref([...promptStore.promptArray])

// Add new prompt to the local array
function addPrompt() {
  localPrompts.value.push('') // Add an empty prompt locally
}

// Update prompt when user modifies an input, committing changes to the store
function updatePrompt(index: number, value: string) {
  localPrompts.value[index] = value // Update local array
  promptStore.updatePromptAtIndex(index, value) // Commit to store
}

// Remove a prompt from both the local array and the store
function removePrompt(index: number) {
  localPrompts.value.splice(index, 1) // Remove from local array
  promptStore.removePromptFromArray(index) // Remove from store
}

// Computed property to display the final constructed prompt string
const finalPromptString = computed(() => promptStore.getFinalPromptString())

// Sync localPrompts with promptStore on mount
onMounted(() => {
  localPrompts.value = [...promptStore.promptArray] // Sync on mount
})
</script>

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
        v-model="promptStore.promptArray[index]"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter user prompt"
      />
      <button class="text-red-500" @click="removePrompt(index)">
        <kind-icon name="trash" class="w-6 h-6" />
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
import { usePromptStore } from '@/stores/promptStore'

// Access the promptStore
const promptStore = usePromptStore()

// Add new prompt to the store's array
function addPrompt() {
  promptStore.addPromptToArray('') // Add an empty prompt string
}

// Remove a prompt from the store's array by index
function removePrompt(index: number) {
  promptStore.removePromptFromArray(index)
}

// Computed property to display the final constructed prompt string
const finalPromptString = computed(() => promptStore.getFinalPromptString())
</script>

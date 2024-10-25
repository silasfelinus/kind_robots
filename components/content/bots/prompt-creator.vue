<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields -->
    <div
      v-for="(prompt, index) in promptStore.promptArray"
      :key="index"
      class="mb-4"
    >
      <input
        v-model="promptStore.promptArray[index]"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter user prompt"
      />
      <button class="text-red-500 mt-2" @click="removePrompt(index)">
        Remove
      </button>
    </div>

    <!-- Button to add new prompts -->
    <button class="btn btn-primary mt-4" @click="addPrompt">
      Add New Prompt
    </button>
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
</script>

<template>
  <div class="add-prompt-container">
    <h1 class="text-3xl mb-4 text-center">Add a Prompt</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <label for="stringType" class="block text-sm font-medium text-gray-600">String Type</label>
      <input
        id="stringType"
        v-model="stringType"
        type="text"
        class="mt-1 p-2 w-full rounded-md border"
        required
      />

      <label for="label" class="block text-sm font-medium text-gray-600">Label</label>
      <input
        id="label"
        v-model="label"
        type="text"
        class="mt-1 p-2 w-full rounded-md border"
        required
      />

      <label for="content" class="block text-sm font-medium text-gray-600">Content</label>
      <textarea
        id="content"
        v-model="content"
        class="mt-1 p-2 w-full rounded-md border"
        required
      ></textarea>

      <!-- Include input fields for sender, senderId, recipient, recipientId if needed -->

      <button type="submit" class="btn btn-success w-full mt-4">Add Prompt</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Prompt, StringType } from '@prisma/client'
import { usePromptStore } from '../../stores/promptStore' // Import the promptStore

const promptStore = usePromptStore()

const stringTypes = Object.values(StringType) // Assuming StringType is an enum
const stringType = ref<StringType>(stringTypes[0]) // Default to the first value
const label = ref('')
const content = ref('')

async function handleSubmit(e: Event) {
  e.preventDefault()
  const promptData: Partial<Prompt>[] = [
    {
      StringType: stringType.value,
      label: label.value,
      content: content.value
      // Other fields if needed
    }
  ]
  await promptStore.addPrompts(promptData) // Use the promptStore to add the new prompts
}
</script>

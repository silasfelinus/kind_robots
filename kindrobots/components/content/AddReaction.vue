<template>
  <div class="add-reaction-container">
    <h1 class="text-3xl mb-4 text-center">Add a Reaction</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <label for="modelType" class="block text-sm font-medium text-gray-600">Model Type</label>
      <select id="modelType" v-model="modelType" class="mt-1 p-2 w-full rounded-md border">
        <option v-for="type in modelTypes" :key="type" :value="type">{{ type }}</option>
      </select>

      <!-- Add other form fields as needed -->
      <label for="content" class="block text-sm font-medium text-gray-600">Content</label>
      <textarea
        id="content"
        v-model="content"
        class="mt-1 p-2 w-full rounded-md border"
        rows="5"
      ></textarea>

      <label for="rating" class="block text-sm font-medium text-gray-600">Rating</label>
      <input
        id="rating"
        v-model="rating"
        type="number"
        class="mt-1 p-2 w-full rounded-md border"
        min="1"
        max="5"
      />

      <button type="submit" class="btn btn-success w-full mt-4">Add Reaction</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ModelType, Reaction } from '@prisma/client'
import { useReactionStore } from '../../stores/reactionStore'

const reactionStore = useReactionStore()

const modelTypes = Object.values(ModelType) // Get all possible model types from the enum

// Form fields
const modelType = ref(ModelType.BOT) // Default to BOT
const content = ref('')
const rating = ref<number | null>(null)

async function handleSubmit(e: Event) {
  e.preventDefault()
  const reactionData: Partial<Reaction>[] = [
    {
      modelType: modelType.value,
      content: content.value,
      rating: rating.value
      // ... (other form fields)
    }
  ]
  await reactionStore.addReactions(reactionData)
}
</script>

<style>
/* Add any necessary CSS styling here */
</style>

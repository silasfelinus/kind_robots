<template>
  <div class="add-model-container">
    <h1 class="text-3xl mb-4 text-center">Create a New Model</h1>
    <form
      class="bg-white shadow-lg rounded-lg p-8"
      enctype="multipart/form-data"
      @submit="handleSubmit"
    >
      <div class="mb-4">
        <label for="modelType" class="block text-sm font-medium">Model Type:</label>
        <select id="modelType" v-model="modelType" class="w-full p-2 rounded border">
          <option v-for="type in modelTypes" :key="type" :value="type">{{ type }}</option>
        </select>
      </div>
      <div class="mb-4">
        <label for="label" class="block text-sm font-medium">Label:</label>
        <input id="label" v-model="label" type="text" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="content" class="block text-sm font-medium">Content:</label>
        <textarea
          id="content"
          v-model="content"
          class="resize w-full p-2 rounded border"
        ></textarea>
      </div>
      <button type="submit" class="btn btn-success w-full">Create Model</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ModelType } from '@prisma/client'
import { useErrorStore, useStatusStore, StatusType, ErrorType } from '../../stores/'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

// Form fields
const modelType = ref(ModelType.BOT) // Default to BOT
const label = ref('')
const content = ref('')

const modelTypes = Object.values(ModelType) // Get all possible model types from the enum

function handleSubmit(e: Event) {
  e.preventDefault()

  statusStore.setStatus(StatusType.INFO, 'Creating the model...')

  try {
    const modelData = {
      modelType: modelType.value,
      label: label.value,
      content: content.value
    }

    // Logic to create the model (e.g., API call or store method)

    statusStore.setStatus(StatusType.SUCCESS, 'Model created successfully!')
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to create the model.')
  }
}
</script>

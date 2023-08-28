<template>
  <div class="add-media-container">
    <h1 class="text-3xl mb-4 text-center">Create New Media</h1>
    <form
      class="bg-white shadow-lg rounded-lg p-8"
      enctype="multipart/form-data"
      @submit="handleSubmit"
    >
      <label for="path" class="block text-sm font-medium text-gray-600">Path</label>
      <input id="path" v-model="path" type="text" class="mt-1 p-2 w-full rounded-md border" />
      <!-- Additional form fields for other properties -->
      <!-- ... -->
      <button type="submit" class="btn btn-success w-full mt-4">Create Media</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useErrorStore, useStatusStore, StatusType, ErrorType } from '../../stores/'
import { useMediaStore } from '../../stores/mediaStore' // Import the mediaStore

const errorStore = useErrorStore()
const statusStore = useStatusStore()
const mediaStore = useMediaStore() // Initialize the mediaStore

// Form fields
const path = ref('') // Initialize with the default value or an empty string
// ... (other form fields)

function handleSubmit(e: Event) {
  e.preventDefault()

  statusStore.setStatus(StatusType.INFO, 'Creating the media...')

  try {
    const mediaData = {
      path: path.value
      // ... (other form fields)
    }

    mediaStore.addMedia([mediaData]) // Use the mediaStore to add the new media

    statusStore.setStatus(StatusType.SUCCESS, 'Media created successfully!')
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to create the media.')
  }
}
</script>

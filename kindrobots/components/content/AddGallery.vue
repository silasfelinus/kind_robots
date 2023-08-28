<template>
  <div class="add-gallery-container">
    <h1 class="text-3xl mb-4 text-center">Create a New Gallery</h1>
    <form
      class="bg-white shadow-lg rounded-lg p-8"
      enctype="multipart/form-data"
      @submit="handleSubmit"
    >
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium">Name:</label>
        <input id="name" v-model="name" type="text" class="w-full p-2 rounded border" required />
      </div>
      <div class="mb-4">
        <label for="content" class="block text-sm font-medium">Content:</label>
        <textarea
          id="content"
          v-model="content"
          class="resize w-full p-2 rounded border"
          required
        ></textarea>
      </div>
      <div class="mb-4">
        <label for="description" class="block text-sm font-medium">Description:</label>
        <textarea
          id="description"
          v-model="description"
          class="resize w-full p-2 rounded border"
        ></textarea>
      </div>
      <div class="mb-4">
        <label for="url" class="block text-sm font-medium">URL:</label>
        <input id="url" v-model="url" type="url" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="custodian" class="block text-sm font-medium">Custodian:</label>
        <input id="custodian" v-model="custodian" type="text" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label class="flex items-center">
          <input v-model="isNSFW" type="checkbox" class="mr-2" />
          Mark as NSFW
        </label>
      </div>
      <!-- File Uploads for Images -->
      <!-- ... -->
      <button type="submit" class="btn btn-success w-full">Create Gallery</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useErrorStore, useStatusStore, StatusType, ErrorType } from '../../stores/'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

// Form fields
const name = ref('')
const content = ref('')
const description = ref('')
const mediaId = ref('')
const url = ref('')
const isNSFW = ref(false)
const custodian = ref('')
const highlightImage = ref('') // File input or custom image uploader
const imagePaths = ref('') // File input or custom image uploader

function handleSubmit(e: Event) {
  e.preventDefault()

  statusStore.setStatus(StatusType.INFO, 'Creating the gallery...')

  try {
    const galleryData = {
      name: name.value,
      content: content.value,
      description: description.value,
      mediaId: mediaId.value,
      url: url.value,
      isNSFW: isNSFW.value,
      custodian: custodian.value,
      highlightImage: highlightImage.value,
      imagePaths: imagePaths.value
    }

    // Logic to create the gallery (e.g., API call or store method)

    statusStore.setStatus(StatusType.SUCCESS, 'Gallery created successfully!')
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to create the gallery.')
  }
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>

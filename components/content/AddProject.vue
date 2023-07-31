<template>
  <div class="add-project-container">
    <h1 class="text-3xl mb-4 text-center">Create a New Project</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium">Name:</label>
        <input id="name" v-model="name" type="text" class="w-full p-2 rounded border" required />
      </div>
      <div class="mb-4">
        <label for="title" class="block text-sm font-medium">Title:</label>
        <input id="title" v-model="title" type="text" class="w-full p-2 rounded border" required />
      </div>
      <div class="mb-4">
        <label for="category" class="block text-sm font-medium">Category:</label>
        <input
          id="category"
          v-model="category"
          type="text"
          class="w-full p-2 rounded border"
          required
        />
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
        <label for="usdFee" class="block text-sm font-medium">USD Fee:</label>
        <input
          id="usdFee"
          v-model="usdFee"
          type="number"
          step="0.01"
          class="w-full p-2 rounded border"
        />
      </div>
      <div class="mb-4">
        <label for="portalUrl" class="block text-sm font-medium">Portal URL:</label>
        <input id="portalUrl" v-model="portalUrl" type="url" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4">
        <label for="pitchUrl" class="block text-sm font-medium">Pitch URL:</label>
        <input id="pitchUrl" v-model="pitchUrl" type="url" class="w-full p-2 rounded border" />
      </div>
      <div class="mb-4 flex space-x-4">
        <label class="flex items-center">
          <input v-model="allowComments" type="checkbox" class="mr-2" />
          Allow Comments
        </label>
        <label class="flex items-center">
          <input v-model="isPublic" type="checkbox" class="mr-2" />
          Public
        </label>
        <label class="flex items-center">
          <input v-model="hasAdmission" type="checkbox" class="mr-2" />
          Has Admission
        </label>
      </div>
      <!-- Other optional fields such as paywallDestination, hostId, etc. -->
      <!-- ... -->
      <button type="submit" class="btn btn-success w-full">Create Project</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useErrorStore, useStatusStore, StatusType, ErrorType } from '../../stores/'
import { useProjectStore } from '../../stores/projectStore' // Import the projectStore

const errorStore = useErrorStore()
const statusStore = useStatusStore()
const projectStore = useProjectStore() // Initialize the projectStore

// Form fields
const name = ref('')
const title = ref('')
const category = ref('')
const content = ref('')
const allowComments = ref(false)
const description = ref('')
const isPublic = ref(true)
const hasAdmission = ref(false)
const paywallDestination = ref('')
const hostId = ref(0)
const usdFee = ref(0)
const portalUrl = ref('')
const pitchUrl = ref('')

function handleSubmit(e: Event) {
  e.preventDefault()

  statusStore.setStatus(StatusType.INFO, 'Creating the project...')

  try {
    const projectData = {
      name: name.value,
      title: title.value,
      category: category.value,
      content: content.value,
      allowComments: allowComments.value,
      description: description.value,
      isPublic: isPublic.value,
      hasAdmission: hasAdmission.value,
      paywallDestination: paywallDestination.value,
      hostId: hostId.value,
      usdFee: usdFee.value,
      portalUrl: portalUrl.value,
      pitchUrl: pitchUrl.value
    }

    projectStore.addProjects([projectData]) // Use the projectStore to add the new project

    statusStore.setStatus(StatusType.SUCCESS, 'Project created successfully!')
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to create the project.')
  }
}
</script>

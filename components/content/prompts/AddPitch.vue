<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col items-center">
      <!-- Toggle Button for Form Visibility -->
      <button
        class="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        @click="toggleForm"
      >
        {{ showForm ? 'Close Form' : 'Add New Pitch' }}
      </button>

      <!-- Pitch Form -->
      <div v-if="showForm" class="w-full max-w-lg mb-6">
        <form
          class="bg-white shadow-md rounded px-8 pt-6 pb-8"
          @submit.prevent="handleFormSubmit"
        >
          <h2 class="text-center text-lg font-bold mb-4">
            {{ isEditing ? 'Edit Pitch' : 'Create Pitch' }}
          </h2>

          <PitchTypeSelector />

          <div v-if="isTitleType" class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="title"
            >
              Title
            </label>
            <input
              id="title"
              v-model="formState.title"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Pitch Title"
              required
            />
          </div>
          <div v-else class="mb-4">
            <TitleMenu v-model:title="formState.title" />
          </div>

          <div v-if="!isTitleType" class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="prompt"
            >
              Description
            </label>
            <textarea
              id="prompt"
              v-model="formState.pitch"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Describe your prompt"
              rows="3"
              required
            ></textarea>
          </div>

          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="description"
            >
              Optional Description
            </label>
            <textarea
              id="description"
              v-model="formState.description"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Optional: add a description"
              rows="2"
            ></textarea>
          </div>

          <!-- Pass formState as pitch to TitleExamples -->
          <TitleExamples :pitch="formState" :is-editing="isEditing" />

          <div class="mb-4 flex items-center">
            <input
              id="isPublic"
              v-model="formState.isPublic"
              type="checkbox"
              class="mr-2"
            />
            <label for="isPublic" class="text-sm">Make Pitch Public</label>
          </div>

          <div class="flex items-center justify-between">
            <button
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              :disabled="
                !formState.title ||
                (!formState.pitch && !isTitleType) ||
                isSubmitting
              "
            >
              {{
                isSubmitting
                  ? 'Submitting...'
                  : isEditing
                    ? 'Update Pitch'
                    : 'Create Pitch'
              }}
            </button>
            <button
              class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </div>

          <p v-if="errorMessage" class="text-red-500 mt-4">
            {{ errorMessage }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, PitchType } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'

// Stores
const pitchStore = usePitchStore()
const userStore = useUserStore()

// Local State
const showForm = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

// Form state with default values
const formState = ref({
  id: undefined,
  title: '',
  pitch: '',
  description: '',
  examples: '',
  isPublic: true,
})

// Computed based on selected type
const isTitleType = computed(
  () => pitchStore.selectedPitchType === PitchType.TITLE,
)

// Form toggle and reset
const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
}

const resetForm = () => {
  isEditing.value = false
  formState.value = {
    id: undefined,
    title: '',
    pitch: '',
    description: '',
    examples: '',
    isPublic: true,
  }
}

const handleFormSubmit = async () => {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    // Duplicate title to pitch if it is a title-only pitch
    if (isTitleType.value) {
      formState.value.pitch = formState.value.title
    }

    // Prepare the payload for creating/updating pitch
    const payload = {
      ...formState.value,
      designer: userStore.username, // Automatically set designer from userStore
    }

    let result
    if (isEditing.value && formState.value.id) {
      result = await pitchStore.updatePitch(formState.value.id, payload)
    } else {
      result = await pitchStore.createPitch(payload)
    }

    if (result?.success) {
      resetForm()
      showForm.value = false
    } else {
      errorMessage.value = result?.message || 'Error submitting pitch'
    }
  } catch {
    errorMessage.value = 'Failed to submit pitch'
  } finally {
    isSubmitting.value = false
  }
}

const cancelEdit = () => {
  resetForm()
  showForm.value = false
}
</script>

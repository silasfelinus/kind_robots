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

          <!-- Pitch Type Select -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="pitchType"
            >
              Pitch Type
            </label>
            <select
              id="pitchType"
              v-model="formState.PitchType"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              @change="handlePitchTypeChange"
            >
              <option
                v-for="(label, type) in pitchTypeOptions"
                :key="type"
                :value="type"
              >
                {{ label }}
              </option>
            </select>
          </div>

          <!-- Title Input -->
          <div v-if="!isTitleType || !titleDropdownVisible" class="mb-4">
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

          <!-- Title Dropdown (For Brainstorm Type) -->
          <div v-if="titleDropdownVisible" class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="titleSelect"
            >
              Select Existing Title
            </label>
            <select
              id="titleSelect"
              v-model="formState.title"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option
                v-for="title in availableTitles"
                :key="title || 'default-key'"
                :value="title"
              >
                {{ title }}
              </option>
            </select>
          </div>

          <!-- Pitch Description (Hidden for Title Type) -->
          <div v-if="!isTitleType" class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="pitch"
            >
              Pitch Description
            </label>
            <textarea
              id="pitch"
              v-model="formState.pitch"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Describe your pitch"
              rows="3"
              required
            ></textarea>
          </div>

          <!-- Public Toggle -->
          <div class="mb-4 flex items-center">
            <input
              id="isPublic"
              v-model="formState.isPublic"
              type="checkbox"
              class="mr-2"
            />
            <label for="isPublic" class="text-sm">Make Pitch Public</label>
          </div>

          <!-- Submit and Cancel Buttons -->
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

          <!-- Error Message -->
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
import { type Pitch, usePitchStore, PitchType } from '~/stores/pitchStore'

// Stores
const pitchStore = usePitchStore()

// Local State
const showForm = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const titleDropdownVisible = ref(false)

// Form state with default values
const formState = ref<Partial<Pitch>>({
  id: undefined,
  title: '',
  pitch: '',
  PitchType: PitchType.ARTPITCH,
  isPublic: true,
})

// Computed values
const pitchTypeOptions = computed(() =>
  Object.entries(PitchType).map(([key, value]) => ({
    type: value,
    label: key.replace(/([A-Z])/g, ' $1').trim(), // Improve label readability
  })),
)
const availableTitles = computed(() =>
  pitchStore.pitches
    .filter((p) => p.PitchType === PitchType.TITLE)
    .map((p) => p.title),
)

// Type-based computed values
const isTitleType = computed(
  () => formState.value.PitchType === PitchType.TITLE,
)

// Form toggle and reset
const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
}

const resetForm = () => {
  isEditing.value = false
  titleDropdownVisible.value = false
  formState.value = {
    id: undefined,
    title: '',
    pitch: '',
    PitchType: PitchType.ARTPITCH,
    isPublic: true,
  }
}

// Pitch Type change handling
const handlePitchTypeChange = () => {
  titleDropdownVisible.value =
    formState.value.PitchType === PitchType.BRAINSTORM

  if (isTitleType.value) {
    formState.value.pitch = formState.value.title || '' // Default to an empty string if title is null
  }
}

// Submit handling
const handleFormSubmit = async () => {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    let result
    if (isEditing.value && formState.value.id) {
      result = await pitchStore.updatePitch(formState.value.id, formState.value)
    } else {
      result = await pitchStore.createPitch(formState.value)
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

// Edit and delete functions remain the same
</script>

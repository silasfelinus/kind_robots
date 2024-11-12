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

          <!-- Title Input -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="title"
              >Title</label
            >
            <input
              id="title"
              v-model="formState.title"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Pitch Title"
              required
            />
          </div>

          <!-- Pitch Description -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="pitch"
              >Pitch Description</label
            >
            <textarea
              id="pitch"
              v-model="formState.pitch"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Describe your pitch"
              rows="3"
              required
            ></textarea>
          </div>

          <!-- Pitch Type Select -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="pitchType"
              >Pitch Type</label
            >
            <select
              id="pitchType"
              v-model="formState.PitchType"
              class="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option
                v-for="(label, type) in pitchTypes"
                :key="type"
                :value="type"
              >
                {{ label }}
              </option>
            </select>
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
              :disabled="!formState.title || !formState.pitch || isSubmitting"
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

      <!-- Pitch List -->
      <div class="w-full max-w-2xl">
        <div
          v-for="pitch in pitchStore.pitches"
          :key="pitch.id"
          class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 flex justify-between items-center"
        >
          <div>
            <h3 class="text-xl font-bold">{{ pitch.title }}</h3>
            <p class="text-gray-700 text-base">{{ pitch.pitch }}</p>
          </div>
          <div>
            <button
              v-if="canEdit(pitch)"
              class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded"
              @click="editPitch(pitch)"
            >
              Edit
            </button>
            <button
              v-if="canDelete(pitch)"
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
              @click="deletePitch(pitch.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'
import type { Pitch } from '@prisma/client'
import { PitchType } from '@prisma/client'

// Stores
const pitchStore = usePitchStore()
const userStore = useUserStore()

// Local State
const showForm = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

// Define formState with full type matching Pitch and default empty values
const formState = ref<Partial<Pitch>>({
  id: undefined,
  title: '',
  pitch: '',
  PitchType: PitchType.ARTPITCH, // Ensure this is the enum type
  isPublic: true,
})

// Computed properties for pitch types and current user
const pitchTypes = computed(() => Object.entries(PitchType))
const user = computed(() => userStore.user)

// Toggle Form
const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm()
}

// Permission Checks
const canEdit = (pitch: Pitch) =>
  user.value?.id === pitch.userId || user.value?.Role === 'ADMIN'
const canDelete = (pitch: Pitch) =>
  user.value?.id === pitch.userId || user.value?.Role === 'ADMIN'

// Form Actions
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

// Edit Pitch
const editPitch = (pitch: Pitch) => {
  formState.value = { ...pitch }
  isEditing.value = true
  showForm.value = true
}

// Delete Pitch
const deletePitch = async (pitchId: number) => {
  try {
    await pitchStore.deletePitch(pitchId)
  } catch (error) {
    console.error('Failed to delete pitch', error)
  }
}

// Reset Form
const resetForm = () => {
  isEditing.value = false
  formState.value = {
    id: undefined,
    title: '',
    pitch: '',
    PitchType: PitchType.ARTPITCH,
    isPublic: true,
  }
}

// Cancel Editing
const cancelEdit = () => {
  resetForm()
  showForm.value = false
}
</script>

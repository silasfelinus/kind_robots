<template>
  <div class="container mx-auto p-4">
    <div class="flex flex-col items-center">
      <!-- Toggle Button for Showing Add/Edit Form -->
      <button
        class="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        @click="toggleForm"
      >
        {{ isEditing ? 'Edit Pitch' : 'Add Pitch' }}
      </button>

      <!-- Pitch Form -->
      <div v-if="showForm" class="w-full max-w-lg">
        <form
          class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          @submit.prevent="createOrUpdatePitch"
        >
          <!-- Title Input -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="title"
            >
              Title
            </label>
            <input
              id="title"
              v-model="newPitch.title"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
            >
              Pitch Description
            </label>
            <textarea
              id="pitch"
              v-model="newPitch.pitch"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Describe your pitch"
              rows="3"
              required
            ></textarea>
          </div>

          <!-- Designer Input -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="designer"
            >
              Designer Name
            </label>
            <input
              id="designer"
              v-model="newPitch.designer"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Designer Name"
            />
          </div>

          <!-- Flavor Text Input -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="flavorText"
            >
              Flavor Text (Optional)
            </label>
            <textarea
              id="flavorText"
              v-model="newPitch.flavorText"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Flavor Text"
              rows="2"
            ></textarea>
          </div>

          <!-- Highlight Image Input -->
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="highlightImage"
            >
              Highlight Image URL (Optional)
            </label>
            <input
              id="highlightImage"
              v-model="newPitch.highlightImage"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Highlight Image URL"
            />
          </div>

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
              v-model="newPitch.PitchType"
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="ARTPITCH">Art Pitch</option>
              <option value="BRAINSTORM">Brainstorm</option>
              <option value="BOT">Bot</option>
              <option value="ARTGALLERY">Art Gallery</option>
              <option value="INSPIRATION">Inspiration</option>
            </select>
          </div>

          <!-- Public/Private Toggle -->
          <div class="mb-4 flex items-center">
            <input
              id="isPublic"
              v-model="newPitch.isPublic"
              type="checkbox"
              class="mr-2 leading-tight"
            />
            <label for="isPublic" class="text-sm">Make Pitch Public</label>
          </div>

          <!-- Submit/Cancel Buttons -->
          <div class="flex items-center justify-between">
            <button
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              :disabled="!newPitch.title || !newPitch.pitch || isSubmitting"
            >
              {{
                isSubmitting
                  ? 'Submitting...'
                  : isEditing
                    ? 'Update Pitch'
                    : 'Submit Pitch'
              }}
            </button>
            <button
              class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              @click="toggleForm"
            >
              Cancel
            </button>
          </div>

          <!-- Error Message -->
          <p v-if="errorStore.message" class="text-red-500 mt-4">
            {{ errorStore.message }}
          </p>
        </form>
      </div>

      <!-- Pitch List -->
      <div class="w-full max-w-2xl">
        <div
          v-for="pitch in pitches"
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
import {
  usePitchStore,
  PitchType,
  type Pitch,
} from './../../../stores/pitchStore'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

// Initialize stores
const pitchStore = usePitchStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

const { updatePitch, deletePitch } = pitchStore
const pitches = computed(() => pitchStore.pitches)
const user = computed(() => userStore.user)

const showForm = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)

const newPitch = ref<Partial<Pitch>>({
  title: '',
  pitch: '',
  designer: user.value?.username || 'kindguest',
  flavorText: '',
  highlightImage: '',
  PitchType: PitchType.ARTPITCH,
  isMature: false,
  isPublic: true,
  userId: user.value?.id || 1, // Fallback userId
})

const toggleForm = () => {
  showForm.value = !showForm.value
  if (!showForm.value) resetForm() // Reset the form when closing
}

const editPitch = (pitch: Pitch) => {
  newPitch.value = { ...pitch }
  isEditing.value = true
  showForm.value = true
}

const resetForm = () => {
  isEditing.value = false
  newPitch.value = {
    title: '',
    pitch: '',
    designer: user.value?.username || 'kindguest',
    flavorText: '',
    highlightImage: '',
    PitchType: PitchType.ARTPITCH,
    isMature: false,
    isPublic: true,
    userId: user.value?.id || 1,
  }
}

const canEdit = (pitch: Pitch) =>
  user.value?.id === pitch.userId || user.value?.Role === 'ADMIN'
const canDelete = (pitch: Pitch) =>
  user.value?.id === pitch.userId || user.value?.Role === 'ADMIN'

const createOrUpdatePitch = async () => {
  if (!newPitch.value.title || !newPitch.value.pitch) {
    errorStore.setError(
      ErrorType.VALIDATION_ERROR,
      'Title and pitch description are required.',
    )
    return
  }

  isSubmitting.value = true
  errorStore.clearError()

  try {
    let result
    if (isEditing.value && newPitch.value.id) {
      result = await updatePitch(newPitch.value.id, newPitch.value) // Update existing pitch
    } else {
      const { id, ...pitchData } = newPitch.value // Omit id for new pitch
      result = await pitchStore.createPitch(pitchData)
    }

    if (result && result.success) {
      resetForm()
      toggleForm()
    } else {
      throw new Error(result?.message || 'Failed to submit pitch')
    }
  } catch (error) {
    const errorMessage = (error as Error).message || 'Failed to submit pitch'
    errorStore.setError(ErrorType.NETWORK_ERROR, errorMessage)
  } finally {
    isSubmitting.value = false
  }
}
</script>

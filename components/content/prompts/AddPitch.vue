<template>
  <div class="bg-base-100 shadow-md rounded-lg p-6 w-full mb-6">
    <h3 class="text-lg font-semibold mb-4 text-primary">Create a Custom Pitch</h3>
    
    <!-- Title Input -->
    <input
      v-model="newPitch.title"
      type="text"
      placeholder="Pitch Title"
      class="w-full border border-gray-300 rounded-md p-2 mb-4"
    />
    
    <!-- Pitch Description -->
    <textarea
      v-model="newPitch.pitch"
      placeholder="Pitch Description"
      class="w-full border border-gray-300 rounded-md p-2 mb-4"
      rows="3"
    ></textarea>
    
    <!-- Designer Input -->
    <input
      v-model="newPitch.designer"
      type="text"
      placeholder="Designer Name"
      class="w-full border border-gray-300 rounded-md p-2 mb-4"
    />
    
    <!-- Flavor Text Input -->
    <textarea
      v-model="newPitch.flavorText"
      placeholder="Flavor Text (Optional)"
      class="w-full border border-gray-300 rounded-md p-2 mb-4"
      rows="2"
    ></textarea>

    <!-- Highlight Image Input -->
    <input
      v-model="newPitch.highlightImage"
      type="text"
      placeholder="Highlight Image URL (Optional)"
      class="w-full border border-gray-300 rounded-md p-2 mb-4"
    />
    
    <!-- Pitch Type Select -->
    <select
      v-model="newPitch.PitchType"
      class="w-full border border-gray-300 rounded-md p-2 mb-4"
    >
      <option value="ARTPITCH">Art Pitch</option>
      <option value="BRAINSTORM">Brainstorm</option>
      <option value="BOT">Bot</option>
      <option value="ARTGALLERY">Art Gallery</option>
      <option value="INSPIRATION">Inspiration</option>
    </select>

    <!-- Public/Private Toggle -->
    <div class="flex items-center mb-4">
      <input
        v-model="newPitch.isPublic"
        type="checkbox"
        id="publicToggle"
        class="mr-2"
      />
      <label for="publicToggle" class="text-sm">Public</label>
    </div>
    
    <!-- Save Button -->
    <button
      class="bg-primary hover:bg-primary-focus text-white py-2 px-4 rounded-full transition duration-300"
      @click="createCustomPitch"
      :disabled="!newPitch.title || !newPitch.pitch || isSubmitting"
    >
      {{ isSubmitting ? 'Saving...' : 'Save Custom Pitch' }}
    </button>
    
    <!-- Error Message -->
    <p v-if="errorStore.message" class="text-red-500 mt-4">
      {{ errorStore.message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { PitchType } from '@/stores/pitchStore'

// Initialize stores
const pitchStore = usePitchStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

// Reactive model for the new pitch
const newPitch = ref({
  title: '',
  pitch: '',
  designer: userStore.user?.username || 'kindguest',
  flavorText: '',
  highlightImage: '',
  PitchType: PitchType.ARTPITCH, // Default to ARTPITCH
  isMature: false,
  isPublic: true,
  userId: userStore.user?.id || 1, // Fallback userId
})

const isSubmitting = ref(false)

// Function to handle creating a custom pitch
const createCustomPitch = async () => {
  if (!newPitch.value.title || !newPitch.value.pitch) {
    errorStore.setError(ErrorType.INPUT_ERROR, 'Title and description are required')
    return
  }

  // Reset any previous errors
  errorStore.clearError()

  // Create the pitch object with the corresponding fields
  const pitch = {
    ...newPitch.value,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  isSubmitting.value = true

  try {
    const result = await pitchStore.createPitch(pitch)
    if (result.success) {
      // Clear the form on success
      newPitch.value = {
        title: '',
        pitch: '',
        designer: userStore.user?.username || 'kindguest',
        flavorText: '',
        highlightImage: '',
        PitchType: PitchType.ARTPITCH,
        isMature: false,
        isPublic: true,
      }
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    errorStore.setError(ErrorType.NETWORK_ERROR, error.message || 'Failed to create pitch')
  } finally {
    isSubmitting.value = false
  }
}
</script>
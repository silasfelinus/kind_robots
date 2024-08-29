<!-- eslint-disable vue/html-self-closing -->
<template>
  <!-- Container -->
  <div
    class="flex flex-col items-center justify-center bg-base-200 rounded-2xl border"
  >
    <!-- Add Pitch Button -->
    <button
      class="p-4 rounded-2xl border m-2 bg-primary text-white"
      @click="showForm = !showForm"
    >
      <Icon name="typcn:plus" class="text-4xl" />
    </button>
    <p class="text-lg font-semibold m-4">Click to Add a New Pitch</p>

    <!-- Add Pitch Form -->
    <div
      v-if="showForm"
      class="flex flex-col rounded-xl border p-4 m-2 mb-6 w-full max-w-md bg-white"
    >
      <h2 class="text-2xl font-bold m-4 p-2">Create Your Pitch</h2>
      <p class="text-sm text-gray-600 m-4p-2">
        Craft your pitch to inspire and challenge other artists. 🎨
      </p>

      <!-- Form Fields -->
      <input
        v-model="newPitch.title"
        placeholder="Title"
        class="mb-2 p-2 rounded border"
      />
      <textarea
        v-model="newPitch.pitch"
        placeholder="Pitch"
        class="mb-2 p-2 rounded border"
      />
      <input
        v-model="newPitch.designer"
        placeholder="Designer"
        class="mb-2 p-2 rounded border"
      />

      <!-- Checkboxes -->
      <label class="inline-flex items-center mb-2">
        <input v-model="newPitch.isMature" type="checkbox" class="mr-2" />
        Allow mature content
      </label>

      <!-- Submit Button -->
      <button class="p-2 rounded bg-primary text-white" @click="createPitch">
        Submit Pitch
      </button>
    </div>
    <div
      v-if="message"
      :class="messageType === 'success' ? 'text-green-500' : 'text-red-500'"
    >
      {{ message }}
    </div>
    <milestone-reward v-if="shouldShowMilestoneCheck" :id="1" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const pitchStore = usePitchStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const shouldShowMilestoneCheck = ref(false)
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error' | null>(null)

const showForm = ref(false)
const newPitch = ref({
  title: '',
  pitch: '',
  flavorText: '',
  designer: '',
  userId: userStore.userId,
  isMature: false,
  isOrphan: false,
  isPublic: true,
})

const createPitch = async () => {
  try {
    const result = await pitchStore.createPitch(newPitch.value)
    if (result.success) {
      messageType.value = 'success'
      message.value = 'Pitch successfully created!'
      shouldShowMilestoneCheck.value = true
      newPitch.value = {
        title: '',
        pitch: '',
        flavorText: '',
        designer: '',
        userId: userStore.userId,
        isMature: false,
        isOrphan: true,
        isPublic: true,
      }
    } else {
      messageType.value = 'error'
      message.value = result.message || 'Something went wrong!'
      errorStore.setError(ErrorType.VALIDATION_ERROR, result.message)
    }

    if (message.value) {
      setTimeout(() => {
        message.value = null
        messageType.value = null
      }, 3000)
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    errorStore.setError(ErrorType.UNKNOWN_ERROR, errorMsg)
    messageType.value = 'error'
    message.value = errorStore.message || ''
    console.error('Error creating pitch:', errorMsg)
  }
}
</script>

<style scoped>
.group:hover .float-tooltip {
  visibility: visible;
  opacity: 1;
}

.text-base-200 {
  font-size: 1.25rem;
}

/* Adding some stylish upgrades */
.bg-base-200 {
  transition: background-color 0.3s ease;
}

.bg-base-200:hover {
  background-color: var(--bg-base-400);
}

.text-accent {
  transition: color 0.3s ease;
}

.text-accent:hover {
  color: var(--text-accent-hover);
}

/* Styling for the buttons */
button {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

button:hover {
  background-color: var(--bg-button-hover);
  color: var(--text-button-hover);
}
</style>

<template>
  <!-- Container -->
  <div class="flex flex-col items-center justify-center bg-base-200">
    <!-- Add Pitch Button -->
    <button class="mb-4 p-4 rounded-full bg-primary text-white" @click="showForm = !showForm">
      <icon name="typcn:plus" class="text-4xl" />
    </button>
    <p class="text-lg font-semibold mb-4">Click to Add a New Pitch</p>

    <!-- Add Pitch Form -->
    <div v-if="showForm" class="flex flex-col rounded-xl border p-4 w-full max-w-md bg-white">
      <h2 class="text-2xl font-bold mb-4">Create Your Pitch</h2>
      <p class="text-sm text-gray-600 mb-4">
        Craft your pitch to inspire artists and captivate audiences. 🎨
      </p>

      <!-- Form Fields -->
      <input v-model="newPitch.title" placeholder="Title" class="mb-2 p-2 rounded border" />
      <textarea
        v-model="newPitch.pitch"
        placeholder="Pitch"
        class="mb-2 p-2 rounded border"
      ></textarea>
      <input
        v-model="newPitch.flavorText"
        placeholder="Flavor Text (Optional)"
        class="mb-2 p-2 rounded border"
      />
      <input v-model="newPitch.designer" placeholder="Designer" class="mb-2 p-2 rounded border" />

      <!-- Checkboxes -->
      <label class="inline-flex items-center mb-2">
        <input v-model="newPitch.isMature" type="checkbox" class="mr-2" />
        Allow mature content
      </label>
      <label class="inline-flex items-center mb-4">
        <input v-model="newPitch.isOrphan" type="checkbox" class="mr-2" />
        Adoptable
      </label>

      <!-- Submit Button -->
      <button class="p-2 rounded bg-primary text-white" @click="createPitch">Submit Pitch</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePitchStore } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'

const pitchStore = usePitchStore()
const userStore = useUserStore()

const showForm = ref(false)
const newPitch = ref({
  title: '',
  pitch: '',
  flavorText: '',
  designer: '',
  userId: userStore.userId,
  isMature: false,
  isOrphan: true,
  isPublic: true
})

const createPitch = async () => {
  try {
    await pitchStore.createPitch(newPitch.value)
    showForm.value = false
    newPitch.value = {
      title: '',
      pitch: '',
      flavorText: '',
      designer: '',
      userId: userStore.userId,
      isMature: false,
      isOrphan: false,
      isPublic: true
    }
  } catch (error: any) {
    const handledError = errorHandler(error)
    console.error('Error creating pitch:', handledError.message)
  }
}
</script>

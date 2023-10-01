<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- Pitch Selection -->
    <div class="flex flex-wrap">
      <button
        v-for="pitch in pitches"
        :key="pitch.id"
        :class="[selectedPitch?.id === pitch.id ? 'bg-primary text-white' : 'bg-base-200']"
        @click="updateSelectedPitch(pitch.id)"
      >
        {{ pitch.title }}
      </button>
    </div>

    <!-- User-Specific Toggles, Edit, and Delete -->
    <div
      v-if="selectedPitch && userStore.userId === selectedPitch?.userId"
      class="flex items-center space-x-4"
    >
      <button class="bg-warning text-white rounded-2xl p-2" @click="editSelectedPitch">Edit</button>
      <button class="bg-info text-white rounded-2xl p-2" @click="deleteSelectedPitch">
        Delete
      </button>
      <button class="bg-accent text-white rounded-2xl p-2" @click="togglePitchNsfw">
        {{ selectedPitch.isNSFW ? 'Hide' : 'Show' }} NSFW
      </button>
    </div>

    <!-- Global Toggles -->
    <div class="flex items-center space-x-4">
      <label class="flex items-center cursor-pointer">
        <input v-model="togglePublicPitches" type="checkbox" class="form-checkbox" />
        <span class="ml-2">Show Public Pitches</span>
      </label>
      <label class="flex items-center cursor-pointer">
        <input v-model="toggleGlobalNsfw" type="checkbox" class="form-checkbox" />
        <span class="ml-2">Show NSFW</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTagStore } from '@/stores/tagStore'
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'
import { useNsfwStore } from '@/stores/nsfwStore'

const nsfwStore = useNsfwStore()
const tagStore = useTagStore()
const userStore = useUserStore()

const selectedPitch = computed(() => tagStore.selectedPitch)

const updateSelectedPitch = (pitchId: number) => {
  tagStore.selectPitch(pitchId)
}

const pitches = computed(() => tagStore.pitches)

const togglePitchNsfw = () => {
  try {
    if (selectedPitch.value) {
      const currentNsfwStatus = selectedPitch.value.isNSFW ?? false
      tagStore.updatePitch(selectedPitch.value.id, { isNSFW: !currentNsfwStatus })
    }
  } catch (error: any) {
    const handledError = errorHandler(error)
    console.error('Error toggling pitch NSFW:', handledError.message)
  }
}
const showPublicPitches = ref(true) // Initialize from local storage if needed

const togglePublicPitches = () => {
  showPublicPitches.value = !showPublicPitches.value
  localStorage.setItem('showPublicPitches', JSON.stringify(showPublicPitches.value))
}

const toggleGlobalNsfw = () => {
  nsfwStore.toggleNsfw()
}
const addNewPitch = async () => {
  try {
    const newTitle = prompt('Enter the title for the new pitch:')
    if (newTitle) {
      await tagStore.addPitch(newTitle, userStore.userId)
    }
  } catch (error: any) {
    const handledError = errorHandler(error)
    console.error('Error adding new pitch:', handledError.message)
  }
}

const editSelectedPitch = async () => {
  if (selectedPitch.value) {
    const newTitle = prompt('Enter new title for the pitch:')
    if (newTitle) {
      await tagStore.editPitchTitle(selectedPitch.value.id, newTitle)
    }
  }
}

const deleteSelectedPitch = async () => {
  if (selectedPitch.value) {
    const confirmDelete = confirm('Are you sure you want to delete this pitch?')
    if (confirmDelete) {
      await tagStore.deletePitch(selectedPitch.value.id) // Pass the id
      // Use a store method to nullify selectedPitch
    }
  }
}
</script>

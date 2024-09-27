<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- Pitch Selection -->
    <div class="flex flex-wrap">
      <h1>PitchTagSelector</h1>
      <button
        v-for="pitch in filteredPitches"
        :key="pitch.id"
        :class="[
          selectedPitch?.id === pitch.id
            ? 'bg-primary text-white'
            : 'bg-base-300',
          'rounded-2xl border p-2 m-2',
        ]"
        @click="updateSelectedPitch(pitch.id)"
      >
        {{ pitch.title }}
        <span v-if="pitch.designer">({{ pitch.designer }})</span>
      </button>
    </div>

    <!-- User-Specific Toggles, Edit, and Delete -->
    <div
      v-if="selectedPitch && userStore.userId === selectedPitch.userId"
      class="flex items-center space-x-4"
    >
      <button
        class="bg-warning text-white rounded-2xl p-2"
        @click="editSelectedPitch"
      >
        Edit
      </button>
      <button
        class="bg-info text-white rounded-2xl p-2"
        @click="deleteSelectedPitch"
      >
        Delete
      </button>
      <button
        class="bg-accent text-white rounded-2xl p-2"
        @click="togglePitchMature"
      >
        {{ selectedPitch.isMature ? 'Hide' : 'Show' }} Mature
      </button>
    </div>

    <!-- Add New Pitch Button -->
    <button class="bg-success text-white rounded-2xl p-2" @click="addNewPitch">
      Add New Pitch
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore } from './../../../stores/pitchStore'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useFilterStore } from './../../../stores/filterStore'

// Define pitch type with attributes matching the schema
interface Pitch {
  id: number
  createdAt: Date
  updatedAt: Date | null
  title: string | null
  pitch: string
  designer: string | null
  flavorText: string | null
  highlightImage: string | null
  isMature: boolean
  isPublic: boolean
  userId: number
  channelId: number | null
}

const pitchStore = usePitchStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const filterStore = useFilterStore()

const showPublicPitches = ref(true)

const selectedPitch = computed(() => pitchStore.selectedPitch)

// Function to update selected pitch by calling the store action
const updateSelectedPitch = (pitchId: number) => {
  pitchStore.setSelectedPitch(pitchId) // Use the store action to set the selected pitch
}
const pitches = computed(() => pitchStore.pitches as Pitch[])

const filteredPitches = computed(() => {
  return pitches.value.filter((pitch) => {
    if (userStore.userId === pitch.userId) return true
    if (showPublicPitches.value && pitch.isPublic) return true
    if (filterStore.showMature && pitch.isMature) return true
    return false
  })
})

const togglePitchMature = async () => {
  try {
    await errorStore.handleError(
      async () => {
        if (selectedPitch.value) {
          const currentMatureStatus = selectedPitch.value.isMature
          await pitchStore.updatePitch(selectedPitch.value.id, {
            isMature: !currentMatureStatus,
          })
        }
      },
      ErrorType.GENERAL_ERROR,
      'Error toggling pitch Mature',
    )
  } catch (error) {
    console.error('Error in togglePitchMature:', error)
  }
}

const addNewPitch = async () => {
  try {
    await errorStore.handleError(
      async () => {
        const newTitle = prompt('Enter the title for the new pitch:')
        if (newTitle) {
          await pitchStore.createPitch({
            title: newTitle,
            userId: userStore.userId,
          })
        }
      },
      ErrorType.GENERAL_ERROR,
      'Error adding new pitch',
    )
  } catch (error) {
    console.error('Error in addNewPitch:', error)
  }
}

const editSelectedPitch = async () => {
  try {
    await errorStore.handleError(
      async () => {
        if (selectedPitch.value) {
          const newTitle = prompt('Enter new title for the pitch:')
          if (newTitle) {
            await pitchStore.updatePitch(selectedPitch.value.id, {
              title: newTitle,
            })
          }
        }
      },
      ErrorType.GENERAL_ERROR,
      'Error editing pitch title',
    )
  } catch (error) {
    console.error('Error in editSelectedPitch:', error)
  }
}

const deleteSelectedPitch = async () => {
  try {
    await errorStore.handleError(
      async () => {
        if (selectedPitch.value && selectedPitch.value.id !== null) {
          const confirmDelete = confirm(
            'Are you sure you want to delete your pitch?',
          )
          if (confirmDelete) {
            await pitchStore.deletePitch(selectedPitch.value.id)
          }
        }
      },
      ErrorType.GENERAL_ERROR,
      'Error deleting pitch',
    )
  } catch (error) {
    console.error('Error in deleteSelectedPitch:', error)
  }
}
</script>

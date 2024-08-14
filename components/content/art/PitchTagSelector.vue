<template>
  <div class="flex flex-col items-center space-y-8">
    <!-- Pitch Selection -->
    <div class="flex flex-wrap">
      <button
        v-for="pitch in filteredPitches"
        :key="pitch.id"
        :class="[
          selectedPitch?.id === pitch.id
            ? 'bg-primary text-white'
            : 'bg-base-200',
          'rounded-2xl border p-2 m-2',
        ]"
        @click="updateSelectedPitch(pitch.id)"
      >
        {{ pitch.title }}
        <span v-if="pitch.username">({{ pitch.username }})</span>
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

    <!-- Add New Pitch Button (if needed) -->
    <button class="bg-success text-white rounded-2xl p-2" @click="addNewPitch">
      Add New Pitch
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTagStore } from './../../../stores/tagStore'
import { useUserStore } from './../../../stores/userStore'
import { useErrorStore } from './../../../stores/errorStore'
import { useFilterStore } from './../../../stores/filterStore'

// Define pitch type with username added
interface Pitch {
  id: number
  createdAt: Date
  updatedAt: Date | null
  label: string
  title: string
  userId: number
  isPublic: boolean | null
  channelId: number | null
  flavorText: string | null
  pitch: string | null
  isMature: boolean
  sloganId: number | null
  postId: number | null
  username?: string // Optional username
}

const tagStore = useTagStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const filterStore = useFilterStore()
const showPublicPitches = ref(true)

const selectedPitch = computed(() => tagStore.selectedPitch)

const updateSelectedPitch = (pitchId: number) => {
  tagStore.selectPitch(pitchId)
}

const pitches = computed(() => tagStore.pitches as Pitch[])

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
          const currentMatureStatus = selectedPitch.value.isMature ?? false
          await tagStore.updatePitch(selectedPitch.value.id, {
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
          await tagStore.addPitch(newTitle, userStore.userId)
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
            await tagStore.editPitchTitle(selectedPitch.value.id, newTitle)
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
            await tagStore.deletePitch(selectedPitch.value.id)
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

<template>
  <div class="flex flex-col items-center space-y-4">
    <div class="flex flex-wrap">
      <button
        v-for="pitch in pitches"
        :key="pitch.id"
        :class="[
          'rounded-2xl border p-2 m-2 text-lg',
          selectedPitch === pitch.id ? 'bg-primary text-white' : 'bg-base-200'
        ]"
        @click="updateSelectedPitch(pitch.id)"
      >
        {{ pitch.title }}
      </button>
    </div>
    <div class="flex items-center space-x-4">
      <button class="bg-accent text-white rounded-2xl p-2" @click="addNewPitch">
        Add New Pitch
      </button>
      <button
        v-if="selectedPitch"
        class="bg-warning text-white rounded-2xl p-2"
        @click="editSelectedPitch"
      >
        Edit
      </button>
      <button
        v-if="selectedPitch"
        class="bg-info text-white rounded-2xl p-2"
        @click="deleteSelectedPitch"
      >
        Delete
      </button>
    </div>
    <div class="flex items-center space-x-4">
      <button class="bg-accent text-white rounded-2xl p-2" @click="togglePublicPitches">
        {{ showPublicPitches ? 'Hide' : 'Show' }} Public Pitches
      </button>
      <button class="bg-accent text-white rounded-2xl p-2" @click="toggleNsfw">
        {{ nsfwStore.showNsfw ? 'Hide' : 'Show' }} NSFW
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTagStore } from '@/stores/tagStore'
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'
import { useNsfwStore } from '@/stores/nsfwStore'

const nsfwStore = useNsfwStore()
const tagStore = useTagStore()
const userStore = useUserStore()

const selectedPitch = computed({
  get: () => tagStore.selectedPitch?.id || null,
  set: (value) => {
    const pitch = tagStore.pitches.find((p) => p.id === value)
    if (pitch) {
      tagStore.selectPitch(pitch.title)
    }
  }
})

const pitches = computed(() => tagStore.pitches)

const updateSelectedPitch = (pitchId: number) => {
  const pitch = tagStore.pitches.find((p) => p.id === pitchId)
  if (pitch) {
    selectedPitch.value = pitchId
    tagStore.selectPitch(pitch.title)
  }
}
const showPublicPitches = ref(true) // Initialize from local storage if needed

const togglePublicPitches = () => {
  showPublicPitches.value = !showPublicPitches.value
  localStorage.setItem('showPublicPitches', JSON.stringify(showPublicPitches.value))
}

const toggleNsfw = () => {
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
      await tagStore.editPitchTitle(selectedPitch.value, newTitle)
    }
  }
}

const deleteSelectedPitch = async () => {
  if (selectedPitch.value) {
    const confirmDelete = confirm('Are you sure you want to delete this pitch?')
    if (confirmDelete) {
      await tagStore.deletePitch(selectedPitch.value)
      selectedPitch.value = null
    }
  }
}

onMounted(() => {
  tagStore.initializeTags()
})
</script>

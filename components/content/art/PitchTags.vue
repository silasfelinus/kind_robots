<template>
  <div class="bg-base-200 rounded-2xl p-8 text-lg">
    <h1 class="text-2xl mb-4">Pitch Manager</h1>
    <!-- Toggle Switch for Admin -->
    <div v-if="isAdmin" class="mt-4">
      <label class="flex items-center">
        <input v-model="showAllPitches" type="checkbox" class="mr-2" />
        Show All Pitches
      </label>
    </div>

    <!-- List all pitch titles -->
    <ul class="list-decimal list-inside">
      <li v-for="pitch in pitchTitles" :key="pitch.id" class="mb-2">
        <span class="font-semibold">{{ pitch.title }}</span>

        <!-- Show edit and delete options if role is ADMIN -->
        <span v-if="isAdmin" class="ml-4">
          <button
            class="bg-primary rounded-2xl p-2 text-white hover:bg-primary-dark"
            @click="editPitch(pitch.id, pitch.title)"
          >
            Edit
          </button>
          <button
            class="bg-warning rounded-2xl p-2 text-white ml-2 hover:bg-warning-dark"
            @click="deletePitch(pitch.id)"
          >
            Delete
          </button>
        </span>
      </li>
    </ul>

    <!-- Add a new pitch -->
    <div class="mt-4">
      <input
        v-model="newPitchTitle"
        placeholder="New Pitch Title"
        class="rounded-2xl p-2 w-full text-lg"
      />
      <button
        class="bg-primary rounded-2xl p-2 text-white mt-2 w-full hover:bg-primary-dark"
        @click="addNewPitch"
      >
        Add Pitch
      </button>
    </div>

    <!-- Save Edited Pitch -->
    <div v-if="editPitchId !== null" class="mt-4">
      <button
        class="bg-accent rounded-2xl p-2 text-white w-full hover:bg-accent-dark"
        @click="saveEdit"
      >
        Save Edit
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTagStore } from './../../../stores/tagStore'
import { useUserStore } from './../../../stores/userStore'

const tagStore = useTagStore()
const userStore = useUserStore()
const newPitchTitle = ref('')
const editPitchId = ref<number | null>(null)
const userId = computed(() => userStore.userId)

// New reactive variable for toggle state
const showAllPitches = ref(false)

// Computed property to decide which pitches to display
const pitchTitles = computed(() => {
  if (isAdmin.value && showAllPitches.value) {
    return tagStore.pitches // All pitches
  }
  return tagStore.activeAndPublicTags // User-specific and public pitches
})

// Check if the user is an ADMIN
const isAdmin = computed(() => userStore.role === 'ADMIN')

const addNewPitch = () => {
  if (userId.value !== null) {
    tagStore.addPitch(newPitchTitle.value, userId.value)
    newPitchTitle.value = ''
  } else {
    console.error('User ID is null, cannot add new pitch.')
  }
}

const editPitch = (id: number, title: string) => {
  editPitchId.value = id
  newPitchTitle.value = title
}

const saveEdit = () => {
  if (editPitchId.value !== null) {
    tagStore.editPitchTitle(editPitchId.value, newPitchTitle.value)
    newPitchTitle.value = ''
    editPitchId.value = null
  }
}

const deletePitch = (id: number) => {
  tagStore.deletePitch(id)
}
</script>

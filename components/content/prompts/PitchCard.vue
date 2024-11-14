<template>
  <div class="pitch-card bg-base-300 rounded-2xl p-4 shadow-lg">
    <div class="header flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">
        <!-- Title Section with Local Editing Toggle -->
        <span v-if="isTitleEditing">
          <input
            v-model="editablePitch.title"
            class="bg-transparent border-b-2 focus:outline-none"
            placeholder="Edit Title"
          />
        </span>
        <span v-else>{{ pitch.title }}</span>
        <button
          v-if="isUserAllowedToEdit"
          class="ml-2"
          @click="toggleTitleEdit"
        >
          {{ isTitleEditing ? 'Save' : 'Edit' }}
        </button>
      </h2>
      <p class="text-sm text-gray-500">{{ pitch.designer }}</p>
    </div>

    <!-- Pitch Section with Local Editing Toggle -->
    <div class="mb-4">
      <p v-if="isPitchEditing">
        <textarea
          v-model="editablePitch.pitch"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Pitch"
        ></textarea>
      </p>
      <p v-else>{{ pitch.pitch }}</p>
      <button v-if="isUserAllowedToEdit" class="ml-2" @click="togglePitchEdit">
        {{ isPitchEditing ? 'Save' : 'Edit' }}
      </button>

      <!-- Description Section with Local Editing Toggle -->
      <label
        v-if="isDescriptionEditing"
        class="block text-sm font-semibold mb-2"
        >Description</label
      >
      <textarea
        v-if="isDescriptionEditing"
        v-model="editablePitch.description"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Description"
      ></textarea>
      <p v-else>{{ pitch.description }}</p>
      <button
        v-if="isUserAllowedToEdit"
        class="ml-2"
        @click="toggleDescriptionEdit"
      >
        {{ isDescriptionEditing ? 'Save' : 'Edit' }}
      </button>
    </div>

    <!-- Title Examples Component (No need for global isEditing) -->
    <title-examples :pitch="pitch" />

    <!-- Actions Component -->
    <pitch-card-actions
      v-if="isUserAllowedToEdit"
      :pitch="pitch"
      @delete="deletePitch"
    />

    <!-- Global Save Button -->
    <button
      v-if="isChanged"
      class="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg"
      @click="saveChanges"
    >
      <Icon name="mdi:content-save" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'
import type { Pitch } from '~/stores/pitchStore'

const props = defineProps<{
  pitch: Pitch
}>()

const emit = defineEmits(['save', 'delete', 'cancel'])

const pitchStore = usePitchStore()
const userStore = useUserStore()

const isUserAllowedToEdit = computed(
  () =>
    props.pitch.userId === userStore.userId || userStore.user?.Role === 'ADMIN',
)

// Local editing states for each section
const isTitleEditing = ref(false)
const isPitchEditing = ref(false)
const isDescriptionEditing = ref(false)
const editablePitch = ref({ ...props.pitch })
const isChanged = ref(false)

// Toggle editing states for each section
const toggleTitleEdit = async () => {
  if (isTitleEditing.value) {
    await saveChanges()
  }
  isTitleEditing.value = !isTitleEditing.value
}

const togglePitchEdit = async () => {
  if (isPitchEditing.value) {
    await saveChanges()
  }
  isPitchEditing.value = !isPitchEditing.value
}

const toggleDescriptionEdit = async () => {
  if (isDescriptionEditing.value) {
    await saveChanges()
  }
  isDescriptionEditing.value = !isDescriptionEditing.value
}

// Save Changes for all sections
const saveChanges = async () => {
  if (!editablePitch.value) return
  const response = await pitchStore.updatePitch(
    props.pitch.id,
    editablePitch.value,
  )
  if (response && response.success) {
    emit('save')
    isChanged.value = false
  } else {
    console.error('Failed to save changes')
  }
}

const deletePitch = async () => {
  if (!isUserAllowedToEdit.value) {
    console.warn('User not authorized to delete this pitch')
    return
  }
  const response = await pitchStore.deletePitch(props.pitch.id)
  if (response.success) {
    emit('delete')
  } else {
    console.error('Failed to delete pitch')
  }
}
</script>

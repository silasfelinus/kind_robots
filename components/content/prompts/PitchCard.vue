<template>
  <div class="pitch-card bg-base-300 rounded-2xl p-4 shadow-lg">
    <!-- Header: Title and Designer -->
    <div class="header flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">
        <span v-if="isEditing">
          <input
            v-model="editablePitch.title"
            class="bg-transparent border-b-2 focus:outline-none"
            placeholder="Edit Title"
          />
        </span>
        <span v-else>{{ pitch.title }}</span>
      </h2>
      <p class="text-sm text-gray-500">{{ pitch.designer }}</p>
    </div>

    <!-- Pitch and Description -->
    <div class="mb-4">
      <p v-if="isEditing">
        <textarea
          v-model="editablePitch.pitch"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Pitch"
        ></textarea>
      </p>
      <p v-else>{{ pitch.pitch }}</p>

      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Description</label>
      <textarea
        v-if="isEditing"
        v-model="editablePitch.description"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Description"
      ></textarea>
      <p v-else>{{ pitch.description }}</p>
    </div>

    <!-- Title Examples Component with Selection -->
    <div v-if="!isEditing">
      <h3 class="text-md font-semibold mb-2">Examples:</h3>
      <ul class="space-y-1">
        <li
          v-for="(example, index) in exampleList"
          :key="index"
          :class="{ 'bg-yellow-200': selectedExamples.includes(example) }"
          class="flex items-center space-x-2 p-2 rounded-md"
        >
          <span>{{ example }}</span>
          <button
            class="text-green-500 hover:text-green-700 transform transition-transform duration-200 hover:scale-110"
            @click="toggleSelectExample(example)"
          >
            <Icon
              :name="selectedExamples.includes(example) ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'"
              class="w-6 h-6"
            />
          </button>
        </li>
      </ul>
    </div>

    <title-examples v-if="isEditing" />

    <!-- Actions -->
    <pitch-card-actions
      v-if="isUserAllowedToEdit"
      :pitch="pitch"
      :is-editing="isEditing"
      @toggle-edit="toggleEdit"
      @save="saveChanges"
      @cancel="cancelEdit"
      @delete="deletePitch"
    />

    <!-- Save Button (Visible when changes are detected) -->
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

// Define emits for toggle-edit, save, cancel, and delete
const emit = defineEmits(['toggle-edit', 'save', 'cancel', 'delete'])

const pitchStore = usePitchStore()
const userStore = useUserStore()

// Check if the user is allowed to edit or delete (matches user ID or has ADMIN role)
const isUserAllowedToEdit = computed(
  () =>
    props.pitch.userId === userStore.userId || userStore.user?.Role === 'ADMIN',
)

// Editing state and editable copy of the pitch
const isEditing = ref(false)
const editablePitch = ref({ ...props.pitch })
const isChanged = ref(false)

// Examples to display in non-edit mode
const exampleList = computed(() =>
  pitchStore.exampleString ? pitchStore.exampleString.split('|') : [],
)

// Selected examples to be sent as exampleString
const selectedExamples = ref<string[]>([])

// Update exampleString in store whenever selectedExamples changes
watch(selectedExamples, (newSelection) => {
  pitchStore.exampleString = newSelection.join('|')
})

// Toggle the selection of an example
function toggleSelectExample(example: string) {
  if (selectedExamples.value.includes(example)) {
    selectedExamples.value = selectedExamples.value.filter((e) => e !== example)
  } else {
    selectedExamples.value.push(example)
  }
}

// Save changes to the pitch
const saveChanges = async () => {
  if (!editablePitch.value) return

  const response = await pitchStore.updatePitch(
    props.pitch.id,
    editablePitch.value,
  )
  if (response && response.success) {
    emit('save')
    isChanged.value = false
    isEditing.value = false
  } else {
    console.error('Failed to save changes')
  }
}

// Toggle editing mode with user check
const toggleEdit = () => {
  if (!isUserAllowedToEdit.value) {
    console.warn('User not authorized to edit this pitch')
    return
  }
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editablePitch.value = { ...props.pitch }
  }
}

// Cancel editing and reset changes
const cancelEdit = () => {
  isEditing.value = false
  isChanged.value = false
  editablePitch.value = { ...props.pitch }
  emit('cancel')
}

// Delete the pitch
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

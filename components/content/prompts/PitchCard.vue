<template>
  <div class="pitch-card bg-base-300 rounded-2xl p-4 shadow-lg">
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

    <div class="mb-4">
      <p v-if="isEditing">
        <textarea
          v-model="editablePitch.pitch"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Pitch"
        ></textarea>
      </p>
      <p v-else>{{ pitch.pitch }}</p>

      <label v-if="isEditing" class="block text-sm font-semibold mb-2"
        >Description</label
      >
      <textarea
        v-if="isEditing"
        v-model="editablePitch.description"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Description"
      ></textarea>
      <p v-else>{{ pitch.description }}</p>
    </div>

    <!-- Pass isEditing prop to title-examples -->
    <title-examples :pitch="pitch" :is-editing="isEditing" />

    <pitch-card-actions
      v-if="isUserAllowedToEdit"
      :pitch="pitch"
      :is-editing="isEditing"
      @toggle-edit="toggleEdit"
      @save="saveChanges"
      @cancel="cancelEdit"
      @delete="deletePitch"
    />

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

const emit = defineEmits([
  'toggle-edit',
  'save',
  'cancel',
  'delete',
  'editing-status',
])

const pitchStore = usePitchStore()
const userStore = useUserStore()

const isUserAllowedToEdit = computed(
  () =>
    props.pitch.userId === userStore.userId || userStore.user?.Role === 'ADMIN',
)

const isEditing = ref(false)
const editablePitch = ref({ ...props.pitch })
const isChanged = ref(false)

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
    emit('editing-status', isEditing.value)
  } else {
    console.error('Failed to save changes')
  }
}

const toggleEdit = () => {
  if (!isUserAllowedToEdit.value) {
    console.warn('User not authorized to edit this pitch')
    return
  }
  isEditing.value = !isEditing.value
  emit('editing-status', isEditing.value)
  if (isEditing.value) {
    editablePitch.value = { ...props.pitch }
  }
}

const cancelEdit = () => {
  isEditing.value = false
  isChanged.value = false
  editablePitch.value = { ...props.pitch }
  emit('cancel')
  emit('editing-status', isEditing.value)
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

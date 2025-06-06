<!-- /components/content/prompts/pitch-card.vue -->
<template>
  <div
    class="pitch-card bg-base-100 rounded-2xl p-4 shadow-lg w-75%"
    :class="{ 'border-primary': isSelected, 'border-gray-400': !isSelected }"
    @click="selectTitle"
  >
    <div class="flex justify-between items-center mb-4 bg-base-100 text-black">
      <h2 class="text-lg font-semibold flex items-center">
        <!-- Title Section with Local Editing Toggle -->
        <span v-if="isTitleEditing">
          <input
            v-model="editablePitch.title"
            class="border-b border-gray-400 rounded-md p-1 text-black"
            placeholder="Edit Title"
          />
        </span>
        <span v-else>{{ pitch.title }}</span>
        <span>{{ pitch.PitchType }}</span>
        <button
          v-if="isUserAllowedToEdit"
          class="ml-2 text-black transition-transform duration-200"
          @click="toggleTitleEdit"
        >
          <Icon
            :name="isTitleEditing ? 'kind-icon:check' : 'kind-icon:pencil'"
            class="w-5 h-5"
          />
        </button>
      </h2>
      <p class="text-sm text-black">{{ pitch.designer }}</p>
    </div>

    <!-- Conditionally Display Pitch Section -->
    <div v-if="!isTitleType" class="mb-4 text-black">
      <p v-if="isPitchEditing">
        <textarea
          v-model="editablePitch.pitch"
          class="w-full border border-gray-400 p-2 rounded-md"
          placeholder="Edit Pitch"
        ></textarea>
      </p>
      <p v-else>Pitch: {{ pitch.pitch }}</p>
      <button
        v-if="isUserAllowedToEdit"
        class="ml-2 text-black transition-transform duration-200"
        @click="togglePitchEdit"
      >
        <Icon
          :name="isPitchEditing ? 'kind-icon:check' : 'kind-icon:pencil'"
          class="w-5 h-5"
        />
      </button>
    </div>

    <!-- Description Section with Local Editing Toggle -->
    <div class="mb-4 text-black">
      <p v-if="isDescriptionEditing">
        <textarea
          v-model="editablePitch.description"
          class="w-full border border-gray-400 p-2 rounded-md"
          placeholder="Edit Description"
        ></textarea>
      </p>
      <p v-else>Instructions: {{ pitch.description }}</p>
      <button
        v-if="isUserAllowedToEdit"
        class="ml-2 text-black transition-transform duration-200"
        @click="toggleDescriptionEdit"
      >
        <Icon
          :name="isDescriptionEditing ? 'kind-icon:check' : 'kind-icon:pencil'"
          class="w-5 h-5"
        />
      </button>
    </div>

    <!-- Title Examples Component -->
    <title-examples :pitch="pitch" />
    <api-response v-if="pitchStore.selectedTitle?.id === pitch.id" />
    <!-- Actions Component -->
    <pitch-card-actions
      v-if="isUserAllowedToEdit"
      :pitch="pitch"
      @delete="deletePitch"
    />
    <!-- Global Save Button -->
    <button
      v-if="isChanged"
      class="fixed bottom-4 right-4 bg-green-500 text-black p-3 rounded-full shadow-lg"
      @click="saveChanges"
    >
      <Icon name="kind-icon:save" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, PitchType } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'
import type { Pitch } from '~/stores/pitchStore'

const props = defineProps<{
  pitch: Pitch
}>()

const emit = defineEmits(['save', 'delete', 'cancel'])

const pitchStore = usePitchStore()
const userStore = useUserStore()

// Determine if the user is allowed to edit the pitch
const isUserAllowedToEdit = computed(
  () =>
    props.pitch.userId === userStore.userId || userStore.user?.Role === 'ADMIN',
)

// Check if pitch type is TITLE
const isTitleType = computed(
  () => editablePitch.value.PitchType === PitchType.TITLE,
)
const isSelected = computed(
  () => pitchStore.selectedTitle === props.pitch.title,
)

// Function to set selected title in the store
const selectTitle = () => {
  pitchStore.selectedTitle = props.pitch
}

// Local editing states for each section
const isTitleEditing = ref(false)
const isPitchEditing = ref(false)
const isDescriptionEditing = ref(false)
const editablePitch = ref({ ...props.pitch })
const isChanged = ref(false)

// List of pitch types
const pitchTypes = Object.values(PitchType)

// Mark the card as changed when the PitchType is updated
const markAsChanged = () => {
  isChanged.value = true
}

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

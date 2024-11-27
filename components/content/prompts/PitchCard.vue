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
const isTitleType = computed(() => editablePitch.value.PitchType === PitchType.TITLE)
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

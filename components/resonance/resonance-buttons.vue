<!-- /components/content/resonance/resonance-buttons.vue -->
<template>
  <div
    class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-wrap gap-3 justify-center p-2 bg-base-300/80 backdrop-blur-md rounded-2xl shadow-lg"
  >
    <button
      v-for="action in actions"
      :key="action.id"
      class="btn btn-primary btn-sm rounded-xl flex items-center gap-2 px-4 py-2"
      @click="handleAction(action)"
    >
      <Icon :name="action.icon" class="w-4 h-4" />
      <span class="hidden sm:inline">{{ action.label }}</span>
    </button>
  </div>

  <!-- Here you would mount input or slider popups when needed -->
</template>

<script setup lang="ts">
import { useResonanceStore } from '@/stores/resonanceStore'
import { computed, ref } from 'vue'

const resonanceStore = useResonanceStore()

// Detect running state
const isRunning = computed(() => resonanceStore.running)

interface ResonanceAction {
  id: string
  label: string
  icon: string
  type: 'modal' | 'direct'
  handler: () => void
}

const actions: ResonanceAction[] = [
  {
    id: 'new',
    label: 'New',
    icon: 'kind-icon:plus',
    type: 'direct',
    handler: () => resonanceStore.createNewResonance(),
  },
  {
    id: 'save',
    label: 'Save',
    icon: 'kind-icon:save',
    type: 'direct',
    handler: () =>
      resonanceStore.saveResonance(resonanceStore.resonanceForm as any),
  },
  {
    id: 'addImage',
    label: 'Add Image',
    icon: 'kind-icon:image-plus',
    type: 'modal',
    handler: () => openImagePopup(),
  },
  {
    id: 'editText',
    label: 'Text',
    icon: 'kind-icon:edit',
    type: 'modal',
    handler: () => openTextPopup('seedText'),
  },
  {
    id: 'changeMask',
    label: 'Mask',
    icon: 'kind-icon:adjust',
    type: 'modal',
    handler: () => openSliderPopup('imageMask'),
  },
  {
    id: 'changeInterval',
    label: 'Interval',
    icon: 'kind-icon:clock',
    type: 'modal',
    handler: () => openSliderPopup('iteration'),
  },
  {
    id: 'toggleMic',
    label: 'Mic',
    icon: 'kind-icon:microphone',
    type: 'direct',
    handler: () => toggleMicrophone(),
  },
  {
    id: 'addInstruction',
    label: 'Instruction',
    icon: 'kind-icon:scroll',
    type: 'modal',
    handler: () => openTextPopup('instruction'),
  },
  {
    id: 'changeArt',
    label: 'Next Image',
    icon: 'kind-icon:shuffle',
    type: 'direct',
    handler: () => resonanceStore.nextArtAsset(),
  },
  {
    id: 'togglePlay',
    label: isRunning.value ? 'Stop' : 'Play',
    icon: isRunning.value ? 'kind-icon:pause' : 'kind-icon:play',
    type: 'direct',
    handler: () => toggleRunning(),
  },
  {
    id: 'updateNow',
    label: 'Update Now',
    icon: 'kind-icon:refresh',
    type: 'direct',
    handler: () => resonanceStore.forceUpdateNow(),
  },
]

const handleAction = (action: ResonanceAction) => {
  action.handler()
}

// Placeholder modals (implement separately)
const openImagePopup = () => {
  console.log('Open Add Image modal')
}
const openTextPopup = (field: 'seedText' | 'instruction') => {
  console.log(`Open Edit ${field} modal`)
}
const openSliderPopup = (field: 'imageMask' | 'iteration') => {
  console.log(`Open Adjust ${field} slider`)
}

const toggleMicrophone = () => {
  resonanceStore.resonanceForm.useMicrophone =
    !resonanceStore.resonanceForm.useMicrophone
}

const toggleRunning = () => {
  resonanceStore.running = !resonanceStore.running
}
</script>

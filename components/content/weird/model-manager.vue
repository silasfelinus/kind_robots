<template>
  <div class="flex flex-col h-full gap-6 p-4">
    <!-- File Folder Modes Section -->
    <div class="flex flex-wrap gap-2 border-b-2 border-base-300">
      <div
        v-for="mode in modes"
        :key="mode.name"
        :class="[
          'flex items-center gap-2 px-4 py-2 cursor-pointer border rounded-t-lg transition-all duration-300',
          mode.name === displayStore.displayMode
            ? 'bg-base-200 text-primary border-primary border-b-transparent scale-105 shadow-md'
            : 'bg-base-100 text-base-content hover:bg-base-200 hover:scale-105 hover:shadow-lg border-base-300',
        ]"
        @click="displayStore.setMode(mode.name as displayModeState)"
      >
        <Icon :name="mode.icon" class="w-8 h-8" />
        <span class="text-lg font-semibold">{{ mode.label }}</span>
      </div>
    </div>

    <!-- Dynamic Component -->
    <div
      class="flex-grow flex items-center justify-center bg-base-200 rounded-xl p-6 overflow-hidden"
    >
      <component
        :is="
          getComponentName(displayStore.displayMode, displayStore.displayAction)
        "
      />
    </div>

    <!-- Actions Section -->
    <div class="flex flex-wrap justify-center gap-4">
      <button
        v-for="action in actions"
        :key="action.name"
        :class="[
          'flex items-center gap-2 transition-all duration-300 w-full md:w-auto',
          action.name === displayStore.displayAction
            ? 'btn-primary scale-110 shadow-md text-base md:text-sm'
            : 'btn-secondary hover:scale-105 hover:shadow-lg text-base md:text-sm',
        ]"
        @click="displayStore.setAction(action.name as displayActionState)"
      >
        <Icon :name="action.icon" class="w-6 h-6" />
        <span class="font-semibold">{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

// Display Store
const displayStore = useDisplayStore()

// Modes and Actions
const modes = [
  { name: 'scenario', icon: 'kind-icon:scenario', label: 'Scenario' },
  { name: 'character', icon: 'kind-icon:character', label: 'Character' },
  { name: 'reward', icon: 'kind-icon:reward', label: 'Reward' },
  { name: 'chat', icon: 'kind-icon:chat', label: 'Chat' },
  { name: 'bot', icon: 'kind-icon:bot', label: 'Bot' },
  { name: 'pitch', icon: 'kind-icon:pitch', label: 'Pitch' },
  { name: 'art', icon: 'kind-icon:art', label: 'Art' },
  { name: 'collection', icon: 'kind-icon:collection', label: 'Collection' },
  { name: 'user', icon: 'kind-icon:user', label: 'User' },
]

const actions = [
  { name: 'gallery', icon: 'kind-icon:gallery', label: 'Gallery' },
  { name: 'card', icon: 'kind-icon:card', label: 'Card' },
  { name: 'add', icon: 'kind-icon:add', label: 'Add' },
  { name: 'edit', icon: 'kind-icon:edit', label: 'Edit' },
  { name: 'generate', icon: 'kind-icon:generate', label: 'Generate' },
  { name: 'interact', icon: 'kind-icon:interact', label: 'Interact' },
]

/**
 * Dynamically resolves the component name based on action and mode.
 * If the action is 'gallery' or 'card', format is 'mode-action'.
 * Otherwise, format is 'action-mode'.
 */
function getComponentName(mode: string, action: string): string {
  const reversedActions = ['gallery', 'card']
  if (reversedActions.includes(action)) {
    return `${mode}-${action}`
  }
  return `${action}-${mode}`
}
</script>

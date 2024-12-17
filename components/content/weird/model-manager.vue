<template>
  <div class="flex flex-col h-full gap-4 p-4">
    <!-- Modes Section: Always at the Top -->
    <div class="flex flex-wrap gap-2 justify-start border-b-2 border-base-300">
      <div
        v-for="mode in modes"
        :key="mode.name"
        @click="displayStore.setMode(mode.name as displayModeState)"
        :class="[
          'flex items-center gap-2 px-4 py-2 cursor-pointer border rounded-t-lg transition-all duration-300',
          mode.name === displayStore.displayMode
            ? 'bg-base-200 text-primary border-primary border-b-transparent scale-105 shadow-md'
            : 'bg-base-100 text-base-content hover:bg-base-200 hover:scale-105 hover:shadow-lg border-base-300',
        ]"
      >
        <Icon
          :name="mode.icon"
          class="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
        />
        <span class="text-base md:text-lg lg:text-xl font-semibold">
          {{ mode.label }}
        </span>
      </div>
    </div>

    <!-- Dynamic Component Section with Fallback -->
    <div
      class="flex-grow flex items-center justify-center bg-base-200 rounded-xl p-4 sm:p-6 lg:p-8 overflow-hidden"
    >
      <component
        :is="resolveComponentName(displayStore.displayMode, displayStore.displayAction)"
      />
    </div>

    <!-- Actions Section: Single Line at the Bottom -->
    <div class="flex flex-wrap md:flex-nowrap gap-2 justify-center items-center">
      <button
        v-for="action in actions"
        :key="action.name"
        @click="displayStore.setAction(action.name as displayActionState)"
        :class="[
          'btn flex items-center justify-center gap-2 transition-all duration-300',
          'w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4',
          action.name === displayStore.displayAction
            ? 'btn-primary scale-105 shadow-md'
            : 'btn-secondary hover:scale-105 hover:shadow-lg',
        ]"
      >
        <Icon
          :name="action.icon"
          class="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
        />
        <span class="text-base md:text-sm lg:text-lg font-semibold">
          {{ action.label }}
        </span>
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
 * Resolves the dynamic component name and falls back if the component doesn't exist.
 */
function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery', 'card']
  const componentName = reversedActions.includes(action)
    ? `${mode}-${action}`
    : `${action}-${mode}`

  const availableComponents = import.meta.glob('@/components/**/*.vue', { eager: true })
  const isComponentAvailable = Object.keys(availableComponents).some((path) =>
    path.includes(`${componentName}.vue`)
  )

  return isComponentAvailable ? componentName : 'FallbackComponent'
}
</script>

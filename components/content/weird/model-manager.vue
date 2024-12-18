<template>
  <!-- Modes Section: Compact Tabs at the Top -->
  <div
    class="section-container flex flex-col items-center overflow-auto"
    :style="mainContentStyle"
  >
    <div
      v-for="mode in modes"
      :key="mode.name"
      :class="[
        'flex items-center gap-1 px-2 py-1 cursor-pointer border rounded-t-md transition-all duration-200',
        mode.name === displayStore.displayMode
          ? 'bg-base-200 text-primary border-primary border-b-transparent scale-105 shadow-sm'
          : 'bg-base-100 text-base-content hover:bg-base-200 hover:scale-105 hover:shadow',
      ]"
      @click="displayStore.setMode(mode.name as displayModeState)"
    >
      <Icon :name="mode.icon" class="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
      <span class="text-sm md:text-base font-semibold">
        {{ mode.label }}
      </span>
    </div>
  </div>

  <!-- Actions Section: Below Tabs -->
  <div class="flex justify-start gap-2 items-center bg-base-200 rounded-md p-2">
    <button
      v-for="action in actions"
      :key="action.name"
      :class="[
        'btn btn-sm sm:btn-md flex items-center gap-1 px-3 py-1 transition-all duration-200',
        action.name === displayStore.displayAction
          ? 'btn-primary scale-105 shadow'
          : 'btn-secondary hover:scale-105 hover:shadow',
      ]"
      @click="displayStore.setAction(action.name as displayActionState)"
    >
      <Icon :name="action.icon" class="w-4 h-4 sm:w-5 sm:h-5" />
      <span class="hidden sm:inline font-medium">
        {{ action.label }}
      </span>
    </button>
  </div>

  <!-- Dynamic Component Section -->
  <div
    class="flex-grow flex items-center justify-center bg-base-200 rounded-lg p-2 sm:p-3 overflow-hidden"
  >
    <component
      :is="
        resolveComponentName(
          displayStore.displayMode,
          displayStore.displayAction,
        )
      "
    />
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
  { name: 'add', icon: 'kind-icon:add', label: 'Add' },
  { name: 'edit', icon: 'kind-icon:edit', label: 'Edit' },
  { name: 'generate', icon: 'kind-icon:generate', label: 'Generate' },
  { name: 'interact', icon: 'kind-icon:interact', label: 'Interact' },
]

// Dynamically compute the main content area size
const mainContentStyle = computed(() => ({
  height: `calc(${displayStore.mainVh}vh)`,
  width: `calc(${displayStore.mainVw}vw)`,
}))

/**
 * Resolves the dynamic component name and falls back if the component doesn't exist.
 */
function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery', 'card']
  const componentName = reversedActions.includes(action)
    ? `${mode}-${action}`
    : `${action}-${mode}`

  const availableComponents = import.meta.glob('@/components/**/*.vue', {
    eager: true,
  })
  const isComponentAvailable = Object.keys(availableComponents).some((path) =>
    path.includes(`${componentName}.vue`),
  )

  return isComponentAvailable ? componentName : 'FallbackComponent'
}
</script>

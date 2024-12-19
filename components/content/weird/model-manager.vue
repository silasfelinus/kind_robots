<template>
  <div class="flex flex-col h-full bg-base-100">
    <!-- Add Action Toggle (Floating Above) -->
    <div
      class="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center justify-center w-12 h-12 rounded-full bg-primary shadow-lg cursor-pointer hover:shadow-xl"
      @click="toggleAction"
    >
      <!-- Active Icon -->
      <Icon
        :name="displayStore.displayAction === 'add' ? 'kind-icon:add' : 'kind-icon:gallery'"
        class="w-6 h-6 sm:w-8 sm:h-8 text-white z-10"
      />
      <!-- Background Icon (Unselected) -->
      <Icon
        :name="displayStore.displayAction === 'add' ? 'kind-icon:gallery' : 'kind-icon:add'"
        class="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 absolute z-0"
      />
    </div>

    <!-- Modes Section with Left/Right Toggles -->
    <div class="flex items-center justify-between px-4 py-2 gap-2">
      <!-- Left Toggle -->
      <left-toggle />

      <!-- Modes Tabs -->
      <div class="flex flex-row items-center gap-2 flex-grow">
        <div
          v-for="mode in modes"
          :key="mode.name"
          class="relative"
        >
          <div
            :class="[
              'flex items-center gap-2 px-2 py-1 cursor-pointer border-t border-l border-r rounded-t-md bg-base-200 transition-all duration-200',
              mode.name === displayStore.displayMode
                ? 'border-primary border-b-0 z-10 shadow-md'
                : 'border-base-300 hover:shadow',
            ]"
            @click="displayStore.setMode(mode.name as displayModeState)"
          >
            <Icon :name="mode.icon" class="w-5 h-5 md:w-6 md:h-6" />
            <span class="text-sm lg:text-md font-semibold hidden md:inline">
              {{ mode.label }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right Toggle -->
      <right-toggle />
    </div>

    <!-- Dynamic Component Container -->
    <div class="flex-grow mt-6 overflow-y-auto p-4">
      <component
        :is="
          resolveComponentName(
            displayStore.displayMode,
            displayStore.displayAction,
          )
        "
      >
        <!-- Fallback Section -->
        <fallback-component v-if="currentComponent === 'fallback-component'" />
      </component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const modes = [
  { name: 'scenario', icon: 'kind-icon:scenario', label: 'Scenario' },
  { name: 'character', icon: 'kind-icon:character', label: 'Character' },
  { name: 'reward', icon: 'kind-icon:reward', label: 'Reward' },
  { name: 'chat', icon: 'kind-icon:chat', label: 'Chat' },
  { name: 'bot', icon: 'kind-icon:bot', label: 'Bot' },
  { name: 'pitch', icon: 'kind-icon:pitch', label: 'Pitch' },
  { name: 'art', icon: 'kind-icon:art', label: 'Art' },
]

function toggleAction() {
  displayStore.setAction(
    displayStore.displayAction === 'add' ? 'gallery' : 'add'
  )
}

function resolveComponentName(mode: string, action: string) {
  const reversedActions = ['gallery']
  const componentName = reversedActions.includes(action)
    ? `${mode}-${action}`
    : `${action}-${mode}`

  const availableComponents = import.meta.glob('@/components/**/*.vue', {
    eager: true,
  })
  const isComponentAvailable = Object.keys(availableComponents).some((path) =>
    path.includes(`${componentName}.vue`),
  )

  return isComponentAvailable ? componentName : 'fallback-component'
}

// Computed: Current Component Name
const currentComponent = computed(() =>
  resolveComponentName(displayStore.displayMode, displayStore.displayAction),
)
</script>

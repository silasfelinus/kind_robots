<template>
  <div class="flex flex-col h-full gap-2 relative">
    <!-- Modes Section -->
    <div
      class="flex flex-row items-center bg-base-300 p-2 rounded-t-md flex-shrink-0 sticky top-0 z-20"
    >
      <div v-for="mode in modes" :key="mode.name" class="relative">
        <div
          :class="[
            'flex items-center gap-2 px-3 py-1 cursor-pointer border-t border-l border-r rounded-t-md bg-base-200 transition-all duration-200',
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

    <!-- Actions Section -->
    <div
      class="flex justify-center gap-4 items-center bg-base-300 py-2 rounded-md flex-shrink-0 sticky top-[3rem] z-20"
    >
      <div
        v-for="action in actions"
        :key="action.name"
        :class="[
          'flex items-center justify-center w-10 h-10 rounded-full bg-base-200 transition-all duration-200 hover:shadow-md',
          action.name === displayStore.displayAction
            ? 'bg-primary shadow-lg'
            : 'hover:bg-base-300',
        ]"
        @click="displayStore.setAction(action.name as displayActionState)"
      >
        <Icon :name="action.icon" class="w-6 h-6 sm:w-8 sm:h-8" />
        <span class="text-xs font-medium hidden md:inline mt-1">{{
          action.label
        }}</span>
      </div>
    </div>

    <!-- Dynamic Component Section -->
    <div class="flex-grow bg-base-200 rounded-lg overflow-y-auto">
      <template v-if="currentComponent !== 'fallback-component'">
        <component
          :is="
            resolveComponentName(
              displayStore.displayMode,
              displayStore.displayAction,
            )
          "
        />
      </template>
      <template v-else>
        <!-- Fallback Section -->
        <div class="flex items-center justify-center h-full">
          <p class="text-lg font-bold text-gray-600">
            No component loaded. Please select a mode and action.
          </p>
        </div>
      </template>
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

const actions = [
  { name: 'gallery', icon: 'kind-icon:gallery', label: 'Gallery' },
  { name: 'add', icon: 'kind-icon:add', label: 'Add' },
]

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


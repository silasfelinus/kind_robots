<template>
  <div class="flex flex-col h-full gap-2 p-2 overflow-hidden relative">
    <!-- Modes Section: File Folder Tabs -->
    <div
      class="flex flex-row items-center gap-x-2 bg-base-300 rounded-t-md p-2 flex-shrink-0"
    >
      <div v-for="mode in modes" :key="mode.name" class="relative">
        <div
          :class="[
            'flex items-center gap-1 px-3 py-1 cursor-pointer border-t border-l border-r rounded-t-md bg-base-200 transition-all duration-200',
            mode.name === displayStore.displayMode
              ? 'border-primary border-b-0 z-10 scale-102 shadow-md'
              : 'border-base-300 hover:scale-102 hover:shadow',
          ]"
          style="transform-origin: center"
          @click="displayStore.setMode(mode.name as displayModeState)"
        >
          <Icon :name="mode.icon" class="w-5 h-5 md:w-6 md:h-6" />
          <span class="text-sm md:text-base font-semibold hidden md:inline">
            {{ mode.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions Section: Compact Icons -->
    <div
      class="flex justify-center gap-4 items-center bg-base-300 rounded-md py-2 flex-shrink-0"
    >
      <div
        v-for="action in actions"
        :key="action.name"
        :class="[
          'flex items-center justify-center w-10 h-10 rounded-full bg-base-200 transition-all duration-200 hover:scale-110 hover:shadow-md',
          action.name === displayStore.displayAction
            ? 'bg-primary scale-110 shadow-lg'
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
    <div class="flex-grow bg-base-200 rounded-lg p-4 overflow-hidden relative">
      <component
        :is="
          resolveComponentName(
            displayStore.displayMode,
            displayStore.displayAction,
          )
        "
        @mounted="scrollToTop"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
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

function scrollToTop() {
  const container = document.querySelector('.flex-grow')
  if (container) container.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

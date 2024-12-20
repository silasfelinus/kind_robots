<template>
  <div class="flex items-center px-1 md:px-2 lg:px-4 py-2 bg-base-100 z-30 shadow-md relative">
    <big-toggle />

    <!-- Modes Tabs (First Group) -->
    <div class="flex flex-row items-center flex-grow justify-end">
      <div
        v-for="mode in firstGroupModes"
        :key="mode.name"
        class="relative"
      >
        <div
          :class="[
            'flex items-center px-1 md:px-2 py-1 cursor-pointer border-t border-l border-r rounded-none bg-base-200 transition-all duration-200',
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

    <!-- Plus/Gallery Toggle -->
    <div
      class="flex items-center justify-center w-12 h-12 border-accent border-1 rounded-full cursor-pointer hover:shadow-xl mx-1 md:mx-2"
      @click="toggleAction"
    >
      <Icon
        :name="displayStore.displayAction === 'add' ? 'kind-icon:gallery' : 'kind-icon:add'"
        class="w-8 h-8 md:w-10 md:h-10 text-white z-10"
      />
    </div>

    <!-- Modes Tabs (Second Group) -->
    <div class="flex flex-row items-center flex-grow justify-start">
      <div
        v-for="mode in secondGroupModes"
        :key="mode.name"
        class="relative"
      >
        <div
          :class="[
            'flex items-center px-1 md:px-2 py-1 cursor-pointer border-t border-l border-r rounded-none bg-base-200 transition-all duration-200',
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

// Split modes into two groups
const firstGroupModes = computed(() => modes.slice(0, 3))
const secondGroupModes = computed(() => modes.slice(3))

function toggleAction() {
  displayStore.setAction(
    displayStore.displayAction === 'add' ? 'gallery' : 'add'
  )
}
</script>

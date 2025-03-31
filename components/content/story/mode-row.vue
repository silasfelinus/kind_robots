<template>
  <div class="flex flex-wrap items-center justify-between gap-2 px-2 md:px-4 bg-base-300 z-30 shadow-md rounded-2xl">
    <!-- Mode Sections -->
    <div class="flex flex-wrap gap-2 items-center">
      <div
        v-for="mode in modes"
        :key="mode.name"
        class="flex items-center gap-1"
      >
        <!-- Gallery Mode Title -->
        <div
          @click="handleGalleryMode(mode.name)"
          class="flex items-center px-2 py-1 cursor-pointer rounded-md border transition-all duration-200 bg-base-200 hover:shadow text-sm md:text-md font-semibold"
        >
          <Icon :name="mode.icon" class="w-5 h-5 md:w-6 md:h-6" />
          <span class="ml-1 hidden md:inline">{{ mode.label }}</span>
        </div>

        <!-- Add Button -->
        <div
          @click="handleAddMode(mode.name)"
          class="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white shadow-md cursor-pointer hover:scale-105 transition-transform"
        >
          <Icon name="kind-icon:add" class="w-5 h-5" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/mode-tabs.vue
import { useRouter, useRoute } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

const router = useRouter()
const route = useRoute()
const displayStore = useDisplayStore()

const modes = [
  { name: 'scenario', icon: 'kind-icon:plus', label: 'Scenario' },
  { name: 'character', icon: 'kind-icon:plus', label: 'Character' },
  { name: 'reward', icon: 'kind-icon:plus', label: 'Reward' },
  { name: 'chat', icon: 'kind-icon:plus', label: 'Chat' },
  { name: 'bot', icon: 'kind-icon:plus', label: 'Bot' },
  { name: 'pitch', icon: 'kind-icon:plus', label: 'Pitch' },
  { name: 'art', icon: 'kind-icon:plus', label: 'Art' },
]

function handleGalleryMode(modeName: string) {
  displayStore.setMode(modeName as displayModeState)
  displayStore.setAction('gallery')
  if (route.path !== '/weirdlandia') router.push('/weirdlandia')
}

function handleAddMode(modeName: string) {
  displayStore.setMode(modeName as displayModeState)
  displayStore.setAction('add')
  if (route.path !== '/weirdlandia') router.push('/weirdlandia')
}
</script>

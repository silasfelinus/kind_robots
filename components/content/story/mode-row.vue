<template>
  <div class="flex items-center justify-between flex-wrap gap-2 px-2 md:px-4 bg-base-300 z-30 shadow-md rounded-2xl">
    <!-- Left Modes (first 3) -->
    <div class="flex flex-wrap gap-2">
      <div
        v-for="mode in modes.slice(0, 3)"
        :key="mode.name"
        class="flex items-center overflow-hidden rounded-full bg-base-200 border border-base-300 shadow cursor-pointer transition hover:shadow-lg"
      >
        <div
          @click="handleGalleryMode(mode.name)"
          class="flex items-center px-3 py-1 gap-1"
        >
<Icon :name="mode.icon" class="w-5 h-5 md:w-6 md:h-6" />
          <span class="text-sm md:text-md font-semibold hidden md:inline">
            {{ mode.label }}
          </span>
        </div>
        <div class="w-px h-6 bg-base-300 rotate-[25deg] -ml-1 -mr-1"></div>
        <div
          @click.stop="handleAddMode(mode.name)"
          class="flex items-center justify-center px-2 py-1 text-white bg-accent rounded-r-full hover:scale-105 transition-transform"
        >
          <Icon name="kind-icon:add" class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Center Toggle -->
    <div>
      <footer-toggle />
    </div>

    <!-- Right Modes (last 4) -->
    <div class="flex flex-wrap gap-2">
      <div
        v-for="mode in modes.slice(3)"
        :key="mode.name"
        class="flex items-center overflow-hidden rounded-full bg-base-200 border border-base-300 shadow cursor-pointer transition hover:shadow-lg"
      >
        <div
          @click="handleGalleryMode(mode.name)"
          class="flex items-center px-3 py-1 gap-1"
        >
          <span class="text-sm md:text-md font-semibold hidden md:inline">
            {{ mode.label }}
          </span>
        </div>
        <div class="w-px h-6 bg-base-300 rotate-[25deg] -ml-1 -mr-1"></div>
        <div
          @click.stop="handleAddMode(mode.name)"
          class="flex items-center justify-center px-2 py-1 text-white bg-accent rounded-r-full hover:scale-105 transition-transform"
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
  { name: 'scenario', icon: 'kind-icon:plus', label: 'Scenarios' },
  { name: 'character', icon: 'kind-icon:plus', label: 'Characters' },
  { name: 'reward', icon: 'kind-icon:plus', label: 'Rewards' },
  { name: 'chat', icon: 'kind-icon:plus', label: 'Chats' },
  { name: 'bot', icon: 'kind-icon:plus', label: 'Bots' },
  { name: 'pitch', icon: 'kind-icon:plus', label: 'Pitches' },
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

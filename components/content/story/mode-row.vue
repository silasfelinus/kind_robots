// /components/content/story/mode-row.vue
<template>
  <div class="flex flex-wrap gap-2 px-2 md:px-4 bg-base-300 z-30 shadow-md rounded-2xl justify-center">
    <div
      v-for="mode in modes"
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
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

const router = useRouter()
const route = useRoute()
const displayStore = useDisplayStore()

const modes = [
  { name: 'scenario', icon: 'kind-icon:scenario', label: 'Scenarios' },
  { name: 'character', icon: 'kind-icon:character', label: 'Characters' },
  { name: 'reward', icon: 'kind-icon:reward', label: 'Rewards' },
  { name: 'chat', icon: 'kind-icon:chat', label: 'Chats' },
  { name: 'bot', icon: 'kind-icon:bot', label: 'Bots' },
  { name: 'pitch', icon: 'kind-icon:pitch', label: 'Pitches' },
  { name: 'art', icon: 'kind-icon:art', label: 'Art' },
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
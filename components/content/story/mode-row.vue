<template>
  <!-- Mode Button Grid -->
  <div
    class="grid grid-cols-2 md:grid-cols-3 gap-2 px-2 py-2 w-full mx-auto border-black border-1 bg-base-200 rounded-2xl"
  >
    <div
      v-for="mode in modes"
      :key="mode.name"
      class="flex flex-col items-center justify-between border-black border-1 bg-base-200 rounded-2xl shadow-sm hover:shadow-md p-4 transition group cursor-pointer"
    >
      <!-- Icon Button -->
      <div
        @click="handleAddMode(mode.name as displayModeState)"
        class="flex items-center justify-center w-12 h-12 rounded-full bg-base-100 hover:bg-primary hover:text-white transition mb-2"
        :title="`Add ${mode.label}`"
      >
        <Icon :name="mode.icon" class="w-6 h-6" />
      </div>

      <!-- Label Button -->
      <div
        @click="handleGalleryMode(mode.name as displayModeState)"
        class="text-sm font-medium text-center hover:text-primary transition"
        :title="`${mode.label} Gallery`"
      >
        {{ mode.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDisplayStore, type displayModeState } from '@/stores/displayStore'

const router = useRouter()
const displayStore = useDisplayStore()

const modes = [
  {
    name: 'scenario',
    icon: 'kind-icon:scenario',
    label: 'Scenarios',
    addRoute: '/addscenario',
    galleryRoute: '/scenarios',
  },
  {
    name: 'resonance',
    icon: 'kind-icon:resonance',
    label: 'Resonance',
    addRoute: '/addresonance',
    galleryRoute: '/resonances',
  },
  {
    name: 'character',
    icon: 'kind-icon:character',
    label: 'Characters',
    addRoute: '/addcharacter',
    galleryRoute: '/characters',
  },
  {
    name: 'reward',
    icon: 'kind-icon:reward',
    label: 'Rewards',
    addRoute: '/addreward',
    galleryRoute: '/rewards',
  },
  {
    name: 'chat',
    icon: 'kind-icon:chat',
    label: 'Chats',
    addRoute: '/addchat',
    galleryRoute: '/chats',
  },
  {
    name: 'bot',
    icon: 'kind-icon:bot',
    label: 'Bots',
    addRoute: '/addbot',
    galleryRoute: '/bots',
  },
  {
    name: 'pitch',
    icon: 'kind-icon:pitch',
    label: 'Pitches',
    addRoute: '/addpitch',
    galleryRoute: '/pitches',
  },
  {
    name: 'art',
    icon: 'kind-icon:art',
    label: 'Art',
    addRoute: '/addart',
    galleryRoute: '/artgallery',
  },
] satisfies {
  name: displayModeState
  icon: string
  label: string
  addRoute: string
  galleryRoute: string
}[]

function handleAddMode(modeName: displayModeState) {
  const mode = modes.find((m) => m.name === modeName)
  if (!mode) return
  displayStore.setMode(modeName)
  displayStore.setAction('add')
  router.push(mode.addRoute)
}

function handleGalleryMode(modeName: displayModeState) {
  const mode = modes.find((m) => m.name === modeName)
  if (!mode) return
  displayStore.setMode(modeName)
  displayStore.setAction('gallery')
  router.push(mode.galleryRoute)
}
</script>

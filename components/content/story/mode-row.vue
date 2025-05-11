<template>
  <div class="gap-4 w-full mx-auto p-4">
    <div
      v-for="mode in modes"
      :key="mode.name"
      class="flex items-center justify-between bg-base-200 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition group"
    >
      <!-- Add Action (Icon acts as add) -->
      <div
        @click="handleAddMode(mode.name as displayModeState)"
        class="flex items-center justify-center p-2 cursor-pointer hover:bg-primary hover:text-white rounded-l-xl transition"
        :title="`Add ${mode.label}`"
      >
        <Icon :name="mode.icon" class="w-5 h-5" />
      </div>

      <!-- Divider -->
      <div class="w-px h-5 bg-base-300"></div>

      <!-- Gallery Action (Label text) -->
      <div
        @click="handleGalleryMode(mode.name as displayModeState)"
        class="text-sm px-2 py-1 cursor-pointer font-medium text-center hover:text-primary transition"
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
  { name: 'scenario', icon: 'kind-icon:scenario', label: 'Scenarios' },
  { name: 'resonance', icon: 'kind-icon:resonance', label: 'Resonance' },
  { name: 'character', icon: 'kind-icon:character', label: 'Characters' },
  { name: 'reward', icon: 'kind-icon:reward', label: 'Rewards' },
  { name: 'chat', icon: 'kind-icon:chat', label: 'Chats' },
  { name: 'bot', icon: 'kind-icon:bot', label: 'Bots' },
  { name: 'pitch', icon: 'kind-icon:pitch', label: 'Pitches' },
  { name: 'art', icon: 'kind-icon:art', label: 'Art' },
]

function handleGalleryMode(modeName: displayModeState) {
  displayStore.setMode(modeName)
  displayStore.setAction('gallery')
  router.push(`/${modeName}gallery`)
}

function handleAddMode(modeName: displayModeState) {
  displayStore.setMode(modeName)
  displayStore.setAction('add')
  router.push(`/add${modeName}`)
}
</script>

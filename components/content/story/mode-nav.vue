<!-- /components/content/story/mode-nav.vue -->
<template>
  <div
    v-if="modeInfo"
    class="flex w-full h-full items-center justify-center gap-4 px-4"
  >
    <!-- Add Button -->
    <div
      @click="handleAddMode"
      class="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-base-200 hover:bg-primary hover:text-white rounded-2xl border border-base-300 shadow-md cursor-pointer transition-all duration-200"
    >
      <Icon
        :name="modeInfo.icon"
        class="w-12 h-12 md:w-16 md:h-16 transition-transform group-hover:scale-105"
      />
      <div class="text-lg font-semibold text-center">
        Create a new {{ modeInfo.label }}
      </div>
    </div>

    <!-- Gallery Button -->
    <div
      @click="handleGalleryMode"
      class="flex-1 flex flex-col items-center justify-center gap-2 p-6 bg-base-200 hover:bg-accent hover:text-white rounded-2xl border border-base-300 shadow-md cursor-pointer transition-all duration-200"
    >
      <Icon
        :name="modeInfo.icon"
        class="w-12 h-12 md:w-16 md:h-16 transition-transform group-hover:scale-105"
      />
      <div class="text-lg font-semibold text-center">
        Explore {{ modeInfo.label }} Gallery
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/mode-nav.vue
import { useRouter } from 'vue-router'
import { useDisplayStore, type displayModeState } from '@/stores/displayStore'
import { computed } from 'vue'

const router = useRouter()
const displayStore = useDisplayStore()
const modes = {
  scenario: { icon: 'kind-icon:scenario', label: 'Scenarios' },
  character: { icon: 'kind-icon:character', label: 'Characters' },
  reward: { icon: 'kind-icon:reward', label: 'Rewards' },
  chat: { icon: 'kind-icon:chat', label: 'Chats' },
  bot: { icon: 'kind-icon:bot', label: 'Bots' },
  pitch: { icon: 'kind-icon:pitch', label: 'Pitches' },
  art: { icon: 'kind-icon:art', label: 'Artworks' },
} as const

type ModeKey = keyof typeof modes

const modeInfo = computed(() => {
  const mode = displayStore.displayMode
  return (Object.keys(modes) as ModeKey[]).includes(mode as ModeKey)
    ? modes[mode as ModeKey]
    : null
})
function handleAddMode() {
  const mode = displayStore.displayMode
  if (mode) {
    displayStore.setAction('add')
    router.push(`/add${mode}`)
  }
}

function handleGalleryMode() {
  const mode = displayStore.displayMode
  if (mode) {
    displayStore.setAction('gallery')
    router.push(`/${mode}gallery`)
  }
}
</script>

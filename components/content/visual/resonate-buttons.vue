<!-- /components/content/resonate/resonate-buttons.vue -->
<template>
  <div
    class="w-full flex flex-wrap justify-center gap-4 p-4 bg-base-300 rounded-2xl"
  >
    <button
      v-for="command in availableCommands"
      :key="command.id"
      class="btn btn-primary flex items-center gap-2 text-lg rounded-2xl sm:px-6 sm:py-3 px-4 py-2 transition-all"
      @click="handleCommand(command)"
      :disabled="cooldowns.includes(command.id)"
    >
      <Icon :name="command.icon || 'kind-icon:spark'" class="w-5 h-5" />
      <span class="hidden sm:inline">{{ command.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// /components/content/resonate/resonate-buttons.vue
import { ref, computed } from 'vue'
import { useResonateStore } from '@/stores/resonateStore'
import type { VisualizerCommand } from '@/stores/resonateStore'

const resonateStore = useResonateStore()

const availableCommands = computed(() => resonateStore.availableCommands)
const cooldowns = ref<string[]>([])

const handleCommand = (command: VisualizerCommand) => {
  if (cooldowns.value.includes(command.id)) return

  executeCommand(command.actionText)

  if (command.cooldown) {
    cooldowns.value.push(command.id)
    setTimeout(() => {
      cooldowns.value = cooldowns.value.filter((id) => id !== command.id)
    }, command.cooldown)
  }
}

const executeCommand = (action: string) => {
  switch (action) {
    case 'changeImage':
      resonateStore.currentImage = `/images/default-${Math.floor(Math.random() * 5)}.webp`
      break
    case 'addChapter':
      resonateStore.addChapter('New Chapter')
      break
    case 'addText':
      resonateStore.addTextToChapter('A soft sound colors the air...')
      break
    case 'addImage':
      resonateStore.addImageToChapter(
        `/images/default-${Math.floor(Math.random() * 5)}.webp`,
      )
      break
    case 'saveStory':
      resonateStore.saveStory()
      break
    default:
      console.warn(`[resonate-buttons] Unknown command: ${action}`)
      break
  }
}
</script>

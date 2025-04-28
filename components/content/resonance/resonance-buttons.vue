<!-- /components/content/resonance/resonance-buttons.vue -->
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
// /components/content/resonance/resonance-buttons.vue
import { ref, computed } from 'vue'
import { useresonanceStore } from '@/stores/resonanceStore'
import type { VisualizerCommand } from '@/stores/resonanceStore'

const resonanceStore = useresonanceStore()

const availableCommands = computed(() => resonanceStore.availableCommands)
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
      resonanceStore.currentImage = `/images/default-${Math.floor(Math.random() * 5)}.webp`
      break
    case 'addChapter':
      resonanceStore.addChapter('New Chapter')
      break
    case 'addText':
      resonanceStore.addTextToChapter('A soft sound colors the air...')
      break
    case 'addImage':
      resonanceStore.addImageToChapter(
        `/images/default-${Math.floor(Math.random() * 5)}.webp`,
      )
      break
    case 'saveStory':
      resonanceStore.saveStory()
      break
    default:
      console.warn(`[resonance-buttons] Unknown command: ${action}`)
      break
  }
}
</script>

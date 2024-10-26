<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields and remove buttons -->
    <div
      v-for="(prompt, index) in localPrompts"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <input
        v-model="localPrompts[index]"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter user prompt"
      />
      <button class="text-red-500" @click="removePrompt(index)">
        <Icon name="kind-icon:trash" class="w-6 h-6" />
      </button>
    </div>

    <!-- Button to add new prompts -->
    <button class="btn btn-primary mt-4" @click="addPrompt">
      Add New Prompt
    </button>

    <!-- Display final prompt string -->
    <h3 class="text-lg font-medium mt-4">Final Prompt String</h3>
    <p>{{ finalPromptString }}</p>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBotStore } from '@/stores/botStore'

// Access the botStore
const botStore = useBotStore()

// Local copy of the prompts, split from the current bot's userIntro
const localPrompts = ref<string[]>([])

// When component is mounted, sync localPrompts with bot's userIntro
onMounted(() => {
  if (botStore.currentBot?.userIntro) {
    localPrompts.value = botStore.currentBot.userIntro.split('|').map(prompt => prompt.trim())
  } else {
    localPrompts.value = [''] // Initialize with one empty prompt if no userIntro
  }
})

// Watch localPrompts and update the currentBot.userIntro in real time
watch(localPrompts, (newPrompts) => {
  botStore.currentBot!.userIntro = newPrompts.filter(prompt => prompt.trim() !== '').join(' | ')
}, { deep: true })

// Add new prompt to the local array
function addPrompt() {
  localPrompts.value.push('') // Add an empty prompt locally
}

// Remove a prompt from the local array
function removePrompt(index: number) {
  localPrompts.value.splice(index, 1) // Remove from local array
}

// Computed property to display the final constructed prompt string
const finalPromptString = computed(() => {
  return localPrompts.value.filter(prompt => prompt.trim() !== '').join(' | ')
})
</script>

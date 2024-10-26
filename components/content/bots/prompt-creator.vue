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
import { ref, computed, watch } from 'vue'
import { useBotStore } from '@/stores/botStore'

// Access the botStore
const botStore = useBotStore()

// Local copy of the prompts, split from the current bot's userIntro
const localPrompts = ref<string[]>([])

watch(
  () => botStore.botForm.userIntro,
  (newUserIntro) => {
    console.log('new intro')
    if (newUserIntro && localPrompts.value.join(' | ') !== newUserIntro) {
      localPrompts.value = newUserIntro.split('|') // Only update if different
    } else if (!newUserIntro) {
      localPrompts.value = [''] // Initialize with one empty prompt if no userIntro
    }
  },
)

watch(
  localPrompts,
  (newPrompts) => {
    console.log('new prompt')
    const newUserIntro = newPrompts.join(' | ')
    if (botStore.botForm.userIntro !== newUserIntro) {
      botStore.botForm.userIntro = newUserIntro // Only update if different
    }
  },
  { deep: true },
)

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
  return localPrompts.value.join(' | ') // Preserve spaces in the final string
})
</script>

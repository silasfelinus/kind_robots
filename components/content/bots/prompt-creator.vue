<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields and remove buttons -->
    <div
      v-for="(prompt, index) in promptStore.promptArray"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <input
        v-model="promptStore.promptArray[index]"
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
    <p>{{ promptStore.finalPromptString }}</p>

    <!-- Save icon that appears when updating -->
    <div v-if="showSaveIcon" class="flex items-center space-x-2">
      <Icon name="kind-icon:save" class="w-6 h-6 text-green-500" />
      <span>Saving...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useBotStore } from '@/stores/botStore'

// Access the promptStore and botStore
const promptStore = usePromptStore()
const botStore = useBotStore()

// Save icon visibility state
const showSaveIcon = ref(false)

// Function to save the final prompt string to botForm or currentBot
async function saveUserIntroToBot() {
  showSaveIcon.value = true // Show the save icon when update starts

  const finalPromptString = promptStore.finalPromptString // Get the final prompt string from the promptStore

  try {
    // If currentBot exists, save to currentBot; otherwise, save to botForm
    if (botStore.currentBot) {
      await botStore.saveUserIntro(finalPromptString) // Save to the current bot
    } else {
      botStore.botForm.userIntro = finalPromptString // Temporarily store in botForm
      console.log('Saved user intro to botForm:', finalPromptString)
    }

    setTimeout(() => {
      showSaveIcon.value = false // Hide the icon after 500ms
    }, 500)
  } catch (error) {
    console.error('Failed to save user intro:', error)
    showSaveIcon.value = false // Hide the icon in case of failure
  }
}

// Watch for changes in the promptArray and trigger save
watch(
  () => promptStore.promptArray,
  () => {
    saveUserIntroToBot() // Automatically save to botStore or botForm whenever the prompt array changes
  },
  { deep: true },
)

// Add new prompt to the array
function addPrompt() {
  promptStore.addPromptToArray('') // Add an empty prompt using the store action
}

// Remove a prompt from the array
function removePrompt(index: number) {
  promptStore.removePromptFromArray(index) // Remove the prompt using the store action
}
</script>

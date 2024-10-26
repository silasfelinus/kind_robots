<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields and remove buttons -->
    <div
      v-for="(prompt, index) in currentPrompts"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <input
        v-model="currentPrompts[index]"
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

    <!-- Save icon that appears when updating -->
    <div v-if="showSaveIcon" class="flex items-center space-x-2">
      <Icon name="kind-icon:save" class="w-6 h-6 text-green-500" />
      <span>Saving...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useBotStore } from '@/stores/botStore'

// Access the promptStore and botStore
const promptStore = usePromptStore()
const botStore = useBotStore()

// Save icon visibility state
const showSaveIcon = ref(false)

// To store the previous prompt string to avoid unnecessary saves
const lastSavedPromptString = ref('')

// Debounce timeout
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

// Boolean to determine if we are creating a new bot or updating
const isCreatingNewBot = computed(() => !botStore.currentBot)

// Computed property to determine which prompts to use (botForm for new, currentBot for update)
const currentPrompts = computed({
  get() {
    return isCreatingNewBot.value
      ? promptStore.promptArray
      : botStore.currentBot?.userIntro?.split(' | ') || []
  },
  set(value: string[]) {
    if (isCreatingNewBot.value) {
      promptStore.promptArray = value
    } else if (botStore.currentBot) {
      botStore.currentBot.userIntro = value.join(' | ')
    }
  },
})

// Computed property for the final prompt string
const finalPromptString = computed(() => {
  return currentPrompts.value.join(' | ')
})

// Function to save the final prompt string to botForm or currentBot
async function saveUserIntroToBot() {
  const finalPromptString = currentPrompts.value.join(' | ') // Get the final prompt string

  // Only save if the new prompt string differs from the last saved one
  if (finalPromptString === lastSavedPromptString.value) return

  showSaveIcon.value = true // Show the save icon when update starts

  try {
    // If updating an existing bot, save to currentBot; otherwise, save to botForm
    if (botStore.currentBot) {
      await botStore.saveUserIntro(finalPromptString) // Save to the current bot
    } else {
      botStore.botForm.userIntro = finalPromptString // Temporarily store in botForm for new bot creation
      console.log('Saved user intro to botForm:', finalPromptString)
    }

    lastSavedPromptString.value = finalPromptString // Update the last saved prompt string

    setTimeout(() => {
      showSaveIcon.value = false // Hide the icon after 500ms
    }, 500)
  } catch (error) {
    console.error('Failed to save user intro:', error)
    showSaveIcon.value = false // Hide the icon in case of failure
  }
}

// Debounced save function
function debouncedSave() {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    saveUserIntroToBot()
  }, 300) // Adjust delay as necessary
}

// Watch for changes in currentPrompts and trigger save
watch(
  () => currentPrompts.value,
  () => {
    debouncedSave() // Debounce the save function to avoid excessive calls
  },
  { deep: true },
)

// Add new prompt to the array
function addPrompt() {
  currentPrompts.value = [...currentPrompts.value, ''] // Add an empty prompt
}

// Remove a prompt from the array
function removePrompt(index: number) {
  const updatedPrompts = [...currentPrompts.value]
  updatedPrompts.splice(index, 1)
  currentPrompts.value = updatedPrompts // Update the prompts after removal
}
</script>

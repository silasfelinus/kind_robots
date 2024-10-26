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

    <!-- Save icon that appears when updating -->
    <div v-if="showSaveIcon" class="flex items-center space-x-2">
      <Icon name="kind-icon:save" class="w-6 h-6 text-green-500" />
      <span>Saving...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBotStore } from '@/stores/botStore'

// Access the botStore
const botStore = useBotStore()

// Local copy of the prompts, split from the current bot's userIntro
const localPrompts = ref<string[]>([])

// Save icon visibility state
const showSaveIcon = ref(false)

// Delay function to simulate a small pause before updating the botForm.userIntro
function delayedUpdate(newPrompts: string[]) {
  showSaveIcon.value = true // Show the save icon when update starts

  setTimeout(() => {
    const newUserIntro = newPrompts.join(' | ')
    if (botStore.botForm.userIntro !== newUserIntro) {
      botStore.botForm.userIntro = newUserIntro
    }

    // Flash the save icon twice and then hide it
    setTimeout(() => {
      showSaveIcon.value = false
    }, 500) // Flash save icon for 500ms
  }, 300) // Introduce a 300ms delay before updating
}

// Watch botForm.userIntro to update the localPrompts when switching bots
watch(
  () => botStore.botForm.userIntro,
  (newUserIntro) => {
    if (newUserIntro && localPrompts.value.join(' | ') !== newUserIntro) {
      localPrompts.value = newUserIntro.split('|') // Only update if different
    } else if (!newUserIntro) {
      localPrompts.value = [''] // Initialize with one empty prompt if no userIntro
    }
  },
)

// Watch localPrompts and update botForm.userIntro with a delay
watch(
  localPrompts,
  (newPrompts) => {
    delayedUpdate(newPrompts) // Use delayed update with a save icon flash
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

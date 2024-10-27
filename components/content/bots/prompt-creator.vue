<template>
  <div>
    <h2 class="text-lg font-medium mb-2">User Intro Prompts</h2>

    <!-- Display all prompts with input fields and remove buttons -->
    <div
      v-for="(prompt, index) in currentPrompts"
      :key="index"
      class="flex items-center space-x-4 mb-4"
    >
      <textarea
        v-model="currentPrompts[index]"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter user prompt"
        @keyup.enter="handleEnterKey"
      ></textarea>
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

const promptStore = usePromptStore()
const botStore = useBotStore()

const showSaveIcon = ref(false)

const lastSavedPromptString = ref('')

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const isCreatingNewBot = computed(() => !botStore.currentBot)

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

const finalPromptString = computed(() => {
  return currentPrompts.value.join(' | ')
})

async function saveUserIntroToBot() {
  const finalPromptString = currentPrompts.value.join(' | ')

  if (finalPromptString === lastSavedPromptString.value) return

  showSaveIcon.value = true
  const minSaveTime = 1000

  try {
    const saveStart = Date.now()

    if (botStore.currentBot) {
      await botStore.saveUserIntro(finalPromptString)
    } else {
      botStore.botForm.userIntro = finalPromptString
    }

    lastSavedPromptString.value = finalPromptString

    const elapsed = Date.now() - saveStart
    const remainingTime = Math.max(0, minSaveTime - elapsed)

    setTimeout(() => {
      showSaveIcon.value = false
    }, remainingTime)
  } catch (error) {
    console.error('Failed to save user intro:', error)
    showSaveIcon.value = false
  }
}

function debouncedSave() {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    saveUserIntroToBot()
  }, 300)
}

watch(
  () => currentPrompts.value,
  () => {
    debouncedSave()
  },
  { deep: true },
)

function addPrompt() {
  currentPrompts.value = [...currentPrompts.value, '']
}

function removePrompt(index: number) {
  const updatedPrompts = [...currentPrompts.value]
  updatedPrompts.splice(index, 1)
  currentPrompts.value = updatedPrompts
}

function handleEnterKey() {
  saveUserIntroToBot()
}
</script>

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
import { ref, computed, watch, onMounted } from 'vue'
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
    const prompts = isCreatingNewBot.value
      ? promptStore.promptArray
      : botStore.currentBot?.userIntro?.split(' | ') || []
    console.log('Getting currentPrompts:', prompts)
    return prompts
  },
  set(value: string[]) {
    console.log('Setting currentPrompts to:', value)
    if (isCreatingNewBot.value) {
      promptStore.promptArray = value
    } else if (botStore.currentBot) {
      botStore.currentBot.userIntro = value.join(' | ')
    }
  },
})

const finalPromptString = computed(() => {
  const finalString = currentPrompts.value.join(' | ')
  console.log('Computed finalPromptString:', finalString)
  return finalString
})

async function saveUserIntroToBot() {
  const finalPromptString = currentPrompts.value.join(' | ')
  console.log(
    'Attempting to save:',
    finalPromptString,
    'Last saved:',
    lastSavedPromptString.value,
  )

  if (finalPromptString === lastSavedPromptString.value) return

  showSaveIcon.value = true
  const minSaveTime = 1000

  try {
    const saveStart = Date.now()

    if (botStore.currentBot) {
      console.log('Saving userIntro to botStore.currentBot')
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
    console.log('Debounced save triggered')
    saveUserIntroToBot()
  }, 300)
}

watch(
  () => JSON.stringify(currentPrompts.value),
  (newPrompts, oldPrompts) => {
    const parsedNewPrompts = JSON.parse(newPrompts)
    const parsedOldPrompts = JSON.parse(oldPrompts)

    // Skip logging if the new prompts are temporarily empty
    if (parsedNewPrompts.length === 0 && parsedOldPrompts.length > 0) {
      console.log('currentPrompts temporarily emptied; skipping update')
      return
    }

    // Log only if there is a meaningful change
    if (newPrompts !== oldPrompts) {
      console.log('currentPrompts actually changed from:', parsedOldPrompts)
      console.log('currentPrompts changed to:', parsedNewPrompts)
      debouncedSave()
    } else {
      console.log('currentPrompts reference changed but content is identical')
    }
  },
)

function addPrompt() {
  currentPrompts.value = [...currentPrompts.value, '']
  console.log('Added a new prompt, currentPrompts:', currentPrompts.value)
}

function removePrompt(index: number) {
  const updatedPrompts = [...currentPrompts.value]
  updatedPrompts.splice(index, 1)
  currentPrompts.value = updatedPrompts
  console.log('Removed a prompt, currentPrompts:', currentPrompts.value)
}

function handleEnterKey() {
  console.log('Enter key pressed, saving user intro')
  saveUserIntroToBot()
}

onMounted(() => {
  console.log('PromptCreator component mounted')
  console.log('Initial currentPrompts:', currentPrompts.value)
  console.log('Initial finalPromptString:', finalPromptString.value)
})
</script>

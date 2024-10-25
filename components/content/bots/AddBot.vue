<template>
  <div
    class="rounded-2xl border p-6 m-4 max-w-screen-lg mx-auto bg-base-200 space-y-6"
  >
    <h1 class="text-4xl mb-6 text-center">Create or Edit a Bot</h1>

    <!-- Bot Selection Dropdown -->
    <div class="w-full">
      <label for="selectBot" class="block text-lg font-medium mb-2"
        >Select Existing Bot:</label
      >
      <select
        id="selectBot"
        v-model="selectedBotId"
        class="w-full p-3 rounded-lg border"
        @change="loadBotData"
      >
        <option value="" disabled>Select a bot</option>
        <option v-for="bot in botStore.bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>

    <!-- Feedback Message -->
    <div
      v-if="botFeedbackMessage"
      :class="botFeedbackClass"
      class="p-3 rounded-lg w-full text-center"
    >
      {{ botFeedbackMessage }}
    </div>

    <!-- Avatar Image and Generation Component -->
    <generate-avatar />

    <!-- Form for Bot Details -->
    <form
      class="bg-white shadow-md rounded-xl p-6 w-full"
      @submit.prevent="handleSubmit"
    >
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Name Field -->
        <div class="col-span-1">
          <label for="name" class="block text-lg font-medium">Name:</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="w-full p-3 rounded-lg border"
            required
          />
        </div>

        <!-- Subtitle Field -->
        <div class="col-span-1">
          <label for="subtitle" class="block text-lg font-medium"
            >Subtitle:</label
          >
          <input
            id="subtitle"
            v-model="subtitle"
            type="text"
            class="w-full p-3 rounded-lg border"
          />
        </div>

        <!-- Description Field -->
        <div class="col-span-1 md:col-span-2">
          <label for="description" class="block text-lg font-medium"
            >Description:</label
          >
          <textarea
            id="description"
            v-model="description"
            rows="4"
            class="w-full p-3 rounded-lg border"
            placeholder="Enter a short description for the bot"
          ></textarea>
        </div>

        <!-- User Intro (PromptCreator Component) -->
        <div class="col-span-1 md:col-span-2">
          <PromptCreator @update-prompts="updatePrompts" />
        </div>

        <!-- Public Visibility -->
        <div class="col-span-1">
          <label for="isPublic" class="block text-lg font-medium"
            >Public Visibility:</label
          >
          <select
            id="isPublic"
            v-model="isPublic"
            class="w-full p-3 rounded-lg border"
          >
            <option :value="true">Public</option>
            <option :value="false">Private</option>
          </select>
        </div>

        <!-- Under Construction -->
        <div class="col-span-1 flex items-center">
          <input
            id="underConstruction"
            v-model="underConstruction"
            type="checkbox"
            class="mr-2"
          />
          <label for="underConstruction" class="block text-lg font-medium">
            Mark as under construction
          </label>
        </div>
      </div>

      <!-- Form Feedback & Submit Buttons -->
      <div v-if="isLoading" class="loading loading-ring loading-lg"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </div>

      <!-- Two Buttons -->
      <div class="flex flex-col md:flex-row md:space-x-4 mt-6">
        <!-- Edit Bot Button (only if editing) -->
        <button
          v-if="selectedBotId && !isNameChanged"
          type="submit"
          class="btn btn-primary w-full md:w-auto"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Editing...</span>
          <span v-else>Edit Bot</span>
        </button>

        <!-- Save as New Bot Button (if name is changed or no bot selected) -->
        <button
          v-if="!selectedBotId || isNameChanged"
          type="button"
          class="btn btn-success w-full md:w-auto"
          :disabled="isLoading"
          @click="handleSaveNewBot"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save as New Bot</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useUserStore } from './../../../stores/userStore'
import { usePromptStore } from './../../../stores/promptStore'

// Store and form references
const botStore = useBotStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()
const promptStore = usePromptStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const selectedBotId = ref<number | null>(null)
const originalBotName = ref<string | null>(null)
const botFeedbackMessage = ref<string | null>(null)
const botFeedbackClass = ref<string>('')

// Form fields
const name = ref('')
const subtitle = ref('')
const description = ref('')
const botIntro = ref('')
const isPublic = ref(true)
const underConstruction = ref(false)
const userId = computed(() => userStore.userId)

// Computed to track if the name has changed
const isNameChanged = computed(
  () => originalBotName.value && originalBotName.value !== name.value,
)

// Load the data of the selected bot into the form fields
function loadBotData() {
  const bot = botStore.bots.find((b) => b.id === selectedBotId.value)
  if (bot) {
    originalBotName.value = bot.name
    name.value = bot.name || ''
    subtitle.value = bot.subtitle || ''
    description.value = bot.description || ''
    botIntro.value = bot.botIntro || ''

    // Load existing prompts into the promptStore
    promptStore.updatePromptArray(bot.userIntro ? bot.userIntro.split(' ') : [])

    isPublic.value = bot.isPublic ?? true
    underConstruction.value = bot.underConstruction ?? false
    botFeedbackMessage.value = `Editing Bot: ${bot.name}`
    botFeedbackClass.value = 'bg-blue-100 text-blue-700'
    botStore.currentBot = bot
    botStore.currentImagePath = bot.avatarImage || ''
  } else {
    resetForm()
  }
}

// Reset the form fields
function resetForm() {
  originalBotName.value = null
  name.value = ''
  subtitle.value = ''
  description.value = ''
  botIntro.value = ''
  promptStore.updatePromptArray([]) // Reset prompt array in store
  isPublic.value = true
  underConstruction.value = false
  botFeedbackMessage.value = 'Creating a New Bot'
  botFeedbackClass.value = 'bg-green-100 text-green-700'
}

// Update prompts in promptStore from PromptCreator
function updatePrompts(newPrompts: string[]) {
  promptStore.updatePromptArray(newPrompts)
}

// Handle form submission (Edit bot)
async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const botData = {
      name: name.value,
      subtitle: subtitle.value ?? '',
      description: description.value ?? '',
      botIntro: botIntro.value ?? '',
      userIntro: promptStore.promptArray.join(' '), // Save prompts as a single string from store
      imagePath: botStore.currentImagePath,
      isPublic: isPublic.value,
      underConstruction: underConstruction.value,
      userId: userId.value,
    }

    if (selectedBotId.value) {
      await botStore.updateBot(selectedBotId.value, botData)
      successMessage.value = 'Bot updated successfully!'
    }
  } catch (error) {
    errorMessage.value = 'Error editing bot: ' + error
  } finally {
    isLoading.value = false
  }
}

// Handle save as new bot
async function handleSaveNewBot() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const botData = {
      name: name.value,
      subtitle: subtitle.value ?? '',
      description: description.value ?? '',
      botIntro: botIntro.value ?? '',
      userIntro: promptStore.promptArray.join(' '), // Save prompts as a single string from store
      imagePath: botStore.currentImagePath,
      isPublic: isPublic.value,
      underConstruction: underConstruction.value,
      userId: userId.value,
    }

    await botStore.addBots([botData])
    successMessage.value = 'New bot created successfully!'
  } catch (error) {
    errorMessage.value = 'Error saving bot: ' + error
  } finally {
    isLoading.value = false
  }
}

// Initialize stores when the component is mounted
onMounted(async () => {
  await botStore.loadStore()
  await galleryStore.initializeStore()
})
</script>

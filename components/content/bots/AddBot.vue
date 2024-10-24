<template>
  <div class="rounded-2xl border p-4 m-4 flex flex-col items-center bg-base-200">
    <h1 class="text-3xl mb-4 text-center">Create or Edit a Bot</h1>

    <!-- Bot Selection Dropdown -->
    <div class="w-full max-w-4xl mx-auto mb-6">
      <label for="selectBot" class="block text-sm font-medium">Select Existing Bot:</label>
      <select
        id="selectBot"
        v-model="selectedBotId"
        class="w-full p-2 rounded border"
        @change="loadBotData"
      >
        <option value="" disabled>Select a bot</option>
        <option v-for="bot in botStore.bots" :key="bot.id" :value="bot.id">{{ bot.name }}</option>
      </select>
    </div>

    <!-- Feedback Message -->
    <div v-if="botFeedbackMessage" :class="botFeedbackClass" class="p-3 rounded-lg mb-4 w-full max-w-4xl text-center">
      {{ botFeedbackMessage }}
    </div>

    <!-- Avatar Image and Generation Component -->
    <generate-avatar />

    <!-- Form for Bot Details -->
    <form class="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-auto" @submit.prevent="handleSubmit">
      <div class="flex flex-wrap -mx-2">
        <!-- Name Field -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="name" class="block text-sm font-medium">Name:</label>
          <input id="name" v-model="name" type="text" class="w-full p-2 rounded border" required />
        </div>

        <!-- Subtitle Field -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="subtitle" class="block text-sm font-medium">Subtitle:</label>
          <input id="subtitle" v-model="subtitle" type="text" class="w-full p-2 rounded border" />
        </div>

        <!-- Description Field -->
        <div class="px-2 w-full mb-4">
          <label for="description" class="block text-sm font-medium">Description:</label>
          <textarea
            id="description"
            v-model="description"
            rows="3"
            class="w-full p-2 rounded border"
            placeholder="Enter a short description for the bot"
          ></textarea>
        </div>

        <!-- Bot Intro -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="botIntro" class="block text-sm font-medium">Bot Intro:</label>
          <input
            id="botIntro"
            v-model="botIntro"
            type="text"
            class="w-full p-2 rounded border"
            placeholder="Bot introduction message"
          />
        </div>

        <!-- User Intro -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="userIntro" class="block text-sm font-medium">User Intro:</label>
          <input
            id="userIntro"
            v-model="userIntro"
            type="text"
            class="w-full p-2 rounded border"
            placeholder="Intro message for the user"
          />
        </div>

        <!-- Public Visibility -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="isPublic" class="block text-sm font-medium">Public Visibility:</label>
          <select id="isPublic" v-model="isPublic" class="w-full p-2 rounded border">
            <option :value="true">Public</option>
            <option :value="false">Private</option>
          </select>
        </div>

        <!-- Under Construction -->
        <div class="px-2 w-full md:w-1/2 mb-4 flex items-center">
          <input id="underConstruction" v-model="underConstruction" type="checkbox" class="mr-2" />
          <label for="underConstruction" class="block text-sm font-medium">Mark as under construction</label>
        </div>
      </div>

      <!-- Form Feedback & Submit Buttons -->
      <span v-if="isLoading" class="loading loading-ring loading-lg"></span>
      <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-500 mt-2">{{ successMessage }}</div>

      <!-- Two Buttons -->
      <div class="flex space-x-4">
        <!-- Edit Bot Button (only if editing) -->
        <button v-if="selectedBotId && !isNameChanged" type="submit" class="btn btn-primary w-full" :disabled="isLoading">
          <span v-if="isLoading">Editing...</span>
          <span v-else>Edit Bot</span>
        </button>

        <!-- Save as New Bot Button (if name is changed or no bot selected) -->
        <button v-if="!selectedBotId || isNameChanged" type="button" class="btn btn-success w-full" @click="handleSaveNewBot" :disabled="isLoading">
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save as New Bot</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useGalleryStore } from './../../../stores/galleryStore'
import { useUserStore } from './../../../stores/userStore'

// Store and form references
const botStore = useBotStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const selectedBotId = ref<number | null>(null)
const originalBotName = ref<string | null>(null) // For name change tracking
const botFeedbackMessage = ref<string | null>(null)
const botFeedbackClass = ref<string>('')

// Form fields
const name = ref('')
const subtitle = ref('')
const description = ref('')
const botIntro = ref('')
const userIntro = ref('')
const isPublic = ref(true)
const underConstruction = ref(false)
const userId = computed(() => userStore.userId)

// Computed to track if the name has changed
const isNameChanged = computed(() => originalBotName.value && originalBotName.value !== name.value)

// Load the data of the selected bot into the form fields
function loadBotData() {
  const bot = botStore.bots.find((b) => b.id === selectedBotId.value)
  if (bot) {
    originalBotName.value = bot.name // Store original name
    name.value = bot.name || ''
    subtitle.value = bot.subtitle || ''
    description.value = bot.description || ''
    botIntro.value = bot.botIntro || ''
    userIntro.value = bot.userIntro || ''
    isPublic.value = bot.isPublic ?? true
    underConstruction.value = bot.underConstruction ?? false
    botFeedbackMessage.value = `Editing Bot: ${bot.name}`
    botFeedbackClass.value = 'bg-blue-100 text-blue-700'
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
  userIntro.value = ''
  isPublic.value = true
  underConstruction.value = false
  botFeedbackMessage.value = 'Creating a New Bot'
  botFeedbackClass.value = 'bg-green-100 text-green-700'
}

// Watch for changes in selectedBotId to load bot data
watch(selectedBotId, (newBotId) => {
  if (newBotId) {
    loadBotData()
  } else {
    resetForm()
  }
})

// Handle form submission (Edit bot)
async function handleSubmit(e: Event) {
  e.preventDefault()
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const botData = {
      name: name.value,
      subtitle: subtitle.value ?? '',
      description: description.value ?? '',
      botIntro: botIntro.value ?? '',
      userIntro: userIntro.value ?? '',
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
      userIntro: userIntro.value ?? '',
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

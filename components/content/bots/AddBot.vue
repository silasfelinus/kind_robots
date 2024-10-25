<template>
  <div class="rounded-2xl border p-2 m-2 mx-auto bg-base-200 space-y-2">
    <h1 class="text-4xl text-center">Create or Edit a Bot</h1>

    <!-- Bot Selection Dropdown -->
    <div class="w-full">
      <label for="selectBot" class="block text-lg font-medium mb-2">Select Existing Bot:</label>
      <select
        id="selectBot"
        v-model="selectedBotId"
        class="w-full p-3 rounded-lg border"
        @change="loadBotData"
      >
        <option value="" disabled>Select a bot</option>
        <option v-for="bot in botStore.bots" :key="bot.id" :value="bot.id">{{ bot.name }}</option>
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

    <!-- Designer Field -->
    <div class="col-span-1">
      <label for="designer" class="block text-lg font-medium">Designer:</label>
      <input
        v-if="canEditDesigner"
        id="designer"
        v-model="designer"
        type="text"
        class="w-full p-3 rounded-lg border"
      />
      <p v-else>{{ designer }}</p>
    </div>

    <!-- Avatar Image and Generation Component -->
    <generate-avatar />

    <!-- Form for Bot Details -->
    <form class="bg-white shadow-md rounded-xl p-6 w-full" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <!-- Name Field -->
        <div class="col-span-1">
          <label for="name" class="block text-lg font-medium">Name:</label>
          <input id="name" v-model="name" type="text" class="w-full p-3 rounded-lg border" required />
        </div>

        <!-- Subtitle Field -->
        <div class="col-span-1">
          <label for="subtitle" class="block text-lg font-medium">Subtitle:</label>
          <input id="subtitle" v-model="subtitle" type="text" class="w-full p-3 rounded-lg border" />
        </div>

        <!-- Description Field -->
        <div class="col-span-1 md:col-span-2">
          <label for="description" class="block text-lg font-medium">Description:</label>
          <textarea
            id="description"
            v-model="description"
            rows="4"
            class="w-full p-3 rounded-lg border"
            placeholder="Enter a short description for the bot"
          ></textarea>
        </div>

        <!-- Prompt Creator Component -->
        <div class="col-span-1 md:col-span-2">
          <label for="userIntro" class="block text-lg font-medium">Bot Prompts:</label>
          <prompt-creator />
        </div>

        <!-- Public Visibility Toggle -->
        <div class="col-span-1">
          <label class="block text-lg font-medium">Public Visibility:</label>
          <div class="flex space-x-2">
            <button
              type="button"
              :class="{
                'btn btn-primary': isPublic,
                'btn btn-secondary': !isPublic
              }"
              @click="toggleVisibility(true)"
            >
              Public
            </button>
            <button
              type="button"
              :class="{
                'btn btn-primary': !isPublic,
                'btn btn-secondary': isPublic
              }"
              @click="toggleVisibility(false)"
            >
              Private
            </button>
          </div>
        </div>

        <div class="col-span-1 flex items-center">
          <input id="underConstruction" v-model="underConstruction" type="checkbox" class="mr-2" />
          <label for="underConstruction" class="block text-lg font-medium">Mark as under construction</label>
        </div>
      </div>

      <!-- Form Feedback & Submit Buttons -->
      <div v-if="isLoading" class="loading loading-ring loading-lg"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-500 mt-2">{{ successMessage }}</div>

      <!-- Submit Button -->
      <div class="flex flex-col md:flex-row md:space-x-4 mt-6">
        <button type="submit" class="btn btn-primary w-full md:w-auto" :disabled="isLoading">
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save Bot</span>
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

const name = ref('')
const subtitle = ref('')
const description = ref('')
const designer = ref('')
const botIntro = ref('')
const isPublic = ref(true)
const underConstruction = ref(false)

const canEditDesigner = computed(() => {
  const bot = botStore.currentBot
  return bot && bot.userId === userStore.userId
})

function loadBotData() {
  const bot = botStore.bots.find((b) => b.id === selectedBotId.value)
  if (bot) {
    originalBotName.value = bot.name
    name.value = bot.name || ''
    subtitle.value = bot.subtitle || ''
    description.value = bot.description || ''
    designer.value = bot.designer || 'Unknown'
    botIntro.value = bot.botIntro || ''
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

function resetForm() {
  originalBotName.value = null
  name.value = ''
  subtitle.value = ''
  description.value = ''
  designer.value = ''
  botIntro.value = ''
  promptStore.updatePromptArray([])
  isPublic.value = true
  underConstruction.value = false
  botFeedbackMessage.value = 'Creating a New Bot'
  botFeedbackClass.value = 'bg-green-100 text-green-700'
}

function toggleVisibility(value: boolean) {
  isPublic.value = value
}

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
      designer: designer.value,
      userIntro: promptStore.promptArray.join(' '),
      imagePath: botStore.currentImagePath,
      isPublic: isPublic.value,
      underConstruction: underConstruction.value,
      userId: userStore.userId,
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

onMounted(async () => {
  await botStore.loadStore()
  await galleryStore.initializeStore()
})
</script>

<template>
  <div class="rounded-2xl border p-2 m-2 flex flex-col items-center">
    <h1 class="text-3xl mb-4 text-center">Create or Edit a Bot</h1>

    <!-- Bot Selection Dropdown -->
    <div class="w-full max-w-4xl mx-auto mb-6">
      <label for="selectBot" class="block text-sm font-medium"
        >Select Existing Bot:</label
      >
      <select
        id="selectBot"
        v-model="selectedBotId"
        class="w-full p-2 rounded border"
        @change="loadBotData"
      >
        <option value="" disabled>Select a bot</option>
        <option v-for="bot in botStore.bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>

    <form
      class="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-auto"
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-wrap -mx-2">
        <!-- Name -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="name" class="block text-sm font-medium">Name:</label>
          <input
            id="name"
            v-model="name"
            type="text"
            class="w-full p-2 rounded border"
            required
          />
        </div>

        <!-- Subtitle -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="subtitle" class="block text-sm font-medium"
            >Subtitle:</label
          >
          <input
            id="subtitle"
            v-model="subtitle"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>

        <!-- Description -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="description" class="block text-sm font-medium"
            >Description:</label
          >
          <textarea
            id="description"
            v-model="description"
            class="resize w-full p-2 rounded border"
          ></textarea>
        </div>

        <!-- Avatar Image URL -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="avatarImageInput" class="block text-sm font-medium"
            >Avatar Image (URL):</label
          >
          <input
            id="avatarImageInput"
            v-model="avatarImage"
            type="text"
            class="w-full p-2 rounded border"
            placeholder="Enter a custom avatar image URL"
          />
          <div class="mt-2">
            <img
              :src="avatarImage || '/images/default-avatar.png'"
              alt="Avatar Preview"
              class="w-32 h-32 object-cover"
            />
          </div>
        </div>

        <!-- Image Prompt -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="imagePrompt" class="block text-sm font-medium"
            >Image Prompt:</label
          >
          <input
            id="imagePrompt"
            v-model="imagePrompt"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>

        <!-- Bot Introduction -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="botIntro" class="block text-sm font-medium"
            >Bot Introduction:</label
          >
          <input
            id="botIntro"
            v-model="botIntro"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>

        <!-- User Introduction -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="userIntro" class="block text-sm font-medium"
            >User Introduction:</label
          >
          <input
            id="userIntro"
            v-model="userIntro"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>

        <!-- Prompt -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="prompt" class="block text-sm font-medium">Prompt:</label>
          <textarea
            id="prompt"
            v-model="prompt"
            class="resize w-full p-2 rounded border"
          ></textarea>
        </div>

        <!-- Sample Response -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="sampleResponse" class="block text-sm font-medium"
            >Sample Response:</label
          >
          <textarea
            id="sampleResponse"
            v-model="sampleResponse"
            class="resize w-full p-2 rounded border"
          ></textarea>
        </div>

        <!-- Public Checkbox -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="isPublic" class="block text-sm font-medium"
            >Is Public:</label
          >
          <input
            id="isPublic"
            v-model="isPublic"
            type="checkbox"
            class="p-2 rounded border"
          />
        </div>

        <!-- Under Construction Checkbox -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="underConstruction" class="block text-sm font-medium"
            >Under Construction:</label
          >
          <input
            id="underConstruction"
            v-model="underConstruction"
            type="checkbox"
            class="p-2 rounded border"
          />
        </div>

        <!-- Theme -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="theme" class="block text-sm font-medium">Theme:</label>
          <input
            id="theme"
            v-model="theme"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>

        <!-- Personality -->
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="personality" class="block text-sm font-medium"
            >Personality:</label
          >
          <input
            id="personality"
            v-model="personality"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>
      </div>

      <!-- Bot Sample Component -->
      <bot-sample
        :name="name"
        :bot-type="botType"
        :subtitle="subtitle"
        :description="description"
        :avatar-image="avatarImage"
        :theme="theme"
        :under-construction="underConstruction"
        :bot-intro="botIntro"
        :user-intro="userIntro"
        :prompt="prompt"
        :personality="personality"
        :sample-response="sampleResponse"
      />

      <!-- Submit Button -->
      <span v-if="isLoading" class="loading loading-ring loading-lg"></span>
      <button type="submit" class="btn btn-success w-full">Save Bot</button>
    </form>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'

const botStore = useBotStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

const isLoading = ref(false)
const selectedBotId = ref<number | null>(null)

// Form fields with default values
const name = ref('')
const subtitle = ref('Kind Robot')
const botType = ref('PROMPTBOT')
const description = ref("I'm a kind robot")
const avatarImage = ref('/images/wonderchest/wonderchest304_(23).webp')
const botIntro = ref('SloganMaker')
const userIntro = ref('Help me make a slogan for')
const imagePrompt = ref('robot avatar')
const prompt = ref(
  'Arm butterflies with mini-flamethrowers to kick mosquitos butts',
)
const isPublic = ref(true)
const underConstruction = ref(false)
const theme = ref('')
const personality = ref('kind')
const sampleResponse = ref('')

// Fetch userId from userStore
const userId = computed(() => userStore.userId)

async function handleSubmit(e: Event) {
  e.preventDefault()

  try {
    const botData = {
      BotType: botType.value,
      name: name.value,
      subtitle: subtitle.value ?? '',
      description: description.value ?? '',
      avatarImage: avatarImage.value ?? '/images/default-avatar.png',
      botIntro: botIntro.value ?? '',
      userIntro: userIntro.value ?? '',
      prompt: prompt.value ?? '',
      isPublic: isPublic.value,
      underConstruction: underConstruction.value,
      theme: theme.value ?? '',
      personality: personality.value ?? '',
      sampleResponse: sampleResponse.value ?? '',
      userId: userId.value, // Ensure the bot is saved with the correct userId
    }

    if (selectedBotId.value && botStore.currentBot?.userId === userId.value) {
      // Update an existing bot if the user is the owner
      await botStore.updateBot(selectedBotId.value, botData)
    } else {
      // Create a new bot if user doesn't own the selected bot
      await botStore.addBots([botData])
    }

    console.log('Bot saved successfully!')
  } catch (error) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Error saving bot: ' + (error as Error).message,
    )
  }
}

// Load the data of the selected bot into the form fields
function loadBotData() {
  const bot = botStore.bots.find((b) => b.id === selectedBotId.value)
  if (bot) {
    if (bot.userId === userId.value) {
      // If user owns the bot, load its data
      name.value = bot.name ?? ''
      subtitle.value = bot.subtitle ?? '' // Ensuring subtitle is a string
      botType.value = bot.BotType ?? 'PROMPTBOT' // Correct case for BotType
      description.value = bot.description ?? ''
      avatarImage.value = bot.avatarImage ?? '/images/default-avatar.png'
      botIntro.value = bot.botIntro ?? ''
      userIntro.value = bot.userIntro ?? ''
      prompt.value = bot.prompt ?? ''
      isPublic.value = bot.isPublic ?? true
      underConstruction.value = bot.underConstruction ?? false
      theme.value = bot.theme ?? ''
      personality.value = bot.personality ?? ''
      sampleResponse.value = bot.sampleResponse ?? ''
    } else {
      // If user doesn't own the bot, reset the form and prepare to create a new bot
      resetForm()
    }
  } else {
    // Reset the form if no bot is selected
    resetForm()
  }
}

// Reset the form to default values
function resetForm() {
  name.value = ''
  subtitle.value = 'Kind Robot'
  botType.value = 'PROMPTBOT'
  description.value = "I'm a kind robot"
  avatarImage.value = '/images/wonderchest/wonderchest-1630.webp'
  botIntro.value = 'SloganMaker'
  userIntro.value = 'Help me make a slogan for'
  imagePrompt.value = 'robot avatar'
  prompt.value =
    'Arm butterflies with mini-flamethrowers to kick mosquitos butts'
  isPublic.value = true
  underConstruction.value = false
  theme.value = ''
  personality.value = 'kind'
  sampleResponse.value = ''
}

// Watch for selectedBotId changes to load bot data
watch(selectedBotId, () => {
  loadBotData()
})

// Initialize the botStore by fetching bots when the component is mounted
await botStore.loadStore()
</script>

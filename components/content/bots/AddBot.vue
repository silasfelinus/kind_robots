<template>
  <div class="rounded-2xl border p-2 m-2 flex flex-col items-center">
    <h1 class="text-3xl mb-4 text-center">Create a New Bot</h1>
    <form
      class="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-auto"
      @submit.prevent="handleSubmit"
    >
      <div class="flex flex-wrap -mx-2">
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
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="description" class="block text-sm font-medium"
            >Description:</label
          >
          <textarea
            id="description"
            v-model="description"
            class="resize w-full p-2 rounded border"
          />
        </div>
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="avatarImage" class="block text-sm font-medium"
            >Avatar Image URL:</label
          >
          <div class="flex flex-wrap gap-4">
            <div
              v-for="(art, index) in artResults"
              :key="art.id"
              class="flex flex-col items-center"
            >
              <img
                :src="art.path || '/images/default-avatar.png'"
                alt="Generated Avatar"
                class="w-32 h-32 object-cover mb-2"
              />

              <button type="button" @click="generateOrFetchAvatar(index)">
                Generate Another
              </button>
              <button
                type="button"
                @click="selectAvatar(art.path || '/images/default-avatar.png')"
              >
                Select
              </button>
            </div>
          </div>
        </div>
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
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="prompt" class="block text-sm font-medium">Prompt:</label>
          <textarea
            id="prompt"
            v-model="prompt"
            class="resize w-full p-2 rounded border"
          />
        </div>
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="sampleResponse" class="block text-sm font-medium"
            >Sample Response:</label
          >
          <textarea
            id="sampleResponse"
            v-model="sampleResponse"
            class="resize w-full p-2 rounded border"
          />
          <button
            type="button"
            class="btn btn-primary mt-2"
            @click="testPrompt"
          >
            Test Prompt
          </button>
          <div
            v-if="promptTestResult"
            class="mt-2 text-green-500 animate-pulse"
          >
            Test Result: {{ promptTestResult }}
          </div>
        </div>
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
        <div class="px-2 w-full md:w-1/2 mb-4">
          <label for="theme" class="block text-sm font-medium">Theme:</label>
          <input
            id="theme"
            v-model="theme"
            type="text"
            class="w-full p-2 rounded border"
          />
        </div>
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
      <span v-if="isLoading" class="loading loading-ring loading-lg" />
      <button type="submit" class="btn btn-success w-full">Create Bot</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import { useArtStore, type Art } from './../../../stores/artStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'
import { useUserStore } from './../../../stores/userStore'

const botStore = useBotStore()
const artStore = useArtStore()
const userStore = useUserStore()
const errorStore = useErrorStore() // Use errorStore for managing errors

const isLoading = ref(false)

// Form fields
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
const userId = computed(() => userStore.userId)

const promptTestResult = ref<string | null>(null)

async function handleSubmit(e: Event) {
  e.preventDefault()

  try {
    const botData = {
      botType: botType.value,
      name: name.value,
      subtitle: subtitle.value,
      description: description.value,
      avatarImage: avatarImage.value,
      botIntro: botIntro.value,
      userIntro: userIntro.value,
      prompt: prompt.value,
      isPublic: isPublic.value,
      underConstruction: underConstruction.value,
      theme: theme.value,
      personality: personality.value,
      sampleResponse: sampleResponse.value,
      userId: userId.value,
    }

    const response = await botStore.addBots([botData])
    console.log(response)
  } catch (error) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Error creating bot: ' + (error as Error).message,
    )
  }
}

async function generateOrFetchAvatar(index?: number, promptOverride?: string) {
  try {
    isLoading.value = true
    const promptToUse = promptOverride || imagePrompt.value
    const result = await artStore.generateArt({ prompt: promptToUse })

    if (result.success && result.newArt?.path) {
      if (index !== undefined) {
        artResults.value[index] = result.newArt
      } else {
        avatarImage.value = result.newArt.path
      }
    } else if (!result.success) {
      throw new Error(result.message || 'Failed to generate or fetch avatar.')
    }
  } catch (error) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Error generating or fetching avatar: ' + (error as Error).message,
    )
  } finally {
    isLoading.value = false
  }
}

async function testPrompt() {
  try {
    const response = await fetch('/api/botcafe/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.value }),
    })

    if (response.ok) {
      const data = await response.json()
      promptTestResult.value = data.result // Adjust based on the API response structure
    } else {
      errorStore.setError(
        ErrorType.GENERAL_ERROR,
        'Error testing prompt: API response not OK',
      )
    }
  } catch (error) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      'Error testing prompt: ' + (error as Error).message,
    )
  }
}

// Method to select an avatar
const selectAvatar = (path: string) => {
  avatarImage.value = path
}

const artResults = ref<Art[]>([])

// Initialize with one avatar
generateOrFetchAvatar()
</script>

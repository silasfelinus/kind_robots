<template>
  <div class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-4 grid-cols-1">
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Bot</h1>

    <!-- Top section with Bot Selector, Designer, and Toggles -->
    <div class="flex flex-wrap justify-between items-center col-span-full gap-4">
      <div class="w-full lg:w-auto">
        <bot-selector />
      </div>

      <!-- Add Bot Icon (only shows if currentBot exists) -->
      <div v-if="botStore.currentBot" class="flex items-center">
        <button class="btn btn-icon" @click="deselectCurrentBot">
          <icon name="kind-icon:addbot" class="text-3xl" />
        </button>
        <p class="ml-2">Create new bot</p>
      </div>

      <!-- Designer Field -->
      <div class="flex-grow w-1/4">
        <label for="designer" class="block text-lg font-medium">Designer:</label>
        <input
          v-if="canEditDesigner"
          id="designer"
          v-model="botStore.botForm.designer"
          type="text"
          class="w-full p-3 rounded-lg border"
        />
        <p v-else>{{ botStore.botForm.designer }}</p>
      </div>

      <!-- Toggles for Public Visibility and Under Construction -->
      <div class="flex gap-4">
        <div>
          <label class="block text-lg font-medium">Public Visibility:</label>
          <div class="flex space-x-2">
            <button
              type="button"
              :class="{
                'btn btn-primary': botStore.botForm.isPublic,
                'btn btn-grey-200': !botStore.botForm.isPublic,
              }"
              @click="toggleVisibility(true)"
            >
              Public
            </button>
            <button
              type="button"
              :class="{
                'btn btn-primary': !botStore.botForm.isPublic,
                'btn btn-grey-200': botStore.botForm.isPublic,
              }"
              @click="toggleVisibility(false)"
            >
              Private
            </button>
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="underConstruction"
            v-model="botStore.botForm.underConstruction"
            type="checkbox"
            class="mr-2"
          />
          <label for="underConstruction" class="block text-lg font-medium">
            Under construction
          </label>
        </div>
      </div>
    </div>

    <!-- Middle section - Avatar Generator on the left, Bot Name & Details on the right -->
    <div class="flex flex-wrap w-full mt-4">
      <!-- Avatar Image and Generation Component -->
      <div class="w-full md:w-1/2 lg:w-1/2 p-4">
        <generate-avatar />
      </div>

      <!-- Bot Details: Name, Subtitle, Description, and Bot Intro -->
      <div class="w-full md:w-1/2 lg:w-1/2 p-4">
        <div class="grid gap-4">
          <!-- Name Field -->
          <div :class="highlightIfChanged('name')">
            <label for="name" class="block text-lg font-medium">Name:</label>
            <input
              id="name"
              v-model="botStore.botForm.name"
              type="text"
              class="w-full p-3 rounded-lg border"
              required
            />
          </div>

          <!-- Subtitle Field -->
          <div :class="highlightIfChanged('subtitle')">
            <label for="subtitle" class="block text-lg font-medium">Subtitle:</label>
            <input
              id="subtitle"
              v-model="botStore.botForm.subtitle"
              type="text"
              class="w-full p-3 rounded-lg border"
            />
          </div>

          <!-- Description Field -->
          <div :class="highlightIfChanged('description')">
            <label for="description" class="block text-lg font-medium">Description:</label>
            <input
              id="description"
              v-model="botStore.botForm.description"
              class="w-full p-3 rounded-lg border"
              placeholder="Enter a short description for the bot"
            />
          </div>

          <!-- Bot Intro Field -->
          <div :class="highlightIfChanged('botIntro')">
            <label for="botIntro" class="block text-lg font-medium">Bot Intro:</label>
            <textarea
              id="botIntro"
              v-model="botStore.botForm.botIntro"
              rows="4"
              class="w-full p-3 rounded-lg border"
              placeholder="Enter the introduction sent to the language modeller"
            ></textarea>
          </div>

          <label for="userIntro" class="block text-lg font-medium">User Prompts:</label>
          <prompt-creator />
        </div>
      </div>
    </div>

    <!-- Form for User Prompts and Submit Button -->
    <form class="bg-white shadow-md rounded-xl p-6 w-full mt-4" @submit.prevent="handleSubmit">
      <div v-if="isLoading" class="loading loading-ring loading-lg mt-4"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">{{ errorMessage }}</div>
      <div v-if="successMessage" class="text-green-500 mt-2">{{ successMessage }}</div>

      <div class="flex flex-col md:flex-row md:space-x-4 mt-6">
        <button type="submit" class="btn btn-primary w-full md:w-auto" :disabled="isLoading">
          <span v-if="isLoading">Saving...</span>
          <span v-else>{{ botStore.selectedBotId ? 'Update Bot' : 'Create New Bot' }}</span>
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

const botStore = useBotStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const botFeedbackMessage = ref<string | null>(null)

const canEditDesigner = computed(() => !botStore.selectedBotId || botStore.botForm.userId === userStore.userId)

function highlightIfChanged(field: string) {
  const original = botStore.currentBot || {}
  if (botStore.botForm[field as keyof typeof botStore.botForm] !== original[field as keyof typeof original]) {
    return 'border border-info'
  }
  return ''
}

function toggleVisibility(value: boolean) {
  botStore.botForm.isPublic = value
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    if (botStore.selectedBotId) {
      await botStore.updateBot(botStore.selectedBotId)
      successMessage.value = 'Bot updated successfully!'
    } else {
      const newBot = await botStore.addBot(botStore.botForm)
      if (newBot) {
        botStore.currentBot = newBot
        botStore.botForm = { ...newBot }
        successMessage.value = 'New bot created successfully!'
      } else {
        errorMessage.value = 'Failed to create a new bot.'
      }
    }
  } catch (error) {
    console.error('Error editing bot:', error)
    errorMessage.value = `Error editing bot: ${error}`
  } finally {
    isLoading.value = false
  }
}

function deselectCurrentBot() {
  botStore.deselectBot()
}

onMounted(async () => {
  await botStore.loadStore()
  await galleryStore.initializeStore()
})
</script>

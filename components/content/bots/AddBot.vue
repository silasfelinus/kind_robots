<template>
  <div
    class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  >
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Bot</h1>

    <bot-selector />

    <!-- Toggles for Public Visibility and Under Construction -->
    <div class="col-span-full flex justify-between items-center mb-4">
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
        <label for="underConstruction" class="block text-lg font-medium"
          >Mark as under construction</label
        >
      </div>
    </div>

    <!-- Feedback Message -->
    <div
      v-if="botFeedbackMessage"
      :class="botFeedbackClass"
      class="p-3 rounded-lg w-full text-center col-span-full"
    >
      {{ botFeedbackMessage }}
    </div>

    <!-- Designer Field -->
    <div class="col-span-full sm:col-span-1">
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

    <!-- Avatar Image and Generation Component -->
    <div class="col-span-full sm:col-span-1 lg:col-span-1">
      <generate-avatar />
    </div>

    <!-- Form for Bot Details -->
    <form
      class="bg-white shadow-md rounded-xl p-6 w-full col-span-full"
      @submit.prevent="handleSubmit"
    >
      <div
        class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <!-- Name Field -->
        <div
          :class="highlightIfChanged('name')"
          class="col-span-full sm:col-span-1"
        >
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
        <div
          :class="highlightIfChanged('subtitle')"
          class="col-span-full sm:col-span-1"
        >
          <label for="subtitle" class="block text-lg font-medium"
            >Subtitle:</label
          >
          <input
            id="subtitle"
            v-model="botStore.botForm.subtitle"
            type="text"
            class="w-full p-3 rounded-lg border"
          />
        </div>

        <!-- Description Field -->
        <div :class="highlightIfChanged('description')" class="col-span-full">
          <label for="description" class="block text-lg font-medium"
            >Description:</label
          >
          <textarea
            id="description"
            v-model="botStore.botForm.description"
            rows="4"
            class="w-full p-3 rounded-lg border"
            placeholder="Enter a short description for the bot"
          ></textarea>
        </div>

        <!-- Bot Intro Field -->
        <div :class="highlightIfChanged('botIntro')" class="col-span-full">
          <label for="botIntro" class="block text-lg font-medium"
            >Bot Intro:</label
          >
          <textarea
            id="botIntro"
            v-model="botStore.botForm.botIntro"
            rows="4"
            class="w-full p-3 rounded-lg border"
            placeholder="Enter the introduction sent to the language modeller"
          ></textarea>
        </div>

        <!-- Prompt Creator Component -->
        <div class="col-span-full">
          <label for="userIntro" class="block text-lg font-medium"
            >User Prompts:</label
          >
          <prompt-creator />
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

      <!-- Submit Button -->
      <div class="flex flex-col md:flex-row md:space-x-4 mt-6">
        <button
          type="submit"
          class="btn btn-primary w-full md:w-auto"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>{{
            botStore.selectedBotId ? 'Update Bot' : 'Create New Bot'
          }}</span>
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
const botFeedbackMessage = ref<string | null>(null)
const botFeedbackClass = ref<string>('')

// Determine if the designer field can be edited
const canEditDesigner = computed(
  () => !botStore.selectedBotId || botStore.botForm.userId === userStore.userId,
)

// Highlight any fields that have changed compared to the original bot
function highlightIfChanged(field: string) {
  const original = botStore.currentBot || {}
  if (
    botStore.botForm[field as keyof typeof botStore.botForm] !==
    original[field as keyof typeof original]
  ) {
    return 'border border-info' // Highlight changed fields
  }
  return ''
}

function toggleVisibility(value: boolean) {
  botStore.botForm.isPublic = value
}

async function handleSubmit() {
  isLoading.value = true
  try {
    const botData = {
      ...botStore.botForm,
      avatarImage: botStore.currentImagePath,
      userIntro: promptStore.promptArray.join(' | '), // Join prompt array into a single string
    }

    if (botStore.selectedBotId) {
      await botStore.updateBot(botStore.selectedBotId, botData.userIntro)
      successMessage.value = 'Bot updated successfully!'
      botFeedbackMessage.value = 'Bot saved successfully!'
    } else {
      await botStore.addBots([botData])
      successMessage.value = 'New bot created successfully!'
      botFeedbackMessage.value = 'New bot saved successfully!'
    }
  } catch (error) {
    console.error('Error editing bot:', error)
    errorMessage.value = `Error editing bot: ${error}`
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await botStore.loadStore()
  await galleryStore.initializeStore()
})
</script>

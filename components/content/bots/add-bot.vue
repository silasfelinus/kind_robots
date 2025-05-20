<!-- /components/content/bots/add-bot.vue -->
// /components/content/story/add-bot.vue
<template>
  <div
    class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-6 grid-cols-1"
  >
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Bot</h1>

    <!-- Bot Selector and Designer -->
    <div class="flex flex-wrap justify-between items-center gap-4">
      <bot-selector />

      <div v-if="botStore.currentBot" class="flex items-center">
        <button class="btn btn-icon" @click="deselectCurrentBot">
          <icon name="kind-icon:addbot" class="text-3xl" />
        </button>
        <p class="ml-2">Create new bot</p>
      </div>

      <div class="flex-grow max-w-xs">
        <label for="designer" class="block text-lg font-medium"
          >Designer:</label
        >
        <input
          v-if="canEditDesigner"
          id="designer"
          v-model="botStore.botForm.designer"
          type="text"
          class="w-full p-3 rounded-lg border"
        />
        <p v-else>{{ botStore.botForm.designer }}</p>
      </div>

      <!-- Visibility & Construction Toggles -->
      <div class="flex gap-6">
        <div>
          <label class="block text-lg font-medium">Visibility:</label>
          <div class="flex space-x-2">
            <button
              type="button"
              :class="
                botStore.botForm.isPublic
                  ? 'btn btn-primary'
                  : 'btn btn-outline'
              "
              @click="toggleVisibility(true)"
            >
              Public
            </button>
            <button
              type="button"
              :class="
                !botStore.botForm.isPublic
                  ? 'btn btn-primary'
                  : 'btn btn-outline'
              "
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
          <label for="underConstruction" class="text-lg font-medium">
            Under construction
          </label>
        </div>
      </div>
    </div>

    <!-- Avatar & Prompt Builder -->
    <div class="flex flex-wrap w-full mt-4">
      <div class="w-full md:w-1/2 p-4">
        <generate-avatar />
      </div>
      <div class="w-full md:w-1/2 p-4">
        <choice-manager label="name" model="Bot" />
        <choice-manager label="subtitle" model="Bot" />
        <choice-manager label="description" model="Bot" />
        <choice-manager label="personality" model="Bot" />

        <label for="botIntro" class="block text-lg font-medium mt-6"
          >Bot Intro:</label
        >
        <textarea
          id="botIntro"
          v-model="botStore.botForm.botIntro"
          rows="4"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter the introduction sent to the language modeller"
        ></textarea>

        <label for="userIntro" class="block text-lg font-medium mt-4"
          >User Prompts:</label
        >
        <prompt-creator />
      </div>
    </div>

    <!-- Submit Form -->
    <form
      class="bg-white shadow-md rounded-xl p-6 w-full mt-6"
      @submit.prevent="handleSubmit"
    >
      <div v-if="isLoading" class="loading loading-ring loading-lg mt-4"></div>
      <div v-if="errorMessage" class="text-red-500 mt-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-green-500 mt-2">
        {{ successMessage }}
      </div>

      <button type="submit" class="btn btn-primary mt-4" :disabled="isLoading">
        <span v-if="isLoading">Saving...</span>
        <span v-else>{{
          botStore.selectedBotId ? 'Update Bot' : 'Create New Bot'
        }}</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useUserStore } from '@/stores/userStore'
import { useChoiceStore } from '@/stores/choiceStore'

const botStore = useBotStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()
const choiceStore = useChoiceStore()

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const canEditDesigner = computed(() => {
  return !botStore.selectedBotId || botStore.botForm.userId === userStore.userId
})

function toggleVisibility(value: boolean) {
  botStore.botForm.isPublic = value
}

function deselectCurrentBot() {
  botStore.deselectBot()
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    // Sync choice store into botForm
    const fields = ['name', 'description', 'personality', 'subtitle']
    fields.forEach((field) => {
      choiceStore.applyToForm(botStore.botForm, field, 'Bot')
    })

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

onMounted(async () => {
  await botStore.initialize()
  await galleryStore.initialize()
  choiceStore.initialize()
})
</script>

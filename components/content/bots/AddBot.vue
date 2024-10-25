<template>
  <div
    class="rounded-2xl border p-4 m-4 mx-auto bg-base-200 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  >
    <h1 class="text-4xl text-center col-span-full">Create or Edit a Bot</h1>

    <bot-selector />

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
        v-model="designer"
        type="text"
        class="w-full p-3 rounded-lg border"
      />
      <p v-else>{{ designer }}</p>
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
        <div class="col-span-full sm:col-span-1">
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
        <div class="col-span-full sm:col-span-1">
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
        <div class="col-span-full">
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

        <!-- bot Intro Field -->
        <div class="col-span-full">
          <label for="botIntro" class="block text-lg font-medium"
            >Bot Intro:</label
          >
          <textarea
            id="botIntro"
            v-model="botIntro"
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

        <!-- Public Visibility Toggle -->
        <div class="col-span-full sm:col-span-1">
          <label class="block text-lg font-medium">Public Visibility:</label>
          <div class="flex space-x-2">
            <button
              type="button"
              :class="{
                'btn btn-primary': isPublic,
                'btn btn-grey-200': !isPublic,
              }"
              @click="toggleVisibility(true)"
            >
              Public
            </button>
            <button
              type="button"
              :class="{
                'btn btn-primary': !isPublic,
                'btn btn-grey-200': isPublic,
              }"
              @click="toggleVisibility(false)"
            >
              Private
            </button>
          </div>
        </div>

        <div class="col-span-full sm:col-span-1 flex items-center">
          <input
            id="underConstruction"
            v-model="underConstruction"
            type="checkbox"
            class="mr-2"
          />
          <label for="underConstruction" class="block text-lg font-medium"
            >Mark as under construction</label
          >
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
const botFeedbackMessage = ref<string | null>(null)
const botFeedbackClass = ref<string>('')

const selectedBotId = computed({
  get() {
    return botStore.currentBot?.id || null
  },
  set(id: number | null) {
    if (id !== null) {
      botStore.selectBot(id)
    } else {
      botStore.deselectBot()
    }
  },
})

// Determine if the designer field can be edited
const canEditDesigner = computed(
  () =>
    !selectedBotId.value || botStore.currentBot?.userId === userStore.userId,
)

const designer = computed({
  get() {
    if (!selectedBotId.value) {
      return userStore.user?.username || 'Kind Guest'
    }
    return botStore.currentBot?.designer || 'Unknown Designer'
  },
  set(value) {
    if (canEditDesigner.value) {
      if (selectedBotId.value) {
        botStore.currentBot!.designer = value // Update current bot if selected
      }
    }
  },
})

const isPublic = computed({
  get() {
    return botStore.currentBot?.isPublic ?? true
  },
  set(value: boolean) {
    if (botStore.currentBot) {
      botStore.currentBot.isPublic = value
    }
  },
})

function toggleVisibility(value: boolean) {
  isPublic.value = value
}

const name = computed(() => botStore.currentBot?.name || '')
const subtitle = computed(() => botStore.currentBot?.subtitle || '')
const description = computed(
  () => botStore.currentBot?.description || 'Another helpful robot',
)
const botIntro = computed({
  get() {
    return botStore.currentBot?.botIntro || "I'm a kind robot";
  },
  set(value: string) {
    if (botStore.currentBot) {
      botStore.currentBot.botIntro = value;
    }
  },
});

const underConstruction = computed(
  () => botStore.currentBot?.underConstruction ?? false,
)

async function handleSubmit() {
  isLoading.value = true;
  try {
    const botData = {
      name: name.value,
      subtitle: subtitle.value ?? '',
      description: description.value ?? '',
      botIntro: botIntro.value ?? '',
      designer: designer.value,
      userIntro: promptStore.promptArray.join(' | '),
      avatarImage: botStore.currentImagePath,
      isPublic: isPublic.value,
      underConstruction: underConstruction.value,
      userId: userStore.userId,
    };

    if (selectedBotId.value) {
      await botStore.updateBot(selectedBotId.value, botData);
      console.log('Bot updated successfully:', selectedBotId.value);
      successMessage.value = 'Bot updated successfully!';
      // Ensure bot remains selected after update
      botStore.selectBot(selectedBotId.value);
    }
  } catch (error) {
    console.error('Error editing bot:', error);
    errorMessage.value = 'Error editing bot: ' + error;
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await botStore.loadStore()
  await galleryStore.initializeStore()
})
</script>

<template>
  <div class="rounded-2xl border p-2 m-2 flex">
    <h1 class="text-3xl mb-4 text-center">Create a New Bot</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <div class="mb-4">
        <label for="name" class="block text-sm font-medium">Name:</label>
        <input
          id="name"
          v-model="name"
          type="text"
          class="w-full p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="subtitle" class="block text-sm font-medium"
          >Subtitle:</label
        >
        <input
          id="subtitle"
          v-model="subtitle"
          type="text"
          class="w-full p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="description" class="block text-sm font-medium"
          >Description:</label
        >
        <textarea
          id="description"
          v-model="description"
          class="resize w-full p-2 rounded border"
        />
      </div>
      <div class="mb-4">
        <label for="avatarImage" class="block text-sm font-medium"
          >Avatar Image URL:</label
        >
        <div v-for="(art, index) in artResults" :key="art.id">
          <img :src="art.path" alt="Generated Avatar" >
          <div class="mb-4">
            <label for="botType" class="block text-sm font-medium"
              >Bot Type:</label
            >
            <select
              id="botType"
              v-model="botType"
              class="w-full p-2 rounded border"
            >
              <option value="PROMPTBOT">
                Prompt Bot: A bot that provides prompts
              </option>
              <option value="CHATBOT">
                Chat Bot: A bot that can chat with users
              </option>
              <option value="ARTBOT">Art Bot: A bot that creates art</option>
            </select>
          </div>
          <button @click="generateAnotherAvatar(index)">
            Generate Another
          </button>
          <button @click="selectAvatar(art.path)">Select</button>
        </div>

        <div class="mb-4">
          <label for="imagePrompt" class="block text-sm font-medium"
            >Image Prompt:</label
          >
          <input
            id="imagePrompt"
            v-model="imagePrompt"
            type="text"
            class="w-full p-2 rounded border"
          >
        </div>

        <button
          type="button"
          class="btn btn-info mt-2"
          @click="getRandomAvatar"
        >
          Get Random Avatar
        </button>
        <!-- Display Created Art -->
        <div v-for="art in artResults" :key="art.id" class="mt-4">
          <art-card :art="art" />
        </div>
      </div>
      <div class="mb-4">
        <label for="botIntro" class="block text-sm font-medium"
          >Bot Introduction:</label
        >
        <input
          id="botIntro"
          v-model="botIntro"
          type="text"
          class="w-full p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="userIntro" class="block text-sm font-medium"
          >User Introduction:</label
        >
        <input
          id="userIntro"
          v-model="userIntro"
          type="text"
          class="w-full p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="prompt" class="block text-sm font-medium">Prompt:</label>
        <textarea
          id="prompt"
          v-model="prompt"
          class="resize w-full p-2 rounded border"
        />
        <div class="mb-4">
          <label for="sampleResponse" class="block text-sm font-medium"
            >Sample Response:</label
          >
          <textarea
            id="sampleResponse"
            v-model="sampleResponse"
            class="resize w-full p-2 rounded border"
          />
        </div>
        <button type="button" class="btn btn-primary mt-2" @click="testPrompt">
          Test Prompt
        </button>
        <div v-if="promptTestResult" class="mt-2 text-green-500 animate-pulse">
          Test Result: {{ promptTestResult }}
        </div>
      </div>
      <!-- Additional Fields -->
      <div class="mb-4">
        <label for="isPublic" class="block text-sm font-medium"
          >Is Public:</label
        >
        <input
          id="isPublic"
          v-model="isPublic"
          type="checkbox"
          class="p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="underConstruction" class="block text-sm font-medium"
          >Under Construction:</label
        >
        <input
          id="underConstruction"
          v-model="underConstruction"
          type="checkbox"
          class="p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="theme" class="block text-sm font-medium">Theme:</label>
        <input
          id="theme"
          v-model="theme"
          type="text"
          class="w-full p-2 rounded border"
        >
      </div>
      <div class="mb-4">
        <label for="personality" class="block text-sm font-medium"
          >Personality:</label
        >
        <input
          id="personality"
          v-model="personality"
          type="text"
          class="w-full p-2 rounded border"
        >
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
        sample-response="sampleResponse"
      />
      <span v-if="isLoading" class="loading loading-ring loading-lg" />
      <button type="submit" class="btn btn-success w-full">Create Bot</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBotStore } from "@/stores/botStore";
import { useArtStore, type Art } from "@/stores/artStore";
import { errorHandler } from "@/server/api/utils/error";
import { useUserStore } from "@/stores/userStore";

const botStore = useBotStore();
const artStore = useArtStore();
const userStore = useUserStore();
const isLoading = ref(false); //
// Form fields
const botType = ref("PROMPTBOT");
const name = ref("");
const subtitle = ref("Kind Robot");
const description = ref("I'm a kind robot");
const avatarImage = ref("/images/wonderchest/wonderchest304_(23).webp");
const botIntro = ref("SloganMaker");
const userIntro = ref("Help me make a slogan for");
const imagePrompt = ref("robot avatar");
const prompt = ref(
  "Arm butterflies with mini-flamethrowers to kick mosquitos butts"
);
const isPublic = ref(true);
const underConstruction = ref(false);
const theme = ref("");
const personality = ref("kind");
const sampleResponse = ref("");
const userId = computed(() => userStore.userId);

const promptTestResult = ref<string | null>(null);

async function handleSubmit(e: Event) {
  e.preventDefault();

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
      userId: userId.value
    };

    const response = await botStore.addBots([botData]);
    console.log(response);
  } catch (error) {
    errorHandler(error);
  }
}

async function getRandomAvatar() {
  try {
    isLoading.value = true;
    const newArt = await artStore.generateArt({ prompt: imagePrompt.value });
    if (newArt && newArt.path) {
      // Make sure newArt object exists and has a path
      avatarImage.value = newArt.path; // Use path as you mentioned
    }
  } catch (error: any) {
    const handledError = errorHandler(error);
    console.error("Error in getRandomAvatar:", handledError.message);
  } finally {
    isLoading.value = false;
  }
}

async function testPrompt() {
  try {
    const response = await fetch("/api/botcafe/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt: prompt.value })
    });

    if (response.ok) {
      const data = await response.json();
      promptTestResult.value = data.result; // Adjust based on the API response structure
    }
  } catch (error) {
    errorHandler(error);
  }
}

const artResults = ref<Art[]>([]);

async function generateAnotherAvatar(index: number) {
  try {
    const newArt = await artStore.generateArt({
      prompt: "Generate a random avatar"
    });
    if (newArt && newArt.path) {
      artResults.value[index] = newArt;
    }
  } catch (error: any) {
    const handledError = errorHandler(error);
    console.error("Error in generateAnotherAvatar:", handledError.message);
  }
}

function selectAvatar(path: string) {
  avatarImage.value = path;
}

// Initialize with one avatar
generateAnotherAvatar(0);
</script>

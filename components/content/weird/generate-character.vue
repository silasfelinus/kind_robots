<template>
  <div
    class="w-full max-w-3xl mx-auto mb-6 flex flex-col items-center space-y-6"
  >
    <!-- Character Name -->
    <div class="w-full">
      <label for="characterName" class="block text-sm font-medium mb-2">
        Character Name:
      </label>
      <input
        id="characterName"
        v-model="characterName"
        type="text"
        class="w-full p-2 rounded-lg border"
        placeholder="Enter a character name"
      />
    </div>

    <!-- Character Art -->
    <div class="w-full">
      <label for="artPrompt" class="block text-sm font-medium mb-2">
        Art Prompt:
      </label>
      <textarea
        id="artPrompt"
        v-model="artPrompt"
        rows="3"
        class="w-full p-2 rounded-lg border"
        placeholder="Describe the character's appearance for AI generation"
      ></textarea>
    </div>

    <!-- Avatar Image Upload and Preview -->
    <div class="w-full flex flex-col items-center space-y-4">
      <label class="block text-sm font-medium">Character Image:</label>

      <!-- Avatar Preview -->
      <img
        :src="characterImage"
        alt="Character Image Preview"
        class="w-40 h-40 object-cover rounded-full shadow-lg border-2 border-gray-300"
      />
      <p class="text-sm text-gray-500">Preview your character's image</p>

      <!-- Image Upload -->
      <input
        v-model="characterImage"
        type="text"
        class="w-full p-2 rounded-lg border"
        placeholder="Enter an image URL or use AI to generate"
      />
      <button
        class="btn btn-primary px-4 py-2 rounded-lg shadow-md"
        :disabled="isLoading"
        @click="generateCharacterImage"
      >
        <span v-if="isLoading">Generating...</span>
        <span v-else>Generate Image</span>
      </button>
    </div>

    <!-- Save Character -->
    <button
      class="btn btn-success w-full sm:w-auto px-4 py-2 rounded-lg shadow-md"
      :disabled="isLoading"
      @click="saveCharacter"
    >
      Save Character
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Character fields
const characterName = ref('')
const artPrompt = ref('')
const characterImage = ref('/images/default-avatar.webp') // Default character image
const isLoading = ref(false)

// Function to generate character image based on the artPrompt
async function generateCharacterImage() {
  if (!artPrompt.value.trim()) {
    console.error('Art prompt is empty. Please provide a description.')
    return
  }

  isLoading.value = true
  try {
    // Simulating AI-based image generation
    const generatedImageUrl = await fetchGeneratedImageFromAI(artPrompt.value)
    characterImage.value = generatedImageUrl
  } catch (error) {
    console.error('Error generating character image:', error)
  } finally {
    isLoading.value = false
  }
}

// Simulated AI image generation function (replace with real implementation)
async function fetchGeneratedImageFromAI(prompt: string): Promise<string> {
  // Simulate a delay and return a mock image URL
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return `https://dummyimage.com/200x200/000/fff&text=${encodeURIComponent(
    prompt.substring(0, 10),
  )}`
}

// Function to save the character
async function saveCharacter() {
  if (!characterName.value.trim()) {
    console.error('Character name is required to save.')
    return
  }

  const characterData = {
    name: characterName.value,
    artPrompt: artPrompt.value,
    characterImage: characterImage.value,
  }

  try {
    console.log('Saving character:', characterData)
    // Implement actual save logic here (e.g., API call)
  } catch (error) {
    console.error('Error saving character:', error)
  }
}
</script>

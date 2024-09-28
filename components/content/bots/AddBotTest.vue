<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Add a New Bot</h1>

    <form @submit.prevent="submitBot" class="space-y-4">
      <div>
        <label for="name" class="block text-lg">Bot Name:</label>
        <input v-model="botData.name" type="text" id="name" class="border p-2 w-full" required />
      </div>

      <div>
        <label for="subtitle" class="block text-lg">Subtitle:</label>
        <input v-model="botData.subtitle" type="text" id="subtitle" class="border p-2 w-full" />
      </div>

      <div>
        <label for="description" class="block text-lg">Description:</label>
        <textarea v-model="botData.description" id="description" class="border p-2 w-full"></textarea>
      </div>

      <div>
        <label for="botIntro" class="block text-lg">Bot Introduction:</label>
        <textarea v-model="botData.botIntro" id="botIntro" class="border p-2 w-full"></textarea>
      </div>

      <div>
        <label for="userIntro" class="block text-lg">User Introduction:</label>
        <textarea v-model="botData.userIntro" id="userIntro" class="border p-2 w-full"></textarea>
      </div>

      <div>
        <label for="prompt" class="block text-lg">Prompt:</label>
        <textarea v-model="botData.prompt" id="prompt" class="border p-2 w-full"></textarea>
      </div>

      <div>
        <label for="sampleResponse" class="block text-lg">Sample Response:</label>
        <textarea v-model="botData.sampleResponse" id="sampleResponse" class="border p-2 w-full"></textarea>
      </div>

      <button
        type="submit"
        class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting" class="flex items-center">
          <svg
            class="animate-spin h-5 w-5 mr-2 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          Submitting...
        </span>
        <span v-else>Add Bot</span>
      </button>
    </form>

    <div v-if="responseMessage" class="mt-6 p-4 rounded border" :class="responseClass">
      {{ responseMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { defaultBot } from '~/stores/seeds/seedBots'; // Import default data

const botData = ref({ ...defaultBot }); // Initialize with default bot data

const responseMessage = ref('');
const isSubmitting = ref(false);
const responseClass = ref('');

const submitBot = async () => {
  isSubmitting.value = true;
  responseMessage.value = '';
  responseClass.value = '';

  try {
    const response = await fetch('/api/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(botData.value),
    });

    const result = await response.json();

    if (result.success) {
      responseMessage.value = 'Bot successfully created!';
      responseClass.value = 'bg-green-100 border-green-500 text-green-800';
      resetForm();
    } else {
      responseMessage.value = `Error: ${result.message}`;
      responseClass.value = 'bg-red-100 border-red-500 text-red-800';
    }
  } catch (error) {
    responseMessage.value = `Network Error: ${error.message}`;
    responseClass.value = 'bg-red-100 border-red-500 text-red-800';
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  botData.value = { ...defaultBot }; // Reset form with default data
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
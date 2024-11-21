<template>
  <div class="p-6 m-4 mx-auto max-w-screen-lg bg-base-200 rounded-2xl border">
    <h1 class="text-4xl text-center mb-6">Stream Tester</h1>

    <!-- Toggle for Streaming -->
    <div class="mb-4 flex justify-center">
      <label class="flex items-center gap-2">
        <input v-model="useStreaming" type="checkbox" class="checkbox" />
        <span>Enable Streaming</span>
      </label>
    </div>

    <!-- Prompt Input -->
    <div class="mb-6">
      <label for="prompt" class="block text-lg font-medium mb-2"
        >Enter Prompt:</label
      >
      <input
        id="prompt"
        v-model="prompt"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Type your prompt here..."
      />
    </div>

    <!-- Submit Button -->
    <div class="flex justify-center mb-6">
      <button
        :disabled="loading || !prompt.trim()"
        class="btn btn-primary w-full sm:w-auto transition duration-300 ease-in-out"
        @click="submitPrompt"
      >
        <span v-if="!loading">Submit Prompt</span>
        <span
          v-else
          class="spinner-border spinner-border-sm"
          role="status"
        ></span>
      </button>
    </div>

    <!-- Display Bot Response -->
    <div v-if="responseText" class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-xl font-semibold mb-2">Bot Response:</h2>
      <p>{{ responseText }}</p>
    </div>

    <!-- Error Message Display -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '@/stores/chatStore';

const chatStore = useChatStore();

const prompt = ref('');
const responseText = ref('');
const loading = ref(false);
const errorMessage = ref('');
const useStreaming = ref(false);

// Function to submit the prompt to the /api/botcafe/chat endpoint
async function submitPrompt() {
  if (!prompt.value.trim()) return;

  loading.value = true;
  errorMessage.value = '';
  responseText.value = `You: ${prompt.value}\n\n`; // Display the prompt

  let newChat;

  try {
    // Step 1: Create a new chat object in the database
    newChat = await chatStore.addChat({
      content: prompt.value,
      userId: 1, // Replace with actual user ID
      botId: 1,  // Replace with actual bot ID
      recipientId: 1, // Replace with actual recipient ID
      type: 'ToBot',
    });

    const apiEndpoint = '/api/botcafe/chat';

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt.value }],
        temperature: 1,
        max_tokens: 300,
        stream: useStreaming.value,
      }),
    };

    // Handle Streaming and Non-Streaming
    if (useStreaming.value) {
      await fetchStream(apiEndpoint, requestOptions, newChat.id);
    } else {
      const response = await fetch(apiEndpoint, requestOptions);
      if (!response.ok) {
        errorMessage.value = `Error ${response.status}: ${response.statusText}`;
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content || 'No response received';
      responseText.value += botResponse;

      // Update the chat object with the bot response
      await chatStore.editChat(newChat.id, {
        botResponse,
      });
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error during API request:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchStream(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    errorMessage.value = Error ${response.status}: ${response.statusText};
    throw new Error(Error ${response.status}: ${response.statusText});
  }

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // Accumulate partial data from chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode current chunk and add to the buffer
      buffer += decoder.decode(value, { stream: true });

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        let chunk = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2); // Move past the current chunk

        // Remove multiple "data:" prefixes if they exist
        if (chunk.startsWith('data:')) {
          chunk = chunk.replace(/^data:\s*/, '').replace(/^data:\s*/, '');
        }

        // Skip empty chunks and "[DONE]"
        if (!chunk || chunk === '[DONE]') continue;

        try {
          // Parse the JSON and extract the content
          const parsed = JSON.parse(chunk);
          const content = parsed.choices[0]?.delta?.content;

          // Append content to response text
          if (content) {
            responseText.value += content;
          }
        } catch (err) {
          console.error('Error parsing chunk:', err);
        }
      }
    }
  } else {
    throw new Error('Stream not supported in response');
  }
}


</script>

<style scoped>
.spinner-border {
  border-width: 2px;
  width: 1rem;
  height: 1rem;
  border-color: white;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>

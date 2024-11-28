<template>
  <div class="mx-auto max-w-screen-lg bg-base-200 rounded-2xl border">
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

    <!-- Display Chat Card -->
    <div v-if="chat">
      <h2 class="text-xl font-semibold mb-4">Chat Card:</h2>
      <chat-card :chat="chat" />
    </div>

    <!-- Display Raw Bot Response -->
    <div v-if="responseText" class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-xl font-semibold mb-2">Raw Bot Response:</h2>
      <p>{{ responseText }}</p>
    </div>

    <!-- Error Message Display -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

const chatStore = useChatStore()
const userStore = useUserStore()

const userId = computed(() => userStore.userId)

const prompt = ref('')
const responseText = ref('')
const loading = ref(false)
const errorMessage = ref('')
const useStreaming = ref(false)
const chat = ref<Chat | null>(null)

async function submitPrompt() {
  if (!prompt.value.trim()) return;

  loading.value = true;
  errorMessage.value = '';
  responseText.value = '';

  try {
    // Step 1: Create a new chat object in the database
    const newChat = await chatStore.addChat({
      content: prompt.value,
      userId: userId.value,
      botId: 1, // Replace with actual bot ID
      recipientId: 1, // Replace with actual recipient ID
      type: 'ToBot',
    });
    chat.value = newChat;

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

    if (useStreaming.value) {
      // Streaming Mode
      await fetchStream(apiEndpoint, requestOptions, newChat.id);
    } else {
      // Non-Streaming Mode with Progressive Updates
      await fetchNonStream(apiEndpoint, requestOptions, newChat.id);
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error during API request:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchNonStream(url: string, options: RequestInit, chatId: number) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      errorMessage.value = `Error ${response.status}: ${response.statusText}`;
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const botResponse = data.choices?.[0]?.message?.content || 'No response received';

    // Simulate progressive updates for non-streaming
    for (let i = 0; i < botResponse.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate delay
      responseText.value += botResponse[i];

      // Update the chat object locally and in the store
      if (chat.value) {
        chat.value.botResponse = responseText.value;
      }
      chatStore.updateChat(chatId, { botResponse: responseText.value });
    }

    // Save final response to the database
    await chatStore.editChat(chatId, { botResponse });
  } catch (error) {
    console.error('Error during non-streaming fetch:', error);
    throw error;
  }
}


async function fetchStream(url: string, options: RequestInit, chatId: number) {
  const response = await fetch(url, options);
  if (!response.ok) {
    errorMessage.value = `Error ${response.status}: ${response.statusText}`;
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ''; // Accumulate partial data from chunks

    try {
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

              // Update the chat object locally
              if (chat.value) {
                chat.value.botResponse = responseText.value;
              }

              // Update the chat in the store
              chatStore.updateChat(chatId, { botResponse: responseText.value });

              // Save the updated response to the database
              await chatStore.editChat(chatId, { botResponse: responseText.value });
            }
          } catch (err) {
            console.error('Error parsing JSON chunk:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error during streaming:', err);
      throw new Error('Streaming failed.');
    }
  } else {
    throw new Error('Stream not supported in response');
  }
}


</script>

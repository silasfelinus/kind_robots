<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center text-primary">
      AI Voice Chat Interface
    </h1>

    <!-- API Key Input -->
    <div
      v-if="!isConnected && !userIsAdmin"
      class="bg-base-100 p-6 shadow-lg rounded-lg"
    >
      <p class="text-md text-warning mb-4">
        To use this chat, you must provide a valid OpenAI API key. Whisper
        requires an active OpenAI account (it may require payment). You are
        responsible for tracking and paying any costs incurred while using
        Whisper through this website.
      </p>
      <label for="api-key" class="block text-lg font-semibold mb-2">
        Enter your OpenAI API Key:
      </label>
      <input
        id="api-key"
        v-model="apiKey"
        type="password"
        placeholder="API Key"
        class="w-full p-3 border rounded mb-4 bg-base-200 text-base-content"
        aria-label="OpenAI API Key"
      />
      <button
        class="btn btn-primary w-full"
        :disabled="!apiKey"
        aria-label="Connect to Whisper API"
        @click="connectToWhisper"
      >
        Connect to Whisper API
      </button>
    </div>

    <!-- Voice Chat Interface -->
    <div
      v-else
      class="voice-chat-interface mt-6 bg-base-100 p-6 shadow-lg rounded-lg"
    >
      <div v-if="isLoading" class="loading text-center mb-4">
        <p class="text-info">Connecting to Whisper API...</p>
      </div>

      <div class="controls flex items-center justify-center gap-4">
        <button
          class="btn btn-accent"
          aria-label="Start Recording"
          :disabled="isRecording"
          @click="startRecording"
        >
          Start Recording
        </button>
        <button
          class="btn btn-secondary"
          aria-label="Stop Recording"
          :disabled="!isRecording"
          @click="stopRecording"
        >
          Stop Recording
        </button>
      </div>

      <div
        class="messages bg-base-200 p-4 h-80 overflow-y-scroll rounded mt-4 shadow-inner"
      >
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="mb-3 bg-accent text-accent-content p-2 rounded"
        >
          <p>{{ message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const userIsAdmin = computed(() => userStore.isAdmin)
const apiKey = ref('')
const messages = ref<string[]>([])
const isConnected = ref(false)
const isLoading = ref(false)
const isRecording = ref(false)
const socket = ref<WebSocket | null>(null)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

const connectToWhisper = () => {
  const config = useRuntimeConfig()

  if (!apiKey.value && !userIsAdmin.value) return

  const keyToUse = apiKey.value || config.OPENAI_API_KEY

  isLoading.value = true
  socket.value = new WebSocket('wss://api.openai.com/v1/realtime')

  socket.value.onopen = () => {
    console.log('Connected to Whisper API')
    isConnected.value = true
    isLoading.value = false

    // Send an initial greeting message
    socket.value?.send(
      JSON.stringify({
        api_key: keyToUse,
        action: 'connect',
        greeting: 'Hello! How can I assist you today?', // Greeting message
      }),
    )
  }

  socket.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.audio) {
        // If the response contains audio, play it
        playAudioResponse(data.audio)
      } else if (data.text) {
        // Display text responses in the chat
        messages.value.push(data.text)
      }
    } catch (error) {
      messages.value.push('Error parsing data from API.')
      console.error('Error parsing WebSocket message:', error)
    }
  }

  socket.value.onclose = () => {
    console.log('Disconnected from Whisper API')
    isConnected.value = false
    isLoading.value = false
  }

  socket.value.onerror = (error) => {
    console.error('Error with Whisper API:', error)
    isLoading.value = false
  }
}

const startRecording = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support audio recording.')
    return
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        audioChunks = []
        sendAudioMessage(audioBlob)
      }
      mediaRecorder.start()
      isRecording.value = true
    })
    .catch((err) => {
      console.error('Error accessing microphone:', err)
    })
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
    isRecording.value = false
  }
}

const sendAudioMessage = (audioBlob: Blob) => {
  if (!isConnected.value) return

  const reader = new FileReader()
  reader.onloadend = () => {
    const base64AudioMessage = reader.result?.toString().split(',')[1]
    if (base64AudioMessage) {
      socket.value?.send(
        JSON.stringify({
          audio: base64AudioMessage,
        }),
      )
      messages.value.push('You sent a voice message.')
    }
  }
  reader.readAsDataURL(audioBlob)
}

const playAudioResponse = (base64Audio: string) => {
  const audio = new Audio(`data:audio/wav;base64,${base64Audio}`)
  audio.play()
}
</script>

<style>
.voice-chat-interface {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading p {
  font-size: 1.25rem;
  color: var(--color-info);
}
</style>

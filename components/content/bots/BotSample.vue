<template>
  <div
    :data-theme="theme"
    class="bot-card rounded-2xl border p-4"
  >
    <h2>{{ name }}</h2>
    <img
      :src="avatarImage"
      alt="Bot Avatar"
    >
    <p>{{ subtitle }}</p>
    <p>{{ description }}</p>
    <p v-if="underConstruction">
      🚧 Under Construction 🚧
    </p>
    <p>Bot Intro: {{ botIntro }}</p>
    <p>User Intro: {{ userIntro }}</p>
    <p>Prompt: {{ prompt }}</p>
    <p>Personality: {{ personality }}</p>
    <p>Sample Response: {{ sampleResponse }}</p>
    <button @click="sendMessage">
      Send Message
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  name: string
  subtitle: string
  description: string
  avatarImage: string
  theme: string
  underConstruction: boolean
  botIntro: string
  userIntro: string
  prompt: string
  personality: string
  sampleResponse: string
  botType: string
}>()

const {
  name,
  subtitle,
  description,
  avatarImage,
  theme,
  underConstruction,
  botIntro,
  userIntro,
  prompt,
  personality,
  sampleResponse,
  botType,
} = props

const sendMessage = () => {
  // Logic to send a message
  // For now, it's just a placeholder
  alert('Message sent to bot!')
}
</script>

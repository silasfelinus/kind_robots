<template>
  <div class="text-center center bg-base-100">
    <nuxt-layout>
      <p v-if="isLoading">Loading bot with ID {{ id }}...</p>
      <template v-if="currentBot">
        <!-- Display the bot details here using the BotObject component -->
        <bot-object :bot="currentBot" />
      </template>
      <p v-if="errorMessage">{{ errorMessage }}</p>
    </nuxt-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const currentBot = ref(null)
const route = useRoute()
const id = +route.params.id
const isLoading = ref(true)
const errorMessage = ref('')

const fetchBotById = async () => {
  try {
    const response = await axios.get(`/api/bot/id/${id}`)
    if (response.data.success) {
      currentBot.value = response.data.bot
    } else {
      errorMessage.value = response.data.message
    }
  } catch (networkError) {
    errorMessage.value = 'Failed to load bot due to a network error.'
  } finally {
    isLoading.value = false
  }
}
fetchBotById()
</script>

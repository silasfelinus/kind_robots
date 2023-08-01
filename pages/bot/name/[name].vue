<template>
  <div class="text-center center bg-base-100">
    <nuxt-layout>
      <p v-if="status.isLoading">Loading bot with ID {{ id }}...</p>
      <template v-if="currentBot">
        <!-- Display the bot details here -->
        {{ currentBot }}
      </template>
      <p v-if="error.message">{{ error.message }}</p>
    </nuxt-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import { useStatusStore, StatusType } from '../../../stores/statusStore'

const currentBot = ref(null)
const route = useRoute()
const name = route.params.name

const error = useErrorStore()
const status = useStatusStore()

const fetchBotByName = async () => {
  status.setStatus(StatusType.INFO, 'Loading bot...')
  try {
    const response = await axios.get(`/api/bot/name/${name}`)
    if (response.data.success) {
      currentBot.value = response.data.bot
      status.setStatus(StatusType.SUCCESS, 'Bot loaded successfully!')
    } else {
      error.setError(ErrorType.VALIDATION_ERROR, response.data.message)
      status.setStatus(StatusType.ERROR, 'Failed to load bot.')
    }
  } catch (networkError) {
    error.handleError(
      () => Promise.reject(networkError),
      ErrorType.NETWORK_ERROR,
      'Failed to fetch bot'
    )
    status.setStatus(StatusType.ERROR, 'Failed to load bot due to a network error.')
  }
}

fetchBotByName()
</script>

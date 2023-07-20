<template>
  <div>
    <input v-model="message" placeholder="Enter your message here" />
    <button @click="sendMessage">Send Message</button>
    <div v-if="response">
      <h2>Response:</h2>
      <pre>{{ response }}</pre>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'

const message = ref('')
const response = ref(null)

const sendMessage = async () => {
  try {
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message.value }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
    response.value = res.data
  } catch (err) {
    console.error(err)
  }
}
</script>

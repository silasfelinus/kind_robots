<template>
  <div class="chat-container">
    <ul class="messages">
      <li v-for="message in messages" :key="message.id">
        <span>{{ message.user }}: </span>{{ message.text }}
      </li>
    </ul>
    <input
      v-model="newMessage"
      placeholder="Type a message..."
      @keyup.enter="sendMessage"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const messages = ref([])
const newMessage = ref('')

const sendMessage = () => {
  // Logic to send the message
  messages.value.push({ user: 'You', text: newMessage.value })
  newMessage.value = '' // Clear input after sending
}
</script>

<style scoped>
.chat-container {
  border: 1px solid #ccc;
  padding: 10px;
}
.messages {
  list-style: none;
  padding: 0;
}
</style>

<template>
  <div class="chat-container">
    <ul class="messages">
      <li v-for="message in messages" :key="message.id">
        <span>{{ message.user }}: </span>{{ message.text }}
      </li>
    </ul>
    <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message...">
  </div>
</template>

<script setup>
import { ref } from 'vue';

const messages = ref([]);
const newMessage = ref('');

const sendMessage = () => {
  // Send message logic
  messages.value.push({ user: 'You', text: newMessage.value });
  newMessage.value = ''; // Clear input after sending
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
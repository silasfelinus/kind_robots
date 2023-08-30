<template>
    <div class="live-chat">
      <div class="messages-container">
        <div v-for="message in messages" :key="message.id" class="message" :class="{ 'user-message': message.isUser }">
          <p>{{ message.text }}</p>
          <span>{{ message.timestamp }}</span>
        </div>
      </div>
      <div class="input-container">
        <input v-model="inputMessage" @keyup.enter="sendMessage" type="text" placeholder="Type a message..." />
        <button @click="sendMessage">Send</button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref } from 'vue';
  import { nanoid } from 'nanoid';
  
  export default {
    setup() {
      const messages = ref([
        { id: nanoid(), text: 'Hello, how can I assist you today?', timestamp: new Date().toLocaleString(), isUser: false },
      ]);
  
      const inputMessage = ref('');
  
      const sendMessage = () => {
        if (inputMessage.value.trim() !== '') {
          messages.value.push({
            id: nanoid(),
            text: inputMessage.value,
            timestamp: new Date().toLocaleString(),
            isUser: true,
          });
  
          inputMessage.value = '';
        }
      };
  
      return {
        messages,
        inputMessage,
        sendMessage
      };
    }
  };
  </script>
  
  <style scoped>
  .live-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .messages-container {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 10px;
  }
  
  .message {
    margin-bottom: 10px;
    align-self: flex-start;
    background-color: #ddd;
    padding: 5px;
    border-radius: 5px;
  }
  
  .user-message {
    align-self: flex-end;
    background-color: #aee;
  }
  
  .input-container {
    display: flex;
    padding: 10px;
  }
  
  input {
    flex: 1;
    margin-right: 10px;
  }
  </style>
  
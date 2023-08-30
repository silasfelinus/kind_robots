<template>
    <div class="page-container">
      <div class="agent-info">
        <img :src="agent.avatarUrl" alt="Agent Avatar" class="agent-avatar"/>
        <h1 class="agent-name">{{ agent.name }}</h1>
        <p class="agent-description">{{ agent.description }}</p>
      </div>
      <LiveChat v-if="isChatWidgetOpen" :messages="messages" @newMessage="addMessage"/>
      <button @click="toggleChatWidgetOpen">
        {{ isChatWidgetOpen ? 'Close Chat' : 'Open Chat' }}
      </button>
      <div class="action-links">
        <a href="https://www.example.com/buy-stickers" class="link">Buy AMI Stickers</a>
        <a href="https://www.example.com/gift-shop" class="link">Visit our Gift Shop</a>
      </div>
    </div>
  </template>
  
  <script setup>
  import LiveChat from './LiveChat.vue';
  import { useAppStore } from '../store';
  
  const { selectedAgent, messages, addMessage, isChatWidgetOpen, toggleChatWidgetOpen } = useAppStore();
  
  const agent = selectedAgent.value;
  </script>
  
  <style scoped>
  .page-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .agent-info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .agent-avatar {
    width: 100px;
    height: 100px;
  }
  
  .action-links {
    display: flex;
    justify-content: space-around;
    width: 100%;
  }
  
  .link {
    text-decoration: none;
    color: inherit;
  }
  </style>
  
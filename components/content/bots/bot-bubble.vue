<template>
  <div class="bot-bubble" @click="emitClick">
    <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-avatar" />
    <div class="bot-info">
      <h3>{{ bot.name }}</h3>
      <p>{{ bot.tagline }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { Bot } from './../../../stores/botStore' // Ensure this path is correct to where you define your Bot type

const props = defineProps({
  bot: {
    type: Object as () => Bot,
    required: true,
  },
})

const emit = defineEmits(['selectBot'])

function emitClick() {
  emit('selectBot', props.bot.id)
}
</script>

<style scoped>
.bot-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}
.bot-bubble:hover {
  transform: translateY(-5px);
}
.bot-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}
.bot-info h3 {
  margin: 5px 0 0;
  font-size: 16px;
}
.bot-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}
</style>

<template>
  <div class="bot-bubble" @click="emitClick">
    <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-avatar" />
    <div class="bot-info">
      <h3 class="text-lg font-semibold">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600">{{ bot.tagline }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { Bot } from './../../../stores/botStore'; // Adjust path as necessary

const props = defineProps({
  bot: {
    type: Object as () => Bot,
    required: true,
  },
});

const emit = defineEmits(['selectBot']);

function emitClick() {
  emit('selectBot', props.bot.id);
}
</script>

<style scoped>
.bot-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 2; /* Tailwind padding scale */
  border-radius: full; /* Full circle for Tailwind */
  background-color: bg-primary; /* Tailwind color */
  box-shadow: shadow-lg; /* Tailwind shadow */
  transition-property: transform; /* Tailwind transitions */
  transition-duration: 200; /* Tailwind duration in ms */
}
.bot-bubble:hover {
  transform: translateY(-1); /* Tailwind translate */
}
.bot-avatar {
  width: 20; /* Tailwind width scale */
  height: 20; /* Tailwind height scale */
  border-radius: full; /* Full circle for Tailwind */
  object-fit: cover;
}
.bot-info h3 {
  font-size: lg; /* Tailwind font size */
}
.bot-info p {
  font-size: base; /* Tailwind base font size */
  color: gray-600; /* Tailwind color */
}
</style>

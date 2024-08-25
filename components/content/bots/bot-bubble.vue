<template>
  <div
    :class="['bot-bubble', { 'flex-row': isSelected, 'flex-col': !isSelected }]"
    @click="selectBot"
  >
    <!-- Bot Avatar -->
    <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-avatar" />

    <!-- Bot Info -->
    <div v-if="isSelected" class="bot-info">
      <h3 class="text-lg font-semibold">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600">{{ bot.tagline }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import type { Bot } from '@/stores/botStore' // Adjust the path as needed

const props = defineProps({
  bot: {
    type: Object as () => Bot,
    required: true,
  },
  selectedBotId: {
    type: Number,
    default: null, // Provide a default value (null if no bot is selected)
  },
})

const emit = defineEmits(['update:selectedBotId'])

const isSelected = ref(props.selectedBotId === props.bot.id)

function selectBot() {
  isSelected.value = !isSelected.value
  emit('update:selectedBotId', isSelected.value ? props.bot.id : null)
}
</script>

<style scoped>
.bot-bubble {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.bot-avatar {
  width: 80px; /* Adjust based on layout transition */
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  transition:
    width 0.3s ease,
    height 0.3s ease;
}
.bot-info {
  margin-left: 10px; /* Only when in row format */
  transition: margin-left 0.3s ease;
}
</style>

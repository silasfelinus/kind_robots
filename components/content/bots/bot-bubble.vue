<template>
  <div
    :class="[
      'bot-bubble',
      isSelected ? 'flex-row items-start' : 'flex-col items-center',
    ]"
    class="cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out w-full"
    @click="selectBot"
  >
    <!-- Bot Avatar -->
    <img
      :src="bot.avatarImage"
      alt="Bot's Avatar"
      class="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover transition-all duration-300 ease-in-out"
    />

    <!-- Conditional Bot Info -->
    <div v-if="isSelected" class="bot-info pl-4 flex-grow">
      <h3 class="text-lg font-semibold">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600">{{ bot.tagline }}</p>
    </div>

    <!-- Always visible Bot Name -->
    <h3 v-else class="text-lg font-semibold mt-2">{{ bot.name }}</h3>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import type { Bot } from './../../../stores/botStore' // Adjust the path as needed

const props = defineProps({
  bot: {
    type: Object as () => Bot,
    required: true,
  },
  selectedBotId: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['update:selectedBotId'])
const isSelected = ref(props.selectedBotId === props.bot.id)

function selectBot() {
  isSelected.value = !isSelected.value
  emit('update:selectedBotId', isSelected.value ? props.bot.id : null)
}
</script>

<template>
  <div class="bot-card flex rounded-2xl bg-base-200 p-4">
    <img
      :src="bot.avatarImage"
      alt="Bot Avatar"
      class="w-16 h-16 rounded-full"
    />
    <div class="ml-4">
      <h2 class="text-lg font-bold">
        {{ bot.name }}
      </h2>
      <p class="text-sm">
        {{ bot.subtitle }}
      </p>
      <p class="text-xs text-accent">
        {{ bot.personality }}
      </p>
      <button
        class="bg-primary text-white rounded px-2 py-1 mt-2"
        @click="selectBot"
      >
        Chat
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bot = computed(() => botStore.currentBot)
</script>

<template>
  <div>
    <response-card v-for="(message, index) in bot.messages" :key="index" :message="message" />
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
let activeBot = computed(() => botsStore.getActiveBot)
const bot = ref(activeBot)
</script>

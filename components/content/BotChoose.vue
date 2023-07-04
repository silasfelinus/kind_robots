<template>
  <div>
    <select v-model="activeBotId" @change="setActiveBot">
      <option v-for="bot in bots" :key="bot.id" :value="bot.id">
        {{ bot.name }}
      </option>
    </select>
    <div v-if="activeBot">
      <img :src="activeBot.avatarImage" alt="Bot avatar" />
    </div>
  </div>
</template>

<script setup>
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
const bots = botsStore.getBots
let activeBot = botsStore.getActiveBot

let activeBotId = ref(activeBot ? activeBot.id : null)

const setActiveBot = () => {
  const bot = bots.find((bot) => bot.id === activeBotId.value)
  if (bot) botsStore.setActiveBot(bot)
}

watchEffect(() => {
  if (activeBot) activeBotId.value = activeBot.id
})
</script>

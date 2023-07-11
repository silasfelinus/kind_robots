<template>
  <div class="p-4 rounded-lg shadow-lg text-center mb-8">
    <label for="botSelect" class="text-lg font-semibold mb-2 block">Kind Robots</label>
    <select id="botSelect" v-model="activeBotId" class="w-full" @change="changeActiveBot">
      <option v-for="bot in bots" :key="bot.id" :value="bot.id">
        {{ bot.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'
import { Bot } from '../../types/bot'

const botsStore = useBotsStore()
const bots: Bot[] = botsStore.getBots
let activeBotId = computed(() => botsStore.getActiveBotId)

const changeActiveBot = (event: Event) => {
  const target = event.target as HTMLSelectElement
  botsStore.setActiveBotId(parseInt(target.value))
}
</script>

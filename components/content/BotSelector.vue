<template>
  <div class="rounded-lg shadow-md text-center text-white">
    <div class="rounded-lg bg-accent p-4">
      <label for="botSelect" class="text-lg font-semibold mb-2 mt-2 block">Kind Robot:</label>
      <select id="botSelect" v-model="activeBotId" class="w-full text-black bg-white rounded-lg">
        <option v-for="bot in bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bot } from '@prisma/client'
import { useBotStore } from '../../stores/botStore'

const botsStore = useBotStore()
const bots: Bot[] = botsStore.getBots()
let activeBotId = computed({
  get: () => botsStore.getActiveBotId,
  set: (newVal) => botsStore.setActiveBotId(newVal)
})
let activeBot = computed(() => botsStore.getActiveBot)

watch(
  () => activeBot.value,
  (newActiveBot) => {
    activeBotId.value = newActiveBot.id
  }
)
</script>
../../stores/botStore

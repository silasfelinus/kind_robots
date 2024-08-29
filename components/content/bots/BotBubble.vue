<template>
  <div
    class="relative select-none overflow-hidden p-1 border rounded-2xl bg-base-200"
  >
    <!-- Bot Scroll Container -->
    <div ref="scrollContainer" class="scroll-container px-2">
      <div
        v-for="(bot, index) in bots"
        :key="`bot-${index}`"
        class="bot-bubble"
        @click="selectBot(bot.id)"
      >
        <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-img" />
        <h3 class="bot-name">{{ bot.name }}</h3>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref(null)

function selectBot(botId) {
  botStore.selectBot(botId)
}

onMounted(() => {
  if (bots.value.length > 0) {
    selectBot(bots.value[0].id)
  }
})
</script>
<style>
.scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  cursor: grab; /* Cursor indicates draggable area */
}

.bot-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 20vw; /* Adjust as necessary to ensure circular appearance */
  min-width: 180px;
  max-width: 200px; /* Ensure this is square */
  height: 200px; /* New height to match max-width for circular image */
  margin: 0 8px;
  padding: 10px;
  scroll-snap-align: start;
  text-align: center;
}

.bot-img {
  width: 80%; /* Adjust based on design preference */
  height: 80%; /* Make the image take up a fixed percentage of the bubble */
  border-radius: 50%;
  object-fit: cover; /* Ensure images don't get distorted */
}

.bot-name {
  margin-top: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

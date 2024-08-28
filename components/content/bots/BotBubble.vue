<template>
  <div
    class="relative select-none overflow-x-scroll overflow-y-auto p-1 border rounded-2xl bg-base-200"
  >
    <!-- Centering Container -->
    <div ref="scrollContainer" class="mx-auto w-full overflow-x-scroll">
      <!-- Bot Scroll Container -->
      <div class="flex space-x-4 px-2">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref(null)

// Function to handle bot selection
function selectBot(botId) {
  botStore.selectBot(botId)
}

// Automatically select the first bot when the component mounts
onMounted(() => {
  if (bots.value.length > 0) {
    selectBot(bots.value[0].id) // Select the first bot
  }
})
</script>
<style>
.scroll-container {
  display: flex;
  scroll-snap-type: x mandatory;
  cursor: grab; /* Cursor indicates draggable area */
}

.bot-bubble {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 20vw;
  min-width: 180px;
  max-width: 160px;
  margin: 0 8px;
  padding: 10px;
  scroll-snap-align: start;
  text-align: center;
  height: auto;
  overflow: visible;
}

.bot-img {
  width: 100%;
  height: auto;
  max-height: 80px;
  border-radius: 50%;
}

.bot-name {
  margin-top: 7px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

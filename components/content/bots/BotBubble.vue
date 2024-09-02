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
  // Handle scrolling using CSS scroll snapping
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = 0 // Reset scroll to the start
  }
})
</script>

<style scoped>
.scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  cursor: grab; /* Cursor indicates draggable area */
  padding: 0 10px; /* Add padding inside the container for visual spacing */
}

.bot-bubble {
  flex: 0 0 auto; /* Don't grow, don't shrink, basis is auto */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 20vw;
  min-width: 180px;
  height: 200px;
  margin: 0 8px;
  padding: 10px;
  scroll-snap-align: start;
  text-align: center;
  border-radius: 50%; /* Ensures that the bot-bubble appears circular */
}

.bot-img {
  width: 100px; /* Set fixed width */
  height: 100px; /* Set fixed height, keep aspect ratio */
  border-radius: 50%;
  object-fit: cover;
}

.bot-name {
  margin-top: 10px;
  font-size: 14px; /* Adjust font size */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

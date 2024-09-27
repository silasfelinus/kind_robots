<template>
  <div class="gallery-container">
    <div ref="scrollContainer" class="scroll-container">
      <div
        v-for="(bot, index) in bots"
        :key="`bot-${index}`"
        class="bot-bubble"
        @click="selectBot(bot.id)"
      >
        <img
          :src="bot.avatarImage || defaultAvatar"
          alt="Bot Avatar"
          class="bot-img"
        />
        <h3 class="bot-name">{{ bot.name }}</h3>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const scrollContainer = ref<HTMLElement | null>(null)
const defaultAvatar = '/images/avatars/lingua1.webp' // Use a fallback image

function selectBot(botId: string | number) {
  botStore.selectBot(Number(botId)) // Ensure botId is a number
}

onMounted(() => {
  if (bots.value.length > 0) {
    selectBot(bots.value[0].id)
  }
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = 0
  }
})
</script>

<style scoped>
.gallery-container {
  padding: 10px;
  background-color: var(--tw-bg-base-300);
  border-radius: var(--tw-rounded-2xl);
  overflow: hidden;
}

.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 10px;
  padding: 0 10px;
}

.bot-bubble {
  flex: 0 0 auto;
  width: 150px;
  text-align: center;
  scroll-snap-align: start;
}

.bot-img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.bot-name {
  margin-top: 8px;
  font-size: 1rem;
}
</style>

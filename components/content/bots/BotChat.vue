<template>
  <div class="container">
    <div class="top-half">
      <div class="bot-image">
        <img
          :src="currentBot?.avatarImage || '/images/amibot6.webp'"
          alt="Bot's Avatar"
          class="avatar-img"
        />
      </div>
      <div class="info-stream">
        <div class="bot-info">
          <h2 class="title">{{ currentBot?.name }} || 'AMIbot'</h2>
          <p class="description">{{ currentBot?.description }}</p>
        </div>
        <bot-stream class="stream-section" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import BotStream from './BotStream.vue'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
</script>
<style scoped>
.container {
  display: flex;
  flex-direction: column;
  background: var(--bg-base-200);
  height: 100%;
  width: 100%;
  border-radius: 1rem;
  margin: 0.25rem;
  padding: 0.25rem;
}

.top-half {
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0.5rem;
}

.bot-image {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.avatar-img {
  border-radius: 0.5rem;
  object-fit: cover;
}

.info-stream {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0.5rem;
  flex: 2;
}

.bot-info {
  text-align: left;
  border: 1px solid var(--bg-base-200);
  border-radius: 1rem;
  margin: 0.5rem;
  padding: 0.5rem;
}

.stream-section {
  flex-grow: 1;
}

.title,
.description {
  margin-bottom: 0.5rem;
}

@media (max-width: 640px) {
  .title {
    font-size: 1rem;
  }
  .description {
    font-size: 0.875rem;
  }
}
</style>

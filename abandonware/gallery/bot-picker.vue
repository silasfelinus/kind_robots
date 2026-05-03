<!-- /components/content/bots/bot-picker.vue -->
<template>
  <div class="picker-root">
    <!-- Search -->
    <div class="picker-search">
      <input
        v-model="query"
        type="search"
        placeholder="Search bots…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🤖</span> No bots found
    </div>

    <!-- List -->
    <ul v-else class="picker-list">
      <li
        v-for="bot in filtered"
        :key="bot.id"
        class="picker-row"
        :class="{ 'picker-row--active': botStore.currentBot?.id === bot.id }"
        @click="botStore.selectBot(bot.id)"
      >
        <img
          :src="bot.avatarImage || '/images/bot.webp'"
          class="picker-avatar"
          alt=""
        />
        <span class="picker-label">
          <span class="picker-name">{{ bot.name }}</span>
          <span class="picker-sub">{{ bot.description }}</span>
        </span>
        <button
          class="picker-action"
          :class="
            botStore.currentBot?.id === bot.id ? 'btn-primary' : 'btn-ghost'
          "
          @click.stop="botStore.selectBot(bot.id)"
        >
          {{ botStore.currentBot?.id === bot.id ? 'Active' : 'Select' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from '@/stores/botStore'

const botStore = useBotStore()
const query = ref('')
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    await botStore.fetchBots?.()
  } catch {
  } finally {
    isLoading.value = false
  }
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q
    ? botStore.bots.filter((b) => b.name.toLowerCase().includes(q))
    : botStore.bots
})
</script>

<!-- /components/content/user/chat-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="selectedFilter"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
      >
        <option value="all">All</option>
        <option value="bot">By bot</option>
        <option value="character">By character</option>
      </select>
      <select
        v-if="selectedFilter !== 'all'"
        v-model="filterValue"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
      >
        <option value="all">All {{ selectedFilter }}s</option>
        <option v-for="opt in filterOptions" :key="opt.id" :value="opt.id">
          {{ opt.name }}
        </option>
      </select>
      <input
        v-model="query"
        type="search"
        placeholder="Search chats…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>💬</span> No chats found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="chat in filtered"
        :key="chat.id"
        class="picker-row"
        :class="{ 'picker-row--active': chatStore.selectedChat?.id === chat.id }"
        @click="chatStore.selectChat(chat.id)"
      >
        <span class="picker-icon">💬</span>
        <span class="picker-label">
          <span class="picker-name">{{ chat.title || 'Untitled chat' }}</span>
          <span class="picker-sub">{{ chat.content?.slice(0, 48) }}</span>
        </span>
        <button
          class="picker-action"
          :class="chatStore.selectedChat?.id === chat.id ? 'btn-primary' : 'btn-ghost'"
          @click.stop="chatStore.selectChat(chat.id)"
        >
          {{ chatStore.selectedChat?.id === chat.id ? 'Open' : 'Open' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'

const chatStore = useChatStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()

const query = ref('')
const selectedFilter = ref('all')
const filterValue = ref('all')
const isLoading = ref(false)

const filterOptions = computed(() => {
  if (selectedFilter.value === 'bot') return botStore.bots
  if (selectedFilter.value === 'character') return characterStore.characters
  return []
})

const filtered = computed(() => {
  let list = chatStore.chats
  if (selectedFilter.value !== 'all' && filterValue.value !== 'all') {
    const key = selectedFilter.value === 'bot' ? 'botId' : 'characterId'
    list = list.filter((c) => c[key] === Number(filterValue.value))
  }
  const q = query.value.trim().toLowerCase()
  if (q)
    list = list.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.content?.toLowerCase().includes(q),
    )
  return list
})
</script>

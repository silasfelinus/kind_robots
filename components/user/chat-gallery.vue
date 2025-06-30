<!-- /components/content/user/chat-gallery.vue -->
<template>
  <div class="w-full h-full relative bg-base-300 flex flex-col">
    <!-- Filter and Search -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center">
        <label class="mr-2 text-sm font-bold text-gray-600">Filter by:</label>
        <select
          v-model="selectedFilter"
          class="bg-base-200 border border-gray-400 rounded-lg p-2"
        >
          <option value="all">All</option>
          <option value="bot">Bot</option>
          <option value="character">Character</option>
          <option value="user">User</option>
        </select>
      </div>
      <div v-if="selectedFilter !== 'all'" class="flex items-center">
        <label class="mr-2 text-sm font-bold text-gray-600"
          >{{ filterLabel }}:</label
        >
        <select
          v-model="filterValue"
          class="bg-base-200 border border-gray-400 rounded-lg p-2"
        >
          <option value="all">All</option>
          <option
            v-for="option in filterOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </select>
      </div>
      <div class="flex items-center w-full md:w-1/2">
        <input
          v-model="searchQuery"
          type="text"
          aria-label="Search chats by title"
          placeholder="Search chats..."
          class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
        />
      </div>
    </div>

    <!-- Chat Grid -->
    <div class="min-h-0 overflow-auto">
      <div v-if="isLoading" class="flex justify-center items-center h-full">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div
        v-else-if="errorMessage"
        class="flex justify-center items-center h-full text-center"
      >
        <p class="text-lg font-bold text-red-600">{{ errorMessage }}</p>
      </div>
      <div
        v-else-if="filteredChats.length === 0"
        class="flex w-full overflow-y-auto h-full"
      >
        <p class="text-lg font-bold text-gray-600">No chats found.</p>
      </div>
      <div v-else class="grid grid-cols-1 gap-4">
        <ChatCard
          v-for="chat in filteredChats"
          :key="chat.id"
          :chat="chat"
          class="h-auto"
          @click="selectChat(chat.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'

// Stores
const chatStore = useChatStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()

// State
const selectedFilter = ref('all')
const filterValue = ref('all')
const searchQuery = ref('')
const errorMessage = ref('')



// Computed: Filter Options and Label
const filterOptions = computed(() => {
  if (selectedFilter.value === 'bot') return botStore.bots
  if (selectedFilter.value === 'character') return characterStore.characters
  if (selectedFilter.value === 'user') return chatStore.users
  return []
})

const filterLabel = computed(() => {
  if (selectedFilter.value === 'bot') return 'Bot'
  if (selectedFilter.value === 'character') return 'Character'
  if (selectedFilter.value === 'user') return 'User'
  return ''
})

// Computed: Filtered and searched chats
const filteredChats = computed(() => {
  try {
    let chats = chatStore.chats

    // Filter by selected category
    if (selectedFilter.value !== 'all' && filterValue.value !== 'all') {
      const key = selectedFilter.value === 'bot' ? 'botId' : selectedFilter.value === 'character' ? 'characterId' : 'userId'
      chats = chats.filter((chat) => chat[key] === Number(filterValue.value))
    }

    // Search by title or content
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      chats = chats.filter((chat) =>
        chat.title.toLowerCase().includes(query) ||
        chat.content.toLowerCase().includes(query),
      )
    }

    return chats
  } catch (error) {
    console.error('Error filtering chats:', error)
    return []
  }
})

// Watch Computed Results
watch(
  () => filteredChats.value,
  (newFilteredChats) => {
    console.log('Filtered chats:', newFilteredChats)
  },
)

// Methods
function selectChat(id) {
  try {
    chatStore.selectChat(id)
  } catch (error) {
    console.error('Error selecting chat:', error)
    errorMessage.value = 'Failed to select chat. Please try again.'
  }
}
</script>

<template>
  <div>
    <!-- Fallback for non-authenticated users -->
    <div v-if="!currentUser" class="login-page">
      <h2 class="text-2xl font-bold mb-4">
        Please log in to access your chats
      </h2>
      <login-page />
    </div>

    <!-- Main Chat Page -->
    <div v-else class="chat-page bg-base-200 p-6 rounded-2xl">
      <h1 class="text-2xl font-bold mb-6">Chat</h1>

      <!-- User Selector -->
      <div class="user-selector mb-6">
        <label class="block text-lg font-semibold mb-2">Select User:</label>
        <select
          v-model="selectedRecipientId"
          class="w-full p-3 rounded-lg border bg-base-100"
          @change="handleRecipientChange"
        >
          <option value="">-- No Recipient --</option>
          <option
            v-for="user in users"
            :key="user.id"
            :value="user.id"
            :class="{
              'font-bold text-primary': unreadCount(user.id) > 0,
            }"
          >
            {{ user.username }}
            <span
              v-if="unreadCount(user.id) > 0"
              class="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full"
            >
              {{ unreadCount(user.id) }}
            </span>
          </option>
        </select>
      </div>

      <!-- Message List -->
      <div
        class="message-list bg-base-100 p-4 rounded-lg border max-h-[400px] overflow-y-auto"
      >
        <h2 v-if="recipient" class="text-lg font-semibold mb-2">
          Chat with {{ recipient?.username }}
        </h2>
        <p v-else class="text-gray-500">Select a user to start chatting.</p>

        <div v-if="currentMessages.length > 0" class="space-y-4">
          <div
            v-for="message in currentMessages"
            :key="message.id"
            class="chat-message p-3 rounded-lg"
            :class="{
              'bg-primary text-white': message.userId === currentUser!.id,
              'bg-secondary text-white': message.userId !== currentUser!.id,
            }"
          >
            <p class="font-semibold">
              {{
                message.userId === currentUser!.id ? 'You' : recipient?.username
              }}
            </p>
            <p>{{ message.content }}</p>
          </div>
        </div>
        <p v-else class="text-gray-500">No messages yet.</p>
      </div>

      <!-- Message Input -->
      <div v-if="recipient" class="message-input mt-4 flex">
        <textarea
          v-model="newMessage"
          class="flex-grow p-3 rounded-lg border bg-base-100"
          placeholder="Type your message..."
        ></textarea>
        <button
          class="ml-4 px-4 py-2 rounded-lg bg-accent text-white"
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useChatStore } from '@/stores/chatStore'

// Store references
const userStore = useUserStore()
const chatStore = useChatStore()

// Reactive state
const newMessage = ref('')
const selectedRecipientId = ref<number | null>(chatStore.selectedRecipientId)

// Computed properties
const currentUser = computed(() => userStore.user)
const recipient = computed(() =>
  userStore.users.find((user) => user.id === selectedRecipientId.value),
)
const currentMessages = computed(() => {
  if (!selectedRecipientId.value) return []

  // Filter chats linked by `originId` or direct sender/recipient
  return chatStore.chats.filter(
    (chat) =>
      chat.originId === selectedRecipientId.value ||
      (chat.userId === currentUser.value!.id &&
        chat.recipientId === selectedRecipientId.value) ||
      (chat.userId === selectedRecipientId.value &&
        chat.recipientId === currentUser.value!.id),
  )
})
const users = computed(() => userStore.users)
const unreadCount = (userId: number) => chatStore.unreadCountByRecipient(userId)

// Fetch data on mount
onMounted(async () => {
  await userStore.fetchUsers()
  await chatStore.initialize()
})

// Handle recipient change
function handleRecipientChange() {
  if (selectedRecipientId.value) {
    chatStore.selectRecipient(selectedRecipientId.value)
  }
}

// Send a new message
async function sendMessage() {
  if (!newMessage.value.trim() || !selectedRecipientId.value) return

  const originChat = currentMessages.value[0] // Assume first chat in thread is the origin

  await chatStore.addChat({
    content: newMessage.value.trim(),
    userId: currentUser.value!.id,
    recipientId: selectedRecipientId.value,
    type: 'ToUser',
    originId: originChat ? originChat.originId || originChat.id : null,
    characterId: null,
  })

  newMessage.value = ''
}
</script>

<style scoped>
.chat-page {
  max-width: 800px;
  margin: 0 auto;
}

.message-list {
  min-height: 200px;
}

.message-input textarea {
  min-height: 50px;
}

.login-page {
  text-align: center;
  padding: 50px;
}
</style>

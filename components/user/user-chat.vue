<!-- /components/content/user/user-chat.vue -->
<template>
  <div class="h-full w-full min-h-0">
    <div
      v-if="!currentUser"
      class="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-base-200 p-4"
    >
      <h2 class="text-center text-2xl font-bold">
        Please log in to access your chats
      </h2>
      <login-page />
    </div>

    <section
      v-else
      class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-base-200"
    >
      <header
        class="flex shrink-0 flex-col gap-2 border-b border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold text-primary">Chat</h1>
          <p class="truncate text-sm text-base-content/70">
            Pick a human. Send words. Cause tiny social ripples.
          </p>
        </div>

        <button
          class="btn btn-sm btn-outline rounded-2xl"
          :disabled="isLoading"
          @click="refreshChatData"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </header>

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(180px,260px)_1fr]"
      >
        <aside
          class="flex min-h-0 flex-col gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <label class="text-sm font-semibold text-base-content/70">
            Select User
          </label>

          <select
            v-model.number="selectedRecipientId"
            class="select select-bordered w-full rounded-2xl"
            @change="handleRecipientChange"
          >
            <option :value="null">No Recipient</option>
            <option
              v-for="user in availableUsers"
              :key="user.id"
              :value="user.id"
            >
              {{ user.username
              }}{{
                unreadCount(user.id) > 0 ? ` (${unreadCount(user.id)})` : ''
              }}
            </option>
          </select>

          <div
            class="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-base-200 p-2"
          >
            <button
              v-for="user in availableUsers"
              :key="user.id"
              class="btn btn-ghost btn-sm mb-2 flex w-full justify-between rounded-2xl"
              :class="{ 'btn-primary': user.id === selectedRecipientId }"
              @click="selectRecipient(user.id)"
            >
              <span class="truncate">{{ user.username }}</span>
              <span
                v-if="unreadCount(user.id) > 0"
                class="badge badge-secondary"
              >
                {{ unreadCount(user.id) }}
              </span>
            </button>
          </div>
        </aside>

        <main
          class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 p-3">
            <h2 v-if="recipient" class="truncate text-lg font-semibold">
              Chat with {{ recipient.username }}
            </h2>
            <p v-else class="text-sm text-base-content/60">
              Select a user to start chatting.
            </p>
          </div>

          <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            <div
              v-for="message in currentMessages"
              :key="message.id"
              class="max-w-[85%] rounded-2xl p-3"
              :class="
                message.userId === currentUser.id
                  ? 'ml-auto bg-primary text-primary-content'
                  : 'mr-auto bg-secondary text-secondary-content'
              "
            >
              <p class="text-xs font-bold opacity-80">
                {{
                  message.userId === currentUser.id
                    ? 'You'
                    : recipient?.username
                }}
              </p>
              <p class="whitespace-pre-wrap wrap-break-word">
                {{ message.content }}
              </p>
            </div>

            <p
              v-if="!currentMessages.length"
              class="rounded-2xl bg-base-200 p-4 text-center text-base-content/60"
            >
              No messages yet.
            </p>
          </div>

          <form
            v-if="recipient"
            class="flex shrink-0 flex-col gap-2 border-t border-base-300 p-3 sm:flex-row"
            @submit.prevent="sendMessage"
          >
            <textarea
              v-model="newMessage"
              class="textarea textarea-bordered min-h-16 flex-1 resize-none rounded-2xl"
              placeholder="Type your message..."
            />
            <button
              class="btn btn-accent rounded-2xl sm:self-stretch"
              type="submit"
              :disabled="!newMessage.trim()"
            >
              <Icon name="kind-icon:send" class="h-4 w-4" />
              Send
            </button>
          </form>
        </main>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { User } from '~/prisma/generated/prisma/client'
import type { Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useChatStore } from '@/stores/chatStore'

const userStore = useUserStore()
const chatStore = useChatStore()

const newMessage = ref('')
const selectedRecipientId = ref<number | null>(
  chatStore.selectedRecipientId ?? null,
)
const isLoading = ref(false)

const currentUser = computed(() => userStore.user)
const users = computed(() => userStore.users)

const availableUsers = computed(() =>
  users.value.filter((user) => user.id !== currentUser.value?.id),
)

const recipient = computed(() =>
  availableUsers.value.find(
    (user: User) => user.id === selectedRecipientId.value,
  ),
)

const currentMessages = computed(() => {
  const activeUserId = currentUser.value?.id
  const activeRecipientId = selectedRecipientId.value

  if (!activeRecipientId || !activeUserId) return []

  return chatStore.chats.filter(
    (chat: Chat) =>
      chat.originId === activeRecipientId ||
      (chat.userId === activeUserId &&
        chat.recipientId === activeRecipientId) ||
      (chat.userId === activeRecipientId && chat.recipientId === activeUserId),
  )
})

const unreadCount = (userId: number) => chatStore.unreadCountByRecipient(userId)

onMounted(async () => {
  if (!userStore.initialized) {
    await userStore.initialize()
  }

  if (!currentUser.value) {
    return
  }

  await refreshChatData()
})

async function refreshChatData() {
  if (isLoading.value) return

  isLoading.value = true

  try {
    await Promise.all([
      userStore.users.length
        ? Promise.resolve(userStore.users)
        : userStore.fetchUsers(),
      chatStore.initialize(),
    ])
  } finally {
    isLoading.value = false
  }
}

function selectRecipient(userId: number) {
  selectedRecipientId.value = userId
  handleRecipientChange()
}

function handleRecipientChange() {
  if (selectedRecipientId.value) {
    chatStore.selectRecipient(selectedRecipientId.value)
  }
}

async function sendMessage() {
  if (
    !newMessage.value.trim() ||
    !selectedRecipientId.value ||
    !currentUser.value
  ) {
    return
  }

  const originChat = currentMessages.value[0]

  await chatStore.addChat({
    content: newMessage.value.trim(),
    userId: currentUser.value.id,
    recipientId: selectedRecipientId.value,
    type: 'ToUser',
    originId: originChat ? originChat.originId || originChat.id : null,
    characterId: null,
  })

  newMessage.value = ''
}
</script>

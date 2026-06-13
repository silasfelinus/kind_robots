<!-- /components/content/user/chat-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
  >
    <header class="flex shrink-0 flex-col gap-3">
      <div class="flex flex-col gap-1">
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          Human Messages
        </p>
        <h2 class="text-2xl font-black text-base-content">Chats</h2>
        <p class="text-sm text-base-content/70">
          Private conversations between humans. Bot chatter can go be weird
          somewhere else.
        </p>
      </div>

      <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <label
          class="input input-bordered flex items-center gap-2 rounded-2xl bg-base-100"
        >
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            v-model="searchQuery"
            type="text"
            aria-label="Search human chats"
            placeholder="Search people or messages..."
            class="grow"
          />
        </label>

        <button
          class="btn btn-ghost rounded-2xl border border-base-300 bg-base-100"
          type="button"
          :disabled="isLoading"
          @click="refreshChats"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <div v-if="isLoading" class="flex h-full items-center justify-center p-6">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="errorMessage"
        class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <Icon name="kind-icon:warning" class="h-10 w-10 text-error" />
        <p class="max-w-md text-sm font-semibold text-error">
          {{ errorMessage }}
        </p>
        <button
          class="btn btn-outline btn-sm rounded-2xl"
          type="button"
          @click="refreshChats"
        >
          Try Again
        </button>
      </div>

      <div
        v-else-if="visibleThreads.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <Icon name="kind-icon:chat" class="h-12 w-12 text-base-content/30" />
        <div>
          <p class="text-lg font-black text-base-content">
            No human chats found.
          </p>
          <p class="text-sm text-base-content/60">
            When you message another user, the thread will show up here.
          </p>
        </div>
      </div>

      <div v-else class="h-full overflow-y-auto p-3">
        <div class="grid grid-cols-1 gap-3">
          <button
            v-for="thread in visibleThreads"
            :key="thread.threadKey"
            type="button"
            class="group flex w-full items-start gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 text-left transition hover:border-primary hover:bg-base-300"
            @click="selectThread(thread.latest.id)"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-lg font-black text-primary"
            >
              {{ getInitials(thread.otherHumanLabel) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate text-base font-black text-base-content">
                    {{ thread.title }}
                  </h3>
                  <p
                    class="truncate text-xs font-semibold text-base-content/60"
                  >
                    {{ thread.otherHumanLabel }}
                  </p>
                </div>

                <div class="flex shrink-0 flex-col items-end gap-1">
                  <span class="text-xs text-base-content/50">
                    {{ formatDate(thread.latest.createdAt) }}
                  </span>
                  <span
                    v-if="!thread.latest.isRead && isIncoming(thread.latest)"
                    class="badge badge-primary badge-sm rounded-xl"
                  >
                    New
                  </span>
                </div>
              </div>

              <p class="mt-2 line-clamp-2 text-sm text-base-content/70">
                {{ thread.latest.content }}
              </p>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="badge badge-outline rounded-xl">
                  {{ thread.count }}
                  {{ thread.count === 1 ? 'message' : 'messages' }}
                </span>
                <span
                  v-if="thread.latest.isFavorite"
                  class="badge badge-secondary rounded-xl"
                >
                  Favorite
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

type HumanChat = {
  id: number
  createdAt: string | Date
  updatedAt?: string | Date | null
  readAt?: string | Date | null
  type: string
  sender: string
  recipient?: string | null
  content: string
  title?: string | null
  isPublic?: boolean
  isFavorite?: boolean
  previousEntryId?: number | null
  originId?: number | null
  userId?: number | null
  botId?: number | null
  recipientId?: number | null
  artImageId?: number | null
  promptId?: number | null
  botName?: string | null
  channel?: string | null
  botResponse?: string | null
  characterId?: number | null
  isRead?: boolean
  isMature?: boolean
  serverId?: number | null
  serverName?: string | null
  dreamId?: number | null
  isActive?: boolean
}

type HumanThread = {
  threadKey: string
  title: string
  latest: HumanChat
  messages: HumanChat[]
  count: number
  otherHumanLabel: string
}

const chatStore = useChatStore()
const userStore = useUserStore()

const searchQuery = ref('')
const errorMessage = ref('')
const isRefreshing = ref(false)

const currentUserId = computed(() => Number(userStore.user?.id || 0))
const currentUsername = computed(() =>
  String(userStore.username || userStore.user?.username || '').trim(),
)

const isLoading = computed(() => {
  return Boolean(isRefreshing.value || chatStore.fetchHumanChatsPromise)
})

const humanChats = computed<HumanChat[]>(() => {
  const sourceChats = Array.isArray(chatStore.humanChats)
    ? chatStore.humanChats
    : chatStore.chats

  const chats = Array.isArray(sourceChats) ? (sourceChats as HumanChat[]) : []

  return chats.filter((chat) => {
    if (!chat || chat.isActive === false) return false
    if (chat.type !== 'ToUser') return false

    if (
      chat.botId ||
      chat.characterId ||
      chat.dreamId ||
      chat.channel ||
      chat.botName ||
      chat.botResponse
    ) {
      return false
    }

    const userId = currentUserId.value
    const username = currentUsername.value.toLowerCase()

    if (userId > 0 && (chat.userId === userId || chat.recipientId === userId)) {
      return true
    }

    const sender = String(chat.sender || '').toLowerCase()
    const recipient = String(chat.recipient || '').toLowerCase()

    return Boolean(username && (sender === username || recipient === username))
  })
})

const groupedThreads = computed<HumanThread[]>(() => {
  const threadMap = new Map<string, HumanChat[]>()

  for (const chat of humanChats.value) {
    const threadKey = String(chat.originId || chat.previousEntryId || chat.id)
    const existing = threadMap.get(threadKey) || []
    existing.push(chat)
    threadMap.set(threadKey, existing)
  }

  const threads: HumanThread[] = []

  for (const [threadKey, messages] of threadMap.entries()) {
    if (!messages.length) continue

    const sortedMessages = [...messages].sort((a, b) => {
      return getTime(a.createdAt) - getTime(b.createdAt)
    })

    const latest = sortedMessages.at(-1)
    if (!latest) continue

    const otherHumanLabel = getOtherHumanLabel(latest)

    threads.push({
      threadKey,
      title: latest.title || otherHumanLabel || 'Human Chat',
      latest,
      messages: sortedMessages,
      count: sortedMessages.length,
      otherHumanLabel,
    })
  }

  return threads.sort((a, b) => {
    return getTime(b.latest.createdAt) - getTime(a.latest.createdAt)
  })
})

const visibleThreads = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return groupedThreads.value

  return groupedThreads.value.filter((thread) => {
    const haystack = [
      thread.title,
      thread.otherHumanLabel,
      thread.latest.sender,
      thread.latest.recipient,
      thread.latest.content,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

function getTime(value: string | Date | null | undefined) {
  if (!value) return 0
  return new Date(value).getTime()
}

function getOtherHumanLabel(chat: HumanChat) {
  const username = currentUsername.value.toLowerCase()
  const sender = String(chat.sender || '').trim()
  const recipient = String(chat.recipient || '').trim()

  if (recipient && sender.toLowerCase() === username) return recipient
  if (sender && recipient.toLowerCase() === username) return sender
  if (chat.recipientId === currentUserId.value && sender) return sender
  if (chat.userId === currentUserId.value && recipient) return recipient

  return recipient || sender || 'Unknown Human'
}

function getInitials(label: string) {
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'
  )
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function isIncoming(chat: HumanChat) {
  const username = currentUsername.value.toLowerCase()
  const sender = String(chat.sender || '').toLowerCase()

  if (chat.recipientId === currentUserId.value) return true
  return Boolean(username && sender !== username)
}

async function refreshChats() {
  errorMessage.value = ''
  isRefreshing.value = true

  try {
    const userId = currentUserId.value

    if (!userId) {
      errorMessage.value = 'Please log in to view human chats.'
      return
    }

    await chatStore.fetchHumanChats(userId, true)
  } catch (error) {
    console.error('Error refreshing human chats:', error)
    errorMessage.value = 'Failed to load human chats.'
  } finally {
    isRefreshing.value = false
  }
}

async function selectThread(id: number) {
  errorMessage.value = ''

  try {
    await chatStore.selectChat(id)
  } catch (error) {
    console.error('Error selecting chat:', error)
    errorMessage.value = 'Failed to select chat.'
  }
}

onMounted(refreshChats)
</script>

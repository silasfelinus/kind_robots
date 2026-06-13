<!-- /components/content/user/chat-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
  >
    <header class="flex shrink-0 flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
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

        <button
          v-if="activeThread"
          class="btn btn-ghost btn-sm shrink-0 rounded-2xl border border-base-300 bg-base-100"
          type="button"
          @click="closeThread"
        >
          <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
          Back
        </button>
      </div>

      <div
        v-if="!activeThread"
        class="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
      >
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

    <!-- ================= THREAD LIST ================= -->
    <section
      v-if="!activeThread"
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
            @click="openThread(thread)"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 text-lg font-black text-primary"
            >
              <img
                v-if="thread.otherAvatar"
                :src="thread.otherAvatar"
                :alt="thread.otherHumanLabel"
                class="h-full w-full object-cover"
                @error="onAvatarError(thread)"
              />
              <span v-else>{{ getInitials(thread.otherHumanLabel) }}</span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate text-base font-black text-base-content">
                    {{ thread.otherHumanLabel }}
                  </h3>
                  <p
                    v-if="
                      thread.title && thread.title !== thread.otherHumanLabel
                    "
                    class="truncate text-xs font-semibold text-base-content/60"
                  >
                    {{ thread.title }}
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
                <span class="font-semibold">{{
                  isIncoming(thread.latest) ? '' : 'You: '
                }}</span>
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

    <!-- ================= CONVERSATION VIEW ================= -->
    <section
      v-else
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <div
        class="flex shrink-0 items-center gap-3 border-b border-base-300 bg-base-200 p-3"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 text-base font-black text-primary"
        >
          <img
            v-if="activeThread.otherAvatar"
            :src="activeThread.otherAvatar"
            :alt="activeThread.otherHumanLabel"
            class="h-full w-full object-cover"
            @error="onAvatarError(activeThread)"
          />
          <span v-else>{{ getInitials(activeThread.otherHumanLabel) }}</span>
        </div>
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-base-content">
            {{ activeThread.otherHumanLabel }}
          </h3>
          <p class="truncate text-xs text-base-content/50">
            {{ activeThread.count }}
            {{ activeThread.count === 1 ? 'message' : 'messages' }}
          </p>
        </div>
      </div>

      <div ref="messageScroll" class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="flex flex-col gap-3">
          <div
            v-for="message in activeThread.messages"
            :key="message.id"
            class="flex w-full"
            :class="isIncoming(message) ? 'justify-start' : 'justify-end'"
          >
            <div
              class="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm"
              :class="
                isIncoming(message)
                  ? 'bg-base-200 text-base-content'
                  : 'bg-primary text-primary-content'
              "
            >
              <p class="whitespace-pre-wrap wrap-break-word">
                {{ message.content }}
              </p>
              <p
                class="mt-1 text-[10px] opacity-60"
                :class="isIncoming(message) ? 'text-left' : 'text-right'"
              >
                {{ formatDate(message.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="shrink-0 border-t border-base-300 bg-base-200 p-3">
        <p v-if="replyError" class="mb-2 text-xs font-semibold text-error">
          {{ replyError }}
        </p>
        <div class="flex items-end gap-2">
          <textarea
            v-model="replyMessage"
            rows="1"
            placeholder="Write a message..."
            class="textarea textarea-bordered min-h-11 grow resize-none rounded-2xl bg-base-100"
            :disabled="isReplying"
            @keydown.enter.exact.prevent="sendReply"
          />
          <button
            class="btn btn-primary shrink-0 rounded-2xl"
            type="button"
            :disabled="isReplying || !replyMessage.trim()"
            @click="sendReply"
          >
            <span
              v-if="isReplying"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:send" class="h-4 w-4" />
            Send
          </button>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

type HumanChat = {
  id: number
  createdAt: string | Date
  type: string
  sender: string
  recipient?: string | null
  content: string
  title?: string | null
  isFavorite?: boolean
  previousEntryId?: number | null
  originId?: number | null
  userId?: number | null
  botId?: number | null
  recipientId?: number | null
  characterId?: number | null
  channel?: string | null
  botName?: string | null
  botResponse?: string | null
  dreamId?: number | null
  isRead?: boolean
  isPublic?: boolean
  isActive?: boolean
}

type HumanThread = {
  threadKey: string
  title: string
  latest: HumanChat
  messages: HumanChat[]
  count: number
  otherHumanLabel: string
  otherUserId: number | null
  otherAvatar: string | null
}

const chatStore = useChatStore()
const userStore = useUserStore()

const searchQuery = ref('')
const errorMessage = ref('')
const isRefreshing = ref(false)

// active conversation
const activeThreadKey = ref<string | null>(null)
const replyMessage = ref('')
const replyError = ref('')
const isReplying = ref(false)
const messageScroll = ref<HTMLElement | null>(null)

// id -> { username, avatar } cache, kept reactive so the template updates
// as we resolve users in the background.
const userInfo = ref<
  Record<number, { username: string; avatar: string | null }>
>({})
const brokenAvatars = ref<Set<string>>(new Set())

const currentUserId = computed(() => Number(userStore.user?.id || 0))
const currentUsername = computed(() =>
  String(userStore.username || userStore.user?.username || '').trim(),
)

const isLoading = computed(() =>
  Boolean(isRefreshing.value || chatStore.fetchHumanChatsPromise),
)

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

// The id of the "other" human in a given chat, relative to the current user.
function getOtherUserId(chat: HumanChat): number | null {
  const me = currentUserId.value
  if (!me) return chat.recipientId ?? chat.userId ?? null

  if (chat.userId === me) return chat.recipientId ?? null
  if (chat.recipientId === me) return chat.userId ?? null

  // Fall back to whichever id isn't ours.
  return chat.recipientId ?? chat.userId ?? null
}

function avatarUrl(value?: string | null): string | null {
  if (!value || value === 'default') return null
  if (
    value.startsWith('/') ||
    value.startsWith('http') ||
    value.startsWith('data:')
  ) {
    return value
  }
  return `data:image/png;base64,${value}`
}

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

    const sortedMessages = [...messages].sort(
      (a, b) => getTime(a.createdAt) - getTime(b.createdAt),
    )

    const latest = sortedMessages.at(-1)
    if (!latest) continue

    const otherUserId = getOtherUserId(latest)
    const cached = otherUserId ? userInfo.value[otherUserId] : undefined

    const otherHumanLabel =
      cached?.username || getStringLabel(latest) || 'Loading…'

    const cachedAvatar = cached?.avatar ? avatarUrl(cached.avatar) : null
    const otherAvatar =
      cachedAvatar && !brokenAvatars.value.has(threadKey) ? cachedAvatar : null

    threads.push({
      threadKey,
      title: latest.title || otherHumanLabel,
      latest,
      messages: sortedMessages,
      count: sortedMessages.length,
      otherHumanLabel,
      otherUserId,
      otherAvatar,
    })
  }

  return threads.sort(
    (a, b) => getTime(b.latest.createdAt) - getTime(a.latest.createdAt),
  )
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

const activeThread = computed<HumanThread | null>(() => {
  if (!activeThreadKey.value) return null
  return (
    groupedThreads.value.find((t) => t.threadKey === activeThreadKey.value) ||
    null
  )
})

function getTime(value: string | Date | null | undefined) {
  if (!value) return 0
  return new Date(value).getTime()
}

// String-based label, used only as a fallback before we resolve the user id.
function getStringLabel(chat: HumanChat) {
  const username = currentUsername.value.toLowerCase()
  const sender = String(chat.sender || '').trim()
  const recipient = String(chat.recipient || '').trim()

  if (recipient && sender.toLowerCase() === username) return recipient
  if (sender && recipient.toLowerCase() === username) return sender
  if (chat.recipientId === currentUserId.value && sender) return sender
  if (chat.userId === currentUserId.value && recipient) return recipient

  return recipient || sender || ''
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
  const me = currentUserId.value
  if (me) {
    if (chat.userId === me) return false
    if (chat.recipientId === me) return true
  }

  const username = currentUsername.value.toLowerCase()
  const sender = String(chat.sender || '').toLowerCase()
  return Boolean(username && sender !== username)
}

function onAvatarError(thread: HumanThread) {
  brokenAvatars.value = new Set(brokenAvatars.value).add(thread.threadKey)
}

// Resolve usernames + avatars for every "other" participant we don't know yet.
async function hydrateUsers() {
  const ids = new Set<number>()

  for (const chat of humanChats.value) {
    const otherId = getOtherUserId(chat)
    if (otherId && otherId > 0 && !userInfo.value[otherId]) {
      ids.add(otherId)
    }
  }

  if (!ids.size) return

  await Promise.all(
    Array.from(ids).map(async (id) => {
      try {
        const fetched = await userStore.getUserById(id)
        if (!fetched) return
        userInfo.value = {
          ...userInfo.value,
          [id]: {
            username: fetched.username || `User #${id}`,
            avatar: fetched.avatarImage ?? null,
          },
        }
      } catch (error) {
        console.error(`Failed to resolve user ${id}:`, error)
      }
    }),
  )
}

watch(humanChats, hydrateUsers, { immediate: true })

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
    await hydrateUsers()
  } catch (error) {
    console.error('Error refreshing human chats:', error)
    errorMessage.value = 'Failed to load human chats.'
  } finally {
    isRefreshing.value = false
  }
}

function scrollToBottom() {
  void nextTick(() => {
    const el = messageScroll.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function openThread(thread: HumanThread) {
  activeThreadKey.value = thread.threadKey
  replyMessage.value = ''
  replyError.value = ''

  // Mark the conversation as read where we're the recipient.
  if (thread.otherUserId) {
    chatStore.markMessagesAsRead(currentUserId.value)
  }

  try {
    await chatStore.selectChat(thread.latest.id)
  } catch (error) {
    console.error('Error selecting chat:', error)
  }

  scrollToBottom()
}

function closeThread() {
  activeThreadKey.value = null
  replyMessage.value = ''
  replyError.value = ''
}

async function sendReply() {
  const content = replyMessage.value.trim()
  const thread = activeThread.value

  if (!content || isReplying.value || !thread) return

  const recipientId = thread.otherUserId
  if (!recipientId) {
    replyError.value = 'Could not determine who to reply to.'
    return
  }

  isReplying.value = true
  replyError.value = ''

  try {
    await chatStore.addChat({
      content,
      userId: currentUserId.value || userStore.userId || 10,
      recipientId,
      recipient: thread.otherHumanLabel,
      type: 'ToUser',
      isPublic: false,
      originId: thread.latest.originId ?? thread.latest.id,
      previousEntryId: thread.latest.id,
      characterId: null,
    } as Parameters<typeof chatStore.addChat>[0])

    replyMessage.value = ''
    scrollToBottom()
  } catch (error) {
    console.error('Error sending reply:', error)
    replyError.value = 'Failed to send message.'
  } finally {
    isReplying.value = false
  }
}

watch(
  () => activeThread.value?.count,
  () => {
    if (activeThread.value) scrollToBottom()
  },
)

onMounted(refreshChats)
</script>

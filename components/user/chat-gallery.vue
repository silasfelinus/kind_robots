<!-- /components/content/user/chat-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
  >
    <header class="flex shrink-0 flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="flex flex-col gap-1">
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Message Timeline
          </p>
          <h2 class="text-2xl font-black text-base-content">Chats</h2>
          <p class="text-sm text-base-content/70">
            Human, system, welcome, bot, and beautifully suspicious robot
            conversations.
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
            aria-label="Search chats"
            placeholder="Search people, bots, titles, or messages..."
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
          <p class="text-lg font-black text-base-content">No messages found.</p>
          <p class="text-sm text-base-content/60">
            When a message arrives, human or otherwise, it will show up here.
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
                :alt="thread.otherLabel"
                class="h-full w-full object-cover"
                @error="onAvatarError(thread)"
              />
              <span v-else>{{ getInitials(thread.otherLabel) }}</span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate text-base font-black text-base-content">
                    {{ thread.otherLabel }}
                  </h3>
                  <p
                    v-if="thread.title && thread.title !== thread.otherLabel"
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
                <span class="font-semibold">
                  {{ previewPrefix(thread.latest) }}
                </span>
                {{ thread.latest.content }}
              </p>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <span class="badge badge-outline rounded-xl">
                  {{ thread.count }}
                  {{ thread.count === 1 ? 'message' : 'messages' }}
                </span>

                <span
                  v-if="thread.otherKind !== 'user'"
                  class="badge badge-info rounded-xl"
                >
                  {{ thread.otherKind }}
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
            :alt="activeThread.otherLabel"
            class="h-full w-full object-cover"
            @error="onAvatarError(activeThread)"
          />
          <span v-else>{{ getInitials(activeThread.otherLabel) }}</span>
        </div>

        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-base-content">
            {{ activeThread.otherLabel }}
          </h3>
          <p class="truncate text-xs text-base-content/50">
            {{ activeThread.count }}
            {{ activeThread.count === 1 ? 'message' : 'messages' }}
          </p>
        </div>
      </div>

      <div ref="messageScroll" class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="flex flex-col gap-3">
          <template
            v-for="(message, index) in activeThread.messages"
            :key="message.id"
          >
            <div
              v-if="
                shouldShowDateDivider(message, index, activeThread.messages)
              "
              class="flex justify-center py-1"
            >
              <span
                class="rounded-full border border-base-300 bg-base-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-base-content/60"
              >
                {{ formatDay(message.createdAt) }}
              </span>
            </div>

            <div
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
                <p
                  v-if="showSenderLabel(message)"
                  class="mb-1 text-xs font-black opacity-70"
                >
                  {{ getSenderLabel(message) }}
                </p>

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
          </template>
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
            :placeholder="replyPlaceholder"
            class="textarea textarea-bordered min-h-11 grow resize-none rounded-2xl bg-base-100"
            :disabled="isReplying || !canReply"
            @keydown.enter.exact.prevent="sendReply"
          />

          <button
            class="btn btn-primary shrink-0 rounded-2xl"
            type="button"
            :disabled="isReplying || !canReply || !replyMessage.trim()"
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

type ChatActorKind =
  | 'user'
  | 'bot'
  | 'character'
  | 'dream'
  | 'system'
  | 'unknown'

type ChatMessage = {
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

type ChatActor = {
  key: string
  label: string
  kind: ChatActorKind
  userId: number | null
}

type ChatThread = {
  threadKey: string
  title: string
  latest: ChatMessage
  messages: ChatMessage[]
  count: number
  otherLabel: string
  otherUserId: number | null
  otherAvatar: string | null
  otherKind: ChatActorKind
}

const chatStore = useChatStore()
const userStore = useUserStore()

const searchQuery = ref('')
const errorMessage = ref('')
const isRefreshing = ref(false)
const activeThreadKey = ref<string | null>(null)
const replyMessage = ref('')
const replyError = ref('')
const isReplying = ref(false)
const messageScroll = ref<HTMLElement | null>(null)

const userInfo = ref<
  Record<number, { username: string; avatar: string | null }>
>({})

const brokenAvatars = ref<Set<string>>(new Set())

const currentUserId = computed(() =>
  Number(userStore.user?.id || userStore.userId || 0),
)

const currentUsername = computed(() =>
  String(userStore.username || userStore.user?.username || '').trim(),
)

const isLoading = computed(() =>
  Boolean(isRefreshing.value || chatStore.fetchHumanChatsPromise),
)

const inboxChats = computed<ChatMessage[]>(() => {
  const hasDedicatedInbox = Array.isArray(chatStore.humanChats)

  const sourceChats = hasDedicatedInbox ? chatStore.humanChats : chatStore.chats

  const chats = Array.isArray(sourceChats) ? (sourceChats as ChatMessage[]) : []

  return chats.filter((chat) => {
    if (!chat || chat.isActive === false) return false
    if (hasDedicatedInbox) return true
    return isChatRelatedToCurrentUser(chat) || isWelcomeLike(chat)
  })
})

const groupedThreads = computed<ChatThread[]>(() => {
  const threadMap = new Map<string, ChatMessage[]>()

  for (const chat of inboxChats.value) {
    const threadKey = getThreadKey(chat)
    const existing = threadMap.get(threadKey) || []
    existing.push(chat)
    threadMap.set(threadKey, existing)
  }

  const threads: ChatThread[] = []

  for (const [threadKey, messages] of threadMap.entries()) {
    const sortedMessages = [...messages].sort(
      (a, b) => getTime(a.createdAt) - getTime(b.createdAt),
    )

    const latest = sortedMessages.at(-1)
    if (!latest) continue

    const otherActor = getOtherActor(latest)
    const otherLabel = getActorLabel(otherActor)
    const otherAvatar = getActorAvatar(otherActor, threadKey)

    threads.push({
      threadKey,
      title: latest.title || otherLabel,
      latest,
      messages: sortedMessages,
      count: sortedMessages.length,
      otherLabel,
      otherUserId: otherActor.userId,
      otherAvatar,
      otherKind: otherActor.kind,
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
      thread.otherLabel,
      thread.otherKind,
      thread.latest.sender,
      thread.latest.recipient,
      thread.latest.content,
      ...thread.messages.map((message) => message.content),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const activeThread = computed<ChatThread | null>(() => {
  if (!activeThreadKey.value) return null

  return (
    groupedThreads.value.find(
      (thread) => thread.threadKey === activeThreadKey.value,
    ) || null
  )
})

const canReply = computed(() => Boolean(activeThread.value?.otherUserId))

const replyPlaceholder = computed(() => {
  if (!activeThread.value) return 'Write a message...'
  if (!canReply.value) return 'This timeline is read-only for now.'
  return 'Write a message...'
})

function getThreadKey(chat: ChatMessage) {
  const { sender, recipient } = getChatActors(chat)

  const senderIsCurrent = actorMatchesCurrentUser(sender)
  const recipientIsCurrent = actorMatchesCurrentUser(recipient)

  if (senderIsCurrent && !recipientIsCurrent) {
    return `direct:${recipient.key}`
  }

  if (recipientIsCurrent && !senderIsCurrent) {
    return `direct:${sender.key}`
  }

  if (recipient.key !== 'unknown') {
    return `recipient:${recipient.key}`
  }

  if (sender.key !== 'unknown') {
    return `sender:${sender.key}`
  }

  return `chat:${chat.originId || chat.previousEntryId || chat.id}`
}

function getOtherActor(chat: ChatMessage) {
  const { sender, recipient } = getChatActors(chat)

  const senderIsCurrent = actorMatchesCurrentUser(sender)
  const recipientIsCurrent = actorMatchesCurrentUser(recipient)

  if (senderIsCurrent && !recipientIsCurrent) return recipient
  if (recipientIsCurrent && !senderIsCurrent) return sender
  if (recipient.key !== 'unknown') return recipient
  if (sender.key !== 'unknown') return sender

  return {
    key: 'unknown',
    label: 'Unknown',
    kind: 'unknown',
    userId: null,
  } satisfies ChatActor
}

function getChatActors(chat: ChatMessage) {
  const senderUserId = toPositiveId(chat.userId)
  const recipientUserId = toPositiveId(chat.recipientId)
  const botId = toPositiveId(chat.botId)
  const characterId = toPositiveId(chat.characterId)
  const dreamId = toPositiveId(chat.dreamId)

  const senderLabel = cleanLabel(chat.sender)
  const recipientLabel = cleanLabel(chat.recipient)

  const sender = makeActor({
    id: senderUserId,
    fallbackLabel: senderLabel || getSystemSenderLabel(chat),
    fallbackKey: senderLabel,
    kind: senderUserId ? 'user' : getSystemSenderKind(chat),
  })

  const recipient = makeActor({
    id: recipientUserId,
    fallbackLabel:
      recipientLabel ||
      cleanLabel(chat.botName) ||
      getBotFallbackLabel(botId) ||
      getCharacterFallbackLabel(characterId) ||
      getDreamFallbackLabel(dreamId),
    fallbackKey:
      recipientLabel ||
      cleanLabel(chat.botName) ||
      getBotFallbackKey(botId) ||
      getCharacterFallbackKey(characterId) ||
      getDreamFallbackKey(dreamId),
    kind: recipientUserId
      ? 'user'
      : botId
        ? 'bot'
        : characterId
          ? 'character'
          : dreamId
            ? 'dream'
            : 'unknown',
  })

  return {
    sender,
    recipient,
  }
}

function makeActor(input: {
  id: number | null
  fallbackLabel: string
  fallbackKey: string
  kind: ChatActorKind
}): ChatActor {
  if (input.id) {
    const cached = userInfo.value[input.id]

    return {
      key: `user:${input.id}`,
      label: cached?.username || input.fallbackLabel || `User #${input.id}`,
      kind: 'user',
      userId: input.id,
    }
  }

  const label = input.fallbackLabel || 'Unknown'
  const keyValue = input.fallbackKey || label

  if (!keyValue || keyValue === 'Unknown') {
    return {
      key: 'unknown',
      label,
      kind: input.kind,
      userId: null,
    }
  }

  return {
    key: `${input.kind}:${normalizeKey(keyValue)}`,
    label,
    kind: input.kind,
    userId: null,
  }
}

function getActorLabel(actor: ChatActor) {
  if (actor.userId) {
    return (
      userInfo.value[actor.userId]?.username ||
      actor.label ||
      `User #${actor.userId}`
    )
  }

  return actor.label || 'Unknown'
}

function getActorAvatar(actor: ChatActor, threadKey: string) {
  if (!actor.userId || brokenAvatars.value.has(threadKey)) return null

  const cached = userInfo.value[actor.userId]
  return cached?.avatar ? avatarUrl(cached.avatar) : null
}

function actorMatchesCurrentUser(actor: ChatActor) {
  const userId = currentUserId.value
  const username = normalizeKey(currentUsername.value)

  if (userId > 0 && actor.userId === userId) return true
  if (!username) return false

  return normalizeKey(actor.label) === username
}

function isChatRelatedToCurrentUser(chat: ChatMessage) {
  const { sender, recipient } = getChatActors(chat)
  return actorMatchesCurrentUser(sender) || actorMatchesCurrentUser(recipient)
}

function isWelcomeLike(chat: ChatMessage) {
  const haystack = [chat.sender, chat.title, chat.content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes('welcome') || haystack.includes('kind robots')
}

function getSystemSenderKind(chat: ChatMessage): ChatActorKind {
  if (isWelcomeLike(chat)) return 'system'
  if (chat.channel) return 'system'
  if (chat.botName || chat.botId) return 'bot'
  if (chat.characterId) return 'character'
  if (chat.dreamId) return 'dream'
  return 'unknown'
}

function getSystemSenderLabel(chat: ChatMessage) {
  if (cleanLabel(chat.sender)) return cleanLabel(chat.sender)
  if (isWelcomeLike(chat)) return 'Kind Robots'
  if (chat.channel) return chat.channel
  if (chat.botName) return chat.botName
  return 'System'
}

function getBotFallbackLabel(id: number | null) {
  return id ? `Bot #${id}` : ''
}

function getBotFallbackKey(id: number | null) {
  return id ? `bot:${id}` : ''
}

function getCharacterFallbackLabel(id: number | null) {
  return id ? `Character #${id}` : ''
}

function getCharacterFallbackKey(id: number | null) {
  return id ? `character:${id}` : ''
}

function getDreamFallbackLabel(id: number | null) {
  return id ? `Dream #${id}` : ''
}

function getDreamFallbackKey(id: number | null) {
  return id ? `dream:${id}` : ''
}

function cleanLabel(value?: string | null) {
  return String(value || '').trim()
}

function normalizeKey(value?: string | null) {
  return cleanLabel(value).toLowerCase().replace(/\s+/g, '-')
}

function toPositiveId(value?: number | null) {
  const id = Number(value || 0)
  return Number.isFinite(id) && id > 0 ? id : null
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

function getTime(value: string | Date | null | undefined) {
  if (!value) return 0
  return new Date(value).getTime()
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

function formatDay(value: string | Date | null | undefined) {
  if (!value) return ''

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function isSameDay(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined,
) {
  if (!a || !b) return false

  const first = new Date(a)
  const second = new Date(b)

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function shouldShowDateDivider(
  message: ChatMessage,
  index: number,
  messages: ChatMessage[],
) {
  if (index === 0) return true
  return !isSameDay(message.createdAt, messages[index - 1]?.createdAt)
}

function isIncoming(chat: ChatMessage) {
  return !isOutgoing(chat)
}

function isOutgoing(chat: ChatMessage) {
  const { sender } = getChatActors(chat)
  return actorMatchesCurrentUser(sender)
}

function getSenderLabel(chat: ChatMessage) {
  return getActorLabel(getChatActors(chat).sender)
}

function showSenderLabel(chat: ChatMessage) {
  return !isOutgoing(chat) && Boolean(getSenderLabel(chat))
}

function previewPrefix(chat: ChatMessage) {
  if (isOutgoing(chat)) return 'You: '

  const sender = getSenderLabel(chat)
  return sender ? `${sender}: ` : ''
}

function onAvatarError(thread: ChatThread) {
  brokenAvatars.value = new Set(brokenAvatars.value).add(thread.threadKey)
}

async function hydrateUsers() {
  const ids = new Set<number>()

  for (const chat of inboxChats.value) {
    const { sender, recipient } = getChatActors(chat)

    for (const actor of [sender, recipient]) {
      if (
        actor.userId &&
        actor.userId > 0 &&
        actor.userId !== currentUserId.value &&
        !userInfo.value[actor.userId]
      ) {
        ids.add(actor.userId)
      }
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

watch(inboxChats, hydrateUsers, { immediate: true })

async function refreshChats() {
  errorMessage.value = ''
  isRefreshing.value = true

  try {
    const userId = currentUserId.value

    if (!userId) {
      errorMessage.value = 'Please log in to view messages.'
      return
    }

    await chatStore.fetchHumanChats(userId, true)
    await hydrateUsers()
  } catch (error) {
    console.error('Error refreshing chats:', error)
    errorMessage.value = 'Failed to load messages.'
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

async function openThread(thread: ChatThread) {
  activeThreadKey.value = thread.threadKey
  replyMessage.value = ''
  replyError.value = ''

  if (currentUserId.value) {
    void chatStore.markMessagesAsRead(currentUserId.value)
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
    replyError.value =
      'This thread does not have a user recipient to reply to yet.'
    return
  }

  isReplying.value = true
  replyError.value = ''

  try {
    await chatStore.addChat({
      content,
      userId: currentUserId.value || userStore.userId || 10,
      recipientId,
      recipient: thread.otherLabel,
      type: 'ToUser',
      isPublic: false,
      originId: thread.latest.originId ?? thread.latest.id,
      previousEntryId: thread.latest.id,
      characterId: null,
    } as Parameters<typeof chatStore.addChat>[0])

    replyMessage.value = ''
    await refreshChats()
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

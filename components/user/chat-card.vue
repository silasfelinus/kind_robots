<!-- /components/content/user/chat-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="chat.id"
    target-type="chat"
    reaction-category="CHAT_EXCHANGE"
    :target-title="reactionTitle"
    @select="selectChat"
  >
    <template #actions>
      <button
        v-if="showActions && canDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Chat"
        @click.stop="deleteChat"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <header class="flex items-start gap-4">
      <user-avatar
        v-if="userId"
        :user-id="userId"
        class="h-12 w-12 shrink-0 rounded-full border border-base-300"
      />

      <div
        v-else
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-100 text-base-content/45"
      >
        <Icon name="kind-icon:person" class="h-6 w-6" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="truncate text-lg font-black text-base-content">
            {{ senderName }}
          </h2>

          <span class="text-xs font-bold uppercase text-base-content/40">
            to
          </span>

          <span class="truncate text-lg font-black text-primary">
            {{ botName }}
          </span>
        </div>

        <p class="mt-1 text-xs text-base-content/50">
          {{ formattedDate }}
        </p>

        <div class="mt-2 flex flex-wrap gap-2">
          <span v-if="chat.type" class="badge badge-outline badge-sm">
            {{ chat.type }}
          </span>

          <span v-if="chat.isPublic" class="badge badge-success badge-sm">
            Public
          </span>

          <span v-else class="badge badge-warning badge-sm"> Private </span>

          <span v-if="chat.botId" class="badge badge-primary badge-sm">
            Bot #{{ chat.botId }}
          </span>

          <span v-if="activeSelected" class="badge badge-accent badge-sm">
            Selected
          </span>
        </div>
      </div>

      <img
        v-if="hasBot"
        :src="botImage || '/images/bot.webp'"
        :alt="botName"
        class="h-12 w-12 shrink-0 rounded-full border-2 border-secondary object-cover"
      />
    </header>

    <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <p
          class="text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Thread
        </p>

        <span class="badge badge-ghost badge-sm">
          {{ threadMessages.length }}
        </span>
      </div>

      <div
        v-if="threadMessages.length"
        class="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1"
      >
        <article
          v-for="message in threadMessages"
          :key="message.id"
          class="flex gap-3 rounded-2xl p-3"
          :class="messageClass(message)"
        >
          <user-avatar
            v-if="message.userId"
            :user-id="message.userId"
            class="h-8 w-8 shrink-0 rounded-full border border-base-300"
          />

          <div
            v-else
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-100"
          >
            <Icon name="kind-icon:person" class="h-4 w-4" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-xs font-black">
              {{ message.sender || senderName }}
            </p>

            <p class="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
              {{ message.content }}
            </p>
          </div>
        </article>
      </div>

      <div
        v-else
        class="rounded-2xl border border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
      >
        No thread messages found.
      </div>
    </section>

    <section class="rounded-2xl border border-accent/30 bg-accent/10 p-4">
      <div class="mb-3 flex items-center gap-3">
        <img
          v-if="hasBot"
          :src="botImage || '/images/bot.webp'"
          :alt="botName"
          class="h-10 w-10 shrink-0 rounded-full border-2 border-secondary object-cover"
        />

        <div>
          <p class="text-sm font-black text-base-content">Bot Response</p>

          <p class="text-xs text-base-content/50">
            {{ botName }}
          </p>
        </div>
      </div>

      <p
        class="whitespace-pre-wrap text-sm leading-relaxed text-base-content/80"
      >
        {{ botResponse }}
      </p>
    </section>

    <Transition name="reply-expand">
      <section
        v-if="showReply"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold"> Continue this exchange </span>
          </span>

          <textarea
            v-model="replyMessage"
            class="textarea textarea-bordered min-h-28 w-full resize-none bg-base-200"
            placeholder="Type your reply here..."
            :disabled="isReplying"
            @keydown.enter.exact.prevent="sendReply"
          />
        </label>

        <div class="mt-3 flex justify-end gap-2">
          <button
            class="btn btn-ghost rounded-xl"
            type="button"
            :disabled="isReplying"
            @click="toggleReply"
          >
            Cancel
          </button>

          <button
            class="btn btn-primary rounded-xl text-white"
            type="button"
            :disabled="isReplying || !replyMessage.trim()"
            @click="sendReply"
          >
            <span
              v-if="isReplying"
              class="loading loading-spinner loading-sm"
            />

            Send Reply
          </button>
        </div>
      </section>
    </Transition>

    <footer class="flex flex-wrap justify-end gap-2">
      <button
        class="btn btn-secondary btn-sm rounded-xl"
        type="button"
        @click.stop="toggleReply"
      >
        <Icon name="kind-icon:message" class="h-4 w-4" />
        {{ showReply ? 'Hide Reply' : 'Continue' }}
      </button>
    </footer>

    <div
      v-if="statusMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ statusMessage }}
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
// /components/content/user/chat-card.vue
import { computed, ref, watch } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useArtStore } from '@/stores/artStore'

const props = withDefaults(
  defineProps<{
    chat: Chat
    selected?: boolean
    compact?: boolean
    showActions?: boolean
    showReaction?: boolean
    allowDelete?: boolean
  }>(),
  {
    selected: false,
    compact: false,
    showActions: true,
    showReaction: true,
    allowDelete: true,
  },
)

const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()
const artStore = useArtStore()

const localSelected = ref(false)
const showReply = ref(false)
const replyMessage = ref('')
const userImage = ref<string | undefined>(undefined)
const botImage = ref<string | undefined>(undefined)
const isReplying = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const chat = computed(() => props.chat)

const activeSelected = computed(() => {
  return props.selected || localSelected.value
})

const userId = computed(() => {
  return chat.value.userId
})

const hasBot = computed(() => {
  return Boolean(chat.value.botId)
})

const canDelete = computed(() => {
  if (!props.allowDelete) return false

  return userStore.isAdmin || chat.value.userId === userStore.userId
})

const threadMessages = computed(() => {
  return chatStore.chats.filter((message) => {
    return message.originId === chat.value.id || message.id === chat.value.id
  })
})

const formattedDate = computed(() => {
  return chat.value.createdAt
    ? new Date(chat.value.createdAt).toLocaleString()
    : 'Unknown Date'
})

const botResponse = computed(() => {
  return chat.value.botResponse || 'Awaiting response...'
})

const senderName = computed(() => {
  return chat.value.sender || userStore.username || 'User'
})

const botName = computed(() => {
  return chat.value.botName || 'Bot'
})

const reactionTitle = computed(() => {
  return `${senderName.value} → ${botName.value}`
})

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function selectChat() {
  localSelected.value = true
}

function messageClass(message: Chat) {
  const isSender = message.sender === chat.value.sender

  return {
    'flex-row-reverse bg-primary text-primary-content': isSender,
    'flex-row bg-base-200 text-base-content': !isSender,
  }
}

function toggleReply() {
  showReply.value = !showReply.value
}

async function sendReply() {
  const content = replyMessage.value.trim()

  if (!content || isReplying.value) return

  isReplying.value = true
  statusMessage.value = ''

  try {
    const newChat = await chatStore.addChat({
      content,
      userId: chat.value.userId ?? userStore.userId ?? 10,
      recipientId: chat.value.recipientId ?? 0,
      isPublic: chat.value.isPublic,
      originId: chat.value.originId ?? chat.value.id,
      previousEntryId: chat.value.id,
      botId: chat.value.botId ?? 0,
      botName: chat.value.botName ?? '',
      type: chat.value.type,
      characterId: chat.value.characterId,
    })

    replyMessage.value = ''
    showReply.value = false

    if (newChat?.id && typeof chatStore.streamResponse === 'function') {
      await chatStore.streamResponse(newChat.id)
    }

    setStatus('Reply sent.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Error sending reply.',
      'error',
    )
  } finally {
    isReplying.value = false
  }
}

async function deleteChat() {
  if (!canDelete.value) return

  try {
    await chatStore.deleteChat(chat.value.id)
    setStatus('Chat deleted.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Error deleting chat.',
      'error',
    )
  }
}

async function loadUserImage() {
  if (!chat.value.userId || userImage.value) return

  try {
    const user = await userStore.getUserById(chat.value.userId)

    if (!user) return

    if (user.artImageId) {
      const [artImage] = await artStore.getArtImagesByIds([user.artImageId])
      userImage.value = artImage?.imageData || user.avatarImage || undefined
      return
    }

    userImage.value = user.avatarImage || undefined
  } catch (error) {
    console.error('Error fetching user image:', error)
  }
}

async function loadBotImage() {
  if (!chat.value.botId || botImage.value) return

  try {
    const bot = await botStore.getBotById(chat.value.botId)

    if (!bot) return

    if (bot.artImageId) {
      const [artImage] = await artStore.getArtImagesByIds([bot.artImageId])
      botImage.value = artImage?.imageData || bot.avatarImage || undefined
      return
    }

    botImage.value = bot.avatarImage || undefined
  } catch (error) {
    console.error('Error fetching bot image:', error)
  }
}

watch(
  () => [chat.value.userId, chat.value.botId],
  async () => {
    userImage.value = undefined
    botImage.value = undefined

    await Promise.all([loadUserImage(), loadBotImage()])
  },
  { immediate: true },
)
</script>

<style scoped>
.reply-expand-enter-active,
.reply-expand-leave-active {
  overflow: hidden;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    max-height 0.2s ease;
}

.reply-expand-enter-from,
.reply-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-0.25rem);
}

.reply-expand-enter-to,
.reply-expand-leave-from {
  max-height: 24rem;
  opacity: 1;
  transform: translateY(0);
}
</style>

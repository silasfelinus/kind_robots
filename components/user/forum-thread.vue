<!-- /components/content/forum/forum-thread.vue -->
<template>
  <div class="space-y-6 w-full max-w-4xl mx-auto px-4 py-8">
    <!-- Channel Toggles -->
    <div class="flex flex-wrap justify-center gap-2 mb-6">
      <button
        v-for="channel in allChannels"
        :key="channel"
        @click="toggleChannel(channel)"
        class="btn btn-sm"
        :class="{
          'btn-accent': visibleChannels.includes(channel),
          'btn-outline': !visibleChannels.includes(channel),
        }"
      >
        {{ formatChannel(channel) }}
      </button>
    </div>

    <!-- Per-Channel Thread Groups -->
    <div v-for="channel in visibleChannels" :key="channel" class="space-y-4">
      <div class="flex justify-between items-center mt-8 mb-2">
        <h2 class="text-xl font-bold">
          {{ formatChannel(channel) }}
        </h2>
        <button
          class="btn btn-sm btn-primary"
          v-if="userStore.isLoggedIn"
          @click="startNewThread(channel)"
        >
          ➕ New Post
        </button>
      </div>

      <div
        v-for="thread in threadsByChannel(channel)"
        :key="thread.id"
        class="bg-base-100 p-4 rounded-xl shadow space-y-2"
      >
        <div class="text-sm text-gray-400">
          {{ formatDate(thread.createdAt) }}
        </div>
        <div class="font-semibold text-base-content">{{ thread.sender }}:</div>
        <div class="whitespace-pre-line">{{ thread.content }}</div>
        <div class="flex justify-between items-center">
          <button
            class="btn btn-sm btn-outline mt-2"
            @click="replyTo(thread.id)"
          >
            💬 Reply
          </button>
          <span
            v-if="getReplies(thread.id).length"
            class="text-sm text-accent-content"
          >
            {{ getReplies(thread.id).length }} repl{{
              getReplies(thread.id).length === 1 ? 'y' : 'ies'
            }}
          </span>
        </div>

        <!-- Replies -->
        <div
          v-if="getReplies(thread.id).length"
          class="pl-4 border-l-2 border-base-300 space-y-3 mt-3"
        >
          <div
            v-for="reply in getReplies(thread.id)"
            :key="reply.id"
            class="bg-base-200 p-3 rounded"
          >
            <div class="text-xs text-gray-400">
              {{ formatDate(reply.createdAt) }}
            </div>
            <div class="font-medium">{{ reply.sender }}</div>
            <div class="whitespace-pre-line">{{ reply.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- New Thread Composer (inline below all posts) -->
    <div
      v-if="userStore.isLoggedIn && composeChannel"
      class="bg-base-200 p-4 rounded-xl shadow mt-8"
    >
      <h2 class="text-lg font-bold mb-2">
        🧵 New Thread in {{ formatChannel(composeChannel) }}
      </h2>
      <textarea
        v-model="newThreadContent"
        class="textarea textarea-bordered w-full mb-2"
        rows="3"
        placeholder="What’s on your mind?"
      />
      <div class="flex gap-2">
        <button class="btn btn-primary" @click="postThread">Post</button>
        <button class="btn btn-outline" @click="cancelPost">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/forum/forum-thread.vue
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

const chatStore = useChatStore()
const userStore = useUserStore()

// Define all channels in the forum
const allChannels = ['share', 'introductions', 'news', 'activism'] as const
type ForumChannel = (typeof allChannels)[number]

// State
const visibleChannels = ref<ForumChannel[]>([...allChannels])
const composeChannel = ref<ForumChannel | null>(null)
const newThreadContent = ref('')
const replyOriginId = ref<number | null>(null)

// Toggle which channels are shown
function toggleChannel(channel: ForumChannel) {
  const index = visibleChannels.value.indexOf(channel)
  if (index > -1) {
    visibleChannels.value.splice(index, 1)
  } else {
    visibleChannels.value.push(channel)
  }
}

// Store-filtered threads
const threadsByChannel = (channel: ForumChannel) =>
  chatStore.chats.filter(
    (chat: {
      originId: null
      channel: string
      isPublic: any
      userId: any
      isMature: any
    }) =>
      chat.originId === null &&
      chat.channel === channel &&
      (chat.isPublic || chat.userId === userStore.user?.id) &&
      (!chat.isMature || userStore.showMature),
  )

const getReplies = (originId: number) =>
  chatStore.chats.filter(
    (chat: { originId: number }) => chat.originId === originId,
  )

function startNewThread(channel: ForumChannel) {
  composeChannel.value = channel
  newThreadContent.value = ''
}

function cancelPost() {
  composeChannel.value = null
  newThreadContent.value = ''
}

function postThread() {
  if (!newThreadContent.value.trim() || !composeChannel.value) return

  chatStore.addChat({
    content: newThreadContent.value.trim(),
    type: 'ToForum',
    channel: composeChannel.value,
    sender: userStore.user?.designerName || 'Anonymous',
    userId: userStore.user?.id || 0,
    originId: null,
    recipientId: null,
    characterId: null,
  })

  cancelPost()
}

function replyTo(id: number) {
  replyOriginId.value = id
  // future: open reply modal or inline input
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

function formatChannel(channel: ForumChannel) {
  switch (channel) {
    case 'share':
      return '📸 Share Work'
    case 'introductions':
      return '👋 Introductions'
    case 'news':
      return '📰 News'
    case 'activism':
      return '✊ Activism'
  }
}
</script>

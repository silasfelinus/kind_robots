<!-- /components/content/forum/forum-thread.vue -->
<template>
  <div class="space-y-6 w-full max-w-4xl mx-auto px-4 py-8">
    <!-- New Thread Composer -->
    <div v-if="userStore.isLoggedIn" class="bg-base-200 p-4 rounded-xl shadow">
      <h2 class="text-lg font-bold mb-2">🧵 Start a New Thread</h2>
      <textarea
        v-model="newThreadContent"
        class="textarea textarea-bordered w-full mb-2"
        rows="3"
        placeholder="What’s on your mind?"
      />
      <button class="btn btn-primary" @click="postThread">Post</button>
    </div>

    <!-- Thread List -->
    <div
      v-for="thread in topLevelThreads"
      :key="thread.id"
      class="bg-base-100 p-4 rounded-xl shadow space-y-2"
    >
      <div class="text-sm text-gray-400">
        {{ formatDate(thread.createdAt) }}
      </div>
      <div class="font-semibold text-base-content">{{ thread.sender }}:</div>
      <div class="whitespace-pre-line">{{ thread.content }}</div>
      <div class="flex justify-between items-center">
        <button class="btn btn-sm btn-outline mt-2" @click="replyTo(thread.id)">
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
</template>

<script setup lang="ts">
// /components/content/forum/forum-thread.vue

import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

const chatStore = useChatStore()
const userStore = useUserStore()

const newThreadContent = ref('')
const replyOriginId = ref<number | null>(null)

const topLevelThreads = computed(() =>
  chatStore.chats.filter(
    (chat) => chat.originId === null && chat.channel === 'forum',
  ),
)

const getReplies = (originId: number) =>
  chatStore.chats.filter((chat) => chat.originId === originId)

function postThread() {
  if (!newThreadContent.value.trim()) return
  chatStore.addChat({
    content: newThreadContent.value.trim(),
    type: 'ToForum',
    channel: 'forum',
    sender: userStore.user?.designerName || 'Anonymous',
    userId: userStore.user?.id || 0,
    originId: null,
    recipientId: null, // ✅ explicitly passed
    characterId: null, // ✅ explicitly passed
  })
  newThreadContent.value = ''
}

function replyTo(id: number) {
  replyOriginId.value = id
  // Your actual reply form/modal logic goes here
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
</script>

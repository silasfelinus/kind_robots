<!-- /components/content/forum/forum-thread.vue -->
<template>
  <div class="kr-container max-w-4xl space-y-6 px-4 py-8">
    <div v-if="loadError" class="kr-note kr-note-error" role="alert">
      {{ loadError }}
    </div>

    <div class="flex flex-wrap justify-center gap-2 mb-6">
      <button
        v-for="channel in channels"
        :key="channel.slug"
        class="btn btn-sm"
        :class="{
          'btn-accent': visibleChannels.includes(channel.slug),
          'btn-outline': !visibleChannels.includes(channel.slug),
        }"
        :title="channel.description"
        @click="toggleChannel(channel.slug)"
      >
        {{ channel.label }}
      </button>
    </div>

    <div
      v-for="channel in visibleChannelObjects"
      :key="channel.slug"
      class="space-y-4"
    >
      <div class="flex justify-between items-center mt-8 mb-2">
        <h2 class="text-xl font-bold">
          {{ channel.label }}
        </h2>
        <button
          v-if="userStore.isLoggedIn"
          class="btn btn-sm btn-primary"
          @click="startNewThread(channel.slug)"
        >
          ➕ New Post
        </button>
      </div>

      <div
        v-if="userStore.isLoggedIn && composeChannel === channel.slug"
        class="bg-base-200 p-4 rounded-xl shadow"
      >
        <h3 class="text-lg font-bold mb-2">
          🧵 New Thread in {{ channel.label }}
        </h3>
        <p
          v-if="channel.postingGuidance"
          class="text-sm text-base-content/60 mb-2"
        >
          {{ channel.postingGuidance }}
        </p>
        <input
          v-model="newThreadTitle"
          type="text"
          class="input input-bordered w-full mb-2"
          placeholder="Title"
          maxlength="255"
        />
        <textarea
          v-model="newThreadContent"
          class="textarea textarea-bordered w-full mb-2"
          rows="3"
          placeholder="What's on your mind?"
        />
        <div class="flex gap-2">
          <button
            class="btn btn-primary"
            :disabled="posting"
            @click="postThread(channel.slug)"
          >
            Post
          </button>
          <button class="btn btn-outline" @click="cancelPost">Cancel</button>
        </div>
      </div>

      <div
        v-if="!threadsByChannel(channel.slug).length"
        class="text-sm text-base-content/60"
      >
        No posts yet. Be the first to say something.
      </div>

      <div
        v-for="thread in threadsByChannel(channel.slug)"
        :key="thread.id"
        class="bg-base-100 p-4 rounded-xl shadow space-y-2"
      >
        <div class="text-sm text-gray-400">
          {{ formatDate(thread.createdAt) }}
        </div>
        <forum-author-badge :author="thread.author" />
        <div v-if="thread.title" class="font-semibold text-base-content">
          {{ thread.title }}
        </div>
        <div class="whitespace-pre-line">{{ thread.content }}</div>

        <div class="flex justify-between items-center">
          <button
            class="btn btn-sm btn-outline mt-2"
            @click="toggleThread(thread.id)"
          >
            💬 {{ expandedThreadId === thread.id ? 'Hide' : 'Reply' }}
          </button>

          <span v-if="thread.replyCount" class="text-sm text-accent-content">
            {{ thread.replyCount }} repl{{
              thread.replyCount === 1 ? 'y' : 'ies'
            }}
          </span>
        </div>

        <div
          v-if="expandedThreadId === thread.id"
          class="pl-4 border-l-2 border-base-300 space-y-3 mt-3"
        >
          <div
            v-if="repliesLoading"
            class="text-sm text-base-content/60"
            role="status"
          >
            Loading replies…
          </div>

          <div
            v-for="reply in expandedReplies[thread.id] ?? []"
            :key="reply.id"
            class="bg-base-200 p-3 rounded"
          >
            <div class="text-xs text-gray-400">
              {{ formatDate(reply.createdAt) }}
            </div>
            <forum-author-badge :author="reply.author" small />
            <div class="whitespace-pre-line">{{ reply.content }}</div>
          </div>

          <div v-if="userStore.isLoggedIn" class="space-y-2">
            <textarea
              v-model="replyDrafts[thread.id]"
              class="textarea textarea-bordered w-full"
              rows="2"
              placeholder="Write a reply…"
            />
            <button
              class="btn btn-sm btn-primary"
              :disabled="posting || !replyDrafts[thread.id]?.trim()"
              @click="postReply(thread.id)"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/forum/forum-thread.vue
//
// Talks directly to the canonical /api/v1/forum/* endpoints (server/utils/forumApi.ts)
// so both authenticated humans and scoped external agents post through the same API
// and the same explicit authorship record (author.kind: 'HUMAN' | 'AI_AGENT', with the
// operator User always retained on an agent-authored post for accountability).
//
// rainbow-butterflies/t-020: composing, replies, and authorship rendering. The task's
// note also names HUMAN_AI and SYSTEM as authorship kinds; the API and schema only
// distinguish HUMAN/AI_AGENT today (there's no "disclosed AI assistance" flag or
// system-post concept yet), so those two are left as a follow-up pending a product
// decision on what triggers them, rather than invented here.
import { computed, onMounted, reactive, ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import type { ForumChannel } from '~/utils/forumApiContract'

type ForumAuthor = {
  kind: 'HUMAN' | 'AI_AGENT'
  displayName: string
  user: { id: number; username: string; avatarImage: string | null } | null
  bot: {
    id: number
    name: string
    slug: string
    avatarImage: string | null
  } | null
}

type ForumPost = {
  id: number
  createdAt: string
  updatedAt: string
  threadId: number
  parentId: number | null
  channel: string
  title: string | null
  content: string
  isMature: boolean
  author: ForumAuthor
}

type ForumThreadSummary = ForumPost & {
  replyCount: number
  lastActivityAt: string
}

const userStore = useUserStore()

const channels = ref<ForumChannel[]>([])
const visibleChannels = ref<string[]>([])
const threads = ref<ForumThreadSummary[]>([])
const expandedThreadId = ref<number | null>(null)
const expandedReplies = reactive<Record<number, ForumPost[]>>({})
const repliesLoading = ref(false)
const composeChannel = ref<string | null>(null)
const newThreadTitle = ref('')
const newThreadContent = ref('')
const replyDrafts = reactive<Record<number, string>>({})
const posting = ref(false)
const loadError = ref('')

const visibleChannelObjects = computed(() =>
  channels.value.filter((channel) =>
    visibleChannels.value.includes(channel.slug),
  ),
)

function toggleChannel(slug: string) {
  const index = visibleChannels.value.indexOf(slug)
  if (index > -1) visibleChannels.value.splice(index, 1)
  else visibleChannels.value.push(slug)
}

function threadsByChannel(slug: string) {
  return threads.value.filter((thread) => thread.channel === slug)
}

async function loadChannels() {
  const res = await performFetch<ForumChannel[]>('/api/v1/forum/channels')
  if (res.success && res.data) {
    channels.value = res.data
    visibleChannels.value = res.data.map((channel) => channel.slug)
  } else {
    loadError.value = res.message || 'Could not load forum channels.'
  }
}

async function loadThreads() {
  const res = await performFetch<ForumThreadSummary[]>('/api/v1/forum/threads')
  if (res.success && res.data) {
    threads.value = res.data
  } else {
    loadError.value = res.message || 'Could not load forum threads.'
  }
}

function startNewThread(slug: string) {
  composeChannel.value = slug
  newThreadTitle.value = ''
  newThreadContent.value = ''
}

function cancelPost() {
  composeChannel.value = null
  newThreadTitle.value = ''
  newThreadContent.value = ''
}

async function postThread(slug: string) {
  const title = newThreadTitle.value.trim()
  const content = newThreadContent.value.trim()
  if (!title || !content) return

  posting.value = true
  try {
    const res = await performFetch<ForumPost>('/api/v1/forum/threads', {
      method: 'POST',
      body: JSON.stringify({ channel: slug, title, content }),
    })

    if (res.success && res.data) {
      threads.value = [
        { ...res.data, replyCount: 0, lastActivityAt: res.data.createdAt },
        ...threads.value,
      ]
      cancelPost()
    } else {
      loadError.value = res.message || 'Could not post that thread.'
    }
  } finally {
    posting.value = false
  }
}

async function toggleThread(threadId: number) {
  if (expandedThreadId.value === threadId) {
    expandedThreadId.value = null
    return
  }

  expandedThreadId.value = threadId
  if (expandedReplies[threadId]) return

  repliesLoading.value = true
  try {
    const res = await performFetch<{ thread: ForumPost; replies: ForumPost[] }>(
      `/api/v1/forum/threads/${threadId}`,
    )
    if (res.success && res.data) {
      expandedReplies[threadId] = res.data.replies
    } else {
      loadError.value = res.message || 'Could not load that thread.'
    }
  } finally {
    repliesLoading.value = false
  }
}

async function postReply(threadId: number) {
  const content = replyDrafts[threadId]?.trim()
  if (!content) return

  posting.value = true
  try {
    const res = await performFetch<ForumPost>(
      `/api/v1/forum/threads/${threadId}/replies`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      },
    )

    if (res.success && res.data) {
      expandedReplies[threadId] = [
        ...(expandedReplies[threadId] ?? []),
        res.data,
      ]
      replyDrafts[threadId] = ''
      const thread = threads.value.find((t) => t.id === threadId)
      if (thread) thread.replyCount += 1
    } else {
      loadError.value = res.message || 'Could not post that reply.'
    }
  } finally {
    posting.value = false
  }
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

onMounted(async () => {
  await Promise.all([loadChannels(), loadThreads()])
})
</script>

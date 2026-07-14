<!-- /components/user/messenger.vue -->
<!--
  Threaded direct messages: conversation list on the left, active thread +
  composer on the right. Unread badges and read receipts come from
  conversationStore (lastReadAt-driven). Bot/forum chat stays on chatStore.
-->
<template>
  <section class="mx-auto flex h-[70vh] w-full max-w-5xl gap-3 p-3">
    <!-- Conversation list -->
    <aside
      class="flex w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 sm:w-72"
    >
      <header
        class="flex items-center justify-between border-b border-base-300 p-3"
      >
        <h2 class="font-black">Messages</h2>
        <button
          class="btn btn-ghost btn-xs"
          :disabled="convo.isLoadingList"
          @click="convo.loadConversations()"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
        </button>
      </header>
      <div class="flex-1 overflow-y-auto">
        <p
          v-if="!convo.conversations.length && !convo.isLoadingList"
          class="p-4 text-sm text-base-content/50"
        >
          No conversations yet. Find people on the
          <NuxtLink to="/friends" class="link">friends page</NuxtLink>.
        </p>
        <button
          v-for="c in convo.conversations"
          :key="c.id"
          class="flex w-full items-center gap-2 border-b border-base-200 p-3 text-left hover:bg-base-200"
          :class="{ 'bg-base-200': c.id === convo.activeId }"
          @click="convo.loadMessages(c.id)"
        >
          <div class="avatar">
            <div class="h-9 w-9 rounded-full bg-base-300">
              <img
                v-if="peer(c)?.avatarImage"
                :src="peer(c)?.avatarImage || ''"
                :alt="peer(c)?.username"
              />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <span class="truncate font-semibold">{{
                peer(c)?.username || 'Conversation'
              }}</span>
              <span v-if="c.unreadCount" class="badge badge-primary badge-sm">{{
                c.unreadCount
              }}</span>
            </div>
            <span class="block truncate text-xs text-base-content/60">
              {{ c.lastMessage?.content || 'Say hello…' }}
            </span>
          </div>
        </button>
      </div>
    </aside>

    <!-- Active thread -->
    <div
      class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <template v-if="convo.activeId">
        <header class="flex items-center gap-2 border-b border-base-300 p-3">
          <div class="avatar">
            <div class="h-8 w-8 rounded-full bg-base-300">
              <img
                v-if="activePeer?.avatarImage"
                :src="activePeer?.avatarImage || ''"
                :alt="activePeer?.username"
              />
            </div>
          </div>
          <span class="font-black">{{
            activePeer?.username || 'Conversation'
          }}</span>
        </header>

        <div ref="scrollBox" class="flex-1 space-y-2 overflow-y-auto p-3">
          <p
            v-if="convo.isLoadingThread"
            class="text-center text-sm text-base-content/50"
          >
            Loading…
          </p>
          <div
            v-for="m in convo.messages"
            :key="m.id"
            class="flex"
            :class="m.senderId === myId ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
              :class="
                m.senderId === myId
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200'
              "
            >
              {{ m.content }}
            </div>
          </div>
        </div>

        <form
          class="flex items-center gap-2 border-t border-base-300 p-3"
          @submit.prevent="onSend"
        >
          <input
            v-model="draft"
            placeholder="Write a message…"
            class="input input-bordered flex-1 rounded-xl bg-base-200"
          />
          <button
            type="submit"
            class="btn btn-primary rounded-xl"
            :disabled="convo.isSending || !draft.trim()"
          >
            <span
              v-if="convo.isSending"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:send" class="h-4 w-4" />
          </button>
        </form>
        <p v-if="convo.lastError" class="px-3 pb-2 text-xs text-error">
          {{ convo.lastError }}
        </p>
      </template>

      <div
        v-else
        class="flex flex-1 items-center justify-center text-base-content/50"
      >
        Select a conversation
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import {
  useConversationStore,
  type ConversationSummary,
} from '@/stores/conversationStore'

const userStore = useUserStore()
const convo = useConversationStore()
const route = useRoute()

const draft = ref('')
const scrollBox = ref<HTMLElement>()

const myId = computed(() => userStore.user?.id ?? null)

function peer(c: ConversationSummary) {
  return c.participants[0] ?? null
}
const activePeer = computed(() =>
  convo.activeConversation ? peer(convo.activeConversation) : null,
)

async function onSend() {
  if (!convo.activeId) return
  const ok = await convo.sendMessage(convo.activeId, draft.value)
  if (ok) {
    draft.value = ''
    await scrollToBottom()
  }
}

async function scrollToBottom() {
  await nextTick()
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight
}

watch(() => convo.messages.length, scrollToBottom)

onMounted(async () => {
  await convo.loadConversations()
  const target = Number(route.query.c)
  if (Number.isInteger(target) && target > 0) {
    await convo.loadMessages(target)
  }
})
</script>

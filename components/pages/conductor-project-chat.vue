<!-- /components/pages/conductor-project-chat.vue -->
<!-- Direct AI contact for a single Project. New chats persist through projectId;
     dreamId remains an optional compatibility link during the schema cutover. -->
<template>
  <div class="space-y-3 rounded-2xl border border-primary/20 bg-base-100 p-4">
    <div class="flex items-center gap-2">
      <Icon name="kind-icon:chat" class="size-4 text-primary" />
      <h4
        class="text-xs font-bold uppercase tracking-wide text-base-content/60"
      >
        Project Assistant
      </h4>
      <span class="ml-auto text-xs text-base-content/30">
        Knows this project's goal, roadmap, and tasks
      </span>
    </div>

    <div
      v-if="projectChats.length"
      ref="threadEl"
      class="max-h-80 space-y-3 overflow-y-auto pr-1"
    >
      <div v-for="chat in projectChats" :key="chat.id" class="space-y-2">
        <div class="chat chat-end">
          <div
            class="chat-bubble chat-bubble-primary max-w-[85%] whitespace-pre-wrap text-sm"
          >
            {{ chat.content }}
          </div>
        </div>
        <div class="chat chat-start">
          <div
            class="chat-bubble max-w-[85%] whitespace-pre-wrap bg-base-200 text-sm text-base-content"
          >
            <span
              v-if="!chat.botResponse"
              class="loading loading-dots loading-sm"
            />
            <template v-else>{{ chat.botResponse }}</template>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-xs text-base-content/40">
      Ask anything about this project — what to do next, how to break down a
      step, or where you can help most right now.
    </p>

    <form class="flex gap-2" @submit.prevent="sendMessage">
      <input
        v-model="message"
        type="text"
        :placeholder="`Ask about ${projectTitle}...`"
        class="input input-bordered input-sm flex-1 rounded-xl text-sm"
        :disabled="isResponding"
      />
      <button
        type="submit"
        class="btn btn-primary btn-sm gap-1 rounded-xl"
        :disabled="!message.trim() || isResponding"
      >
        <span v-if="isResponding" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:chat" class="size-3.5" />
        Send
      </button>
    </form>
    <p v-if="errorMessage" class="text-xs text-error">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const props = defineProps<{
  projectId: number
  projectTitle: string
  dreamId?: number | null
  projectContext: string
}>()

const chatStore = useChatStore()
const userStore = useUserStore()

const message = ref('')
const errorMessage = ref('')
const sessionChatIds = ref<number[]>([])
const threadEl = ref<HTMLElement | null>(null)

const channel = computed(() => `project-${props.projectId}-assistant`)
const legacyChannel = computed(() =>
  props.dreamId ? `dream-${props.dreamId}-assistant` : '',
)

const projectChats = computed(() =>
  chatStore.chats
    .filter(
      (chat) =>
        chat.projectId === props.projectId ||
        chat.channel === channel.value ||
        (legacyChannel.value && chat.channel === legacyChannel.value) ||
        sessionChatIds.value.includes(chat.id),
    )
    .sort((a, b) => a.id - b.id),
)

const isResponding = computed(() =>
  projectChats.value.some(
    (chat) => sessionChatIds.value.includes(chat.id) && !chat.botResponse,
  ),
)

const systemPrompt = computed(() =>
  [
    `You are the Kind Robots project assistant for the project "${props.projectTitle}".`,
    'Help the user move this project forward through small, incremental steps (kaizen).',
    'Be concrete and encouraging: suggest next actions, help refine the goal and roadmap,',
    'and point out where the user can help most right now. Keep answers short and useful.',
    '',
    'Current project state:',
    props.projectContext,
  ].join('\n'),
)

function buildMessages(latestPrompt: string): BotCafeMessage[] {
  const history = projectChats.value.flatMap((chat) => {
    const turns: BotCafeMessage[] = [{ role: 'user', content: chat.content }]
    if (chat.botResponse) {
      turns.push({ role: 'assistant', content: chat.botResponse })
    }
    return turns
  })

  return [
    { role: 'system', content: systemPrompt.value },
    ...history,
    { role: 'user', content: latestPrompt },
  ]
}

async function scrollToBottom() {
  await nextTick()
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
}

async function sendMessage() {
  const content = message.value.trim()
  if (!content || isResponding.value) return

  errorMessage.value = ''
  const messages = buildMessages(content)

  try {
    const newChat = await chatStore.addChat({
      content,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      recipientId: null,
      characterId: null,
      type: 'Dream',
      isPublic: false,
      channel: channel.value,
      projectId: props.projectId,
      dreamId: props.dreamId ?? null,
    })

    sessionChatIds.value.push(newChat.id)
    message.value = ''
    await scrollToBottom()

    await chatStore.streamResponse(newChat.id, {
      messages,
      maxTokens: 1024,
    })
    await scrollToBottom()
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'The assistant could not respond. Try again.'
  }
}
</script>

<!-- /components/content/bots/bot-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        Bot Interact
      </h1>

      <p class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base">
        Chat with the selected bot, use starter prompts, and stream responses
        through the active text server.
      </p>
    </header>

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

    <section
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100">
        <div class="shrink-0 border-b border-base-300 p-4">
          <div
            v-if="botStore.currentBot"
            class="flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            <img
              :src="selectedBotImage"
              :alt="selectedBotName"
              class="h-24 w-24 shrink-0 rounded-2xl border border-base-300 object-cover"
            />

            <div class="min-w-0 flex-1 text-center sm:text-left">
              <h2 class="truncate text-2xl font-black text-base-content">
                {{ selectedBotName }}
              </h2>

              <p
                v-if="botStore.currentBot.subtitle"
                class="mt-1 truncate text-sm italic text-base-content/55"
              >
                {{ botStore.currentBot.subtitle }}
              </p>

              <p class="mt-2 line-clamp-3 text-sm text-base-content/70">
                {{ selectedBotSummary }}
              </p>
            </div>

            <div class="flex shrink-0 flex-col gap-2">
              <button
                class="btn btn-sm btn-secondary rounded-xl"
                type="button"
                @click="newChat"
              >
                New Chat
              </button>

              <button
                class="btn btn-sm btn-ghost rounded-xl"
                type="button"
                @click="botStore.deselectBot()"
              >
                Clear Bot
              </button>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
          >
            <p class="font-bold">No bot selected.</p>

            <bot-gallery
              variant="dropdown"
              title="Bot"
              subtitle="Choose a bot."
              :show-images="false"
              :show-controls="false"
              :show-toolbar="false"
              :show-card-actions="false"
              :show-launch-button="false"
            />
          </div>
        </div>

        <div ref="chatLogRef" class="min-h-0 overflow-y-auto bg-base-200 p-4">
          <div
            v-if="sessionChats.length === 0"
            class="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center text-base-content/45"
          >
            <Icon name="kind-icon:chat" class="h-16 w-16 text-primary/60" />

            <div>
              <p class="text-lg font-bold">Start the conversation</p>
              <p class="mt-1 text-sm">
                Use a starter prompt, or type something suspiciously brilliant.
              </p>
            </div>
          </div>

          <div v-else class="flex flex-col gap-4">
            <article
              v-for="chat in sessionChats"
              :key="chat.id"
              class="flex flex-col gap-3"
            >
              <div class="flex flex-row-reverse gap-3">
                <div
                  class="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-content shadow-sm"
                >
                  <p class="whitespace-pre-wrap">
                    {{ chat.content }}
                  </p>
                </div>
              </div>

              <div class="flex flex-row gap-3">
                <img
                  :src="selectedBotImage"
                  :alt="selectedBotName"
                  class="h-9 w-9 shrink-0 self-end rounded-full border border-base-300 object-cover"
                />

                <div
                  class="max-w-[80%] rounded-2xl rounded-bl-sm bg-base-100 px-4 py-3 text-sm leading-relaxed shadow-sm"
                >
                  <span
                    v-if="!chat.botResponse"
                    class="flex items-center gap-1 py-1 text-base-content/60"
                  >
                    <span class="bot-dot" />
                    <span class="bot-dot delay-150" />
                    <span class="bot-dot delay-300" />
                  </span>

                  <p v-else class="whitespace-pre-wrap text-base-content/80">
                    {{ chat.botResponse }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="shrink-0 border-t border-base-300 bg-base-100 p-3">
          <div
            v-if="parsedUserPrompts.length"
            class="mb-3 flex flex-wrap gap-2"
          >
            <button
              v-for="prompt in parsedUserPrompts"
              :key="prompt.id"
              class="btn btn-xs btn-outline rounded-full"
              type="button"
              :disabled="isResponding"
              @click="usePrompt(prompt.text)"
            >
              {{ prompt.text }}
            </button>
          </div>

          <div class="mb-2 flex flex-wrap items-center gap-2">
            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              @click="fillStarter"
            >
              Starter
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              @click="fillWeird"
            >
              Weird
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              @click="copyBotIntro"
            >
              Bot Intro
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              @click="clearMessage"
            >
              Clear
            </button>

            <span class="ml-auto text-xs text-base-content/50">
              {{ activeServerName }}
            </span>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <textarea
              v-model="message"
              class="textarea textarea-bordered min-h-20 resize-none rounded-2xl bg-base-200 text-sm leading-relaxed"
              placeholder="Message the selected bot..."
              :disabled="!botStore.currentBot || isResponding"
              @keydown.enter.exact.prevent="sendMessage"
            />

            <button
              class="btn btn-primary min-h-20 rounded-2xl text-white"
              type="button"
              :disabled="!canSend"
              @click="sendMessage"
            >
              <span
                v-if="isResponding"
                class="loading loading-spinner loading-sm"
              />
              <span v-else>Send</span>
            </button>
          </div>
        </div>
      </div>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold text-base-content">
                Session Controls
              </h2>

              <p class="text-sm text-base-content/60">
                Local options for this chat session.
              </p>
            </div>

            <Icon name="kind-icon:sliders" class="h-6 w-6 text-primary" />
          </div>

          <div class="grid gap-4">
            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="label-text font-bold">Temperature</span>
                <span class="font-mono text-sm font-bold text-primary">
                  {{ temperature.toFixed(1) }}
                </span>
              </div>

              <input
                v-model.number="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                class="range range-primary range-sm"
              />

              <div class="mt-1 flex justify-between text-xs text-base-content/45">
                <span>precise</span>
                <span>balanced</span>
                <span>wild</span>
              </div>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Model</span>
              </span>

              <input
                v-model="modelName"
                class="input input-bordered input-sm bg-base-200"
                placeholder="Optional model override"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Max Tokens</span>
              </span>

              <input
                v-model.number="maxTokens"
                class="input input-bordered input-sm bg-base-200"
                type="number"
                min="128"
                step="128"
              />
            </label>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="text-lg font-bold text-base-content">Selected Bot</h2>

          <bot-card
            v-if="botStore.currentBot"
            :bot="botStore.currentBot"
            :selected="true"
            :show-actions="false"
            :show-launch-button="false"
            :show-prompt-preview="true"
            :compact="false"
          />

          <div
            v-else
            class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/55"
          >
            Pick a bot first. Even robots need casting.
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-base-content">
              Prompt Preview
            </h2>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!promptPreview"
              @click="copyPromptPreview"
            >
              Copy
            </button>
          </div>

          <pre class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-xs text-base-content/70">{{ promptPreview }}</pre>
        </section>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type SessionChat = {
  id: number
  content: string
  botResponse?: string | null
}

const botStore = useBotStore()
const chatStore = useChatStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const chatLogRef = ref<HTMLElement | null>(null)
const message = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const temperature = ref(0.7)
const modelName = ref('')
const maxTokens = ref(2048)
const sessionChatIds = ref<number[]>([])

const selectedBotName = computed(() => botStore.currentBot?.name || 'Bot')

const selectedBotImage = computed(
  () => botStore.currentBot?.avatarImage || '/images/bot.webp',
)

const selectedBotSummary = computed(() => {
  return (
    botStore.currentBot?.description ||
    botStore.currentBot?.subtitle ||
    botStore.currentBot?.tagline ||
    'A bot of mystery. Suspiciously helpful.'
  )
})

const activeServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    botStore.currentBot?.serverName ||
    'No text server selected'
  )
})

const parsedUserPrompts = computed(() => {
  const raw = botStore.currentBot?.userIntro || ''

  return raw
    .split('|')
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: index + 1,
      text,
    }))
})

const sessionChats = computed<SessionChat[]>(() => {
  return chatStore.chats.filter((chat) =>
    sessionChatIds.value.includes(chat.id),
  ) as SessionChat[]
})

const isResponding = computed(() => {
  return sessionChats.value.some((chat) => !chat.botResponse)
})

const canSend = computed(() => {
  return Boolean(
    botStore.currentBot && message.value.trim() && !isResponding.value,
  )
})

const promptPreview = computed(() => {
  const bot = botStore.currentBot

  if (!bot) return ''

  return [
    `Bot: ${bot.name || 'Unnamed Bot'}`,
    bot.subtitle ? `Subtitle: ${bot.subtitle}` : '',
    bot.personality ? `Personality: ${bot.personality}` : '',
    bot.prompt ? `System Prompt: ${bot.prompt}` : '',
    bot.botIntro ? `Bot Intro: ${bot.botIntro}` : '',
    message.value.trim() ? `User Message: ${message.value.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

function setStatus(messageText: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = messageText
  statusTone.value = tone
}

function scrollToBottom() {
  const el = chatLogRef.value

  if (!el) return

  el.scrollTop = el.scrollHeight
}

function newChat() {
  sessionChatIds.value = []
  message.value = ''
  statusMessage.value = ''
}

function usePrompt(prompt: string) {
  message.value = prompt
}

function fillStarter() {
  const name = botStore.currentBot?.name || 'bot'
  message.value = `Hey ${name}, I want your help with something.`
}

function fillWeird() {
  const name = botStore.currentBot?.name || 'bot'
  message.value = `Hey ${name}, let's make something strange, clever, and unexpectedly excellent.`
}

function copyBotIntro() {
  message.value = botStore.currentBot?.botIntro || ''
}

function clearMessage() {
  message.value = ''
}

async function sendMessage() {
  const bot = botStore.currentBot
  const content = message.value.trim()

  if (!bot || !content || isResponding.value) return

  statusMessage.value = ''
  promptStore.currentPrompt = content

  try {
    const newChat = await chatStore.addChat({
      botId: bot.id,
      content,
      isPublic: false,
      userId: userStore.userId ?? userStore.user?.id ?? 10,
      type: 'ToBot',
      recipientId: bot.id,
      characterId: null,
      serverId: bot.serverId ?? serverStore.activeTextServer?.id ?? null,
      temperature: temperature.value,
      model: modelName.value || undefined,
      maxTokens: maxTokens.value,
    } as Parameters<typeof chatStore.addChat>[0])

    if (!newChat?.id) {
      throw new Error('Failed to create chat.')
    }

    sessionChatIds.value.push(newChat.id)
    message.value = ''

    await nextTick()
    scrollToBottom()

    if (typeof chatStore.streamResponse === 'function') {
      await chatStore.streamResponse(newChat.id)
    }

    await nextTick()
    scrollToBottom()
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : 'Send failed. Check bot and server config.',
      'error',
    )
  }
}

async function copyPromptPreview() {
  if (!promptPreview.value) return

  await navigator.clipboard.writeText(promptPreview.value)
  setStatus('Prompt preview copied.')
}

onMounted(async () => {
  await Promise.all([
    botStore.initialize({
      fetchRemote: true,
      initializeServerStore: true,
      createBlankForm: true,
    }),
    chatStore.initialize(),
    serverStore.initialize({
      fetchRemote: true,
    }),
  ])

  if (botStore.pendingLaunchMessage) {
    message.value = botStore.pendingLaunchMessage
    botStore.clearPendingLaunchMessage()
  }

  if (!modelName.value && serverStore.activeTextServer?.model) {
    modelName.value = serverStore.activeTextServer.model
  }
})

watch(
  () => botStore.currentBot?.id,
  () => {
    newChat()

    if (botStore.currentBot?.userIntro) {
      const firstPrompt = parsedUserPrompts.value[0]?.text

      if (firstPrompt) {
        message.value = firstPrompt
      }
    }
  },
)

watch(
  () => sessionChats.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollToBottom()
  },
)
</script>

<style scoped>
.bot-dot {
  display: inline-block;
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 9999px;
  background: currentColor;
  animation: bot-bounce 1s ease-in-out infinite;
}

.delay-150 {
  animation-delay: 150ms;
}

.delay-300 {
  animation-delay: 300ms;
}

@keyframes bot-bounce {
  0%,
  80%,
  100% {
    opacity: 0.4;
    transform: scale(0.65);
  }

  40% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
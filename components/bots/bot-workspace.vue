<!-- /components/bots/bot-workspace.vue -->
<!--
  The Bot working surface: the conversation, its controls, and the prompt
  preview. Split out of bot-interact.vue, which was 720 lines because all of
  this was inlined in the component whose only job is choosing between browsing
  and chatting.

  Nothing about how a Bot conversation works changed here; the template and
  script moved across intact apart from where the session is kept (see below).

  MULTI-ROOT, AND NO CLASS FROM THE ROUTER. The status banner and the
  conversation grid are siblings, so an attribute from the parent would have
  nowhere to land. The grid carries its own `min-h-0 flex-1`.

  THE BANNER LIVES HERE, unlike scenario-interact where it stays in the router.
  Both setters -- a failed send and the prompt-preview copy -- are things that
  only happen once you are working with a Bot, so it has nothing to report
  while you are still browsing the gallery.
-->
<template>
  <div
    v-if="statusMessage"
    class="kr-note"
    :class="statusTone === 'error' ? 'kr-note-error' : 'kr-note-success'"
  >
    {{ statusMessage }}
  </div>

  <section
    class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
  >
    <div
      class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
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
              @click="clearBot"
            >
              Clear Bot
            </button>
          </div>
        </div>

        <div v-else class="kr-note kr-note-warning flex flex-col gap-3">
          <p class="font-bold">No bot selected.</p>

          <bot-gallery
            variant="dropdown"
            title="Bot"
            subtitle="Choose a bot."
            :show-images="false"
            :show-controls="false"
            :show-card-actions="false"
            :show-launch-button="false"
          />
        </div>
      </div>

      <!-- The bot chat log is kr-chat-window (interface-vision Phase 5).
           It was the fourth copy of the same idea: user/bot pairs, a portrait,
           three bouncing dots while the model writes. The window owns the
           scroll and follows the conversation itself, so chatLogRef and
           scrollToBottom are gone with it. -->
      <kr-chat-window
        class="bg-base-200 p-4"
        :turns="chatTurns"
        :label="`${selectedBotName} conversation`"
        :is-streaming="isResponding"
        :streaming-label="`${selectedBotName} is thinking…`"
        :prose="false"
      >
        <template #footer>
          <div
            v-if="sessionChats.length === 0"
            class="flex min-h-72 flex-col items-center justify-center gap-3 text-center text-base-content/45"
          >
            <Icon name="kind-icon:chat" class="h-16 w-16 text-primary/60" />

            <div>
              <p class="text-lg font-bold">Start the conversation</p>
              <p class="mt-1 text-sm">
                Use a starter prompt, or type something suspiciously brilliant.
              </p>
            </div>
          </div>
        </template>
      </kr-chat-window>

      <div class="shrink-0 border-t border-base-300 bg-base-100 p-3">
        <!-- Starter prompts were a sixth hand-rolled pick-one row. -->
        <kr-choice-list
          class="mb-3"
          layout="row"
          label="Starter prompts"
          :choices="promptChoices"
          :disabled="isResponding"
          :show-index="false"
          @select="usePrompt($event.label)"
        />

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
              Runtime options for this chat session.
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

          <div
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
          >
            <p class="text-xs font-bold uppercase text-base-content/50">
              Active Text Server
            </p>

            <p class="mt-1 font-semibold text-base-content/80">
              {{ activeServerName }}
            </p>

            <p class="mt-1 text-xs text-base-content/50">
              Servers are selected at runtime. Bots stay portable.
            </p>
          </div>
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

      <EntityArtManager
        v-if="botStore.currentBot"
        entity-type="bot"
        :entity="botStore.currentBot"
        :slots="[
          {
            field: 'avatarImage',
            label: 'Avatar',
            aspect: '1 / 1',
            width: 1024,
            height: 1024,
          },
          {
            field: 'iconPath',
            label: 'Icon',
            aspect: '1 / 1',
            width: 256,
            height: 256,
          },
          {
            field: 'cardPath',
            label: 'Card',
            aspect: '2 / 3',
            width: 512,
            height: 768,
          },
          {
            field: 'heroPath',
            label: 'Hero',
            aspect: '16 / 9',
            width: 1280,
            height: 720,
          },
        ]"
      />

      <section
        class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-lg font-bold text-base-content">Prompt Preview</h2>

          <button
            class="btn btn-xs btn-ghost rounded-xl"
            type="button"
            :disabled="!promptPreview"
            @click="copyPromptPreview"
          >
            Copy
          </button>
        </div>

        <pre
          class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-xs text-base-content/70"
          >{{ promptPreview }}</pre>
      </section>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'

type SessionChat = {
  id: number
  content: string
  botResponse?: string | null
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

const botStore = useBotStore()
const chatStore = useChatStore()
const promptStore = usePromptStore()
const serverStore = useServerStore()

const message = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const temperature = ref(0.7)
const modelName = ref('')
const maxTokens = ref(2048)

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

const runtimeTextServer = computed(() => {
  const botServerId = botStore.currentBot?.serverId

  if (typeof botServerId === 'number') {
    return (
      serverStore.getServerById(botServerId) ??
      serverStore.activeTextServer ??
      null
    )
  }

  return serverStore.activeTextServer ?? null
})

const activeServerName = computed(() => {
  const server = runtimeTextServer.value

  return server?.label || server?.title || 'Platform text route'
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

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const systemPrompt = computed(() => {
  const bot = botStore.currentBot

  if (!bot) return 'You are a helpful assistant.'

  return [
    bot.prompt || '',
    bot.personality ? `Personality: ${bot.personality}` : '',
    bot.botIntro ? `Bot introduction: ${bot.botIntro}` : '',
    bot.description ? `Bot description: ${bot.description}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim()
})

const fullSessionMessages = computed<BotCafeMessage[]>(() => {
  return sessionChats.value.flatMap((chat) => {
    const messages: BotCafeMessage[] = [
      {
        role: 'user',
        content: chat.content,
      },
    ]

    if (chat.botResponse) {
      messages.push({
        role: 'assistant',
        content: chat.botResponse,
      })
    }

    return messages
  })
})

function buildMessagesForBotResponse(): BotCafeMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt.value || 'You are a helpful assistant.',
    },
    ...fullSessionMessages.value,
  ]
}

/*
 * The session comes from chatStore, not a local array.
 *
 * bot-interact routes on "a Bot is selected OR a conversation is under way",
 * and the second half used to be a private ref in this file -- so the router
 * would have lost sight of its own condition when the working surface moved
 * out. Session membership is a fact about the chats, so the store owns it,
 * keyed by scope so Bots, Rewards and Characters do not share one.
 */
const sessionChats = computed<SessionChat[]>(
  () => chatStore.sessionChats('bot') as SessionChat[],
)

const isResponding = computed(() => {
  return sessionChats.value.some((chat) => !chat.botResponse)
})

const canSend = computed(() => {
  return Boolean(
    botStore.currentBot && message.value.trim() && !isResponding.value,
  )
})

/*
 * The session as kr-chat-window turns.
 *
 * A stored chat is one record holding BOTH sides of an exchange, so each one
 * becomes a user turn followed by the bot's reply. A record still awaiting a
 * reply contributes only the user turn — the window's streaming placeholder
 * stands in for it, which is what the three bouncing dots used to do by hand.
 */
const chatTurns = computed<NarrativeTurn[]>(() => {
  const turns: NarrativeTurn[] = []

  for (const chat of sessionChats.value) {
    turns.push({ id: `ask-${chat.id}`, text: chat.content, from: 'user' })

    if (chat.botResponse) {
      turns.push({
        id: `reply-${chat.id}`,
        text: chat.botResponse,
        from: 'narrator',
        speaker: selectedBotName.value,
        portrait: selectedBotImage.value,
      })
    }
  }

  return turns
})

/* The bot's userIntro starters as shared-list choices. Keyed by text rather
   than the parsed index so a re-parse cannot reshuffle which button is which. */
const promptChoices = computed(() =>
  parsedUserPrompts.value.map((prompt) => ({
    key: prompt.text,
    label: prompt.text,
  })),
)

const promptPreview = computed(() => {
  const bot = botStore.currentBot

  if (!bot) return ''

  return [
    `Bot: ${bot.name || 'Unnamed Bot'}`,
    bot.subtitle ? `Subtitle: ${bot.subtitle}` : '',
    bot.personality ? `Personality: ${bot.personality}` : '',
    bot.prompt ? `System Prompt: ${bot.prompt}` : '',
    bot.botIntro ? `Bot Intro: ${bot.botIntro}` : '',
    `Text Server: ${activeServerName.value}`,
    message.value.trim() ? `User Message: ${message.value.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
})

function setStatus(messageText: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = messageText
  statusTone.value = tone
}

function newChat() {
  chatStore.clearSessionChats('bot')
  message.value = ''
  statusMessage.value = ''
}

function clearBot() {
  botStore.deselectBot()
  newChat()
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
    const payload: ChatRuntimeInput = {
      botId: bot.id,
      content,
      isPublic: false,
      type: 'ToBot',
      recipientId: bot.id,
      characterId: null,
      serverId: runtimeTextServer.value?.id ?? null,
      serverName: runtimeTextServer.value?.title ?? null,
    }

    const newChat = await chatStore.addChat(payload)

    if (!newChat?.id) {
      throw new Error('Failed to create chat.')
    }

    chatStore.addSessionChat('bot', newChat.id)
    message.value = ''

    await nextTick()

    if (typeof chatStore.streamResponse === 'function') {
      const messages = buildMessagesForBotResponse()

      await chatStore.streamResponse(newChat.id, {
        model:
          modelName.value || runtimeTextServer.value?.model || 'gpt-4o-mini',
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        serverId: runtimeTextServer.value?.id ?? null,
        serverName: runtimeTextServer.value?.title ?? null,
        messages,
      })
    }

    await nextTick()
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
      initializeServerStore: false,
      createBlankForm: true,
    }),
    chatStore.initialize(),
    ...(serverStore.hasLoaded
      ? []
      : [serverStore.initialize({ fetchRemote: true })]),
  ])

  if (botStore.pendingLaunchMessage) {
    message.value = botStore.pendingLaunchMessage
    botStore.clearPendingLaunchMessage()
  }

  if (!modelName.value && runtimeTextServer.value?.model) {
    modelName.value = runtimeTextServer.value.model
  }
})

watch(
  () => runtimeTextServer.value?.model,
  (model) => {
    if (!modelName.value && model) {
      modelName.value = model
    }
  },
)

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
</script>

<!-- /components/content/rewards/reward-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        What Happens When You Find It?
      </h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        You've stumbled across something strange and powerful. Tell us who you
        are, how you found it, and what you do next.
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
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]"
    >
      <div
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-4">
          <article>
            <h2 class="mb-2 text-lg font-bold text-base-content">The Item</h2>

            <div
              v-if="rewardStore.selectedReward"
              class="rounded-2xl border border-primary/30 bg-primary/10 p-4"
            >
              <p class="text-xl font-bold text-primary">
                {{ rewardStore.selectedReward.text }}
              </p>

              <p class="mt-2 text-sm text-base-content/70">
                {{ rewardStore.selectedReward.power }}
              </p>

              <p class="mt-2 text-xs text-base-content/50">
                Collection: {{ rewardStore.selectedReward.collection }} ·
                Rarity:
                {{ rewardStore.selectedReward.rarity }}
              </p>
            </div>

            <div
              v-else
              class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/60"
            >
              No reward selected. Go pick something from the Rewards tab.
            </div>
          </article>
        </div>

        <div ref="storyLogRef" class="min-h-0 overflow-y-auto bg-base-200 p-4">
          <div
            v-if="sessionChats.length === 0"
            class="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center text-base-content/45"
          >
            <Icon name="kind-icon:magic" class="h-16 w-16 text-primary/60" />

            <div>
              <p class="text-lg font-bold">Start the encounter</p>
              <p class="mt-1 text-sm">
                Pick a reward, tune the premise, and unleash the narrative
                gremlin.
              </p>
            </div>
          </div>

          <div v-else class="flex flex-col gap-4">
            <article
              v-for="(chat, index) in sessionChats"
              :key="chat.id"
              class="flex flex-col gap-3"
            >
              <div class="flex flex-row-reverse gap-3">
                <div
                  class="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-content shadow-sm"
                >
                  <p class="whitespace-pre-wrap">
                    {{ getPlayerDisplayText(chat, index) }}
                  </p>
                </div>
              </div>

              <div class="flex flex-row gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full border border-base-300 bg-base-100"
                >
                  <Icon
                    name="kind-icon:reward"
                    class="h-5 w-5 text-secondary"
                  />
                </div>

                <div
                  class="flex max-w-[90%] flex-col gap-3 rounded-2xl rounded-bl-sm bg-base-100 px-4 py-3 text-sm leading-relaxed shadow-sm"
                >
                  <span
                    v-if="!chat.botResponse"
                    class="flex items-center gap-1 py-1 text-base-content/60"
                  >
                    <span class="story-dot" />
                    <span class="story-dot delay-150" />
                    <span class="story-dot delay-300" />
                  </span>

                  <template v-else>
                    <p class="whitespace-pre-wrap text-base-content/80">
                      {{ getStoryScene(chat.botResponse) }}
                    </p>

                    <div
                      v-if="getStoryChoices(chat.botResponse).length"
                      class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
                    >
                      <p
                        class="text-xs font-bold uppercase tracking-wide text-base-content/50"
                      >
                        Select a path
                      </p>

                      <button
                        v-for="choice in getStoryChoices(chat.botResponse)"
                        :key="choice.key"
                        class="btn btn-sm justify-start rounded-2xl text-left normal-case"
                        :class="
                          selectedPath === choice.text
                            ? 'btn-secondary'
                            : 'btn-outline'
                        "
                        type="button"
                        :disabled="
                          isStarting || !isLatestRespondedChat(chat.id)
                        "
                        @click="continueWithPath(choice.text)"
                      >
                        <span class="badge badge-ghost badge-sm">
                          {{ choice.label }}
                        </span>
                        <span
                          class="min-w-0 flex-1 whitespace-normal text-left"
                        >
                          {{ choice.text }}
                        </span>
                      </button>
                    </div>

                    <div
                      v-if="isLatestRespondedChat(chat.id)"
                      class="rounded-2xl border border-base-300 bg-base-200 p-3"
                    >
                      <label class="form-control">
                        <span class="label py-1">
                          <span
                            class="label-text text-xs font-bold uppercase tracking-wide text-base-content/50"
                          >
                            Customize the next move
                          </span>
                        </span>

                        <textarea
                          v-model="customFollowup"
                          class="textarea textarea-bordered min-h-20 rounded-2xl bg-base-100"
                          placeholder="Take one of the paths, remix it, or do something wildly inadvisable..."
                          :disabled="isStarting"
                          @keydown.enter.exact.prevent="continueWithCustomPath"
                        />
                      </label>

                      <button
                        class="btn btn-accent mt-3 w-full rounded-2xl"
                        type="button"
                        :disabled="!canContinueCustom"
                        @click="continueWithCustomPath"
                      >
                        <span
                          v-if="isStarting"
                          class="loading loading-spinner loading-sm"
                        />
                        <Icon v-else name="kind-icon:wand" class="h-5 w-5" />
                        Continue Custom Path
                      </button>
                    </div>
                  </template>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="shrink-0 border-t border-base-300 bg-base-100 p-3">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="isStarting"
              @click="clearPromptOptions"
            >
              Reset Options
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="isStarting"
              @click="newStory"
            >
              New Story
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!rewardPromptPreview"
              @click="copyPrompt"
            >
              Copy Prompt
            </button>

            <span class="ml-auto text-xs text-base-content/50">
              {{ activeServerName }}
            </span>
          </div>

          <button
            class="btn btn-success min-h-14 w-full rounded-2xl"
            type="button"
            :disabled="!canStartStory"
            @click="startRewardStory"
          >
            <span
              v-if="isStarting"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:play" class="h-5 w-5" />
            Start Story
          </button>
        </div>
      </div>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <h2 class="mb-3 text-lg font-bold text-base-content">
            The Encounter
          </h2>

          <div class="grid grid-cols-1 gap-4">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">How do you find it?</span>
              </span>

              <select
                v-model="encounterMode"
                class="select select-bordered bg-base-200"
                :disabled="isStarting"
              >
                <option value="discover">
                  You stumble across it unexpectedly
                </option>
                <option value="use">You deliberately use the item</option>
                <option value="temptation">
                  The item calls to you, and you can't ignore it
                </option>
                <option value="consequence">
                  You already used it. Now deal with what happened.
                </option>
                <option value="custom">Custom scenario</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Tone</span>
              </span>

              <select
                v-model="tone"
                class="select select-bordered bg-base-200"
                :disabled="isStarting"
              >
                <option value="whimsical">Whimsical</option>
                <option value="dramatic">Dramatic</option>
                <option value="ominous">Ominous</option>
                <option value="funny">Funny</option>
                <option value="heroic">Heroic</option>
                <option value="weird">Deeply weird</option>
              </select>
            </label>
          </div>

          <label class="form-control mt-4">
            <span class="label">
              <span class="label-text font-bold">What do you do?</span>
              <span class="label-text-alt text-base-content/50">Optional</span>
            </span>

            <textarea
              v-model="customDirection"
              class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-200"
              placeholder="Describe your action, setting, or whatever context feels relevant..."
              :disabled="isStarting"
            />
          </label>
        </section>

        <section
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <h2 class="mb-1 text-lg font-bold text-base-content">About You</h2>

          <p class="mb-3 text-sm text-base-content/60">
            Give the story engine some context about who's holding this thing.
            This stays local to the prompt.
          </p>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Your background</span>
              <span class="label-text-alt text-base-content/50">Optional</span>
            </span>

            <textarea
              v-model="userBackground"
              class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-200"
              placeholder="A wandering cartographer with a bad knee and a knack for finding trouble. Currently lost somewhere between here and regret."
              :disabled="isStarting"
            />
          </label>
        </section>

        <section
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <button
            class="flex w-full items-center justify-between text-left"
            type="button"
            @click="showCharacterPanel = !showCharacterPanel"
          >
            <div>
              <h2 class="text-lg font-bold text-base-content">
                Add a Character
                <span class="badge badge-ghost badge-sm ml-2">Optional</span>
              </h2>

              <p class="mt-0.5 text-sm text-base-content/60">
                Attach a character from your roster to anchor the story.
              </p>
            </div>

            <Icon
              :name="
                showCharacterPanel
                  ? 'kind-icon:chevron-up'
                  : 'kind-icon:chevron-down'
              "
              class="h-5 w-5 shrink-0 text-base-content/50"
            />
          </button>

          <div v-if="showCharacterPanel" class="mt-4">
            <div
              v-if="characterStore.selectedCharacter"
              class="rounded-2xl border border-secondary/30 bg-secondary/10 p-3"
            >
              <p class="font-bold text-secondary">
                {{ selectedCharacterTitle }}
              </p>

              <p class="mt-1 text-sm text-base-content/70">
                {{
                  characterStore.selectedCharacter.species || 'Unknown species'
                }}
                /
                {{ characterStore.selectedCharacter.class || 'Unknown class' }}
              </p>

              <button
                class="btn btn-ghost btn-xs mt-2 rounded-xl"
                type="button"
                :disabled="isStarting"
                @click="characterStore.deselectCharacter?.()"
              >
                Remove character
              </button>
            </div>

            <div
              v-else
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
            >
              No character selected. Head to the Characters tab to pick one.
            </div>
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-base-content">Prompt Preview</h2>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!rewardPromptPreview"
              @click="copyPrompt"
            >
              Copy
            </button>
          </div>

          <pre
            class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-xs text-base-content/70"
            >{{ rewardPromptPreview }}</pre
          >
        </section>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import type { Chat } from '~/prisma/generated/prisma/client'

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

type RewardStoryMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ParsedChoice = {
  key: string
  label: string
  text: string
}

const rewardStore = useRewardStore()
const characterStore = useCharacterStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const storyLogRef = ref<HTMLElement | null>(null)
const encounterMode = ref<
  'discover' | 'use' | 'temptation' | 'consequence' | 'custom'
>('discover')
const tone = ref('whimsical')
const customDirection = ref('')
const customFollowup = ref('')
const selectedPath = ref('')
const userBackground = ref(userStore.user?.bio ?? '')
const showCharacterPanel = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const isStarting = ref(false)
const sessionChatIds = ref<number[]>([])

const selectedCharacterTitle = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'No character selected'

  return character.name
    ? `${character.name} the ${character.honorific || 'Unremarkable'}`.trim()
    : 'Unnamed character'
})

const activeServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'No text server selected'
  )
})

const sessionChats = computed<Chat[]>(() => {
  return chatStore.chats.filter((chat) =>
    sessionChatIds.value.includes(chat.id),
  )
})

const latestSessionChat = computed(() => {
  return sessionChats.value.at(-1) ?? null
})

const isResponding = computed(() => {
  return sessionChats.value.some((chat) => !chat.botResponse)
})

const canStartStory = computed(() => {
  return Boolean(
    rewardStore.selectedReward && !isStarting.value && !isResponding.value,
  )
})

const canContinueCustom = computed(() => {
  return Boolean(
    latestSessionChat.value?.botResponse &&
    customFollowup.value.trim() &&
    !isStarting.value &&
    !isResponding.value,
  )
})

const rewardPromptPreview = computed(() => buildRewardPrompt())

const systemPrompt = computed(() => {
  return [
    'You are a narrative game master for Kind Robots.',
    'Write vivid, interactive story scenes centered on strange rewards, artifacts, boons, curses, or plot devices.',
    'Keep the scene immersive, concrete, and readable.',
    'End every response with exactly 3 numbered follow-up choices.',
    'Choice 1 must be cautious.',
    'Choice 2 must be bold.',
    'Choice 3 must be weird.',
    'Each choice must be on its own line and start with 1., 2., or 3.',
    'Do not explain the prompt. Write the scene directly.',
  ].join('\n')
})

const fullSessionMessages = computed<RewardStoryMessage[]>(() => {
  return sessionChats.value.flatMap((chat) => {
    const messages: RewardStoryMessage[] = [
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

function setStatus(messageText: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = messageText
  statusTone.value = tone
}

function scrollToBottom() {
  const el = storyLogRef.value

  if (!el) return

  el.scrollTop = el.scrollHeight
}

function isLatestRespondedChat(chatId: number) {
  return Boolean(
    latestSessionChat.value?.id === chatId &&
    latestSessionChat.value.botResponse,
  )
}

function getStoryChoices(text: string | null | undefined): ParsedChoice[] {
  if (!text) return []

  const lines = text.split(/\r?\n/)
  const choices: ParsedChoice[] = []

  for (const line of lines) {
    const match = line.match(/^\s*(1|2|3)[.)]\s+(.+?)\s*$/)

    if (!match) continue

    const choiceNumber = match[1]
    const choiceText = match[2]?.trim()

    if (choiceNumber !== '1' && choiceNumber !== '2' && choiceNumber !== '3') {
      continue
    }

    if (!choiceText) continue

    const label =
      choiceNumber === '1'
        ? 'Cautious'
        : choiceNumber === '2'
          ? 'Bold'
          : 'Weird'

    choices.push({
      key: `${choiceNumber}-${choiceText}`,
      label,
      text: choiceText,
    })
  }

  return choices.slice(-3)
}

function getStoryScene(text: string | null | undefined) {
  if (!text) return ''

  const lines = text.split(/\r?\n/)
  const sceneLines = lines.filter((line) => {
    return !/^\s*(1|2|3)[.)]\s+/.test(line)
  })

  return sceneLines.join('\n').trim()
}

function getPlayerDisplayText(chat: Chat, index: number) {
  if (index === 0 && chat.content.includes('Item:')) {
    const rewardName = rewardStore.selectedReward?.text ?? 'the reward'
    return `Begin the story with ${rewardName}.`
  }

  if (chat.content.startsWith('Selected path:')) {
    return chat.content.replace(/^Selected path:\s*/i, '').trim()
  }

  return chat.content
}

function buildMessagesForRewardResponse(): RewardStoryMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt.value,
    },
    ...fullSessionMessages.value,
  ]
}

function buildRewardPrompt() {
  const reward = rewardStore.selectedReward

  if (!reward) return ''

  const character = characterStore.selectedCharacter
  const direction = customDirection.value.trim()
  const background = userBackground.value.trim()

  const characterLine = character
    ? `Character: ${character.name || 'Unnamed'} the ${character.honorific || 'Unremarkable'}. Species: ${character.species || 'Unknown'}, Class: ${character.class || 'Unknown'}, Personality: ${character.personality || 'unknown'}.`
    : null

  const lines = [
    `Item: ${reward.text}`,
    `Item power: ${reward.power}`,
    `Collection: ${reward.collection} · Rarity: ${reward.rarity}`,
    background ? `Finder background: ${background}` : null,
    characterLine,
    `Encounter mode: ${encounterMode.value}`,
    `Tone: ${tone.value}`,
    direction ? `Player direction: ${direction}` : null,
    '',
    'Write a scene where this item is discovered or used.',
    'Focus on what it feels like to hold it, what it does, and the immediate consequences.',
    'End with exactly 3 numbered choices.',
    '1. A cautious path.',
    '2. A bold path.',
    '3. A weird path.',
  ]

  return lines.filter((line): line is string => Boolean(line)).join('\n')
}

function buildFollowupPrompt(path: string) {
  return [
    `Selected path: ${path}`,
    '',
    'Continue the story from the selected path.',
    'Respect the previous scene and consequences.',
    'Advance the narrative with fresh action, sensory detail, and a meaningful cost or discovery.',
    'End with exactly 3 numbered choices.',
    '1. A cautious path.',
    '2. A bold path.',
    '3. A weird path.',
  ].join('\n')
}

async function copyPrompt() {
  const prompt = rewardPromptPreview.value

  if (!prompt) return

  await navigator.clipboard.writeText(prompt)
  setStatus('Prompt copied.')
}

async function createRewardChat(content: string) {
  const reward = rewardStore.selectedReward

  if (!reward) {
    throw new Error('Pick a reward before starting the story.')
  }

  const character = characterStore.selectedCharacter
  const senderName = character?.name ?? userStore.user?.username ?? 'Anonymous'

  const payload: ChatRuntimeInput = {
    content,
    type: 'Reward',
    sender: senderName,
    userId:
      userStore.userId ??
      userStore.user?.id ??
      character?.userId ??
      reward.userId ??
      10,
    characterId: character?.id ?? null,
    recipientId: null,
    serverId: serverStore.activeTextServer?.id ?? null,
    isPublic: false,
  }

  const newChat = await chatStore.addChat(payload)

  if (!newChat?.id) {
    throw new Error('Failed to create reward story chat.')
  }

  sessionChatIds.value.push(newChat.id)
  chatStore.selectedChat = newChat

  await nextTick()
  scrollToBottom()

  return newChat
}

async function streamRewardChat(chatId: number) {
  if (typeof chatStore.streamResponse !== 'function') {
    throw new Error('chatStore.streamResponse is not available.')
  }

  await chatStore.streamResponse(chatId, {
    model: serverStore.activeTextServer?.model || 'gpt-4o-mini',
    temperature: 0.85,
    maxTokens: 2048,
    serverId: serverStore.activeTextServer?.id ?? null,
    stream: true,
    messages: buildMessagesForRewardResponse(),
  })

  await nextTick()
  scrollToBottom()
}

async function startRewardStory() {
  const content = buildRewardPrompt()

  if (!content.trim()) {
    setStatus('Could not build a reward prompt.', 'error')
    return
  }

  isStarting.value = true
  statusMessage.value = ''
  selectedPath.value = ''
  customFollowup.value = ''

  try {
    const newChat = await createRewardChat(content)
    await streamRewardChat(newChat.id)
    setStatus('Reward story returned.')
  } catch (error) {
    console.error('Error starting reward story:', error)
    setStatus(
      error instanceof Error ? error.message : 'Error starting reward story.',
      'error',
    )
  } finally {
    isStarting.value = false
  }
}

async function continueWithPath(path: string) {
  if (!path.trim() || isStarting.value) return

  selectedPath.value = path
  customFollowup.value = path

  await continueRewardStory(path)
}

async function continueWithCustomPath() {
  const path = customFollowup.value.trim()

  if (!path || isStarting.value) return

  selectedPath.value = path

  await continueRewardStory(path)
}

async function continueRewardStory(path: string) {
  isStarting.value = true
  statusMessage.value = ''

  try {
    const newChat = await createRewardChat(buildFollowupPrompt(path))
    customFollowup.value = ''
    await streamRewardChat(newChat.id)
    setStatus('Story continued.')
  } catch (error) {
    console.error('Error continuing reward story:', error)
    setStatus(
      error instanceof Error ? error.message : 'Error continuing reward story.',
      'error',
    )
  } finally {
    isStarting.value = false
  }
}

function newStory() {
  sessionChatIds.value = []
  selectedPath.value = ''
  customFollowup.value = ''
  statusMessage.value = ''
}

function clearPromptOptions() {
  encounterMode.value = 'discover'
  tone.value = 'whimsical'
  customDirection.value = ''
  customFollowup.value = ''
  selectedPath.value = ''
  userBackground.value = userStore.user?.bio ?? ''
  statusMessage.value = ''
}

onMounted(async () => {
  await Promise.all([
    chatStore.initialize(),
    serverStore.initialize({
      fetchRemote: true,
    }),
  ])
})

watch(
  () => sessionChats.value.map((chat) => chat.botResponse).join(''),
  async () => {
    await nextTick()
    scrollToBottom()
  },
)
</script>

<style scoped>
.story-dot {
  display: inline-block;
  height: 0.375rem;
  width: 0.375rem;
  border-radius: 9999px;
  background: currentColor;
  animation: story-bounce 1s ease-in-out infinite;
}

.delay-150 {
  animation-delay: 150ms;
}

.delay-300 {
  animation-delay: 300ms;
}

@keyframes story-bounce {
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

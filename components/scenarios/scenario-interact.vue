<!-- /components/content/weird/scenario-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        Storyteller Cockpit
      </h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Choose a scenario, character, optional reward, and opening choice. Then
        launch the weird little narrative machine.
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
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]"
    >
      <div
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <section class="shrink-0 border-b border-base-300 p-4">
          <div>
            <h2 class="text-xl font-bold text-base-content">Adventure Setup</h2>

            <p class="text-sm text-base-content/70">
              Review the selected pieces before starting the story.
            </p>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Scenario
              </p>

              <p class="mt-1 font-semibold text-base-content">
                {{ selectedScenarioTitle }}
              </p>

              <p
                v-if="scenarioStore.selectedScenario?.description"
                class="mt-2 line-clamp-3 text-sm text-base-content/70"
              >
                {{ scenarioStore.selectedScenario.description }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Character
              </p>

              <p class="mt-1 font-semibold text-base-content">
                {{ selectedCharacterTitle }}
              </p>

              <p
                v-if="characterStore.selectedCharacter"
                class="mt-2 text-sm text-base-content/70"
              >
                {{
                  characterStore.selectedCharacter.species || 'Unknown species'
                }}
                /
                {{ characterStore.selectedCharacter.class || 'Unknown class' }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Reward
              </p>

              <p class="mt-1 font-semibold text-base-content">
                {{ selectedRewardTitle }}
              </p>

              <p
                v-if="rewardStore.selectedReward"
                class="mt-2 text-sm text-base-content/70"
              >
                Power: {{ rewardStore.selectedReward.power || 'Mysterious' }}
              </p>

              <button
                v-if="rewardStore.selectedReward"
                class="btn btn-ghost btn-xs mt-2 rounded-xl"
                type="button"
                :disabled="isStartingStory || isResponding"
                @click="rewardStore.deselectReward()"
              >
                Clear reward
              </button>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Opening Choice
              </p>

              <p class="mt-1 font-semibold text-base-content">
                {{ selectedChoiceTitle }}
              </p>

              <button
                v-if="scenarioStore.currentChoice"
                class="btn btn-ghost btn-xs mt-2 rounded-xl"
                type="button"
                :disabled="isStartingStory || isResponding"
                @click="scenarioStore.setCurrentChoice('')"
              >
                Clear choice
              </button>
            </div>
          </div>
        </section>

        <section
          ref="storyLogRef"
          class="min-h-0 overflow-y-auto bg-base-200 p-4"
        >
          <div
            v-if="sessionChats.length === 0"
            class="flex h-full min-h-72 flex-col items-center justify-center gap-3 text-center text-base-content/45"
          >
            <Icon name="kind-icon:story" class="h-16 w-16 text-primary/60" />

            <div>
              <p class="text-lg font-bold">No story launched yet</p>

              <p class="mt-1 text-sm">
                Select your scenario and character, then release the narrative
                goblin.
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
                  class="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-content shadow-sm"
                >
                  <p class="whitespace-pre-wrap">
                    {{ chat.content }}
                  </p>
                </div>
              </div>

              <div class="flex flex-row gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full border border-base-300 bg-base-100"
                >
                  <Icon name="kind-icon:weird" class="h-5 w-5 text-secondary" />
                </div>

                <div
                  class="max-w-[85%] rounded-2xl rounded-bl-sm bg-base-100 px-4 py-3 text-sm leading-relaxed shadow-sm"
                >
                  <span
                    v-if="!chat.botResponse"
                    class="flex items-center gap-1 py-1 text-base-content/60"
                  >
                    <span class="story-dot" />
                    <span class="story-dot delay-150" />
                    <span class="story-dot delay-300" />
                  </span>

                  <p v-else class="whitespace-pre-wrap text-base-content/80">
                    {{ chat.botResponse }}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="shrink-0 border-t border-base-300 bg-base-100 p-3">
          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Custom direction</span>
              <span class="label-text-alt text-base-content/50">Optional</span>
            </span>

            <textarea
              v-model="customDirection"
              class="textarea textarea-bordered min-h-20 resize-none rounded-2xl bg-base-200"
              placeholder="Add a tone, goal, complication, skill check, inventory item, or narrative twist..."
              :disabled="isStartingStory || isResponding"
            />
          </label>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!storyPromptPreview"
              @click="copyPrompt"
            >
              Copy Prompt
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="isStartingStory || isResponding"
              @click="newStory"
            >
              New Story
            </button>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="isStartingStory || isResponding"
              @click="clearSelections"
            >
              Reset Selections
            </button>

            <span class="ml-auto text-xs text-base-content/50">
              {{ activeServerName }}
            </span>
          </div>

          <button
            class="btn btn-success mt-3 min-h-14 w-full rounded-2xl"
            type="button"
            :disabled="!canStartStory || isStartingStory || isResponding"
            @click="startStory"
          >
            <span
              v-if="isStartingStory || isResponding"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:play" class="h-5 w-5" />
            Start Story
          </button>
        </section>
      </div>

      <aside class="flex min-h-0 flex-col gap-4 overflow-hidden">
        <section class="grid grid-cols-1 gap-4">
          <article
            class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-bold text-base-content">Scenario</h2>
                <p class="text-xs text-base-content/60">Pick the playground.</p>
              </div>

              <Icon name="kind-icon:map" class="h-6 w-6 text-primary" />
            </div>

            <scenario-gallery
              variant="row"
              title="Scenario"
              subtitle="Choose where the trouble starts."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :show-inspirations="false"
              :show-choices="true"
              :compact="true"
            />
          </article>

          <article
            class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-bold text-base-content">Character</h2>
                <p class="text-xs text-base-content/60">Pick the poor soul.</p>
              </div>

              <Icon name="kind-icon:person" class="h-6 w-6 text-secondary" />
            </div>

            <character-gallery
              variant="row"
              title="Character"
              subtitle="Choose the hero, goblin, detective, or doomed intern."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :compact="true"
            />
          </article>

          <article
            class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-bold text-base-content">Reward</h2>
                <p class="text-xs text-base-content/60">
                  Optional plot grenade.
                </p>
              </div>

              <Icon name="kind-icon:gift" class="h-6 w-6 text-accent" />
            </div>

            <reward-gallery
              variant="row"
              title="Reward"
              subtitle="Choose a power, artifact, or suspiciously useful trinket."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :compact="true"
            />
          </article>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <div class="mb-3 flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold text-base-content">
              Story Prompt Preview
            </h2>

            <button
              class="btn btn-xs btn-ghost rounded-xl"
              type="button"
              :disabled="!storyPromptPreview"
              @click="copyPrompt"
            >
              Copy
            </button>
          </div>

          <pre
            class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-xs text-base-content/70"
            >{{ storyPromptPreview }}</pre
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
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useWeirdStore } from '@/stores/weirdStore'

type ScenarioSessionChat = {
  id: number
  content: string
  botResponse?: string | null
}

type ChatRuntimeInput = Parameters<
  ReturnType<typeof useChatStore>['addChat']
>[0]

type StoryMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const scenarioStore = useScenarioStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const serverStore = useServerStore()
const userStore = useUserStore()
const weirdStore = useWeirdStore()

const storyLogRef = ref<HTMLElement | null>(null)
const storyRunning = ref(false)
const isStartingStory = ref(false)
const customDirection = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const sessionChatIds = ref<number[]>([])

const selectedScenarioTitle = computed(
  () => scenarioStore.selectedScenario?.title || 'No scenario selected',
)

const selectedCharacterTitle = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'No character selected'

  return character.name
    ? `${character.name} the ${character.honorific || 'Unremarkable'}`.trim()
    : 'Unnamed character'
})

const selectedRewardTitle = computed(
  () => rewardStore.selectedReward?.text || 'No reward selected',
)

const selectedChoiceTitle = computed(
  () => scenarioStore.currentChoice || 'No opening choice selected',
)

const activeServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'No text server selected'
  )
})

const sessionChats = computed<ScenarioSessionChat[]>(() => {
  return chatStore.chats.filter((chat) =>
    sessionChatIds.value.includes(chat.id),
  ) as ScenarioSessionChat[]
})

const isResponding = computed(() => {
  return sessionChats.value.some((chat) => !chat.botResponse)
})

const canStartStory = computed(() => {
  return Boolean(
    scenarioStore.selectedScenario &&
    characterStore.selectedCharacter &&
    !isStartingStory.value &&
    !isResponding.value,
  )
})

const storyPromptPreview = computed(() => {
  if (!scenarioStore.selectedScenario || !characterStore.selectedCharacter) {
    return ''
  }

  return buildStoryPrompt()
})

const systemPrompt = computed(() => {
  return [
    'You are the Weirdlandia storyteller for Kind Robots.',
    'Write interactive branching fiction with sharp sensory detail, meaningful consequences, and playful weirdness.',
    'Honor the selected scenario, character, reward, and opening choice.',
    'End every response with 3-5 clear follow-up options.',
    'Each option should invite a different kind of action: cautious, bold, clever, strange, or character-driven.',
    'Do not explain the prompt. Write the story scene directly.',
  ].join('\n')
})

const fullSessionMessages = computed<StoryMessage[]>(() => {
  return sessionChats.value.flatMap((chat) => {
    const messages: StoryMessage[] = [
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

function buildStoryPrompt() {
  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter
  const reward = rewardStore.selectedReward

  if (!scenario || !character) return ''

  const direction = customDirection.value.trim()

  return [
    `Scenario: ${scenario.title}`,
    `Scenario description: ${scenario.description || 'No description provided'}`,
    `Character: ${character.name || 'Unnamed'} the ${
      character.honorific || 'Unremarkable'
    }`,
    `Character details: ${character.species || 'Unknown species'}, ${
      character.class || 'Unknown class'
    }, ${character.personality || 'unknown personality'}`,
    `Opening choice: ${scenarioStore.currentChoice || 'None selected'}`,
    reward ? `Reward at stake: ${reward.text}` : '',
    reward ? `Reward power: ${reward.power || 'Unknown'}` : '',
    direction ? `Player direction: ${direction}` : '',
    '',
    'Generate the next scene as an interactive branching narrative. Include vivid sensory detail, meaningful consequences, and 3-5 clear follow-up options. Let the player continue with a skill check, inventory item, reward use, or custom prompt.',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildMessagesForStoryResponse(): StoryMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt.value,
    },
    ...fullSessionMessages.value,
  ]
}

function scrollToBottom() {
  const el = storyLogRef.value

  if (!el) return

  el.scrollTop = el.scrollHeight
}

async function copyPrompt() {
  if (!storyPromptPreview.value) return

  await navigator.clipboard.writeText(storyPromptPreview.value)
  setStatus('Story prompt copied.')
}

async function startStory() {
  if (!canStartStory.value) {
    setStatus(
      'Pick a scenario and character before launching the story goblin.',
      'error',
    )
    return
  }

  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter

  if (!scenario || !character) return

  const content = buildStoryPrompt()

  if (!content.trim()) {
    setStatus('Could not build story prompt.', 'error')
    return
  }

  isStartingStory.value = true
  statusMessage.value = ''

  try {
    const payload: ChatRuntimeInput = {
      content,
      userId: userStore.userId ?? userStore.user?.id ?? character.userId ?? 10,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
      serverId: serverStore.activeTextServer?.id ?? null,
      isPublic: false,
    }

    const newChat = await chatStore.addChat(payload)

    if (!newChat?.id) {
      throw new Error('Failed to create chat.')
    }

    sessionChatIds.value.push(newChat.id)
    chatStore.selectedChat = newChat
    storyRunning.value = true

    if (Array.isArray(weirdStore.history)) {
      weirdStore.history.push(newChat)
    }

    await nextTick()
    scrollToBottom()

    if (typeof chatStore.streamResponse !== 'function') {
      throw new Error('chatStore.streamResponse is not available.')
    }

    await chatStore.streamResponse(newChat.id, {
      model: serverStore.activeTextServer?.model || 'gpt-4o-mini',
      temperature: 0.9,
      maxTokens: 2048,
      serverId: serverStore.activeTextServer?.id ?? null,
      messages: buildMessagesForStoryResponse(),
    })

    await nextTick()
    scrollToBottom()
    setStatus('Story response returned.')
  } catch (error) {
    console.error('Error starting the story:', error)
    setStatus(
      error instanceof Error ? error.message : 'Error starting the story.',
      'error',
    )
  } finally {
    isStartingStory.value = false
  }
}

function stopStory() {
  if (chatStore.selectedChat) {
    const currentResponse = chatStore.selectedChat.botResponse || ''
    chatStore.selectedChat.botResponse =
      `${currentResponse}\n\nThe adventure has come to an end.`.trim()
    chatStore.selectedChat = null
  }

  if (Array.isArray(weirdStore.history)) {
    weirdStore.history = []
  }

  storyRunning.value = false
  setStatus('Story stopped.')
}

function newStory() {
  sessionChatIds.value = []
  storyRunning.value = false
  chatStore.selectedChat = null

  if (Array.isArray(weirdStore.history)) {
    weirdStore.history = []
  }

  statusMessage.value = ''
}

function clearSelections() {
  scenarioStore.deselectScenario()
  characterStore.deselectCharacter()
  rewardStore.deselectReward()
  scenarioStore.setCurrentChoice('')
  customDirection.value = ''
  storyRunning.value = false
  sessionChatIds.value = []
  chatStore.selectedChat = null
  statusMessage.value = ''

  if (Array.isArray(weirdStore.history)) {
    weirdStore.history = []
  }
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

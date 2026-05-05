<!-- /components/characters/character-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        Character Interact
      </h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Chat with a character, drop them into a scenario, hand them a reward, or
        build a prompt for your next weird little adventure.
      </p>
    </header>

    <div
      class="flex flex-wrap gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
    >
      <button
        v-for="tab in modeTabs"
        :key="tab.key"
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="activeMode === tab.key ? 'btn-primary text-white' : 'btn-ghost'"
        @click="activeMode = tab.key"
      >
        <Icon :name="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

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
      class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">
                Selected Character
              </h2>

              <p class="text-sm text-base-content/60">
                Choose who gets interrogated by destiny.
              </p>
            </div>

            <button
              v-if="characterStore.selectedCharacter"
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              @click="clearSelectedCharacter"
            >
              Clear
            </button>
          </div>

          <character-card
            v-if="characterStore.selectedCharacter"
            :character="characterStore.selectedCharacter"
            :selected="true"
            :show-actions="false"
            :show-mode-buttons="false"
            :show-inline-interact="false"
          />

          <character-gallery
            v-else
            variant="dropdown"
            title="Character"
            subtitle="Choose a character."
            :show-images="false"
            :show-controls="false"
            :show-toolbar="false"
          />
        </article>

        <article
          v-if="activeMode === 'chat'"
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <div
            class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold text-base-content">Chat</h2>

              <p class="text-sm text-base-content/60">
                Ask something sincere, weird, tactical, or suspiciously
                therapeutic.
              </p>
            </div>

            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              :disabled="chatMessages.length === 0 || isSendingChat"
              @click="clearChatMessages"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Clear Chat
            </button>
          </div>

          <div
            class="mb-3 flex max-h-96 min-h-40 flex-col gap-3 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div
              v-if="chatMessages.length === 0"
              class="flex h-full min-h-32 items-center justify-center text-center text-sm text-base-content/60"
            >
              No messages yet. The void is listening, but it keeps forgetting
              its password.
            </div>

            <div
              v-for="message in chatMessages"
              :key="message.id"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl border p-3 text-sm shadow-sm"
                :class="
                  message.role === 'user'
                    ? 'border-primary/30 bg-primary text-primary-content'
                    : 'border-base-300 bg-base-100 text-base-content'
                "
              >
                <p class="mb-1 text-xs font-bold opacity-70">
                  {{ message.role === 'user' ? 'You' : selectedCharacterName }}
                </p>

                <p class="whitespace-pre-wrap">
                  {{ message.content }}
                </p>
              </div>
            </div>

            <div v-if="isSendingChat" class="flex justify-start">
              <div
                class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm text-base-content/70 shadow-sm"
              >
                <span
                  class="loading loading-dots loading-sm text-primary"
                ></span>
                Thinking in character...
              </div>
            </div>
          </div>

          <div class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <button
              v-for="prompt in presetPrompts"
              :key="prompt"
              class="btn btn-outline btn-sm rounded-xl justify-start text-left"
              type="button"
              :disabled="!characterStore.selectedCharacter || isSendingChat"
              @click="usePrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>

          <textarea
            v-model="chatMessage"
            class="textarea textarea-bordered min-h-32 w-full resize-none rounded-2xl bg-base-200"
            placeholder="Say something to the character..."
            :disabled="!characterStore.selectedCharacter || isSendingChat"
            @keydown.enter.exact.prevent="sendCharacterChat"
          />

          <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              class="btn btn-ghost rounded-xl"
              type="button"
              :disabled="!characterStore.selectedCharacter || isSendingChat"
              @click="seedChatMessage"
            >
              <Icon name="kind-icon:dice" class="h-5 w-5" />
              Random Nudge
            </button>

            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              :disabled="!characterStore.selectedCharacter || isSendingChat"
              @click="seedGettingToKnowYouQuestion"
            >
              <Icon name="kind-icon:question" class="h-5 w-5" />
              Get To Know You
            </button>

            <button
              class="btn btn-primary rounded-xl text-white"
              type="button"
              :disabled="!canSendChat"
              @click="sendCharacterChat"
            >
              <Icon name="kind-icon:message" class="h-5 w-5" />
              Send
            </button>
          </div>
        </article>

        <article
          v-else-if="activeMode === 'adventure'"
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Adventure Setup
          </h2>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <scenario-gallery
                variant="dropdown"
                title="Scenario"
                subtitle="Choose the scene."
                :show-images="false"
                :show-controls="false"
                :show-toolbar="false"
              />
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <reward-gallery
                variant="dropdown"
                title="Reward"
                subtitle="Optional story item."
                :show-images="false"
                :show-controls="false"
                :show-toolbar="false"
              />
            </div>
          </div>

          <textarea
            v-model="adventureDirection"
            class="textarea textarea-bordered mt-4 min-h-32 w-full resize-none rounded-2xl bg-base-200"
            placeholder="What should happen next? Skill check, reward use, inventory item, dialogue, chaos goblin cameo..."
          />

          <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="buildAdventurePrompt"
            >
              Build Prompt
            </button>

            <button
              class="btn btn-primary rounded-xl text-white"
              type="button"
              :disabled="!adventurePrompt"
              @click="copyAdventurePrompt"
            >
              Copy Prompt
            </button>
          </div>
        </article>

        <article
          v-else-if="activeMode === 'prompt'"
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Character Prompt
          </h2>

          <textarea
            v-model="promptText"
            class="textarea textarea-bordered min-h-56 w-full resize-none rounded-2xl bg-base-200"
            placeholder="Build or edit a reusable character prompt..."
          />

          <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              class="btn btn-outline rounded-xl"
              type="button"
              @click="buildCharacterPrompt"
            >
              Build
            </button>

            <button
              class="btn btn-outline rounded-xl"
              type="button"
              @click="copyPromptToChat"
            >
              Prompt → Chat
            </button>

            <button
              class="btn btn-primary rounded-xl text-white"
              type="button"
              :disabled="!promptText.trim()"
              @click="copyPrompt"
            >
              Copy
            </button>
          </div>
        </article>

        <article
          v-else
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Raw Character Context
          </h2>

          <pre
            class="max-h-96 overflow-auto rounded-2xl bg-base-200 p-3 text-xs text-base-content/70"
            >{{
              JSON.stringify(characterStore.selectedCharacter, null, 2)
            }}</pre
          >
        </article>
      </div>

      <aside class="flex min-h-0 flex-col gap-4">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="text-lg font-bold text-base-content">
            Interaction Summary
          </h2>

          <div class="mt-3 grid gap-2 text-sm">
            <div class="rounded-2xl bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Character
              </p>

              <p class="mt-1 font-semibold">
                {{ selectedCharacterName }}
              </p>
            </div>

            <div class="rounded-2xl bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Scenario
              </p>

              <p class="mt-1 font-semibold">
                {{ selectedScenarioTitle }}
              </p>
            </div>

            <div class="rounded-2xl bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Reward
              </p>

              <p class="mt-1 font-semibold">
                {{ selectedRewardTitle }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-lg font-bold text-base-content">
            Getting To Know You Questions
          </h2>

          <div class="flex max-h-80 flex-col gap-2 overflow-y-auto">
            <button
              v-for="question in gettingToKnowYouQuestions"
              :key="question"
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-left text-sm transition hover:border-primary hover:bg-primary hover:text-primary-content"
              type="button"
              :disabled="!characterStore.selectedCharacter || isSendingChat"
              @click="usePrompt(question)"
            >
              {{ question }}
            </button>
          </div>
        </section>

        <section
          v-if="adventurePrompt"
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 text-lg font-bold text-base-content">
            Adventure Prompt Preview
          </h2>

          <pre
            class="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-sm text-base-content/75"
            >{{ adventurePrompt }}</pre
          >
        </section>
      </aside>
    </section>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

type CharacterInteractMode = 'chat' | 'adventure' | 'prompt' | 'debug'
type ChatRole = 'user' | 'assistant'

type LocalChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type BotCafeMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const characterStore = useCharacterStore()
const chatStore = useChatStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const userStore = useUserStore()

const activeMode = ref<CharacterInteractMode>('chat')
const chatMessage = ref('')
const chatMessages = ref<LocalChatMessage[]>([])
const adventureDirection = ref('')
const adventurePrompt = ref('')
const promptText = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const isSendingChat = ref(false)

const modeTabs: Array<{
  key: CharacterInteractMode
  label: string
  icon: string
}> = [
  { key: 'chat', label: 'Chat', icon: 'kind-icon:message' },
  { key: 'adventure', label: 'Adventure', icon: 'kind-icon:compass' },
  { key: 'prompt', label: 'Prompt', icon: 'kind-icon:quote' },
  { key: 'debug', label: 'Debug', icon: 'kind-icon:bug' },
]

const presetPrompts = [
  'Introduce yourself like you are absolutely hiding something.',
  'Tell me what you want right now, and what you claim you want instead.',
  'What would make you trust someone in the next five minutes?',
  'Give me your worst idea that might somehow work.',
] as const

const gettingToKnowYouQuestions = [
  'What is your favorite lie to tell about yourself?',
  'What small comfort would you defend like a dragon defends treasure?',
  'What do people usually misunderstand about you?',
  'What is the most suspiciously useful thing in your pockets right now?',
  'What kind of person immediately gets on your nerves?',
  'What would you do if nobody could judge you for one hour?',
  'What is your private definition of courage?',
  'What memory still feels louder than it should?',
  'What rule do you follow that nobody else seems to notice?',
  'What would you never admit to your enemies?',
  'What would you never admit to your friends?',
  'What is your most heroic flaw?',
  'What is your least impressive survival skill?',
  'What would you name a tavern if you were forced to run one?',
  'What is the worst gift someone could give you?',
  'What is the best gift someone could give you?',
  'What rumor about you is almost true?',
  'What monster do you secretly understand a little too well?',
  'What would make you walk into danger on purpose?',
  'What would make you walk away from victory?',
  'What song, smell, or sound makes you instantly suspicious?',
  'What is something beautiful that you do not trust?',
  'What is your emergency plan if everything becomes bees?',
  'What question are you hoping I do not ask next?',
] as const

const selectedCharacterName = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'No character selected'

  return character.name
    ? `${character.name} ${
        character.honorific ? `the ${character.honorific}` : ''
      }`.trim()
    : 'Unnamed Character'
})

const selectedScenarioTitle = computed(
  () => scenarioStore.selectedScenario?.title || 'No scenario selected',
)

const selectedRewardTitle = computed(
  () => rewardStore.selectedReward?.text || 'No reward selected',
)

const canSendChat = computed(() => {
  return (
    Boolean(characterStore.selectedCharacter) &&
    Boolean(chatMessage.value.trim()) &&
    !isSendingChat.value
  )
})

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function clearSelectedCharacter() {
  characterStore.deselectCharacter()
  clearChatMessages()
}

function clearChatMessages() {
  chatMessages.value = []
  statusMessage.value = ''
}

function createMessageId(role: ChatRole) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function pickRandomPrompt(items: readonly string[], fallback: string): string {
  const index = Math.floor(Math.random() * items.length)
  return items[index] ?? fallback
}

function usePrompt(prompt: string) {
  chatMessage.value = prompt
}

function seedChatMessage() {
  chatMessage.value = pickRandomPrompt(
    presetPrompts,
    'What do you notice first, and what do you absolutely refuse to admit?',
  )
}

function seedGettingToKnowYouQuestion() {
  chatMessage.value = pickRandomPrompt(
    gettingToKnowYouQuestions,
    'What question are you hoping I do not ask next?',
  )
}

function buildCharacterSystemPrompt(): string {
  const character = characterStore.selectedCharacter

  if (!character) {
    return 'You are a vivid fictional character. Respond in character.'
  }

  return [
    `You are roleplaying as ${selectedCharacterName.value}.`,
    `Species: ${character.species || 'Unknown'}`,
    `Class: ${character.class || 'Unknown'}`,
    `Genre: ${character.genre || 'Unknown'}`,
    `Personality: ${character.personality || 'Unknown'}`,
    `Backstory: ${character.backstory || 'No backstory provided.'}`,
    `Quirks: ${character.quirks || 'No quirks listed.'}`,
    `Inventory: ${character.inventory || 'No inventory listed.'}`,
    `Skills: ${character.skills || 'No skills listed.'}`,
    '',
    'Stay in character.',
    'Answer directly, vividly, and conversationally.',
    'Be amusing and thought-provoking, but do not narrate as the user.',
    'Keep replies between 2 and 6 short paragraphs unless the user asks for more.',
  ].join('\n')
}

function buildCharacterMessages(content: string): BotCafeMessage[] {
  return [
    {
      role: 'system',
      content: buildCharacterSystemPrompt(),
    },
    ...chatMessages.value.slice(-10).map(
      (message): BotCafeMessage => ({
        role: message.role,
        content: message.content,
      }),
    ),
    {
      role: 'user',
      content,
    },
  ]
}

async function sendCharacterChat() {
  const character = characterStore.selectedCharacter
  const content = chatMessage.value.trim()

  if (!character || !content || isSendingChat.value) return

  isSendingChat.value = true
  statusMessage.value = ''

  chatMessages.value.push({
    id: createMessageId('user'),
    role: 'user',
    content,
  })

  chatMessage.value = ''

  try {
    const chat = await chatStore.addChat({
      content,
      userId: userStore.userId || userStore.user?.id || 10,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
    })

    chatStore.selectedChat = chat

    const reply = await chatStore.streamResponse(chat.id, {
      messages: buildCharacterMessages(content),
      temperature: 0.85,
      maxTokens: 700,
    })

    chatMessages.value.push({
      id: createMessageId('assistant'),
      role: 'assistant',
      content: reply,
    })

    setStatus('Character replied.')
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : 'Failed to get a character response.',
      'error',
    )
  } finally {
    isSendingChat.value = false
  }
}

function buildCharacterPrompt() {
  const character = characterStore.selectedCharacter

  if (!character) {
    setStatus('Select a character first.', 'error')
    return
  }

  promptText.value = [
    `Character: ${selectedCharacterName.value}`,
    `Species: ${character.species || 'Unknown'}`,
    `Class: ${character.class || 'Unknown'}`,
    `Genre: ${character.genre || 'Unknown'}`,
    `Personality: ${character.personality || 'Unknown'}`,
    `Backstory: ${character.backstory || 'No backstory provided.'}`,
    `Quirks: ${character.quirks || 'No quirks listed.'}`,
    `Inventory: ${character.inventory || 'No inventory listed.'}`,
    `Skills: ${character.skills || 'No skills listed.'}`,
    '',
    'Respond in character. Keep the voice vivid, specific, and interactive.',
  ].join('\n')
}

function buildAdventurePrompt() {
  const character = characterStore.selectedCharacter

  if (!character) {
    setStatus('Select a character first.', 'error')
    return
  }

  const scenario = scenarioStore.selectedScenario
  const reward = rewardStore.selectedReward
  const direction = adventureDirection.value.trim()

  adventurePrompt.value = [
    `Character: ${selectedCharacterName.value}`,
    `Character details: ${character.species || 'Unknown species'}, ${
      character.class || 'Unknown class'
    }, ${character.personality || 'unknown personality'}`,
    `Backstory: ${character.backstory || 'No backstory provided.'}`,
    scenario ? `Scenario: ${scenario.title}` : '',
    scenario ? `Scenario description: ${scenario.description}` : '',
    scenarioStore.currentChoice
      ? `Opening choice: ${scenarioStore.currentChoice}`
      : '',
    reward ? `Reward: ${reward.text}` : '',
    reward ? `Reward power: ${reward.power || 'Unknown'}` : '',
    direction ? `Player direction: ${direction}` : '',
    '',
    'Generate the next scene as an interactive branching narrative. Include meaningful consequences and 3-5 follow-up options.',
  ]
    .filter(Boolean)
    .join('\n')

  setStatus('Adventure prompt built.')
}

async function copyAdventurePrompt() {
  if (!adventurePrompt.value) return

  await navigator.clipboard.writeText(adventurePrompt.value)
  setStatus('Adventure prompt copied.')
}

async function copyPrompt() {
  if (!promptText.value.trim()) return

  await navigator.clipboard.writeText(promptText.value)
  setStatus('Character prompt copied.')
}

function copyPromptToChat() {
  chatMessage.value = promptText.value
  activeMode.value = 'chat'
}

watch(
  () => characterStore.selectedCharacterId,
  () => {
    clearChatMessages()
    activeMode.value = 'chat'
  },
)
</script>

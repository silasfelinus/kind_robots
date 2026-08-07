<!-- /components/characters/character-chat.vue -->
<!--
  The Character working surface: chat with them, or run an adventure.

  Split out of character-interact, which had grown to 923 lines -- 482 of
  template and 440 of script -- because both modes were inlined in the
  component whose only job is choosing between browsing and working.
  dream-interact does that job in 57 lines because dream-narration exists; this
  is that, for Characters.

  Silas, 2026-08-06, on the interact tier: it "will be inevitably less
  consistent across models, since that's where we are actually hitting what we
  do with them uniquely." So nothing about how a Character conversation or an
  adventure works changed in the move. Chatting with a Character is the most
  natural of all the model interactions -- "that's what they do" -- and this is
  where that lives now.

  The status banner came along rather than staying in the router: it reports on
  sending a message, an adventure turn, or a failure, all of which happen here.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4">
    <div
      v-if="statusMessage"
      class="kr-note"
      :class="statusTone === 'error' ? 'kr-note-error' : 'kr-note-success'"
    >
      {{ statusMessage }}
    </div>

    <section
      class="kr-panes grid-cols-1 xl:grid-cols-[minmax(320px,440px)_minmax(0,1fr)]"
    >
      <aside class="kr-pane-scroll flex flex-col gap-4">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="truncate text-xl font-black text-base-content">
                {{ selectedCharacterName }}
              </h2>

              <p class="truncate text-sm text-base-content/60">
                Selected character cockpit.
              </p>
            </div>

            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              :disabled="isSendingChat"
              @click="clearSelectedCharacter"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Clear
            </button>
          </div>

          <CharacterFlipCard
            v-if="characterStore.selectedCharacter"
            :character="characterStore.selectedCharacter"
            :show-stats="true"
            image-fit="contain"
          />

          <div v-else class="kr-note kr-note-warning">
            No character selected. Return to the gallery and pick a beautiful
            little problem.
          </div>
        </section>

        <EntityArtManager
          v-if="characterStore.selectedCharacter"
          entity-type="character"
          :entity="characterStore.selectedCharacter"
          :slots="[
            {
              field: 'imagePath',
              label: 'Portrait',
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
          v-if="characterStore.selectedCharacter"
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="text-lg font-bold text-base-content">Stats</h2>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <div
              v-for="stat in selectedCharacterStats"
              :key="stat.key"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <p class="text-xs font-bold uppercase text-base-content/50">
                {{ stat.label }}
              </p>

              <p class="mt-1 text-lg font-black text-primary">
                {{ stat.value }}
              </p>
            </div>
          </div>
        </section>

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

            <div
              v-if="selectedPrompt"
              class="rounded-2xl border border-primary/30 bg-primary/10 p-3"
            >
              <p class="text-xs font-bold uppercase text-primary">
                Active Prompt
              </p>

              <p class="mt-1 text-sm text-base-content/80">
                {{ selectedPrompt }}
              </p>
            </div>
          </div>
        </section>
      </aside>

      <main class="kr-pane gap-4">
        <div
          class="flex shrink-0 flex-wrap gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
        >
          <button
            v-for="tab in modeTabs"
            :key="tab.key"
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="
              activeMode === tab.key ? 'btn-primary text-white' : 'btn-ghost'
            "
            @click="setActiveMode(tab.key)"
          >
            <Icon :name="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </div>

        <section class="kr-pane-scroll">
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

            <!-- The character chat log is kr-chat-window (interface-vision
                 Phase 5). This surface had no scroll helper at all -- it
                 never auto-scrolled -- so adopting the shared window fixes a
                 live bug, not just a duplication. -->
            <kr-chat-window
              class="mb-3 max-h-96 min-h-40 rounded-2xl border border-base-300 bg-base-200 p-3"
              :turns="chatTurns"
              :label="`${selectedCharacterName} conversation`"
              :is-streaming="isSendingChat"
              streaming-label="Thinking in character..."
              empty-label="No messages yet. The void is listening, but it keeps forgetting its password."
              :prose="false"
            />

            <div class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <button
                v-for="prompt in presetPrompts"
                :key="prompt"
                class="btn btn-outline btn-sm justify-start rounded-xl text-left"
                :class="
                  selectedPrompt === prompt ? 'btn-primary text-white' : ''
                "
                type="button"
                :disabled="!characterStore.selectedCharacter || isSendingChat"
                @click="selectPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>

            <details
              class="mb-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <summary
                class="cursor-pointer text-sm font-bold text-base-content"
              >
                Getting To Know You Questions
              </summary>

              <div
                class="mt-3 grid max-h-80 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2"
              >
                <button
                  v-for="question in gettingToKnowYouQuestions"
                  :key="question"
                  class="rounded-2xl border p-3 text-left text-sm transition"
                  :class="
                    selectedGettingToKnowYouQuestion === question
                      ? 'border-secondary bg-secondary text-secondary-content shadow-md'
                      : 'border-base-300 bg-base-100 hover:border-primary hover:bg-primary hover:text-primary-content'
                  "
                  type="button"
                  :disabled="!characterStore.selectedCharacter || isSendingChat"
                  @click="selectGettingToKnowYouQuestion(question)"
                >
                  {{ question }}
                </button>
              </div>

              <div class="mt-3 flex justify-end">
                <button
                  class="btn btn-ghost btn-xs rounded-xl"
                  type="button"
                  :disabled="!selectedGettingToKnowYouQuestion || isSendingChat"
                  @click="clearSelectedPrompt"
                >
                  Clear Prompt
                </button>
              </div>
            </details>

            <div
              v-if="selectedGettingToKnowYouQuestion"
              class="mb-3 rounded-2xl border border-secondary/40 bg-secondary/10 p-3 text-sm"
            >
              <p class="text-xs font-bold uppercase text-secondary">
                Selected getting-to-know-you prompt
              </p>

              <p class="mt-1 text-base-content/80">
                {{ selectedGettingToKnowYouQuestion }}
              </p>
            </div>

            <textarea
              v-model="chatMessage"
              class="textarea textarea-bordered min-h-32 w-full resize-none rounded-2xl bg-base-200"
              placeholder="Say something to the character..."
              :disabled="!characterStore.selectedCharacter || isSendingChat"
              @input="syncSelectedPromptFromText"
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
                />
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <reward-gallery
                  variant="dropdown"
                  title="Reward"
                  subtitle="Optional story item."
                  :show-images="false"
                  :show-controls="false"
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

            <section
              v-if="adventurePrompt"
              class="mt-4 rounded-2xl border border-base-300 bg-base-200 p-4"
            >
              <h2 class="mb-3 text-lg font-bold text-base-content">
                Adventure Prompt Preview
              </h2>

              <pre
                class="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-base-100 p-3 text-sm text-base-content/75"
                >{{ adventurePrompt }}</pre>
            </section>
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
              }}</pre>
          </article>
        </section>
      </main>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'

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

const activeMode = ref<CharacterInteractMode>('chat')
const chatMessage = ref('')
/* Scope key for the session signal the router reads. See chatStore. */
const SESSION_SCOPE = 'character'

const chatMessages = ref<LocalChatMessage[]>([])
const adventureDirection = ref('')
const adventurePrompt = ref('')
const promptText = ref('')
const selectedPrompt = ref('')
const selectedGettingToKnowYouQuestion = ref('')
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

const selectedCharacterStats = computed(() => {
  const character = characterStore.selectedCharacter

  return [
    { key: 'charm', label: 'Charm', value: character?.charm || 'COMMON' },
    { key: 'empathy', label: 'Empathy', value: character?.empathy || 'COMMON' },
    { key: 'grace', label: 'Grace', value: character?.grace || 'COMMON' },
    { key: 'luck', label: 'Luck', value: character?.luck || 'COMMON' },
    { key: 'might', label: 'Might', value: character?.might || 'COMMON' },
    { key: 'wits', label: 'Wits', value: character?.wits || 'COMMON' },
  ]
})

const selectedScenarioTitle = computed(() => {
  return scenarioStore.selectedScenario?.title || 'No scenario selected'
})

const selectedRewardTitle = computed(() => {
  const reward = rewardStore.selectedReward

  if (!reward) return 'No reward selected'

  return reward.name || reward.description || 'Unnamed reward'
})

const canSendChat = computed(() => {
  return Boolean(
    characterStore.selectedCharacter &&
    chatMessage.value.trim() &&
    !isSendingChat.value,
  )
})

/* chatMessages as kr-chat-window turns. Each local message already carries
   its own role, so the mapping is direct -- no pairing needed the way a
   stored chat record (one row per exchange) requires elsewhere. */
const chatTurns = computed<NarrativeTurn[]>(() =>
  chatMessages.value.map((messageItem) => ({
    id: messageItem.id,
    text: messageItem.content,
    from: messageItem.role === 'user' ? 'user' : 'narrator',
    speaker:
      messageItem.role === 'user' ? undefined : selectedCharacterName.value,
  })),
)

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function setActiveMode(mode: CharacterInteractMode) {
  activeMode.value = mode
}

function clearSelectedCharacter() {
  characterStore.deselectCharacter()
  clearChatMessages()
  clearSelectedPrompt()
  activeMode.value = 'chat'
}

function clearChatMessages() {
  chatMessages.value = []
  statusMessage.value = ''
  chatStore.clearSessionChats(SESSION_SCOPE)
}

function clearSelectedPrompt() {
  selectedPrompt.value = ''
  selectedGettingToKnowYouQuestion.value = ''

  if (!isSendingChat.value) {
    chatMessage.value = ''
  }
}

function createMessageId(role: ChatRole) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function pickRandomPrompt(items: readonly string[], fallback: string): string {
  const index = Math.floor(Math.random() * items.length)

  return items[index] ?? fallback
}

function selectPrompt(prompt: string) {
  selectedPrompt.value = prompt
  selectedGettingToKnowYouQuestion.value = ''
  chatMessage.value = prompt
  activeMode.value = 'chat'
  setStatus('Prompt loaded into chat.')
}

function selectGettingToKnowYouQuestion(question: string) {
  selectedPrompt.value = question
  selectedGettingToKnowYouQuestion.value = question
  chatMessage.value = question
  activeMode.value = 'chat'
  setStatus('Getting-to-know-you question loaded into chat.')
}

function syncSelectedPromptFromText() {
  const current = chatMessage.value.trim()

  if (!current || current !== selectedPrompt.value) {
    selectedPrompt.value = ''
    selectedGettingToKnowYouQuestion.value = ''
  }
}

function seedChatMessage() {
  const prompt = pickRandomPrompt(
    presetPrompts,
    'What do you notice first, and what do you absolutely refuse to admit?',
  )

  selectPrompt(prompt)
}

function seedGettingToKnowYouQuestion() {
  const question = pickRandomPrompt(
    gettingToKnowYouQuestions,
    'What question are you hoping I do not ask next?',
  )

  selectGettingToKnowYouQuestion(question)
}

function buildCharacterSystemPrompt(): string {
  // Shared voice/persona builder (utils/personaPrompt.ts) so chat and future
  // WonderLab page commentary speak with the same distinct character voice.
  return buildCharacterPersonaPrompt(characterStore.selectedCharacter, {
    mode: 'chat',
  })
}

function buildCharacterMessages(content: string): BotCafeMessage[] {
  const recentMessages = chatMessages.value
    .slice(-10)
    .filter((messageItem, index, messages) => {
      const isLastMessage = index === messages.length - 1

      return !(
        isLastMessage &&
        messageItem.role === 'user' &&
        messageItem.content === content
      )
    })
    .map((messageItem): BotCafeMessage => ({
      role: messageItem.role,
      content: messageItem.content,
    }))

  return [
    {
      role: 'system',
      content: buildCharacterSystemPrompt(),
    },
    ...recentMessages,
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
  selectedPrompt.value = ''
  selectedGettingToKnowYouQuestion.value = ''

  try {
    const chat = await chatStore.addChat({
      content,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
    })

    if (!chat?.id) {
      throw new Error('Failed to create character chat.')
    }

    /*
     * The ROUTER needs to know a conversation is under way -- it keeps you here
     * even after the Character is deselected -- and chatMessages below is local
     * display state it cannot see. Registering the real Chat id with the store
     * gives character-interact that signal without moving the transcript.
     */
    chatStore.addSessionChat(SESSION_SCOPE, chat.id)

    chatStore.selectedChat = chat

    const reply = await chatStore.streamResponse(chat.id, {
      messages: buildCharacterMessages(content),
      temperature: 0.85,
      maxTokens: 700,
    })

    chatMessages.value.push({
      id: createMessageId('assistant'),
      role: 'assistant',
      content:
        typeof reply === 'string'
          ? reply
          : 'The character responded, but the reply could not be rendered.',
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
    `Drive: ${character.drive || 'No drive listed.'}`,
    `Achievements: ${character.achievements || 'No achievements listed.'}`,
    `Stats: luck ${character.luck}, might ${character.might}, wits ${character.wits}, grace ${character.grace}, charm ${character.charm}, empathy ${character.empathy}`,
    '',
    'Respond in character. Keep the voice vivid, specific, and interactive.',
  ].join('\n')

  setStatus('Character prompt built.')
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
    reward ? `Reward: ${reward.name}` : '',
    reward
      ? `Reward description: ${reward.description || 'No description provided.'}`
      : '',
    reward
      ? `Reward flavor: ${reward.flavorText || 'No flavor text provided.'}`
      : '',
    reward ? `Reward effect: ${reward.effect || 'No effect provided.'}` : '',
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
  const prompt = promptText.value.trim()

  if (!prompt) return

  selectedPrompt.value = prompt
  selectedGettingToKnowYouQuestion.value = ''
  chatMessage.value = prompt
  activeMode.value = 'chat'
  setStatus('Prompt copied into chat.')
}

onMounted(async () => {
  await Promise.all([
    characterStore.initialize({
      fetchRemote: true,
      createDefaultForm: true,
    }),
    chatStore.initialize(),
  ])
})

watch(
  () => characterStore.selectedCharacter?.id ?? null,
  () => {
    clearChatMessages()
    clearSelectedPrompt()
    activeMode.value = 'chat'
  },
)
</script>

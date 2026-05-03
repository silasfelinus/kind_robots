<!-- /components/characters/character-interact.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4">
    <header class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md">
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        Character Interact
      </h1>

      <p class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base">
        Chat with a character, drop them into a scenario, hand them a reward, or build a prompt for your next weird little adventure.
      </p>
    </header>

    <div class="flex flex-wrap gap-2 rounded-2xl border border-base-300 bg-base-100 p-2">
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

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div class="flex min-w-0 flex-col gap-4">
        <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Selected Character</h2>
              <p class="text-sm text-base-content/60">
                Choose who gets interrogated by destiny.
              </p>
            </div>

            <button
              v-if="characterStore.selectedCharacter"
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              @click="characterStore.deselectCharacter()"
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
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Chat
          </h2>

          <textarea
            v-model="chatMessage"
            class="textarea textarea-bordered min-h-32 w-full resize-none rounded-2xl bg-base-200"
            placeholder="Say something to the character..."
            :disabled="!characterStore.selectedCharacter"
            @keydown.enter.exact.prevent="sendCharacterChat"
          />

          <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              class="btn btn-ghost rounded-xl"
              type="button"
              @click="seedChatMessage"
            >
              Random Nudge
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

          <pre class="max-h-96 overflow-auto rounded-2xl bg-base-200 p-3 text-xs text-base-content/70">{{ JSON.stringify(characterStore.selectedCharacter, null, 2) }}</pre>
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

        <section
          v-if="adventurePrompt"
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 text-lg font-bold text-base-content">
            Adventure Prompt Preview
          </h2>

          <pre class="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-base-200 p-3 text-sm text-base-content/75">{{ adventurePrompt }}</pre>
        </section>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'

type CharacterInteractMode = 'chat' | 'adventure' | 'prompt' | 'debug'

const characterStore = useCharacterStore()
const chatStore = useChatStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()

const activeMode = ref<CharacterInteractMode>('chat')
const chatMessage = ref('')
const adventureDirection = ref('')
const adventurePrompt = ref('')
const promptText = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

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

const canSendChat = computed(
  () => Boolean(characterStore.selectedCharacter) && Boolean(chatMessage.value.trim()),
)

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function seedChatMessage() {
  chatMessage.value =
    'What do you notice first, and what do you absolutely refuse to admit?'
}

async function sendCharacterChat() {
  const character = characterStore.selectedCharacter
  const content = chatMessage.value.trim()

  if (!character || !content) return

  try {
    const chat = await chatStore.addChat({
      content,
      userId: character.userId || 10,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
    })

    if (!chat) {
      throw new Error('Failed to create character chat.')
    }

    chatStore.selectedChat = chat
    chatMessage.value = ''
    setStatus('Character chat sent.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to send character chat.',
      'error',
    )
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
}
</script>
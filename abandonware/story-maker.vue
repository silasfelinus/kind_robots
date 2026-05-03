<!-- /components/content/story/story-maker.vue -->
<template>
  <div
    class="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-2xl bg-base-200 p-4 md:p-6"
  >
    <header class="text-center">
      <h1 class="text-3xl font-bold text-primary md:text-4xl">
        Storyteller: Create Your Adventure
      </h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Pick a scenario, character, optional reward, and opening choice. Then
        launch the narrative goblin. Very professional. Extremely normal.
      </p>
    </header>

    <div
      v-if="statusMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-info/40 bg-info/10 text-info'
      "
    >
      {{ statusMessage }}
    </div>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-base-content">Scenario</h2>
            <p class="text-sm text-base-content/60">
              Choose the story setting.
            </p>
          </div>

          <button
            v-if="scenarioStore.selectedScenario"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearScenario"
          >
            Clear
          </button>
        </div>

        <scenario-card
          v-if="scenarioStore.selectedScenario"
          :scenario="scenarioStore.selectedScenario"
          :selected="true"
          :show-actions="false"
          :show-image="true"
          :show-description="true"
          :show-meta="true"
          :show-inspirations="false"
          :show-choices="true"
          :compact="false"
        />

        <scenario-gallery
          v-else
          variant="dropdown"
          title="Scenario"
          subtitle="Choose where the trouble starts."
          :show-images="false"
          :show-controls="false"
          :show-toolbar="false"
        />
      </article>

      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-base-content">Character</h2>
            <p class="text-sm text-base-content/60">
              Choose who has to deal with this nonsense.
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
          :is-selected="true"
          @select-character="characterStore.selectCharacter"
        />

        <character-gallery
          v-else
          variant="dropdown"
          title="Character"
          subtitle="Choose the cast member."
          :show-images="false"
          :show-controls="false"
          :show-toolbar="false"
        />
      </article>

      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-base-content">Reward</h2>
            <p class="text-sm text-base-content/60">
              Optional story item, boon, curse, or plot grenade.
            </p>
          </div>

          <button
            v-if="rewardStore.selectedReward"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="rewardStore.deselectReward()"
          >
            Clear
          </button>
        </div>

        <reward-card
          v-if="rewardStore.selectedReward"
          :reward="rewardStore.selectedReward"
          :selected="true"
          :show-actions="false"
          :show-image="true"
          :show-description="true"
          :show-meta="true"
          :compact="false"
        />

        <reward-gallery
          v-else
          variant="dropdown"
          title="Reward"
          subtitle="Choose an optional story item."
          :show-images="false"
          :show-controls="false"
          :show-toolbar="false"
        />
      </article>
    </section>

    <section
      class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold text-base-content">Story Setup</h2>

          <p class="text-sm text-base-content/70">
            Review the selected ingredients before starting.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <p class="text-xs font-bold uppercase text-base-content/50">
              Scenario
            </p>

            <p class="mt-1 font-semibold text-base-content">
              {{ selectedScenarioTitle }}
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <p class="text-xs font-bold uppercase text-base-content/50">
              Character
            </p>

            <p class="mt-1 font-semibold text-base-content">
              {{ selectedCharacterTitle }}
            </p>
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
              @click="scenarioStore.setCurrentChoice('')"
            >
              Clear choice
            </button>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <p class="text-xs font-bold uppercase text-base-content/50">
              Reward
            </p>

            <p class="mt-1 font-semibold text-base-content">
              {{ selectedRewardTitle }}
            </p>
          </div>
        </div>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Custom direction</span>
            <span class="label-text-alt text-base-content/50">Optional</span>
          </span>

          <textarea
            v-model="customDirection"
            class="textarea textarea-bordered min-h-28 rounded-2xl bg-base-200"
            placeholder="Add a tone, goal, complication, skill check, inventory item, or narrative twist..."
          />
        </label>
      </div>

      <aside
        class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <h2 class="text-lg font-bold text-base-content">Launch Controls</h2>

        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-2">
            <span>Scenario</span>
            <Icon
              :name="
                scenarioStore.selectedScenario
                  ? 'kind-icon:check'
                  : 'kind-icon:x'
              "
              class="h-5 w-5"
              :class="
                scenarioStore.selectedScenario ? 'text-success' : 'text-error'
              "
            />
          </div>

          <div class="flex items-center justify-between gap-2">
            <span>Character</span>
            <Icon
              :name="
                characterStore.selectedCharacter
                  ? 'kind-icon:check'
                  : 'kind-icon:x'
              "
              class="h-5 w-5"
              :class="
                characterStore.selectedCharacter ? 'text-success' : 'text-error'
              "
            />
          </div>

          <div class="flex items-center justify-between gap-2">
            <span>Reward</span>
            <Icon
              :name="
                rewardStore.selectedReward ? 'kind-icon:check' : 'kind-icon:x'
              "
              class="h-5 w-5"
              :class="
                rewardStore.selectedReward
                  ? 'text-success'
                  : 'text-base-content/40'
              "
            />
          </div>
        </div>

        <button
          class="btn btn-success rounded-2xl"
          type="button"
          :disabled="!canStartStory || isStartingStory || storyRunning"
          @click="startStory"
        >
          <span
            v-if="isStartingStory"
            class="loading loading-spinner loading-sm"
          />
          <Icon v-else name="kind-icon:play" class="h-5 w-5" />
          Start Story
        </button>

        <button
          class="btn btn-primary rounded-2xl"
          type="button"
          :disabled="!storyPromptPreview"
          @click="copyPrompt"
        >
          <Icon name="kind-icon:copy" class="h-5 w-5" />
          Copy Prompt
        </button>

        <button
          v-if="storyRunning"
          class="btn btn-error rounded-2xl"
          type="button"
          @click="stopStory"
        >
          <Icon name="kind-icon:stop" class="h-5 w-5" />
          Stop Story
        </button>

        <button
          class="btn btn-ghost rounded-2xl"
          type="button"
          @click="clearSelections"
        >
          <Icon name="kind-icon:refresh" class="h-5 w-5" />
          Reset Selections
        </button>
      </aside>
    </section>

    <section
      v-if="storyPromptPreview"
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <details>
        <summary class="cursor-pointer text-lg font-bold text-base-content">
          Story Prompt Preview
        </summary>

        <pre
          class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-300 p-3 text-sm text-base-content/80"
          >{{ storyPromptPreview }}</pre
        >
      </details>
    </section>

    <chat-preview />

    <section
      v-if="storyRunning"
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <weird-adventure />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useWeirdStore } from '@/stores/weirdStore'

const scenarioStore = useScenarioStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const weirdStore = useWeirdStore()

const storyRunning = ref(false)
const isStartingStory = ref(false)
const customDirection = ref('')
const statusMessage = ref('')
const statusTone = ref<'info' | 'error'>('info')

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

const canStartStory = computed(
  () =>
    Boolean(scenarioStore.selectedScenario) &&
    Boolean(characterStore.selectedCharacter),
)

const storyPromptPreview = computed(() => {
  if (!scenarioStore.selectedScenario || !characterStore.selectedCharacter) {
    return ''
  }

  return buildStoryPrompt()
})

function buildStoryPrompt() {
  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter
  const reward = rewardStore.selectedReward
  const direction = customDirection.value.trim()

  if (!scenario || !character) return ''

  return [
    `Scenario: ${scenario.title}`,
    `Scenario description: ${scenario.description}`,
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

function clearScenario() {
  scenarioStore.deselectScenario()
  scenarioStore.setCurrentChoice('')
}

async function copyPrompt() {
  if (!storyPromptPreview.value) return

  await navigator.clipboard.writeText(storyPromptPreview.value)

  statusTone.value = 'info'
  statusMessage.value = 'Story prompt copied.'
}

async function startStory() {
  if (!canStartStory.value) {
    statusTone.value = 'error'
    statusMessage.value =
      'Pick a scenario and character before launching the story goblin.'
    return
  }

  const character = characterStore.selectedCharacter

  if (!character) return

  isStartingStory.value = true
  statusMessage.value = ''
  statusTone.value = 'info'

  try {
    const content = buildStoryPrompt()

    const chat = await chatStore.addChat({
      content,
      userId: character.userId,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
    })

    if (!chat) {
      throw new Error('Failed to create chat.')
    }

    chatStore.selectedChat = chat
    storyRunning.value = true
    statusMessage.value =
      'Story launched. The narrative goblin has been released.'

    if (Array.isArray(weirdStore.history)) {
      weirdStore.history.push(chat)
    }
  } catch (error) {
    console.error('Error starting the story:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Error starting the story.'
  } finally {
    isStartingStory.value = false
  }
}

function stopStory() {
  if (chatStore.selectedChat) {
    const currentResponse = chatStore.selectedChat.botResponse || ''
    chatStore.selectedChat.botResponse = `${currentResponse} The adventure has come to an end.`
    chatStore.selectedChat = null
  }

  if (Array.isArray(weirdStore.history)) {
    weirdStore.history = []
  }

  storyRunning.value = false
  statusTone.value = 'info'
  statusMessage.value = 'Story stopped.'
}

function clearSelections() {
  scenarioStore.deselectScenario()
  characterStore.deselectCharacter()
  rewardStore.deselectReward()
  scenarioStore.setCurrentChoice('')
  customDirection.value = ''
  storyRunning.value = false
  statusMessage.value = ''
}
</script>

<!-- /components/content/weird/scenario-interact.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
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
        Choose a scenario, character, reward, and opening choice. Then launch
        the weird little narrative machine.
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
          :show-toolbar="true"
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
          :show-toolbar="true"
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
            <p class="text-xs text-base-content/60">Pick the plot grenade.</p>
          </div>

          <Icon name="kind-icon:gift" class="h-6 w-6 text-accent" />
        </div>

        <reward-gallery
          variant="row"
          title="Reward"
          subtitle="Choose a power, artifact, or suspiciously useful trinket."
          :show-controls="false"
          :show-toolbar="true"
          :show-images="true"
          :compact="true"
        />
      </article>
    </section>

    <section
      class="grid grid-cols-1 gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <div class="flex min-w-0 flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold text-base-content">Adventure Setup</h2>

          <p class="text-sm text-base-content/70">
            Review the selected pieces before starting the story.
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
                rewardStore.selectedReward ? 'text-success' : 'text-error'
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

    <section
      v-if="storyRunning"
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <weird-adventure />
    </section>
  </section>
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
    Boolean(characterStore.selectedCharacter) &&
    Boolean(rewardStore.selectedReward),
)

const storyPromptPreview = computed(() => {
  if (!scenarioStore.selectedScenario) return ''

  return buildStoryPrompt()
})

function buildStoryPrompt() {
  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter
  const reward = rewardStore.selectedReward

  if (!scenario || !character || !reward) return ''

  const direction = customDirection.value.trim()

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
    `Reward at stake: ${reward.text}`,
    `Reward power: ${reward.power || 'Unknown'}`,
    direction ? `Player direction: ${direction}` : '',
    '',
    'Generate the next scene as an interactive branching narrative. Include vivid sensory detail, meaningful consequences, and 3-5 clear follow-up options. Let the player continue with a skill check, inventory item, reward use, or custom prompt.',
  ]
    .filter(Boolean)
    .join('\n')
}

async function startStory() {
  if (!canStartStory.value) {
    statusTone.value = 'error'
    statusMessage.value =
      'Pick a scenario, character, and reward before launching the story goblin.'
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
  rewardStore.deselectReward?.()
  scenarioStore.setCurrentChoice('')
  customDirection.value = ''
  storyRunning.value = false
  statusMessage.value = ''
}
</script>

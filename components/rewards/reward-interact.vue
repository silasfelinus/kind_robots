border<!-- /components/content/rewards/reward-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-4 rounded-2xl bg-base-200 p-4">
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">
        Reward Story Prompt
      </h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Pick a reward, optionally pair it with a character, then decide what
        happens when the item appears.
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

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <h2 class="mb-2 text-lg font-bold text-base-content">
          Selected Reward
        </h2>

        <div
          v-if="rewardStore.selectedReward"
          class="rounded-2xl border border-primary/30 bg-primary/10 p-3"
        >
          <p class="font-bold text-primary">
            {{ rewardStore.selectedReward.text }}
          </p>

          <p class="mt-2 text-sm text-base-content/70">
            {{ rewardStore.selectedReward.power }}
          </p>

          <p class="mt-2 text-xs text-base-content/50">
            Collection: {{ rewardStore.selectedReward.collection }}
          </p>
        </div>

        <div
          v-else
          class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
        >
          No reward selected.
        </div>
      </article>

      <article class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <h2 class="mb-2 text-lg font-bold text-base-content">
          Selected Character
        </h2>

        <div
          v-if="characterStore.selectedCharacter"
          class="rounded-2xl border border-secondary/30 bg-secondary/10 p-3"
        >
          <p class="font-bold text-secondary">
            {{ selectedCharacterTitle }}
          </p>

          <p class="mt-2 text-sm text-base-content/70">
            {{ characterStore.selectedCharacter.species || 'Unknown species' }}
            /
            {{ characterStore.selectedCharacter.class || 'Unknown class' }}
          </p>
        </div>

        <div
          v-else
          class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/60"
        >
          No character selected. The reward can still be used as a general story
          prompt.
        </div>
      </article>
    </section>

    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Encounter mode</span>
          </span>

          <select
            v-model="encounterMode"
            class="select select-bordered bg-base-200"
          >
            <option value="discover">Character discovers the reward</option>
            <option value="use">Character uses the reward</option>
            <option value="temptation">Reward tempts the character</option>
            <option value="consequence">Reward causes a consequence</option>
            <option value="custom">Custom prompt</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Tone</span>
          </span>

          <select v-model="tone" class="select select-bordered bg-base-200">
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
          <span class="label-text font-bold">Custom direction</span>
          <span class="label-text-alt text-base-content/50">Optional</span>
        </span>

        <textarea
          v-model="customDirection"
          class="textarea textarea-bordered min-h-28 rounded-2xl bg-base-200"
          placeholder="What should happen when this reward enters the story?"
        />
      </label>
    </section>

    <section
      v-if="rewardPromptPreview"
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <details open>
        <summary class="cursor-pointer text-lg font-bold text-base-content">
          Reward Prompt Preview
        </summary>

        <pre
          class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-300 p-3 text-sm text-base-content/80"
          >{{ rewardPromptPreview }}</pre
        >
      </details>
    </section>

    <footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        class="btn btn-ghost rounded-xl"
        type="button"
        @click="clearPromptOptions"
      >
        Reset Prompt
      </button>

      <button
        class="btn btn-primary rounded-xl"
        type="button"
        :disabled="!rewardStore.selectedReward"
        @click="copyPrompt"
      >
        <Icon name="kind-icon:copy" class="h-5 w-5" />
        Copy Prompt
      </button>

      <button
        class="btn btn-success rounded-xl"
        type="button"
        :disabled="!rewardStore.selectedReward || isStarting"
        @click="startRewardStory"
      >
        <span v-if="isStarting" class="loading loading-spinner loading-sm" />
        <Icon v-else name="kind-icon:play" class="h-5 w-5" />
        Start Story
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'

const rewardStore = useRewardStore()
const characterStore = useCharacterStore()
const chatStore = useChatStore()

const encounterMode = ref<
  'discover' | 'use' | 'temptation' | 'consequence' | 'custom'
>('discover')
const tone = ref('whimsical')
const customDirection = ref('')
const statusMessage = ref('')
const statusTone = ref<'info' | 'error'>('info')
const isStarting = ref(false)

const selectedCharacterTitle = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'No character selected'

  return character.name
    ? `${character.name} the ${character.honorific || 'Unremarkable'}`.trim()
    : 'Unnamed character'
})

const rewardPromptPreview = computed(() => buildRewardPrompt())

function buildRewardPrompt() {
  const reward = rewardStore.selectedReward

  if (!reward) return ''

  const character = characterStore.selectedCharacter
  const direction = customDirection.value.trim()

  const characterLine = character
    ? `Character: ${character.name || 'Unnamed'} the ${
        character.honorific || 'Unremarkable'
      }. Details: ${character.species || 'Unknown species'}, ${
        character.class || 'Unknown class'
      }, ${character.personality || 'unknown personality'}.`
    : 'Character: No specific character selected. Treat this as a general story prompt.'

  return [
    `Reward: ${reward.text}`,
    `Reward power: ${reward.power}`,
    `Reward collection: ${reward.collection}`,
    `Reward rarity: ${reward.rarity}`,
    characterLine,
    `Encounter mode: ${encounterMode.value}`,
    `Tone: ${tone.value}`,
    direction ? `Player direction: ${direction}` : '',
    '',
    'Generate a story scene where this reward matters. Make the reward affect the scene in a meaningful way. Include consequences, sensory detail, and 3 follow-up options: one cautious, one bold, and one weird.',
  ]
    .filter(Boolean)
    .join('\n')
}

async function copyPrompt() {
  const prompt = rewardPromptPreview.value

  if (!prompt) return

  await navigator.clipboard.writeText(prompt)

  statusTone.value = 'info'
  statusMessage.value = 'Reward prompt copied.'
}

async function startRewardStory() {
  const reward = rewardStore.selectedReward

  if (!reward) {
    statusTone.value = 'error'
    statusMessage.value = 'Pick a reward before starting the story.'
    return
  }

  isStarting.value = true
  statusMessage.value = ''

  try {
    const character = characterStore.selectedCharacter
    const content = buildRewardPrompt()

    const chat = await chatStore.addChat({
      content,
      userId: character?.userId ?? reward.userId ?? 10,
      type: 'Reward',
      characterId: character?.id ?? null,
      recipientId: null,
    })

    if (!chat) {
      throw new Error('Failed to create reward story chat.')
    }

    chatStore.selectedChat = chat
    statusTone.value = 'info'
    statusMessage.value = 'Reward story started.'
  } catch (error) {
    console.error('Error starting reward story:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Error starting reward story.'
  } finally {
    isStarting.value = false
  }
}

function clearPromptOptions() {
  encounterMode.value = 'discover'
  tone.value = 'whimsical'
  customDirection.value = ''
  statusMessage.value = ''
}
</script>

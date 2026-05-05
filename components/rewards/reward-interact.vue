<!-- /components/content/rewards/reward-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-4 rounded-2xl bg-base-200 p-4">
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
          : 'border-info/40 bg-info/10 text-info'
      "
    >
      {{ statusMessage }}
    </div>

    <!-- Selected Reward -->
    <article
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
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
          Collection: {{ rewardStore.selectedReward.collection }} · Rarity:
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

    <!-- Encounter Options -->
    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <h2 class="mb-3 text-lg font-bold text-base-content">The Encounter</h2>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">How do you find it?</span>
          </span>
          <select
            v-model="encounterMode"
            class="select select-bordered bg-base-200"
          >
            <option value="discover">You stumble across it unexpectedly</option>
            <option value="use">You deliberately use the item</option>
            <option value="temptation">
              The item calls to you — you can't ignore it
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
          <span class="label-text font-bold">What do you do?</span>
          <span class="label-text-alt text-base-content/50">Optional</span>
        </span>
        <textarea
          v-model="customDirection"
          class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-200"
          placeholder="Describe your action, setting, or whatever context feels relevant..."
        />
      </label>
    </section>

    <!-- User Background (for LLM context) -->
    <section
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <h2 class="mb-1 text-lg font-bold text-base-content">About You</h2>
      <p class="mb-3 text-sm text-base-content/60">
        Give the story engine some context about who's holding this thing. This
        stays local to the prompt.
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
        />
      </label>
    </section>

    <!-- Optional Character Add-in -->
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
          <p class="font-bold text-secondary">{{ selectedCharacterTitle }}</p>
          <p class="mt-1 text-sm text-base-content/70">
            {{ characterStore.selectedCharacter.species || 'Unknown species' }}
            /
            {{ characterStore.selectedCharacter.class || 'Unknown class' }}
          </p>
          <button
            class="btn btn-ghost btn-xs mt-2 rounded-xl"
            type="button"
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

    <!-- Prompt Preview -->
    <section
      v-if="rewardPromptPreview"
      class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <details>
        <summary class="cursor-pointer text-lg font-bold text-base-content">
          Prompt Preview
        </summary>
        <pre
          class="mt-3 whitespace-pre-wrap rounded-2xl bg-base-300 p-3 text-sm text-base-content/80"
          >{{ rewardPromptPreview }}</pre
        >
      </details>
    </section>

    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        class="btn btn-ghost rounded-xl"
        type="button"
        @click="clearPromptOptions"
      >
        Reset
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useUserStore } from '@/stores/userStore'

const rewardStore = useRewardStore()
const characterStore = useCharacterStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const encounterMode = ref<
  'discover' | 'use' | 'temptation' | 'consequence' | 'custom'
>('discover')
const tone = ref('whimsical')
const customDirection = ref('')
const userBackground = ref(userStore.user?.bio ?? '')
const showCharacterPanel = ref(false)
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
    'Write a scene where this item is discovered or used. Focus on what it feels like to hold it, what it does, and the immediate consequences. End with 3 follow-up choices: one cautious, one bold, and one weird.',
  ]

  return lines.filter((l) => l !== null).join('\n')
}

async function copyPrompt() {
  const prompt = rewardPromptPreview.value
  if (!prompt) return
  await navigator.clipboard.writeText(prompt)
  statusTone.value = 'info'
  statusMessage.value = 'Prompt copied.'
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
    const senderName =
      character?.name ?? userStore.user?.username ?? 'Anonymous'

    const chat = await chatStore.addChat({
      content,
      type: 'Reward',
      sender: senderName,
      userId: userStore.user?.id ?? character?.userId ?? reward.userId ?? 10,
      characterId: character?.id ?? null,
      recipientId: null,
    })

    if (!chat) throw new Error('Failed to create reward story chat.')

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
  userBackground.value = userStore.user?.bio ?? ''
  statusMessage.value = ''
}
</script>

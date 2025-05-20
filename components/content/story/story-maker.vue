<!-- /components/content/story/story-maker.vue -->
<template>
  <div
    class="flex flex-col items-center p-6 bg-base-200 rounded-2xl max-w-4xl mx-auto"
  >
    <h1 class="text-3xl font-bold mb-8 text-center">
      Storyteller: Create Your Adventure
    </h1>

    <!-- Section for Each Store -->
    <section v-for="(store, key) in stores" :key="key" class="w-full mb-6">
      <!-- Stylized Label -->
      <h2
        class="text-xl font-semibold text-primary mb-4 border-b pb-2"
        :class="{ 'text-gray-400': !store.selectedObject?.value }"
      >
        {{ store.label }}
      </h2>

      <!-- Content -->
      <div v-if="store.selectedObject?.value">
        <!-- Preview Component for Selected Object -->
        <component
          :is="store.previewComponent"
          :[key]="store.selectedObject.value"
        />
        <!-- Deselect Button -->
        <button
          class="mt-2 text-sm text-error underline hover:no-underline"
          @click="store.deselect"
        >
          Deselect {{ store.label }}
        </button>
      </div>
      <!-- Selector Component -->
      <component :is="store.selectorComponent" v-else />
    </section>

    <!-- Chat Preview -->
    <chat-preview />

    <!-- Start and Stop Story Buttons -->
    <div class="flex gap-4 mt-6">
      <button
        class="w-full py-4 text-lg rounded-full bg-success text-white hover:bg-success-focus"
        :disabled="storyRunning"
        @click="startStory"
      >
        Start Story
      </button>
      <button
        v-if="storyRunning"
        class="w-full py-4 text-lg rounded-full bg-error text-white hover:bg-error-focus"
        @click="stopStory"
      >
        Stop Story
      </button>
    </div>

    <!-- Weird Chat Display -->
    <div v-if="storyRunning" class="mt-6 w-full">
      <weird-adventure />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useChatStore } from '@/stores/chatStore'
import { useWeirdStore } from '@/stores/weirdStore'

// Stores
const scenarioStore = useScenarioStore()
const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const chatStore = useChatStore()
const weirdStore = useWeirdStore()

const storyRunning = ref(false)

// Store Mapping
const stores = {
  scenario: {
    label: 'Scenario',
    selectedObject: computed(() => scenarioStore.selectedScenario),
    selectorComponent: 'scenario-selector',
    previewComponent: 'scenario-preview',
    deselect: () => (scenarioStore.selectedScenario = null),
  },
  choice: {
    label: 'Choice',
    selectedObject: computed(() => scenarioStore.currentChoice),
    selectorComponent: 'choice-selector',
    previewComponent: 'choice-preview',
    deselect: () => (scenarioStore.currentChoice = ''),
  },
  character: {
    label: 'Character',
    selectedObject: computed(() => characterStore.selectedCharacter),
    selectorComponent: 'character-selector',
    previewComponent: 'character-preview',
    deselect: () => (characterStore.selectedCharacter = null),
  },
  reward: {
    label: 'Special Item',
    selectedObject: computed(() => rewardStore.selectedReward),
    selectorComponent: 'reward-selector',
    previewComponent: 'reward-preview',
    deselect: () => (rewardStore.selectedReward = null),
  },
}

// Start Story
const startStory = async () => {
  const scenario = scenarioStore.selectedScenario
  const character = characterStore.selectedCharacter
  const reward = rewardStore.selectedReward

  if (!scenario || !character || !reward) {
    console.error('Cannot start story: all elements must be selected.')
    return
  }

  try {
    const content = `In this story, we begin with the scenario: "${scenario.description}". The character, "${character.name} the ${character.honorific || 'Unremarkable'}", faces a choice: "${scenarioStore.currentChoice || 'None'}". The reward at stake is "${reward.text}" with a power of ${reward.power}. Please generate a branching narrative with multiple choice options.`

    const chat = await chatStore.addChat({
      content,
      userId: character.userId,
      type: 'Weirdlandia',
      characterId: character.id,
      recipientId: null,
    })

    if (chat) {
      chatStore.selectedChat = chat
      storyRunning.value = true

      // Update the Weird Store History
      weirdStore.history.push(chat)
    } else {
      console.error('Failed to create chat.')
    }
  } catch (error) {
    console.error('Error starting the story:', error)
  }
}

// Stop Story
const stopStory = () => {
  // Update the Weird Store History
  if (chatStore.selectedChat) {
    const currentResponse = chatStore.selectedChat.botResponse || ''
    chatStore.selectedChat.botResponse = `${currentResponse} The adventure has come to an end.`
    chatStore.selectedChat = null
    weirdStore.history = []
  }
  storyRunning.value = false
}
</script>

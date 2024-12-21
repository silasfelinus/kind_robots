<template>
  <div class="flex flex-col items-center p-6 bg-base-200 rounded-2xl max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-center">Storyteller: Create Your Adventure</h1>

    <!-- Scenario Selection -->
    <div class="w-full mb-6">
      <button 
        class="w-full text-lg py-4 rounded-full bg-primary text-white hover:bg-primary-focus mb-4" 
        @click="selectScenario"
      >
        Scenario: {{ scenarioStore.selectedScenario?.name || 'Select a Scenario' }}
      </button>
      <div v-if="scenarioStore.selectedScenario" class="text-lg px-4 py-2 bg-base-100 rounded-lg">
        <h3 class="font-semibold">Attributes:</h3>
        <ul>
          <li v-for="(value, key) in scenarioStore.selectedScenario" :key="key">
            {{ key }}: {{ value }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Character Selection -->
    <div class="w-full mb-6">
      <button 
        class="w-full text-lg py-4 rounded-full bg-secondary text-white hover:bg-secondary-focus mb-4" 
        @click="selectCharacter"
      >
        Character: {{ characterStore.selectedCharacter?.name || 'Select a Character' }}
      </button>
      <div v-if="characterStore.selectedCharacter" class="text-lg px-4 py-2 bg-base-100 rounded-lg">
        <h3 class="font-semibold">Attributes:</h3>
        <ul>
          <li v-for="(value, key) in characterStore.selectedCharacter" :key="key">
            {{ key }}: {{ value }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Reward Selection -->
    <div class="w-full mb-6">
      <button 
        class="w-full text-lg py-4 rounded-full bg-accent text-white hover:bg-accent-focus mb-4" 
        @click="selectReward"
      >
        Reward: {{ rewardStore.selectedReward?.name || 'Select a Reward' }}
      </button>
      <div v-if="rewardStore.selectedReward" class="text-lg px-4 py-2 bg-base-100 rounded-lg">
        <h3 class="font-semibold">Attributes:</h3>
        <ul>
          <li v-for="(value, key) in rewardStore.selectedReward" :key="key">
            {{ key }}: {{ value }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Chat Selection -->
    <div class="w-full mb-6">
      <button 
        class="w-full text-lg py-4 rounded-full bg-info text-white hover:bg-info-focus mb-4" 
        @click="selectChat"
      >
        Chat: {{ chatStore.selectedChat?.name || 'Select a Chat' }}
      </button>
      <div v-if="chatStore.selectedChat" class="text-lg px-4 py-2 bg-base-100 rounded-lg">
        <h3 class="font-semibold">Attributes:</h3>
        <ul>
          <li v-for="(value, key) in chatStore.selectedChat" :key="key">
            {{ key }}: {{ value }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Start Story Button -->
    <button 
      class="w-full py-4 mt-6 text-lg rounded-full bg-success text-white hover:bg-success-focus" 
      :disabled="!canStartStory" 
      @click="startStory"
    >
      Start Story
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useChatStore } from '@/stores/chatStore';

const scenarioStore = useScenarioStore();
const characterStore = useCharacterStore();
const rewardStore = useRewardStore();
const chatStore = useChatStore();

// Computed to check if all selections are made
const canStartStory = computed(() => 
  scenarioStore.selectedScenario && 
  characterStore.selectedCharacter && 
  rewardStore.selectedReward && 
  chatStore.selectedChat
);

// Handlers for selections
const selectScenario = () => scenarioStore.showScenarioSelector();
const selectCharacter = () => characterStore.showCharacterSelector();
const selectReward = () => rewardStore.showRewardSelector();
const selectChat = () => chatStore.showChatSelector();

// Start Story Handler
const startStory = async () => {
  try {
    const response = await chatStore.createChat({
      scenario: scenarioStore.selectedScenario,
      character: characterStore.selectedCharacter,
      reward: rewardStore.selectedReward,
    });

    if (response.success) {
      chatStore.revealWeirdChat();
    } else {
      console.error(response.message);
    }
  } catch (error) {
    console.error('Error starting the story:', error);
  }
};
</script>

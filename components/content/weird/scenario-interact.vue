<template>
  <div class="flex flex-col items-center p-6 bg-base-200 rounded-2xl max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-center">Storyteller: Create Your Adventure</h1>

    <!-- Section for Each Store -->
    <section
      v-for="(store, key) in stores"
      :key="key"
      class="w-full mb-6"
      @click="store.selectedObject ? toggleDetails(key) : (activeSelector = key)"
    >
      <!-- Card Layout -->
      <div
        :class="[
          'flex items-center justify-between p-4 border rounded-2xl bg-base-100 hover:shadow-lg transition-all cursor-pointer',
          store.selectedObject ? 'border-primary' : 'border-gray-400',
        ]"
      >
        <div class="flex items-center gap-4">
          <!-- Image and Label -->
          <img
            :src="store.selectedObject?.image || '/images/chest1.webp'"
            alt="Object image"
            class="h-16 w-16 object-cover rounded-lg"
          />
          <div>
            <p class="text-lg font-semibold">
              {{ store.label }}:
              <span class="text-primary">{{ store.selectedObject?.name || 'None Selected' }}</span>
            </p>
            <p v-if="!store.selectedObject" class="text-sm text-gray-500">
              Click to select a {{ store.label.toLowerCase() }}.
            </p>
          </div>
        </div>

        <!-- Toggle Button for Details -->
        <div v-if="store.selectedObject" class="text-gray-500 text-sm">
          {{ detailsVisible[key] ? 'Hide' : 'Show' }} Details
        </div>
      </div>

      <!-- Debugging Details -->
      <div
        v-if="detailsVisible[key] && store.selectedObject"
        class="mt-4 bg-base-200 border rounded-lg p-4 text-sm"
      >
        <h3 class="font-semibold mb-2">Debugging Info:</h3>
        <pre class="whitespace-pre-wrap text-gray-600">
          {{ JSON.stringify(store.selectedObject, null, 2) }}
        </pre>
      </div>

      <!-- Specific Selector Components -->
      <scenario-selector
        v-if="activeSelector === 'scenario' && key === 'scenario'"
        @close="activeSelector = null"
      />
      <character-selector
        v-if="activeSelector === 'character' && key === 'character'"
        @close="activeSelector = null"
      />
      <reward-selector
        v-if="activeSelector === 'reward' && key === 'reward'"
        @close="activeSelector = null"
      />
      <chat-selector
        v-if="activeSelector === 'chat' && key === 'chat'"
        @close="activeSelector = null"
      />
    </section>

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
import { ref, computed } from 'vue';
import { useScenarioStore } from '@/stores/scenarioStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useRewardStore } from '@/stores/rewardStore';
import { useChatStore } from '@/stores/chatStore';

// Stores
const scenarioStore = useScenarioStore();
const characterStore = useCharacterStore();
const rewardStore = useRewardStore();
const chatStore = useChatStore();

// Store Mapping
const stores = {
  scenario: {
    label: 'Scenario',
    selectedObject: computed(() => scenarioStore.selectedScenario),
  },
  character: {
    label: 'Character',
    selectedObject: computed(() => characterStore.selectedCharacter),
  },
  reward: {
    label: 'Reward',
    selectedObject: computed(() => rewardStore.selectedReward),
  },
  chat: {
    label: 'Chat',
    selectedObject: computed(() => chatStore.selectedChat),
  },
};

// Debugging Details Toggle
const detailsVisible = ref({
  scenario: false,
  character: false,
  reward: false,
  chat: false,
});

const toggleDetails = (key: string) => {
  detailsVisible.value[key] = !detailsVisible.value[key];
};

// Active Selector Management
const activeSelector = ref<string | null>(null);

// Validation for Starting the Story
const canStartStory = computed(() =>
  Object.values(stores).every(store => store.selectedObject.value)
);

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

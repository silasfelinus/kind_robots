<template>
  <div
    class="button-container flex flex-col items-center min-h-screen w-full overflow-hidden p-4"
  >
    <!-- Section Buttons -->
    <div
      class="flex justify-center space-x-1 md:space-x-3 lg:space-x-5 w-full mb-3"
    >
      <button
        v-for="tab in tabs"
        :key="tab.name"
        :class="[
          'px-2 md:px-4 lg:px-6 text-lg font-semibold border-accent rounded-lg',
          tab.name === activeTab
            ? 'bg-primary text-white'
            : 'bg-info hover:bg-secondary text-white',
        ]"
        @click="activeTab = tab.name"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Bot Sections -->
    <div
      class="bot-sections flex-grow w-full overflow-y-auto p-2 md:p-4 lg:p-6"
    >
      <lazy-add-bot v-if="activeTab === 'add-bot'" />
      <lazy-kind-robot v-if="activeTab === 'kind-robot'" />
      <lazy-bot-gallery v-if="activeTab === 'bot-gallery'" />
      <lazy-use-bot v-if="activeTab === 'use-bot'" />
      <lazy-chat-test v-if="activeTab === 'chat-test'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Tabs setup for Bot Factory
const tabs = [
  { name: 'add-bot', label: 'Add Bot' },
  { name: 'kind-robot', label: 'Kind Robot' },
  { name: 'bot-gallery', label: 'Bot Gallery' },
  { name: 'use-bot', label: 'Use Bot' },
  { name: 'chat-test', label: 'Chat Test' },
]

const activeTab = ref('add-bot') // Default to the first tab
</script>

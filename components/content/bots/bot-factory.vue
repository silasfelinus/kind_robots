<template>
  <div
    class="bot-factory-container flex flex-col z-10"
    :style="{ height: displayStore.mainHeight }"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-full">
      <Icon name="mdi:loading" class="animate-spin text-4xl" />
      Loading...
    </div>

    <!-- Show content when not loading -->
    <transition name="flip">
      <div v-if="!isLoading" class="flex-grow">
        <!-- Bot Factory Section Titles (Fixed at the top) -->
        <div class="flex justify-center space-x-4 mb-4">
          <button class="btn btn-primary" @click="selectBotSection('add-bot')">
            Add Bot
          </button>

          <button
            class="btn btn-secondary"
            @click="selectBotSection('kind-robot')"
          >
            Kind Robot
          </button>

          <button
            class="btn btn-accent"
            @click="selectBotSection('bot-gallery')"
          >
            Bot Gallery
          </button>
        </div>

        <!-- Bot Sections -->
        <div class="bot-sections flex-grow overflow-auto">
          <!-- Add Bot Screen -->
          <lazy-add-bot
            v-show="selectedBotSection === 'add-bot'"
            @close="handleSectionClose"
          ></lazy-add-bot>

          <!-- Kind Robot Screen -->
          <lazy-kind-robot
            v-show="selectedBotSection === 'kind-robot'"
            @close="handleSectionClose"
          ></lazy-kind-robot>

          <!-- Bot Gallery Screen -->
          <lazy-bot-gallery
            v-show="selectedBotSection === 'bot-gallery'"
            @close="handleSectionClose"
          ></lazy-bot-gallery>
        </div>
      </div>
    </transition>

    <!-- Debug Message -->
    <div v-if="debugMessage" class="text-blue-500 mt-4">
      {{ debugMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useDisplayStore } from './../../../stores/displayStore'

// State variables
const isLoading = ref(true)
const debugMessage = ref<string | null>(null) // For debugging the initialization process
const selectedBotSection = ref<string | null>(null) // Track selected section (add-bot, kind-robot, bot-gallery)

// Access the display store
const displayStore = useDisplayStore()

// Watch for selected section and update the debug message
watch(
  () => selectedBotSection.value,
  (section) => {
    debugMessage.value = section ? `${section} selected` : 'No section selected'
  },
)

// Handle when a section is closed
const handleSectionClose = () => {
  selectedBotSection.value = null
}

// Select the section (add-bot, kind-robot, bot-gallery)
const selectBotSection = (section: string) => {
  selectedBotSection.value = section
}

// Simulate initialization process (e.g., loading content)
onMounted(() => {
  setTimeout(() => {
    isLoading.value = false // Set loading to false after 1 second
  }, 1000)
})
</script>

<style scoped>
.bot-factory-container {
  width: 100%;
  overflow: hidden;
}

.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

.bot-sections {
  padding: 1rem;
  max-height: 80vh; /* Adjust as needed */
}

@media (max-width: 600px) {
  .bot-sections {
    padding: 0.5rem;
  }
}
</style>

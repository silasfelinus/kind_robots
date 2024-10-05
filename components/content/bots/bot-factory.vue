<template>
  <div
    class="bot-factory-container flex flex-col z-10"
    :style="{ height: displayStore.mainHeight, width: displayStore.mainWidth }"
  >
    <!-- Transition Wrapper -->
    <transition name="flip">
      <div v-if="selectedBotSection" class="flex-grow">
        <!-- Bot Factory Section Titles -->
        <div
          class="flex justify-center space-x-2 mb-4 lg:space-x-4 md:space-x-3 sm:space-x-1"
        >
          <button
            class="btn btn-primary border-1 border-accent px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6"
            :aria-selected="selectedBotSection === 'add-bot'"
            @click="selectBotSection('add-bot')"
          >
            Add Bot
          </button>

          <button
            class="btn btn-secondary border-1 border-accent px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6"
            :aria-selected="selectedBotSection === 'kind-robot'"
            @click="selectBotSection('kind-robot')"
          >
            Kind Robot
          </button>

          <button
            class="btn btn-info border-1 border-accent px-4 py-2 sm:px-2 sm:py-1 md:px-3 lg:px-6"
            :aria-selected="selectedBotSection === 'bot-gallery'"
            @click="selectBotSection('bot-gallery')"
          >
            Bot Gallery
          </button>
        </div>

        <!-- Bot Sections -->
        <div class="bot-sections flex-grow overflow-auto">
          <!-- Add Bot Screen -->
          <lazy-add-bot
            v-if="selectedBotSection === 'add-bot'"
            @close="handleSectionClose"
          ></lazy-add-bot>

          <!-- Kind Robot Screen -->
          <lazy-kind-robot
            v-if="selectedBotSection === 'kind-robot'"
            @close="handleSectionClose"
          ></lazy-kind-robot>

          <!-- Bot Gallery Screen -->
          <lazy-bot-gallery
            v-if="selectedBotSection === 'bot-gallery'"
            @close="handleSectionClose"
          ></lazy-bot-gallery>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDisplayStore } from './../../../stores/displayStore'

const selectedBotSection = ref<string | null>(null) // Track selected section (add-bot, kind-robot, bot-gallery)

// Access the display store
const displayStore = useDisplayStore()

// Handle when a section is closed
const handleSectionClose = () => {
  selectedBotSection.value = null
}

// Select the section (add-bot, kind-robot, bot-gallery)
const selectBotSection = (section: string) => {
  selectedBotSection.value = section
}
</script>

<style scoped>
.bot-factory-container {
  width: 100%;
  overflow: hidden;
}

/* Flip Animation */
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(180deg);
}

/* Bot Sections Padding */
.bot-sections {
  padding: 1rem;
}

/* Responsive Padding */
@media (max-width: 600px) {
  .bot-sections {
    padding: 0.5rem;
  }
}

@media (min-width: 768px) {
  .bot-sections {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .bot-sections {
    padding: 2rem;
  }
}
</style>

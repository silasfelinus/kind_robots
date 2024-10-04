<template>
  <div
    class="bot-factory-container flex flex-col z-10"
    :style="{ height: displayStore.mainHeight, width: displayStore.mainWidth }"
  >
    <transition name="flip">
      <div class="flex-grow">
        <!-- Bot Factory Section Titles (Fixed at the top) -->
        <div class="flex justify-center space-x-1 mb-2">
          <button class="btn btn-primary" @click="selectBotSection('add-bot')" :aria-selected="selectedBotSection === 'add-bot'">
            Add Bot
          </button>

          <button
            class="btn btn-secondary"
            @click="selectBotSection('kind-robot')"
            :aria-selected="selectedBotSection === 'kind-robot'"
          >
            Kind Robot
          </button>

          <button
            class="btn btn-accent"
            @click="selectBotSection('bot-gallery')"
            :aria-selected="selectedBotSection === 'bot-gallery'"
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
import { ref, onMounted, watch } from 'vue'
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
}

@media (max-width: 600px) {
  .bot-sections {
    padding: 0.5rem;
  }
}
</style>

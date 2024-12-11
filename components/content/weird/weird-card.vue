<template>
  <div
    class="weird-card-container bg-base-200 border border-gray-400 rounded-2xl shadow-lg p-4 flex flex-col space-y-4 relative"
  >
    <!-- Eyeball Frames -->
    <NewEyeball class="absolute top-0 left-0 w-8 h-8" />
    <NewEyeball class="absolute top-0 right-0 w-8 h-8 rotate-90" />
    <NewEyeball class="absolute bottom-0 left-0 w-8 h-8 -rotate-90" />
    <NewEyeball class="absolute bottom-0 right-0 w-8 h-8 rotate-180" />

    <!-- WeirdArt Section -->
    <div
      class="weird-art bg-accent text-white flex items-center justify-center rounded-lg"
    >
      <p class="text-lg font-bold">WeirdArt Section (Image)</p>
      <p v-if="currentArt" class="text-sm mt-2">Art: {{ currentArt }}</p>
      <p v-else class="text-sm mt-2">No art available</p>
    </div>

    <!-- Main Content -->
    <div class="weird-main-content flex flex-grow">
      <!-- WeirdSheet Section -->
      <div
        class="weird-sheet bg-primary text-white flex flex-col items-center justify-center rounded-lg w-1/2"
      >
        <p class="text-lg font-bold">WeirdSheet Section (Character Sheet)</p>
        <p v-if="activeCharacter" class="text-sm mt-2">
          Character: {{ activeCharacter.name || 'Unknown Character' }}
        </p>
        <p v-else class="text-sm mt-2">No character selected</p>
      </div>

      <!-- Right Side (Adventure and Choices) -->
      <div class="weird-right flex flex-col w-1/2 space-y-4">
        <!-- WeirdAdventure Section -->
        <div
          class="weird-adventure bg-secondary text-white flex items-center justify-center rounded-lg flex-grow"
        >
          <p class="text-lg font-bold">WeirdAdventure Section (History)</p>
          <p v-if="activeChat" class="text-sm mt-2">
            Current Chat: {{ activeChat.content || 'No content' }}
          </p>
          <p v-else class="text-sm mt-2">No active chat</p>
        </div>

        <!-- WeirdChoices Section -->
        <div
          class="weird-choices bg-warning text-white flex items-center justify-center rounded-lg flex-grow"
        >
          <p class="text-lg font-bold">WeirdChoices Section (Options)</p>
          <p v-if="currentSetting" class="text-sm mt-2">
            Setting: {{ currentSetting }}
          </p>
          <p v-else class="text-sm mt-2">No setting defined</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'
import NewEyeball from '@/components/NewEyeball.vue'

const weirdStore = useWeirdStore()

// State placeholders from the store
const activeCharacter = computed(() => weirdStore.activeCharacter)
const activeChat = computed(() => weirdStore.activeChat)
const currentSetting = computed(() => weirdStore.setting)
const currentArt = computed(() => weirdStore.artImage)
</script>

<style scoped>
.weird-card-container {
  width: 100%;
  max-width: 1200px;
  height: 600px;
  margin: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}
.weird-art {
  height: 15%;
}
.weird-main-content {
  flex-grow: 1;
  display: flex;
}
.weird-sheet {
  flex: 1;
  margin-right: 8px;
}
.weird-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 8px;
}
.weird-adventure {
  height: 50%;
  margin-bottom: 8px;
}
.weird-choices {
  height: 50%;
}
</style>

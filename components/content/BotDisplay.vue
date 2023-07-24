<template>
  <div class="flex justify-center items-center h-screen bg-gray-200">
    <div
      class="flip-container w-64 h-96 bg-white rounded-lg shadow-lg overflow-hidden"
      @click="flipped = !flipped"
    >
      <div
        v-if="!flipped"
        class="flip-item absolute inset-0 flex flex-col justify-between p-4 bg-primary text-white"
      >
        <div
          class="flipper absolute w-full h-full bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-700 ease-in-out transform-gpu"
        >
          <div
            class="front absolute inset-0 flex flex-col justify-between p-4 bg-primary text-white z-10"
          >
            <!-- Front Side -->
            <div>
              <img
                :src="activeBot ? activeBot.avatarImage : undefined"
                class="w-full h-2/3 object-cover rounded-t-lg"
              />
              <div class="mt-4">
                <h2 class="text-xl font-bold mb-2">{{ activeBot ? activeBot.name : '' }}</h2>
                <p class="text-base">{{ activeBot ? activeBot.description : '' }}</p>
              </div>
            </div>
            <div
              v-if="flipped"
              class="flip-item absolute inset-0 flex flex-col justify-between p-4 bg-primary text-white transform rotate-y-180"
            >
              <!-- Back Side -->
              <div>
                <img
                  :src="activeBot ? activeBot.avatarImage : undefined"
                  class="w-32 h-32 object-cover rounded-lg mb-4"
                />
                <div class="mt-4">
                  <p>Bot Type: {{ activeBot ? activeBot.botType : '' }}</p>
                  <temperature-slider />
                </div>
              </div>
              <div
                v-if="activeBot && activeBot.underConstruction"
                class="mt-4 flex items-center space-x-2 text-red-500"
              >
                <p>Under Construction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBotStore } from '../../stores/botStore'

const botStore = useBotStore()
let activeBot = computed(() => botStore.getActiveBot)
let flipped = ref(false)
</script>

<style scoped>
.flip-container {
  perspective: 1000px;
}

.flip-item {
  transition: transform 0.6s;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  width: 100%;
  height: 100%;
}

.flip-item:nth-child(2) {
  position: absolute;
  top: 0;
}
</style>

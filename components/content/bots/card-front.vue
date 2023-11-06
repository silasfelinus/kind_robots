<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBotStore } from '../../../stores/botStore';

const botsStore = useBotStore();
const currentBot = computed(() => botsStore.currentBot);
const bots = computed(() => botsStore.bots);
const toggled = ref(false);
</script>
<template>
  <div
    class="card-front grid grid-rows-4 gap-4 p-4 border-2 border-solid border-gray-300 bg-base-200 opacity-90 rounded-lg shadow-lg text-base-content items-start h-auto lg:h-screen my-4"
  >
    <div v-if="currentBot" class="row-span-full lg:row-span-1 flex flex-col items-center space-y-4">
      <div class="card bg-base-200 text-base-content shadow-xl flex-grow overflow-auto w-full">
        <div class="flex flex-col items-center p-4">
          <avatar-image class="w-64 h-64 object-cover rounded-full mb-4" />
          <h1 class="text-4xl font-semibold mb-2 card-title">{{ currentBot.name }}</h1>
          <p class="mt-2 text-xl">{{ currentBot.description }}</p>
          <div class="w-40">
            <label for="n-selection" class="block text-sm font-medium text-gray-700"
              >Select Number of Iterations:</label
            >
          </div>

          <div class="mt-4">
            <div class="mt-4">
              <temperature-slider />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-front {
  perspective: 1000px;
}

.card-front .v-enter-active,
.card-front .v-leave-active {
  transition: transform 0.6s;
}

.card-front .v-enter,
.card-front .v-leave-to {
  transform: rotateY(180deg);
}
</style>

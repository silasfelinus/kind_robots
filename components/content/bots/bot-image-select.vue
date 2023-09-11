<template>
  <div class="flex flex-col p-8 bg-base space-y-4">
    <div>
      <label for="botSelect" class="text-lg font-semibold mb-2 block">Explore Robots:</label>
      <select
        id="botSelect"
        v-model="currentBotId"
        class="mb-4 block w-1/2 mx-auto py-2 rounded-md shadow-lg text-center"
        @change="setCurrentBotId"
      >
        <option v-for="bot in botsStore.bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>
    <transition-group name="list" tag="div" class="overflow-auto">
      <div
        v-for="bot in botsStore.bots"
        :key="bot.id"
        :ref="(el) => (bot.id === currentBotId ? (currentBotRef = el) : null)"
        class="flex flex-col items-center justify-between w-full p-4 cursor-pointer mb-4 transition-colors ease-in-out duration-200 rounded-lg shadow-lg"
        :class="{
          'bg-accent text-secondary': botsStore.currentBot && botsStore.currentBot.id === bot.id,
          'bg-primary': !botsStore.currentBot || botsStore.currentBot.id !== bot.id
        }"
        @click="setCurrentBotId()"
      >
        <div class="w-full h-96 object-cover rounded-lg overflow-hidden">
          <avatar-image />

          <div class="bg-opacity-70 bg-black text-default p-4">
            <h2 class="mt-4 text-2xl font-semibold text-center">{{ bot.name }}</h2>
            <p class="mt-2 text-center">{{ bot.description }}</p>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useBotStore } from '../../../stores/botStore'

const botsStore = useBotStore()
let currentBotId = ref(botsStore.currentBot ? botsStore.currentBot.id : null)
const currentBotRef = ref<any>(null)

const setCurrentBotId = async () => {
  if (currentBotId.value !== null) {
    await botsStore.getBotById(currentBotId.value)
    if (currentBotRef.value instanceof HTMLElement) {
      await nextTick()
      currentBotRef.value.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

onMounted(async () => {
  if (!botsStore.bots.length) {
    await botsStore.getBots()
    if (botsStore.bots.length > 0) {
      currentBotId.value = botsStore.bots[0].id
    }
  }
})

watch(
  () => currentBotId.value,
  (newValue) => {
    if (newValue && (!botsStore.currentBot || botsStore.currentBot.id !== newValue)) {
      botsStore.getBotById(newValue)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: transform 1s;
}
.list-enter,
.list-leave-to {
  transform: translateY(100%);
}
.list-leave,
.list-enter-to {
  transform: translateY(0);
}

/* Add some extra styling */
select {
  background-color: #ffffff;
  border: none;
}

.bg-accent {
  background-color: #3a3b3c;
}

.bg-primary {
  background-color: #1f2937;
}

.text-secondary {
  color: #ffffff;
}

.avatar-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

div[role='option']:hover {
  background-color: #374151;
}

div[role='listbox'] {
  max-height: 300px;
  overflow: auto;
}
</style>

<template>
  <div class="min-h-screen flex flex-col justify-center sm:py-12 bg-base-200">
    <div class="relative py-3 sm:max-w-xl sm:mx-auto">
      <div
        class="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg transform rounded-3xl"
      />
      <div
        class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20"
      >
        <div class="max-w-md mx-auto">
          <div class="flex flex-col w-full">
            <label class="font-bold mb-2 text-gray-700" for="bot-selector"
              >Select a Bot:</label
            >
            <select
              id="bot-selector"
              v-model="selectedBot"
              class="form-select block w-full mt-1 rounded-2xl"
              @change="handleChange"
            >
              <option disabled value="">Please select a bot</option>
              <option v-for="bot in bots" :key="bot.id" :value="bot.id">
                {{ bot.name }}
              </option>
            </select>
            <div v-if="currentBot" class="mt-4 text-blue-500">
              <p>Active bot: {{ currentBot.name }}</p>
            </div>
            <!-- Card display -->
            <div
              v-if="currentBot"
              class="mt-4 p-4 bg-gray-100 rounded-lg shadow-md"
            >
              <img
                :src="currentBot?.avatarImage || '/images/default-avatar.png'"
                alt="Bot Avatar"
                class="w-24 h-24 rounded-full mx-auto"
              />

              <h3 class="text-2xl mt-4 text-center">
                {{ currentBot.name }}
              </h3>
              <p class="mt-2 text-center">
                {{ currentBot.description }}
              </p>
            </div>
            <div v-else>
              <title-image />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const selectedBot = ref('')
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

onMounted(async () => {
  try {
    await botStore.loadStore()
  } catch (err) {
    console.error('Failed to load store', err)
  }
})

const handleChange = async () => {
  await botStore.getBotById(Number(selectedBot.value))
}

watch(
  () => currentBot.value,
  (newCurrentBot) => {
    if (newCurrentBot) {
      const id = newCurrentBot.id
      const botElement = document.getElementById(`bot-${id}`)
      botElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  },
)
</script>

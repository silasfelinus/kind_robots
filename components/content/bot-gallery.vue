<template>
  <div>
    <div class="flex justify-end space-x-4">
      <div
        class="rounded-full p-3 cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-primary"
        @click="layout = 'badge'"
      >
        <nuxt-icon
          name="view-grid-outline"
          title="Badge Layout"
          :active="layout === 'badge'"
          class="w-6 h-6"
        />
      </div>
      <div
        class="rounded-full p-3 cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-primary"
        @click="layout = 'card'"
      >
        <nuxt-icon
          name="view-agenda-outline"
          title="Card Layout"
          :active="layout === 'card'"
          class="w-6 h-6"
        />
      </div>
      <div
        class="rounded-full p-3 cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-primary"
        @click="layout = 'hero'"
      >
        <nuxt-icon
          name="view-carousel-outline"
          title="Hero Layout"
          :active="layout === 'hero'"
          class="w-6 h-6"
        />
      </div>
      <div
        class="rounded-full p-3 cursor-pointer hover:scale-110 transition-transform border-2 border-transparent hover:border-primary"
        @click="layout = 'full'"
      >
        <nuxt-icon
          name="view-fullscreen-outline"
          title="Full Layout"
          :active="layout === 'full'"
          class="w-6 h-6"
        />
      </div>
    </div>

    <transition name="bot-layout" mode="out-in">
      <div :key="layout" :class="`bot-gallery bot-gallery--${layout} bg-base p-4 rounded-lg`">
        <div v-for="bot in bots" :key="bot.id" class="bot" @click="setCurrentBot(bot)">
          <img
            :src="bot.avatarImage"
            class="bot__avatar w-32 h-32 mx-auto rounded-full shadow-lg"
          />
          <h2 class="bot__name text-lg font-semibold text-center mt-4">{{ bot.name }}</h2>
          <p class="bot__description text-center mt-2">{{ bot.description }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useBotStore, Bot } from '../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

const layout = ref('badge') // default layout

const setCurrentBot = (bot: Bot) => {
  botStore.getBotById(bot.id)
}

onMounted(async () => {
  if (bots.value.length === 0) {
    await fetchBots()
  }
})

const fetchBots = async () => {
  try {
    await botStore.getBots()
    if (!currentBot.value && bots.value.length > 0) {
      botStore.getBotById(bots.value[0].id)
    }
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
.bot-gallery {
  display: grid;
  grid-gap: 1rem;
}

.bot-gallery--badge .bot {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.bot-gallery--card .bot {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.bot-gallery--hero .bot {
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.bot-gallery--full .bot {
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
}

/* Add transition styles */
.bot-layout-enter-active,
.bot-layout-leave-active {
  transition:
    opacity 0.5s,
    transform 0.5s;
}

.bot-layout-enter,
.bot-layout-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

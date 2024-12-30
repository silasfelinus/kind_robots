<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    <div
      v-for="bot in bots"
      :key="bot.id"
      class="cursor-pointer"
      @click="selectBot(bot.id)"
    >
      <div class="card bordered">
        <figure>
          <img :src="bot.avatarImage || '/images/avatars/lingua1.webp'" />
        </figure>
        <div class="card-body">
          <h2 class="card-title">
            {{ bot.name }}
          </h2>
          <p v-if="isSelectedBot(bot.id)">
            {{ bot.description }}
          </p>
          <!-- Add more info here when the card is selected -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const selectedBotId = ref<number | null>(null)

const bots = computed(() => botStore.bots)
const selectBot = (id: number) => {
  selectedBotId.value = id
}
const isSelectedBot = (id: number) => id === selectedBotId.value
</script>

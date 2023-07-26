<template>
  <div class="grid md:grid-cols-3 gap-4 p-4">
    <!-- Bot card loop -->
    <div
      v-for="bot in botStore.bots"
      :key="bot.id"
      class="max-w-xs rounded overflow-hidden shadow-lg my-2"
    >
      <!-- Bot card details -->
      <div class="px-6 py-4">
        <div class="font-bold text-xl mb-2">{{ bot.name }}</div>
        <p class="text-gray-700 text-base">
          {{ bot.description }}
        </p>
      </div>
      <div class="px-6 pt-4 pb-2">
        <!-- Bot Actions -->
        <button class="btn btn-primary btn-sm" @click="editBot(bot)">Edit</button>
        <button class="btn btn-error btn-sm" @click="deleteBot(bot.id)">Delete</button>
      </div>
    </div>

    <!-- Bot form card -->
    <div class="card glass lg:card-side bg-neutral text-neutral-content">
      <figure>
        <img :src="currentBot?.avatarImage" alt="Bot avatar" />
      </figure>
      <div class="card-body">
        <h2 class="card-title">Manage Bot</h2>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Bot Name</span>
          </label>
          <input
            v-model="currentBotName"
            type="text"
            placeholder="Bot Name"
            class="input input-bordered"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Bot Description</span>
          </label>
          <textarea v-model="currentBotDescription" class="textarea textarea-bordered"></textarea>
        </div>

        <!-- Add other form controls here for other Bot fields -->
        <div class="form-control">
          <button class="btn btn-primary" @click="updateBot">Save</button>
          <button class="btn btn-success" @click="addBot">Add New Bot</button>
          <button class="btn btn-info" @click="randomBot">Get Random Bot</button>
        </div>
      </div>
    </div>

    <!-- Bot actions -->
    <div class="p-4">
      <h2 class="text-xl font-bold mb-2">Bot Actions</h2>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Get Bot by ID</span>
        </label>
        <input
          v-model="botIdToFetch"
          type="number"
          placeholder="Bot ID"
          class="input input-bordered"
        />
        <button class="btn btn-primary mt-2" @click="getBotById">Get Bot</button>
      </div>
      <div class="mt-4">
        <button class="btn btn-info" @click="getBotCount">Get Total Bot Count</button>
        <p class="mt-2">Total Bots: {{ botStore.totalBots }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBotStore, Bot } from '../../../stores/botStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'
import { useStatusStore, StatusType } from '../../../stores/statusStore'

const botStore = useBotStore()
const errorStore = useErrorStore()
const statusStore = useStatusStore()

let currentBot = ref<Bot | null>(botStore.currentBot)
let botIdToFetch = ref('')

// computed properties for handling currentBot being potentially null
const currentBotName = computed({
  get: () => currentBot.value?.name || '',
  set: (val) => {
    if (currentBot.value) {
      currentBot.value.name = val
    }
  }
})

const currentBotDescription = computed({
  get: () => currentBot.value?.description || '',
  set: (val) => {
    if (currentBot.value) {
      currentBot.value.description = val
    }
  }
})

// initial load
botStore.loadStore()

const editBot = (bot: Bot) => {
  currentBot.value = bot
}

const updateBot = async () => {
  if (currentBot.value) {
    try {
      statusStore.setStatus(StatusType.INFO, 'Updating bot...')
      await botStore.updateBot(currentBot.value.id, {
        name: currentBotName.value,
        description: currentBotDescription.value
      })
      statusStore.setStatus(StatusType.SUCCESS, 'Bot updated successfully.')
    } catch (error) {
      errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Failed to update bot.')
      statusStore.setStatus(StatusType.ERROR, 'Failed to update bot.')
    }
  }
}

const addBot = () => {
  botStore.addBots([{ name: currentBotName.value, description: currentBotDescription.value }])
}

const deleteBot = (id: number) => {
  botStore.deleteBot(id)
}

const getBotById = () => {
  if (botIdToFetch.value) {
    botStore.getBotById(parseInt(botIdToFetch.value))
  }
}

const getBotCount = () => {
  botStore.countBots()
}

const randomBot = () => {
  botStore.randomBot()
}
</script>

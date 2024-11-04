<template>
  <div class="p-8 bg-base-200 rounded-xl shadow-lg space-y-8">
    <h2 class="text-3xl font-bold text-primary">Bot Store Manager</h2>

    <!-- Fetch and Display All Bots Section -->
    <section class="mb-6">
      <h3 class="text-xl font-semibold text-secondary">Fetch Bots</h3>
      <p class="text-gray-500">
        Retrieve and display all bots with the ability to clear the view.
      </p>
      <div class="flex items-center gap-4 mt-2">
        <button class="btn btn-primary" @click="fetchBots">Fetch Bots</button>
        <button class="btn btn-warning" @click="clearBots">Clear View</button>
      </div>
      <div v-if="bots.length" class="mt-4">
        <ul class="space-y-2">
          <li
            v-for="bot in bots"
            :key="bot.id"
            class="border rounded p-4 bg-base-100"
          >
            <strong>{{ bot.name }}</strong> -
            {{ bot.description || 'No description' }}
          </li>
        </ul>
      </div>
    </section>

    <!-- Add a New Bot Section -->
    <section class="mb-6">
      <h3 class="text-xl font-semibold text-secondary">Add New Bot</h3>
      <div class="grid gap-4 mt-2">
        <input
          v-model="newBotData.name"
          placeholder="Name"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.subtitle"
          placeholder="Subtitle"
          class="input input-bordered w-full"
        />
        <textarea
          v-model="newBotData.description"
          placeholder="Description"
          class="textarea textarea-bordered w-full"
        ></textarea>
        <input
          v-model="newBotData.avatarImage"
          placeholder="Avatar Image URL"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.botIntro"
          placeholder="Bot Introduction"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.userIntro"
          placeholder="User Introduction"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.prompt"
          placeholder="Prompt"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.personality"
          placeholder="Personality"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.theme"
          placeholder="Theme"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.tagline"
          placeholder="Tagline"
          class="input input-bordered w-full"
        />
        <input
          v-model="newBotData.designer"
          placeholder="Designer"
          class="input input-bordered w-full"
        />
        <button class="btn btn-accent w-full" @click="addBot">Add Bot</button>
      </div>
    </section>

    <!-- Update Bot Section -->
    <section class="mb-6">
      <h3 class="text-xl font-semibold text-secondary">Update Bot</h3>
      <div class="grid gap-4 mt-2">
        <input
          v-model="updateBotId"
          placeholder="Bot ID to Update"
          type="number"
          class="input input-bordered w-full"
        />
        <textarea
          v-model="updateBotData.description"
          placeholder="New Description"
          class="textarea textarea-bordered w-full"
        ></textarea>
        <input
          v-model="updateBotData.botIntro"
          placeholder="New Bot Intro"
          class="input input-bordered w-full"
        />
        <input
          v-model="updateBotData.tagline"
          placeholder="New Tagline"
          class="input input-bordered w-full"
        />
        <button class="btn btn-success w-full" @click="updateBot">
          Update Bot
        </button>
      </div>
    </section>

    <!-- Delete Bot Section -->
    <section class="mb-6">
      <h3 class="text-xl font-semibold text-secondary">Delete a Bot</h3>
      <div class="flex items-center gap-4 mt-2">
        <input
          v-model="deleteBotId"
          placeholder="Bot ID to Delete"
          type="number"
          class="input input-bordered w-full"
        />
        <button class="btn btn-error w-full" @click="deleteBot">
          Delete Bot
        </button>
      </div>
    </section>

    <!-- Selected Bot Details (after selection) -->
    <section v-if="selectedBot" class="mt-8 p-4 bg-base-100 rounded-lg shadow">
      <h3 class="text-lg font-medium text-secondary">Selected Bot Details</h3>
      <p class="mt-2">
        <strong>ID:</strong> {{ selectedBot.id }} <br />
        <strong>Name:</strong> {{ selectedBot.name }} <br />
        <strong>Description:</strong>
        {{ selectedBot.description || 'No description' }} <br />
        <strong>Personality:</strong>
        {{ selectedBot.personality || 'Not specified' }} <br />
        <strong>Designer:</strong> {{ selectedBot.designer || 'Unknown' }}
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useBotStore } from '@/stores/botStore'

export default defineComponent({
  name: 'BotStoreManager',
  setup() {
    const botStore = useBotStore()

    const newBotData = ref({
      name: '',
      subtitle: '',
      description: '',
      avatarImage: '',
      botIntro: '',
      userIntro: '',
      prompt: '',
      personality: '',
      theme: '',
      tagline: '',
      designer: '',
    })

    const updateBotId = ref<number | null>(null)
    const updateBotData = ref({
      description: '',
      botIntro: '',
      tagline: '',
    })

    const deleteBotId = ref<number | null>(null)

    const fetchBots = async () => {
      await botStore.fetchBots()
    }

    const clearBots = () => {
      botStore.bots = []
    }

    const addBot = async () => {
      await botStore.addBot(newBotData.value)
      newBotData.value = {
        name: '',
        subtitle: '',
        description: '',
        avatarImage: '',
        botIntro: '',
        userIntro: '',
        prompt: '',
        personality: '',
        theme: '',
        tagline: '',
        designer: '',
      }
    }

    const updateBot = async () => {
      if (updateBotId.value !== null) {
        botStore.botForm = { ...updateBotData.value }
        await botStore.updateBot(updateBotId.value)
        updateBotData.value = { description: '', botIntro: '', tagline: '' }
      }
    }

    const deleteBot = async () => {
      if (deleteBotId.value !== null) {
        await botStore.deleteBot(deleteBotId.value)
        deleteBotId.value = null
      }
    }

    return {
      bots: computed(() => botStore.bots),
      fetchBots,
      clearBots,
      addBot,
      updateBotId,
      updateBotData,
      updateBot,
      deleteBotId,
      deleteBot,
      selectedBot: computed(() => botStore.currentBot),
      newBotData,
    }
  },
})
</script>

<style scoped>
h2 {
  color: #2d3748;
}
</style>

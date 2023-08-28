<template>
  <div class="add-game-container">
    <h1 class="text-3xl mb-4 text-center">Add a Game</h1>
    <form class="bg-white shadow-lg rounded-lg p-8" @submit="handleSubmit">
      <label for="content" class="block text-sm font-medium text-gray-600">Content</label>
      <textarea
        id="content"
        v-model="content"
        class="mt-1 p-2 w-full rounded-md border"
        required
      ></textarea>

      <label for="category" class="block text-sm font-medium text-gray-600">Category</label>
      <select id="category" v-model="category" class="mt-1 p-2 w-full rounded-md border">
        <option value="Blue Sky Tasks">Blue Sky Tasks</option>
        <!-- Add other categories as needed -->
      </select>

      <label for="isFinished" class="block text-sm font-medium text-gray-600">Is Finished?</label>
      <input
        id="isFinished"
        v-model="isFinished"
        type="checkbox"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <label for="reward" class="block text-sm font-medium text-gray-600">Reward</label>
      <input id="reward" v-model="reward" type="text" class="mt-1 p-2 w-full rounded-md border" />

      <label for="icon" class="block text-sm font-medium text-gray-600">Icon URL</label>
      <input id="icon" v-model="icon" type="url" class="mt-1 p-2 w-full rounded-md border" />

      <label for="points" class="block text-sm font-medium text-gray-600">Points</label>
      <input id="points" v-model="points" type="number" class="mt-1 p-2 w-full rounded-md border" />

      <label for="isPrivate" class="block text-sm font-medium text-gray-600">Is Private?</label>
      <input
        id="isPrivate"
        v-model="isPrivate"
        type="checkbox"
        class="mt-1 p-2 w-full rounded-md border"
      />

      <button type="submit" class="btn btn-success w-full mt-4">Add Game</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Game } from '@prisma/client'
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()

const content = ref('')
const category = ref('Blue Sky Tasks')
const isFinished = ref(false)
const reward = ref('A Magic Reward')
const icon = ref('')
const points = ref(10)
const isPrivate = ref(false)

async function handleSubmit(e: Event) {
  e.preventDefault()
  const gameData: Partial<Game>[] = [
    {
      content: content.value,
      category: category.value,
      isFinished: isFinished.value,
      reward: reward.value,
      icon: icon.value,
      points: points.value,
      isPrivate: isPrivate.value
    }
  ]
  await gameStore.addGames(gameData)
}
</script>

<style>
/* Add any necessary CSS styling here */
</style>

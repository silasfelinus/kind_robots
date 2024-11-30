<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <h1 class="text-3xl font-bold text-gray-700 mb-4">Character Gallery</h1>

    <!-- Filter Characters by User -->
    <div class="mb-4 flex items-center">
      <label class="mr-2 text-sm font-bold text-gray-600">Filter by User:</label>
      <select
        v-model="selectedUser"
        class="bg-base-200 border border-gray-400 rounded-lg p-2"
      >
        <option value="all">All Users</option>
        <option v-for="user in userStore.users" :key="user.id" :value="user.id">
          {{ user.username }}
        </option>
      </select>
    </div>

    <!-- Character Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        :username="getUsername(character.userId)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'


// Stores
const characterStore = useCharacterStore()
const userStore = useUserStore()

// State for filtering by user
const selectedUser = ref('all')

// Get filtered characters
const filteredCharacters = computed(() => {
  if (selectedUser.value === 'all') {
    return characterStore.characters
  }
  return characterStore.characters.filter((character) => character.userId === Number(selectedUser.value))
})

// Get username based on userId
const getUsername = (userId) => {
  const user = userStore.users.find((u) => u.id === userId)
  return user ? user.username : 'Unknown User'
}
</script>

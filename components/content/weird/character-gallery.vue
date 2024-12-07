<template>
  <div class="h-screen w-full bg-base-300 p-4 flex flex-col overflow-y-auto">
    <h1 class="text-3xl font-bold text-gray-700 mb-4">Character Gallery</h1>

    <!-- Filter and Search -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
      <!-- User Filter -->
      <div class="flex items-center">
        <label class="mr-2 text-sm font-bold text-gray-600"
          >Filter by User:</label
        >
        <select
          v-model="selectedUser"
          class="bg-base-200 border border-gray-400 rounded-lg p-2"
        >
          <option value="all">All Users</option>
          <option
            v-for="user in userStore.users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }}
          </option>
        </select>
      </div>

      <!-- Search Bar -->
      <div class="flex items-center w-full md:w-1/2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search characters by name..."
          class="bg-base-200 border border-gray-400 rounded-lg p-2 w-full"
        />
      </div>
    </div>

    <!-- Character Grid -->
    <div v-if="isLoading" class="flex justify-center items-center h-96">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    <div
      v-else-if="filteredCharacters.length === 0"
      class="flex justify-center items-center h-96"
    >
      <p class="text-lg font-bold text-gray-600">No characters found.</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        
      />
    </div>
  </div>
</template>
<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

// Stores
const characterStore = useCharacterStore()
const userStore = useUserStore()

// State
const selectedUser = ref('all')
const searchQuery = ref('')
const isLoading = ref(true)

// Simulate fetching characters
watchEffect(async () => {
  isLoading.value = true
  await characterStore.fetchCharacters() // Assuming this method exists
  isLoading.value = false
})

// Computed: Filtered and searched characters
const filteredCharacters = computed(() => {
  let characters = characterStore.characters

  // Filter by user
  if (selectedUser.value !== 'all') {
    characters = characters.filter(
      (character) => character.userId === Number(selectedUser.value),
    )
  }

  // Search by name
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    characters = characters.filter((character) =>
      character.name.toLowerCase().includes(query),
    )
  }

  return characters
})


</script>

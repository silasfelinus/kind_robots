<!-- /components/content/weird/character-gallery.vue -->
<template>
  <!--
    No h-screen — lets the parent (gallery-gallery panel) control height.
    w-full + flex-col so it fills whatever container it's placed in.
  -->
  <div class="w-full flex flex-col gap-3 bg-base-300 p-3">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex items-center justify-between gap-2 shrink-0">
      <h2 class="text-base font-bold text-base-content leading-tight truncate">
        Characters
      </h2>
      <span v-if="!isLoading" class="badge badge-ghost badge-sm shrink-0">{{
        filteredCharacters.length
      }}</span>
    </div>

    <!-- ── Controls ───────────────────────────────────────────────────── -->
    <!--
      Stack vertically by default (works in a 200px sidebar).
      Side-by-side only when there's enough room (sm: breakpoint).
    -->
    <div class="flex flex-col gap-2 shrink-0 sm:flex-row sm:items-center">
      <!-- User filter -->
      <select
        v-model="selectedUser"
        class="select select-bordered select-sm w-full sm:w-auto bg-base-200 text-base-content"
        aria-label="Filter by user"
      >
        <option value="all">All users</option>
        <option v-for="user in userStore.users" :key="user.id" :value="user.id">
          {{ user.username }}
        </option>
      </select>

      <!-- Search -->
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Search characters…"
        class="input input-bordered input-sm w-full bg-base-200 text-base-content"
        aria-label="Search characters by name"
      />
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>

    <!-- ── Empty ──────────────────────────────────────────────────────── -->
    <div
      v-else-if="filteredCharacters.length === 0"
      class="flex flex-col items-center justify-center py-10 gap-2 text-base-content/50"
    >
      <span class="text-3xl">🎭</span>
      <p class="text-sm font-medium">No characters found</p>
    </div>

    <!-- ── Grid ───────────────────────────────────────────────────────── -->
    <!--
      auto-fill with minmax so the grid self-adjusts from 1 column (narrow
      sidebar) up to however many 180px columns fit (wide main pane) without
      any hard breakpoint class.
    -->
    <div v-else class="character-grid">
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        :is-selected="characterStore.selectedCharacter?.id === character.id"
        @select-character="characterStore.selectCharacter"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

const characterStore = useCharacterStore()
const userStore = useUserStore()

const selectedUser = ref('all')
const searchQuery = ref('')
const isLoading = ref(true)

watchEffect(async () => {
  isLoading.value = true
  try {
    await characterStore.fetchCharacters()
  } catch (error) {
    console.error('Error fetching characters:', error)
  } finally {
    isLoading.value = false
  }
})

const filteredCharacters = computed(() => {
  let characters = characterStore.characters

  if (selectedUser.value !== 'all') {
    characters = characters.filter(
      (c) => c.userId === Number(selectedUser.value),
    )
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    characters = characters.filter((c) => c.name.toLowerCase().includes(q))
  }

  return characters
})
</script>

<style scoped>
/*
  Container-aware auto grid: fills 1 column when narrow (sidebar),
  grows naturally as the container widens. No hard breakpoints needed.
*/
.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
  gap: 0.75rem;
}
</style>

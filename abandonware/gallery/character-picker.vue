<!-- /components/content/weird/character-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="selectedUser"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
        aria-label="Filter by user"
      >
        <option value="all">All users</option>
        <option v-for="u in userStore.users" :key="u.id" :value="u.id">
          {{ u.username }}
        </option>
      </select>

      <input
        v-model="query"
        type="search"
        placeholder="Search characters…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🎭</span> No characters found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="c in filtered"
        :key="c.id"
        class="picker-row"
        :class="{
          'picker-row--active': characterStore.selectedCharacter?.id === c.id,
        }"
        @click="characterStore.selectCharacter(c.id)"
      >
        <span class="picker-icon">🎭</span>

        <span class="picker-label">
          <span class="picker-name">{{ c.name }}</span>
          <span v-if="c.userId" class="picker-sub">uid {{ c.userId }}</span>
        </span>

        <button
          class="btn btn-xs picker-action"
          :class="
            characterStore.selectedCharacter?.id === c.id
              ? 'btn-primary'
              : 'btn-ghost'
          "
          @click.stop="characterStore.selectCharacter(c.id)"
        >
          {{
            characterStore.selectedCharacter?.id === c.id
              ? 'Selected'
              : 'Select'
          }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

const characterStore = useCharacterStore()
const userStore = useUserStore()

const query = ref('')
const selectedUser = ref<'all' | number>('all')
const isLoading = ref(true)

onMounted(async () => {
  isLoading.value = true
  try {
    await characterStore.fetchCharacters()
  } finally {
    isLoading.value = false
  }
})

const filtered = computed(() => {
  let list = characterStore.characters

  if (selectedUser.value !== 'all') {
    list = list.filter((c) => c.userId === Number(selectedUser.value))
  }

  const q = query.value.trim().toLowerCase()

  if (q) {
    list = list.filter((c) => c.name.toLowerCase().includes(q))
  }

  return list
})
</script>

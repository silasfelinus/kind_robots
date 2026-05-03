<!-- /components/content/weird/scenario-picker.vue -->
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
        placeholder="Search scenarios…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🗺️</span> No scenarios found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="s in filtered"
        :key="s.id"
        class="picker-row"
        :class="{ 'picker-row--active': scenarioStore.selectedScenario?.id === s.id }"
        @click="scenarioStore.selectScenario(s.id)"
      >
        <span class="picker-icon">🗺️</span>
        <span class="picker-label">
          <span class="picker-name">{{ s.title }}</span>
          <span class="picker-sub">uid {{ s.userId }}</span>
        </span>
        <button
          class="picker-action"
          :class="scenarioStore.selectedScenario?.id === s.id ? 'btn-primary' : 'btn-ghost'"
          @click.stop="scenarioStore.selectScenario(s.id)"
        >
          {{ scenarioStore.selectedScenario?.id === s.id ? 'Active' : 'Select' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUserStore } from '@/stores/userStore'

const scenarioStore = useScenarioStore()
const userStore = useUserStore()
const query = ref('')
const selectedUser = ref('all')
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try { await scenarioStore.fetchScenarios() } catch {}
  finally { isLoading.value = false }
})

const filtered = computed(() => {
  let list = scenarioStore.scenarios
  if (selectedUser.value !== 'all')
    list = list.filter((s) => s.userId === Number(selectedUser.value))
  const q = query.value.trim().toLowerCase()
  if (q) list = list.filter((s) => s.title?.toLowerCase().includes(q))
  return list
})
</script>

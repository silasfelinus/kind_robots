<!-- /components/content/art/checkpoint-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search checkpoints…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
      <!-- Sampler selector inline -->
      <select
        v-model="selectedSamplerName"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
        aria-label="Sampler"
        @change="checkpointStore.selectSamplerByName(selectedSamplerName)"
      >
        <option disabled value="">Sampler…</option>
        <option v-for="s in checkpointStore.allSamplers" :key="s.name" :value="s.name">
          {{ s.name }}
        </option>
      </select>
    </div>

    <!-- Active model pill -->
    <div v-if="checkpointStore.currentApiModel" class="px-1 mb-1">
      <span class="badge badge-primary badge-sm gap-1">
        <span>🧠</span>
        <span class="truncate max-w-[14rem]">{{ checkpointStore.currentApiModel }}</span>
      </span>
    </div>

    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🧠</span> No checkpoints found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="c in filtered"
        :key="c.name"
        class="picker-row"
        :class="{ 'picker-row--active': checkpointStore.selectedCheckpoint?.name === c.name }"
        @click="c.name && checkpointStore.selectCheckpointByName(c.name)"
      >
        <!-- Thumbnail if available -->
        <img
          v-if="c.MediaPath"
          :src="c.MediaPath"
          class="picker-avatar"
          alt=""
        />
        <span v-else class="picker-icon">🧠</span>

        <span class="picker-label">
          <span class="picker-name">{{ c.customLabel || c.name }}</span>
          <span v-if="c.isMature" class="picker-sub text-warning">Mature</span>
        </span>

        <button
          class="picker-action"
          :class="checkpointStore.selectedCheckpoint?.name === c.name ? 'btn-primary' : 'btn-ghost'"
          @click.stop="c.name && checkpointStore.selectCheckpointByName(c.name)"
        >
          {{ checkpointStore.selectedCheckpoint?.name === c.name ? 'Active' : 'Use' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'

const checkpointStore = useCheckpointStore()
const userStore = useUserStore()
const query = ref('')
const isLoading = ref(false)

const selectedSamplerName = computed({
  get: () => checkpointStore.selectedSampler?.name ?? '',
  set: (val: string) => { if (val) checkpointStore.selectSamplerByName(val) },
})

onMounted(async () => {
  isLoading.value = true
  try { await checkpointStore.fetchCurrentModelFromApi() } catch {}
  finally { isLoading.value = false }
})

const filtered = computed(() => {
  const checkpoints = checkpointStore.visibleCheckpoints ?? []
  const q = query.value.trim().toLowerCase()
  return q
    ? checkpoints.filter((c) =>
        (c.customLabel || c.name || '').toLowerCase().includes(q),
      )
    : checkpoints
})
</script>

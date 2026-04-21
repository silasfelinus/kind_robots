<!-- /components/content/prompts/pitch-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <select
        v-model="selectedType"
        class="select select-bordered select-xs bg-base-200 w-full sm:w-auto"
      >
        <option :value="null">All types</option>
        <option v-for="t in pitchStore.pitchTypes" :key="t" :value="t">
          {{ t }}
        </option>
      </select>

      <input
        v-model="query"
        type="search"
        placeholder="Search pitches…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>📣</span> No pitches found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="pitch in filtered"
        :key="pitch.id"
        class="picker-row"
        :class="{
          'picker-row--active': pitchStore.selectedPitch?.id === pitch.id,
        }"
        @click="pitchStore.setSelectedPitch(pitch.id)"
      >
        <span class="picker-icon">📣</span>

        <span class="picker-label">
          <span class="picker-name">{{ pitch.title || 'Untitled' }}</span>
          <span class="picker-sub">{{ pitch.PitchType }}</span>
        </span>

        <button
          class="btn btn-xs picker-action"
          :class="
            pitchStore.selectedPitch?.id === pitch.id
              ? 'btn-primary'
              : 'btn-ghost'
          "
          @click.stop="pitchStore.setSelectedPitch(pitch.id)"
        >
          {{ pitchStore.selectedPitch?.id === pitch.id ? 'Active' : 'Use' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePitchStore, type Pitch, PitchType } from '@/stores/pitchStore'

const pitchStore = usePitchStore()
const query = ref('')
const selectedType = ref<PitchType | null>(null)
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    await pitchStore.fetchPitches()
  } catch {
  } finally {
    isLoading.value = false
  }
})

const filtered = computed<Pitch[]>(() => {
  let list: Pitch[] = pitchStore.pitches

  if (selectedType.value) {
    list = list.filter((pitch: Pitch) => pitch.PitchType === selectedType.value)
  }

  const q = query.value.trim().toLowerCase()

  if (q) {
    list = list.filter((pitch: Pitch) =>
      (pitch.title || '').toLowerCase().includes(q),
    )
  }

  return list
})
</script>

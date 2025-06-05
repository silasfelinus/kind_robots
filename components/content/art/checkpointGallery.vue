<!-- /components/content/art/checkpointGallery.vue -->
<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">🎛️ Model & Sampler Config</h1>
      <div v-if="userStore.isAdmin" class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">Show Mature</span>
          <input
            type="checkbox"
            class="toggle toggle-accent"
            v-model="userStore.showMature"
          />
        </label>
      </div>
    </div>

    <!-- Checkpoint Select -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Checkpoint</span>
      </label>
      <select
        class="select select-bordered"
        v-model="selectedCheckpointName"
        @change="checkpointStore.selectCheckpointByName(selectedCheckpointName)"
      >
        <option disabled value="">Select a model...</option>
        <option
          v-for="c in checkpointStore.visibleCheckpoints"
          :key="c.name"
          :value="c.name"
        >
          {{ c.customLabel || c.name }}
          <span v-if="c.isMature">⚠️</span>
        </option>
      </select>
    </div>

    <!-- Sampler Select -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Sampler</span>
      </label>
      <select
        class="select select-bordered"
        v-model="selectedSamplerName"
        @change="checkpointStore.selectSamplerByName(selectedSamplerName)"
      >
        <option disabled value="">Select a sampler...</option>
        <option
          v-for="s in checkpointStore.allSamplers"
          :key="s.name"
          :value="s.name"
        >
          {{ s.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
const checkpointStore = useCheckpointStore()
const userStore = useUserStore()

const selectedCheckpointName = computed({
  get: () => checkpointStore.selectedCheckpoint?.name || '',
  set: (val) => checkpointStore.selectCheckpointByName(val),
})

const selectedSamplerName = computed({
  get: () => checkpointStore.selectedSampler?.name || '',
  set: (val) => checkpointStore.selectSamplerByName(val),
})
</script>

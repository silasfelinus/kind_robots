<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-primary">🎛️ Model & Sampler Config</h1>
      <div v-if="userStore.isAdmin" class="form-control">
        <label class="label cursor-pointer space-x-2">
          <span class="label-text">Show Mature</span>
          <input
            type="checkbox"
            class="toggle toggle-accent"
            v-model="showMature"
          />
        </label>
      </div>
    </div>

    <div
      class="border border-base-200 rounded-xl p-4 bg-base-100 flex justify-between items-center text-sm font-mono shadow-inner"
    >
      <div>
        <span>🧠 Active Backend Model:</span>
        <strong class="ml-1 text-primary">
          <Icon
            v-if="checkpointStore.modelUpdating"
            name="kind-icon:loading"
            class="inline w-4 h-4 animate-spin text-warning"
          />
          <span v-else>{{
            checkpointStore.currentApiModel || 'Loading...'
          }}</span>
        </strong>
        <span v-if="mismatchWarning" class="ml-2 text-warning font-semibold">
          (≠ selected)
        </span>
      </div>
      <button class="btn btn-xs btn-outline" @click="refreshModel">
        🔄 Refresh
      </button>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Checkpoint</span>
      </label>
      <select
        class="select select-bordered bg-base-200"
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
          <span v-if="c.name === checkpointStore.currentApiModel">
            (active)
          </span>
        </option>
      </select>

      <button
        v-if="
          selectedCheckpointName &&
          selectedCheckpointName !== checkpointStore.currentApiModel
        "
        class="btn btn-sm mt-3 bg-info text-white hover:bg-info/90"
        @click="setModel"
      >
        🔁 Set as Active Model
      </button>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold">Sampler</span>
      </label>
      <select
        class="select select-bordered bg-base-200"
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
import { computed, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'

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

const showMature = computed({
  get: () => userStore.user?.showMature ?? false,
  set: async (val: boolean) => {
    if (!userStore.user) return
    await userStore.updateUser({ showMature: val })
  },
})

const mismatchWarning = computed(
  () =>
    selectedCheckpointName.value &&
    checkpointStore.currentApiModel &&
    selectedCheckpointName.value !== checkpointStore.currentApiModel,
)

const refreshModel = async () => {
  await checkpointStore.fetchCurrentModelFromApi()
}

const setModel = async () => {
  if (!checkpointStore.selectedCheckpoint?.localPath) return
  checkpointStore.modelUpdating = true
  await checkpointStore.setCurrentModelInApi(
    checkpointStore.selectedCheckpoint.localPath,
  )
  await checkpointStore.fetchCurrentModelFromApi()
  checkpointStore.modelUpdating = false
}

onMounted(async () => {
  await checkpointStore.fetchCurrentModelFromApi()

  if (checkpointStore.currentApiModel) {
    checkpointStore.selectCheckpointByName(checkpointStore.currentApiModel)
  }

  if (!checkpointStore.selectedSampler) {
    checkpointStore.selectSamplerByName('Euler a')
  }
})
</script>

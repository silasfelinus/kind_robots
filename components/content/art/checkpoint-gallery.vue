<!-- /components/content/checkpoints/model-config.vue -->
<template>
  <div class="p-6 max-w-2xl mx-auto space-y-6">
    <div class="flex justify-between items-center">
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
      class="border border-base-200 rounded-xl p-4 bg-base-100 flex flex-col space-y-2 text-sm font-mono shadow-inner"
    >
      <div class="flex justify-between items-center">
        <div>
          <span>🧠 Active Backend Model:</span>
          <strong class="ml-1 text-primary">
            <Icon
              v-if="checkpointStore.modelUpdating"
              name="kind-icon:loading"
              class="inline w-4 h-4 animate-spin text-warning"
            />
            <span v-else>
              {{ checkpointStore.currentApiModel || 'Loading...' }}
            </span>
          </strong>
          <span
            v-if="mismatchWarning"
            class="ml-2 text-warning font-semibold"
          >
            (≠ selected)
          </span>
        </div>
        <button class="btn btn-xs btn-outline" @click="refreshModel">
          🔄 Refresh
        </button>
      </div>
      <div
        v-if="errorStore.getError"
        class="text-warning font-semibold bg-warning/10 p-2 rounded-xl"
      >
        ⚠️ {{ errorStore.getError }}
      </div>
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
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const checkpointStore = useCheckpointStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

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
  try {
    await checkpointStore.fetchCurrentModelFromApi()
    errorStore.clearError()
  } catch (err) {
    errorStore.setError(ErrorType.NETWORK_ERROR, err)
  }
}

const setModel = async () => {
  const modelPath = checkpointStore.selectedCheckpoint?.localPath
  if (!modelPath) {
    errorStore.setError(
      ErrorType.VALIDATION_ERROR,
      'Checkpoint has no localPath.',
    )
    return
  }

  checkpointStore.modelUpdating = true
  try {
    await checkpointStore.setCurrentModelInApi(modelPath)
    await checkpointStore.fetchCurrentModelFromApi()
    errorStore.clearError()
  } catch (err) {
    errorStore.setError(ErrorType.GENERAL_ERROR, err)
  } finally {
    checkpointStore.modelUpdating = false
  }
}

onMounted(async () => {
  try {
    await checkpointStore.fetchCurrentModelFromApi()

    if (checkpointStore.currentApiModel) {
      checkpointStore.selectCheckpointByName(checkpointStore.currentApiModel)
    }

    if (!checkpointStore.selectedSampler) {
      checkpointStore.selectSamplerByName('Euler a')
    }

    errorStore.clearError()
  } catch (err) {
    errorStore.setError(ErrorType.NETWORK_ERROR, err)
  }
})
</script>
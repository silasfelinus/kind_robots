<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <div
    class="px-4 sm:px-6 md:px-8 max-w-4xl mx-auto space-y-6 md:space-y-8 xl:space-y-10"
  >
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

    <!-- Active Model Display -->
    <div
      class="border border-base-200 rounded-2xl p-3 sm:p-4 md:p-6 bg-base-100 shadow-inner"
    >
      <div
        class="flex justify-between items-center text-sm sm:text-base font-mono"
      >
        <div>
          <span>🧠 Active Backend Model:</span>
          <strong class="ml-1 text-primary">
            <Icon
              v-if="checkpointStore.modelUpdating"
              name="kind-icon:loading"
              class="inline w-4 h-4 animate-spin text-warning"
            />
            <span v-else>
              {{
                !showMature && checkpointStore.selectedCheckpoint?.isMature
                  ? 'Hidden Model'
                  : checkpointStore.currentApiModel || 'Loading...'
              }}
            </span>
          </strong>
          <span v-if="mismatchWarning" class="ml-2 text-warning font-semibold"
            >(≠ selected)</span
          >
        </div>
        <button class="btn btn-xs btn-outline" @click="refreshModel">
          🔄 Refresh
        </button>
      </div>

      <div
        v-if="errorStore.getError"
        class="text-warning font-semibold bg-warning/10 p-2 rounded-xl mt-2"
      >
        ⚠️ {{ errorStore.getError }}
      </div>
    </div>

    <!-- Checkpoint Selection Grid -->
    <div class="form-control">
      <label class="label mb-2">
        <span class="label-text font-semibold">Checkpoint</span>
      </label>
      <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <div
          v-for="c in checkpointStore.visibleCheckpoints"
          :key="c.name"
          @click="
            typeof c.name === 'string' &&
            checkpointStore.selectCheckpointByName(c.name)
          "
          :class="[
            'p-4 rounded-2xl border text-center cursor-pointer transition',
            selectedCheckpointName === c.name
              ? 'bg-primary text-white border-primary'
              : 'bg-base-200 hover:bg-base-300 border-base-300',
          ]"
        >
          <div class="font-bold truncate">
            {{ showMature || !c.isMature ? c.customLabel || c.name : 'Hidden' }}
          </div>
          <div class="text-xs opacity-60">
            {{ c.name === checkpointStore.currentApiModel ? '✅ Active' : '' }}
          </div>
          <div v-if="c.isMature && !showMature" class="text-warning text-xs">
            Mature
          </div>
        </div>
      </div>

      <button
        v-if="
          selectedCheckpointName &&
          selectedCheckpointName !== checkpointStore.currentApiModel
        "
        class="btn btn-sm mt-4 bg-info text-white hover:bg-info/90"
        @click="setModel"
      >
        🔁 Set as Active Model
      </button>
    </div>

    <!-- Sampler Dropdown -->
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
// /components/content/art/checkpoint-gallery.vue
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

    const currentName = checkpointStore.currentApiModel

    const found = currentName
      ? checkpointStore.findCheckpointByName(currentName)
      : null

    if (found && (!found.isMature || showMature.value)) {
      checkpointStore.selectCheckpointByName(found.name!)
    } else {
      const fallback = checkpointStore.visibleCheckpoints[0]
      if (fallback?.name) {
        checkpointStore.selectCheckpointByName(fallback.name)
      }
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

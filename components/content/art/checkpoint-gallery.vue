<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <div
    class="px-4 sm:px-6 md:px-8 max-w-4xl mx-auto space-y-6 md:space-y-8 xl:space-y-10"
  >
    <!-- Admin Toggle -->
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
      class="border border-base-200 rounded-2xl p-3 sm:p-4 md:p-6 bg-base-100 shadow-inner space-y-2"
    >
      <div class="text-sm sm:text-base font-mono break-words">
        <span>🧠 Active Backend Model:</span>
        <div class="mt-1 text-primary">
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
          <span v-if="mismatchWarning" class="ml-2 text-warning font-semibold">
            (≠ selected)
          </span>
        </div>
      </div>

      <div class="flex justify-center">
        <button class="btn btn-xs btn-outline mt-1" @click="refreshModel">
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

    <!-- Toggleable Info Panel Button -->
    <div
      v-if="displayedCheckpoints.length === 1"
      class="mt-6 p-4 rounded-2xl bg-primary text-white cursor-pointer border border-primary shadow-md space-y-4 flex flex-col sm:flex-row items-start sm:items-center"
      @click="isExpanded = true"
    >
      <div class="w-full sm:w-auto sm:flex-shrink-0">
    <art-card
  v-if="selectedCheckpointName && checkpointImages[selectedCheckpointName]"
  :art="checkpointImages[selectedCheckpointName]!"
  class="w-40 h-40"
/>


        <img
          v-else-if="displayedCheckpoints[0].MediaPath"
          :src="displayedCheckpoints[0].MediaPath"
          alt="Checkpoint Image"
          class="rounded-xl object-cover h-40 w-40"
        />

        <img
          v-else
          src="/images/backtree.webp"
          alt="Fallback"
          class="rounded-xl object-cover h-40 w-40 opacity-50"
        />
      </div>

      <div class="sm:ml-6 space-y-1">
        <div class="text-lg font-bold">
          {{
            displayedCheckpoints[0].customLabel || displayedCheckpoints[0].name
          }}
        </div>
        <div class="text-sm">
          <span class="font-semibold">Generation:</span>
          {{ displayedCheckpoints[0].generation || '—' }}
        </div>
        <div class="text-sm">
          <span class="font-semibold">Path:</span>
          {{ displayedCheckpoints[0].localPath || '—' }}
        </div>
        <div class="text-sm">
          <span class="font-semibold">Description:</span>
          {{
            displayedCheckpoints[0].description || 'No description available.'
          }}
        </div>
        <div
          v-if="displayedCheckpoints[0].isMature"
          class="text-xs font-semibold text-warning mt-1"
        >
          ⚠️ This model is marked as mature.
        </div>
        <button
          v-if="
            selectedCheckpointName &&
            selectedCheckpointName !== checkpointStore.currentApiModel
          "
          class="btn btn-sm mt-4 bg-info text-white hover:bg-info/90"
          @click.stop="setModel"
        >
          🔁 Set as Active Model
        </button>
      </div>
    </div>

    <!-- Checkpoint Selection Grid -->
    <div class="form-control" v-if="isExpanded">
      <label class="label mb-2">
        <span class="label-text font-semibold">Checkpoint</span>
      </label>
      <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="c in checkpointStore.visibleCheckpoints"
          :key="c.name"
          @click="handleCheckpointClick(c.name!)"
          :class="[
            'p-4 rounded-2xl min-h-[5rem] flex flex-col justify-center items-center border cursor-pointer text-center space-y-1 transition',
            selectedCheckpointName === c.name
              ? 'bg-primary text-white border-primary shadow-md'
              : 'hover:scale-105 hover:shadow-lg transition-transform duration-150 bg-base-100 border-base-300',
          ]"
        >
          <div class="mt-2 w-full">
           <art-card
  v-if="c.name && checkpointImages[c.name]"
  :art="checkpointImages[c.name]!"
  class="w-full h-36"
/>


            <img
              v-else-if="c.MediaPath"
              :src="c.MediaPath"
              alt="Checkpoint Image"
              class="rounded-xl object-cover h-36 w-full"
            />

            <img
              v-else
              src="/images/backtree.webp"
              alt="Fallback"
              class="rounded-xl object-cover h-36 w-full opacity-50"
            />
          </div>

          <div class="font-bold leading-snug">
            {{ showMature || !c.isMature ? c.customLabel || c.name : 'Hidden' }}
          </div>
          <div class="text-xs opacity-70">
            {{ c.name === checkpointStore.currentApiModel ? '✅ Active' : '' }}
          </div>
          <div v-if="c.isMature && !showMature" class="text-warning text-xs">
            Mature
          </div>
        </div>
      </div>
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
import { computed, ref, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useArtStore } from '@/stores/artStore'
const artStore = useArtStore()
const checkpointImages = ref<Record<string, Art | null>>({})

const checkpointStore = useCheckpointStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

const isExpanded = ref(false)

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

const displayedCheckpoints = computed(() => {
  if (!isExpanded.value && checkpointStore.selectedCheckpoint?.name) {
    const match = checkpointStore.findCheckpointByName(
      checkpointStore.selectedCheckpoint.name,
    )
    return match ? [match] : []
  }
  return checkpointStore.visibleCheckpoints
})

function handleCheckpointClick(name: string) {
  if (!isExpanded.value) {
    // Clicking while collapsed should expand to show all
    isExpanded.value = true
  } else if (selectedCheckpointName.value === name) {
    // Clicking the same selected checkpoint should collapse again
    isExpanded.value = false
  } else {
    // Clicking a different checkpoint selects it
    checkpointStore.selectCheckpointByName(name)
  }
}

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

    const userId = userStore.user?.id ?? 10
    const allArt = artStore.art

    for (const checkpoint of checkpointStore.visibleCheckpoints) {
      const localPath = checkpoint.localPath
      if (!localPath) continue

      const matchingArt = allArt
        .filter(
          (a) =>
            a.checkpoint === localPath && (a.isPublic || a.userId === userId),
        )
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
          const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
          return bTime - aTime // newest first
        })

      console.log('checkpointImages', checkpointImages.value)

      if (checkpoint.name) {
        checkpointImages.value[checkpoint.name] = matchingArt[0] ?? null
      }
    }

    errorStore.clearError()
  } catch (err) {
    errorStore.setError(ErrorType.NETWORK_ERROR, err)
  }
})
</script>

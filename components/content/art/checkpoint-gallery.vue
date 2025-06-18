<!-- /components/content/art/checkpoint-gallery.vue -->
<template>
  <div
    class="w-full max-w-full px-4 sm:px-6 md:px-8 space-y-6 md:space-y-8 xl:space-y-10 overflow-x-hidden"
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

    <!-- Compact Checkpoint Display -->
    <div
      v-if="!isExpanded && displayedCheckpoints.length === 1"
      class="mt-6 p-3 rounded-xl bg-base-100 hover:bg-base-200 transition cursor-pointer border border-base-300 shadow-sm flex gap-4 items-center"
      @click="isExpanded = true"
    >
      <img
        v-if="displayedCheckpoints[0].MediaPath"
        :src="`${displayedCheckpoints[0].MediaPath}?t=${cacheBuster}`"
        class="h-50 w-50 object-cover rounded-xl"
        alt="Checkpoint Image"
      />
      <div class="flex flex-col truncate">
        <div class="text-sm font-bold truncate">
          {{
            displayedCheckpoints[0].customLabel || displayedCheckpoints[0].name
          }}
        </div>
        <div class="text-xs text-base-content/60 truncate">
          {{ displayedCheckpoints[0].description || 'No description' }}
        </div>
      </div>
      <Icon
        name="kind-icon:chevron-down"
        class="ml-auto h-5 w-5 text-base-content/50"
      />
    </div>

    <!-- Selection Grid -->
    <div class="form-control" v-if="isExpanded">
      <label class="label mb-2">
        <span class="label-text font-semibold">Checkpoint</span>
      </label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
        <div
          v-for="c in checkpointStore.visibleCheckpoints"
          :key="c.name"
          @click="handleCheckpointClick(c.name!)"
          :class="[
            'p-3 rounded-2xl border cursor-pointer text-center space-y-2 transition-all w-full max-w-full overflow-hidden',
            selectedCheckpointName === c.name
              ? 'bg-primary text-white border-primary shadow-md'
              : 'hover:scale-[1.02] hover:shadow-lg bg-base-100 border-base-300',
          ]"
        >
          <div class="w-full">
            <art-card
              v-if="c.name && checkpointImages[c.name]"
              :art="checkpointImages[c.name]!"
              class="w-full h-40"
            />
            <img
              v-else-if="c.MediaPath"
              :src="`${c.MediaPath}?t=${cacheBuster}`"
              alt="Checkpoint Image"
              class="rounded-xl object-cover w-full h-40"
            />
            <img
              v-else
              src="/images/backtree.webp"
              alt="Fallback"
              class="rounded-xl object-cover w-full h-40 opacity-50"
            />
          </div>
          <div class="w-full space-y-1">
            <div class="font-bold text-sm break-words leading-tight">
              {{
                showMature || !c.isMature ? c.customLabel || c.name : 'Hidden'
              }}
            </div>
            <div class="text-xs text-base-content/70">
              {{
                c.name === checkpointStore.currentApiModel ? '✅ Active' : ''
              }}
            </div>
            <div
              v-if="c.isMature && !showMature"
              class="text-warning text-xs font-semibold"
            >
              Mature
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sampler Dropdown -->
    <div class="form-control w-full">
      <label class="label"
        ><span class="label-text font-semibold">Sampler</span></label
      >
      <select
        class="select select-bordered bg-base-200 w-full"
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

    <!-- Active Model Info (Compact) -->
    <div
      class="mt-8 border-t border-base-300 pt-4 text-xs text-base-content/70 space-y-1"
    >
      <div>
        🧠 <span class="font-semibold">Active Model:</span>
        <span class="text-primary font-mono">
          <Icon
            v-if="checkpointStore.modelUpdating"
            name="kind-icon:loading"
            class="inline w-3 h-3 animate-spin text-warning"
          />
          <span v-else>
            {{
              !showMature && checkpointStore.selectedCheckpoint?.isMature
                ? 'Hidden Model'
                : checkpointStore.currentApiModel || 'Loading...'
            }}
          </span>
          <span v-if="mismatchWarning" class="ml-1 text-warning font-semibold"
            >(≠ selected)</span
          >
        </span>
      </div>
      <div
        v-if="errorStore.getError"
        class="text-warning bg-warning/10 p-2 rounded-xl"
      >
        ⚠️ {{ errorStore.getError }}
      </div>
      <div class="text-center">
        <button class="btn btn-xs btn-outline mt-1" @click="refreshModel">
          🔄 Refresh
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useArtStore } from '@/stores/artStore'

const checkpointStore = useCheckpointStore()
const userStore = useUserStore()
const errorStore = useErrorStore()
const artStore = useArtStore()

const checkpointImages = ref<Record<string, Art | null>>({})
const isExpanded = ref(false)
const cacheBuster = ref(Date.now())

function updateCacheBuster() {
  cacheBuster.value = Date.now()
}

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
    isExpanded.value = true
  } else if (selectedCheckpointName.value === name) {
    isExpanded.value = false
  } else {
    checkpointStore.selectCheckpointByName(name)
    updateCacheBuster()
    isExpanded.value = false
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

onMounted(async () => {
  try {
    await checkpointStore.fetchCurrentModelFromApi()

    const currentName = checkpointStore.currentApiModel
    const found = currentName
      ? checkpointStore.findCheckpointByName(currentName)
      : null

    if (found && (!found.isMature || showMature.value)) {
      checkpointStore.selectCheckpointByName(found.name!)
      updateCacheBuster()
    } else {
      const fallback = checkpointStore.visibleCheckpoints[0]
      if (fallback?.name) {
        checkpointStore.selectCheckpointByName(fallback.name)
        updateCacheBuster()
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
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
            new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
        )

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

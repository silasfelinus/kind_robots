<!-- /components/content/art/server-model-status.vue -->
<template>
  <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-black text-base-content">
            Server Model Check
          </h2>

          <p class="text-sm text-base-content/60">
            Compares app selection, live server state, and last generation
            result.
          </p>
        </div>

        <button
          class="btn btn-sm rounded-xl"
          :class="statusButtonClass"
          type="button"
          :disabled="checkpointStore.modelStatusLoading"
          @click="checkModel"
        >
          <span
            v-if="checkpointStore.modelStatusLoading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Check
        </button>
      </div>

      <div class="rounded-2xl border p-3 text-sm" :class="statusPanelClass">
        <div class="flex items-center gap-2">
          <Icon :name="statusIcon" class="h-5 w-5" />

          <p class="font-bold">
            {{ currentReport?.message || 'No model check has run yet.' }}
          </p>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Server</p>
            <p class="mt-1 font-mono">{{ serverLabel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Engine</p>
            <p class="mt-1 font-mono">
              {{ currentReport?.engine || engineLabel }}
            </p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Selected In App
            </p>
            <p class="mt-1 break-all font-mono">{{ selectedCheckpoint }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Live Server Model
            </p>
            <p class="mt-1 break-all font-mono">{{ liveModel }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">
              Last Requested
            </p>
            <p class="mt-1 break-all font-mono">{{ lastRequested }}</p>
          </div>

          <div class="rounded-xl bg-base-200 p-2">
            <p class="font-bold uppercase text-base-content/45">Last Actual</p>
            <p class="mt-1 break-all font-mono">{{ lastActual }}</p>
          </div>
        </div>

        <div
          v-if="checkpointStore.modelStatusError"
          class="mt-3 rounded-xl bg-error/10 p-2 text-xs font-semibold text-error"
        >
          {{ checkpointStore.modelStatusError }}
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useServerStore } from '@/stores/serverStore'

const checkpointStore = useCheckpointStore()
const serverStore = useServerStore()

const currentReport = computed(() => {
  return checkpointStore.lastGenerationStatus || checkpointStore.modelStatus
})

const serverLabel = computed(() => {
  return (
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'No server selected'
  )
})

const engineLabel = computed(() => {
  return (
    serverStore.activeArtServer?.generationEngine ||
    serverStore.activeArtServer?.serverType ||
    'UNKNOWN'
  )
})

const selectedCheckpoint = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.name ||
    checkpointStore.selectedCheckpoint?.customLabel ||
    'No checkpoint selected'
  )
})

const liveModel = computed(() => {
  return checkpointStore.modelStatus?.activeModel || 'Not checked'
})

const lastRequested = computed(() => {
  return (
    checkpointStore.lastGenerationStatus?.requestedCheckpoint ||
    'No generation yet'
  )
})

const lastActual = computed(() => {
  return (
    checkpointStore.lastGenerationStatus?.actualGenerationModel ||
    'No generation yet'
  )
})

const statusButtonClass = computed(() => {
  const tone = currentReport.value?.tone

  if (tone === 'safe') return 'btn-success'
  if (tone === 'warning') return 'btn-warning'
  if (tone === 'error') return 'btn-error'
  return 'btn-outline'
})

const statusPanelClass = computed(() => {
  const tone = currentReport.value?.tone

  if (tone === 'safe') return 'border-success/40 bg-success/10 text-success'
  if (tone === 'warning') return 'border-warning/40 bg-warning/10 text-warning'
  if (tone === 'error') return 'border-error/40 bg-error/10 text-error'
  return 'border-base-300 bg-base-200 text-base-content/70'
})

const statusIcon = computed(() => {
  const tone = currentReport.value?.tone

  if (tone === 'safe') return 'kind-icon:check'
  if (tone === 'warning') return 'kind-icon:warning'
  if (tone === 'error') return 'kind-icon:close'
  return 'kind-icon:server'
})

async function checkModel() {
  await checkpointStore.checkActiveModel()
}

onMounted(async () => {
  await checkModel()
})
</script>

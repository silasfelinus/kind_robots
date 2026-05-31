<!-- /components/content/art/server-model-status.vue -->
<template>
  <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <Icon :name="statusIcon" class="h-5 w-5 shrink-0" />
            <h2 class="text-lg font-black text-base-content">
              Server Status
            </h2>
          </div>

          <p class="mt-1 text-sm text-base-content/60">
            {{ summary }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="btn btn-sm rounded-xl" type="button" :disabled="!activeServer" @click="refreshHealth">
            Health
          </button>
          <button class="btn btn-sm rounded-xl" type="button" :disabled="!activeServer" @click="refreshModelStatus">
            Model
          </button>
          <button
            v-if="isA1111"
            class="btn btn-sm btn-primary rounded-xl"
            type="button"
            :disabled="!activeServer"
            @click="fetchModelOptions"
          >
            Fetch A1111 Models
          </button>
        </div>
      </div>

      <div v-if="activeServer" class="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl bg-base-200 p-3">
          <p class="text-xs font-black uppercase text-base-content/50">Type</p>
          <p class="font-bold">{{ activeServer.serverType }}</p>
        </div>

        <div class="rounded-xl bg-base-200 p-3">
          <p class="text-xs font-black uppercase text-base-content/50">Access</p>
          <p class="font-bold">{{ activeServer.accessMode }}</p>
        </div>

        <div class="rounded-xl bg-base-200 p-3">
          <p class="text-xs font-black uppercase text-base-content/50">Health</p>
          <p class="font-bold">{{ activeServer.lastStatus || 'UNKNOWN' }}</p>
        </div>

        <div class="rounded-xl bg-base-200 p-3">
          <p class="text-xs font-black uppercase text-base-content/50">Model</p>
          <p class="truncate font-bold">{{ checkpointStore.currentApiModel || activeServer.model || 'n/a' }}</p>
        </div>
      </div>

      <div v-else class="rounded-xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/60">
        No active server selected.
      </div>

      <p v-if="checkpointStore.modelStatusError" class="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
        {{ checkpointStore.modelStatusError }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useServerStore } from '@/stores/serverStore'

const checkpointStore = useCheckpointStore()
const serverStore = useServerStore()

const props = withDefaults(
  defineProps<{
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    compact: false,
    autoLoad: false,
  },
)

const activeServer = computed(() => {
  return serverStore.currentServer || serverStore.activeArtServer
})

const isA1111 = computed(() => activeServer.value?.serverType === 'A1111')

const statusIcon = computed(() => {
  if (!activeServer.value) return 'kind-icon:server-off'
  if (activeServer.value.lastStatus === 'ONLINE') return 'kind-icon:check-circle'
  if (activeServer.value.lastStatus === 'OFFLINE') return 'kind-icon:x-circle'
  return 'kind-icon:activity'
})

const summary = computed(() => {
  if (!activeServer.value) return 'Choose a server to inspect runtime status.'
  return `${activeServer.value.label || activeServer.value.title} · ${activeServer.value.serverType}`
})

async function refreshHealth() {
  if (!activeServer.value?.id) return
  await serverStore.testServerHealth(activeServer.value.id)
}

async function refreshModelStatus() {
  await checkpointStore.checkActiveModel()
}

async function fetchModelOptions() {
  if (!activeServer.value || activeServer.value.serverType !== 'A1111') return
  await serverStore.fetchA1111Models(activeServer.value)
}

onMounted(async () => {
  if (props.autoLoad) {
    await refreshHealth()
    await refreshModelStatus()
  }
})
</script>

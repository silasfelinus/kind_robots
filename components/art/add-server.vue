<template>
  <div
    class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 max-w-6xl space-y-6"
  >
    <h1 class="text-4xl text-center font-bold">Create or Edit a Server</h1>

    <div class="flex flex-wrap justify-between items-center gap-4">
      <server-selector
        v-model="selectedServerId"
        label="Load Existing Server"
        placeholder="Select a saved server"
      />

      <div v-if="serverStore.selectedServer" class="flex items-center gap-2">
        <button
          class="btn btn-outline rounded-2xl"
          @click="deselectCurrentServer"
        >
          <icon name="kind-icon:close" class="text-xl" />
          New Server
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <label class="form-control">
        <span class="label-text">Title</span>
        <input
          v-model="serverStore.serverForm.title"
          class="input input-bordered rounded-2xl"
          type="text"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Label</span>
        <input
          v-model="serverStore.serverForm.label"
          class="input input-bordered rounded-2xl"
          type="text"
        />
      </label>

      <label class="form-control lg:col-span-2">
        <span class="label-text">Description</span>
        <textarea
          v-model="serverStore.serverForm.description"
          class="textarea textarea-bordered rounded-2xl"
          rows="3"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Server Type</span>
        <select
          v-model="localServerType"
          class="select select-bordered rounded-2xl"
        >
          <option value="ART">ART</option>
          <option value="TEXT">TEXT</option>
          <option value="COMFY">COMFY</option>
          <option value="A1111">A1111</option>
          <option value="OPENAI_COMPATIBLE">OPENAI_COMPATIBLE</option>
          <option value="OTHER">OTHER</option>
        </select>
      </label>

      <label class="form-control">
        <span class="label-text">Category</span>
        <input
          v-model="serverStore.serverForm.category"
          class="input input-bordered rounded-2xl"
          type="text"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Base URL</span>
        <input
          v-model="serverStore.serverForm.baseUrl"
          class="input input-bordered rounded-2xl"
          type="text"
          placeholder="https://example.com"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Endpoint Path</span>
        <input
          v-model="serverStore.serverForm.endpointPath"
          class="input input-bordered rounded-2xl"
          type="text"
          placeholder="/sdapi/v1/txt2img"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Health Path</span>
        <input
          v-model="serverStore.serverForm.healthPath"
          class="input input-bordered rounded-2xl"
          type="text"
          placeholder="/health"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Designer</span>
        <input
          v-model="serverStore.serverForm.designer"
          class="input input-bordered rounded-2xl"
          type="text"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Version</span>
        <input
          v-model="serverStore.serverForm.version"
          class="input input-bordered rounded-2xl"
          type="text"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Sort Order</span>
        <input
          v-model.number="serverStore.serverForm.sortOrder"
          class="input input-bordered rounded-2xl"
          type="number"
        />
      </label>

      <label class="form-control lg:col-span-2">
        <span class="label-text">Notes</span>
        <textarea
          v-model="serverStore.serverForm.notes"
          class="textarea textarea-bordered rounded-2xl"
          rows="3"
        />
      </label>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.isActive"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Active</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.isPublic"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Public</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.requiresApiKey"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Requires API Key</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsTxt2Img"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Supports Txt2Img</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsImg2Img"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Supports Img2Img</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsChat"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Supports Chat</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsComfyWorkflow"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Supports Comfy</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsCheckpointOverride"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Checkpoint Override</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsSampler"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Supports Sampler</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsNegativePrompt"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Negative Prompt</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsSeed"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Seed</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsSteps"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Steps</span>
      </label>
    </div>

    <div class="flex flex-wrap gap-3">
      <button
        class="btn btn-primary rounded-2xl"
        :disabled="isLoading"
        @click="handleSubmit"
      >
        {{ serverStore.serverForm.id ? 'Update Server' : 'Create Server' }}
      </button>

      <button
        v-if="serverStore.serverForm.id"
        class="btn btn-outline rounded-2xl"
        :disabled="serverStore.testingHealth"
        @click="handleHealthCheck"
      >
        Test Server
      </button>
    </div>

    <div v-if="healthSummary" class="rounded-2xl border p-4 bg-base-100">
      <div class="font-semibold mb-1">Health Check</div>
      <div>{{ healthSummary }}</div>
    </div>

    <div v-if="errorMessage" class="text-error">{{ errorMessage }}</div>
    <div v-if="successMessage" class="text-success">{{ successMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()

const isLoading = ref(false)
const errorMessage = ref<string>('')
const successMessage = ref<string>('')
const selectedServerId = ref<number | null>(null)
const localServerType = ref<ServerType>('ART')
const healthSummary = ref<string>('')

onMounted(async () => {
  await serverStore.initialize()
  if (!serverStore.serverForm.serverType) {
    serverStore.createNewServer('ART')
  }
  localServerType.value = (serverStore.serverForm.serverType ||
    'ART') as ServerType
})

watch(selectedServerId, (value: number | null) => {
  if (typeof value === 'number') {
    serverStore.selectServer(value)
    localServerType.value = (serverStore.serverForm.serverType ||
      'ART') as ServerType
  }
})

watch(localServerType, (value: ServerType) => {
  if (!serverStore.serverForm.id) {
    serverStore.createNewServer(value)
  } else {
    serverStore.serverForm.serverType = value
  }
})

const selectedHealthResult = computed(() => {
  const id = serverStore.serverForm.id
  if (!id) return null
  return serverStore.healthResults[id] || null
})

watch(selectedHealthResult, (value) => {
  if (!value) {
    healthSummary.value = ''
    return
  }

  healthSummary.value = value.ok
    ? `Online · ${value.status} ${value.statusText} · ${value.latencyMs}ms`
    : `Offline or failed · ${value.status} ${value.statusText} · ${value.latencyMs}ms`
})

function deselectCurrentServer() {
  selectedServerId.value = null
  localServerType.value = 'ART'
  serverStore.deselectServer()
  serverStore.createNewServer('ART')
  errorMessage.value = ''
  successMessage.value = ''
  healthSummary.value = ''
}

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await serverStore.saveServer()

    if (result.success) {
      successMessage.value = serverStore.serverForm.id
        ? 'Server updated successfully!'
        : 'Server created successfully!'

      if (result.data?.id) {
        selectedServerId.value = result.data.id
        serverStore.selectServer(result.data.id)
      }
    } else {
      errorMessage.value = result.message || 'Failed to save server.'
    }
  } catch (error) {
    errorMessage.value = (error as Error).message
  } finally {
    isLoading.value = false
  }
}

async function handleHealthCheck() {
  const id = serverStore.serverForm.id
  if (!id) return

  errorMessage.value = ''
  successMessage.value = ''

  const result = await serverStore.testServerHealth(id)
  if (!result.success) {
    errorMessage.value = result.message || 'Failed to test server.'
  }
}
</script>

<!-- /components/art/add-server.vue -->
<template>
  <div
    class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 max-w-6xl space-y-6"
  >
    <h1 class="text-4xl text-center font-bold">Create a Server</h1>

    <div class="flex justify-center">
      <button
        class="btn btn-outline rounded-2xl"
        :disabled="serverStore.isSaving"
        @click="resetForm"
      >
        <icon name="kind-icon:refresh" class="text-xl" />
        Reset Form
      </button>
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
        :disabled="serverStore.isSaving"
        @click="handleSubmit"
      >
        Create Server
      </button>
    </div>

    <div v-if="successMessage" class="text-success">{{ successMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { ServerType } from '~/prisma/generated/prisma/client'

const serverStore = useServerStore()

const successMessage = ref('')
const localServerType = ref<ServerType>('ART')

onMounted(async () => {
  await serverStore.initialize()
  resetForm()
})

watch(localServerType, (value: ServerType) => {
  serverStore.createNewServer(value)
})

function resetForm(): void {
  serverStore.deselectServer()
  serverStore.createNewServer(localServerType.value)
  successMessage.value = ''
}

async function handleSubmit(): Promise<void> {
  const result = await serverStore.addServer(serverStore.serverForm)

  if (result.success) {
    successMessage.value = 'Server created successfully!'
    resetForm()
  }
}
</script>

<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-3xl shadow-xl border border-base-content/10"
  >
    <h2 class="text-2xl font-bold mb-4 text-center">Edit Server</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="form-control">
        <span class="label-text">Title</span>
        <input
          v-model="serverStore.serverForm.title"
          class="input input-bordered rounded-2xl"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Label</span>
        <input
          v-model="serverStore.serverForm.label"
          class="input input-bordered rounded-2xl"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Server Type</span>
        <select
          v-model="serverStore.serverForm.serverType"
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
        />
      </label>

      <label class="form-control md:col-span-2">
        <span class="label-text">Description</span>
        <textarea
          v-model="serverStore.serverForm.description"
          class="textarea textarea-bordered rounded-2xl"
          rows="3"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Base URL</span>
        <input
          v-model="serverStore.serverForm.baseUrl"
          class="input input-bordered rounded-2xl"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Endpoint Path</span>
        <input
          v-model="serverStore.serverForm.endpointPath"
          class="input input-bordered rounded-2xl"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Health Path</span>
        <input
          v-model="serverStore.serverForm.healthPath"
          class="input input-bordered rounded-2xl"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Designer</span>
        <input
          v-model="serverStore.serverForm.designer"
          class="input input-bordered rounded-2xl"
        />
      </label>
    </div>

    <div class="grid grid-cols-2 gap-3 mt-4">
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
          v-model="serverStore.serverForm.supportsTxt2Img"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Txt2Img</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border p-3"
      >
        <input
          v-model="serverStore.serverForm.supportsChat"
          type="checkbox"
          class="checkbox"
        />
        <span class="label-text">Chat</span>
      </label>
    </div>

    <div class="flex justify-end mt-6 gap-2">
      <button
        class="btn btn-outline btn-sm rounded-2xl"
        @click="$emit('close')"
      >
        Cancel
      </button>
      <button class="btn btn-primary btn-sm rounded-2xl" @click="handleSave">
        Save
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from '@/stores/serverStore'

const serverStore = useServerStore()

const emit = defineEmits<{
  (e: 'close'): void
}>()

async function handleSave() {
  const result = await serverStore.saveServer()
  if (result.success) {
    emit('close')
  }
}
</script>

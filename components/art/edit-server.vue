<!-- /components/forms/edit-server.vue -->
<template>
  <div
    class="bg-base-100 rounded-2xl p-6 w-full max-w-4xl shadow-xl border border-base-content/10"
  >
    <div class="flex flex-col gap-2 mb-6">
      <h2 class="text-2xl font-bold text-center">Edit Server</h2>
      <p class="text-sm text-base-content/70 text-center">
        Admins can edit any server. Owners can edit their own server.
      </p>
      <div v-if="!canEdit" class="alert alert-warning rounded-2xl text-sm">
        <icon name="kind-icon:warning" class="text-lg" />
        <span>You do not have permission to edit this server.</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="form-control">
        <span class="label-text">Title</span>
        <input
          v-model="serverStore.serverForm.title"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Label</span>
        <input
          v-model="serverStore.serverForm.label"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Server Type</span>
        <select
          v-model="serverStore.serverForm.serverType"
          class="select select-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
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
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control md:col-span-2">
        <span class="label-text">Description</span>
        <textarea
          v-model="serverStore.serverForm.description"
          class="textarea textarea-bordered rounded-2xl"
          rows="3"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Base URL</span>
        <input
          v-model="serverStore.serverForm.baseUrl"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Endpoint Path</span>
        <input
          v-model="serverStore.serverForm.endpointPath"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Health Path</span>
        <input
          v-model="serverStore.serverForm.healthPath"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">Designer</span>
        <input
          v-model="serverStore.serverForm.designer"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control">
        <span class="label-text">User ID</span>
        <input
          :value="serverStore.serverForm.userId ?? ''"
          class="input input-bordered rounded-2xl"
          disabled
        />
      </label>

      <label class="form-control">
        <span class="label-text">Version</span>
        <input
          v-model="serverStore.serverForm.version"
          class="input input-bordered rounded-2xl"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>

      <label class="form-control md:col-span-2">
        <span class="label-text">Notes</span>
        <textarea
          v-model="serverStore.serverForm.notes"
          class="textarea textarea-bordered rounded-2xl"
          rows="3"
          :disabled="!canEdit || serverStore.isSaving"
        />
      </label>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.isActive"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Active</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.isPublic"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Public</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.isOfficial"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Official</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.isDefault"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Default</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.requiresApiKey"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Requires API Key</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsTxt2Img"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Txt2Img</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsImg2Img"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Img2Img</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsChat"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Chat</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsComfyWorkflow"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Comfy Workflow</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsCheckpointOverride"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Checkpoint Override</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsNegativePrompt"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Negative Prompt</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsSeed"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Seed</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsSteps"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Steps</span>
      </label>

      <label
        class="label cursor-pointer justify-start gap-3 rounded-2xl border border-base-content/10 p-3"
        :class="{ 'opacity-50': !canEdit }"
      >
        <input
          v-model="serverStore.serverForm.supportsSampler"
          type="checkbox"
          class="checkbox"
          :disabled="!canEdit || serverStore.isSaving"
        />
        <span class="label-text">Sampler</span>
      </label>
    </div>

    <div class="flex flex-wrap justify-end mt-6 gap-2">
      <button
        class="btn btn-outline btn-sm rounded-2xl"
        :disabled="serverStore.isSaving"
        @click="emit('close')"
      >
        Cancel
      </button>

      <button
        class="btn btn-primary btn-sm rounded-2xl"
        :disabled="!canEdit || serverStore.isSaving"
        @click="handleSave"
      >
        <span
          v-if="serverStore.isSaving"
          class="loading loading-spinner loading-xs"
        ></span>
        <span>{{ serverStore.isSaving ? 'Saving...' : 'Save' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'

const serverStore = useServerStore()
const userStore = useUserStore()
const errorStore = useErrorStore()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const currentUserId = computed<number | null>(() => userStore.user?.id ?? null)

const isAdmin = userStore.isAdmin

const isOwner = computed<boolean>(() => {
  if (!currentUserId.value) return false
  return serverStore.serverForm.userId === currentUserId.value
})

const canEdit = computed<boolean>(() => {
  return isAdmin || isOwner.value
})

async function handleSave(): Promise<void> {
  if (!canEdit.value) {
    errorStore.setError(
      ErrorType.AUTH_ERROR,
      'You do not have permission to edit this server.',
    )
    return
  }

  const result = await serverStore.saveServer()

  if (!result.success) {
    errorStore.setError(
      ErrorType.STORE_ERROR,
      result.message || 'Failed to save server.',
    )
    return
  }

  emit('close')
}
</script>

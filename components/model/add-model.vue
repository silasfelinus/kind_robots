<!-- /components/model/add-model.vue -->
<!--
  Add or edit a CHECKPOINT Resource. Mirrors <add-lora> but drops the LoRA-only
  fields (triggerWords/defaultTrigger) and pins resourceType to CHECKPOINT.
  Writes through resourceStore directly: updateResource when editing an existing
  row, addResources (upsert-by-name batch) when creating a new one. localPath is
  the subfolder-qualified path ComfyUI loads as ckpt_name (e.g.
  `SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors`).
-->
<template>
  <form
    class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
    @submit.prevent="submitModel"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-lg font-black text-primary">
          {{ isEditing ? 'Edit Model' : 'Add Model' }}
        </h3>

        <p class="text-sm text-base-content/60">
          Hand-add or fix a checkpoint's label, base model, path, or preview.
        </p>
      </div>

      <button
        v-if="showClose"
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        @click="emit('close')"
      >
        <Icon name="kind-icon:x" class="h-4 w-4" />
        <span class="hidden sm:inline">Close</span>
      </button>
    </div>

    <div v-if="message" class="kr-note" :class="messageClass">
      {{ message }}
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Name (unique)</span>
        </span>

        <input
          v-model="form.name"
          class="input input-bordered w-full bg-base-200"
          type="text"
          autocomplete="off"
          placeholder="dreamshaperXL_v21TurboDPMSDE.safetensors"
          :readonly="isEditing"
          required
        />
      </label>

      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Custom Label</span>
        </span>

        <input
          v-model="form.customLabel"
          class="input input-bordered w-full bg-base-200"
          type="text"
          autocomplete="off"
          placeholder="DreamShaper XL Turbo"
        />
      </label>
    </div>

    <label class="form-control">
      <span class="label">
        <span class="label-text font-bold">Base Model</span>
      </span>

      <select
        v-model="form.supportedServer"
        class="select select-bordered w-full bg-base-200"
      >
        <option v-for="server in SERVER_OPTIONS" :key="server" :value="server">
          {{ server }}
        </option>
      </select>
    </label>

    <label class="form-control">
      <span class="label">
        <span class="label-text font-bold">Local Path</span>
        <span class="label-text-alt text-base-content/50">
          subfolder-qualified — becomes ComfyUI's ckpt_name
        </span>
      </span>

      <input
        v-model="form.localPath"
        class="input input-bordered w-full bg-base-200 font-mono text-sm"
        type="text"
        autocomplete="off"
        placeholder="SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors"
      />
    </label>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Preview Image URL</span>
        </span>

        <input
          v-model="form.previewImageUrl"
          class="input input-bordered w-full bg-base-200"
          type="url"
          autocomplete="off"
          placeholder="https://image.civitai.com/..."
        />
      </label>

      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Civitai URL</span>
        </span>

        <input
          v-model="form.civitaiUrl"
          class="input input-bordered w-full bg-base-200"
          type="url"
          autocomplete="off"
          placeholder="https://civitai.com/models/..."
        />
      </label>
    </div>

    <label class="form-control">
      <span class="label">
        <span class="label-text font-bold">Description</span>
      </span>

      <textarea
        v-model="form.description"
        class="textarea textarea-bordered min-h-24 w-full bg-base-200"
        placeholder="What this checkpoint is good for, recommended sampler/steps, notes."
      />
    </label>

    <div
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <label class="label cursor-pointer justify-start gap-3">
        <input
          v-model="form.isMature"
          type="checkbox"
          class="toggle toggle-warning"
        />

        <span class="label-text font-bold">Mature (NSFW)</span>
      </label>

      <button
        class="btn btn-primary rounded-xl"
        type="submit"
        :disabled="isSaving || !canSubmit"
      >
        <span v-if="isSaving" class="loading loading-spinner loading-sm" />
        <Icon v-else name="kind-icon:check" class="h-4 w-4" />
        {{ isEditing ? 'Save Changes' : 'Add Model' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useResourceStore, type Resource } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'

type CheckpointSupportedServer =
  | 'SDXL'
  | 'SD15'
  | 'FLUX'
  | 'KONTEXT'
  | 'COMFY'
  | 'GENERIC'
  | 'LTX'
  | 'WAN'
  | 'UNKNOWN'

const SERVER_OPTIONS: CheckpointSupportedServer[] = [
  'SDXL',
  'SD15',
  'FLUX',
  'KONTEXT',
  'COMFY',
  'GENERIC',
  'LTX',
  'WAN',
  'UNKNOWN',
]

type AddModelForm = {
  name: string
  customLabel: string
  supportedServer: CheckpointSupportedServer
  localPath: string
  previewImageUrl: string
  civitaiUrl: string
  description: string
  isMature: boolean
}

const props = withDefaults(
  defineProps<{
    model?: Partial<Resource> | null
    showClose?: boolean
  }>(),
  {
    model: null,
    showClose: true,
  },
)

const emit = defineEmits<{
  saved: [resource: Resource]
  close: []
}>()

const resourceStore = useResourceStore()
const userStore = useUserStore()

const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const isEditing = computed(() => Number(props.model?.id) > 0)

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function normalizeServer(value: unknown): CheckpointSupportedServer {
  const candidate = safeText(value).toUpperCase()

  return (SERVER_OPTIONS as string[]).includes(candidate)
    ? (candidate as CheckpointSupportedServer)
    : 'SDXL'
}

const form = reactive<AddModelForm>({
  name: '',
  customLabel: '',
  supportedServer: 'SDXL',
  localPath: '',
  previewImageUrl: '',
  civitaiUrl: '',
  description: '',
  isMature: false,
})

function hydrateFromModel(model: Partial<Resource> | null) {
  form.name = safeText(model?.name)
  form.customLabel = safeText(model?.customLabel)
  form.supportedServer = normalizeServer(model?.supportedServer)
  form.localPath = safeText(model?.localPath)
  form.previewImageUrl = safeText(model?.previewImageUrl)
  form.civitaiUrl = safeText(model?.civitaiUrl)
  form.description = safeText(model?.description)
  form.isMature = Boolean(model?.isMature)
}

watch(
  () => props.model,
  (model) => hydrateFromModel(model),
  { immediate: true },
)

const canSubmit = computed(() => form.name.trim().length > 0)

const messageClass = computed(() => {
  if (messageType.value === 'success') return 'kr-note-success'
  if (messageType.value === 'error') return 'kr-note-error'
  return 'kr-note-info'
})

function cleanOptional(value: string): string | null {
  const cleaned = value.trim()
  return cleaned ? cleaned : null
}

async function submitModel() {
  if (!canSubmit.value || isSaving.value) return

  isSaving.value = true
  message.value = ''
  messageType.value = 'info'

  try {
    const payload: Partial<Resource> = {
      name: form.name.trim(),
      customLabel: cleanOptional(form.customLabel),
      resourceType: 'CHECKPOINT',
      supportedServer: form.supportedServer,
      localPath: cleanOptional(form.localPath),
      previewImageUrl: cleanOptional(form.previewImageUrl),
      civitaiUrl: cleanOptional(form.civitaiUrl),
      description: cleanOptional(form.description),
      isMature: form.isMature,
    } as Partial<Resource>

    let saved: Resource | null = null

    if (isEditing.value) {
      saved = await resourceStore.updateResource(Number(props.model?.id), payload)
    } else {
      const created = await resourceStore.addResources([
        { ...payload, userId: userStore.userId ?? null } as Partial<Resource>,
      ])
      saved = created[0] ?? null
    }

    if (!saved) {
      throw new Error('The server did not return the saved model.')
    }

    message.value = isEditing.value ? 'Model updated.' : 'Model added.'
    messageType.value = 'success'

    emit('saved', saved)
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Could not save the model.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

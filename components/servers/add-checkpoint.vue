<!-- /components/content/art/add-checkpoint.vue -->
<template>
  <form
    class="flex flex-col gap-4 kr-panel-flat p-4"
    @submit.prevent="submitCheckpoint"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="kr-text-black-lg text-primary">
          {{ title }}
        </h3>

        <p class="kr-text-dim-sm">
          Add a custom checkpoint, LoRA, embedding, sampler, API, or URL
          resource.
        </p>
      </div>

      <button
        v-if="showClose"
        class="kr-btn-ghost"
        type="button"
        @click="emit('close')"
      >
        <Icon name="kind-icon:x" class="kr-icon-4" />
        <span class="hidden sm:inline">Close</span>
      </button>
    </div>

    <div v-if="message" class="kr-note" :class="messageClass">
      {{ message }}
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Name</span>
        </span>

        <input
          v-model="form.name"
          class="kr-input-muted"
          type="text"
          autocomplete="off"
          placeholder="ponyFaetality_v11.safetensors"
          required
        />
      </label>

      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Custom Label</span>
        </span>

        <input
          v-model="form.customLabel"
          class="kr-input-muted"
          type="text"
          autocomplete="off"
          placeholder="Pony Faetality"
        />
      </label>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Resource Type</span>
        </span>

        <select v-model="form.resourceType" class="kr-select-muted">
          <option value="CHECKPOINT">Checkpoint</option>
          <option value="LORA">LoRA</option>
          <option value="LYCORIS">LyCORIS</option>
          <option value="EMBEDDING">Embedding</option>
          <option value="HYPERNETWORK">Hypernetwork</option>
          <option value="SAMPLER">Sampler</option>
          <option value="CONTROLNET">ControlNet</option>
          <option value="URL">URL</option>
          <option value="API">API</option>
        </select>
      </label>

      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Supported Server</span>
        </span>

        <select v-model="form.supportedServer" class="kr-select-muted">
          <option value="SDXL">SDXL</option>
          <option value="SD15">SD15</option>
          <option value="FLUX">FLUX</option>
          <option value="KONTEXT">KONTEXT</option>
          <option value="COMFY">COMFY</option>
          <option value="A1111">A1111</option>
          <option value="OPENAI">OPENAI</option>
          <option value="OTHER">OTHER</option>
        </select>
      </label>
    </div>

    <label class="form-control">
      <span class="label">
        <span class="kr-label-bold">Local Path</span>
      </span>

      <input
        v-model="form.localPath"
        class="kr-input-muted font-mono text-sm"
        type="text"
        autocomplete="off"
        placeholder="SDXL/ponyFaetality_v11.safetensors"
      />
    </label>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Civitai URL</span>
        </span>

        <input
          v-model="form.civitaiUrl"
          class="kr-input-muted"
          type="url"
          autocomplete="off"
          placeholder="https://civitai.com/..."
        />
      </label>

      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Hugging Face URL</span>
        </span>

        <input
          v-model="form.huggingUrl"
          class="kr-input-muted"
          type="url"
          autocomplete="off"
          placeholder="https://huggingface.co/..."
        />
      </label>

      <label class="form-control">
        <span class="label">
          <span class="kr-label-bold">Custom URL</span>
        </span>

        <input
          v-model="form.customUrl"
          class="kr-input-muted"
          type="url"
          autocomplete="off"
          placeholder="https://..."
        />
      </label>
    </div>

    <label class="form-control">
      <span class="label">
        <span class="kr-label-bold">Media Path</span>
      </span>

      <input
        v-model="form.MediaPath"
        class="kr-input-muted"
        type="text"
        autocomplete="off"
        placeholder="/images/checkpoints/preview.webp"
      />
    </label>

    <label class="form-control">
      <span class="label">
        <span class="kr-label-bold">Description</span>
      </span>

      <textarea
        v-model="form.description"
        class="kr-textarea-muted min-h-28"
        placeholder="What does this resource do, where does it live, and why should future-you care?"
      />
    </label>

    <label class="form-control">
      <span class="label">
        <span class="kr-label-bold">Generation Notes</span>
      </span>

      <textarea
        v-model="form.generation"
        class="kr-textarea-muted min-h-24"
        placeholder="Optional generation notes, trigger words, recommended sampler, CFG, etc."
      />
    </label>

    <div
      class="flex flex-col gap-3 kr-panel-muted-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <label class="label cursor-pointer justify-start gap-3">
        <input
          v-model="form.isMature"
          type="checkbox"
          class="toggle toggle-warning"
        />

        <span class="kr-label-bold">Mature resource</span>
      </label>

      <button
        class="kr-btn-primary-md"
        type="submit"
        :disabled="isSaving || !canSubmit"
      >
        <span v-if="isSaving" class="kr-spinner-sm" />
        <Icon v-else name="kind-icon:plus" class="kr-icon-4" />
        Save Checkpoint
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'

type ResourceType =
  | 'CHECKPOINT'
  | 'EMBEDDING'
  | 'LORA'
  | 'LYCORIS'
  | 'HYPERNETWORK'
  | 'SAMPLER'
  | 'CONTROLNET'
  | 'URL'
  | 'API'

type SupportedServer =
  'SDXL' | 'SD15' | 'FLUX' | 'KONTEXT' | 'COMFY' | 'A1111' | 'OPENAI' | 'OTHER'

type AddCheckpointForm = {
  name: string
  customLabel: string
  MediaPath: string
  customUrl: string
  civitaiUrl: string
  huggingUrl: string
  localPath: string
  description: string
  isMature: boolean
  resourceType: ResourceType
  supportedServer: SupportedServer
  generation: string
}

const props = withDefaults(
  defineProps<{
    title?: string
    showClose?: boolean
  }>(),
  {
    title: 'Add Checkpoint',
    showClose: true,
  },
)

const emit = defineEmits<{
  saved: [resource: unknown]
  close: []
}>()

const checkpointStore = useCheckpointStore()
const userStore = useUserStore()

const isSaving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const form = reactive<AddCheckpointForm>({
  name: '',
  customLabel: '',
  MediaPath: '',
  customUrl: '',
  civitaiUrl: '',
  huggingUrl: '',
  localPath: '',
  description: '',
  isMature: false,
  resourceType: 'CHECKPOINT',
  supportedServer: 'SDXL',
  generation: '',
})

const canSubmit = computed(() => {
  return form.name.trim().length > 0
})

const messageClass = computed(() => {
  if (messageType.value === 'success') {
    return 'kr-note-success'
  }

  if (messageType.value === 'error') {
    return 'kr-note-error'
  }

  return 'kr-note-info'
})

function cleanOptional(value: string) {
  const cleaned = value.trim()

  return cleaned ? cleaned : null
}

async function submitCheckpoint() {
  if (!canSubmit.value || isSaving.value) return

  isSaving.value = true
  message.value = ''
  messageType.value = 'info'

  try {
    const payload = {
      name: form.name.trim(),
      customLabel: cleanOptional(form.customLabel),
      MediaPath: cleanOptional(form.MediaPath),
      customUrl: cleanOptional(form.customUrl),
      civitaiUrl: cleanOptional(form.civitaiUrl),
      huggingUrl: cleanOptional(form.huggingUrl),
      localPath: cleanOptional(form.localPath),
      description: cleanOptional(form.description),
      isMature: form.isMature,
      resourceType: form.resourceType,
      supportedServer: form.supportedServer,
      generation: cleanOptional(form.generation),
      userId: userStore.userId ?? userStore.user?.id ?? null,
    }

    const resource = await checkpointStore.createCheckpointResource(payload)

    message.value = 'Checkpoint saved.'
    messageType.value = 'success'

    emit('saved', resource)
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Could not save checkpoint.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

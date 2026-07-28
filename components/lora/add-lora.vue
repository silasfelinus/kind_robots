<!-- /components/lora/add-lora.vue -->
<!--
  Add or edit a LoRA Resource. Mirrors <add-checkpoint> but exposes the
  LoRA-specific fields (triggerWords, defaultTrigger, previewImageUrl) and
  writes through resourceStore directly: updateResource when editing an
  existing row (PATCH — relies on resourceMutationSelect echoing these fields),
  addResources (upsert-by-name batch) when creating a new one.
-->
<template>
  <form
    class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
    @submit.prevent="submitLora"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-lg font-black text-primary">
          {{ isEditing ? 'Edit LoRA' : 'Add LoRA' }}
        </h3>

        <p class="text-sm text-base-content/60">
          Drops into <code>Lora/import</code> get catalogued automatically — use
          this to hand-add or fix a LoRA's label, base model, or triggers.
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
          placeholder="ume_classic_impressionist"
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
          placeholder="Classic Impressionist"
        />
      </label>
    </div>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Type</span>
        </span>

        <select
          v-model="form.resourceType"
          class="select select-bordered w-full bg-base-200"
        >
          <option value="LORA">LoRA</option>
          <option value="LYCORIS">LyCORIS</option>
        </select>
      </label>

      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Base Model</span>
        </span>

        <select
          v-model="form.supportedServer"
          class="select select-bordered w-full bg-base-200"
        >
          <option value="SDXL">SDXL</option>
          <option value="SD15">SD15</option>
          <option value="FLUX">FLUX</option>
          <option value="KONTEXT">KONTEXT</option>
          <option value="COMFY">COMFY</option>
          <option value="A1111">A1111</option>
          <option value="OTHER">OTHER</option>
        </select>
      </label>
    </div>

    <label class="form-control">
      <span class="label">
        <span class="label-text font-bold">Local Path</span>
        <span class="label-text-alt text-base-content/50">
          relative to the Lora root — becomes ComfyUI's lora_name
        </span>
      </span>

      <input
        v-model="form.localPath"
        class="input input-bordered w-full bg-base-200 font-mono text-sm"
        type="text"
        autocomplete="off"
        placeholder="Flux/SFW/ume_classic_impressionist.safetensors"
      />
    </label>

    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Trigger Words</span>
          <span class="label-text-alt text-base-content/50">all, comma-separated</span>
        </span>

        <input
          v-model="form.triggerWords"
          class="input input-bordered w-full bg-base-200"
          type="text"
          autocomplete="off"
          placeholder="impressionist, oil painting, loose brushwork"
        />
      </label>

      <label class="form-control">
        <span class="label">
          <span class="label-text font-bold">Default Trigger</span>
          <span class="label-text-alt text-base-content/50">injected at gen time</span>
        </span>

        <input
          v-model="form.defaultTrigger"
          class="input input-bordered w-full bg-base-200"
          type="text"
          autocomplete="off"
          placeholder="impressionist oil painting"
        />
      </label>
    </div>

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
        placeholder="What this LoRA does, recommended weight, notes."
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
        {{ isEditing ? 'Save Changes' : 'Add LoRA' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useResourceStore, type Resource } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'

type LoraResourceType = 'LORA' | 'LYCORIS'
type LoraSupportedServer =
  | 'SDXL'
  | 'SD15'
  | 'FLUX'
  | 'KONTEXT'
  | 'COMFY'
  | 'A1111'
  | 'OTHER'

type AddLoraForm = {
  name: string
  customLabel: string
  resourceType: LoraResourceType
  supportedServer: LoraSupportedServer
  localPath: string
  triggerWords: string
  defaultTrigger: string
  previewImageUrl: string
  civitaiUrl: string
  description: string
  isMature: boolean
}

const props = withDefaults(
  defineProps<{
    lora?: Partial<Resource> | null
    showClose?: boolean
  }>(),
  {
    lora: null,
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

const isEditing = computed(() => Number(props.lora?.id) > 0)

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function normalizeType(value: unknown): LoraResourceType {
  return safeText(value).toUpperCase() === 'LYCORIS' ? 'LYCORIS' : 'LORA'
}

function normalizeServer(value: unknown): LoraSupportedServer {
  const candidate = safeText(value).toUpperCase()
  const allowed: LoraSupportedServer[] = [
    'SDXL',
    'SD15',
    'FLUX',
    'KONTEXT',
    'COMFY',
    'A1111',
    'OTHER',
  ]

  return (allowed as string[]).includes(candidate)
    ? (candidate as LoraSupportedServer)
    : 'SDXL'
}

const form = reactive<AddLoraForm>({
  name: '',
  customLabel: '',
  resourceType: 'LORA',
  supportedServer: 'SDXL',
  localPath: '',
  triggerWords: '',
  defaultTrigger: '',
  previewImageUrl: '',
  civitaiUrl: '',
  description: '',
  isMature: false,
})

function hydrateFromLora(lora: Partial<Resource> | null) {
  form.name = safeText(lora?.name)
  form.customLabel = safeText(lora?.customLabel)
  form.resourceType = normalizeType(lora?.resourceType)
  form.supportedServer = normalizeServer(lora?.supportedServer)
  form.localPath = safeText(lora?.localPath)
  form.triggerWords = safeText(lora?.triggerWords)
  form.defaultTrigger = safeText(lora?.defaultTrigger)
  form.previewImageUrl = safeText(lora?.previewImageUrl)
  form.civitaiUrl = safeText(lora?.civitaiUrl)
  form.description = safeText(lora?.description)
  form.isMature = Boolean(lora?.isMature)
}

watch(
  () => props.lora,
  (lora) => hydrateFromLora(lora),
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

async function submitLora() {
  if (!canSubmit.value || isSaving.value) return

  isSaving.value = true
  message.value = ''
  messageType.value = 'info'

  try {
    const payload: Partial<Resource> = {
      name: form.name.trim(),
      customLabel: cleanOptional(form.customLabel),
      resourceType: form.resourceType,
      supportedServer: form.supportedServer,
      localPath: cleanOptional(form.localPath),
      triggerWords: cleanOptional(form.triggerWords),
      defaultTrigger: cleanOptional(form.defaultTrigger),
      previewImageUrl: cleanOptional(form.previewImageUrl),
      civitaiUrl: cleanOptional(form.civitaiUrl),
      description: cleanOptional(form.description),
      isMature: form.isMature,
    } as Partial<Resource>

    let saved: Resource | null = null

    if (isEditing.value) {
      saved = await resourceStore.updateResource(Number(props.lora?.id), payload)
    } else {
      const created = await resourceStore.addResources([
        { ...payload, userId: userStore.userId ?? null } as Partial<Resource>,
      ])
      saved = created[0] ?? null
    }

    if (!saved) {
      throw new Error('The server did not return the saved LoRA.')
    }

    message.value = isEditing.value ? 'LoRA updated.' : 'LoRA added.'
    messageType.value = 'success'

    emit('saved', saved)
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Could not save the LoRA.'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}
</script>

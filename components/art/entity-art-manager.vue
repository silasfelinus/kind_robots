<!-- /components/art/entity-art-manager.vue -->
<template>
  <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
    <header class="flex flex-wrap items-start gap-2">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:palette" class="size-4 text-secondary" />
          <h3 class="text-sm font-black">Artwork</h3>
          <span class="badge badge-ghost badge-xs">{{ entityLabel }}</span>
        </div>
        <p class="mt-1 text-xs text-base-content/50">
          Recreate with Krea, edit the current image with SDXL or Kontext, or upload a finished replacement.
        </p>
      </div>

      <div v-if="mayEdit" class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="btn btn-secondary btn-xs gap-1 rounded-lg"
          @click="openGenerate"
        >
          <Icon name="kind-icon:sparkles" class="size-3" />
          Generate replacement
        </button>
        <button
          type="button"
          class="btn btn-primary btn-xs gap-1 rounded-lg"
          @click="openUpload"
        >
          <Icon name="kind-icon:upload" class="size-3" />
          Upload image
        </button>
      </div>
    </header>

    <div v-if="slots.length > 1" class="mt-3 flex flex-wrap gap-1.5">
      <button
        v-for="slot in slots"
        :key="slot.field"
        type="button"
        class="btn btn-xs rounded-lg"
        :class="selectedField === slot.field ? 'btn-secondary' : 'btn-ghost border border-base-300'"
        @click="selectSlot(slot.field)"
      >
        {{ slot.label }}
      </button>
    </div>

    <div class="mt-3 grid gap-3" :class="history.length ? 'lg:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)]' : ''">
      <div
        class="relative min-h-48 overflow-hidden rounded-xl border border-base-300 bg-base-200"
        :style="{ aspectRatio: selectedSlot.aspect || undefined }"
      >
        <img
          v-if="currentSrc && !currentFailed"
          :key="currentSrc"
          :src="currentSrc"
          :alt="`${title} ${selectedSlot.label}`"
          class="absolute inset-0 size-full object-cover"
          @error="currentFailed = true"
        />
        <div
          v-else
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-base-content/40"
        >
          <Icon name="kind-icon:image" class="size-10 opacity-40" />
          <p class="text-xs font-semibold">No {{ selectedSlot.label.toLowerCase() }} yet.</p>
        </div>

        <div
          class="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-linear-to-t from-base-300/95 to-transparent p-3 pt-10"
        >
          <span class="badge badge-sm border-0 bg-base-100/85 font-bold backdrop-blur">
            Current {{ selectedSlot.label }}
          </span>
          <div v-if="mayEdit" class="flex gap-1">
            <button
              type="button"
              class="btn btn-secondary btn-xs gap-1 rounded-lg"
              @click="openGenerate"
            >
              <Icon name="kind-icon:sparkles" class="size-3" />
              Generate
            </button>
            <button
              type="button"
              class="btn btn-xs gap-1 rounded-lg border-0 bg-base-100/85 backdrop-blur"
              @click="openUpload"
            >
              <Icon name="kind-icon:upload" class="size-3" />
              Upload
            </button>
          </div>
        </div>
      </div>

      <aside v-if="history.length" class="rounded-xl border border-base-300 bg-base-200/50 p-3">
        <div class="mb-2 flex items-center gap-2">
          <Icon name="kind-icon:history" class="size-3.5 text-base-content/50" />
          <h4 class="text-xs font-black uppercase tracking-wide text-base-content/55">
            Inspiration history
          </h4>
          <span class="badge badge-ghost badge-xs ml-auto">{{ filteredHistory.length }}</span>
        </div>
        <div v-if="filteredHistory.length" class="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
          <article
            v-for="item in filteredHistory"
            :key="item.id"
            class="group relative overflow-hidden rounded-lg border border-base-300 bg-base-100"
          >
            <img
              :src="historySrc(item)"
              :alt="item.fileName || 'Previous artwork'"
              class="aspect-square size-full object-cover"
            />
            <button
              v-if="mayEdit"
              type="button"
              class="btn btn-circle btn-error btn-xs absolute right-1 top-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
              title="Remove from inspiration history"
              :disabled="removingHistoryId === item.id"
              @click="removeHistory(item.id)"
            >
              <span v-if="removingHistoryId === item.id" class="loading loading-spinner loading-xs" />
              <Icon v-else name="kind-icon:trash" class="size-3" />
            </button>
            <p class="truncate px-2 py-1 text-[0.65rem] text-base-content/50">
              {{ item.fieldLabel || item.fileName || `Image ${item.id}` }}
            </p>
          </article>
        </div>
        <p v-else class="py-6 text-center text-xs text-base-content/40">
          No saved {{ selectedSlot.label.toLowerCase() }} versions.
        </p>
      </aside>
    </div>

    <form
      v-if="showGenerate"
      class="mt-3 space-y-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3"
      @submit.prevent="queueGeneration"
    >
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-black">Generate {{ selectedSlot.label }} replacement</p>
          <p class="text-xs text-base-content/50">
            Recreate starts fresh with Krea. Img2img uses the current image and defaults to SDXL.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          :disabled="submitting"
          @click="closeForms"
        >
          <Icon name="kind-icon:x" class="size-3" />
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Target</span>
          <select v-model="selectedField" class="select select-bordered select-sm rounded-xl" :disabled="submitting">
            <option v-for="slot in slots" :key="slot.field" :value="slot.field">
              {{ slot.label }}
            </option>
          </select>
        </label>

        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Method</span>
          <select v-model="generationMode" class="select select-bordered select-sm rounded-xl" :disabled="submitting">
            <option value="recreate">New prompt · recreate</option>
            <option value="img2img" :disabled="!currentSrc">Current image · img2img</option>
          </select>
        </label>

        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Engine</span>
          <select v-model="generationEngine" class="select select-bordered select-sm rounded-xl" :disabled="submitting">
            <template v-if="generationMode === 'recreate'">
              <option value="krea2">Krea 2 · default</option>
              <option value="comfy">SDXL · prompt only</option>
            </template>
            <template v-else>
              <option value="sdxl-img2img">SDXL img2img · default</option>
              <option value="kontext">Kontext edit</option>
            </template>
          </select>
        </label>

        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Preset</span>
          <select v-model="presetKey" class="select select-bordered select-sm rounded-xl" :disabled="submitting">
            <option v-for="preset in availablePresets" :key="preset.key" :value="preset.key">
              {{ preset.label }}
            </option>
          </select>
        </label>
      </div>

      <label class="form-control gap-1">
        <span class="text-xs font-semibold text-base-content/60">Art direction</span>
        <textarea
          v-model="prompt"
          class="textarea textarea-bordered min-h-28 rounded-xl text-sm"
          maxlength="5000"
          :placeholder="promptPlaceholder"
          :disabled="submitting"
        />
        <span class="text-[0.65rem] text-base-content/40">
          The {{ entityLabel.toLowerCase() }} record supplies supporting context. This text remains the primary direction.
        </span>
      </label>

      <div
        v-if="showCheckpointSelector"
        class="grid gap-3 rounded-xl border border-base-300 bg-base-100/70 p-3 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">SDXL checkpoint</span>
          <select
            v-model.number="checkpointResourceId"
            class="select select-bordered select-sm rounded-xl"
            :disabled="submitting || loadingResources"
          >
            <option :value="0">Use current quality default</option>
            <option v-for="checkpoint in checkpointOptions" :key="checkpoint.id" :value="checkpoint.id">
              {{ checkpoint.customLabel || checkpoint.name }}
            </option>
          </select>
        </label>
        <span v-if="loadingResources" class="loading loading-spinner loading-sm self-end mb-1" />
        <p v-else class="self-end pb-2 text-xs text-base-content/40">
          Leave unchanged to use the same default workflow that is producing the current quality.
        </p>
      </div>

      <fieldset class="space-y-1">
        <legend class="text-xs font-semibold text-base-content/60">Current image</legend>
        <div class="grid gap-1 sm:grid-cols-2">
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="true"
              class="radio radio-secondary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Keep as inspiration</span>
              <span class="block text-xs text-base-content/45">
                Save the current version in this {{ entityLabel }} artwork history.
              </span>
            </span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="false"
              class="radio radio-secondary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Do not retain it</span>
              <span class="block text-xs text-base-content/45">
                Replace the entity reference without adding the old version to history.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div class="rounded-lg bg-base-100/60 px-3 py-2 text-xs text-base-content/55">
        <strong>{{ generationMode === 'recreate' ? 'Recreate' : 'Img2img' }}:</strong>
        {{ engineLabel }} · {{ selectedSlot.width }}×{{ selectedSlot.height }}
        <template v-if="selectedPreset.description"> · {{ selectedPreset.description }}</template>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="message"
          class="min-w-0 flex-1 text-xs"
          :class="messageTone === 'error' ? 'text-error' : messageTone === 'success' ? 'text-success' : 'text-info'"
        >
          {{ message }}
        </p>
        <button
          type="submit"
          class="btn btn-secondary btn-sm ml-auto gap-1.5 rounded-xl"
          :disabled="prompt.trim().length < 3 || submitting || (generationMode === 'img2img' && !currentSrc)"
        >
          <span v-if="submitting" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:sparkles" class="size-4" />
          {{ submitting ? 'Queuing…' : `Queue ${selectedSlot.label}` }}
        </button>
      </div>
    </form>

    <form
      v-if="showUpload"
      class="mt-3 space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3"
      @submit.prevent="uploadReplacement"
    >
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-black">Upload {{ selectedSlot.label }} replacement</p>
          <p class="text-xs text-base-content/50">
            Upload a finished PNG, JPEG, or WebP, then choose whether the old image remains as inspiration.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          :disabled="submitting"
          @click="closeForms"
        >
          <Icon name="kind-icon:x" class="size-3" />
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Target</span>
          <select v-model="selectedField" class="select select-bordered select-sm rounded-xl" :disabled="submitting">
            <option v-for="slot in slots" :key="slot.field" :value="slot.field">
              {{ slot.label }}
            </option>
          </select>
        </label>
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">New image</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="file-input file-input-bordered file-input-sm w-full rounded-xl"
            :disabled="submitting"
            @change="handleFile"
          />
        </label>
      </div>

      <fieldset class="space-y-1">
        <legend class="text-xs font-semibold text-base-content/60">Current image</legend>
        <div class="grid gap-1 sm:grid-cols-2">
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="true"
              class="radio radio-primary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Keep as inspiration</span>
              <span class="block text-xs text-base-content/45">Retain the previous version in artwork history.</span>
            </span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="false"
              class="radio radio-primary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Do not retain it</span>
              <span class="block text-xs text-base-content/45">Replace the entity reference without adding history.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="message"
          class="min-w-0 flex-1 text-xs"
          :class="messageTone === 'error' ? 'text-error' : 'text-success'"
        >
          {{ message }}
        </p>
        <button
          type="submit"
          class="btn btn-primary btn-sm ml-auto gap-1.5 rounded-xl"
          :disabled="!uploadFile || submitting"
        >
          <span v-if="submitting" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:upload" class="size-4" />
          {{ submitting ? 'Uploading…' : 'Upload & replace' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResourceStore } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type EntityArtType =
  | 'bot'
  | 'character'
  | 'scenario'
  | 'reward'
  | 'facet'
  | 'project'
  | 'achievement'
type EntityArtSlot = {
  field: string
  label: string
  aspect?: string
  width?: number
  height?: number
}
type EntityRecord = Record<string, unknown> & {
  id: number
  userId?: number | null
  artImageId?: number | null
  title?: string | null
  name?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  designer?: string | null
}
type HistoryItem = {
  id: number
  fileName?: string | null
  fileType?: string | null
  imagePath?: string | null
  path?: string | null
  createdAt?: string | Date
  field?: string
  fieldLabel?: string
}
type GenerationPreset = {
  key: string
  label: string
  description: string
  denoise?: number
  originalWeight?: number
  steps?: number
}

const props = withDefaults(
  defineProps<{
    entityType: EntityArtType
    entity: EntityRecord
    slots: EntityArtSlot[]
    canEdit?: boolean
  }>(),
  {
    canEdit: false,
  },
)

const emit = defineEmits<{
  updated: [entity: EntityRecord]
  queued: [jobId: number]
}>()

const userStore = useUserStore()
const resourceStore = useResourceStore()
const selectedField = ref(props.slots[0]?.field || 'imagePath')
const history = ref<HistoryItem[]>([])
const showGenerate = ref(false)
const showUpload = ref(false)
const generationMode = ref<'recreate' | 'img2img'>('recreate')
const generationEngine = ref('krea2')
const presetKey = ref('quality')
const prompt = ref('')
const preserveOriginal = ref(true)
const checkpointResourceId = ref(0)
const uploadFile = ref<File | null>(null)
const submitting = ref(false)
const loadingResources = ref(false)
const removingHistoryId = ref<number | null>(null)
const currentFailed = ref(false)
const message = ref('')
const messageTone = ref<'info' | 'success' | 'error'>('info')
let pollTimer: ReturnType<typeof setTimeout> | null = null
let activeJobId: number | null = null
let stopped = false

const entityLabel = computed(() =>
  props.entityType.charAt(0).toUpperCase() + props.entityType.slice(1),
)
const title = computed(() =>
  String(props.entity.title || props.entity.name || `${entityLabel.value} ${props.entity.id}`),
)
const mayEdit = computed(
  () =>
    props.canEdit ||
    userStore.isAdmin ||
    Number(props.entity.userId) === Number(userStore.userId),
)
const selectedSlot = computed(() => {
  const configured = props.slots.find((slot) => slot.field === selectedField.value)
  return {
    field: configured?.field || props.slots[0]?.field || 'imagePath',
    label: configured?.label || 'Image',
    aspect: configured?.aspect || '1 / 1',
    width: configured?.width || 1024,
    height: configured?.height || 1024,
  }
})
const currentSrc = computed(() => {
  const direct = normalizeSrc(props.entity[selectedSlot.value.field])
  if (direct) return direct
  if (
    props.entity.artImageId &&
    ['imagePath', 'avatarImage'].includes(selectedSlot.value.field)
  ) {
    return `/api/art/images/${props.entity.artImageId}/file`
  }
  return ''
})
const filteredHistory = computed(() =>
  history.value.filter(
    (item) => !item.field || item.field === selectedField.value,
  ),
)
const checkpointOptions = computed(() =>
  resourceStore.resources
    .filter((resource) => {
      if (resource.isActive === false) return false
      const resourceType = String(resource.resourceType || '').toUpperCase()
      const generation = String(resource.generation || '').toLowerCase()
      return resourceType === 'CHECKPOINT' || generation === 'checkpoint'
    })
    .sort((a, b) =>
      String(a.customLabel || a.name || '').localeCompare(
        String(b.customLabel || b.name || ''),
      ),
    ),
)
const showCheckpointSelector = computed(
  () =>
    generationEngine.value === 'sdxl-img2img' ||
    generationEngine.value === 'comfy',
)
const recreatePresets: GenerationPreset[] = [
  {
    key: 'quality',
    label: 'Quality default',
    description: 'Uses the current quality-focused workflow defaults.',
  },
  {
    key: 'polished',
    label: 'Polished',
    description: 'A slightly longer quality pass.',
    steps: 28,
  },
]
const img2imgPresets: GenerationPreset[] = [
  {
    key: 'gentle',
    label: 'Gentle refresh',
    description: 'Keeps most of the original composition.',
    denoise: 0.35,
    originalWeight: 0.75,
  },
  {
    key: 'balanced',
    label: 'Balanced edit',
    description: 'Preserves identity while allowing visible changes.',
    denoise: 0.55,
    originalWeight: 0.55,
  },
  {
    key: 'strong',
    label: 'Strong redesign',
    description: 'Uses the source as guidance, not a strict template.',
    denoise: 0.75,
    originalWeight: 0.35,
  },
]
const availablePresets = computed(() =>
  generationMode.value === 'recreate' ? recreatePresets : img2imgPresets,
)
const selectedPreset = computed(
  () =>
    availablePresets.value.find((preset) => preset.key === presetKey.value) ||
    availablePresets.value[0] ||
    recreatePresets[0],
)
const engineLabel = computed(() => {
  switch (generationEngine.value) {
    case 'krea2':
      return 'Krea 2'
    case 'sdxl-img2img':
      return 'SDXL img2img'
    case 'kontext':
      return 'Kontext'
    default:
      return 'SDXL'
  }
})
const promptPlaceholder = computed(() =>
  generationMode.value === 'recreate'
    ? `Describe a new ${selectedSlot.value.label.toLowerCase()} for ${title.value}…`
    : `Describe what should change while preserving the useful parts of the current ${selectedSlot.value.label.toLowerCase()}…`,
)

function normalizeSrc(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return ''
  if (/^(https?:|data:image\/|\/)/.test(trimmed)) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  return `/images/${trimmed}`
}

function historySrc(item: HistoryItem): string {
  return normalizeSrc(item.imagePath || item.path) || `/api/art/images/${item.id}/file`
}

function selectSlot(field: string) {
  selectedField.value = field
  currentFailed.value = false
  message.value = ''
}

function openGenerate() {
  showGenerate.value = true
  showUpload.value = false
  message.value = ''
  messageTone.value = 'info'
}

function openUpload() {
  showUpload.value = true
  showGenerate.value = false
  message.value = ''
  messageTone.value = 'info'
}

function closeForms() {
  if (submitting.value) return
  showGenerate.value = false
  showUpload.value = false
  uploadFile.value = null
  message.value = ''
}

function handleFile(event: Event) {
  uploadFile.value =
    (event.target as HTMLInputElement | null)?.files?.[0] || null
  message.value = ''
}

function applyEntity(entity: EntityRecord | null | undefined) {
  if (!entity) return
  Object.assign(props.entity, entity)
  currentFailed.value = false
  emit('updated', props.entity)
}

async function fetchEntityArt(force = false) {
  const query = force ? `?refresh=${Date.now()}` : ''
  const response = await performFetch<{
    entity: EntityRecord
    history: HistoryItem[]
  }>(
    `/api/art/entities/${props.entityType}/${props.entity.id}${query}`,
    force ? { cache: 'no-store' } : {},
  )
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Artwork could not be loaded.')
  }
  applyEntity(response.data.entity)
  history.value = response.data.history || []
}

async function ensureResources() {
  if (!showCheckpointSelector.value || resourceStore.hasLoaded) return
  loadingResources.value = true
  try {
    await resourceStore.loadStore()
  } finally {
    loadingResources.value = false
  }
}

async function uploadReplacement() {
  if (!uploadFile.value || submitting.value) return
  submitting.value = true
  message.value = ''
  try {
    const form = new FormData()
    form.append('file', uploadFile.value)
    form.append('field', selectedField.value)
    form.append('preserveOriginal', String(preserveOriginal.value))
    const response = await performFetch<{
      entity: EntityRecord
      history: HistoryItem[]
    }>(
      `/api/art/entities/${props.entityType}/${props.entity.id}/replace`,
      { method: 'POST', body: form },
      1,
      30_000,
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Image replacement failed.')
    }
    applyEntity(response.data.entity)
    history.value = response.data.history || []
    uploadFile.value = null
    message.value = response.message || 'Image replaced.'
    messageTone.value = 'success'
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Image replacement failed.'
    messageTone.value = 'error'
  } finally {
    submitting.value = false
  }
}

async function queueGeneration() {
  if (prompt.value.trim().length < 3 || submitting.value) return
  submitting.value = true
  message.value = ''
  messageTone.value = 'info'
  try {
    const checkpoint = checkpointOptions.value.find(
      (resource) => resource.id === checkpointResourceId.value,
    )
    const preset = selectedPreset.value
    const response = await performFetch<{
      jobId: number
      status: string
    }>('/api/art/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: generationEngine.value,
        promptString: prompt.value.trim(),
        width: selectedSlot.value.width,
        height: selectedSlot.value.height,
        isPublic: props.entity.isPublic ?? true,
        isMature: props.entity.isMature ?? false,
        designer: props.entity.designer || userStore.user?.username || null,
        ...(preset.steps ? { steps: preset.steps } : {}),
        ...(preset.denoise != null ? { denoise: preset.denoise } : {}),
        ...(preset.originalWeight != null
          ? { originalWeight: preset.originalWeight }
          : {}),
        ...(checkpoint
          ? {
              checkpointResourceId: checkpoint.id,
              checkpoint:
                checkpoint.localPath || checkpoint.name || checkpoint.customLabel,
            }
          : {}),
        entityArt: {
          entityType: props.entityType,
          entityId: props.entity.id,
          field: selectedField.value,
          preserveOriginal: preserveOriginal.value,
          mode: generationMode.value,
        },
      }),
    })
    if (!response.success || !response.data?.jobId) {
      throw new Error(response.message || 'Art generation could not be queued.')
    }
    activeJobId = Number(response.data.jobId)
    emit('queued', activeJobId)
    message.value = `Queued as ArtJob ${activeJobId}. The replacement will attach automatically when generation finishes.`
    messageTone.value = 'info'
    startPolling(activeJobId)
  } catch (error) {
    message.value =
      error instanceof Error
        ? error.message
        : 'Art generation could not be queued.'
    messageTone.value = 'error'
  } finally {
    submitting.value = false
  }
}

function startPolling(jobId: number) {
  if (pollTimer) clearTimeout(pollTimer)
  const poll = async () => {
    if (stopped || activeJobId !== jobId) return
    try {
      const response = await performFetch<{
        job: {
          id: number
          status: string
          artImageId?: number | null
          error?: string | null
        }
      }>(`/api/art/queue/${jobId}`, { cache: 'no-store' })
      const status = String(response.data?.job?.status || '')
      if (!response.success) throw new Error(response.message || 'Queue check failed.')
      if (status === 'DONE') {
        await fetchEntityArt(true)
        message.value = `ArtJob ${jobId} finished and the ${selectedSlot.value.label.toLowerCase()} was replaced.`
        messageTone.value = 'success'
        activeJobId = null
        return
      }
      if (status === 'FAILED' || status === 'CANCELLED') {
        message.value =
          response.data?.job?.error || `ArtJob ${jobId} ended as ${status}.`
        messageTone.value = 'error'
        activeJobId = null
        return
      }
      message.value = `ArtJob ${jobId}: ${status || 'PENDING'}. It will attach automatically when complete.`
      messageTone.value = 'info'
    } catch {
      // Completion is durable on the server. A transient polling failure should
      // not convert a valid queued job into a visible failure.
    }
    pollTimer = setTimeout(poll, 5000)
  }
  void poll()
}

async function removeHistory(id: number) {
  if (removingHistoryId.value) return
  removingHistoryId.value = id
  try {
    const response = await performFetch(
      `/api/art/entities/${props.entityType}/${props.entity.id}/history/${id}`,
      { method: 'DELETE' },
    )
    if (!response.success) {
      throw new Error(response.message || 'History item could not be removed.')
    }
    history.value = history.value.filter((item) => item.id !== id)
    message.value = response.message || 'History item removed.'
    messageTone.value = 'success'
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'History item could not be removed.'
    messageTone.value = 'error'
  } finally {
    removingHistoryId.value = null
  }
}

watch(generationMode, (mode) => {
  generationEngine.value = mode === 'recreate' ? 'krea2' : 'sdxl-img2img'
  presetKey.value = mode === 'recreate' ? 'quality' : 'balanced'
  void ensureResources()
})
watch(generationEngine, () => {
  void ensureResources()
})
watch(
  () => [props.entityType, props.entity.id],
  async () => {
    selectedField.value = props.slots[0]?.field || 'imagePath'
    currentFailed.value = false
    history.value = []
    closeForms()
    try {
      await fetchEntityArt(true)
    } catch {}
  },
)
watch(selectedField, () => {
  currentFailed.value = false
})
onMounted(async () => {
  try {
    await fetchEntityArt()
  } catch {}
})
onBeforeUnmount(() => {
  stopped = true
  if (pollTimer) clearTimeout(pollTimer)
})
</script>

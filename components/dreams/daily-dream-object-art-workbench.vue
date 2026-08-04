<template>
  <section class="space-y-4">
    <div class="grid gap-4 lg:grid-cols-[minmax(15rem,0.85fr)_minmax(0,1.15fr)]">
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="slot in slots"
            :key="slot.field"
            type="button"
            class="btn btn-sm rounded-xl"
            :class="selectedField === slot.field ? 'btn-secondary' : 'btn-ghost border border-base-300'"
            @click="selectedField = slot.field"
          >
            {{ slot.label }}
          </button>
        </div>

        <figure
          class="relative min-h-64 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
          :style="{ aspectRatio: selectedSlot.aspect }"
        >
          <img
            v-if="currentSrc && !imageFailed"
            :key="currentSrc"
            :src="currentSrc"
            :alt="`${title} ${selectedSlot.label}`"
            class="absolute inset-0 size-full object-cover"
            @error="imageFailed = true"
          />
          <div
            v-else
            class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-base-content/40"
          >
            <Icon name="kind-icon:image" class="size-12 opacity-40" />
            <p class="text-sm font-bold">
              No {{ selectedSlot.label.toLowerCase() }} is attached yet.
            </p>
          </div>

          <div
            class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-base-300/95 to-transparent p-4 pt-14"
          >
            <span class="badge border-0 bg-base-100/90 font-bold backdrop-blur">
              Current {{ selectedSlot.label }}
            </span>
            <span class="badge badge-ghost bg-base-100/85 backdrop-blur">
              {{ selectedSlot.width }}×{{ selectedSlot.height }}
            </span>
          </div>
        </figure>
      </div>

      <div
        v-if="canEdit"
        class="space-y-4 rounded-2xl border border-secondary/25 bg-secondary/5 p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.16em] text-secondary">
              Art workbench
            </p>
            <h3 class="mt-1 text-lg font-black">
              Rebuild or modify {{ selectedSlot.label.toLowerCase() }} art
            </h3>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Recreate starts from the prompt. Modify uses the current image as visual guidance.
            </p>
          </div>
          <span class="badge badge-secondary rounded-xl">{{ typeLabel }}</span>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <label class="form-control gap-1">
            <span class="text-xs font-bold text-base-content/60">Method</span>
            <select
              v-model="mode"
              class="select select-bordered select-sm rounded-xl"
              :disabled="submitting"
            >
              <option value="recreate">Redo from prompt</option>
              <option value="img2img" :disabled="!currentSrc">Modify current image</option>
            </select>
          </label>

          <label class="form-control gap-1">
            <span class="text-xs font-bold text-base-content/60">Engine</span>
            <select
              v-model="engine"
              class="select select-bordered select-sm rounded-xl"
              :disabled="submitting"
            >
              <template v-if="mode === 'recreate'">
                <option value="krea2">Krea 2</option>
                <option value="comfy">SDXL</option>
              </template>
              <template v-else>
                <option value="sdxl-img2img">SDXL img2img</option>
                <option value="kontext">Kontext edit</option>
              </template>
            </select>
          </label>

          <label class="form-control gap-1">
            <span class="text-xs font-bold text-base-content/60">Strength</span>
            <select
              v-model="presetKey"
              class="select select-bordered select-sm rounded-xl"
              :disabled="submitting"
            >
              <option
                v-for="preset in availablePresets"
                :key="preset.key"
                :value="preset.key"
              >
                {{ preset.label }}
              </option>
            </select>
          </label>
        </div>

        <label class="form-control gap-1">
          <span class="text-xs font-bold text-base-content/60">Art prompt</span>
          <textarea
            v-model="prompt"
            class="textarea textarea-bordered min-h-36 rounded-xl text-sm leading-relaxed"
            maxlength="5000"
            :placeholder="promptPlaceholder"
            :disabled="submitting"
          />
          <span class="text-[0.68rem] leading-relaxed text-base-content/40">
            The object record supplies supporting context. This prompt remains the primary direction.
          </span>
        </label>

        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-100/70 p-3">
          <input
            v-model="preserveOriginal"
            type="checkbox"
            class="checkbox checkbox-secondary checkbox-sm mt-0.5"
            :disabled="submitting"
          />
          <span>
            <span class="block text-sm font-bold">Keep the current version as inspiration</span>
            <span class="block text-xs leading-relaxed text-base-content/45">
              Preserve the previous image in object history before the replacement attaches.
            </span>
          </span>
        </label>

        <div class="rounded-xl bg-base-100/70 px-3 py-2 text-xs text-base-content/55">
          <strong>{{ mode === 'recreate' ? 'Recreate' : 'Modify' }}:</strong>
          {{ engineLabel }} · {{ selectedPreset.description }}
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <p
            v-if="message"
            class="min-w-0 flex-1 text-xs leading-relaxed"
            :class="messageTone === 'error' ? 'text-error' : messageTone === 'success' ? 'text-success' : 'text-info'"
          >
            {{ message }}
          </p>
          <button
            type="button"
            class="btn btn-secondary btn-sm ml-auto gap-2 rounded-xl"
            :disabled="submitting || prompt.trim().length < 3 || (mode === 'img2img' && !currentSrc)"
            @click="queueArt"
          >
            <span v-if="submitting" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:sparkles" class="size-4" />
            {{ submitting ? 'Queuing…' : `Queue ${selectedSlot.label}` }}
          </button>
        </div>
      </div>

      <div
        v-else
        class="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-6 text-center"
      >
        <Icon name="kind-icon:lock" class="size-8 text-base-content/25" />
        <p class="font-black text-base-content/65">Artwork is view-only.</p>
        <p class="max-w-md text-sm text-base-content/45">
          Sign in as the owner or an administrator to queue a replacement or modification.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  useDailyDreamArchiveStore,
  type DailyDreamArchiveObject,
  type DailyDreamArchiveObjectType,
  type DailyDreamArtSlot,
} from '@/stores/dailyDreamArchiveStore'
import { resolveEntityArtwork } from '@/utils/artImageSrc'

type Preset = {
  key: string
  label: string
  description: string
  denoise?: number
  originalWeight?: number
  steps?: number
}

const props = defineProps<{
  objectType: DailyDreamArchiveObjectType
  entity: DailyDreamArchiveObject
  slots: DailyDreamArtSlot[]
  canEdit: boolean
}>()

const emit = defineEmits<{
  updated: []
}>()

const archiveStore = useDailyDreamArchiveStore()
const selectedField = ref(props.slots[0]?.field || 'imagePath')
const mode = ref<'recreate' | 'img2img'>('recreate')
const engine = ref('krea2')
const presetKey = ref('quality')
const prompt = ref(String(props.entity.artPrompt || ''))
const preserveOriginal = ref(true)
const submitting = ref(false)
const imageFailed = ref(false)
const message = ref('')
const messageTone = ref<'info' | 'success' | 'error'>('info')
let pollTimer: ReturnType<typeof setTimeout> | null = null
let activeJobId: number | null = null
let stopped = false

const recreatePresets: Preset[] = [
  {
    key: 'quality',
    label: 'Quality default',
    description: 'Use the current quality-focused workflow defaults.',
  },
  {
    key: 'polished',
    label: 'Polished',
    description: 'Use a slightly longer quality pass.',
    steps: 28,
  },
]

const img2imgPresets: Preset[] = [
  {
    key: 'gentle',
    label: 'Gentle refresh',
    description: 'Keep most of the original composition.',
    denoise: 0.35,
    originalWeight: 0.75,
  },
  {
    key: 'balanced',
    label: 'Balanced edit',
    description: 'Preserve identity while allowing visible changes.',
    denoise: 0.55,
    originalWeight: 0.55,
  },
  {
    key: 'strong',
    label: 'Strong redesign',
    description: 'Use the source as guidance rather than a strict template.',
    denoise: 0.75,
    originalWeight: 0.35,
  },
]

const selectedSlot = computed<DailyDreamArtSlot>(() =>
  props.slots.find((slot) => slot.field === selectedField.value) ||
  props.slots[0] || {
    field: 'imagePath',
    label: 'Image',
    width: 1024,
    height: 1024,
    aspect: '1 / 1',
  },
)

const title = computed(() =>
  String(
    props.entity.title ||
      props.entity.name ||
      `${typeLabel.value} ${props.entity.id}`,
  ),
)

const typeLabel = computed(() =>
  props.objectType.charAt(0).toUpperCase() + props.objectType.slice(1),
)

const currentSrc = computed(() => {
  const direct = normalizeSource(props.entity[selectedSlot.value.field])
  if (direct) return direct

  if (
    props.entity.artImageId &&
    ['imagePath', 'avatarImage'].includes(selectedSlot.value.field)
  ) {
    return `/api/art/images/${props.entity.artImageId}/file`
  }

  if (props.objectType === 'dream') {
    return resolveEntityArtwork(props.entity.ArtImage) || ''
  }

  return ''
})

const availablePresets = computed(() =>
  mode.value === 'recreate' ? recreatePresets : img2imgPresets,
)

const selectedPreset = computed<Preset>(
  () =>
    availablePresets.value.find((preset) => preset.key === presetKey.value) ||
    availablePresets.value[0] ||
    recreatePresets[0]!,
)

const engineLabel = computed(() => {
  if (engine.value === 'krea2') return 'Krea 2'
  if (engine.value === 'sdxl-img2img') return 'SDXL img2img'
  if (engine.value === 'kontext') return 'Kontext'
  return 'SDXL'
})

const promptPlaceholder = computed(() =>
  mode.value === 'recreate'
    ? `Describe a new ${selectedSlot.value.label.toLowerCase()} for ${title.value}…`
    : `Describe what should change while preserving the useful parts of the current ${selectedSlot.value.label.toLowerCase()}…`,
)

function normalizeSource(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return ''
  if (/^(https?:|data:image\/|\/)/.test(trimmed)) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  return `/images/${trimmed}`
}

async function queueArt(): Promise<void> {
  if (submitting.value || prompt.value.trim().length < 3) return

  submitting.value = true
  message.value = ''
  messageTone.value = 'info'

  const preset = selectedPreset.value
  const result = await archiveStore.queueObjectArt({
    objectType: props.objectType,
    entity: props.entity,
    slot: selectedSlot.value,
    prompt: prompt.value.trim(),
    mode: mode.value,
    engine: engine.value,
    preserveOriginal: preserveOriginal.value,
    denoise: preset.denoise,
    originalWeight: preset.originalWeight,
    steps: preset.steps,
  })

  submitting.value = false

  if (!result.success || !result.jobId) {
    message.value = result.message
    messageTone.value = 'error'
    return
  }

  activeJobId = result.jobId
  message.value = `${result.message} It will attach automatically when rendering finishes.`
  startPolling(result.jobId)
}

function startPolling(jobId: number): void {
  if (pollTimer) clearTimeout(pollTimer)

  const poll = async () => {
    if (stopped || activeJobId !== jobId) return

    const result = await archiveStore.fetchArtJob(jobId)
    const status = String(result.job?.status || '')

    if (result.success && status === 'DONE') {
      const artImageId = Number(result.job?.artImageId)
      if (props.objectType === 'dream') {
        if (!Number.isInteger(artImageId) || artImageId <= 0) {
          message.value = `ArtJob ${jobId} finished without an attachable ArtImage.`
          messageTone.value = 'error'
          activeJobId = null
          return
        }

        const applied = await archiveStore.applyDreamArt({
          entity: props.entity,
          slot: selectedSlot.value,
          artImageId,
          prompt: prompt.value,
          preserveOriginal: preserveOriginal.value,
        })
        if (!applied.success) {
          message.value = applied.message
          messageTone.value = 'error'
          activeJobId = null
          return
        }
      } else {
        await archiveStore.fetchArchive(true)
      }

      imageFailed.value = false
      message.value = `ArtJob ${jobId} finished and the ${selectedSlot.value.label.toLowerCase()} was replaced.`
      messageTone.value = 'success'
      activeJobId = null
      emit('updated')
      return
    }

    if (status === 'FAILED' || status === 'CANCELLED') {
      message.value = result.job?.error || `ArtJob ${jobId} ended as ${status}.`
      messageTone.value = 'error'
      activeJobId = null
      return
    }

    if (result.success) {
      message.value = `ArtJob ${jobId}: ${status || 'PENDING'}. The durable queue is still working.`
      messageTone.value = 'info'
    }

    pollTimer = setTimeout(poll, 5000)
  }

  void poll()
}

watch(mode, (nextMode) => {
  engine.value = nextMode === 'recreate' ? 'krea2' : 'sdxl-img2img'
  presetKey.value = nextMode === 'recreate' ? 'quality' : 'balanced'
})

watch(selectedField, () => {
  imageFailed.value = false
})

watch(
  () => [props.objectType, props.entity.id],
  () => {
    selectedField.value = props.slots[0]?.field || 'imagePath'
    mode.value = 'recreate'
    engine.value = 'krea2'
    presetKey.value = 'quality'
    prompt.value = String(props.entity.artPrompt || '')
    preserveOriginal.value = true
    imageFailed.value = false
    message.value = ''
    activeJobId = null
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  },
)

onBeforeUnmount(() => {
  stopped = true
  if (pollTimer) clearTimeout(pollTimer)
})
</script>

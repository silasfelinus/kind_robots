<!-- /components/art/artjob-editor.vue -->
<template>
  <div
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-3"
    role="dialog"
    aria-modal="true"
    aria-labelledby="artjob-editor-title"
    @click.self="emit('close')"
  >
    <div
      class="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-2xl"
    >
      <div class="flex items-start justify-between gap-3 border-b border-base-300 p-4">
        <div>
          <h3 id="artjob-editor-title" class="text-lg font-semibold">
            {{ editorTitle }}
          </h3>
          <p class="mt-1 text-xs text-base-content/60">
            {{ actionHint }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm"
          aria-label="Close ArtJob editor"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div
          v-if="localError"
          class="mb-3 rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
        >
          {{ localError }}
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div class="flex min-w-0 flex-col gap-4">
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">Prompt</span>
              <textarea
                v-model="form.promptString"
                rows="8"
                class="textarea textarea-bordered w-full rounded-2xl text-sm leading-relaxed"
                placeholder="Describe the visible subject, action, setting, composition, mood, and concrete rendering style."
              />
              <span class="text-[11px] text-base-content/50">
                Image ids and phrases like “Kind Robots style” are rejected as insufficient context.
              </span>
            </label>

            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">Negative prompt</span>
              <textarea
                v-model="form.negativePrompt"
                rows="3"
                class="textarea textarea-bordered w-full rounded-2xl text-sm"
                placeholder="Artifacts or traits to avoid"
              />
            </label>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Width</span>
                <input
                  v-model="form.width"
                  type="number"
                  min="64"
                  step="8"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Height</span>
                <input
                  v-model="form.height"
                  type="number"
                  min="64"
                  step="8"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Seed</span>
                <input
                  v-model="form.seed"
                  type="number"
                  class="input input-bordered input-sm rounded-xl"
                  placeholder="blank = random"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Steps</span>
                <input
                  v-model="form.steps"
                  type="number"
                  min="1"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">CFG</span>
                <input
                  v-model="form.cfg"
                  type="number"
                  min="0"
                  step="0.1"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Guidance</span>
                <input
                  v-model="form.guidance"
                  type="number"
                  min="0"
                  step="0.1"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Denoise</span>
                <input
                  v-model="form.denoise"
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Sampler</span>
                <input
                  v-model="form.sampler"
                  list="artjob-sampler-presets"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold">Scheduler</span>
                <input
                  v-model="form.scheduler"
                  list="artjob-scheduler-presets"
                  class="input input-bordered input-sm rounded-xl"
                />
              </label>
            </div>

            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">Checkpoint / diffusion model</span>
              <input
                v-model="form.checkpoint"
                list="artjob-checkpoint-presets"
                class="input input-bordered rounded-2xl"
                placeholder="Keep the current model or choose a preset"
              />
              <span class="text-[11px] text-base-content/50">
                Engine presets replace this with a compatible default. You can still type another installed model filename.
              </span>
            </label>
          </div>

          <aside class="flex flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200/40 p-3">
              <label class="flex flex-col gap-1 text-sm">
                <span class="font-semibold">Engine preset</span>
                <select
                  v-model="preset"
                  class="select select-bordered rounded-2xl"
                  @change="applyPreset"
                >
                  <option
                    v-for="option in enginePresets"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <p class="mt-2 text-xs leading-relaxed text-base-content/60">
                {{ selectedPreset.hint }}
              </p>
              <dl class="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div class="rounded-xl bg-base-100 p-2">
                  <dt class="text-base-content/50">Current engine</dt>
                  <dd class="font-semibold">{{ job.engine }}</dd>
                </div>
                <div class="rounded-xl bg-base-100 p-2">
                  <dt class="text-base-content/50">Status</dt>
                  <dd class="font-semibold">{{ job.status }}</dd>
                </div>
                <div class="rounded-xl bg-base-100 p-2">
                  <dt class="text-base-content/50">Job</dt>
                  <dd class="font-mono font-semibold">#{{ job.id }}</dd>
                </div>
                <div class="rounded-xl bg-base-100 p-2">
                  <dt class="text-base-content/50">ArtImage</dt>
                  <dd class="font-mono font-semibold">
                    {{ job.artImageId ? `#${job.artImageId}` : 'none' }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="rounded-2xl border border-info/30 bg-info/10 p-3 text-xs leading-relaxed">
              <strong>{{ actionLabel }}</strong>
              <p class="mt-1">{{ actionDescription }}</p>
            </div>

            <div class="rounded-2xl border border-base-300 p-3 text-xs">
              <div class="font-semibold">Preset defaults</div>
              <div class="mt-2 flex flex-wrap gap-1">
                <span class="badge badge-outline badge-sm rounded-2xl">
                  {{ form.steps || '—' }} steps
                </span>
                <span class="badge badge-outline badge-sm rounded-2xl">
                  CFG {{ form.cfg || '—' }}
                </span>
                <span class="badge badge-outline badge-sm rounded-2xl">
                  {{ form.sampler || 'sampler default' }}
                </span>
                <span class="badge badge-outline badge-sm rounded-2xl">
                  {{ form.scheduler || 'scheduler default' }}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4">
        <p class="text-xs text-base-content/50">
          Blank seed = fresh random seed. Other blank numeric/model fields keep the current value unless an engine preset supplies defaults.
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-2xl"
            :disabled="saving"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-2xl"
            :disabled="saving"
            @click="save"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs" />
            {{ actionLabel }}
          </button>
        </div>
      </div>
    </div>

    <datalist id="artjob-sampler-presets">
      <option value="euler" />
      <option value="euler_ancestral" />
      <option value="dpmpp_2m" />
      <option value="dpmpp_2m_sde" />
      <option value="heun" />
    </datalist>
    <datalist id="artjob-scheduler-presets">
      <option value="simple" />
      <option value="beta" />
      <option value="normal" />
      <option value="karras" />
      <option value="sgm_uniform" />
    </datalist>
    <datalist id="artjob-checkpoint-presets">
      <option
        v-for="option in enginePresets.filter((entry) => entry.checkpoint)"
        :key="option.checkpoint"
        :value="option.checkpoint"
      />
    </datalist>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  useArtJobStore,
  type ArtJobOverrides,
  type ArtJobRecord,
  type ArtJobRetryMode,
} from '@/stores/artJobStore'

type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'
type JsonRecord = Record<string, unknown>
type Preset = {
  value: string
  label: string
  hint: string
  checkpoint: string
  steps: string
  cfg: string
  guidance: string
  denoise: string
  sampler: string
  scheduler: string
}

const props = defineProps<{
  job: ArtJobRecord
  action: EditorAction
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const artJobStore = useArtJobStore()
const localError = ref('')
const preset = ref('keep')

const enginePresets: Preset[] = [
  {
    value: 'keep',
    label: 'Keep current engine',
    hint: 'Keep the existing workflow and patch only the fields you edit.',
    checkpoint: '',
    steps: '',
    cfg: '',
    guidance: '',
    denoise: '',
    sampler: '',
    scheduler: '',
  },
  {
    value: 'krea2',
    label: 'Krea 2 Turbo',
    hint: 'Fast, highly creative illustration preset built for the installed 12 GB workflow.',
    checkpoint: 'Krea-2-Turbo-Q5_K_S.gguf',
    steps: '8',
    cfg: '1',
    guidance: '',
    denoise: '1',
    sampler: 'euler',
    scheduler: 'simple',
  },
  {
    value: 'flux2',
    label: 'Flux.2 Klein 4B',
    hint: 'Four-step structured prompt model with a compact Apache-2.0 workflow.',
    checkpoint: 'flux-2-klein-4b-Q4_K_M.gguf',
    steps: '4',
    cfg: '1',
    guidance: '',
    denoise: '1',
    sampler: 'euler',
    scheduler: 'simple',
  },
  {
    value: 'flux',
    label: 'Flux.1 Dev',
    hint: 'Slower high-detail Flux workflow using the corrected T5-XXL encoder path.',
    checkpoint: 'flux1-dev-Q8_0.gguf',
    steps: '30',
    cfg: '1',
    guidance: '3.5',
    denoise: '1',
    sampler: 'euler',
    scheduler: 'beta',
  },
  {
    value: 'sdxl',
    label: 'Comfy checkpoint workflow',
    hint: 'Traditional checkpoint workflow with broader sampler and LoRA compatibility.',
    checkpoint: 'v1-5-pruned-emaonly.safetensors',
    steps: '20',
    cfg: '3',
    guidance: '',
    denoise: '1',
    sampler: 'euler',
    scheduler: 'normal',
  },
]

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function scalar(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function nestedScalar(value: unknown, keys: string[], depth = 0): string {
  if (depth > 6 || value === null || value === undefined) return ''
  if (Array.isArray(value)) {
    for (const child of value) {
      const result = nestedScalar(child, keys, depth + 1)
      if (result) return result
    }
    return ''
  }

  const record = asRecord(value)
  for (const key of keys) {
    const direct = scalar(record[key])
    if (direct) return direct
  }
  for (const child of Object.values(record)) {
    const result = nestedScalar(child, keys, depth + 1)
    if (result) return result
  }
  return ''
}

function payloadScalar(keys: string[]): string {
  const payload = asRecord(props.job.payload)
  for (const key of keys) {
    const direct = scalar(payload[key])
    if (direct) return direct
  }
  return nestedScalar(payload.workflow, keys)
}

function workflowPrompt(kind: 'positive' | 'negative'): string {
  const workflow = asRecord(asRecord(props.job.payload).workflow)
  for (const value of Object.values(workflow)) {
    const node = asRecord(value)
    const classType = scalar(node.class_type).toLowerCase()
    const inputs = asRecord(node.inputs)
    const title = scalar(asRecord(node._meta).title).toLowerCase()
    const isNegative = title.includes('negative')
    if (kind === 'negative' && !isNegative) continue
    if (kind === 'positive' && isNegative) continue
    if (!classType.includes('clip') && !classType.includes('wildcard')) continue
    const text =
      scalar(inputs.text) ||
      scalar(inputs.wildcard_text) ||
      scalar(inputs.populated_text) ||
      scalar(inputs.t5xxl) ||
      scalar(inputs.clip_l)
    if (text) return text
  }
  return ''
}

const form = reactive({
  promptString:
    payloadScalar(['promptString', 'artPrompt', 'positivePrompt', 'prompt']) ||
    workflowPrompt('positive'),
  negativePrompt:
    payloadScalar(['negativePrompt', 'negative_prompt', 'negative']) ||
    workflowPrompt('negative'),
  width: payloadScalar(['width']),
  height: payloadScalar(['height']),
  steps: payloadScalar(['steps']),
  cfg: payloadScalar(['cfg', 'cfg_scale']),
  guidance: payloadScalar(['guidance']),
  denoise: payloadScalar(['denoise']),
  seed: '',
  sampler: payloadScalar(['sampler', 'sampler_name']),
  scheduler: payloadScalar(['scheduler']),
  checkpoint: payloadScalar([
    'checkpoint',
    'ckpt_name',
    'unet_name',
    'model_name',
  ]),
})

const selectedPreset = computed(
  () => enginePresets.find((option) => option.value === preset.value) ?? enginePresets[0]!,
)
const saving = computed(
  () =>
    artJobStore.editingJobIds.includes(props.job.id) ||
    artJobStore.retryingJobIds.includes(props.job.id),
)
const editorTitle = computed(() => {
  if (props.action === 'EDIT') return `Edit queued job #${props.job.id}`
  if (props.action === 'OVERWRITE') {
    return `Replace ArtImage #${props.job.artImageId} from job #${props.job.id}`
  }
  return `Create an edited output from job #${props.job.id}`
})
const actionLabel = computed(() => {
  if (props.action === 'EDIT') return 'Save & queue'
  if (props.action === 'OVERWRITE') return 'Generate & replace'
  return 'Queue new output'
})
const actionHint = computed(() => {
  if (props.action === 'EDIT') {
    return 'The same pending, failed, or cancelled job is updated and returned to PENDING.'
  }
  if (props.action === 'OVERWRITE') {
    return 'The replacement preserves the canonical ArtImage id and archives the current render.'
  }
  return 'The original job and ArtImage remain unchanged; this creates a separate attempt.'
})
const actionDescription = computed(() => {
  if (props.action === 'EDIT') {
    return 'No duplicate queue row is created. Failed state, claims, errors, and attempts are cleared.'
  }
  if (props.action === 'OVERWRITE') {
    return 'Use this when the generic render already landed in a linked ArtImage that needs repair in place.'
  }
  return 'Use this for running or completed jobs when you want another candidate without replacing the existing image.'
})

function applyPreset(): void {
  const selected = selectedPreset.value
  if (selected.value === 'keep') return
  form.checkpoint = selected.checkpoint
  form.steps = selected.steps
  form.cfg = selected.cfg
  form.guidance = selected.guidance
  form.denoise = selected.denoise
  form.sampler = selected.sampler
  form.scheduler = selected.scheduler
  form.seed = ''
}

function numberValue(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

async function save(): Promise<void> {
  localError.value = ''
  const prompt = form.promptString.replace(/\s+/g, ' ').trim()
  if (!prompt) {
    localError.value = 'A specific prompt is required.'
    return
  }

  const overrides: ArtJobOverrides = {
    promptString: prompt,
    negativePrompt: form.negativePrompt.trim(),
  }

  const numeric: Array<[keyof ArtJobOverrides, string]> = [
    ['width', form.width],
    ['height', form.height],
    ['steps', form.steps],
    ['cfg', form.cfg],
    ['guidance', form.guidance],
    ['denoise', form.denoise],
    ['seed', form.seed],
  ]
  for (const [key, value] of numeric) {
    const parsed = numberValue(value)
    if (parsed !== null) overrides[key] = parsed as never
  }

  if (form.sampler.trim()) overrides.sampler = form.sampler.trim()
  if (form.scheduler.trim()) overrides.scheduler = form.scheduler.trim()
  if (form.checkpoint.trim()) overrides.checkpoint = form.checkpoint.trim()

  const options = {
    refreshSeed: !form.seed.trim(),
    preset: preset.value === 'keep' ? null : preset.value,
    overrides,
  }

  let success = false
  if (props.action === 'EDIT') {
    success = await artJobStore.editJob(props.job.id, options)
  } else {
    const mode: ArtJobRetryMode =
      props.action === 'OVERWRITE' ? 'OVERWRITE' : 'NEW_OUTPUT'
    success = Boolean(await artJobStore.reenqueueJob(props.job.id, mode, options))
  }

  if (success) {
    emit('saved')
    emit('close')
  } else {
    localError.value = artJobStore.error || 'The ArtJob could not be queued.'
  }
}
</script>

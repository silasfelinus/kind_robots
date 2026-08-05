<!-- /components/art/artjob-queue-card.vue -->
<template>
  <article
    class="flex min-w-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/30 p-3"
  >
    <div class="flex min-w-0 gap-3">
      <a
        v-if="jobImageSrc && canShowJobContent"
        :href="jobImageSrc"
        target="_blank"
        rel="noopener"
        class="shrink-0"
        :title="`Open ArtImage ${job.artImageId}`"
      >
        <img
          :src="jobImageSrc"
          alt="Generated ArtJob output"
          class="h-28 w-24 rounded-2xl border border-base-300 object-cover"
          data-missing-image-report="false"
        />
      </a>
      <div
        v-else
        class="flex h-28 w-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 px-2 text-center text-[10px] font-semibold uppercase text-base-content/40"
      >
        {{ canShowJobContent ? job.status : 'Mature hidden' }}
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1">
          <span class="font-mono text-xs font-semibold">#{{ job.id }}</span>
          <span
            class="badge badge-xs rounded-2xl"
            :class="jobStatusClass(job.status)"
          >
            {{ job.status }}
          </span>
          <span class="badge badge-outline badge-xs rounded-2xl">{{
            job.engine
          }}</span>
          <span
            class="badge badge-xs rounded-2xl"
            :class="jobVisibility.isMature ? 'badge-warning' : 'badge-outline'"
          >
            {{ jobVisibility.isMature ? 'Mature' : 'General' }}
          </span>
          <span
            class="badge badge-xs rounded-2xl"
            :class="
              jobVisibility.isPublic
                ? 'badge-success badge-outline'
                : 'badge-neutral'
            "
          >
            {{ jobVisibility.isPublic ? 'Public' : 'Private' }}
          </span>
          <span
            v-if="job.projectSlug"
            class="badge badge-secondary badge-xs rounded-2xl"
          >
            {{ job.projectSlug }}
          </span>
          <span
            v-if="job.priority > 0"
            class="badge badge-accent badge-xs rounded-2xl"
          >
            Priority {{ job.priority }}
          </span>
        </div>
        <p
          v-if="canShowJobContent"
          class="mt-2 line-clamp-5 whitespace-pre-wrap text-sm font-medium leading-relaxed"
        >
          {{ jobPrompt || 'Prompt unavailable.' }}
        </p>
        <p
          v-else
          class="mt-2 rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs text-warning-content"
        >
          Mature prompt and preview are hidden by your account setting.
        </p>
        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="setting in jobSettings.slice(0, 6)"
            :key="setting"
            class="badge badge-ghost badge-sm h-auto rounded-2xl py-1 text-[10px]"
          >
            {{ setting }}
          </span>
        </div>
        <p class="mt-2 text-[11px] text-base-content/50">
          {{ formatDateTime(job.createdAt) }} · attempt {{ job.attempts }} ·
          priority {{ job.priority }}
        </p>
      </div>
    </div>

    <div
      v-if="job.error"
      class="rounded-2xl border border-error/30 bg-error/10 p-2 text-xs text-error"
    >
      {{ job.error }}
    </div>

    <details class="rounded-2xl border border-base-300 bg-base-100">
      <summary class="cursor-pointer px-3 py-2 text-xs font-semibold">
        Full prompt and generation fields
      </summary>
      <div class="flex flex-col gap-3 border-t border-base-300 p-3 text-xs">
        <div
          v-if="!canShowJobContent"
          class="rounded-xl border border-warning/30 bg-warning/10 p-3 text-warning-content"
        >
          Enable mature content in your account settings to view or edit this
          job's prompt and preview.
        </div>
        <template v-else>
          <div>
            <div
              class="font-semibold uppercase tracking-wide text-base-content/50"
            >
              Prompt
            </div>
            <p class="mt-1 whitespace-pre-wrap leading-relaxed">
              {{ jobPrompt }}
            </p>
          </div>
          <div>
            <div
              class="font-semibold uppercase tracking-wide text-base-content/50"
            >
              Negative prompt
            </div>
            <p class="mt-1 whitespace-pre-wrap text-base-content/70">
              {{ jobNegativePrompt || 'None' }}
            </p>
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="setting in jobSettings"
              :key="setting"
              class="badge badge-outline badge-sm h-auto rounded-2xl py-1 text-[10px]"
            >
              {{ setting }}
            </span>
          </div>
        </template>
      </div>
    </details>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-2xl"
        :disabled="!jobPrompt || !canShowJobContent"
        :title="
          canShowJobContent
            ? 'Copy prompt'
            : 'Enable mature content to reveal this prompt'
        "
        @click="handleCopy"
      >
        {{ copied ? 'Copied' : 'Copy prompt' }}
      </button>

      <div class="flex flex-wrap items-center gap-1">
        <button
          v-if="job.status === 'PENDING'"
          type="button"
          class="btn btn-xs rounded-2xl"
          :class="job.priority > 0 ? 'btn-outline' : 'btn-accent'"
          :disabled="priorityStore.prioritizingJobIds.includes(job.id)"
          @click="togglePriority"
        >
          <span
            v-if="priorityStore.prioritizingJobIds.includes(job.id)"
            class="loading loading-spinner loading-xs"
          />
          {{ job.priority > 0 ? 'Normal priority' : 'Move to front' }}
        </button>
        <button
          v-if="isEditableInPlace"
          type="button"
          class="btn btn-primary btn-xs rounded-2xl"
          :disabled="!canShowJobContent"
          @click="emit('edit', job, 'EDIT')"
        >
          Edit & queue
        </button>
        <button
          v-else-if="job.status === 'RUNNING'"
          type="button"
          class="btn btn-primary btn-xs rounded-2xl"
          :disabled="!canShowJobContent"
          @click="emit('edit', job, 'NEW_OUTPUT')"
        >
          Edit as new job
        </button>
        <button
          v-if="job.status === 'DONE'"
          type="button"
          class="btn btn-primary btn-xs rounded-2xl"
          :disabled="!canShowJobContent"
          @click="emit('edit', job, 'NEW_OUTPUT')"
        >
          Edited output
        </button>
        <button
          v-if="job.status === 'DONE' && job.artImageId"
          type="button"
          class="btn btn-warning btn-xs rounded-2xl"
          :disabled="!canShowJobContent"
          @click="emit('edit', job, 'OVERWRITE')"
        >
          Edit & replace
        </button>
        <button
          v-if="job.status === 'FAILED'"
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl"
          @click="artJobStore.requeueJob(job.id)"
        >
          Resume unchanged
        </button>
        <button
          v-if="
            job.status === 'PENDING' ||
            job.status === 'RUNNING' ||
            job.status === 'FAILED'
          "
          type="button"
          class="btn btn-ghost btn-xs rounded-2xl text-error"
          @click="artJobStore.cancelJob(job.id)"
        >
          {{ job.status === 'FAILED' ? 'Clear failure' : 'Cancel' }}
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtJobStore, type ArtJobRecord } from '@/stores/artJobStore'
import { useArtJobPriorityStore } from '@/stores/artJobPriorityStore'
import { useArtStore } from '@/stores/artStore'
import { resolveMaturityPrivacy } from '@/utils/maturityPrivacy'

type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'
type JsonRecord = Record<string, unknown>

const props = defineProps<{
  job: ArtJobRecord
}>()

const emit = defineEmits<{
  edit: [job: ArtJobRecord, action: EditorAction]
}>()

const artJobStore = useArtJobStore()
const priorityStore = useArtJobPriorityStore()
const artStore = useArtStore()
const copied = ref(false)

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

function payloadScalar(job: ArtJobRecord, keys: string[]): string {
  const payload = asRecord(job.payload)
  for (const key of keys) {
    const direct = scalar(payload[key])
    if (direct) return direct
  }
  return nestedScalar(payload.workflow, keys)
}

function workflowPrompt(
  job: ArtJobRecord,
  kind: 'positive' | 'negative',
): string {
  const workflow = asRecord(asRecord(job.payload).workflow)
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

const jobPrompt = computed<string>(
  () =>
    payloadScalar(props.job, [
      'promptString',
      'artPrompt',
      'positivePrompt',
      'prompt',
    ]) || workflowPrompt(props.job, 'positive'),
)

const jobNegativePrompt = computed<string>(
  () =>
    payloadScalar(props.job, [
      'negativePrompt',
      'negative_prompt',
      'negative',
    ]) || workflowPrompt(props.job, 'negative'),
)

const jobVisibility = computed(() =>
  resolveMaturityPrivacy(asRecord(asRecord(props.job.payload).save)),
)

const canShowJobContent = computed<boolean>(
  () => !jobVisibility.value.isMature || artStore.showMature,
)

const jobSettings = computed<string[]>(() => {
  const job = props.job
  const values = [
    [
      'size',
      `${payloadScalar(job, ['width'])}×${payloadScalar(job, ['height'])}`,
    ],
    [
      'model',
      payloadScalar(job, [
        'checkpoint',
        'ckpt_name',
        'unet_name',
        'model_name',
      ]),
    ],
    ['sampler', payloadScalar(job, ['sampler', 'sampler_name'])],
    ['scheduler', payloadScalar(job, ['scheduler'])],
    ['steps', payloadScalar(job, ['steps'])],
    ['cfg', payloadScalar(job, ['cfg', 'cfg_scale'])],
    ['guidance', payloadScalar(job, ['guidance'])],
    ['denoise', payloadScalar(job, ['denoise'])],
    ['seed', payloadScalar(job, ['seed', 'noise_seed'])],
  ]

  return values
    .filter(([, value]) => value && value !== '×')
    .map(([label, value]) => `${label}: ${value}`)
})

const jobImageSrc = computed<string>(() => {
  const job = props.job
  if (typeof job.artImageId !== 'number') return ''
  return artJobStore.imageSrcById[job.artImageId] || ''
})

const isEditableInPlace = computed<boolean>(() =>
  ['PENDING', 'FAILED', 'CANCELLED'].includes(props.job.status),
)

async function handleCopy(): Promise<void> {
  if (!canShowJobContent.value) return
  const prompt = jobPrompt.value
  if (!prompt || !navigator.clipboard) return
  await navigator.clipboard.writeText(prompt)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1500)
}

async function togglePriority(): Promise<void> {
  if (props.job.priority > 0) {
    await priorityStore.returnToNormal(props.job.id)
    return
  }
  await priorityStore.moveToFront(props.job.id)
}

function jobStatusClass(status: string): string {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED') return 'badge-error'
  if (status === 'RUNNING') return 'badge-info'
  if (status === 'CANCELLED') return 'badge-ghost'
  return 'badge-warning'
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

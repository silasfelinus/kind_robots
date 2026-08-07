<!-- /components/art/artjob-trainer-redo-controls.vue -->
<template>
  <details class="mt-3 rounded-2xl border border-warning/30 bg-warning/5 p-3">
    <summary class="cursor-pointer list-none text-xs font-semibold marker:hidden">
      <span class="flex flex-wrap items-center justify-between gap-2">
        <span>Revise and queue a real redo</span>
        <span class="badge badge-warning badge-outline badge-sm rounded-2xl">
          priority 100
        </span>
      </span>
    </summary>

    <div class="mt-3 space-y-3">
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="form-control gap-1">
          <span class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
            Method
          </span>
          <select
            v-model="mode"
            class="select select-bordered select-sm rounded-xl"
            :disabled="submitting"
          >
            <option value="TEXT">Prompt-only redo</option>
            <option value="IMG2IMG" :disabled="!canUseImage">
              Use finished image as base
            </option>
          </select>
        </label>

        <label v-if="mode === 'IMG2IMG'" class="form-control gap-1">
          <span class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
            Model
          </span>
          <select
            v-model="model"
            class="select select-bordered select-sm rounded-xl"
            :disabled="submitting"
          >
            <option value="SDXL">SDXL img2img</option>
            <option value="KONTEXT">Kontext edit · slower</option>
          </select>
        </label>

        <div
          v-else
          class="rounded-xl border border-base-300 bg-base-100/70 px-3 py-2 text-xs text-base-content/55"
        >
          <span class="font-semibold">Model:</span> SDXL · prompt only
        </div>
      </div>

      <label class="form-control gap-1">
        <span class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50">
          Revised prompt
        </span>
        <textarea
          v-model="promptString"
          class="textarea textarea-bordered min-h-28 w-full rounded-xl text-xs leading-relaxed"
          maxlength="5000"
          :disabled="submitting"
          placeholder="Edit the original prompt into the version you actually want rendered…"
        />
      </label>

      <p class="text-[11px] leading-relaxed text-base-content/50">
        Prompt-only rebuilds from text. Image-guided uses this job’s finished ArtImage as the input while preserving the source job’s retry/destination lineage.
      </p>

      <p v-if="message" class="text-xs" :class="messageToneClass">
        {{ message }}
      </p>

      <button
        type="button"
        class="btn btn-warning btn-sm w-full rounded-xl"
        :disabled="submitting || promptString.trim().length < 3"
        @click="queueRevision"
      >
        <span v-if="submitting" class="loading loading-spinner loading-xs" />
        {{ submitting ? 'Queuing revision…' : 'Revise + queue redo' }}
      </button>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useArtJobStore,
  type ArtJobRecord,
} from '@/stores/artJobStore'
import {
  useArtTrainerStore,
  type ArtTrainerRedoMode,
  type ArtTrainerRedoModel,
} from '@/stores/artTrainerStore'

const props = defineProps<{
  job: ArtJobRecord
  summary?: string | null
  tags?: string[]
}>()

const artJobStore = useArtJobStore()
const trainerStore = useArtTrainerStore()
const mode = ref<ArtTrainerRedoMode>('TEXT')
const model = ref<ArtTrainerRedoModel>('SDXL')
const promptString = ref(readJobPrompt(props.job))
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const submitting = computed(() => trainerStore.isSubmitting(props.job.id))
const canUseImage = computed(() => {
  return (
    typeof props.job.artImageId === 'number' &&
    props.job.artImageId > 0 &&
    String(props.job.payload?.media || '').toLowerCase() !== 'video'
  )
})
const messageToneClass = computed(() =>
  messageTone.value === 'error' ? 'text-error' : 'text-success',
)

watch(
  () => props.job.id,
  () => {
    mode.value = 'TEXT'
    model.value = 'SDXL'
    promptString.value = readJobPrompt(props.job)
    message.value = ''
  },
)

watch(canUseImage, (allowed) => {
  if (!allowed && mode.value === 'IMG2IMG') mode.value = 'TEXT'
})

function readJobPrompt(job: ArtJobRecord): string {
  const payload: Record<string, unknown> = job.payload || {}
  for (const key of ['promptString', 'artPrompt', 'prompt']) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

async function queueRevision(): Promise<void> {
  if (submitting.value) return
  message.value = ''

  const result = await trainerStore.queueRedo(props.job, {
    mode: mode.value,
    model: model.value,
    promptString: promptString.value,
  })

  if (!result.success || !result.jobId) {
    message.value = result.message
    messageTone.value = 'error'
    return
  }

  const feedbackSaved = await artJobStore.submitFeedback(props.job.id, {
    source: 'HUMAN',
    verdict: 'REVISE',
    summary: props.summary?.trim() || null,
    reasons: [
      `Queued trainer redo ArtJob ${result.jobId}`,
      mode.value === 'IMG2IMG'
        ? `${model.value} image-guided revision`
        : 'SDXL prompt-only revision',
    ],
    tags: props.tags || [],
    rubricKey: 'silas-art-trainer-v2',
  })

  if (!feedbackSaved) {
    message.value = `ArtJob ${result.jobId} was queued, but saving the trainer verdict failed.`
    messageTone.value = 'error'
    return
  }

  message.value = `Queued ArtJob ${result.jobId} at priority 100.`
  messageTone.value = 'success'
}
</script>

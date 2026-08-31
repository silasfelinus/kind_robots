<!-- /components/art/artjob-queue-card.vue -->
<template>
  <article
    class="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200/30"
  >
    <div
      v-if="job.status === 'DONE'"
      class="relative flex aspect-[4/3] min-h-52 w-full items-center justify-center overflow-hidden bg-base-100"
    >
      <a
        v-if="jobImageSrc && canShowJobContent"
        :href="jobImageSrc"
        target="_blank"
        rel="noopener"
        class="block h-full w-full"
        :title="`Open ArtImage ${job.artImageId}`"
      >
        <video
          v-if="jobImageKind === 'video'"
          :src="jobImageSrc"
          class="h-full w-full object-contain"
          muted
          playsinline
          preload="metadata"
        />
        <img
          v-else
          :src="jobImageSrc"
          alt="Generated ArtJob output"
          class="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          data-missing-image-report="false"
        />
      </a>

      <div
        v-else
        class="flex h-full w-full flex-col items-center justify-center gap-3 kr-panel-flat border-dashed p-5 text-center"
      >
        <span
          class="text-xs font-black uppercase tracking-widest text-base-content/35"
        >
          {{ canShowJobContent ? previewPlaceholder : 'Mature hidden' }}
        </span>
        <button
          v-if="canLoadProtectedPreview"
          type="button"
          class="btn btn-outline btn-sm rounded-2xl"
          :disabled="isLoadingPreview"
          @click="loadProtectedPreview"
        >
          <span
            v-if="isLoadingPreview"
            class="loading loading-spinner loading-xs"
          />
          {{ isLoadingPreview ? 'Loading preview' : 'Load protected preview' }}
        </button>
        <p
          v-if="!canShowJobContent"
          class="max-w-sm text-xs text-warning-content"
        >
          Enable mature content in your account settings to reveal this job.
        </p>
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span class="badge badge-neutral badge-sm rounded-2xl font-mono">
          #{{ job.id }}
        </span>
        <span
          class="badge badge-sm rounded-2xl"
          :class="jobStatusClass(job.status)"
        >
          {{ job.status }}
        </span>
      </div>

      <div
        class="absolute right-2 top-2 flex max-w-[65%] flex-wrap justify-end gap-1"
      >
        <span
          v-if="job.entityType"
          class="badge badge-outline badge-sm rounded-2xl"
        >
          {{ job.entityType }}
        </span>
        <span
          v-if="job.entityId"
          class="badge badge-outline badge-sm rounded-2xl font-mono"
        >
          #{{ job.entityId }}
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3 p-4">
      <div class="flex min-w-0 items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-black text-base-content">
            {{ job.label || `ArtJob #${job.id}` }}
          </p>
          <p class="mt-0.5 truncate text-xs text-base-content/50">
            {{ job.prompt || 'No prompt recorded' }}
          </p>
        </div>
        <span class="shrink-0 text-xs text-base-content/45">
          {{ formatAge(job.createdAt) }}
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 text-xs">
        <span v-if="job.engine" class="badge badge-ghost badge-sm rounded-xl">
          {{ job.engine }}
        </span>
        <span v-if="job.model" class="badge badge-ghost badge-sm rounded-xl">
          {{ job.model }}
        </span>
        <span
          v-if="job.durationSeconds"
          class="badge badge-ghost badge-sm rounded-xl"
        >
          {{ job.durationSeconds }}s
        </span>
      </div>

      <p v-if="job.error" class="line-clamp-3 text-xs leading-relaxed text-error">
        {{ job.error }}
      </p>

      <div class="mt-auto flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          v-if="canRetry"
          type="button"
          class="btn btn-outline btn-xs rounded-xl"
          :disabled="busy"
          @click="$emit('retry', job.id)"
        >
          Retry
        </button>
        <button
          v-if="canCancel"
          type="button"
          class="btn btn-ghost btn-xs rounded-xl text-warning"
          :disabled="busy"
          @click="$emit('cancel', job.id)"
        >
          Cancel
        </button>
        <button
          v-if="canDelete"
          type="button"
          class="btn btn-ghost btn-xs rounded-xl text-error"
          :disabled="busy"
          @click="$emit('delete', job.id)"
        >
          Delete
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ArtJob } from '@/stores/artJobStore'

const props = defineProps<{
  job: ArtJob
  busy?: boolean
  jobImageSrc?: string
  jobImageKind?: 'image' | 'video'
  canShowJobContent?: boolean
  canLoadProtectedPreview?: boolean
  isLoadingPreview?: boolean
  previewPlaceholder?: string
}>()

const emit = defineEmits<{
  retry: [id: number]
  cancel: [id: number]
  delete: [id: number]
  loadProtectedPreview: [id: number]
}>()

const canRetry = computed(() =>
  ['FAILED', 'CANCELLED'].includes(props.job.status),
)
const canCancel = computed(() =>
  ['PENDING', 'QUEUED', 'RUNNING'].includes(props.job.status),
)
const canDelete = computed(() =>
  ['DONE', 'FAILED', 'CANCELLED'].includes(props.job.status),
)

function loadProtectedPreview(): void {
  emit('loadProtectedPreview', props.job.id)
}

function jobStatusClass(status: string): string {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED') return 'badge-error'
  if (status === 'RUNNING') return 'badge-info'
  if (status === 'CANCELLED') return 'badge-warning'
  return 'badge-neutral'
}

function formatAge(value: string | Date): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const delta = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
</script>

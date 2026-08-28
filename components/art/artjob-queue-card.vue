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
        class="flex h-full w-full flex-col items-center justify-center gap-3 border-dashed border-base-300 bg-base-100 p-5 text-center"
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
        <span class="badge badge-outline badge-sm rounded-2xl">
          {{ job.engine }}
        </span>
        <span
          v-if="job.priority > 0"
          class="badge badge-accent badge-sm rounded-2xl"
        >
          Priority {{ job.priority }}
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3 p-3">
      <div
        v-if="job.status !== 'DONE'"
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex flex-wrap gap-1">
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
        <div class="flex flex-wrap justify-end gap-1">
          <span class="badge badge-outline badge-sm rounded-2xl">
            {{ job.engine }}
          </span>
          <span
            v-if="job.priority > 0"
            class="badge badge-accent badge-sm rounded-2xl"
          >
            Priority {{ job.priority }}
          </span>
        </div>
      </div>

      <div class="min-w-0">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-base font-black" :title="jobTitle">
              {{ jobTitle }}
            </h3>
            <p
              v-if="jobPageLabel"
              class="mt-0.5 truncate text-xs font-semibold text-primary"
              :title="jobPageLabel"
            >
              Destination · {{ jobPageLabel }}
            </p>
          </div>
          <span
            v-if="jobVariant"
            class="badge badge-ghost badge-sm rounded-2xl"
          >
            {{ jobVariant }}
          </span>
        </div>

        <p
          v-if="jobImagePath"
          class="mt-1 truncate font-mono text-[10px] text-base-content/45"
          :title="jobImagePath"
        >
          {{ jobImagePath }}
        </p>
      </div>

      <div class="flex flex-wrap gap-1">
        <span
          class="badge badge-sm rounded-2xl"
          :class="jobVisibility.isMature ? 'badge-warning' : 'badge-outline'"
        >
          {{ jobVisibility.isMature ? 'Mature' : 'General' }}
        </span>
        <span
          class="badge badge-sm rounded-2xl"
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
          class="badge badge-secondary badge-sm rounded-2xl"
        >
          {{ job.projectSlug }}
        </span>
        <span
          v-if="jobRequestId"
          class="badge badge-ghost badge-sm max-w-full truncate rounded-2xl"
          :title="jobRequestId"
        >
          {{ jobRequestId }}
        </span>
      </div>

      <p
        v-if="canShowJobContent"
        class="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed"
      >
        {{ jobPrompt || 'Prompt unavailable.' }}
      </p>
      <p
        v-else
        class="rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs text-warning-content"
      >
        Mature prompt and preview are hidden by your account setting.
      </p>

      <div class="flex flex-wrap gap-1">
        <span
          v-for="setting in jobSettings.slice(0, 6)"
          :key="setting"
          class="badge badge-ghost badge-sm h-auto rounded-2xl py-1 text-[10px]"
        >
          {{ setting }}
        </span>
      </div>

      <p class="text-[11px] text-base-content/50">
        {{ formatDateTime(job.createdAt) }} · attempt {{ job.attempts }} ·
        priority {{ job.priority }}
      </p>

      <div
        v-if="job.error"
        class="rounded-2xl border border-error/30 bg-error/10 p-2 text-xs text-error"
      >
        {{ job.error }}
      </div>

      <details class="kr-panel-flat">
        <summary class="cursor-pointer px-3 py-2 text-xs font-semibold">
          Full brief and generation fields
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
            <div v-if="jobPageLabel || jobImagePath">
              <div
                class="font-semibold uppercase tracking-wide text-base-content/50"
              >
                Destination
              </div>
              <p v-if="jobPageLabel" class="mt-1">{{ jobPageLabel }}</p>
              <p
                v-if="jobImagePath"
                class="mt-1 break-all font-mono text-[10px] text-base-content/70"
              >
                {{ jobImagePath }}
              </p>
            </div>
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

      <div class="mt-auto flex flex-wrap items-center justify-between gap-2">
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

        <div class="flex flex-wrap items-center justify-end gap-1">
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
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtJobStore, type ArtJobRecord } from '@/stores/artJobStore'
import { useArtJobPriorityStore } from '@/stores/artJobPriorityStore'
import { useArtStore } from '@/stores/artStore'
import {
  artJobImagePath,
  artJobImageVersion,
  artJobNegativePrompt,
  artJobPageLabel,
  artJobPrompt,
  artJobPublicImageSrc,
  artJobRequestId,
  artJobSettings,
  artJobTitle,
  artJobVariant,
  artJobVisibility,
} from '@/utils/artJobFields'

type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'

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

const jobPrompt = computed<string>(() => artJobPrompt(props.job))

const jobNegativePrompt = computed<string>(() =>
  artJobNegativePrompt(props.job),
)

const jobVisibility = computed(() => artJobVisibility(props.job))

const canShowJobContent = computed<boolean>(
  () => !jobVisibility.value.isMature || artStore.showMature,
)

const jobTitle = computed<string>(() => artJobTitle(props.job))

const jobPageLabel = computed<string>(() => artJobPageLabel(props.job))

const jobVariant = computed<string>(() => artJobVariant(props.job))

const jobRequestId = computed<string>(() => artJobRequestId(props.job))

const jobImagePath = computed<string>(() => artJobImagePath(props.job))

const jobSettings = computed<string[]>(() => artJobSettings(props.job))

const imageVersion = computed<string>(() => artJobImageVersion(props.job))

const publicImageSrc = computed<string>(() => artJobPublicImageSrc(props.job))

const jobImageSrc = computed<string>(() => {
  const id = props.job.artImageId
  if (typeof id !== 'number') return ''
  return publicImageSrc.value || artJobStore.imageSrcById[id] || ''
})

const jobImageKind = computed<string>(() => {
  const id = props.job.artImageId
  if (typeof id !== 'number' || publicImageSrc.value) return 'image'
  return artJobStore.imageInfoById[id]?.kind || 'image'
})

const isLoadingPreview = computed<boolean>(() => {
  const id = props.job.artImageId
  return typeof id === 'number' && artJobStore.loadingImageIds.includes(id)
})

const canLoadProtectedPreview = computed<boolean>(() => {
  return (
    canShowJobContent.value &&
    typeof props.job.artImageId === 'number' &&
    !publicImageSrc.value &&
    !jobImageSrc.value
  )
})

const previewPlaceholder = computed<string>(() => {
  if (props.job.status !== 'DONE') return props.job.status
  if (typeof props.job.artImageId !== 'number') return 'No output image'
  return 'Protected output'
})

const isEditableInPlace = computed<boolean>(() =>
  ['PENDING', 'FAILED', 'CANCELLED'].includes(props.job.status),
)

async function loadProtectedPreview(): Promise<void> {
  const id = props.job.artImageId
  if (typeof id !== 'number') return
  // Pass the job's version so an OVERWRITE retry — which reuses this ArtImage
  // id with new bytes — refetches instead of serving the previous render.
  await artJobStore.loadJobImage(id, imageVersion.value)
}

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

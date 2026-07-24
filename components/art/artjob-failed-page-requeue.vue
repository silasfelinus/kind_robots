<!-- /components/art/artjob-failed-page-requeue.vue -->
<template>
  <section
    v-if="failedJobIds.length || message"
    class="rounded-2xl border border-base-300 bg-base-100 p-3"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold">Failed-job recovery</h3>
        <p class="mt-1 text-xs text-base-content/60">
          Only the failed jobs currently loaded on page {{ artJobStore.jobPage }}
          are eligible. Historical failures on other pages are untouched.
        </p>
      </div>

      <button
        v-if="failedJobIds.length"
        type="button"
        class="btn btn-error btn-sm rounded-2xl"
        :disabled="submitting"
        @click="requeueFailedOnPage"
      >
        <span v-if="submitting" class="loading loading-spinner loading-xs" />
        Requeue failed on this page ({{ failedJobIds.length }})
      </button>
    </div>

    <p
      v-if="message"
      class="mt-3 rounded-xl border p-2 text-xs"
      :class="
        hasFailures
          ? 'border-warning/40 bg-warning/10'
          : 'border-success/40 bg-success/10'
      "
    >
      {{ message }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useArtJobStore } from '@/stores/artJobStore'
import { performFetch } from '@/stores/utils'

type SelectedFailedRequeueResult = {
  selectedCount: number
  requestedCount: number
  queuedCount: number
  failedCount: number
  skippedCount: number
  selectedJobIds: number[]
  skippedJobIds: number[]
  failedSourceJobIds: number[]
}

const artJobStore = useArtJobStore()
const submitting = ref(false)
const message = ref('')
const hasFailures = ref(false)

const failedJobIds = computed(() =>
  artJobStore.jobs
    .filter((job) => job.status === 'FAILED')
    .map((job) => job.id),
)

async function requeueFailedOnPage(): Promise<void> {
  const jobIds = failedJobIds.value
  if (!jobIds.length || submitting.value) return

  const confirmed = window.confirm(
    `Requeue the ${jobIds.length} failed ArtJobs currently shown on page ${artJobStore.jobPage}? Jobs on every other page will remain untouched.`,
  )
  if (!confirmed) return

  submitting.value = true
  message.value = ''
  hasFailures.value = false

  try {
    const response = await performFetch<SelectedFailedRequeueResult>(
      '/api/art/queue/reenqueue-failed',
      {
        method: 'POST',
        body: JSON.stringify({ jobIds }),
      },
    )

    if (!response.success || !response.data) {
      hasFailures.value = true
      message.value = response.message || 'Failed to requeue selected ArtJobs.'
      return
    }

    hasFailures.value =
      response.data.failedCount > 0 || response.data.skippedCount > 0
    message.value = response.message

    await Promise.all([artJobStore.fetchJobs(), artJobStore.fetchStats()])
  } finally {
    submitting.value = false
  }
}
</script>

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

      <div v-if="failedJobIds.length" class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-outline btn-error btn-sm rounded-2xl"
          :disabled="submitting"
          @click="cancelFailedOnPage"
        >
          <span
            v-if="submitting === 'cancel'"
            class="loading loading-spinner loading-xs"
          />
          Clear failed on this page ({{ failedJobIds.length }})
        </button>
        <button
          type="button"
          class="btn btn-error btn-sm rounded-2xl"
          :disabled="submitting"
          @click="requeueFailedOnPage"
        >
          <span
            v-if="submitting === 'requeue'"
            class="loading loading-spinner loading-xs"
          />
          Requeue failed on this page ({{ failedJobIds.length }})
        </button>
      </div>
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
const submitting = ref<false | 'cancel' | 'requeue'>(false)
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

  submitting.value = 'requeue'
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
async function cancelFailedOnPage(): Promise<void> {
  const jobIds = failedJobIds.value
  if (!jobIds.length || submitting.value) return

  const confirmed = window.confirm(
    `Clear the ${jobIds.length} failed ArtJobs currently shown on page ${artJobStore.jobPage}? They will be marked cancelled and removed from the failed queue.`,
  )
  if (!confirmed) return

  submitting.value = 'cancel'
  message.value = ''
  hasFailures.value = false

  try {
    const results = await Promise.all(
      jobIds.map((id) =>
        performFetch(`/api/art/queue/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Cleared from failed queue by admin.',
          }),
        }),
      ),
    )
    const failedCount = results.filter((response) => !response.success).length
    hasFailures.value = failedCount > 0
    message.value = failedCount
      ? `Cleared ${jobIds.length - failedCount} of ${jobIds.length} failed ArtJobs. ${failedCount} could not be cleared.`
      : `Cleared ${jobIds.length} failed ArtJobs from this page.`
    await Promise.all([artJobStore.fetchJobs(), artJobStore.fetchStats()])
  } finally {
    submitting.value = false
  }
}
</script>

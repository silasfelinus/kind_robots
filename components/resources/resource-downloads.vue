<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  useResourceDownloadsStore,
  type ModelDownloadRecord,
  type ModelDownloadStatus,
} from '@/stores/resourceDownloadsStore'

type QueueFilter = 'ALL' | 'ACTIVE' | 'DONE' | 'FAILED'

const downloads = useResourceDownloadsStore()
const filter = ref<QueueFilter>('ALL')
const search = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return downloads.rows.filter((row) => {
    if (
      filter.value === 'ACTIVE' &&
      row.status !== 'PENDING' &&
      row.status !== 'CLAIMED'
    )
      return false
    if (
      filter.value !== 'ALL' &&
      filter.value !== 'ACTIVE' &&
      row.status !== filter.value
    )
      return false
    return (
      !query ||
      [row.label, row.fileName, row.resourceType, String(row.id)].some(
        (value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(query),
      )
    )
  })
})

const activeRows = computed(() =>
  filtered.value.filter(
    (row) => row.status === 'PENDING' || row.status === 'CLAIMED',
  ),
)
const historicalRows = computed(() =>
  filtered.value.filter(
    (row) => row.status === 'DONE' || row.status === 'FAILED',
  ),
)

function statusLabel(status: ModelDownloadStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Queued'
    case 'CLAIMED':
      return 'Claimed by downloader'
    case 'DONE':
      return 'Completed'
    case 'FAILED':
      return 'Failed'
  }
}

function statusBadge(status: ModelDownloadStatus): string {
  switch (status) {
    case 'PENDING':
      return 'badge-warning'
    case 'CLAIMED':
      return 'badge-info'
    case 'DONE':
      return 'badge-success'
    case 'FAILED':
      return 'badge-error'
  }
}

function displayTime(date: string | null): string {
  if (!date) return 'Not yet'
  const time = new Date(date)
  return Number.isNaN(time.getTime()) ? 'Unknown' : time.toLocaleString()
}

function title(row: ModelDownloadRecord): string {
  return row.label || row.fileName || `Download #${row.id}`
}

onMounted(() => {
  void downloads.refresh(true)
  refreshTimer = setInterval(() => {
    if (!document.hidden) void downloads.refresh()
  }, 8000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <section
    class="flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-2 sm:p-3"
    aria-label="Model downloads"
  >
    <header class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <div class="min-w-0">
        <h2 class="kr-text-bold-lg">Model downloads</h2>
        <p class="kr-text-dim-xs">
          Live queue and saved history. Refreshes every 8 seconds while open.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline rounded-xl"
        :disabled="downloads.loading"
        @click="downloads.refresh()"
      >
        <Icon name="kind-icon:refresh" class="kr-icon-4" />
        Refresh
      </button>
    </header>

    <div class="grid shrink-0 grid-cols-4 gap-1 sm:gap-2">
      <div class="rounded-xl bg-base-200 px-2 py-2 text-center">
        <p class="kr-text-dim-xs">Queued</p>
        <p class="text-lg font-bold tabular-nums">
          {{ downloads.counts.PENDING }}
        </p>
      </div>
      <div class="rounded-xl bg-base-200 px-2 py-2 text-center">
        <p class="kr-text-dim-xs">Claimed</p>
        <p class="text-lg font-bold tabular-nums">
          {{ downloads.counts.CLAIMED }}
        </p>
      </div>
      <div class="rounded-xl bg-base-200 px-2 py-2 text-center">
        <p class="kr-text-dim-xs">Done</p>
        <p class="text-lg font-bold tabular-nums">
          {{ downloads.counts.DONE }}
        </p>
      </div>
      <div class="rounded-xl bg-base-200 px-2 py-2 text-center">
        <p class="kr-text-dim-xs">Failed</p>
        <p class="text-lg font-bold tabular-nums">
          {{ downloads.counts.FAILED }}
        </p>
      </div>
    </div>

    <div class="flex shrink-0 flex-wrap gap-2">
      <select
        v-model="filter"
        class="kr-select-sm min-w-0"
        aria-label="Filter download status"
      >
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active queue</option>
        <option value="DONE">Completed</option>
        <option value="FAILED">Failed</option>
      </select>
      <input
        v-model="search"
        class="kr-input-sm min-w-0 flex-1"
        type="search"
        placeholder="Search models or request ID"
        aria-label="Search downloads"
      />
    </div>

    <p v-if="downloads.error" role="alert" class="kr-note kr-note-error p-2">
      {{ downloads.error }}
    </p>
    <p
      v-if="downloads.notice"
      role="status"
      class="kr-note kr-note-success p-2"
    >
      {{ downloads.notice }}
    </p>
    <p v-if="downloads.activeLimited" class="kr-note kr-note-warning p-2">
      Showing the newest 200 active requests. Counts include the entire queue.
    </p>

    <div class="kr-scroll min-h-0 flex-1 space-y-3 pr-1" data-kr-gallery>
      <div
        v-if="downloads.loading && !downloads.updatedAt"
        class="kr-panel-muted-sm"
      >
        Loading downloads…
      </div>
      <div v-else-if="!filtered.length" class="kr-panel-muted-sm text-center">
        <p class="font-semibold">No matching downloads</p>
        <p class="kr-text-dim-xs">
          Queue a checkpoint or LoRA in Discover, or adjust your filters.
        </p>
      </div>

      <section v-if="activeRows.length" class="space-y-2">
        <h3 class="kr-text-bold-sm">In the queue</h3>
        <article
          v-for="item in activeRows"
          :key="item.id"
          class="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-base-300 bg-base-200 p-3"
        >
          <div class="min-w-0 flex-1">
            <p class="break-words font-semibold">{{ title(item) }}</p>
            <p class="kr-text-dim-xs break-all">
              #{{ item.id }} · {{ item.resourceType }} · {{ item.source }}
            </p>
            <p class="kr-text-dim-xs">
              Queued {{ displayTime(item.createdAt) }} · Attempt
              {{ item.attempts }}
            </p>
          </div>
          <span
            class="badge badge-sm shrink-0"
            :class="statusBadge(item.status)"
          >
            {{ statusLabel(item.status) }}
          </span>
        </article>
      </section>

      <section v-if="historicalRows.length" class="space-y-2">
        <h3 class="kr-text-bold-sm">History</h3>
        <article
          v-for="item in historicalRows"
          :key="item.id"
          class="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-base-300 bg-base-200 p-3"
        >
          <div class="min-w-0 flex-1">
            <p class="break-words font-semibold">{{ title(item) }}</p>
            <p class="kr-text-dim-xs break-all">
              #{{ item.id }} · {{ item.resourceType }} · {{ item.source }}
            </p>
            <p class="kr-text-dim-xs">
              Requested {{ displayTime(item.createdAt) }} · Updated
              {{ displayTime(item.updatedAt) }}
            </p>
            <p v-if="item.error" class="mt-1 break-words text-sm text-error">
              {{ item.error }}
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <span class="badge badge-sm" :class="statusBadge(item.status)">
              {{ statusLabel(item.status) }}
            </span>
            <NuxtLink
              v-if="item.resourceId"
              :to="`/resources?resourceId=${item.resourceId}`"
              class="btn btn-xs btn-outline rounded-lg"
            >
              View model
            </NuxtLink>
            <button
              v-if="item.status === 'FAILED'"
              type="button"
              class="btn btn-xs btn-primary rounded-lg"
              :disabled="downloads.retryingId !== null"
              @click="downloads.retry(item.id)"
            >
              <span
                v-if="downloads.retryingId === item.id"
                class="kr-spinner-xs"
              />
              Retry
            </button>
          </div>
        </article>
      </section>

      <div
        v-if="downloads.nextBefore !== null"
        class="flex justify-center pb-2"
      >
        <button
          type="button"
          class="btn btn-sm btn-outline rounded-xl"
          :disabled="downloads.loadingMore"
          @click="downloads.loadMore()"
        >
          <span v-if="downloads.loadingMore" class="kr-spinner-xs" />
          Load older downloads
        </button>
      </div>
    </div>
  </section>
</template>

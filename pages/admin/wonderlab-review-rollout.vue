<!-- /pages/admin/wonderlab-review-rollout.vue -->
<template>
  <main class="mx-auto min-h-screen max-w-6xl space-y-4 p-4 md:p-6">
    <header class="rounded-3xl border border-base-300 bg-base-100 p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            WonderLab Operations
          </p>
          <h1 class="mt-2 text-3xl font-black">Personality review rollout audit</h1>
          <p class="mt-2 max-w-3xl text-sm text-base-content/60">
            Read-only production checks for migrations, author identity, draft links,
            and duplicate prevention. This page never generates, approves, or publishes.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/admin/wonderlab-review-plan" class="btn btn-outline btn-sm">
            Coverage plan
          </NuxtLink>
          <NuxtLink to="/admin/wonderlab-reviews" class="btn btn-outline btn-sm">
            Curator workspace
          </NuxtLink>
          <button class="btn btn-primary btn-sm" :disabled="loading" @click="loadAudit">
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            Run audit
          </button>
        </div>
      </div>
    </header>

    <section v-if="!ready" class="grid min-h-52 place-items-center rounded-3xl bg-base-100">
      <span class="loading loading-spinner loading-lg text-primary" />
    </section>

    <section v-else-if="!userStore.isAdmin" class="rounded-3xl border border-error/40 bg-error/10 p-8 text-center">
      <h2 class="text-xl font-black">Administrator access required</h2>
    </section>

    <template v-else>
      <p v-if="notice" class="rounded-2xl border border-error/40 bg-error/10 p-4 text-error">
        {{ notice }}
      </p>

      <section v-if="audit" class="rounded-3xl border p-5" :class="audit.ready ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10'">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-widest">Rollout state</p>
            <h2 class="mt-1 text-2xl font-black">
              {{ audit.ready ? 'Ready' : 'Blocked' }}
            </h2>
            <p class="mt-1 text-sm text-base-content/60">
              {{ audit.databaseName || 'No database' }} · checked {{ formatDate(audit.checkedAt) }}
            </p>
          </div>
          <Icon :name="audit.ready ? 'kind-icon:check' : 'kind-icon:warning'" class="size-12" />
        </div>
      </section>

      <section v-if="audit" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="metric in metricCards" :key="metric.label" class="stat rounded-3xl border border-base-300 bg-base-100">
          <div class="stat-title text-xs">{{ metric.label }}</div>
          <div class="stat-value text-2xl">{{ metric.value }}</div>
        </div>
      </section>

      <section v-if="audit" class="grid gap-3 md:grid-cols-2">
        <article v-for="entry in audit.checks" :key="entry.key" class="rounded-3xl border bg-base-100 p-4" :class="entry.ok ? 'border-success/30' : 'border-error/40'">
          <div class="flex items-start gap-3">
            <Icon :name="entry.ok ? 'kind-icon:check' : 'kind-icon:warning'" class="mt-0.5 size-5 shrink-0" :class="entry.ok ? 'text-success' : 'text-error'" />
            <div class="min-w-0">
              <h3 class="font-black">{{ entry.label }}</h3>
              <p class="mt-1 text-sm text-base-content/65">{{ entry.detail }}</p>
              <p class="mt-2 truncate font-mono text-xs text-base-content/45">
                {{ entry.value }}
              </p>
            </div>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type Audit = {
  ready: boolean
  checkedAt: string
  databaseName: string | null
  checks: Array<{
    key: string
    label: string
    ok: boolean
    value: number | string | boolean | null
    detail: string
  }>
  metrics: {
    humanComponentReviews: number
    firstPartyComponentReviews: number
    proposedDrafts: number
    approvedDrafts: number
    rejectedDrafts: number
    failedDrafts: number
    publishedDrafts: number
    supersededDrafts: number
    duplicateFirstPartyReviews: number
    unsafeFirstPartyReviews: number
    publishedDraftMismatches: number
  }
}

const userStore = useUserStore()
const ready = ref(false)
const loading = ref(false)
const notice = ref('')
const audit = ref<Audit | null>(null)

const metricCards = computed(() => {
  if (!audit.value) return []
  const metrics = audit.value.metrics
  return [
    { label: 'Human reviews', value: metrics.humanComponentReviews },
    { label: 'First-party reviews', value: metrics.firstPartyComponentReviews },
    { label: 'Proposed drafts', value: metrics.proposedDrafts },
    { label: 'Approved drafts', value: metrics.approvedDrafts },
    { label: 'Published drafts', value: metrics.publishedDrafts },
    { label: 'Failed drafts', value: metrics.failedDrafts },
    { label: 'Rejected drafts', value: metrics.rejectedDrafts },
    { label: 'Superseded drafts', value: metrics.supersededDrafts },
    { label: 'Duplicate groups', value: metrics.duplicateFirstPartyReviews },
    { label: 'Link mismatches', value: metrics.publishedDraftMismatches },
  ]
})

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await loadAudit()
})

async function loadAudit(): Promise<void> {
  loading.value = true
  notice.value = ''
  try {
    const response = await performFetch<Audit>('/api/admin/wonderlab/review-rollout')
    if (!response.success || !response.data) throw new Error(response.message)
    audit.value = response.data
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Rollout audit failed.'
  } finally {
    loading.value = false
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
</script>

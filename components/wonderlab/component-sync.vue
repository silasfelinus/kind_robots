<!-- /components/wonderlab/component-sync.vue -->
<template>
  <section class="rounded-3xl border border-base-300 bg-base-100 p-4 shadow-lg">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-widest text-primary">
          Admin Tool
        </p>
        <h2 class="mt-1 text-xl font-black">Component Reconciliation</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65">
          Compare the generated WonderLab manifest with the database before
          applying changes. Unmatched database records are reported but never
          deleted.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-outline btn-sm rounded-xl"
          :disabled="isBusy"
          @click="runDryRun"
        >
          <span v-if="isDryRunning" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:search" class="size-4" />
          Dry Run
        </button>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          :disabled="!canApply || isBusy"
          @click="applyPlan"
        >
          <span v-if="isApplying" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:check" class="size-4" />
          Apply Safe Changes
        </button>
      </div>
    </div>

    <div
      class="mt-4 rounded-2xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info-content"
    >
      Apply creates missing records and updates component names or folders. It
      does not delete records, remove reactions, or mark missing components as
      broken.
    </div>

    <div
      v-if="errorMessage"
      class="mt-4 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="mt-4 rounded-2xl border border-success/40 bg-success/10 p-4 text-sm text-success"
    >
      {{ successMessage }}
    </div>

    <template v-if="result">
      <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <article
          v-for="metric in summaryMetrics"
          :key="metric.label"
          class="rounded-2xl border border-base-300 bg-base-200/60 p-3"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-base-content/50">
            {{ metric.label }}
          </p>
          <p class="mt-1 text-2xl font-black">{{ metric.value }}</p>
        </article>
      </div>

      <p class="mt-3 text-xs text-base-content/50">
        Manifest generated {{ formatDate(result.manifest.generatedAt) }} with
        {{ result.manifest.count }} entries.
      </p>

      <section
        v-if="result.plan.conflicts.length"
        class="mt-4 rounded-2xl border border-error/40 bg-error/5 p-4"
      >
        <h3 class="font-black text-error">Naming conflicts block apply</h3>
        <div class="mt-3 grid gap-3">
          <article
            v-for="conflict in result.plan.conflicts"
            :key="conflict.key"
            class="rounded-xl border border-error/25 bg-base-100 p-3"
          >
            <p class="font-mono text-xs font-bold text-error">
              {{ conflict.key }}
            </p>
            <p class="mt-1 text-sm">{{ conflict.componentNames.join(', ') }}</p>
            <p class="mt-2 text-xs leading-relaxed text-base-content/60">
              {{ conflict.reason }}
            </p>
          </article>
        </div>
      </section>

      <details
        v-if="result.plan.creates.length"
        class="mt-4 rounded-2xl border border-base-300 bg-base-200/35 p-4"
      >
        <summary class="cursor-pointer font-black">
          New records ({{ result.plan.creates.length }})
        </summary>
        <ul class="mt-3 grid gap-1 text-sm">
          <li
            v-for="action in result.plan.creates.slice(0, 50)"
            :key="action.componentName"
            class="font-mono text-xs"
          >
            {{ action.changes.folderName }}/{{ action.componentName }}
          </li>
        </ul>
      </details>

      <details
        v-if="result.plan.updates.length"
        class="mt-3 rounded-2xl border border-base-300 bg-base-200/35 p-4"
      >
        <summary class="cursor-pointer font-black">
          Updates ({{ result.plan.updates.length }})
        </summary>
        <div class="mt-3 grid gap-2">
          <article
            v-for="action in result.plan.updates.slice(0, 50)"
            :key="`${action.existingId}-${action.componentName}`"
            class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs"
          >
            <p class="font-mono font-bold">{{ action.componentName }}</p>
            <p class="mt-1 text-base-content/60">
              {{ formatChanges(action.changes) }}
            </p>
          </article>
        </div>
      </details>

      <details
        v-if="result.plan.missingFromManifest.length"
        class="mt-3 rounded-2xl border border-warning/40 bg-warning/5 p-4"
      >
        <summary class="cursor-pointer font-black text-warning-content">
          Missing from manifest ({{ result.plan.missingFromManifest.length }})
        </summary>
        <p class="mt-2 text-xs leading-relaxed text-base-content/60">
          These records remain untouched so notes, status, artwork, and reactions
          are preserved for review.
        </p>
        <ul class="mt-3 grid gap-1 text-sm">
          <li
            v-for="component in result.plan.missingFromManifest.slice(0, 50)"
            :key="component.id"
            class="font-mono text-xs"
          >
            {{ component.folderName }}/{{ component.componentName }}
          </li>
        </ul>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'

type WonderLabManifest = {
  version: number
  generatedAt: string
  componentRoot: string
  count: number
  entries: unknown[]
}

type ReconcileAction = {
  kind: 'create' | 'update'
  componentName: string
  existingId?: number
  changes: Record<string, string>
}

type ReconcileConflict = {
  key: string
  componentNames: string[]
  reason: string
}

type MissingComponent = {
  id: number
  componentName: string
  folderName: string
}

type ReconcileResult = {
  mode: 'dry-run' | 'apply'
  applied: boolean
  manifest: {
    version: number
    generatedAt: string
    count: number
  }
  summary: {
    creates: number
    updates: number
    unchanged: number
    missingFromManifest: number
    conflicts: number
  }
  plan: {
    creates: ReconcileAction[]
    updates: ReconcileAction[]
    unchanged: string[]
    missingFromManifest: MissingComponent[]
    conflicts: ReconcileConflict[]
  }
}

const manifest = ref<WonderLabManifest | null>(null)
const result = ref<ReconcileResult | null>(null)
const isDryRunning = ref(false)
const isApplying = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isBusy = computed(() => isDryRunning.value || isApplying.value)
const canApply = computed(
  () =>
    result.value?.mode === 'dry-run' &&
    result.value.summary.conflicts === 0 &&
    Boolean(manifest.value),
)

const summaryMetrics = computed(() => {
  const summary = result.value?.summary
  if (!summary) return []

  return [
    { label: 'Create', value: summary.creates },
    { label: 'Update', value: summary.updates },
    { label: 'Unchanged', value: summary.unchanged },
    { label: 'Missing', value: summary.missingFromManifest },
    { label: 'Conflicts', value: summary.conflicts },
  ]
})

async function loadManifest(): Promise<WonderLabManifest> {
  const response = await fetch('/wonderlab-components.json', {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('The generated WonderLab component manifest is unavailable.')
  }

  const data = (await response.json()) as WonderLabManifest
  if (!Array.isArray(data.entries)) {
    throw new Error('The WonderLab component manifest has an invalid format.')
  }

  return data
}

async function reconcile(mode: 'dry-run' | 'apply'): Promise<void> {
  errorMessage.value = ''
  successMessage.value = ''

  const activeManifest =
    mode === 'apply' && manifest.value ? manifest.value : await loadManifest()
  manifest.value = activeManifest

  const response = await performFetch<ReconcileResult>(
    '/api/components/reconcile',
    {
      method: 'POST',
      body: JSON.stringify({
        mode,
        manifest: activeManifest,
      }),
    },
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Component reconciliation failed.')
  }

  result.value = response.data
  successMessage.value = response.message
}

async function runDryRun(): Promise<void> {
  isDryRunning.value = true

  try {
    await reconcile('dry-run')
  } catch (error) {
    result.value = null
    manifest.value = null
    errorMessage.value =
      error instanceof Error ? error.message : 'Component dry run failed.'
  } finally {
    isDryRunning.value = false
  }
}

async function applyPlan(): Promise<void> {
  if (!canApply.value) return
  isApplying.value = true

  try {
    await reconcile('apply')
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Component reconciliation failed.'
  } finally {
    isApplying.value = false
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function formatChanges(changes: Record<string, string>): string {
  return Object.entries(changes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}
</script>

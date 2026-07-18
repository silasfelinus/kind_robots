<!-- /components/wonderlab/component-test-fixture-cleanup.vue -->
<template>
  <section class="rounded-2xl border border-warning/35 bg-warning/5 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-widest text-warning">
          Historical Test Cleanup
        </p>
        <h3 class="mt-1 text-lg font-black">Leaked Cypress Components</h3>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65">
          Finds only records whose component name starts with
          <code>TestComponent-</code> or <code>TestComponent_</code> and whose
          folder or title also identifies it as a test fixture. Dry run is
          required before deletion.
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
          Find Test Fixtures
        </button>

        <button
          type="button"
          class="btn btn-error btn-sm rounded-xl"
          :disabled="!canApply || isBusy"
          @click="applyCleanup"
        >
          <span v-if="isApplying" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:trash" class="size-4" />
          Delete {{ candidates.length || '' }}
        </button>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="mt-4 rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="mt-4 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success"
    >
      {{ successMessage }}
    </div>

    <template v-if="result && !result.applied">
      <div
        v-if="!candidates.length"
        class="mt-4 rounded-xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/65"
      >
        No matching historical test fixtures were found.
      </div>

      <div v-else class="mt-4 grid gap-3">
        <article
          v-for="candidate in candidates"
          :key="candidate.id"
          class="rounded-xl border border-warning/30 bg-base-100 p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="break-all font-mono text-sm font-black">
                {{ candidate.componentName }}
              </p>
              <p class="mt-1 break-all text-xs text-base-content/55">
                {{ candidate.folderName }} · Component #{{ candidate.id }}
              </p>
            </div>
            <span class="badge badge-warning badge-sm">
              {{ candidate.reactionCount }} reactions
            </span>
          </div>
          <p class="mt-2 text-xs text-base-content/50">
            Created {{ formatDate(candidate.createdAt) }}
          </p>
        </article>

        <label
          class="flex cursor-pointer items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-3"
        >
          <input
            v-model="confirmed"
            type="checkbox"
            class="checkbox checkbox-error checkbox-sm mt-0.5"
          />
          <span class="text-sm leading-relaxed">
            I reviewed these IDs and confirm they are disposable Cypress test
            fixtures. Attached Component reactions will also be deleted.
          </span>
        </label>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { performFetch } from '@/stores/utils'

type FixtureCandidate = {
  id: number
  componentName: string
  folderName: string
  title: string | null
  createdAt: string | Date
  updatedAt: string | Date
  reactionCount: number
}

type FixtureCleanupResult = {
  mode: 'dry-run' | 'apply'
  applied: boolean
  candidates: FixtureCandidate[]
  deleted: {
    components: number
    reactions: number
  }
}

const componentStore = useComponentStore()
const result = ref<FixtureCleanupResult | null>(null)
const isDryRunning = ref(false)
const isApplying = ref(false)
const confirmed = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const candidates = computed(() => result.value?.candidates || [])
const isBusy = computed(() => isDryRunning.value || isApplying.value)
const canApply = computed(
  () =>
    result.value?.mode === 'dry-run' &&
    !result.value.applied &&
    candidates.value.length > 0 &&
    confirmed.value,
)

async function requestCleanup(
  mode: 'dry-run' | 'apply',
): Promise<FixtureCleanupResult> {
  const response = await performFetch<FixtureCleanupResult>(
    '/api/components/cleanup-test-fixtures',
    {
      method: 'POST',
      body: JSON.stringify({
        mode,
        candidateIds:
          mode === 'apply'
            ? candidates.value.map((candidate) => candidate.id)
            : undefined,
      }),
    },
  )

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Historical fixture cleanup failed.')
  }

  successMessage.value = response.message
  return response.data
}

async function runDryRun(): Promise<void> {
  isDryRunning.value = true
  confirmed.value = false
  errorMessage.value = ''
  successMessage.value = ''

  try {
    result.value = await requestCleanup('dry-run')
  } catch (error) {
    result.value = null
    errorMessage.value =
      error instanceof Error ? error.message : 'Fixture dry run failed.'
  } finally {
    isDryRunning.value = false
  }
}

async function applyCleanup(): Promise<void> {
  if (!canApply.value) return

  isApplying.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    result.value = await requestCleanup('apply')
    confirmed.value = false
    await componentStore.initialize(true)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Fixture cleanup failed.'
  } finally {
    isApplying.value = false
  }
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}
</script>

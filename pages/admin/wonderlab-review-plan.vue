<!-- /pages/admin/wonderlab-review-plan.vue -->
<template>
  <main class="mx-auto min-h-screen max-w-7xl space-y-4 p-4 md:p-6">
    <header class="rounded-3xl border border-base-300 bg-base-100 p-5">
      <p class="text-xs font-black uppercase tracking-widest text-primary">
        WonderLab Editorial
      </p>
      <h1 class="mt-2 text-3xl font-black">Personality review coverage plan</h1>
      <p class="mt-2 max-w-4xl text-sm leading-relaxed text-base-content/60">
        Preview deterministic reviewer assignments and existing coverage before making
        any model calls. Batch generation creates proposed drafts only; it never approves
        or publishes them.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink to="/admin/wonderlab-reviews" class="btn btn-primary btn-sm">
          Curator workspace
        </NuxtLink>
        <NuxtLink to="/admin/wonderlab-review-generator" class="btn btn-outline btn-sm">
          Single-draft generator
        </NuxtLink>
        <NuxtLink to="/wonderlab" class="btn btn-ghost btn-sm">WonderLab</NuxtLink>
      </div>
    </header>

    <section v-if="!ready" class="grid min-h-52 place-items-center rounded-3xl bg-base-100">
      <span class="loading loading-spinner loading-lg text-primary" />
    </section>

    <section
      v-else-if="!userStore.isAdmin"
      class="rounded-3xl border border-error/40 bg-error/10 p-8 text-center"
    >
      <h2 class="text-xl font-black">Administrator access required</h2>
    </section>

    <template v-else>
      <section class="rounded-3xl border border-base-300 bg-base-100 p-5">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label class="form-control xl:col-span-2">
            <span class="label-text text-xs font-bold">Component IDs (optional)</span>
            <input
              v-model="form.componentIds"
              class="input input-bordered input-sm mt-1"
              placeholder="12, 18, 25"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Component limit</span>
            <input
              v-model.number="form.limit"
              type="number"
              min="1"
              max="10"
              class="input input-bordered input-sm mt-1"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Reviewers per exhibit</span>
            <select v-model.number="form.reviewersPerComponent" class="select select-bordered select-sm mt-1">
              <option :value="1">1 reviewer</option>
              <option :value="2">2 reviewers</option>
            </select>
          </label>
          <label class="form-control">
            <span class="label-text text-xs font-bold">Minimum affinity</span>
            <input
              v-model.number="form.minimumScore"
              type="number"
              min="-100"
              max="500"
              class="input input-bordered input-sm mt-1"
            />
          </label>
          <label class="form-control md:col-span-2 xl:col-span-3">
            <span class="label-text text-xs font-bold">Generation model</span>
            <input
              v-model="form.model"
              class="input input-bordered input-sm mt-1"
              placeholder="gpt-4o-mini"
            />
          </label>
          <label class="flex cursor-pointer items-center gap-3 rounded-2xl bg-base-200/70 p-3 md:col-span-2">
            <input v-model="form.regenerate" type="checkbox" class="checkbox checkbox-warning" />
            <span class="text-sm">
              Include existing unpublished drafts as new regeneration attempts
            </span>
          </label>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button class="btn btn-outline btn-sm" :disabled="loading" @click="loadPlan">
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            Preview plan
          </button>
          <button class="btn btn-ghost btn-sm" :disabled="loading" @click="runBatch(true)">
            Verify dry run
          </button>
        </div>

        <label class="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <input v-model="executeEnabled" type="checkbox" class="checkbox checkbox-warning mt-0.5" />
          <span>
            <strong class="block">Enable model calls for this batch</strong>
            <span class="text-sm text-base-content/65">
              This may create proposed or failed drafts. It cannot approve or publish.
            </span>
          </span>
        </label>
        <button
          class="btn btn-warning mt-3"
          :disabled="loading || !executeEnabled || !plan?.missingCount && !form.regenerate"
          @click="runBatch(false)"
        >
          Generate planned drafts
        </button>
      </section>

      <p
        v-if="notice"
        class="rounded-2xl border p-4 text-sm"
        :class="noticeError ? 'border-error/40 bg-error/10 text-error' : 'border-success/40 bg-success/10 text-success'"
      >
        {{ notice }}
      </p>

      <section v-if="plan" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="stat rounded-3xl border border-base-300 bg-base-100">
          <div class="stat-title">Exhibits</div>
          <div class="stat-value text-primary">{{ plan.componentCount }}</div>
        </div>
        <div class="stat rounded-3xl border border-base-300 bg-base-100">
          <div class="stat-title">Missing</div>
          <div class="stat-value text-warning">{{ plan.missingCount }}</div>
        </div>
        <div class="stat rounded-3xl border border-base-300 bg-base-100">
          <div class="stat-title">Drafted</div>
          <div class="stat-value text-secondary">{{ plan.draftedCount }}</div>
        </div>
        <div class="stat rounded-3xl border border-base-300 bg-base-100">
          <div class="stat-title">Published</div>
          <div class="stat-value text-success">{{ plan.publishedCount }}</div>
        </div>
      </section>

      <section v-if="batchResults.length" class="rounded-3xl border border-base-300 bg-base-100 p-4">
        <h2 class="text-xl font-black">Latest batch results</h2>
        <div class="mt-3 grid gap-2">
          <div
            v-for="result in batchResults"
            :key="`${result.componentId}-${result.reviewer.author.kind}-${result.reviewer.author.id}`"
            class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-base-200/70 p-3 text-sm"
          >
            <span>
              <strong>{{ result.reviewer.name }}</strong> on Component #{{ result.componentId }}
            </span>
            <span class="badge" :class="result.success ? 'badge-success' : 'badge-error'">
              {{ result.message }}
            </span>
          </div>
        </div>
      </section>

      <section v-if="plan" class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="exhibit in plan.exhibits"
          :key="exhibit.componentId"
          class="rounded-3xl border border-base-300 bg-base-100 p-4"
        >
          <header class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 class="text-lg font-black">{{ exhibit.title || exhibit.componentName }}</h2>
              <p class="text-sm text-base-content/55">
                {{ exhibit.folderName }} · Component #{{ exhibit.componentId }}
              </p>
            </div>
            <span class="badge badge-outline">{{ exhibit.status }}</span>
          </header>

          <div v-if="!exhibit.reviewers.length" class="mt-4 rounded-2xl bg-error/10 p-4 text-sm text-error">
            No eligible voice-ready reviewer met this plan's constraints.
          </div>

          <div v-else class="mt-4 grid gap-3">
            <div
              v-for="reviewer in exhibit.reviewers"
              :key="`${reviewer.author.kind}-${reviewer.author.id}`"
              class="rounded-2xl border border-base-300 p-3"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="font-black">{{ reviewer.name }}</p>
                  <p class="text-xs text-base-content/55">
                    {{ reviewer.author.kind }} #{{ reviewer.author.id }} · affinity {{ reviewer.score }}
                  </p>
                </div>
                <span class="badge" :class="coverageClass(reviewer.coverage)">
                  {{ reviewer.coverage }}
                </span>
              </div>
              <ul class="mt-2 list-disc space-y-1 pl-5 text-xs text-base-content/65">
                <li v-for="reason in reviewer.reasons" :key="reason">{{ reason }}</li>
              </ul>
              <p v-if="reviewer.draftId || reviewer.reactionId" class="mt-2 text-xs text-base-content/50">
                <span v-if="reviewer.draftId">Draft #{{ reviewer.draftId }} {{ reviewer.draftStatus }}</span>
                <span v-if="reviewer.reactionId"> · Reaction #{{ reviewer.reactionId }}</span>
              </p>
            </div>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type Coverage = 'MISSING' | 'DRAFTED' | 'PUBLISHED'
type PlanReviewer = {
  author: { kind: 'BOT' | 'CHARACTER'; id: number }
  name: string
  slug: string | null
  score: number
  reasons: string[]
  coverage: Coverage
  draftId: number | null
  draftStatus: string | null
  reactionId: number | null
}
type Plan = {
  exhibits: Array<{
    componentId: number
    componentName: string
    title: string | null
    folderName: string
    sourcePath: string | null
    status: string
    reviewers: PlanReviewer[]
  }>
  componentCount: number
  reviewerSlots: number
  missingCount: number
  draftedCount: number
  publishedCount: number
}
type BatchResult = {
  componentId: number
  reviewer: PlanReviewer
  success: boolean
  draftId: number | null
  status: string | null
  message: string
}
type BatchResponse = {
  dryRun: boolean
  plan: Plan
  targetCount: number
  generated: BatchResult[]
}

const userStore = useUserStore()
const ready = ref(false)
const loading = ref(false)
const executeEnabled = ref(false)
const notice = ref('')
const noticeError = ref(false)
const plan = ref<Plan | null>(null)
const batchResults = ref<BatchResult[]>([])
const form = reactive({
  componentIds: '',
  limit: 10,
  reviewersPerComponent: 2,
  minimumScore: 0,
  model: 'gpt-4o-mini',
  regenerate: false,
})

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await loadPlan()
})

function queryParams(): URLSearchParams {
  const query = new URLSearchParams({
    limit: String(form.limit),
    reviewersPerComponent: String(form.reviewersPerComponent),
    minimumScore: String(form.minimumScore),
  })
  if (form.componentIds.trim()) query.set('componentIds', form.componentIds.trim())
  return query
}

function requestBody(dryRun: boolean): Record<string, unknown> {
  return {
    componentIds: form.componentIds.trim() || undefined,
    limit: form.limit,
    reviewersPerComponent: form.reviewersPerComponent,
    minimumScore: form.minimumScore,
    model: form.model.trim() || 'gpt-4o-mini',
    regenerate: form.regenerate,
    dryRun,
  }
}

async function loadPlan(): Promise<void> {
  loading.value = true
  notice.value = ''
  try {
    const response = await performFetch<Plan>(
      `/api/admin/wonderlab/review-plan?${queryParams().toString()}`,
    )
    if (!response.success || !response.data) throw new Error(response.message)
    plan.value = response.data
  } catch (error) {
    noticeError.value = true
    notice.value = error instanceof Error ? error.message : 'Failed to load review plan.'
  } finally {
    loading.value = false
  }
}

async function runBatch(dryRun: boolean): Promise<void> {
  if (!dryRun && !executeEnabled.value) return
  loading.value = true
  notice.value = ''
  batchResults.value = []
  try {
    const response = await performFetch<BatchResponse>(
      '/api/admin/wonderlab/review-drafts/generate-batch',
      { method: 'POST', body: JSON.stringify(requestBody(dryRun)) },
      1,
      dryRun ? 15_000 : 180_000,
    )
    if (!response.success || !response.data) throw new Error(response.message)

    plan.value = response.data.plan
    batchResults.value = response.data.generated
    noticeError.value = false
    notice.value = dryRun
      ? `Dry run confirmed ${response.data.targetCount} target(s); no model calls or writes occurred.`
      : `Batch completed ${response.data.generated.filter((item) => item.success).length} of ${response.data.targetCount} target(s). All results remain unpublished.`
    if (!dryRun) executeEnabled.value = false
    if (!dryRun) await loadPlan()
  } catch (error) {
    noticeError.value = true
    notice.value = error instanceof Error ? error.message : 'Batch generation failed.'
  } finally {
    loading.value = false
  }
}

function coverageClass(coverage: Coverage): string {
  if (coverage === 'PUBLISHED') return 'badge-success'
  if (coverage === 'DRAFTED') return 'badge-secondary'
  return 'badge-warning'
}
</script>

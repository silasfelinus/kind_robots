<!-- /pages/admin/wonderlab-reviews.vue -->
<template>
  <main class="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
    <header class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-primary">
            WonderLab Editorial
          </p>
          <h1 class="mt-2 text-3xl font-black">Personality review drafts</h1>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65">
            Draft, edit, approve, reject, and explicitly publish first-party Bot and
            Character commentary. Nothing on this page publishes automatically.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/wonderlab" class="btn btn-outline btn-sm rounded-xl">
            <Icon name="kind-icon:sparkles" class="size-4" />
            Open WonderLab
          </NuxtLink>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-xl"
            :disabled="isLoading"
            @click="loadDrafts"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="size-4" />
            Refresh
          </button>
        </div>
      </div>
    </header>

    <section
      v-if="!isReady"
      class="flex min-h-52 items-center justify-center rounded-3xl border border-base-300 bg-base-100"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </section>

    <section
      v-else-if="!isAdmin"
      class="rounded-3xl border border-error/40 bg-error/10 p-8 text-center"
    >
      <Icon name="kind-icon:lock" class="mx-auto size-12 text-error" />
      <h2 class="mt-3 text-xl font-black">Administrator access required</h2>
      <p class="mt-2 text-sm text-base-content/65">
        The review-draft APIs also enforce administrator authentication server-side.
      </p>
    </section>

    <template v-else>
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,390px)]">
        <div class="rounded-3xl border border-base-300 bg-base-100 p-4">
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label class="form-control">
              <span class="label-text text-xs font-black uppercase text-base-content/55">
                Status
              </span>
              <select v-model="statusFilter" class="select select-bordered select-sm mt-1">
                <option value="">All statuses</option>
                <option v-for="status in statuses" :key="status" :value="status">
                  {{ formatStatus(status) }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text text-xs font-black uppercase text-base-content/55">
                Component ID
              </span>
              <input
                v-model="componentFilter"
                type="number"
                min="1"
                class="input input-bordered input-sm mt-1"
                placeholder="Any component"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text text-xs font-black uppercase text-base-content/55">
                Search loaded drafts
              </span>
              <input
                v-model="searchQuery"
                type="search"
                class="input input-bordered input-sm mt-1"
                placeholder="Component, reviewer, or review text"
              />
            </label>
          </div>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm text-base-content/60">
              {{ filteredDrafts.length }} of {{ drafts.length }} loaded drafts
            </p>
            <button type="button" class="btn btn-ghost btn-xs" @click="clearFilters">
              Clear filters
            </button>
          </div>
        </div>

        <details class="rounded-3xl border border-base-300 bg-base-100 p-4" open>
          <summary class="cursor-pointer font-black">Create a curator-written draft</summary>
          <form class="mt-4 grid gap-3" @submit.prevent="createManualDraft">
            <div class="grid grid-cols-2 gap-2">
              <label class="form-control">
                <span class="label-text text-xs font-bold">Component ID</span>
                <input
                  v-model="createForm.componentId"
                  required
                  type="number"
                  min="1"
                  class="input input-bordered input-sm mt-1"
                />
              </label>
              <label class="form-control">
                <span class="label-text text-xs font-bold">Reviewer kind</span>
                <select
                  v-model="createForm.authorKind"
                  class="select select-bordered select-sm mt-1"
                >
                  <option value="BOT">Bot</option>
                  <option value="CHARACTER">Character</option>
                </select>
              </label>
            </div>

            <label class="form-control">
              <span class="label-text text-xs font-bold">Reviewer ID</span>
              <input
                v-model="createForm.authorId"
                required
                type="number"
                min="1"
                class="input input-bordered input-sm mt-1"
              />
            </label>

            <label class="form-control">
              <span class="label-text text-xs font-bold">Draft comment</span>
              <textarea
                v-model="createForm.comment"
                required
                rows="5"
                maxlength="20000"
                class="textarea textarea-bordered mt-1"
                placeholder="Write the reviewer-specific museum commentary..."
              />
            </label>

            <div class="grid grid-cols-2 gap-2">
              <label class="form-control">
                <span class="label-text text-xs font-bold">Rating</span>
                <select
                  v-model.number="createForm.rating"
                  class="select select-bordered select-sm mt-1"
                >
                  <option v-for="rating in [0, 1, 2, 3, 4, 5]" :key="rating" :value="rating">
                    {{ rating }}
                  </option>
                </select>
              </label>
              <label class="form-control">
                <span class="label-text text-xs font-bold">Reaction</span>
                <select
                  v-model="createForm.reactionType"
                  class="select select-bordered select-sm mt-1"
                >
                  <option value="">Automatic</option>
                  <option v-for="reaction in reactions" :key="reaction" :value="reaction">
                    {{ reaction }}
                  </option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              class="btn btn-secondary btn-sm rounded-xl"
              :disabled="isCreating"
            >
              <span v-if="isCreating" class="loading loading-spinner loading-xs" />
              Create proposed draft
            </button>
          </form>
        </details>
      </section>

      <div
        v-if="message"
        class="rounded-2xl border p-4 text-sm"
        :class="messageKind === 'error' ? 'border-error/40 bg-error/10 text-error' : 'border-success/40 bg-success/10 text-success'"
      >
        {{ message }}
      </div>

      <section v-if="isLoading && !drafts.length" class="grid gap-4 md:grid-cols-2">
        <div v-for="index in 4" :key="index" class="h-72 animate-pulse rounded-3xl bg-base-200" />
      </section>

      <section
        v-else-if="!filteredDrafts.length"
        class="rounded-3xl border border-dashed border-base-300 bg-base-100 p-10 text-center"
      >
        <Icon name="kind-icon:comment" class="mx-auto size-12 text-base-content/25" />
        <h2 class="mt-3 text-xl font-black">No matching drafts</h2>
        <p class="mt-2 text-sm text-base-content/55">
          Generate or create a draft, or change the current filters.
        </p>
      </section>

      <section v-else class="grid gap-4 lg:grid-cols-2">
        <article
          v-for="draft in filteredDrafts"
          :key="draft.id"
          class="flex flex-col rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm"
        >
          <header class="flex items-start gap-3">
            <div
              class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10"
            >
              <img
                v-if="draft.author.avatarImage"
                :src="normalizeImagePath(draft.author.avatarImage)"
                :alt="draft.author.name"
                class="size-full object-cover"
              />
              <Icon v-else name="kind-icon:sparkles" class="size-5 text-primary" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-lg font-black">{{ draft.author.name }}</p>
                  <p class="truncate text-sm text-base-content/60">
                    {{ draft.componentTitle || draft.componentName }} · Component #{{ draft.componentId }}
                  </p>
                </div>
                <span class="badge" :class="statusClass(draft.status)">
                  {{ formatStatus(draft.status) }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span class="badge badge-outline badge-sm">
                  {{ draft.author.kind.toLowerCase() }} · {{ draft.author.role }}
                </span>
                <span class="badge badge-ghost badge-sm">Draft #{{ draft.id }}</span>
                <span v-if="draft.publishedReactionId" class="badge badge-success badge-sm">
                  Reaction #{{ draft.publishedReactionId }}
                </span>
              </div>
            </div>
          </header>

          <div class="mt-4 grid flex-1 gap-3">
            <label class="form-control">
              <span class="label-text text-xs font-black uppercase text-base-content/55">
                Curator copy
              </span>
              <textarea
                v-model="editor(draft).comment"
                rows="7"
                maxlength="20000"
                class="textarea textarea-bordered mt-1 leading-relaxed"
                :disabled="isTerminal(draft.status)"
              />
            </label>

            <details class="rounded-2xl border border-base-300 bg-base-200/50 p-3">
              <summary class="cursor-pointer text-xs font-black uppercase text-base-content/55">
                Original generated copy and provenance
              </summary>
              <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-base-content/70">
                {{ draft.generatedComment }}
              </p>
              <dl class="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div><dt class="font-black">Prompt version</dt><dd>{{ draft.promptVersion }}</dd></div>
                <div><dt class="font-black">Prompt hash</dt><dd class="truncate">{{ draft.promptHash }}</dd></div>
                <div><dt class="font-black">Provider</dt><dd>{{ draft.generationProvider || 'Manual' }}</dd></div>
                <div><dt class="font-black">Model</dt><dd>{{ draft.generationModel || 'Curator' }}</dd></div>
              </dl>
            </details>

            <div class="grid grid-cols-2 gap-2">
              <label class="form-control">
                <span class="label-text text-xs font-bold">Rating</span>
                <select
                  v-model.number="editor(draft).rating"
                  class="select select-bordered select-sm mt-1"
                  :disabled="isTerminal(draft.status)"
                >
                  <option v-for="rating in [0, 1, 2, 3, 4, 5]" :key="rating" :value="rating">
                    {{ rating }}
                  </option>
                </select>
              </label>
              <label class="form-control">
                <span class="label-text text-xs font-bold">Reaction</span>
                <select
                  v-model="editor(draft).reactionType"
                  class="select select-bordered select-sm mt-1"
                  :disabled="isTerminal(draft.status)"
                >
                  <option value="">Automatic</option>
                  <option v-for="reaction in reactions" :key="reaction" :value="reaction">
                    {{ reaction }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <footer class="mt-4 flex flex-wrap gap-2 border-t border-base-300 pt-4">
            <button
              v-if="!isTerminal(draft.status)"
              type="button"
              class="btn btn-outline btn-sm rounded-xl"
              :disabled="isBusy(draft.id)"
              @click="saveDraft(draft)"
            >
              Save
            </button>
            <button
              v-if="['PROPOSED', 'REJECTED', 'FAILED'].includes(draft.status)"
              type="button"
              class="btn btn-success btn-sm rounded-xl"
              :disabled="isBusy(draft.id)"
              @click="approveDraft(draft)"
            >
              Approve
            </button>
            <button
              v-if="['PROPOSED', 'APPROVED', 'FAILED'].includes(draft.status)"
              type="button"
              class="btn btn-error btn-outline btn-sm rounded-xl"
              :disabled="isBusy(draft.id)"
              @click="setDraftStatus(draft, 'REJECTED')"
            >
              Reject
            </button>
            <button
              v-if="['REJECTED', 'FAILED', 'APPROVED'].includes(draft.status)"
              type="button"
              class="btn btn-warning btn-outline btn-sm rounded-xl"
              :disabled="isBusy(draft.id)"
              @click="setDraftStatus(draft, 'PROPOSED')"
            >
              Reopen
            </button>
            <button
              v-if="draft.status === 'APPROVED'"
              type="button"
              class="btn btn-primary btn-sm rounded-xl"
              :disabled="isBusy(draft.id)"
              @click="publishDraft(draft)"
            >
              <span v-if="isBusy(draft.id)" class="loading loading-spinner loading-xs" />
              Publish approved review
            </button>
          </footer>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

type DraftStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'FAILED'
  | 'SUPERSEDED'

type DraftAuthor = {
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  avatarImage: string | null
  role: string
}

type ReviewDraft = {
  id: number
  createdAt: string
  updatedAt: string | null
  status: DraftStatus
  draftKey: string
  componentId: number
  componentName: string
  componentTitle: string | null
  authorBotId: number | null
  authorCharacterId: number | null
  author: DraftAuthor
  publisherUserId: number | null
  publisherName: string | null
  publishedReactionId: number | null
  promptVersion: string
  promptHash: string
  promptPayload: unknown
  generatedComment: string
  editedComment: string | null
  finalComment: string
  rating: number
  reactionType: string | null
  generationModel: string | null
  generationProvider: string | null
  generationAttempt: number
  approvedAt: string | null
  rejectedAt: string | null
  publishedAt: string | null
  failureReason: string | null
}

type DraftEditor = {
  comment: string
  rating: number
  reactionType: string
}

const statuses: DraftStatus[] = [
  'PROPOSED',
  'APPROVED',
  'REJECTED',
  'PUBLISHED',
  'FAILED',
  'SUPERSEDED',
]
const reactions = ['LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED']
const userStore = useUserStore()
const drafts = ref<ReviewDraft[]>([])
const editors = reactive<Record<number, DraftEditor>>({})
const busyIds = ref<Set<number>>(new Set())
const isLoading = ref(false)
const isCreating = ref(false)
const isReady = ref(false)
const statusFilter = ref('')
const componentFilter = ref('')
const searchQuery = ref('')
const message = ref('')
const messageKind = ref<'success' | 'error'>('success')
const createForm = reactive({
  componentId: '',
  authorKind: 'BOT' as 'BOT' | 'CHARACTER',
  authorId: '',
  comment: '',
  rating: 0,
  reactionType: '',
})

const isAdmin = computed(() => userStore.isAdmin)
const filteredDrafts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return drafts.value.filter((draft) => {
    if (statusFilter.value && draft.status !== statusFilter.value) return false
    if (componentFilter.value && draft.componentId !== Number(componentFilter.value)) return false
    if (!query) return true

    return [
      draft.componentName,
      draft.componentTitle,
      draft.author.name,
      draft.author.role,
      draft.generatedComment,
      draft.editedComment,
      draft.finalComment,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

onMounted(async () => {
  await userStore.initialize()
  isReady.value = true
  if (userStore.isAdmin) await loadDrafts()
})

watch(statusFilter, () => {
  if (isAdmin.value) void loadDrafts()
})

function setMessage(text: string, kind: 'success' | 'error' = 'success'): void {
  message.value = text
  messageKind.value = kind
}

function editor(draft: ReviewDraft): DraftEditor {
  if (!editors[draft.id]) {
    editors[draft.id] = {
      comment: draft.editedComment || draft.generatedComment,
      rating: draft.rating,
      reactionType: draft.reactionType || '',
    }
  }
  return editors[draft.id]
}

function syncEditor(draft: ReviewDraft): void {
  editors[draft.id] = {
    comment: draft.editedComment || draft.generatedComment,
    rating: draft.rating,
    reactionType: draft.reactionType || '',
  }
}

function upsertDraft(draft: ReviewDraft): void {
  const index = drafts.value.findIndex((entry) => entry.id === draft.id)
  if (index >= 0) drafts.value.splice(index, 1, draft)
  else drafts.value.unshift(draft)
  syncEditor(draft)
}

function isBusy(id: number): boolean {
  return busyIds.value.has(id)
}

function setBusy(id: number, busy: boolean): void {
  const next = new Set(busyIds.value)
  if (busy) next.add(id)
  else next.delete(id)
  busyIds.value = next
}

function isTerminal(status: DraftStatus): boolean {
  return status === 'PUBLISHED' || status === 'SUPERSEDED'
}

async function loadDrafts(): Promise<void> {
  isLoading.value = true
  message.value = ''
  try {
    const params = new URLSearchParams({ limit: '200' })
    if (statusFilter.value) params.set('status', statusFilter.value)
    if (componentFilter.value) params.set('componentId', componentFilter.value)

    const response = await performFetch<ReviewDraft[]>(
      `/api/admin/wonderlab/review-drafts?${params.toString()}`,
    )
    if (!response.success) throw new Error(response.message || 'Failed to load drafts.')

    drafts.value = response.data || []
    for (const draft of drafts.value) syncEditor(draft)
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Failed to load drafts.', 'error')
  } finally {
    isLoading.value = false
  }
}

async function patchDraft(
  draft: ReviewDraft,
  payload: Record<string, unknown>,
): Promise<ReviewDraft | null> {
  setBusy(draft.id, true)
  message.value = ''
  try {
    const response = await performFetch<ReviewDraft>(
      `/api/admin/wonderlab/review-drafts/${draft.id}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update draft.')
    }
    upsertDraft(response.data)
    return response.data
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Failed to update draft.', 'error')
    return null
  } finally {
    setBusy(draft.id, false)
  }
}

function editorPayload(draft: ReviewDraft): Record<string, unknown> {
  const state = editor(draft)
  return {
    editedComment: state.comment,
    rating: state.rating,
    reactionType: state.reactionType || null,
  }
}

async function saveDraft(draft: ReviewDraft): Promise<void> {
  const updated = await patchDraft(draft, editorPayload(draft))
  if (updated) setMessage(`Draft #${draft.id} saved.`)
}

async function approveDraft(draft: ReviewDraft): Promise<void> {
  const updated = await patchDraft(draft, {
    ...editorPayload(draft),
    status: 'APPROVED',
  })
  if (updated) setMessage(`Draft #${draft.id} approved. It is still unpublished.`)
}

async function setDraftStatus(draft: ReviewDraft, status: DraftStatus): Promise<void> {
  const updated = await patchDraft(draft, { status })
  if (updated) setMessage(`Draft #${draft.id} moved to ${formatStatus(status)}.`)
}

async function publishDraft(draft: ReviewDraft): Promise<void> {
  setBusy(draft.id, true)
  message.value = ''
  try {
    const response = await performFetch<{
      draft: ReviewDraft
      reactionId: number
      created: boolean
    }>(`/api/admin/wonderlab/review-drafts/${draft.id}/publish`, {
      method: 'POST',
    })
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to publish draft.')
    }

    upsertDraft(response.data.draft)
    setMessage(
      response.data.created
        ? `Published Reaction #${response.data.reactionId}.`
        : `Reconciled existing Reaction #${response.data.reactionId}.`,
    )
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Failed to publish draft.', 'error')
  } finally {
    setBusy(draft.id, false)
  }
}

async function manualPromptHash(): Promise<string> {
  const canonical = [
    createForm.componentId,
    createForm.authorKind,
    createForm.authorId,
    createForm.comment.trim(),
  ].join(':')

  const bytes = new TextEncoder().encode(canonical)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function createManualDraft(): Promise<void> {
  isCreating.value = true
  message.value = ''
  try {
    const componentId = Number(createForm.componentId)
    const authorId = Number(createForm.authorId)
    if (!Number.isInteger(componentId) || componentId <= 0) throw new Error('Valid component ID required.')
    if (!Number.isInteger(authorId) || authorId <= 0) throw new Error('Valid reviewer ID required.')

    const body: Record<string, unknown> = {
      componentId,
      promptVersion: 'curator-manual-v1',
      promptHash: await manualPromptHash(),
      promptPayload: { source: 'curator-manual', createdFrom: 'wonderlab-review-curator' },
      generatedComment: createForm.comment,
      rating: createForm.rating,
      reactionType: createForm.reactionType || null,
      generationProvider: 'CURATOR',
      generationModel: 'MANUAL',
    }
    body[createForm.authorKind === 'BOT' ? 'authorBotId' : 'authorCharacterId'] = authorId

    const response = await performFetch<ReviewDraft>(
      '/api/admin/wonderlab/review-drafts',
      { method: 'POST', body: JSON.stringify(body) },
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create draft.')
    }

    upsertDraft(response.data)
    createForm.comment = ''
    setMessage(`Draft #${response.data.id} is ready for editorial review.`)
  } catch (error) {
    setMessage(error instanceof Error ? error.message : 'Failed to create draft.', 'error')
  } finally {
    isCreating.value = false
  }
}

function clearFilters(): void {
  statusFilter.value = ''
  componentFilter.value = ''
  searchQuery.value = ''
  void loadDrafts()
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function statusClass(status: DraftStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'badge-success'
    case 'PUBLISHED':
      return 'badge-primary'
    case 'REJECTED':
    case 'FAILED':
      return 'badge-error'
    case 'SUPERSEDED':
      return 'badge-ghost'
    default:
      return 'badge-warning'
  }
}

function normalizeImagePath(value: string): string {
  if (value.startsWith('/') || value.startsWith('http')) return value
  return `/images/${value}`
}
</script>

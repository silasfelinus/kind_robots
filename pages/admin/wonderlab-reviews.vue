<!-- /pages/admin/wonderlab-reviews.vue -->
<template>
  <main class="mx-auto min-h-screen max-w-7xl space-y-4 p-4 md:p-6">
    <header class="rounded-3xl border border-base-300 bg-base-100 p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            WonderLab Editorial
          </p>
          <h1 class="mt-2 text-3xl font-black">Personality review drafts</h1>
          <p class="mt-2 text-sm text-base-content/60">
            Nothing on this page publishes automatically. Approval and publication are
            separate curator actions.
          </p>
        </div>
        <div class="flex gap-2">
          <NuxtLink to="/wonderlab" class="btn btn-outline btn-sm">WonderLab</NuxtLink>
          <button class="btn btn-primary btn-sm" :disabled="loading" @click="loadDrafts">
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            Refresh
          </button>
        </div>
      </div>
    </header>

    <div v-if="!ready" class="grid min-h-52 place-items-center rounded-3xl bg-base-100">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div v-else-if="!userStore.isAdmin" class="rounded-3xl border border-error/40 bg-error/10 p-8 text-center">
      <h2 class="text-xl font-black">Administrator access required</h2>
      <p class="mt-2 text-sm">The server independently protects every editorial API.</p>
    </div>

    <template v-else>
      <section class="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div class="rounded-3xl border border-base-300 bg-base-100 p-4">
          <div class="grid gap-3 sm:grid-cols-3">
            <label class="form-control">
              <span class="label-text text-xs font-bold">Status</span>
              <select v-model="statusFilter" class="select select-bordered select-sm mt-1">
                <option value="">All statuses</option>
                <option v-for="status in statuses" :key="status" :value="status">
                  {{ label(status) }}
                </option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text text-xs font-bold">Component ID</span>
              <input v-model="componentFilter" type="number" min="1" class="input input-bordered input-sm mt-1" />
            </label>
            <label class="form-control">
              <span class="label-text text-xs font-bold">Search loaded drafts</span>
              <input v-model="search" type="search" class="input input-bordered input-sm mt-1" />
            </label>
          </div>
          <p class="mt-3 text-sm text-base-content/55">
            {{ filteredDrafts.length }} of {{ drafts.length }} drafts
          </p>
        </div>

        <details class="rounded-3xl border border-base-300 bg-base-100 p-4">
          <summary class="cursor-pointer font-black">Create a curator-written draft</summary>
          <form class="mt-4 grid gap-3" @submit.prevent="createDraft">
            <div class="grid grid-cols-2 gap-2">
              <input v-model="createForm.componentId" required type="number" min="1" class="input input-bordered input-sm" placeholder="Component ID" />
              <select v-model="createForm.authorKind" class="select select-bordered select-sm">
                <option value="BOT">Bot</option>
                <option value="CHARACTER">Character</option>
              </select>
            </div>
            <input v-model="createForm.authorId" required type="number" min="1" class="input input-bordered input-sm" placeholder="Reviewer ID" />
            <textarea v-model="createForm.comment" required maxlength="20000" rows="4" class="textarea textarea-bordered" placeholder="Reviewer-specific museum commentary" />
            <div class="grid grid-cols-2 gap-2">
              <select v-model.number="createForm.rating" class="select select-bordered select-sm">
                <option v-for="rating in ratings" :key="rating" :value="rating">{{ rating }} stars</option>
              </select>
              <select v-model="createForm.reactionType" class="select select-bordered select-sm">
                <option value="">Automatic reaction</option>
                <option v-for="reaction in reactions" :key="reaction" :value="reaction">{{ reaction }}</option>
              </select>
            </div>
            <button class="btn btn-secondary btn-sm" :disabled="creating">
              <span v-if="creating" class="loading loading-spinner loading-xs" />
              Create proposed draft
            </button>
          </form>
        </details>
      </section>

      <p v-if="notice" class="rounded-2xl border p-3 text-sm" :class="noticeError ? 'border-error/40 bg-error/10 text-error' : 'border-success/40 bg-success/10 text-success'">
        {{ notice }}
      </p>

      <div v-if="loading && !drafts.length" class="grid gap-4 md:grid-cols-2">
        <div v-for="n in 4" :key="n" class="h-72 animate-pulse rounded-3xl bg-base-200" />
      </div>

      <div v-else-if="!filteredDrafts.length" class="rounded-3xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
        <h2 class="text-xl font-black">No matching drafts</h2>
      </div>

      <section v-else class="grid gap-4 lg:grid-cols-2">
        <article v-for="draft in filteredDrafts" :key="draft.id" class="rounded-3xl border border-base-300 bg-base-100 p-4">
          <header class="flex items-start gap-3">
            <div class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10">
              <img v-if="draft.author.avatarImage" :src="imagePath(draft.author.avatarImage)" :alt="draft.author.name" class="size-full object-cover" />
              <Icon v-else name="kind-icon:sparkles" class="size-5 text-primary" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 class="font-black">{{ draft.author.name }}</h2>
                  <p class="text-sm text-base-content/60">
                    {{ draft.componentTitle || draft.componentName }} · #{{ draft.componentId }}
                  </p>
                </div>
                <span class="badge" :class="statusClass(draft.status)">{{ label(draft.status) }}</span>
              </div>
              <p class="mt-1 text-xs text-base-content/50">
                {{ draft.author.kind }} · {{ draft.author.role }} · Draft #{{ draft.id }}
                <span v-if="draft.publishedReactionId"> · Reaction #{{ draft.publishedReactionId }}</span>
              </p>
            </div>
          </header>

          <textarea v-model="editor(draft).comment" rows="7" maxlength="20000" class="textarea textarea-bordered mt-4 w-full" :disabled="terminal(draft.status)" />

          <details class="mt-3 rounded-2xl bg-base-200/60 p-3">
            <summary class="cursor-pointer text-xs font-black uppercase">Original and provenance</summary>
            <p class="mt-3 whitespace-pre-wrap text-sm">{{ draft.generatedComment }}</p>
            <p class="mt-3 text-xs text-base-content/55">
              {{ draft.promptVersion }} · {{ draft.generationProvider || 'Manual' }} ·
              {{ draft.generationModel || 'Curator' }}
            </p>
          </details>

          <div class="mt-3 grid grid-cols-2 gap-2">
            <select v-model.number="editor(draft).rating" class="select select-bordered select-sm" :disabled="terminal(draft.status)">
              <option v-for="rating in ratings" :key="rating" :value="rating">{{ rating }} stars</option>
            </select>
            <select v-model="editor(draft).reactionType" class="select select-bordered select-sm" :disabled="terminal(draft.status)">
              <option value="">Automatic reaction</option>
              <option v-for="reaction in reactions" :key="reaction" :value="reaction">{{ reaction }}</option>
            </select>
          </div>

          <footer class="mt-4 flex flex-wrap gap-2 border-t border-base-300 pt-4">
            <button v-if="!terminal(draft.status)" class="btn btn-outline btn-sm" :disabled="busy(draft.id)" @click="save(draft)">Save</button>
            <button v-if="['PROPOSED', 'REJECTED', 'FAILED'].includes(draft.status)" class="btn btn-success btn-sm" :disabled="busy(draft.id)" @click="approve(draft)">Approve</button>
            <button v-if="['PROPOSED', 'APPROVED', 'FAILED'].includes(draft.status)" class="btn btn-error btn-outline btn-sm" :disabled="busy(draft.id)" @click="changeStatus(draft, 'REJECTED')">Reject</button>
            <button v-if="['REJECTED', 'FAILED', 'APPROVED'].includes(draft.status)" class="btn btn-warning btn-outline btn-sm" :disabled="busy(draft.id)" @click="changeStatus(draft, 'PROPOSED')">Reopen</button>
            <button v-if="draft.status === 'APPROVED'" class="btn btn-primary btn-sm" :disabled="busy(draft.id)" @click="publishDraft(draft)">Publish approved review</button>
          </footer>
        </article>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type DraftStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'FAILED' | 'SUPERSEDED'
type ReviewDraft = {
  id: number
  status: DraftStatus
  componentId: number
  componentName: string
  componentTitle: string | null
  author: { kind: 'BOT' | 'CHARACTER'; id: number; name: string; avatarImage: string | null; role: string }
  publishedReactionId: number | null
  promptVersion: string
  generatedComment: string
  editedComment: string | null
  finalComment: string
  rating: number
  reactionType: string | null
  generationProvider: string | null
  generationModel: string | null
}
type DraftEditor = { comment: string; rating: number; reactionType: string }

const statuses: DraftStatus[] = ['PROPOSED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'FAILED', 'SUPERSEDED']
const reactions = ['LOVED', 'CLAPPED', 'BOOED', 'HATED', 'NEUTRAL', 'FLAGGED']
const ratings = [0, 1, 2, 3, 4, 5]
const userStore = useUserStore()
const drafts = ref<ReviewDraft[]>([])
const editors = reactive<Record<number, DraftEditor>>({})
const busyIds = ref(new Set<number>())
const ready = ref(false)
const loading = ref(false)
const creating = ref(false)
const notice = ref('')
const noticeError = ref(false)
const statusFilter = ref('')
const componentFilter = ref('')
const search = ref('')
const createForm = reactive({ componentId: '', authorKind: 'BOT' as 'BOT' | 'CHARACTER', authorId: '', comment: '', rating: 0, reactionType: '' })

const filteredDrafts = computed(() => {
  const query = search.value.trim().toLowerCase()
  return drafts.value.filter((draft) => {
    if (statusFilter.value && draft.status !== statusFilter.value) return false
    if (componentFilter.value && draft.componentId !== Number(componentFilter.value)) return false
    return !query || [draft.componentName, draft.componentTitle, draft.author.name, draft.generatedComment, draft.editedComment]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await loadDrafts()
})
watch(statusFilter, () => { if (userStore.isAdmin) void loadDrafts() })

function editor(draft: ReviewDraft): DraftEditor {
  let state = editors[draft.id]
  if (!state) {
    state = { comment: draft.editedComment || draft.generatedComment, rating: draft.rating, reactionType: draft.reactionType || '' }
    editors[draft.id] = state
  }
  return state
}
function sync(draft: ReviewDraft): void {
  editors[draft.id] = { comment: draft.editedComment || draft.generatedComment, rating: draft.rating, reactionType: draft.reactionType || '' }
}
function upsert(draft: ReviewDraft): void {
  const index = drafts.value.findIndex((item) => item.id === draft.id)
  if (index < 0) drafts.value.unshift(draft)
  else drafts.value.splice(index, 1, draft)
  sync(draft)
}
function busy(id: number): boolean { return busyIds.value.has(id) }
function setBusy(id: number, value: boolean): void {
  const next = new Set(busyIds.value)
  value ? next.add(id) : next.delete(id)
  busyIds.value = next
}
function terminal(status: DraftStatus): boolean { return status === 'PUBLISHED' || status === 'SUPERSEDED' }
function alert(text: string, error = false): void { notice.value = text; noticeError.value = error }

async function loadDrafts(): Promise<void> {
  loading.value = true
  try {
    const query = new URLSearchParams({ limit: '200' })
    if (statusFilter.value) query.set('status', statusFilter.value)
    if (componentFilter.value) query.set('componentId', componentFilter.value)
    const response = await performFetch<ReviewDraft[]>(`/api/admin/wonderlab/review-drafts?${query}`)
    if (!response.success) throw new Error(response.message)
    drafts.value = response.data || []
    drafts.value.forEach(sync)
  } catch (error) { alert(error instanceof Error ? error.message : 'Failed to load drafts.', true) }
  finally { loading.value = false }
}

async function patch(draft: ReviewDraft, payload: Record<string, unknown>): Promise<ReviewDraft | null> {
  setBusy(draft.id, true)
  try {
    const response = await performFetch<ReviewDraft>(`/api/admin/wonderlab/review-drafts/${draft.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    if (!response.success || !response.data) throw new Error(response.message)
    upsert(response.data)
    return response.data
  } catch (error) { alert(error instanceof Error ? error.message : 'Draft update failed.', true); return null }
  finally { setBusy(draft.id, false) }
}
function editPayload(draft: ReviewDraft) { const state = editor(draft); return { editedComment: state.comment, rating: state.rating, reactionType: state.reactionType || null } }
async function save(draft: ReviewDraft) { if (await patch(draft, editPayload(draft))) alert(`Draft #${draft.id} saved.`) }
async function approve(draft: ReviewDraft) { if (await patch(draft, { ...editPayload(draft), status: 'APPROVED' })) alert(`Draft #${draft.id} approved but unpublished.`) }
async function changeStatus(draft: ReviewDraft, status: DraftStatus) { if (await patch(draft, { status })) alert(`Draft #${draft.id} moved to ${label(status)}.`) }

async function publishDraft(draft: ReviewDraft): Promise<void> {
  setBusy(draft.id, true)
  try {
    const response = await performFetch<{ draft: ReviewDraft; reactionId: number; created: boolean }>(`/api/admin/wonderlab/review-drafts/${draft.id}/publish`, { method: 'POST' })
    if (!response.success || !response.data) throw new Error(response.message)
    upsert(response.data.draft)
    alert(`${response.data.created ? 'Published' : 'Reconciled'} Reaction #${response.data.reactionId}.`)
  } catch (error) { alert(error instanceof Error ? error.message : 'Publication failed.', true) }
  finally { setBusy(draft.id, false) }
}

async function manualHash(): Promise<string> {
  const text = [createForm.componentId, createForm.authorKind, createForm.authorId, createForm.comment.trim()].join(':')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
async function createDraft(): Promise<void> {
  creating.value = true
  try {
    const body: Record<string, unknown> = {
      componentId: Number(createForm.componentId),
      promptVersion: 'curator-manual-v1',
      promptHash: await manualHash(),
      promptPayload: { source: 'curator-manual' },
      generatedComment: createForm.comment,
      rating: createForm.rating,
      reactionType: createForm.reactionType || null,
      generationProvider: 'CURATOR',
      generationModel: 'MANUAL',
    }
    body[createForm.authorKind === 'BOT' ? 'authorBotId' : 'authorCharacterId'] = Number(createForm.authorId)
    const response = await performFetch<ReviewDraft>('/api/admin/wonderlab/review-drafts', { method: 'POST', body: JSON.stringify(body) })
    if (!response.success || !response.data) throw new Error(response.message)
    upsert(response.data)
    createForm.comment = ''
    alert(`Draft #${response.data.id} created.`)
  } catch (error) { alert(error instanceof Error ? error.message : 'Draft creation failed.', true) }
  finally { creating.value = false }
}

function label(value: string): string { return value.toLowerCase().replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase()) }
function statusClass(status: DraftStatus): string {
  if (status === 'APPROVED') return 'badge-success'
  if (status === 'PUBLISHED') return 'badge-primary'
  if (status === 'REJECTED' || status === 'FAILED') return 'badge-error'
  if (status === 'SUPERSEDED') return 'badge-ghost'
  return 'badge-warning'
}
function imagePath(value: string): string { return value.startsWith('/') || value.startsWith('http') ? value : `/images/${value}` }
</script>

<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="kr-text-eyebrow text-xs tracking-widest text-primary">Private legacy collection</p>
          <div class="kr-text-black-2xl mt-1">Art Archive</div>
          <p class="kr-text-dim-sm mt-1 max-w-3xl">Browse imported legacy art by folder, processing state, provenance match, and rating. Everything here remains private and mature.</p>
        </div>
        <button type="button" class="kr-btn btn-outline" :disabled="archive.loading" @click="archive.fetchEntries()"><span v-if="archive.loading" class="kr-spinner-xs" /><Icon v-else name="kind-icon:refresh" class="kr-icon-4" /> Refresh</button>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel"><span class="kr-spinner-lg-primary" /></div>
      <div v-else-if="!userStore.isAdmin" class="kr-note kr-note-error p-8 text-center font-normal"><p class="kr-text-black-xl text-base-content">Administrator access required</p><p class="kr-text-dim-sm mt-2">The private Art Archive is restricted to administrators.</p></div>
      <template v-else>
        <section class="kr-panel grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-6">
          <label class="xl:col-span-2"><span class="kr-text-dim-xs">Search path</span><input v-model="archive.filters.search" class="kr-input mt-1 w-full" placeholder="folder / filename" @keyup.enter="applyFilters" /></label>
          <label><span class="kr-text-dim-xs">Folder</span><select v-model="archive.filters.folderCollectionId" class="kr-select-sm mt-1 w-full" @change="applyFilters"><option value="">All folders</option><option v-for="folder in archive.folders" :key="folder.id" :value="String(folder.id)">{{ folder.label }}</option></select></label>
          <label><span class="kr-text-dim-xs">Processed</span><select v-model="archive.filters.processState" class="kr-select-sm mt-1 w-full" @change="applyFilters"><option value="">Any state</option><option value="PENDING">Unprocessed</option><option value="IMPORTED">Imported</option><option value="ERROR">Error</option><option value="MISSING">Missing</option></select></label>
          <label><span class="kr-text-dim-xs">Resource match</span><select v-model="archive.filters.matchState" class="kr-select-sm mt-1 w-full" @change="applyFilters"><option value="">Any match</option><option value="UNMATCHED">Unmatched</option><option value="SUGGESTED">Suggested</option><option value="AMBIGUOUS">Ambiguous</option><option value="CONFIRMED">Confirmed</option><option value="MANUAL">Manual</option></select></label>
          <label><span class="kr-text-dim-xs">Rating</span><select v-model="archive.filters.rating" class="kr-select-sm mt-1 w-full" @change="applyFilters"><option value="">Any rating</option><option v-for="rating in 5" :key="rating" :value="String(rating)">{{ rating }} star{{ rating === 1 ? '' : 's' }}</option></select></label>
          <label class="flex items-end gap-2 pb-1.5"><input v-model="archive.filters.includeInactive" type="checkbox" class="kr-checkbox-primary-sm" @change="applyFilters" /><span class="kr-text-dim-xs">Show trash</span></label>
        </section>

        <div v-if="archive.error" class="kr-note kr-note-error">{{ archive.error }}</div>

        <section class="kr-panel space-y-3 p-3" aria-label="Batch curation board">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div><p class="kr-text-black-base">Curation board</p><p class="kr-text-dim-xs">Select thumbnails, then click or drag them onto an action. Failed items stay selected for retry.</p></div>
            <div class="flex items-center gap-2"><span class="badge badge-primary">{{ archive.selectedCount }} selected</span><button v-if="archive.selectedCount" type="button" class="kr-btn btn-ghost btn-xs" @click="archive.clearBatchSelection()">Clear</button></div>
          </div>
          <div v-if="archive.selectedCount" class="flex flex-wrap gap-2">
            <button v-for="n in 5" :key="`batch-${n}`" type="button" class="kr-btn btn-outline btn-sm" :disabled="archive.actionPending" @dragover.prevent @drop.prevent="onBatchRating(n)" @click="onBatchRating(n)">{{ n }}★</button>
            <button type="button" class="kr-btn btn-error btn-sm" :disabled="archive.actionPending" @dragover.prevent @drop.prevent="requestBatchDelete" @click="requestBatchDelete"><Icon name="kind-icon:trash" class="kr-icon-4" /> Delete selected</button>
            <button v-for="preset in archive.presets" :key="preset.id" type="button" class="kr-btn btn-outline btn-sm" :title="`${preset.actionType}: queue this preset as a durable ArtJob for the selected images`" @dragover.prevent @drop.prevent="previewPreset(preset.id)" @click="previewPreset(preset.id)"><Icon name="kind-icon:magic" class="kr-icon-4" /> {{ preset.label }}</button>
          </div>
          <div v-if="pendingDelete" class="kr-note kr-note-warning flex flex-wrap items-center justify-between gap-3"><span>Move {{ archive.selectedCount }} selected file{{ archive.selectedCount === 1 ? '' : 's' }} to recoverable archive trash?</span><div class="flex gap-2"><button type="button" class="kr-btn btn-error btn-sm" @click="confirmBatchDelete">Confirm delete</button><button type="button" class="kr-btn btn-ghost btn-sm" @click="pendingDelete = false">Cancel</button></div></div>
          <div v-if="selectedPreset" class="kr-note flex flex-wrap items-center justify-between gap-3"><span><strong>{{ selectedPreset.label }}</strong> will queue a durable ArtJob for {{ archive.selectedCount }} selected image{{ archive.selectedCount === 1 ? '' : 's' }}, built from each entry's imported prompt/settings. The current archive file is never touched -- review each render and use Delete separately once satisfied.</span><div class="flex gap-2"><button type="button" class="kr-btn btn-primary btn-sm" :disabled="archive.actionPending" @click="confirmApplyPreset"><span v-if="archive.actionPending" class="kr-spinner-xs" /><span v-else>Queue</span></button><button type="button" class="kr-btn btn-ghost btn-sm" @click="selectedPresetId = null">Cancel</button></div></div>
          <div v-if="archive.batchResult" class="kr-note" :class="archive.batchResult.failed.length ? 'kr-note-warning' : 'kr-note-success'">{{ archive.batchResult.succeeded }} / {{ archive.batchResult.attempted }} succeeded<span v-if="archive.batchResult.failed.length">; {{ archive.batchResult.failed.length }} failed and remain selected.</span></div>
        </section>

        <section class="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div class="min-w-0">
            <div class="mb-2 flex items-center justify-between gap-3"><p class="kr-text-dim-sm">{{ archive.total }} indexed image{{ archive.total === 1 ? '' : 's' }}</p><div class="flex items-center gap-2"><button class="kr-btn btn-ghost btn-sm" :disabled="archive.page <= 1 || archive.loading" @click="changePage(-1)">Previous</button><span class="kr-text-dim-xs">{{ archive.page }} / {{ archive.pageCount }}</span><button class="kr-btn btn-ghost btn-sm" :disabled="archive.page >= archive.pageCount || archive.loading" @click="changePage(1)">Next</button></div></div>
            <div class="mb-2 flex flex-wrap items-center gap-2"><span class="kr-text-dim-xs">Rate open image:</span><button v-for="n in 5" :key="n" type="button" class="kr-btn btn-outline btn-xs" :class="{ 'btn-primary': dragOverRating === n }" :title="`Rate ${n} star${n === 1 ? '' : 's'} -- click while an image is selected, or drag an image here`" @dragover.prevent="dragOverRating = n" @dragleave="dragOverRating = null" @drop.prevent="onRatingDrop(n)" @click="onRatingClick(n)">{{ n }}★</button><button type="button" class="kr-btn btn-ghost btn-xs" title="Clear the selected image's rating" @click="onRatingClick(null)">Clear</button></div>
            <div v-if="archive.loading" class="grid min-h-64 place-items-center kr-panel"><span class="kr-spinner-lg-primary" /></div>
            <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              <div v-for="entry in archive.entries" :key="entry.id" class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 transition hover:border-primary" :class="{ 'opacity-60': !entry.isActive, 'ring-2 ring-primary': archive.selectedIds.includes(entry.id) }">
                <button type="button" draggable="true" class="block w-full text-left" @click="archive.selectEntry(entry.id)" @dragstart="onDragStart(entry.id)" @dragend="draggingEntryId = null"><div class="aspect-[2/3] bg-base-300"><img v-if="entry.thumbnailPath" :src="entry.thumbnailPath" :alt="entry.relativePath" class="h-full w-full object-cover" loading="lazy" /><div v-else class="grid h-full place-items-center"><Icon name="kind-icon:image" class="h-10 w-10 opacity-30" /></div></div><div class="space-y-1 p-2"><p class="truncate text-xs font-semibold">{{ fileName(entry.relativePath) }}</p><p class="truncate text-[10px] opacity-60">{{ entry.parentFolder || 'Archive root' }}</p><div class="flex flex-wrap gap-1"><span v-if="!entry.isActive" class="badge badge-xs badge-error">Trashed</span><span class="badge badge-xs">{{ entry.processState }}</span><span class="badge badge-xs">{{ entry.matchState }}</span><span v-if="entry.rating" class="badge badge-xs">★ {{ entry.rating }}</span><span v-if="archive.entryJobs[entry.id]" class="badge badge-xs" :class="jobBadgeClass(archive.entryJobs[entry.id]?.status)" :title="`ArtJob #${archive.entryJobs[entry.id]?.jobId}${archive.entryJobs[entry.id]?.error ? ': ' + archive.entryJobs[entry.id]?.error : ''}`">Job {{ archive.entryJobs[entry.id]?.status }}</span></div></div></button>
                <button type="button" class="kr-btn btn-circle btn-sm absolute right-2 top-2" :class="archive.selectedIds.includes(entry.id) ? 'btn-primary' : 'btn-ghost bg-base-100/80'" :aria-pressed="archive.selectedIds.includes(entry.id)" :title="archive.selectedIds.includes(entry.id) ? 'Remove from batch' : 'Add to batch'" @click.stop="archive.toggleBatchSelection(entry.id)"><Icon :name="archive.selectedIds.includes(entry.id) ? 'kind-icon:check' : 'kind-icon:plus'" class="kr-icon-4" /></button>
              </div>
            </div>
          </div>

          <aside class="kr-panel h-fit p-4 xl:sticky xl:top-0">
            <div v-if="archive.detailLoading" class="grid min-h-48 place-items-center"><span class="kr-spinner-lg-primary" /></div>
            <div v-else-if="archive.detail" class="space-y-4"><div class="flex items-start justify-between gap-3"><div><p class="kr-text-eyebrow">Entry #{{ archive.detail.entry.id }}</p><h2 class="mt-1 break-all font-bold">{{ fileName(archive.detail.entry.relativePath) }}</h2></div><div class="flex items-center gap-2"><button v-if="archive.detail.entry.isActive" type="button" class="kr-btn btn-error btn-sm" :disabled="archive.actionPending" @click="archive.quarantineEntry(archive.detail.entry.id)"><span v-if="archive.actionPending" class="kr-spinner-xs" /><Icon v-else name="kind-icon:trash" class="kr-icon-4" /> Delete</button><button v-else type="button" class="kr-btn btn-outline btn-sm" :disabled="archive.actionPending" @click="archive.restoreEntry(archive.detail.entry.id)"><span v-if="archive.actionPending" class="kr-spinner-xs" /><Icon v-else name="kind-icon:refresh" class="kr-icon-4" /> Restore</button><button class="kr-btn btn-ghost btn-sm" @click="archive.clearSelection()"><Icon name="kind-icon:close" /></button></div></div><p v-if="!archive.detail.entry.isActive" class="kr-note kr-note-warning text-xs">This entry is in the trash. Restoring will move its file back and make it active again.</p><img v-if="archive.detail.entry.imagePath" :src="archive.detail.entry.imagePath" class="aspect-[2/3] w-full rounded-2xl bg-base-300 object-cover" :alt="archive.detail.entry.relativePath" /><a v-if="archive.detail.entry.originalPath" :href="archive.detail.entry.originalPath" target="_blank" rel="noopener" class="kr-text-dim-xs underline">View original</a><dl class="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-xs"><dt class="opacity-60">Folder</dt><dd class="break-all">{{ archive.detail.entry.parentFolder || 'Archive root' }}</dd><dt class="opacity-60">State</dt><dd>{{ archive.detail.entry.processState }}</dd><dt class="opacity-60">Match</dt><dd>{{ archive.detail.entry.matchState }}<span v-if="archive.detail.entry.resourceMatchLocked"> · locked</span></dd><dt class="opacity-60">Rating</dt><dd>{{ archive.detail.entry.rating || 'Unrated' }}</dd><dt class="opacity-60">Checkpoint</dt><dd>{{ archive.detail.artImage?.checkpointResourceId || 'Unresolved' }}</dd></dl><div><p class="kr-text-dim-xs mb-1">Prompt</p><p class="max-h-28 overflow-auto whitespace-pre-wrap text-xs">{{ archive.detail.artImage?.promptString || 'No normalized prompt' }}</p></div><details><summary class="cursor-pointer text-xs font-semibold">Extracted metadata</summary><pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-base-300 p-3 text-[10px]">{{ pretty(archive.detail.entry.extractedMetadata) }}</pre></details><details><summary class="cursor-pointer text-xs font-semibold">Resource match evidence</summary><pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-base-300 p-3 text-[10px]">{{ pretty(archive.detail.entry.matchSummary) }}</pre></details></div>
            <div v-else class="grid min-h-48 place-items-center text-center"><div><Icon name="kind-icon:image" class="mx-auto h-10 w-10 opacity-30" /><p class="kr-text-dim-sm mt-2">Choose an image to inspect its prompt, provenance, and extracted metadata.</p></div></div>
          </aside>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useArtArchiveStore } from '@/stores/artArchiveStore'
import { useUserStore } from '@/stores/userStore'

const archive = useArtArchiveStore()
const userStore = useUserStore()
const ready = computed(() => userStore.initialized)
const draggingEntryId = ref<number | null>(null)
const dragOverRating = ref<number | null>(null)
const pendingDelete = ref(false)
const selectedPresetId = ref<number | null>(null)
const selectedPreset = computed(() => archive.presets.find((preset) => preset.id === selectedPresetId.value) || null)

function fileName(path: string) { return path.split('/').pop() || path }
function jobBadgeClass(status: string | undefined) {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED' || status === 'CANCELLED') return 'badge-error'
  return 'badge-warning'
}
function pretty(value: unknown) { return value ? JSON.stringify(value, null, 2) : 'No metadata recorded.' }
async function applyFilters() { await archive.fetchEntries(true) }
async function changePage(delta: number) { archive.page += delta; await archive.fetchEntries() }
function onDragStart(id: number) { draggingEntryId.value = id; if (!archive.selectedIds.includes(id)) archive.toggleBatchSelection(id) }
async function onRatingClick(rating: number | null) { if (archive.detail) await archive.rateEntry(archive.detail.entry.id, rating) }
async function onRatingDrop(rating: number) { dragOverRating.value = null; const id = draggingEntryId.value; draggingEntryId.value = null; if (id !== null) await archive.rateEntry(id, rating) }
async function onBatchRating(rating: number) { if (archive.selectedCount) await archive.rateSelected(rating) }
function requestBatchDelete() { if (archive.selectedCount) pendingDelete.value = true }
async function confirmBatchDelete() { pendingDelete.value = false; await archive.quarantineSelected() }
function previewPreset(id: number) { if (archive.selectedCount) selectedPresetId.value = id }
async function confirmApplyPreset() {
  if (!selectedPreset.value) return
  const presetId = selectedPreset.value.id
  selectedPresetId.value = null
  await archive.applyPresetToSelected(presetId)
}

let jobPollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  if (!userStore.initialized) await userStore.initialize()
  if (userStore.isAdmin) await Promise.all([archive.fetchEntries(true), archive.fetchPresets()])
  jobPollTimer = setInterval(() => { void archive.refreshPendingEntryJobs() }, 4000)
})

onUnmounted(() => {
  if (jobPollTimer !== null) clearInterval(jobPollTimer)
})
</script>
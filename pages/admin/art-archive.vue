<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="kr-text-eyebrow text-xs tracking-widest text-primary">Private legacy collection</p>
          <div class="kr-text-black-2xl mt-1">Art Archive</div>
          <p class="kr-text-dim-sm mt-1 max-w-3xl">Browse imported legacy art by folder, processing state, provenance match, and rating. Everything here remains private and mature.</p>
        </div>
        <button type="button" class="kr-btn btn-outline" :disabled="archive.loading" @click="archive.fetchEntries()">
          <span v-if="archive.loading" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:refresh" class="kr-icon-4" />
          Refresh
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel"><span class="kr-spinner-lg-primary" /></div>
      <div v-else-if="!userStore.isAdmin" class="kr-note kr-note-error p-8 text-center font-normal">
        <p class="kr-text-black-xl text-base-content">Administrator access required</p>
        <p class="kr-text-dim-sm mt-2">The private Art Archive is restricted to administrators.</p>
      </div>
      <template v-else>
        <section class="kr-panel grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-6">
          <label class="xl:col-span-2">
            <span class="kr-text-dim-xs">Search path</span>
            <input v-model="archive.filters.search" class="kr-input mt-1 w-full" placeholder="folder / filename" @keyup.enter="applyFilters" />
          </label>
          <label>
            <span class="kr-text-dim-xs">Folder</span>
            <select v-model="archive.filters.folderCollectionId" class="kr-select mt-1 w-full" @change="applyFilters">
              <option value="">All folders</option>
              <option v-for="folder in archive.folders" :key="folder.id" :value="String(folder.id)">{{ folder.label }}</option>
            </select>
          </label>
          <label>
            <span class="kr-text-dim-xs">Processed</span>
            <select v-model="archive.filters.processState" class="kr-select mt-1 w-full" @change="applyFilters">
              <option value="">Any state</option><option value="PENDING">Unprocessed</option><option value="IMPORTED">Imported</option><option value="ERROR">Error</option><option value="MISSING">Missing</option>
            </select>
          </label>
          <label>
            <span class="kr-text-dim-xs">Resource match</span>
            <select v-model="archive.filters.matchState" class="kr-select mt-1 w-full" @change="applyFilters">
              <option value="">Any match</option><option value="UNMATCHED">Unmatched</option><option value="SUGGESTED">Suggested</option><option value="AMBIGUOUS">Ambiguous</option><option value="CONFIRMED">Confirmed</option><option value="MANUAL">Manual</option>
            </select>
          </label>
          <label>
            <span class="kr-text-dim-xs">Rating</span>
            <select v-model="archive.filters.rating" class="kr-select mt-1 w-full" @change="applyFilters">
              <option value="">Any rating</option><option v-for="rating in 5" :key="rating" :value="String(rating)">{{ rating }} star{{ rating === 1 ? '' : 's' }}</option>
            </select>
          </label>
        </section>

        <div v-if="archive.error" class="kr-note kr-note-error">{{ archive.error }}</div>

        <section class="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div class="min-w-0">
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="kr-text-dim-sm">{{ archive.total }} indexed image{{ archive.total === 1 ? '' : 's' }}</p>
              <div class="flex items-center gap-2">
                <button class="kr-btn btn-ghost btn-sm" :disabled="archive.page <= 1 || archive.loading" @click="changePage(-1)">Previous</button>
                <span class="kr-text-dim-xs">{{ archive.page }} / {{ archive.pageCount }}</span>
                <button class="kr-btn btn-ghost btn-sm" :disabled="archive.page >= archive.pageCount || archive.loading" @click="changePage(1)">Next</button>
              </div>
            </div>
            <div v-if="archive.loading" class="grid min-h-64 place-items-center kr-panel"><span class="kr-spinner-lg-primary" /></div>
            <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              <button v-for="entry in archive.entries" :key="entry.id" type="button" class="group overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition hover:border-primary" @click="archive.selectEntry(entry.id)">
                <div class="aspect-[2/3] bg-base-300">
                  <img v-if="entry.artImageId" :src="`/api/art/image/${entry.artImageId}`" :alt="entry.relativePath" class="h-full w-full object-cover" loading="lazy" />
                  <div v-else class="grid h-full place-items-center"><Icon name="kind-icon:image" class="h-10 w-10 opacity-30" /></div>
                </div>
                <div class="space-y-1 p-2">
                  <p class="truncate text-xs font-semibold">{{ fileName(entry.relativePath) }}</p>
                  <p class="truncate text-[10px] opacity-60">{{ entry.parentFolder || 'Archive root' }}</p>
                  <div class="flex flex-wrap gap-1"><span class="badge badge-xs">{{ entry.processState }}</span><span class="badge badge-xs">{{ entry.matchState }}</span><span v-if="entry.rating" class="badge badge-xs">★ {{ entry.rating }}</span></div>
                </div>
              </button>
            </div>
          </div>

          <aside class="kr-panel h-fit p-4 xl:sticky xl:top-0">
            <div v-if="archive.detailLoading" class="grid min-h-48 place-items-center"><span class="kr-spinner-lg-primary" /></div>
            <div v-else-if="archive.detail" class="space-y-4">
              <div class="flex items-start justify-between gap-3"><div><p class="kr-text-eyebrow">Entry #{{ archive.detail.entry.id }}</p><h2 class="mt-1 break-all font-bold">{{ fileName(archive.detail.entry.relativePath) }}</h2></div><button class="kr-btn btn-ghost btn-sm" @click="archive.clearSelection()"><Icon name="kind-icon:close" /></button></div>
              <img v-if="archive.detail.artImage?.id" :src="`/api/art/image/${archive.detail.artImage.id}`" class="aspect-[2/3] w-full rounded-2xl bg-base-300 object-cover" :alt="archive.detail.entry.relativePath" />
              <dl class="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-xs"><dt class="opacity-60">Folder</dt><dd class="break-all">{{ archive.detail.entry.parentFolder || 'Archive root' }}</dd><dt class="opacity-60">State</dt><dd>{{ archive.detail.entry.processState }}</dd><dt class="opacity-60">Match</dt><dd>{{ archive.detail.entry.matchState }}<span v-if="archive.detail.entry.resourceMatchLocked"> · locked</span></dd><dt class="opacity-60">Rating</dt><dd>{{ archive.detail.entry.rating || 'Unrated' }}</dd><dt class="opacity-60">Checkpoint</dt><dd>{{ archive.detail.artImage?.checkpointResourceId || 'Unresolved' }}</dd></dl>
              <div><p class="kr-text-dim-xs mb-1">Prompt</p><p class="max-h-28 overflow-auto whitespace-pre-wrap text-xs">{{ archive.detail.artImage?.promptString || 'No normalized prompt' }}</p></div>
              <details><summary class="cursor-pointer text-xs font-semibold">Extracted metadata</summary><pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-base-300 p-3 text-[10px]">{{ pretty(archive.detail.entry.extractedMetadata) }}</pre></details>
              <details><summary class="cursor-pointer text-xs font-semibold">Resource match evidence</summary><pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-base-300 p-3 text-[10px]">{{ pretty(archive.detail.entry.matchSummary) }}</pre></details>
            </div>
            <div v-else class="grid min-h-48 place-items-center text-center"><div><Icon name="kind-icon:image" class="mx-auto h-10 w-10 opacity-30" /><p class="kr-text-dim-sm mt-2">Choose an image to inspect its prompt, provenance, and extracted metadata.</p></div></div>
          </aside>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useArtArchiveStore } from '@/stores/artArchiveStore'
import { useUserStore } from '@/stores/userStore'

const archive = useArtArchiveStore()
const userStore = useUserStore()
const ready = computed(() => userStore.isInitialized)

function fileName(path: string) { return path.split('/').pop() || path }
function pretty(value: unknown) { return value ? JSON.stringify(value, null, 2) : 'No metadata recorded.' }
async function applyFilters() { await archive.fetchEntries(true) }
async function changePage(delta: number) { archive.page += delta; await archive.fetchEntries() }

onMounted(async () => {
  if (!userStore.isInitialized) await userStore.initialize()
  if (userStore.isAdmin) await archive.fetchEntries(true)
})
</script>

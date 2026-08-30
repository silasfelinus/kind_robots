<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            Admin production
          </p>
          <p class="mt-1 text-3xl font-black">Scene Animator</p>
          <p class="mt-2 text-sm text-base-content/65">
            Point Kind Robots at a folder of still scenes and let the existing Comfy video
            queue bring each one to life. No shot-by-shot prompt writing required.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-outline">Private output</span>
          <span class="badge badge-outline">ArtJob-backed resume</span>
          <button
            type="button"
            class="btn btn-sm rounded-xl"
            :disabled="store.loading || store.queueing || !userStore.isAdmin"
            @click="store.load()"
          >
            <span v-if="store.loading" class="loading loading-spinner loading-xs" />
            Refresh
          </button>
        </div>
      </header>

      <div v-if="!ready" class="grid min-h-60 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center font-normal"
      >
        <p class="text-xl font-black text-base-content">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          Folder animation can enqueue substantial local GPU work, so this surface is admin-only.
        </p>
      </div>

      <template v-else>
        <section class="grid gap-4 xl:grid-cols-[minmax(270px,0.34fr)_minmax(0,1fr)]">
          <aside class="kr-panel space-y-4 p-4 md:p-5">
            <div>
              <p class="text-xs font-black uppercase tracking-wider text-primary">Batch setup</p>
              <h2 class="mt-1 text-xl font-black">Choose the source, then motion</h2>
            </div>

            <label class="form-control gap-1">
              <span class="text-xs font-bold text-base-content/60">Source folder</span>
              <select
                class="select select-bordered rounded-xl"
                :value="store.selectedFolder"
                :disabled="store.loading || store.queueing || !store.folders.length"
                @change="onFolderChange"
              >
                <option v-if="!store.folders.length" value="">No image folders found</option>
                <option
                  v-for="folder in store.folders"
                  :key="folder.name || '__root__'"
                  :value="folder.name"
                >
                  {{ folder.name || '(animate root)' }} · {{ folder.imageCount }} image{{ folder.imageCount === 1 ? '' : 's' }}{{ folderCompletionSuffix(folder.name) }}
                </option>
              </select>
            </label>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label class="form-control gap-1">
                <span class="text-xs font-bold text-base-content/60">Engine</span>
                <select
                  class="select select-bordered rounded-xl"
                  :value="store.engine"
                  :disabled="store.loading || store.queueing"
                  @change="onEngineChange"
                >
                  <option value="wan">WAN</option>
                  <option value="ltx">LTX</option>
                </select>
              </label>

              <label class="form-control gap-1">
                <span class="text-xs font-bold text-base-content/60">Clip length</span>
                <div class="join w-full">
                  <input
                    v-model.number="store.durationSeconds"
                    type="number"
                    min="0.25"
                    max="30"
                    step="0.25"
                    class="input input-bordered join-item min-w-0 flex-1"
                    :disabled="store.loading || store.queueing"
                    @change="onDurationChange"
                  />
                  <span class="join-item grid place-items-center border border-base-300 bg-base-200 px-3 text-sm font-bold">sec</span>
                </div>
              </label>
            </div>

            <label class="form-control gap-1">
              <span class="text-xs font-bold text-base-content/60">Video preset</span>
              <select
                class="select select-bordered rounded-xl"
                :value="store.presetId"
                :disabled="store.loading || store.queueing"
                @change="onPresetChange"
              >
                <option v-for="preset in store.presets" :key="preset.id" :value="preset.id">
                  {{ preset.label }} · {{ preset.width }}×{{ preset.height }} · {{ preset.fps }} fps
                </option>
              </select>
              <span class="text-xs leading-relaxed text-base-content/50">
                {{ store.selectedPreset.description }}
              </span>
            </label>

            <label class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-base-300 bg-base-100 p-3">
              <div>
                <span class="block text-sm font-black">Mature batch</span>
                <span class="block text-xs text-base-content/50">
                  Carries the existing ArtJob maturity flag into every generated clip.
                </span>
              </div>
              <input
                v-model="store.isMature"
                type="checkbox"
                class="toggle toggle-warning"
                :disabled="store.loading || store.queueing"
                @change="onMaturityChange"
              />
            </label>

            <details class="rounded-xl border border-base-300 bg-base-100 p-3 text-sm">
              <summary class="cursor-pointer font-black">Automatic motion direction</summary>
              <p class="mt-2 leading-relaxed text-base-content/60">
                Bring this still scene naturally to life with subtle coherent motion. Preserve the
                subjects, composition, identity, lighting, and visual style. Add only plausible
                ambient movement, gentle secondary motion, and stable cinematic camera behavior.
                Do not introduce new characters, objects, text, or scene changes.
              </p>
            </details>

            <div class="space-y-2">
              <button
                type="button"
                class="btn btn-primary w-full rounded-xl"
                :disabled="store.queueing || store.loading || !store.totalCount"
                @click="store.enqueue(false)"
              >
                <span v-if="store.queueing" class="loading loading-spinner loading-sm" />
                {{ store.missingCount ? `Start / Resume ${store.missingCount} missing` : 'Resume / verify batch' }}
              </button>
              <button
                v-if="store.failedCount"
                type="button"
                class="btn btn-warning btn-outline w-full rounded-xl"
                :disabled="store.queueing || store.loading"
                @click="store.enqueue(true)"
              >
                Retry {{ store.failedCount }} failed / cancelled
              </button>
            </div>

            <p class="text-xs leading-relaxed text-base-content/50">
              Resume is idempotent for the current source bytes and settings. Change the image,
              preset, duration, or maturity and it intentionally becomes a new render.
            </p>
          </aside>

          <section class="space-y-4">
            <div class="kr-panel p-4">
              <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
                <button
                  v-for="tile in statTiles"
                  :key="tile.key"
                  type="button"
                  class="rounded-xl bg-base-200 p-3 text-left transition-colors hover:bg-base-300"
                  :class="{ 'ring-2 ring-primary': statusFilter === tile.key }"
                  @click="statusFilter = statusFilter === tile.key ? 'all' : tile.key"
                >
                  <p class="text-xs font-bold text-base-content/50">{{ tile.label }}</p>
                  <p class="text-2xl font-black">{{ tile.count }}</p>
                </button>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <progress class="progress progress-primary flex-1" :value="store.completionPercent" max="100" />
                <span class="w-12 text-right text-sm font-black">{{ store.completionPercent }}%</span>
              </div>
              <p v-if="statusFilter !== 'all'" class="mt-3 flex items-center gap-2 text-xs text-base-content/50">
                Showing {{ filteredSources.length }} {{ statusFilter }} scene{{ filteredSources.length === 1 ? '' : 's' }} only.
                <button type="button" class="link" @click="statusFilter = 'all'">Clear filter</button>
              </p>
            </div>

            <div
              v-if="store.error"
              class="kr-note kr-note-error"
            >
              <div class="flex items-start justify-between gap-3">
                <pre class="whitespace-pre-wrap font-sans text-sm text-error">{{ store.error }}</pre>
                <button class="btn btn-ghost btn-xs" type="button" @click="store.clearError()">Dismiss</button>
              </div>
            </div>

            <div v-if="store.loading && !store.initialized" class="grid min-h-64 place-items-center kr-panel">
              <span class="loading loading-spinner loading-lg text-primary" />
            </div>

            <div
              v-else-if="!store.totalCount"
              class="grid min-h-64 place-items-center kr-panel-flat border-dashed bg-base-100/50 p-8 text-center"
            >
              <div>
                <Icon name="kind-icon:server" class="mx-auto size-10 text-base-content/30" />
                <p class="mt-3 font-black">No source images in this folder</p>
                <p class="mt-1 max-w-lg text-sm text-base-content/50">
                  Add PNG, JPG, WebP, or GIF stills under the configured animate source root,
                  then refresh this page.
                </p>
              </div>
            </div>

            <div
              v-else-if="!filteredSources.length"
              class="grid min-h-40 place-items-center kr-panel-flat border-dashed bg-base-100/50 p-6 text-center"
            >
              <div>
                <p class="font-black">No {{ statusFilter }} scenes in this folder</p>
                <button type="button" class="link mt-1 text-sm" @click="statusFilter = 'all'">
                  Clear filter
                </button>
              </div>
            </div>

            <div v-else class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              <article
                v-for="source in filteredSources"
                :key="source.dedupeKey"
                class="kr-panel overflow-hidden"
              >
                <div class="grid grid-cols-2 bg-base-200">
                  <div class="relative aspect-video overflow-hidden border-r border-base-300">
                    <img
                      v-if="store.sourcePreviewUrls[source.name]"
                      :src="store.sourcePreviewUrls[source.name]"
                      :alt="`Source ${source.name}`"
                      class="size-full object-cover"
                    />
                    <div v-else class="grid size-full place-items-center text-xs text-base-content/35">
                      Source
                    </div>
                    <span class="absolute left-2 top-2 badge badge-sm bg-base-100/90">still</span>
                  </div>

                  <div class="relative aspect-video overflow-hidden">
                    <template v-if="source.status === 'done' && store.resultUrl(source)">
                      <video
                        v-if="isVideoResult(source)"
                        :src="store.resultUrl(source) || undefined"
                        class="size-full object-cover"
                        controls
                        muted
                        loop
                        playsinline
                      />
                      <img
                        v-else
                        :src="store.resultUrl(source) || undefined"
                        :alt="`Animated result for ${source.name}`"
                        class="size-full object-cover"
                      />
                    </template>
                    <div v-else class="grid size-full place-items-center p-3 text-center text-xs text-base-content/40">
                      <template v-if="source.status === 'rendering' || source.status === 'queued'">
                        <span class="loading loading-spinner loading-sm" />
                        <span class="mt-1 block">{{ elapsedLabel(source) }}</span>
                      </template>
                      <span v-else>{{ statusLabel(source.status) }}</span>
                    </div>
                    <span class="absolute left-2 top-2 badge badge-sm bg-base-100/90">motion</span>
                  </div>
                </div>

                <div class="space-y-2 p-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-black" :title="source.name">{{ source.name }}</p>
                      <p class="text-xs text-base-content/45">
                        {{ formatBytes(source.bytes) }}
                        <template v-if="source.jobId"> · ArtJob #{{ source.jobId }}</template>
                      </p>
                    </div>
                    <span class="badge badge-sm shrink-0" :class="statusClass(source.status)">
                      {{ statusLabel(source.status) }}
                    </span>
                  </div>
                  <p v-if="source.error" class="line-clamp-3 text-xs text-error" :title="source.error">
                    {{ source.error }}
                  </p>
                  <button
                    v-if="source.status === 'failed' || source.status === 'cancelled'"
                    type="button"
                    class="btn btn-error btn-outline btn-xs w-full rounded-lg"
                    :disabled="store.queueing"
                    @click="store.retrySource(source.name)"
                  >
                    <span v-if="store.retryingSource === source.name" class="loading loading-spinner loading-xs" />
                    Retry this scene
                  </button>
                </div>
              </article>
            </div>
          </section>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useSceneAnimatorStore, type SceneAnimatorSource } from '@/stores/sceneAnimatorStore'
import { useUserStore } from '@/stores/userStore'
import type { VideoEngine, VideoPresetId } from '@/utils/videoPresets'

type StatusFilter = 'all' | 'missing' | 'active' | 'done' | 'failed'

const store = useSceneAnimatorStore()
const userStore = useUserStore()
const ready = ref(false)
const statusFilter = ref<StatusFilter>('all')
let pollTimer: ReturnType<typeof setInterval> | null = null

const statTiles = computed(() => [
  { key: 'all' as const, label: 'Scenes', count: store.totalCount },
  { key: 'missing' as const, label: 'Missing', count: store.missingCount },
  { key: 'active' as const, label: 'Active', count: store.activeCount },
  { key: 'done' as const, label: 'Done', count: store.doneCount },
  { key: 'failed' as const, label: 'Failed', count: store.failedCount },
])

function matchesFilter(source: SceneAnimatorSource, filter: StatusFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'missing') return source.status === 'missing'
  if (filter === 'active') return source.status === 'queued' || source.status === 'rendering'
  if (filter === 'done') return source.status === 'done'
  return source.status === 'failed' || source.status === 'cancelled'
}

const filteredSources = computed(() =>
  store.sources.filter((source) => matchesFilter(source, statusFilter.value)),
)

function folderCompletionSuffix(folderName: string): string {
  const stat = store.folderStats[folderName]
  if (!stat || !stat.total) return ''
  return ` · ${stat.done}/${stat.total} rendered`
}

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) {
    await store.load()
    pollTimer = setInterval(() => {
      if (store.activeCount && !store.loading && !store.queueing) void store.load()
    }, 15_000)
  }
  ready.value = true
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  store.clearSourcePreviews()
})

function eventValue(event: Event): string {
  return (event.target as HTMLSelectElement | HTMLInputElement).value
}

function onFolderChange(event: Event) {
  statusFilter.value = 'all'
  void store.selectFolder(eventValue(event))
}

function onEngineChange(event: Event) {
  void store.setEngine(eventValue(event) as VideoEngine)
}

function onPresetChange(event: Event) {
  void store.setPreset(eventValue(event) as VideoPresetId)
}

function onDurationChange() {
  void store.setDuration(Number(store.durationSeconds))
}

function onMaturityChange() {
  void store.setMaturity(Boolean(store.isMature))
}

function statusLabel(status: SceneAnimatorSource['status']): string {
  if (status === 'rendering') return 'Rendering'
  if (status === 'queued') return 'Queued'
  if (status === 'done') return 'Done'
  if (status === 'failed') return 'Failed'
  if (status === 'cancelled') return 'Cancelled'
  return 'Missing'
}

function statusClass(status: SceneAnimatorSource['status']): string {
  if (status === 'done') return 'badge-success'
  if (status === 'rendering' || status === 'queued') return 'badge-info'
  if (status === 'failed' || status === 'cancelled') return 'badge-error'
  return 'badge-ghost'
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function isVideoResult(source: SceneAnimatorSource): boolean {
  const type = String(source.resultFileType || '').toLowerCase()
  const url = store.resultUrl(source) || ''
  return type.includes('mp4') || type.includes('webm') || /\.(mp4|webm)(?:[?#]|$)/i.test(url)
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

// Elapsed-since-queued for a queued job, elapsed-since-last-update for a
// rendering one, plus the current preset's own timeout as a rough "typically
// finishes within" ceiling -- there's no per-job progress signal to report
// against, so this is the clearest honest estimate available without one.
function elapsedLabel(source: SceneAnimatorSource): string {
  const since = source.status === 'rendering' ? source.updatedAt : source.createdAt
  const ceiling = formatElapsed(store.selectedPreset.timeoutSeconds)
  if (!since) return `typically ≤ ${ceiling}`
  const elapsedSeconds = (Date.now() - new Date(since).getTime()) / 1000
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return `typically ≤ ${ceiling}`
  return `${formatElapsed(elapsedSeconds)} elapsed · typically ≤ ${ceiling}`
}
</script>

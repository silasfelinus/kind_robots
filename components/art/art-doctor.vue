<!-- /components/content/art/art-doctor.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-4"
  >
    <header
      class="relative flex shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
      :class="{ 'scan-active': isBusy }"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Icon name="kind-icon:activity" class="h-6 w-6 text-primary" />
          </div>

          <div class="min-w-0">
            <h2 class="text-xl font-black text-base-content">Art Doctor</h2>
            <p class="text-sm text-base-content/60">
              Promote legacy Art records into ArtImage records.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="statusMessage"
            class="font-mono text-xs text-base-content/50"
          >
            {{ statusMessage }}
          </span>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isBusy"
            @click="runScan"
          >
            <span
              v-if="isScanning"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            {{ hasScanned ? 'Re-scan' : 'Scan' }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-[1fr_auto]">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <p class="text-sm font-bold text-base-content">One job</p>
          <p class="mt-1 text-sm text-base-content/60">
            Find Art records without ArtImages, copy their useful fields into a
            new ArtImage, link the result back to Art, and report exactly what
            changed.
          </p>
        </div>

        <label
          class="flex cursor-pointer items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3"
        >
          <input
            v-model="deleteArtAfterPromote"
            type="checkbox"
            class="checkbox checkbox-warning"
            :disabled="isBusy"
          />

          <span class="flex flex-col">
            <span class="text-sm font-black text-warning">
              Delete Art after promotion
            </span>
            <span class="text-xs text-base-content/60">
              Safer off. When on, the old Art shell is deleted after the
              ArtImage is created.
            </span>
          </span>
        </label>
      </div>

      <div
        v-if="!hasScanned && !isScanning"
        class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/50"
      >
        Scan first. No thumbnail hydration. No raw payload viewer. No haunted
        recursion closet.
      </div>
    </header>

    <div
      v-if="errorMessage"
      class="shrink-0 rounded-2xl border border-error/30 bg-error/10 p-3 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <section
      v-if="hasScanned"
      class="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
    >
      <StatCard label="Art records" :value="summary.totalArt" tone="base" />
      <StatCard
        label="ArtImage records"
        :value="summary.totalArtImages"
        tone="base"
      />
      <StatCard
        label="Already linked"
        :value="summary.alreadyLinked"
        tone="success"
      />
      <StatCard label="Ready" :value="summary.readyToPromote" tone="primary" />
      <StatCard
        label="Missing path"
        :value="summary.missingPath"
        tone="warning"
      />
      <StatCard label="Processed" :value="summary.processed" tone="secondary" />
    </section>

    <section
      v-if="hasScanned"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label class="input input-bordered flex items-center gap-2 rounded-xl">
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            v-model.trim="searchText"
            class="grow"
            type="search"
            placeholder="Search id, prompt, path, checkpoint, designer, collection..."
          />
        </label>

        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="activeFilter"
            class="select select-bordered rounded-xl"
            :disabled="isBusy"
          >
            <option value="ready">Ready only</option>
            <option value="blocked">Blocked only</option>
            <option value="processed">Processed only</option>
            <option value="all">All legacy rows</option>
          </select>

          <select
            v-model="sortMode"
            class="select select-bordered rounded-xl"
            :disabled="isBusy"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="id-desc">ID descending</option>
            <option value="id-asc">ID ascending</option>
          </select>

          <label
            class="input input-bordered flex w-32 items-center gap-2 rounded-xl"
          >
            <span class="text-xs text-base-content/50">Show</span>
            <input
              v-model.number="displayLimit"
              class="w-full"
              type="number"
              min="1"
              max="1000"
              :disabled="isBusy"
            />
          </label>

          <label
            class="input input-bordered flex w-32 items-center gap-2 rounded-xl"
          >
            <span class="text-xs text-base-content/50">Batch</span>
            <input
              v-model.number="batchLimit"
              class="w-full"
              type="number"
              min="1"
              max="500"
              :disabled="isBusy"
            />
          </label>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-base-content/60">
          Showing
          <span class="font-mono font-bold text-base-content">
            {{ visibleRows.length }}
          </span>
          of
          <span class="font-mono font-bold text-base-content">
            {{ filteredRows.length }}
          </span>
          legacy Art rows.
        </p>

        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isBusy || visibleReadyRows.length === 0"
            @click="selectVisibleReadyRows"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
            Select visible ready
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isBusy || selectedIds.size === 0"
            @click="clearSelection"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Clear selected
          </button>

          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            :disabled="isBusy || batchTargets.length === 0"
            @click="promoteBatch"
          >
            <span
              v-if="isPromotingBatch"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
            Promote {{ batchTargets.length }}
          </button>
        </div>
      </div>

      <div
        v-if="batchPreviewText"
        class="rounded-2xl border border-info/30 bg-info/10 p-3 text-sm text-info"
      >
        {{ batchPreviewText }}
      </div>
    </section>

    <section
      v-if="hasScanned"
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div
        v-if="visibleRows.length === 0"
        class="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-8 text-center"
      >
        <Icon name="kind-icon:check" class="h-10 w-10 text-success" />
        <p class="mt-2 font-black text-success">No rows match this view</p>
        <p class="mt-1 text-sm text-base-content/50">
          Either the filter is too spicy, or the database goblins finally
          organized.
        </p>
      </div>

      <div v-else class="min-h-0 flex-1 overflow-auto pr-1">
        <div class="flex flex-col gap-3">
          <article
            v-for="row in visibleRows"
            :key="row.key"
            class="rounded-2xl border bg-base-100 p-3 shadow-sm"
            :class="rowShellClass(row)"
          >
            <div
              class="grid gap-3 xl:grid-cols-[auto_minmax(180px,260px)_1fr_auto]"
            >
              <label class="flex items-start justify-center pt-2">
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  :checked="selectedIds.has(row.art.id)"
                  :disabled="isBusy || !row.canPromote"
                  @change="toggleSelected(row.art.id)"
                />
              </label>

              <div
                class="overflow-hidden rounded-2xl border border-base-300 bg-base-300"
              >
                <div class="flex aspect-video items-center justify-center">
                  <img
                    v-if="row.previewUrl"
                    :src="row.previewUrl"
                    :alt="row.promptText || `Art #${row.art.id}`"
                    class="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  <span
                    v-else
                    class="p-4 text-center text-sm text-base-content/40"
                  >
                    No usable path
                  </span>
                </div>
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-primary badge-sm">
                    Art #{{ row.art.id }}
                  </span>

                  <span
                    class="badge badge-sm"
                    :class="statusBadgeClass(row.status)"
                  >
                    {{ row.statusLabel }}
                  </span>

                  <span
                    v-if="row.art.userId"
                    class="badge badge-ghost badge-sm"
                  >
                    User #{{ row.art.userId }}
                  </span>

                  <span
                    v-if="row.art.galleryId"
                    class="badge badge-ghost badge-sm"
                  >
                    Gallery #{{ row.art.galleryId }}
                  </span>

                  <span
                    v-if="row.collectionLabel"
                    class="badge badge-ghost badge-sm"
                  >
                    {{ row.collectionLabel }}
                  </span>
                </div>

                <p class="mt-2 line-clamp-2 text-sm text-base-content/70">
                  {{ row.promptText || 'No prompt text available' }}
                </p>

                <div
                  class="mt-3 grid gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4"
                >
                  <InfoTile label="Art.path" :value="row.art.path || 'none'" />
                  <InfoTile
                    label="Art.imagePath"
                    :value="row.art.imagePath || 'none'"
                  />
                  <InfoTile
                    label="Checkpoint"
                    :value="row.art.checkpoint || 'none'"
                  />
                  <InfoTile
                    label="Designer"
                    :value="row.art.designer || 'none'"
                  />
                </div>

                <div
                  v-if="row.lastReport"
                  class="mt-3 rounded-2xl border p-3 text-sm"
                  :class="reportPanelClass(row.lastReport)"
                >
                  <p class="font-bold">{{ row.lastReport.message }}</p>

                  <div class="mt-2 grid gap-2 text-xs md:grid-cols-2">
                    <div>
                      <p class="font-bold opacity-70">Before</p>
                      <p class="font-mono">
                        artImageId:
                        {{ row.lastReport.before.artImageId || 'none' }}
                      </p>
                      <p class="font-mono">
                        path: {{ row.lastReport.before.imagePath || 'none' }}
                      </p>
                    </div>

                    <div>
                      <p class="font-bold opacity-70">After</p>
                      <p class="font-mono">
                        artImageId:
                        {{ row.lastReport.after.artImageId || 'none' }}
                      </p>
                      <p class="font-mono">
                        ArtImage:
                        {{
                          row.lastReport.after.artImageId
                            ? `#${row.lastReport.after.artImageId}`
                            : 'not created'
                        }}
                      </p>
                    </div>
                  </div>
                </div>

                <p
                  v-if="!row.canPromote"
                  class="mt-3 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning"
                >
                  {{ row.blockedReason }}
                </p>
              </div>

              <div class="flex flex-col gap-2 xl:min-w-40">
                <button
                  class="btn btn-primary btn-sm rounded-xl"
                  type="button"
                  :disabled="isBusy || !row.canPromote"
                  @click="promoteOne(row.art)"
                >
                  <span
                    v-if="promotingIds.has(row.art.id)"
                    class="loading loading-spinner loading-xs"
                  />
                  <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
                  Promote
                </button>

                <button
                  class="btn btn-ghost btn-sm rounded-xl"
                  type="button"
                  :disabled="isBusy"
                  @click="copyPayload(row.art)"
                >
                  <Icon name="kind-icon:copy" class="h-4 w-4" />
                  Copy payload
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section
      v-if="reports.length"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-sm font-black text-base-content">Change report</p>
          <p class="text-xs text-base-content/50">
            {{ successfulReports.length }} succeeded,
            {{ failedReports.length }} failed, {{ reports.length }} total.
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          :disabled="isBusy"
          @click="clearReports"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear report
        </button>
      </div>

      <div class="mt-3 max-h-64 space-y-2 overflow-auto pr-1">
        <article
          v-for="report in reports"
          :key="report.id"
          class="rounded-2xl border p-3"
          :class="reportPanelClass(report)"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="text-sm font-black">
                Art #{{ report.artId }}
                <span v-if="report.artImageId">
                  → ArtImage #{{ report.artImageId }}
                </span>
              </p>
              <p class="text-sm">{{ report.message }}</p>
            </div>

            <span class="badge badge-sm" :class="reportBadgeClass(report)">
              {{ report.status }}
            </span>
          </div>

          <div class="mt-2 grid gap-2 text-xs lg:grid-cols-2">
            <div class="rounded-xl bg-base-100/60 p-2">
              <p class="font-bold opacity-70">Before</p>
              <p class="font-mono">
                artImageId: {{ report.before.artImageId || 'none' }}
              </p>
              <p class="font-mono">
                userId: {{ report.before.userId || 'none' }}
              </p>
              <p class="font-mono">
                galleryId: {{ report.before.galleryId || 'none' }}
              </p>
              <p class="font-mono break-all">
                imagePath: {{ report.before.imagePath || 'none' }}
              </p>
            </div>

            <div class="rounded-xl bg-base-100/60 p-2">
              <p class="font-bold opacity-70">After</p>
              <p class="font-mono">
                artImageId: {{ report.after.artImageId || 'none' }}
              </p>
              <p class="font-mono">
                deletedArt: {{ report.after.deletedArt ? 'yes' : 'no' }}
              </p>
              <p class="font-mono">
                userId: {{ report.after.userId || 'none' }}
              </p>
              <p class="font-mono">
                galleryId: {{ report.after.galleryId || 'none' }}
              </p>
              <p class="font-mono break-all">
                imagePath: {{ report.after.imagePath || 'none' }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <details
      v-if="operationLog.length"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/60">
        Operation log ({{ operationLog.length }})
      </summary>

      <div class="mt-2 max-h-40 space-y-1 overflow-auto">
        <p
          v-for="(entry, index) in operationLog"
          :key="index"
          class="font-mono text-xs"
          :class="logClass(entry.type)"
        >
          {{ entry.message }}
        </p>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/art-doctor.vue
import { computed, defineComponent, h, ref } from 'vue'
import type { Art, ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'

type SortMode = 'newest' | 'oldest' | 'id-desc' | 'id-asc'
type ActiveFilter = 'ready' | 'blocked' | 'processed' | 'all'
type RowStatus = 'ready' | 'blocked' | 'created' | 'deleted' | 'failed'
type ReportStatus = 'created' | 'deleted' | 'failed' | 'partial'
type LogType = 'info' | 'success' | 'error'

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

type LegacyArt = Art & Record<string, unknown>
type LightArtImage = ArtImage & Record<string, unknown>

type ArtImageCreatePayload = Partial<ArtImage> & Record<string, unknown>

type ArtStoreWithDoctorActions = ReturnType<typeof useArtStore> & {
  createLegacyArtImage: (
    input: ArtImageCreatePayload,
  ) => Promise<ApiResponse<ArtImage>>
}

interface LogEntry {
  message: string
  type: LogType
}

interface Snapshot {
  artId: number
  artImageId: number | null
  userId: number | null
  galleryId: number | null
  collection: string
  imagePath: string
  path: string
  deletedArt: boolean
}

interface ChangeReport {
  id: string
  artId: number
  artImageId: number | null
  status: ReportStatus
  message: string
  before: Snapshot
  after: Snapshot
  createdAt: string
}

interface LegacyRow {
  key: string
  art: LegacyArt
  status: RowStatus
  statusLabel: string
  canPromote: boolean
  blockedReason: string
  previewUrl: string
  promptText: string
  collectionLabel: string
  createdAtValue: number
  lastReport: ChangeReport | null
}

const StatCard = defineComponent({
  name: 'StatCard',
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    tone: { type: String, default: 'base' },
  },
  setup(props) {
    const valueClass = computed(() => {
      if (props.tone === 'success') return 'text-success'
      if (props.tone === 'warning') return 'text-warning'
      if (props.tone === 'error') return 'text-error'
      if (props.tone === 'info') return 'text-info'
      if (props.tone === 'secondary') return 'text-secondary'
      if (props.tone === 'primary') return 'text-primary'
      return 'text-base-content'
    })

    return () =>
      h(
        'div',
        {
          class:
            'rounded-2xl border border-base-300 bg-base-100 p-3 text-center',
        },
        [
          h(
            'p',
            {
              class: `font-mono text-3xl font-black ${valueClass.value}`,
            },
            String(props.value),
          ),
          h(
            'p',
            {
              class: 'mt-1 text-xs text-base-content/60',
            },
            props.label,
          ),
        ],
      )
  },
})

const InfoTile = defineComponent({
  name: 'InfoTile',
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          class: 'rounded-xl border border-base-300 bg-base-200 p-2',
        },
        [
          h(
            'p',
            {
              class:
                'text-[10px] font-bold uppercase tracking-wide text-base-content/40',
            },
            props.label,
          ),
          h(
            'p',
            {
              class: 'mt-1 truncate font-mono text-xs text-base-content/70',
              title: props.value,
            },
            props.value,
          ),
        ],
      )
  },
})

const artStore = useArtStore() as ArtStoreWithDoctorActions

const isScanning = ref(false)
const isPromotingBatch = ref(false)
const hasScanned = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const searchText = ref('')
const activeFilter = ref<ActiveFilter>('ready')
const sortMode = ref<SortMode>('newest')
const displayLimit = ref(100)
const batchLimit = ref(25)
const deleteArtAfterPromote = ref(false)

const selectedIds = ref(new Set<number>())
const promotingIds = ref(new Set<number>())
const reports = ref<ChangeReport[]>([])
const operationLog = ref<LogEntry[]>([])

const isBusy = computed(() => {
  return (
    isScanning.value || isPromotingBatch.value || promotingIds.value.size > 0
  )
})

const allArt = computed<LegacyArt[]>(() => {
  return artStore.art.map((art) => art as LegacyArt)
})

const allArtImages = computed<LightArtImage[]>(() => {
  return artStore.artImages.map((image) => stripHeavyImageFields(image))
})

const artImageById = computed(() => {
  return new Map(allArtImages.value.map((image) => [image.id, image]))
})

const artImageByArtId = computed(() => {
  const map = new Map<number, LightArtImage>()

  for (const image of allArtImages.value) {
    const artId = numberValue(image.artId)

    if (artId) {
      map.set(artId, image)
    }
  }

  return map
})

const reportByArtId = computed(() => {
  const map = new Map<number, ChangeReport>()

  for (const report of reports.value) {
    if (!map.has(report.artId)) {
      map.set(report.artId, report)
    }
  }

  return map
})

function getPossibleCollectionDebug(art: LegacyArt) {
  const record = art as Record<string, unknown>

  const directCollections = [
    record.ArtCollection,
    record.ArtCollections,
    record.artCollections,
    record.collections,
  ]

  const collectionArrays = directCollections.filter(Array.isArray) as Array<
    Array<Record<string, unknown>>
  >

  const relationIds = collectionArrays
    .flatMap((collection) => collection)
    .map((collection) => numberValue(collection.id))
    .filter((id): id is number => Boolean(id))

  return {
    artId: art.id,
    artImageId: numberValue(art.artImageId),
    artCollectionId: numberValue(record.artCollectionId),
    collection: stringValue(record.collection),
    relationIds,
    relationKeysPresent: directCollections
      .map((value, index) => {
        const key = [
          'ArtCollection',
          'ArtCollections',
          'artCollections',
          'collections',
        ][index]
        return Array.isArray(value) ? `${key}:${value.length}` : ''
      })
      .filter(Boolean),
  }
}

const rows = computed<LegacyRow[]>(() => {
  return allArt.value.map((art) => buildRow(art))
})

const filteredRows = computed(() => {
  const needle = searchText.value.toLowerCase().trim()

  return rows.value
    .filter((row) => {
      if (activeFilter.value === 'ready' && row.status !== 'ready') return false
      if (activeFilter.value === 'blocked' && row.status !== 'blocked') {
        return false
      }

      if (
        activeFilter.value === 'processed' &&
        row.status !== 'created' &&
        row.status !== 'deleted' &&
        row.status !== 'failed'
      ) {
        return false
      }

      if (!needle) return true

      const searchable = [
        row.art.id,
        row.art.promptString,
        row.art.path,
        row.art.imagePath,
        row.art.checkpoint,
        row.art.designer,
        row.art.serverName,
        row.art.userId,
        row.art.galleryId,
        row.collectionLabel,
        row.statusLabel,
        row.blockedReason,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()

      return searchable.includes(needle)
    })
    .sort(sortRows)
})

const visibleRows = computed(() => {
  return filteredRows.value.slice(0, normalizedDisplayLimit.value)
})

const visibleReadyRows = computed(() => {
  return visibleRows.value.filter((row) => row.canPromote)
})

const selectedReadyRows = computed(() => {
  return rows.value.filter((row) => {
    return selectedIds.value.has(row.art.id) && row.canPromote
  })
})

const batchTargets = computed(() => {
  const source = selectedReadyRows.value.length
    ? selectedReadyRows.value
    : visibleReadyRows.value

  return source.slice(0, normalizedBatchLimit.value)
})

const successfulReports = computed(() => {
  return reports.value.filter((report) => {
    return report.status === 'created' || report.status === 'deleted'
  })
})

const failedReports = computed(() => {
  return reports.value.filter((report) => {
    return report.status === 'failed' || report.status === 'partial'
  })
})

const normalizedDisplayLimit = computed(() => {
  const value = Number(displayLimit.value)

  if (!Number.isFinite(value)) return 100

  return Math.min(1000, Math.max(1, Math.floor(value)))
})

const normalizedBatchLimit = computed(() => {
  const value = Number(batchLimit.value)

  if (!Number.isFinite(value)) return 25

  return Math.min(500, Math.max(1, Math.floor(value)))
})

const summary = computed(() => {
  const alreadyLinked = allArt.value.filter((art) => {
    return Boolean(art.artImageId) || artImageByArtId.value.has(art.id)
  }).length

  const readyToPromote = rows.value.filter((row) => {
    return row.status === 'ready'
  }).length

  const missingPath = rows.value.filter((row) => {
    return (
      !primaryArtPath(row.art) &&
      !Boolean(row.art.artImageId) &&
      !artImageByArtId.value.has(row.art.id)
    )
  }).length

  const processed = rows.value.filter((row) => {
    return row.status === 'created' || row.status === 'deleted'
  }).length

  return {
    totalArt: allArt.value.length,
    totalArtImages: allArtImages.value.length,
    alreadyLinked,
    readyToPromote,
    missingPath,
    processed,
  }
})

const batchPreviewText = computed(() => {
  if (!batchTargets.value.length) return ''

  if (selectedReadyRows.value.length) {
    return `Batch will promote ${batchTargets.value.length} selected ready Art record${batchTargets.value.length === 1 ? '' : 's'}.`
  }

  return `Batch will promote the first ${batchTargets.value.length} visible ready Art record${batchTargets.value.length === 1 ? '' : 's'}.`
})

async function runScan() {
  isScanning.value = true
  errorMessage.value = ''
  statusMessage.value = 'Scanning Art and ArtImage records…'
  selectedIds.value = new Set()

  try {
    log('Fetching Art records through artStore')
    await artStore.fetchAllArt(true)
    log(`Loaded ${artStore.art.length} Art records`, 'success')

    log('Fetching ArtImage records through artStore')
    await artStore.fetchAllArtImages({
      force: true,
      includeImageData: false,
      includeThumbnailData: false,
      includeTags: false,
    })
    log(`Loaded ${artStore.artImages.length} ArtImage records`, 'success')

    hasScanned.value = true
    statusMessage.value = ''
    log('Scan complete', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed.'
    errorMessage.value = message
    statusMessage.value = ''
    log(message, 'error')
  } finally {
    isScanning.value = false
  }
}

function buildRow(art: LegacyArt): LegacyRow {
  const report = reportByArtId.value.get(art.id) || null
  const forwardImage = art.artImageId
    ? artImageById.value.get(art.artImageId)
    : null
  const reverseImage = artImageByArtId.value.get(art.id) || null
  const existingImage = forwardImage || reverseImage || null
  const imagePath = primaryArtPath(art)
  const previewUrl = normalizeImagePath(imagePath)
  const collectionLabel = getCollectionLabel(art)
  const promptText = stringValue(art.promptString)
  const createdAtValue = toTimestamp(art.createdAt)

  if (report?.status === 'deleted') {
    return {
      key: `art-${art.id}`,
      art,
      status: 'deleted',
      statusLabel: 'Deleted after promotion',
      canPromote: false,
      blockedReason: '',
      previewUrl,
      promptText,
      collectionLabel,
      createdAtValue,
      lastReport: report,
    }
  }

  if (report?.status === 'created') {
    return {
      key: `art-${art.id}`,
      art,
      status: 'created',
      statusLabel: 'Promoted',
      canPromote: false,
      blockedReason: '',
      previewUrl,
      promptText,
      collectionLabel,
      createdAtValue,
      lastReport: report,
    }
  }

  if (report?.status === 'failed' || report?.status === 'partial') {
    return {
      key: `art-${art.id}`,
      art,
      status: 'failed',
      statusLabel: report.status === 'partial' ? 'Partial failure' : 'Failed',
      canPromote: true,
      blockedReason: report.message,
      previewUrl,
      promptText,
      collectionLabel,
      createdAtValue,
      lastReport: report,
    }
  }

  if (existingImage) {
    return {
      key: `art-${art.id}`,
      art,
      status: 'blocked',
      statusLabel: 'Already has ArtImage',
      canPromote: false,
      blockedReason: `Art is already linked to ArtImage #${existingImage.id}.`,
      previewUrl,
      promptText,
      collectionLabel,
      createdAtValue,
      lastReport: null,
    }
  }

  if (!imagePath) {
    return {
      key: `art-${art.id}`,
      art,
      status: 'blocked',
      statusLabel: 'Missing path',
      canPromote: false,
      blockedReason:
        'This Art record has no usable path or imagePath to copy into ArtImage.',
      previewUrl,
      promptText,
      collectionLabel,
      createdAtValue,
      lastReport: null,
    }
  }

  return {
    key: `art-${art.id}`,
    art,
    status: 'ready',
    statusLabel: 'Ready to promote',
    canPromote: true,
    blockedReason: '',
    previewUrl,
    promptText,
    collectionLabel,
    createdAtValue,
    lastReport: null,
  }
}

async function promoteBatch() {
  const targets = [...batchTargets.value]

  if (!targets.length) return

  isPromotingBatch.value = true
  errorMessage.value = ''
  statusMessage.value = `Promoting ${targets.length} Art records…`

  log(`Starting batch promotion for ${targets.length} Art records`)

  try {
    for (const row of targets) {
      await promoteOne(row.art)
    }

    log(`Batch complete: ${targets.length} attempted`, 'success')
  } finally {
    isPromotingBatch.value = false
    statusMessage.value = ''
  }
}

async function promoteOne(art: LegacyArt) {
  if (promotingIds.value.has(art.id)) return

  markPromoting(art.id)

  const before = snapshotArt(art)
  const reportId = `${art.id}-${Date.now()}`
  const shouldDelete = deleteArtAfterPromote.value

  try {
    const imagePath = primaryArtPath(art)

    if (!imagePath) {
      throw new Error(`Art #${art.id} has no usable path or imagePath.`)
    }

    const existingImage = art.artImageId
      ? artImageById.value.get(art.artImageId)
      : artImageByArtId.value.get(art.id)

    if (existingImage) {
      throw new Error(
        `Art #${art.id} already has ArtImage #${existingImage.id}.`,
      )
    }

    log(`Art #${art.id}: creating ArtImage through artStore`)
    const createPayload = buildArtImagePayload(art, shouldDelete)
    const collectionDebug = getPossibleCollectionDebug(art)

    log(
      `Art #${art.id}: payload artId=${String(createPayload.artId)}, collectionHints=${JSON.stringify(collectionDebug)}`,
    )
    log(
      `Art #${art.id}: creating ArtImage with payload collection ids=${JSON.stringify(createPayload.artCollectionIds || createPayload.artCollectionId || [])}`,
    )

    const createResponse = await artStore.createLegacyArtImage(createPayload)

    if (!createResponse.success || !createResponse.data) {
      throw new Error(
        createResponse.message ||
          `Failed to create ArtImage for Art #${art.id}.`,
      )
    }

    const createdImage = stripHeavyImageFields(createResponse.data)
    const createdDebug = createdImage as Record<string, unknown>

    log(
      `Art #${art.id}: created ArtImage #${createdImage.id}, artId=${String(createdImage.artId)}, returned collection fields=${JSON.stringify(
        {
          ArtCollections: Array.isArray(createdDebug.ArtCollections)
            ? createdDebug.ArtCollections.length
            : null,
          artCollections: Array.isArray(createdDebug.artCollections)
            ? createdDebug.artCollections.length
            : null,
          collection: createdDebug.collection ?? null,
        },
      )}`,
      'success',
    )

    if (shouldDelete) {
      const deleted = await artStore.deleteArt(art.id)

      if (!deleted) {
        addReport({
          id: reportId,
          artId: art.id,
          artImageId: createdImage.id,
          status: 'partial',
          message: `Created ArtImage #${createdImage.id}, but Art #${art.id} was not deleted.`,
          before,
          after: {
            ...snapshotImage(createdImage),
            deletedArt: false,
          },
          createdAt: new Date().toISOString(),
        })

        throw new Error(
          `Created ArtImage #${createdImage.id}, but failed to delete Art #${art.id}.`,
        )
      }

      selectedIds.value = removeFromSet(selectedIds.value, art.id)

      addReport({
        id: reportId,
        artId: art.id,
        artImageId: createdImage.id,
        status: 'deleted',
        message: `Created ArtImage #${createdImage.id}, then deleted Art #${art.id}.`,
        before,
        after: {
          ...snapshotImage(createdImage),
          deletedArt: true,
        },
        createdAt: new Date().toISOString(),
      })

      log(
        `Art #${art.id}: promoted to ArtImage #${createdImage.id} and deleted`,
        'success',
      )
      return
    }

    selectedIds.value = removeFromSet(selectedIds.value, art.id)

    const updatedArt: LegacyArt = {
      ...art,
      artImageId: createdImage.id,
    }

    addReport({
      id: reportId,
      artId: art.id,
      artImageId: createdImage.id,
      status: 'created',
      message: `Created ArtImage #${createdImage.id} and linked it to Art #${art.id}.`,
      before,
      after: snapshotArt(updatedArt),
      createdAt: new Date().toISOString(),
    })

    log(`Art #${art.id}: promoted to ArtImage #${createdImage.id}`, 'success')
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Promotion failed for Art #${art.id}.`

    const alreadyReported = reports.value.some((report) => {
      return report.id === reportId
    })

    if (!alreadyReported) {
      addReport({
        id: reportId,
        artId: art.id,
        artImageId: null,
        status: 'failed',
        message,
        before,
        after: snapshotArt(art),
        createdAt: new Date().toISOString(),
      })
    }

    log(`Art #${art.id}: ${message}`, 'error')
  } finally {
    unmarkPromoting(art.id)
  }
}

function buildArtImagePayload(
  art: LegacyArt,
  createStandalone: boolean,
): ArtImageCreatePayload {
  const imagePath = primaryArtPath(art)
  const payload: ArtImageCreatePayload = {
    artId: art.id,
    userId: art.userId ?? null,
    galleryId: art.galleryId ?? null,
    imagePath,
    imageData: '',
    fileName: fileNameFromPath(imagePath),
    fileType: guessFileType(imagePath),
    path: art.path ?? null,
    promptString: art.promptString ?? null,
    negativePrompt: art.negativePrompt ?? null,
    checkpoint: art.checkpoint ?? null,
    checkpointResourceId: art.checkpointResourceId ?? null,
    sampler: art.sampler ?? null,
    seed: art.seed ?? null,
    steps: art.steps ?? null,
    cfg: art.cfg ?? null,
    cfgHalf: art.cfgHalf ?? null,
    designer: art.designer ?? null,
    genres: art.genres ?? null,
    serverId: art.serverId ?? null,
    serverName: art.serverName ?? null,
    serverUrl: art.serverUrl ?? null,
    isPublic: art.isPublic ?? null,
    isMature: art.isMature ?? null,
  }

  const collection = stringValue(art.collection)

  if (collection) {
    payload.collection = collection
  }

  const artCollectionId = numberValue(art.artCollectionId)

  if (artCollectionId) {
    payload.artCollectionId = artCollectionId
  }

  return cleanPayload(payload)
}

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as T
}

function copyPayload(art: LegacyArt) {
  const payload = buildArtImagePayload(art, deleteArtAfterPromote.value)
  const serialized = JSON.stringify(payload, null, 2)

  navigator.clipboard
    ?.writeText(serialized)
    .then(() => {
      log(`Art #${art.id}: copied ArtImage payload`, 'success')
    })
    .catch(() => {
      log(`Art #${art.id}: could not copy payload`, 'error')
    })
}

function selectVisibleReadyRows() {
  const next = new Set(selectedIds.value)

  for (const row of visibleReadyRows.value) {
    next.add(row.art.id)
  }

  selectedIds.value = next
}

function clearSelection() {
  selectedIds.value = new Set()
}

function toggleSelected(id: number) {
  const next = new Set(selectedIds.value)

  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }

  selectedIds.value = next
}

function clearReports() {
  reports.value = []
}

function addReport(report: ChangeReport) {
  reports.value = [report, ...reports.value]
}

function stripHeavyImageFields(image: ArtImage): LightArtImage {
  return {
    ...(image as LightArtImage),
    imageData: null,
    thumbnailData: null,
  }
}

function snapshotArt(art: LegacyArt): Snapshot {
  const imagePath = primaryArtPath(art)

  return {
    artId: art.id,
    artImageId: numberValue(art.artImageId),
    userId: numberValue(art.userId),
    galleryId: numberValue(art.galleryId),
    collection: getCollectionLabel(art),
    imagePath,
    path: stringValue(art.path),
    deletedArt: false,
  }
}

function snapshotImage(image: LightArtImage): Snapshot {
  return {
    artId: numberValue(image.artId) || 0,
    artImageId: image.id,
    userId: numberValue(image.userId),
    galleryId: numberValue(image.galleryId),
    collection: stringValue(image.collection),
    imagePath: stringValue(image.imagePath),
    path: stringValue(image.path),
    deletedArt: false,
  }
}

function primaryArtPath(art?: LegacyArt | null) {
  if (!art) return ''

  const imagePath = stringValue(art.imagePath)
  const path = stringValue(art.path)

  if (imagePath && imagePath !== 'UNDEFINED') return imagePath
  if (path && path !== 'UNDEFINED') return path

  return ''
}

function normalizeImagePath(value?: string | null) {
  if (!value) return ''

  const trimmed = value.trim()

  if (!trimmed || trimmed === 'UNDEFINED') return ''

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }

  if (trimmed.startsWith('/images/')) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  if (trimmed.startsWith('/')) return trimmed

  return `/images/${trimmed}`
}

function getCollectionLabel(art: Record<string, unknown>) {
  const collection = stringValue(art.collection)

  if (collection) return collection

  const artCollectionId = numberValue(art.artCollectionId)

  if (artCollectionId) return `Collection #${artCollectionId}`

  return ''
}

function fileNameFromPath(path: string) {
  const clean = path.split('?')[0] || ''
  const parts = clean.split('/').filter(Boolean)

  return parts.at(-1) || `art-image-${Date.now()}.${guessFileType(path)}`
}

function guessFileType(path: string) {
  const extension = path.split('?')[0]?.split('.').pop()?.toLowerCase()

  if (extension === 'jpg' || extension === 'jpeg') return 'jpeg'
  if (extension === 'webp') return 'webp'
  if (extension === 'gif') return 'gif'
  if (extension === 'avif') return 'avif'

  return 'png'
}

function toTimestamp(value: Date | string | null | undefined) {
  if (!value) return 0

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function sortRows(a: LegacyRow, b: LegacyRow) {
  if (sortMode.value === 'oldest') {
    return a.createdAtValue - b.createdAtValue
  }

  if (sortMode.value === 'id-desc') {
    return b.art.id - a.art.id
  }

  if (sortMode.value === 'id-asc') {
    return a.art.id - b.art.id
  }

  return b.createdAtValue - a.createdAtValue || b.art.id - a.art.id
}

function numberValue(value: unknown): number | null {
  const number = Number(value)

  if (!Number.isInteger(number) || number <= 0) return null

  return number
}

function stringValue(value: unknown): string {
  if (typeof value !== 'string') return ''

  return value.trim()
}

function markPromoting(id: number) {
  promotingIds.value = new Set([...promotingIds.value, id])
}

function unmarkPromoting(id: number) {
  promotingIds.value = removeFromSet(promotingIds.value, id)
}

function removeFromSet<T>(set: Set<T>, value: T) {
  const next = new Set(set)
  next.delete(value)
  return next
}

function rowShellClass(row: LegacyRow) {
  if (row.status === 'ready') return 'border-primary/40'
  if (row.status === 'created' || row.status === 'deleted') {
    return 'border-success/40'
  }
  if (row.status === 'failed') return 'border-error/40'
  return 'border-warning/30'
}

function statusBadgeClass(status: RowStatus) {
  if (status === 'ready') return 'badge-primary'
  if (status === 'created' || status === 'deleted') return 'badge-success'
  if (status === 'failed') return 'badge-error'
  return 'badge-warning'
}

function reportBadgeClass(report: ChangeReport) {
  if (report.status === 'created' || report.status === 'deleted') {
    return 'badge-success'
  }

  if (report.status === 'partial') return 'badge-warning'

  return 'badge-error'
}

function reportPanelClass(report: ChangeReport) {
  if (report.status === 'created' || report.status === 'deleted') {
    return 'border-success/30 bg-success/10 text-success'
  }

  if (report.status === 'partial') {
    return 'border-warning/30 bg-warning/10 text-warning'
  }

  return 'border-error/30 bg-error/10 text-error'
}

function logClass(type: LogType) {
  if (type === 'success') return 'text-success'
  if (type === 'error') return 'text-error'
  return 'text-base-content/60'
}

function log(message: string, type: LogType = 'info') {
  operationLog.value = [
    {
      message: `[${new Date().toLocaleTimeString()}] ${message}`,
      type,
    },
    ...operationLog.value,
  ]
}
</script>

<style scoped>
.scan-active::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, oklch(var(--p)), transparent);
  animation: scan-sweep 1.6s ease-in-out infinite;
}

@keyframes scan-sweep {
  to {
    left: 200%;
  }
}
</style>

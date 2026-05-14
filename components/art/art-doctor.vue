<!-- /components/content/art/art-doctor.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-4"
  >
    <header
      class="relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
      :class="{ 'scan-active': isScanning }"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10"
          >
            <Icon name="kind-icon:activity" class="h-5 w-5 text-error" />
          </div>

          <div>
            <h2 class="text-lg font-black text-base-content">Art Doctor</h2>
            <p class="text-sm text-base-content/60">
              Compare Art shells against canonical ArtImage payloads
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="isScanning"
            class="font-mono text-xs text-base-content/50"
          >
            {{ scanStatus }}
          </span>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isScanning"
            @click="runScan"
          >
            <span
              v-if="isScanning"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            {{ isScanning ? 'Scanning…' : hasScanned ? 'Re-scan' : 'Scan' }}
          </button>
        </div>
      </div>

      <div
        v-if="!hasScanned && !isScanning"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center text-sm text-base-content/50"
      >
        Click Scan to inspect Art.imagePath, Art.artImageId, linked
        ArtImage.imagePath, and ArtImage.imageData.
      </div>
    </header>

    <div
      v-if="scanError"
      class="shrink-0 rounded-2xl bg-error/10 p-3 text-sm text-error"
    >
      {{ scanError }}
    </div>

    <div v-if="hasScanned" class="flex shrink-0 flex-col gap-3">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Art records" :value="allArt.length" tone="base" />
        <StatCard
          label="Needs thumbnails"
          :value="summary.needsThumbnail"
          tone="warning"
        />
        <StatCard
          label="ArtImage records"
          :value="allArtImages.length"
          tone="base"
        />
        <StatCard
          label="Art with imagePath"
          :value="summary.artWithImagePath"
          tone="info"
        />
        <StatCard
          label="Art with artImageId"
          :value="summary.artWithArtImageId"
          tone="secondary"
        />
        <StatCard
          label="ArtImage with imagePath"
          :value="summary.artImagesWithPath"
          tone="info"
        />
        <StatCard
          label="Bidirectional links"
          :value="summary.bidirectional"
          tone="success"
        />
        <StatCard
          label="One-way links"
          :value="summary.oneWay"
          tone="warning"
        />
        <StatCard
          label="Needs review"
          :value="summary.needsReview"
          tone="error"
        />
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm font-black text-base-content">Audit view</p>
            <p class="text-xs text-base-content/50">
              Art view starts from generation shells. ArtImage view starts from
              image payloads.
            </p>
          </div>

          <div class="join">
            <button
              class="btn join-item btn-sm"
              :class="auditMode === 'art' ? 'btn-primary' : 'btn-ghost'"
              type="button"
              @click="auditMode = 'art'"
            >
              <Icon name="kind-icon:palette" class="h-4 w-4" />
              Art
            </button>

            <button
              class="btn join-item btn-sm"
              :class="auditMode === 'artImage' ? 'btn-primary' : 'btn-ghost'"
              type="button"
              @click="auditMode = 'artImage'"
            >
              <Icon name="kind-icon:image" class="h-4 w-4" />
              ArtImage
            </button>
          </div>
        </div>

        <div class="grid gap-2 lg:grid-cols-[1fr_auto]">
          <label
            class="input input-sm input-bordered flex items-center gap-2 rounded-xl"
          >
            <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
            <input
              v-model.trim="searchText"
              class="grow"
              type="search"
              placeholder="Search id, prompt, path, checkpoint, status..."
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <select
              v-model="activeStatusFilter"
              class="select select-bordered select-sm rounded-xl"
            >
              <option
                v-for="option in statusFilterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <select
              v-model="sortMode"
              class="select select-bordered select-sm rounded-xl"
            >
              <option value="severity">Severity</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="id-desc">ID descending</option>
              <option value="id-asc">ID ascending</option>
            </select>

            <button
              class="btn btn-sm rounded-xl"
              type="button"
              :disabled="visibleRows.length === 0 || isHydratingVisible"
              @click="hydrateVisibleRows"
            >
              <span
                v-if="isHydratingVisible"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
              Check visible imageData
            </button>
          </div>
        </div>
      </div>
    </div>

    <section
      v-if="hasScanned"
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-base-content/60">
          Showing
          <span class="font-mono font-bold text-base-content">{{
            visibleRows.length
          }}</span>
          of
          <span class="font-mono font-bold text-base-content">{{
            activeRows.length
          }}</span>
          {{ auditMode === 'art' ? 'Art' : 'ArtImage' }} rows
        </p>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in quickFilters"
            :key="option.value"
            class="btn btn-xs rounded-xl"
            :class="
              activeStatusFilter === option.value
                ? 'btn-secondary'
                : 'btn-ghost'
            "
            type="button"
            @click="activeStatusFilter = option.value"
          >
            {{ option.label }}
            <span class="badge badge-xs">{{
              countRowsByStatus(option.value)
            }}</span>
          </button>
        </div>
      </div>

      <div
        v-if="visibleRows.length === 0"
        class="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-8 text-center"
      >
        <Icon name="kind-icon:check" class="h-10 w-10 text-success" />
        <p class="mt-2 font-black text-success">No rows match this view</p>
        <p class="mt-1 text-sm text-base-content/50">
          Either everything is behaving, or the goblins learned filtering.
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
              class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="badge badge-sm" :class="modeBadgeClass(row)">
                    {{ row.mode === 'art' ? 'Art first' : 'ArtImage first' }}
                  </span>

                  <span
                    class="font-mono text-xs font-bold text-base-content/50"
                  >
                    {{ row.primaryLabel }}
                  </span>

                  <span
                    class="badge badge-sm"
                    :class="severityBadgeClass(row.severity)"
                  >
                    {{ row.statusLabel }}
                  </span>

                  <span
                    class="badge badge-sm"
                    :class="linkBadgeClass(row.linkStatus)"
                  >
                    {{ linkStatusLabel(row.linkStatus) }}
                  </span>

                  <span
                    class="badge badge-sm"
                    :class="dataBadgeClass(row.artImageDataStatus)"
                  >
                    imageData:
                    {{ imageDataStatusLabel(row.artImageDataStatus) }}
                  </span>
                </div>

                <p class="mt-2 line-clamp-2 text-sm text-base-content/70">
                  {{ row.promptText || 'No prompt text available' }}
                </p>
              </div>

              <div class="flex shrink-0 flex-wrap gap-2">
                <button
                  v-if="row.artImage?.id"
                  class="btn btn-info btn-xs rounded-xl"
                  type="button"
                  :disabled="hydratingImageIds.has(row.artImage.id)"
                  @click="hydrateArtImage(row.artImage.id)"
                >
                  <span
                    v-if="hydratingImageIds.has(row.artImage.id)"
                    class="loading loading-spinner loading-xs"
                  />
                  Check imageData
                </button>

                <button
                  v-if="row.artImage?.id && row.canCreateThumbnail"
                  class="btn btn-accent btn-xs rounded-xl"
                  type="button"
                  :disabled="thumbnailingImageIds.has(row.artImage.id)"
                  @click="createThumbnailForRow(row)"
                >
                  <Icon
                    v-if="thumbnailingImageIds.has(row.artImage.id)"
                    name="kind-icon:spinner"
                    class="h-4 w-4 animate-spin"
                  />
                  <Icon v-else name="kind-icon:image" class="h-4 w-4" />
                  Create thumbnail
                </button>

                <button
                  v-if="row.canRepairLink"
                  class="btn btn-warning btn-xs rounded-xl"
                  type="button"
                  :disabled="fixingKeys.has(row.key)"
                  @click="repairRowLink(row)"
                >
                  <span
                    v-if="fixingKeys.has(row.key)"
                    class="loading loading-spinner loading-xs"
                  />
                  Repair link
                </button>

                <button
                  v-if="row.canPromotePath"
                  class="btn btn-secondary btn-xs rounded-xl"
                  type="button"
                  :disabled="fixingKeys.has(row.key)"
                  @click="promoteArtPath(row)"
                >
                  <span
                    v-if="fixingKeys.has(row.key)"
                    class="loading loading-spinner loading-xs"
                  />
                  Promote path
                </button>
              </div>
            </div>

            <div
              class="grid gap-3 xl:grid-cols-[minmax(260px,340px)_minmax(260px,340px)_1fr]"
            >
              <div class="rounded-2xl border border-base-300 bg-base-200 p-2">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <p
                    class="text-xs font-black uppercase tracking-wide text-base-content/50"
                  >
                    Art card
                  </p>

                  <span v-if="row.art" class="badge badge-ghost badge-xs">
                    Art #{{ row.art.id }}
                  </span>

                  <span v-else class="badge badge-error badge-xs">
                    Missing
                  </span>
                </div>

                <ArtCard
                  v-if="row.art"
                  :art="row.art"
                  :art-image="row.artImage"
                  compact
                  :show-actions="false"
                  :show-reaction="false"
                  :show-generation-meta="true"
                  :show-select-button="false"
                />

                <div
                  v-else
                  class="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/50"
                >
                  No linked Art shell found.
                </div>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-2">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <p
                    class="text-xs font-black uppercase tracking-wide text-base-content/50"
                  >
                    Image card
                  </p>

                  <span v-if="row.artImage" class="badge badge-ghost badge-xs">
                    ArtImage #{{ row.artImage.id }}
                  </span>

                  <span v-else class="badge badge-error badge-xs">
                    Missing
                  </span>
                </div>

                <ImageCard
                  v-if="row.artImage"
                  :art-image="hydratedImage(row.artImage.id) || row.artImage"
                  compact
                  :show-actions="false"
                  :show-reaction="false"
                  :show-generation-meta="true"
                  :show-select-button="false"
                />

                <div
                  v-else
                  class="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-4 text-center text-sm text-base-content/50"
                >
                  No linked ArtImage payload found.
                </div>
              </div>

              <div class="grid gap-3">
                <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <EvidenceTile
                    label="Art.imagePath"
                    :value="row.artImagePathFromArt || 'none'"
                    :state="row.hasArtImagePathFromArt ? 'success' : 'warning'"
                  />
                  <EvidenceTile
                    label="ArtImage.thumbnailData"
                    :value="thumbnailStatusLabel(row.thumbnailStatus)"
                    :state="thumbnailTileState(row.thumbnailStatus)"
                  />

                  <EvidenceTile
                    label="Art.artImageId"
                    :value="
                      row.art?.artImageId ? `#${row.art.artImageId}` : 'none'
                    "
                    :state="row.art?.artImageId ? 'success' : 'warning'"
                  />

                  <EvidenceTile
                    label="ArtImage.imagePath"
                    :value="row.artImage?.imagePath || 'none'"
                    :state="row.artImage?.imagePath ? 'success' : 'info'"
                  />

                  <EvidenceTile
                    label="ArtImage.imageData"
                    :value="imageDataStatusLabel(row.artImageDataStatus)"
                    :state="imageDataTileState(row.artImageDataStatus)"
                  />
                </div>

                <div class="grid gap-3 lg:grid-cols-2">
                  <div
                    class="rounded-2xl border border-base-300 bg-base-200 p-3"
                  >
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <p
                        class="text-xs font-black uppercase tracking-wide text-base-content/50"
                      >
                        Path preview
                      </p>

                      <span
                        class="badge badge-xs"
                        :class="row.previewUrl ? 'badge-info' : 'badge-ghost'"
                      >
                        {{ row.previewUrl ? 'available' : 'none' }}
                      </span>
                    </div>

                    <div
                      class="flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300"
                    >
                      <img
                        v-if="row.previewUrl"
                        :src="row.previewUrl"
                        :alt="row.promptText || row.primaryLabel"
                        class="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />

                      <span v-else class="text-sm text-base-content/40">
                        No path preview
                      </span>
                    </div>

                    <p
                      v-if="row.previewUrl"
                      class="mt-2 break-all font-mono text-xs text-base-content/50"
                    >
                      {{ row.previewUrl }}
                    </p>
                  </div>

                  <div
                    class="rounded-2xl border border-base-300 bg-base-200 p-3"
                  >
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <p
                        class="text-xs font-black uppercase tracking-wide text-base-content/50"
                      >
                        Assessment
                      </p>

                      <Icon
                        :name="assessmentIcon(row.severity)"
                        class="h-4 w-4"
                        :class="assessmentIconClass(row.severity)"
                      />
                    </div>

                    <p class="text-sm font-semibold text-base-content">
                      {{ row.assessment }}
                    </p>

                    <div
                      v-if="row.repairHints.length"
                      class="mt-3 flex flex-wrap gap-1.5"
                    >
                      <span
                        v-for="hint in row.repairHints"
                        :key="hint"
                        class="badge badge-outline badge-sm"
                      >
                        {{ hint }}
                      </span>
                    </div>

                    <div
                      v-if="fixResults.get(row.key)"
                      class="mt-3 rounded-xl bg-success/10 p-2 text-sm text-success"
                    >
                      {{ fixResults.get(row.key) }}
                    </div>
                  </div>
                </div>

                <details
                  class="rounded-2xl border border-base-300 bg-base-200 p-3"
                  @click.stop
                >
                  <summary
                    class="cursor-pointer text-xs font-bold uppercase tracking-wide text-base-content/50"
                  >
                    Raw details
                  </summary>

                  <div class="mt-3 grid gap-3 lg:grid-cols-2">
                    <div>
                      <p class="mb-1 text-xs font-bold text-base-content/50">
                        Art
                      </p>
                      <pre
                        class="max-h-72 overflow-auto rounded-xl bg-base-300 p-3 text-xs text-base-content/70"
                        >{{ JSON.stringify(row.art, null, 2) }}</pre
                      >
                    </div>

                    <div>
                      <p class="mb-1 text-xs font-bold text-base-content/50">
                        ArtImage
                      </p>
                      <pre
                        class="max-h-72 overflow-auto rounded-xl bg-base-300 p-3 text-xs text-base-content/70"
                        >{{
                          JSON.stringify(debugArtImage(row.artImage), null, 2)
                        }}</pre
                      >
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <details
      v-if="scanLog.length"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/60">
        Operation log ({{ scanLog.length }})
      </summary>

      <div class="mt-2 max-h-40 space-y-1 overflow-auto">
        <p
          v-for="(entry, index) in scanLog"
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
import { performFetch } from '@/stores/utils'

type AuditMode = 'art' | 'artImage'
type SortMode = 'severity' | 'newest' | 'oldest' | 'id-desc' | 'id-asc'
type Severity = 'healthy' | 'info' | 'warning' | 'error'
type LinkStatus =
  | 'bidirectional'
  | 'art-to-image-only'
  | 'image-to-art-only'
  | 'unlinked'
  | 'conflict'

type ImageDataStatus = 'present' | 'missing' | 'unchecked' | 'not-applicable'
type ThumbnailStatus = 'present' | 'missing' | 'unchecked' | 'not-applicable'

type StatusFilter =
  | 'all'
  | 'canonical'
  | 'needs-thumbnail'
  | 'unchecked-image-data'
  | 'missing-image-data'
  | 'missing-art-image'
  | 'missing-art'
  | 'path-only'
  | 'one-way-link'
  | 'conflict'
  | 'needs-review'

interface LogEntry {
  message: string
  type: 'info' | 'success' | 'error'
}

interface AuditRow {
  key: string
  mode: AuditMode
  primaryId: number
  primaryLabel: string
  art: Art | null
  artImage: ArtImage | null
  artImageDataStatus: ImageDataStatus
  thumbnailStatus: ThumbnailStatus
  canCreateThumbnail: boolean
  linkStatus: LinkStatus
  severity: Severity
  status: StatusFilter
  statusLabel: string
  promptText: string
  previewUrl: string
  artImagePathFromArt: string
  hasArtImagePathFromArt: boolean
  canRepairLink: boolean
  canPromotePath: boolean
  assessment: string
  repairHints: string[]
  createdAtValue: number
}

const thumbnailingImageIds = ref(new Set<number>())

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

const EvidenceTile = defineComponent({
  name: 'EvidenceTile',
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    state: { type: String, default: 'info' },
  },
  setup(props) {
    const stateClass = computed(() => {
      if (props.state === 'success') return 'border-success/30 bg-success/5'
      if (props.state === 'warning') return 'border-warning/30 bg-warning/5'
      if (props.state === 'error') return 'border-error/30 bg-error/5'
      return 'border-info/30 bg-info/5'
    })

    return () =>
      h(
        'div',
        {
          class: `rounded-2xl border p-3 ${stateClass.value}`,
        },
        [
          h(
            'p',
            {
              class:
                'text-xs font-bold uppercase tracking-wide text-base-content/45',
            },
            props.label,
          ),
          h(
            'p',
            {
              class: 'mt-1 break-all font-mono text-xs text-base-content/75',
              title: props.value,
            },
            props.value,
          ),
        ],
      )
  },
})

const artStore = useArtStore()

const isScanning = ref(false)
const isHydratingVisible = ref(false)
const hasScanned = ref(false)
const scanError = ref('')
const scanStatus = ref('')
const searchText = ref('')
const auditMode = ref<AuditMode>('art')
const sortMode = ref<SortMode>('severity')
const activeStatusFilter = ref<StatusFilter>('all')
const allArt = ref<Art[]>([])
const allArtImages = ref<ArtImage[]>([])
const hydratedImageMap = ref(new Map<number, ArtImage>())
const hydratingImageIds = ref(new Set<number>())
const fixingKeys = ref(new Set<string>())
const fixResults = ref(new Map<string, string>())
const scanLog = ref<LogEntry[]>([])

const statusFilterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'canonical', label: 'Canonical' },
  { value: 'unchecked-image-data', label: 'Unchecked imageData' },
  { value: 'missing-image-data', label: 'Missing imageData' },
  { value: 'missing-art-image', label: 'Missing ArtImage' },
  { value: 'missing-art', label: 'Missing Art' },
  { value: 'path-only', label: 'Path only' },
  { value: 'one-way-link', label: 'One-way link' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'needs-thumbnail', label: 'Needs thumbnail' },
]

const quickFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'canonical', label: 'Good' },
  { value: 'needs-thumbnail', label: 'Needs thumb' },
  { value: 'unchecked-image-data', label: 'Unchecked' },
  { value: 'missing-image-data', label: 'No data' },
  { value: 'one-way-link', label: 'One-way' },
  { value: 'path-only', label: 'Path only' },
  { value: 'needs-review', label: 'Review' },
]

const artById = computed(
  () => new Map(allArt.value.map((art) => [art.id, art])),
)

const artImageById = computed(() => {
  return new Map(allArtImages.value.map((image) => [image.id, image]))
})

const artImageByArtId = computed(() => {
  const map = new Map<number, ArtImage>()

  for (const image of allArtImages.value) {
    if (image.artId) {
      map.set(image.artId, image)
    }
  }

  return map
})

const artByArtImageId = computed(() => {
  const map = new Map<number, Art>()

  for (const art of allArt.value) {
    if (art.artImageId) {
      map.set(art.artImageId, art)
    }
  }

  return map
})

const summary = computed(() => {
  const artRows = artAuditRows.value
  const imageRows = artImageAuditRows.value
  const allRows = [...artRows, ...imageRows]

  return {
    artWithImagePath: allArt.value.filter((art) => Boolean(primaryArtPath(art)))
      .length,
    artWithArtImageId: allArt.value.filter((art) => Boolean(art.artImageId))
      .length,
    artImagesWithPath: allArtImages.value.filter((image) =>
      Boolean(image.imagePath),
    ).length,
    bidirectional: artRows.filter((row) => row.linkStatus === 'bidirectional')
      .length,
    oneWay: artRows.filter((row) => {
      return (
        row.linkStatus === 'art-to-image-only' ||
        row.linkStatus === 'image-to-art-only'
      )
    }).length,
    needsThumbnail: allRows.filter((row) => row.canCreateThumbnail).length,
    needsReview: allRows.filter((row) => row.severity === 'error').length,
  }
})

const artAuditRows = computed<AuditRow[]>(() => {
  return allArt.value.map((art) => buildArtRow(art))
})

const artImageAuditRows = computed<AuditRow[]>(() => {
  return allArtImages.value.map((artImage) => buildArtImageRow(artImage))
})

const activeRows = computed(() => {
  return auditMode.value === 'art'
    ? artAuditRows.value
    : artImageAuditRows.value
})

const visibleRows = computed(() => {
  const needle = searchText.value.toLowerCase().trim()

  return activeRows.value
    .filter((row) => {
      if (activeStatusFilter.value === 'needs-thumbnail') {
        if (!row.canCreateThumbnail) return false
      } else if (
        activeStatusFilter.value !== 'all' &&
        row.status !== activeStatusFilter.value
      ) {
        return false
      }

      if (!needle) return true

      const searchable = [
        row.primaryLabel,
        row.statusLabel,
        row.assessment,
        row.promptText,
        row.previewUrl,
        row.art?.id,
        row.art?.imagePath,
        row.art?.path,
        row.art?.artImageId,
        row.art?.checkpoint,
        row.art?.serverName,
        row.artImage?.id,
        row.artImage?.imagePath,
        row.artImage?.fileName,
        row.artImage?.fileType,
        row.artImage?.checkpoint,
        row.artImage?.serverName,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase()

      return searchable.includes(needle)
    })
    .sort(sortRows)
})

function buildArtRow(art: Art): AuditRow {
  const forwardImage = art.artImageId
    ? artImageById.value.get(art.artImageId) || null
    : null
  const reverseImage = artImageByArtId.value.get(art.id) || null
  const artImage = forwardImage || reverseImage
  const linkStatus = getArtLinkStatus(art, forwardImage, reverseImage)
  const detail = artImage
    ? hydratedImageMap.value.get(artImage.id) || null
    : null
  const imageDataStatus = getImageDataStatus(artImage, detail)
  const thumbnailStatus = getThumbnailStatus(artImage, detail)
  const artPath = primaryArtPath(art)
  const previewUrl = normalizeImagePath(artPath || artImage?.imagePath || '')
  const createdAtValue = toTimestamp(art.createdAt)

  const base: AuditRow = {
    key: `art-${art.id}`,
    mode: 'art',
    primaryId: art.id,
    primaryLabel: `Art #${art.id}`,
    art,
    artImage,
    artImageDataStatus: imageDataStatus,
    thumbnailStatus,
    linkStatus,
    severity: 'info',
    status: 'needs-review',
    statusLabel: 'Review',
    promptText: art.promptString || artImage?.promptString || '',
    previewUrl,
    artImagePathFromArt: normalizeImagePath(artPath),
    hasArtImagePathFromArt: Boolean(artPath),
    canRepairLink: Boolean(
      artImage && linkStatus !== 'bidirectional' && linkStatus !== 'conflict',
    ),
    canPromotePath: Boolean(!artImage && artPath),
    canCreateThumbnail:
      Boolean(artImage) &&
      imageDataStatus !== 'missing' &&
      thumbnailStatus !== 'present',
    assessment: '',
    repairHints: [],
    createdAtValue,
  }

  return assessRow(base)
}

function buildArtImageRow(artImage: ArtImage): AuditRow {
  const hydrated = hydratedImageMap.value.get(artImage.id) || null
  const imageWithDetail = hydrated || artImage
  const directArt = artImage.artId
    ? artById.value.get(artImage.artId) || null
    : null
  const reverseArt = artByArtImageId.value.get(artImage.id) || null
  const art = directArt || reverseArt
  const linkStatus = getArtImageLinkStatus(artImage, directArt, reverseArt)
  const imageDataStatus = getImageDataStatus(artImage, hydrated)
  const thumbnailStatus = getThumbnailStatus(artImage, hydrated)
  const previewUrl = normalizeImagePath(
    artImage.imagePath || primaryArtPath(art) || '',
  )
  const createdAtValue = toTimestamp(artImage.createdAt)

  const base: AuditRow = {
    key: `artImage-${artImage.id}`,
    mode: 'artImage',
    primaryId: artImage.id,
    primaryLabel: `ArtImage #${artImage.id}`,
    art,
    artImage: imageWithDetail,
    artImageDataStatus: imageDataStatus,
    thumbnailStatus,
    linkStatus,
    severity: 'info',
    status: 'needs-review',
    statusLabel: 'Review',
    promptText: artImage.promptString || art?.promptString || '',
    previewUrl,
    artImagePathFromArt: normalizeImagePath(primaryArtPath(art)),
    hasArtImagePathFromArt: Boolean(primaryArtPath(art)),
    canRepairLink: Boolean(
      art && linkStatus !== 'bidirectional' && linkStatus !== 'conflict',
    ),
    canPromotePath: false,
    canCreateThumbnail:
      imageDataStatus !== 'missing' && thumbnailStatus !== 'present',
    assessment: '',
    repairHints: [],
    createdAtValue,
  }

  return assessRow(base)
}

function getThumbnailStatus(
  artImage: ArtImage | null,
  detail: ArtImage | null,
): ThumbnailStatus {
  if (!artImage) return 'not-applicable'

  if (detail) {
    return detail.thumbnailData ? 'present' : 'missing'
  }

  if (artImage.thumbnailData) {
    return 'present'
  }

  return 'unchecked'
}

function thumbnailStatusLabel(status: ThumbnailStatus) {
  if (status === 'present') return 'present'
  if (status === 'missing') return 'missing'
  if (status === 'unchecked') return 'unchecked'
  return 'n/a'
}

function thumbnailTileState(status: ThumbnailStatus) {
  if (status === 'present') return 'success'
  if (status === 'missing') return 'warning'
  if (status === 'unchecked') return 'info'
  return 'info'
}

function markThumbnailing(id: number) {
  thumbnailingImageIds.value = new Set([...thumbnailingImageIds.value, id])
}

function unmarkThumbnailing(id: number) {
  const next = new Set(thumbnailingImageIds.value)
  next.delete(id)
  thumbnailingImageIds.value = next
}

async function createThumbnailForRow(row: AuditRow) {
  if (!row.artImage?.id) return

  const id = row.artImage.id
  markThumbnailing(id)

  try {
    const fullImage = await hydrateArtImage(id)

    if (!fullImage?.imageData) {
      throw new Error(`ArtImage #${id} has no imageData to thumbnail`)
    }

    if (fullImage.thumbnailData) {
      setFixResult(row.key, 'Thumbnail already exists')
      return
    }

    const thumbnailData = await createThumbnailDataUrl({
      imageData: fullImage.imageData,
      fileType: fullImage.fileType || row.artImage.fileType || 'png',
      maxSize: 384,
      quality: 0.82,
    })

    const response = await performFetch<ArtImage>(`/api/art/image/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thumbnailData }),
    })

    if (!response.success || !response.data) {
      throw new Error(
        response.message || `Could not patch thumbnail for ArtImage #${id}`,
      )
    }

    const updatedImage = {
      ...fullImage,
      ...response.data,
      thumbnailData,
    }

    hydratedImageMap.value = new Map(hydratedImageMap.value).set(
      id,
      updatedImage,
    )

    allArtImages.value = allArtImages.value.map((image) => {
      if (image.id !== id) return image
      return {
        ...image,
        thumbnailData: '(set)',
      }
    })

    setFixResult(row.key, `Thumbnail created for ArtImage #${id}`)
    log(`ArtImage #${id}: thumbnailData created`, 'success')
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Thumbnail failed for ArtImage #${id}`

    setFixResult(row.key, message)
    log(`ArtImage #${id}: ${message}`, 'error')
  } finally {
    unmarkThumbnailing(id)
  }
}

async function createThumbnailDataUrl(options: {
  imageData: string
  fileType?: string | null
  maxSize?: number
  quality?: number
}) {
  const source = ensureImageDataUrl(options.imageData, options.fileType)
  const maxSize = options.maxSize || 384
  const quality = options.quality || 0.82

  const image = await loadImageElement(source)
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not create canvas context')
  }

  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/webp', quality)
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error('Could not load imageData into browser image'))

    image.src = src
  })
}

function ensureImageDataUrl(imageData: string, fileType?: string | null) {
  if (imageData.startsWith('data:')) return imageData

  const normalizedType = normalizeMimeType(fileType)

  return `data:${normalizedType};base64,${imageData}`
}

function normalizeMimeType(fileType?: string | null) {
  const value = fileType?.toLowerCase().trim()

  if (!value) return 'image/png'
  if (value.includes('/')) return value
  if (value === 'jpg') return 'image/jpeg'
  if (value === 'jpeg') return 'image/jpeg'
  if (value === 'webp') return 'image/webp'
  if (value === 'gif') return 'image/gif'
  if (value === 'png') return 'image/png'

  return 'image/png'
}

function assessRow(row: AuditRow): AuditRow {
  const art = row.art
  const artImage = row.artImage
  const hasArt = Boolean(art)
  const hasArtImage = Boolean(artImage)
  const hasArtImageId = Boolean(art?.artImageId)
  const hasArtPath = Boolean(primaryArtPath(art))
  const hasArtImagePath = Boolean(artImage?.imagePath)
  const hasImageData = row.artImageDataStatus === 'present'
  const imageDataMissing = row.artImageDataStatus === 'missing'
  const imageDataUnchecked = row.artImageDataStatus === 'unchecked'
  const repairHints: string[] = []

  if (row.linkStatus === 'conflict') {
    repairHints.push('choose correct ArtImage')
    repairHints.push('patch mismatched ids')

    return {
      ...row,
      severity: 'error',
      status: 'conflict',
      statusLabel: 'Link conflict',
      assessment:
        'This row has conflicting forward and reverse links. Pick the true ArtImage, then patch the incorrect side before trusting either card.',
      repairHints,
    }
  }

  if (hasArtImage && hasImageData && row.thumbnailStatus !== 'present') {
    repairHints.push('create thumbnailData')

    return {
      ...row,
      severity: row.thumbnailStatus === 'missing' ? 'warning' : 'info',
      status: 'needs-thumbnail',
      statusLabel:
        row.thumbnailStatus === 'missing'
          ? 'Needs thumbnail'
          : 'Thumbnail unchecked',
      assessment:
        'This ArtImage has imageData but no confirmed thumbnailData. Create a lightweight thumbnail for faster gallery display.',
      repairHints,
    }
  }

  if (
    hasArt &&
    hasArtImage &&
    row.linkStatus === 'bidirectional' &&
    hasImageData
  ) {
    if (!hasArtImagePath) {
      repairHints.push('optional imagePath backfill')

      return {
        ...row,
        severity: 'info',
        status: 'canonical',
        statusLabel: 'Canonical, no imagePath',
        assessment:
          'The Art and ArtImage agree, and ArtImage has imageData. It is usable, but ArtImage.imagePath is missing for lightweight display.',
        repairHints,
      }
    }

    return {
      ...row,
      severity: 'healthy',
      status: 'canonical',
      statusLabel: 'Canonical',
      assessment:
        'The Art and ArtImage agree. ArtImage has imageData and imagePath. This is the clean target state.',
      repairHints,
    }
  }

  if (
    hasArt &&
    hasArtImage &&
    row.linkStatus === 'bidirectional' &&
    imageDataUnchecked
  ) {
    repairHints.push('check imageData')

    return {
      ...row,
      severity: 'info',
      status: 'unchecked-image-data',
      statusLabel: 'Unchecked imageData',
      assessment:
        'The Art and ArtImage link correctly, but imageData has not been fetched yet. Run Check imageData to confirm the payload.',
      repairHints,
    }
  }

  if (hasArt && hasArtImage && imageDataMissing) {
    repairHints.push('reupload imageData')
    repairHints.push('regenerate asset if needed')

    return {
      ...row,
      severity: 'error',
      status: 'missing-image-data',
      statusLabel: 'Missing imageData',
      assessment:
        'A linked ArtImage exists, but its full record does not contain imageData. Since ArtImage is the desired output, this needs repair.',
      repairHints,
    }
  }

  if (hasArt && hasArtImage && row.linkStatus !== 'bidirectional') {
    repairHints.push('repair missing relationship side')

    if (imageDataUnchecked) {
      repairHints.push('check imageData')
    }

    return {
      ...row,
      severity: 'warning',
      status: 'one-way-link',
      statusLabel:
        row.linkStatus === 'art-to-image-only'
          ? 'Art points to ArtImage'
          : 'ArtImage points to Art',
      assessment:
        'These records appear related, but only one side of the Art to ArtImage link is set. Repair the missing side to make the pair canonical.',
      repairHints,
    }
  }

  if (hasArt && !hasArtImage && hasArtPath) {
    repairHints.push('promote Art path')
    repairHints.push('create ArtImage shell')

    return {
      ...row,
      severity: 'warning',
      status: 'path-only',
      statusLabel: 'Path only',
      assessment:
        'This Art has imagePath or path, but no ArtImage. It is a legacy-style Art shell and can be promoted into an ArtImage.',
      repairHints,
    }
  }

  if (hasArt && !hasArtImage && hasArtImageId) {
    repairHints.push('find missing ArtImage')
    repairHints.push('clear stale artImageId if deleted')

    return {
      ...row,
      severity: 'error',
      status: 'missing-art-image',
      statusLabel: 'Missing ArtImage',
      assessment:
        'This Art has an artImageId, but the matching ArtImage was not found in the scan. This is a stale pointer unless the endpoint is filtering it out.',
      repairHints,
    }
  }

  if (hasArt && !hasArtImage) {
    repairHints.push('attach or create ArtImage')

    return {
      ...row,
      severity: 'error',
      status: 'missing-art-image',
      statusLabel: 'No ArtImage',
      assessment:
        'This Art has no imagePath and no linked ArtImage. There is not enough image evidence to display or repair automatically.',
      repairHints,
    }
  }

  if (!hasArt && hasArtImage && imageDataMissing) {
    repairHints.push('restore imageData')
    repairHints.push('create Art shell if this should appear in Art gallery')

    return {
      ...row,
      severity: 'error',
      status: 'missing-image-data',
      statusLabel: 'ImageData missing',
      assessment:
        'This ArtImage has no linked Art shell and does not prove it has imageData. That is a lonely little database potato.',
      repairHints,
    }
  }

  if (!hasArt && hasArtImage && imageDataUnchecked) {
    repairHints.push('check imageData')
    repairHints.push('create Art shell if needed')

    return {
      ...row,
      severity: 'info',
      status: 'missing-art',
      statusLabel: 'No Art shell',
      assessment:
        'This ArtImage may be valid for another model, but it is not linked to an Art shell. Check imageData, then decide if it belongs in Art.',
      repairHints,
    }
  }

  if (!hasArt && hasArtImage && hasImageData) {
    repairHints.push('optional Art shell creation')

    return {
      ...row,
      severity: 'info',
      status: 'missing-art',
      statusLabel: 'Image only',
      assessment:
        'This ArtImage has imageData but no linked Art shell. Valid as a standalone image payload, but not a complete Art gallery pair.',
      repairHints,
    }
  }

  return {
    ...row,
    severity: 'error',
    status: 'needs-review',
    statusLabel: 'Needs review',
    assessment:
      'This row does not have enough reliable link or image evidence to classify cleanly. Manual review recommended.',
    repairHints: ['manual review'],
  }
}

async function runScan() {
  isScanning.value = true
  scanError.value = ''
  scanStatus.value = 'Starting scan…'
  scanLog.value = []
  fixResults.value = new Map()
  hydratedImageMap.value = new Map()

  try {
    scanStatus.value = 'Fetching Art records…'
    log('Fetching Art records…')

    const art = await artStore.fetchAllArt(true)
    allArt.value = [...art]

    log(`Loaded ${allArt.value.length} Art records`, 'success')

    scanStatus.value = 'Fetching ArtImage metadata…'
    log('Fetching ArtImage metadata…')

    const imageResponse = await performFetch<ArtImage[]>('/api/art/image')

    if (imageResponse.success && Array.isArray(imageResponse.data)) {
      allArtImages.value = imageResponse.data.map(stripHeavyImageFields)
      log(`Loaded ${allArtImages.value.length} ArtImage records`, 'success')
    } else {
      allArtImages.value = artStore.artImages.map(stripHeavyImageFields)
      log(
        `ArtImage endpoint did not return an array. Used ${allArtImages.value.length} cached ArtImage records instead.`,
        'error',
      )
    }

    hasScanned.value = true
    scanStatus.value = ''
    log('Scan complete', 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed'
    scanError.value = message
    scanStatus.value = ''
    log(message, 'error')
  } finally {
    isScanning.value = false
  }
}

async function hydrateVisibleRows() {
  isHydratingVisible.value = true

  try {
    const ids = visibleRows.value
      .map((row) => row.artImage?.id)
      .filter((id): id is number => Boolean(id))
      .filter((id) => !hydratedImageMap.value.has(id))

    for (const id of ids) {
      await hydrateArtImage(id)
    }
  } finally {
    isHydratingVisible.value = false
  }
}

async function hydrateArtImage(id: number) {
  if (hydratedImageMap.value.has(id) || hydratingImageIds.value.has(id)) {
    return hydratedImageMap.value.get(id) || null
  }

  hydratingImageIds.value = new Set([...hydratingImageIds.value, id])

  try {
    const response = await performFetch<ArtImage>(`/api/art/image/${id}`)

    if (!response.success || !response.data) {
      throw new Error(response.message || `Could not fetch ArtImage #${id}`)
    }

    hydratedImageMap.value = new Map(hydratedImageMap.value).set(
      id,
      response.data,
    )

    log(
      `Checked ArtImage #${id}: imageData ${response.data.imageData ? 'present' : 'missing'}`,
      response.data.imageData ? 'success' : 'error',
    )

    return response.data
  } catch (error) {
    const message =
      error instanceof Error ? error.message : `Could not fetch ArtImage #${id}`
    log(message, 'error')
    return null
  } finally {
    const next = new Set(hydratingImageIds.value)
    next.delete(id)
    hydratingImageIds.value = next
  }
}

async function repairRowLink(row: AuditRow) {
  if (!row.art || !row.artImage) return

  markFixing(row.key)

  try {
    if (row.linkStatus === 'art-to-image-only') {
      const response = await performFetch<ArtImage>(
        `/api/art/image/${row.artImage.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artId: row.art.id }),
        },
      )

      if (!response.success) {
        throw new Error(response.message || 'Failed to patch ArtImage.artId')
      }

      allArtImages.value = allArtImages.value.map((image) => {
        if (image.id !== row.artImage?.id) return image
        return { ...image, artId: row.art?.id || null }
      })
    }

    if (row.linkStatus === 'image-to-art-only') {
      const response = await performFetch<Art>(`/api/art/${row.art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artImageId: row.artImage.id }),
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to patch Art.artImageId')
      }

      allArt.value = allArt.value.map((art) => {
        if (art.id !== row.art?.id) return art
        return { ...art, artImageId: row.artImage?.id || null }
      })
    }

    setFixResult(row.key, 'Link repaired')
    log(`${row.primaryLabel}: repaired Art to ArtImage link`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Repair failed'
    setFixResult(row.key, message)
    log(`${row.primaryLabel}: ${message}`, 'error')
  } finally {
    unmarkFixing(row.key)
  }
}

async function promoteArtPath(row: AuditRow) {
  if (!row.art) return

  const imagePath = primaryArtPath(row.art)

  if (!imagePath) return

  markFixing(row.key)

  try {
    const response = await performFetch<ArtImage>('/api/art/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artId: row.art.id,
        userId: row.art.userId,
        galleryId: row.art.galleryId,
        imagePath,
        imageData: '',
        fileType: guessFileType(imagePath),
        path: row.art.path,
        promptString: row.art.promptString,
        negativePrompt: row.art.negativePrompt,
        checkpoint: row.art.checkpoint,
        checkpointResourceId: row.art.checkpointResourceId,
        sampler: row.art.sampler,
        seed: row.art.seed,
        steps: row.art.steps,
        cfg: row.art.cfg,
        cfgHalf: row.art.cfgHalf,
        designer: row.art.designer,
        genres: row.art.genres,
        serverId: row.art.serverId,
        serverName: row.art.serverName,
        serverUrl: row.art.serverUrl,
        isPublic: row.art.isPublic,
        isMature: row.art.isMature,
      }),
    })

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create ArtImage')
    }

    const patchResponse = await performFetch<Art>(`/api/art/${row.art.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artImageId: response.data.id }),
    })

    if (!patchResponse.success) {
      throw new Error(patchResponse.message || 'Failed to patch Art.artImageId')
    }

    allArt.value = allArt.value.map((art) => {
      if (art.id !== row.art?.id) return art
      return { ...art, artImageId: response.data?.id || null }
    })

    allArtImages.value = [
      ...allArtImages.value,
      stripHeavyImageFields(response.data),
    ]

    setFixResult(row.key, `Promoted to ArtImage #${response.data.id}`)
    log(
      `Art #${row.art.id}: promoted path to ArtImage #${response.data.id}`,
      'success',
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Promotion failed'
    setFixResult(row.key, message)
    log(`${row.primaryLabel}: ${message}`, 'error')
  } finally {
    unmarkFixing(row.key)
  }
}

function getArtLinkStatus(
  art: Art,
  forwardImage: ArtImage | null,
  reverseImage: ArtImage | null,
): LinkStatus {
  if (forwardImage && reverseImage && forwardImage.id !== reverseImage.id) {
    return 'conflict'
  }

  if (forwardImage && reverseImage) {
    return 'bidirectional'
  }

  if (forwardImage) {
    return 'art-to-image-only'
  }

  if (reverseImage) {
    return 'image-to-art-only'
  }

  if (art.artImageId && !forwardImage) {
    return 'unlinked'
  }

  return 'unlinked'
}

function getArtImageLinkStatus(
  artImage: ArtImage,
  directArt: Art | null,
  reverseArt: Art | null,
): LinkStatus {
  if (directArt && reverseArt && directArt.id !== reverseArt.id) {
    return 'conflict'
  }

  if (directArt && reverseArt) {
    return 'bidirectional'
  }

  if (reverseArt) {
    return 'art-to-image-only'
  }

  if (directArt) {
    return 'image-to-art-only'
  }

  if (artImage.artId && !directArt) {
    return 'unlinked'
  }

  return 'unlinked'
}

function getImageDataStatus(
  artImage: ArtImage | null,
  detail: ArtImage | null,
): ImageDataStatus {
  if (!artImage) return 'not-applicable'

  if (detail) {
    return detail.imageData ? 'present' : 'missing'
  }

  if (artImage.imageData && artImage.imageData !== '(set)') {
    return 'present'
  }

  return 'unchecked'
}

function hydratedImage(id: number) {
  return hydratedImageMap.value.get(id) || null
}

function stripHeavyImageFields(image: ArtImage): ArtImage {
  return {
    ...image,
    imageData: '',
    thumbnailData: image.thumbnailData ? '(set)' : null,
  }
}

function primaryArtPath(art?: Art | null) {
  if (!art) return ''

  if (art.imagePath) return art.imagePath

  if (art.path && art.path !== 'UNDEFINED') {
    return art.path
  }

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

  if (trimmed.startsWith('/images/')) {
    return trimmed
  }

  if (trimmed.startsWith('images/')) {
    return `/${trimmed}`
  }

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  return `/images/${trimmed}`
}

function guessFileType(path: string) {
  const extension = path.split('.').pop()?.toLowerCase()

  if (extension === 'jpg' || extension === 'jpeg') return 'jpeg'
  if (extension === 'webp') return 'webp'
  if (extension === 'gif') return 'gif'

  return 'png'
}

function toTimestamp(value: Date | string | null | undefined) {
  if (!value) return 0

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? 0 : date.getTime()
}

function sortRows(a: AuditRow, b: AuditRow) {
  if (sortMode.value === 'newest') {
    return b.createdAtValue - a.createdAtValue
  }

  if (sortMode.value === 'oldest') {
    return a.createdAtValue - b.createdAtValue
  }

  if (sortMode.value === 'id-desc') {
    return b.primaryId - a.primaryId
  }

  if (sortMode.value === 'id-asc') {
    return a.primaryId - b.primaryId
  }

  return (
    severityRank(b.severity) - severityRank(a.severity) ||
    b.primaryId - a.primaryId
  )
}

function severityRank(severity: Severity) {
  if (severity === 'error') return 4
  if (severity === 'warning') return 3
  if (severity === 'info') return 2
  return 1
}

function countRowsByStatus(status: StatusFilter) {
  if (status === 'all') return activeRows.value.length

  if (status === 'needs-thumbnail') {
    return activeRows.value.filter((row) => row.canCreateThumbnail).length
  }

  return activeRows.value.filter((row) => row.status === status).length
}

function imageDataStatusLabel(status: ImageDataStatus) {
  if (status === 'present') return 'present'
  if (status === 'missing') return 'missing'
  if (status === 'unchecked') return 'unchecked'
  return 'n/a'
}

function linkStatusLabel(status: LinkStatus) {
  if (status === 'bidirectional') return 'both linked'
  if (status === 'art-to-image-only') return 'Art to ArtImage'
  if (status === 'image-to-art-only') return 'ArtImage to Art'
  if (status === 'conflict') return 'conflict'
  return 'unlinked'
}

function imageDataTileState(status: ImageDataStatus) {
  if (status === 'present') return 'success'
  if (status === 'missing') return 'error'
  if (status === 'unchecked') return 'warning'
  return 'info'
}

function debugArtImage(image: ArtImage | null) {
  if (!image) return null

  return {
    ...image,
    imageData: image.imageData ? `[${image.imageData.length} chars]` : '',
    thumbnailData: image.thumbnailData
      ? `[${image.thumbnailData.length} chars]`
      : null,
  }
}

function rowShellClass(row: AuditRow) {
  if (row.severity === 'healthy') return 'border-success/30'
  if (row.severity === 'info') return 'border-info/30'
  if (row.severity === 'warning') return 'border-warning/40'
  return 'border-error/40'
}

function severityBadgeClass(severity: Severity) {
  if (severity === 'healthy') return 'badge-success'
  if (severity === 'info') return 'badge-info'
  if (severity === 'warning') return 'badge-warning'
  return 'badge-error'
}

function modeBadgeClass(row: AuditRow) {
  return row.mode === 'art' ? 'badge-primary' : 'badge-secondary'
}

function linkBadgeClass(status: LinkStatus) {
  if (status === 'bidirectional') return 'badge-success'
  if (status === 'conflict') return 'badge-error'
  if (status === 'unlinked') return 'badge-ghost'
  return 'badge-warning'
}

function dataBadgeClass(status: ImageDataStatus) {
  if (status === 'present') return 'badge-success'
  if (status === 'missing') return 'badge-error'
  if (status === 'unchecked') return 'badge-warning'
  return 'badge-ghost'
}

function assessmentIcon(severity: Severity) {
  if (severity === 'healthy') return 'kind-icon:check'
  if (severity === 'info') return 'kind-icon:info'
  if (severity === 'warning') return 'kind-icon:warning'
  return 'kind-icon:skull'
}

function assessmentIconClass(severity: Severity) {
  if (severity === 'healthy') return 'text-success'
  if (severity === 'info') return 'text-info'
  if (severity === 'warning') return 'text-warning'
  return 'text-error'
}

function logClass(type: LogEntry['type']) {
  if (type === 'success') return 'text-success'
  if (type === 'error') return 'text-error'
  return 'text-base-content/60'
}

function markFixing(key: string) {
  fixingKeys.value = new Set([...fixingKeys.value, key])
}

function unmarkFixing(key: string) {
  const next = new Set(fixingKeys.value)
  next.delete(key)
  fixingKeys.value = next
}

function setFixResult(key: string, message: string) {
  fixResults.value = new Map(fixResults.value).set(key, message)
}

function log(message: string, type: LogEntry['type'] = 'info') {
  scanLog.value = [
    ...scanLog.value,
    {
      message: `[${new Date().toLocaleTimeString()}] ${message}`,
      type,
    },
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
  background: linear-gradient(
    90deg,
    transparent,
    oklch(var(--su)),
    transparent
  );
  animation: scan-sweep 1.6s ease-in-out infinite;
}

@keyframes scan-sweep {
  to {
    left: 200%;
  }
}
</style>

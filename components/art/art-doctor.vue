<!-- /components/content/art/art-doctor.vue -->
<!--
  Art Doctor — diagnostic and repair tool for Art ↔ ArtImage consistency.

  Five categories:
    1. Orphaned Art      — Art records with no linked ArtImage (artImageId is null,
                          and no ArtImage claims this Art via artId)
    2. Stale Metadata    — ArtImages linked to an Art but missing generation fields
    3. Missing Thumbnail — ArtImages that have imageData but no thumbnailData
                          (all ArtImages regardless of match status)
    4. Unlinked Images   — ArtImages with no FK at all (not Art, Bot, Pitch, etc.)
    5. Matched           — Art ↔ ArtImage pairs that are properly linked;
                          flagged subset still needs thumbnails

  Sub-filters:
    - Thumbs:   All / Matched only / Unmatched only
    - Matched:  All / Needs thumbnail / Fully healthy
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-4"
  >
    <!-- ── Header ───────────────────────────────────────────────────────── -->
    <header
      class="relative flex shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
      :class="{ 'scan-active': isScanning }"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-2xl bg-error/10"
          >
            <Icon name="kind-icon:activity" class="h-5 w-5 text-error" />
          </div>
          <div>
            <h2 class="text-lg font-black text-base-content">Art Doctor</h2>
            <p class="text-sm text-base-content/60">
              Diagnose and repair Art ↔ ArtImage inconsistencies
            </p>
          </div>
        </div>
        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isScanning"
          @click="runScan"
        >
          <span v-if="isScanning" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          {{ isScanning ? 'Scanning…' : hasScanned ? 'Re-scan' : 'Scan' }}
        </button>
      </div>

      <!-- stat cards -->
      <div v-if="hasScanned" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="flex cursor-pointer flex-col items-start rounded-2xl border p-3 transition"
          :class="
            activeCategory === cat.key
              ? `border-${cat.color}/50 bg-${cat.color}/10`
              : 'border-base-300 bg-base-100 hover:bg-base-200'
          "
          type="button"
          @click="activeCategory = cat.key"
        >
          <span
            class="font-mono text-2xl font-black leading-none"
            :class="`text-${cat.color}`"
          >
            {{ cat.items.length }}
          </span>
          <span
            class="mt-1 text-left text-xs leading-tight text-base-content/60"
            >{{ cat.label }}</span
          >
          <span
            v-if="cat.key === 'matched' && matchedNeedingThumbnail.length > 0"
            class="mt-1 text-xs text-warning"
          >
            {{ matchedNeedingThumbnail.length }} need thumbnail
          </span>
        </button>
      </div>

      <div
        v-else-if="!isScanning"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center text-sm text-base-content/50"
      >
        Click Scan to diagnose Art ↔ ArtImage health
      </div>
    </header>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div
      v-if="scanError"
      class="shrink-0 rounded-2xl bg-error/10 p-3 text-sm text-error"
    >
      {{ scanError }}
    </div>

    <!-- ── Health Bar ─────────────────────────────────────────────────────── -->
    <div
      v-if="hasScanned"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="mb-2 flex items-baseline justify-between">
        <span class="text-xs font-bold text-base-content/60"
          >Collection health</span
        >
        <span
          class="font-mono text-sm font-black"
          :class="
            healthPct > 75
              ? 'text-success'
              : healthPct > 40
                ? 'text-warning'
                : 'text-error'
          "
        >
          {{ healthPct }}%
        </span>
      </div>
      <div class="flex h-2 w-full overflow-hidden rounded-full bg-base-300">
        <div
          v-for="seg in healthSegments"
          :key="seg.label"
          class="h-full min-w-0.5 transition-all"
          :style="{ flex: seg.count, background: seg.color }"
        />
      </div>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span
          v-for="seg in healthSegments.filter((s) => s.count > 0)"
          :key="seg.label"
          class="flex items-center gap-1.5 text-xs text-base-content/60"
        >
          <span
            class="inline-block h-2 w-2 rounded-sm"
            :style="{ background: seg.color }"
          />
          {{ seg.label }}
          <span class="font-mono font-bold text-base-content">{{
            seg.count
          }}</span>
        </span>
      </div>
    </div>

    <!-- ── Category detail ───────────────────────────────────────────────── -->
    <section
      v-if="hasScanned"
      class="flex min-h-0 flex-1 flex-col gap-3 overflow-auto"
    >
      <!-- tabs -->
      <div class="flex shrink-0 flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat.key"
          class="btn btn-sm rounded-xl"
          :class="activeCategory === cat.key ? `btn-${cat.color}` : 'btn-ghost'"
          type="button"
          @click="activeCategory = cat.key"
        >
          <Icon :name="cat.icon" class="h-4 w-4" />
          {{ cat.label }}
          <span
            class="badge badge-sm ml-1"
            :class="activeCategory === cat.key ? 'badge-ghost' : ''"
          >
            {{ cat.items.length }}
          </span>
        </button>
      </div>

      <!-- active panel -->
      <div v-if="activeCategory" class="flex min-h-0 flex-1 flex-col gap-3">
        <!-- description + batch -->
        <div
          class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-base-content/70">
              {{ activeCategoryMeta?.description }}
            </p>
            <button
              v-if="activeCategoryMeta?.batchLabel && batchableCount > 0"
              class="btn btn-sm rounded-xl"
              :class="`btn-${activeCategoryMeta?.color}`"
              type="button"
              :disabled="isBatchRunning"
              @click="runBatch(activeCategory)"
            >
              <span
                v-if="isBatchRunning"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
              {{ activeCategoryMeta?.batchLabel }}
            </button>
          </div>

          <!-- sub-filters: thumbs -->
          <div
            v-if="activeCategory === 'thumbs'"
            class="flex flex-wrap gap-1.5"
          >
            <button
              v-for="[val, label] in thumbFilterOptions"
              :key="val"
              class="btn btn-xs rounded-xl"
              :class="thumbFilter === val ? 'btn-secondary' : 'btn-ghost'"
              type="button"
              @click="thumbFilter = val as ThumbFilter"
            >
              {{ label }}
            </button>
          </div>

          <!-- sub-filters: matched -->
          <div
            v-if="activeCategory === 'matched'"
            class="flex flex-wrap gap-1.5"
          >
            <button
              v-for="[val, label] in matchedFilterOptions"
              :key="val"
              class="btn btn-xs rounded-xl"
              :class="matchedFilter === val ? 'btn-success' : 'btn-ghost'"
              type="button"
              @click="matchedFilter = val as MatchedFilter"
            >
              {{ label }}
            </button>
          </div>
        </div>

        <!-- batch progress -->
        <div
          v-if="isBatchRunning"
          class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="mb-1 flex justify-between text-xs text-base-content/60">
            <span>{{ batchProgress.label }}</span>
            <span class="font-mono"
              >{{ batchProgress.done }} / {{ batchProgress.total }}</span
            >
          </div>
          <progress
            class="progress progress-primary w-full"
            :value="batchProgress.done"
            :max="batchProgress.total"
          />
        </div>

        <!-- empty state -->
        <div
          v-if="activeDisplayItems.length === 0"
          class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-8 text-center"
        >
          <Icon name="kind-icon:check" class="h-10 w-10 text-success" />
          <p class="mt-2 font-bold text-success">All clear in this view</p>
        </div>

        <!-- item list -->
        <div v-else class="flex-1 overflow-auto">
          <div class="flex flex-col gap-2">
            <!-- ORPHANED -->
            <template v-if="activeCategory === 'orphaned'">
              <div
                v-for="art in activeDisplayItems as Art[]"
                :key="art.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="min-w-0">
                  <p class="font-mono text-xs font-bold text-base-content/50">
                    Art #{{ art.id }}
                  </p>
                  <p class="truncate text-sm text-base-content">
                    {{ art.promptString?.slice(0, 80) || '(no prompt)' }}
                  </p>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <span v-if="art.imagePath" class="badge badge-info badge-xs"
                      >imagePath</span
                    >
                    <span
                      v-if="art.path && art.path !== 'UNDEFINED'"
                      class="badge badge-ghost badge-xs"
                      >path</span
                    >
                    <span v-if="art.serverId" class="badge badge-ghost badge-xs"
                      >server #{{ art.serverId }}</span
                    >
                    <span
                      v-if="
                        !art.imagePath &&
                        !(art.path && art.path !== 'UNDEFINED')
                      "
                      class="badge badge-error badge-xs"
                      >no source</span
                    >
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="
                      art.imagePath || (art.path && art.path !== 'UNDEFINED')
                    "
                    class="btn btn-warning btn-xs rounded-xl"
                    type="button"
                    :disabled="fixingIds.has(art.id)"
                    @click="promotePathToArtImage(art)"
                  >
                    <span
                      v-if="fixingIds.has(art.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    Promote path
                  </button>
                  <span v-else class="badge badge-ghost badge-sm"
                    >no source</span
                  >
                  <span
                    v-if="fixResults.get(art.id)"
                    class="badge badge-success badge-sm"
                  >
                    {{ fixResults.get(art.id) }}
                  </span>
                </div>
              </div>
            </template>

            <!-- STALE METADATA -->
            <template v-else-if="activeCategory === 'stale'">
              <div
                v-for="item in activeDisplayItems as StaleItem[]"
                :key="item.artImage.id"
                class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-mono text-xs font-bold text-base-content/50">
                      ArtImage #{{ item.artImage.id }} ← Art #{{ item.art.id }}
                    </p>
                    <p class="truncate text-sm text-base-content">
                      {{
                        item.art.promptString?.slice(0, 80) ||
                        '(no prompt on art)'
                      }}
                    </p>
                  </div>
                  <button
                    class="btn btn-info btn-xs rounded-xl"
                    type="button"
                    :disabled="fixingIds.has(item.artImage.id)"
                    @click="syncArtMetadataToImage(item)"
                  >
                    <span
                      v-if="fixingIds.has(item.artImage.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    Sync metadata
                  </button>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="field in item.missingFields"
                    :key="field"
                    class="badge badge-warning badge-xs"
                  >
                    {{ field }}
                  </span>
                </div>
                <span
                  v-if="fixResults.get(item.artImage.id)"
                  class="badge badge-success badge-sm self-start"
                >
                  {{ fixResults.get(item.artImage.id) }}
                </span>
              </div>
            </template>

            <!-- MISSING THUMBNAILS -->
            <template v-else-if="activeCategory === 'thumbs'">
              <div
                v-for="artImage in activeDisplayItems as ArtImage[]"
                :key="artImage.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="min-w-0">
                  <p class="font-mono text-xs font-bold text-base-content/50">
                    ArtImage #{{ artImage.id }}
                  </p>
                  <p class="truncate text-sm text-base-content/70">
                    {{
                      artImage.promptString?.slice(0, 60) ||
                      artImage.fileName ||
                      '(untitled)'
                    }}
                  </p>
                  <p class="text-xs text-base-content/40">
                    {{ artImage.fileType || 'png' }} · artId:
                    {{ artImage.artId ?? 'none' }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="btn btn-secondary btn-xs rounded-xl"
                    type="button"
                    :disabled="fixingIds.has(artImage.id)"
                    @click="generateAndSaveThumbnail(artImage)"
                  >
                    <span
                      v-if="fixingIds.has(artImage.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    Generate thumbnail
                  </button>
                  <span
                    v-if="fixResults.get(artImage.id)"
                    class="badge badge-success badge-sm"
                  >
                    {{ fixResults.get(artImage.id) }}
                  </span>
                </div>
              </div>
            </template>

            <!-- UNLINKED IMAGES -->
            <template v-else-if="activeCategory === 'unlinked'">
              <div
                v-for="artImage in activeDisplayItems as ArtImage[]"
                :key="artImage.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div class="min-w-0">
                  <p class="font-mono text-xs font-bold text-base-content/50">
                    ArtImage #{{ artImage.id }}
                  </p>
                  <p class="truncate text-sm text-base-content/70">
                    {{
                      artImage.promptString?.slice(0, 60) ||
                      artImage.fileName ||
                      '(no metadata)'
                    }}
                  </p>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <span
                      v-if="artImage.pitchId"
                      class="badge badge-ghost badge-xs"
                      >pitch #{{ artImage.pitchId }}</span
                    >
                    <span
                      v-if="artImage.botId"
                      class="badge badge-ghost badge-xs"
                      >bot #{{ artImage.botId }}</span
                    >
                    <span
                      v-if="artImage.userId"
                      class="badge badge-ghost badge-xs"
                      >user #{{ artImage.userId }}</span
                    >
                    <span class="badge badge-error badge-xs">no artId</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="badge badge-ghost badge-sm"
                    >Manual review needed</span
                  >
                  <span
                    v-if="fixResults.get(artImage.id)"
                    class="badge badge-success badge-sm"
                  >
                    {{ fixResults.get(artImage.id) }}
                  </span>
                </div>
              </div>
            </template>

            <!-- MATCHED -->
            <template v-else-if="activeCategory === 'matched'">
              <div
                v-for="item in activeDisplayItems as MatchedItem[]"
                :key="item.art.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-base-100 p-3 transition"
                :class="
                  item.needsThumbnail
                    ? 'border-warning/40 bg-warning/5'
                    : 'border-success/30'
                "
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <p class="font-mono text-xs font-bold text-base-content/50">
                      Art #{{ item.art.id }} ↔ ArtImage #{{ item.artImage.id }}
                    </p>
                    <span
                      v-if="item.needsThumbnail"
                      class="badge badge-warning badge-xs"
                      >needs thumbnail</span
                    >
                    <span v-else class="badge badge-success badge-xs"
                      >fully healthy</span
                    >
                    <span
                      v-if="item.artImage.checkpoint"
                      class="badge badge-ghost badge-xs font-mono"
                    >
                      {{ item.artImage.checkpoint.split('.')[0] }}
                    </span>
                  </div>
                  <p class="mt-1 truncate text-sm text-base-content">
                    {{
                      item.artImage.promptString?.slice(0, 80) || '(no prompt)'
                    }}
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    v-if="item.needsThumbnail"
                    class="btn btn-success btn-xs rounded-xl"
                    type="button"
                    :disabled="fixingIds.has(item.artImage.id)"
                    @click="generateAndSaveThumbnail(item.artImage)"
                  >
                    <span
                      v-if="fixingIds.has(item.artImage.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    Generate thumbnail
                  </button>
                  <Icon
                    v-else
                    name="kind-icon:check"
                    class="h-4 w-4 text-success"
                  />
                  <span
                    v-if="fixResults.get(item.artImage.id)"
                    class="badge badge-success badge-sm"
                  >
                    {{ fixResults.get(item.artImage.id) }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Scan log ───────────────────────────────────────────────────────── -->
    <details
      v-if="scanLog.length"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/60">
        Operation log ({{ scanLog.length }})
      </summary>
      <div class="mt-2 max-h-40 overflow-auto space-y-1">
        <p
          v-for="(entry, i) in scanLog"
          :key="i"
          class="font-mono text-xs"
          :class="
            entry.type === 'error'
              ? 'text-error'
              : entry.type === 'success'
                ? 'text-success'
                : 'text-base-content/60'
          "
        >
          {{ entry.msg }}
        </p>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/art-doctor.vue
import { computed, ref } from 'vue'
import type { Art, ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { performFetch } from '@/stores/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryKey = 'orphaned' | 'stale' | 'thumbs' | 'unlinked' | 'matched'
type ThumbFilter = 'all' | 'matched' | 'unmatched'
type MatchedFilter = 'all' | 'needs' | 'healthy'

interface StaleItem {
  art: Art
  artImage: ArtImage
  missingFields: string[]
}

interface MatchedItem {
  art: Art
  artImage: ArtImage
  needsThumbnail: boolean
}

interface LogEntry {
  msg: string
  type: 'info' | 'success' | 'error'
}

// ─── State ────────────────────────────────────────────────────────────────────

const artStore = useArtStore()

const isScanning = ref(false)
const hasScanned = ref(false)
const scanError = ref('')
const activeCategory = ref<CategoryKey>('orphaned')
const isBatchRunning = ref(false)
const fixingIds = ref<Set<number>>(new Set())
const fixResults = ref<Map<number, string>>(new Map())
const scanLog = ref<LogEntry[]>([])

const allArt = ref<Art[]>([])
const allArtImages = ref<ArtImage[]>([]) // metadata only, no imageData

const batchProgress = ref({ label: '', done: 0, total: 0 })

// sub-filter state
const thumbFilter = ref<ThumbFilter>('all')
const matchedFilter = ref<MatchedFilter>('all')

const thumbFilterOptions: [ThumbFilter, string][] = [
  ['all', 'All'],
  ['matched', 'Matched only'],
  ['unmatched', 'Unmatched only'],
]
const matchedFilterOptions: [MatchedFilter, string][] = [
  ['all', 'All'],
  ['needs', 'Needs thumbnail'],
  ['healthy', 'Fully healthy'],
]

// ─── Computed — problem categories ───────────────────────────────────────────

/**
 * Art records with no artImageId AND no ArtImage that back-references them via artId.
 */
const orphanedArt = computed<Art[]>(() => {
  const imageArtIds = new Set(
    allArtImages.value.map((i) => i.artId).filter(Boolean),
  )
  return allArt.value.filter(
    (art) => !art.artImageId && !imageArtIds.has(art.id),
  )
})

/**
 * ArtImages that have an artId but are missing key metadata that exists on the Art record.
 */
const staleMetadata = computed<StaleItem[]>(() => {
  const artMap = new Map(allArt.value.map((a) => [a.id, a]))
  const items: StaleItem[] = []

  for (const artImage of allArtImages.value) {
    if (!artImage.artId) continue
    const art = artMap.get(artImage.artId)
    if (!art) continue

    const missing: string[] = []
    if (!artImage.promptString && art.promptString) missing.push('promptString')
    if (!artImage.negativePrompt && art.negativePrompt)
      missing.push('negativePrompt')
    if (!artImage.checkpoint && art.checkpoint) missing.push('checkpoint')
    if (!artImage.sampler && art.sampler) missing.push('sampler')
    if (!artImage.seed && art.seed && art.seed !== -1) missing.push('seed')
    if (!artImage.steps && art.steps) missing.push('steps')
    if (!artImage.cfg && art.cfg) missing.push('cfg')
    if (!artImage.designer && art.designer) missing.push('designer')
    if (!artImage.genres && art.genres) missing.push('genres')
    if (!artImage.serverId && art.serverId) missing.push('serverId')
    if (!artImage.serverName && art.serverName) missing.push('serverName')
    if (artImage.isPublic == null && art.isPublic != null)
      missing.push('isPublic')
    if (artImage.isMature == null && art.isMature != null)
      missing.push('isMature')

    if (missing.length > 0)
      items.push({ art, artImage, missingFields: missing })
  }
  return items
})

/**
 * All ArtImages with no thumbnailData — regardless of match status.
 */
const missingThumbnails = computed<ArtImage[]>(() =>
  allArtImages.value.filter((i) => !i.thumbnailData),
)

/**
 * ArtImages with no owner FK at all.
 */
const unlinkedImages = computed<ArtImage[]>(() =>
  allArtImages.value.filter(
    (i) =>
      !i.artId &&
      !i.botId &&
      !i.pitchId &&
      !i.characterId &&
      !i.promptId &&
      !i.componentId &&
      !i.milestoneId &&
      !i.rewardId &&
      !i.chatId &&
      !i.butterflyId,
  ),
)

/**
 * Art records that have artImageId set AND an ArtImage that back-references them.
 * These are properly linked pairs — but may still need thumbnails.
 */
const matchedArt = computed<MatchedItem[]>(() => {
  const imageByArtId = new Map(
    allArtImages.value.filter((i) => i.artId).map((i) => [i.artId!, i]),
  )
  const items: MatchedItem[] = []

  for (const art of allArt.value) {
    if (!art.artImageId) continue
    const artImage = imageByArtId.get(art.id)
    if (!artImage) continue
    items.push({
      art,
      artImage,
      needsThumbnail: !artImage.thumbnailData,
    })
  }
  return items
})

const matchedNeedingThumbnail = computed(() =>
  matchedArt.value.filter((m) => m.needsThumbnail),
)

// ─── Filtered display lists ───────────────────────────────────────────────────

const filteredThumbs = computed<ArtImage[]>(() => {
  if (thumbFilter.value === 'matched')
    return missingThumbnails.value.filter((i) => i.artId != null)
  if (thumbFilter.value === 'unmatched')
    return missingThumbnails.value.filter((i) => i.artId == null)
  return missingThumbnails.value
})

const filteredMatched = computed<MatchedItem[]>(() => {
  if (matchedFilter.value === 'needs')
    return matchedArt.value.filter((m) => m.needsThumbnail)
  if (matchedFilter.value === 'healthy')
    return matchedArt.value.filter((m) => !m.needsThumbnail)
  return matchedArt.value
})

const activeDisplayItems = computed(() => {
  switch (activeCategory.value) {
    case 'orphaned':
      return orphanedArt.value
    case 'stale':
      return staleMetadata.value
    case 'thumbs':
      return filteredThumbs.value
    case 'unlinked':
      return unlinkedImages.value
    case 'matched':
      return filteredMatched.value
    default:
      return []
  }
})

// ─── Categories meta ─────────────────────────────────────────────────────────

const categories = computed(() => [
  {
    key: 'orphaned' as CategoryKey,
    label: 'Orphaned Art',
    icon: 'kind-icon:image',
    color: 'warning',
    description:
      'Art records with no linked ArtImage. If the Art has an imagePath or path, it can be promoted to a proper ArtImage row.',
    batchLabel: 'Promote all paths',
    items: orphanedArt.value,
  },
  {
    key: 'stale' as CategoryKey,
    label: 'Stale Metadata',
    icon: 'kind-icon:edit',
    color: 'info',
    description:
      'ArtImages linked to an Art record but missing generation metadata. Syncing copies promptString, checkpoint, seed, cfg, etc. from Art into ArtImage.',
    batchLabel: 'Sync all metadata',
    items: staleMetadata.value,
  },
  {
    key: 'thumbs' as CategoryKey,
    label: 'No Thumbnail',
    icon: 'kind-icon:image',
    color: 'secondary',
    description:
      'ArtImages that have imageData but no thumbnailData — includes both matched and unmatched records. Use the sub-filters to narrow the list. Thumbnails are generated client-side at 200×200 and saved back.',
    batchLabel: 'Generate all thumbnails',
    items: missingThumbnails.value,
  },
  {
    key: 'unlinked' as CategoryKey,
    label: 'Unlinked Images',
    icon: 'kind-icon:warning',
    color: 'error',
    description:
      'ArtImages with no owner FK at all — not attached to any Art, Bot, Pitch, Character, etc. These need manual review.',
    batchLabel: undefined,
    items: unlinkedImages.value,
  },
  {
    key: 'matched' as CategoryKey,
    label: 'Matched',
    icon: 'kind-icon:check',
    color: 'success',
    description:
      'Art records properly linked to an ArtImage with back-references intact. Use the sub-filters to find pairs still needing thumbnails.',
    batchLabel: 'Generate missing thumbnails',
    items: matchedArt.value,
  },
])

const activeCategoryMeta = computed(() =>
  categories.value.find((c) => c.key === activeCategory.value),
)

/**
 * How many items will actually be acted on by the batch button.
 * For 'matched' we only batch the thumbnail-needing subset.
 * For 'orphaned' we only batch ones that have a path.
 */
const batchableCount = computed(() => {
  switch (activeCategory.value) {
    case 'orphaned':
      return orphanedArt.value.filter(
        (a) => a.imagePath || (a.path && a.path !== 'UNDEFINED'),
      ).length
    case 'matched':
      return matchedNeedingThumbnail.value.length
    default:
      return activeCategoryMeta.value?.items.length ?? 0
  }
})

// ─── Health bar ───────────────────────────────────────────────────────────────

const healthyMatchedCount = computed(
  () => matchedArt.value.filter((m) => !m.needsThumbnail).length,
)

const healthSegments = computed(() => [
  { label: 'Healthy', color: '#639922', count: healthyMatchedCount.value },
  {
    label: 'Needs thumbnail',
    color: '#FAC775',
    count:
      matchedNeedingThumbnail.value.length +
      missingThumbnails.value.filter((i) => i.artId == null).length,
  },
  {
    label: 'Stale metadata',
    color: '#85B7EB',
    count: staleMetadata.value.length,
  },
  { label: 'Orphaned', color: '#EF9F27', count: orphanedArt.value.length },
  { label: 'Unlinked', color: '#F09595', count: unlinkedImages.value.length },
])

const healthPct = computed(() => {
  const total = healthSegments.value.reduce((s, seg) => s + seg.count, 0)
  if (total === 0) return 0
  return Math.round((healthyMatchedCount.value / total) * 100)
})

// ─── Scan ─────────────────────────────────────────────────────────────────────

async function runScan() {
  isScanning.value = true
  scanError.value = ''
  scanLog.value = []
  fixResults.value = new Map()

  try {
    log('Fetching Art records…')
    await artStore.fetchArtPage(1, 500, true)
    allArt.value = [...artStore.art]
    log(`Loaded ${allArt.value.length} Art records`, 'info')

    log('Fetching ArtImage metadata (no imageData)…')
    const response = await performFetch<ArtImage[]>('/api/art/images/meta')

    if (response.success && Array.isArray(response.data)) {
      allArtImages.value = response.data
      log(`Loaded ${allArtImages.value.length} ArtImage records`, 'info')
    } else {
      allArtImages.value = artStore.artImages.map(stripImageData)
      log(
        `Fallback: used ${allArtImages.value.length} cached ArtImage records`,
        'info',
      )
    }

    hasScanned.value = true
    log(
      `Scan complete — ${orphanedArt.value.length} orphaned, ${staleMetadata.value.length} stale, ` +
        `${missingThumbnails.value.length} no thumbnail, ${unlinkedImages.value.length} unlinked, ` +
        `${matchedArt.value.length} matched (${healthyMatchedCount.value} healthy)`,
      'success',
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scan failed'
    scanError.value = msg
    log(msg, 'error')
  } finally {
    isScanning.value = false
  }
}

// ─── Fixes ────────────────────────────────────────────────────────────────────

async function promotePathToArtImage(art: Art) {
  markFixing(art.id)
  try {
    const imagePath =
      art.imagePath || (art.path !== 'UNDEFINED' ? art.path : null)
    if (!imagePath) throw new Error('No image source on this Art record')

    const createRes = await performFetch<ArtImage>('/api/art/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artId: art.id,
        userId: art.userId,
        galleryId: art.galleryId,
        imagePath,
        imageData: '',
        fileType: guessFileType(imagePath),
        promptString: art.promptString,
        negativePrompt: art.negativePrompt,
        checkpoint: art.checkpoint,
        sampler: art.sampler,
        seed: art.seed,
        steps: art.steps,
        cfg: art.cfg,
        cfgHalf: art.cfgHalf,
        designer: art.designer,
        genres: art.genres,
        serverId: art.serverId,
        serverName: art.serverName,
        serverUrl: art.serverUrl,
        isPublic: art.isPublic,
        isMature: art.isMature,
      }),
    })

    if (!createRes.success || !createRes.data)
      throw new Error(createRes.message || 'Failed to create ArtImage')

    await performFetch(`/api/art/${art.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artImageId: createRes.data.id }),
    })

    setResult(art.id, `→ ArtImage #${createRes.data.id}`)
    log(`Art #${art.id} promoted to ArtImage #${createRes.data.id}`, 'success')

    allArt.value = allArt.value.map((a) =>
      a.id === art.id ? { ...a, artImageId: createRes.data!.id } : a,
    )
    allArtImages.value = [...allArtImages.value, stripImageData(createRes.data)]
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    setResult(art.id, `Error: ${msg}`)
    log(`Art #${art.id}: ${msg}`, 'error')
  } finally {
    unmarkFixing(art.id)
  }
}

async function syncArtMetadataToImage(item: StaleItem) {
  const id = item.artImage.id
  markFixing(id)
  try {
    const payload: Partial<ArtImage> = {}
    if (!item.artImage.promptString && item.art.promptString)
      payload.promptString = item.art.promptString
    if (!item.artImage.negativePrompt && item.art.negativePrompt)
      payload.negativePrompt = item.art.negativePrompt
    if (!item.artImage.checkpoint && item.art.checkpoint)
      payload.checkpoint = item.art.checkpoint
    if (!item.artImage.sampler && item.art.sampler)
      payload.sampler = item.art.sampler
    if (!item.artImage.seed && item.art.seed) payload.seed = item.art.seed
    if (!item.artImage.steps && item.art.steps) payload.steps = item.art.steps
    if (!item.artImage.cfg && item.art.cfg) payload.cfg = item.art.cfg
    if (item.artImage.cfgHalf == null && item.art.cfgHalf != null)
      payload.cfgHalf = item.art.cfgHalf
    if (!item.artImage.designer && item.art.designer)
      payload.designer = item.art.designer
    if (!item.artImage.genres && item.art.genres)
      payload.genres = item.art.genres
    if (!item.artImage.serverId && item.art.serverId)
      payload.serverId = item.art.serverId
    if (!item.artImage.serverName && item.art.serverName)
      payload.serverName = item.art.serverName
    if (item.artImage.isPublic == null && item.art.isPublic != null)
      payload.isPublic = item.art.isPublic
    if (item.artImage.isMature == null && item.art.isMature != null)
      payload.isMature = item.art.isMature

    const res = await performFetch<ArtImage>(`/api/art/image/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.success) throw new Error(res.message || 'Patch failed')

    setResult(id, 'Synced ✓')
    log(`ArtImage #${id}: synced ${Object.keys(payload).join(', ')}`, 'success')
    allArtImages.value = allArtImages.value.map((img) =>
      img.id === id ? { ...img, ...payload } : img,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    setResult(id, `Error: ${msg}`)
    log(`ArtImage #${id}: ${msg}`, 'error')
  } finally {
    unmarkFixing(id)
  }
}

async function generateAndSaveThumbnail(artImage: ArtImage, maxSize = 200) {
  const id = artImage.id
  markFixing(id)
  try {
    const res = await performFetch<ArtImage>(`/api/art/image/${id}`)
    if (!res.success || !res.data?.imageData)
      throw new Error('Could not fetch imageData for this ArtImage')

    const thumbnailData = await createThumbnailFromBase64(
      res.data.imageData,
      res.data.fileType ?? 'png',
      maxSize,
    )

    const patchRes = await performFetch<ArtImage>(`/api/art/image/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thumbnailData }),
    })

    if (!patchRes.success) throw new Error(patchRes.message || 'Patch failed')

    setResult(id, `Thumbnail saved (${maxSize}px)`)
    log(`ArtImage #${id}: thumbnail generated at ${maxSize}px`, 'success')
    allArtImages.value = allArtImages.value.map((img) =>
      img.id === id ? { ...img, thumbnailData: '(set)' } : img,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    setResult(id, `Error: ${msg}`)
    log(`ArtImage #${id}: ${msg}`, 'error')
  } finally {
    unmarkFixing(id)
  }
}

// ─── Batch runners ────────────────────────────────────────────────────────────

async function runBatch(category: CategoryKey) {
  isBatchRunning.value = true
  batchProgress.value = { label: '', done: 0, total: 0 }

  try {
    if (category === 'orphaned') {
      const items = orphanedArt.value.filter(
        (a) => a.imagePath || (a.path && a.path !== 'UNDEFINED'),
      )
      batchProgress.value = {
        label: 'Promoting paths…',
        done: 0,
        total: items.length,
      }
      for (const art of items) {
        await promotePathToArtImage(art)
        batchProgress.value.done++
      }
    }

    if (category === 'stale') {
      const items = staleMetadata.value
      batchProgress.value = {
        label: 'Syncing metadata…',
        done: 0,
        total: items.length,
      }
      for (const item of items) {
        await syncArtMetadataToImage(item)
        batchProgress.value.done++
      }
    }

    if (category === 'thumbs') {
      const items = missingThumbnails.value
      batchProgress.value = {
        label: 'Generating thumbnails…',
        done: 0,
        total: items.length,
      }
      for (const img of items) {
        await generateAndSaveThumbnail(img)
        batchProgress.value.done++
      }
    }

    if (category === 'matched') {
      const items = matchedNeedingThumbnail.value
      batchProgress.value = {
        label: 'Generating thumbnails for matched…',
        done: 0,
        total: items.length,
      }
      for (const item of items) {
        await generateAndSaveThumbnail(item.artImage)
        batchProgress.value.done++
      }
    }

    log(
      `Batch complete: ${batchProgress.value.done} / ${batchProgress.value.total}`,
      'success',
    )
  } finally {
    isBatchRunning.value = false
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function createThumbnailFromBase64(
  base64: string,
  fileType: string,
  maxSize: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const mimeType = fileType.startsWith('image/')
      ? fileType
      : `image/${fileType}`
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL(mimeType, 0.82)
      const b64 = dataUrl.split(',')[1]
      if (!b64) return reject(new Error('Canvas produced empty data URL'))
      resolve(b64)
    }
    img.onerror = () => reject(new Error('Failed to load image for thumbnail'))
    img.src = `data:${mimeType};base64,${base64}`
  })
}

function stripImageData(img: ArtImage): ArtImage {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    imageData: _imageData,
    thumbnailData: _thumbData,
    ...meta
  } = img as ArtImage & { imageData: string; thumbnailData?: string }
  return {
    ...meta,
    imageData: '',
    thumbnailData: _thumbData ? '(set)' : null,
  } as unknown as ArtImage
}

function guessFileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'jpeg'
  if (ext === 'webp') return 'webp'
  if (ext === 'gif') return 'gif'
  return 'png'
}

function markFixing(id: number) {
  fixingIds.value = new Set([...fixingIds.value, id])
}

function unmarkFixing(id: number) {
  const next = new Set(fixingIds.value)
  next.delete(id)
  fixingIds.value = next
}

function setResult(id: number, msg: string) {
  fixResults.value = new Map([...fixResults.value, [id, msg]])
}

function log(msg: string, type: LogEntry['type'] = 'info') {
  scanLog.value.push({
    msg: `[${new Date().toLocaleTimeString()}] ${msg}`,
    type,
  })
}
</script>

<style scoped>
/* Scan sweep animation on the header */
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

<!-- /components/content/art/art-doctor.vue -->
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
        <!-- description + batch + sub-filters -->
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
                    >{{ fixResults.get(art.id) }}</span
                  >
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
                    >{{ field }}</span
                  >
                </div>
                <span
                  v-if="fixResults.get(item.artImage.id)"
                  class="badge badge-success badge-sm self-start"
                  >{{ fixResults.get(item.artImage.id) }}</span
                >
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
                    >{{ fixResults.get(artImage.id) }}</span
                  >
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
                    >{{ fixResults.get(artImage.id) }}</span
                  >
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
                    ? 'border-warning/40'
                    : 'border-success/30'
                "
              >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <p class="font-mono text-xs font-bold text-base-content/50">
                      Art #{{ item.art.id }} ↔ ArtImage #{{ item.artImage.id }}
                    </p>
                    <span
                      v-if="item.linkDirection === 'both'"
                      class="badge badge-success badge-xs"
                      >↔ both</span
                    >
                    <span
                      v-else-if="item.linkDirection === 'art→image'"
                      class="badge badge-warning badge-xs"
                      >→ one-way</span
                    >
                    <span
                      v-else-if="item.linkDirection === 'image→art'"
                      class="badge badge-warning badge-xs"
                      >← one-way</span
                    >
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
                    v-if="item.linkDirection !== 'both'"
                    class="btn btn-warning btn-xs rounded-xl"
                    type="button"
                    :disabled="fixingIds.has(item.art.id)"
                    @click="repairLinkDirection(item)"
                  >
                    <span
                      v-if="fixingIds.has(item.art.id)"
                      class="loading loading-spinner loading-xs"
                    />
                    Repair link
                  </button>
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
                    Thumbnail
                  </button>
                  <Icon
                    v-else-if="item.linkDirection === 'both'"
                    name="kind-icon:check"
                    class="h-4 w-4 text-success"
                  />
                  <span
                    v-if="fixResults.get(item.artImage.id)"
                    class="badge badge-success badge-sm"
                    >{{ fixResults.get(item.artImage.id) }}</span
                  >
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

    <!-- ── Debug panel (remove once data model is confirmed) ─────────────── -->
    <details
      v-if="hasScanned"
      class="shrink-0 rounded-2xl border border-warning/40 bg-warning/5 p-3"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-warning">
        🔬 Link diagnostics — remove when done
      </summary>
      <div class="mt-3 flex flex-col gap-3">
        <!-- raw counts -->
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div
            v-for="stat in debugStats"
            :key="stat.label"
            class="rounded-xl border border-base-300 bg-base-100 p-2 text-center"
          >
            <p class="font-mono text-lg font-black" :class="stat.color">
              {{ stat.value }}
            </p>
            <p class="text-xs text-base-content/60">{{ stat.label }}</p>
          </div>
        </div>

        <!-- link breakdown -->
        <div
          class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs space-y-1"
        >
          <p class="mb-2 font-bold text-base-content/70">
            Link direction breakdown
          </p>
          <p class="font-mono text-base-content/60">
            Art with artImageId set:
            <span
              class="font-bold"
              :class="
                debugLinkStats.artWithArtImageId === 0
                  ? 'text-error'
                  : 'text-base-content'
              "
              >{{ debugLinkStats.artWithArtImageId }}</span
            >
          </p>
          <p class="font-mono text-base-content/60">
            …resolving to a real ArtImage:
            <span
              class="font-bold"
              :class="
                debugLinkStats.artImageIdResolved === 0
                  ? 'text-error'
                  : 'text-success'
              "
              >{{ debugLinkStats.artImageIdResolved }}</span
            >
          </p>
          <p class="font-mono text-base-content/60">
            ArtImages with artId set:
            <span
              class="font-bold"
              :class="
                debugLinkStats.artImagesWithArtId === 0
                  ? 'text-error'
                  : 'text-base-content'
              "
              >{{ debugLinkStats.artImagesWithArtId }}</span
            >
          </p>
          <p class="font-mono text-base-content/60">
            …resolving to a real Art:
            <span
              class="font-bold"
              :class="
                debugLinkStats.artIdResolved === 0
                  ? 'text-error'
                  : 'text-success'
              "
              >{{ debugLinkStats.artIdResolved }}</span
            >
          </p>
          <div class="divider my-1" />
          <p class="font-mono text-base-content/60">
            Bidirectional pairs (both sides set):
            <span class="font-bold text-success">{{
              debugLinkStats.bidirectional
            }}</span>
          </p>
          <p class="font-mono text-base-content/60">
            One-way Art→Image only (artImageId set, no artId back-ref):
            <span class="font-bold text-warning">{{
              debugLinkStats.onewayArtToImage
            }}</span>
          </p>
          <p class="font-mono text-base-content/60">
            One-way Image→Art only (artId set, no artImageId on Art):
            <span class="font-bold text-warning">{{
              debugLinkStats.onewayImageToArt
            }}</span>
          </p>
        </div>

        <!-- sample Art records -->
        <div class="rounded-xl border border-base-300 bg-base-100 p-3">
          <p class="mb-2 text-xs font-bold text-base-content/70">
            First 5 Art records — raw fields
          </p>
          <div class="overflow-x-auto">
            <table class="w-full font-mono text-xs">
              <thead>
                <tr class="text-base-content/50">
                  <th class="pr-4 text-left">id</th>
                  <th class="pr-4 text-left">artImageId</th>
                  <th class="pr-4 text-left">imagePath</th>
                  <th class="pr-4 text-left">path</th>
                  <th class="text-left">prompt (40ch)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="art in allArt.slice(0, 5)"
                  :key="art.id"
                  class="border-t border-base-300"
                >
                  <td class="py-1 pr-4 text-base-content">{{ art.id }}</td>
                  <td
                    class="py-1 pr-4"
                    :class="art.artImageId ? 'text-success' : 'text-error'"
                  >
                    {{ art.artImageId ?? 'null' }}
                  </td>
                  <td class="py-1 pr-4 max-w-30 truncate text-base-content/60">
                    {{ art.imagePath ?? '–' }}
                  </td>
                  <td class="py-1 pr-4 max-w-30 truncate text-base-content/60">
                    {{ art.path ?? '–' }}
                  </td>
                  <td class="py-1 max-w-40 truncate text-base-content/60">
                    {{ art.promptString?.slice(0, 40) ?? '–' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- sample ArtImage records -->
        <div class="rounded-xl border border-base-300 bg-base-100 p-3">
          <p class="mb-2 text-xs font-bold text-base-content/70">
            First 5 ArtImage records — raw fields
          </p>
          <div class="overflow-x-auto">
            <table class="w-full font-mono text-xs">
              <thead>
                <tr class="text-base-content/50">
                  <th class="pr-4 text-left">id</th>
                  <th class="pr-4 text-left">artId</th>
                  <th class="pr-4 text-left">thumbnailData</th>
                  <th class="pr-4 text-left">fileName</th>
                  <th class="text-left">prompt (40ch)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="img in allArtImages.slice(0, 5)"
                  :key="img.id"
                  class="border-t border-base-300"
                >
                  <td class="py-1 pr-4 text-base-content">{{ img.id }}</td>
                  <td
                    class="py-1 pr-4"
                    :class="img.artId ? 'text-success' : 'text-error'"
                  >
                    {{ img.artId ?? 'null' }}
                  </td>
                  <td
                    class="py-1 pr-4"
                    :class="img.thumbnailData ? 'text-success' : 'text-error'"
                  >
                    {{ img.thumbnailData ? '(set)' : 'null' }}
                  </td>
                  <td class="py-1 pr-4 max-w-30 truncate text-base-content/60">
                    {{ img.fileName ?? '–' }}
                  </td>
                  <td class="py-1 max-w-40 truncate text-base-content/60">
                    {{ img.promptString?.slice(0, 40) ?? '–' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
type LinkDirection = 'both' | 'art→image' | 'image→art'

interface StaleItem {
  art: Art
  artImage: ArtImage
  missingFields: string[]
}

interface MatchedItem {
  art: Art
  artImage: ArtImage
  needsThumbnail: boolean
  linkDirection: LinkDirection
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
const allArtImages = ref<ArtImage[]>([])

const batchProgress = ref({ label: '', done: 0, total: 0 })

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

const orphanedArt = computed<Art[]>(() => {
  // Orphaned = neither direction of the link exists
  const imageArtIds = new Set(
    allArtImages.value.map((i) => i.artId).filter(Boolean),
  )
  const imageIds = new Set(allArtImages.value.map((i) => i.id))
  return allArt.value.filter((art) => {
    const hasForward = !!art.artImageId && imageIds.has(art.artImageId)
    const hasBackRef = imageArtIds.has(art.id)
    return !hasForward && !hasBackRef
  })
})

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

const missingThumbnails = computed<ArtImage[]>(() =>
  allArtImages.value.filter((i) => !i.thumbnailData),
)

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
 * Matched pairs — uses EITHER direction of the link.
 *
 * The old computed required BOTH art.artImageId AND artImage.artId to be set,
 * which returns zero results when only one direction was ever populated.
 *
 * New logic:
 *   • Walk every Art record
 *   • Check if any ArtImage has artId === art.id  (image→art, the more common direction)
 *   • OR if Art.artImageId points at a real ArtImage  (art→image)
 *   • Record which direction(s) are present so one-way links can be repaired
 */
const matchedArt = computed<MatchedItem[]>(() => {
  const imageById = new Map(allArtImages.value.map((i) => [i.id, i]))
  const imageByArtId = new Map(
    allArtImages.value.filter((i) => i.artId != null).map((i) => [i.artId!, i]),
  )

  const seen = new Set<string>()
  const items: MatchedItem[] = []

  for (const art of allArt.value) {
    const viaArtId = imageByArtId.get(art.id) // image claims this art
    const viaArtImageId = art.artImageId
      ? imageById.get(art.artImageId)
      : undefined // art claims an image

    const artImage = viaArtId ?? viaArtImageId
    if (!artImage) continue

    const key = `${art.id}-${artImage.id}`
    if (seen.has(key)) continue
    seen.add(key)

    const hasForward = !!viaArtImageId
    const hasBack = !!viaArtId
    const linkDirection: LinkDirection =
      hasForward && hasBack ? 'both' : hasForward ? 'art→image' : 'image→art'

    items.push({
      art,
      artImage,
      needsThumbnail: !artImage.thumbnailData,
      linkDirection,
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
      'Art records with no linked ArtImage in either direction. If the Art has an imagePath or path, it can be promoted to a proper ArtImage row.',
    batchLabel: 'Promote all paths',
    items: orphanedArt.value,
  },
  {
    key: 'stale' as CategoryKey,
    label: 'Stale Metadata',
    icon: 'kind-icon:edit',
    color: 'info',
    description:
      'ArtImages linked to an Art record but missing generation metadata.',
    batchLabel: 'Sync all metadata',
    items: staleMetadata.value,
  },
  {
    key: 'thumbs' as CategoryKey,
    label: 'No Thumbnail',
    icon: 'kind-icon:image',
    color: 'secondary',
    description:
      'ArtImages that have imageData but no thumbnailData — includes both matched and unmatched records.',
    batchLabel: 'Generate all thumbnails',
    items: missingThumbnails.value,
  },
  {
    key: 'unlinked' as CategoryKey,
    label: 'Unlinked Images',
    icon: 'kind-icon:warning',
    color: 'error',
    description:
      'ArtImages with no owner FK at all — not attached to any Art, Bot, Pitch, Character, etc.',
    batchLabel: undefined,
    items: unlinkedImages.value,
  },
  {
    key: 'matched' as CategoryKey,
    label: 'Matched',
    icon: 'kind-icon:check',
    color: 'success',
    description:
      'Art ↔ ArtImage pairs found via either direction of the link. One-way links are flagged and can be repaired here.',
    batchLabel: 'Generate missing thumbnails',
    items: matchedArt.value,
  },
])

const activeCategoryMeta = computed(() =>
  categories.value.find((c) => c.key === activeCategory.value),
)

const batchableCount = computed(() => {
  if (activeCategory.value === 'orphaned')
    return orphanedArt.value.filter(
      (a) => a.imagePath || (a.path && a.path !== 'UNDEFINED'),
    ).length
  if (activeCategory.value === 'matched')
    return matchedNeedingThumbnail.value.length
  return activeCategoryMeta.value?.items.length ?? 0
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

// ─── Debug computed ───────────────────────────────────────────────────────────

const debugStats = computed(() => {
  const artWithArtImageId = allArt.value.filter(
    (a) => a.artImageId != null,
  ).length
  const imagesWithArtId = allArtImages.value.filter(
    (i) => i.artId != null,
  ).length
  return [
    {
      label: 'Art records loaded',
      value: allArt.value.length,
      color: 'text-base-content',
    },
    {
      label: 'ArtImage records loaded',
      value: allArtImages.value.length,
      color: 'text-base-content',
    },
    {
      label: 'Art with artImageId',
      value: artWithArtImageId,
      color: artWithArtImageId === 0 ? 'text-error' : 'text-success',
    },
    {
      label: 'ArtImages with artId',
      value: imagesWithArtId,
      color: imagesWithArtId === 0 ? 'text-error' : 'text-success',
    },
  ]
})

const debugLinkStats = computed(() => {
  const imageById = new Map(allArtImages.value.map((i) => [i.id, i]))
  const imageByArtId = new Map(
    allArtImages.value.filter((i) => i.artId != null).map((i) => [i.artId!, i]),
  )
  const artIds = new Set(allArt.value.map((a) => a.id))

  const artWithArtImageId = allArt.value.filter(
    (a) => a.artImageId != null,
  ).length
  const artImageIdResolved = allArt.value.filter(
    (a) => a.artImageId != null && imageById.has(a.artImageId),
  ).length
  const artImagesWithArtId = allArtImages.value.filter(
    (i) => i.artId != null,
  ).length
  const artIdResolved = allArtImages.value.filter(
    (i) => i.artId != null && artIds.has(i.artId),
  ).length

  let bidirectional = 0,
    onewayArtToImage = 0,
    onewayImageToArt = 0
  for (const art of allArt.value) {
    const hasForward = !!art.artImageId && imageById.has(art.artImageId)
    const hasBack = imageByArtId.has(art.id)
    if (hasForward && hasBack) bidirectional++
    else if (hasForward) onewayArtToImage++
    else if (hasBack) onewayImageToArt++
  }

  return {
    artWithArtImageId,
    artImageIdResolved,
    artImagesWithArtId,
    artIdResolved,
    bidirectional,
    onewayArtToImage,
    onewayImageToArt,
  }
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

    const artWithId = allArt.value.filter((a) => a.artImageId != null).length
    const imgWithId = allArtImages.value.filter((i) => i.artId != null).length
    log(
      `Link check — Art with artImageId: ${artWithId} / ArtImages with artId: ${imgWithId}`,
      'info',
    )

    hasScanned.value = true
    log(
      `Scan complete — ${orphanedArt.value.length} orphaned, ${staleMetadata.value.length} stale, ` +
        `${missingThumbnails.value.length} no thumbnail, ${unlinkedImages.value.length} unlinked, ` +
        `${matchedArt.value.length} matched (${healthyMatchedCount.value} fully healthy)`,
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

/**
 * Write the missing direction of a one-way link.
 *   art→image only  → write artImage.artId = art.id
 *   image→art only  → write art.artImageId = artImage.id
 */
async function repairLinkDirection(item: MatchedItem) {
  markFixing(item.art.id)
  try {
    if (item.linkDirection === 'art→image') {
      await performFetch(`/api/art/image/${item.artImage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artId: item.art.id }),
      })
      allArtImages.value = allArtImages.value.map((img) =>
        img.id === item.artImage.id ? { ...img, artId: item.art.id } : img,
      )
    } else {
      await performFetch(`/api/art/${item.art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artImageId: item.artImage.id }),
      })
      allArt.value = allArt.value.map((a) =>
        a.id === item.art.id ? { ...a, artImageId: item.artImage.id } : a,
      )
    }
    setResult(item.art.id, 'Link repaired ✓')
    log(
      `Art #${item.art.id} ↔ ArtImage #${item.artImage.id}: repaired (was ${item.linkDirection})`,
      'success',
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    setResult(item.art.id, `Error: ${msg}`)
    log(`Repair failed for Art #${item.art.id}: ${msg}`, 'error')
  } finally {
    unmarkFixing(item.art.id)
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
      batchProgress.value = {
        label: 'Syncing metadata…',
        done: 0,
        total: staleMetadata.value.length,
      }
      for (const item of staleMetadata.value) {
        await syncArtMetadataToImage(item)
        batchProgress.value.done++
      }
    }
    if (category === 'thumbs') {
      batchProgress.value = {
        label: 'Generating thumbnails…',
        done: 0,
        total: missingThumbnails.value.length,
      }
      for (const img of missingThumbnails.value) {
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
  const n = new Set(fixingIds.value)
  n.delete(id)
  fixingIds.value = n
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

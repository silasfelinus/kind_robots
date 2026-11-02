<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div
      class="kr-container-wide flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3"
    >
      <header-page-bar>
        <div class="cd-bar" data-testid="coat-dance-page-bar">
          <nav
            class="flex shrink-0 items-center gap-1 rounded-xl border border-base-300 bg-base-200/70 p-1"
            aria-label="Video generation mode"
          >
            <NuxtLink to="/play/video-generator" class="kr-btn-xs btn-ghost"
              >Image to video</NuxtLink
            >
            <span class="kr-btn-xs btn-primary" aria-current="page"
              >Full video restyle</span
            >
          </nav>
          <template v-if="ready && userStore.isAdmin">
            <label
              for="restyle-current-project"
              class="cd-bar-label shrink-0 text-xs font-semibold"
              >Project</label
            >
            <select
              id="restyle-current-project"
              class="select select-bordered select-sm min-w-[11rem] max-w-[22rem] flex-1"
              aria-label="Current video restyle project"
              :value="sourceFile ? '' : (store.selectedId ?? '')"
              @change="selectJobFromPicker"
            >
              <option value="" disabled>
                {{
                  sourceFile
                    ? 'New project from upload'
                    : store.jobs.length
                      ? 'Choose a project'
                      : 'No saved videos yet'
                }}
              </option>
              <option v-for="job in store.jobs" :key="job.id" :value="job.id">
                {{ projectOptionLabel(job) }} · {{ statusLabel(job.status) }}
              </option>
            </select>
            <div
              v-if="store.selected && !sourceFile"
              class="flex min-w-[10rem] max-w-[18rem] flex-1 items-center gap-1"
            >
              <input
                v-model="title"
                type="text"
                class="input input-bordered input-sm min-w-0 flex-1"
                maxlength="120"
                aria-label="Project title"
                placeholder="Name this video"
                @keydown.enter="saveProjectTitle"
              />
              <button
                v-if="title.trim() !== store.selected.title"
                type="button"
                class="kr-btn-xs btn-primary shrink-0"
                :disabled="
                  store.busy || isRendering(store.selected) || !title.trim()
                "
                @click="saveProjectTitle"
              >
                Save title
              </button>
            </div>
            <label class="kr-btn-xs btn-outline shrink-0 cursor-pointer">
              New from video
              <input
                ref="fileInput"
                type="file"
                class="sr-only"
                :accept="RESTYLE_SOURCE_ACCEPT"
                @change="chooseFile"
              />
            </label>
            <button
              type="button"
              class="kr-btn-xs btn-ghost shrink-0"
              :disabled="store.busy || store.syncing"
              @click="store.refresh()"
            >
              Refresh
            </button>
            <button
              v-if="store.selected && !sourceFile"
              type="button"
              class="kr-btn-xs btn-ghost shrink-0 text-error"
              :disabled="store.busy || isRendering(store.selected)"
              :title="
                isRendering(store.selected)
                  ? 'KR Relay is rendering this project; delete it after the render finishes or fails.'
                  : 'Delete this project, its private source video and every render'
              "
              @click="deleteSelected"
            >
              Delete
            </button>
          </template>
        </div>
      </header-page-bar>

      <div v-if="!ready" class="kr-panel grid flex-1 place-items-center">
        <span class="kr-spinner-lg-primary" />
      </div>
      <div
        v-else-if="!userStore.isAdmin"
        class="kr-panel grid flex-1 place-items-center p-6"
      >
        <p>This studio is currently available to administrators.</p>
      </div>
      <template v-else>
        <div
          v-if="store.error"
          role="alert"
          class="kr-note kr-note-error flex shrink-0 items-center justify-between gap-2 border border-error/30 bg-base-100 p-2 text-sm text-base-content shadow-sm"
        >
          {{ store.error }}
          <button type="button" class="kr-btn-xs" @click="store.error = ''">
            Dismiss
          </button>
        </div>
        <div
          v-if="store.notice"
          role="status"
          class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-2 text-xs text-base-content shadow-sm"
        >
          {{ store.notice }}
        </div>
        <div
          v-if="store.registrationError"
          role="alert"
          class="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-error/40 bg-base-100 p-2 text-sm text-base-content shadow-sm"
        >
          <span>
            ArtJob registration failed: {{ store.registrationError }}
            Your original video remains saved.
          </span>
          <button
            type="button"
            class="kr-btn-outline-xs"
            :disabled="store.syncing"
            @click="store.refresh()"
          >
            {{ store.syncing ? 'Retrying…' : 'Retry ArtJob registration' }}
          </button>
        </div>

        <!-- New project from an uploaded file -->
        <div
          v-if="sourceFile"
          class="flex min-w-0 shrink-0 flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-base-100 px-2 py-1.5 text-xs"
          aria-label="New project from upload"
        >
          <strong class="shrink-0">New project</strong>
          <input
            v-model="title"
            type="text"
            class="input input-bordered input-sm min-w-[10rem] flex-1"
            maxlength="120"
            placeholder="Coat Dance / original performance"
            aria-label="Project title"
          />
          <span class="opacity-70"
            >{{ fileDescription
            }}{{
              durationSec ? ` · ${formatRestyleTime(durationSec)}` : ''
            }}</span
          >
          <button
            type="button"
            class="kr-btn-xs btn-ghost"
            @click="cancelUpload"
          >
            Cancel
          </button>
        </div>

        <!-- Selected project status: one line, details on demand -->
        <details
          v-else-if="store.selected"
          class="shrink-0 rounded-xl border border-base-300 bg-base-100 px-2 py-1.5 text-xs"
          aria-label="Selected project status"
        >
          <summary
            class="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span class="kr-badge-outline">{{
              statusLabel(store.selected.status)
            }}</span>
            <span class="opacity-80">
              {{ labelFor(store.selected.style) }} ·
              {{ store.selected.quality }} ·
              <span v-if="store.selected.renderSpeed === 'fast'"
                >Fast draft ·
              </span>
              {{ formatRestyleTime(store.selected.sourceDurationSec) }}
              <span v-if="store.selected.isMature"> · Mature</span>
              <span v-if="store.selected.isPrivate === false">
                · Publication candidate</span
              >
            </span>
            <span v-if="store.selected.full || store.selected.pilot">
              ·
              {{
                store.selected.full?.completedSegments ??
                store.selected.pilot?.completedSegments
              }}/{{
                store.selected.full?.totalSegments ??
                store.selected.pilot?.totalSegments
              }}
              windows · {{ Math.round(store.selected.progress) }}%
            </span>
            <NuxtLink
              v-if="
                store.selected.full?.artJobId || store.selected.pilot?.artJobId
              "
              :to="{
                path: '/artjob',
                query: {
                  jobId:
                    store.selected.full?.artJobId ||
                    store.selected.pilot?.artJobId,
                },
              }"
              class="font-semibold text-primary hover:underline"
              >View ArtJob #{{
                store.selected.full?.artJobId || store.selected.pilot?.artJobId
              }}</NuxtLink
            >
            <button
              v-if="needsArtJobLink"
              type="button"
              class="kr-btn-outline-xs"
              :disabled="store.syncing"
              @click.prevent="store.refresh()"
            >
              {{ store.syncing ? 'Registering…' : 'Register in ArtJob' }}
            </button>
            <span
              v-if="
                store.selected.progress > 0 && store.selected.progress < 100
              "
              class="h-1.5 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-base-300"
            >
              <span
                class="block h-full bg-primary"
                :style="{ width: store.selected.progress + '%' }"
              />
            </span>
          </summary>
          <div class="space-y-1.5 pt-2 text-base-content/75">
            <p>
              {{ store.selected.stage }} · {{ store.selected.sourceFile }} ·
              {{ (store.selected.sourceBytes / (1024 * 1024)).toFixed(1) }}
              MiB · {{ store.selected.segments.length }} motion windows · saved
              privately
            </p>
            <ol
              v-if="savedSchedule.length"
              class="flex max-h-12 flex-wrap gap-0.5 overflow-y-auto"
              aria-label="Saved look per motion window"
            >
              <li
                v-for="window in savedSchedule"
                :key="window.index"
                class="relative h-8 w-6 overflow-hidden rounded bg-gradient-to-br"
                :class="toneFor(window.styleId)"
                :title="`Window ${window.index + 1} · ${formatRestyleTime(window.sourceStartSec)} · ${labelFor(window.styleId)}`"
              >
                <img
                  v-if="store.stylePreviews[window.styleId]?.imageUrl"
                  :src="store.stylePreviews[window.styleId]!.imageUrl!"
                  :alt="`Window ${window.index + 1}: ${labelFor(window.styleId)}`"
                  loading="lazy"
                  class="absolute inset-0 h-full w-full object-cover"
                />
              </li>
            </ol>
            <p>
              <strong>How rendering works:</strong> KR Relay renders the whole
              film in one batch from your saved video, window by window, and
              resumes from saved windows after a failure. Each look has its own
              render project; no video is published from this studio.
            </p>
          </div>
        </details>
        <p
          v-if="store.selected?.error && !sourceFile"
          class="shrink-0 text-xs text-error"
          role="alert"
        >
          {{ store.selected.error }}
        </p>

        <!-- Stage: look picker, or the player once something is playing -->
        <section
          class="kr-panel flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2"
          aria-label="Animation look and playback"
        >
          <div class="flex shrink-0 flex-wrap items-center gap-1">
            <div
              class="flex items-center gap-1 rounded-xl bg-base-200 p-1"
              role="group"
              aria-label="Stage view"
            >
              <button
                type="button"
                class="kr-btn-xs"
                :class="stageView === 'looks' ? 'btn-primary' : 'btn-ghost'"
                :aria-pressed="stageView === 'looks'"
                @click="setStageView('looks')"
              >
                Looks · {{ RESTYLE_STYLES.length }}
              </button>
              <button
                type="button"
                class="kr-btn-xs"
                :class="stageView === 'video' ? 'btn-primary' : 'btn-ghost'"
                :aria-pressed="stageView === 'video'"
                @click="setStageView('video')"
              >
                Video{{ playingLabel ? ` · ${playingLabel}` : '' }}
              </button>
            </div>
            <div
              v-if="store.selected && !sourceFile"
              class="flex flex-wrap gap-1"
              aria-label="Available video versions"
            >
              <button
                type="button"
                class="kr-btn-xs btn-outline"
                :disabled="store.sourceBusy"
                @click="showSource"
              >
                ▶ Original
              </button>
              <button
                v-if="
                  store.selected.pilot &&
                  (store.selected.status === 'REVIEW' || store.selected.full)
                "
                type="button"
                class="kr-btn-xs btn-outline"
                :disabled="store.sourceBusy"
                @click="showPilot()"
              >
                ▶ Pilot
              </button>
              <button
                v-if="store.selected.pilot?.previousRevision"
                type="button"
                class="kr-btn-xs btn-outline"
                title="Watch previous pilot for comparison"
                :disabled="store.sourceBusy"
                @click="showPilot(true)"
              >
                ▶ Previous pilot
              </button>
              <button
                v-if="store.selected.status === 'DONE' && store.selected.full"
                type="button"
                class="kr-btn-xs btn-primary"
                title="Watch finished full film"
                :disabled="store.sourceBusy"
                @click="showFull"
              >
                ▶ Full film
              </button>
            </div>
            <span v-if="store.sourceBusy" class="kr-spinner-xs" />
            <button
              v-if="stageView === 'looks' && missingPreviewCount"
              type="button"
              class="kr-btn-xs btn-ghost ml-auto"
              title="Generate all missing previews"
              :disabled="store.stylePreviewBusy"
              @click="store.queueStylePreviews({ missing: true })"
            >
              Generate missing previews ({{ missingPreviewCount }})
            </button>
          </div>

          <!-- The player is pinned to the stage box so the whole frame (and
               its controls) always fits; letterboxing beats cropping. -->
          <div
            v-show="stageView === 'video'"
            class="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-2xl border border-base-300 bg-neutral text-neutral-content"
          >
            <video
              v-if="store.previewUrl && store.previewKind === 'video'"
              ref="videoEl"
              :src="store.previewUrl"
              controls
              playsinline
              preload="metadata"
              class="absolute inset-0 h-full w-full object-contain"
              aria-label="Video playback preview"
              @loadedmetadata="readVideoMetadata"
            />
            <img
              v-else-if="store.previewUrl && store.previewKind === 'image'"
              :src="store.previewUrl"
              alt="Animated GIF preview"
              class="absolute inset-0 h-full w-full object-contain"
            />
            <div
              v-else-if="store.previewUrl"
              class="max-w-xs space-y-2 p-4 text-center"
            >
              <icon name="kind-icon:video" class="mx-auto h-8 w-8" />
              <p class="text-lg font-black tracking-tight">MPEG video ready</p>
              <p class="text-sm opacity-80">
                Browsers can’t play MPEG, so there’s no preview here. The
                renderer reads it directly and your restyled film comes back as
                MP4{{
                  durationSec ? ` · ${formatRestyleTime(durationSec)}` : ''
                }}.
              </p>
            </div>
            <div v-else class="max-w-xs space-y-2 p-4 text-center">
              <icon name="kind-icon:video" class="mx-auto h-8 w-8" />
              <p class="text-lg font-black tracking-tight">
                Keep the dance. Change the world.
              </p>
              <button
                v-if="store.selected"
                type="button"
                class="kr-btn kr-btn-primary"
                :disabled="store.sourceBusy"
                @click="showSource"
              >
                {{
                  store.sourceBusy
                    ? 'Loading private video…'
                    : 'Preview saved source'
                }}
              </button>
              <p v-else class="text-sm opacity-80">
                Choose “New from video” to start a project.
              </p>
            </div>
          </div>

          <div v-if="stageView === 'looks'" class="kr-scroll min-h-0 flex-1">
            <div
              class="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8 2xl:grid-cols-10"
            >
              <button
                type="button"
                class="overflow-hidden rounded-xl border-2 bg-base-200 text-left transition-colors"
                :class="
                  isGrabBag
                    ? 'border-primary'
                    : 'border-transparent hover:border-base-content/30'
                "
                :aria-pressed="isGrabBag"
                @click="toggleGrabBag"
              >
                <span
                  class="relative grid aspect-[4/5] grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-gradient-to-br"
                  :class="RESTYLE_GRAB_BAG.tone"
                >
                  <span
                    v-for="(tile, tileIndex) in collageStyles"
                    :key="`${tile.id}-${tileIndex}`"
                    class="relative block overflow-hidden bg-gradient-to-br"
                    :class="tile.tone"
                  >
                    <img
                      v-if="store.stylePreviews[tile.id]?.imageUrl"
                      :src="store.stylePreviews[tile.id]!.imageUrl!"
                      :alt="`${tile.label} in the grab bag`"
                      loading="lazy"
                      class="absolute inset-0 h-full w-full object-cover"
                    />
                  </span>
                  <span
                    class="absolute left-1 top-1 rounded-full bg-base-100/85 px-1.5 py-0.5 text-[10px] font-semibold"
                    >{{ grabBagStyles.length }} looks</span
                  >
                  <span
                    v-if="isGrabBag"
                    class="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-content"
                  >
                    <icon name="kind-icon:check" class="h-3 w-3" />
                  </span>
                </span>
                <span
                  class="block truncate px-1.5 py-1 text-[11px] font-bold"
                  :title="RESTYLE_GRAB_BAG.note"
                  >{{ RESTYLE_GRAB_BAG.label }}</span
                >
              </button>
              <button
                v-for="look in RESTYLE_STYLES"
                :key="look.id"
                type="button"
                class="overflow-hidden rounded-xl border-2 bg-base-200 text-left transition-colors"
                :class="
                  lookActive(look.id)
                    ? 'border-primary'
                    : 'border-transparent hover:border-base-content/30'
                "
                :aria-pressed="lookActive(look.id)"
                :title="look.note"
                @click="pickLook(look.id)"
              >
                <span
                  class="relative block aspect-[4/5] overflow-hidden bg-gradient-to-br"
                  :class="look.tone"
                >
                  <img
                    v-if="store.stylePreviews[look.id]?.imageUrl"
                    :src="store.stylePreviews[look.id]!.imageUrl!"
                    :alt="`${look.label} style preview`"
                    loading="lazy"
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                  <span
                    v-else
                    class="absolute inset-0 grid place-items-center text-4xl font-light text-base-content/80"
                    >✦</span
                  >
                  <span
                    v-if="previewBadge(look.id)"
                    class="absolute left-1 top-1 rounded-full bg-base-100/85 px-1.5 py-0.5 text-[10px] font-semibold"
                    >{{ previewBadge(look.id) }}</span
                  >
                  <span
                    v-if="isGrabBag && lookActive(look.id)"
                    class="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-content"
                    >{{ grabBagStyles.indexOf(look.id) + 1 }}</span
                  >
                  <span
                    v-else-if="lookActive(look.id)"
                    class="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-content"
                  >
                    <icon name="kind-icon:check" class="h-3 w-3" />
                  </span>
                </span>
                <span
                  class="block truncate px-1.5 py-1 text-[11px] font-bold"
                  >{{ look.label }}</span
                >
              </button>
            </div>
          </div>
        </section>

        <!-- Render bar: the selected look, its settings and the one action -->
        <section
          class="max-h-[45%] shrink-0 overflow-y-auto overscroll-contain space-y-1.5 rounded-2xl border border-primary/30 bg-base-100 p-2 text-xs shadow-sm"
          aria-label="Selected look and next render"
        >
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong>Selected look: {{ labelFor(style) }}</strong>
            <template v-if="isGrabBag">
              <span class="opacity-70"
                >{{ grabBagStyles.length }}/{{
                  RESTYLE_GRAB_BAG_MAX_STYLES
                }}
                looks · new look every ~{{ windowSeconds }}s</span
              >
              <button
                type="button"
                class="kr-btn-xs"
                :class="grabBagMode === 'cycle' ? 'btn-primary' : 'btn-outline'"
                :aria-pressed="grabBagMode === 'cycle'"
                @click="setGrabBagMode('cycle')"
              >
                Loop in listed order
              </button>
              <button
                type="button"
                class="kr-btn-xs"
                :class="
                  grabBagMode === 'shuffle_locked'
                    ? 'btn-primary'
                    : 'btn-outline'
                "
                :aria-pressed="grabBagMode === 'shuffle_locked'"
                @click="setGrabBagMode('shuffle_locked')"
              >
                Shuffle once, then lock
              </button>
              <button
                v-if="grabBagMode === 'shuffle_locked'"
                type="button"
                class="kr-btn-xs btn-ghost"
                @click="reshuffleGrabBag"
              >
                Reshuffle
              </button>
              <button
                v-if="grabBagStyles.length < RESTYLE_STYLES.length"
                type="button"
                class="kr-btn-xs btn-ghost"
                @click="addAllToGrabBag"
              >
                Add all {{ RESTYLE_STYLES.length }}
              </button>
              <button
                v-if="missingGrabBagPreviews.length"
                type="button"
                class="kr-btn-xs btn-ghost"
                :disabled="store.stylePreviewBusy"
                @click="
                  store.queueStylePreviews({
                    styleIds: missingGrabBagPreviews,
                  })
                "
              >
                Generate missing ({{ missingGrabBagPreviews.length }})
              </button>
            </template>
            <template v-else>
              <span class="opacity-70">{{
                previewStateLabel(selectedPreview?.state)
              }}</span>
              <NuxtLink
                v-if="selectedPreview?.artJobId"
                :to="{
                  path: '/artjob',
                  query: { jobId: selectedPreview.artJobId },
                }"
                class="font-semibold text-primary hover:underline"
              >
                ArtJob #{{ selectedPreview.artJobId }}
              </NuxtLink>
              <button
                type="button"
                class="kr-btn-xs btn-ghost"
                :disabled="store.stylePreviewBusy || previewActive"
                @click="queueSelectedPreview"
              >
                {{
                  selectedPreview?.imageUrl
                    ? 'Regenerate preview'
                    : 'Generate preview'
                }}
              </button>
            </template>
          </div>
          <details v-if="isGrabBag" aria-label="Grab bag rotation">
            <summary class="cursor-pointer opacity-80">
              Rotation order: {{ grabBagSequenceLabel }}
            </summary>
            <ol
              class="mt-1 flex max-h-20 flex-wrap gap-1 overflow-y-auto"
              aria-label="Rotation order"
            >
              <li
                v-for="(id, order) in grabBagStyles"
                :key="id"
                class="flex items-center gap-1 rounded-full border border-base-300 bg-base-200 py-0.5 pl-2 pr-0.5"
              >
                <span class="font-semibold"
                  >{{ order + 1 }}. {{ labelFor(id) }}</span
                >
                <button
                  type="button"
                  class="kr-btn-xs btn-ghost btn-circle"
                  :aria-label="`Remove ${labelFor(id)} from the grab bag`"
                  @click="pickLook(id)"
                >
                  ×
                </button>
              </li>
            </ol>
          </details>
          <p v-if="!grabBagReady" class="text-warning">
            Pick at least {{ RESTYLE_GRAB_BAG_MIN_STYLES }} looks to rotate.
          </p>
          <p v-if="store.stylePreviewError" class="text-error">
            {{ store.stylePreviewError }}
          </p>
          <p v-if="sourceFile" class="text-base-content/80">
            New source selected. Uploading renders the full film in
            {{ labelFor(style) }}.
          </p>
          <p
            v-else-if="store.selected && lookChanged"
            class="text-base-content/80"
            role="status"
          >
            {{
              store.selected.status === 'STAGED'
                ? 'Unsaved choices. Saving renders the full film in this look.'
                : `New version selected. Your existing ${labelFor(store.selected.style)} project stays unchanged; rendering creates a new project from the same video.`
            }}
          </p>
          <p v-else-if="store.selected" class="text-base-content/70">
            Matches the saved {{ labelFor(store.selected.style) }} project. Pick
            another look to render a new version.
          </p>
          <p v-else class="text-base-content/70">
            Choose “New from video” to create a project.
          </p>
          <div class="flex flex-wrap items-start gap-2">
            <details
              class="min-w-0 flex-1 rounded-xl border border-base-300 bg-base-200/50 px-2 py-1"
            >
              <summary class="cursor-pointer font-semibold">
                Render settings · {{ quality }} · {{ overwriteStrength }}%
                restyle ·
                {{ renderSpeed === 'fast' ? 'Fast draft ·' : '' }}
                {{ isPrivate ? 'Private' : 'Release candidate'
                }}{{ isMature ? ' · Mature' : '' }}
              </summary>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                <span class="flex items-center gap-1">
                  <span class="font-semibold">Quality</span>
                  <button
                    v-for="value in qualityOptions"
                    :key="value"
                    type="button"
                    class="kr-btn-xs"
                    :class="quality === value ? 'btn-primary' : 'btn-outline'"
                    :aria-pressed="quality === value"
                    @click="quality = value"
                  >
                    {{ value }}
                  </button>
                </span>
                <span class="flex items-center gap-1">
                  <span class="font-semibold">Speed</span>
                  <button
                    v-for="option in speedOptions"
                    :key="option.value"
                    type="button"
                    class="kr-btn-xs"
                    :class="
                      renderSpeed === option.value
                        ? 'btn-primary'
                        : 'btn-outline'
                    "
                    :aria-pressed="renderSpeed === option.value"
                    :title="option.note"
                    @click="renderSpeed = option.value"
                  >
                    {{ option.label }}
                  </button>
                </span>
                <label class="flex min-w-[12rem] flex-1 items-center gap-2">
                  <span class="shrink-0 font-semibold">Overwrite strength</span>
                  <input
                    v-model.number="overwriteStrength"
                    type="range"
                    class="range range-primary range-xs min-w-[6rem] flex-1"
                    min="0"
                    max="100"
                    step="5"
                    :aria-valuetext="`${overwriteStrength}% restyle`"
                    aria-label="Overwrite strength"
                  />
                  <output class="w-9 shrink-0 text-right tabular-nums"
                    >{{ overwriteStrength }}%</output
                  >
                </label>
                <label class="flex cursor-pointer items-center gap-1">
                  <input
                    v-model="isPrivate"
                    type="checkbox"
                    class="checkbox checkbox-xs"
                  />
                  Keep private
                </label>
                <label class="flex cursor-pointer items-center gap-1">
                  <input
                    v-model="isMature"
                    type="checkbox"
                    class="checkbox checkbox-xs"
                  />
                  Mature content
                </label>
                <p class="kr-text-faded-xs w-full">
                  Lower overwrite strength mixes more of the original frames
                  back into the rendered video; 0% is original, 100% is the
                  existing full restyle. This controls visual replacement, not
                  prompt accuracy. Prompt-guided Wan VACE looks; 1080p is
                  upscaled after assembly. Fast draft uses the CausVid LoRA (8
                  steps instead of 20) for roughly five times the speed, with
                  some loss of detail; it waits until KR Relay has that LoRA
                  installed. Sources and pilots stay access-controlled even when
                  marked as release candidates.
                </p>
              </div>
            </details>
            <div class="flex flex-wrap gap-2">
              <button
                v-if="sourceFile"
                type="button"
                class="kr-btn kr-btn-primary"
                :disabled="!canStage || store.busy"
                @click="stage"
              >
                <span v-if="store.busy" class="kr-spinner-xs" />
                {{ store.busy ? 'Uploading…' : 'Upload & render full film' }}
              </button>
              <button
                v-if="
                  store.selected &&
                  !sourceFile &&
                  store.selected.status === 'STAGED' &&
                  lookChanged
                "
                type="button"
                class="kr-btn kr-btn-primary"
                :disabled="store.busy || !grabBagReady"
                @click="saveLookAndRender"
              >
                {{ store.busy ? 'Queueing…' : 'Save look & render full film' }}
              </button>
              <button
                v-if="
                  store.selected &&
                  !sourceFile &&
                  store.selected.status !== 'STAGED' &&
                  lookChanged
                "
                type="button"
                class="kr-btn kr-btn-primary"
                :disabled="store.busy || !grabBagReady"
                @click="renderAsNewFilm"
              >
                {{
                  store.busy ? 'Queueing…' : 'Render this look as a new film'
                }}
              </button>
              <button
                v-if="
                  store.selected && !sourceFile && !lookChanged && canQueueFull
                "
                type="button"
                class="kr-btn kr-btn-primary"
                :disabled="store.busy"
                @click="store.queueFull(store.selected.id)"
              >
                {{
                  store.busy
                    ? 'Queueing…'
                    : `Render full ${formatRestyleTime(store.selected.sourceDurationSec)} film`
                }}
              </button>
              <button
                v-if="
                  store.selected &&
                  !sourceFile &&
                  !lookChanged &&
                  store.selected.status === 'FULL_FAILED'
                "
                type="button"
                class="kr-btn kr-btn-primary"
                :disabled="store.busy"
                @click="store.retryFull(store.selected.id)"
              >
                {{
                  store.busy
                    ? 'Queueing…'
                    : 'Resume full film using saved windows'
                }}
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { VideoRestyleJob } from '@/server/utils/videoRestyleJobs'
import { useVideoRestyleStore } from '@/stores/videoRestyleStore'
import { useUserStore } from '@/stores/userStore'
import {
  RESTYLE_GRAB_BAG,
  RESTYLE_GRAB_BAG_DEFAULT_STYLES,
  RESTYLE_GRAB_BAG_MAX_STYLES,
  RESTYLE_GRAB_BAG_MIN_STYLES,
  RESTYLE_MAX_BYTES,
  RESTYLE_MAX_DURATION_SEC,
  RESTYLE_RENDER_FPS,
  RESTYLE_RENDER_WINDOW_STEP,
  RESTYLE_STYLES,
  formatRestyleTime,
  restyleLookLabel,
  shuffleRestyleStyles,
  type RestyleLookId,
  type RestylePreviewState,
  type RestyleQuality,
  type RestyleRenderSpeed,
  type RestyleStyleId,
  type RestyleVariantMode,
} from '@/utils/videoRestylePlan'
import {
  RESTYLE_SOURCE_ACCEPT,
  RESTYLE_SOURCE_EXTENSION,
} from '@/utils/videoRestyleSource'

const userStore = useUserStore()
const store = useVideoRestyleStore()
const ready = ref(false)
// The stage is the look picker until something is played; then the same
// space becomes the player.
const stageView = ref<'looks' | 'video'>('looks')
const playing = ref<'' | 'upload' | 'source' | 'pilot' | 'previous' | 'full'>(
  '',
)
const videoEl = ref<HTMLVideoElement | null>(null)
const playingLabel = computed(
  () =>
    ({
      '': '',
      upload: 'New upload',
      source: 'Original',
      pilot: 'Pilot',
      previous: 'Previous pilot',
      full: 'Full film',
    })[playing.value],
)
const qualityOptions = ['720p', '1080p'] as const
const speedOptions: {
  value: RestyleRenderSpeed
  label: string
  note: string
}[] = [
  { value: 'standard', label: 'Standard', note: '20 steps, full detail' },
  {
    value: 'fast',
    label: 'Fast draft',
    note: 'CausVid LoRA, 8 steps: about five times faster',
  },
]
const style = ref<RestyleLookId>('illustrious')
const grabBagStyles = ref<RestyleStyleId[]>([
  ...RESTYLE_GRAB_BAG_DEFAULT_STYLES,
])
const grabBagMode = ref<RestyleVariantMode>('cycle')
const isGrabBag = computed(() => style.value === RESTYLE_GRAB_BAG.id)
const grabBagReady = computed(
  () =>
    !isGrabBag.value ||
    grabBagStyles.value.length >= RESTYLE_GRAB_BAG_MIN_STYLES,
)
const grabBagChoice = computed(() =>
  isGrabBag.value
    ? {
        variantStyleIds: [...grabBagStyles.value],
        variantMode: grabBagMode.value,
      }
    : {},
)
const collageStyles = computed(() =>
  grabBagStyles.value
    .slice(0, 4)
    .map((id) => RESTYLE_STYLES.find((entry) => entry.id === id)!),
)
const grabBagSequenceLabel = computed(() => {
  const shown = grabBagStyles.value.slice(0, 6).map(labelFor).join(' → ')
  const more = grabBagStyles.value.length - 6
  return more > 0 ? `${shown} → +${more} more` : shown
})
const missingGrabBagPreviews = computed(() =>
  grabBagStyles.value.filter((id) => !store.stylePreviews[id]?.imageUrl),
)
const windowSeconds = (RESTYLE_RENDER_WINDOW_STEP / RESTYLE_RENDER_FPS).toFixed(
  1,
)
const savedSchedule = computed(
  () =>
    store.selected?.full?.styleSchedule ??
    store.selected?.pilot?.styleSchedule ??
    [],
)
const quality = ref<RestyleQuality>('1080p')
const renderSpeed = ref<RestyleRenderSpeed>('standard')
const isPrivate = ref(true)
const isMature = ref(false)
const title = ref('Untitled video')
const overwriteStrength = ref(100)
const sourceFile = ref<File | null>(null)
const durationSec = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)
const lookChanged = computed(() =>
  Boolean(
    store.selected &&
    (store.selected.style !== style.value ||
      (isGrabBag.value &&
        ((store.selected.variantStyleIds ?? []).join(',') !==
          grabBagStyles.value.join(',') ||
          (store.selected.variantMode ?? 'cycle') !== grabBagMode.value)) ||
      store.selected.quality !== quality.value ||
      (store.selected.renderSpeed ?? 'standard') !== renderSpeed.value ||
      (store.selected.overwriteStrength ?? 100) !== overwriteStrength.value ||
      (store.selected.isPrivate ?? true) !== isPrivate.value ||
      (store.selected.isMature ?? false) !== isMature.value),
  ),
)
const fileDescription = computed(() =>
  sourceFile.value
    ? `${sourceFile.value.name} · ${(sourceFile.value.size / (1024 * 1024)).toFixed(1)} MiB`
    : '',
)
const canStage = computed(() =>
  Boolean(
    sourceFile.value &&
    sourceFile.value.size <= RESTYLE_MAX_BYTES &&
    durationSec.value >= 1 &&
    durationSec.value <= RESTYLE_MAX_DURATION_SEC &&
    grabBagReady.value,
  ),
)

const needsArtJobLink = computed(() =>
  Boolean(
    store.selected &&
    (store.selected.full
      ? !store.selected.full.artJobId
      : store.selected.pilot && !store.selected.pilot.artJobId),
  ),
)

const canQueueFull = computed(() =>
  Boolean(
    store.selected &&
    !store.selected.full &&
    ['STAGED', 'PILOT_BLOCKED', 'PILOT_FAILED', 'REVIEW'].includes(
      store.selected.status,
    ),
  ),
)

const selectedPreview = computed(() =>
  isGrabBag.value
    ? undefined
    : store.stylePreviews[style.value as RestyleStyleId],
)
const previewActive = computed(() =>
  ['QUEUED', 'RENDERING'].includes(selectedPreview.value?.state ?? ''),
)
const missingPreviewCount = computed(
  () =>
    RESTYLE_STYLES.filter((look) => !store.stylePreviews[look.id]?.imageUrl)
      .length,
)

function previewStateLabel(state?: RestylePreviewState): string {
  return {
    MISSING: 'No preview yet',
    QUEUED: 'Preview queued',
    RENDERING: 'Preview rendering',
    READY: 'Preview ready',
    FAILED: 'Preview failed',
  }[state ?? 'MISSING']
}

function previewBadge(value: RestyleStyleId): string {
  const preview = store.stylePreviews[value]
  if (!preview || preview.state === 'MISSING') return ''
  if (preview.state === 'QUEUED') return 'Queued'
  if (preview.state === 'RENDERING') return 'Rendering'
  if (preview.state === 'FAILED') return 'Failed'
  return preview.stale ? 'Prompt changed' : ''
}

function labelFor(value: RestyleLookId): string {
  return restyleLookLabel(value)
}

// Variant titles already carry their look (“Coat Dance · Grab bag”), so the
// picker only appends the look when the title does not name it.
function projectOptionLabel(job: VideoRestyleJob): string {
  const look = labelFor(job.style)
  return job.title.includes(look) ? job.title : `${job.title} · ${look}`
}

function isRendering(job: VideoRestyleJob): boolean {
  return job.status === 'PILOT_RUNNING' || job.status === 'FULL_RUNNING'
}

async function deleteSelected() {
  const job = store.selected
  if (!job || isRendering(job)) return
  const doomed = [
    'the private source video',
    job.pilot ? 'its pilots' : '',
    job.full ? 'its full film' : '',
  ]
    .filter(Boolean)
    .join(', ')
  if (
    !window.confirm(
      `Delete “${projectOptionLabel(job)}”? This removes ${doomed}. It cannot be undone. Other looks made from this video keep their own copy.`,
    )
  )
    return
  if (await store.deleteProject(job.id)) {
    if (store.selected) selectJob(store.selected)
    else {
      playing.value = ''
      stageView.value = 'looks'
    }
  }
}

function rootTitle(job: VideoRestyleJob): string {
  const autoSuffix = ` · ${labelFor(job.style)}`
  return job.title.endsWith(autoSuffix)
    ? job.title.slice(0, -autoSuffix.length)
    : job.title
}

function setStageView(view: 'looks' | 'video') {
  if (view === 'looks') videoEl.value?.pause()
  stageView.value = view
}

function toneFor(value: RestyleStyleId): string {
  return RESTYLE_STYLES.find((entry) => entry.id === value)?.tone || ''
}

function lookActive(value: RestyleStyleId): boolean {
  return isGrabBag.value
    ? grabBagStyles.value.includes(value)
    : style.value === value
}

function pickLook(value: RestyleStyleId) {
  if (!isGrabBag.value) {
    style.value = value
    return
  }
  if (grabBagStyles.value.includes(value)) {
    grabBagStyles.value = grabBagStyles.value.filter((id) => id !== value)
  } else if (grabBagStyles.value.length < RESTYLE_GRAB_BAG_MAX_STYLES) {
    grabBagStyles.value = [...grabBagStyles.value, value]
  }
}

function toggleGrabBag() {
  style.value = isGrabBag.value
    ? (grabBagStyles.value[0] ?? 'illustrious')
    : RESTYLE_GRAB_BAG.id
}

function setGrabBagMode(mode: RestyleVariantMode) {
  if (mode === 'shuffle_locked' && grabBagMode.value !== mode) {
    grabBagStyles.value = shuffleRestyleStyles(grabBagStyles.value)
  }
  grabBagMode.value = mode
}

function addAllToGrabBag() {
  const added = RESTYLE_STYLES.map((look) => look.id).filter(
    (id) => !grabBagStyles.value.includes(id),
  )
  const next = [...grabBagStyles.value, ...added]
  grabBagStyles.value =
    grabBagMode.value === 'shuffle_locked' ? shuffleRestyleStyles(next) : next
}

function reshuffleGrabBag() {
  grabBagStyles.value = shuffleRestyleStyles(grabBagStyles.value)
}

function queueSelectedPreview() {
  if (isGrabBag.value) return
  store.queueStylePreviews({
    styleIds: [style.value as RestyleStyleId],
    force: Boolean(selectedPreview.value?.imageUrl),
  })
}

function statusLabel(value: VideoRestyleJob['status']): string {
  return {
    STAGED: 'Ready',
    PROCESSING: 'Processing',
    REVIEW: 'Pilot ready',
    DONE: 'Done',
    FAILED: 'Failed',
    PILOT_QUEUED: 'Queued',
    PILOT_RUNNING: 'Rendering',
    PILOT_FAILED: 'Pilot failed',
    PILOT_BLOCKED: 'Blocked',
    FULL_QUEUED: 'Full queued',
    FULL_RUNNING: 'Rendering film',
    FULL_FAILED: 'Full failed',
  }[value]
}

function selectJob(job: VideoRestyleJob) {
  store.selectedId = job.id
  store.clearPreview()
  playing.value = ''
  stageView.value = 'looks'
  sourceFile.value = null
  durationSec.value = job.sourceDurationSec
  title.value = job.title
  style.value = job.style
  if (job.variantStyleIds?.length) {
    grabBagStyles.value = [...job.variantStyleIds]
    grabBagMode.value = job.variantMode ?? 'cycle'
  }
  quality.value = job.quality
  renderSpeed.value = job.renderSpeed ?? 'standard'
  overwriteStrength.value = job.overwriteStrength ?? 100
  isPrivate.value = job.isPrivate ?? true
  isMature.value = job.isMature ?? false
  if (fileInput.value) fileInput.value.value = ''
}

function selectJobFromPicker(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const job = store.jobs.find((item) => item.id === id)
  if (job) selectJob(job)
}

async function play(kind: typeof playing.value, loaded: Promise<boolean>) {
  if (!(await loaded)) return
  playing.value = kind
  stageView.value = 'video'
  await nextTick()
  void videoEl.value?.play().catch(() => {})
}

async function showSource() {
  if (!store.selected) return
  await play('source', store.loadSourcePreview(store.selected.id))
}

async function showFull() {
  if (!store.selected) return
  await play('full', store.loadPilotPreview(store.selected.id, false, true))
}

async function showPilot(previous = false) {
  if (!store.selected) return
  await play(
    previous ? 'previous' : 'pilot',
    store.loadPilotPreview(store.selected.id, previous),
  )
}

async function saveLookAndRender() {
  if (!store.selected || sourceFile.value) return
  const id = store.selected.id
  if (
    await store.saveSettings(
      id,
      style.value,
      quality.value,
      isPrivate.value,
      isMature.value,
      grabBagChoice.value,
      renderSpeed.value,
      overwriteStrength.value,
    )
  ) {
    await store.queueFull(id)
  }
}

async function saveProjectTitle() {
  if (!store.selected || sourceFile.value || !title.value.trim()) return
  await store.renameProject(store.selected.id, title.value.trim())
}

async function renderAsNewFilm() {
  if (!store.selected || sourceFile.value) return
  const sourceId = store.selected.id
  const name = `${rootTitle(store.selected)} · ${labelFor(style.value)}`
  if (
    await store.createVariant({
      id: sourceId,
      title: name,
      style: style.value,
      quality: quality.value,
      renderSpeed: renderSpeed.value,
      overwriteStrength: overwriteStrength.value,
      isPrivate: isPrivate.value,
      isMature: isMature.value,
      ...grabBagChoice.value,
    })
  ) {
    if (store.selected) selectJob(store.selected)
    if (store.selectedId) await store.queueFull(store.selectedId)
  }
}

async function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  sourceFile.value = file
  durationSec.value = 0
  if (!file) return cancelUpload()
  title.value =
    file.name
      .replace(RESTYLE_SOURCE_EXTENSION, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Untitled video'
  // Showing the upload mounts the player, which reads its duration.
  playing.value = 'upload'
  stageView.value = 'video'
  store.error =
    file.size > RESTYLE_MAX_BYTES
      ? 'This video exceeds the 128 MiB upload limit.'
      : ''
  // GIF and MPEG have no <video> metadata, so their length is read from the file.
  const parsed = await store.preview(file)
  if (parsed !== null && sourceFile.value === file) applySourceDuration(parsed)
}

function cancelUpload() {
  sourceFile.value = null
  durationSec.value = store.selected?.sourceDurationSec ?? 0
  if (fileInput.value) fileInput.value.value = ''
  store.clearPreview()
  playing.value = ''
  stageView.value = 'looks'
  if (store.selected) title.value = store.selected.title
}

function readVideoMetadata(event: Event) {
  const video = event.target as HTMLVideoElement
  // Watching a 24-second generated pilot must not replace the 5:32
  // metadata of its full source in the project setup.
  if (!sourceFile.value) return
  applySourceDuration(Number.isFinite(video.duration) ? video.duration : 0)
}

function applySourceDuration(seconds: number) {
  durationSec.value = seconds
  if (seconds > RESTYLE_MAX_DURATION_SEC) {
    store.error = 'This studio currently supports videos up to 15 minutes.'
  } else if (seconds < 1) {
    store.error = seconds
      ? 'This clip is shorter than one second.'
      : 'Could not read how long this file is.'
  }
}

async function stage() {
  if (!sourceFile.value || !canStage.value) return
  if (
    await store.stage({
      file: sourceFile.value,
      title: title.value,
      durationSec: durationSec.value,
      style: style.value,
      quality: quality.value,
      renderSpeed: renderSpeed.value,
      overwriteStrength: overwriteStrength.value,
      isPrivate: isPrivate.value,
      isMature: isMature.value,
      ...grabBagChoice.value,
    })
  ) {
    sourceFile.value = null
    store.clearPreview()
    playing.value = ''
    stageView.value = 'looks'
    durationSec.value = store.selected?.sourceDurationSec ?? 0
    if (fileInput.value) fileInput.value.value = ''
    if (store.selectedId) await store.queueFull(store.selectedId)
  }
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) {
    await Promise.all([store.refresh(), store.loadStylePreviews()])
    if (store.selected) selectJob(store.selected)
  }
  ready.value = true
  if (userStore.isAdmin) {
    refreshTimer = setInterval(() => {
      if (
        Object.values(store.stylePreviews).some((preview) =>
          ['QUEUED', 'RENDERING'].includes(preview?.state ?? ''),
        )
      ) {
        void store.loadStylePreviews()
      }
      if (
        store.jobs.some((job) =>
          [
            'PILOT_QUEUED',
            'PILOT_RUNNING',
            'FULL_QUEUED',
            'FULL_RUNNING',
          ].includes(job.status),
        )
      ) {
        void store.refresh()
      }
    }, 15_000)
  }
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  store.clearPreview()
})
</script>

<style scoped>
.cd-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.cd-bar::-webkit-scrollbar {
  display: none;
}
@container (max-width: 640px) {
  .cd-bar-label {
    display: none;
  }
}
</style>

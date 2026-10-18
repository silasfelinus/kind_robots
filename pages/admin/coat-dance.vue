<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div
      class="kr-container-wide flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-4"
    >
      <header
        class="flex min-w-0 flex-wrap items-center justify-between gap-1 rounded-2xl border border-base-300 bg-base-100 p-2 text-base-content shadow-sm sm:gap-2"
      >
        <nav
          class="flex items-center gap-1 rounded-xl border border-base-300 bg-base-200 p-1"
          aria-label="Video generation mode"
        >
          <NuxtLink to="/play/video-generator" class="kr-btn-xs btn-ghost"
            >Image to video</NuxtLink
          >
          <span class="kr-btn-xs btn-primary" aria-current="page"
            >Full video restyle</span
          >
        </nav>
        <div class="hidden items-center gap-2 text-xs sm:flex">
          <span class="kr-badge-outline bg-base-200 text-base-content"
            >Private studio</span
          >
          <span class="kr-badge-outline bg-base-200 text-base-content"
            >Source motion retained</span
          >
        </div>
      </header>

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
          class="kr-note kr-note-error flex items-center justify-between gap-2 border border-error/30 bg-base-100 p-2 text-sm text-base-content shadow-sm"
        >
          {{ store.error }}
          <button type="button" class="kr-btn-xs" @click="store.error = ''">
            Dismiss
          </button>
        </div>
        <div
          v-if="store.notice"
          role="status"
          class="rounded-xl border border-base-300 bg-base-100 p-2 text-xs text-base-content shadow-sm"
        >
          {{ store.notice }}
        </div>
        <div
          v-if="store.registrationError"
          role="alert"
          class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-error/40 bg-base-100 p-2 text-sm text-base-content shadow-sm"
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
        <div
          class="flex min-w-0 shrink-0 items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-2 py-1.5 text-xs"
        >
          <label for="restyle-current-project" class="shrink-0 font-semibold"
            >Project</label
          >
          <select
            id="restyle-current-project"
            class="select select-bordered select-sm min-w-0 flex-1"
            aria-label="Current video restyle project"
            :value="store.selectedId ?? ''"
            @change="selectJobFromPicker"
          >
            <option value="" disabled>
              {{
                store.jobs.length ? 'Choose a project' : 'No saved videos yet'
              }}
            </option>
            <option v-for="job in store.jobs" :key="job.id" :value="job.id">
              {{ job.title }} · {{ labelFor(job.style) }} ·
              {{ statusLabel(job.status) }}
            </option>
          </select>
          <button
            type="button"
            class="kr-btn-xs btn-outline shrink-0"
            @click="activePanel = 'library'"
          >
            {{ store.selected ? 'View video' : 'Upload video' }}
          </button>
        </div>
        <div
          v-if="
            store.selected &&
            (store.selected.full
              ? !store.selected.full.artJobId
              : store.selected.pilot && !store.selected.pilot.artJobId)
          "
          class="flex shrink-0 items-center justify-between gap-2 rounded-lg border border-warning/30 bg-base-100 p-2 text-xs"
          role="status"
        >
          <span>Saved project needs an ArtJob queue link.</span>
          <button
            type="button"
            class="kr-btn-outline-xs"
            :disabled="store.syncing"
            @click="store.refresh()"
          >
            {{ store.syncing ? 'Registering…' : 'Register in ArtJob' }}
          </button>
        </div>
        <nav
          class="grid grid-cols-2 gap-1 rounded-xl bg-base-200 p-1"
          aria-label="Studio views"
        >
          <button
            v-for="panel in panels"
            :key="panel.value"
            type="button"
            class="kr-btn-xs"
            :class="activePanel === panel.value ? 'btn-primary' : 'btn-ghost'"
            @click="activePanel = panel.value"
          >
            {{ panel.label }}
          </button>
        </nav>
        <div
          class="kr-panes min-h-0 flex-1 gap-2 overflow-hidden sm:gap-3"
          :class="
            activePanel === 'studio'
              ? 'lg:grid-cols-1'
              : 'lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.75fr)]'
          "
        >
          <section
            :class="activePanel === 'library' ? 'flex' : 'hidden'"
            class="kr-panel min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3"
            aria-label="Source performance"
          >
            <div class="flex items-center justify-between">
              <span class="kr-text-semibold-sm">01 / Source performance</span>
              <span class="kr-badge-ghost-sm">{{
                durationSec ? formatRestyleTime(durationSec) : 'Ready for video'
              }}</span>
            </div>
            <div
              class="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-2xl border border-base-300 bg-neutral text-neutral-content"
            >
              <video
                v-if="store.previewUrl"
                :src="store.previewUrl"
                controls
                playsinline
                preload="metadata"
                class="max-h-full w-full object-contain"
                aria-label="Video playback preview"
                @loadedmetadata="readVideoMetadata"
              />
              <template v-else>
                <img
                  src="/images/channels/plan/video-generator.webp"
                  alt="Illustrated video creation stage"
                  class="absolute inset-0 h-full w-full object-cover opacity-50"
                />
                <div
                  class="absolute inset-0 bg-gradient-to-t from-neutral via-neutral/35 to-transparent"
                />
                <div class="relative max-w-xs space-y-2 p-4 text-center">
                  <icon name="kind-icon:video" class="mx-auto h-10 w-10" />
                  <p class="text-xl font-black tracking-tight">
                    Keep the dance. Change the world.
                  </p>
                  <p class="text-sm opacity-80">
                    The performance stays in frame. The coat gets its own
                    animated life.
                  </p>
                  <div
                    v-if="store.selected && !sourceFile"
                    class="space-y-2 pt-3"
                  >
                    <p class="text-sm font-bold">
                      {{ store.selected.title }} ·
                      {{ formatRestyleTime(store.selected.sourceDurationSec) }}
                    </p>
                    <button
                      type="button"
                      class="kr-btn kr-btn-primary"
                      :disabled="store.sourceBusy"
                      @click="store.loadSourcePreview(store.selected.id)"
                    >
                      <span v-if="store.sourceBusy" class="kr-spinner-xs" />
                      {{
                        store.sourceBusy
                          ? 'Loading private video…'
                          : 'Preview saved source'
                      }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
            <div
              v-if="store.selected && !sourceFile"
              class="flex shrink-0 flex-wrap gap-1"
              aria-label="Available video versions"
            >
              <button
                type="button"
                class="kr-btn-xs btn-outline"
                :disabled="store.sourceBusy"
                @click="store.loadSourcePreview(store.selected.id)"
              >
                Original source
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
                Animated pilot
              </button>
              <button
                v-if="store.selected.pilot?.previousRevision"
                type="button"
                class="kr-btn-xs btn-outline"
                :disabled="store.sourceBusy"
                @click="showPilot(true)"
              >
                Previous pilot
              </button>
              <button
                v-if="store.selected.status === 'DONE' && store.selected.full"
                type="button"
                class="kr-btn-xs btn-primary"
                :disabled="store.sourceBusy"
                @click="showFull"
              >
                Full film
              </button>
            </div>
            <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label class="min-w-0">
                <span class="kr-text-faded-xs block">
                  {{
                    store.selected && !sourceFile
                      ? 'Saved project'
                      : 'New project title'
                  }}
                </span>
                <input
                  v-model="title"
                  type="text"
                  class="kr-input w-full"
                  :readonly="Boolean(store.selected && !sourceFile)"
                  maxlength="120"
                  placeholder="Coat Dance / original performance"
                  aria-label="Project title"
                />
              </label>
              <label class="flex cursor-pointer flex-col justify-end">
                <span class="kr-text-faded-xs block">Source video</span>
                <span class="kr-btn btn-outline w-full sm:w-auto">{{
                  sourceFile ? 'Replace file' : 'Choose MP4 / MOV / WebM'
                }}</span>
                <input
                  ref="fileInput"
                  type="file"
                  class="sr-only"
                  accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                  @change="chooseFile"
                />
              </label>
            </div>
            <div
              class="flex flex-wrap items-center justify-between gap-2 text-xs opacity-80"
            >
              <span>{{
                sourceFile
                  ? fileDescription
                  : store.selected
                    ? `${store.selected.sourceFile} · ${(store.selected.sourceBytes / (1024 * 1024)).toFixed(1)} MiB saved`
                    : 'Up to 128 MiB · 15 minutes'
              }}</span>
              <span>Original audio & camera preserved</span>
            </div>
            <div
              v-if="store.selected && !sourceFile"
              class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 p-2 text-xs"
            >
              <span
                >Saved privately · {{ store.selected.segments.length }} motion
                windows</span
              >
              <span class="font-semibold">{{ store.selected.status }}</span>
            </div>
            <button
              v-else
              type="button"
              class="kr-btn kr-btn-primary w-full"
              :disabled="!canStage || store.busy"
              @click="stage"
            >
              <span v-if="store.busy" class="kr-spinner-xs" />
              {{
                store.busy ? 'Uploading source…' : 'Upload & render full film'
              }}
            </button>
          </section>

          <section
            :class="activePanel === 'studio' ? 'flex' : 'hidden'"
            class="kr-panel min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3"
            aria-label="Animation style presets"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="kr-text-semibold-sm">02 / Animation look</span>
              <div class="flex items-center gap-1">
                <span class="kr-badge-outline"
                  >{{ RESTYLE_STYLES.length }} presets</span
                >
                <button
                  v-if="missingPreviewCount"
                  type="button"
                  class="kr-btn-xs btn-outline"
                  title="Generate all missing previews"
                  :disabled="store.stylePreviewBusy"
                  @click="store.queueStylePreviews({ missing: true })"
                >
                  Generate missing ({{ missingPreviewCount }})
                </button>
              </div>
            </div>
            <div class="kr-pane-scroll min-h-0 flex-1">
              <div
                class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
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
                  <span class="block px-1.5 py-1">
                    <span class="block truncate text-[11px] font-bold">{{
                      RESTYLE_GRAB_BAG.label
                    }}</span>
                    <span class="block truncate text-[10px] opacity-65">{{
                      RESTYLE_GRAB_BAG.note
                    }}</span>
                  </span>
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
                      class="absolute inset-0 grid place-items-center text-5xl font-light text-base-content/80"
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
                  <span class="block px-1.5 py-1">
                    <span class="block truncate text-[11px] font-bold">{{
                      look.label
                    }}</span>
                    <span class="block truncate text-[10px] opacity-65">{{
                      look.note
                    }}</span>
                  </span>
                </button>
              </div>
            </div>
            <div
              v-if="isGrabBag"
              class="shrink-0 space-y-1.5 border-t border-base-300 pt-2 text-xs"
              aria-label="Grab bag rotation"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="min-w-0 flex-1 truncate">
                  <strong>Grab bag</strong> · {{ grabBagStyles.length }}/{{
                    RESTYLE_GRAB_BAG_MAX_STYLES
                  }}
                  looks · tap looks to add or remove · preview collage shows the
                  first {{ collageStyles.length }}
                </span>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-if="missingGrabBagPreviews.length"
                    type="button"
                    class="kr-btn-xs btn-outline"
                    :disabled="store.stylePreviewBusy"
                    @click="
                      store.queueStylePreviews({
                        styleIds: missingGrabBagPreviews,
                      })
                    "
                  >
                    Generate missing ({{ missingGrabBagPreviews.length }})
                  </button>
                  <button
                    type="button"
                    class="kr-btn-xs"
                    :class="
                      grabBagMode === 'cycle' ? 'btn-primary' : 'btn-outline'
                    "
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
                    class="kr-btn-xs btn-outline"
                    @click="addAllToGrabBag"
                  >
                    Add all {{ RESTYLE_STYLES.length }}
                  </button>
                </div>
              </div>
              <ol
                class="kr-pane-scroll flex max-h-16 flex-wrap gap-1 sm:max-h-20"
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
              <p v-if="!grabBagReady" class="text-warning">
                Pick at least {{ RESTYLE_GRAB_BAG_MIN_STYLES }} looks to rotate.
              </p>
            </div>
            <div
              v-if="!isGrabBag"
              class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-2 text-xs"
            >
              <span class="min-w-0 flex-1 truncate">
                <strong>{{ labelFor(style) }}</strong>
                · {{ previewStateLabel(selectedPreview?.state) }}
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
              </span>
              <button
                type="button"
                class="kr-btn-xs btn-outline"
                :disabled="store.stylePreviewBusy || previewActive"
                @click="queueSelectedPreview"
              >
                {{
                  selectedPreview?.imageUrl
                    ? 'Regenerate preview'
                    : 'Generate preview'
                }}
              </button>
            </div>
            <p v-if="store.stylePreviewError" class="text-xs text-error">
              {{ store.stylePreviewError }}
            </p>
            <details
              class="shrink-0 rounded-xl border border-base-300 bg-base-100 px-2 py-1 text-xs"
            >
              <summary class="cursor-pointer font-semibold">
                Render settings · {{ quality }} ·
                {{ isPrivate ? 'Private' : 'Release candidate'
                }}{{ isMature ? ' · Mature' : '' }}
              </summary>
              <div class="space-y-2 pt-2">
                <div
                  class="flex items-center justify-between gap-2 border-t border-base-300 pt-2"
                >
                  <span class="kr-text-semibold-sm">Output quality</span>
                  <div class="flex gap-1">
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
                  </div>
                </div>
                <p class="kr-text-faded-xs">
                  Looks are prompt-guided Wan VACE treatments. 1080p is upscaled
                  after assembly.
                </p>
                <div
                  class="space-y-2 rounded-xl border border-base-300 bg-base-200/70 p-2 text-xs"
                >
                  <label class="flex cursor-pointer items-center gap-2">
                    <input
                      v-model="isPrivate"
                      type="checkbox"
                      class="checkbox checkbox-sm"
                    />
                    <span
                      ><strong>Keep private</strong> · saved for a later release
                      choice</span
                    >
                  </label>
                  <label class="flex cursor-pointer items-center gap-2">
                    <input
                      v-model="isMature"
                      type="checkbox"
                      class="checkbox checkbox-sm"
                    />
                    <span
                      ><strong>Mature content</strong> · mark this video
                      appropriately</span
                    >
                  </label>
                  <p class="text-base-content/70">
                    All source videos and pilots stay access-controlled, even
                    when marked as candidates for future publication.
                  </p>
                </div>
              </div>
            </details>
            <div
              class="shrink-0 space-y-2 rounded-xl border border-primary/30 bg-base-200/60 p-2"
              aria-label="Selected look and next render"
            >
              <div
                class="flex flex-wrap items-baseline justify-between gap-x-2 text-xs"
              >
                <span>
                  <strong>Selected look: {{ labelFor(style) }}</strong>
                  <span v-if="sourceFile" class="opacity-70">
                    · New upload</span
                  >
                  <span v-else-if="store.selected" class="opacity-70">
                    · {{ store.selected.title }}</span
                  >
                </span>
                <span v-if="store.selected" class="opacity-70">{{
                  statusLabel(store.selected.status)
                }}</span>
              </div>
              <p
                v-if="isGrabBag"
                class="hidden text-xs text-base-content/80 sm:block"
              >
                <strong>Sequence:</strong> {{ grabBagSequenceLabel }}<br />
                <strong>Behavior:</strong> new look every motion window (~{{
                  windowSeconds
                }}s),
                {{
                  grabBagMode === 'cycle'
                    ? 'looping in listed order'
                    : 'shuffled once and locked'
                }}. Retries and resumes keep this saved sequence.
              </p>
              <p v-if="sourceFile" class="text-xs text-base-content/80">
                New source selected. Uploading renders the full film in
                {{ labelFor(style) }}.
              </p>
              <p
                v-else-if="store.selected && lookChanged"
                class="text-xs text-base-content/80"
                role="status"
              >
                {{
                  store.selected.status === 'STAGED'
                    ? 'Unsaved choices. Saving renders the full film in this look.'
                    : `New version selected. Your existing ${labelFor(store.selected.style)} project stays unchanged until you create another project.`
                }}
              </p>
              <p
                v-else-if="store.selected"
                class="text-xs text-base-content/70"
              >
                Matches the saved {{ labelFor(store.selected.style) }} project.
                Render actions use this look.
              </p>
              <p v-else class="text-xs text-base-content/70">
                Upload a video in Library to create a project.
              </p>
              <div class="flex flex-wrap gap-2 [&>button]:min-w-[9rem]">
                <button
                  v-if="sourceFile"
                  type="button"
                  class="kr-btn kr-btn-primary flex-1"
                  :disabled="!canStage || store.busy"
                  @click="stage"
                >
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
                  class="kr-btn kr-btn-primary flex-1"
                  :disabled="store.busy || !grabBagReady"
                  @click="saveLookAndRender"
                >
                  {{
                    store.busy ? 'Queueing…' : 'Save look & render full film'
                  }}
                </button>
                <button
                  v-if="
                    store.selected &&
                    !sourceFile &&
                    store.selected.status !== 'STAGED' &&
                    lookChanged
                  "
                  type="button"
                  class="kr-btn kr-btn-primary flex-1"
                  :disabled="store.busy || !grabBagReady"
                  @click="renderAsNewFilm"
                >
                  {{
                    store.busy ? 'Queueing…' : 'Render this look as a new film'
                  }}
                </button>
                <button
                  v-if="
                    store.selected &&
                    !sourceFile &&
                    !lookChanged &&
                    canQueueFull
                  "
                  type="button"
                  class="kr-btn kr-btn-primary flex-1"
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
                    !lookChanged &&
                    store.selected.status === 'FULL_FAILED'
                  "
                  type="button"
                  class="kr-btn kr-btn-primary flex-1"
                  :disabled="store.busy"
                  @click="store.retryFull(store.selected.id)"
                >
                  {{
                    store.busy
                      ? 'Queueing…'
                      : 'Resume full film using saved windows'
                  }}
                </button>
                <button
                  v-if="
                    store.selected &&
                    (store.selected.status === 'REVIEW' ||
                      store.selected.status === 'DONE')
                  "
                  type="button"
                  class="kr-btn btn-outline flex-1"
                  @click="activePanel = 'library'"
                >
                  View results
                </button>
              </div>
            </div>
          </section>

          <section
            :class="activePanel === 'library' ? 'hidden lg:flex' : 'hidden'"
            class="kr-panel min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3"
            aria-label="Saved render projects"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="kr-text-semibold-sm">03 / Projects</span>
              <button
                type="button"
                class="kr-btn-outline-xs"
                :disabled="store.busy || store.syncing"
                @click="store.refresh()"
              >
                Refresh
              </button>
            </div>
            <div
              class="kr-pane-scroll min-h-0 max-h-[29vh] shrink-0 space-y-1 sm:max-h-[36vh] lg:max-h-[40%]"
            >
              <p
                v-if="!store.jobs.length"
                class="kr-text-faded-sm rounded-xl border border-dashed border-base-300 p-4"
              >
                Your staged films will appear here after upload and remain
                available when you return.
              </p>
              <button
                v-for="job in store.jobs"
                :key="job.id"
                type="button"
                class="w-full rounded-xl border p-2 text-left"
                :class="
                  store.selectedId === job.id
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 bg-base-100/60'
                "
                @click="selectJob(job)"
              >
                <span
                  class="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1"
                >
                  <strong class="min-w-0 flex-1 break-words text-sm">{{
                    job.title
                  }}</strong>
                  <span
                    class="shrink-0 rounded-md bg-base-200 px-1.5 py-0.5 text-[10px] font-semibold"
                  >
                    {{ statusLabel(job.status) }}
                  </span>
                </span>
                <span class="mt-1 block text-xs opacity-70"
                  >{{ formatRestyleTime(job.sourceDurationSec) }} ·
                  {{ labelFor(job.style) }}
                  <span v-if="job.isMature"> · Mature</span>
                  <span v-if="job.isPrivate === false">
                    · Publication candidate</span
                  >
                </span>
                <span class="mt-1 block text-[10px] opacity-60">{{
                  new Date(job.createdAt).toLocaleDateString()
                }}</span>
              </button>
            </div>
            <div
              v-if="store.selected"
              class="min-h-0 shrink-0 space-y-2 border-t border-base-300 pt-2 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <strong>{{ store.selected.title }}</strong>
                <span>{{ statusLabel(store.selected.status) }}</span>
              </div>
              <p class="text-base-content/70">
                {{ labelFor(store.selected.style) }} ·
                {{ store.selected.quality }} ·
                {{ formatRestyleTime(store.selected.sourceDurationSec) }}
              </p>
              <p
                v-if="store.selected.variantStyleIds?.length"
                class="text-base-content/70"
              >
                Sequence:
                {{ store.selected.variantStyleIds.map(labelFor).join(' → ') }}
              </p>
              <div
                v-if="savedSchedule.length"
                class="space-y-1"
                aria-label="Saved look per motion window"
              >
                <span class="text-base-content/70"
                  >{{
                    store.selected.full ? 'Full film' : 'Pilot'
                  }}
                  windows</span
                >
                <ol class="kr-pane-scroll flex max-h-20 flex-wrap gap-0.5">
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
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-base-300">
                <div
                  class="h-full bg-primary"
                  :style="{ width: store.selected.progress + '%' }"
                />
              </div>
              <p class="text-base-content/70">{{ store.selected.stage }}</p>
              <p
                v-if="store.selected.full || store.selected.pilot"
                class="text-base-content/70"
              >
                {{
                  store.selected.full?.completedSegments ??
                  store.selected.pilot?.completedSegments
                }}/{{
                  store.selected.full?.totalSegments ??
                  store.selected.pilot?.totalSegments
                }}
                completed windows · {{ Math.round(store.selected.progress) }}%
              </p>
              <NuxtLink
                v-if="
                  store.selected.full?.artJobId ||
                  store.selected.pilot?.artJobId
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
                  store.selected.full?.artJobId ||
                  store.selected.pilot?.artJobId
                }}
                in the queue</NuxtLink
              >
              <p v-if="store.selected.error" class="text-error" role="alert">
                {{ store.selected.error }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="store.selected.status === 'DONE' && store.selected.full"
                  type="button"
                  class="kr-btn kr-btn-primary flex-1"
                  :disabled="store.sourceBusy"
                  @click="showFull"
                >
                  Watch finished full film
                </button>
                <button
                  v-if="
                    store.selected.pilot &&
                    (store.selected.status === 'REVIEW' || store.selected.full)
                  "
                  type="button"
                  class="kr-btn btn-outline flex-1"
                  :disabled="store.sourceBusy"
                  @click="showPilot()"
                >
                  Watch animated pilot
                </button>
                <button
                  v-if="store.selected.pilot?.previousRevision"
                  type="button"
                  class="kr-btn btn-outline flex-1"
                  :disabled="store.sourceBusy"
                  @click="showPilot(true)"
                >
                  Watch previous pilot for comparison
                </button>
                <button
                  type="button"
                  class="kr-btn btn-outline flex-1"
                  @click="activePanel = 'studio'"
                >
                  Choose look / render
                </button>
              </div>
            </div>
            <details
              class="shrink-0 rounded-xl border border-base-300 bg-base-200/50 p-2 text-xs"
            >
              <summary class="cursor-pointer font-semibold">
                How rendering works
              </summary>
              <p class="mt-2 leading-relaxed text-base-content/70">
                KR Relay renders the whole film in one batch from your saved
                video, window by window, and resumes from saved windows after a
                failure. Each look has its own render project; no video is
                published from this studio.
              </p>
            </details>
          </section>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
  type RestyleStyleId,
  type RestyleVariantMode,
} from '@/utils/videoRestylePlan'

const userStore = useUserStore()
const store = useVideoRestyleStore()
const ready = ref(false)
const panels = [
  { value: 'studio', label: 'Studio' },
  { value: 'library', label: 'Library' },
] as const
const activePanel = ref<(typeof panels)[number]['value']>('studio')
const qualityOptions = ['720p', '1080p'] as const
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
const isPrivate = ref(true)
const isMature = ref(false)
const title = ref('Coat Dance')
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
  sourceFile.value = null
  durationSec.value = job.sourceDurationSec
  title.value = job.title
  style.value = job.style
  if (job.variantStyleIds?.length) {
    grabBagStyles.value = [...job.variantStyleIds]
    grabBagMode.value = job.variantMode ?? 'cycle'
  }
  quality.value = job.quality
  isPrivate.value = job.isPrivate ?? true
  isMature.value = job.isMature ?? false
  if (fileInput.value) fileInput.value.value = ''
}

function selectJobFromPicker(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const job = store.jobs.find((item) => item.id === id)
  if (job) selectJob(job)
}

async function showFull() {
  if (!store.selected) return
  if (await store.loadPilotPreview(store.selected.id, false, true)) {
    activePanel.value = 'library'
  }
}

async function showPilot(previous = false) {
  if (!store.selected) return
  if (await store.loadPilotPreview(store.selected.id, previous)) {
    activePanel.value = 'library'
  }
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
    )
  ) {
    await store.queueFull(id)
  }
}

async function renderAsNewFilm() {
  if (!store.selected || sourceFile.value) return
  const sourceId = store.selected.id
  const name = `${store.selected.title} · ${labelFor(style.value)}`
  if (
    await store.createVariant({
      id: sourceId,
      title: name,
      style: style.value,
      quality: quality.value,
      isPrivate: isPrivate.value,
      isMature: isMature.value,
      ...grabBagChoice.value,
    })
  ) {
    if (store.selected) selectJob(store.selected)
    activePanel.value = 'studio'
    if (store.selectedId) await store.queueFull(store.selectedId)
  }
}

function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  sourceFile.value = input.files?.[0] || null
  durationSec.value = 0
  if (sourceFile.value) {
    store.preview(sourceFile.value)
    store.error =
      sourceFile.value.size > RESTYLE_MAX_BYTES
        ? 'This video exceeds the 128 MiB upload limit.'
        : ''
  } else store.clearPreview()
}

function readVideoMetadata(event: Event) {
  const video = event.target as HTMLVideoElement
  // Watching a 24-second generated pilot must not replace the 5:32
  // metadata of its full source in the project setup.
  if (!sourceFile.value) return
  durationSec.value = Number.isFinite(video.duration) ? video.duration : 0
  if (durationSec.value > RESTYLE_MAX_DURATION_SEC) {
    store.error = 'This studio currently supports videos up to 15 minutes.'
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
      isPrivate: isPrivate.value,
      isMature: isMature.value,
      ...grabBagChoice.value,
    })
  ) {
    activePanel.value = 'studio'
    sourceFile.value = null
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

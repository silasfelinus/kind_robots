<template>
  <div class="kr-surface">
    <div class="@container kr-scroll kr-container-canvas space-y-3 p-2 sm:p-4">
      <header-page-bar>
        <div class="vg-bar" data-testid="video-generator-page-bar">
          <nav
            v-if="userStore.isAdmin"
            class="flex shrink-0 items-center gap-1 rounded-xl border border-base-300 bg-base-200/70 p-1"
            aria-label="Video generation mode"
          >
            <span class="kr-btn-xs btn-primary" aria-current="page"
              >Image to video</span
            >
            <NuxtLink to="/admin/coat-dance" class="kr-btn-xs btn-ghost"
              >Full video restyle</NuxtLink
            >
          </nav>
          <nav class="vg-bar-views" aria-label="Video generator views">
            <button
              type="button"
              class="btn btn-sm rounded-xl"
              :class="activePanel === 'create' ? 'btn-accent' : 'btn-ghost'"
              :aria-pressed="activePanel === 'create'"
              @click="selectPanel('create')"
            >
              <icon name="kind-icon:plus" class="kr-icon-4" />
              Create clip
            </button>
            <button
              type="button"
              class="btn btn-sm rounded-xl"
              :class="activePanel === 'jobs' ? 'btn-accent' : 'btn-ghost'"
              :aria-pressed="activePanel === 'jobs'"
              @click="openJobs"
            >
              <icon name="kind-icon:video" class="kr-icon-4" />
              My clips
              <span
                v-if="videoStore.history.totalCount"
                class="badge badge-ghost badge-sm"
              >
                {{ videoStore.history.totalCount }}
              </span>
            </button>
            <button
              type="button"
              class="btn btn-sm rounded-xl"
              :class="activePanel === 'music' ? 'btn-accent' : 'btn-ghost'"
              :aria-pressed="activePanel === 'music'"
              @click="selectPanel('music')"
            >
              <icon name="kind-icon:music" class="kr-icon-4" />
              Music videos
            </button>
            <span
              v-if="videoStore.hasActiveJobs"
              class="kr-badge-accent-sm"
              role="status"
            >
              Rendering in progress
            </span>
          </nav>
          <span class="vg-bar-engine kr-badge-ghost-sm">
            {{
              activePanel === 'music'
                ? 'Music video studio'
                : activeEngine.label +
                  ' · ' +
                  (selectedPreset?.label || 'Custom')
            }}
          </span>
        </div>
      </header-page-bar>

      <div
        v-if="!isLoggedIn && activePanel !== 'music'"
        class="alert alert-warning text-sm"
        role="alert"
      >
        You need to be signed in to queue a clip — generation is billed to your
        account's mana.
      </div>

      <MusicVideoStudio v-if="activePanel === 'music'" />
      <div v-show="activePanel === 'create'" class="space-y-4">
        <section class="kr-panel-flat p-3">
          <div class="grid items-start gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
            <div class="space-y-2">
              <label class="kr-text-semibold-sm">Engine</label>
              <div class="flex gap-2">
                <button
                  v-for="opt in engines"
                  :key="opt.value"
                  type="button"
                  class="kr-btn-plain"
                  :class="engine === opt.value ? 'btn-accent' : 'btn-outline'"
                  @click="selectEngine(opt.value)"
                >
                  {{ opt.label }}
                </button>
              </div>
              <p class="kr-text-faded-xs max-w-72">{{ activeEngine.hint }}</p>
            </div>

            <div class="min-w-0 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <label class="kr-text-semibold-sm">Preset</label>
                <span
                  v-if="videoPresetId === defaultPreset.id"
                  class="kr-badge-accent-sm"
                >
                  Studio default
                </span>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-sm h-auto min-h-0"
                  :class="videoPresetId === '' ? 'btn-accent' : 'btn-outline'"
                  @click="selectVideoPreset('')"
                >
                  Custom
                </button>

                <button
                  v-for="preset in availableVideoPresets"
                  :key="preset.id"
                  type="button"
                  class="btn btn-sm h-auto min-h-0"
                  :class="
                    videoPresetId === preset.id ? 'btn-accent' : 'btn-outline'
                  "
                  @click="selectVideoPreset(preset.id)"
                >
                  {{ preset.label }}
                  <span
                    v-if="preset.id === defaultPreset.id"
                    class="text-[10px] opacity-65"
                  >
                    default
                  </span>
                </button>
              </div>

              <p class="kr-text-faded-xs line-clamp-2">
                {{
                  selectedPreset?.description ||
                  'Keep the current values and tune them manually.'
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="grid min-w-0 gap-3 @4xl:grid-cols-2">
          <div class="kr-panel-flat space-y-2 p-3">
            <div class="flex items-center justify-between">
              <label class="font-semibold">
                First image
                <span
                  v-if="engine !== 'wan' || selectedWanMode !== 'ti2v'"
                  class="text-error"
                  >*</span
                >
                <span v-else class="kr-text-faded-xs"
                  >(optional for WAN 5B)</span
                >
              </label>
              <div class="flex flex-wrap gap-1">
                <button
                  type="button"
                  class="kr-btn-outline-xs"
                  :aria-expanded="recentArtOpen"
                  @click="toggleRecentArt"
                >
                  Recent art
                </button>
                <button
                  type="button"
                  class="kr-btn-outline-xs"
                  @click="useLogoAsFirst"
                >
                  Use logo
                </button>
              </div>
            </div>
            <div v-if="recentArtOpen" class="space-y-2">
              <div
                v-if="userStore.showMature"
                class="flex flex-wrap gap-1"
                role="group"
                aria-label="Recent image maturity"
              >
                <button
                  v-for="option in recentArtFilters"
                  :key="option.value"
                  type="button"
                  class="btn btn-xs"
                  :class="
                    recentArtFilter === option.value
                      ? 'btn-accent'
                      : 'btn-outline'
                  "
                  :aria-pressed="recentArtFilter === option.value"
                  @click="recentArtFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
              <p v-else class="kr-text-faded-xs">
                Show mature is off in account settings. Only SFW art is
                displayed.
              </p>
              <p v-if="videoStore.recentArt.loading" class="text-xs opacity-60">
                Loading your recent art…
              </p>
              <p
                v-else-if="!visibleRecentArt.length"
                class="text-xs opacity-60"
              >
                No recent images match this filter.
              </p>
              <div
                v-else
                class="grid max-h-[min(45vh,30rem)] grid-cols-[repeat(auto-fill,minmax(min(100%,7rem),1fr))] gap-2 overflow-y-auto overscroll-contain rounded-xl p-1"
              >
                <button
                  v-for="item in visibleRecentArt"
                  :key="item.artImageId"
                  type="button"
                  class="relative aspect-square overflow-hidden rounded-xl border-2 bg-base-200"
                  :class="
                    firstImageArtId === item.artImageId
                      ? 'border-primary'
                      : 'border-transparent hover:border-base-300'
                  "
                  :title="item.promptString || `Art image ${item.artImageId}`"
                  :disabled="videoStore.recentArt.loadingFrameId !== null"
                  @click="useArtImageAsFirst(item.artImageId)"
                >
                  <img
                    :src="recentArtThumb(item)"
                    :alt="item.promptString || `Art image ${item.artImageId}`"
                    class="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span
                    v-if="item.isMature"
                    class="kr-badge-xs badge-warning absolute left-1 top-1"
                  >
                    18+
                  </span>
                  <span
                    v-if="
                      videoStore.recentArt.loadingFrameId === item.artImageId
                    "
                    class="absolute inset-0 flex items-center justify-center bg-base-100/60"
                  >
                    <span class="kr-spinner-xs" />
                  </span>
                </button>
              </div>
              <p v-if="videoStore.recentArt.error" class="text-xs text-error">
                {{ videoStore.recentArt.error }}
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              class="file-input file-input-bordered file-input-sm w-full"
              @change="(e) => onFileChange(e, 'first')"
            />
            <div
              v-if="firstImage && canShowDraftImages"
              class="relative flex aspect-video min-h-44 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-inner"
            >
              <img
                :src="firstImage"
                class="max-h-full max-w-full object-contain"
                alt="First video frame"
              />
              <button
                type="button"
                class="btn btn-circle btn-error btn-xs absolute top-1 right-1"
                title="Clear"
                @click="clearFirstImage"
              >
                ✕
              </button>
            </div>
            <p v-else-if="firstImage" class="kr-text-faded-xs">
              Mature preview hidden by your account setting.
              <button type="button" class="link" @click="clearFirstImage">
                Clear image
              </button>
            </p>
            <p v-else class="kr-text-faded-xs">
              {{
                engine === 'wan' && selectedWanMode === 'ti2v'
                  ? 'Optional — leave blank to create from your prompt.'
                  : 'Select a first image, or switch to WAN 5B for prompt-only video.'
              }}
            </p>
          </div>

          <div class="kr-panel-flat space-y-2 p-3">
            <label class="font-semibold">
              End image <span class="opacity-50">(optional)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              class="file-input file-input-bordered file-input-sm w-full"
              @change="(e) => onFileChange(e, 'second')"
            />
            <div
              v-if="secondImage && canShowDraftImages"
              class="relative flex aspect-video min-h-44 items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow-inner"
            >
              <img
                :src="secondImage"
                class="max-h-full max-w-full object-contain"
                alt="Last video frame"
              />
              <button
                type="button"
                class="btn btn-circle btn-error btn-xs absolute top-1 right-1"
                title="Clear"
                @click="secondImage = ''"
              >
                ✕
              </button>
            </div>
            <p v-else-if="secondImage" class="kr-text-faded-xs">
              Mature preview hidden by your account setting.
              <button type="button" class="link" @click="secondImage = ''">
                Clear image
              </button>
            </p>
            <p v-else class="kr-text-faded-xs">
              If set, the clip morphs from the first image to this one.
            </p>
          </div>
        </section>

        <section class="kr-panel-flat space-y-2 p-3">
          <div class="flex items-center justify-between">
            <label class="font-semibold">Motion prompt</label>
            <button
              type="button"
              class="kr-btn-ghost-xs-plain"
              @click="prompt = WINK_PRESET"
            >
              ✨ Wink &amp; grin preset
            </button>
          </div>
          <textarea
            v-model="prompt"
            rows="2"
            class="textarea textarea-bordered w-full"
            placeholder="Describe how the image should move…"
          />
          <details class="text-sm">
            <summary class="cursor-pointer opacity-70">
              Negative prompt (optional)
            </summary>
            <textarea
              v-model="negativePrompt"
              rows="2"
              class="textarea textarea-bordered mt-2 w-full"
              placeholder="Leave blank for the sensible default."
            />
          </details>
        </section>

        <video-model-picker
          v-model:first-model-id="videoCheckpointResourceId"
          v-model:low-model-id="videoLowCheckpointResourceId"
          :engine="engine"
          :mode="selectedWanMode"
          :has-end-frame="Boolean(secondImage)"
          @update:mode="wanMode = $event"
        />
        <video-lora-picker
          v-model="loraPicks"
          :engine="engine"
          :profile="selectedLoraProfile"
        />

        <section class="grid items-stretch gap-3 lg:grid-cols-2">
          <content-visibility-controls
            v-model:is-mature="isMature"
            v-model:is-public="isPublic"
          />

          <div class="kr-panel-flat space-y-3 p-3">
            <div class="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
              <div class="space-y-2">
                <label class="kr-text-semibold-sm">Format</label>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="opt in outputFormats"
                    :key="opt.value"
                    type="button"
                    class="btn btn-sm"
                    :class="
                      outputFormat === opt.value ? 'btn-accent' : 'btn-outline'
                    "
                    @click="outputFormat = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <p class="kr-text-faded-xs self-end sm:pb-1">
                {{ activeOutputFormat.hint }}
              </p>
            </div>

            <div class="grid gap-2 sm:grid-cols-3">
              <label class="space-y-1">
                <span class="text-xs font-semibold">Seconds</span>
                <input
                  v-model.number="durationSeconds"
                  type="number"
                  min="0.5"
                  max="30"
                  step="0.5"
                  class="kr-input-sm w-full"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold">FPS</span>
                <input
                  v-model.number="fps"
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  class="kr-input-sm w-full"
                />
              </label>

              <label class="space-y-1">
                <span class="text-xs font-semibold">Playback</span>
                <span class="flex h-8 cursor-pointer items-center gap-2">
                  <input
                    v-model="loop"
                    type="checkbox"
                    class="kr-toggle-accent"
                  />
                  <span class="kr-text-faded-xs">
                    {{ loop ? 'Loop' : 'Once' }}
                  </span>
                </span>
              </label>
            </div>
          </div>
        </section>

        <details class="kr-panel-flat p-3 text-sm">
          <summary class="cursor-pointer opacity-70">
            Advanced quality &amp; size
          </summary>
          <div class="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="space-y-1">
              <label class="text-sm">Output width</label>
              <input
                v-model.number="width"
                type="number"
                min="64"
                max="2048"
                step="8"
                class="kr-input-sm w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm">Output height</label>
              <input
                v-model.number="height"
                type="number"
                min="64"
                max="2048"
                step="8"
                class="kr-input-sm w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm">LTX render scale</label>
              <select
                v-model.number="renderScale"
                class="select select-bordered select-sm w-full"
                :disabled="engine !== 'ltx'"
              >
                <option :value="0.5">50% + latent refine</option>
                <option :value="0.75">75% + latent refine</option>
                <option :value="1">100% direct</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-sm">Seed (blank = random)</label>
              <input
                v-model="seedInput"
                type="number"
                min="0"
                class="kr-input-sm w-full"
              />
            </div>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs opacity-60">
            <span>Frames: {{ estimatedFrames }}</span>
            <span>Output: {{ width }}×{{ height }}</span>
            <span v-if="engine === 'ltx'">
              First pass: {{ renderWidth }}×{{ renderHeight }}
            </span>
          </div>
        </details>

        <section
          class="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]"
        >
          <div
            class="kr-panel-flat flex items-center gap-3 px-4 py-3 text-sm"
            :class="
              runtimeTier === 'slow' || runtimeTier === 'very-slow'
                ? 'border-warning/50'
                : ''
            "
            role="status"
          >
            <Icon
              :name="
                runtimeTier === 'slow' || runtimeTier === 'very-slow'
                  ? 'kind-icon:warning'
                  : 'kind-icon:clock'
              "
              class="kr-icon-5 shrink-0"
              :class="
                runtimeTier === 'slow' || runtimeTier === 'very-slow'
                  ? 'text-warning'
                  : 'text-info'
              "
            />
            <div class="min-w-0">
              <p class="font-semibold">{{ runtimeTitle }}</p>
              <p class="kr-text-faded-xs line-clamp-1">{{ runtimeMessage }}</p>
            </div>
          </div>

          <button
            type="button"
            class="btn btn-accent btn-lg h-full min-h-14 w-full"
            :disabled="!canGenerate"
            @click="generate"
          >
            <span v-if="videoStore.isBusy" class="kr-spinner-sm" />
            {{ generateLabel }}
          </button>
        </section>

        <section class="space-y-3">
          <div
            v-if="videoStore.state.message"
            class="kr-text-faded-sm text-center"
          >
            {{ videoStore.state.message }}
            <span v-if="videoStore.state.jobId" class="opacity-50">
              (job #{{ videoStore.state.jobId }})
            </span>
          </div>

          <div
            v-if="videoStore.state.attemptError && videoStore.isBusy"
            class="alert alert-warning text-sm"
            role="status"
          >
            <span>
              Attempt {{ videoStore.state.attempts }} failed, retrying:
              {{ videoStore.state.attemptError }}
            </span>
          </div>

          <div
            v-if="videoStore.state.error"
            class="alert alert-error text-sm"
            role="alert"
          >
            {{ videoStore.state.error }}
          </div>
        </section>

        <section
          v-if="videoStore.state.videoSrc"
          class="kr-panel-flat space-y-2 p-3"
        >
          <h2 class="font-semibold">Selected clip</h2>
          <p v-if="!canShowSelectedClip" class="kr-text-faded-sm">
            Mature clip preview hidden by your account setting.
          </p>
          <img
            v-else-if="videoStore.resultIsImage"
            :src="videoStore.state.videoSrc"
            class="w-full rounded-lg border border-base-300 bg-black object-contain"
            alt="Generated clip"
          />
          <video
            v-else
            :src="videoStore.state.videoSrc"
            class="w-full rounded-lg border border-base-300 bg-black"
            :loop="loop"
            controls
            autoplay
            muted
            playsinline
          />
          <a
            v-if="canShowSelectedClip"
            :href="videoStore.state.videoSrc"
            :download="downloadFilename"
            class="kr-btn-outline-plain"
          >
            ⬇ Download clip
          </a>
        </section>
      </div>

      <section
        v-if="isLoggedIn"
        v-show="activePanel === 'jobs'"
        class="grid min-h-0 gap-3 lg:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.4fr)]"
        aria-label="Saved video renders"
      >
        <div class="kr-panel-flat flex min-h-0 flex-col gap-3 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold">My animated clips</h2>
              <p class="kr-text-faded-xs">
                Saved across sessions · {{ videoStore.history.totalCount }} jobs
              </p>
            </div>
            <button
              type="button"
              class="kr-btn-outline-xs"
              :disabled="videoStore.history.loading"
              @click="videoStore.fetchJobs()"
            >
              <icon name="kind-icon:refresh-cw" class="kr-icon-4" />
              Refresh
            </button>
          </div>
          <p
            v-if="videoStore.history.error"
            class="text-sm text-error"
            role="alert"
          >
            {{ videoStore.history.error }}
          </p>
          <p
            v-if="videoStore.history.notice"
            class="text-sm text-success"
            role="status"
          >
            {{ videoStore.history.notice }}
          </p>
          <div
            v-if="videoStore.history.loading && !videoStore.history.jobs.length"
            class="kr-text-faded-sm"
          >
            Loading saved clips…
          </div>
          <div
            v-else-if="!videoStore.history.jobs.length"
            class="kr-text-faded-sm"
          >
            No saved video jobs yet. Generate a clip to start your history.
          </div>
          <div
            v-else
            class="max-h-[min(62vh,39rem)] space-y-2 overflow-y-auto pr-1"
          >
            <button
              v-for="job in videoStore.history.jobs"
              :key="job.id"
              type="button"
              class="flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors"
              :class="
                job.id === videoStore.history.selectedJobId
                  ? 'border-accent bg-accent/10'
                  : 'border-base-300 bg-base-100/60 hover:bg-base-200'
              "
              :aria-pressed="job.id === videoStore.history.selectedJobId"
              @click="selectSavedJob(job.id)"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-base-200"
              >
                <icon
                  :name="
                    job.status === 'DONE' ? 'kind-icon:play' : 'kind-icon:video'
                  "
                  class="kr-icon-5"
                />
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="flex items-center justify-between gap-2 text-sm font-semibold"
                >
                  <span>{{ job.model.toUpperCase() }} #{{ job.id }}</span>
                  <span
                    class="text-xs"
                    :class="
                      job.status === 'FAILED'
                        ? 'text-error'
                        : job.status === 'DONE'
                          ? 'text-success'
                          : 'text-info'
                    "
                  >
                    {{ statusLabel(job.status) }}
                  </span>
                </span>
                <span class="mt-1 block truncate text-xs opacity-75">
                  {{ job.prompt || 'Untitled motion' }}
                </span>
                <span class="mt-1 block text-xs opacity-60">
                  {{ formatJobDate(job.createdAt) }}
                </span>
              </span>
            </button>
          </div>
          <div
            v-if="videoStore.history.pageCount > 1"
            class="flex items-center justify-between gap-2 text-xs"
          >
            <button
              type="button"
              class="kr-btn-outline-xs"
              :disabled="
                videoStore.history.page <= 1 || videoStore.history.loading
              "
              @click="videoStore.fetchJobs(videoStore.history.page - 1)"
            >
              Previous
            </button>
            <span
              >Page {{ videoStore.history.page }} /
              {{ videoStore.history.pageCount }}</span
            >
            <button
              type="button"
              class="kr-btn-outline-xs"
              :disabled="
                videoStore.history.page >= videoStore.history.pageCount ||
                videoStore.history.loading
              "
              @click="videoStore.fetchJobs(videoStore.history.page + 1)"
            >
              Next
            </button>
          </div>
        </div>

        <article
          v-if="videoStore.selectedJob"
          class="kr-panel-flat min-w-0 space-y-4 p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold">
                {{ videoStore.selectedJob.model.toUpperCase() }} · Job #{{
                  videoStore.selectedJob.id
                }}
              </h2>
              <p class="kr-text-faded-xs">
                {{ formatJobDate(videoStore.selectedJob.createdAt) }}
                · {{ videoStore.selectedJob.width }}×{{
                  videoStore.selectedJob.height
                }}
                · {{ videoStore.selectedJob.durationSeconds }}s
              </p>
            </div>
            <span
              class="badge"
              :class="
                videoStore.selectedJob.status === 'DONE'
                  ? 'badge-success'
                  : videoStore.selectedJob.status === 'FAILED'
                    ? 'badge-error'
                    : 'badge-info'
              "
            >
              {{ statusLabel(videoStore.selectedJob.status) }}
            </span>
          </div>

          <div
            v-if="isActiveJob(videoStore.selectedJob.status)"
            class="space-y-2"
            role="status"
          >
            <progress class="progress progress-accent w-full" />
            <p class="text-sm">{{ videoStore.state.message }}</p>
            <p class="kr-text-faded-xs">
              {{
                videoStore.selectedJob.status === 'RUNNING'
                  ? 'Relay has claimed the job'
                  : 'Waiting for a relay slot'
              }}
              <span v-if="videoStore.selectedJob.attempts">
                · {{ videoStore.selectedJob.attempts }} previous attempt(s)
              </span>
            </p>
            <p class="kr-text-faded-xs">
              Stage updates come from the render queue. The backend does not
              report a reliable percent complete.
            </p>
          </div>

          <div
            v-if="videoStore.state.attemptError"
            class="alert alert-warning text-xs"
          >
            {{ videoStore.state.attemptError }}
          </div>
          <div
            v-if="videoStore.state.error"
            class="alert alert-error text-sm"
            role="alert"
          >
            {{ videoStore.state.error }}
          </div>

          <p
            v-if="
              videoStore.selectedJob.status === 'DONE' && !canShowSelectedClip
            "
            class="kr-text-faded-sm"
          >
            Mature clip preview hidden by your account setting.
          </p>
          <div
            v-else-if="
              videoStore.selectedJob.status === 'DONE' &&
              videoStore.state.videoSrc
            "
            class="space-y-2"
          >
            <img
              v-if="videoStore.resultIsImage"
              :src="videoStore.state.videoSrc"
              class="max-h-[min(65vh,44rem)] w-full rounded-2xl bg-black object-contain"
              alt="Generated animated clip"
            />
            <video
              v-else
              :src="videoStore.state.videoSrc"
              class="max-h-[min(65vh,44rem)] w-full rounded-2xl bg-black object-contain"
              :loop="loop"
              controls
              muted
              playsinline
            />
            <a
              v-if="canShowSelectedClip"
              :href="videoStore.state.videoSrc"
              :download="downloadFilename"
              class="kr-btn-outline-plain"
            >
              Download clip
            </a>
          </div>
          <p
            v-else-if="videoStore.selectedJob.status === 'DONE'"
            class="kr-text-faded-sm"
          >
            The render is complete. Loading its saved result…
          </p>

          <details class="rounded-xl border border-base-300 p-3 text-sm">
            <summary class="cursor-pointer font-semibold">
              Original motion prompt
            </summary>
            <p class="mt-2 whitespace-pre-wrap break-words">
              {{ videoStore.selectedJob.prompt }}
            </p>
          </details>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-accent btn-sm"
              :disabled="
                isActiveJob(videoStore.selectedJob.status) ||
                videoStore.history.actionId !== null
              "
              @click="resubmitSavedJob(videoStore.selectedJob.id)"
            >
              Resubmit as new clip
            </button>
            <button
              type="button"
              class="btn btn-outline btn-error btn-sm"
              :disabled="
                isActiveJob(videoStore.selectedJob.status) ||
                videoStore.history.actionId !== null
              "
              @click="pendingDeleteId = videoStore.selectedJob.id"
            >
              Delete history entry
            </button>
          </div>
          <p class="kr-text-faded-xs">
            Resubmitting uses your saved images and settings and charges for a
            new render. Deleting this entry does not remove finished artwork
            from your gallery.
          </p>
          <div
            v-if="pendingDeleteId === videoStore.selectedJob.id"
            class="rounded-xl border border-error/40 bg-error/10 p-3 text-sm"
          >
            Remove this job from your history? The finished artwork will be
            kept.
            <div class="mt-2 flex gap-2">
              <button
                type="button"
                class="btn btn-error btn-sm"
                @click="deleteSavedJob(pendingDeleteId)"
              >
                Confirm delete
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="pendingDeleteId = null"
              >
                Keep job
              </button>
            </div>
          </div>
        </article>
        <div
          v-else
          class="kr-panel-flat flex items-center justify-center p-8 text-sm opacity-60"
        >
          Select a clip to inspect its progress and results.
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useResourceStore } from '@/stores/resourceStore'
import {
  effectiveWanMode,
  videoLoraProfile,
  videoModelIsMature,
  type WanVideoMode,
} from '@/utils/videoModelResources'
import { useVideoStore } from '@/stores/videoStore'
import { useUserStore } from '@/stores/userStore'
import { resolveArtImageSource } from '@/utils/artImageSource'
import type {
  RecentArtJobImage,
  RecentArtFilter,
} from '@/utils/recentArtImages'
import type { VideoStudioSettings } from '@/stores/videoStore'
import { promptWithLoraTriggers, type LoraPick } from '@/utils/loraSelection'
import {
  estimateVideoRuntimeTier,
  generatorOutputFormat,
  getDefaultVideoPreset,
  getVideoPreset,
  getVideoPresetsForEngine,
  runtimeTierMessage,
  videoFrameCount,
  type VideoEngine,
  type VideoOutputFormat,
  type VideoPresetId,
} from '@/utils/videoPresets'

const LOGO_SRC = '/images/kindlogo_new.webp'
const WINK_PRESET =
  'The feminine kind robot on the right winks one eye and breaks into a warm, playful grin. Subtle head tilt, sparkling eyes, smooth natural motion, charming and friendly. The rest of the logo stays still.'

const videoStore = useVideoStore()
const userStore = useUserStore()
const resourceStore = useResourceStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

const engines = [
  {
    value: 'ltx' as const,
    label: 'LTX',
    hint: 'LTX 2.3 — expressive motion with a 12 GB-aware default and optional full-resolution quality mode.',
  },
  {
    value: 'wan' as const,
    label: 'WAN',
    hint: 'WAN 2.x — smooth image-to-video and first→last frame morphs.',
  },
]

const outputFormats = [
  {
    value: 'webp' as const,
    label: 'WebP',
    hint: 'Animated image, loops natively — fine for small, short clips; at 1280×720 it is several times the size of an MP4.',
  },
  {
    value: 'mp4' as const,
    label: 'MP4',
    hint: 'Real video container — best for longer or more complex motion.',
  },
  {
    value: 'webm' as const,
    label: 'WebM',
    hint: 'Open video container with a similar use case to MP4.',
  },
]

const initialPreset = getDefaultVideoPreset('ltx')
const engine = ref<VideoEngine>('ltx')
const videoPresetId = ref<VideoPresetId | ''>(initialPreset.id)
const outputFormat = ref<VideoOutputFormat>(
  generatorOutputFormat(initialPreset),
)
const firstImage = ref('')
const route = useRoute()
const router = useRouter()
const firstImageArtId = ref<number | null>(null)
const recentArtOpen = ref(false)
const recentArtFilter = ref<RecentArtFilter>('sfw')
const recentArtFilters: { value: RecentArtFilter; label: string }[] = [
  { value: 'all', label: 'Both' },
  { value: 'mature', label: 'Mature' },
  { value: 'sfw', label: 'SFW' },
]
const activePanel = ref<'create' | 'jobs' | 'music'>(
  route.query.studio === 'music' ? 'music' : 'create',
)
const pendingDeleteId = ref<number | null>(null)
const secondImage = ref('')
const prompt = ref(WINK_PRESET)
const negativePrompt = ref('')
const loraPicks = ref<LoraPick[]>([])
const wanMode = ref<WanVideoMode>('ti2v')
const videoCheckpointResourceId = ref<number | null>(null)
const videoLowCheckpointResourceId = ref<number | null>(null)
const isMature = ref(false)
const isPublic = ref(true)
const durationSeconds = ref<number>(initialPreset.durationSeconds)
const fps = ref<number>(initialPreset.fps)
const loop = ref(initialPreset.loop)
const width = ref<number>(initialPreset.width)
const height = ref<number>(initialPreset.height)
const renderScale = ref<number>(initialPreset.renderScale)
const latentUpscaleModel = ref<string | null>(initialPreset.latentUpscaleModel)
const refineSampler = ref<string | null>(initialPreset.refineSampler)
const refineSigmas = ref<string | null>(initialPreset.refineSigmas)
const seedInput = ref<number | string>('')

const selectedWanMode = computed(() =>
  effectiveWanMode(wanMode.value, Boolean(secondImage.value)),
)
const selectedLoraProfile = computed(() =>
  videoLoraProfile(engine.value, selectedWanMode.value),
)
const canShowDraftImages = computed(
  () => !isMature.value || userStore.showMature,
)
const visibleRecentArt = computed(() =>
  userStore.showMature
    ? videoStore.recentArt.items
    : videoStore.recentArt.items.filter((item) => !item.isMature),
)
const canShowSelectedClip = computed(
  () => !videoStore.selectedJob?.isMature || userStore.showMature,
)
// A mature checkpoint must not be queued as an unmarked public clip. The
// server repeats this check independently; this reflects it immediately in UI.
watch(
  [
    videoCheckpointResourceId,
    videoLowCheckpointResourceId,
    () => resourceStore.resources,
  ],
  () => {
    const selected = resourceStore.resources.filter(
      (resource) =>
        resource.id === videoCheckpointResourceId.value ||
        resource.id === videoLowCheckpointResourceId.value,
    )
    if (selected.some(videoModelIsMature)) {
      isMature.value = true
      isPublic.value = false
    }
  },
)
watch([engine, selectedWanMode], () => {
  videoCheckpointResourceId.value = null
  videoLowCheckpointResourceId.value = null
})

const activeEngine = computed(
  () => engines.find((item) => item.value === engine.value) ?? engines[0]!,
)
const activeOutputFormat = computed(
  () =>
    outputFormats.find((item) => item.value === outputFormat.value) ??
    outputFormats[0]!,
)
const availableVideoPresets = computed(() =>
  getVideoPresetsForEngine(engine.value),
)
const defaultPreset = computed(() => getDefaultVideoPreset(engine.value))
const selectedPreset = computed(() => getVideoPreset(videoPresetId.value))
const estimatedFrames = computed(() =>
  videoFrameCount(durationSeconds.value || 0, fps.value || 0),
)
const renderWidth = computed(() =>
  Math.max(64, Math.round((width.value * renderScale.value) / 8) * 8),
)
const renderHeight = computed(() =>
  Math.max(64, Math.round((height.value * renderScale.value) / 8) * 8),
)
const runtimeTier = computed(() =>
  estimateVideoRuntimeTier({
    engine: engine.value,
    width: width.value,
    height: height.value,
    durationSeconds: durationSeconds.value,
    fps: fps.value,
    renderScale: engine.value === 'ltx' ? renderScale.value : 1,
    latentUpscaleModel:
      engine.value === 'ltx' && renderScale.value < 1
        ? latentUpscaleModel.value
        : null,
  }),
)
const runtimeMessage = computed(() => runtimeTierMessage(runtimeTier.value))
const runtimeTitle = computed(() => {
  if (runtimeTier.value === 'quick') return 'Quick render profile'
  if (runtimeTier.value === 'balanced') return '12 GB-friendly render profile'
  if (runtimeTier.value === 'slow') return 'Slow render warning'
  return 'Very slow render warning'
})
const timeoutSeconds = computed(() => {
  const tierTimeout = {
    quick: 3_600,
    balanced: 5_400,
    slow: 10_800,
    'very-slow': 14_400,
  }[runtimeTier.value]
  return Math.max(selectedPreset.value?.timeoutSeconds ?? 0, tierTimeout)
})
const downloadFilename = computed(
  () => `kindrobots-clip.${videoStore.state.fileType || outputFormat.value}`,
)
const canGenerate = computed(
  () =>
    isLoggedIn.value &&
    (Boolean(firstImage.value) ||
      (engine.value === 'wan' && selectedWanMode.value === 'ti2v')) &&
    !!prompt.value.trim() &&
    width.value >= 64 &&
    height.value >= 64 &&
    durationSeconds.value > 0 &&
    fps.value > 0,
)
const generateLabel = computed(() => {
  if (runtimeTier.value === 'very-slow') {
    return `Generate ${engine.value.toUpperCase()} clip — very slow`
  }
  if (runtimeTier.value === 'slow') {
    return `Generate ${engine.value.toUpperCase()} clip — slow`
  }
  return `Generate ${engine.value.toUpperCase()} clip`
})

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Queued',
    RUNNING: 'Rendering',
    DONE: 'Finished',
    FAILED: 'Failed',
    CANCELLED: 'Cancelled',
  }
  return labels[status] || status
}

function isActiveJob(status: string): boolean {
  return status === 'PENDING' || status === 'RUNNING'
}

function formatJobDate(value: Date | string): string {
  return new Date(value).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function selectPanel(panel: 'create' | 'jobs' | 'music'): void {
  activePanel.value = panel
  const query = { ...route.query }
  if (panel === 'music') query.studio = 'music'
  else {
    delete query.studio
    delete query.video
  }
  if (
    route.query.studio !== query.studio ||
    route.query.video !== query.video
  ) {
    void router.replace({ query })
  }
}

watch(
  () => route.query.studio,
  (studio) => {
    if (studio === 'music') activePanel.value = 'music'
    else if (activePanel.value === 'music') activePanel.value = 'create'
  },
)

function openJobs(): void {
  selectPanel('jobs')
  if (isLoggedIn.value) void videoStore.fetchJobs()
}

async function selectSavedJob(id: number): Promise<void> {
  pendingDeleteId.value = null
  await videoStore.selectJob(id)
}

async function resubmitSavedJob(id: number): Promise<void> {
  pendingDeleteId.value = null
  await videoStore.resubmitJob(id)
}

async function deleteSavedJob(id: number | null): Promise<void> {
  if (id === null) return
  if (await videoStore.deleteJob(id)) pendingDeleteId.value = null
}

function applyPreset(
  preset: NonNullable<ReturnType<typeof getVideoPreset>>,
): void {
  videoPresetId.value = preset.id
  width.value = preset.width
  height.value = preset.height
  durationSeconds.value = preset.durationSeconds
  fps.value = preset.fps
  loop.value = preset.loop
  outputFormat.value = generatorOutputFormat(preset)
  renderScale.value = preset.renderScale
  latentUpscaleModel.value = preset.latentUpscaleModel
  refineSampler.value = preset.refineSampler
  refineSigmas.value = preset.refineSigmas
}

function selectEngine(nextEngine: VideoEngine): void {
  // Re-clicking the engine already selected used to re-apply its default
  // preset, silently swapping a chosen 12 GB Quick back to Balanced.
  if (nextEngine === engine.value) return
  engine.value = nextEngine
  applyPreset(getDefaultVideoPreset(nextEngine))
}

function selectVideoPreset(nextPresetId: VideoPresetId | ''): void {
  videoPresetId.value = nextPresetId
  if (!nextPresetId) return
  const preset = getVideoPreset(nextPresetId)
  if (!preset || preset.engine !== engine.value) return
  applyPreset(preset)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function onFileChange(event: Event, slot: 'first' | 'second') {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const dataUrl = await fileToDataUrl(file)
  if (slot === 'first') {
    firstImage.value = dataUrl
    firstImageArtId.value = null
  } else secondImage.value = dataUrl
}

function recentArtThumb(item: RecentArtJobImage): string {
  return item.thumbnailPath || resolveArtImageSource(item).src || LOGO_SRC
}

function clearFirstImage(): void {
  firstImage.value = ''
  firstImageArtId.value = null
}

function toggleRecentArt(): void {
  recentArtOpen.value = !recentArtOpen.value
  if (recentArtOpen.value && !videoStore.recentArt.items.length) {
    void videoStore.fetchRecentArt(recentArtFilter.value)
  }
}

async function useArtImageAsFirst(artImageId: number): Promise<void> {
  const frame = await videoStore.loadArtImageFrame(artImageId)
  if (!frame) return
  firstImage.value = frame.dataUrl
  firstImageArtId.value = artImageId
  if (frame.isMature) {
    if (!userStore.showMature) return
    isMature.value = true
    isPublic.value = false
  }
}

onMounted(() => {
  const saved = videoStore.loadStudioSettings()
  if (saved) restoreStudioSettings(saved)
  const requested = Number(route.query.artImageId)
  if (Number.isInteger(requested) && requested > 0) {
    void useArtImageAsFirst(requested)
  }
  if (isLoggedIn.value) void videoStore.fetchJobs(1)
  refreshTimer = setInterval(() => {
    if (isLoggedIn.value && videoStore.hasActiveJobs) {
      void videoStore.fetchJobs()
    }
  }, 5_000)
})

let refreshTimer: ReturnType<typeof setInterval> | null = null
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
watch(isLoggedIn, (signedIn) => {
  if (signedIn) void videoStore.fetchJobs(1)
})
watch(recentArtFilter, () => {
  if (recentArtOpen.value && isLoggedIn.value) {
    void videoStore.fetchRecentArt(recentArtFilter.value)
  }
})
watch(
  () => userStore.showMature,
  (enabled) => {
    if (!enabled) recentArtFilter.value = 'sfw'
    if (recentArtOpen.value && isLoggedIn.value) {
      void videoStore.fetchRecentArt(recentArtFilter.value)
    }
    if (videoStore.selectedJob?.status === 'DONE') {
      void videoStore.selectJob(videoStore.selectedJob.id)
    }
  },
)

function restoreStudioSettings(saved: VideoStudioSettings): void {
  if (saved.engine === 'wan' || saved.engine === 'ltx')
    engine.value = saved.engine
  if (typeof saved.videoPresetId === 'string')
    videoPresetId.value = saved.videoPresetId
  if (outputFormats.some((option) => option.value === saved.outputFormat)) {
    outputFormat.value = saved.outputFormat
  }
  if (saved.wanMode === 'ti2v' || saved.wanMode === 'a14b')
    wanMode.value = saved.wanMode
  if (typeof saved.prompt === 'string') prompt.value = saved.prompt
  if (typeof saved.negativePrompt === 'string')
    negativePrompt.value = saved.negativePrompt
  if (typeof saved.isMature === 'boolean') isMature.value = saved.isMature
  if (typeof saved.isPublic === 'boolean') isPublic.value = saved.isPublic
  if (typeof saved.loop === 'boolean') loop.value = saved.loop
  for (const [value, field] of [
    [saved.durationSeconds, durationSeconds],
    [saved.fps, fps],
    [saved.width, width],
    [saved.height, height],
    [saved.renderScale, renderScale],
  ] as const) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0)
      field.value = value
  }
  if (
    typeof saved.seedInput === 'number' ||
    typeof saved.seedInput === 'string'
  ) {
    seedInput.value = saved.seedInput
  }
  latentUpscaleModel.value = saved.latentUpscaleModel ?? null
  refineSampler.value = saved.refineSampler ?? null
  refineSigmas.value = saved.refineSigmas ?? null
  if (Array.isArray(saved.loraPicks)) loraPicks.value = saved.loraPicks
  if (
    userStore.showMature &&
    (saved.recentArtFilter === 'all' || saved.recentArtFilter === 'mature')
  ) {
    recentArtFilter.value = saved.recentArtFilter
  }
  void nextTick(() => {
    videoCheckpointResourceId.value = saved.videoCheckpointResourceId ?? null
    videoLowCheckpointResourceId.value =
      saved.videoLowCheckpointResourceId ?? null
  })
}

watch(
  [
    engine,
    videoPresetId,
    outputFormat,
    wanMode,
    prompt,
    negativePrompt,
    isMature,
    isPublic,
    durationSeconds,
    fps,
    loop,
    width,
    height,
    renderScale,
    seedInput,
    latentUpscaleModel,
    refineSampler,
    refineSigmas,
    videoCheckpointResourceId,
    videoLowCheckpointResourceId,
    loraPicks,
    recentArtFilter,
  ],
  () => {
    videoStore.rememberStudioSettings({
      engine: engine.value,
      videoPresetId: videoPresetId.value,
      outputFormat: outputFormat.value,
      wanMode: wanMode.value,
      prompt: prompt.value,
      negativePrompt: negativePrompt.value,
      isMature: isMature.value,
      isPublic: isPublic.value,
      durationSeconds: durationSeconds.value,
      fps: fps.value,
      loop: loop.value,
      width: width.value,
      height: height.value,
      renderScale: renderScale.value,
      seedInput: seedInput.value,
      latentUpscaleModel: latentUpscaleModel.value,
      refineSampler: refineSampler.value,
      refineSigmas: refineSigmas.value,
      videoCheckpointResourceId: videoCheckpointResourceId.value,
      videoLowCheckpointResourceId: videoLowCheckpointResourceId.value,
      loraPicks: loraPicks.value,
      recentArtFilter: recentArtFilter.value,
    })
  },
  { deep: true },
)

async function useLogoAsFirst() {
  try {
    const res = await fetch(LOGO_SRC)
    const blob = await res.blob()
    firstImageArtId.value = null
    firstImage.value = await fileToDataUrl(
      new File([blob], 'kindlogo_new.webp', { type: blob.type }),
    )
  } catch {
    videoStore.state.error =
      'Could not load the logo image. Try uploading it manually.'
  }
}

async function generate() {
  if (!canGenerate.value) return

  const seed =
    seedInput.value === '' || seedInput.value === null
      ? null
      : Number(seedInput.value)
  const shouldUpscale =
    engine.value === 'ltx' &&
    renderScale.value < 1 &&
    Boolean(latentUpscaleModel.value)
  const effectivePrompt = promptWithLoraTriggers(
    prompt.value,
    loraPicks.value,
    resourceStore.visibleLoras,
  )

  selectPanel('jobs')
  void videoStore.generate({
    engine: engine.value,
    presetId: videoPresetId.value || null,
    promptString: effectivePrompt,
    negativePrompt: negativePrompt.value.trim() || undefined,
    firstImageBase64: firstImage.value,
    secondImageBase64: secondImage.value || null,
    durationSeconds: durationSeconds.value,
    fps: fps.value,
    loop: loop.value,
    width: width.value,
    height: height.value,
    seed,
    outputFormat: outputFormat.value,
    renderScale: engine.value === 'ltx' ? renderScale.value : 1,
    latentUpscaleModel: shouldUpscale ? latentUpscaleModel.value : null,
    refineSampler: shouldUpscale ? refineSampler.value : null,
    refineSigmas: shouldUpscale ? refineSigmas.value : null,
    timeoutSeconds: timeoutSeconds.value,
    loras: loraPicks.value,
    videoWanMode: selectedWanMode.value,
    videoCheckpointResourceId: videoCheckpointResourceId.value,
    videoLowCheckpointResourceId: videoLowCheckpointResourceId.value,
    isMature: isMature.value,
    isPublic: isPublic.value,
    projectSlug: 'video-generator',
  })
}
</script>

<style scoped>
.vg-bar {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}
.vg-bar-views {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}
.vg-bar-views::-webkit-scrollbar {
  display: none;
}
.vg-bar-views > * {
  flex: none;
}
.vg-bar-engine {
  flex: none;
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@container (max-width: 760px) {
  .vg-bar-engine {
    display: none;
  }
}
</style>

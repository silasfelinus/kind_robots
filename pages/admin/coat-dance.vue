<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div
      class="kr-container-wide flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4"
    >
      <header
        class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-2 text-base-content shadow-sm"
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
        <div class="flex items-center gap-2 text-xs">
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
        <nav
          class="grid grid-cols-3 gap-1 rounded-xl bg-base-200 p-1 lg:hidden"
          aria-label="Studio panels"
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
          class="kr-panes min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(15rem,0.85fr)_minmax(14rem,0.7fr)]"
        >
          <section
            :class="activePanel === 'source' ? 'flex' : 'hidden lg:flex'"
            class="kr-panel min-h-0 flex-col gap-3 overflow-hidden p-3 lg:flex"
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
                aria-label="Source video preview"
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
            <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label class="min-w-0">
                <span class="kr-text-faded-xs block">Project title</span>
                <input
                  v-model="title"
                  type="text"
                  class="kr-input w-full"
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
                store.busy
                  ? 'Uploading source…'
                  : 'Upload & prepare render project'
              }}
            </button>
          </section>

          <section
            :class="activePanel === 'style' ? 'flex' : 'hidden lg:flex'"
            class="kr-panel min-h-0 flex-col gap-2 overflow-hidden p-3 lg:flex"
            aria-label="Animation style presets"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="kr-text-semibold-sm">02 / Animation look</span>
              <span class="kr-badge-outline">6 presets</span>
            </div>
            <p class="kr-text-faded-xs">
              A consistent visual treatment across the original choreography.
            </p>
            <div class="kr-pane-scroll min-h-0 flex-1">
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="look in RESTYLE_STYLES"
                  :key="look.id"
                  type="button"
                  class="overflow-hidden rounded-xl border-2 bg-base-200 text-left transition-colors"
                  :class="
                    style === look.id
                      ? 'border-primary'
                      : 'border-transparent hover:border-base-content/30'
                  "
                  :aria-pressed="style === look.id"
                  @click="style = look.id"
                >
                  <span
                    class="relative block aspect-[5/3] overflow-hidden bg-gradient-to-br"
                    :class="look.tone"
                  >
                    <span
                      class="absolute inset-0 grid place-items-center text-5xl font-light text-base-content/80"
                      >✦</span
                    >
                    <span
                      v-if="style === look.id"
                      class="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-content"
                    >
                      <icon name="kind-icon:check" class="h-3 w-3" />
                    </span>
                  </span>
                  <span class="block px-2 py-1.5">
                    <span class="block text-xs font-bold">{{
                      look.label
                    }}</span>
                    <span class="block text-[10px] opacity-65">{{
                      look.note
                    }}</span>
                  </span>
                </button>
              </div>
            </div>
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
              1080p is an upscale target after assembly, not the diffusion
              working resolution.
            </p>
            <button
              v-if="
                store.selected &&
                !sourceFile &&
                store.selected.status === 'STAGED'
              "
              type="button"
              class="kr-btn kr-btn-primary w-full"
              :disabled="store.busy || !lookChanged"
              @click="saveLook"
            >
              {{
                store.busy
                  ? 'Saving…'
                  : lookChanged
                    ? 'Save look to this project'
                    : 'Look saved'
              }}
            </button>
          </section>

          <section
            :class="activePanel === 'jobs' ? 'flex' : 'hidden lg:flex'"
            class="kr-panel min-h-0 flex-col gap-2 overflow-hidden p-3 lg:flex"
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
            <div class="kr-pane-scroll min-h-0 flex-1 space-y-2">
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
                class="w-full rounded-xl border p-3 text-left"
                :class="
                  store.selectedId === job.id
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 bg-base-100/60'
                "
                @click="selectJob(job)"
              >
                <span class="flex items-center justify-between gap-2">
                  <strong class="truncate text-sm">{{ job.title }}</strong>
                  <span
                    class="text-[10px] font-semibold uppercase tracking-wide"
                    >{{ job.status }}</span
                  >
                </span>
                <span class="mt-1 block text-xs opacity-70"
                  >{{ formatRestyleTime(job.sourceDurationSec) }} ·
                  {{ labelFor(job.style) }}</span
                >
                <span class="mt-1 block text-[10px] opacity-60">{{
                  new Date(job.createdAt).toLocaleDateString()
                }}</span>
              </button>
            </div>
            <div
              v-if="store.selected"
              class="space-y-2 border-t border-base-300 pt-3 text-xs"
            >
              <p class="font-bold">Saved render plan</p>
              <div class="grid grid-cols-2 gap-2">
                <span class="rounded-lg bg-base-200 p-2"
                  >{{ store.selected.segments.length }} motion windows</span
                >
                <span class="rounded-lg bg-base-200 p-2"
                  >{{ store.selected.quality }} target</span
                >
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-base-300">
                <div
                  class="h-full bg-primary"
                  :style="{ width: store.selected.progress + '%' }"
                />
              </div>
              <p class="text-base-content/70">{{ store.selected.stage }}</p>
              <NuxtLink
                v-if="store.selected.pilot?.artJobId"
                to="/artjob"
                class="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                View ArtJob #{{ store.selected.pilot.artJobId }} in the queue
              </NuxtLink>
              <div
                v-else-if="store.selected.pilot"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2"
              >
                <span>Not registered in ArtJob yet.</span>
                <button
                  type="button"
                  class="kr-btn-outline-xs"
                  :disabled="store.syncing"
                  @click="store.refresh()"
                >
                  {{ store.syncing ? 'Registering…' : 'Register in ArtJob' }}
                </button>
              </div>
              <p v-if="store.selected.pilot" class="text-base-content/70">
                {{ store.selected.pilot.completedSegments }}/{{
                  store.selected.pilot.totalSegments
                }}
                VACE motion windows · {{ Math.round(store.selected.progress) }}%
              </p>
              <p v-if="store.selected.error" class="text-error" role="alert">
                {{ store.selected.error }}
              </p>
              <button
                v-if="
                  (store.selected.status === 'STAGED' ||
                    store.selected.status === 'PILOT_BLOCKED' ||
                    store.selected.status === 'PILOT_FAILED') &&
                  !sourceFile
                "
                type="button"
                class="kr-btn kr-btn-primary w-full"
                :disabled="store.busy || lookChanged || style !== 'illustrious'"
                @click="store.queuePilot(store.selected.id)"
              >
                {{ store.busy ? 'Queueing…' : 'Render 24-second motion pilot' }}
              </button>
              <button
                v-if="store.selected.status === 'REVIEW'"
                type="button"
                class="kr-btn kr-btn-primary w-full"
                :disabled="store.sourceBusy"
                @click="showPilot"
              >
                {{ store.sourceBusy ? 'Loading…' : 'Watch animated pilot' }}
              </button>
              <p v-if="lookChanged" class="kr-text-faded-xs">
                Save the selected look before starting a pilot.
              </p>
            </div>
            <div
              class="rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs leading-relaxed"
            >
              <strong>Local GPU worker required.</strong> A pilot uses native
              Wan VACE video control, not WAN image-to-video. Rendering waits
              for the worker and VACE model on the home GPU; the full 5:32 run
              is still disabled until the pilot is reviewed.
            </div>
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
  RESTYLE_MAX_BYTES,
  RESTYLE_MAX_DURATION_SEC,
  RESTYLE_STYLES,
  formatRestyleTime,
  type RestyleQuality,
  type RestyleStyleId,
} from '@/utils/videoRestylePlan'

const userStore = useUserStore()
const store = useVideoRestyleStore()
const ready = ref(false)
const panels = [
  { value: 'source', label: 'Source' },
  { value: 'style', label: 'Looks' },
  { value: 'jobs', label: 'Projects' },
] as const
const activePanel = ref<(typeof panels)[number]['value']>('source')
const qualityOptions = ['720p', '1080p'] as const
const style = ref<RestyleStyleId>('illustrious')
const quality = ref<RestyleQuality>('1080p')
const title = ref('Coat Dance')
const sourceFile = ref<File | null>(null)
const durationSec = ref(0)
const fileInput = ref<HTMLInputElement | null>(null)
const lookChanged = computed(() =>
  Boolean(
    store.selected &&
    (store.selected.style !== style.value ||
      store.selected.quality !== quality.value),
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
    durationSec.value <= RESTYLE_MAX_DURATION_SEC,
  ),
)

function labelFor(value: RestyleStyleId): string {
  return RESTYLE_STYLES.find((entry) => entry.id === value)?.label || value
}

function selectJob(job: VideoRestyleJob) {
  store.selectedId = job.id
  store.clearPreview()
  sourceFile.value = null
  durationSec.value = job.sourceDurationSec
  title.value = job.title
  style.value = job.style
  quality.value = job.quality
  if (fileInput.value) fileInput.value.value = ''
  activePanel.value = 'source'
}

async function showPilot() {
  if (!store.selected) return
  if (await store.loadPilotPreview(store.selected.id)) {
    activePanel.value = 'source'
  }
}

async function saveLook() {
  if (!store.selected || sourceFile.value) return
  await store.saveSettings(store.selected.id, style.value, quality.value)
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
    })
  ) {
    activePanel.value = 'source'
    sourceFile.value = null
    durationSec.value = store.selected?.sourceDurationSec ?? 0
    if (fileInput.value) fileInput.value.value = ''
  }
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) {
    await store.refresh()
    if (store.selected) selectJob(store.selected)
  }
  ready.value = true
  if (userStore.isAdmin) {
    refreshTimer = setInterval(() => {
      if (
        store.jobs.some((job) =>
          ['PILOT_QUEUED', 'PILOT_RUNNING'].includes(job.status),
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

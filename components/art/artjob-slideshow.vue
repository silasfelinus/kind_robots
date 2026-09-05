<!-- /components/art/artjob-slideshow.vue -->
<template>
  <Teleport to="body">
    <div
      ref="rootElement"
      class="fixed inset-0 z-[100] flex select-none flex-col bg-base-300"
      @mousemove="wakeChrome"
      @touchstart="wakeChrome"
    >
      <div
        class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      >
        <transition name="kr-slideshow-fade">
          <div
            v-if="slideSrc && canShowSlide"
            :key="slideKey"
            class="absolute inset-0 flex items-center justify-center"
          >
            <video
              v-if="slideKind === 'video'"
              :src="slideSrc"
              class="h-full w-full"
              :class="fitClass"
              autoplay
              loop
              muted
              playsinline
            />
            <img
              v-else
              :src="slideSrc"
              :alt="slideTitle"
              class="h-full w-full"
              :class="fitClass"
              decoding="async"
              data-missing-image-report="false"
            />
          </div>
        </transition>

        <div
          v-if="!slideSrc || !canShowSlide"
          class="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-base-content/10 bg-base-100/70 p-8 text-center"
        >
          <span
            v-if="slideshowStore.loadingPool"
            class="loading loading-spinner loading-lg text-primary"
          />
          <p class="text-sm font-semibold">{{ stageMessage }}</p>
          <p v-if="slideshowStore.error" class="text-xs text-error">
            {{ slideshowStore.error }}
          </p>
        </div>

        <transition name="kr-slideshow-fade">
          <header
            v-if="chromeVisible"
            class="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-b from-base-300/90 to-transparent p-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-black tracking-wide"
                >Art slideshow</span
              >
              <span
                class="badge badge-sm rounded-2xl"
                :class="isPlaying ? 'badge-success' : 'badge-ghost'"
              >
                {{ isPlaying ? `${intervalSeconds}s` : 'Paused' }}
              </span>
              <span
                class="badge badge-outline badge-sm rounded-2xl"
                :title="`Drawing at random from the ${depth} most recent finished jobs`"
              >
                depth {{ slideshowStore.pool.length }}/{{ depth }}
              </span>
              <span
                v-if="slideshowStore.pendingArrivalCount"
                class="badge badge-accent badge-sm rounded-2xl"
              >
                {{ slideshowStore.pendingArrivalCount }} new queued
              </span>
              <span
                v-if="showingArrival"
                class="badge badge-accent badge-sm rounded-2xl"
              >
                Fresh off the queue
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-1">
              <button
                type="button"
                class="kr-btn-ghost-2xl"
                :disabled="!slideshowStore.hasPreviousSlide"
                title="Previous (left arrow)"
                @click="previousSlide"
              >
                Prev
              </button>
              <button
                type="button"
                class="kr-btn-2xl"
                :class="isPlaying ? 'btn-ghost' : 'btn-primary'"
                title="Play or pause (space)"
                @click="togglePlaying"
              >
                {{ isPlaying ? 'Pause' : 'Play' }}
              </button>
              <button
                type="button"
                class="kr-btn-ghost-2xl"
                title="Next (right arrow)"
                @click="nextSlide"
              >
                Next
              </button>
              <button
                type="button"
                class="kr-btn-ghost-2xl"
                title="Show or hide the caption (i)"
                @click="toggleAllOverlay"
              >
                {{ anyOverlayVisible ? 'Hide info' : 'Show info' }}
              </button>
              <button
                type="button"
                class="kr-btn-2xl"
                :class="settingsOpen ? 'btn-primary' : 'btn-ghost'"
                title="Slideshow options (s)"
                @click="settingsOpen = !settingsOpen"
              >
                Options
              </button>
              <button
                type="button"
                class="kr-btn-ghost-2xl"
                title="Toggle browser fullscreen (f)"
                @click="toggleFullscreen"
              >
                {{ isFullscreen ? 'Exit fullscreen' : 'Fullscreen' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm rounded-2xl text-error"
                title="Close the slideshow (esc)"
                @click="close"
              >
                Close
              </button>
            </div>
          </header>
        </transition>

        <transition name="kr-slideshow-fade">
          <footer
            v-if="captionVisible"
            class="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-base-300/90 to-transparent p-4"
          >
            <div
              v-if="overlay.title"
              class="flex flex-wrap items-baseline gap-2"
            >
              <span class="text-lg font-black">{{ slideTitle }}</span>
              <span
                v-if="currentJob?.projectSlug"
                class="badge badge-secondary badge-sm rounded-2xl"
              >
                {{ currentJob.projectSlug }}
              </span>
              <span
                v-if="currentJob?.engine"
                class="badge badge-outline badge-sm rounded-2xl"
              >
                {{ currentJob.engine }}
              </span>
            </div>

            <p
              v-if="overlay.fileName && slideFileName"
              class="break-all font-mono text-xs text-base-content/80"
              :title="slidePath"
            >
              {{ slideFileName }}
              <span
                v-if="slidePath !== slideFileName"
                class="text-base-content/45"
              >
                · {{ slidePath }}
              </span>
            </p>

            <p
              v-if="overlay.prompt && slidePrompt"
              class="line-clamp-3 max-w-4xl whitespace-pre-wrap text-sm leading-relaxed text-base-content/85"
            >
              {{ slidePrompt }}
            </p>

            <div
              v-if="overlay.settings && slideSettings.length"
              class="flex flex-wrap gap-1"
            >
              <span
                v-for="setting in slideSettings"
                :key="setting"
                class="badge badge-ghost badge-sm h-auto rounded-2xl py-1 text-[10px]"
              >
                {{ setting }}
              </span>
            </div>

            <p
              v-if="overlay.timestamp"
              class="text-[11px] text-base-content/60"
            >
              ArtJob #{{ currentJob?.id }}
              <span v-if="currentJob?.artImageId">
                · ArtImage #{{ currentJob.artImageId }}
              </span>
              · finished {{ slideFinishedAt }}
            </p>
          </footer>
        </transition>

        <div
          v-if="overlay.progress"
          class="absolute inset-x-0 bottom-0 h-1 bg-base-content/10"
        >
          <div
            class="h-full bg-primary transition-[width] duration-200 ease-linear"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>

        <transition name="kr-slideshow-slide">
          <aside
            v-if="settingsOpen"
            class="absolute inset-y-0 right-0 flex w-80 max-w-full flex-col gap-4 overflow-y-auto overscroll-contain border-l border-base-content/10 bg-base-100/95 p-4"
          >
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-black">Slideshow options</h3>
              <button
                type="button"
                class="kr-btn-ghost-xs-2xl"
                @click="settingsOpen = false"
              >
                Done
              </button>
            </div>

            <label class="flex flex-col gap-1">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Seconds per slide
              </span>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="intervalInput"
                  type="range"
                  min="1"
                  max="60"
                  class="range range-primary range-xs"
                  @change="applyInterval"
                />
                <input
                  v-model.number="intervalInput"
                  type="number"
                  min="1"
                  max="600"
                  class="input input-bordered input-xs w-20 rounded-xl"
                  @change="applyInterval"
                />
              </div>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="choice in intervalChoices"
                  :key="choice"
                  type="button"
                  class="btn btn-xs rounded-2xl"
                  :class="
                    intervalSeconds === choice ? 'btn-primary' : 'btn-ghost'
                  "
                  @click="selectInterval(choice)"
                >
                  {{ choice }}s
                </button>
              </div>
            </label>

            <label class="flex flex-col gap-1">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Random draw depth
              </span>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="choice in depthChoices"
                  :key="choice"
                  type="button"
                  class="btn btn-xs rounded-2xl"
                  :class="depth === choice ? 'btn-primary' : 'btn-ghost'"
                  @click="selectDepth(choice)"
                >
                  {{ choice }}
                </button>
              </div>
              <span class="text-[11px] text-base-content/50">
                Slides are drawn at random from the {{ depth }} most recent
                finished jobs, without repeating until the pool runs out.
              </span>
            </label>

            <label class="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                class="checkbox checkbox-sm mt-0.5"
                :checked="interruptOnArrival"
                @change="applyInterrupt"
              />
              <span class="flex flex-col">
                <span class="font-semibold">Cut to new art immediately</span>
                <span class="text-[11px] text-base-content/50">
                  Off: a finished render waits its turn and shows at the next
                  slide change instead of interrupting the current one.
                </span>
              </span>
            </label>

            <div class="flex flex-col gap-1">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Image fit
              </span>
              <div class="flex gap-1">
                <button
                  type="button"
                  class="btn btn-xs flex-1 rounded-2xl"
                  :class="fitMode === 'contain' ? 'btn-primary' : 'btn-ghost'"
                  @click="slideshowStore.setFitMode('contain')"
                >
                  Fit whole image
                </button>
                <button
                  type="button"
                  class="btn btn-xs flex-1 rounded-2xl"
                  :class="fitMode === 'cover' ? 'btn-primary' : 'btn-ghost'"
                  @click="slideshowStore.setFitMode('cover')"
                >
                  Fill screen
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Caption
              </span>
              <label
                v-for="field in overlayFields"
                :key="field.key"
                class="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm"
                  :checked="overlay[field.key]"
                  @change="applyOverlayField(field.key, $event)"
                />
                <span>{{ field.label }}</span>
              </label>
            </div>

            <div
              class="rounded-2xl border border-base-300 p-3 text-[11px] leading-relaxed text-base-content/60"
            >
              <span class="font-semibold text-base-content/80">Keys</span>
              <br />space play/pause · arrows previous/next · i caption · f
              fullscreen · s options · esc close
            </div>
          </aside>
        </transition>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArtJobStore } from '@/stores/artJobStore'
import { useArtStore } from '@/stores/artStore'
import {
  SLIDESHOW_DEPTH_CHOICES,
  SLIDESHOW_INTERVAL_CHOICES,
  useArtSlideshowStore,
  type SlideshowOverlayField,
} from '@/stores/artSlideshowStore'
import {
  artJobFileName,
  artJobImagePath,
  artJobImageVersion,
  artJobPrompt,
  artJobPublicImageSrc,
  artJobSettings,
  artJobTitle,
  artJobVisibility,
} from '@/utils/artJobFields'

const emit = defineEmits<{ close: [] }>()

const TICK_MS = 100
const CHROME_IDLE_MS = 2600
const ARRIVAL_POLL_MS = 15_000
const POOL_REFRESH_MS = 300_000
const ARRIVAL_FLASH_MS = 6000

const slideshowStore = useArtSlideshowStore()
const artJobStore = useArtJobStore()
const artStore = useArtStore()

const rootElement = ref<HTMLElement | null>(null)
const isPlaying = ref(true)
const settingsOpen = ref(false)
const isFullscreen = ref(false)
const chromeVisible = ref(true)
const showingArrival = ref(false)
const elapsedMs = ref(0)
const intervalInput = ref(slideshowStore.settings.intervalSeconds)

let tickTimer: ReturnType<typeof setInterval> | null = null
let arrivalTimer: ReturnType<typeof setInterval> | null = null
let poolTimer: ReturnType<typeof setInterval> | null = null
let chromeTimer: ReturnType<typeof setTimeout> | null = null
let arrivalFlashTimer: ReturnType<typeof setTimeout> | null = null

const overlayFields: Array<{ key: SlideshowOverlayField; label: string }> = [
  { key: 'title', label: 'Title, project, and engine' },
  { key: 'fileName', label: 'File name and destination path' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'settings', label: 'Model and generation settings' },
  { key: 'timestamp', label: 'Job id and finish time' },
  { key: 'progress', label: 'Timer bar' },
]

const depthChoices = SLIDESHOW_DEPTH_CHOICES
const intervalChoices = SLIDESHOW_INTERVAL_CHOICES

const currentJob = computed(() => slideshowStore.currentJob)
const overlay = computed(() => slideshowStore.settings.overlay)
const depth = computed(() => slideshowStore.settings.depth)
const intervalSeconds = computed(() => slideshowStore.settings.intervalSeconds)
const fitMode = computed(() => slideshowStore.settings.fitMode)
const interruptOnArrival = computed(
  () => slideshowStore.settings.interruptOnArrival,
)

const fitClass = computed(() =>
  fitMode.value === 'cover' ? 'object-cover' : 'object-contain',
)

const canShowSlide = computed<boolean>(() => {
  const job = currentJob.value
  if (!job) return false
  return !artJobVisibility(job).isMature || artStore.showMature
})

const slideSrc = computed<string>(() => {
  const job = currentJob.value
  if (!job || typeof job.artImageId !== 'number') return ''
  return (
    artJobPublicImageSrc(job) || artJobStore.imageSrcById[job.artImageId] || ''
  )
})

const slideKind = computed<string>(() => {
  const job = currentJob.value
  if (!job || typeof job.artImageId !== 'number') return 'image'
  if (artJobPublicImageSrc(job)) return 'image'
  return artJobStore.imageInfoById[job.artImageId]?.kind || 'image'
})

const slideKey = computed<string>(
  () => `${currentJob.value?.id ?? 0}:${slideSrc.value}`,
)
const slideTitle = computed<string>(() =>
  currentJob.value ? artJobTitle(currentJob.value) : '',
)
const slidePath = computed<string>(() =>
  currentJob.value ? artJobImagePath(currentJob.value) : '',
)
const slideFileName = computed<string>(() =>
  currentJob.value ? artJobFileName(currentJob.value) : '',
)
const slidePrompt = computed<string>(() =>
  currentJob.value ? artJobPrompt(currentJob.value) : '',
)
const slideSettings = computed<string[]>(() =>
  currentJob.value ? artJobSettings(currentJob.value) : [],
)
const slideFinishedAt = computed<string>(() => {
  const value = currentJob.value?.updatedAt || currentJob.value?.createdAt
  if (!value) return 'unknown'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'unknown'
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const anyOverlayVisible = computed<boolean>(() =>
  overlayFields.some((field) => overlay.value[field.key]),
)

const captionVisible = computed<boolean>(
  () =>
    Boolean(currentJob.value) &&
    overlayFields
      .filter((field) => field.key !== 'progress')
      .some((field) => overlay.value[field.key]),
)

const progressPercent = computed<number>(() => {
  const total = intervalSeconds.value * 1000
  if (total <= 0) return 0
  return Math.min(100, (elapsedMs.value / total) * 100)
})

const stageMessage = computed<string>(() => {
  if (slideshowStore.loadingPool) return 'Loading finished art...'
  if (slideshowStore.error) return 'Could not load the finished queue.'
  if (!slideshowStore.pool.length) return 'No finished art to show yet.'
  if (!canShowSlide.value) {
    return 'This render is marked mature and your account setting hides it.'
  }
  return 'Waiting for this render to load...'
})

function isViewable(job: typeof currentJob.value): boolean {
  if (!job) return false
  return !artJobVisibility(job).isMature || artStore.showMature
}

function markArrival(): void {
  showingArrival.value = true
  if (arrivalFlashTimer) clearTimeout(arrivalFlashTimer)
  arrivalFlashTimer = setTimeout(() => {
    showingArrival.value = false
  }, ARRIVAL_FLASH_MS)
}

function advanceSlide(): void {
  const wasArrival = slideshowStore.pendingArrivalCount > 0
  const attempts = Math.max(1, slideshowStore.pool.length)
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    slideshowStore.advance()
    if (isViewable(currentJob.value)) break
  }
  elapsedMs.value = 0
  if (wasArrival) markArrival()
  else showingArrival.value = false
  void loadProtectedSlide()
}

async function loadProtectedSlide(): Promise<void> {
  const job = currentJob.value
  if (!job || typeof job.artImageId !== 'number') return
  if (artJobPublicImageSrc(job)) return
  if (!isViewable(job)) return
  await artJobStore.loadJobImage(job.artImageId, artJobImageVersion(job))
}

function nextSlide(): void {
  advanceSlide()
}

function previousSlide(): void {
  slideshowStore.stepBack()
  elapsedMs.value = 0
  showingArrival.value = false
  void loadProtectedSlide()
}

function togglePlaying(): void {
  isPlaying.value = !isPlaying.value
  elapsedMs.value = 0
  wakeChrome()
}

function toggleAllOverlay(): void {
  slideshowStore.setAllOverlayFields(!anyOverlayVisible.value)
}

function applyOverlayField(field: SlideshowOverlayField, event: Event): void {
  const target = event.target as HTMLInputElement | null
  slideshowStore.setOverlayField(field, Boolean(target?.checked))
}

function applyInterrupt(event: Event): void {
  const target = event.target as HTMLInputElement | null
  slideshowStore.setInterruptOnArrival(Boolean(target?.checked))
}

function applyInterval(): void {
  slideshowStore.setIntervalSeconds(intervalInput.value)
  intervalInput.value = slideshowStore.settings.intervalSeconds
  elapsedMs.value = 0
}

function selectInterval(seconds: number): void {
  intervalInput.value = seconds
  applyInterval()
}

async function selectDepth(value: number): Promise<void> {
  await slideshowStore.setDepth(value)
}

function wakeChrome(): void {
  chromeVisible.value = true
  if (chromeTimer) clearTimeout(chromeTimer)
  chromeTimer = setTimeout(() => {
    if (settingsOpen.value || !isPlaying.value) return
    chromeVisible.value = false
  }, CHROME_IDLE_MS)
}

async function toggleFullscreen(): Promise<void> {
  if (!import.meta.client) return
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await rootElement.value?.requestFullscreen()
  } catch {
    isFullscreen.value = Boolean(document.fullscreenElement)
  }
}

function syncFullscreen(): void {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

function close(): void {
  if (import.meta.client && document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined)
  }
  emit('close')
}

function handleKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

  switch (event.key) {
    case ' ':
    case 'Spacebar':
      event.preventDefault()
      togglePlaying()
      break
    case 'ArrowRight':
    case 'n':
      event.preventDefault()
      nextSlide()
      break
    case 'ArrowLeft':
    case 'p':
      event.preventDefault()
      previousSlide()
      break
    case 'i':
      toggleAllOverlay()
      break
    case 'f':
      void toggleFullscreen()
      break
    case 's':
      settingsOpen.value = !settingsOpen.value
      break
    case 'Escape':
      if (document.fullscreenElement) return
      close()
      break
    default:
      break
  }
  wakeChrome()
}

watch(
  () => slideshowStore.pendingArrivalCount,
  (count, previous) => {
    if (!count || previous !== 0 || !interruptOnArrival.value) return
    advanceSlide()
  },
)

watch(settingsOpen, (open) => {
  if (open) wakeChrome()
})

watch(canShowSlide, (viewable) => {
  if (!viewable && slideshowStore.pool.length > 1) advanceSlide()
})

onMounted(async () => {
  slideshowStore.initialize()
  intervalInput.value = slideshowStore.settings.intervalSeconds
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', syncFullscreen)

  await toggleFullscreen()
  syncFullscreen()
  wakeChrome()

  await slideshowStore.refreshPool()
  if (!isViewable(currentJob.value)) advanceSlide()
  void loadProtectedSlide()

  tickTimer = setInterval(() => {
    if (!isPlaying.value) return
    elapsedMs.value += TICK_MS
    if (elapsedMs.value >= intervalSeconds.value * 1000) advanceSlide()
  }, TICK_MS)

  arrivalTimer = setInterval(() => {
    void slideshowStore.pollArrivals()
  }, ARRIVAL_POLL_MS)

  poolTimer = setInterval(() => {
    void slideshowStore.refreshPool()
  }, POOL_REFRESH_MS)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', syncFullscreen)
  if (tickTimer) clearInterval(tickTimer)
  if (arrivalTimer) clearInterval(arrivalTimer)
  if (poolTimer) clearInterval(poolTimer)
  if (chromeTimer) clearTimeout(chromeTimer)
  if (arrivalFlashTimer) clearTimeout(arrivalFlashTimer)
})
</script>

<style scoped>
.kr-slideshow-fade-enter-active,
.kr-slideshow-fade-leave-active {
  transition: opacity 400ms ease;
}

.kr-slideshow-fade-enter-from,
.kr-slideshow-fade-leave-to {
  opacity: 0;
}

.kr-slideshow-slide-enter-active,
.kr-slideshow-slide-leave-active {
  transition: transform 200ms ease;
}

.kr-slideshow-slide-enter-from,
.kr-slideshow-slide-leave-to {
  transform: translateX(100%);
}
</style>

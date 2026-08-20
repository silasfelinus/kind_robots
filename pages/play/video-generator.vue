<template>
  <div class="kr-surface">
    <div class="kr-scroll mx-auto max-w-7xl space-y-6 p-6">
      <header class="space-y-1">
        <p class="text-sm opacity-70">
          Animate a still into a short clip. Presets choose sensible studio
          settings, while every generation control remains editable.
        </p>
      </header>

      <div v-if="!isLoggedIn" class="alert alert-warning text-sm" role="alert">
        You need to be signed in to queue a clip — generation is billed to your
        account's mana.
      </div>

      <section class="space-y-2">
        <label class="font-semibold">Engine</label>
        <div class="flex gap-2">
          <button
            v-for="opt in engines"
            :key="opt.value"
            type="button"
            class="btn btn-sm"
            :class="engine === opt.value ? 'btn-accent' : 'btn-outline'"
            @click="selectEngine(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="text-xs opacity-60">{{ activeEngine.hint }}</p>
      </section>

      <section class="space-y-2">
        <div class="flex items-center justify-between gap-3">
          <label class="font-semibold">Preset</label>
          <span
            v-if="videoPresetId === defaultPreset.id"
            class="badge badge-accent badge-sm"
          >
            Studio default
          </span>
        </div>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            class="btn h-auto min-h-0 justify-start py-3 text-left"
            :class="videoPresetId === '' ? 'btn-accent' : 'btn-outline'"
            @click="selectVideoPreset('')"
          >
            <span class="flex flex-col items-start">
              <span class="font-semibold">Custom</span>
              <span class="text-xs font-normal opacity-70">
                Keep the current values and tune them manually.
              </span>
            </span>
          </button>
          <button
            v-for="preset in availableVideoPresets"
            :key="preset.id"
            type="button"
            class="btn h-auto min-h-0 justify-start py-3 text-left"
            :class="videoPresetId === preset.id ? 'btn-accent' : 'btn-outline'"
            @click="selectVideoPreset(preset.id)"
          >
            <span class="flex flex-col items-start gap-1">
              <span class="flex items-center gap-2 font-semibold">
                {{ preset.label }}
                <span
                  v-if="preset.id === defaultPreset.id"
                  class="badge badge-xs badge-accent"
                >
                  default
                </span>
              </span>
              <span class="text-xs font-normal opacity-70">
                {{ preset.description }}
              </span>
            </span>
          </button>
        </div>
        <p class="text-xs opacity-60">
          Presets fill the controls below. Any value can still be changed for
          this render.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <div class="space-y-2 rounded-lg border border-base-300 p-3">
          <div class="flex items-center justify-between">
            <label class="font-semibold">
              First image <span class="text-error">*</span>
            </label>
            <button
              type="button"
              class="btn btn-xs btn-outline"
              @click="useLogoAsFirst"
            >
              Use logo
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            class="file-input file-input-bordered file-input-sm w-full"
            @change="(e) => onFileChange(e, 'first')"
          />
          <div
            v-if="firstImage"
            class="relative flex aspect-video items-center justify-center overflow-hidden rounded bg-base-200"
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
              @click="firstImage = ''"
            >
              ✕
            </button>
          </div>
          <p v-else class="text-xs opacity-50">
            Required — the clip starts from this frame.
          </p>
        </div>

        <div class="space-y-2 rounded-lg border border-base-300 p-3">
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
            v-if="secondImage"
            class="relative flex aspect-video items-center justify-center overflow-hidden rounded bg-base-200"
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
          <p v-else class="text-xs opacity-50">
            If set, the clip morphs from the first image to this one.
          </p>
        </div>
      </section>

      <section class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="font-semibold">Motion prompt</label>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            @click="prompt = WINK_PRESET"
          >
            ✨ Wink &amp; grin preset
          </button>
        </div>
        <textarea
          v-model="prompt"
          rows="3"
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

      <video-lora-picker v-model="loraPicks" :engine="engine" />

      <content-visibility-controls
        v-model:is-mature="isMature"
        v-model:is-public="isPublic"
        :disabled="videoStore.isBusy"
      />

      <section class="space-y-2">
        <label class="font-semibold">Output format</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in outputFormats"
            :key="opt.value"
            type="button"
            class="btn btn-sm"
            :class="outputFormat === opt.value ? 'btn-accent' : 'btn-outline'"
            @click="outputFormat = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <p class="text-xs opacity-60">{{ activeOutputFormat.hint }}</p>
      </section>

      <section class="grid gap-4 sm:grid-cols-3">
        <div class="space-y-1">
          <label class="text-sm font-semibold">Time (seconds)</label>
          <input
            v-model.number="durationSeconds"
            type="number"
            min="0.5"
            max="30"
            step="0.5"
            class="input input-bordered w-full"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-semibold">FPS</label>
          <input
            v-model.number="fps"
            type="number"
            min="1"
            max="60"
            step="1"
            class="input input-bordered w-full"
          />
        </div>
        <div class="space-y-1">
          <label class="text-sm font-semibold">Loop</label>
          <label class="flex h-12 cursor-pointer items-center gap-2">
            <input
              v-model="loop"
              type="checkbox"
              class="toggle toggle-accent"
            />
            <span class="text-sm opacity-70">
              {{ loop ? 'Seamless loop' : 'Play once' }}
            </span>
          </label>
        </div>
      </section>

      <details class="text-sm">
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
              class="input input-bordered input-sm w-full"
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
              class="input input-bordered input-sm w-full"
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
              class="input input-bordered input-sm w-full"
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

      <div class="alert text-sm" :class="runtimeAlertClass" role="status">
        <div class="space-y-1">
          <p class="font-semibold">{{ runtimeTitle }}</p>
          <p>{{ runtimeMessage }}</p>
          <p v-if="selectedPreset?.runtimeHint" class="text-xs opacity-75">
            {{ selectedPreset.runtimeHint }}
          </p>
        </div>
      </div>

      <section class="space-y-3">
        <button
          type="button"
          class="btn btn-accent btn-lg w-full"
          :disabled="!canGenerate"
          @click="generate"
        >
          <span
            v-if="videoStore.isBusy"
            class="loading loading-spinner loading-sm"
          />
          {{ generateLabel }}
        </button>

        <div
          v-if="videoStore.state.message"
          class="text-center text-sm opacity-70"
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

      <section v-if="videoStore.state.videoSrc" class="space-y-2">
        <h2 class="font-semibold">Result</h2>
        <img
          v-if="videoStore.resultIsImage"
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
          :href="videoStore.state.videoSrc"
          :download="downloadFilename"
          class="btn btn-sm btn-outline"
        >
          ⬇ Download clip
        </a>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useResourceStore } from '@/stores/resourceStore'
import { useVideoStore } from '@/stores/videoStore'
import { useUserStore } from '@/stores/userStore'
import {
  promptWithLoraTriggers,
  type LoraPick,
} from '@/utils/loraSelection'
import {
  estimateVideoRuntimeTier,
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
    hint: 'Animated image, loops natively — smallest file and best default for short web clips.',
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
const outputFormat = ref<VideoOutputFormat>(initialPreset.outputFormat)
const firstImage = ref('')
const secondImage = ref('')
const prompt = ref(WINK_PRESET)
const negativePrompt = ref('')
const loraPicks = ref<LoraPick[]>([])
const isMature = ref(false)
const isPublic = ref(true)
const durationSeconds = ref(initialPreset.durationSeconds)
const fps = ref(initialPreset.fps)
const loop = ref(initialPreset.loop)
const width = ref(initialPreset.width)
const height = ref(initialPreset.height)
const renderScale = ref(initialPreset.renderScale)
const latentUpscaleModel = ref<string | null>(initialPreset.latentUpscaleModel)
const refineSampler = ref<string | null>(initialPreset.refineSampler)
const refineSigmas = ref<string | null>(initialPreset.refineSigmas)
const seedInput = ref<number | string>('')

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
const runtimeAlertClass = computed(() =>
  runtimeTier.value === 'slow' || runtimeTier.value === 'very-slow'
    ? 'alert-warning'
    : 'alert-info',
)
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
    !videoStore.isBusy &&
    !!firstImage.value &&
    !!prompt.value.trim() &&
    width.value >= 64 &&
    height.value >= 64 &&
    durationSeconds.value > 0 &&
    fps.value > 0,
)
const generateLabel = computed(() => {
  if (videoStore.state.status === 'queued') return 'Queued…'
  if (videoStore.state.status === 'rendering') return 'Rendering…'
  if (runtimeTier.value === 'very-slow') {
    return `Generate ${engine.value.toUpperCase()} clip — very slow`
  }
  if (runtimeTier.value === 'slow') {
    return `Generate ${engine.value.toUpperCase()} clip — slow`
  }
  return `Generate ${engine.value.toUpperCase()} clip`
})

function applyPreset(preset: NonNullable<ReturnType<typeof getVideoPreset>>): void {
  videoPresetId.value = preset.id
  width.value = preset.width
  height.value = preset.height
  durationSeconds.value = preset.durationSeconds
  fps.value = preset.fps
  loop.value = preset.loop
  outputFormat.value = preset.outputFormat
  renderScale.value = preset.renderScale
  latentUpscaleModel.value = preset.latentUpscaleModel
  refineSampler.value = preset.refineSampler
  refineSigmas.value = preset.refineSigmas
}

function selectEngine(nextEngine: VideoEngine): void {
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
  if (slot === 'first') firstImage.value = dataUrl
  else secondImage.value = dataUrl
}

async function useLogoAsFirst() {
  try {
    const res = await fetch(LOGO_SRC)
    const blob = await res.blob()
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

  await videoStore.generate({
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
    isMature: isMature.value,
    isPublic: isPublic.value,
  })
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-5xl mx-auto">
    <header class="space-y-1">
      <h1 class="text-2xl font-bold">🎬 Video Generator</h1>
      <p class="text-sm opacity-70">
        Animate a still into a short clip. Pick a first image (and an optional
        end image), describe the motion, set the length, and queue it to the
        Comfy studio engine.
      </p>
    </header>

    <div v-if="!isLoggedIn" class="alert alert-warning text-sm" role="alert">
      You need to be signed in to queue a clip — generation is billed to your
      account's mana.
    </div>

    <!-- Engine selector -->
    <section class="space-y-2">
      <label class="font-semibold">Engine</label>
      <div class="flex gap-2">
        <button
          v-for="opt in engines"
          :key="opt.value"
          type="button"
          class="btn btn-sm"
          :class="engine === opt.value ? 'btn-accent' : 'btn-outline'"
          @click="engine = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
      <p class="text-xs opacity-60">{{ activeEngine.hint }}</p>
    </section>

    <!-- Images -->
    <section class="grid gap-4 md:grid-cols-2">
      <!-- First image (required) -->
      <div class="space-y-2 p-3 rounded-lg border border-base-300">
        <div class="flex items-center justify-between">
          <label class="font-semibold"
            >First image <span class="text-error">*</span></label
          >
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
          class="file-input file-input-sm file-input-bordered w-full"
          @change="(e) => onFileChange(e, 'first')"
        />
        <div
          v-if="firstImage"
          class="relative aspect-video bg-base-200 rounded overflow-hidden flex items-center justify-center"
        >
          <img :src="firstImage" class="max-h-full max-w-full object-contain" />
          <button
            type="button"
            class="btn btn-xs btn-circle btn-error absolute top-1 right-1"
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

      <!-- Second image (optional) -->
      <div class="space-y-2 p-3 rounded-lg border border-base-300">
        <label class="font-semibold"
          >End image <span class="opacity-50">(optional)</span></label
        >
        <input
          type="file"
          accept="image/*"
          class="file-input file-input-sm file-input-bordered w-full"
          @change="(e) => onFileChange(e, 'second')"
        />
        <div
          v-if="secondImage"
          class="relative aspect-video bg-base-200 rounded overflow-hidden flex items-center justify-center"
        >
          <img
            :src="secondImage"
            class="max-h-full max-w-full object-contain"
          />
          <button
            type="button"
            class="btn btn-xs btn-circle btn-error absolute top-1 right-1"
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

    <!-- Prompt -->
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
          class="textarea textarea-bordered w-full mt-2"
          placeholder="Leave blank for the sensible default."
        />
      </details>
    </section>

    <!-- Controls -->
    <section class="grid gap-4 sm:grid-cols-3">
      <div class="space-y-1">
        <label class="font-semibold text-sm">Time (seconds)</label>
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
        <label class="font-semibold text-sm">FPS</label>
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
        <label class="font-semibold text-sm">Loop</label>
        <label class="cursor-pointer flex items-center gap-2 h-12">
          <input v-model="loop" type="checkbox" class="toggle toggle-accent" />
          <span class="text-sm opacity-70">{{
            loop ? 'Seamless loop' : 'Play once'
          }}</span>
        </label>
      </div>
    </section>

    <details class="text-sm">
      <summary class="cursor-pointer opacity-70">
        Advanced (size &amp; seed)
      </summary>
      <div class="grid gap-4 sm:grid-cols-3 mt-2">
        <div class="space-y-1">
          <label class="text-sm">Width</label>
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
          <label class="text-sm">Height</label>
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
          <label class="text-sm">Seed (blank = random)</label>
          <input
            v-model="seedInput"
            type="number"
            min="0"
            class="input input-bordered input-sm w-full"
          />
        </div>
      </div>
      <p class="text-xs opacity-50 mt-1">
        Estimated frames: {{ estimatedFrames }} ({{ durationSeconds }}s ×
        {{ fps }}fps)
      </p>
    </details>

    <!-- Generate -->
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
        class="text-sm opacity-70 text-center"
      >
        {{ videoStore.state.message }}
        <span v-if="videoStore.state.jobId" class="opacity-50">
          (job #{{ videoStore.state.jobId }})
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

    <!-- Result -->
    <section v-if="videoStore.state.videoSrc" class="space-y-2">
      <h2 class="font-semibold">Result</h2>
      <video
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
        download="kindrobots-clip"
        class="btn btn-sm btn-outline"
      >
        ⬇ Download clip
      </a>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVideoStore } from '@/stores/videoStore'
import { useUserStore } from '@/stores/userStore'

const LOGO_SRC = '/images/kindlogo_new.webp'

// The launch-gif test case: animate the feminine robot on the right.
const WINK_PRESET =
  'The feminine kind robot on the right winks one eye and breaks into a warm, playful grin. Subtle head tilt, sparkling eyes, smooth natural motion, charming and friendly. The rest of the logo stays still.'

const videoStore = useVideoStore()
const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)

const engines = [
  {
    value: 'ltx' as const,
    label: 'LTX',
    hint: 'LTX 2.3 — fast, expressive motion. Great default for short gifs.',
  },
  {
    value: 'wan' as const,
    label: 'WAN',
    hint: 'WAN 2.x — smooth image-to-video, supports first→last frame morphs.',
  },
]

const engine = ref<'ltx' | 'wan'>('ltx')
const activeEngine = computed(
  () => engines.find((e) => e.value === engine.value) ?? engines[0]!,
)

const firstImage = ref('')
const secondImage = ref('')
const prompt = ref(WINK_PRESET)
const negativePrompt = ref('')
const durationSeconds = ref(4)
const fps = ref(24)
const loop = ref(true)
const width = ref<number | null>(null)
const height = ref<number | null>(null)
const seedInput = ref<number | string>('')

const estimatedFrames = computed(() =>
  Math.max(2, Math.round((durationSeconds.value || 0) * (fps.value || 0)) + 1),
)

const canGenerate = computed(
  () =>
    isLoggedIn.value &&
    !videoStore.isBusy &&
    !!firstImage.value &&
    !!prompt.value.trim(),
)

const generateLabel = computed(() => {
  if (videoStore.state.status === 'queued') return 'Queued…'
  if (videoStore.state.status === 'rendering') return 'Rendering…'
  return `Generate ${engine.value.toUpperCase()} clip`
})

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

// Fetch the bundled logo and inline it as a data URL so it enqueues like any
// uploaded image.
async function useLogoAsFirst() {
  try {
    const res = await fetch(LOGO_SRC)
    const blob = await res.blob()
    firstImage.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    // Fall back to the path; the enqueue endpoint also accepts data URLs only,
    // so surface a friendly hint if the fetch failed.
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

  await videoStore.generate({
    engine: engine.value,
    promptString: prompt.value.trim(),
    negativePrompt: negativePrompt.value.trim() || undefined,
    firstImageBase64: firstImage.value,
    secondImageBase64: secondImage.value || null,
    durationSeconds: durationSeconds.value,
    fps: fps.value,
    loop: loop.value,
    width: width.value,
    height: height.value,
    seed,
  })
}
</script>

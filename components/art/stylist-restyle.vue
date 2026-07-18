<!-- /components/art/stylist-restyle.vue -->
<!--
  Hair Studio restyler (Superkate) — upload or snap a client photo, choose color /
  style / enhance (any combination), and send it through the Kind Robots Kontext
  queue to get the same photo back with new hair. Hosted inside the /stylist suite
  (stylist-manager.vue) alongside the calculator, clients, and history views.

  Job state and past looks live in stylistStore, so a styling job keeps running (and
  its result still lands) even if Superkate leaves the /stylist tab and comes back.
  Results are saved private (isPublic:false) and tagged per client. See conductor
  superkate-hairstyle-ai t-007 (navigable async) and t-008 (durable per-client gallery).
-->
<template>
  <section
    class="stylist-restyle flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="flex items-center gap-2">
      <Icon name="kind-icon:magic" class="h-5 w-5 text-primary" />
      <h2 class="text-base font-black text-base-content">Hair Studio</h2>
      <span class="badge badge-primary badge-sm">Kontext</span>
      <span class="badge badge-ghost badge-sm">Private</span>
      <div class="flex-1" />
      <span
        v-if="stylist.isBusy"
        class="flex items-center gap-1 text-xs font-semibold text-primary"
      >
        <span class="loading loading-spinner loading-xs" />
        {{ stylist.pendingCount }} styling…
      </span>
    </header>

    <!-- Client -->
    <div class="rounded-xl border border-base-300 bg-base-100 p-3">
      <label class="flex flex-col gap-1">
        <span class="text-xs font-black text-base-content">Client</span>
        <input
          v-model="clientName"
          type="text"
          list="stylist-client-suggestions"
          placeholder="Whose hair are we styling?"
          class="input input-sm input-bordered w-full"
        />
        <datalist id="stylist-client-suggestions">
          <option
            v-for="customer in superkate.sortedCustomers"
            :key="customer.id"
            :value="customer.name"
          />
        </datalist>
      </label>
    </div>

    <!-- Source image -->
    <div class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-3">
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:image" class="h-4 w-4 text-primary" />
        <span class="text-xs font-black text-base-content">Client Photo</span>
        <div class="flex-1" />
        <div class="flex overflow-hidden rounded-lg border border-base-300 text-xs">
          <button
            type="button"
            class="px-2.5 py-1 font-bold transition"
            :class="sourceTab === 'upload' ? 'bg-primary text-primary-content' : 'bg-base-100 text-base-content/60 hover:bg-base-200'"
            :aria-pressed="sourceTab === 'upload'"
            @click="sourceTab = 'upload'"
          >
            Upload
          </button>
          <button
            type="button"
            class="px-2.5 py-1 font-bold transition"
            :class="sourceTab === 'camera' ? 'bg-primary text-primary-content' : 'bg-base-100 text-base-content/60 hover:bg-base-200'"
            :aria-pressed="sourceTab === 'camera'"
            @click="openCamera"
          >
            Camera
          </button>
        </div>
      </div>

      <!-- Upload -->
      <div
        v-show="sourceTab === 'upload' && !sourceImageData"
        role="button"
        tabindex="0"
        aria-label="Upload a client photo"
        class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center text-xs transition"
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/60'"
        @click="fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @keydown.enter.space.prevent="fileInput?.click()"
      >
        <Icon name="kind-icon:upload" class="h-6 w-6 text-base-content/50" />
        <span class="font-bold text-base-content/70">Drop a photo or click to browse</span>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />
      </div>

      <!-- Camera -->
      <div v-show="sourceTab === 'camera' && cameraActive" class="flex flex-col items-center gap-2">
        <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
        <video ref="videoEl" autoplay playsinline class="max-h-64 w-full rounded-lg bg-black object-contain" />
        <div class="flex gap-2">
          <button type="button" class="btn btn-primary btn-sm" @click="capturePhoto">
            <Icon name="kind-icon:camera" class="h-4 w-4" /> Capture
          </button>
          <button type="button" class="btn btn-ghost btn-sm" @click="closeCamera">Cancel</button>
        </div>
      </div>

      <!-- Preview -->
      <div v-if="sourceImageData" class="relative">
        <img :src="sourceImageData" alt="Client photo" class="max-h-64 w-full rounded-lg object-contain" />
        <button
          type="button"
          class="btn btn-circle btn-error btn-xs absolute right-2 top-2"
          title="Remove photo"
          @click="clearSource"
        >
          <Icon name="mdi:close" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- What to change -->
    <div class="flex flex-col gap-3 rounded-xl border border-base-300 bg-base-100 p-3">
      <span class="text-xs font-black text-base-content">What are we changing?</span>

      <label class="flex items-start gap-2">
        <input v-model="changeColor" type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-1" />
        <div class="flex flex-1 flex-col gap-1">
          <span class="text-sm font-bold">Change color</span>
          <input
            v-model="colorValue"
            :disabled="!changeColor"
            type="text"
            placeholder="e.g. warm copper, ash blonde, deep violet"
            class="input input-xs input-bordered w-full"
          />
        </div>
      </label>

      <label class="flex items-start gap-2">
        <input v-model="changeStyle" type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-1" />
        <div class="flex flex-1 flex-col gap-1">
          <span class="text-sm font-bold">Change style</span>
          <input
            v-model="styleValue"
            :disabled="!changeStyle"
            type="text"
            placeholder="e.g. shoulder-length curtain bangs, sleek bob, beachy waves"
            class="input input-xs input-bordered w-full"
          />
        </div>
      </label>

      <label class="flex items-start gap-2">
        <input v-model="enhanceImage" type="checkbox" class="checkbox checkbox-sm checkbox-primary mt-1" />
        <div class="flex flex-1 flex-col gap-1">
          <span class="text-sm font-bold">Improve the overall image</span>
          <span class="text-xs text-base-content/50">Cleaner lighting, sharper detail — face and identity kept.</span>
        </div>
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-bold text-base-content/70">Extra notes (optional)</span>
        <input
          v-model="extraNotes"
          type="text"
          placeholder="Anything else Superkate wants to try"
          class="input input-xs input-bordered w-full"
        />
      </label>

      <p v-if="changeSummary" class="rounded-lg bg-base-200 p-2 text-xs text-base-content/70">
        {{ changeSummary }}
      </p>
    </div>

    <!-- How much to keep them looking like themselves -->
    <div class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-black text-base-content">How much should it still look like them?</span>
        <span class="text-xs font-bold text-primary">{{ preserveLabel }}</span>
      </div>
      <input
        v-model.number="preserveStrength"
        type="range"
        min="0"
        max="0.8"
        step="0.05"
        class="range range-primary range-xs"
      />
      <div class="flex justify-between text-[10px] text-base-content/50">
        <span>Bolder change</span>
        <span>Keep it them</span>
      </div>
      <label class="flex items-start gap-2 pt-1">
        <input v-model="protectIdentity" type="checkbox" class="checkbox checkbox-xs checkbox-primary mt-0.5" />
        <span class="text-xs text-base-content/70">
          Extra-protect the face &amp; identity (a little slower — guards against turning
          them into someone else)
        </span>
      </label>
      <button
        type="button"
        class="text-left text-[11px] text-base-content/50 underline"
        :aria-expanded="advancedOpen"
        @click="advancedOpen = !advancedOpen"
      >
        {{ advancedOpen ? 'Hide' : 'Show' }} advanced settings
      </button>
      <div v-if="advancedOpen" class="grid grid-cols-2 gap-2">
        <label class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-base-content/60">Prompt strength (guidance)</span>
          <input
            v-model.number="guidanceValue"
            type="number"
            min="1"
            max="6"
            step="0.5"
            class="input input-xs input-bordered w-full"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-base-content/60">Steps</span>
          <input
            v-model.number="stepsValue"
            type="number"
            min="8"
            max="40"
            step="1"
            class="input input-xs input-bordered w-full"
          />
        </label>
      </div>
    </div>

    <!-- Action -->
    <button
      type="button"
      class="btn btn-primary btn-sm"
      :disabled="!canGenerate"
      @click="submit"
    >
      <Icon name="kind-icon:magic" class="h-4 w-4" />
      Style it
    </button>

    <p class="text-center text-xs text-base-content/50">
      Styling takes a minute or two — you can keep working or switch tabs; results land below when ready.
    </p>

    <div
      v-if="isFirstRun"
      class="flex flex-col gap-1 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-base-content/70"
    >
      <span class="font-black text-primary">First time in the studio?</span>
      <span>
        1. Add or snap a client photo &nbsp;2. Tick color, style, and/or cleanup
        &nbsp;3. Style it — the new look appears beside the original, and every
        finished look is saved privately to that client's Past looks.
      </span>
    </div>

    <!-- This session's jobs -->
    <div v-if="visibleJobs.length" class="flex flex-col gap-2">
      <span class="text-xs font-black text-base-content">
        {{ clientName.trim() ? `Styling ${clientName.trim()}` : 'This session' }}
      </span>
      <p
        v-if="hasStalledQueue"
        class="rounded-lg bg-warning/10 p-2 text-xs text-warning"
      >
        A job has been waiting over a minute without the studio engine picking
        it up — the home relay is probably offline or needs its update. The job
        stays queued and finishes once the engine is back.
      </p>
      <div class="grid gap-3 sm:grid-cols-2">
        <article
          v-for="job in visibleJobs"
          :key="job.id"
          class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
        >
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold">{{ job.client || 'Unnamed client' }}</span>
            <span
              v-if="job.status === 'pending'"
              class="badge badge-xs gap-1"
              :class="job.queueState === 'rendering' ? 'badge-info' : 'badge-warning'"
              :title="
                job.queueState === 'rendering'
                  ? 'The studio engine is painting'
                  : 'Waiting for the studio engine to pick this up'
              "
            >
              <span class="loading loading-spinner loading-xs" />
              {{ job.queueState === 'rendering' ? 'rendering' : 'queued' }}
            </span>
            <span v-else-if="job.status === 'failed'" class="badge badge-error badge-xs">failed</span>
            <span v-else class="badge badge-success badge-xs">done</span>
            <div class="flex-1" />
            <button
              v-if="job.status === 'failed'"
              type="button"
              class="btn btn-ghost btn-xs"
              @click="stylist.retryJob(job.id)"
            >
              Retry
            </button>
            <button
              type="button"
              class="btn btn-circle btn-ghost btn-xs"
              title="Dismiss"
              @click="stylist.dismissJob(job.id)"
            >
              <Icon name="mdi:close" class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-1">
            <figure class="flex flex-col gap-1">
              <img :src="job.before" alt="Before" class="aspect-square w-full rounded-lg object-cover" />
              <figcaption class="text-center text-[10px] text-base-content/50">Before</figcaption>
            </figure>
            <figure class="flex flex-col gap-1">
              <img
                v-if="job.after"
                :src="job.after"
                alt="After"
                class="aspect-square w-full rounded-lg object-cover"
              />
              <div
                v-else
                class="flex aspect-square w-full items-center justify-center rounded-lg bg-base-200"
              >
                <span v-if="job.status === 'pending'" class="loading loading-spinner text-primary" />
                <Icon v-else name="mdi:image-broken" class="h-6 w-6 text-base-content/30" />
              </div>
              <figcaption class="text-center text-[10px] text-base-content/50">After</figcaption>
            </figure>
          </div>
          <p v-if="job.error" class="text-[10px] font-semibold text-error">{{ job.error }}</p>
          <p v-else class="line-clamp-2 text-[10px] text-base-content/50" :title="job.prompt">
            {{ job.prompt }}
          </p>
        </article>
      </div>
    </div>

    <!-- Durable per-client history -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="text-xs font-black text-base-content">
          {{ clientName.trim() ? `Past looks for ${clientName.trim()}` : 'Past looks' }}
        </span>
        <span v-if="stylist.isLoadingHistory" class="loading loading-spinner loading-xs text-primary" />
        <div class="flex-1" />
        <button type="button" class="btn btn-ghost btn-xs" @click="stylist.loadHistory(true)">
          Refresh
        </button>
      </div>
      <p v-if="stylist.historyError" class="text-xs text-error">{{ stylist.historyError }}</p>
      <p
        v-else-if="!clientHistory.length && !stylist.isLoadingHistory"
        class="text-xs text-base-content/40"
      >
        No saved looks yet{{ clientName.trim() ? ' for this client' : '' }}.
      </p>
      <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <figure
          v-for="image in clientHistory"
          :key="image.id"
          class="flex flex-col gap-1"
        >
          <!-- Tap to flip between the result and its saved before photo. -->
          <button
            type="button"
            class="relative block w-full"
            :disabled="!stylist.beforeFor(image.id)"
            :title="stylist.beforeFor(image.id) ? 'Tap to compare before/after' : ''"
            @click="toggleCompare(image.id)"
          >
            <img
              :src="
                comparing[image.id] && stylist.beforeFor(image.id)
                  ? stylist.beforeFor(image.id)
                  : historyImageSrc(image)
              "
              :alt="`Look for ${clientFromDesigner(image.designer) || 'client'}`"
              class="aspect-square w-full rounded-lg object-cover"
            />
            <span
              v-if="stylist.beforeFor(image.id)"
              class="badge badge-xs absolute left-1 top-1"
              :class="comparing[image.id] ? 'badge-neutral' : 'badge-primary'"
            >
              {{ comparing[image.id] ? 'Before' : 'After' }}
            </span>
          </button>
          <figcaption
            v-if="!clientName.trim()"
            class="truncate text-center text-[10px] text-base-content/50"
          >
            {{ clientFromDesigner(image.designer) || 'client' }}
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  useStylistStore,
  clientFromDesigner,
} from '@/stores/stylistStore'
import { useSuperkateStore } from '@/stores/superkateStore'
import type { ArtImage } from '~/prisma/generated/prisma/client'

const stylist = useStylistStore()
const superkate = useSuperkateStore()

const clientName = ref('')

const sourceTab = ref<'upload' | 'camera'>('upload')
const sourceImageData = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const videoEl = ref<HTMLVideoElement | null>(null)
const cameraActive = ref(false)
let cameraStream: MediaStream | null = null

const changeColor = ref(false)
const colorValue = ref('')
const changeStyle = ref(false)
const styleValue = ref('')
const enhanceImage = ref(false)
const extraNotes = ref('')

// Identity/quality controls. preserveStrength is the "weight from the original
// picture": 0 fully reimagines (legacy Kontext), higher keeps the client's own
// face/framing. Defaults lean toward preservation — the studio's complaint was
// over-modification. All are live-tunable per render.
const preserveStrength = ref(0.3)
const protectIdentity = ref(false)
const advancedOpen = ref(false)
const guidanceValue = ref(2.5)
const stepsValue = ref(20)

const IDENTITY_NEGATIVE =
  'different person, changed facial features, changed identity, distorted face, ' +
  'deformed, disfigured, extra fingers, plastic skin, over-smoothed skin, ' +
  'lowres, blurry, watermark, text'

const preserveLabel = computed(() => {
  if (preserveStrength.value <= 0.1) return 'Bold'
  if (preserveStrength.value >= 0.5) return 'Very close'
  return 'Balanced'
})

const hasAnyChange = computed(
  () => changeColor.value || changeStyle.value || enhanceImage.value,
)

const canGenerate = computed(
  () => !!sourceImageData.value && hasAnyChange.value,
)

const visibleJobs = computed(() => stylist.jobsForClient(clientName.value))

// The typed client's record in the synced book, when it exists — id-tagging
// styled photos makes their history grouping survive client renames.
const bookClient = computed(() => superkate.customerByName(clientName.value))

const clientHistory = computed(() =>
  stylist.historyForClient(clientName.value, bookClient.value?.id ?? null),
)

const isFirstRun = computed(
  () =>
    !visibleJobs.value.length &&
    !stylist.history.length &&
    !stylist.isLoadingHistory,
)

// Ticks every 10s so the stalled-queue warning can appear without a reload.
const now = ref(Date.now())
let nowTimer: ReturnType<typeof setInterval> | null = null

const STALL_AFTER_MS = 60_000

const hasStalledQueue = computed(() =>
  visibleJobs.value.some(
    (job) =>
      job.status === 'pending' &&
      job.queueState !== 'rendering' &&
      now.value - job.createdAt > STALL_AFTER_MS,
  ),
)

// Past-looks compare state: imageId → currently showing the before photo.
const comparing = ref<Record<number, boolean>>({})

function toggleCompare(imageId: number) {
  comparing.value = {
    ...comparing.value,
    [imageId]: !comparing.value[imageId],
  }
}

const changeSummary = computed(() => {
  const parts: string[] = []
  if (changeColor.value)
    parts.push(colorValue.value.trim() ? `color → ${colorValue.value.trim()}` : 'new color')
  if (changeStyle.value)
    parts.push(styleValue.value.trim() ? `style → ${styleValue.value.trim()}` : 'new style')
  if (enhanceImage.value) parts.push('image cleanup')
  if (!parts.length) return ''
  return `We'll ${parts.join(', ')} — keeping the same face and person.`
})

function buildPrompt(): string {
  const clauses: string[] = []

  if (changeColor.value) {
    clauses.push(
      colorValue.value.trim()
        ? `change the hair color to ${colorValue.value.trim()}`
        : 'give the hair a flattering new color',
    )
  }
  if (changeStyle.value) {
    clauses.push(
      styleValue.value.trim()
        ? `restyle the hair as ${styleValue.value.trim()}`
        : 'give a fresh, flattering new hairstyle',
    )
  }
  if (enhanceImage.value) {
    clauses.push('improve the overall photo quality, lighting, and sharpness')
  }
  if (extraNotes.value.trim()) {
    clauses.push(extraNotes.value.trim())
  }

  clauses.push(
    'keep the same person, same face and identity, natural photorealistic result',
  )

  return clauses.join('. ')
}

function historyImageSrc(image: ArtImage): string {
  const img = image as ArtImage & {
    imageData?: string | null
    thumbnailData?: string | null
    imagePath?: string | null
    path?: string | null
  }
  if (img.thumbnailData) {
    return `data:image/${img.fileType || 'png'};base64,${img.thumbnailData}`
  }
  if (img.imageData) {
    return `data:image/${img.fileType || 'png'};base64,${img.imageData}`
  }
  return img.imagePath || img.path || ''
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) processFile(input.files[0])
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

// Downscale to the working size before anything leaves the device: Kontext
// renders at ~1024px anyway, and a raw phone photo as base64 (5-10MB+) can
// exceed the deployed backend's request-size limit at enqueue time.
const MAX_PHOTO_DIMENSION = 1280

function downscalePhoto(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()

    img.onload = () => {
      const scale = Math.min(
        1,
        MAX_PHOTO_DIMENSION / Math.max(img.width, img.height),
      )
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * scale))
      canvas.height = Math.max(1, Math.round(img.height * scale))

      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(dataUrl)
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }

    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

function processFile(file: File) {
  const reader = new FileReader()
  reader.onload = async (event) => {
    const raw = (event.target?.result as string) ?? null
    sourceImageData.value = raw ? await downscalePhoto(raw) : null
  }
  reader.readAsDataURL(file)
}

async function openCamera() {
  sourceTab.value = 'camera'
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    cameraActive.value = true
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (videoEl.value) videoEl.value.srcObject = cameraStream
  } catch {
    cameraActive.value = false
    sourceTab.value = 'upload'
  }
}

function capturePhoto() {
  const video = videoEl.value
  if (!video) return
  const width = video.videoWidth || 768
  const height = video.videoHeight || 768
  const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  sourceImageData.value = canvas.toDataURL('image/jpeg', 0.9)
  closeCamera()
}

function closeCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop())
  cameraStream = null
  cameraActive.value = false
}

function clearSource() {
  sourceImageData.value = null
}

function submit() {
  if (!sourceImageData.value || !hasAnyChange.value) return
  void stylist.runStylist({
    client: clientName.value,
    clientId: bookClient.value?.id ?? null,
    before: sourceImageData.value,
    prompt: buildPrompt(),
    originalWeight: preserveStrength.value,
    guidance: guidanceValue.value,
    steps: stepsValue.value,
    ...(protectIdentity.value ? { negativePrompt: IDENTITY_NEGATIVE } : {}),
  })
}

onMounted(() => {
  void stylist.loadHistory()
  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 10_000)
})

onBeforeUnmount(() => {
  closeCamera()
  if (nowTimer) clearInterval(nowTimer)
})
</script>

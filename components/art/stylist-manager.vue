<!-- /components/art/stylist-manager.vue -->
<!--
  Hair Studio (Superkate) — upload or snap a client photo, choose color / style /
  enhance (any combination), and send it through the Kind Robots Kontext backend to
  get the same photo back with new hair.

  Job state and past looks live in stylistStore, so a styling job keeps running (and
  its result still lands) even if Superkate leaves the /stylist tab and comes back.
  Results are saved private (isPublic:false) and tagged per client. See conductor
  superkate-hairstyle-ai t-007 (navigable async) and t-008 (durable per-client gallery).
-->
<template>
  <section
    class="stylist-manager flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
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
          placeholder="Whose hair are we styling?"
          class="input input-sm input-bordered w-full"
        />
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
            @click="sourceTab = 'upload'"
          >
            Upload
          </button>
          <button
            type="button"
            class="px-2.5 py-1 font-bold transition"
            :class="sourceTab === 'camera' ? 'bg-primary text-primary-content' : 'bg-base-100 text-base-content/60 hover:bg-base-200'"
            @click="openCamera"
          >
            Camera
          </button>
        </div>
      </div>

      <!-- Upload -->
      <div
        v-show="sourceTab === 'upload' && !sourceImageData"
        class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-6 text-center text-xs transition"
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/60'"
        @click="fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
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

    <!-- This session's jobs -->
    <div v-if="visibleJobs.length" class="flex flex-col gap-2">
      <span class="text-xs font-black text-base-content">
        {{ clientName.trim() ? `Styling ${clientName.trim()}` : 'This session' }}
      </span>
      <div class="grid gap-3 sm:grid-cols-2">
        <article
          v-for="job in visibleJobs"
          :key="job.id"
          class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
        >
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold">{{ job.client || 'Unnamed client' }}</span>
            <span v-if="job.status === 'pending'" class="badge badge-warning badge-xs gap-1">
              <span class="loading loading-spinner loading-xs" /> working
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
          <img
            :src="historyImageSrc(image)"
            :alt="`Look for ${clientFromDesigner(image.designer) || 'client'}`"
            class="aspect-square w-full rounded-lg object-cover"
          />
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
import type { ArtImage } from '~/prisma/generated/prisma/client'

const stylist = useStylistStore()

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

const hasAnyChange = computed(
  () => changeColor.value || changeStyle.value || enhanceImage.value,
)

const canGenerate = computed(
  () => !!sourceImageData.value && hasAnyChange.value,
)

const visibleJobs = computed(() => stylist.jobsForClient(clientName.value))
const clientHistory = computed(() =>
  stylist.historyForClient(clientName.value),
)

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

function processFile(file: File) {
  const reader = new FileReader()
  reader.onload = (event) => {
    sourceImageData.value = (event.target?.result as string) ?? null
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
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 768
  canvas.height = video.videoHeight || 768
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  sourceImageData.value = canvas.toDataURL('image/png')
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
    before: sourceImageData.value,
    prompt: buildPrompt(),
  })
}

onMounted(() => {
  void stylist.loadHistory()
})

onBeforeUnmount(closeCamera)
</script>

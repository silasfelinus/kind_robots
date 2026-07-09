<!-- /components/art/stylist-manager.vue -->
<!--
  Hair Studio (Superkate) — upload or snap a client photo, choose color / style /
  enhance (any combination), and send it through the Kind Robots Kontext backend to
  get the same photo back with new hair.

  Notes:
  - Results are saved with isPublic: false on purpose. Client photos are private and
    must NOT surface in public galleries or the memory-match game, even though they
    are linked to the studio user. (Silas, 2026-07-09.)
  - Generation runs async via artStore.generateArt; the rest of the app stays
    navigable while a job is in flight. Durable per-client galleries + cross-page
    background jobs are tracked in conductor superkate-hairstyle-ai t-007 / t-008.
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
      <span class="text-xs font-semibold text-base-content/50">
        Superkate · surprise preview
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
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="btn btn-primary btn-sm flex-1"
        :disabled="!canGenerate"
        @click="runStylist"
      >
        <span v-if="isGenerating" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:magic" class="h-4 w-4" />
        {{ isGenerating ? 'Styling…' : 'Style it' }}
      </button>
    </div>

    <p v-if="isGenerating" class="text-center text-xs text-base-content/50">
      This can take a minute or two — feel free to keep working, the result lands here when it's ready.
    </p>
    <p v-if="errorMessage" class="rounded-lg bg-error/10 p-2 text-xs font-semibold text-error">
      {{ errorMessage }}
    </p>

    <!-- Results — per-client before/after -->
    <div v-if="results.length" class="flex flex-col gap-2">
      <span class="text-xs font-black text-base-content">Transformations</span>
      <div class="grid gap-3 sm:grid-cols-2">
        <article
          v-for="result in results"
          :key="result.id"
          class="flex flex-col gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
        >
          <div class="flex items-center gap-2 text-xs">
            <span class="font-bold">{{ result.client || 'Unnamed client' }}</span>
            <span v-if="result.pending" class="badge badge-warning badge-xs gap-1">
              <span class="loading loading-spinner loading-xs" /> working
            </span>
            <span v-else-if="result.failed" class="badge badge-error badge-xs">failed</span>
            <span v-else class="badge badge-success badge-xs">done</span>
          </div>
          <div class="grid grid-cols-2 gap-1">
            <figure class="flex flex-col gap-1">
              <img :src="result.before" alt="Before" class="aspect-square w-full rounded-lg object-cover" />
              <figcaption class="text-center text-[10px] text-base-content/50">Before</figcaption>
            </figure>
            <figure class="flex flex-col gap-1">
              <img
                v-if="result.after"
                :src="result.after"
                alt="After"
                class="aspect-square w-full rounded-lg object-cover"
              />
              <div
                v-else
                class="flex aspect-square w-full items-center justify-center rounded-lg bg-base-200"
              >
                <span v-if="result.pending" class="loading loading-spinner text-primary" />
                <Icon v-else name="mdi:image-broken" class="h-6 w-6 text-base-content/30" />
              </div>
              <figcaption class="text-center text-[10px] text-base-content/50">After</figcaption>
            </figure>
          </div>
          <p class="line-clamp-2 text-[10px] text-base-content/50" :title="result.prompt">
            {{ result.prompt }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useServerStore } from '@/stores/serverStore'
import type { Server } from '~/prisma/generated/prisma/client'

const artStore = useArtStore()
const userStore = useUserStore()
const serverStore = useServerStore()

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

const isGenerating = ref(false)
const errorMessage = ref('')

let resultSeq = 0
type StylistResult = {
  id: number
  client: string
  before: string
  after: string | null
  prompt: string
  pending: boolean
  failed: boolean
}
const results = ref<StylistResult[]>([])

function patchResult(id: number, patch: Partial<StylistResult>) {
  results.value = results.value.map((result) =>
    result.id === id ? { ...result, ...patch } : result,
  )
}

const hasAnyChange = computed(
  () => changeColor.value || changeStyle.value || enhanceImage.value,
)

const canGenerate = computed(
  () => !isGenerating.value && !!sourceImageData.value && hasAnyChange.value,
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

function isUsableKontextServer(
  server: Server | null | undefined,
): server is Server {
  if (!server) return false
  if (!server.isActive) return false
  if (server.serverType !== 'COMFY') return false
  return true
}

const kontextServer = computed<Server | null>(() => {
  if (isUsableKontextServer(serverStore.activeArtServer)) {
    return serverStore.activeArtServer
  }
  const servers = Array.isArray(serverStore.servers)
    ? (serverStore.servers as Server[])
    : []
  return servers.find(isUsableKontextServer) || null
})

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
    errorMessage.value = ''
  }
  reader.readAsDataURL(file)
}

async function openCamera() {
  sourceTab.value = 'camera'
  errorMessage.value = ''
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })
    cameraActive.value = true
    // Wait a tick for the <video> to render before binding the stream.
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (videoEl.value) videoEl.value.srcObject = cameraStream
  } catch {
    cameraActive.value = false
    errorMessage.value =
      'Camera unavailable. You can upload a photo instead.'
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
  errorMessage.value = ''
}

async function runStylist() {
  if (!sourceImageData.value || !hasAnyChange.value) return

  errorMessage.value = ''
  const prompt = buildPrompt()
  const before = sourceImageData.value
  const client = clientName.value.trim()
  const base64Payload = before.includes(',') ? before.split(',')[1] : before

  const entryId = ++resultSeq
  const entry: StylistResult = {
    id: entryId,
    client,
    before,
    after: null,
    prompt,
    pending: true,
    failed: false,
  }
  results.value = [entry, ...results.value]

  isGenerating.value = true
  try {
    const result = await artStore.generateArt({
      promptString: prompt,
      userId: userStore.userId ?? undefined,
      serverId: kontextServer.value?.id ?? null,
      serverName: kontextServer.value?.title ?? null,
      engine: 'kontext',
      transport: 'backend',
      // Client photos stay private — never public, never in the memory game.
      isPublic: false,
      isMature: false,
      // Tag the owning client so a durable per-client gallery can group later.
      designer: client ? `stylist:${client}` : 'stylist',
      sourceImageBase64: base64Payload,
    })

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Styling failed.')
    }

    const image = result.data as { imageData?: string | null; fileType?: string | null }
    patchResult(entryId, {
      after: image.imageData
        ? `data:image/${image.fileType || 'png'};base64,${image.imageData}`
        : before,
      pending: false,
    })
  } catch (error) {
    patchResult(entryId, { pending: false, failed: true })
    errorMessage.value =
      error instanceof Error ? error.message : 'Styling failed.'
  } finally {
    isGenerating.value = false
  }
}

onBeforeUnmount(closeCamera)
</script>

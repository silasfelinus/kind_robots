<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useServerStore } from '@/stores/serverStore'

// ─── Endpoint registry ────────────────────────────────────────────────────────
interface EndpointDef {
  id: string
  label: string
  route: string
  description: string
  color: string
  icon: string
  needsPrompt: boolean
  needsNegative: boolean
  needsCheckpoint: boolean
  needsSampler: boolean
  needsSteps: boolean
  needsCfg: boolean
  needsGuidance: boolean
  needsSeed: boolean
  needsSize: boolean
  needsSourceImage: boolean
  needsSourceImage2: boolean
  outputType: 'image' | 'model3d'
  engine: string
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: 'a1111',
    label: 'A1111 / Forge',
    route: '/api/art/generate',
    description: 'Stable Diffusion via A1111 or Forge backend',
    color: '#f59e0b',
    icon: '◈',
    needsPrompt: true,
    needsNegative: true,
    needsCheckpoint: true,
    needsSampler: true,
    needsSteps: true,
    needsCfg: true,
    needsGuidance: false,
    needsSeed: true,
    needsSize: true,
    needsSourceImage: false,
    needsSourceImage2: false,
    outputType: 'image',
    engine: 'A1111',
  },
  {
    id: 'flux',
    label: 'Comfy · Flux',
    route: '/api/comfy/flux/generate',
    description: 'Flux.1 generation via ComfyUI workflow',
    color: '#8b5cf6',
    icon: '⟁',
    needsPrompt: true,
    needsNegative: false,
    needsCheckpoint: false,
    needsSampler: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: true,
    needsSeed: true,
    needsSize: true,
    needsSourceImage: false,
    needsSourceImage2: false,
    outputType: 'image',
    engine: 'FLUX',
  },
  {
    id: 'kontext',
    label: 'Comfy · Kontext',
    route: '/api/comfy/kontext/generate',
    description: 'Flux Kontext img2img — image + prompt → new image',
    color: '#06b6d4',
    icon: '◎',
    needsPrompt: true,
    needsNegative: false,
    needsCheckpoint: false,
    needsSampler: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: true,
    needsSeed: true,
    needsSize: true,
    needsSourceImage: true,
    needsSourceImage2: false,
    outputType: 'image',
    engine: 'KONTEXT',
  },
  {
    id: 'kombine',
    label: 'Comfy · Kombine',
    route: '/api/comfy/kontext/kombine',
    description: 'Flux Kontext 2-image merge — combine two images with prompt',
    color: '#ec4899',
    icon: '⊕',
    needsPrompt: true,
    needsNegative: false,
    needsCheckpoint: false,
    needsSampler: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: true,
    needsSeed: true,
    needsSize: true,
    needsSourceImage: true,
    needsSourceImage2: true,
    outputType: 'image',
    engine: 'KONTEXT',
  },
  {
    id: 'sdxl',
    label: 'Comfy · SDXL',
    route: '/api/comfy/sdxl/generate',
    description: 'Stable Diffusion XL via ComfyUI workflow',
    color: '#10b981',
    icon: '◉',
    needsPrompt: true,
    needsNegative: true,
    needsCheckpoint: false,
    needsSampler: false,
    needsSteps: true,
    needsCfg: true,
    needsGuidance: false,
    needsSeed: true,
    needsSize: true,
    needsSourceImage: false,
    needsSourceImage2: false,
    outputType: 'image',
    engine: 'SDXL',
  },
  {
    id: 'characterSheet',
    label: 'Character Sheet',
    route: '/api/comfy/characterSheet',
    description: 'Flux multi-view character model sheet from prompt or image',
    color: '#f97316',
    icon: '⊞',
    needsPrompt: true,
    needsNegative: false,
    needsCheckpoint: false,
    needsSampler: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: true,
    needsSeed: true,
    needsSize: false,
    needsSourceImage: true,
    needsSourceImage2: false,
    outputType: 'image',
    engine: 'FLUX',
  },
  {
    id: 'hunyuan3d',
    label: 'Hunyuan 3D',
    route: '/api/comfy/hunyuan3d',
    description: 'Generate a 3D-printable model file from prompt or image',
    color: '#64748b',
    icon: '◈',
    needsPrompt: true,
    needsNegative: false,
    needsCheckpoint: false,
    needsSampler: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: false,
    needsSeed: true,
    needsSize: false,
    needsSourceImage: true,
    needsSourceImage2: false,
    outputType: 'model3d',
    engine: 'HUNYUAN3D',
  },
]

// ─── Store ────────────────────────────────────────────────────────────────────
const serverStore = useServerStore()
onMounted(() => {
  if (!serverStore.hasLoaded) {
    serverStore.initialize({ fetchRemote: true })
  }
})

// ─── State ────────────────────────────────────────────────────────────────────
const selectedEndpointId = ref<string>('flux')
const endpointDef = computed<EndpointDef>(
  () =>
    ENDPOINTS.find((e) => e.id === selectedEndpointId.value) ??
    (ENDPOINTS[0] as EndpointDef),
)

// form
const serverId = ref<number | null>(null)
const prompt = ref(
  'A lone astronaut discovering an ancient glowing temple on a jungle moon',
)
const negativePrompt = ref('blurry, watermark, text, low quality, deformed')
const checkpoint = ref('')
const sampler = ref('Euler a')
const steps = ref(20)
const cfg = ref(7)
const guidance = ref(3.5)
const seed = ref<number | null>(null)
const width = ref(1024)
const height = ref(1024)

// image inputs
const sourceImageBase64 = ref<string | null>(null)
const sourceImagePreview = ref<string | null>(null)
const sourceImage2Base64 = ref<string | null>(null)
const sourceImage2Preview = ref<string | null>(null)

// output
const isGenerating = ref(false)
const resultImage = ref<string | null>(null)
const resultData = ref<Record<string, unknown> | null>(null)
const resultModel3d = ref<string | null>(null)
const errorMsg = ref('')
const elapsedMs = ref(0)
const showPayload = ref(false)
const showRawResult = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

// server options from store
const artServers = computed(() => serverStore.artServers)
watch(
  artServers,
  (servers) => {
    if (!serverId.value && servers.length) {
      serverId.value = servers[0]?.id ?? null
    }
  },
  { immediate: true },
)

// ─── Style helpers (keep CSS custom props out of template expressions) ────────
const generateBtnStyle = computed(() =>
  endpointDef.value ? { ['--btn-color']: endpointDef.value.color } : {},
)

function epTabStyle(ep: EndpointDef, activeId: string): Record<string, string> {
  return activeId === ep.id ? { ['--ep-color']: ep.color } : {}
}

// reset image inputs when endpoint changes
watch(selectedEndpointId, () => {
  sourceImageBase64.value = null
  sourceImagePreview.value = null
  sourceImage2Base64.value = null
  sourceImage2Preview.value = null
  resultImage.value = null
  resultData.value = null
  resultModel3d.value = null
  errorMsg.value = ''
})

// ─── Image upload helpers ─────────────────────────────────────────────────────
function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip the data URL prefix, keep only base64
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleImageUpload(event: Event, slot: 1 | 2): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const b64 = await toBase64(file)
  const previewUrl = URL.createObjectURL(file)

  if (slot === 1) {
    sourceImageBase64.value = b64
    sourceImagePreview.value = previewUrl
  } else {
    sourceImage2Base64.value = b64
    sourceImage2Preview.value = previewUrl
  }
}

function clearImage(slot: 1 | 2): void {
  if (slot === 1) {
    sourceImageBase64.value = null
    sourceImagePreview.value = null
  } else {
    sourceImage2Base64.value = null
    sourceImage2Preview.value = null
  }
}

// ─── Payload builder ──────────────────────────────────────────────────────────
const builtPayload = computed(() => {
  const def: EndpointDef | undefined = endpointDef.value
  if (!def) return {}
  const payload: Record<string, unknown> = {
    serverId: serverId.value,
    promptString: prompt.value,
  }

  if (def.needsNegative) payload.negativePrompt = negativePrompt.value
  if (def.needsCheckpoint) payload.checkpoint = checkpoint.value
  if (def.needsSampler) payload.sampler = sampler.value
  if (def.needsSteps) payload.steps = steps.value
  if (def.needsCfg) payload.cfg = cfg.value
  if (def.needsGuidance) payload.guidance = guidance.value
  if (def.needsSeed) payload.seed = seed.value
  if (def.needsSize) {
    payload.width = width.value
    payload.height = height.value
  }
  if (def.needsSourceImage && sourceImageBase64.value) {
    payload.sourceImageBase64 = `[${sourceImageBase64.value.length} chars]`
  }
  if (def.needsSourceImage2 && sourceImage2Base64.value) {
    payload.maskImageBase64 = `[${sourceImage2Base64.value.length} chars]`
  }

  return payload
})

// ─── Generation ───────────────────────────────────────────────────────────────
function startTimer(): void {
  elapsedMs.value = 0
  const start = Date.now()
  timerInterval = setInterval(() => {
    elapsedMs.value = Date.now() - start
  }, 100)
}

function stopTimer(): void {
  if (timerInterval) clearInterval(timerInterval)
}

function extractResultImage(data: Record<string, unknown>): string | null {
  // Try common response shapes
  const candidates = [
    data.imageData,
    data.imagePath,
    data.image,
    data.url,
    data.path,
    (data.data as Record<string, unknown> | null)?.imageData,
    (data.data as Record<string, unknown> | null)?.imagePath,
    (data.data as Record<string, unknown> | null)?.image,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && c.length > 0) return c
  }
  return null
}

async function generate(): Promise<void> {
  if (isGenerating.value) return

  isGenerating.value = true
  resultImage.value = null
  resultData.value = null
  resultModel3d.value = null
  errorMsg.value = ''
  startTimer()

  const def: EndpointDef | undefined = endpointDef.value
  if (!def) {
    stopTimer()
    isGenerating.value = false
    return
  }
  const body: Record<string, unknown> = {
    serverId: serverId.value,
    promptString: prompt.value,
  }

  if (def.needsNegative) body.negativePrompt = negativePrompt.value
  if (def.needsCheckpoint) body.checkpoint = checkpoint.value
  if (def.needsSampler) body.sampler = sampler.value
  if (def.needsSteps) body.steps = steps.value
  if (def.needsCfg) body.cfg = cfg.value
  if (def.needsGuidance) body.guidance = guidance.value
  if (def.needsSeed) body.seed = seed.value
  if (def.needsSize) {
    body.width = width.value
    body.height = height.value
  }
  if (def.needsSourceImage && sourceImageBase64.value)
    body.sourceImageBase64 = sourceImageBase64.value
  if (def.needsSourceImage2 && sourceImage2Base64.value)
    body.maskImageBase64 = sourceImage2Base64.value

  try {
    const res = await fetch(def.route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    resultData.value = data

    if (!res.ok) {
      throw new Error(
        data?.statusMessage || data?.message || `HTTP ${res.status}`,
      )
    }

    if (def.outputType === 'model3d') {
      resultModel3d.value = data?.data?.filePath || data?.filePath || null
    } else {
      const imgValue = extractResultImage(
        (data?.data ?? data) as Record<string, unknown>,
      )
      if (imgValue) {
        resultImage.value = imgValue.startsWith('data:')
          ? imgValue
          : imgValue.startsWith('/')
            ? imgValue
            : `data:image/png;base64,${imgValue}`
      }
    }
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    stopTimer()
    isGenerating.value = false
  }
}

function clearResult(): void {
  resultImage.value = null
  resultData.value = null
  resultModel3d.value = null
  errorMsg.value = ''
  elapsedMs.value = 0
}

async function copyOutput(): Promise<void> {
  if (typeof window !== 'undefined' && resultData.value) {
    await window.navigator.clipboard.writeText(
      JSON.stringify(resultData.value, null, 2),
    )
  }
}

function downloadImage(): void {
  if (!resultImage.value) return
  const a = document.createElement('a')
  a.href = resultImage.value
  a.download = `art-test-${selectedEndpointId.value}-${Date.now()}.png`
  a.click()
}
</script>

<template>
  <div class="at-root">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="at-header">
      <div class="at-header-left">
        <span class="at-logo" :style="{ color: endpointDef.color }">{{
          endpointDef.icon
        }}</span>
        <div>
          <h1 class="at-title">Art Generation Test</h1>
          <p class="at-subtitle">API Route Diagnostics</p>
        </div>
      </div>
      <div class="at-header-right">
        <span
          class="at-badge"
          :style="{ borderColor: endpointDef.color, color: endpointDef.color }"
        >
          {{ endpointDef.engine }}
        </span>
        <span class="at-route-chip">{{ endpointDef.route }}</span>
      </div>
    </header>

    <div class="at-layout">
      <!-- ── Left sidebar ──────────────────────────────────────────────────── -->
      <aside class="at-sidebar">
        <!-- Endpoint picker -->
        <section class="at-section">
          <label class="at-label">Endpoint</label>
          <div class="at-endpoint-list">
            <button
              v-for="ep in ENDPOINTS"
              :key="ep.id"
              class="at-endpoint-btn"
              :class="{ active: selectedEndpointId === ep.id }"
              :style="epTabStyle(ep, selectedEndpointId)"
              @click="selectedEndpointId = ep.id"
            >
              <span
                class="at-ep-icon"
                :style="{ color: selectedEndpointId === ep.id ? ep.color : '' }"
              >
                {{ ep.icon }}
              </span>
              <span class="at-ep-info">
                <span class="at-ep-name">{{ ep.label }}</span>
                <span class="at-ep-desc">{{ ep.description }}</span>
              </span>
            </button>
          </div>
        </section>

        <hr class="at-divider" />

        <!-- Server selector -->
        <section class="at-section">
          <label class="at-label">Art Server</label>
          <div v-if="serverStore.loading" class="at-muted at-small">
            Loading servers…
          </div>
          <div v-else-if="!artServers.length" class="at-warn">
            No art servers found. Check serverStore.
          </div>
          <select v-else v-model="serverId" class="at-select">
            <option :value="null">— none —</option>
            <option v-for="s in artServers" :key="s.id" :value="s.id">
              {{ s.label || s.title }} ({{ s.serverType }})
            </option>
          </select>
          <div v-if="serverId" class="at-server-info">
            <span class="at-muted at-small">
              {{ serverStore.getServerById(serverId)?.baseUrl }}
            </span>
          </div>
        </section>

        <hr class="at-divider" />

        <!-- Generation params -->
        <section v-if="endpointDef.needsCheckpoint" class="at-section">
          <label class="at-label">Checkpoint</label>
          <input
            v-model="checkpoint"
            class="at-input"
            type="text"
            placeholder="v1-5-pruned.safetensors"
          />
        </section>

        <section v-if="endpointDef.needsSampler" class="at-section">
          <label class="at-label">Sampler</label>
          <select v-model="sampler" class="at-select">
            <option>Euler a</option>
            <option>Euler</option>
            <option>DPM++ 2M</option>
            <option>DPM++ 2M Karras</option>
            <option>DPM++ SDE</option>
            <option>DDIM</option>
          </select>
        </section>

        <section v-if="endpointDef.needsSteps" class="at-section">
          <label class="at-label"
            >Steps <span class="at-val">{{ steps }}</span></label
          >
          <input
            type="range"
            min="1"
            max="60"
            step="1"
            v-model.number="steps"
            class="at-range"
          />
        </section>

        <section v-if="endpointDef.needsCfg" class="at-section">
          <label class="at-label"
            >CFG Scale <span class="at-val">{{ cfg }}</span></label
          >
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            v-model.number="cfg"
            class="at-range"
          />
        </section>

        <section v-if="endpointDef.needsGuidance" class="at-section">
          <label class="at-label"
            >Guidance <span class="at-val">{{ guidance }}</span></label
          >
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            v-model.number="guidance"
            class="at-range"
          />
        </section>

        <section v-if="endpointDef.needsSeed" class="at-section">
          <label class="at-label"
            >Seed <span class="at-val">{{ seed ?? 'random' }}</span></label
          >
          <div class="at-seed-row">
            <input
              :value="seed ?? ''"
              @input="
                seed = ($event.target as HTMLInputElement).value
                  ? Number(($event.target as HTMLInputElement).value)
                  : null
              "
              class="at-input at-input--grow"
              type="number"
              placeholder="random"
            />
            <button class="at-icon-btn" title="Randomize" @click="seed = null">
              ⟳
            </button>
            <button
              class="at-icon-btn"
              title="New seed"
              @click="seed = Math.floor(Math.random() * 999999999)"
            >
              ✦
            </button>
          </div>
        </section>

        <section v-if="endpointDef.needsSize" class="at-section">
          <label class="at-label"
            >Width <span class="at-val">{{ width }}px</span></label
          >
          <input
            type="range"
            min="256"
            max="2048"
            step="64"
            v-model.number="width"
            class="at-range"
          />
          <label class="at-label" style="margin-top: 0.4rem"
            >Height <span class="at-val">{{ height }}px</span></label
          >
          <input
            type="range"
            min="256"
            max="2048"
            step="64"
            v-model.number="height"
            class="at-range"
          />
          <!-- Quick presets -->
          <div class="at-size-presets">
            <button
              class="at-preset-btn"
              @click="
                width = 512
                height = 512
              "
            >
              512²
            </button>
            <button
              class="at-preset-btn"
              @click="
                width = 768
                height = 768
              "
            >
              768²
            </button>
            <button
              class="at-preset-btn"
              @click="
                width = 1024
                height = 1024
              "
            >
              1024²
            </button>
            <button
              class="at-preset-btn"
              @click="
                width = 1216
                height = 832
              "
            >
              16:9
            </button>
            <button
              class="at-preset-btn"
              @click="
                width = 832
                height = 1216
              "
            >
              9:16
            </button>
          </div>
        </section>

        <hr class="at-divider" />

        <!-- Dev toggles -->
        <section class="at-section">
          <label class="at-label">Debug</label>
          <label class="at-toggle">
            <input type="checkbox" v-model="showPayload" />
            <span class="at-toggle-track"
              ><span class="at-toggle-thumb"
            /></span>
            Show payload
          </label>
          <label class="at-toggle" style="margin-top: 0.3rem">
            <input type="checkbox" v-model="showRawResult" />
            <span class="at-toggle-track"
              ><span class="at-toggle-thumb"
            /></span>
            Show raw result
          </label>
        </section>
      </aside>

      <!-- ── Main panel ─────────────────────────────────────────────────────── -->
      <main class="at-main">
        <!-- Prompts -->
        <section class="at-section">
          <label class="at-label">Prompt</label>
          <textarea
            v-model="prompt"
            class="at-textarea"
            rows="3"
            placeholder="Describe the image you want to generate…"
          />
        </section>

        <section v-if="endpointDef.needsNegative" class="at-section">
          <label class="at-label">Negative Prompt</label>
          <textarea
            v-model="negativePrompt"
            class="at-textarea at-textarea--sm"
            rows="2"
            placeholder="What to avoid…"
          />
        </section>

        <!-- Image inputs -->
        <div
          v-if="endpointDef.needsSourceImage || endpointDef.needsSourceImage2"
          class="at-image-inputs"
        >
          <!-- Source image 1 -->
          <section
            v-if="endpointDef.needsSourceImage"
            class="at-section at-drop-zone"
            :class="{ 'has-image': sourceImagePreview }"
          >
            <label class="at-label">
              {{
                endpointDef.needsSourceImage2
                  ? 'Source Image A'
                  : 'Source Image'
              }}
              <span class="at-optional">(optional)</span>
            </label>
            <div v-if="sourceImagePreview" class="at-image-slot">
              <img
                :src="sourceImagePreview"
                class="at-preview-img"
                alt="Source"
              />
              <button class="at-remove-img" @click="clearImage(1)">
                ✕ Remove
              </button>
            </div>
            <label v-else class="at-upload-label">
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload($event, 1)"
                class="at-file-input"
              />
              <span class="at-upload-prompt">
                <span class="at-upload-icon">⊕</span>
                Click or drop image
              </span>
            </label>
          </section>

          <!-- Source image 2 (kombine) -->
          <section
            v-if="endpointDef.needsSourceImage2"
            class="at-section at-drop-zone"
            :class="{ 'has-image': sourceImage2Preview }"
          >
            <label class="at-label">Source Image B</label>
            <div v-if="sourceImage2Preview" class="at-image-slot">
              <img
                :src="sourceImage2Preview"
                class="at-preview-img"
                alt="Source B"
              />
              <button class="at-remove-img" @click="clearImage(2)">
                ✕ Remove
              </button>
            </div>
            <label v-else class="at-upload-label">
              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload($event, 2)"
                class="at-file-input"
              />
              <span class="at-upload-prompt">
                <span class="at-upload-icon">⊕</span>
                Click or drop image
              </span>
            </label>
          </section>
        </div>

        <!-- Payload preview -->
        <Transition name="slide">
          <section v-if="showPayload" class="at-section">
            <label class="at-label">Request Payload Preview</label>
            <pre class="at-code">{{
              JSON.stringify(builtPayload, null, 2)
            }}</pre>
          </section>
        </Transition>

        <!-- Actions -->
        <div class="at-actions">
          <button
            class="at-btn at-btn--primary"
            :disabled="isGenerating || !serverId"
            :style="generateBtnStyle"
            @click="generate"
          >
            <span v-if="isGenerating" class="at-spinner" />
            <span v-else>{{ endpointDef.icon }} Generate</span>
          </button>
          <button
            class="at-btn at-btn--ghost"
            :disabled="isGenerating"
            @click="clearResult"
          >
            ✕ Clear
          </button>
          <div v-if="elapsedMs > 0" class="at-stats">
            <span>{{ (elapsedMs / 1000).toFixed(1) }}s</span>
          </div>
          <div v-if="isGenerating" class="at-generating-pill">
            <span class="at-pulse-dot" />
            Generating…
          </div>
          <div v-if="!serverId" class="at-warn-inline">
            Select a server first
          </div>
        </div>

        <!-- Error -->
        <Transition name="slide">
          <section v-if="errorMsg" class="at-section">
            <label class="at-label at-label--error">⚠ Error</label>
            <div class="at-error">{{ errorMsg }}</div>
          </section>
        </Transition>

        <!-- Output: Image -->
        <section
          v-if="endpointDef.outputType === 'image'"
          class="at-section at-result-section"
        >
          <div class="at-result-header">
            <label class="at-label">Result</label>
            <div class="at-result-actions" v-if="resultImage">
              <button class="at-copy" @click="downloadImage">⤓ Download</button>
              <button class="at-copy" @click="copyOutput">⧉ Copy JSON</button>
            </div>
          </div>
          <div
            class="at-result-canvas"
            :class="{
              'at-result-canvas--empty': !resultImage && !isGenerating,
            }"
          >
            <div v-if="isGenerating" class="at-generating-state">
              <div
                class="at-spinner at-spinner--lg"
                :style="{ borderTopColor: endpointDef.color }"
              />
              <p class="at-gen-label">
                Generating with {{ endpointDef.label }}…
              </p>
              <p class="at-gen-timer">
                {{ (elapsedMs / 1000).toFixed(1) }}s elapsed
              </p>
            </div>
            <img
              v-else-if="resultImage"
              :src="resultImage"
              class="at-result-img"
              alt="Generated image"
            />
            <div v-else class="at-empty-state">
              <span
                class="at-empty-icon"
                :style="{ color: endpointDef.color }"
                >{{ endpointDef.icon }}</span
              >
              <p>Your generated image will appear here</p>
            </div>
          </div>
        </section>

        <!-- Output: 3D model -->
        <section
          v-if="endpointDef.outputType === 'model3d'"
          class="at-section at-result-section"
        >
          <label class="at-label">Result</label>
          <div
            class="at-result-canvas at-result-canvas--model"
            :class="{
              'at-result-canvas--empty': !resultModel3d && !isGenerating,
            }"
          >
            <div v-if="isGenerating" class="at-generating-state">
              <div class="at-spinner at-spinner--lg" />
              <p class="at-gen-label">Generating 3D model with Hunyuan3D…</p>
              <p class="at-gen-timer">
                {{ (elapsedMs / 1000).toFixed(1) }}s elapsed
              </p>
            </div>
            <div v-else-if="resultModel3d" class="at-model-result">
              <span class="at-model-icon">◈</span>
              <p class="at-model-path">{{ resultModel3d }}</p>
              <a
                v-if="resultModel3d"
                :href="resultModel3d"
                download
                class="at-btn at-btn--ghost"
                style="margin-top: 1rem"
              >
                ⤓ Download Model
              </a>
            </div>
            <div v-else class="at-empty-state">
              <span class="at-empty-icon">◈</span>
              <p>3D model file path will appear here</p>
            </div>
          </div>
        </section>

        <!-- Raw result -->
        <Transition name="slide">
          <section v-if="showRawResult && resultData" class="at-section">
            <label class="at-label">Raw API Response</label>
            <pre class="at-code at-code--result">{{
              JSON.stringify(resultData, null, 2)
            }}</pre>
          </section>
        </Transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ─── Tokens ──────────────────────────────────────────────────────────────── */
.at-root {
  --bg: #09090f;
  --surface: #111118;
  --surface2: #18181f;
  --surface3: #202028;
  --border: rgba(255 255 255 / 0.06);
  --text: #e2e4ef;
  --muted: #52546a;
  --red: #f87171;
  --warn: #fbbf24;
  --green: #34d399;

  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ─── Header ──────────────────────────────────────────────────────────────── */
.at-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 1rem;
  flex-wrap: wrap;
}
.at-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.at-logo {
  font-size: 1.6rem;
  font-weight: 700;
  transition: color 0.3s;
}
.at-title {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0;
}
.at-subtitle {
  font-size: 0.6rem;
  color: var(--muted);
  margin: 0;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.at-header-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.at-badge {
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  border: 1px solid;
  transition: all 0.3s;
}
.at-route-chip {
  font-size: 0.62rem;
  color: var(--muted);
  background: var(--surface2);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  letter-spacing: 0;
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */
.at-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  flex: 1;
  overflow: hidden;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
.at-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
.at-main {
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ─── Sections / labels ───────────────────────────────────────────────────── */
.at-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.at-label {
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.at-label--error {
  color: var(--red);
}
.at-optional {
  text-transform: lowercase;
  letter-spacing: 0;
  font-size: 0.58rem;
  opacity: 0.6;
}
.at-val {
  color: #a5b4fc;
  text-transform: lowercase;
  letter-spacing: 0;
  font-size: 0.72rem;
}
.at-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0.25rem 0;
}
.at-muted {
  color: var(--muted);
}
.at-small {
  font-size: 0.65rem;
}
.at-warn {
  font-size: 0.68rem;
  color: var(--warn);
  padding: 0.3rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent);
  border-radius: 3px;
}
.at-warn-inline {
  font-size: 0.65rem;
  color: var(--warn);
}
.at-server-info {
  margin-top: 0.2rem;
  word-break: break-all;
}

/* ─── Endpoint list ───────────────────────────────────────────────────────── */
.at-endpoint-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.at-endpoint-btn {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.72rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.at-endpoint-btn:hover {
  background: var(--surface2);
  color: var(--text);
}
.at-endpoint-btn.active {
  border-color: var(--ep-color, #6366f1);
  color: var(--ep-color, #6366f1);
  background: color-mix(in srgb, var(--ep-color, #6366f1) 8%, transparent);
}
.at-ep-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
}
.at-ep-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.at-ep-name {
  font-weight: 700;
  font-size: 0.72rem;
}
.at-ep-desc {
  font-size: 0.58rem;
  opacity: 0.65;
  line-height: 1.4;
  white-space: normal;
}

/* ─── Form elements ───────────────────────────────────────────────────────── */
.at-select,
.at-input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.72rem;
  padding: 0.4rem 0.55rem;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.at-select:focus,
.at-input:focus {
  border-color: #6366f1;
}
.at-textarea {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.78rem;
  line-height: 1.6;
  padding: 0.55rem 0.7rem;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.at-textarea--sm {
  min-height: 52px;
}
.at-textarea:focus {
  border-color: #6366f1;
}
.at-range {
  width: 100%;
  accent-color: #6366f1;
}
.at-input--grow {
  flex: 1;
}
.at-seed-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.at-icon-btn {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--muted);
  font-size: 0.75rem;
  width: 24px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.at-icon-btn:hover {
  color: var(--text);
  border-color: var(--muted);
}

/* ─── Size presets ────────────────────────────────────────────────────────── */
.at-size-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.3rem;
}
.at-preset-btn {
  font-family: inherit;
  font-size: 0.58rem;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.12s;
}
.at-preset-btn:hover {
  color: var(--text);
  border-color: var(--muted);
}

/* ─── Toggle ──────────────────────────────────────────────────────────────── */
.at-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.68rem;
  color: var(--text);
}
.at-toggle input {
  display: none;
}
.at-toggle-track {
  width: 28px;
  height: 15px;
  border-radius: 999px;
  background: var(--surface2);
  border: 1px solid var(--border);
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s;
}
.at-toggle input:checked ~ .at-toggle-track {
  background: color-mix(in srgb, #6366f1 30%, transparent);
  border-color: #6366f1;
}
.at-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--muted);
  transition:
    left 0.2s,
    background 0.2s;
}
.at-toggle input:checked ~ .at-toggle-track .at-toggle-thumb {
  left: 15px;
  background: #6366f1;
}

/* ─── Image inputs ────────────────────────────────────────────────────────── */
.at-image-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.at-image-inputs .at-section:only-child {
  grid-column: 1 / -1;
}
.at-drop-zone {
  border: 1px dashed var(--border);
  border-radius: 6px;
  padding: 0.75rem;
  transition: border-color 0.2s;
}
.at-drop-zone.has-image {
  border-style: solid;
  border-color: #6366f1;
}
.at-upload-label {
  cursor: pointer;
  display: block;
}
.at-file-input {
  display: none;
}
.at-upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem 1rem;
  color: var(--muted);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 4px;
  background: var(--surface2);
  transition: all 0.15s;
}
.at-upload-prompt:hover {
  color: var(--text);
  background: var(--surface3);
}
.at-upload-icon {
  font-size: 1.5rem;
}
.at-image-slot {
  position: relative;
}
.at-preview-img {
  width: 100%;
  border-radius: 4px;
  display: block;
  max-height: 200px;
  object-fit: contain;
  background: var(--surface3);
}
.at-remove-img {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  font-family: inherit;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  border: none;
  background: rgba(0 0 0 / 0.7);
  color: var(--red);
  cursor: pointer;
}

/* ─── Code blocks ─────────────────────────────────────────────────────────── */
.at-code {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.65rem;
  line-height: 1.6;
  color: #86efac;
  overflow-x: auto;
  margin: 0;
  white-space: pre;
  max-height: 200px;
}
.at-code--result {
  max-height: 300px;
}

/* ─── Error ───────────────────────────────────────────────────────────────── */
.at-error {
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--red) 35%, transparent);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.72rem;
  color: var(--red);
  line-height: 1.5;
}

/* ─── Actions ─────────────────────────────────────────────────────────────── */
.at-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.at-btn {
  font-family: inherit;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s;
  text-decoration: none;
}
.at-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.at-btn--primary {
  background: var(--btn-color, #6366f1);
  color: #08080f;
  font-weight: 700;
  transition:
    background 0.3s,
    opacity 0.15s;
}
.at-btn--primary:not(:disabled):hover {
  background: color-mix(in srgb, var(--btn-color, #6366f1) 80%, white);
}
.at-btn--ghost {
  background: transparent;
  color: var(--muted);
  border-color: var(--border);
}
.at-btn--ghost:not(:disabled):hover {
  color: var(--text);
  border-color: var(--muted);
}

.at-stats {
  font-size: 0.65rem;
  color: var(--muted);
}
.at-generating-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green);
}
.at-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse-dot 1s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(0.7);
  }
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
.at-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0 0 0 / 0.2);
  border-top-color: #08080f;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.at-spinner--lg {
  width: 40px;
  height: 40px;
  border: 3px solid var(--surface3);
  border-top-color: #6366f1;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─── Result ──────────────────────────────────────────────────────────────── */
.at-result-section {
  flex: 1;
}
.at-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.at-result-actions {
  display: flex;
  gap: 0.4rem;
}
.at-copy {
  font-family: inherit;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}
.at-copy:hover {
  color: var(--text);
  border-color: var(--muted);
}

.at-result-canvas {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}
.at-result-canvas--empty {
  border-style: dashed;
}
.at-result-canvas--model {
  min-height: 200px;
}
.at-result-img {
  max-width: 100%;
  max-height: 70vh;
  display: block;
  border-radius: 4px;
}
.at-generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
}
.at-gen-label {
  font-size: 0.72rem;
  color: var(--muted);
  letter-spacing: 0.06em;
}
.at-gen-timer {
  font-size: 1.1rem;
  color: var(--text);
  font-weight: 700;
}
.at-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  color: var(--muted);
  font-size: 0.72rem;
  padding: 2rem;
  text-align: center;
}
.at-empty-icon {
  font-size: 2rem;
  opacity: 0.3;
}
.at-model-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  text-align: center;
}
.at-model-icon {
  font-size: 2.5rem;
  color: var(--muted);
}
.at-model-path {
  font-size: 0.75rem;
  color: var(--green);
  word-break: break-all;
  max-width: 400px;
}

/* ─── Transitions ─────────────────────────────────────────────────────────── */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* ─── Scrollbar ───────────────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
</style>

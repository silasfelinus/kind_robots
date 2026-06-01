<script setup lang="ts">
// /components/servers/art-test.vue
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useServerStore } from '@/stores/serverStore'

type EndpointId = 'a1111' | 'sdxl' | 'flux' | 'kontext' | 'kombine'
type EndpointMode = 'text' | 'remix' | 'combine'

type AnimalKey =
  | 'cat'
  | 'dog'
  | 'dragon'
  | 'sloth'
  | 'butterfly'
  | 'rabbit'
  | 'fox'
  | 'bear'
  | 'jellyfish'
  | 'octopus'

type ArtistStyleKey =
  | 'van-gogh'
  | 'monet'
  | 'mucha'
  | 'hokusai'
  | 'kandinsky'
  | 'matisse'
  | 'dali'
  | 'vermeer'

interface EndpointDef {
  id: EndpointId
  label: string
  route: string
  description: string
  icon: string
  color: string
  engine: string
  mode: EndpointMode
  needsNegative: boolean
  needsSteps: boolean
  needsCfg: boolean
  needsGuidance: boolean
  needsSeed: boolean
  needsSize: boolean
}

interface AnimalDef {
  key: AnimalKey
  label: string
  emoji: string
  path: string
  descriptor: string
}

interface ArtistStyleDef {
  key: ArtistStyleKey
  label: string
  stylePrompt: string
}

type ArtImageLike = {
  id?: number
  imagePath?: string | null
  imageData?: string | null
  path?: string | null
  url?: string | null
  fileType?: string | null
}

type ArtStoreLike = ReturnType<typeof useArtStore> & {
  artForm?: Record<string, unknown>
  selectedArtImage?: ArtImageLike | null
  selectedImage?: ArtImageLike | null
  selectedArt?: ArtImageLike | null
  generationMessage?: string
  generationMessageTone?: 'success' | 'error' | 'info' | string
  isGenerating?: boolean
  setArtForm?: (patch: Record<string, unknown>) => void
  updateArtForm?: (patch: Record<string, unknown>) => void
  prepareArtGenerator?: () => Promise<void>
}

const ENDPOINTS: EndpointDef[] = [
  {
    id: 'a1111',
    label: 'Stable Diffusion',
    route: '/api/art/generate',
    description: 'Text only prompt improvement test',
    icon: '◈',
    color: 'text-warning',
    engine: 'A1111',
    mode: 'text',
    needsNegative: true,
    needsSteps: true,
    needsCfg: true,
    needsGuidance: false,
    needsSeed: true,
    needsSize: true,
  },
  {
    id: 'sdxl',
    label: 'Comfy SDXL',
    route: '/api/comfy/sdxl/generate',
    description: 'Text only prompt improvement test',
    icon: '◉',
    color: 'text-success',
    engine: 'SDXL',
    mode: 'text',
    needsNegative: true,
    needsSteps: true,
    needsCfg: true,
    needsGuidance: false,
    needsSeed: true,
    needsSize: true,
  },
  {
    id: 'flux',
    label: 'Comfy Flux',
    route: '/api/comfy/flux/generate',
    description: 'Text only prompt improvement test',
    icon: '⟁',
    color: 'text-secondary',
    engine: 'FLUX',
    mode: 'text',
    needsNegative: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: true,
    needsSeed: true,
    needsSize: true,
  },
  {
    id: 'kontext',
    label: 'Kontext Remix',
    route: '/api/comfy/kontext/generate',
    description: 'One animal image remixed into a famous art style',
    icon: '◎',
    color: 'text-info',
    engine: 'KONTEXT',
    mode: 'remix',
    needsNegative: false,
    needsSteps: true,
    needsCfg: false,
    needsGuidance: true,
    needsSeed: true,
    needsSize: true,
  },
  {
  id: 'kombine',
  label: 'Kombine',
  route: '/api/comfy/kontext/kombine',
  description: 'Combine any two animal test images into one hybrid',
  icon: '⊕',
  color: 'text-accent',
  engine: 'KONTEXT',
  mode: 'combine',
  needsNegative: false,
  needsSteps: true,
  needsCfg: false,
  needsGuidance: true,
  needsSeed: true,
  needsSize: true,
},
]

const ANIMALS: AnimalDef[] = [
  {
    key: 'cat',
    label: 'Cat',
    emoji: '🐱',
    path: '/images/test/animals/cat.webp',
    descriptor: 'a curious illustrated cat with expressive eyes',
  },
  {
    key: 'dog',
    label: 'Dog',
    emoji: '🐶',
    path: '/images/test/animals/dog.webp',
    descriptor: 'a cheerful illustrated dog with playful energy',
  },
  {
    key: 'dragon',
    label: 'Dragon',
    emoji: '🐉',
    path: '/images/test/animals/dragon.webp',
    descriptor: 'a whimsical illustrated dragon with a magical personality',
  },
  {
    key: 'sloth',
    label: 'Sloth',
    emoji: '🦥',
    path: '/images/test/animals/sloth.webp',
    descriptor: 'a relaxed illustrated sloth with sweet charm',
  },
  {
    key: 'butterfly',
    label: 'Butterfly',
    emoji: '🦋',
    path: '/images/test/animals/butterfly.webp',
    descriptor: 'a bright illustrated butterfly with dreamy elegance',
  },
  {
    key: 'rabbit',
    label: 'Rabbit',
    emoji: '🐰',
    path: '/images/test/animals/rabbit.webp',
    descriptor: 'a lively illustrated rabbit with adorable expressions',
  },
  {
    key: 'fox',
    label: 'Fox',
    emoji: '🦊',
    path: '/images/test/animals/fox.webp',
    descriptor: 'a clever illustrated fox with a mischievous smile',
  },
  {
    key: 'bear',
    label: 'Bear',
    emoji: '🐻',
    path: '/images/test/animals/bear.webp',
    descriptor: 'a friendly illustrated bear with cozy storybook warmth',
  },
  {
    key: 'jellyfish',
    label: 'Jellyfish',
    emoji: '🪼',
    path: '/images/test/animals/jellyfish.webp',
    descriptor: 'a glowing illustrated jellyfish with soft floating beauty',
  },
  {
    key: 'octopus',
    label: 'Octopus',
    emoji: '🐙',
    path: '/images/test/animals/octopus.webp',
    descriptor: 'a playful illustrated octopus with lively movement',
  },
]

const ARTIST_STYLES: ArtistStyleDef[] = [
  {
    key: 'van-gogh',
    label: 'Van Gogh',
    stylePrompt:
      'bold swirling brushwork, luminous color, vibrant motion, painterly texture inspired by Vincent van Gogh',
  },
  {
    key: 'monet',
    label: 'Monet',
    stylePrompt:
      'soft impressionist brushwork, atmospheric light, dreamy color harmonies inspired by Claude Monet',
  },
  {
    key: 'mucha',
    label: 'Mucha',
    stylePrompt:
      'ornamental art nouveau curves, elegant decorative framing, graceful stylization inspired by Alphonse Mucha',
  },
  {
    key: 'hokusai',
    label: 'Hokusai',
    stylePrompt:
      'ukiyo-e inspired linework, flat elegant color shapes, graphic composition inspired by Hokusai',
  },
  {
    key: 'kandinsky',
    label: 'Kandinsky',
    stylePrompt:
      'playful abstract geometry, rhythmic color relationships, expressive design inspired by Kandinsky',
  },
  {
    key: 'matisse',
    label: 'Matisse',
    stylePrompt:
      'bold simplified shapes, joyful color blocking, decorative clarity inspired by Henri Matisse',
  },
  {
    key: 'dali',
    label: 'Dalí',
    stylePrompt:
      'surreal dreamlike atmosphere, imaginative distortions, theatrical fantasy inspired by Salvador Dalí',
  },
  {
    key: 'vermeer',
    label: 'Vermeer',
    stylePrompt:
      'gentle natural light, refined realism, quiet luminous atmosphere inspired by Johannes Vermeer',
  },
]

const fallbackEndpoint = ENDPOINTS[0]!
const fallbackAnimal = ANIMALS[0]!
const fallbackAnimalB = ANIMALS[1] ?? fallbackAnimal
const fallbackArtistStyle = ARTIST_STYLES[0]!

const artStore = useArtStore() as ArtStoreLike
const serverStore = useServerStore()

const selectedEndpointId = ref<EndpointId>('flux')
const selectedAnimal = ref<AnimalKey>('fox')
const selectedAnimalA = ref<AnimalKey>('fox')
const selectedAnimalB = ref<AnimalKey>('rabbit')
const selectedStyle = ref<ArtistStyleKey>('van-gogh')

const serverId = ref<number | null>(null)
const extraPrompt = ref('')
const negativePrompt = ref(
  'blurry, watermark, text, logo, low quality, deformed',
)
const steps = ref(24)
const cfg = ref(7)
const guidance = ref(3.5)
const seed = ref<number | null>(null)
const width = ref(1024)
const height = ref(1024)

const sourceImageBase64 = ref<string | null>(null)
const sourceImagePreview = ref<string | null>(null)
const sourceImage2Base64 = ref<string | null>(null)
const sourceImage2Preview = ref<string | null>(null)

const showPayload = ref(false)
const showRawResult = ref(false)
const syncMessage = ref('')

const endpointDef = computed<EndpointDef>(() => {
  return (
    ENDPOINTS.find((endpoint) => endpoint.id === selectedEndpointId.value) ??
    fallbackEndpoint
  )
})

const artServers = computed(() => serverStore.artServers)

const selectedAnimalDef = computed<AnimalDef>(() => {
  return (
    ANIMALS.find((animal) => animal.key === selectedAnimal.value) ??
    fallbackAnimal
  )
})

const selectedAnimalADef = computed<AnimalDef>(() => {
  return (
    ANIMALS.find((animal) => animal.key === selectedAnimalA.value) ??
    fallbackAnimal
  )
})

const selectedAnimalBDef = computed<AnimalDef>(() => {
  return (
    ANIMALS.find((animal) => animal.key === selectedAnimalB.value) ??
    fallbackAnimalB
  )
})

const selectedStyleDef = computed<ArtistStyleDef>(() => {
  return (
    ARTIST_STYLES.find((style) => style.key === selectedStyle.value) ??
    fallbackArtistStyle
  )
})

const generatedRecord = computed<ArtImageLike | null>(() => {
  return (
    artStore.selectedArtImage ??
    artStore.selectedImage ??
    artStore.selectedArt ??
    null
  )
})

const resultImage = computed(() => {
  const image = generatedRecord.value

  if (!image) return null
  if (typeof image.imagePath === 'string' && image.imagePath) {
    return image.imagePath
  }
  if (typeof image.path === 'string' && image.path) {
    return image.path
  }
  if (typeof image.url === 'string' && image.url) {
    return image.url
  }
  if (typeof image.imageData === 'string' && image.imageData) {
    if (image.imageData.startsWith('data:')) return image.imageData

    const fileType = image.fileType || 'png'
    return `data:image/${fileType};base64,${image.imageData}`
  }

  return null
})

const resultData = computed(() => {
  return generatedRecord.value ?? artStore.artForm ?? null
})

const generationMessage = computed(() => artStore.generationMessage ?? '')

const isGenerating = computed(() => Boolean(artStore.isGenerating))

function joinParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part) => Boolean(part))
    .join(' ')
}

function setSize(nextWidth: number, nextHeight: number): void {
  width.value = nextWidth
  height.value = nextHeight
}

function updateSeed(event: Event): void {
  const target = event.target as HTMLInputElement | null
  const value = target?.value ?? ''
  seed.value = value ? Number(value) : null
}

function buildTextPrompt(): string {
  return joinParts([
    `Create a polished expressive illustration of ${selectedAnimalDef.value.descriptor}.`,
    'Full body character view.',
    'Centered composition.',
    'Clean soft background.',
    'High detail.',
    'Appealing proportions.',
    'Rich texture.',
    'Readable silhouette.',
    'Whimsical personality.',
    extraPrompt.value,
  ])
}

function buildRemixPrompt(): string {
  return joinParts([
    'Use the provided animal reference image as the subject.',
    `Remix it into a new illustration in the style of ${selectedStyleDef.value.label}.`,
    selectedStyleDef.value.stylePrompt,
    'Preserve the animal identity and keep it clearly recognizable.',
    'Make it expressive, charming, and visually rich.',
    'Full character focus.',
    'Clean background.',
    extraPrompt.value,
  ])
}

function buildCombinePrompt(): string {
  return joinParts([
    `Use Image A as ${selectedAnimalADef.value.label} and Image B as ${selectedAnimalBDef.value.label}.`,
    'Combine both animals into one single hybrid creature.',
    'Keep recognizable traits from both animals.',
    'Make the result feel intentional, cohesive, expressive, and charming.',
    'Full body character focus.',
    'Centered composition.',
    'Clean background.',
    'Illustrated style with strong silhouette and playful personality.',
    extraPrompt.value,
  ])
}

const builtPrompt = computed(() => {
  if (endpointDef.value.mode === 'remix') return buildRemixPrompt()
  if (endpointDef.value.mode === 'combine') return buildCombinePrompt()
  return buildTextPrompt()
})

function getAnimalByKey(key: AnimalKey): AnimalDef {
  return ANIMALS.find((animal) => animal.key === key) ?? fallbackAnimal
}

async function imagePathToBase64(path: string): Promise<string> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Failed to load test image: ${path}`)
  }

  const blob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result.split(',')[1] ?? '')
    }

    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function setImageSlot(slot: 1 | 2, animalKey: AnimalKey): Promise<void> {
  const animal = getAnimalByKey(animalKey)
  const base64 = await imagePathToBase64(animal.path)

  if (slot === 1) {
    sourceImageBase64.value = base64
    sourceImagePreview.value = animal.path
  } else {
    sourceImage2Base64.value = base64
    sourceImage2Preview.value = animal.path
  }
}

async function syncSourceImages(): Promise<void> {
  sourceImageBase64.value = null
  sourceImagePreview.value = null
  sourceImage2Base64.value = null
  sourceImage2Preview.value = null

  if (endpointDef.value.mode === 'remix') {
    await setImageSlot(1, selectedAnimal.value)
  }

  if (endpointDef.value.mode === 'combine') {
    await setImageSlot(1, selectedAnimalA.value)
    await setImageSlot(2, selectedAnimalB.value)
  }

  syncToArtStore()
}

const artFormPatch = computed<Record<string, unknown>>(() => {
  const patch: Record<string, unknown> = {
    mode: endpointDef.value.mode,
    workflow: endpointDef.value.id,
mode: endpointDef.value.mode,
generationMode: endpointDef.value.mode,
generationWorkflow: endpointDef.value.id,
    endpoint: endpointDef.value.route,
    route: endpointDef.value.route,
    engine: endpointDef.value.engine,
    designer: endpointDef.value.engine,
    serverId: serverId.value,
    prompt: builtPrompt.value,
    promptString: builtPrompt.value,
    artPrompt: builtPrompt.value,
    title: `Art Test ${endpointDef.value.label}`,
    pitch: endpointDef.value.mode,
    width: width.value,
    height: height.value,
    steps: steps.value,
    cfg: cfg.value,
    guidance: guidance.value,
    seed: seed.value,
    sourceAnimal: selectedAnimal.value,
    sourceAnimalA: selectedAnimalA.value,
    sourceAnimalB: selectedAnimalB.value,
    sourceStyle: selectedStyle.value,
  }

  if (endpointDef.value.needsNegative) {
    patch.negativePrompt = negativePrompt.value
  }

  if (endpointDef.value.mode === 'remix') {
    patch.sourceImageBase64 = sourceImageBase64.value
    patch.sourceImageABase64 = sourceImageBase64.value
    patch.sourceImagePreview = sourceImagePreview.value
    patch.imageId = null
    patch.imageIdA = null
  }

  if (endpointDef.value.mode === 'combine') {
    patch.sourceImageBase64 = sourceImageBase64.value
    patch.sourceImage2Base64 = sourceImage2Base64.value
    patch.sourceImageABase64 = sourceImageBase64.value
    patch.sourceImageBBase64 = sourceImage2Base64.value
    patch.sourceImagePreview = sourceImagePreview.value
    patch.sourceImage2Preview = sourceImage2Preview.value
    patch.imageIdA = null
    patch.imageIdB = null
  }

  return patch
})

const builtPayload = computed(() => {
  const payload: Record<string, unknown> = { ...artFormPatch.value }

  if (typeof payload.sourceImageBase64 === 'string') {
    payload.sourceImageBase64 = `[${payload.sourceImageBase64.length} chars]`
  }

  if (typeof payload.sourceImage2Base64 === 'string') {
    payload.sourceImage2Base64 = `[${payload.sourceImage2Base64.length} chars]`
  }

  if (typeof payload.sourceImageABase64 === 'string') {
    payload.sourceImageABase64 = `[${payload.sourceImageABase64.length} chars]`
  }

  if (typeof payload.sourceImageBBase64 === 'string') {
    payload.sourceImageBBase64 = `[${payload.sourceImageBBase64.length} chars]`
  }

  return payload
})

function syncToArtStore(): void {
  const patch = artFormPatch.value

  if (typeof artStore.setArtForm === 'function') {
    artStore.setArtForm(patch)
    syncMessage.value = 'Art form synced to generator.'
    return
  }

  if (typeof artStore.updateArtForm === 'function') {
    artStore.updateArtForm(patch)
    syncMessage.value = 'Art form updated for generator.'
    return
  }

  if (artStore.artForm && typeof artStore.artForm === 'object') {
    Object.assign(artStore.artForm, patch)
    syncMessage.value = 'Art form patched directly.'
    return
  }

  syncMessage.value = 'No writable art form method found.'
}

function clearResult(): void {
  if (typeof artStore.setArtForm === 'function') {
    artStore.setArtForm({
      ...artFormPatch.value,
      imagePath: null,
      imageData: null,
      artImageId: null,
    })
  }

  syncMessage.value = 'Result cleared locally.'
}

async function copyOutput(): Promise<void> {
  if (!resultData.value || typeof window === 'undefined') return

  await window.navigator.clipboard.writeText(
    JSON.stringify(resultData.value, null, 2),
  )
}

function downloadImage(): void {
  if (!resultImage.value) return

  const anchor = document.createElement('a')
  anchor.href = resultImage.value
  anchor.download = `art-test-${selectedEndpointId.value}-${Date.now()}.png`
  anchor.click()
}

watch(
  artServers,
  (servers) => {
    if (!serverId.value && servers.length) {
      serverId.value = servers[0]?.id ?? null
    }
  },
  { immediate: true },
)

watch(
  [selectedEndpointId, selectedAnimal, selectedAnimalA, selectedAnimalB],
  async () => {
    await syncSourceImages()
  },
  { immediate: false },
)

watch(
  [
    serverId,
    selectedStyle,
    extraPrompt,
    negativePrompt,
    steps,
    cfg,
    guidance,
    seed,
    width,
    height,
    sourceImageBase64,
    sourceImage2Base64,
  ],
  () => {
    syncToArtStore()
  },
  { immediate: false },
)

onMounted(async () => {
  if (!serverStore.hasLoaded) {
    serverStore.initialize({ fetchRemote: true })
  }

  if (typeof artStore.prepareArtGenerator === 'function') {
    await artStore.prepareArtGenerator()
  }

  await syncSourceImages()
  syncToArtStore()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="rounded-2xl border border-base-300 bg-base-200 p-4 shadow-lg md:p-6"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300 bg-base-100 text-3xl"
          >
            {{ endpointDef.icon }}
          </div>
          <div>
            <h1 class="text-2xl font-bold">Art Test Lab</h1>
            <p class="text-sm opacity-70">
              Text prompt upgrades, Kontext remix, and animal Kombine chaos.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="badge badge-outline badge-lg">
            {{ endpointDef.engine }}
          </div>
          <div
            class="rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs"
          >
            {{ endpointDef.route }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside class="flex flex-col gap-6">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div
            class="mb-3 text-sm font-bold uppercase tracking-widest opacity-60"
          >
            Endpoint
          </div>

          <div class="grid gap-2">
            <button
              v-for="endpoint in ENDPOINTS"
              :key="endpoint.id"
              type="button"
              class="flex items-start gap-3 rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-base-100"
              :class="
                selectedEndpointId === endpoint.id
                  ? 'border-primary bg-base-100'
                  : 'border-base-300 bg-base-200'
              "
              @click="selectedEndpointId = endpoint.id"
            >
              <div class="text-xl">{{ endpoint.icon }}</div>
              <div class="flex flex-col gap-1">
                <div class="font-bold">{{ endpoint.label }}</div>
                <div class="text-xs opacity-70">{{ endpoint.description }}</div>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div
            class="mb-3 text-sm font-bold uppercase tracking-widest opacity-60"
          >
            Art Server
          </div>

          <div v-if="serverStore.loading" class="text-sm opacity-60">
            Loading servers...
          </div>

          <div v-else-if="!artServers.length" class="text-sm text-warning">
            No art servers found.
          </div>

          <div v-else class="flex flex-col gap-2">
            <select
              v-model="serverId"
              class="select select-bordered rounded-2xl bg-base-100"
            >
              <option :value="null">Select server</option>
              <option
                v-for="server in artServers"
                :key="server.id"
                :value="server.id"
              >
                {{ server.label || server.title }} ({{ server.serverType }})
              </option>
            </select>

            <div
              v-if="serverId"
              class="rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-xs opacity-70"
            >
              {{ serverStore.getServerById(serverId)?.baseUrl }}
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div
            class="mb-3 text-sm font-bold uppercase tracking-widest opacity-60"
          >
            Parameters
          </div>

          <div class="flex flex-col gap-4">
            <div v-if="endpointDef.needsSteps" class="flex flex-col gap-2">
              <div class="flex items-center justify-between text-sm">
                <span>Steps</span>
                <span class="font-bold">{{ steps }}</span>
              </div>
              <input
                v-model.number="steps"
                type="range"
                min="1"
                max="60"
                step="1"
                class="range range-primary range-sm"
              />
            </div>

            <div v-if="endpointDef.needsCfg" class="flex flex-col gap-2">
              <div class="flex items-center justify-between text-sm">
                <span>CFG</span>
                <span class="font-bold">{{ cfg }}</span>
              </div>
              <input
                v-model.number="cfg"
                type="range"
                min="1"
                max="20"
                step="0.5"
                class="range range-secondary range-sm"
              />
            </div>

            <div v-if="endpointDef.needsGuidance" class="flex flex-col gap-2">
              <div class="flex items-center justify-between text-sm">
                <span>Guidance</span>
                <span class="font-bold">{{ guidance }}</span>
              </div>
              <input
                v-model.number="guidance"
                type="range"
                min="1"
                max="10"
                step="0.5"
                class="range range-accent range-sm"
              />
            </div>

            <div v-if="endpointDef.needsSeed" class="flex flex-col gap-2">
              <div class="flex items-center justify-between text-sm">
                <span>Seed</span>
                <span class="font-bold">{{ seed ?? 'random' }}</span>
              </div>

              <div class="flex gap-2">
                <input
                  :value="seed ?? ''"
                  type="number"
                  placeholder="random"
                  class="input input-bordered w-full rounded-2xl bg-base-100"
                  @input="updateSeed"
                />
                <button
                  class="btn rounded-2xl"
                  type="button"
                  @click="seed = null"
                >
                  ⟳
                </button>
                <button
                  class="btn rounded-2xl"
                  type="button"
                  @click="seed = Math.floor(Math.random() * 999999999)"
                >
                  ✦
                </button>
              </div>
            </div>

            <div v-if="endpointDef.needsSize" class="flex flex-col gap-3">
              <div class="text-sm font-bold">Size</div>

              <div class="grid gap-3 md:grid-cols-2">
                <label class="form-control">
                  <span class="mb-2 text-sm">Width</span>
                  <input
                    v-model.number="width"
                    type="number"
                    class="input input-bordered rounded-2xl bg-base-100"
                  />
                </label>

                <label class="form-control">
                  <span class="mb-2 text-sm">Height</span>
                  <input
                    v-model.number="height"
                    type="number"
                    class="input input-bordered rounded-2xl bg-base-100"
                  />
                </label>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  class="btn btn-sm rounded-xl"
                  type="button"
                  @click="setSize(768, 768)"
                >
                  768²
                </button>
                <button
                  class="btn btn-sm rounded-xl"
                  type="button"
                  @click="setSize(1024, 1024)"
                >
                  1024²
                </button>
                <button
                  class="btn btn-sm rounded-xl"
                  type="button"
                  @click="setSize(1216, 832)"
                >
                  16:9
                </button>
                <button
                  class="btn btn-sm rounded-xl"
                  type="button"
                  @click="setSize(832, 1216)"
                >
                  9:16
                </button>
              </div>
            </div>

            <div v-if="endpointDef.needsNegative" class="flex flex-col gap-2">
              <div class="text-sm font-bold">Negative Prompt</div>
              <textarea
                v-model="negativePrompt"
                rows="3"
                class="textarea textarea-bordered rounded-2xl bg-base-100"
                placeholder="What to avoid"
              />
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div
            class="mb-3 text-sm font-bold uppercase tracking-widest opacity-60"
          >
            Debug
          </div>

          <div class="flex flex-col gap-2">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="showPayload"
                type="checkbox"
                class="toggle toggle-primary"
              />
              <span class="label-text">Show payload</span>
            </label>

            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="showRawResult"
                type="checkbox"
                class="toggle toggle-secondary"
              />
              <span class="label-text">Show raw result</span>
            </label>
          </div>
        </div>
      </aside>

      <main class="flex flex-col gap-6">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4 md:p-6">
          <div class="mb-4 text-lg font-bold">Test Builder</div>

          <div v-if="endpointDef.mode === 'text'" class="flex flex-col gap-6">
            <div class="flex flex-col gap-3">
              <div
                class="text-sm font-bold uppercase tracking-widest opacity-60"
              >
                Subject Animal
              </div>

              <div
                class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              >
                <button
                  v-for="animal in ANIMALS"
                  :key="animal.key"
                  type="button"
                  class="flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition hover:border-primary hover:bg-base-100"
                  :class="
                    selectedAnimal === animal.key
                      ? 'border-primary bg-base-100'
                      : 'border-base-300 bg-base-200'
                  "
                  @click="selectedAnimal = animal.key"
                >
                  <span class="text-xl">{{ animal.emoji }}</span>
                  <span class="font-medium">{{ animal.label }}</span>
                </button>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
                <img
                  :src="selectedAnimalDef.path"
                  :alt="selectedAnimalDef.label"
                  class="aspect-square w-full rounded-xl object-cover"
                />
              </div>

              <label class="form-control">
                <span class="mb-2 text-sm font-bold">Extra Prompt Notes</span>
                <textarea
                  v-model="extraPrompt"
                  rows="6"
                  class="textarea textarea-bordered rounded-2xl bg-base-100"
                  placeholder="Optional flavor. Example: wearing a tiny wizard hat, cozy storybook vibe, cinematic lighting."
                />
              </label>
            </div>
          </div>

          <div
            v-else-if="endpointDef.mode === 'remix'"
            class="flex flex-col gap-6"
          >
            <div class="flex flex-col gap-3">
              <div
                class="text-sm font-bold uppercase tracking-widest opacity-60"
              >
                Source Animal
              </div>

              <div
                class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              >
                <button
                  v-for="animal in ANIMALS"
                  :key="animal.key"
                  type="button"
                  class="flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition hover:border-primary hover:bg-base-100"
                  :class="
                    selectedAnimal === animal.key
                      ? 'border-primary bg-base-100'
                      : 'border-base-300 bg-base-200'
                  "
                  @click="selectedAnimal = animal.key"
                >
                  <span class="text-xl">{{ animal.emoji }}</span>
                  <span class="font-medium">{{ animal.label }}</span>
                </button>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
                <img
                  :src="selectedAnimalDef.path"
                  :alt="selectedAnimalDef.label"
                  class="aspect-square w-full rounded-xl object-cover"
                />
              </div>

              <div class="flex flex-col gap-4">
                <label class="form-control">
                  <span class="mb-2 text-sm font-bold">Artist Style</span>
                  <select
                    v-model="selectedStyle"
                    class="select select-bordered rounded-2xl bg-base-100"
                  >
                    <option
                      v-for="style in ARTIST_STYLES"
                      :key="style.key"
                      :value="style.key"
                    >
                      {{ style.label }}
                    </option>
                  </select>
                </label>

                <label class="form-control">
                  <span class="mb-2 text-sm font-bold">Extra Prompt Notes</span>
                  <textarea
                    v-model="extraPrompt"
                    rows="5"
                    class="textarea textarea-bordered rounded-2xl bg-base-100"
                    placeholder="Optional flavor. Example: moonlit garden, ornate frame, dreamy palette."
                  />
                </label>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col gap-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="flex flex-col gap-3">
                <div
                  class="text-sm font-bold uppercase tracking-widest opacity-60"
                >
                  Animal A
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    v-for="animal in ANIMALS"
                    :key="`a-${animal.key}`"
                    type="button"
                    class="flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition hover:border-primary hover:bg-base-100"
                    :class="
                      selectedAnimalA === animal.key
                        ? 'border-primary bg-base-100'
                        : 'border-base-300 bg-base-200'
                    "
                    @click="selectedAnimalA = animal.key"
                  >
                    <span class="text-xl">{{ animal.emoji }}</span>
                    <span class="font-medium">{{ animal.label }}</span>
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-3">
                <div
                  class="text-sm font-bold uppercase tracking-widest opacity-60"
                >
                  Animal B
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                  <button
                    v-for="animal in ANIMALS"
                    :key="`b-${animal.key}`"
                    type="button"
                    class="flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition hover:border-primary hover:bg-base-100"
                    :class="
                      selectedAnimalB === animal.key
                        ? 'border-primary bg-base-100'
                        : 'border-base-300 bg-base-200'
                    "
                    @click="selectedAnimalB = animal.key"
                  >
                    <span class="text-xl">{{ animal.emoji }}</span>
                    <span class="font-medium">{{ animal.label }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
                <div class="mb-2 text-sm font-bold">
                  {{ selectedAnimalADef.label }}
                </div>
                <img
                  :src="selectedAnimalADef.path"
                  :alt="selectedAnimalADef.label"
                  class="aspect-square w-full rounded-xl object-cover"
                />
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
                <div class="mb-2 text-sm font-bold">
                  {{ selectedAnimalBDef.label }}
                </div>
                <img
                  :src="selectedAnimalBDef.path"
                  :alt="selectedAnimalBDef.label"
                  class="aspect-square w-full rounded-xl object-cover"
                />
              </div>
            </div>

            <label class="form-control">
              <span class="mb-2 text-sm font-bold">Extra Prompt Notes</span>
              <textarea
                v-model="extraPrompt"
                rows="5"
                class="textarea textarea-bordered rounded-2xl bg-base-100"
                placeholder="Optional flavor. Example: tiny forest guardian, underwater bioluminescence, storybook texture."
              />
            </label>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4 md:p-6">
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="text-lg font-bold">Built Prompt</div>
            <div class="text-sm opacity-60">{{ endpointDef.label }}</div>
          </div>

          <textarea
            :value="builtPrompt"
            rows="8"
            readonly
            class="textarea textarea-bordered w-full rounded-2xl bg-base-100 font-mono text-sm"
          />
        </div>

        <div
          v-if="showPayload"
          class="rounded-2xl border border-base-300 bg-base-200 p-4 md:p-6"
        >
          <div class="mb-3 text-lg font-bold">Payload Preview</div>
          <pre
            class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 p-4 text-xs"
            >{{ JSON.stringify(builtPayload, null, 2) }}</pre
          >
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4 md:p-6">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="text-lg font-bold">Generate</div>
              <div class="text-sm opacity-60">
                Synced to artStore and routed through generate-button.
              </div>
            </div>

            <div
              v-if="syncMessage"
              class="rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-xs font-semibold text-info"
            >
              {{ syncMessage }}
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <generate-button />

            <button
              type="button"
              class="btn btn-ghost rounded-2xl"
              :disabled="isGenerating"
              @click="clearResult"
            >
              Clear
            </button>

            <div v-if="isGenerating" class="badge badge-success badge-lg">
              Generating...
            </div>

            <div v-if="!serverId" class="text-sm text-warning">
              Select a server first
            </div>
          </div>

          <div
            v-if="generationMessage"
            class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
          >
            {{ generationMessage }}
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4 md:p-6">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div class="text-lg font-bold">Result</div>

            <div v-if="resultImage" class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-sm rounded-xl"
                @click="downloadImage"
              >
                Download
              </button>
              <button
                type="button"
                class="btn btn-sm rounded-xl"
                @click="copyOutput"
              >
                Copy JSON
              </button>
            </div>
          </div>

          <div
            class="flex min-h-105 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-4"
          >
            <div
              v-if="isGenerating"
              class="flex flex-col items-center gap-3 text-center"
            >
              <span class="loading loading-spinner loading-lg text-primary" />
              <div class="text-lg font-bold">
                Generating with {{ endpointDef.label }}
              </div>
            </div>

            <img
              v-else-if="resultImage"
              :src="resultImage"
              alt="Generated result"
              class="max-h-[75vh] rounded-2xl object-contain"
            />

            <div
              v-else
              class="flex flex-col items-center gap-3 text-center opacity-60"
            >
              <div class="text-5xl">{{ endpointDef.icon }}</div>
              <div class="text-lg font-bold">
                Your generated image will appear here
              </div>
              <div class="text-sm">No mystery collage nonsense this time.</div>
            </div>
          </div>
        </div>

        <div
          v-if="showRawResult && resultData"
          class="rounded-2xl border border-base-300 bg-base-200 p-4 md:p-6"
        >
          <div class="mb-3 text-lg font-bold">Raw API / Store Result</div>
          <pre
            class="overflow-x-auto rounded-2xl border border-base-300 bg-base-100 p-4 text-xs"
            >{{ JSON.stringify(resultData, null, 2) }}</pre
          >
        </div>
      </main>
    </div>
  </div>
</template>
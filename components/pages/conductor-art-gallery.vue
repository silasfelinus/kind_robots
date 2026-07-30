<!-- /components/pages/conductor-art-gallery.vue -->
<template>
  <section
    class="flex min-h-0 min-w-0 flex-col gap-3 overflow-x-hidden rounded-2xl border border-base-300 bg-base-100 p-4"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <header class="flex min-w-0 flex-wrap items-center gap-2">
      <Icon name="kind-icon:image" class="size-4 text-secondary" />
      <h4
        class="truncate text-xs font-bold uppercase tracking-wide text-base-content/60"
      >
        Project Images
      </h4>
      <span v-if="matchedCollection" class="badge badge-secondary badge-xs">
        {{ collectionSlides.length }} collection
      </span>
      <span v-if="projectSlides.length" class="badge badge-accent badge-xs">
        {{ projectSlides.length }} inspiration
      </span>
      <span v-if="slides.length" class="ml-auto text-xs text-base-content/40">
        {{ activeIndex + 1 }} / {{ slides.length }}
      </span>
      <template v-if="mayEdit && resolvedProjectId">
        <button
          type="button"
          class="btn btn-secondary btn-xs gap-1 rounded-lg"
          @click="openGenerateForm()"
        >
          <Icon name="kind-icon:sparkles" class="size-3" />
          Generate replacement
        </button>
        <button
          type="button"
          class="btn btn-primary btn-xs gap-1 rounded-lg"
          @click="openReplaceForm()"
        >
          <Icon name="kind-icon:upload" class="size-3" />
          Upload image
        </button>
      </template>
    </header>

    <div
      v-if="slides.length"
      class="group relative min-h-[14rem] flex-1 overflow-hidden rounded-xl border border-base-300 bg-base-200 sm:min-h-[18rem]"
    >
      <Transition name="conductor-slide-fade">
        <img
          :key="activeSlide.src"
          :src="activeSlide.src"
          :alt="activeSlide.label"
          class="absolute inset-0 h-full w-full object-cover"
          @error="dropSlide(activeSlide.src)"
        />
      </Transition>

      <div
        class="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 bg-linear-to-t from-base-300/90 to-transparent p-3 pt-10"
      >
        <span
          class="badge badge-sm border-0 bg-base-100/85 font-semibold backdrop-blur"
        >
          {{ activeSlide.label }}
        </span>
        <div
          v-if="mayEdit && resolvedProjectId && activeSlide.field"
          class="flex flex-wrap gap-1.5"
        >
          <button
            type="button"
            class="btn btn-secondary btn-sm gap-1 rounded-lg border-0 shadow"
            @click="openGenerateForm(activeSlide.field)"
          >
            <Icon name="kind-icon:sparkles" class="size-3.5" />
            Generate {{ activeSlide.label }}
          </button>
          <button
            type="button"
            class="btn btn-sm gap-1 rounded-lg border-0 bg-base-100/85 shadow backdrop-blur hover:bg-base-100"
            @click="openReplaceForm(activeSlide.field)"
          >
            <Icon name="kind-icon:upload" class="size-3.5" />
            Upload {{ activeSlide.label }}
          </button>
        </div>
      </div>

      <template v-if="slides.length > 1">
        <button
          type="button"
          class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-0 shadow group-hover:opacity-100"
          aria-label="Previous image"
          @click="step(-1)"
        >
          <Icon name="kind-icon:chevron-left" class="size-4" />
        </button>
        <button
          type="button"
          class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-0 shadow group-hover:opacity-100"
          aria-label="Next image"
          @click="step(1)"
        >
          <Icon name="kind-icon:chevron-right" class="size-4" />
        </button>
      </template>
    </div>

    <div
      v-else
      class="flex min-h-[14rem] flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-300 bg-base-200/50 p-4 text-center"
    >
      <Icon name="kind-icon:image" class="size-8 text-base-content/20" />
      <p class="text-xs font-semibold text-base-content/50">
        No project images yet.
      </p>
      <div v-if="mayEdit && resolvedProjectId" class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-secondary btn-sm gap-1 rounded-xl"
          @click="openGenerateForm()"
        >
          <Icon name="kind-icon:sparkles" class="size-4" />
          Generate first image
        </button>
        <button
          type="button"
          class="btn btn-primary btn-sm gap-1 rounded-xl"
          @click="openReplaceForm()"
        >
          <Icon name="kind-icon:upload" class="size-4" />
          Upload first image
        </button>
      </div>
    </div>

    <form
      v-if="showGenerateForm"
      class="space-y-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3"
      @submit.prevent="submitGeneration"
    >
      <div class="flex items-start gap-2">
        <div>
          <p class="text-sm font-bold">Generate a Project replacement</p>
          <p class="text-xs text-base-content/50">
            Describe the image you want. It will be queued as an ArtJob and
            attached to this Project automatically, using Krea 2 by default.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs ml-auto rounded-lg"
          :disabled="generating"
          @click="closeGenerateForm"
        >
          <Icon name="kind-icon:x" class="size-3" />
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Replace</span>
          <select
            v-model="generationField"
            class="select select-bordered select-sm rounded-xl"
            :disabled="generating"
          >
            <option value="imagePath">Icon · square</option>
            <option value="cardPath">Card · 2:3 portrait</option>
            <option value="heroPath">Hero · 16:9 landscape</option>
          </select>
        </label>
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Engine</span>
          <select
            v-model="generationEngine"
            class="select select-bordered select-sm rounded-xl"
            :disabled="generating"
          >
            <option value="krea2">Krea 2 · default</option>
            <option value="flux">Flux</option>
            <option value="comfy">ComfyUI</option>
          </select>
        </label>
      </div>

      <label class="form-control gap-1">
        <span class="text-xs font-semibold text-base-content/60">Art prompt</span>
        <textarea
          v-model="generationPrompt"
          class="textarea textarea-bordered min-h-28 rounded-xl text-sm"
          maxlength="4000"
          :placeholder="generationPlaceholder"
          :disabled="generating"
        />
        <span class="text-[0.65rem] text-base-content/35">
          The Project title, description, pitch, and goal are sent as supporting
          context. Your prompt remains the primary art direction.
        </span>
      </label>

      <fieldset class="space-y-1">
        <legend class="text-xs font-semibold text-base-content/60">
          Current image
        </legend>
        <label
          class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60"
        >
          <input
            v-model="generationPreserveOriginal"
            type="radio"
            :value="true"
            class="radio radio-secondary radio-sm mt-0.5"
            :disabled="generating"
          />
          <span>
            <span class="block text-sm font-semibold">Keep as inspiration</span>
            <span class="block text-xs text-base-content/45">
              Save the current version in this Project gallery before the
              generated image replaces it.
            </span>
          </span>
        </label>
        <label
          class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60"
        >
          <input
            v-model="generationPreserveOriginal"
            type="radio"
            :value="false"
            class="radio radio-secondary radio-sm mt-0.5"
            :disabled="generating"
          />
          <span>
            <span class="block text-sm font-semibold">Do not retain it</span>
            <span class="block text-xs text-base-content/45">
              The current version is not added to the Project inspiration
              gallery when the replacement is queued.
            </span>
          </span>
        </label>
      </fieldset>

      <div class="rounded-lg bg-base-100/60 px-3 py-2 text-xs text-base-content/55">
        <strong>Target:</strong> {{ generationMeta.label }} ·
        {{ generationMeta.size }} ·
        <code class="break-all">{{ generationTargetUrl }}</code>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="generationMessage"
          class="min-w-0 flex-1 text-xs"
          :class="generationError ? 'text-error' : 'text-success'"
        >
          {{ generationMessage }}
        </p>
        <button
          type="submit"
          class="btn btn-secondary btn-sm ml-auto gap-1.5 rounded-xl"
          :disabled="generationPrompt.trim().length < 3 || generating"
        >
          <span v-if="generating" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:sparkles" class="size-4" />
          Queue {{ generationMeta.label }} generation
        </button>
      </div>
    </form>

    <form
      v-if="showReplaceForm"
      class="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3"
      @submit.prevent="submitReplacement"
    >
      <div class="flex items-start gap-2">
        <div>
          <p class="text-sm font-bold">Upload and replace</p>
          <p class="text-xs text-base-content/50">
            Choose the Project asset and what happens to the previous version.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs ml-auto rounded-lg"
          :disabled="replacing"
          @click="closeReplaceForm"
        >
          <Icon name="kind-icon:x" class="size-3" />
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">Replace</span>
          <select
            v-model="replacementField"
            class="select select-bordered select-sm rounded-xl"
            :disabled="replacing"
          >
            <option value="imagePath">Icon</option>
            <option value="cardPath">Card</option>
            <option value="heroPath">Hero</option>
          </select>
        </label>
        <label class="form-control gap-1">
          <span class="text-xs font-semibold text-base-content/60">New image</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="file-input file-input-bordered file-input-sm w-full rounded-xl"
            :disabled="replacing"
            @change="handleFileChange"
          />
        </label>
      </div>

      <fieldset class="space-y-1">
        <legend class="text-xs font-semibold text-base-content/60">
          Previous image
        </legend>
        <label
          class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60"
        >
          <input
            v-model="preserveOriginal"
            type="radio"
            :value="true"
            class="radio radio-primary radio-sm mt-0.5"
            :disabled="replacing"
          />
          <span>
            <span class="block text-sm font-semibold">Keep as inspiration</span>
            <span class="block text-xs text-base-content/45">
              The previous version remains in this Project gallery.
            </span>
          </span>
        </label>
        <label
          class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60"
        >
          <input
            v-model="preserveOriginal"
            type="radio"
            :value="false"
            class="radio radio-primary radio-sm mt-0.5"
            :disabled="replacing"
          />
          <span>
            <span class="block text-sm font-semibold">Remove from Project</span>
            <span class="block text-xs text-base-content/45">
              The previous image is not retained as an inspiration item.
            </span>
          </span>
        </label>
      </fieldset>

      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="replacementMessage"
          class="min-w-0 flex-1 text-xs"
          :class="replacementError ? 'text-error' : 'text-success'"
        >
          {{ replacementMessage }}
        </p>
        <button
          type="submit"
          class="btn btn-primary btn-sm ml-auto gap-1.5 rounded-xl"
          :disabled="!replacementFile || replacing"
        >
          <span v-if="replacing" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:upload" class="size-4" />
          Upload & replace
        </button>
      </div>
    </form>

    <div
      v-if="slides.length > 1"
      class="flex shrink-0 flex-wrap justify-center gap-1.5 overflow-x-hidden pb-1"
    >
      <button
        v-for="(slide, index) in slides"
        :key="slide.src"
        type="button"
        class="relative size-12 overflow-hidden rounded-lg border transition-all"
        :class="
          index === activeIndex
            ? 'border-primary ring-2 ring-primary/40'
            : 'border-base-300 opacity-60 hover:opacity-100'
        "
        :aria-label="`Show ${slide.label}`"
        :title="slide.label"
        @click="activeIndex = index"
      >
        <img
          :src="slide.src"
          :alt="slide.label"
          class="h-full w-full object-cover"
        />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProjectStore } from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type ProjectArtField = 'imagePath' | 'cardPath' | 'heroPath'
type ProjectArtVariant = 'icon' | 'card' | 'hero'
type GenerationEngine = 'krea2' | 'flux' | 'comfy'
type Slide = { src: string; label: string; field?: ProjectArtField }
type ProjectArtLink = {
  createdAt: string | Date
  ArtImage: {
    id: number
    imagePath?: string | null
    fileName?: string | null
    fileType?: string | null
  }
}
type ArtQueueResult = {
  jobId: number
  status: string
}

const FIELD_META: Record<
  ProjectArtField,
  {
    label: string
    variant: ProjectArtVariant
    size: string
    width: number
    height: number
  }
> = {
  imagePath: {
    label: 'Icon',
    variant: 'icon',
    size: '256×256',
    width: 256,
    height: 256,
  },
  cardPath: {
    label: 'Card',
    variant: 'card',
    size: '512×768',
    width: 512,
    height: 768,
  },
  heroPath: {
    label: 'Hero',
    variant: 'hero',
    size: '1280×720',
    width: 1280,
    height: 720,
  },
}

const CONDUCTOR_IMAGE_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'
const PROJECT_ART_STATUS_POLL_MS = 2_000

const props = defineProps<{
  slug: string
  projectId?: number | null
  canEdit?: boolean
  heroPath?: string
  cardPath?: string
  iconPath?: string
}>()

const collectionStore = useCollectionStore()
const projectStore = useProjectStore()
const userStore = useUserStore()
const activeIndex = ref(0)
const paused = ref(false)
const failedSrcs = ref<Set<string>>(new Set())
const projectArtLinks = ref<ProjectArtLink[]>([])

const showReplaceForm = ref(false)
const replacementField = ref<ProjectArtField>('cardPath')
const replacementFile = ref<File | null>(null)
const preserveOriginal = ref(true)
const replacing = ref(false)
const replacementMessage = ref('')
const replacementError = ref(false)

const showGenerateForm = ref(false)
const generationField = ref<ProjectArtField>('cardPath')
const generationPrompt = ref('')
const generationEngine = ref<GenerationEngine>('krea2')
const generationPreserveOriginal = ref(true)
const generating = ref(false)
const generationMessage = ref('')
const generationError = ref(false)
let activeJobId: number | null = null
let pollTimer: ReturnType<typeof setTimeout> | null = null
let stopped = false

const resolvedProject = computed(() => projectStore.projectForSlug(props.slug))
const resolvedProjectId = computed(
  () => props.projectId ?? resolvedProject.value?.id ?? null,
)
const mayEdit = computed(() => props.canEdit || userStore.isAdmin)
const generationMeta = computed(() => FIELD_META[generationField.value])
const generationTargetUrl = computed(
  () =>
    `${CONDUCTOR_IMAGE_BASE}/${props.slug}-${generationMeta.value.variant}.webp`,
)
const generationPlaceholder = computed(() => {
  const title = resolvedProject.value?.title || props.slug
  return `Describe a distinctive ${generationMeta.value.label.toLowerCase()} for ${title}. Include the subject, mood, setting, composition, and visual style; avoid text unless it is essential.`
})

function normalizeImageSrc(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return ''
  if (/^(https?:|data:image\/)/.test(trimmed)) return trimmed
  const clean = trimmed.replace(/^\/?(app\/)?public\/+/, '')
  if (clean.startsWith('/')) return clean
  if (clean.startsWith('images/')) return `/${clean}`
  return `/images/${clean}`
}

function dedupeKey(src: string): string {
  return src.replace(/([?&])v=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
}

const matchedCollection = computed(() => {
  void collectionStore.collections
  return collectionStore.findCollectionBySlug?.(props.slug) ?? null
})

const collectionSlides = computed<Slide[]>(() => {
  if (!matchedCollection.value) return []
  const images =
    collectionStore.getCollectionImages?.(matchedCollection.value.id) ?? []
  return images
    .map((image, index) => ({
      src: normalizeImageSrc(
        image.imagePath ||
          (image as { path?: string | null }).path ||
          image.fileName,
      ),
      label: `Collection ${index + 1}`,
    }))
    .filter((slide) => Boolean(slide.src))
})

const projectSlides = computed<Slide[]>(() =>
  projectArtLinks.value
    .map((link, index) => ({
      src: normalizeImageSrc(
        link.ArtImage.imagePath || `/api/art/images/${link.ArtImage.id}/file`,
      ),
      label: link.ArtImage.fileName || `Inspiration ${index + 1}`,
    }))
    .filter((slide) => Boolean(slide.src)),
)

const slides = computed<Slide[]>(() => {
  const out: Slide[] = []
  const seen = new Set<string>()
  const push = (
    src: string | null | undefined,
    label: string,
    field?: ProjectArtField,
  ) => {
    const normalized = normalizeImageSrc(src)
    const key = dedupeKey(normalized)
    if (!normalized || seen.has(key) || failedSrcs.value.has(normalized)) return
    seen.add(key)
    out.push({ src: normalized, label, field })
  }

  push(props.heroPath, 'Hero', 'heroPath')
  push(props.cardPath, 'Card', 'cardPath')
  push(props.iconPath, 'Icon', 'imagePath')
  for (const slide of projectSlides.value) push(slide.src, slide.label)
  for (const slide of collectionSlides.value) push(slide.src, slide.label)
  return out
})

const activeSlide = computed<Slide>(() =>
  slides.value[activeIndex.value] ??
  slides.value[0] ?? { src: '', label: '' },
)

function step(direction: number) {
  const count = slides.value.length
  if (count) activeIndex.value = (activeIndex.value + direction + count) % count
}

function dropSlide(src: string) {
  failedSrcs.value = new Set([...failedSrcs.value, src])
}

function openReplaceForm(field?: ProjectArtField) {
  closeGenerateForm()
  replacementField.value = field || activeSlide.value.field || 'cardPath'
  replacementMessage.value = ''
  replacementError.value = false
  showReplaceForm.value = true
  paused.value = true
}

function closeReplaceForm() {
  if (replacing.value) return
  showReplaceForm.value = false
  replacementFile.value = null
  replacementMessage.value = ''
  replacementError.value = false
}

function openGenerateForm(field?: ProjectArtField) {
  closeReplaceForm()
  generationField.value = field || activeSlide.value.field || 'cardPath'
  generationMessage.value = ''
  generationError.value = false
  showGenerateForm.value = true
  paused.value = true
}

function closeGenerateForm() {
  if (generating.value) return
  showGenerateForm.value = false
  generationMessage.value = ''
  generationError.value = false
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement | null
  replacementFile.value = input?.files?.[0] ?? null
  replacementMessage.value = ''
  replacementError.value = false
}

async function fetchProjectArt(force = false) {
  const projectId = resolvedProjectId.value
  if (!projectId) {
    projectArtLinks.value = []
    return
  }
  const query = force ? `?refresh=${Date.now()}` : ''
  const response = await performFetch<ProjectArtLink[]>(
    `/api/projects/${projectId}/art${query}`,
    force ? { cache: 'no-store' } : {},
  )
  if (response.success) projectArtLinks.value = response.data ?? []
}

async function submitGeneration() {
  const projectId = resolvedProjectId.value
  const prompt = generationPrompt.value.trim()
  if (!projectId || prompt.length < 3 || generating.value) return

  generating.value = true
  generationMessage.value = ''
  generationError.value = false

  try {
    const project = resolvedProject.value
    const queueResponse = await performFetch<ArtQueueResult>(
      '/api/art/enqueue',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: generationEngine.value,
          promptString: prompt,
          width: generationMeta.value.width,
          height: generationMeta.value.height,
          projectSlug: props.slug,
          isPublic: project?.isPublic ?? true,
          isMature: project?.isMature ?? false,
          designer:
            project?.designer || userStore.user?.username || 'Kind Robots',
          entityArt: {
            entityType: 'project',
            entityId: projectId,
            field: generationField.value,
            preserveOriginal: generationPreserveOriginal.value,
            mode: 'recreate',
          },
        }),
      },
      1,
      30_000,
    )
    const jobId = Number(queueResponse.data?.jobId)
    if (!queueResponse.success || !Number.isInteger(jobId) || jobId <= 0) {
      throw new Error(
        queueResponse.message || 'Project art generation was not queued.',
      )
    }

    activeJobId = jobId
    generationMessage.value = `${generationMeta.value.label} queued as ArtJob ${jobId}. It will replace the Project asset when generation finishes.`
    generationPrompt.value = ''
    startPolling(jobId)
  } catch (error) {
    generationError.value = true
    generationMessage.value =
      error instanceof Error ? error.message : 'Project art generation failed to queue.'
  } finally {
    generating.value = false
  }
}

function startPolling(jobId: number) {
  if (pollTimer) clearTimeout(pollTimer)
  const poll = async () => {
    if (stopped || activeJobId !== jobId) return
    try {
      const response = await performFetch<{
        job: {
          id: number
          status: string
          error?: string | null
        }
      }>(`/api/art/queue/${jobId}`, { cache: 'no-store' })
      if (!response.success) {
        throw new Error(response.message || 'Queue check failed.')
      }
      const status = String(response.data?.job?.status || '')
      if (status === 'DONE') {
        const projectId = resolvedProjectId.value
        await Promise.all([
          projectId ? projectStore.fetchProject(projectId) : Promise.resolve(),
          fetchProjectArt(true),
        ])
        generationMessage.value = `ArtJob ${jobId} finished and the ${generationMeta.value.label.toLowerCase()} was replaced.`
        generationError.value = false
        activeJobId = null
        pollTimer = null
        return
      }
      if (status === 'FAILED' || status === 'CANCELLED') {
        generationMessage.value =
          response.data?.job?.error || `ArtJob ${jobId} ended as ${status}.`
        generationError.value = true
        activeJobId = null
        pollTimer = null
        return
      }
      generationMessage.value = `ArtJob ${jobId}: ${status || 'PENDING'}. It will attach automatically when complete.`
    } catch {
      // Completion is durable on the server; transient polling failures should
      // not turn a valid queued job into a visible failure.
    }
    pollTimer = setTimeout(poll, PROJECT_ART_STATUS_POLL_MS)
  }
  void poll()
}

async function submitReplacement() {
  const projectId = resolvedProjectId.value
  if (!projectId || !replacementFile.value || replacing.value) return
  replacing.value = true
  replacementMessage.value = ''
  replacementError.value = false

  try {
    const form = new FormData()
    form.append('file', replacementFile.value)
    form.append('field', replacementField.value)
    form.append('preserveOriginal', String(preserveOriginal.value))

    const response = await performFetch(
      `/api/projects/${projectId}/art/replace`,
      { method: 'POST', body: form },
      1,
      30_000,
    )
    if (!response.success) {
      throw new Error(response.message || 'Project image replacement failed.')
    }

    await Promise.all([
      projectStore.fetchProject(projectId),
      fetchProjectArt(true),
    ])
    replacementMessage.value =
      response.message || 'Project image replaced successfully.'
    replacementFile.value = null
  } catch (error) {
    replacementError.value = true
    replacementMessage.value =
      error instanceof Error
        ? error.message
        : 'Project image replacement failed.'
  } finally {
    replacing.value = false
  }
}

watch(
  [() => props.slug, resolvedProjectId],
  () => {
    activeIndex.value = 0
    failedSrcs.value = new Set()
    closeReplaceForm()
    closeGenerateForm()
    generationField.value = 'cardPath'
    generationPrompt.value = ''
    generationEngine.value = 'krea2'
    activeJobId = null
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
    void fetchProjectArt(true)
  },
)

watch(slides, (next) => {
  if (activeIndex.value >= next.length) activeIndex.value = 0
})

let advanceTimer: ReturnType<typeof setInterval> | null = null
onMounted(async () => {
  advanceTimer = setInterval(() => {
    if (
      !paused.value &&
      !showReplaceForm.value &&
      !showGenerateForm.value &&
      slides.value.length > 1
    ) {
      step(1)
    }
  }, 6000)
  await Promise.allSettled([
    collectionStore.fetchCollections(),
    fetchProjectArt(),
  ])
})

onBeforeUnmount(() => {
  stopped = true
  if (advanceTimer) clearInterval(advanceTimer)
  if (pollTimer) clearTimeout(pollTimer)
})
</script>

<style scoped>
.conductor-slide-fade-enter-active,
.conductor-slide-fade-leave-active {
  transition: opacity 400ms ease;
}
.conductor-slide-fade-enter-from,
.conductor-slide-fade-leave-to {
  opacity: 0;
}
</style>

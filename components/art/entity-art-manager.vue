<!-- /components/art/entity-art-manager.vue -->
<template>
  <section class="kr-panel-flat p-4">
    <header class="flex flex-wrap items-start gap-2">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:palette" class="size-4 text-secondary" />
          <h3 class="kr-text-black-sm">Artwork</h3>
          <span class="kr-badge-ghost-xs">{{ entityLabel }}</span>
        </div>
        <p class="kr-text-dim-xs mt-1">
          Recreate with Krea, edit the current image with SDXL or Kontext, or upload a finished replacement.
        </p>
      </div>

      <div v-if="mayEdit" class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="btn btn-secondary btn-xs gap-1 rounded-lg"
          @click="openGenerate"
        >
          <Icon name="kind-icon:sparkles" class="kr-icon-3" />
          Generate replacement
        </button>
        <button
          type="button"
          class="btn btn-primary btn-xs gap-1 rounded-lg"
          @click="openUpload"
        >
          <Icon name="kind-icon:upload" class="kr-icon-3" />
          Upload image
        </button>
      </div>
    </header>

    <div v-if="editableSlots.length > 1" class="mt-3 flex flex-wrap gap-1.5">
      <button
        v-for="slot in editableSlots"
        :key="slot.field"
        type="button"
        class="kr-btn-xs-lg"
        :class="selectedField === slot.field ? 'btn-secondary' : 'btn-ghost border border-base-300'"
        @click="selectSlot(slot.field)"
      >
        {{ slot.label }}
      </button>
    </div>

    <div
      class="art-stage group relative mt-3 touch-pan-y select-none overflow-hidden rounded-xl border border-base-300 bg-base-200"
      :style="{ '--art-stage-aspect': selectedSlot.aspect || '1 / 1' }"
      @mouseenter="carouselPaused = true"
      @mouseleave="carouselPaused = false"
      @pointerdown="beginCarouselSwipe"
      @pointerup="endCarouselSwipe"
      @pointercancel="cancelCarouselSwipe"
    >
      <template v-if="activeCarouselSlide.src && !activeSlideFailed">
        <img
          :src="activeCarouselSlide.src"
          alt=""
          aria-hidden="true"
          draggable="false"
          class="art-stage-backdrop"
        />
        <Transition name="entity-carousel-fade">
          <img
            :key="activeCarouselSlide.src"
            :src="activeCarouselSlide.src"
            :alt="`${title} ${activeCarouselSlide.label}`"
            draggable="false"
            class="art-stage-image"
            @error="markSlideFailed(activeCarouselSlide.src)"
          />
        </Transition>
      </template>
      <div
        v-else
        class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-base-content/40"
      >
        <Icon name="kind-icon:image" class="kr-icon-10 opacity-40" />
        <p class="text-xs font-semibold">
          No {{ activeCarouselSlide.label.toLowerCase() }} yet.
        </p>
      </div>

      <div
        class="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 bg-linear-to-b from-base-300/90 to-transparent p-2"
      >
        <Icon name="kind-icon:image" class="size-3.5 text-secondary" />
        <span class="kr-text-eyebrow-bold kr-text-dim-xs-60 tracking-wide">
          Artwork &amp; inspirations
        </span>
        <span v-if="inspirationCount" class="kr-badge-info-xs">
          {{ inspirationCount }} inspiration{{ inspirationCount === 1 ? '' : 's' }}
        </span>
        <span v-if="collectionSlides.length" class="kr-badge-secondary-xs">
          {{ collectionSlides.length }} collection
        </span>
        <span v-if="hasCarousel" class="kr-text-dim-xs ml-auto">
          {{ carouselIndex + 1 }} / {{ carouselSlides.length }}
        </span>
      </div>

      <div
        class="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-linear-to-t from-base-300/95 to-transparent p-3 pt-10"
      >
        <span
          class="badge badge-sm border-0 bg-base-100/85 font-bold backdrop-blur"
        >
          {{ activeSlideCaption }}
        </span>
        <div v-if="mayEdit" class="flex flex-wrap gap-1">
          <button
            v-if="canPromoteActiveSlide"
            type="button"
            class="btn btn-primary btn-xs gap-1 rounded-lg"
            :disabled="promoting"
            @click="promoteActiveSlide"
          >
            <span v-if="promoting" class="kr-spinner-xs" />
            <Icon v-else name="kind-icon:star" class="kr-icon-3" />
            Set as {{ primarySlot.label.toLowerCase() }}
          </button>
          <template v-else>
            <button
              type="button"
              class="btn btn-secondary btn-xs gap-1 rounded-lg"
              @click="openGenerate"
            >
              <Icon name="kind-icon:sparkles" class="kr-icon-3" />
              Generate
            </button>
            <button
              type="button"
              class="btn btn-xs gap-1 rounded-lg border-0 bg-base-100/85 backdrop-blur"
              @click="openUpload"
            >
              <Icon name="kind-icon:upload" class="kr-icon-3" />
              Upload
            </button>
          </template>
        </div>
      </div>

      <template v-if="carouselSlides.length > 1">
        <button
          type="button"
          class="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-80 shadow sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Previous image"
          @pointerdown.stop
          @click="stepCarousel(-1)"
        >
          <Icon name="kind-icon:chevron-left" class="kr-icon-4" />
        </button>
        <button
          type="button"
          class="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 border-0 bg-base-100/70 opacity-80 shadow sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Next image"
          @pointerdown.stop
          @click="stepCarousel(1)"
        >
          <Icon name="kind-icon:chevron-right" class="kr-icon-4" />
        </button>
      </template>
    </div>

    <div
      v-if="carouselSlides.length > 1"
      class="mt-2 flex gap-1.5 overflow-x-auto pb-1"
    >
      <div
        v-for="(slide, index) in carouselSlides"
        :key="slide.key"
        class="group/thumb relative shrink-0"
      >
        <button
          type="button"
          class="relative block size-14 overflow-hidden rounded-lg border transition-all"
          :class="
            index === carouselIndex
              ? 'border-primary ring-2 ring-primary/40'
              : 'border-base-300 opacity-70 hover:opacity-100'
          "
          :aria-label="`Show ${slide.label}`"
          :title="slide.label"
          @click="selectCarouselSlide(index)"
        >
          <img
            v-if="slide.src"
            :src="slide.src"
            :alt="slide.label"
            class="size-full object-cover"
          />
          <span
            v-else
            class="flex size-full items-center justify-center text-base-content/30"
          >
            <Icon name="kind-icon:image" class="kr-icon-4" />
          </span>
          <span
            v-if="slide.kind === 'slot'"
            class="absolute inset-x-0 bottom-0 truncate bg-base-300/85 px-1 text-[0.55rem] font-bold leading-4"
          >
            {{ slide.label }}
          </span>
        </button>
        <button
          v-if="mayEdit && slide.kind === 'inspiration' && slide.artImageId"
          type="button"
          class="btn btn-circle btn-error btn-xs absolute -right-1 -top-1 opacity-0 shadow transition-opacity group-hover/thumb:opacity-100"
          title="Remove from inspiration history"
          :disabled="removingHistoryId === slide.artImageId"
          @click="removeHistory(slide.artImageId)"
        >
          <span v-if="removingHistoryId === slide.artImageId" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:trash" class="kr-icon-3" />
        </button>
      </div>
    </div>

    <form
      v-if="showGenerate"
      class="mt-3 space-y-3 rounded-xl border border-secondary/30 bg-secondary/5 p-3"
      @submit.prevent="queueGeneration"
    >
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <p class="kr-text-black-sm">Generate {{ selectedSlot.label }} replacement</p>
          <p class="kr-text-dim-xs">
            Recreate starts fresh with Krea. Img2img uses the current image and defaults to SDXL.
          </p>
        </div>
        <button
          type="button"
          class="kr-btn-ghost-xs-lg"
          :disabled="submitting"
          @click="closeForms"
        >
          <Icon name="kind-icon:x" class="kr-icon-3" />
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label v-if="editableSlots.length > 1" class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">Target</span>
          <select v-model="selectedField" class="kr-select-sm" :disabled="submitting">
            <option
              v-for="slot in editableSlots"
              :key="slot.field"
              :value="slot.field"
            >
              {{ slot.label }}
            </option>
          </select>
        </label>

        <label class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">Method</span>
          <select v-model="generationMode" class="kr-select-sm" :disabled="submitting">
            <option value="recreate">New prompt · recreate</option>
            <option value="img2img" :disabled="!currentSrc">Current image · img2img</option>
          </select>
        </label>

        <label class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">Engine</span>
          <select v-model="generationEngine" class="kr-select-sm" :disabled="submitting">
            <template v-if="generationMode === 'recreate'">
              <option value="krea2">Krea 2 · default</option>
              <option value="comfy">SDXL · prompt only</option>
            </template>
            <template v-else>
              <option value="sdxl-img2img">SDXL img2img · default</option>
              <option value="kontext">Kontext edit</option>
            </template>
          </select>
        </label>

        <label class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">Preset</span>
          <select v-model="presetKey" class="kr-select-sm" :disabled="submitting">
            <option v-for="preset in availablePresets" :key="preset.key" :value="preset.key">
              {{ preset.label }}
            </option>
          </select>
        </label>
      </div>

      <label class="kr-form-field">
        <span class="kr-text-dim-xs-60 font-semibold">Art direction</span>
        <textarea
          v-model="prompt"
          class="textarea textarea-bordered min-h-28 rounded-xl text-sm"
          maxlength="5000"
          :placeholder="promptPlaceholder"
          :disabled="submitting"
        />
        <span class="text-[0.65rem] text-base-content/40">
          The {{ entityLabel.toLowerCase() }} record supplies supporting context. This text remains the primary direction.
        </span>
      </label>

      <div
        v-if="showCheckpointSelector"
        class="grid gap-3 kr-panel-compact-70 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <label class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">SDXL checkpoint</span>
          <select
            v-model.number="checkpointResourceId"
            class="kr-select-sm"
            :disabled="submitting || loadingResources"
          >
            <option :value="0">Use current quality default</option>
            <option v-for="checkpoint in checkpointOptions" :key="checkpoint.id" :value="checkpoint.id">
              {{ checkpoint.customLabel || checkpoint.name }}
            </option>
          </select>
        </label>
        <span v-if="loadingResources" class="loading loading-spinner loading-sm self-end mb-1" />
        <p v-else class="kr-text-dim-xs-40 self-end pb-2">
          Leave unchanged to use the same default workflow that is producing the current quality.
        </p>
      </div>

      <fieldset class="space-y-1">
        <legend class="kr-text-dim-xs-60 font-semibold">Current image</legend>
        <div class="grid gap-1 sm:grid-cols-2">
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="true"
              class="radio radio-secondary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Keep as inspiration</span>
              <span class="kr-text-dim-xs-45 block">
                Save the current version in this {{ entityLabel }} artwork history.
              </span>
            </span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="false"
              class="radio radio-secondary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Do not retain it</span>
              <span class="kr-text-dim-xs-45 block">
                Replace the entity reference without adding the old version to history.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div class="kr-text-dim-xs-55 rounded-lg bg-base-100/60 px-3 py-2">
        <strong>{{ generationMode === 'recreate' ? 'Recreate' : 'Img2img' }}:</strong>
        {{ engineLabel }} · {{ selectedSlot.width }}×{{ selectedSlot.height }}
        <template v-if="selectedPreset.description"> · {{ selectedPreset.description }}</template>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="message"
          class="min-w-0 flex-1 text-xs"
          :class="messageTone === 'error' ? 'text-error' : messageTone === 'success' ? 'text-success' : 'text-info'"
        >
          {{ message }}
        </p>
        <button
          type="submit"
          class="btn btn-secondary btn-sm ml-auto gap-1.5 rounded-xl"
          :disabled="prompt.trim().length < 3 || submitting || (generationMode === 'img2img' && !currentSrc)"
        >
          <span v-if="submitting" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:sparkles" class="kr-icon-4" />
          {{ submitting ? 'Queuing…' : `Queue ${selectedSlot.label}` }}
        </button>
      </div>
    </form>

    <form
      v-if="showUpload"
      class="mt-3 space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3"
      @submit.prevent="uploadReplacement"
    >
      <div class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <p class="kr-text-black-sm">Upload {{ selectedSlot.label }} replacement</p>
          <p class="kr-text-dim-xs">
            Upload a finished PNG, JPEG, or WebP, then choose whether the old image remains as inspiration.
          </p>
        </div>
        <button
          type="button"
          class="kr-btn-ghost-xs-lg"
          :disabled="submitting"
          @click="closeForms"
        >
          <Icon name="kind-icon:x" class="kr-icon-3" />
        </button>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <label v-if="editableSlots.length > 1" class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">Target</span>
          <select v-model="selectedField" class="kr-select-sm" :disabled="submitting">
            <option
              v-for="slot in editableSlots"
              :key="slot.field"
              :value="slot.field"
            >
              {{ slot.label }}
            </option>
          </select>
        </label>
        <label class="kr-form-field">
          <span class="kr-text-dim-xs-60 font-semibold">New image</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="file-input file-input-bordered file-input-sm w-full rounded-xl"
            :disabled="submitting"
            @change="handleFile"
          />
        </label>
      </div>

      <fieldset class="space-y-1">
        <legend class="kr-text-dim-xs-60 font-semibold">Current image</legend>
        <div class="grid gap-1 sm:grid-cols-2">
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="true"
              class="radio radio-primary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Keep as inspiration</span>
              <span class="kr-text-dim-xs-45 block">Retain the previous version in artwork history.</span>
            </span>
          </label>
          <label class="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-base-100/60">
            <input
              v-model="preserveOriginal"
              type="radio"
              :value="false"
              class="radio radio-primary radio-sm mt-0.5"
              :disabled="submitting"
            />
            <span>
              <span class="block text-sm font-semibold">Do not retain it</span>
              <span class="kr-text-dim-xs-45 block">Replace the entity reference without adding history.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="message"
          class="min-w-0 flex-1 text-xs"
          :class="messageTone === 'error' ? 'text-error' : 'text-success'"
        >
          {{ message }}
        </p>
        <button
          type="submit"
          class="btn btn-primary btn-sm ml-auto gap-1.5 rounded-xl"
          :disabled="!uploadFile || submitting"
        >
          <span v-if="submitting" class="kr-spinner-xs" />
          <Icon v-else name="kind-icon:upload" class="kr-icon-4" />
          {{ submitting ? 'Uploading…' : 'Upload & replace' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useResourceStore } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'
import { projectAssetFallback } from '@/components/conductor/projectFront'

type EntityArtType =
  | 'bot'
  | 'character'
  | 'scenario'
  | 'reward'
  | 'facet'
  | 'project'
  | 'achievement'
type EntityArtSlot = {
  field: string
  label: string
  aspect?: string
  width?: number
  height?: number
}
type EntityRecord = Record<string, unknown> & {
  id: number
  userId?: number | null
  artImageId?: number | null
  title?: string | null
  name?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  designer?: string | null
}
type HistoryItem = {
  id: number
  fileName?: string | null
  fileType?: string | null
  imagePath?: string | null
  path?: string | null
  createdAt?: string | Date
  field?: string
  fieldLabel?: string
}
type GenerationPreset = {
  key: string
  label: string
  description: string
  denoise?: number
  originalWeight?: number
  steps?: number
}
type CollectionSlide = { src: string; label: string }
type CarouselSlide = {
  key: string
  src: string
  label: string
  kind: 'slot' | 'inspiration' | 'collection'
  field?: string
  artImageId?: number
}
type ServerArtSlot = {
  field: string
  label: string
  width: number
  height: number
  primary: boolean
  retired: boolean
}
type ResolvedSlot = ServerArtSlot & { aspect: string }

const props = withDefaults(
  defineProps<{
    entityType: EntityArtType
    entity: EntityRecord
    /**
     * Optional override. The slot roster normally arrives from the entity art
     * endpoint, which reads the same table that refuses generation for retired
     * slots -- hardcoding a list here is how every call site ended up offering
     * Hero, Card and Icon as peer tabs after all three were retired.
     */
    slots?: EntityArtSlot[]
    canEdit?: boolean
    /**
     * Extra read-only slides (e.g. a linked ArtCollection). Canonical entity
     * slots and preserved inspiration history are also part of the same
     * swipeable artwork loop.
     */
    collectionSlides?: CollectionSlide[]
  }>(),
  {
    slots: () => [],
    canEdit: false,
    collectionSlides: () => [],
  },
)

const emit = defineEmits<{
  updated: [entity: EntityRecord]
  queued: [jobId: number]
}>()

const userStore = useUserStore()
const resourceStore = useResourceStore()
const serverSlots = ref<ServerArtSlot[]>([])
const selectedField = ref(defaultFieldName())
const history = ref<HistoryItem[]>([])
const showGenerate = ref(false)
const showUpload = ref(false)
const generationMode = ref<'recreate' | 'img2img'>('recreate')
const generationEngine = ref('krea2')
const presetKey = ref('quality')
const prompt = ref('')
const preserveOriginal = ref(true)
const checkpointResourceId = ref(0)
const uploadFile = ref<File | null>(null)
const submitting = ref(false)
const loadingResources = ref(false)
const removingHistoryId = ref<number | null>(null)
const promoting = ref(false)
const failedSrcs = ref<string[]>([])
const message = ref('')
const messageTone = ref<'info' | 'success' | 'error'>('info')
let pollTimer: ReturnType<typeof setTimeout> | null = null
let activeJobId: number | null = null
let stopped = false

const carouselIndex = ref(0)
const carouselPaused = ref(false)
let carouselTimer: ReturnType<typeof setInterval> | null = null
let swipeStartX: number | null = null

const entityLabel = computed(() =>
  props.entityType.charAt(0).toUpperCase() + props.entityType.slice(1),
)
const title = computed(() =>
  String(props.entity.title || props.entity.name || `${entityLabel.value} ${props.entity.id}`),
)
const mayEdit = computed(
  () =>
    props.canEdit ||
    userStore.isAdmin ||
    Number(props.entity.userId) === Number(userStore.userId),
)
function defaultFieldName(): string {
  return props.entityType === 'bot' ? 'avatarImage' : 'imagePath'
}

function fallbackSlot(): ResolvedSlot {
  return {
    field: defaultFieldName(),
    label: 'Image',
    aspect: '1 / 1',
    width: 1024,
    height: 1024,
    primary: true,
    retired: false,
  }
}

/**
 * Server roster first, the `slots` prop as an override, and a single synthetic
 * primary while the first fetch is in flight so the panel never renders an
 * empty frame.
 */
const resolvedSlots = computed<ResolvedSlot[]>(() => {
  if (props.slots.length) {
    return props.slots.map((slot, index) => ({
      field: slot.field,
      label: slot.label,
      aspect: slot.aspect || '1 / 1',
      width: slot.width || 1024,
      height: slot.height || 1024,
      primary: index === 0,
      retired: false,
    }))
  }
  if (serverSlots.value.length) {
    return serverSlots.value.map((slot) => ({
      ...slot,
      aspect: `${slot.width} / ${slot.height}`,
    }))
  }
  return [fallbackSlot()]
})
const editableSlots = computed(() =>
  resolvedSlots.value.filter((slot) => !slot.retired),
)
const primarySlot = computed(
  () =>
    editableSlots.value.find((slot) => slot.primary) ||
    editableSlots.value[0] ||
    fallbackSlot(),
)
const selectedSlot = computed<ResolvedSlot>(
  () =>
    editableSlots.value.find((slot) => slot.field === selectedField.value) ||
    primarySlot.value,
)
/**
 * A Project's own DB columns (heroPath/cardPath/imagePath) are only one of
 * two places its art can live: conductor's art pipeline commits hero/card/
 * icon images straight to the conductor repo and never writes them back to
 * the Project row (kind-robots/t-068). Every other conductor-facing surface
 * (project-front-page.vue, conductor-page.vue) already falls back to the
 * conductor raw URL, keyed by conductorSlug, when the DB column is empty —
 * mirror that here so the Artwork panel agrees with the rest of the site
 * instead of reporting "no hero yet" for art that exists in conductor.
 * (No local /images/projects/<slug>/ asset pool exists yet, so unlike
 * project-front-page.vue's full local-then-raw chain, this goes straight to
 * the raw fallback rather than adding a guaranteed-404 local candidate.)
 */
const PROJECT_ART_KIND_BY_FIELD: Record<string, 'hero' | 'card' | 'icon'> = {
  heroPath: 'hero',
  cardPath: 'card',
  imagePath: 'icon',
}

/**
 * The primary slot reaches for the LARGEST conductor render first and steps
 * down only when one is missing. One image now serves every view, and the
 * primary field for a project is still the one conductor delivers its 256px
 * icon into -- resolving the primary straight to that icon would put a
 * thumbnail on the main stage for every project whose art lives in the
 * conductor repo rather than in an ArtImage row.
 */
function projectFallbackCandidates(field: string): string[] {
  if (props.entityType !== 'project') return []
  const slug = props.entity.conductorSlug as string | null | undefined
  if (!slug) return []
  const own = PROJECT_ART_KIND_BY_FIELD[field]
  const kinds: ('hero' | 'card' | 'icon')[] =
    field === primarySlot.value.field
      ? ['hero', 'card', 'icon']
      : own
        ? [own]
        : []
  return kinds.map((kind) => projectAssetFallback(slug, kind))
}

function slotSrc(field: string): string {
  const direct = normalizeSrc(props.entity[field])
  if (direct) return direct
  if (props.entity.artImageId && ['imagePath', 'avatarImage'].includes(field)) {
    return `/api/art/images/${props.entity.artImageId}/file`
  }
  const candidates = projectFallbackCandidates(field)
  return (
    candidates.find((src) => !failedSrcs.value.includes(src)) ||
    candidates[0] ||
    ''
  )
}
const currentSrc = computed(() => slotSrc(selectedSlot.value.field))
const checkpointOptions = computed(() =>
  resourceStore.resources
    .filter((resource) => {
      if (resource.isActive === false) return false
      const resourceType = String(resource.resourceType || '').toUpperCase()
      const generation = String(resource.generation || '').toLowerCase()
      return resourceType === 'CHECKPOINT' || generation === 'checkpoint'
    })
    .sort((a, b) =>
      String(a.customLabel || a.name || '').localeCompare(
        String(b.customLabel || b.name || ''),
      ),
    ),
)
const showCheckpointSelector = computed(
  () =>
    generationEngine.value === 'sdxl-img2img' ||
    generationEngine.value === 'comfy',
)
const recreatePresets: GenerationPreset[] = [
  {
    key: 'quality',
    label: 'Quality default',
    description: 'Uses the current quality-focused workflow defaults.',
  },
  {
    key: 'polished',
    label: 'Polished',
    description: 'A slightly longer quality pass.',
    steps: 28,
  },
]
const img2imgPresets: GenerationPreset[] = [
  {
    key: 'gentle',
    label: 'Gentle refresh',
    description: 'Keeps most of the original composition.',
    denoise: 0.35,
    originalWeight: 0.75,
  },
  {
    key: 'balanced',
    label: 'Balanced edit',
    description: 'Preserves identity while allowing visible changes.',
    denoise: 0.55,
    originalWeight: 0.55,
  },
  {
    key: 'strong',
    label: 'Strong redesign',
    description: 'Uses the source as guidance, not a strict template.',
    denoise: 0.75,
    originalWeight: 0.35,
  },
]
const availablePresets = computed(() =>
  generationMode.value === 'recreate' ? recreatePresets : img2imgPresets,
)
const selectedPreset = computed(
  () =>
    availablePresets.value.find((preset) => preset.key === presetKey.value) ||
    availablePresets.value[0] ||
    recreatePresets[0],
)
const engineLabel = computed(() => {
  switch (generationEngine.value) {
    case 'krea2':
      return 'Krea 2'
    case 'sdxl-img2img':
      return 'SDXL img2img'
    case 'kontext':
      return 'Kontext'
    default:
      return 'SDXL'
  }
})
const promptPlaceholder = computed(() =>
  generationMode.value === 'recreate'
    ? `Describe a new ${selectedSlot.value.label.toLowerCase()} for ${title.value}…`
    : `Describe what should change while preserving the useful parts of the current ${selectedSlot.value.label.toLowerCase()}…`,
)

function normalizeSrc(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return ''
  if (/^(https?:|data:image\/|\/)/.test(trimmed)) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`
  return `/images/${trimmed}`
}

function historySrc(item: HistoryItem): string {
  return normalizeSrc(item.imagePath || item.path) || `/api/art/images/${item.id}/file`
}

/**
 * One loop, every image: the editable slots (empty ones included, so a slot
 * with no art yet is still reachable), then whatever a retired slot is still
 * holding, then inspiration history, then the linked collection.
 *
 * Retired slots ride along as inspirations rather than as their own tabs. The
 * art they hold is real and still rendered elsewhere on the site, so hiding it
 * would lose it, but nothing new is generated into them -- the way back into
 * circulation is `Set as main`.
 */
const carouselSlides = computed<CarouselSlide[]>(() => {
  const out: CarouselSlide[] = []
  const seenSrcs = new Set<string>()
  const seenIds = new Set<number>()
  /*
   * Deduped by ArtImage id as well as by URL. Promoting an inspiration leaves
   * its history link in place and stamps a cache-busting `?v=` onto the slot
   * path, so the same image reaches here under two different URLs and would
   * otherwise show up twice -- once as the main image and once as an
   * inspiration of itself.
   */
  const push = (slide: CarouselSlide) => {
    if (slide.artImageId) {
      if (seenIds.has(slide.artImageId)) return
      seenIds.add(slide.artImageId)
    }
    if (slide.src) {
      if (seenSrcs.has(slide.src)) return
      seenSrcs.add(slide.src)
    }
    out.push(slide)
  }
  for (const slot of editableSlots.value) {
    push({
      key: `slot:${slot.field}`,
      src: slotSrc(slot.field),
      label: slot.label,
      kind: 'slot',
      field: slot.field,
      artImageId: slotArtImageId(slot.field) ?? undefined,
    })
  }
  for (const slot of resolvedSlots.value) {
    if (!slot.retired) continue
    const src = slotSrc(slot.field)
    if (!src) continue
    push({
      key: `retired:${slot.field}`,
      src,
      label: `Retired · ${slot.label}`,
      kind: 'inspiration',
      artImageId: slotArtImageId(slot.field) ?? undefined,
    })
  }
  for (const item of history.value) {
    push({
      key: `history:${item.id}`,
      src: historySrc(item),
      label: `Inspiration · ${item.fieldLabel || item.fileName || `Image ${item.id}`}`,
      kind: 'inspiration',
      artImageId: item.id,
    })
  }
  for (const slide of props.collectionSlides) {
    push({
      key: `collection:${slide.src || slide.label}`,
      src: normalizeSrc(slide.src),
      label: slide.label,
      kind: 'collection',
    })
  }
  return out
})
const hasCarousel = computed(() => carouselSlides.value.length > 1)
const activeCarouselSlide = computed<CarouselSlide>(
  () =>
    carouselSlides.value[carouselIndex.value] ??
    carouselSlides.value[0] ?? {
      key: 'empty',
      src: '',
      label: primarySlot.value.label,
      kind: 'slot',
    },
)
const activeSlideFailed = computed(() =>
  failedSrcs.value.includes(activeCarouselSlide.value.src),
)
const inspirationCount = computed(
  () =>
    carouselSlides.value.filter((slide) => slide.kind === 'inspiration').length,
)
const activeSlideCaption = computed(() => {
  const slide = activeCarouselSlide.value
  return slide.kind === 'slot' ? `Current ${slide.label}` : slide.label
})
/**
 * Only an image that is not already serving a slot can be promoted, and only
 * when the endpoint has an id to promote -- a collection slide carries a URL
 * and nothing else.
 */
const canPromoteActiveSlide = computed(() => {
  const slide = activeCarouselSlide.value
  if (slide.kind !== 'inspiration' || !slide.artImageId) return false
  return slotArtImageId(primarySlot.value.field) !== slide.artImageId
})

function stepCarousel(direction: number) {
  const count = carouselSlides.value.length
  if (count) {
    carouselIndex.value = (carouselIndex.value + direction + count) % count
  }
}

function beginCarouselSwipe(event: PointerEvent) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  swipeStartX = event.clientX
  carouselPaused.value = true
}

function endCarouselSwipe(event: PointerEvent) {
  if (swipeStartX === null) return
  const delta = event.clientX - swipeStartX
  swipeStartX = null
  carouselPaused.value = false
  if (Math.abs(delta) < 40) return
  stepCarousel(delta < 0 ? 1 : -1)
}

function cancelCarouselSwipe() {
  swipeStartX = null
  carouselPaused.value = false
}

function selectCarouselSlide(index: number) {
  carouselIndex.value = index
  const field = carouselSlides.value[index]?.field
  if (field) selectSlot(field)
}

function selectSlot(field: string) {
  selectedField.value = field
  message.value = ''
}

function markSlideFailed(src: string) {
  if (!src || failedSrcs.value.includes(src)) return
  failedSrcs.value = [...failedSrcs.value, src]
}

/**
 * The ArtImage id behind a slot, resolved the same way the server does it: the
 * slot's own id column, then the id embedded in an /api/art/images/<id>/file
 * path, and the record's primary artImageId only for the primary slot.
 */
function slotArtImageId(field: string): number | null {
  const slotName = field.match(/^(card|hero|icon)Path$/)?.[1]
  const columnValue = slotName
    ? props.entity[`${slotName}ArtImageId`]
    : props.entity.artImageId
  const columnId = Number(columnValue)
  if (Number.isInteger(columnId) && columnId > 0) return columnId
  const raw = props.entity[field]
  const embedded = Number(
    typeof raw === 'string' ? raw.match(/\/api\/art\/images\/(\d+)\/file/)?.[1] : NaN,
  )
  return Number.isInteger(embedded) && embedded > 0 ? embedded : null
}

function openGenerate() {
  showGenerate.value = true
  showUpload.value = false
  message.value = ''
  messageTone.value = 'info'
}

function openUpload() {
  showUpload.value = true
  showGenerate.value = false
  message.value = ''
  messageTone.value = 'info'
}

function closeForms() {
  if (submitting.value) return
  showGenerate.value = false
  showUpload.value = false
  uploadFile.value = null
  message.value = ''
}

function handleFile(event: Event) {
  uploadFile.value =
    (event.target as HTMLInputElement | null)?.files?.[0] || null
  message.value = ''
}

function applyEntity(entity: EntityRecord | null | undefined) {
  if (!entity) return
  Object.assign(props.entity, entity)
  failedSrcs.value = []
  emit('updated', props.entity)
}

async function fetchEntityArt(force = false) {
  const query = force ? `?refresh=${Date.now()}` : ''
  const response = await performFetch<{
    entity: EntityRecord
    history: HistoryItem[]
    slots?: ServerArtSlot[]
  }>(
    `/api/art/entities/${props.entityType}/${props.entity.id}${query}`,
    force ? { cache: 'no-store' } : {},
  )
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Artwork could not be loaded.')
  }
  applyEntity(response.data.entity)
  history.value = response.data.history || []
  serverSlots.value = response.data.slots || []
  if (!editableSlots.value.some((slot) => slot.field === selectedField.value)) {
    selectedField.value = primarySlot.value.field
  }
}

async function promoteActiveSlide() {
  const slide = activeCarouselSlide.value
  if (!slide.artImageId || promoting.value) return
  promoting.value = true
  message.value = ''
  try {
    const response = await performFetch<{
      entity: EntityRecord
      history: HistoryItem[]
    }>(`/api/art/entities/${props.entityType}/${props.entity.id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: primarySlot.value.field,
        artImageId: slide.artImageId,
        preserveOriginal: true,
      }),
    })
    if (!response.success || !response.data) {
      throw new Error(response.message || 'That image could not be set as the main image.')
    }
    applyEntity(response.data.entity)
    history.value = response.data.history || []
    selectedField.value = primarySlot.value.field
    carouselIndex.value = 0
    message.value = response.message || 'Main image updated.'
    messageTone.value = 'success'
  } catch (error) {
    message.value =
      error instanceof Error
        ? error.message
        : 'That image could not be set as the main image.'
    messageTone.value = 'error'
  } finally {
    promoting.value = false
  }
}

async function ensureResources() {
  if (!showCheckpointSelector.value || resourceStore.hasLoaded) return
  loadingResources.value = true
  try {
    await resourceStore.loadStore()
  } finally {
    loadingResources.value = false
  }
}

async function uploadReplacement() {
  if (!uploadFile.value || submitting.value) return
  submitting.value = true
  message.value = ''
  try {
    const form = new FormData()
    form.append('file', uploadFile.value)
    form.append('field', selectedField.value)
    form.append('preserveOriginal', String(preserveOriginal.value))
    const response = await performFetch<{
      entity: EntityRecord
      history: HistoryItem[]
    }>(
      `/api/art/entities/${props.entityType}/${props.entity.id}/replace`,
      { method: 'POST', body: form },
      1,
      30_000,
    )
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Image replacement failed.')
    }
    applyEntity(response.data.entity)
    history.value = response.data.history || []
    uploadFile.value = null
    message.value = response.message || 'Image replaced.'
    messageTone.value = 'success'
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Image replacement failed.'
    messageTone.value = 'error'
  } finally {
    submitting.value = false
  }
}

async function queueGeneration() {
  if (prompt.value.trim().length < 3 || submitting.value) return
  submitting.value = true
  message.value = ''
  messageTone.value = 'info'
  try {
    const checkpoint = checkpointOptions.value.find(
      (resource) => resource.id === checkpointResourceId.value,
    )
    const preset = selectedPreset.value
    const response = await performFetch<{
      jobId: number
      status: string
    }>('/api/art/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine: generationEngine.value,
        promptString: prompt.value.trim(),
        width: selectedSlot.value.width,
        height: selectedSlot.value.height,
        isPublic: props.entity.isPublic ?? true,
        isMature: props.entity.isMature ?? false,
        designer: props.entity.designer || userStore.user?.username || null,
        ...(preset.steps ? { steps: preset.steps } : {}),
        ...(preset.denoise != null ? { denoise: preset.denoise } : {}),
        ...(preset.originalWeight != null
          ? { originalWeight: preset.originalWeight }
          : {}),
        ...(checkpoint
          ? {
              checkpointResourceId: checkpoint.id,
              checkpoint:
                checkpoint.localPath || checkpoint.name || checkpoint.customLabel,
            }
          : {}),
        entityArt: {
          entityType: props.entityType,
          entityId: props.entity.id,
          field: selectedField.value,
          preserveOriginal: preserveOriginal.value,
          mode: generationMode.value,
        },
      }),
    })
    if (!response.success || !response.data?.jobId) {
      throw new Error(response.message || 'Art generation could not be queued.')
    }
    activeJobId = Number(response.data.jobId)
    emit('queued', activeJobId)
    message.value = `Queued as ArtJob ${activeJobId}. The replacement will attach automatically when generation finishes.`
    messageTone.value = 'info'
    startPolling(activeJobId)
  } catch (error) {
    message.value =
      error instanceof Error
        ? error.message
        : 'Art generation could not be queued.'
    messageTone.value = 'error'
  } finally {
    submitting.value = false
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
          artImageId?: number | null
          error?: string | null
        }
      }>(`/api/art/queue/${jobId}`, { cache: 'no-store' })
      const status = String(response.data?.job?.status || '')
      if (!response.success) throw new Error(response.message || 'Queue check failed.')
      if (status === 'DONE') {
        await fetchEntityArt(true)
        message.value = `ArtJob ${jobId} finished and the ${selectedSlot.value.label.toLowerCase()} was replaced.`
        messageTone.value = 'success'
        activeJobId = null
        return
      }
      if (status === 'FAILED' || status === 'CANCELLED') {
        message.value =
          response.data?.job?.error || `ArtJob ${jobId} ended as ${status}.`
        messageTone.value = 'error'
        activeJobId = null
        return
      }
      message.value = `ArtJob ${jobId}: ${status || 'PENDING'}. It will attach automatically when complete.`
      messageTone.value = 'info'
    } catch {
      // Completion is durable on the server. A transient polling failure should
      // not convert a valid queued job into a visible failure.
    }
    pollTimer = setTimeout(poll, 5000)
  }
  void poll()
}

async function removeHistory(id: number) {
  if (removingHistoryId.value) return
  removingHistoryId.value = id
  try {
    const response = await performFetch(
      `/api/art/entities/${props.entityType}/${props.entity.id}/history/${id}`,
      { method: 'DELETE' },
    )
    if (!response.success) {
      throw new Error(response.message || 'History item could not be removed.')
    }
    history.value = history.value.filter((item) => item.id !== id)
    message.value = response.message || 'History item removed.'
    messageTone.value = 'success'
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'History item could not be removed.'
    messageTone.value = 'error'
  } finally {
    removingHistoryId.value = null
  }
}

watch(generationMode, (mode) => {
  generationEngine.value = mode === 'recreate' ? 'krea2' : 'sdxl-img2img'
  presetKey.value = mode === 'recreate' ? 'quality' : 'balanced'
  void ensureResources()
})
watch(generationEngine, () => {
  void ensureResources()
})
watch(
  () => [props.entityType, props.entity.id],
  async () => {
    serverSlots.value = []
    selectedField.value = defaultFieldName()
    failedSrcs.value = []
    history.value = []
    carouselIndex.value = 0
    cancelCarouselSwipe()
    closeForms()
    try {
      await fetchEntityArt(true)
    } catch {}
  },
)
watch(selectedField, () => {
  const index = carouselSlides.value.findIndex(
    (slide) => slide.kind === 'slot' && slide.field === selectedField.value,
  )
  if (index >= 0) carouselIndex.value = index
})
watch(carouselSlides, (next) => {
  if (carouselIndex.value >= next.length) carouselIndex.value = 0
})
onMounted(async () => {
  carouselTimer = setInterval(() => {
    if (
      !carouselPaused.value &&
      !showGenerate.value &&
      !showUpload.value &&
      carouselSlides.value.length > 1
    ) {
      stepCarousel(1)
    }
  }, 6000)
  try {
    await fetchEntityArt()
  } catch {}
})
onBeforeUnmount(() => {
  stopped = true
  if (pollTimer) clearTimeout(pollTimer)
  if (carouselTimer) clearInterval(carouselTimer)
})
</script>

<style scoped>
/*
 * One stage, sized by the slot's own aspect and clamped so a tall card frame
 * cannot push the rest of the panel off screen. The image is contained rather
 * than cropped -- the loop mixes 16:9, 2:3 and square art, and cover hid the
 * subject of whichever one did not match the frame -- over a blurred copy of
 * itself so the letterboxing still reads as artwork.
 */
.art-stage {
  aspect-ratio: var(--art-stage-aspect, 1 / 1);
  min-height: 12rem;
  max-height: min(50vh, 24rem);
}

.art-stage-backdrop,
.art-stage-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.art-stage-backdrop {
  object-fit: cover;
  filter: blur(1.5rem) saturate(1.1);
  transform: scale(1.1);
}

.art-stage-image {
  object-fit: contain;
}

.entity-carousel-fade-enter-active,
.entity-carousel-fade-leave-active {
  transition: opacity 400ms ease;
}
.entity-carousel-fade-enter-from,
.entity-carousel-fade-leave-to {
  opacity: 0;
}
</style>
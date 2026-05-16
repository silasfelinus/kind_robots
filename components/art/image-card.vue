<!-- /components/content/art/image-card.vue -->
<template>
  <reactable-card
    :selected="selected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="displayImage.id"
    target-type="artImage"
    reaction-category="ART"
    :target-title="cardTitle"
    @select="selectImage"
  >
    <template #actions>
      <button
        v-if="showActions && allowEdit && (selected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Image"
        @click.stop="emit('edit', displayImage.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="
          showActions &&
          allowCopyPrompt &&
          displayImage.promptString &&
          (selected || compact)
        "
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Copy Prompt"
        @click.stop="copyPrompt"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowDelete && (selected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Image"
        @click.stop="emit('delete', displayImage.id)"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div
      v-if="showImage"
      class="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300"
    >
      <div
        v-if="loadingImage"
        class="flex h-full w-full items-center justify-center"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <img
        v-else
        :key="imageKey"
        :src="resolvedImageSource"
        :alt="imageAltText"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        :loading="imageLoadingMode"
        decoding="async"
        @error="handleImageError"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span
          v-if="displayImage.artId"
          class="badge badge-info badge-sm"
          :title="`Linked Art #${displayImage.artId}`"
        >
          Art #{{ displayImage.artId }}
        </span>

        <span
          v-if="displayImage.imageData"
          class="badge badge-success badge-sm"
        >
          imageData
        </span>

        <span
          v-else-if="displayImage.imagePath"
          class="badge badge-warning badge-sm"
        >
          imagePath
        </span>

        <span v-else class="badge badge-error badge-sm"> no image </span>

        <span v-if="displayImage.isPublic" class="badge badge-success badge-sm">
          Public
        </span>

        <span v-else class="badge badge-warning badge-sm"> Private </span>

        <span v-if="displayImage.isMature" class="badge badge-error badge-sm">
          Mature
        </span>
      </div>

      <div
        v-if="selected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>

      <button
        v-if="imageLoadFailed && showDebug"
        class="absolute bottom-2 left-2 rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-content shadow"
        type="button"
        title="Retry image"
        @click.stop="loadFullImage"
      >
        Retry image
      </button>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div v-if="showPrompt" class="min-w-0">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-base',
          ]"
          :title="cardTitle"
        >
          {{ cardTitle }}
        </h2>

        <p
          v-if="showNegativePrompt && displayImage.negativePrompt"
          class="mt-1 line-clamp-2 text-xs text-base-content/50"
        >
          Negative: {{ displayImage.negativePrompt }}
        </p>
      </div>

      <div
        v-if="displayImage.artId || showImageStatus"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
      >
        <div class="flex flex-wrap gap-2">
          <span
            v-if="displayImage.artId"
            class="badge badge-info badge-sm"
            :title="`Linked Art #${displayImage.artId}`"
          >
            Linked to Art #{{ displayImage.artId }}
          </span>

          <span v-else class="badge badge-ghost badge-sm"> No Art link </span>

          <span class="badge badge-sm" :class="imageDataBadgeClass">
            imageData: {{ displayImage.imageData ? 'yes' : 'no' }}
          </span>

          <span
            class="badge badge-sm"
            :class="displayImage.imagePath ? 'badge-info' : 'badge-ghost'"
          >
            imagePath: {{ displayImage.imagePath ? 'yes' : 'no' }}
          </span>

          <span
            class="badge badge-sm"
            :class="
              displayImage.thumbnailData ? 'badge-success' : 'badge-ghost'
            "
          >
            thumbnail: {{ displayImage.thumbnailData ? 'yes' : 'no' }}
          </span>
        </div>

        <p v-if="displayImage.artId" class="mt-2 text-xs text-base-content/50">
          This ArtImage is attached to Art #{{ displayImage.artId }}. Good
          little payload. Very official.
        </p>

        <p v-else class="mt-2 text-xs text-base-content/50">
          This ArtImage is not attached to an Art record. That may be fine for
          Bot, Character, Pitch, or other owner models.
        </p>
      </div>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <button
          v-if="checkpointDisplay"
          class="badge badge-outline badge-sm max-w-full cursor-copy gap-1 truncate"
          type="button"
          :title="checkpointTitle"
          @click.stop="copyCheckpoint"
        >
          <Icon name="kind-icon:checkpoint" class="h-3 w-3" />
          <span class="truncate">{{ checkpointDisplay }}</span>
        </button>

        <span v-if="displayImage.genres" class="badge badge-accent badge-sm">
          {{ displayImage.genres }}
        </span>

        <span v-if="displayImage.sampler" class="badge badge-ghost badge-sm">
          {{ displayImage.sampler }}
        </span>

        <span v-if="displayImage.designer" class="badge badge-primary badge-sm">
          {{ displayImage.designer }}
        </span>

        <span
          v-if="displayImage.serverName"
          class="badge badge-secondary badge-sm"
        >
          {{ displayImage.serverName }}
        </span>

        <span v-if="displayImage.fileType" class="badge badge-ghost badge-sm">
          {{ displayImage.fileType }}
        </span>
      </div>

      <div
        v-if="showGenerationMeta"
        class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
      >
        <div>
          <p class="font-bold uppercase text-base-content/45">Image ID</p>
          <p class="truncate text-base-content/75">#{{ displayImage.id }}</p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Art ID</p>
          <p class="truncate text-base-content/75">
            {{ displayImage.artId ? `#${displayImage.artId}` : 'n/a' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Steps</p>
          <p class="truncate text-base-content/75">
            {{ displayImage.steps ?? 'n/a' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">CFG</p>
          <p class="truncate text-base-content/75">
            {{ cfgDisplay }}
          </p>
        </div>

        <button
          class="rounded-xl text-left transition hover:bg-base-200 disabled:hover:bg-transparent"
          type="button"
          :disabled="!displayImage.seed"
          title="Copy seed"
          @click.stop="copySeed"
        >
          <p class="font-bold uppercase text-base-content/45">Seed</p>
          <p class="truncate text-base-content/75">
            {{ displayImage.seed ?? 'n/a' }}
          </p>
        </button>

        <div>
          <p class="font-bold uppercase text-base-content/45">Gallery</p>
          <p class="truncate text-base-content/75">
            {{ displayImage.galleryId ? `#${displayImage.galleryId}` : 'n/a' }}
          </p>
        </div>

        <div
          v-if="displayImage.checkpointResourceId || displayImage.checkpoint"
          class="col-span-2"
        >
          <p class="font-bold uppercase text-base-content/45">Checkpoint</p>
          <p class="truncate text-base-content/75" :title="checkpointTitle">
            {{ checkpointDisplay || 'n/a' }}
          </p>
        </div>

        <div v-if="displayImage.imagePath" class="col-span-2">
          <p class="font-bold uppercase text-base-content/45">Image Path</p>
          <p
            class="truncate text-base-content/75"
            :title="displayImage.imagePath"
          >
            {{ displayImage.imagePath }}
          </p>
        </div>

        <div v-if="displayImage.fileName" class="col-span-2">
          <p class="font-bold uppercase text-base-content/45">File Name</p>
          <p
            class="truncate text-base-content/75"
            :title="displayImage.fileName"
          >
            {{ displayImage.fileName }}
          </p>
        </div>
      </div>

      <div v-if="showSelectButton" class="mt-auto grid grid-cols-1 gap-2 pt-1">
        <button
          class="btn btn-sm rounded-xl"
          :class="selected ? 'btn-primary text-white' : 'btn-outline'"
          type="button"
          @click.stop="selectImage"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
          {{ selected ? 'Selected' : 'Select' }}
        </button>
      </div>

      <details
        v-if="showDebug"
        class="rounded-2xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>

        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
          JSON.stringify(debugImage, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>
<script setup lang="ts">
// /components/content/art/image-card.vue
import { computed, ref, watch } from 'vue'
import type { ArtImage } from '@/stores/artStore'
import { useArtStore } from '@/stores/artStore'

const props = withDefaults(
  defineProps<{
    artImage: ArtImage
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showPrompt?: boolean
    showNegativePrompt?: boolean
    showMeta?: boolean
    showGenerationMeta?: boolean
    showImageStatus?: boolean
    showSelectButton?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowCopyPrompt?: boolean
    autoLoadImage?: boolean
    fallbackImage?: string
  }>(),
  {
    selected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showPrompt: true,
    showNegativePrompt: false,
    showMeta: true,
    showGenerationMeta: false,
    showImageStatus: true,
    showSelectButton: false,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    allowCopyPrompt: true,
    autoLoadImage: true,
    fallbackImage: '/images/backtree.webp',
  },
)

const emit = defineEmits<{
  select: [artImage: ArtImage]
  edit: [id: number]
  delete: [id: number]
  copied: [value: string]
  loaded: [artImage: ArtImage]
}>()

const artStore = useArtStore()

const localImage = ref<ArtImage | null>(props.artImage)
const loadingImage = ref(false)
const imageLoadFailed = ref(false)

const runtimeConfig = useRuntimeConfig()

const appUrl = computed(() => {
  const configured =
    runtimeConfig.public?.appUrl ||
    runtimeConfig.public?.APP_URL ||
    runtimeConfig.public?.siteUrl ||
    runtimeConfig.public?.SITE_URL ||
    ''

  if (typeof configured === 'string' && configured.trim()) {
    return configured.trim().replace(/\/+$/, '')
  }

  if (import.meta.client && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }

  return ''
})

const displayImage = computed(() => {
  return localImage.value || props.artImage
})

const cardTitle = computed(() => {
  return (
    displayImage.value.promptString ||
    displayImage.value.fileName ||
    `ArtImage #${displayImage.value.id}`
  )
})

const imageAltText = computed(() => {
  return displayImage.value.promptString || `Image ${displayImage.value.id}`
})

const imageLoadingMode = computed<'eager' | 'lazy'>(() => {
  return props.compact ? 'eager' : 'lazy'
})

const imageKey = computed(() => {
  return [
    displayImage.value.id,
    getImageDataMode(displayImage.value.imageData),
    displayImage.value.imagePath || 'no-path',
    imageLoadFailed.value ? 'fallback' : 'primary',
  ].join('-')
})

const cfgDisplay = computed(() => {
  const cfg = displayImage.value.cfg ?? 0
  return displayImage.value.cfgHalf ? `${cfg}.5` : String(cfg)
})

const checkpointDisplay = computed(() => {
  if (!displayImage.value.checkpoint) return ''
  return cleanCheckpointName(displayImage.value.checkpoint)
})

const checkpointTitle = computed(() => {
  return displayImage.value.checkpoint || checkpointDisplay.value
})

const resolvedImageSource = computed(() => {
  if (imageLoadFailed.value) return props.fallbackImage

  const pathUrl = createImagePathUrl(displayImage.value)
  const dataUrl = createImageDataUrl(displayImage.value)

  if (pathUrl && shouldPreferImagePath(displayImage.value)) return pathUrl
  if (dataUrl) return dataUrl
  if (pathUrl) return pathUrl

  return props.fallbackImage
})

const imageDataBadgeClass = computed(() => {
  return isUsableImageData(displayImage.value.imageData)
    ? 'badge-success'
    : 'badge-warning'
})

const debugImage = computed(() => {
  return {
    ...displayImage.value,
    imageData: displayImage.value.imageData
      ? `[${displayImage.value.imageData.length} chars: ${getImageDataMode(displayImage.value.imageData)}]`
      : '',
    thumbnailData: displayImage.value.thumbnailData
      ? `[${displayImage.value.thumbnailData.length} chars]`
      : null,
    appUrl: appUrl.value,
    resolvedImageSourceStart: resolvedImageSource.value.slice(0, 160),
    imageLoadFailed: imageLoadFailed.value,
    loadingImage: loadingImage.value,
  }
})

watch(
  () => props.artImage.id,
  async () => {
    localImage.value = props.artImage
    imageLoadFailed.value = false

    if (props.autoLoadImage && shouldFetchFullImage(props.artImage)) {
      await loadFullImage()
    }
  },
  { immediate: true },
)

watch(
  () => props.artImage,
  () => {
    if (props.artImage.id !== displayImage.value.id) return

    localImage.value = {
      ...displayImage.value,
      ...props.artImage,
      imageData: displayImage.value.imageData || props.artImage.imageData || '',
      thumbnailData:
        displayImage.value.thumbnailData ||
        props.artImage.thumbnailData ||
        null,
    }

    imageLoadFailed.value = false
  },
)

async function loadFullImage() {
  imageLoadFailed.value = false

  if (!props.autoLoadImage) return

  if (!shouldFetchFullImage(props.artImage)) {
    localImage.value = props.artImage
    return
  }

  loadingImage.value = true

  try {
    const fetched = await artStore.getArtImageById(props.artImage.id, {
      includeImageData: true,
      includeThumbnailData: true,
    })

    if (!fetched) {
      if (!createImagePathUrl(props.artImage)) imageLoadFailed.value = true
      return
    }

    localImage.value = fetched
    emit('loaded', fetched)

    if (!createImageDataUrl(fetched) && !createImagePathUrl(fetched)) {
      imageLoadFailed.value = true
    }
  } catch {
    if (!createImagePathUrl(props.artImage)) {
      imageLoadFailed.value = true
    }
  } finally {
    loadingImage.value = false
  }
}

function shouldFetchFullImage(image: ArtImage) {
  if (isUsableImageData(image.imageData)) return false
  if (createImagePathUrl(image)) return false
  return true
}

function shouldPreferImagePath(image: ArtImage) {
  if (!image.imagePath) return false
  if (!image.imageData) return true
  return isProbablyPath(image.imageData) || !isUsableImageData(image.imageData)
}

function handleImageError() {
  if (resolvedImageSource.value === props.fallbackImage) return
  imageLoadFailed.value = true
}

function selectImage() {
  emit('select', displayImage.value)
}

async function copyPrompt() {
  if (!displayImage.value.promptString) return
  await navigator.clipboard.writeText(displayImage.value.promptString)
  emit('copied', displayImage.value.promptString)
}

async function copySeed() {
  if (!displayImage.value.seed) return

  const seed = String(displayImage.value.seed)
  await navigator.clipboard.writeText(seed)
  emit('copied', seed)
}

async function copyCheckpoint() {
  if (!displayImage.value.checkpoint) return

  await navigator.clipboard.writeText(displayImage.value.checkpoint)
  emit('copied', displayImage.value.checkpoint)
}

function normalizeImageMimeType(fileType?: string | null) {
  if (!fileType) return 'image/png'

  const cleaned = fileType.trim().toLowerCase()

  if (cleaned.startsWith('image/')) return cleaned
  if (cleaned === 'jpg') return 'image/jpeg'
  if (cleaned === 'jpeg') return 'image/jpeg'
  if (cleaned === 'png') return 'image/png'
  if (cleaned === 'webp') return 'image/webp'
  if (cleaned === 'gif') return 'image/gif'

  return `image/${cleaned}`
}

function createImageDataUrl(image?: ArtImage | null) {
  const raw = image?.imageData?.trim()

  if (!raw) return ''

  if (raw.startsWith('data:image/')) return raw
  if (isProbablyPath(raw)) return ''
  if (!looksLikeBase64(raw)) return ''

  const mimeType = normalizeImageMimeType(image?.fileType)

  return `data:${mimeType};base64,${raw}`
}

function createImagePathUrl(image?: ArtImage | null) {
  const path =
    image?.imagePath || getPathFromBadImageData(image?.imageData) || ''

  return normalizeImagePath(path)
}

function normalizeImagePath(value?: string | null) {
  if (!value) return ''

  const trimmed = value.trim()

  if (!trimmed || trimmed === 'UNDEFINED' || trimmed === 'undefined') return ''

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed
  }

  const cleanPath = stripServerFilePrefix(trimmed)

  if (cleanPath.startsWith('/images/')) {
    return withAppUrl(cleanPath)
  }

  if (cleanPath.startsWith('images/')) {
    return withAppUrl(`/${cleanPath}`)
  }

  if (cleanPath.startsWith('/')) {
    return withAppUrl(`/images${cleanPath}`)
  }

  return withAppUrl(`/images/${cleanPath}`)
}

function stripServerFilePrefix(value: string) {
  return value
    .replace(/^file:\/\//, '')
    .replace(/^\/mnt\/data\/+/, '')
    .replace(/^\/public\/+/, '')
    .replace(/^public\/+/, '')
    .replace(/^\/app\/public\/+/, '')
    .replace(/^app\/public\/+/, '')
}

function withAppUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!appUrl.value) return normalizedPath

  return `${appUrl.value}${normalizedPath}`
}

function getPathFromBadImageData(value?: string | null) {
  if (!value) return ''

  const trimmed = value.trim()

  if (!isProbablyPath(trimmed)) return ''

  return trimmed
}

function isUsableImageData(value?: string | null) {
  if (!value) return false

  const trimmed = value.trim()

  if (trimmed.startsWith('data:image/')) return true
  if (isProbablyPath(trimmed)) return false

  return looksLikeBase64(trimmed)
}

function getImageDataMode(value?: string | null) {
  if (!value) return 'no-data'

  const trimmed = value.trim()

  if (trimmed.startsWith('data:image/')) return 'data-url'
  if (isProbablyPath(trimmed)) return 'path-in-imageData'
  if (looksLikeBase64(trimmed)) return 'base64'

  return 'unknown'
}

function isProbablyPath(value: string) {
  const trimmed = value.trim()

  return (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('images/') ||
    trimmed.startsWith('public/') ||
    trimmed.startsWith('/mnt/data/') ||
    /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(trimmed)
  )
}

function looksLikeBase64(value: string) {
  const compact = value.replace(/\s+/g, '')

  if (compact.length < 64) return false
  if (compact.length % 4 !== 0) return false

  return /^[A-Za-z0-9+/]+={0,2}$/.test(compact)
}

function cleanCheckpointName(value: string) {
  return (
    value
      .split('/')
      .at(-1)
      ?.replace(/\.(safetensors|ckpt|pt|bin)$/i, '')
      .replace(/\s*\[[^\]]+\]\s*$/g, '')
      .replace(/[_-]+/g, ' ')
      .trim() || value
  )
}
</script>

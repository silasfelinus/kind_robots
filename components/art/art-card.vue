<!-- /components/content/art/art-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="art.id"
    target-type="art"
    reaction-category="ART"
    :target-title="art.promptString || `Art #${art.id}`"
    @select="selectArt"
  >
    <template #actions>
      <button
        v-if="showActions && allowEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Art"
        @click.stop="emit('edit', art.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowCopyPrompt && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Copy Prompt"
        @click.stop="copyPrompt"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && canDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Art"
        @click.stop="deleteArt"
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
        :src="computedArtImage"
        :alt="artAltText"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        :loading="imageLoadingMode"
        decoding="async"
        @error="handleImageError"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="art.isPublic" class="badge badge-success badge-sm">
          Public
        </span>

        <span v-else class="badge badge-warning badge-sm">Private</span>

        <span v-if="art.isMature" class="badge badge-error badge-sm">
          Mature
        </span>

        <span
          v-if="checkpointResource?.isMature && !art.isMature"
          class="badge badge-error badge-sm"
          title="Checkpoint is marked mature"
        >
          Model 18+
        </span>
      </div>

      <div
        v-if="activeSelected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>

      <button
        v-if="imageLoadFailed && showDebug"
        class="absolute bottom-2 left-2 rounded-full bg-warning px-3 py-1 text-xs font-bold text-warning-content shadow"
        type="button"
        title="Retry image"
        @click.stop="loadArtImage"
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
          :title="art.promptString"
        >
          {{ art.promptString || 'Untitled Art' }}
        </h2>

        <p
          v-if="showNegativePrompt && art.negativePrompt"
          class="mt-1 line-clamp-2 text-xs text-base-content/50"
        >
          Negative: {{ art.negativePrompt }}
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

        <span
          v-if="checkpointResource?.generation || art.genres"
          class="badge badge-accent badge-sm"
        >
          {{ checkpointResource?.generation || art.genres }}
        </span>

        <span v-if="loadingCheckpoint" class="badge badge-ghost badge-sm">
          Loading model
        </span>

        <span v-if="art.sampler" class="badge badge-ghost badge-sm">
          {{ art.sampler }}
        </span>

        <span v-if="art.designer" class="badge badge-primary badge-sm">
          {{ art.designer }}
        </span>

        <span v-if="art.serverName" class="badge badge-secondary badge-sm">
          {{ art.serverName }}
        </span>
      </div>

      <div
        v-if="showGenerationMeta"
        class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
      >
        <div>
          <p class="font-bold uppercase text-base-content/45">Steps</p>
          <p class="truncate text-base-content/75">
            {{ art.steps ?? 'n/a' }}
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
          :disabled="!art.seed"
          title="Copy seed"
          @click.stop="copySeed"
        >
          <p class="font-bold uppercase text-base-content/45">Seed</p>
          <p class="truncate text-base-content/75">
            {{ art.seed ?? 'n/a' }}
          </p>
        </button>

        <div>
          <p class="font-bold uppercase text-base-content/45">Image</p>
          <p class="truncate text-base-content/75">
            {{ art.artImageId ? `#${art.artImageId}` : 'path only' }}
          </p>
        </div>

        <div
          v-if="art.checkpointResourceId || art.checkpoint"
          class="col-span-2"
        >
          <p class="font-bold uppercase text-base-content/45">Checkpoint</p>
          <p class="truncate text-base-content/75" :title="checkpointTitle">
            {{ checkpointResourceIdDisplay }}
          </p>
        </div>
      </div>

      <div v-if="showSelectButton" class="mt-auto grid grid-cols-1 gap-2 pt-1">
        <button
          class="btn btn-sm rounded-xl"
          :class="activeSelected ? 'btn-primary text-white' : 'btn-outline'"
          type="button"
          @click.stop="selectArt"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
          {{ activeSelected ? 'Selected' : 'Select' }}
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
          JSON.stringify(debugArt, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
// /components/content/art/art-card.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { Art, ArtImage, Resource } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useResourceStore } from '@/stores/resourceStore'

const props = withDefaults(
  defineProps<{
    art: Art
    artImage?: ArtImage | null
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showPrompt?: boolean
    showNegativePrompt?: boolean
    showMeta?: boolean
    showGenerationMeta?: boolean
    showSelectButton?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowCopyPrompt?: boolean
    autoLoadImage?: boolean
    autoLoadCheckpoint?: boolean
    fallbackImage?: string
  }>(),
  {
    artImage: null,
    selected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showPrompt: true,
    showNegativePrompt: false,
    showMeta: true,
    showGenerationMeta: false,
    showSelectButton: false,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    allowCopyPrompt: true,
    autoLoadImage: true,
    autoLoadCheckpoint: true,
    fallbackImage: '/images/backtree.webp',
  },
)

const emit = defineEmits<{
  edit: [id: number]
  delete: [id: number]
  copied: [value: string]
}>()

const artStore = useArtStore()
const userStore = useUserStore()
const resourceStore = useResourceStore()

const localArtImage = ref<ArtImage | null>(props.artImage)
const localCheckpointResource = ref<Resource | null>(null)
const loadingImage = ref(false)
const loadingCheckpoint = ref(false)
const imageLoadFailed = ref(false)

const activeSelected = computed(() => {
  return props.selected || artStore.currentArt?.id === props.art.id
})

const checkpointResource = computed(() => {
  return localCheckpointResource.value
})

const canDelete = computed(() => {
  if (!props.allowDelete) return false

  return userStore.isAdmin || props.art.userId === userStore.userId
})

const cfgDisplay = computed(() => {
  const cfg = props.art.cfg ?? 0

  return props.art.cfgHalf ? `${cfg}.5` : String(cfg)
})

const artAltText = computed(() => {
  return props.art.promptString || `Artwork ${props.art.id}`
})

const imageLoadingMode = computed<'eager' | 'lazy'>(() => {
  return props.compact ? 'eager' : 'lazy'
})

const imageKey = computed(() => {
  return [
    props.art.id,
    props.art.artImageId || 'no-image-id',
    props.artImage?.id || 'no-prop-image',
    imageLoadFailed.value ? 'fallback' : 'primary',
  ].join('-')
})

const checkpointDisplay = computed(() => {
  if (checkpointResource.value?.customLabel) {
    return checkpointResource.value.customLabel
  }

  if (checkpointResource.value?.name) {
    return cleanCheckpointName(checkpointResource.value.name)
  }

  if (props.art.checkpoint) {
    return cleanCheckpointName(props.art.checkpoint)
  }

  if (props.art.checkpointResourceId) {
    return `Checkpoint #${props.art.checkpointResourceId}`
  }

  return ''
})

const checkpointTitle = computed(() => {
  const parts = [
    checkpointResource.value?.customLabel,
    checkpointResource.value?.name,
    checkpointResource.value?.localPath,
    props.art.checkpoint,
  ].filter(Boolean)

  return [...new Set(parts)].join(' • ')
})

const checkpointResourceIdDisplay = computed(() => {
  if (!props.art.checkpointResourceId) {
    return checkpointDisplay.value || 'n/a'
  }

  return checkpointDisplay.value
    ? `#${props.art.checkpointResourceId} • ${checkpointDisplay.value}`
    : `#${props.art.checkpointResourceId}`
})

const computedArtImage = computed(() => {
  if (imageLoadFailed.value) {
    return props.fallbackImage
  }

  const localImage = createImageDataUrl(localArtImage.value)
  if (localImage) return localImage

  const propImage = createImageDataUrl(props.artImage)
  if (propImage) return propImage

  if (props.art.imagePath) {
    return props.art.imagePath
  }

  if (!props.art.artImageId && props.art.path) {
    return props.art.path
  }

  return props.fallbackImage
})

const debugArt = computed(() => {
  return {
    ...props.art,
    localImageId: localArtImage.value?.id,
    localImageFileType: localArtImage.value?.fileType,
    propImageId: props.artImage?.id,
    propImageFileType: props.artImage?.fileType,
    resolvedImageSourceStart: computedArtImage.value.slice(0, 120),
    imageLoadFailed: imageLoadFailed.value,
    imageLoadingMode: imageLoadingMode.value,
    resolvedCheckpointResource: checkpointResource.value,
    resolvedCheckpointDisplay: checkpointDisplay.value,
  }
})

function normalizeImageMimeType(fileType?: string | null) {
  if (!fileType) return 'image/png'

  const cleaned = fileType.trim().toLowerCase()

  if (cleaned.startsWith('image/')) {
    return cleaned
  }

  if (cleaned === 'jpg') {
    return 'image/jpeg'
  }

  if (cleaned === 'jpeg') {
    return 'image/jpeg'
  }

  if (cleaned === 'png') {
    return 'image/png'
  }

  if (cleaned === 'webp') {
    return 'image/webp'
  }

  if (cleaned === 'gif') {
    return 'image/gif'
  }

  return `image/${cleaned}`
}

function createImageDataUrl(image?: ArtImage | null) {
  if (!image?.imageData) return ''

  const mimeType = normalizeImageMimeType(image.fileType)

  return `data:${mimeType};base64,${image.imageData}`
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

async function loadArtImage() {
  imageLoadFailed.value = false

  if (!props.autoLoadImage) return

  if (props.artImage?.imageData) {
    localArtImage.value = props.artImage
    return
  }

  if (!props.art.artImageId) {
    localArtImage.value = null
    return
  }

  loadingImage.value = true
  localArtImage.value = null

  try {
    const fetched = await artStore.getArtImageById(props.art.artImageId)

    if (fetched?.imageData) {
      localArtImage.value = fetched
      return
    }

    imageLoadFailed.value = true
  } catch {
    imageLoadFailed.value = true
  } finally {
    loadingImage.value = false
  }
}

function handleImageError() {
  if (computedArtImage.value === props.fallbackImage) return

  imageLoadFailed.value = true
}

async function loadCheckpointResource() {
  if (!props.autoLoadCheckpoint) return

  const checkpointResourceId = props.art.checkpointResourceId

  if (!checkpointResourceId) {
    localCheckpointResource.value = null
    return
  }

  const existing = resourceStore.resources.find((resource) => {
    return resource.id === checkpointResourceId
  })

  if (existing) {
    localCheckpointResource.value = existing
    return
  }

  loadingCheckpoint.value = true

  try {
    localCheckpointResource.value =
      await resourceStore.getResourceById(checkpointResourceId)
  } finally {
    loadingCheckpoint.value = false
  }
}

async function selectArt() {
  await artStore.selectArtRecord(
    props.art,
    localArtImage.value || props.artImage || null,
  )
}

async function deleteArt() {
  await artStore.deleteArt(props.art.id)
  emit('delete', props.art.id)
}

async function copyPrompt() {
  if (!props.art.promptString) return

  await navigator.clipboard.writeText(props.art.promptString)
  emit('copied', props.art.promptString)
}

async function copySeed() {
  if (!props.art.seed) return

  const seed = String(props.art.seed)
  await navigator.clipboard.writeText(seed)
  emit('copied', seed)
}

async function copyCheckpoint() {
  const checkpoint =
    checkpointResource.value?.localPath ||
    checkpointResource.value?.name ||
    props.art.checkpoint

  if (!checkpoint) return

  await navigator.clipboard.writeText(checkpoint)
  emit('copied', checkpoint)
}

onMounted(async () => {
  await Promise.all([loadArtImage(), loadCheckpointResource()])
})

watch(
  () => [props.art.id, props.art.artImageId, props.artImage?.id],
  async (
    [artId, artImageId, artImagePropId],
    [previousArtId, previousArtImageId, previousArtImagePropId],
  ) => {
    if (
      artId === previousArtId &&
      artImageId === previousArtImageId &&
      artImagePropId === previousArtImagePropId
    ) {
      return
    }

    await loadArtImage()
  },
)

watch(
  () => props.art.checkpointResourceId,
  async (checkpointResourceId, previousCheckpointResourceId) => {
    if (checkpointResourceId === previousCheckpointResourceId) return

    await loadCheckpointResource()
  },
)
</script>
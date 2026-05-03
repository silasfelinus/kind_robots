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
        :src="computedArtImage"
        :alt="artAltText"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="art.isPublic" class="badge badge-success badge-sm">
          Public
        </span>

        <span v-else class="badge badge-warning badge-sm"> Private </span>

        <span v-if="art.isMature" class="badge badge-error badge-sm">
          Mature
        </span>
      </div>

      <div
        v-if="activeSelected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>
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
        <span v-if="art.checkpoint" class="badge badge-outline badge-sm">
          {{ art.checkpoint }}
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

        <div>
          <p class="font-bold uppercase text-base-content/45">Seed</p>
          <p class="truncate text-base-content/75">
            {{ art.seed ?? 'n/a' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Image</p>
          <p class="truncate text-base-content/75">
            {{ art.artImageId ? `#${art.artImageId}` : 'path only' }}
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
          JSON.stringify(art, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
// /components/content/art/art-card.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { Art, ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

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
    fallbackImage: '/images/backtree.webp',
  },
)

const emit = defineEmits<{
  edit: [id: number]
  delete: [id: number]
  copied: [prompt: string]
}>()

const artStore = useArtStore()
const userStore = useUserStore()

const localArtImage = ref<ArtImage | null>(props.artImage)
const loadingImage = ref(false)

const activeSelected = computed(() => {
  return props.selected || artStore.currentArt?.id === props.art.id
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

const computedArtImage = computed(() => {
  if (localArtImage.value?.imageData) {
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  }

  if (props.artImage?.imageData) {
    return `data:image/${props.artImage.fileType};base64,${props.artImage.imageData}`
  }

  if (props.art.imagePath) {
    return props.art.imagePath
  }

  if (!props.art.artImageId && props.art.path) {
    return props.art.path
  }

  return props.fallbackImage
})

async function loadArtImage() {
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

  try {
    const fetched = await artStore.getArtImageById(props.art.artImageId)

    if (fetched?.imageData) {
      localArtImage.value = fetched
    }
  } finally {
    loadingImage.value = false
  }
}

async function selectArt() {
  await artStore.selectArt(props.art.id)
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

onMounted(async () => {
  await loadArtImage()
})

watch(
  () => [props.art.artImageId, props.artImage?.id],
  async () => {
    await loadArtImage()
  },
)
</script>

<!-- /components/content/art/collection-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="collection.id"
    target-type="gallery"
    reaction-category="GALLERY"
    :target-title="collectionLabel"
    :card-class="isHiddenMature ? 'opacity-70' : ''"
    @select="selectCollection"
  >
    <template #actions>
      <button
        v-if="
          showActions && allowEdit && canEdit && (activeSelected || compact)
        "
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Collection"
        @click.stop="emit('edit', collection.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="
          showActions && allowDelete && canEdit && (activeSelected || compact)
        "
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Collection"
        @click.stop="deleteCollection"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <!-- ── Preview image ─────────────────────────────────────────────── -->
    <div
      v-if="showImage"
      :class="[
        'relative flex items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-300',
        imageHeightClass,
      ]"
    >
      <image-card
        v-if="previewArtImage && !isHiddenMature"
        :art-image="previewArtImage"
        :compact="true"
        :show-actions="false"
        :show-prompt="false"
        :show-meta="false"
        :show-generation-meta="false"
        :show-image-status="false"
        :show-select-button="false"
        :show-reaction="false"
        :auto-load-image="autoLoadPreviewImage"
        class="h-full w-full rounded-none border-0 bg-transparent p-0"
      />

      <img
        v-else-if="previewImage && !isHiddenMature"
        :src="previewImage"
        :alt="collectionLabel"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-base-100"
      >
        <div class="flex flex-col items-center gap-2 text-base-content/40">
          <Icon
            :name="isHiddenMature ? 'kind-icon:lock' : normalizedFallbackIcon"
            class="h-10 w-10"
          />
          <span class="text-xs font-bold">
            {{ isHiddenMature ? 'Mature hidden' : 'No preview' }}
          </span>
        </div>
      </div>

      <!-- Status badges — only visible when selected or mature is hidden -->
      <div
        v-if="activeSelected || (collection.isMature && !showMature)"
        class="absolute left-2 top-2 flex flex-wrap gap-1"
      >
        <span v-if="collection.isPublic" class="badge badge-success badge-xs"
          >Public</span
        >
        <span v-else class="badge badge-warning badge-xs">Private</span>
        <span v-if="collection.isMature" class="badge badge-error badge-xs"
          >Mature</span
        >
        <span v-if="activeSelected" class="badge badge-primary badge-xs"
          >Selected</span
        >
      </div>

      <!-- Selected check -->
      <div
        v-if="activeSelected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-1.5 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-3.5 w-3.5" />
      </div>
    </div>

    <!-- ── Text content ──────────────────────────────────────────────── -->
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="min-w-0">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact || size === 'xs'
              ? 'line-clamp-1 text-sm'
              : size === 'sm'
                ? 'line-clamp-1 text-sm'
                : 'text-base',
          ]"
          :title="collectionLabel"
        >
          {{ collectionLabel }}
        </h2>

        <p
          v-if="showDescription && size !== 'xs'"
          :class="[
            'mt-0.5 text-base-content/60',
            compact || size === 'sm'
              ? 'line-clamp-1 text-xs'
              : 'line-clamp-2 text-xs',
          ]"
        >
          {{ collectionDescription }}
        </p>
      </div>

      <!-- Meta badges -->
      <div v-if="showMeta" class="flex flex-wrap items-center gap-1">
        <span class="badge badge-outline badge-xs">{{ imageCountLabel }}</span>
        <span
          v-if="collectionUsername && size !== 'xs'"
          class="badge badge-primary badge-xs"
        >
          {{ collectionUsername }}
        </span>
      </div>

      <!-- Stats grid — only when selected AND showStats -->
      <div
        v-if="showStats && activeSelected"
        class="grid grid-cols-2 gap-1.5 rounded-xl border border-base-300 bg-base-100 p-2 text-xs"
      >
        <div>
          <p class="font-bold uppercase text-base-content/40">Images</p>
          <p class="text-base-content/75">{{ imageCount }}</p>
        </div>
        <div>
          <p class="font-bold uppercase text-base-content/40">Visibility</p>
          <p class="text-base-content/75">
            {{ collection.isPublic ? 'Public' : 'Private' }}
          </p>
        </div>
        <div>
          <p class="font-bold uppercase text-base-content/40">Mature</p>
          <p class="text-base-content/75">
            {{ collection.isMature ? 'Yes' : 'No' }}
          </p>
        </div>
        <div>
          <p class="font-bold uppercase text-base-content/40">Updated</p>
          <p class="text-base-content/75">{{ updatedLabel }}</p>
        </div>
      </div>

      <!-- Select button -->
      <div v-if="showSelectButton" class="mt-auto pt-1">
        <button
          class="btn btn-xs w-full rounded-lg"
          :class="activeSelected ? 'btn-primary' : 'btn-outline'"
          type="button"
          :disabled="isHiddenMature"
          @click.stop="selectCollection"
        >
          <Icon name="kind-icon:folder" class="h-3.5 w-3.5" />
          {{ activeSelected ? 'Selected' : 'Open' }}
        </button>
      </div>

      <!-- Debug -->
      <details
        v-if="showDebug"
        class="rounded-xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>
        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
          JSON.stringify(debugCollection, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
// /components/content/art/collection-card.vue
import { computed } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

type ArtImageCollection = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
  images?: ArtImage[]
}

const props = withDefaults(
  defineProps<{
    collection: ArtCollection
    selected?: boolean
    compact?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg'
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showSelectButton?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    showMature?: boolean
    autoLoadPreviewImage?: boolean
    fallbackImage?: string
    fallbackIcon?: string
    imageHeightClass?: string
    previewArtImage?: ArtImage | null
  }>(),
  {
    selected: false,
    compact: false,
    size: 'md',
    showImage: true,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showStats: false,
    showSelectButton: true,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    showMature: false,
    autoLoadPreviewImage: true,
    fallbackImage: '/images/backtree.webp',
    fallbackIcon: 'kind-icon:gallery',
    imageHeightClass: 'h-40',
    previewArtImage: null,
  },
)

const emit = defineEmits<{
  select: [collection: ArtCollection]
  edit: [id: number]
  delete: [id: number]
}>()

const collectionStore = useCollectionStore()
const userStore = useUserStore()

const mediaCollection = computed(() => props.collection as ArtImageCollection)

const activeSelected = computed(
  () =>
    props.selected ||
    collectionStore.currentCollection?.id === props.collection.id,
)

const isHiddenMature = computed(() =>
  Boolean(props.collection.isMature && !props.showMature),
)

const canEdit = computed(
  () => userStore.isAdmin || props.collection.userId === userStore.userId,
)

const collectionUsername = computed(() =>
  safeText(props.collection.username).trim(),
)

const collectionLabel = computed(() => {
  if (isHiddenMature.value) return 'Hidden Collection'
  return (
    safeText(props.collection.label).trim() ||
    `Collection #${props.collection.id}`
  )
})

const collectionDescription = computed(() => {
  if (isHiddenMature.value)
    return 'This collection is hidden by mature-content settings.'
  return (
    safeText(props.collection.description).trim() ||
    'A curated bundle of generated images.'
  )
})

const collectionImages = computed<ArtImage[]>(() => {
  const images = [
    ...(mediaCollection.value.artImages ?? []),
    ...(mediaCollection.value.ArtImages ?? []),
    ...(mediaCollection.value.images ?? []),
  ]
  const map = new Map<number, ArtImage>()
  for (const image of images) {
    if (image?.id) map.set(image.id, image)
  }
  return Array.from(map.values()).sort((a, b) => b.id - a.id)
})

const imageCount = computed(() => collectionImages.value.length)

const imageCountLabel = computed(
  () => `${imageCount.value} image${imageCount.value === 1 ? '' : 's'}`,
)

const previewArtImage = computed<ArtImage | null>(() => {
  if (isHiddenMature.value) return null
  if (props.previewArtImage?.id) return props.previewArtImage

  const visibleImages = collectionImages.value.filter(
    (image) => props.showMature || !image.isMature,
  )

  if (!visibleImages.length) return null
  const stableIndex = Math.abs(props.collection.id) % visibleImages.length
  return visibleImages[stableIndex] || visibleImages[0] || null
})

const previewImage = computed(() => {
  if (isHiddenMature.value) return ''
  return (
    createImageDataUrl(previewArtImage.value) ||
    safeText(previewArtImage.value?.imagePath).trim() ||
    safeText(
      (previewArtImage.value as ArtImage & { path?: string })?.path,
    ).trim() ||
    safeText(props.fallbackImage).trim()
  )
})

const normalizedFallbackIcon = computed(
  () => safeText(props.fallbackIcon).trim() || 'kind-icon:gallery',
)

const updatedLabel = computed(() => {
  const value = props.collection.updatedAt || props.collection.createdAt
  if (!value) return 'n/a'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'n/a'
  return date.toLocaleDateString()
})

const debugCollection = computed(() => ({
  id: props.collection.id,
  label: props.collection.label,
  imageCount: imageCount.value,
  previewArtImageId: previewArtImage.value?.id ?? null,
  artImages: mediaCollection.value.artImages?.length ?? 0,
  ArtImages: mediaCollection.value.ArtImages?.length ?? 0,
  images: mediaCollection.value.images?.length ?? 0,
}))

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value)
  return ''
}

function createImageDataUrl(image: ArtImage | null): string {
  if (!image?.imageData) return ''
  const raw = image.imageData.trim()
  if (!raw) return ''
  if (raw.startsWith('data:image/')) return raw
  const fileType = safeText(image.fileType).trim() || 'png'
  return `data:image/${fileType};base64,${raw}`
}

async function selectCollection() {
  if (isHiddenMature.value) return
  collectionStore.setCurrentCollection(props.collection.id)
  collectionStore.setSelectedCollectionIds([props.collection.id])
  emit('select', props.collection)
}

async function deleteCollection() {
  if (!canEdit.value) return
  const result = await collectionStore.deleteCollectionById(props.collection.id)
  if (result) emit('delete', props.collection.id)
}
</script>

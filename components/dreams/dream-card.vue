<!-- /components/dreams/dream-card.vue -->
<template>
  <article
    class="group relative flex h-full min-h-0 cursor-pointer overflow-hidden rounded-2xl border bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    :class="cardClass"
    @click="$emit('choose', dream)"
  >
    <figure
      v-if="showImage"
      class="relative h-full min-h-64 w-full overflow-hidden bg-base-300"
      :class="compact ? 'aspect-video' : 'aspect-4/5'"
    >
      <img
        v-if="previewImage"
        :src="previewImage"
        :alt="`${dreamTitle} preview`"
        class="h-full w-full transition duration-300 group-hover:scale-[1.03]"
        :class="imageFit === 'contain' ? 'object-contain' : 'object-cover'"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
      >
        <Icon name="kind-icon:dream" class="h-16 w-16 opacity-70" />
      </div>

      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-300/95 via-base-300/20 to-base-300/5"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span class="badge badge-primary badge-sm rounded-xl shadow">
          {{ dreamTypeLabel(dream.dreamType) }}
        </span>

        <span
          v-if="dream.isMature"
          class="badge badge-warning badge-sm rounded-xl shadow"
        >
          Mature
        </span>
      </div>

      <div
        v-if="selected || isSelected"
        class="absolute right-2 top-2 rounded-full border border-primary/40 bg-base-100/90 p-2 text-primary shadow backdrop-blur"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>

      <footer class="absolute inset-x-0 bottom-0 p-3">
        <h3
          class="line-clamp-2 text-lg font-black leading-tight text-base-content drop-shadow"
        >
          {{ dreamTitle }}
        </h3>

        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-if="scenarioCount"
            class="badge badge-secondary badge-sm rounded-xl bg-secondary/90 shadow"
          >
            {{ scenarioCount }} Scenario{{ scenarioCount === 1 ? '' : 's' }}
          </span>

          <span
            v-if="characterCount"
            class="badge badge-accent badge-sm rounded-xl bg-accent/90 shadow"
          >
            {{ characterCount }} Cast
          </span>

          <span
            v-if="artCount"
            class="badge badge-info badge-sm rounded-xl bg-info/90 shadow"
          >
            {{ artCount }} Art
          </span>

          <span
            v-if="rewardCount"
            class="badge badge-outline badge-sm rounded-xl border-base-content/30 bg-base-100/85 shadow backdrop-blur"
          >
            {{ rewardCount }} Item{{ rewardCount === 1 ? '' : 's' }}
          </span>
        </div>
      </footer>
    </figure>

    <section
      v-else
      class="flex min-h-56 flex-1 flex-col justify-end bg-linear-to-br from-primary/15 via-secondary/10 to-accent/15 p-3"
    >
      <h3
        class="line-clamp-2 text-lg font-black leading-tight text-base-content"
      >
        {{ dreamTitle }}
      </h3>

      <p v-if="showMeta" class="mt-1 text-xs text-base-content/50">
        #{{ dream.id }} · {{ dream.isPublic ? 'Public' : 'Private' }} ·
        {{ dream.isActive ? 'Active' : 'Archived' }}
      </p>
    </section>

    <div
      v-if="showActions && (allowEdit || allowDelete)"
      class="pointer-events-none absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100"
      @click.stop
    >
      <button
        v-if="allowEdit"
        type="button"
        class="btn btn-circle btn-sm border-base-300 bg-base-100/90 shadow backdrop-blur"
        title="Edit Dream"
        @click="$emit('edit', dream.id)"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
      </button>

      <button
        v-if="allowDelete"
        type="button"
        class="btn btn-circle btn-sm border-base-300 bg-base-100/90 text-error shadow backdrop-blur"
        title="Archive Dream"
        @click="$emit('delete', dream.id)"
      >
        <Icon name="kind-icon:archive" class="h-4 w-4" />
      </button>
    </div>

    <details
      v-if="showDebug"
      class="absolute inset-x-2 bottom-2 z-10 rounded-2xl border border-base-300 bg-base-100/95 p-2 text-xs shadow backdrop-blur"
      @click.stop
    >
      <summary class="cursor-pointer font-bold text-primary">
        Image debug · {{ debugInfo.winningSource }}
      </summary>
      <pre class="mt-2 max-h-56 overflow-auto whitespace-pre-wrap">{{
        debugInfo
      }}</pre>
    </details>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { DreamWithRelations } from '@/stores/dreamStore'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    selected?: boolean
    isSelected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    imageFit?: 'cover' | 'contain'
  }>(),
  {
    selected: false,
    isSelected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showDescription: false,
    showMeta: true,
    showStats: false,
    showDebug: false,
    allowEdit: true,
    allowDelete: false,
    imageFit: 'cover',
  },
)

defineEmits<{
  (event: 'choose', dream: DreamWithRelations): void
  (event: 'edit', id: number): void
  (event: 'delete', id: number): void
}>()

const dreamTitle = computed(() => {
  return props.dream.title || `Dream ${props.dream.id}`
})

const runtimeConfig = useRuntimeConfig()
const artStore = useArtStore()
const collectionStore = useCollectionStore()

// An ArtImage we lazily fetch when the Dream only carries an artImageId
// (no hydrated ArtImage relation).
const fetchedPrimaryArt = ref<ArtImage | null>(null)

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

// All collections attached to the Dream (primary + many-relation).
const dreamCollectionIds = computed<number[]>(() => {
  const ids = new Set<number>()
  if (props.dream.artCollectionId) ids.add(Number(props.dream.artCollectionId))
  if (props.dream.ArtCollection?.id)
    ids.add(Number(props.dream.ArtCollection.id))
  for (const collection of props.dream.ArtCollections ?? []) {
    if (collection?.id) ids.add(Number(collection.id))
  }
  return Array.from(ids).filter((id) => Number.isInteger(id) && id > 0)
})

// Images already attached to the Dream or its collections (hydrated payload).
const collectionArt = computed<Partial<ArtImage>[]>(() => {
  return [
    ...(props.dream.ArtImages ?? []),
    ...(props.dream.ArtCollection?.ArtImages ?? []),
    ...(props.dream.ArtCollections ?? []).flatMap(
      (collection) => collection.ArtImages ?? [],
    ),
  ]
})

// Pull collection images out of the collection store cache too, so a Dream that
// only carries an artCollectionId can still show a cover.
const collectionStoreArt = computed<Partial<ArtImage>[]>(() => {
  const seen = new Map<number, Partial<ArtImage>>()
  for (const collectionId of dreamCollectionIds.value) {
    const images =
      (collectionStore.getCollectionImages?.(collectionId) as
        | Partial<ArtImage>[]
        | undefined) ?? []
    for (const image of images) {
      if (image?.id) seen.set(image.id, image)
    }
  }
  return Array.from(seen.values())
})

// The full pool of candidate collection images (payload + store cache).
const collectionImagePool = computed<Partial<ArtImage>[]>(() => {
  const seen = new Map<number, Partial<ArtImage>>()
  for (const image of [...collectionArt.value, ...collectionStoreArt.value]) {
    if (image?.id) seen.set(image.id, image)
  }
  return Array.from(seen.values())
})

// Bumping this re-rolls the random collection cover. It ticks on mount and
// whenever the Dream (or its available collection art) changes, so each time
// the card appears it can show a different image from the collection.
const shuffleTick = ref(0)

// A random collection image, reshuffled whenever shuffleTick changes.
const randomCollectionImage = computed<Partial<ArtImage> | null>(() => {
  // Touch shuffleTick so this recomputes when we ask for a new roll.
  void shuffleTick.value
  const pool = collectionImagePool.value.filter((art) => imageToSrc(art))
  if (!pool.length) return null
  const index = Math.floor(Math.random() * pool.length)
  return pool[index] ?? pool[0] ?? null
})

// The chosen primary ArtImage record for the cover.
const primaryArt = computed<Partial<ArtImage> | null>(() => {
  if (props.dream.ArtImage && imageToSrc(props.dream.ArtImage)) {
    return props.dream.ArtImage
  }

  if (fetchedPrimaryArt.value && imageToSrc(fetchedPrimaryArt.value)) {
    return fetchedPrimaryArt.value
  }

  return null
})

const explicitDreamImagePath = computed(() => {
  return (
    normalizeImagePath(props.dream.imagePath) ||
    normalizeImagePath(props.dream.highlightImage) ||
    ''
  )
})

const fallbackCollectionArt = computed<Partial<ArtImage> | null>(() => {
  if (randomCollectionImage.value) return randomCollectionImage.value

  return collectionImagePool.value.find((art) => imageToSrc(art)) ?? null
})

const previewImage = computed(() => {
  return (
    imageToSrc(primaryArt.value) ||
    explicitDreamImagePath.value ||
    imageToSrc(fallbackCollectionArt.value) ||
    ''
  )
})

// A short, readable preview of any value: truncates long strings (e.g. base64)
// and labels whether a string looks like a path or raw data.
function previewValue(value?: string | null, max = 64): string {
  if (value === null || value === undefined) return '∅ (null/undefined)'
  const str = String(value)
  if (!str.trim()) return '∅ (empty)'
  const kind = isProbablyPath(str) ? 'path' : 'data'
  const head =
    str.length > max ? `${str.slice(0, max)}… (+${str.length - max})` : str
  return `[${kind}] ${head}`
}

// Describe a candidate ArtImage record: its id and what image source fields it
// actually carries (data / thumbnail / path), each previewed.
function describeArt(image?: Partial<ArtImage> | null) {
  if (!image) return { id: null, resolved: '∅ (no record)' }
  const data = (image as { imageData?: string | null }).imageData
  const thumb = (image as { thumbnailData?: string | null }).thumbnailData
  const path =
    image.imagePath ||
    (image as { path?: string | null }).path ||
    image.fileName ||
    null
  return {
    id: image.id ?? null,
    fileType: (image as { fileType?: string | null }).fileType ?? null,
    thumbnailData: previewValue(thumb),
    imageData: previewValue(data),
    path: previewValue(path),
    resolved: previewValue(imageToSrc(image)),
  }
}

// What the card actually resolved at each step of the cover-image chain. This
// is what the Debug panel renders so you can see why an image is missing.
const debugInfo = computed(() => {
  const winner = imageToSrc(primaryArt.value)
    ? 'primaryArt'
    : explicitDreamImagePath.value
      ? 'explicitDreamImagePath'
      : imageToSrc(fallbackCollectionArt.value)
        ? 'fallbackCollectionArt'
        : 'none'

  return {
    dreamId: props.dream.id,
    artImageId: props.dream.artImageId ?? null,
    artCollectionId: props.dream.artCollectionId ?? null,
    collectionIds: dreamCollectionIds.value,
    collectionPoolSize: collectionImagePool.value.length,
    winningSource: winner,
    finalPreviewImage: previewValue(previewImage.value),
    primaryArt: describeArt(primaryArt.value),
    explicitDreamImagePath: previewValue(explicitDreamImagePath.value),
    fallbackCollectionArt: describeArt(fallbackCollectionArt.value),
    collectionPool: collectionImagePool.value
      .slice(0, 6)
      .map((art) => describeArt(art)),
  }
})

// Build a usable <img> src from an ArtImage: base64 data first, then path.
function imageToSrc(image?: Partial<ArtImage> | null): string {
  if (!image) return ''

  const data = (image as { imageData?: string | null }).imageData
  const thumb = (image as { thumbnailData?: string | null }).thumbnailData
  const fileType = (image as { fileType?: string | null }).fileType || 'png'

  if (thumb && !isProbablyPath(thumb)) {
    return `data:image/${fileType};base64,${thumb}`
  }
  if (data && !isProbablyPath(data)) {
    return `data:image/${fileType};base64,${data}`
  }

  const rawPath =
    image.imagePath ||
    (image as { path?: string | null }).path ||
    image.fileName ||
    ''
  return normalizeImagePath(rawPath)
}

async function loadPrimaryArt() {
  fetchedPrimaryArt.value = null

  const id = Number(props.dream.artImageId)
  if (!Number.isInteger(id) || id <= 0) return

  // Already hydrated with a usable image — no fetch needed.
  if (props.dream.ArtImage?.id === id && imageToSrc(props.dream.ArtImage))
    return

  try {
    const fetched = await artStore.getArtImageById(id, {
      includeImageData: true,
      includeThumbnailData: true,
    })
    fetchedPrimaryArt.value = (fetched as ArtImage) ?? null
  } catch {
    fetchedPrimaryArt.value = null
  }
}

watch(
  () => [props.dream.id, props.dream.artImageId],
  () => {
    void loadPrimaryArt()
    shuffleTick.value += 1
  },
  { immediate: true },
)

async function ensureCollectionImages() {
  if (!dreamCollectionIds.value.length) return
  if (collectionImagePool.value.some((art) => imageToSrc(art))) return

  try {
    const shouldForce = Boolean(
      collectionStore.hasFetched &&
      !collectionStore.allCollectionArtImages.length,
    )

    await collectionStore.fetchCollections(shouldForce, {
      includeImages: true,
      imageLimit: 80,
    })
  } catch {}

  shuffleTick.value += 1
}

watch(
  () => dreamCollectionIds.value.join(','),
  () => {
    void ensureCollectionImages()
    shuffleTick.value += 1
  },
  { immediate: true },
)

// Re-roll the random cover once the collection art becomes available.
watch(
  () => collectionImagePool.value.length,
  () => {
    shuffleTick.value += 1
  },
)

onMounted(() => {
  void ensureCollectionImages()
})

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
    /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(trimmed)
  )
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
  if (!cleanPath) return ''

  if (cleanPath.startsWith('/images/')) return withAppUrl(cleanPath)
  if (cleanPath.startsWith('images/')) return withAppUrl(`/${cleanPath}`)
  if (cleanPath.startsWith('/')) return withAppUrl(cleanPath)

  return withAppUrl(`/images/${cleanPath}`)
}

function stripServerFilePrefix(value: string) {
  return value
    .replace(/^file:\/\//, '')
    .replace(/^\/mnt\/data\/+/, '')
    .replace(/^\/?(app\/)?public\/+/, '')
}

function withAppUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return appUrl.value ? `${appUrl.value}${normalizedPath}` : normalizedPath
}

const scenarioCount = computed(() => {
  return (
    props.dream._count?.Scenarios ??
    props.dream.Scenarios?.length ??
    (props.dream.Scenario ? 1 : 0)
  )
})

const characterCount = computed(() => {
  return props.dream._count?.Characters ?? props.dream.Characters?.length ?? 0
})

const rewardCount = computed(() => {
  return props.dream._count?.Rewards ?? props.dream.Rewards?.length ?? 0
})

const artCount = computed(() => {
  return props.dream._count?.ArtImages ?? collectionArt.value.length
})

const cardClass = computed(() => {
  if (props.selected || props.isSelected) {
    return 'border-primary ring-2 ring-primary/30'
  }

  if (props.dream.isActive === false) {
    return 'border-base-300 opacity-70 grayscale-[35%]'
  }

  return 'border-base-300'
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>

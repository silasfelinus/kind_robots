<!-- /components/dreams/dream-card.vue -->
<template>
  <!-- The shared card shell (interface-vision t-031) plus the shared card BODY
       (t-064). Dream was the last of the five object cards still rolling its
       own markup below the shell: 5/5 now share kr-entity-card-body.
       :padded="false" is GONE with the bespoke poster -- the body insets its
       own art and owns its padding, exactly as the other four do, which is
       what "a single display that is consistent across galleries" means. -->
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :allow-reviews="dream.allowReviews"
    :target-id="dream.id"
    target-type="dream"
    reaction-category="DREAM"
    :target-title="dreamTitle"
    :earned-karma="earnedKarma"
    :card-class="[
      'h-full min-h-0 bg-base-100 shadow-sm hover:-translate-y-0.5 hover:shadow-xl',
      cardClass,
    ]"
    @select="emit('choose', dream)"
  >
    <kr-entity-card-body
      :title="dreamTitle"
      :subtitle="dreamTypeLabel(dream.dreamType)"
      :description="dreamDescription"
      description-fallback="No description yet."
      :source="dream"
      :variant="variant"
      :fallback="previewImage"
      :show-image="showImage"
      :show-description="showDescription"
      :compact="compact"
      :selected="activeSelected"
      :badges="badges"
      :meta="showMeta ? metaChips : []"
      :fit="imageFit"
      placeholder-icon="kind-icon:dream"
    />

    <template #actions>
      <button
        v-if="showActions && allowEdit"
        type="button"
        class="btn btn-circle btn-sm border-base-300 bg-base-100/90 shadow backdrop-blur"
        title="Edit Dream"
        @click="emit('edit', dream.id)"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowDelete"
        type="button"
        class="btn btn-circle btn-sm border-base-300 bg-base-100/90 text-error shadow backdrop-blur"
        title="Archive Dream"
        @click="emit('delete', dream.id)"
      >
        <Icon name="kind-icon:archive" class="h-4 w-4" />
      </button>
    </template>

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
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { DreamWithRelations } from '@/stores/dreamStore'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'
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
    /**
     * Which stored art to show, and at what aspect — the shared card/hero/icon
     * vocabulary (utils/galleryVocabulary.ts). This is what makes the gallery's
     * Cards/Heroes/Icons toggle mean something; without it every mode rendered
     * an identical portrait poster.
     */
    variant?: ArtVariant
    /** Total karma this Dream has earned from reactions (see
     *  server/api/economy/karma-earned.post.ts). Omit/undefined renders no
     *  badge — see components/wonderlab/reactable-card.vue. */
    earnedKarma?: number | null
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
    variant: 'card',
    earnedKarma: undefined,
  },
)

const emit = defineEmits<{
  choose: [dream: DreamWithRelations]
  edit: [id: number]
  delete: [id: number]
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
        Partial<ArtImage>[] | undefined) ?? []
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

/**
 * The variant's own stored path first, then the generic ones. Half the Dreams
 * have no cardPath at all, so the chain past the first entry is the common
 * case rather than the exception — a mode must still render something when its
 * dedicated art was never generated.
 *
 * There is deliberately no `icon` branch: unlike Bot, Character, Reward and
 * Scenario, the Dream model never got an `iconPath` column (`icon` on Dream is
 * a name, not a path — see the split in #1258). Icons mode therefore shows
 * card art cropped square, which is why it is a real mode rather than a broken
 * one. Giving Dream an iconPath is a schema change, tracked separately.
 */
const explicitDreamImagePath = computed(() => {
  const variantPath =
    props.variant === 'hero' ? props.dream.heroPath : props.dream.cardPath

  return (
    normalizeImagePath(variantPath) ||
    normalizeImagePath(props.dream.cardPath) ||
    normalizeImagePath(props.dream.imagePath) ||
    normalizeImagePath(props.dream.highlightImage) ||
    ''
  )
})

// The per-variant aspect that used to live here is gone: kr-entity-card-body
// owns shape now, via its own shape/compactShape props. Keeping a second copy
// would be the exact duplication t-064 exists to remove.

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

// Build a usable <img> src from an ArtImage: path first, then inline base64
// (thumbnail, then full) for pathless rows.
function imageToSrc(image?: Partial<ArtImage> | null): string {
  if (!image) return ''

  const data = (image as { imageData?: string | null }).imageData
  const thumb = (image as { thumbnailData?: string | null }).thumbnailData
  const fileType = (image as { fileType?: string | null }).fileType || 'png'

  // Path-first, but only a *real* stored path (imagePath/path) may beat inline
  // base64. A bare fileName ("foo.webp") must NOT — isProbablyPath() treats any
  // "*.webp" as a path, so folding fileName in here resolved pathless art to a
  // broken URL and blanked it.
  const storedPath =
    image.imagePath || (image as { path?: string | null }).path || ''

  if (storedPath && isProbablyPath(storedPath)) {
    return normalizeImagePath(storedPath)
  }
  if (thumb && !isProbablyPath(thumb)) {
    return `data:image/${fileType};base64,${thumb}`
  }
  if (data && !isProbablyPath(data)) {
    return `data:image/${fileType};base64,${data}`
  }

  // Last resort: a bare fileName only when there is no path and no base64.
  return normalizeImagePath(storedPath || image.fileName || '')
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

/*
 * `selected` and `isSelected` are two props for one state -- they were declared
 * separately and then always read together (`selected || isSelected`) in both
 * the template and cardClass. Collapsed to one computed rather than removing a
 * prop, because callers pass both spellings and dropping either would silently
 * stop working at a call site vue-tsc cannot see through a template.
 */
const activeSelected = computed(() => props.selected || props.isSelected)

/**
 * Same precedence dream-gallery's own helper uses, so the card and the list it
 * came from describe a Dream identically rather than picking different fields.
 */
const dreamDescription = computed(
  () =>
    props.dream.pitch ||
    props.dream.description ||
    props.dream.flavorText ||
    '',
)

/**
 * Corner badges over the art. Deliberately NOT the dream type — that is the
 * subtitle now, the slot reward-card put rewardType in. It used to appear as a
 * badge AND nowhere else; duplicating it here would repeat the subtitle two
 * centimetres above itself, which is the kind of drift converging these cards
 * is meant to end.
 */
const badges = computed<EntityCardChip[]>(() => {
  const list: EntityCardChip[] = []
  if (props.dream.isMature)
    list.push({ label: 'Mature', class: 'badge-warning' })
  if (props.dream.isPublic === false)
    list.push({ label: 'Private', class: 'badge-ghost' })
  return list
})

/**
 * The counts that were overlaid on the poster. They move to the meta row on the
 * card surface, where every other object card puts them — legible against a
 * solid background instead of against whatever the art happens to be.
 */
const metaChips = computed<EntityCardChip[]>(() => {
  const list: EntityCardChip[] = []
  if (scenarioCount.value)
    list.push({
      label: `${scenarioCount.value} Scenario${scenarioCount.value === 1 ? '' : 's'}`,
      class: 'badge-secondary',
    })
  if (characterCount.value)
    list.push({ label: `${characterCount.value} Cast`, class: 'badge-accent' })
  if (artCount.value)
    list.push({ label: `${artCount.value} Art`, class: 'badge-info' })
  if (rewardCount.value)
    list.push({
      label: `${rewardCount.value} Item${rewardCount.value === 1 ? '' : 's'}`,
      class: 'badge-outline',
    })
  return list
})

const cardClass = computed(() => {
  // reactable-card draws the selected border and tint itself; this only adds
  // the ring on top, and the inactive-dream treatment.
  if (activeSelected.value) return 'ring-2 ring-primary/30'

  if (props.dream.isActive === false) {
    return 'opacity-70 grayscale-[35%]'
  }

  return ''
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>

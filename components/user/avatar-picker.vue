<!-- /components/content/user/avatar-picker.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3 sm:p-4"
  >
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex shrink-0 items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
    >
      <span
        class="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 ring-2 ring-accent/40"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          alt="Current avatar preview"
          class="h-full w-full object-cover"
          @error="onPreviewError"
        />
        <Icon v-else name="kind-icon:user" class="h-6 w-6 text-primary" />
      </span>

      <div class="min-w-0 flex-1">
        <h1 class="text-lg font-black leading-tight text-base-content">
          Choose your avatar
        </h1>
        <p class="truncate text-xs text-base-content/55">
          Pick from a collection, upload your own, or conjure something new.
        </p>
      </div>

      <button
        v-if="dismissible"
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        title="Close"
        @click="emit('close')"
      >
        <Icon name="kind-icon:x" class="h-4 w-4" />
      </button>
    </header>

    <!-- ── Tabs ────────────────────────────────────────────────────────── -->
    <div
      class="flex shrink-0 gap-1 rounded-2xl border border-base-300 bg-base-100 p-1"
      role="tablist"
    >
      <button
        v-for="tab in TABS"
        :key="tab.value"
        class="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black transition"
        :class="
          activeTab === tab.value
            ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
            : 'text-base-content/55 hover:bg-base-200 hover:text-base-content'
        "
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        @click="activeTab = tab.value"
      >
        <Icon :name="tab.icon" class="h-4 w-4" />
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>

    <!-- ── Status banner ───────────────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="statusMessage"
        class="flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        <Icon
          :name="statusTone === 'error' ? 'kind-icon:alert' : 'kind-icon:check'"
          class="h-4 w-4 shrink-0"
        />
        {{ statusMessage }}
      </div>
    </Transition>

    <!-- ── Body ────────────────────────────────────────────────────────── -->
    <div class="min-h-0 flex-1 overflow-hidden">
      <!-- GALLERY TAB -->
      <div
        v-show="activeTab === 'gallery'"
        class="flex h-full min-h-0 flex-col gap-2"
      >
        <!-- Collection selector -->
        <div class="flex shrink-0 items-center gap-2">
          <label
            class="input input-bordered input-sm flex flex-1 items-center gap-1.5 bg-base-100"
          >
            <Icon
              name="kind-icon:search"
              class="h-3.5 w-3.5 shrink-0 text-base-content/40"
            />
            <input
              v-model="gallerySearch"
              type="search"
              class="min-w-0 flex-1 bg-transparent"
              placeholder="Search images…"
            />
          </label>

          <select
            v-model="selectedCollectionId"
            class="select select-bordered select-sm max-w-48 bg-base-100 font-semibold"
            title="Collection"
          >
            <option
              v-for="option in collectionOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.label }} ({{ option.count }})
            </option>
          </select>

          <button
            class="btn btn-ghost btn-sm rounded-lg"
            type="button"
            :disabled="isLoadingGallery"
            title="Refresh"
            @click="refreshGallery(true)"
          >
            <span
              v-if="isLoadingGallery"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          </button>
        </div>

        <!-- Image grid -->
        <div class="min-h-0 flex-1 overflow-y-auto rounded-xl bg-base-100 p-2">
          <div
            v-if="isLoadingGallery"
            class="flex h-full min-h-40 items-center justify-center"
          >
            <span class="loading loading-spinner loading-lg text-primary" />
          </div>

          <div
            v-else-if="!galleryImages.length"
            class="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-base-content/55"
          >
            <Icon name="kind-icon:gallery" class="h-10 w-10 text-primary/60" />
            <p class="text-sm font-bold text-base-content">
              No images here yet.
            </p>
            <p class="text-xs">
              Try the Upload or Generate tab to make your first one.
            </p>
          </div>

          <div
            v-else
            class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
          >
            <button
              v-for="image in galleryImages"
              :key="image.id"
              class="group relative aspect-square overflow-hidden rounded-xl border-2 transition focus:outline-none focus:ring-2 focus:ring-primary"
              :class="
                pendingId === image.id
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-base-300 hover:border-primary/60'
              "
              type="button"
              :disabled="isApplying"
              :title="
                image.promptString || image.fileName || `Image #${image.id}`
              "
              @click="chooseFromGallery(image)"
            >
              <img
                :src="thumbFor(image)"
                :alt="image.promptString || `Image ${image.id}`"
                class="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
                @error="onThumbError($event, image)"
              />

              <span
                class="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/0 transition group-hover:bg-primary/30"
              >
                <Icon
                  name="kind-icon:check"
                  class="h-6 w-6 scale-0 text-primary-content drop-shadow transition group-hover:scale-100"
                />
              </span>

              <span
                v-if="pendingId === image.id && isApplying"
                class="absolute inset-0 flex items-center justify-center bg-base-100/70"
              >
                <span class="loading loading-spinner loading-sm text-primary" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- UPLOAD TAB -->
      <div
        v-show="activeTab === 'upload'"
        class="h-full min-h-0 overflow-y-auto rounded-xl"
      >
        <image-upload />
      </div>

      <!-- GENERATE TAB -->
      <div
        v-show="activeTab === 'generate'"
        class="h-full min-h-0 overflow-y-auto rounded-xl bg-base-100 p-3"
      >
        <generate-button
          :show-result="true"
          :show-message="true"
          label="Generate avatar"
          busy-label="Dreaming…"
          @generated="chooseFromGenerated"
          @failed="onGenerateFailed"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage, ArtCollection } from '@/stores/artStore'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'
import { useUploadStore } from '@/stores/uploadStore'

type TabValue = 'gallery' | 'upload' | 'generate'

const props = withDefaults(
  defineProps<{
    // Collection label to open by default in the gallery tab.
    defaultCollectionLabel?: string
    // Show the close (x) button + emit 'close'.
    dismissible?: boolean
  }>(),
  {
    defaultCollectionLabel: 'avatars',
    dismissible: false,
  },
)

const emit = defineEmits<{
  // Fired after the avatar is successfully applied to the user.
  selected: [artImage: ArtImage]
  close: []
}>()

const TABS: { value: TabValue; label: string; icon: string }[] = [
  { value: 'gallery', label: 'Gallery', icon: 'kind-icon:gallery' },
  { value: 'upload', label: 'Upload', icon: 'kind-icon:camera' },
  { value: 'generate', label: 'Generate', icon: 'kind-icon:sparkles' },
]

const FALLBACK_AVATAR = '/images/kindart.webp'

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()
const uploadStore = useUploadStore()

const activeTab = ref<TabValue>('gallery')
const gallerySearch = ref('')
const selectedCollectionId = ref<number>(-1)
const isLoadingGallery = ref(false)
const isApplying = ref(false)
const pendingId = ref<number | null>(null)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const previewUrl = ref<string>(FALLBACK_AVATAR)
const localHydrated = ref<Record<number, ArtImage>>({})

// ── Collection options ──────────────────────────────────────────────────
function collectionImages(collection: ArtCollection): ArtImage[] {
  const media = collection as ArtCollection & {
    artImages?: ArtImage[]
    ArtImages?: ArtImage[]
    images?: ArtImage[]
  }
  const map = new Map<number, ArtImage>()
  for (const image of [
    ...(media.artImages || []),
    ...(media.ArtImages || []),
    ...(media.images || []),
  ]) {
    if (image?.id) map.set(image.id, localHydrated.value[image.id] || image)
  }
  return Array.from(map.values()).sort((a, b) => b.id - a.id)
}

const collectionOptions = computed(() => {
  const real = (collectionStore.collections ?? []).map((collection) => ({
    id: collection.id,
    label: collection.label || `Collection #${collection.id}`,
    count: collectionImages(collection).length,
  }))

  // Virtual "All images" option keyed -1.
  const all = {
    id: -1,
    label: 'All images',
    count: artStore.artImages.length,
  }

  return [all, ...real]
})

const activeCollection = computed<ArtCollection | null>(() => {
  if (selectedCollectionId.value === -1) return null
  return (
    (collectionStore.collections ?? []).find(
      (c) => c.id === selectedCollectionId.value,
    ) ?? null
  )
})

const galleryImages = computed<ArtImage[]>(() => {
  const base = activeCollection.value
    ? collectionImages(activeCollection.value)
    : [...artStore.artImages]
        .map((image) => localHydrated.value[image.id] || image)
        .sort((a, b) => b.id - a.id)

  const query = gallerySearch.value.trim().toLowerCase()
  const matureSafe = base.filter(
    (image) => userStore.showMature || !image.isMature,
  )

  if (!query) return matureSafe

  return matureSafe.filter((image) =>
    [
      image.id,
      image.fileName,
      image.promptString,
      image.designer,
      image.checkpoint,
    ]
      .filter((v) => v !== null && v !== undefined)
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

// ── Image source helpers (mirror image-card's resolution, thumb-first) ────
function isProbablyPath(value: string): boolean {
  const t = value.trim()
  return (
    t.startsWith('/') ||
    t.startsWith('./') ||
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    t.startsWith('images/') ||
    /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(t)
  )
}

function looksLikeBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, '')
  if (compact.length < 64) return false
  if (compact.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+={0,2}$/.test(compact)
}

function asImageSource(raw?: string | null): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (!trimmed || trimmed === 'undefined' || trimmed === 'UNDEFINED') return ''
  if (trimmed.startsWith('data:image/')) return trimmed
  if (isProbablyPath(trimmed)) {
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/')
    )
      return trimmed
    return `/${trimmed.replace(/^\/+/, '')}`
  }
  if (looksLikeBase64(trimmed)) return `data:image/png;base64,${trimmed}`
  return ''
}

function thumbFor(image: ArtImage): string {
  const hydrated = localHydrated.value[image.id] || image
  const candidate =
    asImageSource(hydrated.thumbnailData) ||
    asImageSource(hydrated.imageData) ||
    asImageSource(hydrated.imagePath) ||
    asImageSource(hydrated.path)
  return candidate || FALLBACK_AVATAR
}

function avatarSourceFor(image: ArtImage): string {
  return (
    asImageSource(image.imageData) ||
    asImageSource(image.imagePath) ||
    asImageSource(image.path) ||
    asImageSource(image.thumbnailData) ||
    ''
  )
}

async function onThumbError(event: Event, image: ArtImage) {
  const el = event.target as HTMLImageElement
  if (el.src.endsWith(FALLBACK_AVATAR)) return
  // Try a full hydrate once, then fall back.
  const fetched = await hydrate(image.id)
  if (fetched) {
    const next = thumbFor(fetched)
    if (next && next !== FALLBACK_AVATAR) {
      el.src = next
      return
    }
  }
  el.src = FALLBACK_AVATAR
}

function onPreviewError() {
  previewUrl.value = FALLBACK_AVATAR
}

async function hydrate(id: number): Promise<ArtImage | null> {
  if (localHydrated.value[id]) return localHydrated.value[id]
  try {
    const fetched = await artStore.getArtImageById(id, {
      includeImageData: true,
      includeThumbnailData: true,
    })
    if (fetched) {
      localHydrated.value = { ...localHydrated.value, [id]: fetched }
      return fetched
    }
  } catch {
    // ignore — caller handles fallback
  }
  return null
}

// ── Apply avatar ──────────────────────────────────────────────────────────
async function applyAvatar(image: ArtImage) {
  if (userStore.isGuest || !userStore.user?.id) {
    setStatus('Sign in to set an avatar.', 'error')
    return
  }

  isApplying.value = true
  pendingId.value = image.id
  statusMessage.value = ''

  try {
    // Ensure we have a usable source; hydrate if the list item was slim.
    let full = image
    if (!avatarSourceFor(full)) {
      full = (await hydrate(image.id)) || image
    }

    const source = avatarSourceFor(full)

    // artImageId is the single source of truth for the avatar. We never write
    // the resolved source into User.avatarImage — for uploaded/generated images
    // that source is a base64 data URI, which overflows the @db.Text column.
    await userStore.updateUserInfo({
      id: userStore.user.id,
      artImageId: full.id,
    })

    previewUrl.value = source || FALLBACK_AVATAR
    setStatus('Avatar updated.', 'success')
    emit('selected', full)
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to set avatar.',
      'error',
    )
  } finally {
    isApplying.value = false
    pendingId.value = null
  }
}

function chooseFromGallery(image: ArtImage) {
  void applyAvatar(image)
}

function chooseFromGenerated(image: ArtImage) {
  // Generated images land in the store; refresh so they appear in the grid too.
  localHydrated.value = { ...localHydrated.value, [image.id]: image }
  void applyAvatar(image).then(() => {
    activeTab.value = 'gallery'
  })
}

function onGenerateFailed(message: string) {
  setStatus(message || 'Generation failed.', 'error')
}

function setStatus(message: string, tone: 'success' | 'error') {
  statusMessage.value = message
  statusTone.value = tone
  if (message && tone === 'success') {
    window.setTimeout(() => {
      if (statusMessage.value === message) statusMessage.value = ''
    }, 4000)
  }
}

// ── Upload target wiring ──────────────────────────────────────────────────
function configureUploadTarget() {
  if (userStore.isGuest || !userStore.user?.id) return

  // Avatar linking (user patch via artImageId) lives in the store. The hook
  // below only does picker-specific UI: cache the hydrated image, update the
  // preview, announce, and drop back to the gallery.
  uploadStore.setAvatarTarget({
    userId: userStore.user.id,
    collectionLabel: props.defaultCollectionLabel,
    showPreview: true,
    onApplied: ({ imageData, imagePath, artImage }) => {
      const source =
        asImageSource(imageData) ||
        asImageSource(imagePath) ||
        avatarSourceFor(artImage)

      localHydrated.value = { ...localHydrated.value, [artImage.id]: artImage }
      previewUrl.value = source || FALLBACK_AVATAR
      setStatus('Avatar uploaded and set.', 'success')
      emit('selected', artImage)
      activeTab.value = 'gallery'
    },
  })
}

// ── Gallery loading ────────────────────────────────────────────────────────
function findDefaultCollectionId(): number {
  const label = props.defaultCollectionLabel.trim().toLowerCase()
  const match = (collectionStore.collections ?? []).find(
    (c) => (c.label || '').trim().toLowerCase() === label,
  )
  return match?.id ?? -1
}

async function refreshGallery(force = true) {
  isLoadingGallery.value = true
  try {
    if (typeof collectionStore.fetchCollections === 'function') {
      await collectionStore.fetchCollections(force)
    }
    if (typeof artStore.fetchAllArtImages === 'function') {
      await artStore.fetchAllArtImages({ force })
    }
    // Land on the avatars collection if present, else All images.
    selectedCollectionId.value = findDefaultCollectionId()
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Could not load gallery.',
      'error',
    )
  } finally {
    isLoadingGallery.value = false
  }
}

function initPreview() {
  const current = userStore.user
  if (!current) return
  const stored = asImageSource(current.avatarImage)
  previewUrl.value = stored || FALLBACK_AVATAR
}

onMounted(async () => {
  initPreview()
  configureUploadTarget()
  await refreshGallery(false)
})

watch(
  () => userStore.user?.id,
  () => {
    configureUploadTarget()
    initPreview()
  },
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

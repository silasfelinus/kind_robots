<!-- /components/content/art/art-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p
            v-if="artStore.currentArt"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ selectedArtLabel }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredArt.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="grid grid-cols-1 gap-2 md:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]"
      >
        <select
          v-model="scope"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Filter art by scope"
        >
          <option value="visible">Visible</option>
          <option value="mine">Mine</option>
          <option value="public">Public</option>
          <option value="generated">Generated</option>
          <option value="collection">Collection</option>
          <option value="all">All loaded</option>
        </select>

        <select
          v-model="matureFilter"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Filter mature art"
        >
          <option value="allowed">Allowed</option>
          <option value="safe">Safe only</option>
          <option value="mature">Mature only</option>
        </select>

        <select
          v-model="serverFilter"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Filter art by server"
        >
          <option value="all">All servers</option>

          <option
            v-for="serverName in serverNames"
            :key="serverName"
            :value="serverName"
          >
            {{ serverName }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search prompts, designers, checkpoints..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search art"
        />

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading || artStore.loading"
          @click="refreshArt(true)"
        >
          <span
            v-if="isLoading || artStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          v-if="allowGenerate"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="openGenerator"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          Generate
        </button>

        <button
          v-if="allowUpload"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          @click="showUploadPanel = !showUploadPanel"
        >
          <Icon name="kind-icon:upload" class="h-4 w-4" />
          Upload
        </button>

        <button
          v-if="allowAddToCollection"
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!artStore.currentArt || !collectionStore.currentCollection"
          @click="addSelectedArtToCollection"
        >
          <Icon name="kind-icon:gallery" class="h-4 w-4" />
          Collect
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!artStore.currentArt"
          @click="clearSelectedArt"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowPageLoad"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading || artStore.loading"
          @click="loadNextPage"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          More
        </button>
      </div>
    </header>

    <section
      v-if="showUploadPanel"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">Upload Art Image</h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="showUploadPanel = false"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        class="file-input file-input-bordered w-full bg-base-200"
        :disabled="isUploading"
        @change="uploadImage"
      />

      <div
        v-if="uploadMessage"
        class="mt-3 rounded-2xl border p-3 text-sm"
        :class="
          uploadTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ uploadMessage }}
      </div>
    </section>

    <section
      v-if="showSelectedPanel && artStore.currentArt"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate text-sm font-bold text-base-content">
            Selected Art
          </h3>

          <p class="truncate text-xs text-base-content/60">
            {{ selectedArtLabel }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="clearSelectedArt"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <div
        class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(220px,320px)_minmax(0,1fr)]"
      >
        <art-card
          :art="artStore.currentArt"
          :art-image="artStore.currentArtImage"
          :selected="true"
          :show-actions="false"
          :show-prompt="false"
          :show-meta="false"
          :show-generation-meta="false"
          :show-select-button="false"
          :compact="true"
        />

        <div class="grid gap-3 text-sm">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <p class="text-xs font-bold uppercase text-base-content/45">
              Prompt
            </p>

            <p class="mt-1 whitespace-pre-wrap text-base-content/75">
              {{ artStore.currentArt.promptString || 'No prompt.' }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Checkpoint
              </p>

              <p class="mt-1 truncate text-base-content/75">
                {{ artStore.currentArt.checkpoint || 'n/a' }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Sampler
              </p>

              <p class="mt-1 truncate text-base-content/75">
                {{ artStore.currentArt.sampler || 'n/a' }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Server
              </p>

              <p class="mt-1 truncate text-base-content/75">
                {{ artStore.currentArt.serverName || 'n/a' }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Seed
              </p>

              <p class="mt-1 truncate text-base-content/75">
                {{ artStore.currentArt.seed ?? 'n/a' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || artStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="artStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ artStore.error }}
        </p>
      </div>

      <div
        v-else-if="filteredArt.length === 0"
        class="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No art found.</p>

          <p class="mt-1 text-sm">
            Either the gallery is empty, or the filters are wearing a fake
            mustache.
          </p>
        </div>

        <button
          v-if="allowGenerate"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="openGenerator"
        >
          Generate Art
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="artStore.currentArt?.id ?? ''"
          aria-label="Select art"
          @change="selectArtFromEvent"
        >
          <option value="">Choose art</option>

          <option v-for="art in filteredArt" :key="art.id" :value="art.id">
            {{ art.promptString?.slice(0, 90) || `Art ${art.id}` }}
          </option>
        </select>
      </div>

      <div v-else :class="layoutClass">
        <art-card
          v-for="art in limitedArt"
          :key="art.id"
          :art="art"
          :selected="artStore.currentArt?.id === art.id"
          :compact="isCompact"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-prompt="showPrompts"
          :show-negative-prompt="showNegativePrompts"
          :show-meta="showMeta"
          :show-generation-meta="showGenerationMeta"
          :show-select-button="showSelectButtons"
          :show-debug="showDebug"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          :allow-copy-prompt="allowCopyPrompt"
          :auto-load-image="autoLoadImages"
          @edit="startEditingArt"
          @delete="handleArtDeleted"
          @copied="handlePromptCopied"
        />
      </div>
    </section>

    <footer
      v-if="showFooter"
      class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs text-base-content/60 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        Showing
        <span class="font-bold text-base-content">
          {{ limitedArt.length }}
        </span>
        of
        <span class="font-bold text-base-content">
          {{ filteredArt.length }}
        </span>
        loaded art records.
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span> Page {{ artStore.currentPage }} </span>

        <span v-if="artStore.totalArtCount">
          Total {{ artStore.totalArtCount }}
        </span>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import { useRouter } from 'vue-router'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'
import type { DashboardKey } from '@/stores/helpers/dashboardHelper'

const artDashboardKey: DashboardKey = 'art'

type ArtGalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ArtScope =
  | 'visible'
  | 'mine'
  | 'public'
  | 'generated'
  | 'collection'
  | 'all'
type MatureFilter = 'allowed' | 'safe' | 'mature'

const props = withDefaults(
  defineProps<{
    variant?: ArtGalleryVariant
    title?: string
    subtitle?: string
    compact?: boolean
    showImages?: boolean
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showPrompts?: boolean
    showNegativePrompts?: boolean
    showMeta?: boolean
    showGenerationMeta?: boolean
    showSelectButtons?: boolean
    showDebug?: boolean
    showSelectedPanel?: boolean
    showFooter?: boolean
    allowGenerate?: boolean
    allowUpload?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    allowPageLoad?: boolean
    allowCopyPrompt?: boolean
    allowAddToCollection?: boolean
    autoLoad?: boolean
    autoLoadImages?: boolean
    pageSize?: number
    displayLimit?: number
  }>(),
  {
    variant: 'dashboard',
    title: 'Art Gallery',
    subtitle: 'Browse generated art and uploaded images.',
    compact: false,
    showImages: true,
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showPrompts: true,
    showNegativePrompts: false,
    showMeta: true,
    showGenerationMeta: false,
    showSelectButtons: false,
    showDebug: false,
    showSelectedPanel: false,
    showFooter: true,
    allowGenerate: true,
    allowUpload: true,
    allowEdit: true,
    allowDelete: true,
    allowRefresh: true,
    allowPageLoad: true,
    allowCopyPrompt: true,
    allowAddToCollection: true,
    autoLoad: true,
    autoLoadImages: true,
    pageSize: 100,
    displayLimit: 120,
  },
)

const router = useRouter()
const artStore = useArtStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const userStore = useUserStore()

const scope = ref<ArtScope>('visible')
const matureFilter = ref<MatureFilter>('allowed')
const serverFilter = ref('all')
const searchQuery = ref('')
const isLoading = ref(false)
const isUploading = ref(false)
const showUploadPanel = ref(false)
const uploadMessage = ref('')
const uploadTone = ref<'success' | 'error'>('success')

const isCompact = computed(() => {
  return (
    props.compact || props.variant === 'row' || props.variant === 'dropdown'
  )
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'art-row' : 'art-grid'
})

const showMature = computed(() => {
  return Boolean(userStore.showMature && matureFilter.value !== 'safe')
})

const collectionArt = computed<Art[]>(() => {
  return collectionStore.currentCollection?.art || []
})

const visibleArt = computed<Art[]>(() => {
  return artStore.art.filter((art) => {
    if (art.isMature && !showMature.value) return false

    return (
      Boolean(art.isPublic) ||
      art.userId === userStore.userId ||
      userStore.isAdmin
    )
  })
})

const baseArt = computed<Art[]>(() => {
  if (scope.value === 'mine') {
    return artStore.art.filter((art) => art.userId === userStore.userId)
  }

  if (scope.value === 'public') {
    return artStore.art.filter((art) => Boolean(art.isPublic))
  }

  if (scope.value === 'generated') {
    return artStore.generatedArt.length ? artStore.generatedArt : artStore.art
  }

  if (scope.value === 'collection') {
    return collectionArt.value
  }

  if (scope.value === 'all') {
    return artStore.art
  }

  return visibleArt.value
})

const serverNames = computed(() => {
  const names = new Set<string>()

  for (const art of artStore.art) {
    if (art.serverName) {
      names.add(art.serverName)
    }
  }

  return [...names].sort((a, b) => a.localeCompare(b))
})

const filteredArt = computed<Art[]>(() => {
  let artList = baseArt.value

  if (matureFilter.value === 'safe') {
    artList = artList.filter((art) => !art.isMature)
  }

  if (matureFilter.value === 'mature') {
    artList = artList.filter((art) => art.isMature)
  }

  if (serverFilter.value !== 'all') {
    artList = artList.filter((art) => art.serverName === serverFilter.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    artList = artList.filter((art) => {
      const haystack = [
        art.promptString,
        art.negativePrompt,
        art.designer,
        art.checkpoint,
        art.sampler,
        art.serverName,
        art.genres,
        String(art.id),
        String(art.seed),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return [...artList].sort((a, b) => {
    const bDate = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime()
    const aDate = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()

    return bDate - aDate
  })
})

const limitedArt = computed(() => {
  if (props.variant === 'row') {
    return filteredArt.value.slice(0, Math.min(props.displayLimit, 40))
  }

  return filteredArt.value.slice(0, props.displayLimit)
})

const selectedArtLabel = computed(() => {
  const prompt = artStore.currentArt?.promptString

  if (!prompt) return `Art #${artStore.currentArt?.id}`

  return prompt.length > 80 ? `${prompt.slice(0, 80)}...` : prompt
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshArt(false)
  }
})

async function refreshArt(force = false) {
  isLoading.value = true

  try {
    await artStore.initialize({
      force,
      fetchRemote: true,
      hydrateImages: false,
    })

    if (!artStore.art.length || force) {
      await artStore.fetchArtPage(1, props.pageSize, force)
    }
  } finally {
    isLoading.value = false
  }
}

async function loadNextPage() {
  const nextPage = artStore.currentPage + 1

  await artStore.fetchArtPage(nextPage, props.pageSize, true)
}

function selectArtFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedArt()
    return
  }

  void artStore.selectArt(id)
}

function clearSelectedArt() {
  artStore.deselectArt()
}

function openGenerator() {
  navStore.setDashboardTab(artDashboardKey, 'generate')
  void router.push('/art')
}

function startEditingArt(id: number) {
  void artStore.selectArt(id)
  navStore.setDashboardTab(artDashboardKey, 'edit')
}

function handleArtDeleted(id: number) {
  if (artStore.currentArt?.id === id) {
    artStore.deselectArt()
  }
}

function handlePromptCopied() {
  uploadTone.value = 'success'
  uploadMessage.value = 'Prompt copied.'
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    uploadTone.value = 'error'
    uploadMessage.value = 'Unsupported file type. Use PNG, JPEG, or WebP.'
    input.value = ''
    return
  }

  const formData = new FormData()
  formData.append('image', file)

  isUploading.value = true
  uploadMessage.value = ''

  try {
    const result = await artStore.uploadImage(formData)

    uploadTone.value = result.success ? 'success' : 'error'
    uploadMessage.value = result.message

    if (result.success) {
      showUploadPanel.value = false
    }
  } finally {
    isUploading.value = false
    input.value = ''
  }
}

async function addSelectedArtToCollection() {
  const art = artStore.currentArt
  const collection = collectionStore.currentCollection

  if (!art || !collection) return

  await collectionStore.addArtToCollection({
    artId: art.id,
    collectionId: collection.id,
    label: collection.label || undefined,
  })

  uploadTone.value = 'success'
  uploadMessage.value = `Added art #${art.id} to ${collection.label || 'collection'}.`
}
</script>

<style scoped>
.art-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}

.art-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.art-row > * {
  min-width: min(220px, 85vw);
  max-width: 340px;
}
</style>

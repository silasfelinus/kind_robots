<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <h1 class="text-xl font-black text-primary md:text-2xl">
          Selected Art
        </h1>

        <p class="truncate text-xs text-base-content/60 md:text-sm">
          Edit metadata, collections, tags, and remix options.
        </p>
      </div>

      <div class="flex shrink-0 flex-wrap gap-2">
        <button
          class="btn btn-xs btn-outline rounded-xl sm:btn-sm"
          type="button"
          @click="navStore.setDashboardTab('art', 'gallery')"
        >
          <Icon name="kind-icon:image" class="h-4 w-4" />
          Gallery
        </button>

        <button
          class="btn btn-xs btn-primary rounded-xl text-white sm:btn-sm"
          type="button"
          :disabled="!currentArt"
          @click="startRemix"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          Remix
        </button>
      </div>
    </header>

    <div
      v-if="statusMessage"
      class="shrink-0 rounded-2xl border px-3 py-2 text-xs font-semibold sm:text-sm"
      :class="statusClass"
    >
      {{ statusMessage }}
    </div>

    <div
      v-if="!currentArt"
      class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/55"
    >
      <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

      <p class="mt-2 text-lg font-bold">No art selected.</p>

      <p class="mt-1 max-w-xl text-sm">
        Select something from the gallery first. The pixels are currently
        standing around holding clipboards.
      </p>

      <button
        class="btn btn-primary mt-4 rounded-2xl text-white"
        type="button"
        @click="navStore.setDashboardTab('art', 'gallery')"
      >
        Open Gallery
      </button>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]"
    >
      <aside class="flex min-h-0 flex-col gap-3 overflow-auto">
        <art-card
          :art="currentArt"
          :art-image="currentArtImage"
          :selected="true"
          :show-actions="true"
          :show-prompt="false"
          :show-meta="true"
          :show-generation-meta="true"
          :show-select-button="false"
        />

        <details
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
          open
        >
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-2"
          >
            <span>
              <span class="block text-sm font-black text-base-content">
                Model Source
              </span>

              <span class="block truncate text-xs text-base-content/55">
                {{ currentArt.checkpoint || checkpointResourceLabel }}
              </span>
            </span>

            <Icon name="kind-icon:brain" class="h-5 w-5 text-primary" />
          </summary>

          <div class="mt-3 grid gap-2 text-xs">
            <div class="rounded-xl border border-base-300 bg-base-200 p-2">
              <p class="font-bold uppercase text-base-content/45">
                Checkpoint Resource
              </p>

              <p class="mt-1 break-all font-semibold">
                {{ checkpointResourceLabel }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div class="rounded-xl border border-base-300 bg-base-200 p-2">
                <p class="font-bold uppercase text-base-content/45">Sampler</p>

                <p class="mt-1 truncate font-semibold">
                  {{ currentArt.sampler || 'n/a' }}
                </p>
              </div>

              <div class="rounded-xl border border-base-300 bg-base-200 p-2">
                <p class="font-bold uppercase text-base-content/45">Seed</p>

                <p class="mt-1 truncate font-mono">
                  {{ currentArt.seed ?? 'n/a' }}
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-base-300 bg-base-200 p-2">
              <p class="font-bold uppercase text-base-content/45">Server</p>

              <p class="mt-1 truncate font-semibold">
                {{ currentArt.serverName || 'n/a' }}
              </p>
            </div>
          </div>
        </details>
      </aside>

      <main
        class="min-h-0 overflow-auto rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="grid gap-3 p-3">
          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <h2 class="truncate text-base font-black text-base-content">
                  Quick Edit
                </h2>

                <p class="truncate text-xs text-base-content/55">
                  Art record only. Image bytes remain unbothered.
                </p>
              </div>

              <button
                class="btn btn-primary btn-sm rounded-xl text-white"
                type="button"
                :disabled="isSaving || !hasDirtyFields"
                @click="saveArtEdits"
              >
                <span
                  v-if="isSaving"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:save" class="h-4 w-4" />
                Save
              </button>
            </div>

            <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text text-xs font-bold">Path</span>
                </span>

                <input
                  v-model="editForm.path"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                  placeholder="Art path"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text text-xs font-bold">Designer</span>
                </span>

                <input
                  v-model="editForm.designer"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                  placeholder="Kind Designer"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text text-xs font-bold">Sampler</span>
                </span>

                <input
                  v-model="editForm.sampler"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text text-xs font-bold">Checkpoint</span>
                </span>

                <input
                  v-model="editForm.checkpoint"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text text-xs font-bold">Steps</span>
                </span>

                <input
                  v-model.number="editForm.steps"
                  type="number"
                  min="1"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1">
                  <span class="label-text text-xs font-bold">Seed</span>
                </span>

                <input
                  v-model.number="editForm.seed"
                  type="number"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <span class="label-text text-xs font-bold">Public</span>

                <input
                  v-model="editForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-success toggle-sm"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <span class="label-text text-xs font-bold">Mature</span>

                <input
                  v-model="editForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning toggle-sm"
                />
              </label>
            </div>

            <details class="mt-3 rounded-xl border border-base-300 bg-base-100">
              <summary
                class="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-sm font-bold"
              >
                <span>Prompt Text</span>

                <span class="text-xs font-normal text-base-content/50">
                  {{ editForm.promptString.length }} chars
                </span>
              </summary>

              <div class="grid gap-2 p-3">
                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text text-xs font-bold">Prompt</span>
                  </span>

                  <textarea
                    v-model="editForm.promptString"
                    class="textarea textarea-bordered min-h-24 resize-none rounded-xl bg-base-200 text-xs leading-relaxed"
                    placeholder="Prompt..."
                  />
                </label>

                <label class="form-control">
                  <span class="label py-1">
                    <span class="label-text text-xs font-bold">
                      Negative Prompt
                    </span>
                  </span>

                  <textarea
                    v-model="editForm.negativePrompt"
                    class="textarea textarea-bordered min-h-20 resize-none rounded-xl bg-base-200 text-xs leading-relaxed"
                    placeholder="Negative prompt..."
                  />
                </label>
              </div>
            </details>
          </section>

          <section class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div
              class="relative rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-black text-base-content">
                    Collections
                  </h2>

                  <p class="truncate text-xs text-base-content/55">
                    {{ selectedCollectionSummary }}
                  </p>
                </div>

                <Icon name="kind-icon:folder" class="h-5 w-5 text-secondary" />
              </div>

              <button
                class="btn btn-sm w-full justify-between rounded-xl"
                :class="
                  artCollectionIds.length ? 'btn-secondary' : 'btn-outline'
                "
                type="button"
                :disabled="isCollectionSaving"
                @click="isCollectionMenuOpen = !isCollectionMenuOpen"
              >
                <span class="min-w-0 truncate">
                  {{ collectionButtonLabel }}
                </span>

                <Icon
                  :name="
                    isCollectionMenuOpen
                      ? 'kind-icon:chevron-up'
                      : 'kind-icon:chevron-down'
                  "
                  class="h-4 w-4"
                />
              </button>

              <div
                v-if="isCollectionMenuOpen"
                class="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl"
              >
                <div class="mb-2 flex items-center justify-between gap-2">
                  <p class="text-sm font-black text-base-content">
                    Collection Membership
                  </p>

                  <button
                    class="btn btn-ghost btn-xs rounded-xl"
                    type="button"
                    @click="isCollectionMenuOpen = false"
                  >
                    <Icon name="kind-icon:x" class="h-4 w-4" />
                  </button>
                </div>

                <input
                  v-model="collectionSearch"
                  type="search"
                  class="input input-bordered input-sm mb-2 w-full rounded-xl bg-base-200"
                  placeholder="Search collections..."
                />

                <add-collection
                  class="mb-2"
                  :compact="true"
                  :show-flags="false"
                  :disabled="isCollectionSaving"
                  @created="handleCreatedCollectionForCurrentArt"
                  @selected="handleCreatedCollectionForCurrentArt"
                />

                <div
                  v-if="visibleCollectionOptions.length === 0"
                  class="rounded-xl border border-dashed border-base-300 bg-base-200 p-3 text-center text-xs text-base-content/55"
                >
                  No collections match that search.
                </div>

                <div v-else class="max-h-64 overflow-auto pr-1">
                  <label
                    v-for="collection in visibleCollectionOptions"
                    :key="collection.id"
                    class="mb-1 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-200 px-3 py-2 transition hover:bg-base-300"
                  >
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-semibold">
                        {{ getCollectionLabel(collection) }}
                      </span>

                      <span class="block truncate text-xs text-base-content/50">
                        {{ getCollectionMeta(collection) }}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      class="toggle toggle-secondary toggle-sm"
                      :checked="artCollectionIds.includes(collection.id)"
                      :disabled="isCollectionSaving"
                      @change="toggleCollection(collection.id)"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-black text-base-content">
                    Tags
                  </h2>

                  <p class="truncate text-xs text-base-content/55">
                    Comma-separated search helpers.
                  </p>
                </div>

                <Icon name="kind-icon:tag" class="h-5 w-5 text-accent" />
              </div>

              <textarea
                v-model="tagText"
                class="textarea textarea-bordered min-h-20 resize-none rounded-xl bg-base-100 text-xs"
                placeholder="portrait, robot, butterfly"
              />

              <button
                class="btn btn-accent btn-sm mt-2 w-full rounded-xl"
                type="button"
                :disabled="isSavingTags"
                @click="saveTags"
              >
                <span
                  v-if="isSavingTags"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:save" class="h-4 w-4" />
                Save Tags
              </button>
            </div>

            <div class="rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-black text-primary">
                    Remix
                  </h2>

                  <p class="truncate text-xs text-base-content/60">
                    Send back to generator.
                  </p>
                </div>

                <Icon name="kind-icon:sparkles" class="h-5 w-5 text-primary" />
              </div>

              <textarea
                v-model="remixPrompt"
                class="textarea textarea-bordered min-h-20 resize-none rounded-xl bg-base-100 text-xs leading-relaxed"
                placeholder="Make it warmer, add glass wings, preserve the pose..."
              />

              <button
                class="btn btn-primary btn-sm mt-2 w-full rounded-xl text-white"
                type="button"
                @click="startRemix"
              >
                <Icon name="kind-icon:sparkles" class="h-4 w-4" />
                Send to Generator
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Art, ArtImage, Resource } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { useResourceStore } from '@/stores/resourceStore'

type CollectionLike = {
  id: number
  label?: string | null
  description?: string | null
  isPublic?: boolean | null
  isMature?: boolean | null
  art?: Art[]
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
}

type ArtWithTags = Art & {
  tags?: {
    label?: string | null
    name?: string | null
  }[]
}

type ResourceStoreShape = {
  resources?: Resource[]
  initialize?: (options?: {
    force?: boolean
    fetchRemote?: boolean
  }) => Promise<unknown>
  getResourceById?: (id: number) => Resource | null | undefined
  fetchResourceById?: (id: number) => Promise<Resource | null | undefined>
}

defineProps<{
  compact?: boolean
}>()

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const resourceStore = useResourceStore() as unknown as ResourceStoreShape
const isCollectionMenuOpen = ref(false)
const collectionSearch = ref('')

const isSaving = ref(false)
const isSavingTags = ref(false)
const isCollectionSaving = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const tagText = ref('')
const remixPrompt = ref('')
const checkpointResource = ref<Resource | null>(null)

const editForm = reactive({
  path: '',
  designer: '',
  promptString: '',
  negativePrompt: '',
  checkpoint: '',
  sampler: '',
  steps: 25 as number | null,
  seed: null as number | null,
  genres: '',
  isPublic: true,
  isMature: false,
})

const currentArt = computed<Art | null>(() => artStore.currentArt)

const currentArtImage = computed<ArtImage | null>(() => {
  return artStore.currentArtImage
})

const selectedCollectionLabels = computed(() => {
  return collectionOptions.value
    .filter((collection) => artCollectionIds.value.includes(collection.id))
    .map((collection) => getCollectionLabel(collection))
})

function getCollectionMeta(collection: CollectionLike): string {
  const artCount = collection.art?.length ?? 0
  const imageCount =
    collection.artImages?.length ?? collection.ArtImages?.length ?? 0

  const total = artCount + imageCount
  const visibility = collection.isPublic ? 'Public' : 'Private'
  const mature = collection.isMature ? 'Mature' : 'Safe'

  return `${total} item${total === 1 ? '' : 's'} · ${visibility} · ${mature}`
}

async function handleCreatedCollectionForCurrentArt(
  collection: CollectionLike,
) {
  if (!currentArt.value) return

  isCollectionSaving.value = true

  try {
    await collectionStore.addArtToCollection({
      artId: currentArt.value.id,
      collectionId: collection.id,
    })

    await collectionStore.fetchCollections?.(true)

    collectionSearch.value = ''
    setStatus('Collection created and art added.')
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : 'Collection created, but failed to add art.',
      'error',
    )
  } finally {
    isCollectionSaving.value = false
  }
}

const selectedCollectionSummary = computed(() => {
  const count = artCollectionIds.value.length

  if (count === 0) return 'Not in any collection.'
  if (count === 1) return selectedCollectionLabels.value[0] || '1 collection'

  return `${count} collections selected.`
})

const collectionButtonLabel = computed(() => {
  if (!selectedCollectionLabels.value.length) return 'Choose collections'
  if (selectedCollectionLabels.value.length === 1) {
    return selectedCollectionLabels.value[0]
  }

  return `${selectedCollectionLabels.value.length} collections`
})

const visibleCollectionOptions = computed(() => {
  const query = collectionSearch.value.trim().toLowerCase()

  if (!query) return collectionOptions.value

  return collectionOptions.value.filter((collection) => {
    return getCollectionLabel(collection).toLowerCase().includes(query)
  })
})

const collectionOptions = computed<CollectionLike[]>(() => {
  return [...((collectionStore.collections || []) as CollectionLike[])].sort(
    (a, b) => getCollectionLabel(a).localeCompare(getCollectionLabel(b)),
  )
})

const artCollectionIds = computed(() => {
  if (!currentArt.value) return []

  return collectionOptions.value
    .filter((collection) => {
      return collection.art?.some((entry) => entry.id === currentArt.value?.id)
    })
    .map((collection) => collection.id)
})

const checkpointResourceLabel = computed(() => {
  if (checkpointResource.value) {
    return (
      checkpointResource.value.customLabel ||
      checkpointResource.value.name ||
      `Resource #${checkpointResource.value.id}`
    )
  }

  if (currentArt.value?.checkpointResourceId) {
    return `Resource #${currentArt.value.checkpointResourceId}`
  }

  return 'No checkpoint resource linked'
})

const statusClass = computed(() => {
  if (statusTone.value === 'error') {
    return 'border-error/40 bg-error/10 text-error'
  }

  return 'border-success/40 bg-success/10 text-success'
})

const hasDirtyFields = computed(() => {
  if (!currentArt.value) return false

  return (
    JSON.stringify(buildEditPayload()) !==
    JSON.stringify(buildOriginalPayload())
  )
})

watch(
  () => currentArt.value?.id,
  async () => {
    hydrateEditForm()
    hydrateTags()
    await hydrateCheckpointResource()
  },
  { immediate: true },
)

function getCollectionLabel(collection: CollectionLike): string {
  return collection.label || `Collection ${collection.id}`
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function hydrateEditForm() {
  const art = currentArt.value

  if (!art) return

  editForm.path = art.path || ''
  editForm.designer = art.designer || ''
  editForm.promptString = art.promptString || ''
  editForm.negativePrompt = art.negativePrompt || ''
  editForm.checkpoint = art.checkpoint || ''
  editForm.sampler = art.sampler || ''
  editForm.steps = art.steps ?? 25
  editForm.seed = art.seed ?? null
  editForm.genres = art.genres || ''
  editForm.isPublic = Boolean(art.isPublic)
  editForm.isMature = Boolean(art.isMature)
}

function hydrateTags() {
  const art = currentArt.value as ArtWithTags | null

  if (!art?.tags?.length) {
    tagText.value = ''
    return
  }

  tagText.value = art.tags
    .map((tag) => tag.label || tag.name || '')
    .filter(Boolean)
    .join(', ')
}

async function hydrateCheckpointResource() {
  checkpointResource.value = null

  const resourceId = currentArt.value?.checkpointResourceId

  if (!resourceId) return

  const localResource =
    resourceStore.getResourceById?.(resourceId) ||
    resourceStore.resources?.find((resource) => resource.id === resourceId)

  if (localResource) {
    checkpointResource.value = localResource
    return
  }

  const fetchedResource = await resourceStore.fetchResourceById?.(resourceId)

  if (fetchedResource) {
    checkpointResource.value = fetchedResource
  }
}

function buildOriginalPayload() {
  const art = currentArt.value

  return {
    path: art?.path || '',
    designer: art?.designer || '',
    promptString: art?.promptString || '',
    negativePrompt: art?.negativePrompt || '',
    checkpoint: art?.checkpoint || '',
    sampler: art?.sampler || '',
    steps: art?.steps ?? 25,
    seed: art?.seed ?? null,
    genres: art?.genres || '',
    isPublic: Boolean(art?.isPublic),
    isMature: Boolean(art?.isMature),
  }
}

function buildEditPayload() {
  return {
    path: editForm.path.trim(),
    designer: editForm.designer.trim(),
    promptString: editForm.promptString.trim(),
    negativePrompt: editForm.negativePrompt.trim(),
    checkpoint: editForm.checkpoint.trim(),
    sampler: editForm.sampler.trim(),
    steps: Number.isFinite(editForm.steps) ? Number(editForm.steps) : null,
    seed: Number.isFinite(editForm.seed) ? Number(editForm.seed) : null,
    genres: editForm.genres.trim(),
    isPublic: editForm.isPublic,
    isMature: editForm.isMature,
  }
}

function parseTags(): string[] {
  return tagText.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
}

async function saveArtEdits() {
  if (!currentArt.value) return

  isSaving.value = true

  try {
    const response = await artStore.updateArt(
      currentArt.value.id,
      buildEditPayload(),
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to update art.')
    }

    setStatus('Art data updated.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to update art.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function saveTags() {
  if (!currentArt.value) return

  isSavingTags.value = true

  try {
    const response = await artStore.updateArtTags(
      currentArt.value.id,
      parseTags(),
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to update tags.')
    }

    setStatus('Tags updated.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to update tags.',
      'error',
    )
  } finally {
    isSavingTags.value = false
  }
}

async function toggleCollection(collectionId: number) {
  if (!currentArt.value) return

  isCollectionSaving.value = true

  try {
    const artId = currentArt.value.id
    const alreadySelected = artCollectionIds.value.includes(collectionId)

    if (alreadySelected) {
      await collectionStore.removeArtFromCollection(artId, collectionId)
    } else {
      await collectionStore.addArtToCollection({
        artId,
        collectionId,
      })
    }

    await collectionStore.fetchCollections?.(true)

    setStatus(
      alreadySelected ? 'Removed from collection.' : 'Added to collection.',
    )
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to update collection.',
      'error',
    )
  } finally {
    isCollectionSaving.value = false
  }
}

function startRemix() {
  const art = currentArt.value

  if (!art) return

  const promptParts = [art.promptString, remixPrompt.value.trim()].filter(
    Boolean,
  )

  artStore.setArtForm({
    promptString: promptParts.join(', '),
    negativePrompt: art.negativePrompt || '',
    checkpoint: checkpointResource.value?.name || art.checkpoint || '',
    sampler: art.sampler || '',
    steps: art.steps ?? 25,
    seed: -1,
    designer: art.designer || '',
    isPublic: art.isPublic ?? true,
    isMature: art.isMature ?? false,
    serverId: art.serverId ?? null,
    serverName: art.serverName ?? null,
    sourceImageId: currentArtImage.value?.id || art.artImageId || null,
  })

  navStore.setDashboardTab('art', 'generate')
}

onMounted(async () => {
  await Promise.all([
    collectionStore.fetchCollections?.(),
    resourceStore.initialize?.({
      fetchRemote: true,
    }),
  ])

  hydrateEditForm()
  hydrateTags()
  await hydrateCheckpointResource()
})
</script>

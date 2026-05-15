<!-- /components/art/art-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 md:flex-row md:items-start md:justify-between"
    >
      <div class="min-w-0">
        <h1 class="text-2xl font-black text-primary md:text-3xl">
          Selected Art
        </h1>

        <p class="mt-1 text-sm text-base-content/65 md:text-base">
          Inspect, edit, collect, tag, and remix the current art record.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-sm btn-outline rounded-xl"
          type="button"
          @click="navStore.setDashboardTab('art', 'gallery')"
        >
          <Icon name="kind-icon:image" class="h-4 w-4" />
          Gallery
        </button>

        <button
          class="btn btn-sm btn-primary rounded-xl text-white"
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
      class="rounded-2xl border p-3 text-sm font-semibold"
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
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]"
    >
      <aside class="flex min-h-0 flex-col gap-4 overflow-auto">
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

        <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold text-base-content">Model Source</h2>

              <p class="text-sm text-base-content/60">
                Resolved from the art record, not stuffed into fetch routes.
              </p>
            </div>

            <Icon name="kind-icon:brain" class="h-6 w-6 text-primary" />
          </div>

          <div class="grid gap-3 text-sm">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Checkpoint Resource
              </p>

              <p class="mt-1 break-all font-semibold">
                {{ checkpointResourceLabel }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Checkpoint File
              </p>

              <p class="mt-1 break-all font-mono text-xs">
                {{ currentArt.checkpoint || 'n/a' }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase text-base-content/45">
                  Sampler
                </p>

                <p class="mt-1 font-semibold">
                  {{ currentArt.sampler || 'n/a' }}
                </p>
              </div>

              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase text-base-content/45">
                  Seed
                </p>

                <p class="mt-1 font-mono text-xs">
                  {{ currentArt.seed ?? 'n/a' }}
                </p>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <p class="text-xs font-bold uppercase text-base-content/45">
                Server
              </p>

              <p class="mt-1 break-all font-semibold">
                {{ currentArt.serverName || 'n/a' }}
              </p>
            </div>
          </div>
        </section>
      </aside>

      <main
        class="min-h-0 overflow-auto rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="grid gap-4 p-4">
          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div
              class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
            >
              <div>
                <h2 class="text-xl font-black text-base-content">
                  Edit Art Data
                </h2>

                <p class="text-sm text-base-content/60">
                  This edits the Art record only. Image bytes stay blissfully
                  unbothered.
                </p>
              </div>

              <button
                class="btn btn-primary rounded-2xl text-white"
                type="button"
                :disabled="isSaving || !hasDirtyFields"
                @click="saveArtEdits"
              >
                <span
                  v-if="isSaving"
                  class="loading loading-spinner loading-sm"
                />
                <Icon v-else name="kind-icon:save" class="h-5 w-5" />
                Save Changes
              </button>
            </div>

            <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Path</span>
                </span>

                <input
                  v-model="editForm.path"
                  type="text"
                  class="input input-bordered rounded-2xl bg-base-100"
                  placeholder="Art path or display key"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Designer</span>
                </span>

                <input
                  v-model="editForm.designer"
                  type="text"
                  class="input input-bordered rounded-2xl bg-base-100"
                  placeholder="Kind Designer"
                />
              </label>
            </div>

            <label class="form-control mt-4">
              <span class="label">
                <span class="label-text font-bold">Prompt</span>
                <span class="label-text-alt text-base-content/50">
                  {{ editForm.promptString.length }} chars
                </span>
              </span>

              <textarea
                v-model="editForm.promptString"
                class="textarea textarea-bordered min-h-40 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
                placeholder="Prompt..."
              />
            </label>

            <label class="form-control mt-4">
              <span class="label">
                <span class="label-text font-bold">Negative Prompt</span>
              </span>

              <textarea
                v-model="editForm.negativePrompt"
                class="textarea textarea-bordered min-h-28 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
                placeholder="Negative prompt..."
              />
            </label>

            <div
              class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Steps</span>
                </span>

                <input
                  v-model.number="editForm.steps"
                  type="number"
                  min="1"
                  class="input input-bordered rounded-2xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Seed</span>
                </span>

                <input
                  v-model.number="editForm.seed"
                  type="number"
                  class="input input-bordered rounded-2xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Sampler</span>
                </span>

                <input
                  v-model="editForm.sampler"
                  type="text"
                  class="input input-bordered rounded-2xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Checkpoint</span>
                </span>

                <input
                  v-model="editForm.checkpoint"
                  type="text"
                  class="input input-bordered rounded-2xl bg-base-100"
                />
              </label>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Public</span>

                <input
                  v-model="editForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-success"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Mature</span>

                <input
                  v-model="editForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning"
                />
              </label>
            </div>
          </section>

          <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 class="text-xl font-black text-base-content">
                    Collections
                  </h2>

                  <p class="text-sm text-base-content/60">
                    Add or remove this piece from collections.
                  </p>
                </div>

                <Icon name="kind-icon:folder" class="h-6 w-6 text-secondary" />
              </div>

              <div class="grid gap-2">
                <button
                  v-for="collection in collectionOptions"
                  :key="collection.id"
                  class="btn justify-between rounded-2xl"
                  :class="
                    artCollectionIds.includes(collection.id)
                      ? 'btn-secondary'
                      : 'btn-outline'
                  "
                  type="button"
                  :disabled="isCollectionSaving"
                  @click="toggleCollection(collection.id)"
                >
                  <span class="truncate">{{
                    getCollectionLabel(collection)
                  }}</span>

                  <Icon
                    :name="
                      artCollectionIds.includes(collection.id)
                        ? 'kind-icon:check'
                        : 'kind-icon:plus'
                    "
                    class="h-5 w-5"
                  />
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 class="text-xl font-black text-base-content">Tags</h2>

                  <p class="text-sm text-base-content/60">
                    Comma-separated tags for search, filtering, and tiny curator
                    goblin joy.
                  </p>
                </div>

                <Icon name="kind-icon:tag" class="h-6 w-6 text-accent" />
              </div>

              <textarea
                v-model="tagText"
                class="textarea textarea-bordered min-h-32 resize-none rounded-2xl bg-base-100 text-sm"
                placeholder="portrait, robot, butterfly, suspiciously dramatic lighting"
              />

              <button
                class="btn btn-accent mt-3 w-full rounded-2xl"
                type="button"
                :disabled="isSavingTags"
                @click="saveTags"
              >
                <span
                  v-if="isSavingTags"
                  class="loading loading-spinner loading-sm"
                />
                <Icon v-else name="kind-icon:save" class="h-5 w-5" />
                Save Tags
              </button>
            </div>
          </section>

          <section
            class="rounded-2xl border border-primary/30 bg-primary/10 p-4"
          >
            <div
              class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between"
            >
              <div>
                <h2 class="text-xl font-black text-primary">Remix</h2>

                <p class="text-sm text-base-content/70">
                  Send this piece back to the generator with the current model
                  metadata and an edit request.
                </p>
              </div>

              <button
                class="btn btn-primary rounded-2xl text-white"
                type="button"
                @click="startRemix"
              >
                <Icon name="kind-icon:sparkles" class="h-5 w-5" />
                Send to Generator
              </button>
            </div>

            <textarea
              v-model="remixPrompt"
              class="textarea textarea-bordered min-h-28 resize-none rounded-2xl bg-base-100 text-sm leading-relaxed"
              placeholder="Make it warmer, add glass wings, preserve the pose, remove the cursed elbow situation..."
            />
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
  art?: Art[]
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

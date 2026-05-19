<!-- /components/content/art/art-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <h1 class="text-xl font-black text-primary md:text-2xl">
          Selected Image
        </h1>
        <p class="truncate text-xs text-base-content/60 md:text-sm">
          Edit metadata, collections, pitches, and remix options.
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
          v-if="currentArtImage"
          class="btn btn-xs btn-ghost rounded-xl sm:btn-sm"
          type="button"
          @click="deselectAndReturn"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Deselect
        </button>

        <button
          class="btn btn-xs btn-primary rounded-xl text-white sm:btn-sm"
          type="button"
          :disabled="!currentArtImage"
          @click="startRemix"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          Remix
        </button>

        <!-- Delete button — arms on first click, fires on second -->
        <template v-if="currentArtImage && canDeleteCurrentImage">
          <button
            v-if="!deleteArmed"
            class="btn btn-xs btn-ghost rounded-xl border border-error/30 text-error sm:btn-sm hover:btn-error hover:text-error-content"
            type="button"
            title="Delete this image"
            @click="deleteArmed = true"
          >
            <Icon name="kind-icon:trash" class="h-4 w-4" />
            <span class="hidden sm:inline">Delete</span>
          </button>

          <button
            v-else
            class="btn btn-xs btn-error rounded-xl text-error-content sm:btn-sm"
            type="button"
            :disabled="isDeleting"
            @click="confirmDelete"
            @blur="deleteArmed = false"
          >
            <span
              v-if="isDeleting"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:trash" class="h-4 w-4" />
            Confirm?
          </button>
        </template>
      </div>
    </header>

    <div
      v-if="statusMessage"
      class="shrink-0 rounded-2xl border px-3 py-2 text-xs font-semibold sm:text-sm"
      :class="statusClass"
    >
      {{ statusMessage }}
    </div>

    <!-- Empty state -->
    <div
      v-if="!currentArtImage"
      class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/55"
    >
      <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />
      <p class="mt-2 text-lg font-bold">No image selected.</p>
      <p class="mt-1 max-w-xl text-sm">
        Pick something from the gallery. The pixels are standing around holding
        clipboards.
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
      <!-- Aside: image preview -->
      <aside class="flex min-h-0 flex-col gap-3 overflow-auto">
        <image-card
          :art-image="currentArtImage"
          :selected="true"
          :show-actions="false"
          :show-prompt="true"
          :show-meta="true"
          :show-generation-meta="true"
          :show-select-button="false"
          :auto-load-image="true"
        />

        <details
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
          open
        >
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-2"
          >
            <span>
              <span class="block text-sm font-black text-base-content"
                >Generation Source</span
              >
              <span class="block truncate text-xs text-base-content/55">
                {{ currentArtImage.checkpoint || 'No checkpoint recorded' }}
              </span>
            </span>
            <Icon name="kind-icon:brain" class="h-5 w-5 text-primary" />
          </summary>

          <div class="mt-3 grid gap-2 text-xs">
            <div class="rounded-xl border border-base-300 bg-base-200 p-2">
              <p class="font-bold uppercase text-base-content/45">Checkpoint</p>
              <p class="mt-1 break-all font-semibold">
                {{ currentArtImage.checkpoint || 'n/a' }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div class="rounded-xl border border-base-300 bg-base-200 p-2">
                <p class="font-bold uppercase text-base-content/45">Sampler</p>
                <p class="mt-1 truncate font-semibold">
                  {{ currentArtImage.sampler || 'n/a' }}
                </p>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 p-2">
                <p class="font-bold uppercase text-base-content/45">Seed</p>
                <p class="mt-1 truncate font-mono">
                  {{ currentArtImage.seed ?? 'n/a' }}
                </p>
              </div>
            </div>

            <div class="rounded-xl border border-base-300 bg-base-200 p-2">
              <p class="font-bold uppercase text-base-content/45">Server</p>
              <p class="mt-1 truncate font-semibold">
                {{ currentArtImage.serverName || 'n/a' }}
              </p>
            </div>
          </div>
        </details>
      </aside>

      <!-- Main: editing panel -->
      <main
        class="min-h-0 overflow-auto rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="grid gap-3 p-3">
          <!-- Quick Edit -->
          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <h2 class="truncate text-base font-black text-base-content">
                  Quick Edit
                </h2>
                <p class="truncate text-xs text-base-content/55">
                  ArtImage metadata. Image bytes remain unbothered.
                </p>
              </div>

              <button
                class="btn btn-primary btn-sm rounded-xl text-white"
                type="button"
                :disabled="isSaving || !hasDirtyFields"
                @click="saveImageEdits"
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
                <span class="label py-1"
                  ><span class="label-text text-xs font-bold"
                    >Designer</span
                  ></span
                >
                <input
                  v-model="editForm.designer"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                  placeholder="Kind Designer"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text text-xs font-bold"
                    >Sampler</span
                  ></span
                >
                <input
                  v-model="editForm.sampler"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text text-xs font-bold"
                    >Checkpoint</span
                  ></span
                >
                <input
                  v-model="editForm.checkpoint"
                  type="text"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text text-xs font-bold">Steps</span></span
                >
                <input
                  v-model.number="editForm.steps"
                  type="number"
                  min="1"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text text-xs font-bold">Seed</span></span
                >
                <input
                  v-model.number="editForm.seed"
                  type="number"
                  class="input input-bordered input-sm rounded-xl bg-base-100"
                />
              </label>

              <label class="form-control">
                <span class="label py-1"
                  ><span class="label-text text-xs font-bold">CFG</span></span
                >
                <input
                  v-model.number="editForm.cfg"
                  type="number"
                  step="0.5"
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
                <span class="text-xs font-normal text-base-content/50"
                  >{{ editForm.promptString.length }} chars</span
                >
              </summary>
              <div class="grid gap-2 p-3">
                <label class="form-control">
                  <span class="label py-1"
                    ><span class="label-text text-xs font-bold"
                      >Prompt</span
                    ></span
                  >
                  <textarea
                    v-model="editForm.promptString"
                    class="textarea textarea-bordered min-h-24 resize-none rounded-xl bg-base-200 text-xs leading-relaxed"
                    placeholder="Prompt..."
                  />
                </label>
                <label class="form-control">
                  <span class="label py-1"
                    ><span class="label-text text-xs font-bold"
                      >Negative Prompt</span
                    ></span
                  >
                  <textarea
                    v-model="editForm.negativePrompt"
                    class="textarea textarea-bordered min-h-20 resize-none rounded-xl bg-base-200 text-xs leading-relaxed"
                    placeholder="Negative prompt..."
                  />
                </label>
              </div>
            </details>
          </section>

          <!-- Collections / Tags / Remix -->
          <section class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <!-- Collections -->
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
                  imageCollectionIds.length ? 'btn-secondary' : 'btn-outline'
                "
                type="button"
                :disabled="isCollectionSaving"
                @click="isCollectionMenuOpen = !isCollectionMenuOpen"
              >
                <span class="min-w-0 truncate">{{
                  collectionButtonLabel
                }}</span>
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
                  @created="handleCreatedCollection"
                  @selected="handleCreatedCollection"
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
                      <span class="block truncate text-sm font-semibold">{{
                        collection.label || `Collection ${collection.id}`
                      }}</span>
                      <span
                        class="block truncate text-xs text-base-content/50"
                        >{{ getCollectionMeta(collection) }}</span
                      >
                    </span>
                    <input
                      type="checkbox"
                      class="toggle toggle-secondary toggle-sm"
                      :checked="imageCollectionIds.includes(collection.id)"
                      :disabled="isCollectionSaving"
                      @change="toggleCollection(collection.id)"
                    />
                  </label>
                </div>
              </div>
            </div>

            <!-- Pitches -->
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-black text-base-content">
                    Pitches
                  </h2>
                  <p class="truncate text-xs text-base-content/55">
                    Comma-separated concept hooks.
                  </p>
                </div>
                <Icon name="kind-icon:lightbulb" class="h-5 w-5 text-accent" />
              </div>

              <textarea
                v-model="pitchText"
                class="textarea textarea-bordered min-h-20 resize-none rounded-xl bg-base-100 text-xs"
                placeholder="portrait, robot, butterfly"
              />

              <button
                class="btn btn-accent btn-sm mt-2 w-full rounded-xl"
                type="button"
                :disabled="isSavingPitches"
                @click="savePitches"
              >
                <span
                  v-if="isSavingPitches"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:save" class="h-4 w-4" />
                Save Pitches
              </button>
            </div>
            <!-- Remix -->
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
// /components/content/art/art-interact.vue
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { ArtImage } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type CollectionLike = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
}

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const userStore = useUserStore()

const isSaving = ref(false)
const isSavingPitches = ref(false)
const pitchText = ref('')
const isCollectionSaving = ref(false)
const isCollectionMenuOpen = ref(false)
const collectionSearch = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const remixPrompt = ref('')
const deleteArmed = ref(false)
const isDeleting = ref(false)

const editForm = reactive({
  designer: '',
  promptString: '',
  negativePrompt: '',
  checkpoint: '',
  sampler: '',
  steps: 25 as number | null,
  seed: null as number | null,
  cfg: 7 as number | null,
  genres: '',
  isPublic: true,
  isMature: false,
})

const currentArtImage = computed<ArtImage | null>(
  () => artStore.currentArtImage,
)

const canDeleteCurrentImage = computed(() => {
  if (!currentArtImage.value) return false
  return (
    userStore.isAdmin ||
    Number(currentArtImage.value.userId) ===
      Number(userStore.userId ?? userStore.user?.id)
  )
})

const collectionOptions = computed<CollectionLike[]>(() =>
  [...((collectionStore.collections || []) as CollectionLike[])].sort((a, b) =>
    (a.label || '').localeCompare(b.label || ''),
  ),
)

const visibleCollectionOptions = computed(() => {
  const query = collectionSearch.value.trim().toLowerCase()
  if (!query) return collectionOptions.value
  return collectionOptions.value.filter((c) =>
    (c.label || '').toLowerCase().includes(query),
  )
})

const imageCollectionIds = computed(() => {
  const imageId = currentArtImage.value?.id
  if (!imageId) return []
  return collectionOptions.value
    .filter((collection) => {
      const images = [
        ...(collection.artImages || []),
        ...(collection.ArtImages || []),
      ]
      return images.some((img) => img.id === imageId)
    })
    .map((c) => c.id)
})

const selectedCollectionLabels = computed(() =>
  collectionOptions.value
    .filter((c) => imageCollectionIds.value.includes(c.id))
    .map((c) => c.label || `Collection ${c.id}`),
)

const selectedCollectionSummary = computed(() => {
  const count = imageCollectionIds.value.length
  if (count === 0) return 'Not in any collection.'
  if (count === 1) return selectedCollectionLabels.value[0] || '1 collection'
  return `${count} collections`
})

const collectionButtonLabel = computed(() => {
  if (!selectedCollectionLabels.value.length) return 'Choose collections'
  if (selectedCollectionLabels.value.length === 1)
    return selectedCollectionLabels.value[0]
  return `${selectedCollectionLabels.value.length} collections`
})

const statusClass = computed(() =>
  statusTone.value === 'error'
    ? 'border-error/40 bg-error/10 text-error'
    : 'border-success/40 bg-success/10 text-success',
)

const hasDirtyFields = computed(() => {
  if (!currentArtImage.value) return false
  return (
    JSON.stringify(buildEditPayload()) !==
    JSON.stringify(buildOriginalPayload())
  )
})

watch(
  () => currentArtImage.value?.id,
  () => {
    hydrateEditForm()
    hydratePitches()
    isCollectionMenuOpen.value = false
    statusMessage.value = ''
    deleteArmed.value = false
  },
  { immediate: true },
)

onMounted(async () => {
  await collectionStore.fetchCollections?.()
  hydrateEditForm()
  hydratePitches()
})

function hydrateEditForm() {
  const image = currentArtImage.value
  if (!image) return
  editForm.designer = image.designer || ''
  editForm.promptString = image.promptString || ''
  editForm.negativePrompt = image.negativePrompt || ''
  editForm.checkpoint = image.checkpoint || ''
  editForm.sampler = image.sampler || ''
  editForm.steps = image.steps ?? 25
  editForm.seed = image.seed ?? null
  editForm.cfg = image.cfg ?? 7
  editForm.genres = image.genres || ''
  editForm.isPublic = Boolean(image.isPublic)
  editForm.isMature = Boolean(image.isMature)
}

async function savePitches() {
  if (!currentArtImage.value) return

  const pitchIds = pitchText.value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)

  if (!pitchIds.length && pitchText.value.trim()) {
    setStatus(
      'Use pitch IDs for now. Pitch label saving is not wired yet.',
      'error',
    )
    return
  }

  isSavingPitches.value = true

  try {
    const response = await artStore.updateArtImageConnections(
      currentArtImage.value.id,
      {
        pitchIds,
        clearPitches: true,
      },
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to update pitches.')
    }

    setStatus('Pitches updated.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to update pitches.',
      'error',
    )
  } finally {
    isSavingPitches.value = false
  }
}

function hydratePitches() {
  const image = currentArtImage.value as
    | (ArtImage & {
        Pitches?: { id: number; title?: string | null; pitch?: string | null }[]
        pitches?: { id: number; title?: string | null; pitch?: string | null }[]
      })
    | null

  const pitches = image?.Pitches ?? image?.pitches ?? []

  pitchText.value = pitches
    .map((pitch) => String(pitch.id))
    .filter(Boolean)
    .join(', ')
}

function buildOriginalPayload() {
  const image = currentArtImage.value
  return {
    designer: image?.designer || '',
    promptString: image?.promptString || '',
    negativePrompt: image?.negativePrompt || '',
    checkpoint: image?.checkpoint || '',
    sampler: image?.sampler || '',
    steps: image?.steps ?? 25,
    seed: image?.seed ?? null,
    cfg: image?.cfg ?? 7,
    genres: image?.genres || '',
    isPublic: Boolean(image?.isPublic),
    isMature: Boolean(image?.isMature),
  }
}

function buildEditPayload() {
  return {
    designer: editForm.designer.trim(),
    promptString: editForm.promptString.trim(),
    negativePrompt: editForm.negativePrompt.trim(),
    checkpoint: editForm.checkpoint.trim(),
    sampler: editForm.sampler.trim(),
    steps: Number.isFinite(editForm.steps) ? Number(editForm.steps) : null,
    seed: Number.isFinite(editForm.seed) ? Number(editForm.seed) : null,
    cfg: Number.isFinite(editForm.cfg) ? Number(editForm.cfg) : null,
    genres: editForm.genres.trim(),
    isPublic: editForm.isPublic,
    isMature: editForm.isMature,
  }
}

async function saveImageEdits() {
  if (!currentArtImage.value) return
  isSaving.value = true
  try {
    const response = await artStore.updateArtImage(
      currentArtImage.value.id,
      buildEditPayload(),
    )
    if (!response.success)
      throw new Error(response.message || 'Failed to update image.')
    setStatus('Image data updated.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to update image.',
      'error',
    )
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete() {
  if (!currentArtImage.value || !deleteArmed.value) return
  isDeleting.value = true
  try {
    const imageId = currentArtImage.value.id
    const deleted = await artStore.deleteArtImage(imageId)
    if (deleted) {
      artStore.deselectArtImage()
      navStore.setDashboardTab('art', 'gallery')
    } else {
      setStatus('Failed to delete image.', 'error')
      deleteArmed.value = false
    }
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to delete image.',
      'error',
    )
    deleteArmed.value = false
  } finally {
    isDeleting.value = false
  }
}

function getCollectionMeta(collection: CollectionLike): string {
  const imageCount =
    collection.artImages?.length ?? collection.ArtImages?.length ?? 0
  const visibility = collection.isPublic ? 'Public' : 'Private'
  const mature = collection.isMature ? 'Mature' : 'Safe'
  return `${imageCount} image${imageCount === 1 ? '' : 's'} · ${visibility} · ${mature}`
}

async function toggleCollection(collectionId: number) {
  if (!currentArtImage.value) return
  isCollectionSaving.value = true
  try {
    const imageId = currentArtImage.value.id
    const alreadyIn = imageCollectionIds.value.includes(collectionId)
    if (alreadyIn) {
      await artStore.updateArtImageConnections(imageId, {
        disconnectArtCollectionIds: [collectionId],
      })
    } else {
      await artStore.updateArtImageConnections(imageId, {
        artCollectionIds: [collectionId],
      })
    }
    await collectionStore.fetchCollections?.(true)
    setStatus(alreadyIn ? 'Removed from collection.' : 'Added to collection.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to update collection.',
      'error',
    )
  } finally {
    isCollectionSaving.value = false
  }
}

async function handleCreatedCollection(collection: CollectionLike) {
  if (!currentArtImage.value) return
  isCollectionSaving.value = true
  try {
    await artStore.updateArtImageConnections(currentArtImage.value.id, {
      artCollectionIds: [collection.id],
    })
    await collectionStore.fetchCollections?.(true)
    collectionSearch.value = ''
    setStatus('Collection created and image added.')
  } catch (error) {
    setStatus(
      error instanceof Error
        ? error.message
        : 'Collection created, but failed to add image.',
      'error',
    )
  } finally {
    isCollectionSaving.value = false
  }
}

function deselectAndReturn() {
  artStore.deselectArtImage()
  navStore.setDashboardTab('art', 'gallery')
}

function startRemix() {
  const image = currentArtImage.value
  if (!image) return
  const promptParts = [image.promptString, remixPrompt.value.trim()].filter(
    Boolean,
  )
  artStore.setArtForm({
    promptString: promptParts.join(', '),
    negativePrompt: image.negativePrompt || '',
    checkpoint: image.checkpoint || '',
    sampler: image.sampler || '',
    steps: image.steps ?? 25,
    cfg: image.cfg ?? 7,
    seed: -1,
    designer: image.designer || '',
    isPublic: image.isPublic ?? true,
    isMature: image.isMature ?? false,
    serverId: image.serverId ?? null,
    serverName: image.serverName ?? null,
    sourceImageId: image.id,
  })
  navStore.setDashboardTab('art', 'generate')
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}
</script>

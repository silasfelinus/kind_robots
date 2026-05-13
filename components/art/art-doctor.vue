<!-- /components/content/art/art-doctor.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-4"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10"
          >
            <Icon name="kind-icon:activity" class="h-6 w-6 text-primary" />
          </div>

          <div class="min-w-0">
            <h2 class="truncate text-xl font-black text-base-content">
              Art Doctor
            </h2>

            <p class="text-sm text-base-content/60">
              Inspect Art and ArtImage records, then migrate selected fields
              with suspicious precision.
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            v-if="statusMessage"
            class="badge badge-ghost max-w-full truncate"
          >
            {{ statusMessage }}
          </span>

          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            :disabled="isLoading"
            @click="refreshDoctor"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        <div
          class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"
        >
          <p class="font-mono text-2xl font-black text-base-content">
            {{ allArt.length }}
          </p>
          <p class="text-xs text-base-content/60">Art</p>
        </div>

        <div
          class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"
        >
          <p class="font-mono text-2xl font-black text-base-content">
            {{ allArtImages.length }}
          </p>
          <p class="text-xs text-base-content/60">ArtImage</p>
        </div>

        <div
          class="rounded-2xl border border-success/30 bg-success/10 p-3 text-center"
        >
          <p class="font-mono text-2xl font-black text-success">
            {{ pairedCount }}
          </p>
          <p class="text-xs text-base-content/60">Linked</p>
        </div>

        <div
          class="rounded-2xl border border-warning/30 bg-warning/10 p-3 text-center"
        >
          <p class="font-mono text-2xl font-black text-warning">
            {{ oneWayCount }}
          </p>
          <p class="text-xs text-base-content/60">One-way</p>
        </div>

        <div
          class="rounded-2xl border border-error/30 bg-error/10 p-3 text-center"
        >
          <p class="font-mono text-2xl font-black text-error">
            {{ orphanArt.length }}
          </p>
          <p class="text-xs text-base-content/60">Orphan Art</p>
        </div>

        <div
          class="rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-center"
        >
          <p class="font-mono text-2xl font-black text-secondary">
            {{ missingThumbs.length }}
          </p>
          <p class="text-xs text-base-content/60">No Thumb</p>
        </div>
      </div>
    </header>

    <section class="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
      <aside class="flex min-h-0 flex-col gap-3 xl:col-span-4">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <div class="grid grid-cols-1 gap-2">
            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/60"
                >
                  Collection
                </span>
              </span>

              <select
                v-model.number="selectedCollectionId"
                class="select select-bordered select-sm bg-base-200"
              >
                <option :value="0">All records</option>
                <option :value="-1">Unassigned Art</option>

                <option
                  v-for="collection in collectionOptions"
                  :key="collection.id"
                  :value="collection.id"
                >
                  {{ collection.label || `Collection #${collection.id}` }}
                </option>
              </select>
            </label>

            <div class="grid grid-cols-2 gap-2">
              <button
                class="btn btn-sm rounded-xl"
                :class="galleryMode === 'art' ? 'btn-primary' : 'btn-ghost'"
                type="button"
                @click="galleryMode = 'art'"
              >
                <Icon name="kind-icon:image" class="h-4 w-4" />
                Art
              </button>

              <button
                class="btn btn-sm rounded-xl"
                :class="galleryMode === 'image' ? 'btn-primary' : 'btn-ghost'"
                type="button"
                @click="galleryMode = 'image'"
              >
                <Icon name="kind-icon:gallery" class="h-4 w-4" />
                Images
              </button>
            </div>

            <input
              v-model="searchText"
              class="input input-bordered input-sm bg-base-200"
              type="search"
              placeholder="Search prompt, checkpoint, designer, id..."
            />

            <div class="grid grid-cols-2 gap-2">
              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <span class="label-text text-xs font-bold">Problems</span>
                <input
                  v-model="showProblemsOnly"
                  type="checkbox"
                  class="toggle toggle-warning toggle-xs"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <span class="label-text text-xs font-bold">Thumbs</span>
                <input
                  v-model="showMissingThumbsOnly"
                  type="checkbox"
                  class="toggle toggle-secondary toggle-xs"
                />
              </label>
            </div>
          </div>
        </div>

        <div
          class="min-h-0 flex-1 overflow-auto rounded-2xl border border-base-300 bg-base-100 p-2"
        >
          <div
            v-if="galleryItems.length === 0"
            class="flex min-h-48 flex-col items-center justify-center p-6 text-center text-base-content/50"
          >
            <Icon
              name="kind-icon:search"
              class="h-10 w-10 text-base-content/30"
            />
            <p class="mt-2 font-bold">No records match this view.</p>
            <p class="text-sm">The gallery goblin has checked under the rug.</p>
          </div>

          <div v-else class="grid grid-cols-1 gap-2">
            <button
              v-for="item in galleryItems"
              :key="item.key"
              class="rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-base-200"
              :class="
                item.selected
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-100'
              "
              type="button"
              @click="selectGalleryItem(item)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-mono text-xs font-bold text-base-content/50">
                    {{ item.kind }} #{{ item.id }}
                  </p>

                  <p
                    class="mt-1 line-clamp-2 text-sm font-semibold text-base-content"
                  >
                    {{ item.title }}
                  </p>
                </div>

                <div class="flex shrink-0 flex-col items-end gap-1">
                  <span
                    v-for="badge in item.badges"
                    :key="badge.label"
                    class="badge badge-xs"
                    :class="badge.class"
                  >
                    {{ badge.label }}
                  </span>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-1">
                <span
                  v-if="item.checkpoint"
                  class="badge badge-ghost badge-xs max-w-full truncate"
                >
                  {{ item.checkpoint }}
                </span>

                <span v-if="item.designer" class="badge badge-primary badge-xs">
                  {{ item.designer }}
                </span>

                <span
                  v-if="item.collectionLabel"
                  class="badge badge-secondary badge-xs"
                >
                  {{ item.collectionLabel }}
                </span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <main class="flex min-h-0 flex-col gap-3 xl:col-span-5">
        <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase text-primary/70">
                  Selected Art
                </p>

                <h3 class="font-mono text-lg font-black">
                  {{ selectedArt ? `#${selectedArt.id}` : 'None' }}
                </h3>
              </div>

              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                :disabled="!selectedArt"
                @click="selectedArtId = null"
              >
                Clear
              </button>
            </div>

            <div v-if="selectedArt" class="space-y-2">
              <p class="line-clamp-4 text-sm text-base-content/75">
                {{ selectedArt.promptString || '(no prompt)' }}
              </p>

              <div class="flex flex-wrap gap-1">
                <span class="badge badge-ghost badge-sm">
                  artImageId: {{ selectedArt.artImageId ?? 'none' }}
                </span>

                <span class="badge badge-ghost badge-sm">
                  user: {{ selectedArt.userId ?? 'none' }}
                </span>

                <span
                  class="badge badge-sm"
                  :class="
                    selectedArt.isPublic ? 'badge-success' : 'badge-warning'
                  "
                >
                  {{ selectedArt.isPublic ? 'public' : 'private' }}
                </span>

                <span
                  v-if="selectedArt.isMature"
                  class="badge badge-error badge-sm"
                >
                  mature
                </span>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
            >
              Select an Art record from the gallery.
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-bold uppercase text-secondary/70">
                  Selected ArtImage
                </p>

                <h3 class="font-mono text-lg font-black">
                  {{ selectedArtImage ? `#${selectedArtImage.id}` : 'None' }}
                </h3>
              </div>

              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                :disabled="!selectedArtImage"
                @click="selectedImageId = null"
              >
                Clear
              </button>
            </div>

            <div v-if="selectedArtImage" class="space-y-2">
              <p class="line-clamp-4 text-sm text-base-content/75">
                {{
                  selectedArtImage.promptString ||
                  selectedArtImage.fileName ||
                  '(no metadata)'
                }}
              </p>

              <div class="flex flex-wrap gap-1">
                <span class="badge badge-ghost badge-sm">
                  artId: {{ selectedArtImage.artId ?? 'none' }}
                </span>

                <span class="badge badge-ghost badge-sm">
                  user: {{ selectedArtImage.userId ?? 'none' }}
                </span>

                <span
                  class="badge badge-sm"
                  :class="
                    selectedArtImage.isPublic
                      ? 'badge-success'
                      : 'badge-warning'
                  "
                >
                  {{ selectedArtImage.isPublic ? 'public' : 'private' }}
                </span>

                <span
                  v-if="selectedArtImage.isMature"
                  class="badge badge-error badge-sm"
                >
                  mature
                </span>

                <span
                  class="badge badge-sm"
                  :class="
                    selectedArtImage.thumbnailData
                      ? 'badge-success'
                      : 'badge-warning'
                  "
                >
                  {{ selectedArtImage.thumbnailData ? 'thumb' : 'no thumb' }}
                </span>
              </div>
            </div>

            <div
              v-else
              class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
            >
              Select an ArtImage record from the gallery.
            </div>
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-auto rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div
            class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
          >
            <div>
              <h3 class="text-base font-black text-base-content">
                Field migration
              </h3>

              <p class="text-sm text-base-content/60">
                Choose which fields move, then choose which side gets written.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                @click="selectRecommendedFields"
              >
                Recommended
              </button>

              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                @click="selectAllFields"
              >
                All
              </button>

              <button
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                @click="clearSelectedFields"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="mb-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/60"
                >
                  Direction
                </span>
              </span>

              <select
                v-model="syncDirection"
                class="select select-bordered select-sm bg-base-200"
              >
                <option value="artToImage">Art → ArtImage</option>
                <option value="imageToArt">ArtImage → Art</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase text-base-content/60"
                >
                  Write target
                </span>
              </span>

              <select
                v-model="writeTarget"
                class="select select-bordered select-sm bg-base-200"
              >
                <option value="artImage">ArtImage only</option>
                <option value="art">Art only</option>
                <option value="both">Both sides</option>
              </select>
            </label>
          </div>

          <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label
              v-for="field in visibleFieldRows"
              :key="field.key"
              class="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-2xl border border-base-300 bg-base-200 p-3 transition hover:border-primary"
              :class="
                selectedFields.has(field.key)
                  ? 'border-primary bg-primary/10'
                  : ''
              "
            >
              <input
                :checked="selectedFields.has(field.key)"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm mt-1"
                @change="toggleField(field.key)"
              />

              <div class="min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-mono text-xs font-black text-base-content">
                    {{ field.key }}
                  </span>

                  <span
                    v-if="field.differs"
                    class="badge badge-warning badge-xs"
                  >
                    differs
                  </span>

                  <span v-else class="badge badge-success badge-xs">
                    same
                  </span>
                </div>

                <div class="mt-2 grid grid-cols-1 gap-1 text-xs">
                  <p
                    class="truncate text-base-content/50"
                    :title="field.artValue"
                  >
                    Art: {{ field.artValue }}
                  </p>

                  <p
                    class="truncate text-base-content/50"
                    :title="field.imageValue"
                  >
                    Img: {{ field.imageValue }}
                  </p>
                </div>
              </div>
            </label>
          </div>
        </section>
      </main>

      <aside class="flex min-h-0 flex-col gap-3 xl:col-span-3">
        <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <h3 class="mb-2 text-base font-black text-base-content">Actions</h3>

          <div class="grid grid-cols-1 gap-2">
            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="!canApplyMigration || isWriting"
              @click="applyMigration"
            >
              <span
                v-if="isWriting"
                class="loading loading-spinner loading-xs"
              />
              Apply selected fields
            </button>

            <button
              class="btn btn-warning rounded-xl"
              type="button"
              :disabled="!selectedArt || !selectedArtImage || isWriting"
              @click="repairSelectedLinks"
            >
              <Icon name="kind-icon:link" class="h-4 w-4" />
              Repair links both ways
            </button>

            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              :disabled="!selectedArtImage || isWriting"
              @click="generateThumbnailForSelected"
            >
              <Icon name="kind-icon:image" class="h-4 w-4" />
              Generate thumbnail
            </button>
          </div>

          <div
            v-if="actionMessage"
            class="mt-3 rounded-2xl border p-3 text-sm"
            :class="
              actionTone === 'error'
                ? 'border-error/40 bg-error/10 text-error'
                : 'border-success/40 bg-success/10 text-success'
            "
          >
            {{ actionMessage }}
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-auto rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <h3 class="mb-2 text-base font-black text-base-content">
            Relationship diagnosis
          </h3>

          <div class="space-y-2 text-sm">
            <div
              v-for="row in relationshipRows"
              :key="row.label"
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-base-content/70">{{ row.label }}</span>
              <span
                class="badge"
                :class="row.ok ? 'badge-success' : 'badge-warning'"
              >
                {{ row.value }}
              </span>
            </div>
          </div>
        </section>

        <details
          class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <summary
            class="cursor-pointer text-xs font-bold uppercase text-base-content/60"
          >
            Debug payload
          </summary>

          <pre
            class="mt-2 max-h-64 overflow-auto text-xs text-base-content/70"
            >{{ debugPayload }}</pre
          >
        </details>
      </aside>
    </section>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/art-doctor.vue
import { computed, onMounted, ref } from 'vue'
import type { Art, ArtImage } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'

type GalleryMode = 'art' | 'image'
type SyncDirection = 'artToImage' | 'imageToArt'
type WriteTarget = 'artImage' | 'art' | 'both'

type FieldKey =
  | 'galleryId'
  | 'userId'
  | 'path'
  | 'promptString'
  | 'negativePrompt'
  | 'checkpoint'
  | 'checkpointResourceId'
  | 'sampler'
  | 'seed'
  | 'steps'
  | 'cfg'
  | 'cfgHalf'
  | 'designer'
  | 'genres'
  | 'isPublic'
  | 'isMature'
  | 'serverId'
  | 'serverName'
  | 'serverUrl'
  | 'artId'
  | 'artImageId'

type GalleryItem = {
  key: string
  kind: 'Art' | 'ArtImage'
  id: number
  title: string
  checkpoint: string
  designer: string
  collectionLabel: string
  selected: boolean
  badges: { label: string; class: string }[]
  record: Art | ArtImage
}

type FieldRow = {
  key: FieldKey
  artValue: string
  imageValue: string
  differs: boolean
}

type ArtImageLoose = ArtImage & {
  imageData?: string | null
  thumbnailData?: string | null
}

type CollectionLoose = ArtCollection & {
  art?: Art[]
  ArtImages?: ArtImage[]
  artImages?: ArtImage[]
}

const artStore = useArtStore()
const collectionStore = useCollectionStore()

const isLoading = ref(false)
const isWriting = ref(false)
const statusMessage = ref('')
const actionMessage = ref('')
const actionTone = ref<'success' | 'error'>('success')

const selectedCollectionId = ref(0)
const galleryMode = ref<GalleryMode>('art')
const searchText = ref('')
const showProblemsOnly = ref(false)
const showMissingThumbsOnly = ref(false)

const selectedArtId = ref<number | null>(null)
const selectedImageId = ref<number | null>(null)

const syncDirection = ref<SyncDirection>('artToImage')
const writeTarget = ref<WriteTarget>('artImage')

const recommendedFields: FieldKey[] = [
  'galleryId',
  'userId',
  'path',
  'promptString',
  'negativePrompt',
  'checkpoint',
  'checkpointResourceId',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'isPublic',
  'isMature',
  'serverId',
  'serverName',
  'serverUrl',
  'artId',
  'artImageId',
]

const selectedFields = ref<Set<FieldKey>>(new Set(recommendedFields))

const fieldKeys: FieldKey[] = [
  'galleryId',
  'userId',
  'path',
  'promptString',
  'negativePrompt',
  'checkpoint',
  'checkpointResourceId',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'isPublic',
  'isMature',
  'serverId',
  'serverName',
  'serverUrl',
  'artId',
  'artImageId',
]

const artWritableFields = new Set<FieldKey>([
  'galleryId',
  'userId',
  'path',
  'promptString',
  'negativePrompt',
  'checkpoint',
  'checkpointResourceId',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'isPublic',
  'isMature',
  'serverId',
  'serverName',
  'serverUrl',
  'artImageId',
])

const imageWritableFields = new Set<FieldKey>([
  'galleryId',
  'userId',
  'path',
  'promptString',
  'negativePrompt',
  'checkpoint',
  'checkpointResourceId',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'isPublic',
  'isMature',
  'serverId',
  'serverName',
  'serverUrl',
  'artId',
])

const allArt = computed<Art[]>(() => {
  return artStore.art || []
})

const allArtImages = computed<ArtImageLoose[]>(() => {
  return (artStore.artImages || []) as ArtImageLoose[]
})

const collectionOptions = computed<CollectionLoose[]>(() => {
  return ((collectionStore.collections || []) as CollectionLoose[]).filter(
    (collection) => {
      return collection.id > 0
    },
  )
})

const imageById = computed(() => {
  return new Map(allArtImages.value.map((image) => [image.id, image]))
})

const imageByArtId = computed(() => {
  const map = new Map<number, ArtImageLoose>()

  for (const image of allArtImages.value) {
    if (image.artId) {
      map.set(image.artId, image)
    }
  }

  return map
})

const artById = computed(() => {
  return new Map(allArt.value.map((art) => [art.id, art]))
})

const artByImageId = computed(() => {
  const map = new Map<number, Art>()

  for (const art of allArt.value) {
    if (art.artImageId) {
      map.set(art.artImageId, art)
    }
  }

  return map
})

const selectedCollection = computed<CollectionLoose | null>(() => {
  if (selectedCollectionId.value <= 0) return null

  return (
    collectionOptions.value.find((collection) => {
      return collection.id === selectedCollectionId.value
    }) || null
  )
})

const assignedArtIds = computed(() => {
  const ids = new Set<number>()

  for (const collection of collectionOptions.value) {
    for (const art of collection.art || []) {
      if (art.id) {
        ids.add(art.id)
      }
    }
  }

  return ids
})

const selectedCollectionArtIds = computed(() => {
  if (selectedCollectionId.value === 0) {
    return new Set(allArt.value.map((art) => art.id))
  }

  if (selectedCollectionId.value === -1) {
    return new Set(
      allArt.value
        .filter((art) => !assignedArtIds.value.has(art.id))
        .map((art) => art.id),
    )
  }

  return new Set((selectedCollection.value?.art || []).map((art) => art.id))
})

const selectedCollectionImageIds = computed(() => {
  const ids = new Set<number>()

  if (!selectedCollection.value) {
    return ids
  }

  for (const image of selectedCollection.value.ArtImages || []) {
    ids.add(image.id)
  }

  for (const image of selectedCollection.value.artImages || []) {
    ids.add(image.id)
  }

  return ids
})

const filteredArt = computed(() => {
  const query = searchText.value.trim().toLowerCase()

  return allArt.value.filter((art) => {
    if (!selectedCollectionArtIds.value.has(art.id)) return false
    if (showProblemsOnly.value && !isProblemArt(art)) return false

    if (!query) return true

    return [
      art.id,
      art.promptString,
      art.negativePrompt,
      art.checkpoint,
      art.designer,
      art.serverName,
      art.artImageId,
    ]
      .filter((value) => value != null)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

const filteredImages = computed(() => {
  const query = searchText.value.trim().toLowerCase()

  return allArtImages.value.filter((image) => {
    if (selectedCollectionId.value > 0) {
      const artMatch = image.artId
        ? selectedCollectionArtIds.value.has(image.artId)
        : false
      const imageMatch = selectedCollectionImageIds.value.has(image.id)

      if (!artMatch && !imageMatch) return false
    }

    if (selectedCollectionId.value === -1 && image.artId) return false
    if (showProblemsOnly.value && !isProblemImage(image)) return false
    if (showMissingThumbsOnly.value && image.thumbnailData) return false

    if (!query) return true

    return [
      image.id,
      image.promptString,
      image.negativePrompt,
      image.checkpoint,
      image.designer,
      image.serverName,
      image.artId,
      image.fileName,
    ]
      .filter((value) => value != null)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

const galleryItems = computed<GalleryItem[]>(() => {
  if (galleryMode.value === 'art') {
    return filteredArt.value.map((art) => {
      const linkedImage = getLinkedImageForArt(art)
      const collectionLabel = getCollectionLabelForArt(art.id)

      return {
        key: `art-${art.id}`,
        kind: 'Art',
        id: art.id,
        title: art.promptString || `Art #${art.id}`,
        checkpoint: cleanCheckpoint(art.checkpoint),
        designer: art.designer || '',
        collectionLabel,
        selected: selectedArtId.value === art.id,
        record: art,
        badges: [
          {
            label: linkedImage ? 'linked' : 'orphan',
            class: linkedImage ? 'badge-success' : 'badge-warning',
          },
          {
            label: art.isPublic ? 'public' : 'private',
            class: art.isPublic ? 'badge-info' : 'badge-ghost',
          },
          ...(art.isMature ? [{ label: 'mature', class: 'badge-error' }] : []),
        ],
      }
    })
  }

  return filteredImages.value.map((image) => {
    const linkedArt = getLinkedArtForImage(image)
    const collectionLabel = linkedArt
      ? getCollectionLabelForArt(linkedArt.id)
      : ''

    return {
      key: `image-${image.id}`,
      kind: 'ArtImage',
      id: image.id,
      title: image.promptString || image.fileName || `ArtImage #${image.id}`,
      checkpoint: cleanCheckpoint(image.checkpoint),
      designer: image.designer || '',
      collectionLabel,
      selected: selectedImageId.value === image.id,
      record: image,
      badges: [
        {
          label: linkedArt ? 'linked' : 'unlinked',
          class: linkedArt ? 'badge-success' : 'badge-warning',
        },
        {
          label: image.thumbnailData ? 'thumb' : 'no thumb',
          class: image.thumbnailData ? 'badge-secondary' : 'badge-warning',
        },
        ...(image.isMature ? [{ label: 'mature', class: 'badge-error' }] : []),
      ],
    }
  })
})

const selectedArt = computed<Art | null>(() => {
  if (!selectedArtId.value) return null

  return artById.value.get(selectedArtId.value) || null
})

const selectedArtImage = computed<ArtImageLoose | null>(() => {
  if (!selectedImageId.value) return null

  return imageById.value.get(selectedImageId.value) || null
})

const pairedCount = computed(() => {
  return allArt.value.filter((art) => {
    const image = getLinkedImageForArt(art)
    return Boolean(
      image && art.artImageId === image.id && image.artId === art.id,
    )
  }).length
})

const oneWayCount = computed(() => {
  return allArt.value.filter((art) => {
    const image = getLinkedImageForArt(art)
    if (!image) return false

    return art.artImageId !== image.id || image.artId !== art.id
  }).length
})

const orphanArt = computed(() => {
  return allArt.value.filter((art) => !getLinkedImageForArt(art))
})

const missingThumbs = computed(() => {
  return allArtImages.value.filter((image) => !image.thumbnailData)
})

const visibleFieldRows = computed<FieldRow[]>(() => {
  return fieldKeys.map((key) => {
    const artValue = getArtFieldDisplay(key)
    const imageValue = getImageFieldDisplay(key)

    return {
      key,
      artValue,
      imageValue,
      differs: artValue !== imageValue,
    }
  })
})

const canApplyMigration = computed(() => {
  if (!selectedArt.value || !selectedArtImage.value) return false
  if (selectedFields.value.size === 0) return false

  return true
})

const relationshipRows = computed(() => {
  const art = selectedArt.value
  const image = selectedArtImage.value

  return [
    {
      label: 'Art selected',
      value: art ? `#${art.id}` : 'none',
      ok: Boolean(art),
    },
    {
      label: 'ArtImage selected',
      value: image ? `#${image.id}` : 'none',
      ok: Boolean(image),
    },
    {
      label: 'Art.artImageId',
      value: art?.artImageId ? `#${art.artImageId}` : 'none',
      ok: Boolean(art && image && art.artImageId === image.id),
    },
    {
      label: 'ArtImage.artId',
      value: image?.artId ? `#${image.artId}` : 'none',
      ok: Boolean(art && image && image.artId === art.id),
    },
    {
      label: 'Bidirectional',
      value:
        art && image && art.artImageId === image.id && image.artId === art.id
          ? 'yes'
          : 'no',
      ok: Boolean(
        art && image && art.artImageId === image.id && image.artId === art.id,
      ),
    },
  ]
})

const debugPayload = computed(() => {
  return JSON.stringify(
    {
      selectedCollectionId: selectedCollectionId.value,
      galleryMode: galleryMode.value,
      selectedArtId: selectedArtId.value,
      selectedImageId: selectedImageId.value,
      syncDirection: syncDirection.value,
      writeTarget: writeTarget.value,
      selectedFields: Array.from(selectedFields.value),
      artPatch:
        selectedArt.value && selectedArtImage.value ? buildArtPatch() : null,
      imagePatch:
        selectedArt.value && selectedArtImage.value ? buildImagePatch() : null,
    },
    null,
    2,
  )
})

onMounted(async () => {
  await refreshDoctor()
})

async function refreshDoctor() {
  isLoading.value = true
  actionMessage.value = ''
  statusMessage.value = 'Loading Art, ArtImage, and collections...'

  try {
    await artStore.initialize({
      force: true,
      fetchRemote: true,
      hydrateImages: false,
      initializeCollections: true,
    })

    await artStore.fetchAllArt(true)

    await artStore.fetchAllArtImages({
      force: true,
      includeThumbnailData: true,
    })

    await collectionStore.fetchCollections?.(true)

    statusMessage.value = `Loaded ${allArt.value.length} Art and ${allArtImages.value.length} ArtImage records.`
  } catch (error) {
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to load art doctor data.'
  } finally {
    isLoading.value = false
  }
}

function selectGalleryItem(item: GalleryItem) {
  if (item.kind === 'Art') {
    const art = item.record as Art
    selectedArtId.value = art.id

    const linkedImage = getLinkedImageForArt(art)

    if (linkedImage) {
      selectedImageId.value = linkedImage.id
    }

    return
  }

  const image = item.record as ArtImageLoose
  selectedImageId.value = image.id

  const linkedArt = getLinkedArtForImage(image)

  if (linkedArt) {
    selectedArtId.value = linkedArt.id
  }
}

function getLinkedImageForArt(art: Art): ArtImageLoose | null {
  if (art.artImageId) {
    const forward = imageById.value.get(art.artImageId)

    if (forward) return forward
  }

  return imageByArtId.value.get(art.id) || null
}

function getLinkedArtForImage(image: ArtImageLoose): Art | null {
  if (image.artId) {
    const back = artById.value.get(image.artId)

    if (back) return back
  }

  return artByImageId.value.get(image.id) || null
}

function getCollectionLabelForArt(artId: number): string {
  const collection = collectionOptions.value.find((entry) => {
    return (entry.art || []).some((art) => art.id === artId)
  })

  return collection?.label || ''
}

function isProblemArt(art: Art): boolean {
  const image = getLinkedImageForArt(art)

  if (!image) return true
  if (art.artImageId !== image.id) return true
  if (image.artId !== art.id) return true

  return false
}

function isProblemImage(image: ArtImageLoose): boolean {
  const art = getLinkedArtForImage(image)

  if (!art) return true
  if (image.artId !== art.id) return true
  if (art.artImageId !== image.id) return true
  if (!image.thumbnailData) return true

  return false
}

function toggleField(key: FieldKey) {
  const next = new Set(selectedFields.value)

  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  selectedFields.value = next
}

function selectRecommendedFields() {
  selectedFields.value = new Set(recommendedFields)
}

function selectAllFields() {
  selectedFields.value = new Set(fieldKeys)
}

function clearSelectedFields() {
  selectedFields.value = new Set()
}

function getArtFieldValue(key: FieldKey): unknown {
  const art = selectedArt.value
  if (!art) return null

  if (key === 'artId') return art.id

  return art[key as keyof Art]
}

function getImageFieldValue(key: FieldKey): unknown {
  const image = selectedArtImage.value
  if (!image) return null

  if (key === 'artImageId') return image.id

  return image[key as keyof ArtImageLoose]
}

function getArtFieldDisplay(key: FieldKey): string {
  return stringifyValue(getArtFieldValue(key))
}

function getImageFieldDisplay(key: FieldKey): string {
  return stringifyValue(getImageFieldValue(key))
}

function stringifyValue(value: unknown): string {
  if (value == null) return 'null'
  if (typeof value === 'string') return value || '""'
  if (typeof value === 'boolean') return value ? 'true' : 'false'

  return String(value)
}

function buildImagePatch() {
  const patch: Partial<ArtImage> = {}
  const art = selectedArt.value

  if (!art) return patch

  for (const key of selectedFields.value) {
    if (!imageWritableFields.has(key)) continue

    if (key === 'artId') {
      patch.artId = art.id
      continue
    }

    const value = art[key as keyof Art]
    ;(patch as Record<string, unknown>)[key] = value ?? null
  }

  return patch
}

function buildArtPatch() {
  const patch: Partial<Art> = {}
  const image = selectedArtImage.value

  if (!image) return patch

  for (const key of selectedFields.value) {
    if (!artWritableFields.has(key)) continue

    if (key === 'artImageId') {
      patch.artImageId = image.id
      continue
    }

    const value = image[key as keyof ArtImageLoose]
    ;(patch as Record<string, unknown>)[key] = value ?? null
  }

  return patch
}

async function applyMigration() {
  const art = selectedArt.value
  const image = selectedArtImage.value

  if (!art || !image) return

  isWriting.value = true
  actionMessage.value = ''

  try {
    if (syncDirection.value === 'artToImage') {
      if (writeTarget.value === 'artImage' || writeTarget.value === 'both') {
        const imagePatch = buildImagePatch()
        imagePatch.artId = art.id

        const imageResult = await artStore.updateArtImage(image.id, imagePatch)

        if (!imageResult.success) {
          throw new Error(imageResult.message || 'Failed to update ArtImage.')
        }
      }

      if (writeTarget.value === 'art' || writeTarget.value === 'both') {
        const artResult = await artStore.updateArt(art.id, {
          artImageId: image.id,
        })

        if (!artResult.success) {
          throw new Error(artResult.message || 'Failed to update Art.')
        }
      }
    }

    if (syncDirection.value === 'imageToArt') {
      if (writeTarget.value === 'art' || writeTarget.value === 'both') {
        const artPatch = buildArtPatch()
        artPatch.artImageId = image.id

        const artResult = await artStore.updateArt(art.id, artPatch)

        if (!artResult.success) {
          throw new Error(artResult.message || 'Failed to update Art.')
        }
      }

      if (writeTarget.value === 'artImage' || writeTarget.value === 'both') {
        const imageResult = await artStore.updateArtImage(image.id, {
          artId: art.id,
        })

        if (!imageResult.success) {
          throw new Error(imageResult.message || 'Failed to update ArtImage.')
        }
      }
    }

    actionTone.value = 'success'
    actionMessage.value =
      'Migration applied. The goblin has initialed the paperwork.'
  } catch (error) {
    actionTone.value = 'error'
    actionMessage.value =
      error instanceof Error ? error.message : 'Failed to apply migration.'
  } finally {
    isWriting.value = false
  }
}

async function repairSelectedLinks() {
  const art = selectedArt.value
  const image = selectedArtImage.value

  if (!art || !image) return

  isWriting.value = true
  actionMessage.value = ''

  try {
    const result = await artStore.repairArtImageLink(art.id, image.id)

    if (!result.success) {
      throw new Error(result.message || 'Failed to repair link.')
    }

    actionTone.value = 'success'
    actionMessage.value = result.message || 'Links repaired both ways.'
  } catch (error) {
    actionTone.value = 'error'
    actionMessage.value =
      error instanceof Error ? error.message : 'Failed to repair links.'
  } finally {
    isWriting.value = false
  }
}

async function generateThumbnailForSelected() {
  const image = selectedArtImage.value

  if (!image) return

  isWriting.value = true
  actionMessage.value = ''

  try {
    const fullImage = (await artStore.getArtImageById(image.id, {
      force: true,
      includeImageData: true,
    })) as ArtImageLoose | undefined

    if (!fullImage?.imageData) {
      throw new Error('This ArtImage has no imageData to thumbnail.')
    }

    const thumbnailData = await createThumbnailFromBase64(
      fullImage.imageData,
      fullImage.fileType || 'png',
      320,
    )

    const result = await artStore.updateArtImage(image.id, {
      thumbnailData,
    })

    if (!result.success) {
      throw new Error(result.message || 'Failed to save thumbnail.')
    }

    actionTone.value = 'success'
    actionMessage.value = `Thumbnail saved for ArtImage #${image.id}.`
  } catch (error) {
    actionTone.value = 'error'
    actionMessage.value =
      error instanceof Error ? error.message : 'Failed to generate thumbnail.'
  } finally {
    isWriting.value = false
  }
}

function createThumbnailFromBase64(
  base64: string,
  fileType: string,
  maxSize: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const mimeType = normalizeImageMimeType(fileType)
    const img = new Image()

    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const canvas = document.createElement('canvas')

      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)

      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas context unavailable.'))
        return
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL(mimeType, 0.82)
      const thumbnailData = dataUrl.split(',')[1]

      if (!thumbnailData) {
        reject(new Error('Canvas produced empty thumbnail.'))
        return
      }

      resolve(thumbnailData)
    }

    img.onerror = () => reject(new Error('Failed to load image for thumbnail.'))
    img.src = `data:${mimeType};base64,${base64}`
  })
}

function normalizeImageMimeType(fileType?: string | null) {
  if (!fileType) return 'image/png'

  const cleaned = fileType.trim().toLowerCase()

  if (cleaned.startsWith('image/')) return cleaned
  if (cleaned === 'jpg') return 'image/jpeg'
  if (cleaned === 'jpeg') return 'image/jpeg'
  if (cleaned === 'png') return 'image/png'
  if (cleaned === 'webp') return 'image/webp'
  if (cleaned === 'gif') return 'image/gif'

  return `image/${cleaned}`
}

function cleanCheckpoint(value?: string | null) {
  if (!value) return ''

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
</script>

<style scoped>
.art-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}
</style>

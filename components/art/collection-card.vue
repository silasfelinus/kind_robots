<!-- /components/content/art/collection-card.vue -->
<template>
  <article
    :class="[
      'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      activeSelected ? 'border-primary bg-primary/10' : 'border-base-300',
      isHiddenMature ? 'opacity-75' : '',
    ]"
    @click="selectCollection"
  >
    <div
      v-if="showActions && (activeSelected || compact)"
      class="absolute right-2 top-2 z-20 flex items-center gap-2"
    >
      <button
        v-if="allowEdit && canEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Collection"
        @click.stop="emit('edit', collection.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowDelete && canEdit"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Collection"
        @click.stop="deleteCollection"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="showImage"
      :class="[
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        imageHeightClass,
      ]"
    >
      <art-card
        v-if="previewArt && !isHiddenMature"
        :art="previewArt"
        :compact="true"
        :show-actions="false"
        :show-prompt="false"
        :show-meta="false"
        :show-select-button="false"
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
        <div class="flex flex-col items-center gap-2 text-base-content/45">
          <Icon
            :name="isHiddenMature ? 'kind-icon:lock' : fallbackIcon"
            class="h-12 w-12"
          />

          <span class="text-xs font-bold">
            {{ isHiddenMature ? 'Mature hidden' : 'No preview' }}
          </span>
        </div>
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="collection.isPublic" class="badge badge-success badge-sm">
          Public
        </span>

        <span v-else class="badge badge-warning badge-sm"> Private </span>

        <span v-if="collection.isMature" class="badge badge-error badge-sm">
          Mature
        </span>

        <span v-if="activeSelected" class="badge badge-primary badge-sm">
          Selected
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
      <div class="min-w-0">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-xl',
          ]"
          :title="collectionLabel"
        >
          {{ collectionLabel }}
        </h2>

        <p
          v-if="showDescription"
          :class="[
            'mt-1 text-base-content/70',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-sm',
          ]"
        >
          {{ collectionDescription }}
        </p>
      </div>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span class="badge badge-outline badge-sm">
          {{ artCountLabel }}
        </span>

        <span v-if="collection.username" class="badge badge-primary badge-sm">
          {{ collection.username }}
        </span>

        <span v-if="collection.userId" class="badge badge-ghost badge-sm">
          User #{{ collection.userId }}
        </span>
      </div>

      <div
        v-if="showStats"
        class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
      >
        <div>
          <p class="font-bold uppercase text-base-content/45">Art</p>
          <p class="truncate text-base-content/75">
            {{ artCount }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Visibility</p>
          <p class="truncate text-base-content/75">
            {{ collection.isPublic ? 'Public' : 'Private' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Mature</p>
          <p class="truncate text-base-content/75">
            {{ collection.isMature ? 'Yes' : 'No' }}
          </p>
        </div>

        <div>
          <p class="font-bold uppercase text-base-content/45">Updated</p>
          <p class="truncate text-base-content/75">
            {{ updatedLabel }}
          </p>
        </div>
      </div>

      <div v-if="showSelectButton" class="mt-auto grid grid-cols-1 gap-2 pt-1">
        <button
          class="btn btn-sm rounded-xl"
          :class="activeSelected ? 'btn-primary text-white' : 'btn-outline'"
          type="button"
          :disabled="isHiddenMature"
          @click.stop="selectCollection"
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
          JSON.stringify(collection, null, 2)
        }}</pre>
      </details>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    collection: ArtCollection
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showSelectButton?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    showMature?: boolean
    autoLoadPreviewImage?: boolean
    fallbackImage?: string
    fallbackIcon?: string
    imageHeightClass?: string
  }>(),
  {
    selected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showStats: false,
    showSelectButton: true,
    showDebug: false,
    allowEdit: true,
    allowDelete: true,
    showMature: false,
    autoLoadPreviewImage: true,
    fallbackImage: '/images/backtree.webp',
    fallbackIcon: 'kind-icon:gallery',
    imageHeightClass: 'h-44',
  },
)

const emit = defineEmits<{
  edit: [id: number]
  delete: [id: number]
}>()

const collectionStore = useCollectionStore()
const userStore = useUserStore()

const activeSelected = computed(() => {
  return (
    props.selected ||
    collectionStore.currentCollection?.id === props.collection.id
  )
})

const isHiddenMature = computed(() => {
  return Boolean(props.collection.isMature && !props.showMature)
})

const canEdit = computed(() => {
  return userStore.isAdmin || props.collection.userId === userStore.userId
})

const collectionLabel = computed(() => {
  if (isHiddenMature.value) return 'Hidden Collection'

  return props.collection.label || `Collection #${props.collection.id}`
})

const collectionDescription = computed(() => {
  if (isHiddenMature.value) {
    return 'This collection is hidden by mature-content settings.'
  }

  return (
    props.collection.description ||
    'A curated bundle of generated art, suspicious pixels, and narrative fuel.'
  )
})

const collectionArt = computed<Art[]>(() => {
  return Array.isArray(props.collection.art) ? props.collection.art : []
})

const artCount = computed(() => {
  return collectionArt.value.length
})

const artCountLabel = computed(() => {
  return `${artCount.value} art${artCount.value === 1 ? '' : 's'}`
})

const previewArt = computed<Art | null>(() => {
  if (isHiddenMature.value) return null

  const artWithImage = collectionArt.value.find((art) => {
    return Boolean(art.artImageId || art.imagePath || art.path)
  })

  return artWithImage || collectionArt.value[0] || null
})

const previewImage = computed(() => {
  if (isHiddenMature.value) return ''

  return (
    previewArt.value?.imagePath || previewArt.value?.path || props.fallbackImage
  )
})

const updatedLabel = computed(() => {
  const value = props.collection.updatedAt || props.collection.createdAt

  if (!value) return 'n/a'

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) return 'n/a'

  return date.toLocaleDateString()
})

async function selectCollection() {
  if (isHiddenMature.value) return

  collectionStore.setCurrentCollection(props.collection.id)
  collectionStore.setSelectedCollectionIds([props.collection.id])
}

async function deleteCollection() {
  if (!canEdit.value) return

  const result = await collectionStore.deleteCollectionById(props.collection.id)

  if (result) {
    emit('delete', props.collection.id)
  }
}
</script>

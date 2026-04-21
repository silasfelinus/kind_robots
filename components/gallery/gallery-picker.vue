<!-- /components/gallery/gallery-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search galleries…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="filtered.length === 0" class="picker-empty">
      <span>🖼️</span> No galleries found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="gallery in filtered"
        :key="gallery.id"
        class="picker-row"
        :class="{ 'picker-row--active': selectedGalleryId === gallery.id }"
        @click="selectGallery(gallery)"
      >
        <span class="picker-icon">
          <img
            :src="gallery.highlightImage || '/images/backtree.webp'"
            alt="Gallery preview"
            class="h-10 w-10 rounded-xl border border-base-300 bg-base-200 object-cover"
          />
        </span>

        <span class="picker-label">
          <span class="picker-name">
            {{ gallery.name || 'Untitled Gallery' }}
          </span>
          <span class="picker-sub">
            {{ gallery.description || 'No description available.' }}
          </span>
        </span>

        <button
          class="picker-action btn btn-xs rounded-full"
          :class="
            selectedGalleryId === gallery.id ? 'btn-primary' : 'btn-ghost'
          "
          @click.stop="selectGallery(gallery)"
        >
          Open
        </button>
      </li>
    </ul>

    <div
      v-if="selectedGallery"
      class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <div class="flex items-start gap-3">
        <img
          :src="selectedGallery.highlightImage || '/images/backtree.webp'"
          alt="Selected gallery preview"
          class="h-16 w-16 rounded-2xl border border-base-300 bg-base-200 object-cover"
        />

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-bold">
            {{ selectedGallery.name || 'Untitled Gallery' }}
          </div>
          <div class="text-xs leading-snug opacity-70">
            {{ selectedGallery.description || 'No description available.' }}
          </div>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <NuxtLink
          :to="galleryRoute(selectedGallery)"
          class="btn btn-xs btn-primary rounded-full"
        >
          View Page
        </NuxtLink>

        <button
          class="btn btn-xs btn-outline rounded-full"
          @click="clearSelection"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGalleryStore } from '@/stores/galleryStore'

type GalleryRecord = {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date | null
  description: string | null
  url: string | null
  custodian: string | null
  content: string
  highlightImage: string | null
  imagePaths: string | null
  isMature: boolean
  userId: number | null
  isPublic: boolean
  slug?: string | null
  path?: string | null
}

const galleryStore = useGalleryStore()
const query = ref('')
const selectedGalleryId = ref<number | null>(null)
const isInitializing = ref(false)

const allGalleries = computed<GalleryRecord[]>(() => {
  return (galleryStore.galleries ?? []) as GalleryRecord[]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()

  if (!q) return allGalleries.value

  return allGalleries.value.filter((gallery) => {
    const name = gallery.name?.toLowerCase() ?? ''
    const description = gallery.description?.toLowerCase() ?? ''
    return name.includes(q) || description.includes(q)
  })
})

const selectedGallery = computed(() => {
  return (
    allGalleries.value.find(
      (gallery) => gallery.id === selectedGalleryId.value,
    ) ?? null
  )
})

onMounted(async () => {
  if (!galleryStore.galleries?.length) {
    isInitializing.value = true
    try {
      await galleryStore.initialize()
    } finally {
      isInitializing.value = false
    }
  }
})

function selectGallery(gallery: GalleryRecord) {
  selectedGalleryId.value = gallery.id
}

function clearSelection() {
  selectedGalleryId.value = null
}

function galleryRoute(gallery: GalleryRecord) {
  if (gallery.path) return gallery.path
  if (gallery.slug) return `/galleries/${gallery.slug}`
  if (gallery.name) return `/galleries/${slugify(gallery.name)}`
  return '/galleries'
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
</script>

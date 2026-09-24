<template>
  <section class="kr-surface gap-0">
    <nav
      class="mb-2 flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto kr-panel-flat p-2"
      aria-label="Art studio views"
    >
      <button
        type="button"
        class="kr-btn"
        :class="activeTab === 'generate' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'generate'"
        @click="selectPrimaryView('generate')"
      >
        <Icon name="kind-icon:sparkles" class="kr-icon-4" />
        Generate
      </button>

      <button
        type="button"
        class="kr-btn"
        :class="isPublicGallery ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="isPublicGallery"
        @click="selectPrimaryView('gallery')"
      >
        <Icon name="kind-icon:gallery" class="kr-icon-4" />
        Gallery
      </button>

      <button
        v-if="userStore.isAdmin"
        type="button"
        class="kr-btn"
        :class="isPrivateGallery ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="isPrivateGallery"
        @click="selectPrimaryView('private')"
      >
        <Icon name="kind-icon:lock" class="kr-icon-4" />
        Private
      </button>

      <div
        v-if="showGalleryFilters"
        class="ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-base-300 bg-base-100 p-1"
        aria-label="Gallery maturity filter"
      >
        <span class="kr-text-dim-xs-70 px-1 font-bold">Show</span>
        <button
          v-for="option in MATURITY_FILTER_OPTIONS"
          :key="option.value"
          type="button"
          class="btn btn-xs rounded-md"
          :class="
            maturityFilter === option.value
              ? 'btn-primary'
              : 'btn-ghost text-base-content/60'
          "
          :aria-pressed="maturityFilter === option.value"
          @click="maturityFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <label
        v-if="showAdminGalleryControls"
        class="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-error/30 bg-base-100 px-2 py-1"
        title="Arm one-click delete buttons on gallery images"
      >
        <Icon name="kind-icon:trash" class="kr-icon-3-5 text-error" />
        <span class="kr-text-dim-xs-70 font-bold">Confirm delete</span>
        <input
          v-model="deleteMode"
          type="checkbox"
          class="kr-toggle-error-xs"
          aria-label="Confirm delete mode"
        />
      </label>
    </nav>

    <art-manager class="min-h-0 flex-1" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  useArtCollectionBrowseStore,
  type GalleryMaturityFilter,
} from '@/stores/artCollectionBrowseStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'

type ArtPrimaryView = 'generate' | 'gallery' | 'private'

const MATURITY_FILTER_OPTIONS: readonly {
  value: GalleryMaturityFilter
  label: string
}[] = [
  { value: 'all', label: 'Both' },
  { value: 'mature', label: 'Mature' },
  { value: 'safe', label: 'Not mature' },
]

const navStore = useNavStore()
const browseStore = useArtCollectionBrowseStore()
const userStore = useUserStore()

const activeTab = computed(() => navStore.getDashboardTab('art'))
const isPublicGallery = computed(
  () =>
    activeTab.value === 'gallery' &&
    browseStore.galleryPrivacyFilter === 'public',
)
const isPrivateGallery = computed(
  () =>
    activeTab.value === 'gallery' &&
    browseStore.galleryPrivacyFilter === 'private',
)
const maturityFilter = computed<GalleryMaturityFilter>({
  get: () => browseStore.galleryMaturityFilter,
  set: (value) => browseStore.setGalleryMaturityFilter(value),
})
const deleteMode = computed<boolean>({
  get: () => browseStore.galleryDeleteMode,
  set: (value) => browseStore.setGalleryDeleteMode(value),
})
const showGalleryFilters = computed(() => activeTab.value === 'gallery')
const showAdminGalleryControls = computed(
  () => showGalleryFilters.value && userStore.isAdmin,
)

function selectPrimaryView(view: ArtPrimaryView): void {
  if (view === 'generate') {
    browseStore.setGalleryDeleteMode(false)
    navStore.setDashboardTab('art', 'generate', 'art studio primary navigation')
    return
  }

  if (view === 'private') {
    if (!userStore.isAdmin) return
    browseStore.setGalleryMaturityFilter('all')
    browseStore.setGalleryPrivacyFilter('private')
  } else {
    browseStore.setGalleryPrivacyFilter('public')
  }

  navStore.setDashboardTab('art', 'gallery', 'art studio primary navigation')
}
</script>

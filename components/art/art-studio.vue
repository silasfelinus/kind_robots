<template>
  <section class="kr-surface gap-0">
    <nav
      class="mb-2 flex shrink-0 flex-wrap items-center gap-2 kr-panel-flat p-2"
      aria-label="Art studio views"
    >
      <button
        type="button"
        class="kr-btn"
        :class="activeTab === 'generate' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'generate'"
        @click="selectPrimaryTab('generate')"
      >
        <Icon name="kind-icon:sparkles" class="kr-icon-4" />
        Generate
      </button>

      <button
        type="button"
        class="kr-btn"
        :class="activeTab === 'gallery' ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="activeTab === 'gallery'"
        @click="selectPrimaryTab('gallery')"
      >
        <Icon name="kind-icon:gallery" class="kr-icon-4" />
        Gallery
      </button>

      <p class="kr-text-dim-xs-55 ml-1 hidden md:block">
        Make something new, or browse what you already made.
      </p>

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

type ArtPrimaryTab = 'generate' | 'gallery'

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

const activeTab = computed(() => navStore.getDashboardTab('art'))
const maturityFilter = computed<GalleryMaturityFilter>({
  get: () => browseStore.galleryMaturityFilter,
  set: (value) => browseStore.setGalleryMaturityFilter(value),
})
const showGalleryFilters = computed(
  () =>
    activeTab.value === 'gallery' &&
    browseStore.galleryPrivacyFilter !== null,
)

function selectPrimaryTab(tab: ArtPrimaryTab): void {
  navStore.setDashboardTab('art', tab, 'art studio primary navigation')
}
</script>

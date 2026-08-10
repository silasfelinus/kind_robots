<!-- /components/facets/facet-interact.vue -->
<!--
  Router for the Facets working surface: gallery until something is picked,
  then facet-profile. Mirrors dream-interact -> dream-narration and
  reward-interact -> reward-encounter -- the frame is shared here, the
  profile content lives in its own file so this stays a router rather than
  the working surface (Rule 5, utils/scripts/verifyRouteGalleryContract.ts).

  Selection lives in the URL rather than in local state, per the house rule
  that every view is linkable (the same shape as /storybook?story=...). That
  also means the browser back button does the obvious thing.
-->
<template>
  <div v-if="!selectedFacet" class="flex h-full min-h-0 flex-col gap-2">
    <div class="flex shrink-0 justify-end">
      <button
        type="button"
        class="btn btn-secondary btn-sm rounded-xl"
        @click="goToCreateFacet"
      >
        <Icon name="kind-icon:plus" class="size-3.5" />
        New Facet
      </button>
    </div>
    <facet-gallery
      class="min-h-0 flex-1"
      :show-header="showHeader"
      title="Facets"
      subtitle="Pick a Facet to open its profile."
      @select="openFacet"
    />
  </div>

  <facet-profile v-else>
    <template #detail="slotProps">
      <slot name="detail" v-bind="slotProps" />
    </template>
  </facet-profile>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useFacetCatalogStore,
  type FacetCatalogEntry,
} from '@/stores/facetCatalogStore'
import { useNavStore } from '@/stores/navStore'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })

const route = useRoute()
const router = useRouter()
const catalog = useFacetCatalogStore()
const navStore = useNavStore()

/* Resolved from the URL, so a Facet page can be linked, bookmarked and
   back-buttoned. Falls back to null when the slug names nothing, which keeps a
   stale link on the gallery rather than on a broken detail view. */
const selectedFacet = computed<FacetCatalogEntry | null>(() => {
  const slug = route.query.facet
  if (typeof slug !== 'string' || !slug) return null
  return catalog.entries.find((entry) => entry.slug === slug) ?? null
})

function openFacet(facet: FacetCatalogEntry): void {
  if (!facet.slug) return
  void router.push({ query: { ...route.query, facet: facet.slug } })
}

/*
 * The gallery is a deliberately read-only surface (verifyFacetGallery.ts
 * forbids create/update/archive here) -- creation belongs to the Library
 * tab's admin flow. This switches to it and pre-expands the create form via
 * a one-shot ?create=1 query flag, so a visitor never has to already know
 * Library exists just to add a Facet.
 */
function goToCreateFacet(): void {
  navStore.setDashboardTab(
    'facets',
    'library',
    'facet-interact create affordance',
  )
  void router.push({ query: { ...route.query, create: '1' } })
}

/*
 * The gallery fetches the catalog on mount, but a deep link to ?facet=<slug>
 * renders the profile branch instead and would otherwise resolve against an
 * empty store -- landing the visitor back on the gallery for a link that was
 * perfectly valid. fetchCatalog no-ops once loaded, so this costs nothing on
 * the normal browse-then-select path.
 */
onMounted(() => {
  if (!catalog.loaded) void catalog.fetchCatalog()
})
</script>

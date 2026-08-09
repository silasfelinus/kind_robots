<!-- /components/facets/facet-manager.vue -->
<!--
  Tab router for the Facets dashboard, on the shared manager shell.

  gallery -> facet-interact  browse, open one, edit it in the detail slot
  library -> creation and bulk admin. NOT a second browser.

  THE GRID THAT USED TO BE HERE
  -----------------------------
  The Library tab rendered its own `<article v-for="facet in filteredFacets">`
  card grid over all ~1611 rows, with artwork, badges and descriptions -- a
  second Facet browser on the same route as the real one. Its only click target
  was toggleEdit(), which expanded an editor INSIDE the grid cell, and no card
  linked to the canonical Facet profile: the file contained no router.push, no
  NuxtLink and no openFacet at all.

  Silas spotted it by eye after two automated passes had reported the gallery
  work finished, because every check keyed on components NAMED *-gallery and
  this one was called facet-manager. His call, 2026-08-06: retire the grid,
  edit from the profile.

  Selection now belongs to the gallery alone, and editing lives in
  facet-interact's `#detail` slot -- which means a Facet under edit has a URL
  (`?facet=<slug>`) that can be linked, bookmarked and back-buttoned, instead
  of being a cell that grew.

  What stays here is what was never browsing: creating a canonical Facet, and
  the filters that scope the create/admin view. Archive and restore moved with
  the editor, since they act on one chosen Facet.
-->
<template>
  <kr-manager
    dashboard-key="facets"
    :loading="facetStore.loading"
    :error="errorMessage || null"
    loading-label="Loading facets..."
    :panel-tabs="['library']"
    @refresh="loadFacets"
  >
    <template #gallery>
      <facet-interact class="h-full min-h-0 flex-1">
        <template #detail="{ facet }">
          <facet-editor :facet-id="facet.id" />
        </template>
      </facet-interact>
    </template>

    <template #library>
      <details
        class="kr-panel-flat"
        :open="createOpen"
      >
        <summary
          class="cursor-pointer px-4 py-3 text-sm font-bold text-base-content/70"
          @click.prevent="createOpen = !createOpen"
        >
          + Create a canonical Facet
        </summary>
        <div class="space-y-4 border-t border-base-300 p-4">
          <FacetProfileEditor v-model="createForm" />
          <button
            type="button"
            class="btn btn-secondary btn-sm w-full rounded-xl"
            :disabled="!createForm.title.trim() || facetStore.saving"
            @click="createFacet"
          >
            <span
              v-if="facetStore.saving"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:plus" class="size-3.5" />
            Create canonical Facet
          </button>
        </div>
      </details>

      <!--
        A COUNT, not a grid. The taxonomy breakdown is what the Library tab was
        genuinely for -- knowing the catalog's shape before adding to it -- and
        it was buried under 1611 cards. Browsing is one click away on the
        Gallery tab, which is the only place that draws Facets.
      -->
      <dl
        class="mt-4 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(min(12rem,100%),1fr))]"
      >
        <div
          v-for="taxonomy in populatedTaxonomies"
          :key="taxonomy"
          class="flex items-center justify-between rounded-xl border border-base-300 bg-base-100 px-3 py-2"
        >
          <dt class="truncate text-sm">{{ taxonomyLabel(taxonomy) }}</dt>
          <dd class="badge badge-ghost badge-sm shrink-0">
            {{ taxonomyCounts[taxonomy] || 0 }}
          </dd>
        </div>
      </dl>

      <p class="mt-4 text-xs text-base-content/50">
        {{ facetStore.facets.length }} canonical Facets ·
        {{
          facetStore.facets.length - facetStore.activeFacets.length
        }}
        archived. Open a Facet from the Gallery tab to edit, archive or restore
        it.
      </p>
    </template>
  </kr-manager>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFacetStore } from '@/stores/facetStore'
import {
  FACET_TAXONOMIES,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import {
  blankFacetProfileForm,
  facetProfilePayload,
  type FacetProfileForm,
} from '@/utils/facetProfileForm'

const route = useRoute()
const router = useRouter()

const facetStore = useFacetStore()
const errorMessage = ref('')
const createOpen = ref(false)
const createForm = ref<FacetProfileForm>(blankFacetProfileForm())

const taxonomyCounts = computed(() => {
  const counts: Partial<Record<FacetTaxonomy, number>> = {}
  for (const facet of facetStore.facets) {
    counts[facet.taxonomy] = (counts[facet.taxonomy] || 0) + 1
  }
  return counts
})

const populatedTaxonomies = computed(() =>
  FACET_TAXONOMIES.filter((taxonomy) => taxonomyCounts.value[taxonomy]),
)

async function loadFacets(): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.fetchFacets({ includeInactive: true, includeMature: true })
  } catch (error) {
    setError(error, 'Facets could not be loaded.')
  }
}

onMounted(loadFacets)

/*
 * One-shot deep link from facet-interact's gallery-view "+ New Facet"
 * affordance (t-081): the Gallery tab is read-only by contract, so it
 * switches here via navStore and flags ?create=1 to pre-expand the create
 * form instead of landing a visitor on a collapsed <details> with no hint
 * it's there. Cleared immediately so it doesn't re-fire on a later
 * same-tab navigation or survive a bookmark/share of the URL.
 */
watch(
  () => route.query.create,
  (value) => {
    if (value !== '1') return
    createOpen.value = true
    const query = { ...route.query }
    delete query.create
    void router.replace({ query })
  },
  { immediate: true },
)

function taxonomyLabel(taxonomy: FacetTaxonomy): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function setError(error: unknown, fallback: string): void {
  errorMessage.value = error instanceof Error ? error.message : fallback
}

async function createFacet(): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.createFacet(facetProfilePayload(createForm.value))
    createForm.value = blankFacetProfileForm()
    createOpen.value = false
  } catch (error) {
    setError(error, 'Facet could not be created.')
  }
}
</script>
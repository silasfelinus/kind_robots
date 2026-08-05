<!-- /components/facets/facet-interact.vue -->
<!--
  The Facet working surface, and the tier Facets was missing.

  Every other model follows the same shape -- content/<model>.md mounts
  :<model>-manager, which routes to <model>-interact, which shows a gallery until
  you pick something and a workspace once you have:

    bot-interact    <bot-gallery   v-if="!botStore.currentBot">   ... else the chat
    dream-interact  <dream-gallery v-if="!selectedDream">  <dream-workspace v-else>

  Facets had neither tier. facet-manager rendered all ~1611 rows itself and
  expanded an editor INSIDE the grid cell, which is why selecting one felt wrong
  and why /facets scored 3/10 on review while Dreams, which follows the pattern,
  scored 7.5.

  Selection lives in the URL rather than in local state, per the house rule that
  every view is linkable (the same shape as /storybook?story=...). That also
  means the browser back button does the obvious thing, which was the other half
  of what made the inline editor feel wrong.
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

  <section v-else class="kr-surface">
    <header
      class="kr-toolbar shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl"
        @click="closeFacet"
      >
        <Icon name="kind-icon:chevron-left" class="size-4" /> All Facets
      </button>

      <div class="min-w-0 flex-1">
        <p class="truncate font-black">{{ selectedFacet.title }}</p>
        <p class="truncate text-xs text-base-content/55">
          {{ taxonomyLabel(selectedFacet.taxonomy) }}
          <template v-if="selectedFacet.groupLabel">
            · {{ selectedFacet.groupLabel }}
          </template>
        </p>
      </div>

      <span class="badge badge-outline badge-sm shrink-0">
        {{ selectedFacet.canonicalValue }}
      </span>
    </header>

    <div class="kr-scroll space-y-4">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <kr-art-plate
          :source="selectedFacet"
          variant="card"
          shape="card"
          :alt="`${selectedFacet.title} artwork`"
          :placeholder-icon="iconName(selectedFacet)"
        />

        <div class="space-y-3">
          <p v-if="selectedFacet.description" class="kr-prose leading-relaxed">
            {{ selectedFacet.description }}
          </p>
          <p
            v-if="selectedFacet.flavorText"
            class="kr-prose italic text-base-content/65"
          >
            {{ selectedFacet.flavorText }}
          </p>

          <div
            v-if="selectedFacet.aliases.length"
            class="flex flex-wrap gap-1.5"
          >
            <span
              v-for="alias in selectedFacet.aliases"
              :key="alias"
              class="badge badge-ghost badge-sm"
            >
              {{ alias }}
            </span>
          </div>

          <div class="flex flex-wrap gap-1.5 text-xs">
            <span class="badge badge-sm"
              >order {{ selectedFacet.sortOrder }}</span
            >
            <span class="badge badge-sm"
              >weight {{ selectedFacet.randomWeight }}</span
            >
            <span v-if="selectedFacet.isRandomizable" class="badge badge-sm">
              randomizable
            </span>
            <span
              v-if="selectedFacet.artRequired"
              class="badge badge-warning badge-sm"
            >
              art expected
            </span>
          </div>
        </div>
      </div>

      <slot name="detail" :facet="selectedFacet" />
    </div>
  </section>
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

function closeFacet(): void {
  const query = { ...route.query }
  delete query.facet
  void router.push({ query })
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

function taxonomyLabel(taxonomy: string): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function iconName(facet: FacetCatalogEntry): string {
  const icon = facet.icon?.trim()
  return icon && icon.includes(':') ? icon : 'kind-icon:tag'
}

/*
 * The gallery fetches the catalog on mount, but a deep link to ?facet=<slug>
 * renders the detail branch instead and would otherwise resolve against an empty
 * store -- landing the visitor back on the gallery for a link that was perfectly
 * valid. fetchCatalog no-ops once loaded, so this costs nothing on the normal
 * browse-then-select path.
 */
onMounted(() => {
  if (!catalog.loaded) void catalog.fetchCatalog()
})
</script>

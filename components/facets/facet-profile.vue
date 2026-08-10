<!-- /components/facets/facet-profile.vue -->
<!--
  The Facet detail/profile surface: art, description, badges, and (per
  Silas, 2026-08-06) a link out to Storybook instead of a conversation of
  its own, since a Facet is a tool that feeds other interactions rather
  than something a visitor talks to.

  Split out of facet-interact.vue so the router stays a router (Rule 5 in
  utils/scripts/verifyRouteGalleryContract.ts) -- mirrors
  dream-interact/dream-narration and reward-interact/reward-encounter.
-->
<template>
  <section v-if="selectedFacet" class="kr-surface">
    <header class="kr-toolbar shrink-0 kr-panel-flat p-3">
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

      <button
        type="button"
        class="btn btn-primary btn-sm shrink-0 rounded-xl"
        title="Start a Storybook story seeded with this Facet"
        @click="startStoryWithFacet"
      >
        <Icon name="kind-icon:book-open" class="size-3.5" />
        <span class="hidden sm:inline">Start a story with this</span>
      </button>
    </header>

    <div class="kr-scroll space-y-4">
      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4"
      >
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useFacetCatalogStore,
  type FacetCatalogEntry,
} from '@/stores/facetCatalogStore'

const route = useRoute()
const router = useRouter()
const catalog = useFacetCatalogStore()

/* Resolved from the URL, same as facet-interact's own selection. This
   component only ever mounts once facet-interact has picked a Facet, but
   stays null-safe (the v-if above) since navigation can clear the query
   out from under it before the parent unmounts this one. */
const selectedFacet = computed<FacetCatalogEntry | null>(() => {
  const slug = route.query.facet
  if (typeof slug !== 'string' || !slug) return null
  return catalog.entries.find((entry) => entry.slug === slug) ?? null
})

function closeFacet(): void {
  const query = { ...route.query }
  delete query.facet
  void router.push({ query })
}

/*
 * Facets are a tool that feeds other interactions rather than something a
 * visitor talks to directly (Silas: Facets and Rewards should link out to
 * Storybook instead of growing their own conversation). storybook-page.vue's
 * seedFromQuery() reads ?facet=<slug> and adds it to the setup draft's
 * facetSlugs on top of whatever draft is already restored, so this never
 * destroys a story in progress.
 */
function startStoryWithFacet(): void {
  if (!selectedFacet.value?.slug) return
  void navigateTo({
    path: '/storybook',
    query: { facet: selectedFacet.value.slug },
  })
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
</script>
<!-- /components/facets/facet-editor.vue -->
<!--
  The per-Facet editing surface, extracted from facet-manager's Library grid.

  WHY IT MOVED
  ------------
  /facets used to render TWO Facet browsers. The Gallery tab went through
  facet-gallery -> kr-gallery; the Library tab drew its own
  `<article v-for="facet in filteredFacets">` card grid over all ~1611 rows,
  whose only click target expanded this editor INSIDE the grid cell. Nothing in
  that grid linked to the canonical Facet profile -- no router.push, no
  NuxtLink, no openFacet anywhere in the file.

  facet-interact.vue's own header comment already described that arrangement in
  the past tense ("facet-manager rendered all ~1611 rows itself and expanded an
  editor INSIDE the grid cell, which is why selecting one felt wrong"). It was
  still doing it: the interact tier had been added BESIDE the old browser
  rather than in place of it.

  Silas, 2026-08-06, choosing between converting that grid and deleting it:
  retire the grid, edit from the profile.

  So selection now belongs to ONE browser -- the gallery -- and this component
  fills facet-interact's `#detail` slot, which was already in the file waiting
  for exactly this. Editing a Facet is therefore a linkable, bookmarkable,
  back-buttonable `?facet=<slug>` rather than a cell that grew.

  This is a plain editor over a facet id: it owns the form, the save, and the
  archive/restore, and nothing about which Facet is chosen.

  BY ID, not by record, because the two stores carry two shapes of the same
  row. facet-interact selects from facetCatalogStore (FacetCatalogEntry, the
  read-only catalog projection) while editing needs facetStore's
  FacetWithAliases. Both are the same `Facet.id`, so resolving here keeps the
  caller from having to hold both stores just to open an editor.
-->
<template>
  <section v-if="facet" class="space-y-4">
    <FacetProfileEditor v-model="editForm" />

    <EntityArtManager
      entity-type="facet"
      :entity="facet"
      :slots="[
        {
          field: 'imagePath',
          label: 'Image',
          aspect: '1 / 1',
          width: 1024,
          height: 1024,
        },
        {
          field: 'iconPath',
          label: 'Icon',
          aspect: '1 / 1',
          width: 256,
          height: 256,
        },
        {
          field: 'cardPath',
          label: 'Card',
          aspect: '2 / 3',
          width: 512,
          height: 768,
        },
        {
          field: 'heroPath',
          label: 'Hero',
          aspect: '16 / 9',
          width: 1280,
          height: 720,
        },
      ]"
    />

    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-secondary btn-sm flex-1 rounded-xl"
        :disabled="!editForm.title.trim() || facetStore.saving"
        @click="save"
      >
        <span
          v-if="facetStore.saving"
          class="loading loading-spinner loading-xs"
        />
        Save canonical profile
      </button>

      <button
        v-if="facet.isActive"
        type="button"
        class="btn btn-outline btn-error btn-sm rounded-xl"
        :disabled="facetStore.saving"
        @click="archive"
      >
        Archive
      </button>
      <button
        v-else
        type="button"
        class="btn btn-outline btn-sm rounded-xl"
        :disabled="facetStore.saving"
        @click="restore"
      >
        Restore
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'
import {
  blankFacetProfileForm,
  facetProfilePayload,
  facetToProfileForm,
  type FacetProfileForm,
} from '@/utils/facetProfileForm'

const props = defineProps<{ facetId: number }>()

const facetStore = useFacetStore()
const errorMessage = ref('')
const editForm = ref<FacetProfileForm>(blankFacetProfileForm())

/*
 * The editable record. facetStore is loaded by the Library tab's fetch, so a
 * deep link straight to ?facet=<slug> can arrive before it resolves -- hence
 * the `v-if` above rather than a non-null assertion.
 */
const facet = computed<FacetWithAliases | null>(
  () => facetStore.facets.find((entry) => entry.id === props.facetId) ?? null,
)

/*
 * Reload the form whenever the selected Facet changes. Selection lives in the
 * URL (`?facet=<slug>`), so this fires on back/forward too -- an editor that
 * only seeded on mount would show the previous Facet's values after a
 * navigation that never unmounted it.
 */
watch(
  facet,
  (current) => {
    if (!current) return
    editForm.value = facetToProfileForm(current)
    errorMessage.value = ''
  },
  { immediate: true },
)

function setError(error: unknown, fallback: string): void {
  errorMessage.value = error instanceof Error ? error.message : fallback
}

async function save(): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(
      props.facetId,
      facetProfilePayload(editForm.value),
    )
  } catch (error) {
    setError(error, 'Facet could not be saved.')
  }
}

async function archive(): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.archiveFacet(props.facetId)
  } catch (error) {
    setError(error, 'Facet could not be archived.')
  }
}

async function restore(): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(props.facetId, { isActive: true })
  } catch (error) {
    setError(error, 'Facet could not be restored.')
  }
}
</script>

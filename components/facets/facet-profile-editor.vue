<!-- /components/facets/facet-profile-editor.vue -->
<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <label class="form-control xl:col-span-2">
        <span class="label-text text-xs">Canonical title</span>
        <input
          v-model="form.title"
          type="text"
          class="input input-bordered input-sm rounded-xl"
          placeholder="CowCore"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Canonical value</span>
        <input
          v-model="form.canonicalValue"
          type="text"
          class="input input-bordered input-sm rounded-xl"
          placeholder="Defaults to title"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Taxonomy</span>
        <select
          v-model="form.taxonomy"
          class="select select-bordered select-sm rounded-xl"
        >
          <option
            v-for="taxonomy in FACET_TAXONOMIES"
            :key="taxonomy"
            :value="taxonomy"
          >
            {{ taxonomyLabel(taxonomy) }}
          </option>
        </select>
      </label>
      <label class="form-control sm:col-span-2 xl:col-span-4">
        <span class="label-text text-xs">Aliases</span>
        <input
          v-model="form.aliases"
          type="text"
          class="input input-bordered input-sm rounded-xl"
          placeholder="Aliases separated by commas"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Group key</span>
        <input
          v-model="form.groupKey"
          type="text"
          class="input input-bordered input-sm rounded-xl"
          placeholder="cosmic-species"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Group label</span>
        <input
          v-model="form.groupLabel"
          type="text"
          class="input input-bordered input-sm rounded-xl"
          placeholder="Cosmic Species"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Sort order</span>
        <input
          v-model.number="form.sortOrder"
          type="number"
          step="1"
          class="input input-bordered input-sm rounded-xl"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Source rank</span>
        <input
          v-model.number="form.sourceRank"
          type="number"
          min="0"
          step="1"
          class="input input-bordered input-sm rounded-xl"
        />
      </label>
      <label class="form-control">
        <span class="label-text text-xs">Random weight</span>
        <input
          v-model.number="form.randomWeight"
          type="number"
          min="0"
          step="0.1"
          class="input input-bordered input-sm rounded-xl"
        />
      </label>
      <label class="form-control sm:col-span-2 xl:col-span-3">
        <span class="label-text text-xs">Description</span>
        <textarea
          v-model="form.description"
          class="textarea textarea-bordered min-h-24 rounded-xl"
          placeholder="What this reusable concept means..."
        />
      </label>
      <label class="form-control sm:col-span-2 xl:col-span-4">
        <span class="label-text text-xs">Structured metadata (JSON object)</span>
        <textarea
          v-model="form.metadata"
          class="textarea textarea-bordered min-h-28 rounded-xl font-mono text-xs"
          placeholder='{"scientificName":"...","source":"curated"}'
        />
      </label>
    </div>

    <section class="rounded-2xl border border-base-300 bg-base-200/60 p-3">
      <div class="mb-3 flex items-center gap-2">
        <Icon name="kind-icon:palette" class="size-4 text-accent" />
        <div>
          <h3 class="text-sm font-bold">Curated artwork</h3>
          <p class="text-xs text-base-content/50">
            Preserve primary, portrait/card, and hero/wide roles separately.
          </p>
        </div>
      </div>
      <div class="grid gap-3 lg:grid-cols-[12rem_1fr]">
        <div
          class="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-base-300/50"
        >
          <img
            v-if="previewPath"
            :src="previewPath"
            :alt="`${form.title || 'Facet'} artwork preview`"
            class="size-full object-contain"
          />
          <Icon v-else name="kind-icon:image" class="size-9 text-base-content/20" />
        </div>
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <label class="form-control">
            <span class="label-text text-xs">Primary image path</span>
            <input
              v-model="form.imagePath"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="/images/facets/example.webp"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Icon / logo path</span>
            <input
              v-model="form.iconPath"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="/images/facets/icons/example.webp"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Card / portrait path</span>
            <input
              v-model="form.cardPath"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="/images/facets/cards/example.webp"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Hero / wide path</span>
            <input
              v-model="form.heroPath"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="/images/facets/heroes/example.webp"
            />
          </label>
          <label class="form-control sm:col-span-2 xl:col-span-3">
            <span class="label-text text-xs">Art prompt</span>
            <textarea
              v-model="form.artPrompt"
              class="textarea textarea-bordered min-h-24 rounded-xl"
              placeholder="Prompt for generating or regenerating this artwork..."
            />
          </label>
        </div>
      </div>
    </section>

    <div class="flex flex-wrap items-center gap-5 text-xs">
      <label class="flex items-center gap-2">
        <input
          v-model="form.isRandomizable"
          type="checkbox"
          class="toggle toggle-secondary toggle-xs"
        />
        Available to randomizers
      </label>
      <label class="flex items-center gap-2">
        <input
          v-model="form.artRequired"
          type="checkbox"
          class="toggle toggle-accent toggle-xs"
        />
        Artwork expected
      </label>
      <label class="flex items-center gap-2">
        <input
          v-model="form.isPublic"
          type="checkbox"
          class="toggle toggle-primary toggle-xs"
        />
        Public
      </label>
      <!--
        Facet has carried allowReviews since it was created, but no surface
        could set it (server/api/facets/[id].patch.ts already accepted the
        field), so a Facet owner who wanted comments off had no way to say so.
        Rendered as a form checkbox rather than ui/allow-reviews-toggle.vue
        because this editor saves a whole FacetProfileForm on submit, while
        that component is a save-on-click button for the edit surfaces that
        PATCH one field at a time.
      -->
      <label class="flex items-center gap-2">
        <input
          v-model="form.allowReviews"
          type="checkbox"
          class="toggle toggle-accent toggle-xs"
        />
        Allow reviews
      </label>
      <label class="flex items-center gap-2">
        <input
          v-model="form.isMature"
          type="checkbox"
          class="toggle toggle-warning toggle-xs"
        />
        Mature
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FACET_TAXONOMIES, type FacetTaxonomy } from '@/stores/facetCatalogStore'
import type { FacetProfileForm } from '@/utils/facetProfileForm'

const form = defineModel<FacetProfileForm>({ required: true })
const previewPath = computed(
  () => form.value.cardPath.trim() || form.value.imagePath.trim() || form.value.heroPath.trim(),
)

function taxonomyLabel(taxonomy: FacetTaxonomy): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>

<!-- /components/facets/facet-manager.vue -->
<template>
  <section class="mx-auto w-full max-w-7xl space-y-4 p-4">
    <header
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <Icon name="kind-icon:tag" class="size-6 text-secondary" />
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-black">Facet Library</h1>
        <p class="text-sm text-base-content/60">
          Complete canonical profiles for reusable concepts across Characters,
          Dreams, Rewards, Scenarios, art, and random generation.
        </p>
      </div>
      <span v-if="facetStore.loading" class="loading loading-spinner loading-sm" />
      <span class="badge badge-ghost">{{ filteredFacets.length }} shown</span>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full max-w-sm rounded-xl bg-base-200"
        placeholder="Search title, alias, taxonomy, metadata, or art path..."
      />
      <select
        v-model="taxonomyFilter"
        class="select select-bordered select-sm rounded-xl"
      >
        <option :value="null">All taxonomies</option>
        <option
          v-for="taxonomy in facetTaxonomies"
          :key="taxonomy"
          :value="taxonomy"
        >
          {{ taxonomyLabel(taxonomy) }} ({{ taxonomyCounts[taxonomy] || 0 }})
        </option>
      </select>
      <label class="ml-auto flex items-center gap-2 text-xs text-base-content/60">
        <input
          v-model="showArchived"
          type="checkbox"
          class="toggle toggle-secondary toggle-xs"
        />
        Show archived
      </label>
    </div>

    <details
      class="rounded-2xl border border-base-300 bg-base-100"
      :open="createOpen"
    >
      <summary
        class="cursor-pointer px-4 py-3 text-sm font-bold text-base-content/70"
        @click.prevent="createOpen = !createOpen"
      >
        + Create a canonical Facet
      </summary>

      <div class="space-y-4 border-t border-base-300 p-4">
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label class="form-control xl:col-span-2">
            <span class="label-text text-xs">Canonical title</span>
            <input
              v-model="createForm.title"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="CowCore"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Canonical value</span>
            <input
              v-model="createForm.canonicalValue"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Defaults to title"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Taxonomy</span>
            <select
              v-model="createForm.taxonomy"
              class="select select-bordered select-sm rounded-xl"
            >
              <option
                v-for="taxonomy in facetTaxonomies"
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
              v-model="createForm.aliases"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Aliases separated by commas"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Group key</span>
            <input
              v-model="createForm.groupKey"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="cosmic-species"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Group label</span>
            <input
              v-model="createForm.groupLabel"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Cosmic Species"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Sort order</span>
            <input
              v-model.number="createForm.sortOrder"
              type="number"
              step="1"
              class="input input-bordered input-sm rounded-xl"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Source rank</span>
            <input
              v-model.number="createForm.sourceRank"
              type="number"
              min="0"
              step="1"
              class="input input-bordered input-sm rounded-xl"
            />
          </label>
          <label class="form-control">
            <span class="label-text text-xs">Random weight</span>
            <input
              v-model.number="createForm.randomWeight"
              type="number"
              min="0"
              step="0.1"
              class="input input-bordered input-sm rounded-xl"
            />
          </label>
          <label class="form-control sm:col-span-2 xl:col-span-3">
            <span class="label-text text-xs">Description</span>
            <textarea
              v-model="createForm.description"
              class="textarea textarea-bordered min-h-20 rounded-xl"
              placeholder="What this reusable concept means..."
            />
          </label>
          <label class="form-control sm:col-span-2 xl:col-span-4">
            <span class="label-text text-xs">Structured metadata (JSON object)</span>
            <textarea
              v-model="createForm.metadata"
              class="textarea textarea-bordered min-h-24 rounded-xl font-mono text-xs"
              placeholder='{"scientificName":"...","source":"curated"}'
            />
          </label>
        </div>

        <artwork-fields
          :title="createForm.title || 'New Facet'"
          v-model:image-path="createForm.imagePath"
          v-model:card-path="createForm.cardPath"
          v-model:hero-path="createForm.heroPath"
          v-model:art-prompt="createForm.artPrompt"
        />

        <div class="flex flex-wrap items-center gap-5 text-xs">
          <label class="flex items-center gap-2">
            <input
              v-model="createForm.isRandomizable"
              type="checkbox"
              class="toggle toggle-secondary toggle-xs"
            />
            Available to randomizers
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="createForm.artRequired"
              type="checkbox"
              class="toggle toggle-accent toggle-xs"
            />
            Artwork expected
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="createForm.isPublic"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
            />
            Public
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="createForm.isMature"
              type="checkbox"
              class="toggle toggle-warning toggle-xs"
            />
            Mature
          </label>
        </div>

        <button
          type="button"
          class="btn btn-secondary btn-sm w-full rounded-xl"
          :disabled="!createForm.title.trim() || facetStore.saving"
          @click="createFacet"
        >
          <span v-if="facetStore.saving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:plus" class="size-3.5" />
          Create canonical Facet
        </button>
      </div>
    </details>

    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="facet in filteredFacets"
        :key="facet.id"
        class="overflow-hidden rounded-2xl border bg-base-100 transition-all"
        :class="[
          facet.isActive ? 'border-base-300' : 'border-error/40 opacity-60',
          editingId === facet.id ? 'ring-2 ring-secondary/60' : '',
        ]"
      >
        <div
          v-if="facetArtwork(facet)"
          class="flex h-44 items-center justify-center bg-base-200"
        >
          <img
            :src="facetArtwork(facet) || ''"
            :alt="`${facet.title} curated artwork`"
            class="size-full object-contain"
            loading="lazy"
          />
        </div>

        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1">
                <span class="badge badge-secondary badge-xs">
                  {{ taxonomyLabel(facet.taxonomy) }}
                </span>
                <span v-if="facet.groupLabel" class="badge badge-outline badge-xs">
                  {{ facet.groupLabel }}
                </span>
                <span v-if="!facet.isActive" class="badge badge-error badge-xs">
                  archived
                </span>
                <span v-if="!facet.isPublic" class="badge badge-ghost badge-xs">
                  private
                </span>
              </div>
              <h2 class="mt-1 truncate text-base font-bold">{{ facet.title }}</h2>
              <p class="truncate text-xs text-base-content/40">
                {{ facet.canonicalValue }} · {{ facet.aliases.join(' · ') }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              :aria-label="editingId === facet.id ? 'Close editor' : `Edit ${facet.title}`"
              @click="toggleEdit(facet)"
            >
              <Icon
                :name="editingId === facet.id ? 'kind-icon:x' : 'kind-icon:pencil'"
                class="size-4"
              />
            </button>
          </div>

          <template v-if="editingId !== facet.id">
            <p
              v-if="facet.description"
              class="mt-2 line-clamp-3 text-xs text-base-content/60"
            >
              {{ facet.description }}
            </p>
            <p
              v-if="facet.artPrompt"
              class="mt-2 line-clamp-2 text-[11px] italic text-base-content/45"
            >
              {{ facet.artPrompt }}
            </p>
            <div class="mt-3 flex flex-wrap gap-1 text-[11px]">
              <span class="badge badge-ghost badge-xs">order {{ facet.sortOrder }}</span>
              <span class="badge badge-ghost badge-xs">weight {{ facet.randomWeight }}</span>
              <span class="badge badge-ghost badge-xs">rank {{ facet.sourceRank }}</span>
              <span class="badge badge-ghost badge-xs">
                {{ facet.isRandomizable ? 'randomizable' : 'manual only' }}
              </span>
              <span class="badge badge-ghost badge-xs">
                {{ facet.artRequired ? 'art expected' : 'art optional' }}
              </span>
              <span v-if="facet.metadata" class="badge badge-ghost badge-xs">
                metadata
              </span>
            </div>

            <div
              v-if="facet.artRequired && !facetArtwork(facet)"
              class="mt-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-2"
            >
              <button
                type="button"
                class="btn btn-outline btn-accent btn-xs w-full rounded-lg"
                :disabled="artRequestStore.requesting[facet.id]"
                @click="requestArt(facet)"
              >
                <span
                  v-if="artRequestStore.requesting[facet.id]"
                  class="loading loading-spinner loading-xs"
                />
                <Icon v-else name="kind-icon:palette" class="size-3.5" />
                {{
                  artRequestStore.requested[facet.id]
                    ? 'Artwork requested'
                    : 'Request primary artwork'
                }}
              </button>
              <p
                v-if="artRequestStore.errors[facet.id]"
                class="mt-1 text-[11px] text-error"
              >
                {{ artRequestStore.errors[facet.id] }}
              </p>
            </div>
          </template>

          <div
            v-else
            class="mt-3 grid gap-2 sm:grid-cols-2"
          >
            <input
              v-model="editForm.title"
              type="text"
              class="input input-bordered input-sm rounded-xl sm:col-span-2"
              placeholder="Title"
            />
            <input
              v-model="editForm.canonicalValue"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Canonical value"
            />
            <select
              v-model="editForm.taxonomy"
              class="select select-bordered select-sm rounded-xl"
            >
              <option
                v-for="taxonomy in facetTaxonomies"
                :key="taxonomy"
                :value="taxonomy"
              >
                {{ taxonomyLabel(taxonomy) }}
              </option>
            </select>
            <input
              v-model="editForm.aliases"
              type="text"
              class="input input-bordered input-sm rounded-xl sm:col-span-2"
              placeholder="Aliases, comma separated"
            />
            <input
              v-model="editForm.groupKey"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Group key"
            />
            <input
              v-model="editForm.groupLabel"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Group label"
            />
            <label class="form-control">
              <span class="label-text text-[11px]">Sort order</span>
              <input
                v-model.number="editForm.sortOrder"
                type="number"
                step="1"
                class="input input-bordered input-sm rounded-xl"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-[11px]">Source rank</span>
              <input
                v-model.number="editForm.sourceRank"
                type="number"
                min="0"
                step="1"
                class="input input-bordered input-sm rounded-xl"
              />
            </label>
            <label class="form-control sm:col-span-2">
              <span class="label-text text-[11px]">Random weight</span>
              <input
                v-model.number="editForm.randomWeight"
                type="number"
                min="0"
                step="0.1"
                class="input input-bordered input-sm rounded-xl"
              />
            </label>
            <textarea
              v-model="editForm.description"
              class="textarea textarea-bordered min-h-20 rounded-xl sm:col-span-2"
              placeholder="Description"
            />
            <textarea
              v-model="editForm.metadata"
              class="textarea textarea-bordered min-h-24 rounded-xl font-mono text-xs sm:col-span-2"
              placeholder="Structured metadata JSON object"
            />

            <div class="sm:col-span-2">
              <artwork-fields
                :title="editForm.title || facet.title"
                v-model:image-path="editForm.imagePath"
                v-model:card-path="editForm.cardPath"
                v-model:hero-path="editForm.heroPath"
                v-model:art-prompt="editForm.artPrompt"
                compact
              />
            </div>

            <div class="flex flex-wrap gap-4 text-xs sm:col-span-2">
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.isRandomizable"
                  type="checkbox"
                  class="toggle toggle-secondary toggle-xs"
                />
                Randomizable
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.artRequired"
                  type="checkbox"
                  class="toggle toggle-accent toggle-xs"
                />
                Art expected
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-secondary toggle-xs"
                />
                Public
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning toggle-xs"
                />
                Mature
              </label>
            </div>

            <div class="flex gap-2 sm:col-span-2">
              <button
                type="button"
                class="btn btn-secondary btn-sm flex-1 rounded-xl"
                :disabled="!editForm.title.trim() || facetStore.saving"
                @click="saveEdit(facet.id)"
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
                @click="archive(facet.id)"
              >
                Archive
              </button>
              <button
                v-else
                type="button"
                class="btn btn-outline btn-sm rounded-xl"
                :disabled="facetStore.saving"
                @click="restore(facet.id)"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <p
      v-if="!facetStore.loading && !filteredFacets.length"
      class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50"
    >
      No Facets match these filters.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import type { FacetKind } from '~/prisma/generated/prisma/client'
import { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'
import {
  FACET_TAXONOMIES,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { useFacetArtRequestStore } from '@/stores/facetArtRequestStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

const ArtworkFields = defineComponent({
  name: 'ArtworkFields',
  props: {
    title: { type: String, required: true },
    imagePath: { type: String, required: true },
    cardPath: { type: String, required: true },
    heroPath: { type: String, required: true },
    artPrompt: { type: String, required: true },
    compact: { type: Boolean, default: false },
  },
  emits: [
    'update:imagePath',
    'update:cardPath',
    'update:heroPath',
    'update:artPrompt',
  ],
  setup(props, { emit }) {
    const preview = computed(
      () => props.cardPath.trim() || props.imagePath.trim() || props.heroPath.trim(),
    )
    const input = (
      label: string,
      value: string,
      event: string,
      placeholder: string,
    ) =>
      h('label', { class: 'form-control' }, [
        h('span', { class: 'label-text text-xs' }, label),
        h('input', {
          value,
          type: 'text',
          class: 'input input-bordered input-sm rounded-xl',
          placeholder,
          onInput: (inputEvent: Event) =>
            emit(event, (inputEvent.target as HTMLInputElement).value),
        }),
      ])

    return () =>
      h(
        'div',
        {
          class:
            'rounded-2xl border border-base-300 bg-base-200/60 p-3',
        },
        [
          h('div', { class: 'mb-3 flex items-center gap-2' }, [
            h(resolveIcon(), {
              name: 'kind-icon:palette',
              class: 'size-4 text-accent',
            }),
            h('div', [
              h('h3', { class: 'text-sm font-bold' }, 'Curated artwork'),
              h(
                'p',
                { class: 'text-xs text-base-content/50' },
                'Preserve primary, portrait/card, and hero/wide roles separately.',
              ),
            ]),
          ]),
          h(
            'div',
            {
              class: props.compact
                ? 'grid gap-3'
                : 'grid gap-3 lg:grid-cols-[12rem_1fr]',
            },
            [
              h(
                'div',
                {
                  class:
                    'flex h-36 items-center justify-center overflow-hidden rounded-xl bg-base-300/50',
                },
                preview.value
                  ? [
                      h('img', {
                        src: preview.value,
                        alt: `${props.title} artwork preview`,
                        class: 'size-full object-contain',
                        loading: 'lazy',
                      }),
                    ]
                  : [
                      h(resolveIcon(), {
                        name: 'kind-icon:image',
                        class: 'size-9 text-base-content/20',
                      }),
                    ],
              ),
              h('div', { class: 'grid gap-2 sm:grid-cols-2 xl:grid-cols-3' }, [
                input(
                  'Primary image path',
                  props.imagePath,
                  'update:imagePath',
                  '/images/facets/example.webp',
                ),
                input(
                  'Card / portrait path',
                  props.cardPath,
                  'update:cardPath',
                  '/images/facets/cards/example.webp',
                ),
                input(
                  'Hero / wide path',
                  props.heroPath,
                  'update:heroPath',
                  '/images/facets/heroes/example.webp',
                ),
                h('label', { class: 'form-control sm:col-span-2 xl:col-span-3' }, [
                  h('span', { class: 'label-text text-xs' }, 'Art prompt'),
                  h('textarea', {
                    value: props.artPrompt,
                    class: 'textarea textarea-bordered min-h-20 rounded-xl',
                    placeholder: 'Prompt for generating or regenerating this artwork...',
                    onInput: (event: Event) =>
                      emit(
                        'update:artPrompt',
                        (event.target as HTMLTextAreaElement).value,
                      ),
                  }),
                ]),
              ]),
            ],
          ),
        ],
      )
  },
})

function resolveIcon() {
  return resolveComponent('Icon')
}

const facetStore = useFacetStore()
const artRequestStore = useFacetArtRequestStore()
const facetTaxonomies = [...FACET_TAXONOMIES]
const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const showArchived = ref(false)
const errorMessage = ref('')
const editingId = ref<number | null>(null)
const createOpen = ref(false)

function blankForm() {
  return {
    title: '',
    canonicalValue: '',
    taxonomy: 'OTHER' as FacetTaxonomy,
    aliases: '',
    description: '',
    groupKey: '',
    groupLabel: '',
    sortOrder: 0,
    sourceRank: 100,
    metadata: '',
    imagePath: '',
    cardPath: '',
    heroPath: '',
    artPrompt: '',
    randomWeight: 1,
    isRandomizable: true,
    artRequired: true,
    isPublic: true,
    isMature: false,
  }
}

const createForm = reactive(blankForm())
const editForm = reactive(blankForm())

const broadKinds = new Set<FacetTaxonomy>([
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'OTHER',
])

function kindForTaxonomy(taxonomy: FacetTaxonomy): FacetKind {
  if (taxonomy === 'PROMPT_ENHANCEMENT') return 'ART_DIRECTION'
  return broadKinds.has(taxonomy) ? (taxonomy as FacetKind) : 'OTHER'
}

watch(
  () => createForm.taxonomy,
  (taxonomy) => {
    createForm.artRequired = taxonomy !== 'COLOR'
  },
)

const visibleFacets = computed(() =>
  showArchived.value ? facetStore.facets : facetStore.activeFacets,
)
const taxonomyCounts = computed(() => {
  const counts: Partial<Record<FacetTaxonomy, number>> = {}
  for (const facet of visibleFacets.value) {
    counts[facet.taxonomy] = (counts[facet.taxonomy] || 0) + 1
  }
  return counts
})
const filteredFacets = computed(() => {
  const needle = normalizeFacetLookupKey(search.value)
  return visibleFacets.value.filter((facet) => {
    if (taxonomyFilter.value && facet.taxonomy !== taxonomyFilter.value) return false
    if (!needle) return true
    const values = [
      facet.title,
      facet.canonicalValue,
      facet.slug,
      facet.taxonomy,
      facet.groupKey,
      facet.groupLabel,
      facet.imagePath,
      facet.cardPath,
      facet.heroPath,
      facet.artPrompt,
      facet.metadata ? JSON.stringify(facet.metadata) : '',
      ...facet.aliases,
    ]
    return values.some((value) =>
      normalizeFacetLookupKey(value || '').includes(needle),
    )
  })
})

onMounted(async () => {
  try {
    await facetStore.fetchFacets({ includeInactive: true, includeMature: true })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})

function taxonomyLabel(taxonomy: FacetTaxonomy): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function splitAliases(value: string): string[] {
  return value
    .split(',')
    .map((alias) => alias.trim())
    .filter(Boolean)
}

function facetArtwork(facet: FacetWithAliases): string | null {
  return facet.cardPath || facet.imagePath || facet.heroPath || null
}

function parseMetadata(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null
  const parsed = JSON.parse(value) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Structured metadata must be a JSON object.')
  }
  return parsed as Record<string, unknown>
}

function metadataText(value: Record<string, unknown> | null): string {
  return value ? JSON.stringify(value, null, 2) : ''
}

function toggleEdit(facet: FacetWithAliases) {
  if (editingId.value === facet.id) {
    editingId.value = null
    return
  }
  editingId.value = facet.id
  Object.assign(editForm, {
    title: facet.title,
    canonicalValue: facet.canonicalValue,
    taxonomy: facet.taxonomy,
    aliases: facet.aliases.filter((alias) => alias !== facet.slug).join(', '),
    description: facet.description || '',
    groupKey: facet.groupKey || '',
    groupLabel: facet.groupLabel || '',
    sortOrder: facet.sortOrder,
    sourceRank: facet.sourceRank,
    metadata: metadataText(facet.metadata),
    imagePath: facet.imagePath || '',
    cardPath: facet.cardPath || '',
    heroPath: facet.heroPath || '',
    artPrompt: facet.artPrompt || '',
    randomWeight: facet.randomWeight,
    isRandomizable: facet.isRandomizable,
    artRequired: facet.artRequired,
    isPublic: facet.isPublic,
    isMature: facet.isMature,
  })
}

async function createFacet() {
  errorMessage.value = ''
  try {
    await facetStore.createFacet({
      title: createForm.title.trim(),
      kind: kindForTaxonomy(createForm.taxonomy),
      taxonomy: createForm.taxonomy,
      canonicalValue:
        createForm.canonicalValue.trim() || createForm.title.trim() || null,
      aliases: splitAliases(createForm.aliases),
      description: createForm.description.trim() || null,
      groupKey: createForm.groupKey.trim() || null,
      groupLabel: createForm.groupLabel.trim() || null,
      sortOrder: Math.trunc(Number(createForm.sortOrder) || 0),
      sourceRank: Math.max(0, Math.trunc(Number(createForm.sourceRank) || 0)),
      metadata: parseMetadata(createForm.metadata),
      imagePath: createForm.imagePath.trim() || null,
      cardPath: createForm.cardPath.trim() || null,
      heroPath: createForm.heroPath.trim() || null,
      artPrompt: createForm.artPrompt.trim() || null,
      randomWeight: Math.max(0, Number(createForm.randomWeight) || 0),
      isRandomizable: createForm.isRandomizable,
      artRequired: createForm.artRequired,
      isPublic: createForm.isPublic,
      isMature: createForm.isMature,
    })
    Object.assign(createForm, blankForm())
    createOpen.value = false
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be created.'
  }
}

async function saveEdit(id: number) {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(id, {
      title: editForm.title.trim(),
      kind: kindForTaxonomy(editForm.taxonomy),
      taxonomy: editForm.taxonomy,
      canonicalValue: editForm.canonicalValue.trim() || editForm.title.trim(),
      aliases: splitAliases(editForm.aliases),
      description: editForm.description.trim() || null,
      groupKey: editForm.groupKey.trim() || null,
      groupLabel: editForm.groupLabel.trim() || null,
      sortOrder: Math.trunc(Number(editForm.sortOrder) || 0),
      sourceRank: Math.max(0, Math.trunc(Number(editForm.sourceRank) || 0)),
      metadata: parseMetadata(editForm.metadata),
      imagePath: editForm.imagePath.trim() || null,
      cardPath: editForm.cardPath.trim() || null,
      heroPath: editForm.heroPath.trim() || null,
      artPrompt: editForm.artPrompt.trim() || null,
      randomWeight: Math.max(0, Number(editForm.randomWeight) || 0),
      isRandomizable: editForm.isRandomizable,
      artRequired: editForm.artRequired,
      isPublic: editForm.isPublic,
      isMature: editForm.isMature,
    })
    editingId.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be saved.'
  }
}

async function requestArt(facet: FacetWithAliases) {
  errorMessage.value = ''
  const path = await artRequestStore.requestPrimaryArtwork(
    facet as FacetCatalogEntry,
  )
  if (!path && artRequestStore.errors[facet.id]) {
    errorMessage.value = artRequestStore.errors[facet.id] || 'Artwork request failed.'
  }
}

async function archive(id: number) {
  errorMessage.value = ''
  try {
    await facetStore.archiveFacet(id)
    editingId.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be archived.'
  }
}

async function restore(id: number) {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(id, { isActive: true })
    editingId.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be restored.'
  }
}
</script>

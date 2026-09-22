<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <header
        class="kr-toolbar flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p class="kr-text-eyebrow text-xs tracking-widest text-primary">
            Temporary catalog cleanup
          </p>
          <div class="kr-text-black-2xl mt-1">LoRA triage</div>
          <p class="kr-text-dim-sm mt-1 max-w-3xl">
            Confirm LoRAs as SFW or NSFW, and say what each one is FOR — a
            character, a style, a setting. The category is what the image
            generator rolls from, so an unclassified LoRA is one
            <span class="font-mono">{character}</span> can never pick. Save both
            in one pass; progress stays in this browser until then.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="kr-btn btn-outline"
            :disabled="triageStore.isSaving || loading"
            @click="refresh"
          >
            <span v-if="loading" class="kr-spinner-xs" />
            <Icon v-else name="kind-icon:refresh" class="kr-icon-4" />
            Refresh
          </button>
          <button
            v-if="triageStore.isRendering"
            type="button"
            class="kr-btn btn-outline"
            @click="triageStore.cancelRender()"
          >
            <Icon name="kind-icon:close" class="kr-icon-4" />
            Stop queueing
          </button>
          <button
            v-else
            type="button"
            class="kr-btn btn-outline"
            :disabled="loading || triageStore.missingPreviewCount === 0"
            @click="triageStore.renderPreviews()"
          >
            <Icon name="kind-icon:sparkles" class="kr-icon-4" />
            Render {{ triageStore.missingPreviewCount }} missing preview{{
              triageStore.missingPreviewCount === 1 ? '' : 's'
            }}
          </button>
          <button
            type="button"
            class="kr-btn-primary"
            :disabled="
              triageStore.isSaving || triageStore.pendingChanges.length === 0
            "
            @click="triageStore.saveChanges()"
          >
            <span v-if="triageStore.isSaving" class="kr-spinner-xs" />
            <Icon v-else name="kind-icon:save" class="kr-icon-4" />
            Save {{ triageStore.pendingChanges.length }} change{{
              triageStore.pendingChanges.length === 1 ? '' : 's'
            }}
          </button>
        </div>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel">
        <span class="kr-spinner-lg-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center font-normal"
      >
        <p class="kr-text-black-xl text-base-content">
          Administrator access required
        </p>
        <p class="kr-text-dim-sm mt-2">
          LoRA maturity triage is restricted to administrators.
        </p>
      </div>

      <template v-else>
        <section class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div class="kr-panel p-3">
            <p class="kr-text-eyebrow kr-text-dim-xs-45">LoRAs</p>
            <p class="kr-text-black-2xl mt-1">
              {{ triageStore.loras.length }}
            </p>
          </div>
          <div class="kr-panel p-3">
            <p class="kr-text-eyebrow kr-text-dim-xs-45">Confirmed</p>
            <p class="kr-text-black-2xl mt-1 text-success">
              {{ triageStore.confirmedCount }}
            </p>
          </div>
          <div class="kr-panel p-3">
            <p class="kr-text-eyebrow kr-text-dim-xs-45">Remaining</p>
            <p class="kr-text-black-2xl mt-1">
              {{ triageStore.remainingCount }}
            </p>
          </div>
          <div class="kr-panel p-3">
            <p class="kr-text-eyebrow kr-text-dim-xs-45">Unsaved changes</p>
            <p class="kr-text-black-2xl mt-1 text-warning">
              {{ triageStore.pendingChanges.length }}
            </p>
          </div>
          <div class="kr-panel p-3">
            <p class="kr-text-eyebrow kr-text-dim-xs-45">No preview</p>
            <p class="kr-text-black-2xl mt-1 text-error">
              {{ triageStore.missingPreviewCount }}
            </p>
          </div>
          <div class="kr-panel p-3">
            <p class="kr-text-eyebrow kr-text-dim-xs-45">Unclassified</p>
            <p class="kr-text-black-2xl mt-1 text-warning">
              {{ triageStore.unclassifiedCount }}
            </p>
          </div>
        </section>

        <section
          v-if="
            triageStore.isRendering ||
            triageStore.renderMessage ||
            triageStore.renderError ||
            triageStore.probeSkipped.length
          "
          class="kr-panel space-y-2 p-3"
        >
          <div v-if="triageStore.isRendering" class="flex items-center gap-3">
            <span class="kr-spinner-xs" />
            <p class="kr-text-dim-sm">
              Queueing preview renders — {{ triageStore.renderDone }} of
              {{ triageStore.renderTotal }}
            </p>
          </div>
          <p
            v-if="triageStore.renderMessage"
            class="kr-text-dim-sm text-success"
          >
            {{ triageStore.renderMessage }}
          </p>
          <p v-if="triageStore.renderError" class="kr-text-dim-sm text-error">
            {{ triageStore.renderError }}
          </p>
          <details v-if="triageStore.probeSkipped.length" class="text-sm">
            <summary class="cursor-pointer kr-text-dim-sm">
              {{ triageStore.probeSkipped.length }} LoRA(s) could not be planned
            </summary>
            <ul class="mt-2 space-y-1">
              <li
                v-for="skip in triageStore.probeSkipped"
                :key="skip.resourceId"
                class="kr-text-dim-xs"
              >
                <span class="font-mono">{{ skip.label }}</span> —
                {{ skip.reason }}
              </li>
            </ul>
          </details>
        </section>

        <section class="kr-panel space-y-3 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="query"
              type="search"
              class="kr-input-sm min-w-52 flex-1"
              placeholder="Search name, trigger, or base model"
              aria-label="Search LoRAs"
            />

            <select
              v-model="generation"
              class="kr-select-sm w-auto max-w-56"
              aria-label="Filter by base model"
            >
              <option value="ALL">All base models</option>
              <option v-for="base in generations" :key="base" :value="base">
                {{ base }}
              </option>
            </select>

            <select
              v-model="previewFilter"
              class="kr-select-sm w-auto"
              aria-label="Filter by preview state"
            >
              <option value="ALL">All previews</option>
              <option value="MISSING">Missing preview only</option>
            </select>

            <select
              v-model="category"
              class="kr-select-sm w-auto max-w-56"
              aria-label="Filter by category"
            >
              <option value="ALL">All categories</option>
              <option value="NONE">Unclassified only</option>
              <option
                v-for="option in categoryOptions"
                :key="option.category"
                :value="option.category"
              >
                {{ option.label }}
              </option>
            </select>

            <select
              v-model="source"
              class="kr-select-sm w-auto"
              aria-label="Filter by who decided the category"
            >
              <option value="ALL">Any source</option>
              <option value="CIVITAI">Civitai tag — usually right</option>
              <option value="HEURISTIC">Title guess — check these</option>
              <option value="HUMAN">Yours — settled</option>
            </select>

            <select
              v-model="maturity"
              class="kr-select-sm w-auto"
              aria-label="Filter by maturity"
            >
              <option value="ALL">All maturity</option>
              <option value="SFW">SFW only</option>
              <option value="NSFW">NSFW only</option>
            </select>

            <select
              v-model.number="pageSize"
              class="kr-select-sm w-auto"
              aria-label="LoRAs per page"
              @change="page = 1"
            >
              <option :value="24">24 per page</option>
              <option :value="48">48 per page</option>
              <option :value="96">96 per page</option>
              <option :value="192">192 per page</option>
            </select>

            <label
              class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 text-sm"
            >
              <input
                type="checkbox"
                class="kr-toggle-primary-sm"
                :checked="triageStore.hideConfirmed"
                @change="handleHideConfirmed"
              />
              Hide confirmed
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2 kr-panel-divider">
            <span class="kr-text-bold-sm"
              >{{ triageStore.selectedCount }} selected</span
            >
            <button
              type="button"
              class="kr-btn-ghost-xs"
              :disabled="pageResources.length === 0"
              @click="selectPage"
            >
              Select page
            </button>
            <button
              type="button"
              class="kr-btn-ghost-xs"
              :disabled="triageStore.selectedCount === 0"
              @click="triageStore.clearSelection()"
            >
              Clear selection
            </button>
            <button
              type="button"
              class="btn btn-success btn-sm ml-auto rounded-xl"
              :disabled="triageStore.selectedCount === 0"
              @click="triageStore.markSelected('sfw')"
            >
              Mark selected SFW
            </button>
            <button
              type="button"
              class="btn btn-error btn-sm rounded-xl"
              :disabled="triageStore.selectedCount === 0"
              @click="triageStore.markSelected('nsfw')"
            >
              Mark selected NSFW
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2 kr-panel-divider">
            <span class="kr-text-bold-sm">Category</span>
            <select
              v-model="bulkCategory"
              class="kr-select-sm w-auto max-w-56"
              aria-label="Category to apply to the selection"
            >
              <option value="">Choose a category…</option>
              <option
                v-for="option in categoryOptions"
                :key="option.category"
                :value="option.category"
              >
                {{ option.label }} — {{ option.hint }}
              </option>
            </select>
            <button
              type="button"
              class="kr-btn-xs btn-primary"
              :disabled="!bulkCategory || triageStore.selectedCount === 0"
              @click="applyBulkCategory"
            >
              Apply to {{ triageStore.selectedCount }} selected
            </button>
            <button
              type="button"
              class="kr-btn-xs btn-secondary ml-auto"
              @click="suggestForPage"
            >
              <Icon name="kind-icon:sparkles" class="kr-icon-4" />
              Suggest for this page
            </button>
            <button
              type="button"
              class="kr-btn-ghost-xs"
              @click="suggestForAll"
            >
              Suggest for all {{ triageStore.unclassifiedCount }} unclassified
            </button>
          </div>
        </section>

        <div
          v-if="triageStore.saveMessage"
          class="kr-note kr-note-success p-3 font-normal"
        >
          {{ triageStore.saveMessage }}
        </div>
        <div
          v-if="triageStore.saveError"
          class="kr-note kr-note-error p-3 font-normal"
        >
          {{ triageStore.saveError }}
        </div>

        <section
          v-if="pageResources.length"
          class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
        >
          <article
            v-for="resource in pageResources"
            :key="resource.id"
            class="overflow-hidden kr-panel p-0"
            :class="
              triageStore.isSelected(resource.id) ? 'ring-2 ring-primary' : ''
            "
          >
            <div class="relative aspect-square overflow-hidden bg-base-200">
              <kr-deferred-image
                :src="previewSrc(resource)"
                :alt="resourceLabel(resource)"
                class="kr-img-cover"
              />

              <label
                class="kr-icon-8 absolute left-2 top-2 grid cursor-pointer place-items-center rounded-lg bg-base-100/90 shadow"
              >
                <input
                  type="checkbox"
                  class="kr-checkbox-primary-sm"
                  :checked="triageStore.isSelected(resource.id)"
                  :aria-label="`Select ${resourceLabel(resource)}`"
                  @change="handleSelection(resource.id, $event)"
                />
              </label>

              <div
                class="absolute right-2 top-2 flex flex-wrap justify-end gap-1"
              >
                <span
                  class="kr-badge-sm"
                  :class="resource.isMature ? 'badge-error' : 'badge-success'"
                >
                  DB: {{ resource.isMature ? 'NSFW' : 'SFW' }}
                </span>
                <span
                  v-if="triageStore.decisionFor(resource.id)"
                  class="kr-badge-primary-sm"
                >
                  Confirmed
                  {{ triageStore.decisionFor(resource.id)?.toUpperCase() }}
                </span>
                <span
                  v-if="triageStore.renderStateFor(resource.id) === 'queued'"
                  class="kr-badge-sm badge-info"
                >
                  Render queued
                </span>
                <span
                  v-else-if="
                    triageStore.renderStateFor(resource.id) === 'failed'
                  "
                  class="kr-badge-sm badge-warning"
                >
                  Enqueue failed
                </span>
                <span
                  v-else-if="isMissingPreview(resource)"
                  class="kr-badge-sm badge-error"
                >
                  No preview
                </span>
                <span
                  v-if="triageStore.categoryFor(resource.id)"
                  class="kr-badge-sm"
                  :class="sourceBadgeClass(resource)"
                  :title="sourceHint(resource)"
                >
                  {{ categoryLabel(triageStore.categoryFor(resource.id)) }}
                  <span class="opacity-70">· {{ sourceLabel(resource) }}</span>
                </span>
              </div>
            </div>

            <div class="space-y-3 p-3">
              <div class="min-w-0">
                <h2
                  class="kr-text-black-sm line-clamp-2 break-words"
                  :title="resourceLabel(resource)"
                >
                  {{ resourceLabel(resource) }}
                </h2>
                <p v-if="resource.generation" class="kr-text-dim-xs mt-1">
                  {{ resource.generation }}
                </p>
                <p
                  v-if="triggerText(resource)"
                  class="mt-2 line-clamp-2 break-words rounded-lg bg-base-200/70 px-2 py-1 font-mono text-xs"
                  :title="triggerText(resource)"
                >
                  {{ triggerText(resource) }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="kr-btn"
                  :class="
                    triageStore.decisionFor(resource.id) === 'sfw'
                      ? 'btn-success'
                      : 'btn-outline'
                  "
                  @click="triageStore.setDecision(resource.id, 'sfw')"
                >
                  SFW
                </button>
                <button
                  type="button"
                  class="kr-btn"
                  :class="
                    triageStore.decisionFor(resource.id) === 'nsfw'
                      ? 'btn-error'
                      : 'btn-outline'
                  "
                  @click="triageStore.setDecision(resource.id, 'nsfw')"
                >
                  NSFW
                </button>
              </div>

              <label class="form-control">
                <span class="label py-0">
                  <span class="label-text kr-text-dim-xs-55 font-bold">
                    What is it for?
                  </span>
                  <span
                    v-if="triageStore.categoryEdits[resource.id]"
                    class="label-text-alt kr-text-dim-xs-55"
                  >
                    unsaved
                  </span>
                </span>
                <select
                  class="kr-select-sm w-full"
                  :value="triageStore.categoryFor(resource.id) ?? ''"
                  :aria-label="`Category for ${resourceLabel(resource)}`"
                  @change="handleCategory(resource.id, $event)"
                >
                  <option value="">Unclassified</option>
                  <option
                    v-for="option in categoryOptions"
                    :key="option.category"
                    :value="option.category"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <button
                type="button"
                class="kr-btn btn-outline btn-block"
                :disabled="triageStore.isRendering"
                @click="triageStore.renderPreviews([resource.id])"
              >
                <Icon name="kind-icon:sparkles" class="kr-icon-4" />
                {{
                  isMissingPreview(resource) ? 'Render preview' : 'Re-render'
                }}
              </button>
            </div>
          </article>
        </section>

        <div
          v-else
          class="grid min-h-64 place-items-center kr-panel text-center text-base-content/55"
        >
          <div>
            <Icon name="kind-icon:check" class="mx-auto size-10 text-success" />
            <p class="mt-2 font-black">No LoRAs left in this view.</p>
            <p class="mt-1 text-sm">
              {{
                triageStore.hideConfirmed
                  ? 'Turn off “Hide confirmed” to review completed decisions.'
                  : 'Try changing the search, maturity, or base-model filter.'
              }}
            </p>
          </div>
        </div>

        <footer
          class="kr-panel flex flex-wrap items-center justify-between gap-3 p-3"
        >
          <div class="kr-text-dim-sm">
            Showing {{ pageStart }}–{{ pageEnd }} of
            {{ filteredResources.length }} matching LoRAs
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="kr-btn-ghost"
              :disabled="safePage <= 1"
              @click="page = safePage - 1"
            >
              Previous
            </button>
            <span class="kr-text-bold-sm"
              >Page {{ safePage }} / {{ totalPages }}</span
            >
            <button
              type="button"
              class="kr-btn-ghost"
              :disabled="safePage >= totalPages"
              @click="page = safePage + 1"
            >
              Next
            </button>
          </div>
          <button
            type="button"
            class="kr-btn-xs btn-ghost text-base-content/50"
            :disabled="triageStore.confirmedCount === 0"
            @click="clearProgress"
          >
            Clear local review progress
          </button>
        </footer>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useLoraTriageStore } from '@/stores/loraTriageStore'
import type { ResourceGalleryRecord } from '@/stores/resourceGalleryStore'
import { hasBlindPreview } from '@/utils/loraProbe'
import {
  LORA_CATEGORIES,
  LORA_CATEGORY_META,
  normalizeLoraCategory,
  normalizeLoraCategorySource,
  type LoraCategory,
  type LoraCategorySource,
} from '@/utils/loraCategory'

type MaturityFilter = 'ALL' | 'SFW' | 'NSFW'
type PreviewFilter = 'ALL' | 'MISSING'
type CategoryFilter = 'ALL' | 'NONE' | LoraCategory
type SourceFilter = 'ALL' | LoraCategorySource

const userStore = useUserStore()
const triageStore = useLoraTriageStore()
const ready = ref(false)
const loading = ref(false)
const query = ref('')
const generation = ref('ALL')
const maturity = ref<MaturityFilter>('ALL')
const category = ref<CategoryFilter>('ALL')
/*
 * The review filter. A category is only as trustworthy as what produced it,
 * and the 2026-09-22 sweep proved the spread is wide: CHARACTER and STYLE came
 * off Civitai tags and sampled clean across 1,231 rows, while CREATURE and
 * OBJECT came off title keywords and are roughly half wrong. Filtering to
 * HEURISTIC is how you find the bad ones without reading 2,226 cards.
 */
const source = ref<SourceFilter>('ALL')
const bulkCategory = ref<LoraCategory | ''>('')
const previewFilter = ref<PreviewFilter>('ALL')
const pageSize = ref(48)
const page = ref(1)

const categoryOptions = LORA_CATEGORIES.map(
  (value) => LORA_CATEGORY_META[value],
)

const generations = computed(() =>
  [
    ...new Set(
      triageStore.loras
        .map((resource) => resource.generation?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ].sort((a, b) => a.localeCompare(b)),
)

const filteredResources = computed(() => {
  const search = query.value.trim().toLowerCase()

  return triageStore.loras.filter((resource) => {
    if (triageStore.hideConfirmed && triageStore.decisionFor(resource.id))
      return false
    if (generation.value !== 'ALL' && resource.generation !== generation.value)
      return false
    if (
      maturity.value !== 'ALL' &&
      effectiveMaturity(resource) !== maturity.value
    )
      return false
    if (category.value !== 'ALL') {
      const current = triageStore.categoryFor(resource.id)
      if (
        category.value === 'NONE'
          ? current !== null
          : current !== category.value
      )
        return false
    }
    if (source.value !== 'ALL') {
      /*
       * A pending edit is this session's own unsaved decision, so it reads as
       * HUMAN here even though nothing is written yet -- otherwise a row you
       * just fixed would vanish out from under you while you work the
       * HEURISTIC list.
       */
      const current = triageStore.categoryEdits[resource.id]
        ? 'HUMAN'
        : normalizeLoraCategorySource(resource.loraCategorySource)
      if (current !== source.value) return false
    }
    if (previewFilter.value === 'MISSING' && !hasBlindPreview(resource))
      return false
    if (!search) return true

    return [
      resource.customLabel,
      resource.name,
      resource.generation,
      resource.defaultTrigger,
      resource.triggerWords,
      resource.description,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredResources.value.length / pageSize.value)),
)
const safePage = computed(() => Math.min(page.value, totalPages.value))
const pageResources = computed(() => {
  const start = (safePage.value - 1) * pageSize.value
  return filteredResources.value.slice(start, start + pageSize.value)
})
const pageStart = computed(() =>
  filteredResources.value.length
    ? (safePage.value - 1) * pageSize.value + 1
    : 0,
)
const pageEnd = computed(() =>
  Math.min(safePage.value * pageSize.value, filteredResources.value.length),
)

function resourceLabel(resource: ResourceGalleryRecord): string {
  return resource.customLabel || resource.name
}

function isMissingPreview(resource: ResourceGalleryRecord): boolean {
  return hasBlindPreview(resource)
}

function triggerText(resource: ResourceGalleryRecord): string {
  return (
    resource.defaultTrigger || resource.triggerWords || resource.artPrompt || ''
  )
}

function effectiveMaturity(
  resource: ResourceGalleryRecord,
): Exclude<MaturityFilter, 'ALL'> {
  const decision = triageStore.decisionFor(resource.id)
  if (decision) return decision === 'nsfw' ? 'NSFW' : 'SFW'
  return resource.isMature ? 'NSFW' : 'SFW'
}

function previewSrc(resource: ResourceGalleryRecord): string {
  return (
    resource.ArtImage?.thumbnailPath ||
    resource.ArtImage?.imagePath ||
    resource.ArtImage?.path ||
    resource.previewImageUrl ||
    resource.imagePath ||
    '/images/kindart.webp'
  )
}

function handleHideConfirmed(event: Event): void {
  const input = event.target
  if (input instanceof HTMLInputElement)
    triageStore.setHideConfirmed(input.checked)
}

function categoryLabel(value: LoraCategory | null): string {
  return value ? LORA_CATEGORY_META[value].label : ''
}

function categorySource(
  resource: ResourceGalleryRecord,
): LoraCategorySource | 'PENDING' | null {
  if (triageStore.categoryEdits[resource.id]) return 'PENDING'
  return normalizeLoraCategorySource(resource.loraCategorySource)
}

const SOURCE_LABELS: Record<LoraCategorySource | 'PENDING', string> = {
  CIVITAI: 'civitai',
  HEURISTIC: 'guess',
  HUMAN: 'yours',
  PENDING: 'unsaved',
}

const SOURCE_HINTS: Record<LoraCategorySource | 'PENDING', string> = {
  CIVITAI: 'Civitai tagged this upstream. These sampled clean.',
  HEURISTIC:
    'Matched on a word in the title. Worth checking -- this is where the sweep got things wrong.',
  HUMAN: 'You decided this. No sweep will overwrite it.',
  PENDING: 'Your unsaved edit. Save changes to write it.',
}

/*
 * Colour carries the same information as the word, for the same reason the
 * word is there at all: on a 192-card page you scan for the ones to doubt.
 */
const SOURCE_CLASSES: Record<LoraCategorySource | 'PENDING', string> = {
  CIVITAI: 'badge-success',
  HEURISTIC: 'badge-warning',
  HUMAN: 'badge-primary',
  PENDING: 'badge-info',
}

function sourceLabel(resource: ResourceGalleryRecord): string {
  const value = categorySource(resource)
  return value ? SOURCE_LABELS[value] : 'unknown'
}

function sourceHint(resource: ResourceGalleryRecord): string {
  const value = categorySource(resource)
  return value
    ? SOURCE_HINTS[value]
    : 'No recorded source. Treat it like a guess.'
}

function sourceBadgeClass(resource: ResourceGalleryRecord): string {
  const value = categorySource(resource)
  return value ? SOURCE_CLASSES[value] : 'badge-neutral'
}

function handleCategory(resourceId: number, event: Event): void {
  const select = event.target
  if (!(select instanceof HTMLSelectElement)) return
  triageStore.setCategory(resourceId, normalizeLoraCategory(select.value))
}

function applyBulkCategory(): void {
  if (!bulkCategory.value) return
  triageStore.markSelectedCategory(bulkCategory.value)
}

function suggestForPage(): void {
  triageStore.suggestCategories(
    pageResources.value.map((resource) => resource.id),
  )
}

function suggestForAll(): void {
  triageStore.suggestCategories()
}

function handleSelection(resourceId: number, event: Event): void {
  const input = event.target
  if (input instanceof HTMLInputElement)
    triageStore.setSelected(resourceId, input.checked)
}

function selectPage(): void {
  triageStore.selectIds(pageResources.value.map((resource) => resource.id))
}

function clearProgress(): void {
  if (typeof window === 'undefined') return
  if (
    window.confirm(
      'Clear local triage decisions? Saved Resource maturity flags will not be changed.',
    )
  ) {
    triageStore.clearProgress()
  }
}

async function refresh(): Promise<void> {
  loading.value = true
  try {
    await triageStore.loadResources()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) await refresh()
  ready.value = true
})
</script>

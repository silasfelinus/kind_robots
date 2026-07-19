<!-- /components/wonderlab/lab-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      class="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 xl:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-accent bg-accent/10"
        >
          <Icon name="kind-icon:sparkles" class="h-8 w-8 text-accent" />
        </div>

        <div class="min-w-0">
          <h1 class="truncate text-2xl font-black">Component WonderLab</h1>

          <p class="truncate text-sm text-base-content/60">
            Browse components, inspect weirdness, and vote with tiny stars.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-4">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <p
            class="text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            Total
          </p>

          <p class="mt-1 text-2xl font-black text-primary">
            {{ componentCount }}
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <p
            class="text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            Working
          </p>

          <p class="mt-1 text-2xl font-black text-success">
            {{ workingCount }}
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <p
            class="text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            Building
          </p>

          <p class="mt-1 text-2xl font-black text-warning">
            {{ buildingCount }}
          </p>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <p
            class="text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            Broken
          </p>

          <p class="mt-1 text-2xl font-black text-error">
            {{ brokenCount }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2">
        <details v-if="isAdmin" class="dropdown dropdown-end">
          <summary class="btn btn-sm btn-outline rounded-xl">
            <Icon name="kind-icon:gearhammer" class="h-4 w-4" />
            Reconcile
          </summary>

          <div
            class="dropdown-content z-30 mt-2 max-h-[75vh] w-[min(92vw,52rem)] overflow-auto rounded-3xl bg-base-100 shadow-2xl"
          >
            <component-sync />
          </div>
        </details>

        <button
          class="btn btn-sm btn-ghost rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshComponents"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      :class="[
        'grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden',
        selectedComponent
          ? 'xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]'
          : '',
      ]"
    >
      <aside
        :class="[
          'min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100',
          selectedComponent ? 'hidden xl:flex' : 'flex',
        ]"
      >
        <div class="shrink-0 border-b border-base-300 p-3">
          <div class="grid gap-2">
            <input
              v-model="searchQuery"
              class="input input-bordered input-sm w-full bg-base-200"
              type="search"
              aria-label="Search WonderLab components"
              placeholder="Search components..."
            />

            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="folderFilter"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Filter WonderLab components by folder"
              >
                <option value="">All folders</option>

                <option
                  v-for="folder in folderNames"
                  :key="folder"
                  :value="folder"
                >
                  {{ folder }}
                </option>
              </select>

              <select
                v-model="statusFilter"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Filter WonderLab components by status"
              >
                <option value="all">All statuses</option>
                <option value="UNREVIEWED">Unreviewed</option>
                <option value="WORKING">Working</option>
                <option value="NEEDS_CONTEXT">Needs context</option>
                <option value="UNDER_CONSTRUCTION">Building</option>
                <option value="BROKEN">Broken</option>
                <option value="RETIRED">Retired</option>
                <option value="PREVIEW_UNSUPPORTED">Preview unsupported</option>
              </select>
            </div>

            <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <select
                v-model="catalogSort"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Sort WonderLab components"
              >
                <option value="NAME">Name</option>
                <option value="STATUS">Status</option>
                <option value="RATING">Highest rating</option>
                <option value="REVIEWS">Most reviewed</option>
                <option value="RECENTLY_CHANGED">Recently changed</option>
                <option value="RECENTLY_REVIEWED">Recently reviewed</option>
              </select>

              <div class="join" aria-label="WonderLab collection view">
                <button
                  class="btn btn-sm join-item"
                  :class="collectionView === 'grid' ? 'btn-primary' : 'btn-outline'"
                  type="button"
                  :aria-pressed="collectionView === 'grid'"
                  @click="collectionView = 'grid'"
                >
                  Grid
                </button>
                <button
                  class="btn btn-sm join-item"
                  :class="collectionView === 'list' ? 'btn-primary' : 'btn-outline'"
                  type="button"
                  :aria-pressed="collectionView === 'list'"
                  @click="collectionView = 'list'"
                >
                  List
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="reviewFilter"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Filter WonderLab components by review coverage"
              >
                <option value="all">All review coverage</option>
                <option value="reviewed">Reviewed</option>
                <option value="unreviewed">No reviews yet</option>
              </select>

              <select
                v-model="discoveryFilter"
                class="select select-bordered select-sm bg-base-200"
                aria-label="Filter WonderLab components by discovery state"
              >
                <option value="all">All discovery states</option>
                <option value="discovered">In current source</option>
                <option value="missing">Missing from source</option>
              </select>
            </div>

            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-base-content/55">
                {{ sortedComponents.length }} of {{ componentCount }} exhibits
              </p>

              <button
                v-if="hasActiveFilters"
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                @click="clearMuseumFilters"
              >
                <Icon name="kind-icon:x" class="size-3.5" />
                Clear filters
              </button>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <div
            v-if="isLoading"
            class="flex h-full items-center justify-center py-12"
          >
            <span class="loading loading-spinner loading-lg text-accent" />
          </div>

          <div
            v-else-if="sortedComponents.length === 0"
            class="flex h-full flex-col items-center justify-center kr-panel-muted text-center text-base-content/55"
          >
            <Icon name="kind-icon:sparkles" class="h-12 w-12 text-accent" />

            <p class="mt-2 text-lg font-bold">No components found.</p>

            <p class="mt-1 text-sm">
              The lab goblin checked under the rug. Nothing.
            </p>
          </div>

          <div v-else :class="collectionLayoutClass">
            <component-card
              v-for="component in sortedComponents"
              :key="component.id"
              :component="component"
              :selected="selectedComponent?.id === component.id"
              :compact="Boolean(selectedComponent) || collectionView === 'list'"
              :show-actions="false"
              :show-reaction="false"
              :show-select-button="!selectedComponent"
              :show-metrics="true"
              @selected="selectComponent"
            />
          </div>
        </div>
      </aside>

      <main
        v-if="selectedComponent"
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <article class="flex flex-col gap-4">
          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div
              class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
            >
              <div class="min-w-0">
                <p
                  class="text-xs font-bold uppercase tracking-wide text-base-content/45"
                >
                  {{ selectedComponent.folderName }}
                </p>

                <h2
                  class="mt-1 wrap-break-word text-3xl font-black text-primary"
                >
                  {{ selectedComponent.title || selectedComponent.componentName }}
                </h2>

                <p class="mt-2 text-sm text-base-content/65">
                  {{ selectedComponent.componentName }} · Component #{{
                    selectedComponent.id
                  }}
                </p>
              </div>

              <button
                class="btn btn-sm btn-ghost rounded-xl"
                type="button"
                @click="clearSelectedComponent"
              >
                <Icon name="kind-icon:x" class="h-4 w-4" />
                Clear
              </button>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="badge" :class="statusBadgeClass(selectedStatus)">
                {{ statusLabel(selectedStatus) }}
              </span>

              <span
                v-if="componentStore.usingSnapshot"
                class="badge badge-warning badge-outline"
              >
                Snapshot data
              </span>
            </div>
          </section>

          <wonderlab-preview-host
            :component-name="selectedComponent.componentName"
            :folder-name="selectedComponent.folderName"
          />

          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-xs font-black uppercase tracking-widest text-primary">
              About this exhibit
            </p>
            <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75">
              {{
                selectedComponent.description ||
                selectedComponent.statusReason ||
                'A public exhibit description has not been written yet.'
              }}
            </p>

            <dl class="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Category</dt>
                <dd class="mt-1 text-base-content/75">
                  {{ selectedComponent.category || selectedComponent.folderName }}
                </dd>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Discovery</dt>
                <dd class="mt-1 text-base-content/75">
                  {{
                    selectedComponent.isDiscovered === true
                      ? 'Present in current source'
                      : 'Missing from current source'
                  }}
                </dd>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Preview</dt>
                <dd class="mt-1 text-base-content/75">
                  {{ selectedComponent.previewMode || 'Fixture catalog' }}
                </dd>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-100 p-3">
                <dt class="font-black uppercase text-base-content/45">Source</dt>
                <dd class="mt-1 break-all font-mono text-base-content/75">
                  {{
                    selectedComponent.sourcePath ||
                    `${selectedComponent.folderName}/${selectedComponent.componentName}.vue`
                  }}
                </dd>
              </div>
            </dl>
          </section>

          <details
            v-if="isAdmin"
            class="rounded-2xl border border-primary/25 bg-primary/5 p-4"
          >
            <summary class="cursor-pointer font-black text-primary">
              Curator controls
            </summary>

            <div class="mt-4 flex flex-col gap-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <p class="max-w-2xl text-sm leading-relaxed text-base-content/60">
                  Edit public exhibit copy and status separately from internal curator notes.
                  Canonical source identity remains controlled by reconciliation.
                </p>

                <button
                  class="btn btn-sm btn-primary rounded-xl text-white"
                  type="button"
                  :disabled="isSavingComponent"
                  @click="saveSelectedComponent"
                >
                  <span
                    v-if="isSavingComponent"
                    class="loading loading-spinner loading-xs"
                  />
                  <Icon v-else name="kind-icon:check" class="h-4 w-4" />
                  Save curator changes
                </button>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Public title</span>
                  <input
                    v-model="selectedComponent.title"
                    class="input input-bordered bg-base-100"
                    type="text"
                    maxlength="100"
                  />
                </label>

                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Category</span>
                  <input
                    v-model="selectedComponent.category"
                    class="input input-bordered bg-base-100"
                    type="text"
                    maxlength="255"
                    placeholder="navigation, gallery, builder..."
                  />
                </label>

                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2 font-bold">Public description</span>
                  <textarea
                    v-model="selectedComponent.description"
                    class="textarea textarea-bordered min-h-28 bg-base-100"
                    placeholder="What this component does and where visitors encounter it..."
                  />
                </label>

                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Canonical status</span>
                  <select
                    v-model="selectedStatus"
                    class="select select-bordered bg-base-100"
                  >
                    <option
                      v-for="option in statusOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="form-control">
                  <span class="label-text mb-2 font-bold">Preview mode</span>
                  <input
                    v-model="selectedComponent.previewMode"
                    class="input input-bordered bg-base-100"
                    type="text"
                    maxlength="64"
                    placeholder="fixture, live, context, unsupported..."
                  />
                </label>

                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2 font-bold">Public status reason</span>
                  <textarea
                    v-model="selectedComponent.statusReason"
                    class="textarea textarea-bordered min-h-24 bg-base-100"
                    placeholder="Explain why this exhibit needs context, is retired, or cannot preview..."
                  />
                </label>

                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2 font-bold">Internal curator notes</span>
                  <textarea
                    v-model="selectedComponent.notes"
                    class="textarea textarea-bordered min-h-32 bg-base-100"
                    placeholder="Private TODOs, implementation notes, and follow-up work..."
                  />
                </label>
              </div>
            </div>
          </details>

          <section class="grid gap-4 xl:grid-cols-2">
            <component-review-feed
              :key="`${selectedComponent.id}-${reviewFeedVersion}`"
              :component-id="selectedComponent.id"
              :target-title="selectedComponent.title || selectedComponent.componentName"
            />

            <reaction-card
              :target-id="selectedComponent.id"
              target-type="component"
              reaction-category="COMPONENT"
              :target-title="selectedComponent.title || selectedComponent.componentName"
              @submitted="handleReactionSubmitted"
            />
          </section>
        </article>
      </main>
    </section>

    <div
      v-if="statusMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        statusTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ statusMessage }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useComponentStore,
  type KindComponent,
} from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'
import {
  getComponentStatus,
  legacyFieldsForComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'
import { sortComponentCatalog } from '@/utils/wonderlab/componentCatalog'
import {
  normalizeWonderLabMuseumQuery,
  sameWonderLabMuseumQuery,
  wonderLabMuseumQuery,
  type ComponentCatalogSort,
  type WonderLabCollectionView,
  type WonderLabDiscoveryFilter,
  type WonderLabMuseumQueryState,
  type WonderLabQuery,
  type WonderLabReviewFilter,
  type WonderLabStatusFilter,
} from '@/utils/wonderlab/museumQuery'

const statusOptions: Array<{
  value: ComponentStatus
  label: string
}> = [
  { value: 'UNREVIEWED', label: 'Unreviewed' },
  { value: 'WORKING', label: 'Working' },
  { value: 'NEEDS_CONTEXT', label: 'Needs context' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under construction' },
  { value: 'BROKEN', label: 'Broken' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'PREVIEW_UNSUPPORTED', label: 'Preview unsupported' },
]

const route = useRoute()
const router = useRouter()
const componentStore = useComponentStore()
const userStore = useUserStore()

const museumQueryState = computed(() =>
  normalizeWonderLabMuseumQuery(route.query as WonderLabQuery),
)

const searchQuery = computed<string>({
  get: () => museumQueryState.value.search,
  set: (search) => setMuseumQuery({ search }, 'replace'),
})

const folderFilter = computed<string>({
  get: () => museumQueryState.value.folder,
  set: (folder) => setMuseumQuery({ folder }, 'push'),
})

const statusFilter = computed<WonderLabStatusFilter>({
  get: () => museumQueryState.value.status,
  set: (status) => setMuseumQuery({ status }, 'push'),
})

const reviewFilter = computed<WonderLabReviewFilter>({
  get: () => museumQueryState.value.reviews,
  set: (reviews) => setMuseumQuery({ reviews }, 'push'),
})

const discoveryFilter = computed<WonderLabDiscoveryFilter>({
  get: () => museumQueryState.value.discovery,
  set: (discovery) => setMuseumQuery({ discovery }, 'push'),
})

const catalogSort = computed<ComponentCatalogSort>({
  get: () => museumQueryState.value.sort,
  set: (sort) => setMuseumQuery({ sort }, 'push'),
})

const collectionView = computed<WonderLabCollectionView>({
  get: () => museumQueryState.value.view,
  set: (view) => setMuseumQuery({ view }, 'push'),
})

const isLoading = ref(false)
const isSavingComponent = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const reviewFeedVersion = ref(0)

const isAdmin = computed(() => userStore.isAdmin)
const hasActiveFilters = computed(
  () =>
    Boolean(museumQueryState.value.search) ||
    Boolean(museumQueryState.value.folder) ||
    museumQueryState.value.status !== 'all' ||
    museumQueryState.value.reviews !== 'all' ||
    museumQueryState.value.discovery !== 'all',
)

const components = computed<KindComponent[]>(() => {
  const fromAll = componentStore.allComponents || []
  const fromMain = componentStore.components || []
  return fromAll.length ? fromAll : fromMain
})

const selectedComponent = computed({
  get: () => componentStore.selectedComponent,
  set: (value: KindComponent | null) => {
    componentStore.selectedComponent = value
  },
})

const selectedStatus = computed<ComponentStatus>({
  get: () =>
    selectedComponent.value
      ? getComponentStatus(selectedComponent.value)
      : 'UNREVIEWED',
  set: (status) => {
    if (!selectedComponent.value) return
    selectedComponent.value.status = status
    Object.assign(
      selectedComponent.value,
      legacyFieldsForComponentStatus(status),
    )
  },
})

const componentCount = computed(() => components.value.length)
const workingCount = computed(
  () => components.value.filter((component) => componentStatus(component) === 'WORKING').length,
)
const buildingCount = computed(
  () =>
    components.value.filter(
      (component) => componentStatus(component) === 'UNDER_CONSTRUCTION',
    ).length,
)
const brokenCount = computed(
  () => components.value.filter((component) => componentStatus(component) === 'BROKEN').length,
)

const folderNames = computed(() => {
  const folders = new Set<string>()
  components.value.forEach((component) => {
    if (component.folderName) folders.add(component.folderName)
  })
  return Array.from(folders).sort()
})

const filteredComponents = computed(() => {
  let result = components.value

  if (folderFilter.value) {
    result = result.filter(
      (component) => component.folderName === folderFilter.value,
    )
  }

  if (statusFilter.value !== 'all') {
    result = result.filter(
      (component) => componentStatus(component) === statusFilter.value,
    )
  }

  if (reviewFilter.value !== 'all') {
    result = result.filter((component) => {
      const hasReviews = (component.reviewCount ?? 0) > 0
      return reviewFilter.value === 'reviewed' ? hasReviews : !hasReviews
    })
  }

  if (discoveryFilter.value !== 'all') {
    result = result.filter((component) =>
      discoveryFilter.value === 'discovered'
        ? component.isDiscovered === true
        : component.isDiscovered !== true,
    )
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter((component) => {
      const haystack = [
        component.componentName,
        component.folderName,
        component.title,
        component.description,
        component.notes,
        component.category,
        component.statusReason,
        component.sourcePath,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }

  return result
})

const sortedComponents = computed(() =>
  sortComponentCatalog(filteredComponents.value, catalogSort.value),
)

const collectionLayoutClass = computed(() =>
  selectedComponent.value || collectionView.value === 'list'
    ? 'flex flex-col gap-2'
    : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
)

function setMuseumQuery(
  partial: Partial<WonderLabMuseumQueryState>,
  historyMode: 'push' | 'replace',
): void {
  const current = museumQueryState.value
  const next = { ...current, ...partial }
  if (sameWonderLabMuseumQuery(current, next)) return

  const location = {
    path: route.path,
    query: wonderLabMuseumQuery(route.query as WonderLabQuery, next),
    hash: route.hash,
  }

  if (historyMode === 'replace') void router.replace(location)
  else void router.push(location)
}

function clearMuseumFilters(): void {
  setMuseumQuery(
    {
      search: '',
      folder: '',
      status: 'all',
      reviews: 'all',
      discovery: 'all',
    },
    'push',
  )
}

function componentStatus(component: KindComponent): ComponentStatus {
  return getComponentStatus(component)
}

function statusLabel(status: ComponentStatus): string {
  return statusOptions.find((option) => option.value === status)?.label || status
}

function statusBadgeClass(status: ComponentStatus): string {
  switch (status) {
    case 'WORKING':
      return 'badge-success'
    case 'NEEDS_CONTEXT':
      return 'badge-info'
    case 'UNDER_CONSTRUCTION':
      return 'badge-warning'
    case 'BROKEN':
      return 'badge-error'
    case 'PREVIEW_UNSUPPORTED':
      return 'badge-secondary'
    default:
      return 'badge-ghost'
  }
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function selectComponent(component: KindComponent) {
  componentStore.selectedComponent = component
  statusMessage.value = ''
}

function clearSelectedComponent() {
  componentStore.selectedComponent = null
  statusMessage.value = ''
}

async function refreshComponents() {
  const selectedId = selectedComponent.value?.id
  isLoading.value = true
  statusMessage.value = ''

  try {
    await componentStore.initialize(true)

    if (selectedId) {
      componentStore.selectedComponent =
        components.value.find((component) => component.id === selectedId) || null
    }

    setStatus('Components refreshed from the live API.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to refresh components.',
      'error',
    )
  } finally {
    isLoading.value = false
  }
}

async function saveSelectedComponent() {
  if (!selectedComponent.value) return

  isSavingComponent.value = true
  statusMessage.value = ''

  try {
    const updated = await componentStore.updateComponent(
      selectedComponent.value,
    )
    componentStore.selectedComponent = updated
    setStatus('Component curator notes and status saved.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to save component.',
      'error',
    )
  } finally {
    isSavingComponent.value = false
  }
}

function handleReactionSubmitted() {
  reviewFeedVersion.value += 1
  setStatus('Review submitted and the exhibit feed was refreshed.')
}

onMounted(async () => {
  if (components.value.length) return
  await refreshComponents()
})
</script>

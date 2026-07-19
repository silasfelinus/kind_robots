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
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
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

            <div class="flex items-center justify-between gap-2">
              <p class="text-xs text-base-content/55">
                {{ filteredComponents.length }} of {{ componentCount }} exhibits
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
            v-else-if="filteredComponents.length === 0"
            class="flex h-full flex-col items-center justify-center kr-panel-muted text-center text-base-content/55"
          >
            <Icon name="kind-icon:sparkles" class="h-12 w-12 text-accent" />

            <p class="mt-2 text-lg font-bold">No components found.</p>

            <p class="mt-1 text-sm">
              The lab goblin checked under the rug. Nothing.
            </p>
          </div>

          <div v-else class="flex flex-col gap-2">
            <button
              v-for="component in filteredComponents"
              :key="component.id"
              class="rounded-2xl border p-3 text-left transition"
              :class="
                selectedComponent?.id === component.id
                  ? 'border-accent bg-accent/10 text-accent shadow-sm'
                  : 'border-base-300 bg-base-200 hover:border-accent/60'
              "
              type="button"
              @click="selectComponent(component)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-black">
                    {{ component.title || component.componentName }}
                  </p>

                  <p class="truncate text-xs text-base-content/55">
                    {{ component.componentName }} · {{ component.folderName }}
                  </p>
                </div>

                <span
                  class="badge badge-xs shrink-0"
                  :class="statusBadgeClass(componentStatus(component))"
                >
                  {{ statusShortLabel(componentStatus(component)) }}
                </span>
              </div>

              <p
                v-if="component.notes"
                class="mt-2 line-clamp-2 text-xs text-base-content/60"
              >
                {{ component.notes }}
              </p>
            </button>
          </div>
        </div>
      </aside>

      <main
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div
          v-if="!selectedComponent"
          class="flex min-h-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-accent/50 bg-base-200 p-8 text-center"
        >
          <Icon name="kind-icon:sparkles" class="h-16 w-16 text-accent" />

          <div>
            <p class="text-2xl font-black">Pick a component</p>

            <p class="mt-2 max-w-lg text-sm text-base-content/65">
              Select a component from the list to inspect its status, preview,
              notes, and community reviews.
            </p>
          </div>
        </div>

        <article v-else class="flex flex-col gap-4">
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
            <div
              class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 class="text-lg font-black">Curator Notes and Status</h3>

                <p class="text-sm text-base-content/60">
                  Public notes remain readable; editing is restricted to admins.
                </p>
              </div>

              <button
                v-if="isAdmin"
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
                Save
              </button>
            </div>

            <div v-if="isAdmin" class="grid gap-4 lg:grid-cols-[1fr_16rem]">
              <textarea
                v-model="selectedComponent.notes"
                class="textarea textarea-bordered min-h-32 w-full bg-base-100"
                placeholder="Notes, TODOs, dramatic warnings..."
              />

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Canonical status</span>
                </span>
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
                <span class="mt-2 text-xs leading-relaxed text-base-content/50">
                  One status replaces all three legacy flags.
                </span>
              </label>
            </div>

            <div
              v-else
              class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm whitespace-pre-wrap text-base-content/75"
            >
              {{ selectedComponent.notes || 'No curator notes available.' }}
            </div>
          </section>

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
import type { Component as PrismaComponent } from '~/prisma/generated/prisma/client'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'
import {
  getComponentStatus,
  legacyFieldsForComponentStatus,
  type ComponentStatus,
} from '@/utils/wonderlab/componentStatus'
import {
  normalizeWonderLabMuseumQuery,
  sameWonderLabMuseumQuery,
  wonderLabMuseumQuery,
  type WonderLabMuseumQueryState,
  type WonderLabQuery,
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
    museumQueryState.value.status !== 'all',
)

const components = computed<PrismaComponent[]>(() => {
  const fromAll = componentStore.allComponents || []
  const fromMain = componentStore.components || []
  return fromAll.length ? fromAll : fromMain
})

const selectedComponent = computed({
  get: () => componentStore.selectedComponent,
  set: (value: PrismaComponent | null) => {
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

  return [...result].sort((left, right) => {
    const leftLabel = left.title || left.componentName
    const rightLabel = right.title || right.componentName
    return leftLabel.localeCompare(rightLabel)
  })
})

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
    },
    'push',
  )
}

function componentStatus(component: PrismaComponent): ComponentStatus {
  return getComponentStatus(component)
}

function statusLabel(status: ComponentStatus): string {
  return statusOptions.find((option) => option.value === status)?.label || status
}

function statusShortLabel(status: ComponentStatus): string {
  switch (status) {
    case 'WORKING':
      return 'ok'
    case 'NEEDS_CONTEXT':
      return 'ctx'
    case 'UNDER_CONSTRUCTION':
      return 'wip'
    case 'BROKEN':
      return 'bug'
    case 'RETIRED':
      return 'old'
    case 'PREVIEW_UNSUPPORTED':
      return 'n/a'
    default:
      return 'new'
  }
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

function selectComponent(component: PrismaComponent) {
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

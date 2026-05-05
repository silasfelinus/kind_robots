<!-- /components/content/wonderlab/lab-interact.vue -->
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
        <component-sync v-if="isAdmin" />

        <button
          class="btn btn-sm btn-ghost rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshComponents"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
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
              placeholder="Search components..."
            />

            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="folderFilter"
                class="select select-bordered select-sm bg-base-200"
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
              >
                <option value="all">All statuses</option>
                <option value="working">Working</option>
                <option value="building">Building</option>
                <option value="broken">Broken</option>
              </select>
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
            class="flex h-full flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
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
                    {{ component.componentName }}
                  </p>

                  <p class="truncate text-xs text-base-content/55">
                    {{ component.folderName }}
                  </p>
                </div>

                <div class="flex shrink-0 gap-1">
                  <span
                    v-if="component.isWorking"
                    class="badge badge-success badge-xs"
                  >
                    ok
                  </span>

                  <span
                    v-if="component.underConstruction"
                    class="badge badge-warning badge-xs"
                  >
                    wip
                  </span>

                  <span
                    v-if="component.isBroken"
                    class="badge badge-error badge-xs"
                  >
                    bug
                  </span>
                </div>
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
              Select a component from the list to inspect its status, notes, and
              community reactions.
            </p>
          </div>
        </div>

        <article v-else class="flex flex-col gap-4">
          <!-- Identity -->
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
                  {{ selectedComponent.componentName }}
                </h2>

                <p class="mt-2 text-sm text-base-content/65">
                  Component #{{ selectedComponent.id }}
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
              <span
                class="badge"
                :class="
                  selectedComponent.isWorking ? 'badge-success' : 'badge-ghost'
                "
              >
                {{
                  selectedComponent.isWorking ? 'Working' : 'Not marked working'
                }}
              </span>

              <span
                class="badge"
                :class="
                  selectedComponent.underConstruction
                    ? 'badge-warning'
                    : 'badge-ghost'
                "
              >
                {{
                  selectedComponent.underConstruction
                    ? 'Under construction'
                    : 'Not under construction'
                }}
              </span>

              <span
                class="badge"
                :class="
                  selectedComponent.isBroken ? 'badge-error' : 'badge-ghost'
                "
              >
                {{ selectedComponent.isBroken ? 'Broken' : 'Not broken' }}
              </span>
            </div>
          </section>

          <!-- Live Preview -->
          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-black">Live Preview</h3>
                <p class="text-sm text-base-content/60">
                  {{ previewPath || 'Resolving component...' }}
                </p>
              </div>

              <div class="flex gap-2">
                <button
                  class="btn btn-xs btn-ghost rounded-xl"
                  type="button"
                  :class="previewExpanded ? 'btn-active' : ''"
                  @click="previewExpanded = !previewExpanded"
                >
                  <Icon
                    :name="
                      previewExpanded
                        ? 'kind-icon:minimize'
                        : 'kind-icon:maximize'
                    "
                    class="h-3 w-3"
                  />
                  {{ previewExpanded ? 'Collapse' : 'Expand' }}
                </button>
              </div>
            </div>

            <!-- Not found -->
            <div
              v-if="previewNotFound"
              class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-base-content/50"
            >
              <Icon name="kind-icon:sparkles" class="h-10 w-10 opacity-30" />
              <p class="text-sm font-bold">No preview available</p>
              <p class="text-xs">
                Could not locate
                <code class="rounded bg-base-200 px-1 py-0.5 text-xs">
                  {{ selectedComponent.folderName }}/{{
                    selectedComponent.componentName
                  }}.vue
                </code>
              </p>
            </div>

            <!-- Error state -->
            <div
              v-else-if="previewError"
              class="rounded-2xl border border-error/30 bg-error/5 p-4 text-sm text-error"
            >
              <p class="font-bold">Component threw an error during render:</p>
              <pre
                class="mt-2 overflow-x-auto whitespace-pre-wrap text-xs opacity-80"
                >{{ previewError }}</pre
              >
            </div>

            <!-- Live render -->
            <div
              v-else-if="dynamicComponent"
              class="overflow-auto rounded-2xl border border-base-300 bg-base-100 p-4 transition-all"
              :class="previewExpanded ? 'min-h-96' : 'max-h-96'"
            >
              <Suspense>
                <component :is="dynamicComponent" />
                <template #fallback>
                  <div class="flex items-center justify-center py-8">
                    <span
                      class="loading loading-spinner loading-md text-accent"
                    />
                  </div>
                </template>
              </Suspense>
            </div>

            <!-- Resolving -->
            <div
              v-else
              class="flex items-center justify-center rounded-2xl border border-base-300 bg-base-100 py-8"
            >
              <span class="loading loading-spinner loading-md text-accent" />
            </div>
          </section>

          <!-- Notes and Status -->
          <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <div
              class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3 class="text-lg font-black">Notes and Status</h3>

                <p class="text-sm text-base-content/60">
                  Admins can mark component state here.
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

                Save
              </button>
            </div>

            <textarea
              v-if="isAdmin"
              v-model="selectedComponent.notes"
              class="textarea textarea-bordered min-h-32 w-full bg-base-100"
              placeholder="Notes, TODOs, dramatic warnings..."
            />

            <div
              v-else
              class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm whitespace-pre-wrap text-base-content/75"
            >
              {{ selectedComponent.notes || 'No notes available.' }}
            </div>

            <div
              v-if="isAdmin"
              class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3"
            >
              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Working</span>

                <input
                  v-model="selectedComponent.isWorking"
                  type="checkbox"
                  class="toggle toggle-success"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Building</span>

                <input
                  v-model="selectedComponent.underConstruction"
                  type="checkbox"
                  class="toggle toggle-warning"
                />
              </label>

              <label
                class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
              >
                <span class="label-text font-bold">Broken</span>

                <input
                  v-model="selectedComponent.isBroken"
                  type="checkbox"
                  class="toggle toggle-error"
                />
              </label>
            </div>
          </section>

          <reaction-card
            :target-id="selectedComponent.id"
            target-type="component"
            reaction-category="COMPONENT"
            :target-title="selectedComponent.componentName"
          />
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
// /components/content/wonderlab/lab-interact.vue
import {
  computed,
  defineAsyncComponent,
  onErrorCaptured,
  onMounted,
  ref,
  watch,
} from 'vue'
import type { Component as PrismaComponent } from '~/prisma/generated/prisma/client'
import { useComponentStore } from '@/stores/componentStore'
import { useUserStore } from '@/stores/userStore'

type ComponentStatusFilter = 'all' | 'working' | 'building' | 'broken'

// Glob all .vue files under /components at build time so Vite can code-split them.
// The keys look like: /components/pages/some-page.vue
const allModules = import.meta.glob('@/components/**/*.vue')

const componentStore = useComponentStore()
const userStore = useUserStore()

const searchQuery = ref('')
const folderFilter = ref('')
const statusFilter = ref<ComponentStatusFilter>('all')
const isLoading = ref(false)
const isSavingComponent = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

// Preview state
const dynamicComponent = ref<ReturnType<typeof defineAsyncComponent> | null>(
  null,
)
const previewNotFound = ref(false)
const previewError = ref<string | null>(null)
const previewExpanded = ref(false)
const previewPath = ref<string | null>(null)

const isAdmin = computed(() => userStore.isAdmin)

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

const componentCount = computed(() => components.value.length)
const workingCount = computed(
  () => components.value.filter((c) => c.isWorking).length,
)
const buildingCount = computed(
  () => components.value.filter((c) => c.underConstruction).length,
)
const brokenCount = computed(
  () => components.value.filter((c) => c.isBroken).length,
)

const folderNames = computed(() => {
  const folders = new Set<string>()
  components.value.forEach((c) => {
    if (c.folderName) folders.add(c.folderName)
  })
  return Array.from(folders).sort()
})

const filteredComponents = computed(() => {
  let result = components.value

  if (folderFilter.value)
    result = result.filter((c) => c.folderName === folderFilter.value)

  if (statusFilter.value === 'working')
    result = result.filter((c) => c.isWorking)
  if (statusFilter.value === 'building')
    result = result.filter((c) => c.underConstruction)
  if (statusFilter.value === 'broken') result = result.filter((c) => c.isBroken)

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter((c) => {
      const haystack = [c.componentName, c.folderName, c.title, c.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }

  return result
})

// --- Preview resolution ---

function resolvePreview(component: PrismaComponent | null) {
  dynamicComponent.value = null
  previewNotFound.value = false
  previewError.value = null
  previewPath.value = null
  previewExpanded.value = false

  if (!component?.componentName || !component?.folderName) return

  // Try several path patterns the store might use.
  // Keys from import.meta.glob look like "/components/pages/foo.vue"
  const name = component.componentName.replace(/\.vue$/, '')
  const folder = component.folderName

  const candidates = [
    `/components/${folder}/${name}.vue`,
    `/components/content/${folder}/${name}.vue`,
    `/components/${name}.vue`,
  ]

  const matchedKey = candidates.find((c) => allModules[c])

  if (!matchedKey) {
    previewNotFound.value = true
    return
  }

  previewPath.value = matchedKey
  dynamicComponent.value = defineAsyncComponent({
    loader: allModules[matchedKey] as () => Promise<{ default: unknown }>,
    timeout: 8000,
    onError(error, retry, fail) {
      previewError.value =
        error instanceof Error ? error.message : String(error)
      fail()
    },
  })
}

watch(selectedComponent, resolvePreview, { immediate: true })

// Catch render errors so the lab itself doesn't crash
onErrorCaptured((err) => {
  previewError.value = err instanceof Error ? err.message : String(err)
  return false // don't propagate
})

// --- Actions ---

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

function selectComponent(component: PrismaComponent) {
  componentStore.selectedComponent = component
}

function clearSelectedComponent() {
  componentStore.selectedComponent = null
}

async function refreshComponents() {
  isLoading.value = true
  statusMessage.value = ''

  try {
    await componentStore.initialize()
    setStatus('Components refreshed.')
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
    await componentStore.createOrUpdateComponent(
      selectedComponent.value,
      'update',
    )
    setStatus('Component saved.')
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Failed to save component.',
      'error',
    )
  } finally {
    isSavingComponent.value = false
  }
}

onMounted(async () => {
  if (components.value.length) return
  await refreshComponents()
})
</script>

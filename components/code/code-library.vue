<!-- /components/code/code-library.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col bg-base-100">
    <header class="border-b border-base-300 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="flex items-center gap-2 truncate text-lg font-black text-primary">
            <icon name="kind-icon:library" class="h-5 w-5 shrink-0" />
            Code Library
          </h2>

          <p class="mt-1 line-clamp-2 text-xs text-base-content/60">
            Save, load, clone, and manage blueprint graphs.
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm btn-circle"
          type="button"
          title="Close library"
          @click="closeLibrary"
        >
          <icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <span
          class="badge rounded-2xl"
          :class="codeStore.isDirty ? 'badge-warning' : 'badge-success'"
        >
          {{ codeStore.isDirty ? 'Unsaved changes' : 'Saved' }}
        </span>

        <span
          v-if="codeStore.lastSavedAt"
          class="badge badge-outline rounded-2xl"
        >
          Saved {{ savedTimeLabel }}
        </span>

        <span class="badge badge-outline rounded-2xl">
          {{ codeStore.nodes.length }} cards
        </span>

        <span class="badge badge-outline rounded-2xl">
          {{ codeStore.connections.length }} links
        </span>
      </div>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 class="font-black text-base-content">
                Current Blueprint
              </h3>

              <p class="text-xs text-base-content/60">
                Name the graph before saving it to the database.
              </p>
            </div>

            <button
              class="btn btn-ghost btn-sm btn-circle"
              type="button"
              title="Refresh library"
              :disabled="codeStore.loading"
              @click="refreshLibrary"
            >
              <icon
                name="kind-icon:refresh"
                class="h-4 w-4"
                :class="{ 'animate-spin': codeStore.loading }"
              />
            </button>
          </div>

          <div class="mt-3 grid gap-3">
            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Title</span>
              </span>

              <input
                v-model="localTitle"
                class="input input-bordered w-full rounded-2xl bg-base-100"
                type="text"
                placeholder="Untitled Code Blueprint"
                @blur="syncForm"
                @keydown.enter.prevent="syncForm"
              />
            </label>

            <label class="form-control">
              <span class="label pb-1">
                <span class="label-text font-bold">Description</span>
              </span>

              <textarea
                v-model="localDescription"
                class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-100"
                placeholder="What does this blueprint do?"
                @blur="syncForm"
              />
            </label>

            <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label class="form-control">
                <span class="label pb-1">
                  <span class="label-text font-bold">Icon</span>
                </span>

                <input
                  v-model="localIcon"
                  class="input input-bordered w-full rounded-2xl bg-base-100"
                  type="text"
                  placeholder="kind-icon:blocks"
                  @blur="syncForm"
                />
              </label>

              <label class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 sm:mt-6">
                <span>
                  <span class="block text-sm font-bold">Public</span>
                  <span class="block text-xs text-base-content/60">
                    Share this blueprint
                  </span>
                </span>

                <input
                  v-model="localIsPublic"
                  class="toggle toggle-primary"
                  type="checkbox"
                  @change="syncForm"
                />
              </label>
            </div>
          </div>

          <div
            v-if="validationMessage"
            class="mt-3 rounded-2xl border p-3 text-sm"
            :class="validationClass"
          >
            <div class="flex items-start gap-2">
              <icon :name="validationIcon" class="mt-0.5 h-4 w-4 shrink-0" />

              <div class="min-w-0">
                <p class="font-bold">
                  {{ validationMessage }}
                </p>

                <ul
                  v-if="validationDetails.length"
                  class="mt-2 list-inside list-disc space-y-1 text-xs"
                >
                  <li
                    v-for="detail in validationDetails"
                    :key="detail"
                  >
                    {{ detail }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              class="btn btn-primary rounded-2xl"
              type="button"
              :disabled="codeStore.isSaving"
              @click="saveCurrent"
            >
              <icon
                :name="codeStore.isSaving ? 'kind-icon:spinner' : 'kind-icon:save'"
                class="h-4 w-4"
                :class="{ 'animate-spin': codeStore.isSaving }"
              />
              Save
            </button>

            <button
              class="btn btn-secondary rounded-2xl"
              type="button"
              :disabled="codeStore.isSaving"
              @click="saveAsNew"
            >
              <icon name="kind-icon:copy" class="h-4 w-4" />
              Save as New
            </button>

            <button
              class="btn btn-outline rounded-2xl"
              type="button"
              @click="codeStore.createNewModel()"
            >
              <icon name="kind-icon:plus" class="h-4 w-4" />
              New Record
            </button>

            <button
              class="btn btn-outline rounded-2xl"
              type="button"
              @click="validateCurrent"
            >
              <icon name="kind-icon:checklist" class="h-4 w-4" />
              Validate
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="font-black text-base-content">
                  Saved Blueprints
                </h3>

                <p class="text-xs text-base-content/60">
                  Load yours, clone public ones, or delete owned drafts.
                </p>
              </div>

              <span class="badge badge-outline rounded-2xl">
                {{ filteredItems.length }}
              </span>
            </div>

            <label class="input input-sm flex w-full items-center gap-2 rounded-2xl border-base-300 bg-base-100">
              <icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
              <input
                v-model="search"
                class="min-w-0 flex-1"
                type="search"
                placeholder="Search blueprints..."
              />
            </label>

            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="filter in filters"
                :key="filter.value"
                class="btn btn-xs shrink-0 rounded-2xl"
                :class="activeFilter === filter.value ? 'btn-primary' : 'btn-outline'"
                type="button"
                @click="activeFilter = filter.value"
              >
                <icon :name="filter.icon" class="h-3.5 w-3.5" />
                {{ filter.label }}
              </button>
            </div>
          </div>

          <div
            v-if="codeStore.loading"
            class="mt-4 grid gap-2"
          >
            <div
              v-for="index in 4"
              :key="index"
              class="h-24 animate-pulse rounded-2xl bg-base-100"
            />
          </div>

          <div
            v-else-if="filteredItems.length"
            class="mt-4 grid gap-3"
          >
            <article
              v-for="item in filteredItems"
              :key="item.id"
              class="rounded-2xl border bg-base-100 p-3 transition hover:border-primary hover:shadow-md"
              :class="codeStore.selected?.id === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-base-300'"
            >
              <div class="flex items-start gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-primary">
                  <icon :name="item.icon || 'kind-icon:blocks'" class="h-6 w-6" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <h4 class="truncate font-black text-base-content">
                        {{ item.title }}
                      </h4>

                      <p class="line-clamp-2 text-xs text-base-content/60">
                        {{ item.description || 'No description yet.' }}
                      </p>
                    </div>

                    <div class="flex shrink-0 flex-col items-end gap-1">
                      <span
                        v-if="item.isOfficial"
                        class="badge badge-secondary badge-sm rounded-2xl"
                      >
                        Official
                      </span>

                      <span
                        class="badge badge-sm rounded-2xl"
                        :class="item.isPublic ? 'badge-info' : 'badge-outline'"
                      >
                        {{ item.isPublic ? 'Public' : 'Private' }}
                      </span>
                    </div>
                  </div>

                  <div class="mt-2 flex flex-wrap gap-1 text-xs">
                    <span class="badge badge-outline badge-sm rounded-2xl">
                      {{ graphCount(item, 'nodes') }} cards
                    </span>

                    <span class="badge badge-outline badge-sm rounded-2xl">
                      {{ graphCount(item, 'connections') }} links
                    </span>

                    <span
                      v-if="isOwned(item)"
                      class="badge badge-success badge-sm rounded-2xl"
                    >
                      Mine
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  class="btn btn-sm btn-primary rounded-2xl"
                  type="button"
                  @click="loadItem(item.id)"
                >
                  <icon name="kind-icon:download" class="h-4 w-4" />
                  Load
                </button>

                <button
                  class="btn btn-sm btn-outline rounded-2xl"
                  type="button"
                  @click="selectItem(item.id)"
                >
                  <icon name="kind-icon:edit" class="h-4 w-4" />
                  Select
                </button>

                <button
                  class="btn btn-sm btn-secondary rounded-2xl"
                  type="button"
                  @click="cloneItem(item.id)"
                >
                  <icon name="kind-icon:copy" class="h-4 w-4" />
                  Clone
                </button>

                <button
                  class="btn btn-sm btn-error rounded-2xl"
                  type="button"
                  :disabled="!isOwned(item) && !isAdmin"
                  @click="deleteItem(item)"
                >
                  <icon name="kind-icon:trash" class="h-4 w-4" />
                  Delete
                </button>
              </div>
            </article>
          </div>

          <div
            v-else
            class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-100 p-5 text-center"
          >
            <icon name="kind-icon:empty" class="mx-auto h-10 w-10 text-base-content/30" />

            <h4 class="mt-3 font-black text-base-content">
              No blueprints found
            </h4>

            <p class="mt-1 text-sm text-base-content/60">
              Save the current board, change filters, or refresh the library.
            </p>
          </div>
        </section>
      </div>
    </div>

    <footer
      v-if="statusMessage"
      class="border-t border-base-300 p-3"
    >
      <div
        class="rounded-2xl border px-3 py-2 text-sm"
        :class="statusClass"
      >
        {{ statusMessage }}
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCodeStore, type CodeGraph } from '@/stores/codeStore'
import { useUserStore } from '@/stores/userStore'
import type { Code } from '~/prisma/generated/prisma/client'

type LibraryFilter = 'mine' | 'public' | 'official' | 'all'

const codeStore = useCodeStore()
const userStore = useUserStore()

const search = ref('')
const activeFilter = ref<LibraryFilter>('mine')
const statusMessage = ref('')
const statusTone = ref<'info' | 'success' | 'warning' | 'error'>('info')
const validationMessage = ref('')
const validationTone = ref<'info' | 'success' | 'warning' | 'error'>('info')
const validationDetails = ref<string[]>([])

const localTitle = ref('')
const localDescription = ref('')
const localIcon = ref('kind-icon:blocks')
const localIsPublic = ref(false)

const filters: Array<{
  value: LibraryFilter
  label: string
  icon: string
}> = [
  {
    value: 'mine',
    label: 'Mine',
    icon: 'kind-icon:user',
  },
  {
    value: 'public',
    label: 'Public',
    icon: 'kind-icon:globe',
  },
  {
    value: 'official',
    label: 'Official',
    icon: 'kind-icon:badge',
  },
  {
    value: 'all',
    label: 'All',
    icon: 'kind-icon:gallery',
  },
]

const isAdmin = computed(() => {
  return userStore.user?.Role === 'ADMIN'
})

const savedTimeLabel = computed(() => {
  if (!codeStore.lastSavedAt) {
    return ''
  }

  const date = new Date(codeStore.lastSavedAt)

  if (Number.isNaN(date.getTime())) {
    return 'recently'
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
})

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase()

  const source =
    activeFilter.value === 'mine'
      ? codeStore.userItems
      : activeFilter.value === 'public'
        ? codeStore.publicItems
        : activeFilter.value === 'official'
          ? codeStore.officialItems
          : codeStore.items

  return source
    .filter((item) => item.isActive !== false)
    .filter((item) => {
      if (!query) return true

      return [
        item.title,
        item.description,
        item.icon,
        item.isPublic ? 'public' : 'private',
        item.isOfficial ? 'official' : '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .sort((a, b) => {
      if (a.isOfficial !== b.isOfficial) {
        return a.isOfficial ? -1 : 1
      }

      return new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    })
})

const statusClass = computed(() => {
  const classes = {
    info: 'border-info/30 bg-info/10 text-info-content',
    success: 'border-success/30 bg-success/10 text-success-content',
    warning: 'border-warning/30 bg-warning/10 text-warning-content',
    error: 'border-error/30 bg-error/10 text-error-content',
  }

  return classes[statusTone.value]
})

const validationClass = computed(() => {
  const classes = {
    info: 'border-info/30 bg-info/10 text-info-content',
    success: 'border-success/30 bg-success/10 text-success-content',
    warning: 'border-warning/30 bg-warning/10 text-warning-content',
    error: 'border-error/30 bg-error/10 text-error-content',
  }

  return classes[validationTone.value]
})

const validationIcon = computed(() => {
  const icons = {
    info: 'kind-icon:info',
    success: 'kind-icon:check',
    warning: 'kind-icon:warning',
    error: 'kind-icon:alert',
  }

  return icons[validationTone.value]
})

watch(
  () => codeStore.form,
  () => {
    hydrateLocalForm()
  },
  { deep: true, immediate: true },
)

function hydrateLocalForm() {
  localTitle.value = codeStore.form.title || 'Untitled Code Blueprint'
  localDescription.value = codeStore.form.description || ''
  localIcon.value = codeStore.form.icon || 'kind-icon:blocks'
  localIsPublic.value = Boolean(codeStore.form.isPublic)
}

function syncForm() {
  codeStore.setFormValue('title', localTitle.value)
  codeStore.setFormValue('description', localDescription.value)
  codeStore.setFormValue('icon', localIcon.value)
  codeStore.setFormValue('isPublic', localIsPublic.value)
}

function closeLibrary() {
  codeStore.closePanel()

  if (codeStore.mobileTrayMode === 'library') {
    codeStore.setMobileTray('closed')
  }
}

function setStatus(
  message: string,
  tone: 'info' | 'success' | 'warning' | 'error' = 'info',
) {
  statusMessage.value = message
  statusTone.value = tone
}

async function refreshLibrary() {
  const results = await codeStore.fetchAllModels()
  setStatus(`Loaded ${results.length} code blueprint(s).`, 'success')
}

async function saveCurrent() {
  syncForm()

  const result = await codeStore.saveCurrentModel(localTitle.value)

  if (result.success) {
    codeStore.clearDirty()
    setStatus('Blueprint saved. Tiny robot filing cabinet updated.', 'success')
    return
  }

  setStatus(result.message || 'Failed to save blueprint.', 'error')
}

async function saveAsNew() {
  syncForm()

  const title = localTitle.value.trim()
    ? `${localTitle.value.trim()} Copy`
    : 'Code Blueprint Copy'

  const result = await codeStore.saveAsNewModel(title)

  if (result.success) {
    codeStore.clearDirty()
    setStatus('Blueprint saved as a new copy.', 'success')
    return
  }

  setStatus(result.message || 'Failed to save blueprint copy.', 'error')
}

async function loadItem(id: number) {
  const result = await codeStore.loadModelToWorkbench(id)

  if (result.success) {
    setStatus('Blueprint loaded onto the workbench.', 'success')
    return
  }

  setStatus(result.message || 'Failed to load blueprint.', 'error')
}

function selectItem(id: number) {
  codeStore.selectModel(id)
  hydrateLocalForm()
  setStatus('Blueprint selected for editing metadata.', 'info')
}

async function cloneItem(id: number) {
  const result = await codeStore.cloneModel(id)

  if (result.success) {
    setStatus('Blueprint cloned into your library.', 'success')
    activeFilter.value = 'mine'
    return
  }

  setStatus(result.message || 'Failed to clone blueprint.', 'error')
}

async function deleteItem(item: Code) {
  if (!isOwned(item) && !isAdmin.value) {
    setStatus('Only the owner or an admin can delete this blueprint.', 'warning')
    return
  }

  const result = await codeStore.deleteModel(item.id)

  if (result.success) {
    setStatus('Blueprint deleted. Softly. Like a librarian ninja.', 'success')
    return
  }

  setStatus(result.message || 'Failed to delete blueprint.', 'error')
}

function validateCurrent() {
  const result = codeStore.validateCurrentGraph()

  validationMessage.value = result.message
  validationDetails.value = [...result.errors, ...result.warnings]

  if (result.errors.length) {
    validationTone.value = 'error'
    return
  }

  if (result.warnings.length) {
    validationTone.value = 'warning'
    return
  }

  validationTone.value = 'success'
}

function isOwned(item: Code) {
  return Boolean(userStore.user?.id && item.userId === userStore.user.id)
}

function parseItemGraph(item: Code): CodeGraph {
  return codeStore.parseGraph(item.graph)
}

function graphCount(item: Code, key: 'nodes' | 'connections') {
  return parseItemGraph(item)[key].length
}
</script>
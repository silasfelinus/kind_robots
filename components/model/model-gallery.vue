<!-- /components/model/model-gallery.vue -->
<!--
  Model (checkpoint) browser. Reads resourceStore.visibleCheckpoints (account
  maturity already applied), then layers search + base-model + maturity filters
  and sort on top. Cards are grouped by base model; the non-image checkpoints
  (3D / Audio / Video) render in their own section below a divider. Mirrors
  <lora-gallery>, but there are only a few dozen checkpoints so it renders them
  all (no pagination).
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-y-auto rounded-2xl bg-base-300 p-3"
  >
    <header
      class="sticky top-0 z-10 flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            Models
          </h2>
          <p class="text-sm text-base-content/60">
            {{ summaryText }}
          </p>
        </div>

        <button
          class="btn btn-sm btn-primary rounded-xl"
          type="button"
          @click="openAdd"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>
      </div>

      <maturity-toggle
        variant="resource"
        label="Mature checkpoint models"
        visible-text="Mature checkpoint models are included in this gallery."
        hidden-text="Mature checkpoint models are hidden from this gallery."
      />

      <div class="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          v-model="searchQuery"
          class="input input-bordered rounded-xl"
          placeholder="Search name, label, path"
        />

        <select
          v-model="selectedBase"
          class="select select-bordered rounded-xl"
        >
          <option value="all">All bases</option>
          <option v-for="base in baseOptions" :key="base" :value="base">
            {{ base }}
          </option>
        </select>

        <select
          v-model="maturityFilter"
          class="select select-bordered rounded-xl"
        >
          <option value="all">All ratings</option>
          <option value="sfw">SFW only</option>
          <option value="mature">Mature only</option>
        </select>

        <select v-model="sortBy" class="select select-bordered rounded-xl">
          <option value="name">Name A–Z</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </header>

    <add-model
      v-if="showForm"
      :model="editing"
      @saved="handleSaved"
      @close="closeForm"
    />

    <div
      v-if="!filteredModels.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
    >
      <p class="font-bold">No models found.</p>
      <p class="text-sm text-base-content/60">
        {{ resourceStore.isLoading ? 'Loading models…' : 'Try another filter.' }}
      </p>
    </div>

    <template v-else>
      <div
        v-for="group in imageGroups"
        :key="`img-${group.base}`"
        class="flex flex-col gap-2"
      >
        <h3
          class="flex items-center gap-2 px-1 text-sm font-bold text-base-content/80"
        >
          <span class="badge badge-secondary badge-sm">{{ group.base }}</span>
          <span class="text-base-content/45">{{ group.items.length }}</span>
        </h3>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          <model-card
            v-for="model in group.items"
            :key="model.id || model.name"
            :model="model"
            :show-mature="showMature"
            @edit="openEdit"
          />
        </div>
      </div>

      <template v-if="nonImageGroups.length">
        <div class="divider text-xs font-bold uppercase text-base-content/50">
          Other · non-image models
        </div>

        <div
          v-for="group in nonImageGroups"
          :key="`other-${group.base}`"
          class="flex flex-col gap-2"
        >
          <h3
            class="flex items-center gap-2 px-1 text-sm font-bold text-base-content/80"
          >
            <span class="badge badge-ghost badge-sm">{{ group.base }}</span>
            <span class="text-base-content/45">{{ group.items.length }}</span>
          </h3>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <model-card
              v-for="model in group.items"
              :key="model.id || model.name"
              :model="model"
              :show-mature="showMature"
              @edit="openEdit"
            />
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useResourceStore, type Resource } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'

const resourceStore = useResourceStore()
const userStore = useUserStore()

const searchQuery = ref('')
const selectedBase = ref<string>('all')
const maturityFilter = ref<'all' | 'sfw' | 'mature'>('all')
const sortBy = ref<'name' | 'newest'>('name')

const showForm = ref(false)
const editing = ref<Partial<Resource> | null>(null)

const showMature = computed(() => userStore.showMature)

const NON_IMAGE_BASES = new Set(['3D', 'AUDIO', 'VIDEO'])

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function baseOf(model: Partial<Resource>): string {
  const path = safeText(model.localPath)
    .replaceAll('\\', '/')
    .replace(/^\/+/, '')
  const folder = path.includes('/') ? path.split('/')[0] : ''

  return (
    folder ||
    safeText(model.generation).trim() ||
    safeText(model.supportedServer).trim() ||
    'OTHER'
  ).toUpperCase()
}

const baseOptions = computed(() => {
  const seen = new Set<string>()
  for (const model of resourceStore.visibleCheckpoints) {
    seen.add(baseOf(model))
  }

  return Array.from(seen).sort(
    (a, b) =>
      Number(NON_IMAGE_BASES.has(a)) - Number(NON_IMAGE_BASES.has(b)) ||
      a.localeCompare(b),
  )
})

const filteredModels = computed<Partial<Resource>[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return resourceStore.visibleCheckpoints.filter((model) => {
    if (selectedBase.value !== 'all' && baseOf(model) !== selectedBase.value) {
      return false
    }

    if (maturityFilter.value === 'sfw' && model.isMature) return false
    if (maturityFilter.value === 'mature' && !model.isMature) return false

    if (!query) return true

    return [model.name, model.customLabel, model.description, model.localPath]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

type ModelGroup = {
  base: string
  isNonImage: boolean
  items: Partial<Resource>[]
}

const grouped = computed<ModelGroup[]>(() => {
  const map = new Map<string, Partial<Resource>[]>()
  for (const model of filteredModels.value) {
    const base = baseOf(model)
    const bucket = map.get(base) ?? map.set(base, []).get(base)!
    bucket.push(model)
  }

  const groups: ModelGroup[] = [...map.entries()].map(([base, items]) => ({
    base,
    isNonImage: NON_IMAGE_BASES.has(base),
    items: [...items].sort((a, b) =>
      sortBy.value === 'newest'
        ? Number(b.id ?? 0) - Number(a.id ?? 0)
        : safeText(a.customLabel || a.name).localeCompare(
            safeText(b.customLabel || b.name),
          ),
    ),
  }))

  return groups.sort(
    (a, b) =>
      Number(a.isNonImage) - Number(b.isNonImage) ||
      a.base.localeCompare(b.base),
  )
})

const imageGroups = computed(() =>
  grouped.value.filter((group) => !group.isNonImage),
)
const nonImageGroups = computed(() =>
  grouped.value.filter((group) => group.isNonImage),
)

const summaryText = computed(() => {
  const total = resourceStore.visibleCheckpoints.length
  const shown = filteredModels.value.length

  if (shown === total) return `${total} model${total === 1 ? '' : 's'}`
  return `${shown} of ${total} models`
})

function openAdd(): void {
  editing.value = null
  showForm.value = true
}

function openEdit(model: Partial<Resource>): void {
  editing.value = model
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editing.value = null
}

function handleSaved(): void {
  closeForm()
}

onMounted(() => {
  resourceStore.loadStore()
})
</script>

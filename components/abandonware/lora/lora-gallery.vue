<!-- /components/lora/lora-gallery.vue -->
<!--
  My Library — the owned-LoRA browser. Reads resourceStore.visibleLoras
  (account maturity already applied), then layers search, base-model +
  maturity filters, sort, and client-side pagination on top (the library is
  large, so we never render more than one page of cards at once). Add/edit
  both route through <add-lora>.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            My LoRAs
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
        label="Mature LoRAs"
        visible-text="Mature LoRAs are included in your library."
        hidden-text="Mature LoRAs are hidden from your library."
      />

      <div class="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
        <input
          v-model="searchQuery"
          class="input input-bordered rounded-xl"
          placeholder="Search name, label, trigger, path"
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
          <option value="base">Base model</option>
        </select>
      </div>
    </header>

    <add-lora
      v-if="showForm"
      :lora="editing"
      @saved="handleSaved"
      @close="closeForm"
    />

    <div
      class="grid gap-3"
      :class="
        compact
          ? 'grid-cols-2 sm:grid-cols-3'
          : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
      "
    >
      <lora-card
        v-for="lora in pageItems"
        :key="lora.id || lora.name"
        :lora="lora"
        :show-mature="showMature"
        :compact="compact"
        @edit="openEdit"
      />
    </div>

    <div
      v-if="!filteredLoras.length"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
    >
      <p class="font-bold">No LoRAs found.</p>
      <p class="text-sm text-base-content/60">
        {{
          resourceStore.isLoading
            ? 'Loading your library…'
            : 'Try another filter, or drop a LoRA into Lora/import to auto-add it.'
        }}
      </p>
    </div>

    <footer
      v-if="pageCount > 1"
      class="flex shrink-0 items-center justify-center gap-2 pt-1"
    >
      <button
        class="btn btn-sm rounded-xl"
        type="button"
        :disabled="page <= 1"
        @click="page--"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
        Prev
      </button>

      <span class="text-sm text-base-content/70">
        Page {{ page }} / {{ pageCount }}
      </span>

      <button
        class="btn btn-sm rounded-xl"
        type="button"
        :disabled="page >= pageCount"
        @click="page++"
      >
        Next
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useResourceStore, type Resource } from '@/stores/resourceStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    pageSize?: number
  }>(),
  {
    compact: false,
    pageSize: 24,
  },
)

const resourceStore = useResourceStore()
const userStore = useUserStore()

const searchQuery = ref('')
const selectedBase = ref<string>('all')
const maturityFilter = ref<'all' | 'sfw' | 'mature'>('all')
const sortBy = ref<'name' | 'newest' | 'base'>('name')
const page = ref(1)

const showForm = ref(false)
const editing = ref<Partial<Resource> | null>(null)

const showMature = computed(() => userStore.showMature)

function safeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return ''
}

function baseOf(lora: Partial<Resource>): string {
  return (
    safeText(lora.generation).trim() ||
    safeText(lora.supportedServer).trim()
  ).toUpperCase()
}

const baseOptions = computed(() => {
  const seen = new Set<string>()

  for (const lora of resourceStore.visibleLoras) {
    const base = baseOf(lora)
    if (base) seen.add(base)
  }

  return Array.from(seen).sort()
})

const filteredLoras = computed<Partial<Resource>[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const rows = resourceStore.visibleLoras.filter((lora) => {
    if (selectedBase.value !== 'all' && baseOf(lora) !== selectedBase.value) {
      return false
    }

    if (maturityFilter.value === 'sfw' && lora.isMature) return false
    if (maturityFilter.value === 'mature' && !lora.isMature) return false

    if (!query) return true

    return [
      lora.name,
      lora.customLabel,
      lora.description,
      lora.localPath,
      lora.triggerWords,
      lora.defaultTrigger,
      lora.generation,
      lora.supportedServer,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })

  const sorted = [...rows]

  if (sortBy.value === 'name') {
    sorted.sort((a, b) =>
      safeText(a.customLabel || a.name).localeCompare(
        safeText(b.customLabel || b.name),
      ),
    )
  } else if (sortBy.value === 'newest') {
    sorted.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
  } else if (sortBy.value === 'base') {
    sorted.sort((a, b) => baseOf(a).localeCompare(baseOf(b)))
  }

  return sorted
})

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredLoras.value.length / props.pageSize)),
)

const pageItems = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return filteredLoras.value.slice(start, start + props.pageSize)
})

const summaryText = computed(() => {
  const total = resourceStore.visibleLoras.length
  const shown = filteredLoras.value.length

  if (shown === total) return `${total} LoRA${total === 1 ? '' : 's'}`
  return `${shown} of ${total} LoRAs`
})

watch([searchQuery, selectedBase, maturityFilter, sortBy], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

function openAdd(): void {
  editing.value = null
  showForm.value = true
}

function openEdit(lora: Partial<Resource>): void {
  editing.value = lora
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

<template>
  <div
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1.5fr)_minmax(0,1fr)] gap-3 @5xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,1fr)] @5xl:grid-rows-[auto_minmax(0,1fr)] @5xl:gap-4"
  >
    <header class="flex min-w-0 flex-col gap-2 @5xl:col-span-2">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p class="pf-kicker text-secondary">Catalogue</p>
          <p class="pf-display mt-1 text-2xl @3xl:text-3xl">
            Everything Kind Robots already has
          </p>
        </div>
        <input
          v-model="forge.catalogSearch"
          type="search"
          data-nav
          class="pf-field w-56 py-1 text-sm"
          placeholder="Search the catalogue"
          aria-label="Search the catalogue"
        />
      </div>
      <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Shelves">
        <button
          v-for="tab in CATALOG_TABS"
          :key="tab.id"
          type="button"
          role="tab"
          data-nav
          class="pf-tab pf-focusable"
          :class="forge.catalogTab === tab.id ? 'pf-tab-on' : ''"
          :aria-selected="forge.catalogTab === tab.id"
          @click="forge.setCatalogTab(tab.id)"
        >
          {{ tab.label }}
          <span
            v-if="forge.catalog[tab.id]"
            class="ml-1 tabular-nums opacity-60"
            >{{ forge.catalog[tab.id]!.length }}</span
          >
        </button>
      </div>
      <div
        v-if="forge.catalogTab === 'facets' && taxonomies.length"
        class="flex flex-wrap gap-1"
        role="group"
        aria-label="Taxonomy"
      >
        <button
          v-for="t in ['', ...taxonomies]"
          :key="t || 'all'"
          type="button"
          class="pf-chip pf-focusable text-[0.65rem]"
          :class="
            taxonomy === t
              ? 'border-primary text-primary'
              : 'border-base-content/20 opacity-75'
          "
          @click="taxonomy = t"
        >
          {{ t ? t.toLowerCase().replace(/_/g, ' ') : 'all' }}
        </button>
      </div>
    </header>

    <section class="kr-scroll -mx-1 min-h-0 px-1 py-1" aria-label="Catalogue">
      <p
        v-if="forge.catalogLoading === forge.catalogTab"
        class="text-sm opacity-70"
      >
        Opening the shelf…
      </p>
      <p v-else-if="forge.catalogError" class="text-sm text-warning">
        {{ forge.catalogError }}
        <button type="button" class="ml-2 underline" @click="retry">
          Try again
        </button>
      </p>
      <p v-else-if="!filtered.length" class="text-sm opacity-70">
        Nothing on this shelf matches.
      </p>
      <ul
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3"
      >
        <li v-for="item in shown" :key="item.key">
          <PlaybookForgeArtCard
            :title="item.title"
            :label="item.label"
            :subtitle="item.blurb"
            :image-url="item.imageUrl"
            :prompt="item.prompt"
            :badge="forge.inTray(item.key) ? 'In tray' : ''"
            :selected="forge.catalogFocus === item.key"
            empty-text="No picture yet."
            @select="forge.catalogFocus = item.key"
          />
        </li>
      </ul>
      <button
        v-if="filtered.length > shown.length"
        type="button"
        class="pf-label btn btn-sm btn-ghost mt-3"
        @click="limit += 120"
      >
        Show more ({{ filtered.length - shown.length }} left)
      </button>
    </section>

    <PlaybookForgeCatalogTray />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { CATALOG_TABS, matches } from '~/utils/playbookForge/catalog'

// The catalogue: Facets, Characters, Locations, Scenarios, Rewards and the
// games' painted beats, browsed by their art. Picks go to the tray.

const forge = usePlaybookForgeStore()
const limit = ref(120)
const taxonomy = ref('')

onMounted(() => void forge.loadCatalog())

const items = computed(() => forge.catalog[forge.catalogTab] ?? [])
const taxonomies = computed(() =>
  [...new Set(items.value.map((i) => i.facet?.taxonomy ?? ''))]
    .filter(Boolean)
    .sort(),
)
const filtered = computed(() =>
  items.value.filter(
    (item) =>
      (!taxonomy.value || item.facet?.taxonomy === taxonomy.value) &&
      matches(item, forge.catalogSearch),
  ),
)
// Pictured items first: this is a place to browse by art.
const shown = computed(() =>
  [...filtered.value]
    .sort((a, b) => Number(!a.imageUrl) - Number(!b.imageUrl))
    .slice(0, limit.value),
)

watch(
  () => [forge.catalogTab, forge.catalogSearch, taxonomy.value],
  () => (limit.value = 120),
)
watch(
  () => forge.catalogTab,
  () => (taxonomy.value = ''),
)

function retry() {
  void forge.loadCatalog()
}
</script>

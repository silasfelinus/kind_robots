from __future__ import annotations

import re
from pathlib import Path

PATH = Path("components/wonderlab/lab-interact.vue")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one {label} block, found {count}.")
    return source.replace(old, new, 1)


def regex_once(source: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, source, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"Expected one {label} regex match, found {count}.")
    return updated


def main() -> None:
    source = PATH.read_text(encoding="utf-8")

    source = replace_once(
        source,
        '''    <section
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]"
    >''',
        '''    <section
      :class="[
        'grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden',
        selectedComponent
          ? 'xl:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]'
          : '',
      ]"
    >''',
        "responsive collection shell",
    )

    filter_block = '''            <div class="grid grid-cols-2 gap-2">
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
            </div>'''

    source = replace_once(
        source,
        filter_block,
        filter_block
        + '''

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
            </div>''',
        "filter and catalog controls",
    )

    source = replace_once(
        source,
        '{{ filteredComponents.length }} of {{ componentCount }} exhibits',
        '{{ sortedComponents.length }} of {{ componentCount }} exhibits',
        "filtered exhibit count",
    )
    source = replace_once(
        source,
        'v-else-if="filteredComponents.length === 0"',
        'v-else-if="sortedComponents.length === 0"',
        "empty collection condition",
    )

    source = regex_once(
        source,
        r'''          <div v-else class="flex flex-col gap-2">.*?          </div>\n        </div>\n      </aside>''',
        '''          <div v-else :class="collectionLayoutClass">
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
      </aside>''',
        "collection cards",
    )

    source = replace_once(
        source,
        '''      <main
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
      >''',
        '''      <main
        v-if="selectedComponent"
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
      >''',
        "selected exhibit main",
    )
    source = regex_once(
        source,
        r'''        <div
          v-if="!selectedComponent".*?        </div>\n\n        <article v-else class="flex flex-col gap-4">''',
        '''        <article class="flex flex-col gap-4">''',
        "empty exhibit placeholder",
    )

    source = replace_once(
        source,
        "import type { Component as PrismaComponent } from '~/prisma/generated/prisma/client'\nimport { useComponentStore } from '@/stores/componentStore'",
        "import {\n  useComponentStore,\n  type KindComponent,\n} from '@/stores/componentStore'",
        "Component store import",
    )
    source = replace_once(
        source,
        "} from '@/utils/wonderlab/componentStatus'",
        "} from '@/utils/wonderlab/componentStatus'\nimport { sortComponentCatalog } from '@/utils/wonderlab/componentCatalog'",
        "catalog sort import",
    )
    source = replace_once(
        source,
        '''  type WonderLabMuseumQueryState,
  type WonderLabQuery,
  type WonderLabStatusFilter,
} from '@/utils/wonderlab/museumQuery' ''',
        '''  type ComponentCatalogSort,
  type WonderLabCollectionView,
  type WonderLabMuseumQueryState,
  type WonderLabQuery,
  type WonderLabStatusFilter,
} from '@/utils/wonderlab/museumQuery' ''',
        "museum query types",
    )

    source = replace_once(
        source,
        '''const statusFilter = computed<WonderLabStatusFilter>({
  get: () => museumQueryState.value.status,
  set: (status) => setMuseumQuery({ status }, 'push'),
})''',
        '''const statusFilter = computed<WonderLabStatusFilter>({
  get: () => museumQueryState.value.status,
  set: (status) => setMuseumQuery({ status }, 'push'),
})

const catalogSort = computed<ComponentCatalogSort>({
  get: () => museumQueryState.value.sort,
  set: (sort) => setMuseumQuery({ sort }, 'push'),
})

const collectionView = computed<WonderLabCollectionView>({
  get: () => museumQueryState.value.view,
  set: (view) => setMuseumQuery({ view }, 'push'),
})''',
        "sort and view state",
    )
    source = replace_once(
        source,
        'const components = computed<PrismaComponent[]>(() => {',
        'const components = computed<KindComponent[]>(() => {',
        "catalog component type",
    )
    source = replace_once(
        source,
        '  set: (value: PrismaComponent | null) => {',
        '  set: (value: KindComponent | null) => {',
        "selected component type",
    )

    source = regex_once(
        source,
        r'''  return \[\.\.\.result\]\.sort\(\(left, right\) => \{.*?  \}\)\n\}\)''',
        '''  return result
})

const sortedComponents = computed(() =>
  sortComponentCatalog(filteredComponents.value, catalogSort.value),
)

const collectionLayoutClass = computed(() =>
  selectedComponent.value || collectionView.value === 'list'
    ? 'flex flex-col gap-2'
    : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
)''',
        "filtered catalog sort",
    )
    source = replace_once(
        source,
        'function componentStatus(component: PrismaComponent): ComponentStatus {',
        'function componentStatus(component: KindComponent): ComponentStatus {',
        "component status type",
    )
    source = regex_once(
        source,
        r'''function statusShortLabel\(status: ComponentStatus\): string \{.*?\n\}\n\n''',
        '',
        "obsolete short status helper",
    )
    source = replace_once(
        source,
        'function selectComponent(component: PrismaComponent) {',
        'function selectComponent(component: KindComponent) {',
        "selection type",
    )

    PATH.write_text(source, encoding="utf-8")


if __name__ == "__main__":
    main()

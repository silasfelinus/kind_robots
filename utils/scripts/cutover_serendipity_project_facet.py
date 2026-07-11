from pathlib import Path

STORE = Path('stores/serendipityStore.ts')
PAGE = Path('components/pages/serendipity-page.vue')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    return source.replace(old, new, 1)


store = STORE.read_text(encoding='utf-8')
store = replace_once(
    store,
    "import { useDreamStore } from '@/stores/dreamStore'\n",
    "import { useProjectStore } from '@/stores/projectStore'\n",
    'replace Dream store import',
)
store = replace_once(
    store,
    "  const dreamStore = useDreamStore()\n",
    "  const projectStore = useProjectStore()\n",
    'replace Dream store instance',
)
store = replace_once(
    store,
    "  const projectDreamId = computed(() => {\n    const slug = session.value?.projectSlug\n    if (!slug) return null\n    const dream = dreamStore.dreams.find(\n      (entry) => entry.dreamType === 'PROJECT' && entry.slug === slug,\n    )\n    return dream?.id ?? null\n  })\n",
    "  const projectId = computed(() => {\n    const slug = session.value?.projectSlug\n    if (!slug) return null\n    return projectStore.projectForSlug(slug)?.id ?? null\n  })\n",
    'replace Project Dream lookup',
)
store = replace_once(
    store,
    "      if (todo.dreamId != null && todo.dreamId !== projectDreamId.value)\n        continue\n",
    "      if (todo.projectId != null && todo.projectId !== projectId.value) continue\n",
    'scope honeydos by Project',
)
store = replace_once(
    store,
    "          dreamId: projectDreamId.value,\n",
    "          projectId: projectId.value,\n",
    'write Serendipity decisions to Project',
)
store = replace_once(
    store,
    "      conductorStore.hasLoaded\n        ? Promise.resolve()\n        : conductorStore.fetchProjects(),\n",
    "      conductorStore.hasLoaded\n        ? Promise.resolve()\n        : conductorStore.fetchProjects(),\n      projectStore.loaded ? Promise.resolve() : projectStore.fetchProjects(),\n",
    'load Project records',
)
STORE.write_text(store, encoding='utf-8')

page = PAGE.read_text(encoding='utf-8')
page = replace_once(
    page,
    "import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'\n",
    "import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'\nimport { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'\n",
    'add Facet store import',
)
page = replace_once(
    page,
    "const dreamStore = useDreamStore()\n",
    "const dreamStore = useDreamStore()\nconst facetStore = useFacetStore()\n",
    'add Facet store instance',
)
page = replace_once(
    page,
    "const genreDreams = computed(() =>\n  dreamStore.dreams.filter(\n    (dream) => dream.dreamType === 'GENRE' && dream.isActive && dream.slug,\n  ),\n)\n",
    "const storyGrammarFacets = computed(() =>\n  facetStore.activeFacets.filter((facet) => facet.kind === 'GENRE' && facet.slug),\n)\n",
    'replace Genre Dream collection',
)
page = page.replace('genreDreams', 'storyGrammarFacets')
page = replace_once(
    page,
    "function toIngredient(\n  dream: DreamWithRelations | undefined,\n): SerendipityIngredient | undefined {\n  if (!dream?.slug) return undefined\n  return {\n    slug: dream.slug,\n    title: dream.title,\n    description: dream.description,\n    flavorText: dream.flavorText,\n  }\n}\n",
    "function toIngredient(\n  source: DreamWithRelations | FacetWithAliases | undefined,\n): SerendipityIngredient | undefined {\n  if (!source?.slug) return undefined\n  return {\n    slug: source.slug,\n    title: source.title,\n    description: source.description,\n    flavorText: source.flavorText,\n  }\n}\n",
    'support Facet ingredients',
)
page = replace_once(
    page,
    'from your GENRE dreams',
    'from your Facets',
    'update story grammar label',
)
page = replace_once(
    page,
    'Add LOCATION or GENRE dreams to unlock places and story grammars.',
    'Add LOCATION dreams or GENRE Facets to unlock places and story grammars.',
    'update empty-state copy',
)
page = replace_once(
    page,
    "    (!locationDreams.value.length && !storyGrammarFacets.value.length)\n  ) {\n    dreamStore.fetchDreams({ limit: 200 })\n  }\n  void store.loadRealSurfaces()\n",
    "    !locationDreams.value.length\n  ) {\n    dreamStore.fetchDreams({ dreamType: 'LOCATION', limit: 200 })\n  }\n  if (!facetStore.loaded || !storyGrammarFacets.value.length) {\n    facetStore.fetchFacets({ kind: 'GENRE', take: 200 })\n  }\n  void store.loadRealSurfaces()\n",
    'load Facets separately',
)
PAGE.write_text(page, encoding='utf-8')

print(f'Updated {STORE}')
print(f'Updated {PAGE}')

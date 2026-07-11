from pathlib import Path

SCENARIO_STORE = Path('stores/scenarioStore.ts')
SERENDIPITY_STORE = Path('stores/serendipityStore.ts')
SERENDIPITY_PAGE = Path('components/pages/serendipity-page.vue')
FACET_TEST = Path('cypress/e2e/api/facet-assignments.cy.ts')


def replace_exact(source: str, old: str, new: str, expected: int, label: str) -> str:
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{label}: expected {expected}, found {count}')
    return source.replace(old, new)


scenario = SCENARIO_STORE.read_text(encoding='utf-8')
scenario = replace_exact(
    scenario,
    "import type {\n  Character,\n  Dream,\n  Scenario,\n} from '~/prisma/generated/prisma/client'\n",
    "import type {\n  Character,\n  Dream,\n  Facet,\n  Scenario,\n} from '~/prisma/generated/prisma/client'\n",
    1,
    'add Facet type to Scenario store',
)
scenario = replace_exact(
    scenario,
    "type ScenarioCharacter = Pick<\n",
    "type ScenarioFacet = Pick<\n  Facet,\n  | 'id'\n  | 'title'\n  | 'slug'\n  | 'kind'\n  | 'description'\n  | 'flavorText'\n  | 'imagePath'\n  | 'icon'\n  | 'userId'\n  | 'isPublic'\n  | 'isMature'\n  | 'isActive'\n> & {\n  aliases: string[]\n}\n\ntype ScenarioCharacter = Pick<\n",
    1,
    'add Scenario Facet type',
)
scenario = replace_exact(
    scenario,
    "  Dreams?: ScenarioDream[]\n  Characters?: ScenarioCharacter[]\n  _count?: {\n    Dreams?: number\n    Characters?: number\n  }\n",
    "  Dreams?: ScenarioDream[]\n  Facets?: ScenarioFacet[]\n  Characters?: ScenarioCharacter[]\n  _count?: {\n    Dreams?: number\n    Facets?: number\n    Characters?: number\n  }\n",
    1,
    'add Facets to Scenario relation type',
)
scenario = replace_exact(
    scenario,
    "  dreamIds?: number[]\n  characterIds?: number[]\n",
    "  dreamIds?: number[]\n  facetIds?: number[]\n  characterIds?: number[]\n",
    1,
    'add Facet IDs to Scenario form',
)
scenario = replace_exact(
    scenario,
    "    dreamIds: scenario.Dreams?.map((dream) => dream.id) ?? [],\n    characterIds: scenario.Characters?.map((character) => character.id) ?? [],\n",
    "    dreamIds: scenario.Dreams?.map((dream) => dream.id) ?? [],\n    facetIds: scenario.Facets?.map((facet) => facet.id) ?? [],\n    characterIds: scenario.Characters?.map((character) => character.id) ?? [],\n",
    1,
    'map Scenario Facets into form',
)
scenario = replace_exact(
    scenario,
    "  const { Dreams, Characters, _count, ...payload } = form\n",
    "  const { Dreams, Facets, Characters, _count, ...payload } = form\n",
    1,
    'strip Scenario Facets from scalar payload',
)
scenario = replace_exact(
    scenario,
    "  const scenariosByDream = computed(() => {\n",
    "  const scenarioFacets = computed(() => {\n    const map = new Map<number, ScenarioFacet>()\n\n    for (const scenario of scenarios.value) {\n      for (const facet of scenario.Facets ?? []) {\n        map.set(facet.id, facet)\n      }\n    }\n\n    return Array.from(map.values()).sort((a, b) =>\n      a.kind === b.kind\n        ? a.title.localeCompare(b.title)\n        : a.kind.localeCompare(b.kind),\n    )\n  })\n\n  const scenariosByDream = computed(() => {\n",
    1,
    'add Scenario Facet collection',
)
scenario = replace_exact(
    scenario,
    "  function getScenariosForDream(dreamId: number): ScenarioWithRelations[] {\n    return scenariosByDream.value.get(dreamId) ?? []\n  }\n",
    "  function getScenariosForDream(dreamId: number): ScenarioWithRelations[] {\n    return scenariosByDream.value.get(dreamId) ?? []\n  }\n\n  const scenariosByFacet = computed(() => {\n    const groups = new Map<number, ScenarioWithRelations[]>()\n\n    for (const facet of scenarioFacets.value) groups.set(facet.id, [])\n    for (const scenario of scenarios.value) {\n      for (const facet of scenario.Facets ?? []) {\n        groups.get(facet.id)?.push(scenario)\n      }\n    }\n\n    return groups\n  })\n\n  function getScenariosForFacet(facetId: number): ScenarioWithRelations[] {\n    return scenariosByFacet.value.get(facetId) ?? []\n  }\n",
    1,
    'add Scenario grouping by Facet',
)
scenario = replace_exact(
    scenario,
    "    scenarioDreams,\n    scenariosByDream,\n    getScenariosForDream,\n",
    "    scenarioDreams,\n    scenarioFacets,\n    scenariosByDream,\n    scenariosByFacet,\n    getScenariosForDream,\n    getScenariosForFacet,\n",
    1,
    'export Scenario Facet getters',
)
scenario = replace_exact(
    scenario,
    "export type { Scenario, ScenarioCharacter, ScenarioDream }\n",
    "export type { Scenario, ScenarioCharacter, ScenarioDream, ScenarioFacet }\n",
    1,
    'export Scenario Facet type',
)
SCENARIO_STORE.write_text(scenario, encoding='utf-8')


serendipity = SERENDIPITY_STORE.read_text(encoding='utf-8')
serendipity = replace_exact(
    serendipity,
    "import { useDreamStore } from '@/stores/dreamStore'\n",
    "import { useProjectStore } from '@/stores/projectStore'\n",
    1,
    'replace Serendipity Dream store import',
)
serendipity = replace_exact(
    serendipity,
    "  genreDreamSlug?: string\n",
    "  genreFacetSlug?: string\n",
    1,
    'rename Serendipity genre seed to Facet',
)
serendipity = replace_exact(
    serendipity,
    "// A pickable story ingredient sourced from a LOCATION or GENRE Dream.\n// The seed references Dreams by slug; the ingredient carries the display\n// text the prompt needs so the engine never re-reads the Dream record.\n",
    "// A pickable story ingredient sourced from a LOCATION Dream or a Facet.\n// The seed keeps only the stable slug; the ingredient carries prompt-ready text.\n",
    1,
    'update Serendipity ingredient model comment',
)
serendipity = replace_exact(
    serendipity,
    "  const dreamStore = useDreamStore()\n",
    "  const projectStore = useProjectStore()\n",
    1,
    'replace Serendipity Dream store instance',
)
serendipity = replace_exact(
    serendipity,
    "  const projectDreamId = computed(() => {\n    const slug = session.value?.projectSlug\n    if (!slug) return null\n    const dream = dreamStore.dreams.find(\n      (entry) => entry.dreamType === 'PROJECT' && entry.slug === slug,\n    )\n    return dream?.id ?? null\n  })\n",
    "  const projectId = computed(() => {\n    const slug = session.value?.projectSlug\n    if (!slug) return null\n    return projectStore.projectForSlug(slug)?.id ?? null\n  })\n",
    1,
    'replace Serendipity Project Dream lookup',
)
serendipity = replace_exact(
    serendipity,
    "    if (!slug) return []\n    const hooks: SerendipityRealHook[] = []\n",
    "    if (!slug || !projectId.value) return []\n    const hooks: SerendipityRealHook[] = []\n",
    1,
    'require first-class Project for real hooks',
)
serendipity = replace_exact(
    serendipity,
    "      // Project-scoped honeydos first-class; unscoped ones ride along.\n      if (todo.dreamId != null && todo.dreamId !== projectDreamId.value)\n        continue\n",
    "      // Project-scoped honeydos first-class; unscoped ones ride along.\n      if (todo.projectId != null && todo.projectId !== projectId.value) continue\n",
    1,
    'scope Serendipity hooks through Project IDs',
)
serendipity = replace_exact(
    serendipity,
    "          category: 'AGENT',\n          dreamId: projectDreamId.value,\n",
    "          category: 'AGENT',\n          projectId: projectId.value,\n",
    1,
    'write Serendipity decisions to Project',
)
serendipity = replace_exact(
    serendipity,
    "      conductorStore.hasLoaded\n        ? Promise.resolve()\n        : conductorStore.fetchProjects(),\n",
    "      conductorStore.hasLoaded\n        ? Promise.resolve()\n        : conductorStore.fetchProjects(),\n      projectStore.loaded\n        ? Promise.resolve()\n        : projectStore.fetchProjects(),\n",
    1,
    'load Project records for Serendipity',
)
serendipity = replace_exact(
    serendipity,
    "      genreDreamSlug: input.genre?.slug,\n",
    "      genreFacetSlug: input.genre?.slug,\n",
    1,
    'persist Serendipity genre Facet slug',
)
for banned in ('useDreamStore', 'dreamStore', 'projectDreamId', 'genreDreamSlug'):
    if banned in serendipity:
        raise RuntimeError(f'Serendipity store still contains {banned}')
SERENDIPITY_STORE.write_text(serendipity, encoding='utf-8')


page = SERENDIPITY_PAGE.read_text(encoding='utf-8')
page = replace_exact(
    page,
    "<!-- Serendipity (serendipity/t-002..t-006): themed intro with a Dreams-fed\n     theme picker, the full story weaving loop on chat streams (momentum,\n",
    "<!-- Serendipity (serendipity/t-002..t-006): themed intro with LOCATION Dreams\n     and reusable Facets, the full story weaving loop on chat streams (momentum,\n",
    1,
    'update Serendipity page source comment',
)
page = replace_exact(page, 'genreDreams', 'genreFacets', 10, 'rename genre Dreams to Facets')
page = replace_exact(
    page,
    '            from your GENRE dreams\n',
    '            from reusable Facets\n',
    1,
    'update story grammar label',
)
page = replace_exact(
    page,
    '        Gathering places and story grammars from your Dreams…\n',
    '        Gathering places and story grammars…\n',
    1,
    'update Serendipity loading copy',
)
page = replace_exact(
    page,
    '          Add LOCATION or GENRE dreams to unlock places and story grammars.\n',
    '          Add LOCATION Dreams or story-grammar Facets to unlock more doors.\n',
    1,
    'update Serendipity empty copy',
)
page = replace_exact(
    page,
    '            v-for="project in conductorStore.projects"\n',
    '            v-for="project in projectStore.activeProjects"\n',
    1,
    'use first-class Projects in Serendipity selector',
)
page = replace_exact(
    page,
    '            {{ project.name || project.slug }}\n',
    '            {{ project.title || project.slug }}\n',
    1,
    'use Project title in Serendipity selector',
)
page = replace_exact(
    page,
    "import { useConductorStore } from '@/stores/conductorStore'\nimport { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'\n",
    "import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'\nimport { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'\nimport { useProjectStore } from '@/stores/projectStore'\n",
    1,
    'replace Serendipity page store imports',
)
page = replace_exact(
    page,
    "const conductorStore = useConductorStore()\nconst dreamStore = useDreamStore()\n",
    "const dreamStore = useDreamStore()\nconst facetStore = useFacetStore()\nconst projectStore = useProjectStore()\n",
    1,
    'replace Serendipity page store instances',
)
page = replace_exact(
    page,
    "const selectedGenreSlug = ref<string | null>(null)\n",
    "const selectedGrammarSlug = ref<string | null>(null)\n",
    1,
    'rename selected story grammar slug',
)
page = replace_exact(page, 'selectedGenreSlug', 'selectedGrammarSlug', 4, 'use story grammar selection name')
page = replace_exact(
    page,
    "const genreFacets = computed(() =>\n  dreamStore.dreams.filter(\n    (dream) => dream.dreamType === 'GENRE' && dream.isActive && dream.slug,\n  ),\n)\n",
    "const storyGrammarKinds = new Set(['GENRE', 'CORE', 'THEME', 'MOOD', 'STYLE'])\nconst genreFacets = computed(() =>\n  facetStore.activeFacets.filter(\n    (facet) => storyGrammarKinds.has(facet.kind) && facet.slug,\n  ),\n)\n",
    1,
    'source story grammar from Facets',
)
page = replace_exact(
    page,
    "function toIngredient(\n  dream: DreamWithRelations | undefined,\n): SerendipityIngredient | undefined {\n  if (!dream?.slug) return undefined\n  return {\n    slug: dream.slug,\n    title: dream.title,\n    description: dream.description,\n    flavorText: dream.flavorText,\n  }\n}\n",
    "type IngredientSource =\n  | Pick<DreamWithRelations, 'slug' | 'title' | 'description' | 'flavorText'>\n  | Pick<FacetWithAliases, 'slug' | 'title' | 'description' | 'flavorText'>\n\nfunction toIngredient(\n  source: IngredientSource | undefined,\n): SerendipityIngredient | undefined {\n  if (!source?.slug) return undefined\n  return {\n    slug: source.slug,\n    title: source.title,\n    description: source.description,\n    flavorText: source.flavorText,\n  }\n}\n",
    1,
    'generalize Serendipity ingredients',
)
page = replace_exact(
    page,
    "  if (\n    !dreamStore.hasLoaded ||\n    (!locationDreams.value.length && !genreFacets.value.length)\n  ) {\n    dreamStore.fetchDreams({ limit: 200 })\n  }\n  void store.loadRealSurfaces()\n",
    "  if (!dreamStore.hasLoaded || !locationDreams.value.length) {\n    void dreamStore.fetchDreams({ dreamType: 'LOCATION', limit: 200 })\n  }\n  if (!facetStore.loaded) void facetStore.fetchFacets({ take: 250 })\n  void store.loadRealSurfaces()\n",
    1,
    'load LOCATION Dreams and Facets independently',
)
page = replace_exact(
    page,
    'dreamStore.loading\n',
    'dreamStore.loading || facetStore.loading\n',
    2,
    'combine Serendipity ingredient loading state',
)
for banned in ('dreamType === \'GENRE\'', 'conductorStore', 'selectedGenreSlug'):
    if banned in page:
        raise RuntimeError(f'Serendipity page still contains {banned}')
SERENDIPITY_PAGE.write_text(page, encoding='utf-8')


test = FACET_TEST.read_text(encoding='utf-8')
test = replace_exact(
    test,
    "    cy.request({\n      url: `${apiBase}/scenarios/${scenarioId}/facets`,\n      headers: { Authorization: `Bearer ${token}` },\n    }).then((response) => {\n      expect(response.status).to.eq(200)\n      expect(response.body.data[0].id).to.eq(facetId)\n    })\n",
    "    cy.request({\n      url: `${apiBase}/scenarios/${scenarioId}/facets`,\n      headers: { Authorization: `Bearer ${token}` },\n    }).then((response) => {\n      expect(response.status).to.eq(200)\n      expect(response.body.data[0].id).to.eq(facetId)\n    })\n\n    cy.request({\n      url: `${apiBase}/scenarios/${scenarioId}`,\n      headers: { Authorization: `Bearer ${token}` },\n    }).then((response) => {\n      expect(response.status).to.eq(200)\n      expect(response.body.data.Facets).to.have.length(1)\n      expect(response.body.data.Facets[0].id).to.eq(facetId)\n      expect(response.body.data.Facets[0].aliases).to.include(cowsAlias)\n      expect(response.body.data._count.Facets).to.eq(1)\n    })\n\n    cy.request({\n      url: `${apiBase}/scenarios`,\n      headers: { Authorization: `Bearer ${token}` },\n    }).then((response) => {\n      const scenario = response.body.data.find(\n        (entry: { id: number }) => entry.id === scenarioId,\n      )\n      expect(scenario).to.exist\n      expect(scenario.Facets.map((facet: { id: number }) => facet.id)).to.deep.eq([\n        facetId,\n      ])\n    })\n",
    1,
    'add Scenario Facet read coverage',
)
FACET_TEST.write_text(test, encoding='utf-8')

print('Updated Scenario store, Serendipity runtime, and Scenario Facet coverage')

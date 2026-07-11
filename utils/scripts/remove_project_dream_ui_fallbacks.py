from pathlib import Path

CONDUCTOR_PAGE = Path('components/pages/conductor-page.vue')
OVERVIEW_PAGE = Path('components/pages/conductor-overview-gallery-page.vue')
DREAM_STORE = Path('stores/dreamStore.ts')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected one match, found {count}')
    return source.replace(old, new, 1)


def replace_all(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count < 1:
        raise RuntimeError(f'{label}: expected at least one match')
    return source.replace(old, new)


def replace_between(
    source: str,
    start: str,
    end: str,
    replacement: str,
    label: str,
) -> str:
    start_count = source.count(start)
    end_count = source.count(end)
    if start_count != 1 or end_count < 1:
        raise RuntimeError(
            f'{label}: start matches={start_count}, end matches={end_count}'
        )
    start_index = source.index(start)
    end_index = source.index(end, start_index)
    return source[:start_index] + replacement + source[end_index:]


def assert_absent(source: str, tokens: list[str], label: str) -> None:
    remaining = [token for token in tokens if token in source]
    if remaining:
        raise RuntimeError(f'{label}: banned tokens remain: {remaining}')


page = CONDUCTOR_PAGE.read_text(encoding='utf-8')
page = replace_once(
    page,
    "import { useDreamStore } from '@/stores/dreamStore'\n",
    '',
    'remove Conductor Dream store import',
)
page = replace_once(
    page,
    'const dreamStore = useDreamStore()\n',
    '',
    'remove Conductor Dream store instance',
)
page = replace_all(
    page,
    'dreamStore.publicProjectDreams',
    'projectStore.publicProjects',
    'replace public Project Dream galleries',
)
page = replace_all(
    page,
    'dreamStore.hasLoaded',
    'projectStore.loaded',
    'replace Project Dream loading state',
)
page = replace_all(
    page,
    'dream.projectStatus',
    'dream.status',
    'replace Project Dream status display',
)
page = replace_once(
    page,
    "function projectDreamForSlug(slug: string) {\n  return dreamStore.projectDreams.find((dream) => dream.slug === slug) ?? null\n}\n\n",
    '',
    'remove Project Dream lookup',
)
page = replace_between(
    page,
    'function projectCardPath(slug: string): string {',
    'const activeProjects = computed',
    """function projectCardPath(slug: string): string {
  return (
    projectRecordForSlug(slug)?.cardPath ??
    `${CONDUCTOR_IMG_BASE}/${slug}-card.webp`
  )
}
function projectHeroPath(slug: string): string {
  return (
    projectRecordForSlug(slug)?.heroPath ??
    `${CONDUCTOR_IMG_BASE}/${slug}-hero.webp`
  )
}
function projectIconPath(slug: string): string {
  return (
    projectRecordForSlug(slug)?.imagePath ??
    `${CONDUCTOR_IMG_BASE}/${slug}-icon.webp`
  )
}

""",
    'replace Project image fallbacks',
)
page = replace_between(
    page,
    'const activeProjects = computed',
    'const missingProjectSlugs = computed',
    """const activeProjects = computed(() =>
  projects.value.filter((project) => {
    const status = projectRecordForSlug(project.slug)?.status
    return status !== 'BRAINSTORM' && status !== 'ARCHIVED'
  }),
)

const sortedActiveProjects = computed(() =>
  [...activeProjects.value].sort((a, b) => {
    const order: Record<DreamPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }
    const pa =
      (projectRecordForSlug(a.slug)?.priority as DreamPriority | undefined) ??
      'NORMAL'
    const pb =
      (projectRecordForSlug(b.slug)?.priority as DreamPriority | undefined) ??
      'NORMAL'
    return (order[pa] ?? 1) - (order[pb] ?? 1)
  }),
)

const brainstormProjects = computed(() =>
  projects.value.filter(
    (project) => projectRecordForSlug(project.slug)?.status === 'BRAINSTORM',
  ),
)

""",
    'replace Conductor Project status and priority fallbacks',
)
page = replace_between(
    page,
    'const linkedDream = computed',
    '// Compact project state',
    '',
    'remove linked Project Dream',
)
page = replace_between(
    page,
    '  sortedActiveProjects.value.forEach((project) => {',
    '  return result',
    """  sortedActiveProjects.value.forEach((project) => {
    const record = projectRecordForSlug(project.slug)
    result.push(
      makeCard(
        project.slug,
        record?.title || project.name || project.slug,
        kindIcon(project.kind),
        record?.cardPath ?? undefined,
      ),
    )
  })
""",
    'replace workspace Project cards',
)
page = replace_between(
    page,
    'function getProjectPriority',
    'async function setPriority',
    '',
    'remove Dream priority bridge',
)
page = replace_once(
    page,
    "  if (!projectStore.loaded) {\n    work.push(dreamStore.fetchDreams({ dreamType: 'PROJECT' }))\n  }\n",
    '',
    'remove Project Dream refresh',
)
page = replace_once(
    page,
    "  if (!projectStore.loaded) dreamStore.fetchDreams({ dreamType: 'PROJECT' })\n",
    '',
    'remove Project Dream mount fetch',
)
assert_absent(
    page,
    [
        'useDreamStore',
        'dreamStore',
        'projectDreamForSlug',
        'projectDreams',
        'publicProjectDreams',
        'linkedDream',
    ],
    'Conductor page cutover',
)
CONDUCTOR_PAGE.write_text(page, encoding='utf-8')


overview = OVERVIEW_PAGE.read_text(encoding='utf-8')
overview = replace_once(
    overview,
    "import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'\n",
    '',
    'remove overview Dream import',
)
overview = replace_once(
    overview,
    'const dreamStore = useDreamStore()\n',
    '',
    'remove overview Dream store instance',
)
overview = replace_once(
    overview,
    "const isLoading = computed(\n  () => conductorStore.pending || projectStore.loading || dreamStore.loading,\n)\nconst errorMessage = computed(\n  () => conductorStore.error || projectStore.error || dreamStore.error || '',\n)\n",
    "const isLoading = computed(() => conductorStore.pending || projectStore.loading)\nconst errorMessage = computed(\n  () => conductorStore.error || projectStore.error || '',\n)\n",
    'replace overview loading and error state',
)
overview = replace_between(
    overview,
    'const activeProjects = computed',
    'const adminItems = computed',
    """const activeProjects = computed(() => {
  return conductorStore.projects.filter((project) => {
    const status = dbProjectForSlug(project.slug)?.status
    return status !== 'BRAINSTORM' && status !== 'ARCHIVED'
  })
})

const brainstormProjects = computed(() => {
  return conductorStore.projects.filter(
    (project) => dbProjectForSlug(project.slug)?.status === 'BRAINSTORM',
  )
})

const sortedActiveProjects = computed(() => {
  const order: Record<DreamPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }

  return [...activeProjects.value].sort((a, b) => {
    const aPriority =
      (dbProjectForSlug(a.slug)?.priority as DreamPriority | undefined) ??
      'NORMAL'
    const bPriority =
      (dbProjectForSlug(b.slug)?.priority as DreamPriority | undefined) ??
      'NORMAL'

    return (order[aPriority] ?? 1) - (order[bPriority] ?? 1)
  })
})

""",
    'replace overview Project status and priority fallbacks',
)
overview = replace_between(
    overview,
    'async function ensureData',
    'async function refreshGallery',
    """async function ensureData(force = false) {
  const projectOptions = userStore.isAdmin
    ? { includeInactive: true, includeMature: true }
    : {}

  if (userStore.isAdmin) {
    await Promise.all([
      conductorStore.fetchProjects(force),
      projectStore.fetchProjects(projectOptions),
      todoStore.hasLoaded ? todoStore.fetchTodos(force) : Promise.resolve(),
    ])
    return
  }

  if (force || !projectStore.loaded) {
    await projectStore.fetchProjects(projectOptions)
  }
}

""",
    'replace overview data loading',
)
overview = replace_once(
    overview,
    "function projectDreamForSlug(slug: string) {\n  return dreamStore.projectDreams.find((dream) => dream.slug === slug) ?? null\n}\n\n",
    '',
    'remove overview Project Dream lookup',
)
overview = replace_between(
    overview,
    'function itemFromProject(project: ConductorProject): ProjectGalleryItem {',
    'function taskCounts',
    """function itemFromProject(project: ConductorProject): ProjectGalleryItem {
  const record = dbProjectForSlug(project.slug)
  const priority =
    (record?.priority as DreamPriority | undefined) ?? 'NORMAL'
  const counts = taskCounts(project)
  const details =
    record?.description ||
    record?.goal ||
    project.notesFromSilas ||
    `${project.name || project.slug} has ${project.tasks.length} tracked tasks across ${project.milestones.length} milestones.`

  return {
    slug: project.slug,
    title: record?.title || project.name || project.slug,
    flavor:
      record?.flavorText ||
      project.notesFromSilas ||
      'Active Kind Robots project.',
    details,
    notes: project.notesFromSilas || '',
    kind: project.kind || 'project',
    kindLabel: formatKind(project.kind),
    status: record?.status || 'ACTIVE',
    priority,
    progress: Number.isFinite(project.progress) ? project.progress : 0,
    blocked: counts.blocked,
    needsHuman: counts.needsHuman,
    ready: counts.ready,
    review: counts.review,
    done: counts.done,
    totalTasks: project.tasks.length,
    projectId: record?.id ?? null,
    iconPath:
      record?.imagePath ||
      project.imagePath ||
      `${CONDUCTOR_IMG_BASE}/${project.slug}-icon.webp`,
    cardPath:
      record?.cardPath ||
      project.cardPath ||
      `${CONDUCTOR_IMG_BASE}/${project.slug}-card.webp`,
    heroPath:
      record?.heroPath ||
      project.heroPath ||
      `${CONDUCTOR_IMG_BASE}/${project.slug}-hero.webp`,
    liveUrl: record?.liveUrl || '',
    repoUrl: record?.repoUrl || '',
  }
}

function itemFromProjectRecord(record: ProjectWithRelations): ProjectGalleryItem {
  const conductorProject = record.slug
    ? conductorStore.projects.find((project) => project.slug === record.slug)
    : null
  if (conductorProject) return itemFromProject(conductorProject)

  return {
    slug: record.slug || `project-${record.id}`,
    title: record.title,
    flavor: record.flavorText || record.goal || 'Kind Robots project.',
    details:
      record.description ||
      record.goal ||
      'This project is waiting for a richer public description.',
    notes: '',
    kind: 'project',
    kindLabel: 'Project',
    status: record.status,
    priority: record.priority as DreamPriority,
    progress: record.status === 'DONE' ? 100 : 0,
    blocked: 0,
    needsHuman: 0,
    ready: 0,
    review: 0,
    done: record.status === 'DONE' ? 1 : 0,
    totalTasks: record._count?.Todos ?? 0,
    projectId: record.id,
    iconPath:
      record.imagePath ||
      `${CONDUCTOR_IMG_BASE}/${record.slug}-icon.webp`,
    cardPath:
      record.cardPath ||
      `${CONDUCTOR_IMG_BASE}/${record.slug}-card.webp`,
    heroPath:
      record.heroPath ||
      `${CONDUCTOR_IMG_BASE}/${record.slug}-hero.webp`,
    liveUrl: record.liveUrl || '',
    repoUrl: record.repoUrl || '',
  }
}

""",
    'replace overview Project item builders',
)
overview = replace_once(
    overview,
    '  dreamId: number | null\n',
    '',
    'remove overview Dream ID',
)
overview = replace_once(
    overview,
    '  if (item.dreamId) await dreamStore.selectDreamById(item.dreamId)\n',
    '',
    'remove overview Dream selection',
)
overview = replace_all(
    overview,
    'startProjectDream',
    'startProject',
    'rename Project creation action',
)
overview = replace_once(
    overview,
    "function getDreamTitle(dream?: DreamWithRelations | null) {\n  return dream?.title || dream?.slug || ''\n}\n",
    '',
    'remove Dream title helper',
)
assert_absent(
    overview,
    [
        'useDreamStore',
        'dreamStore',
        'projectDreamForSlug',
        'DreamWithRelations',
        'dreamId',
        'startProjectDream',
    ],
    'overview gallery cutover',
)
OVERVIEW_PAGE.write_text(overview, encoding='utf-8')


store = DREAM_STORE.read_text(encoding='utf-8')
store = replace_once(
    store,
    "  const projectDreams = computed(() =>\n    filterDreamsByType('PROJECT', dreams.value),\n  )\n  const publicProjectDreams = computed(() =>\n    filterPublicDreams(\n      projectDreams.value,\n      currentUserId.value,\n      userStore.isAdmin,\n    ),\n  )\n",
    '',
    'remove Project Dream computed getters',
)
store = replace_once(
    store,
    '    projectDreams,\n    publicProjectDreams,\n',
    '',
    'remove Project Dream store exports',
)
assert_absent(
    store,
    ['projectDreams', 'publicProjectDreams'],
    'Dream store Project getter cleanup',
)
DREAM_STORE.write_text(store, encoding='utf-8')

print(f'Updated {CONDUCTOR_PAGE}')
print(f'Updated {OVERVIEW_PAGE}')
print(f'Updated {DREAM_STORE}')

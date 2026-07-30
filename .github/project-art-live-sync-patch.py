from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding='utf-8')


def write(path: str, content: str) -> None:
    Path(path).write_text(content, encoding='utf-8')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        if new in source:
            return source
        raise RuntimeError(f'Missing patch anchor: {label}')
    return source.replace(old, new, 1)


store_path = 'stores/projectStore.ts'
store = read(store_path)
store = replace_once(
    store,
    """export type ApplyPlacementsResult = {
  updated: string[]
  unchanged: string[]
  missing: string[]
  failed: ProjectPlacementFailure[]
}

const PROJECT_LIST_FRESH_MS = 60_000
""",
    """export type ApplyPlacementsResult = {
  updated: string[]
  unchanged: string[]
  missing: string[]
  failed: ProjectPlacementFailure[]
}

type ProjectArtQueueJob = {
  id: number
  status: string
  artImageId?: number | null
  updatedAt?: string | Date | null
  payload?: unknown
}

type ProjectArtQueueData = {
  jobs?: ProjectArtQueueJob[]
}

const PROJECT_LIST_FRESH_MS = 60_000
const PROJECT_ART_ACTIVE_POLL_MS = 3_000
const PROJECT_ART_IDLE_POLL_MS = 15_000

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function projectArtEntityId(job: ProjectArtQueueJob): number | null {
  const payload = objectRecord(job.payload)
  const entityArt = objectRecord(payload.entityArt)
  if (entityArt.entityType !== 'project') return null
  const entityId = Number(entityArt.entityId)
  return Number.isInteger(entityId) && entityId > 0 ? entityId : null
}

const PROJECT_LIST_FRESH_MS_UNUSED_SENTINEL = PROJECT_LIST_FRESH_MS
""".replace(
        "const PROJECT_LIST_FRESH_MS_UNUSED_SENTINEL = PROJECT_LIST_FRESH_MS\n",
        "",
    ),
    'Project ArtJob queue types',
)

store = replace_once(
    store,
    """  const canonicalCoverage = ref(-1)
  const canonicalKey = ref('')
  const inFlightLists = new Map<string, Promise<ProjectWithRelations[]>>()
""",
    """  const canonicalCoverage = ref(-1)
  const canonicalKey = ref('')
  const inFlightLists = new Map<string, Promise<ProjectWithRelations[]>>()
  const projectArtJobMarkers = new Map<number, string>()
  let projectArtSyncClients = 0
  let projectArtSyncRunning = false
  let projectArtSyncTimer: ReturnType<typeof setTimeout> | null = null
""",
    'Project ArtJob sync state',
)

store = replace_once(
    store,
    """  async function applyPlacements(
    overwriteLiveUrl = false,
  ): Promise<ApplyPlacementsResult> {
""",
    """  async function refreshProjectSilently(id: number): Promise<void> {
    const response = await performFetch<ProjectWithRelations>(
      `/api/projects/${id}?refresh=${Date.now()}`,
      { cache: 'no-store' },
    )
    if (response.success && response.data) replaceProject(response.data)
  }

  function scheduleProjectArtSync(delay: number): void {
    if (projectArtSyncTimer) clearTimeout(projectArtSyncTimer)
    projectArtSyncTimer = null
    if (projectArtSyncClients < 1) return
    projectArtSyncTimer = setTimeout(() => {
      projectArtSyncTimer = null
      void pollProjectArtJobs()
    }, delay)
  }

  async function pollProjectArtJobs(): Promise<void> {
    if (projectArtSyncClients < 1 || projectArtSyncRunning) return
    projectArtSyncRunning = true
    let hasActiveProjectJobs = false

    try {
      const response = await performFetch<ProjectArtQueueData>(
        '/api/art/queue?pageSize=200',
        { cache: 'no-store' },
      )
      if (!response.success) return

      const refreshIds = new Set<number>()
      for (const job of response.data?.jobs ?? []) {
        const entityId = projectArtEntityId(job)
        if (!entityId) continue

        const status = String(job.status || '').toUpperCase()
        if (status === 'PENDING' || status === 'RUNNING') {
          hasActiveProjectJobs = true
        }

        const marker = [
          status,
          Number(job.artImageId) || 0,
          job.updatedAt ? new Date(job.updatedAt).getTime() : 0,
        ].join(':')
        const previousMarker = projectArtJobMarkers.get(job.id)
        projectArtJobMarkers.set(job.id, marker)

        if (status === 'DONE' && marker !== previousMarker) {
          refreshIds.add(entityId)
        }
      }

      await Promise.all([...refreshIds].map(refreshProjectSilently))
    } catch {
      // Queue synchronization is best-effort. The durable completion path owns
      // the database update; the next poll or page refresh can reconcile UI state.
    } finally {
      projectArtSyncRunning = false
      scheduleProjectArtSync(
        hasActiveProjectJobs
          ? PROJECT_ART_ACTIVE_POLL_MS
          : PROJECT_ART_IDLE_POLL_MS,
      )
    }
  }

  function startProjectArtJobSync(): void {
    projectArtSyncClients += 1
    if (projectArtSyncClients === 1) void pollProjectArtJobs()
  }

  function stopProjectArtJobSync(): void {
    projectArtSyncClients = Math.max(0, projectArtSyncClients - 1)
    if (projectArtSyncClients > 0) return
    if (projectArtSyncTimer) clearTimeout(projectArtSyncTimer)
    projectArtSyncTimer = null
  }

  async function applyPlacements(
    overwriteLiveUrl = false,
  ): Promise<ApplyPlacementsResult> {
""",
    'Project ArtJob sync functions',
)

store = replace_once(
    store,
    """    archiveProject,
    applyPlacements,
  }
})
""",
    """    archiveProject,
    applyPlacements,
    startProjectArtJobSync,
    stopProjectArtJobSync,
  }
})
""",
    'Project store return surface',
)
write(store_path, store)

page_path = 'components/pages/conductor-page.vue'
page = read(page_path)
page = replace_once(
    page,
    """onBeforeUnmount(() => {
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  pageStore.clearCards()
})
""",
    """onBeforeUnmount(() => {
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  projectStore.stopProjectArtJobSync()
  pageStore.clearCards()
})
""",
    'Conductor page stop Project art sync',
)
page = replace_once(
    page,
    """onMounted(() => {
  const saved = localStorage.getItem(
""",
    """onMounted(() => {
  projectStore.startProjectArtJobSync()
  const saved = localStorage.getItem(
""",
    'Conductor page start Project art sync',
)
write(page_path, page)

gallery_path = 'components/pages/conductor-project-gallery-page.vue'
gallery = read(gallery_path)
gallery = replace_once(
    gallery,
    "import { computed, onMounted, ref, watch } from 'vue'",
    "import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'",
    'Project gallery unmount import',
)
gallery = replace_once(
    gallery,
    """onMounted(async () => { if (import.meta.client) { const mode = localStorage.getItem('conductor-gallery-mode') as Mode | null; if (mode && modes.some((entry) => entry.value === mode)) galleryMode.value = mode; const saved = localStorage.getItem('conductor-project-filter') as Filter | null; if (saved && filters.some((entry) => entry.value === saved)) filter.value = saved } await load(false) })
const load = (force: boolean) => Promise.all([projects.fetchProjects({ includeInactive: true, includeMature: true }, force), conductor.fetchProjects(force), todos.hasLoaded ? todos.fetchTodos(force) : Promise.resolve()])
""",
    """onMounted(async () => { projects.startProjectArtJobSync(); if (import.meta.client) { const mode = localStorage.getItem('conductor-gallery-mode') as Mode | null; if (mode && modes.some((entry) => entry.value === mode)) galleryMode.value = mode; const saved = localStorage.getItem('conductor-project-filter') as Filter | null; if (saved && filters.some((entry) => entry.value === saved)) filter.value = saved } await load(false) })
onBeforeUnmount(() => projects.stopProjectArtJobSync())
const load = (force: boolean) => Promise.all([projects.fetchProjects({ includeInactive: true, includeMature: true }, force), conductor.fetchProjects(force), todos.hasLoaded ? todos.fetchTodos(force) : Promise.resolve()])
""",
    'Project gallery live ArtJob sync lifecycle',
)
write(gallery_path, gallery)

contract_path = 'utils/scripts/verifyEntityArtManager.ts'
contract = read(contract_path)
contract = replace_once(
    contract,
    """expectContains('components/pages/conductor-art-gallery.vue', [
  "'/api/art/enqueue'",
  "entityType: 'project'",
  'Queued as ArtJob',
  'startPolling(jobId)',
])
""",
    """expectContains('components/pages/conductor-art-gallery.vue', [
  "'/api/art/enqueue'",
  "entityType: 'project'",
  'queued as ArtJob',
  'startPolling(jobId)',
])

expectContains('stores/projectStore.ts', [
  "'/api/art/queue?pageSize=200'",
  "entityArt.entityType !== 'project'",
  'refreshProjectSilently',
  'startProjectArtJobSync',
  'stopProjectArtJobSync',
])

expectContains('components/pages/conductor-page.vue', [
  'projectStore.startProjectArtJobSync()',
  'projectStore.stopProjectArtJobSync()',
])

expectContains('components/pages/conductor-project-gallery-page.vue', [
  'projects.startProjectArtJobSync()',
  'projects.stopProjectArtJobSync()',
])
""",
    'Project live completion contract',
)
write(contract_path, contract)

for temporary in [
    'utils/scripts/diagnoseProjectArtCompletion.ts',
    '.github/project-art-live-sync-patch.py',
    '.github/workflows/project-art-completion-diagnostic.yml',
]:
    Path(temporary).unlink(missing_ok=True)

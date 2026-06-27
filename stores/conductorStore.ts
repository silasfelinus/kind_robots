// stores/conductorStore.ts
// Thin shared state for conductor API data — populated by conductor-page, consumed by conductor-hand.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ConductorData, ConductorProject } from '@/server/api/conductor/projects.get'
import type {
  ConductorCard,
  ConductorProjectKind,
  ConductorTaskStatus,
} from '@/stores/helpers/conductorCards'

const STATUS_PRIORITY: Record<string, number> = {
  blocked: 0,
  'needs-human': 1,
  claimed: 2,
  review: 3,
  ready: 4,
  waiting: 5,
  done: 6,
}

function dominantStatus(project: ConductorProject): ConductorTaskStatus {
  let best: ConductorTaskStatus = 'done'
  let bestPriority = 99
  for (const task of project.tasks) {
    const p = STATUS_PRIORITY[task.status] ?? 99
    if (p < bestPriority) {
      bestPriority = p
      best = task.status as ConductorTaskStatus
    }
  }
  return project.tasks.length ? best : 'ready'
}

function kindIcon(kind: string): string {
  if (kind === 'software') return 'kind-icon:code'
  if (kind === 'proposal') return 'kind-icon:sparkles'
  return 'kind-icon:document'
}

function projectToCard(project: ConductorProject, index: number): ConductorCard {
  return {
    key: project.slug,
    label: project.name || project.slug,
    title: project.name || project.slug,
    icon: kindIcon(project.kind),
    tagline: '',
    narrative: '',
    description: project.tasks.find((t) => t.status === 'ready')?.title ?? '',
    deckImage: project.cardPath,
    heroImage: project.heroPath,
    projectKind: project.kind as ConductorProjectKind,
    taskStatus: dominantStatus(project),
    priority: index + 1,
    steps: [],
    restoresFields: [],
  }
}

export const useConductorStore = defineStore('conductor', () => {
  const _data = ref<ConductorData | null>(null)

  const projects = computed(() => _data.value?.projects ?? [])
  const pitches = computed(() => _data.value?.pitches ?? [])
  const fetchedAt = computed(() => _data.value?.fetchedAt ?? null)

  const conductorCards = computed<ConductorCard[]>(() =>
    projects.value.map((p, i) => projectToCard(p, i)),
  )

  function setData(newData: ConductorData) {
    _data.value = newData
  }

  return { projects, pitches, fetchedAt, conductorCards, setData }
})

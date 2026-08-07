from pathlib import Path

store = Path('stores/conductorStore.ts')
text = store.read_text(encoding='utf-8')
old = """  const humanGates = computed<ConductorHumanGate[]>(() =>
    allHumanGates.value.filter(
      ({ project }) => project.conductorStatus === 'active',
    ),
  )
"""
new = """  const humanGates = computed<ConductorHumanGate[]>(() =>
    allHumanGates.value.filter(({ project }) =>
      ['active', 'continuous'].includes(project.conductorStatus ?? ''),
    ),
  )
"""
if old not in text:
    raise SystemExit('conductorStore humanGates anchor drifted')
store.write_text(text.replace(old, new, 1), encoding='utf-8')

page = Path('components/pages/conductor-page.vue')
text = page.read_text(encoding='utf-8')
old = """const activeProjects = computed(() =>
  projects.value.filter((project) => {
    const status = projectRecordForSlug(project.slug)?.status
    return status !== 'BRAINSTORM' && status !== 'ARCHIVED'
  }),
)

const sortedActiveProjects = computed(() =>
  [...activeProjects.value].sort((a, b) => {
    const order: Record<ProjectPriorityLevel, number> = {
      HIGH: 0,
      NORMAL: 1,
      LOW: 2,
    }
    const pa =
      (projectRecordForSlug(a.slug)?.priority as
        ProjectPriorityLevel | undefined) ?? 'NORMAL'
    const pb =
      (projectRecordForSlug(b.slug)?.priority as
        ProjectPriorityLevel | undefined) ?? 'NORMAL'
    return (order[pa] ?? 1) - (order[pb] ?? 1)
  }),
)
"""
new = """const activeProjects = computed(() =>
  projects.value.filter((project) => {
    if (project.conductorStatus) {
      return ['active', 'continuous'].includes(project.conductorStatus)
    }
    // Database-only projects have no Conductor lifecycle yet. Treat only the
    // live runtime ACTIVE state as workspace-active; DONE/PAUSED/ARCHIVED stay out.
    return projectRecordForSlug(project.slug)?.status === 'ACTIVE'
  }),
)

const sortedActiveProjects = computed(() =>
  [...activeProjects.value].sort((a, b) => {
    const lifecycleOrder = { active: 0, continuous: 1 } as const
    const lifecycleA = a.conductorStatus ?? 'active'
    const lifecycleB = b.conductorStatus ?? 'active'
    const lifecycleDelta =
      (lifecycleOrder[lifecycleA as keyof typeof lifecycleOrder] ?? 0) -
      (lifecycleOrder[lifecycleB as keyof typeof lifecycleOrder] ?? 0)
    if (lifecycleDelta !== 0) return lifecycleDelta

    const order: Record<ProjectPriorityLevel, number> = {
      HIGH: 0,
      NORMAL: 1,
      LOW: 2,
    }
    const pa =
      (projectRecordForSlug(a.slug)?.priority as
        ProjectPriorityLevel | undefined) ?? 'NORMAL'
    const pb =
      (projectRecordForSlug(b.slug)?.priority as
        ProjectPriorityLevel | undefined) ?? 'NORMAL'
    return (order[pa] ?? 1) - (order[pb] ?? 1)
  }),
)
"""
if old not in text:
    raise SystemExit('conductor-page active-project anchor drifted')
text = text.replace(old, new, 1)
old = """                <span
                  v-else
                  class=\"badge badge-sm shrink-0\"
                  :class=\"kindBadgeClass(selectedProject.kind)\"
                  >{{ selectedProject.kind }}</span
                >
"""
new = old + """                <span
                  v-if=\"selectedProject.conductorStatus\"
                  class=\"badge badge-sm shrink-0\"
                  :class=\"
                    selectedProject.conductorStatus === 'continuous'
                      ? 'badge-accent'
                      : selectedProject.conductorStatus === 'active'
                        ? 'badge-success'
                        : 'badge-ghost'
                  \"
                  >{{ selectedProject.conductorStatus }}</span
                >
"""
if old not in text:
    raise SystemExit('conductor-page hero badge anchor drifted')
page.write_text(text.replace(old, new, 1), encoding='utf-8')

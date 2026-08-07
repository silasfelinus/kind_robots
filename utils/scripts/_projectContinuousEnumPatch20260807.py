from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'anchor drifted: {path}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


replace_once(
    'prisma/schema.prisma',
    """enum ProjectStatus {
  ACTIVE
  PAUSED
  DONE
  ARCHIVED
  BRAINSTORM
}""",
    """enum ProjectStatus {
  ACTIVE
  PAUSED
  DONE
  ARCHIVED
  BRAINSTORM
  CONTINUOUS
}""",
)

replace_once(
    'server/utils/conductorProjectRegistry.ts',
    """export type ProjectLifecycleStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DONE'
  | 'ARCHIVED'
  | 'BRAINSTORM'""",
    """export type ProjectLifecycleStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DONE'
  | 'ARCHIVED'
  | 'BRAINSTORM'
  | 'CONTINUOUS'""",
)
replace_once(
    'server/utils/conductorProjectRegistry.ts',
    "  continuous: 'ACTIVE',",
    "  continuous: 'CONTINUOUS',",
)
replace_once(
    'server/utils/conductorProjectRegistry.ts',
    """  ACTIVE: 'active',
  PAUSED: 'paused',""",
    """  ACTIVE: 'active',
  CONTINUOUS: 'continuous',
  PAUSED: 'paused',""",
)

replace_once(
    'server/api/projects/index.ts',
    """export const projectStatuses = new Set<ProjectStatus>([
  'ACTIVE',
  'PAUSED',""",
    """export const projectStatuses = new Set<ProjectStatus>([
  'ACTIVE',
  'CONTINUOUS',
  'PAUSED',""",
)

replace_once(
    'server/api/conductor/overrides.post.ts',
    "const VALID_STATUSES = ['active', 'paused', 'retired', 'finished'] as const",
    "const VALID_STATUSES = ['active', 'continuous', 'paused', 'retired', 'finished'] as const",
)
replace_once(
    'server/api/conductor/overrides.post.ts',
    "# Agents: check this before claiming tasks — skip projects where status != active.",
    "# Agents: finite active work outranks continuous; paused/retired/finished are not selectable work.",
)
replace_once(
    'server/api/conductor/overrides.post.ts',
    "# status:   active | paused | retired | finished",
    "# status:   active | continuous | paused | retired | finished",
)

replace_once(
    'components/pages/conductor-page.vue',
    "type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED' | 'BRAINSTORM'",
    "type ProjectStatus =\n  | 'ACTIVE'\n  | 'CONTINUOUS'\n  | 'PAUSED'\n  | 'DONE'\n  | 'ARCHIVED'\n  | 'BRAINSTORM'",
)
replace_once(
    'components/pages/conductor-page.vue',
    """                <option value=\"ACTIVE\">ACTIVE</option>
                <option value=\"PAUSED\">PAUSED</option>""",
    """                <option value=\"ACTIVE\">ACTIVE</option>
                <option value=\"CONTINUOUS\">CONTINUOUS</option>
                <option value=\"PAUSED\">PAUSED</option>""",
)

replace_once(
    'components/pages/conductor-project-gallery-page.vue',
    "type Status = 'ACTIVE' | 'PAUSED' | 'DONE' | 'BRAINSTORM' | 'ARCHIVED'",
    "type Status = 'ACTIVE' | 'CONTINUOUS' | 'PAUSED' | 'DONE' | 'BRAINSTORM' | 'ARCHIVED'",
)
replace_once(
    'components/pages/conductor-project-gallery-page.vue',
    "const filters = [{ value: 'ACTIVE' as const, label: 'Active', icon: 'kind-icon:sparkles' }, { value: 'PAUSED' as const, label: 'Paused', icon: 'kind-icon:pause' },",
    "const filters = [{ value: 'ACTIVE' as const, label: 'Active', icon: 'kind-icon:sparkles' }, { value: 'CONTINUOUS' as const, label: 'Continuous', icon: 'kind-icon:refresh' }, { value: 'PAUSED' as const, label: 'Paused', icon: 'kind-icon:pause' },",
)
replace_once(
    'components/pages/conductor-project-gallery-page.vue',
    "const statusClass = (value: Status) => value === 'DONE' ? 'badge-success' : value === 'PAUSED' ? 'badge-warning' : value === 'ARCHIVED' ? 'badge-ghost' : value === 'BRAINSTORM' ? 'badge-secondary' : 'badge-primary'",
    "const statusClass = (value: Status) => value === 'DONE' ? 'badge-success' : value === 'CONTINUOUS' ? 'badge-accent' : value === 'PAUSED' ? 'badge-warning' : value === 'ARCHIVED' ? 'badge-ghost' : value === 'BRAINSTORM' ? 'badge-secondary' : 'badge-primary'",
)

replace_once(
    'utils/scripts/verifyConductorProjectRegistry.ts',
    """  - slug: paused-project
    status: paused # tabled by Silas""",
    """  - slug: continuous-project
    status: continuous
    priority: normal
  - slug: paused-project
    status: paused # tabled by Silas""",
)
replace_once(
    'utils/scripts/verifyConductorProjectRegistry.ts',
    "check('all lifecycle entries are parsed', parsed.length === 4, String(parsed.length))",
    "check('all lifecycle entries are parsed', parsed.length === 5, String(parsed.length))",
)
replace_once(
    'utils/scripts/verifyConductorProjectRegistry.ts',
    """check('active maps to ACTIVE', conductorStatusToProjectStatus(parsed[0]!.status) === 'ACTIVE')
check('paused maps to PAUSED', conductorStatusToProjectStatus(parsed[1]!.status) === 'PAUSED')
check('finished maps to DONE', conductorStatusToProjectStatus(parsed[2]!.status) === 'DONE')
check('retired maps to ARCHIVED', conductorStatusToProjectStatus(parsed[3]!.status) === 'ARCHIVED')
check('urgent maps to HIGH', conductorPriorityToProjectPriority(parsed[2]!.priority) === 'HIGH')
check('ACTIVE maps back to active', projectStatusToConductorStatus('ACTIVE') === 'active')""",
    """check('active maps to ACTIVE', conductorStatusToProjectStatus(parsed[0]!.status) === 'ACTIVE')
check('continuous maps to CONTINUOUS', conductorStatusToProjectStatus(parsed[1]!.status) === 'CONTINUOUS')
check('paused maps to PAUSED', conductorStatusToProjectStatus(parsed[2]!.status) === 'PAUSED')
check('finished maps to DONE', conductorStatusToProjectStatus(parsed[3]!.status) === 'DONE')
check('retired maps to ARCHIVED', conductorStatusToProjectStatus(parsed[4]!.status) === 'ARCHIVED')
check('urgent maps to HIGH', conductorPriorityToProjectPriority(parsed[3]!.priority) === 'HIGH')
check('ACTIVE maps back to active', projectStatusToConductorStatus('ACTIVE') === 'active')
check('CONTINUOUS maps back to continuous', projectStatusToConductorStatus('CONTINUOUS') === 'continuous')""",
)

replace_once(
    'docs/conductor-projection.md',
    "- `status`;\n- `priority`;",
    "- `status` (including first-class `CONTINUOUS` for Conductor's `continuous` lifecycle);\n- `priority`;",
)

migration = Path('prisma/migrations/20260807110500_add_project_continuous_status/migration.sql')
migration.parent.mkdir(parents=True, exist_ok=True)
if migration.exists():
    raise SystemExit(f'migration already exists: {migration}')
migration.write_text(
    """-- Preserve the existing enum value order so MariaDB/MySQL ordinal storage does not shift.
ALTER TABLE `Project`
  MODIFY `status` ENUM('ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED', 'BRAINSTORM', 'CONTINUOUS') NOT NULL DEFAULT 'BRAINSTORM';
""",
    encoding='utf-8',
)

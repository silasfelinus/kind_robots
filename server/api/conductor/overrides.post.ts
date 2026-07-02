import { conductorGet, conductorPut } from '~/server/utils/conductor-github'
import { requireAdminApiUser } from '@/server/utils/authGuard'

const VALID_STATUSES = ['active', 'paused', 'retired', 'finished'] as const
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
const VALID_KINDS = ['software', 'content', 'proposal', 'brainstorm'] as const

type Status = (typeof VALID_STATUSES)[number]
type Priority = (typeof VALID_PRIORITIES)[number]
type Kind = (typeof VALID_KINDS)[number]

interface OverrideEntry {
  status: Status
  priority: Priority
  kind?: Kind
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const body = await readBody<Record<string, OverrideEntry>>(event)

  const lines = [
    '# Human-managed project overrides. Written by the workspace UI.',
    '# Agents: check this before claiming tasks — skip projects where status != active.',
    '# Priority controls how often agents pick tasks (high = more attention).',
    '# status:   active | paused | retired | finished',
    '# priority: low | normal | high | urgent',
    '# kind:     software | content | proposal | brainstorm (overrides roadmap kind for UI)',
    '',
    'overrides:',
  ]

  for (const [slug, o] of Object.entries(body)) {
    if (!/^[a-z0-9-]+$/.test(slug)) continue
    const status = VALID_STATUSES.includes(o?.status as Status) ? o.status : 'active'
    const priority = VALID_PRIORITIES.includes(o?.priority as Priority) ? o.priority : 'normal'
    const kind = o?.kind && VALID_KINDS.includes(o.kind as Kind) ? o.kind : undefined
    lines.push('')
    lines.push(`  - slug: ${slug}`)
    lines.push(`    status: ${status}`)
    lines.push(`    priority: ${priority}`)
    if (kind) lines.push(`    kind: ${kind}`)
  }

  const content = lines.join('\n') + '\n'
  const existing = await conductorGet('project-overrides.yaml')
  await conductorPut(
    'project-overrides.yaml',
    content,
    'chore: update project overrides from workspace UI',
    existing?.sha,
  )

  return { ok: true }
})

import { conductorGet, conductorPut } from '~/server/utils/conductor-github'
import { requireAdminApiUser } from '@/server/utils/authGuard'

const VALID_STATUSES = [
  'active',
  'continuous',
  'paused',
  'retired',
  'finished',
] as const
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Locate the `  - slug: <slug>` block. Returns the [start, end) span of the
 * whole block (up to the next top-level `- slug:` entry, or EOF). */
function findBlockSpan(text: string, slug: string): [number, number] | null {
  const startRe = new RegExp(`^  - slug: ${escapeRegExp(slug)}\\s*$`, 'm')
  const m = startRe.exec(text)
  if (!m) return null
  const blockStart = m.index
  const afterStart = m.index + m[0].length
  const nextRe = /^ {2}- slug: /m
  const nextM = nextRe.exec(text.slice(afterStart))
  const blockEnd = nextM ? afterStart + nextM.index : text.length
  return [blockStart, blockEnd]
}

/** Patch only the `status`/`priority`/`kind` fields of an existing block, in
 * place, leaving every other line (liveUrl, channelKey, tabKey, inline
 * comments, blank-line separators) untouched. Only the field's own value
 * token is replaced -- never the rest of the line -- so a trailing inline
 * comment (e.g. "status: paused # tabled 2026-07-26 by Silas...") survives. */
function patchBlock(
  block: string,
  status: Status,
  priority: Priority,
  kind: Kind | undefined,
): string {
  block = block.replace(/^(\s*status:)\s*\S+/m, `$1 ${status}`)
  block = block.replace(/^(\s*priority:)\s*\S+/m, `$1 ${priority}`)

  if (kind) {
    if (/^\s*kind:\s*\S+/m.test(block)) {
      block = block.replace(/^(\s*kind:)\s*\S+/m, `$1 ${kind}`)
    } else {
      // Insert right after the priority line -- keep that line's own
      // trailing comment intact by capturing the whole line, not just its value.
      block = block.replace(/^(\s*priority:.*)$/m, `$1\n    kind: ${kind}`)
    }
  }
  // kind omitted -> the UI isn't setting it for this slug; leave whatever the
  // file already has (do not clear an existing kind field).

  return block
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)

  const body = await readBody<Record<string, OverrideEntry>>(event)

  const existing = await conductorGet('project-overrides.yaml')
  let text = existing?.content ?? 'overrides:\n'

  for (const [slug, o] of Object.entries(body)) {
    if (!/^[a-z0-9-]+$/.test(slug)) continue
    const status = VALID_STATUSES.includes(o?.status as Status)
      ? o.status
      : 'active'
    const priority = VALID_PRIORITIES.includes(o?.priority as Priority)
      ? o.priority
      : 'normal'
    const kind =
      o?.kind && VALID_KINDS.includes(o.kind as Kind) ? o.kind : undefined

    const span = findBlockSpan(text, slug)
    if (span) {
      const [start, end] = span
      const patched = patchBlock(text.slice(start, end), status, priority, kind)
      text = text.slice(0, start) + patched + text.slice(end)
      continue
    }

    // New slug -- append a fresh block at the end of the file, same
    // convention as scripts/intake.py's register_override.
    const entryLines = [
      `  - slug: ${slug}`,
      `    status: ${status}`,
      `    priority: ${priority}`,
    ]
    if (kind) entryLines.push(`    kind: ${kind}`)
    const entry = entryLines.join('\n') + '\n'

    const hasOverridesKey = /^overrides:\s*$/m.test(text)
    text =
      text.replace(/\s*$/, '\n') +
      '\n' +
      (hasOverridesKey ? '' : 'overrides:\n') +
      entry
  }

  await conductorPut(
    'project-overrides.yaml',
    text,
    'chore: update project overrides from workspace UI',
    existing?.sha,
  )

  return { ok: true }
})

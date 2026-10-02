// /server/utils/conductorPitchVote.ts
// Writes a pitch decision into silasfelinus/conductor's pitches/<slug>.md. Shared by the
// signed-in project-page vote (api/conductor/pitch-vote.post.ts) and the signed
// email link (api/conductor/pitch-decision.*), so both change the file the same way.
import { conductorGet, conductorList, conductorPut } from './conductor-github'
import type { PitchStatus } from '@/stores/conductorStore'

export const PITCH_STATUSES = new Set<PitchStatus>([
  'awaiting-silas',
  'approved',
  'rejected',
  'duplicate',
  'superseded',
  'archived',
])

export function canonicalPitchStatus(value: string): PitchStatus | null {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'passed' || normalized === 'declined') return 'rejected'
  return PITCH_STATUSES.has(normalized as PitchStatus)
    ? (normalized as PitchStatus)
    : null
}

export function pitchStatusOf(content: string): string {
  return content.match(/^status:\s*([^#\n]*)/m)?.[1]?.trim() || 'awaiting-silas'
}

export function pitchTitleOf(content: string, fallback: string): string {
  return content.match(/^#\s*Pitch:\s*(.+)$/m)?.[1]?.trim() || fallback
}

export function pitchIdeaOf(content: string): string {
  const lines = content.split('\n')
  const start = lines.findIndex((line) => /^##\s*The idea/i.test(line))
  if (start < 0) return ''
  const body: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^##/.test(line)) break
    body.push(line)
  }
  return body.join(' ').replace(/\s+/g, ' ').trim()
}

export const PITCH_MODS_HEADING = "## Silas's modifications"

// Notes become a section of the pitch file so the session that scaffolds the project
// reads them next to the idea. Heading-like lines are escaped so notes cannot add
// sections; a repeat submission replaces the previous notes.
export function withPitchModifications(content: string, notes: string): string {
  const stripped = content
    .replace(/\n*## Silas's modifications[\s\S]*?(?=\n## |$)/, '')
    .trimEnd()
  const clean = notes.trim().replace(/^#/gm, '\\#')
  return clean
    ? `${stripped}\n\n${PITCH_MODS_HEADING}\n${clean}\n`
    : `${stripped}\n`
}

export async function applyPitchVote(
  slug: string,
  status: PitchStatus,
  options: { notes?: string } = {},
) {
  const path = `pitches/${slug}.md`
  const file = await conductorGet(path)

  if (!file) {
    throw createError({
      statusCode: 404,
      statusMessage: `Pitch not found: ${slug}`,
    })
  }

  const statusLine = `status: ${status}`
  let updated = /^status:.*$/m.test(file.content)
    ? file.content.replace(/^status:.*$/m, statusLine)
    : file.content.replace(/^(project-target:.*)$/m, `$1\n${statusLine}`)
  const hasNotes = Boolean(options.notes?.trim())
  if (hasNotes) updated = withPitchModifications(updated, options.notes ?? '')

  if (updated === file.content) {
    return { success: true, changed: false, path, status }
  }

  await conductorPut(
    path,
    updated,
    `pitch: mark ${slug} ${status}${hasNotes ? ' with changes' : ''}`,
    file.sha,
  )

  return { success: true, changed: true, path, status }
}

export interface PendingPitch {
  slug: string
  title: string
  idea: string
}

/** Every pitches/<date>-*.md still awaiting Silas, newest first. */
export async function listPendingPitches(): Promise<PendingPitch[]> {
  const entries = (await conductorList('pitches')) ?? []
  const slugs = entries
    .filter(
      (e) => e.type === 'file' && /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(e.name),
    )
    .map((e) => e.name.replace(/\.md$/, ''))
    .sort()
    .reverse()
  const files = await Promise.all(
    slugs.map(async (slug) => ({
      slug,
      file: await conductorGet(`pitches/${slug}.md`),
    })),
  )
  return files.flatMap(({ slug, file }) =>
    file && pitchStatusOf(file.content) === 'awaiting-silas'
      ? [
          {
            slug,
            title: pitchTitleOf(file.content, slug),
            idea: pitchIdeaOf(file.content),
          },
        ]
      : [],
  )
}

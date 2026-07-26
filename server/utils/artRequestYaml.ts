// /server/utils/artRequestYaml.ts
//
// Rendering of Conductor art-queue entries into the exact YAML list style that
// conductor's projects/art-prompts.yaml uses.
//
// This lives in its own module (extracted from api/conductor/art-request.post.ts)
// so the indentation and normalization contracts can be unit-tested without
// pulling in prisma or the Nuxt server runtime. See
// utils/scripts/verifyArtRequestYaml.ts.
//
// THE CONTRACT (art-generator-connect/t-008): every request is a block-sequence
// item whose `- ` marker sits at COLUMN 0 and whose continuation keys are indented
// exactly 2 spaces. conductor's PyYAML parser rejects mixed indentation, which is
// the silent-stall bug this module's test guards against (kind_robots PR #84).
import {
  KIND_ROBOTS_REPO,
  normalizeKindRobotsImagePath,
  replaceVagueArtDirection,
} from './artJobNormalization'

export type ArtVariant = 'icon' | 'card' | 'hero' | 'image'

export type ArtQueueEntry = {
  id: string
  source: string
  status: 'pending'
  target_repo: string
  image_path: string
  source_url: string
  page_url: string
  variant: ArtVariant
  size: string
  label: string
  prompt: string
  project_id?: number
  project_slug?: string
  project_field?: string
}

export function yamlQuoted(value: string): string {
  return JSON.stringify(value)
}

export function yamlFolded(
  key: string,
  value: string,
  indent = '    ',
): string {
  const clean = value.replace(/\r/g, '').replace(/\n+/g, ' ').trim()
  if (!clean) return `${key}: ""`
  return `${key}: >\n${indent}${clean}`
}

export function normalizeArtQueueEntry(entry: ArtQueueEntry): ArtQueueEntry {
  if (entry.target_repo !== KIND_ROBOTS_REPO) {
    return {
      ...entry,
      prompt: replaceVagueArtDirection(entry.prompt),
    }
  }

  return {
    ...entry,
    image_path: normalizeKindRobotsImagePath(entry.image_path),
    prompt: replaceVagueArtDirection(entry.prompt),
  }
}

// Entries must sit at column 0 to match the existing `requests:` list style in
// conductor's art-prompts.yaml — mixed indentation breaks the YAML parser there.
export function renderRequestEntry(entry: ArtQueueEntry): string {
  const normalized = normalizeArtQueueEntry(entry)
  const lines = [
    `- id: ${yamlQuoted(normalized.id)}`,
    `  source: ${yamlQuoted(normalized.source)}`,
    `  status: ${yamlQuoted(normalized.status)}`,
    `  target_repo: ${yamlQuoted(normalized.target_repo)}`,
    `  image_path: ${yamlQuoted(normalized.image_path)}`,
    `  source_url: ${yamlQuoted(normalized.source_url)}`,
  ]

  if (normalized.page_url) {
    lines.push(`  page_url: ${yamlQuoted(normalized.page_url)}`)
  }
  lines.push(`  variant: ${yamlQuoted(normalized.variant)}`)
  if (normalized.size) lines.push(`  size: ${yamlQuoted(normalized.size)}`)
  if (normalized.label) lines.push(`  label: ${yamlQuoted(normalized.label)}`)
  if (normalized.project_id)
    lines.push(`  project_id: ${normalized.project_id}`)
  if (normalized.project_slug) {
    lines.push(`  project_slug: ${yamlQuoted(normalized.project_slug)}`)
  }
  if (normalized.project_field) {
    lines.push(`  project_field: ${yamlQuoted(normalized.project_field)}`)
  }
  lines.push(`  ${yamlFolded('prompt', normalized.prompt, '    ')}`)

  return lines.join('\n')
}

const ACTIVE_REQUEST_STATUSES = new Set([
  'pending',
  'queued',
  'running',
  'processing',
])

function requestValue(block: string, key: string): string {
  const prefix = key === 'id' ? '^- id:' : `^\\s{2}${key}:`
  const match = block.match(new RegExp(`${prefix}\\s*(.+?)\\s*$`, 'm'))
  if (!match?.[1]) return ''
  const value = match[1].trim()
  if (value.startsWith('"')) {
    try {
      return String(JSON.parse(value))
    } catch {}
  }
  return value.replace(/^['\"]|['\"]$/g, '')
}

function requestBlocks(content: string): string[] {
  return content
    .split(/(?=^- id:)/m)
    .filter((block) => block.startsWith('- id:'))
}

export function requestAlreadyQueued(
  content: string,
  entry: ArtQueueEntry,
): boolean {
  const normalized = normalizeArtQueueEntry(entry)

  return requestBlocks(content).some((block) => {
    const status = requestValue(block, 'status').toLowerCase() || 'pending'
    if (!ACTIVE_REQUEST_STATUSES.has(status)) return false
    return (
      requestValue(block, 'id') === normalized.id ||
      requestValue(block, 'image_path') === normalized.image_path
    )
  })
}

export function appendRequest(content: string, entry: ArtQueueEntry): string {
  const normalized = normalizeArtQueueEntry(entry)
  if (requestAlreadyQueued(content, normalized)) return content

  const serialized = renderRequestEntry(normalized)
  const trimmed = content.trimEnd()

  if (/^requests:\s*\[\]\s*$/m.test(trimmed)) {
    return `${trimmed.replace(/^requests:\s*\[\]\s*$/m, `requests:\n${serialized}`)}\n`
  }

  if (/^requests:\s*$/m.test(trimmed)) {
    const header = /^requests:\s*$/m.exec(trimmed)
    if (!header) return `${trimmed}\n${serialized}\n`

    const sectionStart = header.index + header[0].length
    const tail = trimmed.slice(sectionStart)
    const nextSection = tail.match(/\n(?=[A-Za-z_][\w-]*:\s*(?:\n|$))/)

    if (!nextSection || nextSection.index === undefined) {
      return `${trimmed}\n${serialized}\n`
    }

    const insertion = sectionStart + nextSection.index
    return `${trimmed.slice(0, insertion).trimEnd()}\n${serialized}\n\n${trimmed
      .slice(insertion)
      .trimStart()}\n`
  }

  return `${trimmed}\n\nrequests:\n${serialized}\n`
}

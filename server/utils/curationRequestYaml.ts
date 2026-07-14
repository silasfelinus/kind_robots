// /server/utils/curationRequestYaml.ts
//
// Pure, dependency-free rendering of Conductor art-curation requests into the
// block-sequence YAML style that conductor's projects/curation/requests.yaml uses.
//
// Extracted from api/conductor/curate-request.post.ts (mirroring artRequestYaml.ts)
// so the indentation contract can be reasoned about without pulling in h3, prisma,
// or the rest of the Nuxt server runtime.
//
// THE CONTRACT: every request is a block-sequence item whose `- ` marker sits at
// COLUMN 0 and whose continuation keys are indented exactly 2 spaces. conductor's
// PyYAML parser (scripts/curate_art.py --requests) rejects mixed indentation, so
// this is the same silent-stall guard artRequestYaml.ts protects against.

export type CurationRequestEntry = {
  id: string
  source: string
  status: 'pending'
  job_id: number
  art_image_id: number
  project_slug: string
  prompt: string
  note: string
  requested_at: string
}

function yamlQuoted(value: string): string {
  return JSON.stringify(value)
}

function yamlFolded(key: string, value: string, indent = '    '): string {
  const clean = value.replace(/\r/g, '').replace(/\n+/g, ' ').trim()
  if (!clean) return `${key}: ""`
  return `${key}: >\n${indent}${clean}`
}

// Entries sit at column 0 to match the `requests:` block-sequence style; mixed
// indentation breaks conductor's parser.
export function renderCurationEntry(entry: CurationRequestEntry): string {
  const lines = [
    `- id: ${yamlQuoted(entry.id)}`,
    `  source: ${yamlQuoted(entry.source)}`,
    `  status: ${yamlQuoted(entry.status)}`,
    `  job_id: ${entry.job_id}`,
    `  art_image_id: ${entry.art_image_id}`,
  ]

  if (entry.project_slug) {
    lines.push(`  project_slug: ${yamlQuoted(entry.project_slug)}`)
  }
  if (entry.note) lines.push(`  note: ${yamlQuoted(entry.note)}`)
  lines.push(`  requested_at: ${yamlQuoted(entry.requested_at)}`)
  lines.push(`  ${yamlFolded('prompt', entry.prompt, '    ')}`)

  return lines.join('\n')
}

// A request is "already queued" if the same job_id (the dedupe key) is present as
// a pending or in-flight entry. A `done`/`error` line still counts as queued so we
// don't re-request a job Conductor has already curated in this file's history;
// re-curation is an explicit re-run on the conductor side, not a duplicate append.
export function curationAlreadyQueued(
  content: string,
  entry: CurationRequestEntry,
): boolean {
  const idHit = new RegExp(`\\bid:\\s*"?${escapeRegExp(entry.id)}"?`).test(
    content,
  )
  const jobHit = new RegExp(`\\bjob_id:\\s*${entry.job_id}\\b`).test(content)
  return idHit || jobHit
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function appendCurationRequest(
  content: string,
  entry: CurationRequestEntry,
): string {
  if (curationAlreadyQueued(content, entry)) return content

  const serialized = renderCurationEntry(entry)
  const trimmed = content.trimEnd()

  if (/^requests:\s*\[\]\s*$/m.test(trimmed)) {
    return `${trimmed.replace(
      /^requests:\s*\[\]\s*$/m,
      `requests:\n${serialized}`,
    )}\n`
  }

  if (/^requests:\s*$/m.test(trimmed)) {
    return `${trimmed}\n${serialized}\n`
  }

  return `${trimmed}\n\nrequests:\n${serialized}\n`
}

// Seed body written when the queue file does not yet exist in conductor.
export const CURATION_REQUESTS_SEED = `# projects/curation/requests.yaml
#
# Front-end-submitted art-curation requests (kind_robots ArtJob trainer →
# Conductor). scripts/curate_art.py --requests drains this: for each pending
# entry it runs the vision assessor on the ArtImage and POSTs source=CURATOR
# feedback to POST /api/art/queue/<job_id>/feedback, then flips the entry to done.
requests: []
`

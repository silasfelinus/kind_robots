// /server/utils/artRequestYaml.ts
//
// Pure, dependency-free rendering of Conductor art-queue entries into the
// exact YAML list style that conductor's projects/art-prompts.yaml uses.
//
// This lives in its own module (extracted from api/conductor/art-request.post.ts)
// so the indentation contract can be unit-tested without pulling in h3, prisma,
// or the rest of the Nuxt server runtime. See utils/scripts/verifyArtRequestYaml.ts.
//
// THE CONTRACT (art-generator-connect/t-008): every request is a block-sequence
// item whose `- ` marker sits at COLUMN 0 and whose continuation keys are indented
// exactly 2 spaces. conductor's PyYAML parser rejects mixed indentation, which is
// the silent-stall bug this module's test guards against (kind_robots PR #84).

export type ArtQueueEntry = {
  id: string
  source: string
  status: 'pending'
  target_repo: string
  image_path: string
  source_url: string
  page_url: string
  variant: string
  size: string
  label: string
  prompt: string
}

export function yamlQuoted(value: string): string {
  return JSON.stringify(value)
}

export function yamlFolded(key: string, value: string, indent = '    '): string {
  const clean = value.replace(/\r/g, '').replace(/\n+/g, ' ').trim()
  if (!clean) return `${key}: ""`
  return `${key}: >\n${indent}${clean}`
}

// Entries must sit at column 0 to match the existing `requests:` list style in
// conductor's art-prompts.yaml — mixed indentation breaks the YAML parser there.
export function renderRequestEntry(entry: ArtQueueEntry): string {
  const lines = [
    `- id: ${yamlQuoted(entry.id)}`,
    `  source: ${yamlQuoted(entry.source)}`,
    `  status: ${yamlQuoted(entry.status)}`,
    `  target_repo: ${yamlQuoted(entry.target_repo)}`,
    `  image_path: ${yamlQuoted(entry.image_path)}`,
    `  source_url: ${yamlQuoted(entry.source_url)}`,
  ]

  if (entry.page_url) lines.push(`  page_url: ${yamlQuoted(entry.page_url)}`)
  lines.push(`  variant: ${yamlQuoted(entry.variant)}`)
  if (entry.size) lines.push(`  size: ${yamlQuoted(entry.size)}`)
  if (entry.label) lines.push(`  label: ${yamlQuoted(entry.label)}`)
  lines.push(`  ${yamlFolded('prompt', entry.prompt, '    ')}`)

  return lines.join('\n')
}

export function requestAlreadyQueued(content: string, entry: ArtQueueEntry): boolean {
  return content.includes(entry.id) || content.includes(entry.image_path)
}

export function appendRequest(content: string, entry: ArtQueueEntry): string {
  if (requestAlreadyQueued(content, entry)) return content

  const serialized = renderRequestEntry(entry)
  const trimmed = content.trimEnd()

  if (/^requests:\s*\[\]\s*$/m.test(trimmed)) {
    return `${trimmed.replace(/^requests:\s*\[\]\s*$/m, `requests:\n${serialized}`)}\n`
  }

  if (/^requests:\s*$/m.test(trimmed)) {
    return `${trimmed}\n${serialized}\n`
  }

  return `${trimmed}\n\nrequests:\n${serialized}\n`
}

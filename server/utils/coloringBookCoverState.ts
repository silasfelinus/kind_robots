import type {
  ColoringBookCoverHistoryItem,
  ColoringBookCoverState,
} from '~/types/coloringBookStudio'
import {
  COLORING_BOOK_REF,
  COLORING_BOOK_REPO,
  COLORING_BOOK_ROOT,
} from '@/server/utils/coloringBookStudio'

export const COLORING_BOOK_COVER_QUEUE_PATH = `${COLORING_BOOK_ROOT}/cover-art-jobs.yaml`

function capture(text: string, pattern: RegExp, group = 1): string | undefined {
  return pattern.exec(text)?.[group]
}

function indentation(line: string): number {
  return /^\s*/.exec(line)?.[0].length ?? 0
}

function yamlValue(value: string | undefined): string | null {
  const clean = String(value ?? '').trim()
  if (!clean || clean === 'null' || clean === '~') return null
  if (clean.startsWith('"')) {
    try {
      return String(JSON.parse(clean))
    } catch {}
  }
  return clean.replace(/^['"]|['"]$/g, '')
}

function yamlNumber(value: string | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function scalar(block: string, key: string): string | null {
  return yamlValue(
    capture(block, new RegExp(`^  ${key}:\\s*(.*?)\\s*$`, 'm')),
  )
}

function collectYamlText(block: string, key: string): string {
  const lines = block.split('\n')
  const index = lines.findIndex((line) => new RegExp(`^  ${key}:`).test(line))
  if (index < 0) return ''
  const line = lines[index] ?? ''
  const colon = line.indexOf(':')
  const first = colon >= 0 ? line.slice(colon + 1).trim() : ''
  const values: string[] = []
  if (first && first !== '>' && first !== '|') values.push(first)
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const next = lines[cursor] ?? ''
    if (next.trim() && indentation(next) <= 2) break
    if (next.trim()) values.push(next.trim())
  }
  return yamlValue(values.join(' ')) ?? ''
}

function listValues(block: string, key: string): string[] {
  const section = capture(
    block,
    new RegExp(
      `^  ${key}:\\s*(?:\\[\\])?\\s*$([\\s\\S]*?)(?=^  [a-z_]+:|$(?![\\s\\S]))`,
      'm',
    ),
  )
  if (!section) return []
  return [...section.matchAll(/^\s*-\s*(.*?)\s*$/gm)]
    .map((match) => yamlValue(match?.[1]) ?? '')
    .filter(Boolean)
}

function historyBlocks(block: string): string[] {
  const section = capture(
    block,
    /^  revision_history:\s*(?:\[\])?\s*$([\s\S]*?)(?=^  [a-z_]+:|$(?![\s\S]))/m,
  )
  if (!section) return []
  return section
    .split(/(?=^  - )/m)
    .filter((entry) => entry.startsWith('  - '))
}

function historyScalar(block: string, key: string): string | null {
  const first = capture(block, new RegExp(`^  - ${key}:\\s*(.*?)\\s*$`, 'm'))
  if (first !== undefined) return yamlValue(first)
  return yamlValue(
    capture(block, new RegExp(`^    ${key}:\\s*(.*?)\\s*$`, 'm')),
  )
}

function rawAssetUrl(path: string | null, bookSlug: string): string | null {
  const clean = String(path || '').trim()
  if (!clean || clean.includes(':') || clean.startsWith('user-attachment')) return null
  const repoPath = clean.startsWith('projects/')
    ? clean
    : `${COLORING_BOOK_ROOT}/sets/${bookSlug}/${clean.replace(/^\.\//, '')}`
  return `https://raw.githubusercontent.com/${COLORING_BOOK_REPO}/${COLORING_BOOK_REF}/${repoPath}`
}

function historyItems(
  block: string,
  bookSlug: string,
): ColoringBookCoverHistoryItem[] {
  return historyBlocks(block).map((item, index) => {
    const archivedPath = historyScalar(item, 'archived_path')
    return {
      id: `${bookSlug}:cover:${archivedPath || historyScalar(item, 'requested_at') || index}`,
      archivedPath,
      archivedUrl: rawAssetUrl(archivedPath, bookSlug),
      requestedAt: historyScalar(item, 'requested_at'),
      previousStatus: historyScalar(item, 'previous_status'),
      artImageId: yamlNumber(historyScalar(item, 'art_image_id')),
      semanticScore: yamlNumber(historyScalar(item, 'semantic_score')),
    }
  })
}

export function buildColoringBookCoverStates(
  content: string,
): Record<string, ColoringBookCoverState> {
  const states: Record<string, ColoringBookCoverState> = {}
  const coverSection = content.split(/^covers:\s*$/m)[1] ?? ''
  const blocks = coverSection
    .split(/(?=^- order:)/m)
    .filter((block) => block.startsWith('- order:'))

  for (const block of blocks) {
    const bookSlug = scalar(block, 'book_slug')
    if (!bookSlug) continue
    const renderedPath = scalar(block, 'rendered_path')
    const rejectedPath = scalar(block, 'rejected_path')
    const acceptedPath = scalar(block, 'accepted_path')
    const finalPath = scalar(block, 'final_path')
    states[bookSlug] = {
      order: yamlNumber(yamlValue(capture(block, /^- order:\s*(.*?)\s*$/m))) ?? 999,
      bookSlug,
      title: scalar(block, 'title') ?? bookSlug,
      prompt: collectYamlText(block, 'prompt'),
      sourceRef: scalar(block, 'source_ref'),
      imagePath: scalar(block, 'image_path') ?? '',
      status: scalar(block, 'status') ?? 'missing',
      renderedPath,
      renderedUrl: rawAssetUrl(renderedPath, bookSlug),
      artImageId: yamlNumber(scalar(block, 'art_image_id')),
      renderSeed: yamlNumber(scalar(block, 'render_seed')),
      renderEngine: scalar(block, 'render_engine'),
      completedAt: scalar(block, 'completed_at'),
      semanticScore: yamlNumber(scalar(block, 'semantic_score')),
      semanticVerdict: scalar(block, 'semantic_verdict'),
      semanticReasons: listValues(block, 'semantic_reasons'),
      rejectedPath,
      rejectedUrl: rawAssetUrl(rejectedPath, bookSlug),
      acceptedPath,
      acceptedUrl: rawAssetUrl(acceptedPath, bookSlug),
      approvedAt: scalar(block, 'approved_at'),
      finalPath,
      finalUrl: rawAssetUrl(finalPath, bookSlug),
      finalizedAt: scalar(block, 'finalized_at'),
      revisionHistory: historyItems(block, bookSlug),
      notes: listValues(block, 'notes'),
    }
  }

  return states
}

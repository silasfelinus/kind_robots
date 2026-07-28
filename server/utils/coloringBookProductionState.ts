import type {
  ColoringBookProductionState,
  ColoringBookProductionData,
} from '~/types/coloringBookStudio'
import {
  COLORING_BOOK_REF,
  COLORING_BOOK_REPO,
  COLORING_BOOK_ROOT,
} from '@/server/utils/coloringBookStudio'

type JsonRecord = Record<string, unknown>

function capture(text: string, pattern: RegExp, group = 1): string | undefined {
  return pattern.exec(text)?.[group]
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

function yamlBoolean(value: string | null): boolean {
  return value === 'true' || value === 'yes' || value === '1'
}

function scalar(block: string, key: string, spaces = 4): string | null {
  return yamlValue(
    capture(
      block,
      new RegExp(`^\\s{${spaces}}${key.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}:\\s*(.*?)\\s*$`, 'm'),
    ),
  )
}

function listValues(block: string, key: string): string[] {
  const inline = scalar(block, key, 4)
  if (inline === '[]') return []
  const section = capture(
    block,
    new RegExp(`^    ${key}:\\s*(?:\\[\\])?\\s*$([\\s\\S]*?)(?=^    [a-z_]+:|$(?![\\s\\S]))`, 'm'),
  )
  if (!section) return []
  return [...section.matchAll(/^\s*-\s*(.*?)\s*$/gm)]
    .map((match) => yamlValue(match?.[1]) ?? '')
    .filter(Boolean)
}

function historyCount(block: string, key: string): number {
  const section = capture(
    block,
    new RegExp(`^    ${key}:\\s*$([\\s\\S]*?)(?=^    [a-z_]+:|$(?![\\s\\S]))`, 'm'),
  )
  return section ? [...section.matchAll(/requested_at:/g)].length : 0
}

function rawAssetUrl(path: string | null, bookSlug: string): string | null {
  const clean = String(path || '').trim()
  if (!clean || clean.includes(':') || clean.startsWith('user-attachment')) return null
  const repoPath = clean.startsWith('projects/')
    ? clean
    : `${COLORING_BOOK_ROOT}/sets/${bookSlug}/${clean.replace(/^\.\//, '')}`
  return `https://raw.githubusercontent.com/${COLORING_BOOK_REPO}/${COLORING_BOOK_REF}/${repoPath}`
}

function emptyState(bookSlug: string, proposalId: string): ColoringBookProductionState {
  return {
    bookSlug,
    proposalId,
    colorStatus: 'missing',
    colorRenderedPath: null,
    colorArtImageId: null,
    colorApprovedAt: null,
    seedLocked: false,
    bwStatus: 'missing',
    bwRenderedPath: null,
    bwUrl: null,
    bwArtImageId: null,
    bwSemanticScore: null,
    bwSemanticVerdict: null,
    bwSemanticReasons: [],
    bwRejectedPath: null,
    bwCompletedAt: null,
    bwRevisionCount: 0,
    pairStatus: null,
    pairSemanticScore: null,
    pairSemanticReasons: [],
    pairFinalizedAt: null,
  }
}

export function buildColoringBookProductionData(
  queueContent: string,
): ColoringBookProductionData {
  const states: Record<string, ColoringBookProductionState> = {}
  const bookBlocks = queueContent
    .split(/(?=^- order:)/m)
    .filter((block) => block.startsWith('- order:'))

  for (const bookBlock of bookBlocks) {
    const bookSlug = scalar(bookBlock, 'slug', 2)
    if (!bookSlug) continue
    const entryBlocks = bookBlock
      .split(/(?=^  - slot:)/m)
      .filter((block) => block.startsWith('  - slot:'))

    for (const block of entryBlocks) {
      const proposalId = scalar(block, 'id', 4)
      if (!proposalId) continue
      const state = emptyState(bookSlug, proposalId)
      state.colorStatus = scalar(block, 'status', 4) ?? 'unknown'
      state.colorRenderedPath = scalar(block, 'rendered_path', 4)
      state.colorArtImageId = yamlNumber(scalar(block, 'art_image_id', 4))
      state.colorApprovedAt = scalar(block, 'approved_at', 4)
      state.seedLocked = yamlBoolean(scalar(block, 'lock_seed', 4))
      state.bwStatus = scalar(block, 'bw_status', 4) ?? 'missing'
      state.bwRenderedPath = scalar(block, 'bw_rendered_path', 4)
      state.bwUrl = rawAssetUrl(state.bwRenderedPath, bookSlug)
      state.bwArtImageId = yamlNumber(scalar(block, 'bw_art_image_id', 4))
      state.bwSemanticScore = yamlNumber(scalar(block, 'bw_semantic_score', 4))
      state.bwSemanticVerdict = scalar(block, 'bw_semantic_verdict', 4)
      state.bwSemanticReasons = listValues(block, 'bw_semantic_reasons')
      state.bwRejectedPath = scalar(block, 'bw_rejected_path', 4)
      state.bwCompletedAt = scalar(block, 'bw_completed_at', 4)
      state.bwRevisionCount = historyCount(block, 'bw_revision_history')
      state.pairStatus = scalar(block, 'pair_status', 4)
      state.pairSemanticScore = yamlNumber(scalar(block, 'pair_semantic_score', 4))
      state.pairSemanticReasons = listValues(block, 'pair_semantic_reasons')
      state.pairFinalizedAt = scalar(block, 'pair_finalized_at', 4)
      states[`${bookSlug}:${proposalId}`] = state
    }
  }

  return {
    states,
    fetchedAt: new Date().toISOString(),
  }
}

export function productionStateRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

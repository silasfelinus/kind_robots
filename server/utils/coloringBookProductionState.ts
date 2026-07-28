import type {
  ColoringBookHistoryItem,
  ColoringBookHistoryKind,
  ColoringBookProductionState,
  ColoringBookProductionData,
  ColoringBookVariant,
} from '~/types/coloringBookStudio'
import {
  COLORING_BOOK_REF,
  COLORING_BOOK_REPO,
  COLORING_BOOK_ROOT,
} from '@/server/utils/coloringBookStudio'

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
    capture(block, new RegExp(`^\\s{${spaces}}${key}:\\s*(.*?)\\s*$`, 'm')),
  )
}

function listValues(block: string, key: string): string[] {
  const inline = scalar(block, key, 4)
  if (inline === '[]') return []
  const section = capture(
    block,
    new RegExp(
      `^    ${key}:\\s*(?:\\[\\])?\\s*$([\\s\\S]*?)(?=^    [a-z_]+:|$(?![\\s\\S]))`,
      'm',
    ),
  )
  if (!section) return []
  return [...section.matchAll(/^\s*-\s*(.*?)\s*$/gm)]
    .map((match) => yamlValue(match?.[1]) ?? '')
    .filter(Boolean)
}

function historySection(block: string, key: string): string {
  return (
    capture(
      block,
      new RegExp(
        `^    ${key}:\\s*(?:\\[\\])?\\s*$([\\s\\S]*?)(?=^    [a-z_]+:|$(?![\\s\\S]))`,
        'm',
      ),
    ) ?? ''
  )
}

function historyBlocks(block: string, key: string): string[] {
  return historySection(block, key)
    .split(/(?=^    - )/m)
    .filter((entry) => entry.startsWith('    - '))
}

function historyScalar(block: string, key: string): string | null {
  const first = capture(
    block,
    new RegExp(`^    - ${key}:\\s*(.*?)\\s*$`, 'm'),
  )
  if (first !== undefined) return yamlValue(first)
  return yamlValue(
    capture(block, new RegExp(`^      ${key}:\\s*(.*?)\\s*$`, 'm')),
  )
}

function historyList(block: string, key: string): string[] {
  const section = capture(
    block,
    new RegExp(
      `^      ${key}:\\s*(?:\\[\\])?\\s*$([\\s\\S]*?)(?=^      [a-z_]+:|^    - |$(?![\\s\\S]))`,
      'm',
    ),
  )
  if (!section) return []
  return [...section.matchAll(/^\s*-\s*(.*?)\s*$/gm)]
    .map((match) => yamlValue(match?.[1]) ?? '')
    .filter(Boolean)
}

function historyCount(block: string, key: string): number {
  return historyBlocks(block, key).length
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
  key: string,
  bookSlug: string,
  variant: ColoringBookVariant,
  kind: ColoringBookHistoryKind,
): ColoringBookHistoryItem[] {
  return historyBlocks(block, key).map((item, index) => {
    const archivedPath = historyScalar(item, 'archived_path')
    const rejectedPath = historyScalar(item, 'rejected_path')
    const renderedPath = historyScalar(item, 'rendered_path')
    const path = archivedPath || rejectedPath || renderedPath
    const createdAt =
      historyScalar(item, 'reviewed_at') || historyScalar(item, 'requested_at')
    const attempt = historyScalar(item, 'attempt')
    const status =
      historyScalar(item, 'previous_status') ||
      (attempt ? `attempt ${attempt}` : null)
    const score = yamlNumber(historyScalar(item, 'score') || historyScalar(item, 'semantic_score'))
    const artImageId = yamlNumber(historyScalar(item, 'art_image_id'))
    const seed = yamlNumber(historyScalar(item, 'seed'))
    const engine = historyScalar(item, 'engine')
    const verdict = historyScalar(item, 'verdict')
    const reasons = historyList(item, 'reasons')
    return {
      id: `${variant}:${kind}:${path || createdAt || index}`,
      variant,
      kind,
      path,
      url: rawAssetUrl(path, bookSlug),
      createdAt,
      status,
      score,
      verdict,
      reasons,
      artImageId,
      seed,
      engine,
    }
  })
}

function currentBwRejection(
  block: string,
  bookSlug: string,
): ColoringBookHistoryItem | null {
  const path = scalar(block, 'bw_rejected_path', 4)
  if (!path) return null
  const kind: ColoringBookHistoryKind = path.includes('/mechanical/')
    ? 'mechanical-rejection'
    : path.includes('/unverified/')
      ? 'unverified'
      : 'semantic-rejection'
  return {
    id: `bw:${kind}:${path}`,
    variant: 'bw',
    kind,
    path,
    url: rawAssetUrl(path, bookSlug),
    createdAt: scalar(block, 'bw_completed_at', 4),
    status: scalar(block, 'bw_status', 4),
    score: yamlNumber(scalar(block, 'bw_semantic_score', 4)),
    verdict: scalar(block, 'bw_semantic_verdict', 4),
    reasons: listValues(block, 'bw_semantic_reasons'),
    artImageId: yamlNumber(scalar(block, 'bw_art_image_id', 4)),
    seed: null,
    engine: 'kontext',
  }
}

function collectHistory(
  block: string,
  bookSlug: string,
): ColoringBookHistoryItem[] {
  const items = [
    ...historyItems(block, 'studio_revision_history', bookSlug, 'color', 'revision'),
    ...historyItems(
      block,
      'semantic_rejections',
      bookSlug,
      'color',
      'semantic-rejection',
    ),
    ...historyItems(block, 'bw_revision_history', bookSlug, 'bw', 'revision'),
  ]
  const currentBw = currentBwRejection(block, bookSlug)
  if (currentBw && !items.some((item) => item.path === currentBw.path)) {
    items.push(currentBw)
  }
  return items.sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0
    const rightTime = Date.parse(right.createdAt || '') || 0
    return rightTime - leftTime
  })
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
    history: [],
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
      state.history = collectHistory(block, bookSlug)
      states[`${bookSlug}:${proposalId}`] = state
    }
  }

  return {
    states,
    fetchedAt: new Date().toISOString(),
  }
}

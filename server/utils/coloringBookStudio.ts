import type {
  ColoringBookAsset,
  ColoringBookCounts,
  ColoringBookPair,
  ColoringBookProposal,
  ColoringBookQueueState,
  ColoringBookStudioBook,
  ColoringBookStudioData,
} from '~/types/coloringBookStudio'

export const COLORING_BOOK_REPO = 'silasfelinus/conductor'
export const COLORING_BOOK_REF = 'main'
export const COLORING_BOOK_ROOT = 'projects/coloring-book'
export const COLORING_BOOK_QUEUE_PATH = `${COLORING_BOOK_ROOT}/color-art-jobs.yaml`

export const COLORING_BOOK_CONFIG = [
  {
    order: 1,
    slug: 'monster-recast',
    title: 'Monster Recast',
    ledgerPath: `${COLORING_BOOK_ROOT}/sets/monster-recast/proposals.yaml`,
    promptPath: `${COLORING_BOOK_ROOT}/sets/monster-recast/art-modeler-request.yaml`,
  },
  {
    order: 2,
    slug: 'hollywood-recast',
    title: 'Hollywood Recast',
    ledgerPath: `${COLORING_BOOK_ROOT}/sets/hollywood-recast/proposals.yaml`,
    promptPath: `${COLORING_BOOK_ROOT}/sets/hollywood-recast/proposals.yaml`,
  },
  {
    order: 3,
    slug: 'kind-robots',
    title: 'Kind Robots',
    ledgerPath: `${COLORING_BOOK_ROOT}/sets/kind-robots/proposals.yaml`,
    promptPath: `${COLORING_BOOK_ROOT}/sets/kind-robots/proposals.yaml`,
  },
] as const

export type ColoringBookConfig = (typeof COLORING_BOOK_CONFIG)[number]

export type ColoringBookSourceFiles = {
  queue: string
  ledgers: Record<string, string>
  prompts: Record<string, string>
}

type QueueEntry = ColoringBookQueueState & {
  sourceRef: string | null
}

function capture(
  text: string,
  pattern: RegExp,
  group = 1,
): string | undefined {
  return pattern.exec(text)?.[group]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

function yamlNumber(value: string | null, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function scalar(block: string, key: string, spaces = 2): string | null {
  return yamlValue(
    capture(
      block,
      new RegExp(`^\\s{${spaces}}${escapeRegExp(key)}:\\s*(.*?)\\s*$`, 'm'),
    ),
  )
}

function collectYamlText(
  lines: string[],
  index: number,
  expectedIndent: number,
): string {
  const line = lines[index] ?? ''
  const colon = line.indexOf(':')
  const first = colon >= 0 ? line.slice(colon + 1).trim() : ''
  const values: string[] = []

  if (first && first !== '>' && first !== '|') values.push(first)
  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const next = lines[cursor] ?? ''
    if (next.trim() && indentation(next) <= expectedIndent) break
    if (next.trim()) values.push(next.trim())
  }

  return yamlValue(values.join(' ')) ?? ''
}

function promptFromProposalBlock(block: string): {
  text: string
  ref: string | null
} {
  const inlinePattern =
    /^  prompt:\s*\{text:\s*(.*?),\s*ref:\s*(.*?)\}\s*$/m
  const inlineText = capture(block, inlinePattern, 1)
  if (inlineText !== undefined) {
    return {
      text: yamlValue(inlineText) ?? '',
      ref: yamlValue(capture(block, inlinePattern, 2)),
    }
  }

  const lines = block.split('\n')
  const promptIndex = lines.findIndex((line) => /^  prompt:\s*$/.test(line))
  if (promptIndex < 0) return { text: '', ref: null }

  const textIndex = lines.findIndex(
    (line, index) => index > promptIndex && /^    text:/.test(line),
  )
  const refIndex = lines.findIndex(
    (line, index) => index > promptIndex && /^    ref:/.test(line),
  )

  return {
    text: textIndex >= 0 ? collectYamlText(lines, textIndex, 4) : '',
    ref:
      refIndex >= 0
        ? yamlValue(lines[refIndex]?.split(':').slice(1).join(':'))
        : null,
  }
}

function parsePair(block: string, key: 'accepted' | 'final'): ColoringBookPair {
  const inlinePattern = new RegExp(
    `^  ${key}:\\s*\\{color:\\s*(.*?),\\s*bw:\\s*(.*?)\\}\\s*$`,
    'm',
  )
  const inlineColor = capture(block, inlinePattern, 1)
  if (inlineColor !== undefined) {
    return {
      color: yamlValue(inlineColor),
      bw: yamlValue(capture(block, inlinePattern, 2)),
    }
  }

  const section = capture(
    block,
    new RegExp(`^  ${key}:\\s*$([\\s\\S]*?)(?=^  [a-z_]+:|$(?![\\s\\S]))`, 'm'),
  )
  if (!section) return { color: null, bw: null }

  return {
    color: scalar(section, 'color', 4),
    bw: scalar(section, 'bw', 4),
  }
}

function rawAssetUrl(path: string, bookSlug: string): string | null {
  const clean = path.trim()
  if (!clean || clean.includes(':') || clean.startsWith('user-attachment')) return null
  const repoPath = clean.startsWith('projects/')
    ? clean
    : `${COLORING_BOOK_ROOT}/sets/${bookSlug}/${clean.replace(/^\.\//, '')}`
  return `https://raw.githubusercontent.com/${COLORING_BOOK_REPO}/${COLORING_BOOK_REF}/${repoPath}`
}

function parseInspirations(block: string, bookSlug: string): ColoringBookAsset[] {
  const section = capture(
    block,
    /^  inspirations:\s*(?:\[\])?\s*$([\s\S]*?)(?=^  accepted:|$(?![\s\S]))/m,
  )
  if (!section) return []

  const assets: ColoringBookAsset[] = []
  for (const match of section.matchAll(
    /^  -\s*\{path:\s*([^,}]+),\s*kind:\s*([^}]+)\}\s*$/gm,
  )) {
    const path = yamlValue(match?.[1]) ?? ''
    const kind = yamlValue(match?.[2]) ?? 'inspiration'
    if (path) assets.push({ path, kind, url: rawAssetUrl(path, bookSlug) })
  }

  const entries = section
    .split(/(?=^  - path:)/m)
    .filter((entry) => entry.startsWith('  - path:'))
  for (const entry of entries) {
    const path = yamlValue(capture(entry, /^  - path:\s*(.*?)\s*$/m)) ?? ''
    const kind =
      yamlValue(capture(entry, /^    kind:\s*(.*?)\s*$/m)) ?? 'inspiration'
    if (path && !assets.some((asset) => asset.path === path && asset.kind === kind)) {
      assets.push({ path, kind, url: rawAssetUrl(path, bookSlug) })
    }
  }

  return assets
}

function parseNotes(block: string): string[] {
  const notesStart = block.search(/^  notes:\s*(?:\[\])?\s*$/m)
  if (notesStart < 0) return []
  return [...block.slice(notesStart).matchAll(/^  -\s*(.*?)\s*$/gm)]
    .map((match) => yamlValue(match?.[1]) ?? '')
    .filter(Boolean)
}

function parseMonsterPromptMap(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  const blocks = content
    .split(/(?=^    - id:)/m)
    .filter((block) => block.startsWith('    - id:'))

  for (const block of blocks) {
    const id = yamlValue(capture(block, /^    - id:\s*(.*?)\s*$/m))
    if (!id) continue
    const lines = block.split('\n')
    const promptIndex = lines.findIndex((line) => /^      prompt:/.test(line))
    result[id] = promptIndex >= 0 ? collectYamlText(lines, promptIndex, 6) : ''
  }

  return result
}

function parseQueue(content: string): Record<string, QueueEntry> {
  const result: Record<string, QueueEntry> = {}
  const bookBlocks = content
    .split(/(?=^- order:)/m)
    .filter((block) => block.startsWith('- order:'))

  for (const bookBlock of bookBlocks) {
    const bookSlug = scalar(bookBlock, 'slug', 2)
    if (!bookSlug) continue
    const entryBlocks = bookBlock
      .split(/(?=^  - slot:)/m)
      .filter((block) => block.startsWith('  - slot:'))

    for (const block of entryBlocks) {
      const id = scalar(block, 'id', 4)
      if (!id) continue
      const errorLines = block.split('\n')
      const errorIndex = errorLines.findIndex((line) =>
        /^    semantic_gate_error:/.test(line),
      )
      const revisionSection = capture(
        block,
        /^    studio_revision_history:\s*$([\s\S]*?)(?=^    [a-z_]+:|$(?![\s\S]))/m,
      )
      const artImageId = scalar(block, 'art_image_id', 4)
      const semanticScore = scalar(block, 'semantic_score', 4)
      result[`${bookSlug}:${id}`] = {
        status: scalar(block, 'status', 4) ?? 'unknown',
        imagePath: scalar(block, 'image_path', 4),
        renderedPath: scalar(block, 'rendered_path', 4),
        artImageId: artImageId === null ? null : yamlNumber(artImageId, 0) || null,
        semanticScore:
          semanticScore === null ? null : yamlNumber(semanticScore, 0),
        semanticVerdict: scalar(block, 'semantic_verdict', 4),
        semanticAttempts: yamlNumber(scalar(block, 'semantic_attempts', 4), 0),
        semanticGateError:
          errorIndex >= 0 ? collectYamlText(errorLines, errorIndex, 4) : null,
        completedAt: scalar(block, 'completed_at', 4),
        renderEngine: scalar(block, 'render_engine', 4),
        revisionCount: revisionSection
          ? [...revisionSection.matchAll(/requested_at:/g)].length
          : 0,
        sourceRef: scalar(block, 'source_ref', 4),
      }
    }
  }

  return result
}

function emptyQueueState(): ColoringBookQueueState {
  return {
    status: 'missing',
    imagePath: null,
    renderedPath: null,
    artImageId: null,
    semanticScore: null,
    semanticVerdict: null,
    semanticAttempts: 0,
    semanticGateError: null,
    completedAt: null,
    renderEngine: null,
    revisionCount: 0,
  }
}

function selectAssetPath(
  proposal: Pick<
    ColoringBookProposal,
    'final' | 'accepted' | 'inspirations' | 'queue'
  >,
  variant: 'color' | 'bw',
): string | null {
  const explicit = proposal.final[variant] || proposal.accepted[variant]
  if (explicit) return explicit
  if (variant === 'color' && proposal.queue.renderedPath) {
    return proposal.queue.renderedPath
  }
  return (
    proposal.inspirations.find((asset) =>
      asset.kind.toLowerCase().includes(variant),
    )?.path ?? null
  )
}

function countsFor(proposals: ColoringBookProposal[]): ColoringBookCounts {
  return {
    total: proposals.length,
    prompts: proposals.filter((proposal) => proposal.prompt.trim()).length,
    pending: proposals.filter((proposal) => proposal.queue.status === 'pending').length,
    rendered: proposals.filter((proposal) => Boolean(proposal.queue.renderedPath)).length,
    acceptedColor: proposals.filter((proposal) => Boolean(proposal.accepted.color)).length,
    acceptedPairs: proposals.filter(
      (proposal) => Boolean(proposal.accepted.color && proposal.accepted.bw),
    ).length,
    finalPairs: proposals.filter(
      (proposal) => Boolean(proposal.final.color && proposal.final.bw),
    ).length,
    needsReview: proposals.filter(
      (proposal) => proposal.queue.status === 'needs_review',
    ).length,
    blocked: proposals.filter((proposal) =>
      Boolean(proposal.queue.semanticGateError),
    ).length,
  }
}

function parseLedger(
  config: ColoringBookConfig,
  content: string,
  promptContent: string,
  queue: Record<string, QueueEntry>,
): ColoringBookStudioBook {
  const bookSection =
    capture(content, /^book:\s*$([\s\S]*?)(?=^[a-z_]+:|$(?![\s\S]))/m) ?? ''
  const order = yamlNumber(scalar(bookSection, 'order', 2), config.order)
  const slug = scalar(bookSection, 'slug', 2) ?? config.slug
  const title = scalar(bookSection, 'title', 2) ?? config.title
  const targetProposals = yamlNumber(
    scalar(bookSection, 'target_proposals', 2),
    36,
  )
  const coverIsSeparate = scalar(bookSection, 'cover_is_separate', 2) !== 'false'
  const status = scalar(bookSection, 'status', 2) ?? 'unknown'
  const monsterPrompts =
    slug === 'monster-recast' ? parseMonsterPromptMap(promptContent) : {}
  const proposalSection = content.split(/^proposals:\s*$/m)[1] ?? ''
  const proposalBlocks = proposalSection
    .split(/(?=^- slot:)/m)
    .filter((block) => block.startsWith('- slot:'))

  const proposals = proposalBlocks.map((block): ColoringBookProposal => {
    const slot = yamlNumber(yamlValue(capture(block, /^- slot:\s*(.*?)\s*$/m)), 0)
    const id = scalar(block, 'id', 2) ?? `${slug}-${slot}`
    const promptData = promptFromProposalBlock(block)
    const queueEntry = queue[`${slug}:${id}`]
    const queueState: ColoringBookQueueState = queueEntry
      ? {
          status: queueEntry.status,
          imagePath: queueEntry.imagePath,
          renderedPath: queueEntry.renderedPath,
          artImageId: queueEntry.artImageId,
          semanticScore: queueEntry.semanticScore,
          semanticVerdict: queueEntry.semanticVerdict,
          semanticAttempts: queueEntry.semanticAttempts,
          semanticGateError: queueEntry.semanticGateError,
          completedAt: queueEntry.completedAt,
          renderEngine: queueEntry.renderEngine,
          revisionCount: queueEntry.revisionCount,
        }
      : emptyQueueState()
    const inspirations = parseInspirations(block, slug)
    const accepted = parsePair(block, 'accepted')
    const final = parsePair(block, 'final')
    const proposal: ColoringBookProposal = {
      slot,
      id,
      title: scalar(block, 'title', 2) ?? id,
      prompt: monsterPrompts[id] || promptData.text,
      promptRef: queueEntry?.sourceRef || promptData.ref,
      promptSourcePath: config.promptPath,
      inspirations,
      accepted,
      final,
      notes: parseNotes(block),
      queue: queueState,
      colorUrl: null,
      bwUrl: null,
    }
    const colorPath = selectAssetPath(proposal, 'color')
    const bwPath = selectAssetPath(proposal, 'bw')
    proposal.colorUrl = colorPath ? rawAssetUrl(colorPath, slug) : null
    proposal.bwUrl = bwPath ? rawAssetUrl(bwPath, slug) : null
    return proposal
  })

  proposals.sort((a, b) => a.slot - b.slot)
  return {
    order,
    slug,
    title,
    status,
    targetProposals,
    coverIsSeparate,
    counts: countsFor(proposals),
    proposals,
  }
}

export function buildColoringBookStudioData(
  files: ColoringBookSourceFiles,
): ColoringBookStudioData {
  const queue = parseQueue(files.queue)
  const books = COLORING_BOOK_CONFIG.map((config) =>
    parseLedger(
      config,
      files.ledgers[config.slug] ?? '',
      files.prompts[config.slug] ?? '',
      queue,
    ),
  ).sort((a, b) => a.order - b.order)

  return {
    books,
    fetchedAt: new Date().toISOString(),
    sourceRepo: COLORING_BOOK_REPO,
    sourceRef: COLORING_BOOK_REF,
  }
}

function wrapYamlText(value: string, width = 100): string[] {
  const words = value.replace(/\r/g, '').replace(/\s+/g, ' ').trim().split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!word) continue
    const next = current ? `${current} ${word}` : word
    if (next.length > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

export function replaceColoringBookPrompt(
  config: ColoringBookConfig,
  content: string,
  proposalId: string,
  prompt: string,
): string {
  const cleanPrompt = prompt.replace(/\r/g, '').replace(/\s+/g, ' ').trim()
  if (!cleanPrompt) throw new Error('Prompt cannot be empty.')

  if (config.slug === 'monster-recast') {
    const start = content.search(
      new RegExp(`^    - id:\\s*${escapeRegExp(proposalId)}\\s*$`, 'm'),
    )
    if (start < 0) throw new Error(`Prompt source not found for ${proposalId}.`)
    const tail = content.slice(start)
    const next = tail.slice(1).search(/^    - id:/m)
    const end = next < 0 ? content.length : start + 1 + next
    const block = content.slice(start, end)
    const promptMatch = /^      prompt:.*$/m.exec(block)
    if (!promptMatch) throw new Error(`Prompt field not found for ${proposalId}.`)
    const promptStart = start + (promptMatch?.index ?? 0)
    const promptLineLength = promptMatch?.[0]?.length ?? 0
    const afterPromptLine = promptStart + promptLineLength
    const remaining = content.slice(afterPromptLine, end)
    const continuation = capture(remaining, /^((?:\n        .*|\n\s*)*)/) ?? ''
    const promptEnd = afterPromptLine + continuation.length
    const replacement = [
      '      prompt: >',
      ...wrapYamlText(cleanPrompt).map((line) => `        ${line}`),
    ].join('\n')
    return `${content.slice(0, promptStart)}${replacement}${content.slice(promptEnd)}`
  }

  const proposalStarts = [...content.matchAll(/^- slot:\s*\d+\s*$/gm)]
  const matchIndex = proposalStarts.findIndex((match, index) => {
    const start = match.index ?? 0
    const end = proposalStarts[index + 1]?.index ?? content.length
    return new RegExp(`^  id:\\s*${escapeRegExp(proposalId)}\\s*$`, 'm').test(
      content.slice(start, end),
    )
  })
  if (matchIndex < 0) throw new Error(`Proposal not found: ${proposalId}.`)

  const start = proposalStarts[matchIndex]?.index ?? 0
  const end = proposalStarts[matchIndex + 1]?.index ?? content.length
  const block = content.slice(start, end)
  const promptStartMatch = /^  prompt:.*$/m.exec(block)
  const inspirationMatch = /^  inspirations:/m.exec(block)
  if (!promptStartMatch || !inspirationMatch) {
    throw new Error(`Prompt section not found for ${proposalId}.`)
  }
  const promptStart = start + (promptStartMatch?.index ?? 0)
  const promptEnd = start + (inspirationMatch?.index ?? block.length)
  const current = promptFromProposalBlock(block)
  const ref = current.ref ? JSON.stringify(current.ref) : 'null'
  const replacement = [
    '  prompt:',
    '    text: >',
    ...wrapYamlText(cleanPrompt).map((line) => `      ${line}`),
    `    ref: ${ref}`,
  ].join('\n')

  return `${content.slice(0, promptStart)}${replacement}\n${content.slice(promptEnd)}`
}

export function coloringBookConfig(bookSlug: string): ColoringBookConfig | null {
  return COLORING_BOOK_CONFIG.find((config) => config.slug === bookSlug) ?? null
}

export function proposalBelongsToBook(
  bookSlug: string,
  proposalId: string,
): boolean {
  if (bookSlug === 'monster-recast') {
    return /^(?:mr-\d{3}|mr-group-\d{3})$/.test(proposalId)
  }
  if (bookSlug === 'hollywood-recast') return /^hwr-\d{3}$/.test(proposalId)
  if (bookSlug === 'kind-robots') return /^kr-\d{3}$/.test(proposalId)
  return false
}

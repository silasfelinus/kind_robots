import prisma from '@/server/utils/prisma'
import {
  rankWonderLabReviewers,
  type WonderLabExhibitProfile,
  type WonderLabReviewerCandidate,
} from '@/utils/wonderlab/reviewerAffinity'
import {
  assignWonderLabReviewerPortfolio,
  isWonderLabEditoriallyExcludedReviewer,
  type WonderLabPortfolioCandidate,
  type WonderLabPortfolioReviewerUsage,
} from '@/utils/wonderlab/reviewerPortfolio'
import type { ReviewDraftAuthorRef, ReviewDraftStatus } from '@/utils/wonderlab/reviewDraft'
import type {
  WonderLabReviewCoverage,
  WonderLabReviewPlanExhibit,
  WonderLabReviewPlanReviewer,
} from '@/server/utils/wonderLabReviewPlan'

export type WonderLabReviewPortfolioPlan = {
  assignmentMode: 'PORTFOLIO_DIVERSE'
  exhibits: WonderLabReviewPlanExhibit[]
  componentCount: number
  reviewerSlots: number
  missingCount: number
  draftedCount: number
  publishedCount: number
  diversityPenalty: number
  reviewerUsage: WonderLabPortfolioReviewerUsage[]
}

export type BuildWonderLabReviewPortfolioOptions = {
  componentIds?: number[]
  limit?: number
  reviewersPerComponent?: number
  minimumScore?: number
  diversityPenalty?: number
}

type DraftCoverageRow = {
  id: number
  componentId: number
  authorBotId: number | null
  authorCharacterId: number | null
  status: ReviewDraftStatus
  publishedReactionId: number | null
}

type ReactionCoverageRow = {
  id: number
  componentId: number
  authorBotId: number | null
  authorCharacterId: number | null
}

type CoverageDetails = {
  coverage: WonderLabReviewCoverage
  draftId: number | null
  draftStatus: ReviewDraftStatus | null
  reactionId: number | null
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    return stringArray(JSON.parse(value))
  } catch {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

function authorKey(author: ReviewDraftAuthorRef): string {
  return `${author.kind}:${author.id}`
}

function coverageKey(componentId: number, author: ReviewDraftAuthorRef): string {
  return `${componentId}:${authorKey(author)}`
}

function rowAuthor(row: {
  authorBotId: number | null
  authorCharacterId: number | null
}): ReviewDraftAuthorRef | null {
  if (row.authorBotId && !row.authorCharacterId) {
    return { kind: 'BOT', id: row.authorBotId }
  }
  if (row.authorCharacterId && !row.authorBotId) {
    return { kind: 'CHARACTER', id: row.authorCharacterId }
  }
  return null
}

async function loadExhibits(
  options: BuildWonderLabReviewPortfolioOptions,
): Promise<WonderLabExhibitProfile[]> {
  const componentIds = [...new Set(options.componentIds || [])]
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, 500)
  const limit = Math.max(1, Math.min(500, Math.round(options.limit ?? 500)))

  const components = await prisma.component.findMany({
    where: {
      isDiscovered: true,
      ...(componentIds.length ? { id: { in: componentIds } } : {}),
    },
    orderBy: [{ folderName: 'asc' }, { componentName: 'asc' }, { id: 'asc' }],
    take: componentIds.length ? componentIds.length : limit,
    select: {
      id: true,
      componentName: true,
      folderName: true,
      sourcePath: true,
      title: true,
      description: true,
      notes: true,
      category: true,
      tags: true,
    },
  })

  return components.map((component) => ({
    id: component.id,
    componentName: component.componentName,
    folderName: component.folderName,
    sourcePath: component.sourcePath,
    title: component.title,
    description: component.description,
    notes: component.notes,
    category: component.category,
    tags: stringArray(component.tags),
  }))
}

async function loadReviewers(): Promise<WonderLabReviewerCandidate[]> {
  const [bots, characters] = await Promise.all([
    prisma.bot.findMany({
      where: { isActive: true, isPublic: true, isMature: false },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        description: true,
        personality: true,
        narrativeVoice: true,
        sampleResponse: true,
        prompt: true,
        modules: true,
        isActive: true,
        isPublic: true,
        isMature: true,
      },
    }),
    prisma.character.findMany({
      where: { isActive: true, isPublic: true, isMature: false },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        title: true,
        backstory: true,
        personality: true,
        voice: true,
        sampleResponse: true,
        drive: true,
        quirks: true,
        genre: true,
        isActive: true,
        isPublic: true,
        isMature: true,
      },
    }),
  ])

  return [
    ...bots.map((bot): WonderLabReviewerCandidate => ({
      id: bot.id,
      kind: 'BOT',
      name: bot.name,
      slug: bot.slug,
      subtitle: bot.subtitle,
      description: bot.description,
      personality: bot.personality,
      voice: bot.narrativeVoice,
      sampleResponse: bot.sampleResponse,
      prompt: bot.prompt,
      modules: bot.modules,
      isActive: bot.isActive,
      isPublic: bot.isPublic,
      isMature: bot.isMature,
    })),
    ...characters.map((character): WonderLabReviewerCandidate => ({
      id: character.id,
      kind: 'CHARACTER',
      name: character.name,
      slug: character.slug,
      subtitle: character.title,
      description: character.backstory,
      personality: character.personality,
      voice: character.voice,
      sampleResponse: character.sampleResponse,
      prompt: [character.drive, character.quirks].filter(Boolean).join('\n'),
      modules: character.genre,
      isActive: character.isActive,
      isPublic: character.isPublic,
      isMature: character.isMature,
    })),
  ].filter((candidate) => !isWonderLabEditoriallyExcludedReviewer(candidate))
}

async function loadCoverage(): Promise<{
  drafts: Map<string, DraftCoverageRow>
  reactions: Map<string, ReactionCoverageRow>
}> {
  const [draftRows, reactionRows] = await Promise.all([
    prisma.$queryRaw<DraftCoverageRow[]>`
      SELECT
        id,
        componentId,
        authorBotId,
        authorCharacterId,
        status,
        publishedReactionId
      FROM ReviewDraft
      ORDER BY updatedAt DESC, createdAt DESC, id DESC
    `,
    prisma.$queryRaw<ReactionCoverageRow[]>`
      SELECT id, componentId, authorBotId, authorCharacterId
      FROM Reaction
      WHERE reactionCategory = 'COMPONENT'
        AND componentId IS NOT NULL
        AND (authorBotId IS NOT NULL OR authorCharacterId IS NOT NULL)
      ORDER BY updatedAt DESC, createdAt DESC, id DESC
    `,
  ])

  const drafts = new Map<string, DraftCoverageRow>()
  for (const row of draftRows) {
    const author = rowAuthor(row)
    if (!author) continue
    const key = coverageKey(row.componentId, author)
    if (!drafts.has(key)) drafts.set(key, row)
  }

  const reactions = new Map<string, ReactionCoverageRow>()
  for (const row of reactionRows) {
    const author = rowAuthor(row)
    if (!author) continue
    const key = coverageKey(row.componentId, author)
    if (!reactions.has(key)) reactions.set(key, row)
  }

  return { drafts, reactions }
}

function coverageDetails(
  componentId: number,
  author: ReviewDraftAuthorRef,
  coverage: Awaited<ReturnType<typeof loadCoverage>>,
): CoverageDetails {
  const key = coverageKey(componentId, author)
  const draft = coverage.drafts.get(key)
  const reaction = coverage.reactions.get(key)
  const reactionId = reaction?.id || draft?.publishedReactionId || null
  return {
    coverage: reactionId ? 'PUBLISHED' : draft ? 'DRAFTED' : 'MISSING',
    draftId: draft?.id ?? null,
    draftStatus: draft?.status ?? null,
    reactionId,
  }
}

export async function buildWonderLabReviewPortfolio(
  options: BuildWonderLabReviewPortfolioOptions = {},
): Promise<WonderLabReviewPortfolioPlan> {
  const reviewerCount = Math.max(
    1,
    Math.min(2, Math.round(options.reviewersPerComponent ?? 2)),
  )
  const minimumScore = options.minimumScore ?? 0
  const diversityPenalty = Math.max(0, Math.min(20, options.diversityPenalty ?? 4))
  const [exhibits, candidates, coverage] = await Promise.all([
    loadExhibits(options),
    loadReviewers(),
    loadCoverage(),
  ])

  const portfolioInputs = exhibits.map((exhibit) => {
    const ranked = rankWonderLabReviewers(exhibit, candidates, {
      limit: candidates.length,
      minimumScore: -100,
      requirePublic: true,
      includeMature: false,
    })
    const candidateRows = ranked
      .map((entry): WonderLabPortfolioCandidate => {
        const author: ReviewDraftAuthorRef = {
          kind: entry.reviewer.kind,
          id: entry.reviewer.id,
        }
        return {
          ...entry,
          coverage: coverageDetails(exhibit.id, author, coverage).coverage,
        }
      })
      .filter(
        (entry) =>
          entry.coverage !== 'MISSING' ||
          (entry.voiceReady && entry.score >= minimumScore),
      )

    return { key: exhibit.id, candidates: candidateRows }
  })

  const portfolio = assignWonderLabReviewerPortfolio(portfolioInputs, {
    reviewersPerExhibit: reviewerCount,
    diversityPenalty,
  })
  const assignments = new Map(
    portfolio.assignments.map((assignment) => [assignment.key, assignment.reviewers]),
  )

  const planned = exhibits.map((exhibit): WonderLabReviewPlanExhibit => {
    const selected = assignments.get(exhibit.id) || []
    return {
      componentId: exhibit.id,
      componentName: exhibit.componentName,
      title: exhibit.title || null,
      folderName: exhibit.folderName,
      sourcePath: exhibit.sourcePath || null,
      status: selected.length ? 'READY' : 'NO_ELIGIBLE_REVIEWER',
      reviewers: selected.map((entry): WonderLabReviewPlanReviewer => {
        const author: ReviewDraftAuthorRef = {
          kind: entry.reviewer.kind,
          id: entry.reviewer.id,
        }
        const details = coverageDetails(exhibit.id, author, coverage)
        return {
          author,
          name: entry.reviewer.name,
          slug: entry.reviewer.slug || null,
          score: entry.score,
          reasons: entry.reasons,
          coverage: details.coverage,
          draftId: details.draftId,
          draftStatus: details.draftStatus,
          reactionId: details.reactionId,
        }
      }),
    }
  })

  const reviewers = planned.flatMap((exhibit) => exhibit.reviewers)
  return {
    assignmentMode: 'PORTFOLIO_DIVERSE',
    exhibits: planned,
    componentCount: planned.length,
    reviewerSlots: reviewers.length,
    missingCount: reviewers.filter((reviewer) => reviewer.coverage === 'MISSING').length,
    draftedCount: reviewers.filter((reviewer) => reviewer.coverage === 'DRAFTED').length,
    publishedCount: reviewers.filter((reviewer) => reviewer.coverage === 'PUBLISHED').length,
    diversityPenalty,
    reviewerUsage: portfolio.reviewerUsage,
  }
}

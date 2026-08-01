// /utils/facetCatalogAudit.ts
import type { FacetTaxonomy } from './../prisma/generated/prisma/client'

export type FacetAuditInput = {
  id: number
  title: string
  slug: string | null
  taxonomy: FacetTaxonomy | null
  groupKey: string | null
  groupLabel: string | null
  isRandomizable: boolean
  randomWeight: number
  sourceRank: number | null
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  aliases: readonly string[]
  artBacked: boolean
}

export type FacetAuditReason = {
  code: string
  score: number
  detail: string
}

export type FacetAuditCandidate = FacetAuditInput & {
  score: number
  reasons: FacetAuditReason[]
  actionHint:
    | 'merge-exact-synonym'
    | 'decompose-recipe'
    | 'repair-taxonomy'
    | 'suppress-random'
    | 'review-quality'
  preservationMode: 'preserve-row-and-art' | 'free-to-rebuild'
}

export type FacetAuditReport = {
  totals: {
    activeFacets: number
    randomizableFacets: number
    artBackedFacets: number
    candidateFacets: number
    criticalCandidates: number
  }
  byTaxonomy: Record<string, number>
  byReason: Record<string, number>
  duplicateClusters: Array<{
    normalizedTitle: string
    facetIds: number[]
    titles: string[]
  }>
  candidates: FacetAuditCandidate[]
}

const CARGO_CULT_PATTERN =
  /(?:^|\b)(?:4k|8k|16k|award[- ]winning|masterpiece|best quality|ultra[- ]detailed|highly detailed|trending on|octane render|unreal engine)(?:\b|$)/i
const SETTING_SHAPED_GENRE_PATTERN =
  /(?:cathedral|archive|library|parliament|village|forest|underground|underwater|sky|moon|island|city|station|market|hotel|school|academy|kingdom|empire|ocean|sea|desert|mountain|swamp|carnival|circus|museum|garden|sanctuary|court|castle|ruins?|wasteland|frontier|colony|society)$/i
const SUBJECT_SHAPED_GENRE_PATTERN =
  /(?:protagonists?|perspective|artificial intelligence|robots?|animals?|dragons?|vampires?|ghosts?|mythology|folklore|post[- ]humanism)$/i
const OCCUPATION_SHAPED_PERSONALITY_PATTERN =
  /(?:writer|artist|mechanic|detective|teacher|professor|doctor|nurse|scientist|engineer|librarian|chef|baker|merchant|soldier|knight|priest|farmer|pilot|captain|programmer|designer)$/i
const WORLDVIEW_SHAPED_PERSONALITY_PATTERN =
  /(?:animist|atheist|believer|psychic|spiritual|religious|metaphysical|superstitious)$/i
const QUIRK_SHAPED_BACKSTORY_PATTERN =
  /(?:\bcan only\b|\bmust always\b|\bnever\b|\bonly on\b|\bspeaks? only\b|\bsleeps?\b|\bcollects?\b|\brefuses? to\b)/i

export function normalizeFacetAuditKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function wordCount(value: string): number {
  const normalized = normalizeFacetAuditKey(value)
  return normalized ? normalized.split(' ').length : 0
}

function pushReason(
  reasons: FacetAuditReason[],
  code: string,
  score: number,
  detail: string,
): void {
  reasons.push({ code, score, detail })
}

function actionHintFor(reasons: readonly FacetAuditReason[]): FacetAuditCandidate['actionHint'] {
  const codes = new Set(reasons.map((reason) => reason.code))
  if (codes.has('duplicate-title')) return 'merge-exact-synonym'
  if (codes.has('composite-genre') || codes.has('parenthetical-genre')) {
    return 'decompose-recipe'
  }
  if (
    codes.has('setting-shaped-genre') ||
    codes.has('subject-shaped-genre') ||
    codes.has('occupation-shaped-personality') ||
    codes.has('worldview-shaped-personality') ||
    codes.has('quirk-shaped-backstory')
  ) {
    return 'repair-taxonomy'
  }
  if (codes.has('prompt-cargo-cult') || codes.has('underspecified-title')) {
    return 'suppress-random'
  }
  return 'review-quality'
}

function buildDuplicateMap(
  facets: readonly FacetAuditInput[],
): Map<string, FacetAuditInput[]> {
  const byTitle = new Map<string, FacetAuditInput[]>()
  for (const facet of facets) {
    const key = normalizeFacetAuditKey(facet.title)
    if (!key) continue
    const entries = byTitle.get(key) ?? []
    entries.push(facet)
    byTitle.set(key, entries)
  }
  return new Map(
    [...byTitle.entries()].filter(([, entries]) => entries.length > 1),
  )
}

function scoreFacet(
  facet: FacetAuditInput,
  duplicates: Map<string, FacetAuditInput[]>,
): FacetAuditCandidate | null {
  const reasons: FacetAuditReason[] = []
  const taxonomy = facet.taxonomy
  const titleWords = wordCount(facet.title)
  const normalizedTitle = normalizeFacetAuditKey(facet.title)

  if (!taxonomy) {
    pushReason(
      reasons,
      'missing-profile',
      6,
      'Active Facet has no authoritative taxonomy profile.',
    )
  }

  if (duplicates.has(normalizedTitle)) {
    const cluster = duplicates.get(normalizedTitle) ?? []
    pushReason(
      reasons,
      'duplicate-title',
      6,
      `Normalized title is shared by Facet ids ${cluster
        .map((entry) => entry.id)
        .join(', ')}.`,
    )
  }

  if (facet.isRandomizable && CARGO_CULT_PATTERN.test(facet.title)) {
    pushReason(
      reasons,
      'prompt-cargo-cult',
      7,
      'Randomized prompt-control title is a quality or resolution incantation rather than creative direction.',
    )
  }

  if (taxonomy === 'GENRE') {
    if (/\([^)]{2,}\)/.test(facet.title)) {
      pushReason(
        reasons,
        'parenthetical-genre',
        5,
        'Parenthetical genre likely combines a reusable base genre with a theme, mood, setting, or perspective.',
      )
    }
    if (
      /\b(?:with|from|but|and|in which|where)\b/i.test(facet.title) &&
      titleWords >= 4
    ) {
      pushReason(
        reasons,
        'composite-genre',
        4,
        'Genre title reads as a sealed multi-Facet recipe.',
      )
    }
    if (SETTING_SHAPED_GENRE_PATTERN.test(facet.title)) {
      pushReason(
        reasons,
        'setting-shaped-genre',
        4,
        'Title primarily names a place, environment, institution, or world structure.',
      )
    }
    if (SUBJECT_SHAPED_GENRE_PATTERN.test(facet.title)) {
      pushReason(
        reasons,
        'subject-shaped-genre',
        4,
        'Title primarily names subject matter, cast, source tradition, or point of view.',
      )
    }
    if (
      facet.isRandomizable &&
      facet.randomWeight === 1 &&
      (facet.sourceRank ?? 100) >= 30
    ) {
      pushReason(
        reasons,
        'flat-legacy-genre-weight',
        1,
        'Legacy or generated genre still has the undifferentiated default weight of 1.',
      )
    }
  }

  if (
    taxonomy === 'PERSONALITY' &&
    OCCUPATION_SHAPED_PERSONALITY_PATTERN.test(facet.title)
  ) {
    pushReason(
      reasons,
      'occupation-shaped-personality',
      4,
      'Title names a role or profession rather than temperament.',
    )
  }

  if (
    taxonomy === 'PERSONALITY' &&
    WORLDVIEW_SHAPED_PERSONALITY_PATTERN.test(facet.title)
  ) {
    pushReason(
      reasons,
      'worldview-shaped-personality',
      3,
      'Title names a worldview, belief, or claimed ability rather than temperament.',
    )
  }

  if (
    taxonomy === 'BACKSTORY' &&
    QUIRK_SHAPED_BACKSTORY_PATTERN.test(facet.title)
  ) {
    pushReason(
      reasons,
      'quirk-shaped-backstory',
      4,
      'Title describes an ongoing behavior or constraint rather than prior history.',
    )
  }

  if (titleWords >= 9) {
    pushReason(
      reasons,
      'sentence-title',
      2,
      `Title contains ${titleWords} words and may be a one-off prompt rather than reusable taxonomy.`,
    )
  }

  if (
    facet.isRandomizable &&
    titleWords <= 1 &&
    facet.title.length <= 10 &&
    !facet.description &&
    !facet.flavorText &&
    !facet.examples
  ) {
    pushReason(
      reasons,
      'underspecified-title',
      2,
      'Very short randomizable Facet has no prose explaining its creative effect.',
    )
  }

  if (
    facet.isRandomizable &&
    !facet.description &&
    !facet.flavorText &&
    !facet.examples &&
    !facet.artPrompt &&
    !facet.artBacked &&
    (facet.sourceRank ?? 100) >= 80
  ) {
    pushReason(
      reasons,
      'unreviewed-legacy-record',
      2,
      'Randomizable high-rank legacy record has no prose, prompt, or artwork.',
    )
  }

  if (!reasons.length) return null

  const score = reasons.reduce((total, reason) => total + reason.score, 0)
  return {
    ...facet,
    score,
    reasons,
    actionHint: actionHintFor(reasons),
    preservationMode: facet.artBacked
      ? 'preserve-row-and-art'
      : 'free-to-rebuild',
  }
}

export function auditFacetCatalog(
  facets: readonly FacetAuditInput[],
): FacetAuditReport {
  const duplicates = buildDuplicateMap(facets)
  const candidates = facets
    .map((facet) => scoreFacet(facet, duplicates))
    .filter((facet): facet is FacetAuditCandidate => Boolean(facet))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.artBacked !== b.artBacked) return a.artBacked ? 1 : -1
      return a.title.localeCompare(b.title)
    })

  const byTaxonomy: Record<string, number> = {}
  for (const facet of facets) {
    const key = facet.taxonomy ?? 'MISSING_PROFILE'
    byTaxonomy[key] = (byTaxonomy[key] ?? 0) + 1
  }

  const byReason: Record<string, number> = {}
  for (const candidate of candidates) {
    for (const reason of candidate.reasons) {
      byReason[reason.code] = (byReason[reason.code] ?? 0) + 1
    }
  }

  const duplicateClusters = [...duplicates.entries()]
    .map(([normalizedTitle, entries]) => ({
      normalizedTitle,
      facetIds: entries.map((entry) => entry.id),
      titles: entries.map((entry) => entry.title),
    }))
    .sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle))

  return {
    totals: {
      activeFacets: facets.length,
      randomizableFacets: facets.filter((facet) => facet.isRandomizable).length,
      artBackedFacets: facets.filter((facet) => facet.artBacked).length,
      candidateFacets: candidates.length,
      criticalCandidates: candidates.filter((facet) => facet.score >= 6).length,
    },
    byTaxonomy,
    byReason,
    duplicateClusters,
    candidates,
  }
}

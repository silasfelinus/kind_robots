// /utils/mandarinProficiencyCoverage.ts
//
// mandarin-tutor/t-008: pure, database-free proficiency-standard coverage
// report for the Mandarin Tutor catalog. Companion to
// utils/mandarinContentAudit.ts (content QUALITY) -- this checks coverage
// BREADTH against the officially applicable proficiency standard instead, so
// future roadmap work can target "HSK 3.0 level 3" instead of an arbitrary
// card count. See utils/mandarinProficiencyStandards.ts for the standard's
// own metadata (levels, reference vocabulary sizes, source pin).
//
// WHAT THIS DOES NOT DO: like mandarinContentAudit.ts, this never fetches.
// Callers supply the catalog's cards, plus (optionally) how many vocabulary
// entries the pinned upstream source has cumulatively for each level -- the
// CLI wrapper (utils/scripts/auditMandarinProficiencyCoverage.ts) is the one
// piece allowed to hit the network for that, since a level not yet ingested
// into the catalog has no cards here to inspect at all.
//
// "Sourced" is derived from the cards themselves (does the live catalog
// actually contain any card at this level), not from a second hardcoded list
// of which levels server/utils/mandarinCatalog.ts currently fetches --
// duplicating that list here would drift the moment someone adds a level
// there without remembering to update it here too.
import type { MandarinCard } from './mandarin'
import {
  DEFAULT_MANDARIN_PROFICIENCY_STANDARD,
  type MandarinProficiencyStandard,
} from './mandarinProficiencyStandards'

export type MandarinLevelCoverage = {
  level: number
  label: string
  /** True when the live catalog contains at least one card at this level. */
  sourced: boolean
  cardCount: number
  /** Cards with an explanatory character/component breakdown beyond a bare dictionary radical. */
  withComponentBreakdown: number
  /** Cards with hand-authored or otherwise sourced character-origin history (historyStatus === 'starter'). */
  withCharacterHistory: number
  /** HSK 3.0's own published cumulative vocabulary size through this level. Informational only. */
  referenceCumulativeVocabulary?: number
  /** The pinned upstream source's own cumulative entry count for this level, when the caller checked. */
  upstreamCumulativeVocabulary?: number
}

export type MandarinProficiencyCoverageReport = {
  standard: {
    id: string
    label: string
    sourceLabel: string
    sourceUrl: string
    sourceCommit: string
  }
  levels: MandarinLevelCoverage[]
  totals: {
    cardsWithLevel: number
    cardsWithoutLevel: number
    sourcedLevelCount: number
    totalLevelCount: number
  }
  /** Concrete, ordered next targets -- the lowest-numbered unsourced level first. */
  nextTargets: string[]
}

export function computeMandarinProficiencyCoverage(
  cards: MandarinCard[],
  options?: {
    standard?: MandarinProficiencyStandard
    upstreamCumulativeVocabulary?: Partial<Record<number, number>>
  },
): MandarinProficiencyCoverageReport {
  const standard = options?.standard ?? DEFAULT_MANDARIN_PROFICIENCY_STANDARD
  const upstream = options?.upstreamCumulativeVocabulary ?? {}

  const levels: MandarinLevelCoverage[] = standard.levels.map((levelMeta) => {
    const levelCards = cards.filter((card) => card.hskLevel === levelMeta.level)
    return {
      level: levelMeta.level,
      label: levelMeta.label,
      sourced: levelCards.length > 0,
      cardCount: levelCards.length,
      withComponentBreakdown: levelCards.filter(
        (card) => card.components.length > 0,
      ).length,
      withCharacterHistory: levelCards.filter(
        (card) => card.historyStatus === 'starter',
      ).length,
      referenceCumulativeVocabulary: levelMeta.referenceCumulativeVocabulary,
      ...(typeof upstream[levelMeta.level] === 'number'
        ? { upstreamCumulativeVocabulary: upstream[levelMeta.level] }
        : {}),
    }
  })

  const cardsWithLevel = cards.filter(
    (card) => typeof card.hskLevel === 'number',
  ).length
  const sourcedLevelCount = levels.filter((entry) => entry.sourced).length

  const nextTargets = levels
    .filter((entry) => !entry.sourced)
    .sort((a, b) => a.level - b.level)
    .map((entry) => {
      const upstreamNote =
        typeof entry.upstreamCumulativeVocabulary === 'number'
          ? `${entry.upstreamCumulativeVocabulary} cumulative entries already available upstream`
          : 'upstream availability not checked in this run'
      return `${entry.label}: not yet sourced into the catalog (${upstreamNote}).`
    })

  return {
    standard: {
      id: standard.id,
      label: standard.label,
      sourceLabel: standard.sourceLabel,
      sourceUrl: standard.sourceUrl,
      sourceCommit: standard.sourceCommit,
    },
    levels,
    totals: {
      cardsWithLevel,
      cardsWithoutLevel: cards.length - cardsWithLevel,
      sourcedLevelCount,
      totalLevelCount: levels.length,
    },
    nextTargets,
  }
}

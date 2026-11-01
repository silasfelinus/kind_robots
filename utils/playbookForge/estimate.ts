import {
  TIERS,
  TIER_BUDGETS,
  type BudgetDimension,
} from '../playbookKit/budget'
import type { PlaybookTier } from '../playbookKit/types'
import {
  DEFAULT_ASSUMPTIONS,
  checkpointClass,
  type Assumptions,
} from './calibration'
import type { Blueprint, Forecast, ForecastLine } from './types'

// How a blueprint turns into work: pictures to render, words to author,
// agent sessions to build it and seeded playthroughs to prove it. Every term
// is one line here so the forge can show exactly what each factor costs.

const OUTCOME_TIERS = {
  'pass-fail': 2,
  'three-tier': 3,
  'four-tier': 4,
  'five-tier': 5,
} as const
const OUTCOME_PICTURES = { none: 0, success: 1, both: 2 } as const

/** n choose k, for counting parties. */
function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i
  return Math.round(result)
}

/** Heroes an ending can be rewritten for: the roster, or the builder's first factor. */
export function heroVersions(b: Blueprint): number {
  if (b.creator === 'roster') return Math.max(1, b.rosterSize)
  if (b.creator === 'builder') return Math.max(1, b.optionsPerFactor)
  return 1
}

export type OpeningCombos = {
  heroes: number
  parties: number
  openings: number
  /** Endings as written and painted: base endings × hero versions. */
  endingVersions: number
  /** Epilogue lines the party adds: every follower, every ending version. */
  epilogueLines: number
  /** Endings written for one party combination each. */
  partyEndings: number
  /** Scenes in the adventures written for each party combination. */
  partyScenes: number
  /** Endings the villains bring of their own. */
  villainEndings: number
}

/**
 * How openings fan out into endings. A party of three from a dozen followers
 * is hundreds of combinations but only adds epilogue lines; the hero is what
 * multiplies the written endings.
 */
export function openingCombos(b: Blueprint): OpeningCombos {
  const heroes = heroVersions(b)
  const parties =
    b.partySize > 0 && b.followers >= b.partySize
      ? choose(b.followers, b.partySize)
      : 1
  const versions = b.endingVersions === 'per-hero' ? heroes : 1
  const endingVersions = b.endings * versions
  return {
    heroes,
    parties,
    openings: heroes * parties,
    endingVersions,
    epilogueLines: b.followerEpilogues ? endingVersions * b.followers : 0,
    partyEndings: b.partySize > 1 ? parties * b.partyEndings : 0,
    partyScenes: b.partySize > 1 ? parties * b.partyAdventureSteps : 0,
    villainEndings: b.villains * b.villainEndings,
  }
}

/** Hero portraits the player chooses between or builds from. */
export function heroPortraits(b: Blueprint): { count: number; detail: string } {
  if (b.portraits === 'code-drawn') return { count: 0, detail: 'drawn in code' }
  const poses = 1 + b.expressions
  if (b.creator === 'fixed')
    return { count: poses, detail: `one hero × ${poses} poses` }
  if (b.creator === 'roster')
    return {
      count: b.rosterSize * poses,
      detail: `${b.rosterSize} heroes × ${poses} poses`,
    }
  if (b.portraits === 'on-demand')
    return { count: 0, detail: 'painted per player at play time' }
  if (b.portraits === 'per-option') {
    const tiles = b.creatorFactors * b.optionsPerFactor
    return {
      count: tiles,
      detail: `${b.creatorFactors} factors × ${b.optionsPerFactor} option tiles`,
    }
  }
  const combos = b.optionsPerFactor ** b.creatorFactors
  return {
    count: combos * poses,
    detail: `${b.optionsPerFactor}^${b.creatorFactors} = ${combos} combinations × ${poses} poses`,
  }
}

function endingDetail(b: Blueprint, combos: OpeningCombos): string {
  return b.endingVersions === 'per-hero' && combos.heroes > 1
    ? `${b.endings} endings × ${combos.heroes} hero versions`
    : `${b.endings} endings`
}

export function imageLines(b: Blueprint): ForecastLine[] {
  const hero = heroPortraits(b)
  const combos = openingCombos(b)
  const outcomes =
    b.encounters * b.choicesPerEncounter * OUTCOME_PICTURES[b.outcomeArt]
  const lines: ForecastLine[] = [
    {
      label: 'Key art and title',
      count: 2,
      detail: 'key art and title splash',
    },
    { label: 'Hero', count: hero.count, detail: hero.detail },
    {
      label: 'Followers',
      count: b.followers * (1 + b.followerExpressions),
      detail: `${b.followers} × ${1 + b.followerExpressions} poses`,
    },
    {
      label: 'Villains',
      count: b.villains * 2,
      detail: `${b.villains} × portrait and reveal scene`,
    },
    { label: 'Figures', count: b.figures, detail: `${b.figures} portraits` },
    {
      label: 'Faction emblems',
      count: b.factions,
      detail: `${b.factions} emblems`,
    },
    {
      label: 'Encounter scenes',
      count: b.encounters,
      detail: `${b.encounters} scenes`,
    },
    {
      label: 'Outcome pictures',
      count: outcomes,
      detail:
        b.outcomeArt === 'none'
          ? 'text only'
          : `${b.encounters} × ${b.choicesPerEncounter} choices × ${OUTCOME_PICTURES[b.outcomeArt]}`,
    },
    { label: 'Quest cards', count: b.quests, detail: `${b.quests} quests` },
    {
      label: 'Follower quests',
      count: b.followers * b.followerQuestSteps,
      detail: `${b.followers} followers × ${b.followerQuestSteps} steps`,
    },
    {
      label: 'Places',
      count: b.locations,
      detail: `${b.locations} establishing scenes`,
    },
    {
      label: 'Finale sequences',
      count: combos.endingVersions * b.finaleBeats,
      detail: `${endingDetail(b, combos)} × ${b.finaleBeats} beats`,
    },
    {
      label: 'Party adventures',
      count: combos.partyScenes,
      detail: `${combos.parties} parties × ${b.partyAdventureSteps} steps`,
    },
    {
      label: 'Party endings',
      count: combos.partyEndings,
      detail: `${combos.parties} parties × ${b.partyEndings}`,
    },
    {
      label: 'Villain endings',
      count: combos.villainEndings,
      detail: `${b.villains} villains × ${b.villainEndings}`,
    },
    {
      label: 'Scrapbook moments',
      count: b.moments,
      detail: 'trailer reuses these',
    },
  ]
  return lines.filter((line) => line.count > 0)
}

export function wordLines(b: Blueprint, a: Assumptions): ForecastLine[] {
  const w = a.words
  const combos = openingCombos(b)
  const tiers = OUTCOME_TIERS[b.outcomes]
  const branch = b.failForward ? 1.35 : 1
  const cast =
    b.followers +
    b.villains +
    b.figures +
    (b.creator === 'roster' ? b.rosterSize : 1)
  const lines: ForecastLine[] = [
    {
      label: 'Encounters',
      count: b.encounters * w.encounterBody,
      detail: `${b.encounters} × ${w.encounterBody}`,
    },
    {
      label: 'Outcomes',
      count: Math.round(
        b.encounters * b.choicesPerEncounter * tiers * w.outcomeText * branch,
      ),
      detail: `${b.encounters} × ${b.choicesPerEncounter} choices × ${tiers} tiers${b.failForward ? ' × 1.35 fail-forward' : ''}`,
    },
    { label: 'Cast', count: cast * w.castBio, detail: `${cast} characters` },
    {
      label: 'Romance arcs',
      count: b.romances * 3 * w.encounterBody,
      detail: `${b.romances} × 3 scenes`,
    },
    {
      label: 'Quests',
      count: b.quests * b.questSteps * w.questStep,
      detail: `${b.quests} × ${b.questSteps} steps`,
    },
    {
      label: 'Follower quests',
      count: b.followers * b.followerQuestSteps * w.questStep,
      detail: `${b.followers} × ${b.followerQuestSteps} steps`,
    },
    {
      label: 'Places',
      count: b.locations * w.castBio,
      detail: `${b.locations} places`,
    },
    {
      label: 'Reveals',
      count: b.reveals * w.revealText,
      detail: `${b.reveals} reveals`,
    },
    {
      label: 'Endings',
      count: Math.round(
        combos.endingVersions *
          w.endingText *
          (b.endingMode === 'families' ? 1.6 : 1) +
          combos.endingVersions * b.finaleBeats * w.momentCaption +
          combos.epilogueLines * 40,
      ),
      detail: `${endingDetail(b, combos)} × ${w.endingText}${b.endingMode === 'families' ? ' × 1.6 variant clauses' : ''}${b.followerEpilogues ? ' + follower epilogues' : ''}`,
    },
    {
      label: 'Party adventures',
      count: combos.partyScenes * (w.encounterBody + w.questStep),
      detail: `${combos.parties} parties × ${b.partyAdventureSteps} steps`,
    },
    {
      label: 'Party and villain endings',
      count: (combos.partyEndings + combos.villainEndings) * w.endingText,
      detail: `${combos.partyEndings} party + ${combos.villainEndings} villain endings × ${w.endingText}`,
    },
    {
      label: 'Chapters and factions',
      count: b.acts * b.chaptersPerAct * 150 + b.factions * w.castBio,
      detail: `${b.acts * b.chaptersPerAct} chapter openers, ${b.factions} factions`,
    },
    {
      label: 'Character creator',
      count:
        b.creator === 'builder'
          ? b.creatorFactors * b.optionsPerFactor * w.creatorOption
          : 0,
      detail: `${b.creatorFactors} × ${b.optionsPerFactor} options`,
    },
    {
      label: 'Scrapbook and trailer',
      count: b.moments * w.momentCaption + b.trailerBeats * w.trailerBeat,
      detail: `${b.moments} captions, ${b.trailerBeats} beats`,
    },
  ]
  return lines.filter((line) => line.count > 0)
}

/** Engine work that is not words: one session per system beyond the core loop. */
export function systemSessions(b: Blueprint): number {
  return (
    2 +
    (b.checks !== 'none' ? 1 : 0) +
    (b.creator === 'builder' ? 1 : 0) +
    (b.playerUpload ? 1 : 0) +
    (b.hiddenLedger ? 0.5 : 0) +
    (b.saveStyle === 'ledger' ? 1 : 0) +
    (b.shareSeed ? 0.5 : 0) +
    (b.villainPerRun ? 1 : 0) +
    (b.quests > 0 ? 0.5 : 0) +
    (b.followerQuestSteps > 0 ? 1 : 0) +
    (b.locations > 0 ? 0.5 : 0) +
    (b.factions > 0 ? 0.5 : 0) +
    (b.saveSlots > 0 ? 0.5 : 0) +
    (b.undo === 'rewind' ? 1 : b.undo === 'last-choice' ? 0.5 : 0) +
    (b.seededRuns ? 0.5 : 0) +
    (b.exportSaves ? 0.5 : 0)
  )
}

/** Kit budget dimensions for a blueprint, so the forge and the kit agree on tiers. Visible stats are meters too. */
export function budgetCounts(b: Blueprint): Record<BudgetDimension, number> {
  return {
    acts: b.acts,
    meters: b.meters + b.stats,
    factions: b.factions,
    followers: b.followers,
    villains: b.villains,
    figures: b.figures,
    romances: b.romances,
    reveals: b.reveals,
    endings: b.endings,
    moments: b.moments,
    trailer: b.trailerBeats,
    attention: b.meters + b.stats,
    threads: b.villains + b.romances + b.factions,
  }
}

export function smallestTier(b: Blueprint): PlaybookTier | null {
  const counts = budgetCounts(b)
  return (
    TIERS.find((tier) =>
      (Object.keys(counts) as BudgetDimension[]).every(
        (d) => counts[d] <= TIER_BUDGETS[tier][d].max,
      ),
    ) ?? null
  )
}

export function forecast(
  b: Blueprint,
  a: Assumptions = DEFAULT_ASSUMPTIONS,
): Forecast {
  const images = imageLines(b)
  const base = images.reduce((sum, line) => sum + line.count, 0)
  const totalImages = Math.round(base * b.artStyles * (1 + a.rerollRate))
  const lane = checkpointClass(b.checkpoint)
  const words = wordLines(b, a)
  const totalWords = words.reduce((sum, line) => sum + line.count, 0)
  const tier = b.tier ?? smallestTier(b)
  const counts = budgetCounts(b)
  const overBudget = tier
    ? (Object.keys(counts) as BudgetDimension[]).filter(
        (d) => counts[d] > TIER_BUDGETS[tier][d].max,
      )
    : (Object.keys(counts) as BudgetDimension[]).filter(
        (d) => counts[d] > TIER_BUDGETS.saga[d].max,
      )

  const notes: string[] = []
  const hero = heroPortraits(b)
  if (
    b.creator === 'builder' &&
    b.portraits === 'per-combination' &&
    hero.count > 60
  )
    notes.push(
      `The character builder paints every combination: ${hero.count} portraits. Per-option tiles or on-demand portraits cost a fraction.`,
    )
  if (!lane.measured)
    notes.push(`${lane.label} render time is ${lane.evidence}.`)
  if (b.outcomes === 'pass-fail' && !b.failForward)
    notes.push(
      'Pass/fail without fail-forward ends threads on a bad roll. Every playbook so far branches failure instead.',
    )
  if (b.checks !== 'none' && !b.visibleOdds)
    notes.push(
      'Hidden odds make checks feel arbitrary; every shipped playbook shows the target.',
    )
  if (b.unreadable === 'reset')
    notes.push(
      'Resetting an unreadable save overwrites the player’s run. Emperor of Dust holds it untouched and says so; the kit does the same.',
    )
  if (b.saveStyle === 'ledger' && !b.seededRuns)
    notes.push(
      'A replay ledger needs seeded runs: it stores the seed and every action.',
    )
  if (b.romances > b.followers)
    notes.push(
      'More romances than followers: romance should ride on characters the player already travels with.',
    )
  const combos = openingCombos(b)
  if (combos.openings > 1)
    notes.push(
      `${combos.heroes} hero${combos.heroes === 1 ? '' : 'es'} × ${combos.parties} part${combos.parties === 1 ? 'y' : 'ies'} = ${combos.openings} openings. ${b.endingVersions === 'per-hero' ? `Each ending is written per hero: ${combos.endingVersions} ending versions` : `Endings ignore the hero: ${combos.endingVersions} endings`}${combos.epilogueLines ? `, and parties add ${combos.epilogueLines} epilogue lines` : ''}.`,
    )
  if (!tier)
    notes.push(
      'Over every tier cap, even Saga: cut, or write allowances that say why.',
    )

  return {
    images,
    totalImages,
    renderSeconds: Math.round(
      totalImages * lane.secondsPerImage + a.lanes * lane.coldStartSeconds,
    ),
    queueSeconds: Math.round(totalImages * a.queueSecondsPerImage),
    words,
    totalWords,
    sessions: Math.ceil(totalWords / a.wordsPerSession + systemSessions(b)),
    qaRuns:
      openingCombos(b).endingVersions * 2 +
      (b.villainPerRun ? b.villains : 0) +
      (b.seededRuns ? 5 : 0),
    tier,
    overBudget,
    notes,
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 90) return `${Math.max(0, Math.round(seconds))}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 90) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return hours < 48
    ? `${hours}h ${minutes % 60}m`
    : `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export function formatCount(n: number): string {
  return n >= 10000
    ? `${Math.round(n / 1000)}k`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : String(n)
}

/**
 * Endings gallery and campaign scrapbook (slime-city/t-059).
 *
 * Silas, 2026-11-11 PT, asked whether finishing a crew campaign leaves an
 * ending scrapbook. A finished crew earns up to three endings at once: its
 * TRIUMPH or COMPROMISE plate (three or more Conviction victories), one of
 * the three authored journey epilogues, and, when the last chapter was fought
 * with an ally, that pair's PROTECT or GAMBLE alliance ending. The gallery
 * keeps every ending ever found, per crew; the scrapbook keeps one page per
 * finished run. Both are private story saves: no XP, cards or Meat.
 */
import {
  FACTION_CAMPAIGNS,
  campaignLegacyFor,
  type CampaignApproach,
  type CampaignSave,
} from './campaign'
import { ALLIANCE_LATER_ARCS } from './campaignAllianceLater'
import { EPILOGUE_KEYS, type EpilogueKey } from './campaignEpilogues'
import { geneRiotEpilogueKey, GENE_RIOT_EPILOGUES } from './campaignGeneRiot'
import {
  bloodfairyEpilogueKey,
  BLOODFAIRY_EPILOGUES,
} from './campaignBloodfairies'
import { ironjawEpilogueKey, IRONJAW_EPILOGUES } from './campaignIronjaw'
import { riotEpilogueKey, RIOT_EPILOGUES } from './campaignRiot'
import { undertowEpilogueKey, UNDERTOW_EPILOGUES } from './campaignUndertow'
import { exchangeEpilogueKey, EXCHANGE_EPILOGUES } from './campaignExchange'
import { TEAMS, type TeamId } from './prototypes'

export type EndingKind = 'plate' | 'journey' | 'alliance'

export interface EndingEntry {
  /** Stable save id, e.g. `ironjaw:triumph`, `ironjaw:journey:left`. */
  id: string
  team: TeamId
  kind: EndingKind
  title: string
  /** The earned text, shown once found; locked entries show a silhouette. */
  story: string
  /** Alliance endings name the ally crew. */
  ally?: TeamId
}

const JOURNEY: Record<
  TeamId,
  {
    key: (progress: CampaignSave[TeamId]) => EpilogueKey | null
    text: Record<EpilogueKey, string>
    titles: Record<EpilogueKey, string>
  }
> = {
  catgirls: {
    key: geneRiotEpilogueKey,
    text: GENE_RIOT_EPILOGUES,
    titles: {
      left: 'The Clinic Door',
      right: 'The Kept Map',
      mixed: "Lark's Other Ledger",
    },
  },
  bloodfairies: {
    key: bloodfairyEpilogueKey,
    text: BLOODFAIRY_EPILOGUES,
    titles: {
      left: 'The Moshpit Republic',
      right: 'The Master Switch',
      mixed: 'The Songbook With Mistakes',
    },
  },
  ironjaw: {
    key: ironjawEpilogueKey,
    text: IRONJAW_EPILOGUES,
    titles: {
      left: 'The Foundry Runs Itself',
      right: "Rivet's Switch",
      mixed: 'Arguments Over Lunch',
    },
  },
  riot: {
    key: riotEpilogueKey,
    text: RIOT_EPILOGUES,
    titles: {
      left: 'The Free Festival',
      right: 'The Licensed Stage',
      mixed: 'Every Night an Argument',
    },
  },
  undertow: {
    key: undertowEpilogueKey,
    text: UNDERTOW_EPILOGUES,
    titles: {
      left: 'Every Kitchen Has a Switch',
      right: 'The Oracle Hears Everything',
      mixed: 'The Short List',
    },
  },
  exchange: {
    key: exchangeEpilogueKey,
    text: EXCHANGE_EPILOGUES,
    titles: {
      left: 'The Book Is Shut',
      right: 'The Hunger Sleeps Fed',
      mixed: 'Pages Torn and Binding',
    },
  },
}

const crewName = (id: TeamId): string =>
  TEAMS.find((team) => team.id === id)?.name ?? id

/** Every ending a crew can earn, in gallery order. */
export function endingCatalog(team: TeamId): EndingEntry[] {
  const story = FACTION_CAMPAIGNS[team]
  const journey = JOURNEY[team]
  const entries: EndingEntry[] = [
    {
      id: team + ':triumph',
      team,
      kind: 'plate',
      title: 'Triumph',
      story: story.triumph,
    },
    {
      id: team + ':compromise',
      team,
      kind: 'plate',
      title: 'Compromise',
      story: story.compromise,
    },
    ...EPILOGUE_KEYS.map((key) => ({
      id: team + ':journey:' + key,
      team,
      kind: 'journey' as const,
      title: journey.titles[key],
      story: journey.text[key],
    })),
  ]
  for (const ally of TEAMS.map((crew) => crew.id)) {
    const arc = ALLIANCE_LATER_ARCS[team][ally]
    if (!arc || ally === team) continue
    for (const pick of ['protect', 'gamble'] as const)
      entries.push({
        id: team + ':alliance:' + ally + ':' + pick,
        team,
        kind: 'alliance',
        ally,
        title:
          arc.finale.title +
          ' · ' +
          crewName(ally) +
          ' · ' +
          pick.toUpperCase(),
        story: arc.finale[pick],
      })
  }
  return entries
}

const CATALOG_IDS: ReadonlySet<string> = new Set(
  TEAMS.flatMap((crew) => endingCatalog(crew.id).map((entry) => entry.id)),
)

export function isEndingId(id: unknown): id is string {
  return typeof id === 'string' && CATALOG_IDS.has(id)
}

/** The endings a finished run earned; empty until all five chapters are won. */
export function earnedEndingIds(save: CampaignSave, team: TeamId): string[] {
  const progress = save[team]
  if (progress.wins !== FACTION_CAMPAIGNS[team].chapters.length) return []
  const conviction = progress.decisions.filter(
    (id) => id === 'conviction',
  ).length
  const ids = [team + (conviction >= 3 ? ':triumph' : ':compromise')]
  const journey = JOURNEY[team].key(progress)
  if (journey) ids.push(team + ':journey:' + journey)
  const finale = progress.allianceJourney?.[4]
  if (finale && finale.ally !== team && ALLIANCE_LATER_ARCS[team][finale.ally])
    ids.push(team + ':alliance:' + finale.ally + ':' + finale.pick)
  return ids.filter(isEndingId)
}

/**
 * The story-art slug ('<team>/…' in SLIME_CITY_ART.story) painted for an
 * ending: journey endings have their own plate, the two approach endings keep
 * theirs, and alliance endings have none (the gallery shows the ally's poster).
 */
export function endingArtSlug(id: string): string | null {
  if (!isEndingId(id)) return null
  const [team, kind, key] = id.split(':')
  if (kind === 'journey') return team + '/journey-' + key
  if (kind === 'triumph' || kind === 'compromise')
    return team + '/ending-' + kind
  return null
}

/**
 * Story-art slugs for a finished run's finale, best first: the journey ending
 * the final choice earned, then the approach ending. Empty until the run ends.
 */
export function finaleArtSlugs(save: CampaignSave, team: TeamId): string[] {
  const ids = earnedEndingIds(save, team)
  return [
    ...ids.filter((id) => id.includes(':journey:')),
    ...ids.filter((id) => !id.includes(':journey:')),
  ]
    .map(endingArtSlug)
    .filter((slug): slug is string => slug !== null)
}

/** A finished run, stored as ids so a page stays small and re-renders text. */
export interface ScrapbookPage {
  team: TeamId
  /** Run number for this crew, starting at 1. */
  run: number
  /** The winning approach of each of the five chapters. */
  decisions: CampaignApproach[]
  /** Story bouts lost along the way. */
  losses: number
  endings: string[]
  /** The legacy favor carried into the city; null if none. */
  favor: string | null
}

export const SCRAPBOOK_LIMIT = 30

export interface EndingsRecord {
  endings: string[]
  scrapbook: ScrapbookPage[]
}

/**
 * Fold every finished crew run into the gallery and scrapbook. Idempotent:
 * the same finished run updates its own page (its favor can still change)
 * instead of adding another. `favors` names the chosen legacy favor for the
 * crews whose choice is known; other crews keep their saved favor.
 */
export function recordFinishedRuns(
  record: EndingsRecord,
  save: CampaignSave,
  favors: Partial<Record<TeamId, string | null>> = {},
): EndingsRecord & { changed: boolean } {
  const endings = [...record.endings]
  const scrapbook = record.scrapbook.map((page) => ({ ...page }))
  let changed = false
  for (const crew of TEAMS) {
    const team = crew.id
    const earned = earnedEndingIds(save, team)
    if (!earned.length) continue
    for (const id of earned)
      if (!endings.includes(id)) {
        endings.push(id)
        changed = true
      }
    const progress = save[team]
    const favor =
      favors[team] !== undefined
        ? favors[team]!
        : (campaignLegacyFor(save, team)?.echo.title ?? null)
    const pages = scrapbook.filter((page) => page.team === team)
    const latest = pages[pages.length - 1]
    const sameRun =
      latest &&
      latest.decisions.join() === progress.decisions.join() &&
      latest.losses === progress.losses
    if (sameRun) {
      const nextEndings = [...new Set([...latest.endings, ...earned])]
      const nextFavor = favors[team] !== undefined ? favor : latest.favor
      if (
        nextEndings.length !== latest.endings.length ||
        nextFavor !== latest.favor
      ) {
        latest.endings = nextEndings
        latest.favor = nextFavor
        changed = true
      }
      continue
    }
    scrapbook.push({
      team,
      run: (latest?.run ?? 0) + 1,
      decisions: [...progress.decisions],
      losses: progress.losses,
      endings: earned,
      favor,
    })
    changed = true
  }
  return {
    endings,
    scrapbook: scrapbook.slice(-SCRAPBOOK_LIMIT),
    changed,
  }
}

export function validEndings(raw: unknown): raw is string[] {
  return (
    Array.isArray(raw) &&
    raw.length <= CATALOG_IDS.size &&
    raw.every(isEndingId) &&
    new Set(raw).size === raw.length
  )
}

export function validScrapbook(raw: unknown): raw is ScrapbookPage[] {
  if (!Array.isArray(raw) || raw.length > SCRAPBOOK_LIMIT) return false
  const teams = TEAMS.map((crew) => crew.id) as string[]
  return raw.every((page: unknown) => {
    if (!page || typeof page !== 'object' || Array.isArray(page)) return false
    const p = page as Record<string, unknown>
    return (
      teams.includes(p.team as string) &&
      Number.isSafeInteger(p.run) &&
      (p.run as number) >= 1 &&
      (p.run as number) <= 100000 &&
      Number.isSafeInteger(p.losses) &&
      (p.losses as number) >= 0 &&
      (p.losses as number) <= 1000000 &&
      Array.isArray(p.decisions) &&
      p.decisions.length === 5 &&
      p.decisions.every((d) => d === 'conviction' || d === 'cunning') &&
      Array.isArray(p.endings) &&
      p.endings.length >= 1 &&
      p.endings.length <= 8 &&
      p.endings.every(
        (id) => isEndingId(id) && id.startsWith((p.team as string) + ':'),
      ) &&
      (p.favor === null ||
        (typeof p.favor === 'string' && p.favor.length <= 160))
    )
  })
}

/** Gallery view of one crew: every entry, which are found, and X/N. */
export function endingGallery(
  team: TeamId,
  found: readonly string[],
): {
  entries: (EndingEntry & { found: boolean })[]
  found: number
  total: number
} {
  const entries = endingCatalog(team).map((entry) => ({
    ...entry,
    found: found.includes(entry.id),
  }))
  return {
    entries,
    found: entries.filter((entry) => entry.found).length,
    total: entries.length,
  }
}

export function endingById(id: string): EndingEntry | undefined {
  const team = id.split(':')[0] as TeamId
  if (!FACTION_CAMPAIGNS[team]) return undefined
  return endingCatalog(team).find((entry) => entry.id === id)
}

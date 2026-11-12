import {
  CHAMPION_AFTERMATH,
  CITY_FINALE,
  CITY_PLAN,
  CIVIC_CRISES,
  STREET_STORIES,
  createCity,
  type BoutTerms,
  type CityState,
} from './city'
import {
  FACTION_CAMPAIGNS,
  createCampaignSave,
  type CampaignSave,
} from './campaign'
import { TEAMS, loadoutProblems, type TeamId } from './prototypes'
import { campaignCardChoices } from './campaignCardRewards'
import { validGeneRiotJourney } from './campaignGeneRiot'
import { validBloodfairyJourney } from './campaignBloodfairies'
import { validIronjawJourney } from './campaignIronjaw'
import { validRiotJourney } from './campaignRiot'
import { validUndertowJourney } from './campaignUndertow'
import { validExchangeJourney } from './campaignExchange'
import { validAllianceStoryDecisions } from './campaignAllianceJourney'
import { freshTower, validTowerSave, type TowerSave } from './allianceTower'
import {
  SCRAPBOOK_LIMIT,
  isEndingId,
  validEndings,
  validScrapbook,
  type ScrapbookPage,
} from './endings'
import {
  normalizeLegacyAllianceDeck,
  validAllianceDeck,
  validLibrary,
  validSoloDeck,
  type AllianceDeck,
  type LibraryDeck,
} from './alliance'

export interface SlimeCityStory {
  version: 1
  revision: number
  city: CityState
  campaigns: CampaignSave
  /** The city, its crew chapters, and the deck format share one journey. */
  tower?: TowerSave
  /** Last journey seat and deck, restored without resetting chapter choices. */
  journeyTeam?: TeamId
  journeyFormat?: 'solo' | 'alliance'
  journeyDeckId?: string | null
  journeyScreen?: 'chapter' | 'aftermath'
  /** Saved practice decks; omitted for older saves. */
  decks?: Partial<Record<TeamId, string[]>>
  /**
   * ALLIANCE 20-card two-crew decks, one per general (Silas, 2026-11-07 PT;
   * 20 cards since 2026-11-09).
   * Omitted for older saves.
   */
  alliances?: Partial<Record<TeamId, AllianceDeck>>
  /** SOLO CLASH 20-card decks, one per faction. Omitted for older saves. */
  soloDecks?: Partial<Record<TeamId, string[]>>
  /** COLLECTION's named Alliance deck library. Omitted for older saves. */
  library?: LibraryDeck[]
  /**
   * Card unlocks (Silas, 2026-11-04: "we start with all card unlocked as a
   * default mode, but then they can try a mode where it gets trickled out").
   * Silas, 2026-11-09 PT: "We should default to trickle display." New stories
   * start in 'trickle'; omitted still means 'all', so saves made before then
   * keep the open collection their decks were built from.
   */
  unlocks?: UnlockMode
  /**
   * Story bouts (Silas, 2026-11-04: story mode through PARITY or Turf): play
   * each bout in its written format, or every bout as TURF; and with PARITY
   * rules or not. Omitted means as written, without PARITY.
   */
  storyMode?: StoryMode
  storyParity?: boolean
  /** Endings gallery: every ending ever found (slime-city/t-059). */
  endings?: string[]
  /** One scrapbook page per finished crew run (slime-city/t-059). */
  scrapbook?: ScrapbookPage[]
}

/** 'written': each bout's own format. 'turf': every story bout is TURF. */
export type StoryMode = 'written' | 'turf'
export const STORY_MODES: readonly StoryMode[] = ['written', 'turf']

/** 'all': every card is open. 'trickle': starters, then cards from packs. */
export type UnlockMode = 'all' | 'trickle'
export const UNLOCK_MODES: readonly UnlockMode[] = ['all', 'trickle']

/**
 * Silas, 2026-11-10 PT: "from now on, everyone, including me as admin, should
 * be restricted to those base cards and then cards that they particularly
 * unlock". ALL CARDS is retired; older saves that stored it read as TRICKLE.
 */
export function unlockModeOf(
  _story: Pick<SlimeCityStory, 'unlocks'>,
): UnlockMode {
  return 'trickle'
}

export function newSlimeCityStory(): SlimeCityStory {
  return {
    version: 1,
    revision: 0,
    city: createCity(),
    campaigns: createCampaignSave(),
    tower: freshTower(),
    unlocks: 'trickle',
  }
}

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown, min = 0, max = 10000): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max
const text = (v: unknown, max = 4000): v is string =>
  typeof v === 'string' && v.length <= max
const unique = (v: unknown[], allowed: readonly string[]): boolean =>
  v.every((x) => typeof x === 'string' && allowed.includes(x)) &&
  new Set(v).size === v.length
const ids = Object.keys(CITY_PLAN)
const teams = TEAMS.map((t) => t.id)
const terms = (v: unknown): v is BoutTerms =>
  record(v) &&
  Object.entries(v).every(([k, x]) =>
    k === 'rivalTrap'
      ? typeof x === 'boolean'
      : [
          'playerMana',
          'enemyMana',
          'enemyArmor',
          'playerHp',
          'fewerRivals',
          'rounds',
        ].includes(k) && number(x, -20, 20),
  )
const termsByDistrict = (v: unknown): boolean =>
  record(v) && Object.entries(v).every(([k, x]) => ids.includes(k) && terms(x))
const choices = (v: unknown, options: Record<string, string[]>): boolean =>
  record(v) &&
  Object.entries(v).every(
    ([k, x]) =>
      Object.hasOwn(options, k) &&
      typeof x === 'string' &&
      options[k]!.includes(x),
  )
const districtChoices = Object.fromEntries(
  ids.map((id) => [
    id,
    CITY_PLAN[id as keyof typeof CITY_PLAN]!.choices.map((c) => c.id),
  ]),
)
const streetChoices = Object.fromEntries(
  Object.entries(STREET_STORIES).map(([name, story]) => [
    name,
    story.choices.map((c) => c.id),
  ]),
)
const aftermathChoices = Object.fromEntries(
  Object.entries(CHAMPION_AFTERMATH).map(([name, story]) => [
    name,
    story.choices.map((c) => c.id),
  ]),
)
const crisisChoices = Object.fromEntries(
  CIVIC_CRISES.map((crisis) => [crisis.id, crisis.choices.map((c) => c.id)]),
)

export function validSlimeCityStory(raw: unknown): raw is SlimeCityStory {
  if (
    !record(raw) ||
    raw.version !== 1 ||
    !number(raw.revision, 0, 1000000000) ||
    !record(raw.city) ||
    !record(raw.campaigns)
  )
    return false
  if (
    raw.unlocks !== undefined &&
    !UNLOCK_MODES.includes(raw.unlocks as UnlockMode)
  )
    return false
  if (
    raw.storyMode !== undefined &&
    !STORY_MODES.includes(raw.storyMode as StoryMode)
  )
    return false
  if (raw.storyParity !== undefined && typeof raw.storyParity !== 'boolean')
    return false
  if (
    raw.journeyTeam !== undefined &&
    !teams.includes(raw.journeyTeam as TeamId)
  )
    return false
  if (
    raw.journeyFormat !== undefined &&
    raw.journeyFormat !== 'solo' &&
    raw.journeyFormat !== 'alliance'
  )
    return false
  if (
    raw.journeyDeckId !== undefined &&
    raw.journeyDeckId !== null &&
    (!text(raw.journeyDeckId, 80) || !raw.journeyDeckId)
  )
    return false
  if (
    raw.journeyScreen !== undefined &&
    raw.journeyScreen !== 'chapter' &&
    raw.journeyScreen !== 'aftermath'
  )
    return false
  if (raw.tower !== undefined && !validTowerSave(raw.tower)) return false
  if (raw.endings !== undefined && !validEndings(raw.endings)) return false
  if (raw.scrapbook !== undefined && !validScrapbook(raw.scrapbook))
    return false
  if (raw.decks !== undefined) {
    if (!record(raw.decks)) return false
    for (const [team, deck] of Object.entries(raw.decks)) {
      if (
        !teams.includes(team as TeamId) ||
        !Array.isArray(deck) ||
        !deck.every((id) => typeof id === 'string') ||
        loadoutProblems(team as TeamId, deck).length
      )
        return false
    }
  }
  if (raw.soloDecks !== undefined) {
    if (!record(raw.soloDecks)) return false
    for (const [team, deck] of Object.entries(raw.soloDecks))
      if (!validSoloDeck(team, deck)) return false
  }
  if (raw.library !== undefined && !validLibrary(raw.library)) return false
  if (raw.alliances !== undefined) {
    if (!record(raw.alliances)) return false
    for (const [team, deck] of Object.entries(raw.alliances))
      if (
        !teams.includes(team as TeamId) ||
        !validAllianceDeck(deck) ||
        deck.general !== team
      )
        return false
  }
  const city = raw.city
  const standing = city.standing
  if (
    !ids.includes(city.location as string) ||
    !number(city.nights, 0, 1000000) ||
    !number(city.heat, 0, 10000) ||
    !number(city.losses, 0, 1000000) ||
    !record(standing) ||
    ids.some((id) => !number(standing[id], -10000, 10000)) ||
    !choices(city.choices, districtChoices) ||
    !choices(city.streetChoices, streetChoices) ||
    !choices(city.aftermathChoices, aftermathChoices) ||
    !choices(city.crisisChoices, crisisChoices) ||
    !termsByDistrict(city.streetTerms) ||
    !terms(city.crisisTerms) ||
    !(
      city.pendingStreet === null ||
      (text(city.pendingStreet, 100) &&
        Object.hasOwn(STREET_STORIES, city.pendingStreet))
    ) ||
    !(
      city.pendingAftermath === null ||
      ids.includes(city.pendingAftermath as string)
    ) ||
    !(
      city.finaleChoice === null ||
      CITY_FINALE.choices.some((choice) => choice.id === city.finaleChoice)
    ) ||
    !Array.isArray(city.cleared) ||
    !unique(city.cleared, ids) ||
    !Array.isArray(city.contracts) ||
    !unique(city.contracts, ids) ||
    !Array.isArray(city.log) ||
    city.log.length > 30 ||
    !city.log.every((entry: unknown) => text(entry, 512))
  )
    return false
  for (const team of teams) {
    const p = raw.campaigns[team]
    if (
      !record(p) ||
      !number(p.wins, 0, 5) ||
      !number(p.losses, 0, 1000000) ||
      !Array.isArray(p.decisions) ||
      p.decisions.length !== p.wins ||
      !p.decisions.every(
        (d: unknown) => d === 'conviction' || d === 'cunning',
      ) ||
      !(
        p.lastResult === null ||
        ['player', 'enemy', 'draw'].includes(p.lastResult as string)
      ) ||
      !(p.lastScene === null || text(p.lastScene, 4000)) ||
      !(
        p.lastApproach === undefined ||
        p.lastApproach === null ||
        p.lastApproach === 'conviction' ||
        p.lastApproach === 'cunning'
      )
    )
      return false
    if (p.wins > FACTION_CAMPAIGNS[team as TeamId].chapters.length) return false
    if (
      !validAllianceStoryDecisions(
        p.allianceJourney,
        team as TeamId,
        p.wins as number,
      )
    )
      return false
    if (
      team === 'catgirls' &&
      !validGeneRiotJourney(p as unknown as CampaignSave['catgirls'])
    )
      return false
    if (
      team === 'bloodfairies' &&
      !validBloodfairyJourney(p as unknown as CampaignSave['bloodfairies'])
    )
      return false
    if (
      team === 'ironjaw' &&
      !validIronjawJourney(p as unknown as CampaignSave['ironjaw'])
    )
      return false
    if (
      team === 'riot' &&
      !validRiotJourney(p as unknown as CampaignSave['riot'])
    )
      return false
    if (
      team === 'undertow' &&
      !validUndertowJourney(p as unknown as CampaignSave['undertow'])
    )
      return false
    if (
      team === 'exchange' &&
      !validExchangeJourney(p as unknown as CampaignSave['exchange'])
    )
      return false
    if (
      team !== 'catgirls' &&
      team !== 'bloodfairies' &&
      team !== 'ironjaw' &&
      team !== 'riot' &&
      team !== 'undertow' &&
      team !== 'exchange' &&
      p.journey !== undefined
    )
      return false
    if (p.rewards !== undefined) {
      if (
        !Array.isArray(p.rewards) ||
        p.rewards.length > p.wins ||
        p.rewards.some((id: unknown) => typeof id !== 'string')
      )
        return false
      const rewardIds = p.rewards as string[]
      for (let index = 0; index < rewardIds.length; index++) {
        const earned = {
          ...raw.campaigns,
          [team]: { ...p, wins: index + 1, rewards: rewardIds.slice(0, index) },
        } as CampaignSave
        if (
          !campaignCardChoices(earned, team as TeamId)?.some(
            (card) => card.id === rewardIds[index],
          )
        )
          return false
      }
    }
  }
  return true
}

/**
 * Alliance decks shrank from 30 to 20 cards (Silas, 2026-11-09 PT). A story
 * saved before then keeps everything but what is no longer legal: retired
 * Alliance decks drop (the starter returns) and a tower run carrying one ends,
 * keeping the tower's runs, best floor, cinders and unlocked cards.
 */
function withoutRetiredAlliances(raw: unknown): unknown {
  if (!record(raw)) return raw
  let story = raw
  if (record(raw.alliances)) {
    const kept: Record<string, AllianceDeck> = {}
    for (const [team, deck] of Object.entries(raw.alliances)) {
      const normalized = normalizeLegacyAllianceDeck(deck)
      if (normalized?.general === team) kept[team] = normalized
    }
    story = { ...story, alliances: kept }
  }
  const tower = raw.tower
  if (record(tower) && record(tower.run)) {
    const normalized = normalizeLegacyAllianceDeck(tower.run.deck)
    story = {
      ...story,
      tower: {
        ...tower,
        run: normalized ? { ...tower.run, deck: normalized } : null,
      },
    }
  }
  return story
}

/**
 * A retired ending (an arc renamed or removed later) must never void the whole
 * story: unknown ending ids and unreadable scrapbook pages are dropped.
 */
function withoutRetiredEndings(raw: unknown): unknown {
  if (!record(raw)) return raw
  let story = raw
  if (Array.isArray(raw.endings))
    story = { ...story, endings: [...new Set(raw.endings.filter(isEndingId))] }
  if (Array.isArray(raw.scrapbook))
    story = {
      ...story,
      scrapbook: raw.scrapbook
        .filter((page) => validScrapbook([page]))
        .slice(-SCRAPBOOK_LIMIT),
    }
  return story
}

function savedStory(raw: unknown): SlimeCityStory | undefined {
  if (!record(raw)) return undefined
  const story = withoutRetiredEndings(withoutRetiredAlliances(raw.story))
  return validSlimeCityStory(story) ? story : undefined
}

/** Never allow a saved story snapshot to affect the account wallet or card ledger. */
export function storyFromAccount(raw: unknown): SlimeCityStory {
  return savedStory(raw) ?? newSlimeCityStory()
}

export function accountWithStory(raw: unknown, progression: object): object {
  const story = savedStory(raw)
  return story ? { ...progression, story } : progression
}

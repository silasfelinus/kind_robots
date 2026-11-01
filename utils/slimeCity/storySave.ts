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
import { TEAMS, type TeamId } from './prototypes'

export interface SlimeCityStory {
  version: 1
  revision: number
  city: CityState
  campaigns: CampaignSave
}

export function newSlimeCityStory(): SlimeCityStory {
  return {
    version: 1,
    revision: 0,
    city: createCity(),
    campaigns: createCampaignSave(),
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
  const city = raw.city
  if (
    !ids.includes(city.location as string) ||
    !number(city.nights, 0, 1000000) ||
    !number(city.heat, 0, 10000) ||
    !number(city.losses, 0, 1000000) ||
    !record(city.standing) ||
    ids.some((id) => !number(city.standing[id], -10000, 10000)) ||
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
      !(p.lastScene === null || text(p.lastScene, 4000))
    )
      return false
    if (p.wins > FACTION_CAMPAIGNS[team as TeamId].chapters.length) return false
  }
  return true
}

/** Never allow a saved story snapshot to affect the account wallet or card ledger. */
export function storyFromAccount(raw: unknown): SlimeCityStory {
  if (!record(raw) || !validSlimeCityStory(raw.story))
    return newSlimeCityStory()
  return raw.story
}

export function accountWithStory(raw: unknown, progression: object): object {
  const story =
    record(raw) && validSlimeCityStory(raw.story) ? raw.story : undefined
  return story ? { ...progression, story } : progression
}

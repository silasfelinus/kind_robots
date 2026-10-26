import type { Playbook } from '../playbook/types'
import { VIGNETTE_DEFAULTS } from './presets'
import type { Blueprint } from './types'

// Existing playbooks as blueprints. `plan` is each project's Conductor goal
// (and master issue) transcribed into factors; `built` is counted from the
// game's own code when the forge opens it, so the comparison never goes stale.
// Factors the code cannot reveal are carried from the plan and marked as such.

export type BuiltCounts = {
  values: Partial<Blueprint>
  /** Factors read from code rather than carried from the plan. */
  measured: (keyof Blueprint)[]
  art: { painted: number; total: number } | null
  source: string
}

export type ExistingPlaybook = {
  slug: string
  title: string
  cover: string
  route: string
  /** Its Playbook Studio id, when the manager already has an adapter for it. */
  studio?: string
  planSource: string
  plan: Blueprint
  count: () => Promise<BuiltCounts>
}

function plan(
  slug: string,
  title: string,
  values: Partial<Blueprint>,
): Blueprint {
  return { ...VIGNETTE_DEFAULTS, slug, title, tier: 'saga', ...values }
}

/** Counts a Playbook Studio adapter already exposes, keyed to blueprint factors. */
function fromStudio(book: Playbook, ignore: string[] = []): BuiltCounts {
  const kinds = new Map<string, number>()
  for (const node of Object.values(book.nodes))
    kinds.set(node.kind, (kinds.get(node.kind) ?? 0) + 1)
  const n = (kind: string) =>
    ignore.includes(kind) ? 0 : (kinds.get(kind) ?? 0)
  const nodes = Object.values(book.nodes)
  const found: Partial<Record<keyof Blueprint, number>> = {
    encounters: n('encounter'),
    quests: n('quest'),
    endings: n('ending'),
    villains: n('boss'),
  }
  const values: Partial<Blueprint> = {}
  const measured: (keyof Blueprint)[] = []
  for (const [key, count] of Object.entries(found) as [
    keyof Blueprint,
    number,
  ][])
    if (count > 0) {
      ;(values as Record<string, number>)[key] = count
      measured.push(key)
    }
  const followers =
    n('follower') ||
    (book.peopleLabel.match(/companion|follower/i) ? book.people.length : 0)
  if (followers) {
    values.followers = followers
    measured.push('followers')
  }
  return {
    values,
    measured,
    art: {
      painted: nodes.filter((node) => !!node.artUrl).length,
      total: nodes.length,
    },
    source: `Playbook Studio adapter: ${nodes.length} authored beats`,
  }
}

/** `ignore` drops node kinds a game uses for something else (Ecotone's quest nodes are mystery steps). */
async function studio(id: string, ignore: string[] = []): Promise<BuiltCounts> {
  const { buildPlaybook, isPlaybookGame } = await import('../playbook/games')
  if (!isPlaybookGame(id)) throw new Error(`${id} is not in Playbook Studio`)
  return fromStudio(buildPlaybook(id), ignore)
}

export const EXISTING_PLAYBOOKS: ExistingPlaybook[] = [
  {
    slug: 'game-of-captains',
    studio: 'game-of-captains',
    title: 'Space Couch',
    cover: '/game-of-captains/space-couch-stage.svg',
    route: '/play/game-of-captains',
    planSource:
      'Space Couch ship bible, Conductor goal and master issue kind_robots#4182',
    plan: plan('game-of-captains', 'Space Couch', {
      genre: 'space-comedy',
      placement: 'play',
      creator: 'roster',
      rosterSize: 6,
      followers: 16,
      partySize: 3,
      villains: 8,
      villainPerRun: true,
      acts: 3,
      chaptersPerAct: 4,
      encounters: 40,
      quests: 30,
      checks: 'percent',
      outcomes: 'five-tier',
      outcomeArt: 'both',
      endings: 16,
      factions: 4,
      saveSlots: 3,
    }),
    count: async () => {
      const rules = await import('../gameOfCaptains/rules')
      return {
        values: {
          rosterSize: rules.CAPTAINS.length,
          followers: rules.CREW.length,
          villains: rules.ANTAGONISTS.length,
          quests: rules.MISSIONS.length,
          encounters: rules.MISSIONS.length,
          endings: 4,
        },
        measured: [
          'rosterSize',
          'followers',
          'villains',
          'quests',
          'encounters',
        ],
        art: null,
        source: 'utils/gameOfCaptains/rules.ts (not yet in Playbook Studio)',
      }
    },
  },
  {
    slug: 'comet-city-academy',
    studio: 'comet-city-academy',
    title: 'Capes & Tassels: Prom of Doom',
    cover: '/comet-city-academy/front/splash.webp',
    route: '/play/comet-city-academy',
    planSource:
      'Conductor goal, master issue kind_robots#4181 and IDENTITY-SYSTEM.md (48 people, seeded roles)',
    plan: plan('comet-city-academy', 'Capes & Tassels: Prom of Doom', {
      genre: 'hero-academy',
      placement: 'play',
      creator: 'builder',
      creatorFactors: 2,
      optionsPerFactor: 8,
      portraits: 'per-combination',
      identityAffectsOdds: true,
      outcomes: 'four-tier',
      // The 48 origin x affinity people: the player becomes one and the seed
      // deals the rest roles (training roster, friends, romances, partner or
      // sidekick, hero upgrades, enemies). Each has student, hero and villain forms.
      followers: 48,
      partySize: 3,
      followerExpressions: 3,
      romances: 48,
      villains: 8,
      villainPerRun: true,
      acts: 4,
      chaptersPerAct: 8,
      encounters: 60,
      outcomeArt: 'both',
      endings: 12,
      saveSlots: 3,
    }),
    count: async () => {
      const [rules, roster, districts] = await Promise.all([
        import('../cometAcademy/rules'),
        import('../cometAcademy/identityArcs'),
        import('../cometAcademy/districtEncounters'),
      ])
      const { PROM_ENDINGS } = await import('../cometAcademy/artSlots')
      const { CAMPAIGN_VILLAINS } = await import('../cometAcademy/campaign')
      const people = roster.CHARACTER_ROSTER
      return {
        values: {
          followers: people.length,
          romances: people.filter((person) => person.romance).length,
          villains: CAMPAIGN_VILLAINS.length,
          encounters:
            rules.INCIDENTS.length +
            rules.ENCOUNTERS.length +
            Object.keys(districts.DISTRICT_ENCOUNTERS).length,
          endings: PROM_ENDINGS.length,
        },
        measured: [
          'followers',
          'romances',
          'villains',
          'encounters',
          'endings',
        ],
        art: null,
        source:
          'the Capes & Tassels identity roster (48 people, 2 guests) and its runtime content',
      }
    },
  },
  {
    slug: 'emperor-of-dust',
    studio: 'emperor-of-dust',
    title: 'Emperor of Dust',
    cover: '/emperor-of-dust/map/wasteland.webp',
    route: '/play/emperor-of-dust',
    planSource: 'Conductor goal (SYSTEMS-V03)',
    plan: plan('emperor-of-dust', 'Emperor of Dust', {
      genre: 'court-intrigue',
      creator: 'fixed',
      followers: 20,
      partySize: 4,
      factions: 15,
      villains: 3,
      romances: 4,
      figures: 24,
      acts: 5,
      chaptersPerAct: 10,
      encounters: 120,
      quests: 100,
      questSteps: 2,
      checks: 'percent',
      outcomes: 'four-tier',
      saveStyle: 'ledger',
      meters: 3,
      endings: 8,
      saveSlots: 3,
      undo: 'rewind',
    }),
    count: () => studio('emperor-of-dust'),
  },
  {
    slug: 'weird-humboldt',
    studio: 'ecotone',
    title: 'Ecotone',
    cover: '/ecotone/title/key-art.webp',
    route: '/play/ecotone',
    planSource: 'Conductor goal',
    plan: plan('weird-humboldt', 'Ecotone', {
      genre: 'comedy-horror',
      creator: 'roster',
      rosterSize: 12,
      followers: 4,
      acts: 3,
      chaptersPerAct: 2,
      encounters: 120,
      reveals: 12,
      endings: 56,
      endingMode: 'families',
      artStyles: 3,
      playerUpload: true,
      saveSlots: 3,
      exportSaves: true,
      romances: 4,
    }),
    count: () => studio('ecotone', ['quest']),
  },
  {
    slug: 'crystal-street',
    studio: 'crystal-street',
    title: 'Terrors on Crystal Street',
    cover: '/crystal-street/cover.webp',
    route: '/admin/crystal-street',
    planSource: 'Conductor goal',
    plan: plan('crystal-street', 'Terrors on Crystal Street', {
      genre: 'comedy-horror',
      followers: 20,
      partySize: 10,
      followerExpressions: 5,
      villains: 20,
      villainPerRun: true,
      acts: 2,
      chaptersPerAct: 7,
      encounters: 300,
      outcomeArt: 'both',
      endings: 80,
      shareSeed: true,
    }),
    count: () => studio('crystal-street'),
  },
  {
    slug: 'shifting-desks',
    studio: 'shifting-desks',
    title: 'Shifting Desks',
    cover: '/shifting-desks/front-poster.svg',
    route: '/play/shifting-desks',
    planSource: 'Conductor goal',
    plan: plan('shifting-desks', 'Shifting Desks', {
      genre: 'office-dystopia',
      creator: 'fixed',
      factions: 6,
      villains: 5,
      acts: 5,
      chaptersPerAct: 3,
      encounters: 135,
      meters: 5,
      hiddenLedger: true,
      shareSeed: true,
      endings: 10,
    }),
    count: () => studio('shifting-desks'),
  },
  {
    slug: 'zuzu-shifting-lands',
    studio: 'shifting-lands',
    title: 'Zuzu: Shifting Lands',
    cover: '/shifting-lands/cards/the-map-in-ashes.webp',
    route: '/play/zuzu-shifting-lands',
    planSource: 'Conductor goal',
    plan: plan('zuzu-shifting-lands', 'Zuzu: Shifting Lands', {
      genre: 'fable-journey',
      creator: 'fixed',
      followers: 4,
      villains: 5,
      acts: 5,
      chaptersPerAct: 3,
      encounters: 120,
      endings: 17,
      hiddenLedger: true,
      saveStyle: 'ledger',
    }),
    count: () => studio('shifting-lands'),
  },
  {
    slug: 'zuzu-gamebook',
    studio: 'zuzu-gamebook',
    title: 'Zuzu Gamebook',
    cover: '/zuzu-gamebook/scenes/bell-tower.webp',
    route: '/play/zuzu-gamebook',
    planSource: 'Conductor goal',
    plan: plan('zuzu-gamebook', 'Zuzu Gamebook', {
      genre: 'fable-journey',
      creator: 'fixed',
      villains: 6,
      encounters: 150,
      endings: 8,
    }),
    count: () => studio('zuzu-gamebook'),
  },
]

/** The forge entry for a Playbook Studio game id. */
export function forgeEntryForStudio(
  studioId: string,
): ExistingPlaybook | undefined {
  return EXISTING_PLAYBOOKS.find((entry) => entry.studio === studioId)
}

/** Plan values overlaid with what the code shows is built. */
export function builtBlueprint(
  entry: ExistingPlaybook,
  counts: BuiltCounts,
): Blueprint {
  return { ...entry.plan, ...counts.values }
}

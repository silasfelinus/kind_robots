// CLASH ALLIANCE TOWER: a repeatable twelve-floor run, distinct from the
// five-chapter, one-faction Story campaigns. Pure state, deterministic choices.
import {
  allianceProblems,
  validAllianceDeck,
  type AllianceDeck,
} from './alliance'
import { CARDS, TEAMS, seededHash, type TeamId } from './prototypes'
import { rarityOf } from './progression'

export const TOWER_FLOORS = 12
export type TowerPhase = 'route' | 'battle' | 'failed' | 'complete'
export type TowerHazard = 'snare' | 'riot' | 'rest' | 'vault'
export interface TowerRoute {
  id: string
  title: string
  scene: string
  hazard: TowerHazard
  foe: TeamId
  reward: string
}
export interface TowerRun {
  seed: number
  floor: number
  deck: AllianceDeck
  phase: TowerPhase
  chosen: TowerRoute | null
  scars: number
  guard: number
  relics: string[]
  /** Number of cleared fights, never wallet currency. */
  sparks: number
}
export interface TowerMeta {
  runs: number
  bestFloor: number
  cinders: number
  cards: string[]
}
export interface TowerSave {
  run: TowerRun | null
  meta: TowerMeta
}
export function freshTower(): TowerSave {
  return { run: null, meta: { runs: 0, bestFloor: 0, cinders: 0, cards: [] } }
}

const SCENES: Record<TowerHazard, [string, string, string]> = {
  snare: [
    'THE NEEDLE GATE',
    'A wire net skims the ceiling. The pit announcer asks who packed the bolt cutters.',
    'Rival starts with reinforced boss life',
  ],
  riot: [
    'THE SHATTERED STANDS',
    'Spectators throw fireworks onto a board nobody remembers building.',
    'A louder rival awaits',
  ],
  rest: [
    'THE PATCHWORK CLINIC',
    'The nurse can stabilize the crew, but the debt collectors are coming up the stairs.',
    'Restore some starting boss life',
  ],
  vault: [
    'THE BRASS VAULT',
    'A tempting lockbox sits in the only safe-looking corridor. It is definitely not empty.',
    'Claim a reusable ward after victory',
  ],
}

export function towerRoutes(run: TowerRun): [TowerRoute, TowerRoute] | null {
  if (run.phase !== 'route' || run.floor >= TOWER_FLOORS) return null
  const ids = TEAMS.map((team) => team.id)
  const hazards: TowerHazard[] = ['snare', 'riot', 'rest', 'vault']
  const pick = (index: number): TowerRoute => {
    const roll = seededHash(run.seed, run.floor, 881)
    const firstHazard = (run.floor + (roll % hazards.length)) % hazards.length
    const hazard =
      run.floor === TOWER_FLOORS - 1
        ? 'riot'
        : hazards[(firstHazard + index * (1 + (roll % 2))) % hazards.length]!
    const [title, scene, reward] = SCENES[hazard]
    const foe = ids[(run.floor + (roll % ids.length) + index) % ids.length]!
    return {
      id: String(run.floor) + ':' + index,
      title:
        run.floor === TOWER_FLOORS - 1
          ? 'THE GRAND PIT · ' + foe.toUpperCase()
          : title,
      scene,
      hazard,
      foe,
      reward,
    }
  }
  return [pick(0), pick(1)]
}

/** Tower-only legacy cards never enter the server-owned reward inventory.
 * A new eligible card replaces the last Alliance slot for this run.
 */
export function towerDeckWithLegacy(
  deck: AllianceDeck,
  meta: TowerMeta,
): AllianceDeck {
  const unlocked = [...meta.cards].reverse().find((id) => {
    const card = CARDS.find((entry) => entry.id === id)
    return (
      card &&
      !deck.cards.includes(id) &&
      (card.team === deck.general ||
        card.team === deck.ally ||
        card.team === 'mercenary')
    )
  })
  return unlocked
    ? { ...deck, cards: [...deck.cards.slice(0, -1), unlocked] }
    : { ...deck, cards: [...deck.cards] }
}

export function startTower(
  deck: AllianceDeck,
  seed: number,
  meta: TowerMeta = freshTower().meta,
): TowerRun {
  if (allianceProblems(deck).length)
    throw new Error('Build a legal 30-card Alliance.')
  return {
    seed: seed >>> 0,
    floor: 0,
    deck: towerDeckWithLegacy(deck, meta),
    phase: 'route',
    chosen: null,
    scars: 0,
    guard: Math.min(6, Math.floor(meta.cinders / 12)),
    relics: [],
    sparks: 0,
  }
}

export function chooseTowerRoute(run: TowerRun, id: string): TowerRun {
  const route = towerRoutes(run)?.find((option) => option.id === id)
  return route ? { ...run, phase: 'battle', chosen: route } : run
}

/** Temporary difficulty terms. Neither side's life may escape Clash caps. */
export function towerBosses(run: TowerRun): {
  player: number
  enemy: number
} {
  const hazard = run.chosen?.hazard
  return {
    player: Math.max(
      20,
      Math.min(60, 40 - run.scars + run.guard + (hazard === 'rest' ? 6 : 0)),
    ),
    enemy: Math.max(
      20,
      Math.min(60, 32 + run.floor * 2 + (hazard === 'snare' ? 6 : 0)),
    ),
  }
}

export function resolveTowerBattle(
  run: TowerRun,
  result: 'player' | 'enemy' | 'draw',
): TowerRun {
  if (run.phase !== 'battle' || !run.chosen) return run
  if (result !== 'player') return { ...run, phase: 'failed' }
  const cleared = run.floor + 1
  const relic =
    run.chosen.hazard === 'vault' && !run.relics.includes('BRASS WARD')
      ? ['BRASS WARD']
      : []
  return {
    ...run,
    floor: cleared,
    sparks: run.sparks + 1 + (run.chosen.hazard === 'riot' ? 1 : 0),
    scars:
      run.chosen.hazard === 'snare'
        ? run.scars + 2
        : Math.max(0, run.scars - (run.chosen.hazard === 'rest' ? 2 : 0)),
    guard: Math.min(8, run.guard + (relic.length ? 2 : 0)),
    relics: [...run.relics, ...relic],
    chosen: null,
    phase: cleared >= TOWER_FLOORS ? 'complete' : 'route',
  }
}

/** Post-run cards are unlocks only for the tower, not account pack inventory. */
export function towerSpoils(
  run: TowerRun,
  meta: TowerMeta,
): [(typeof CARDS)[number], (typeof CARDS)[number]] | null {
  if ((run.phase !== 'failed' && run.phase !== 'complete') || run.floor < 1)
    return null
  const available = CARDS.filter(
    (card) =>
      (card.team === run.deck.general ||
        card.team === run.deck.ally ||
        card.team === 'mercenary') &&
      !meta.cards.includes(card.id),
  )
  if (available.length < 2) return null
  const pick = (items: typeof available, salt: number) =>
    items[seededHash(run.seed, run.floor, meta.runs, salt) % items.length]!
  const rare = available.filter((card) => rarityOf(card) === 'rare')
  const first = pick(run.floor >= 4 && rare.length ? rare : available, 41)
  const second = pick(
    available.filter((card) => card.id !== first.id),
    47,
  )
  return [first, second]
}

export function claimTowerSpoil(save: TowerSave, cardId: string): TowerSave {
  const run = save.run
  if (!run || !towerSpoils(run, save.meta)?.some((card) => card.id === cardId))
    return save
  return {
    run: null,
    meta: {
      runs: save.meta.runs + 1,
      bestFloor: Math.max(save.meta.bestFloor, run.floor),
      cinders: save.meta.cinders + run.sparks,
      cards: [...save.meta.cards, cardId],
    },
  }
}

/** Strictly validate story-save snapshots. Tower state must not enter the
 * authenticated wallet, packs, PvP or rewarded CPU transcript ledger.
 */
export function validTowerSave(raw: unknown): raw is TowerSave {
  const record = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === 'object' && !Array.isArray(v)
  const integer = (n: unknown, max: number): n is number =>
    Number.isSafeInteger(n) && typeof n === 'number' && n >= 0 && n <= max
  if (!record(raw) || !record(raw.meta)) return false
  const meta = raw.meta
  if (
    !integer(meta.runs, 1000000) ||
    !integer(meta.bestFloor, TOWER_FLOORS) ||
    !integer(meta.cinders, 1000000) ||
    !Array.isArray(meta.cards) ||
    meta.cards.length > CARDS.length ||
    new Set(meta.cards).size !== meta.cards.length ||
    !meta.cards.every(
      (id: unknown) =>
        typeof id === 'string' && CARDS.some((card) => card.id === id),
    )
  )
    return false
  if (raw.run === null) return true
  if (!record(raw.run)) return false
  const run = raw.run
  if (
    !integer(run.seed, 4294967295) ||
    !integer(run.floor, TOWER_FLOORS) ||
    !validAllianceDeck(run.deck) ||
    !['route', 'battle', 'failed', 'complete'].includes(run.phase as string) ||
    !integer(run.scars, 1000) ||
    !integer(run.guard, 8) ||
    !integer(run.sparks, 1000) ||
    !Array.isArray(run.relics) ||
    run.relics.length > 1 ||
    !run.relics.every((id: unknown) => id === 'BRASS WARD') ||
    (run.phase === 'complete' && run.floor !== TOWER_FLOORS) ||
    (run.phase === 'route' && run.floor >= TOWER_FLOORS)
  )
    return false
  if (run.phase === 'battle') {
    if (!record(run.chosen)) return false
    const routes = towerRoutes({
      ...(run as unknown as TowerRun),
      chosen: null,
      phase: 'route',
    })
    return !!routes?.some(
      (route) => JSON.stringify(route) === JSON.stringify(run.chosen),
    )
  }
  return run.chosen === null
}

/** A floor-zero defeat earns no collectible card. No zero-cost reward farming. */
export function leaveEmptyTower(save: TowerSave): TowerSave {
  if (!save.run || save.run.phase !== 'failed' || save.run.floor !== 0)
    return save
  return {
    run: null,
    meta: { ...save.meta, runs: save.meta.runs + 1 },
  }
}

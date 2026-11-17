import {
  DEPTHS_PER_LAYER,
  ENDING_TEXT,
  ENEMIES,
  EVENTS,
  LAYERS,
  LOOT_TABLE,
  RIDDLES,
  event,
  item,
} from './dungeon'
import { COURT_CHOICE_KEYS, COURT_DEITIES, courtDeity } from './court'
import type { CourtChoiceKey } from './court'
import {
  activeSupports,
  activeSynergies,
  canRomance,
  hasSynergyEffect,
  startingPartners,
} from './party'
import { ROLES, character, pairKey, shortName, supportFor } from './roster'
import type {
  CombatState,
  Effects,
  EndingId,
  Enemy,
  EventOption,
  HeroSetup,
  Notice,
  PartyMember,
  PuzzleKind,
  Room,
  RoomKind,
  RunState,
  StatKey,
  Stats,
} from './types'

// The run engine. Every function mutates the run it is given and draws all of
// its chance from the run's own seeded generator, so a run replays exactly
// from its seed and a save slot is just the run object.

export const HOARD_GOLD = 300

const STAT_KEYS: StatKey[] = ['hp', 'atk', 'def', 'mag', 'spd', 'wit']

export const zeroStats = (): Stats => ({
  hp: 0,
  atk: 0,
  def: 0,
  mag: 0,
  spd: 0,
  wit: 0,
})

export function nextRandom(run: RunState): number {
  let t = (run.rng = (run.rng + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function pick<T>(run: RunState, list: readonly T[]): T {
  return list[Math.floor(nextRandom(run) * list.length)]!
}

function shuffle<T>(run: RunState, list: readonly T[]): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(run) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

export function partyIds(run: RunState): string[] {
  return [run.hero.presetId, ...run.companions]
}

export function heroName(run: RunState): string {
  return run.hero.name.trim() || shortName(character(run.hero.presetId))
}

export function nameOf(run: RunState, id: string): string {
  return id === run.hero.presetId ? heroName(run) : shortName(character(id))
}

function note(run: RunState, tone: Notice['tone'], text: string) {
  run.notices.push({ tone, text })
  run.log.push(text)
  if (run.log.length > 60) run.log.splice(0, run.log.length - 60)
}

function addMoment(run: RunState, id: string) {
  if (!run.moments.includes(id)) run.moments.push(id)
}

function addReveal(run: RunState, id: string) {
  if (!run.reveals.includes(id)) run.reveals.push(id)
}

export const SUPPORT_MOMENTS: Record<string, string> = {
  [pairKey('rook', 'wren')]: 'halloran-twins',
  [pairKey('idris', 'corso')]: 'old-flame',
  [pairKey('quillon', 'ambrose')]: 'forty-years',
  [pairKey('grell', 'pip')]: 'sworn-kin',
  [pairKey('brannoc', 'torvald')]: 'stoneharrow',
  [pairKey('ragna', 'dagny')]: 'ironsong-fell',
  [pairKey('gloam', 'hesper')]: 'moth-court',
  [pairKey('idris', 'hesk')]: 'old-rite',
  [pairKey('moss', 'badger')]: 'hedge-kin',
  [pairKey('lio', 'ash')]: 'seven-winds',
  [pairKey('gizelle', 'nettle')]: 'gearheads',
  [pairKey('mortimer', 'crell')]: 'graveside',
}

export function romanceMoment(id: string): string {
  return id === 'brannoc' || id === 'thessaly'
    ? 'romance-hearth'
    : `romance-${id}`
}

// ── Stats ────────────────────────────────────────────────────────────────

export function baseStat(id: string, key: StatKey, hero?: HeroSetup): number {
  const c = character(id)
  const step = key === 'hp' ? 10 : 3
  let value = ROLES[c.role].base[key]
  if (c.edge === key) value += step
  if (hero && hero.presetId === id && hero.boon === key) value += step
  return value
}

export function stat(run: RunState, id: string, key: StatKey): number {
  const member = run.party.find((m) => m.id === id)
  const flat =
    baseStat(id, key, run.hero) +
    (member?.item ? (item(member.item).bonus[key] ?? 0) : 0) +
    (run.boons[key] ?? 0)
  const ids = partyIds(run)
  let mult = 1 + run.deepening * 0.12
  for (const s of activeSynergies(ids)) mult += s.mult[key] ?? 0
  for (const s of activeSupports(ids))
    if (s.a === id || s.b === id)
      mult += (s.bonus[key] ?? 0) * (1 + (run.bonds[pairKey(s.a, s.b)] ?? 0))
  const hearted =
    run.partners.includes(id) ||
    run.oaths.includes(id) ||
    (id === run.hero.presetId &&
      (run.partners.length > 0 || run.oaths.length > 0))
  if (hearted) mult += 0.1
  return Math.max(1, Math.round(flat * mult))
}

export function maxHp(run: RunState, id: string): number {
  return stat(run, id, 'hp')
}

export function alive(run: RunState): PartyMember[] {
  return run.party.filter((m) => !m.down)
}

// ── Starting a run ───────────────────────────────────────────────────────

export function createRun(
  hero: HeroSetup,
  companions: string[],
  seed: number,
): RunState {
  const run: RunState = {
    version: 1,
    seed,
    rng: seed | 0,
    hero: { ...hero, drawnTo: [...hero.drawnTo] },
    companions: [...companions],
    party: [],
    affinity: Object.fromEntries(companions.map((id) => [id, 2])),
    partners: startingPartners(hero, companions),
    oaths: [],
    bonds: {},
    boons: zeroStats(),
    flags: {},
    gold: 20,
    potions: 2,
    layer: 0,
    depth: 0,
    rooms: [],
    phase: 'map',
    room: null,
    combat: null,
    puzzle: null,
    treasure: null,
    camp: null,
    loot: null,
    seenEvents: [],
    notices: [],
    log: [],
    moments: [],
    reveals: [],
    ending: null,
    deepening: 0,
    mercy: 0,
    turns: 0,
    fights: 0,
    puzzlesSolved: 0,
    puzzlesFailed: 0,
    chests: 0,
    mimics: 0,
    choices: [],
    riddlesUsed: [],
    cleanLayer: true,
    cleanLayers: 0,
    peakGold: 20,
  }
  for (const id of companions)
    if (run.partners.includes(id)) run.affinity[id] = 10
  run.party = partyIds(run).map((id) => ({
    id,
    hp: 0,
    cooldown: 0,
    down: false,
    poison: 0,
    item: null,
  }))
  for (const m of run.party) m.hp = maxHp(run, m.id)
  if (companions.length === 3) addMoment(run, 'full-party')
  if (companions.length === 1) addMoment(run, 'duo')
  enterLayer(run)
  return run
}

function scoutChance(run: RunState): number {
  const ids = partyIds(run)
  if (hasSynergyEffect(ids, 'scoutAll') || run.flags.revealNext) return 1
  let chance = 0.35
  if (ids.some((id) => character(id).role === 'ranger')) chance += 0.35
  if (hasSynergyEffect(ids, 'scoutHalf')) chance += 0.15
  return chance
}

const KIND_WEIGHTS: [RoomKind, number][] = [
  ['fight', 34],
  ['puzzle', 18],
  ['treasure', 16],
  ['choice', 20],
  ['camp', 12],
]

function rollKind(run: RunState, depth: number): RoomKind {
  const weights = KIND_WEIGHTS.filter(([k]) => !(depth === 0 && k === 'camp'))
  const total = weights.reduce((s, [, w]) => s + w, 0)
  let roll = nextRandom(run) * total
  for (const [kind, w] of weights) {
    roll -= w
    if (roll < 0) return kind
  }
  return 'fight'
}

export function generateRooms(run: RunState): Room[][] {
  const chance = scoutChance(run)
  const pool = shuffle(
    run,
    EVENTS.filter(
      (e) => e.layer === run.layer && !run.seenEvents.includes(e.id),
    ).map((e) => e.id),
  )
  const rooms: Room[][] = []
  for (let depth = 0; depth < DEPTHS_PER_LAYER - 1; depth++) {
    const doors = depth === 0 ? 2 : nextRandom(run) < 0.45 ? 3 : 2
    const row: RoomKind[] = []
    for (let d = 0; d < doors; d++) row.push(rollKind(run, depth))
    if (depth === 0 && !row.includes('fight')) row[0] = 'fight'
    if ((depth === 2 || depth === 4) && !row.includes('choice'))
      row[row.length - 1] = 'choice'
    if (depth === 5 && !row.includes('camp')) row[0] = 'camp'
    rooms.push(
      row.map((kind) => ({
        kind,
        known: nextRandom(run) < chance,
        ...(kind === 'choice'
          ? {
              event:
                pool.shift() ??
                pick(
                  run,
                  EVENTS.filter((e) => e.layer === run.layer),
                ).id,
            }
          : {}),
      })),
    )
  }
  rooms.push([{ kind: 'boss', known: true }])
  return rooms
}

function enterLayer(run: RunState) {
  run.depth = 0
  run.rooms = generateRooms(run)
  run.flags.revealNext = false
  run.cleanLayer = true
  run.phase = 'map'
  run.room = null
  const layer = LAYERS[run.layer]!
  addMoment(run, layer.moment)
  note(run, 'info', `${layer.name}. ${layer.blurb}`)
}

export function doors(run: RunState): Room[] {
  return run.rooms[run.depth] ?? []
}

// ── Choosing a door ──────────────────────────────────────────────────────

export function chooseDoor(run: RunState, index: number) {
  if (run.phase !== 'map') return
  const room = doors(run)[index]
  if (!room) return
  run.notices = []
  run.room = { ...room, known: true }
  run.turns += 1
  if (room.kind === 'fight') startFight(run, rollEncounter(run))
  else if (room.kind === 'boss') startBoss(run)
  else if (room.kind === 'puzzle') startPuzzle(run)
  else if (room.kind === 'treasure') startTreasure(run)
  else if (room.kind === 'choice') startChoice(run, room.event ?? EVENTS[0]!.id)
  else startCamp(run)
}

function rollEncounter(run: RunState): string[] {
  const layer = LAYERS[run.layer]!
  const size = Math.min(
    4,
    Math.max(
      1,
      run.party.length -
        1 +
        (nextRandom(run) < 0.5 ? 1 : 0) +
        (run.depth >= 4 ? 1 : 0),
    ),
  )
  return Array.from({ length: size }, () => pick(run, layer.enemies))
}

// ── Combat ───────────────────────────────────────────────────────────────

function makeEnemy(
  run: RunState,
  id: string,
  index: number,
  boss: boolean,
): Enemy {
  const def = ENEMIES[id]!
  const size = run.party.length
  let hp = def.hp
  let defence = def.def
  if (boss) hp = Math.round(hp * (0.45 + 0.17 * size))
  if (id === 'brine' && run.flags.brinesecret) {
    hp = Math.round(hp * 0.8)
    defence = Math.round(defence / 2)
  }
  return {
    uid: `${id}-${index}`,
    id,
    name: def.name,
    hp,
    max: hp,
    atk: def.atk,
    def: defence,
    trait: def.trait,
    boss,
    weak: 0,
    exposed: 0,
    poison: 0,
  }
}

export function startFight(
  run: RunState,
  ids: string[],
  opts: { boss?: boolean; mimic?: boolean } = {},
) {
  const combat: CombatState = {
    enemies: ids.map((id, i) => makeEnemy(run, id, i, !!opts.boss)),
    round: 1,
    actor: 0,
    shield: 0,
    anthem: 0,
    taunt: null,
    turret: 0,
    defending: [],
    boss: !!opts.boss,
    mimic: !!opts.mimic,
  }
  if (hasSynergyEffect(partyIds(run), 'venom'))
    for (const e of combat.enemies) e.poison = 3
  run.combat = combat
  run.phase = 'fight'
  for (const m of run.party) m.cooldown = 0
  combat.actor = firstActor(run, 0)
  if (!run.moments.includes('first-fight')) addMoment(run, 'first-fight')
  note(
    run,
    'bad',
    `${combat.enemies.map((e) => e.name).join(', ')} ${combat.enemies.length > 1 ? 'attack' : 'attacks'}!`,
  )
}

function startBoss(run: RunState) {
  const layer = LAYERS[run.layer]!
  startFight(run, [layer.boss], { boss: true })
  if (run.layer === 2) addReveal(run, layer.bossReveal)
}

function firstActor(run: RunState, from: number): number {
  for (let i = from; i < run.party.length; i++)
    if (!run.party[i]!.down) return i
  return -1
}

export function currentActor(run: RunState): PartyMember | null {
  if (run.phase !== 'fight' || !run.combat) return null
  return run.party[run.combat.actor] ?? null
}

function livingEnemies(run: RunState): Enemy[] {
  return run.combat?.enemies.filter((e) => e.hp > 0) ?? []
}

function hitEnemy(
  run: RunState,
  by: string,
  target: Enemy,
  power: number,
  label = '',
) {
  const combat = run.combat!
  let dmg = power * (0.9 + nextRandom(run) * 0.2)
  if (combat.anthem > 0) dmg *= 1.3
  const def = target.exposed > 0 ? target.def * 0.5 : target.def
  dmg *= 30 / (30 + def * 2.5)
  if (target.exposed > 0) dmg *= 1.15
  const crit = nextRandom(run) < stat(run, by, 'spd') / 100
  if (crit) dmg *= 1.5
  const dealt = Math.max(1, Math.round(dmg))
  target.hp = Math.max(0, target.hp - dealt)
  note(
    run,
    'good',
    `${nameOf(run, by)}${label ? ` (${label})` : ''} hits ${target.name} for ${dealt}${crit ? ', a critical hit' : ''}${target.hp === 0 ? `. ${target.name} falls.` : '.'}`,
  )
  return dealt
}

function heal(run: RunState, member: PartyMember, amount: number) {
  if (member.down) return 0
  const max = maxHp(run, member.id)
  const before = member.hp
  member.hp = Math.min(max, member.hp + Math.round(amount))
  return member.hp - before
}

export type CombatAction =
  | { kind: 'attack'; target: string }
  | { kind: 'skill'; target?: string }
  | { kind: 'defend' }
  | { kind: 'potion'; target: string }

function targetOf(run: RunState, uid?: string): Enemy | null {
  const living = livingEnemies(run)
  return living.find((e) => e.uid === uid) ?? living[0] ?? null
}

export function skillReady(member: PartyMember): boolean {
  return member.cooldown === 0
}

export function act(run: RunState, action: CombatAction) {
  const combat = run.combat
  const member = currentActor(run)
  if (!combat || !member) return
  run.notices = []
  const id = member.id
  const role = character(id).role
  const atk = stat(run, id, 'atk')
  const mag = stat(run, id, 'mag')
  const living = livingEnemies(run)

  if (action.kind === 'attack') {
    const target = targetOf(run, action.target)
    if (target) hitEnemy(run, id, target, Math.max(atk, mag * 0.8))
  } else if (action.kind === 'defend') {
    combat.defending.push(id)
    note(run, 'info', `${nameOf(run, id)} braces.`)
  } else if (action.kind === 'potion') {
    const who = run.party.find((m) => m.id === action.target && !m.down)
    if (run.potions > 0 && who) {
      run.potions -= 1
      const alchemy = partyIds(run).some(
        (p) => character(p).role === 'alchemist',
      )
      const healed = heal(run, who, maxHp(run, who.id) * (alchemy ? 0.8 : 0.5))
      who.poison = 0
      note(
        run,
        'good',
        `${nameOf(run, who.id)} drinks a potion and recovers ${healed}.`,
      )
    }
  } else if (action.kind === 'skill' && member.cooldown === 0) {
    const skill = ROLES[role].skill
    member.cooldown = skill.cooldown + 1
    const target = targetOf(run, action.target)
    switch (role) {
      case 'guardian':
        combat.shield = 2
        combat.taunt = id
        note(run, 'info', `${nameOf(run, id)} raises a Shield Wall.`)
        break
      case 'paladin':
        if (target) hitEnemy(run, id, target, atk * 1.6, skill.name)
        heal(run, member, maxHp(run, id) * 0.2)
        break
      case 'cleric':
        for (const m of alive(run)) {
          heal(run, m, maxHp(run, m.id) * 0.22 + mag * 0.8)
          m.poison = 0
        }
        note(run, 'good', `${nameOf(run, id)} casts Mend over the party.`)
        break
      case 'druid': {
        for (const e of living) hitEnemy(run, id, e, mag * 0.6, skill.name)
        const low = [...alive(run)].sort(
          (x, y) => x.hp / maxHp(run, x.id) - y.hp / maxHp(run, y.id),
        )[0]
        if (low) heal(run, low, maxHp(run, low.id) * 0.2 + mag)
        break
      }
      case 'warrior':
        for (const e of living) hitEnemy(run, id, e, atk, skill.name)
        break
      case 'monk':
        for (let i = 0; i < 3; i++) {
          const e = livingEnemies(run)
          if (e.length) hitEnemy(run, id, pick(run, e), atk * 0.6, skill.name)
        }
        break
      case 'rogue':
        if (target) hitEnemy(run, id, target, atk * 2.3, skill.name)
        break
      case 'ranger':
        for (const e of living) hitEnemy(run, id, e, atk * 0.8, skill.name)
        break
      case 'mage':
        for (const e of living) hitEnemy(run, id, e, mag * 1.3, skill.name)
        break
      case 'warlock':
        if (target)
          heal(
            run,
            member,
            hitEnemy(run, id, target, mag * 1.7, skill.name) / 2,
          )
        break
      case 'necromancer': {
        for (const e of living) e.weak = 2
        const strongest = [...living].sort((x, y) => y.hp - x.hp)[0]
        if (strongest) hitEnemy(run, id, strongest, mag, skill.name)
        break
      }
      case 'bard':
        combat.anthem = hasSynergyEffect(partyIds(run), 'longAnthem') ? 3 : 2
        note(run, 'info', `${nameOf(run, id)} strikes up an Anthem.`)
        break
      case 'alchemist':
        for (const e of living) {
          hitEnemy(run, id, e, Math.max(atk, mag) * 0.8, skill.name)
          e.poison = Math.max(e.poison, 2)
        }
        break
      case 'scholar':
        for (const e of living) e.exposed = 2
        note(run, 'info', `${nameOf(run, id)} finds every weak point.`)
        break
      case 'artificer':
        combat.turret = 3
        note(run, 'info', `${nameOf(run, id)} sets a Clockwork Turret.`)
        break
    }
  } else return

  if (checkCombatEnd(run)) return
  const next = firstActor(run, combat.actor + 1)
  if (next >= 0) combat.actor = next
  else enemyPhase(run)
}

function enemyPhase(run: RunState) {
  const combat = run.combat!
  if (combat.turret > 0) {
    const artificer = run.party.find(
      (m) => character(m.id).role === 'artificer',
    )
    const e = livingEnemies(run)
    if (artificer && e.length)
      hitEnemy(
        run,
        artificer.id,
        pick(run, e),
        stat(run, artificer.id, 'mag') * 0.7,
        'turret',
      )
    combat.turret -= 1
  }
  for (const e of livingEnemies(run))
    if (e.poison > 0) {
      const dmg = Math.max(1, Math.round(e.max * 0.06))
      e.hp = Math.max(0, e.hp - dmg)
      e.poison -= 1
      note(run, 'good', `Poison eats at ${e.name} for ${dmg}.`)
    }
  if (checkCombatEnd(run)) return

  for (const enemy of livingEnemies(run)) {
    const targets = alive(run)
    if (!targets.length) break
    let atk = enemy.atk * (enemy.weak > 0 ? 0.7 : 1)
    if (enemy.id === 'king' && enemy.hp < enemy.max / 2) atk *= 1.2
    const aoe =
      enemy.trait === 'aoe' && nextRandom(run) < (enemy.boss ? 0.4 : 0.35)
    if (aoe) {
      note(run, 'bad', `${enemy.name} strikes the whole party!`)
      for (const t of targets) hitMember(run, enemy, t, atk * 0.6)
    } else {
      const taunted = targets.find((t) => t.id === combat.taunt)
      const weighted = targets.flatMap((t) =>
        ROLES[character(t.id).role].archetype === 'tank' ? [t, t] : [t],
      )
      const target =
        taunted && nextRandom(run) < 0.75 ? taunted : pick(run, weighted)
      let power = atk
      if (enemy.trait === 'crit' && nextRandom(run) < 0.25) {
        power *= 1.6
        note(run, 'bad', `${enemy.name} lands a vicious blow!`)
      }
      const dealt = hitMember(run, enemy, target, power)
      if (enemy.trait === 'drain' && dealt > 0)
        enemy.hp = Math.min(enemy.max, enemy.hp + Math.round(dealt / 2))
      if (enemy.trait === 'poison' && dealt > 0) target.poison = 3
      if (enemy.trait === 'weaken' && dealt > 0) target.cooldown += 1
    }
  }

  for (const m of alive(run))
    if (m.poison > 0) {
      const dmg = Math.max(1, Math.round(maxHp(run, m.id) * 0.05))
      m.hp = Math.max(0, m.hp - dmg)
      m.poison -= 1
      if (m.hp === 0) knockOut(run, m)
    }

  for (const e of combat.enemies) {
    if (e.weak > 0) e.weak -= 1
    if (e.exposed > 0) e.exposed -= 1
  }
  for (const m of run.party) if (m.cooldown > 0) m.cooldown -= 1
  if (combat.shield > 0) combat.shield -= 1
  if (combat.shield === 0) combat.taunt = null
  if (combat.anthem > 0) combat.anthem -= 1
  combat.defending = []
  combat.round += 1
  if (checkCombatEnd(run)) return
  combat.actor = firstActor(run, 0)
}

function hitMember(
  run: RunState,
  enemy: Enemy,
  target: PartyMember,
  power: number,
): number {
  const combat = run.combat!
  if (nextRandom(run) < stat(run, target.id, 'spd') * 0.008) {
    note(run, 'info', `${nameOf(run, target.id)} dodges ${enemy.name}.`)
    return 0
  }
  let dmg = power * (0.9 + nextRandom(run) * 0.2)
  dmg *= 30 / (30 + stat(run, target.id, 'def') * 2.5)
  if (combat.shield > 0) dmg *= 0.5
  if (combat.defending.includes(target.id)) dmg *= 0.5
  const dealt = Math.max(1, Math.round(dmg))
  target.hp = Math.max(0, target.hp - dealt)
  note(run, 'bad', `${enemy.name} hits ${nameOf(run, target.id)} for ${dealt}.`)
  if (target.hp === 0) knockOut(run, target)
  return dealt
}

function knockOut(run: RunState, member: PartyMember) {
  member.down = true
  member.poison = 0
  run.cleanLayer = false
  note(run, 'bad', `${nameOf(run, member.id)} falls!`)
}

function checkCombatEnd(run: RunState): boolean {
  const combat = run.combat!
  if (!alive(run).length) {
    run.combat = null
    endRun(run, 'fallen')
    return true
  }
  if (livingEnemies(run).length) return false
  run.fights += 1
  const layer = LAYERS[run.layer]!
  const hunters = hasSynergyEffect(partyIds(run), 'gold')
  const spoils = Math.round(
    (combat.enemies.reduce((s, e) => s + e.max, 0) / (combat.boss ? 5 : 12)) *
      (hunters ? 1.5 : 1) *
      (combat.mimic ? 2 : 1),
  )
  gainGold(run, spoils)
  note(run, 'good', `Victory! ${spoils} gold.`)
  if (combat.mimic) {
    run.mimics += 1
    addMoment(run, 'mimic')
  }
  run.combat = null
  for (const m of run.party) m.cooldown = 0
  if (combat.boss) {
    run.deepening += 1
    addMoment(run, layer.bossMoment)
    addReveal(run, layer.bossReveal)
    for (const m of run.party)
      if (m.down) {
        m.down = false
        m.hp = Math.round(maxHp(run, m.id) * 0.3)
      }
    run.loot = pick(run, LOOT_TABLE[Math.min(2, run.layer)]!)
  } else if (nextRandom(run) < (combat.mimic ? 1 : 0.3)) {
    run.loot = pick(run, LOOT_TABLE[run.layer]!)
  }
  finishRoom(run)
  return true
}

/** A voluntary nonviolent escape from an ordinary encounter.
 * Failure costs health, and the one attempt is recorded in the run save.
 * Bosses still demand their authored resolution.
 */
export function attemptParley(run: RunState) {
  const combat = run.combat
  if (run.phase !== 'fight' || !combat || combat.parleyTried || combat.boss)
    return
  combat.parleyTried = true
  const dc = 12 + run.layer * 2 + Math.max(0, combat.enemies.length - 1) * 2
  const roll = rollAbilityCheck(run, 'wit', dc)
  if (roll.success) {
    run.mercy += 1
    run.flags.parley = true
    note(
      run,
      'good',
      `d20 ${roll.die} + ${roll.modifier} = ${roll.total} vs ${dc}. You settle the dispute and leave the passage peacefully.`,
    )
    run.combat = null
    finishRoom(run)
  } else {
    hurtAll(run, 0.08)
    note(
      run,
      'bad',
      `d20 ${roll.die} + ${roll.modifier} = ${roll.total} vs ${dc}. Your appeal is rejected. The crowd presses closer.`,
    )
  }
}

/** A sensible move for the current actor: what Auto plays and what the tests use. */
export function autoAction(run: RunState): CombatAction {
  const member = currentActor(run)!
  const role = character(member.id).role
  const living = livingEnemies(run)
  const weakest = [...living].sort((a, b) => a.hp - b.hp)[0]!
  const hurt = alive(run).filter((m) => m.hp < maxHp(run, m.id) * 0.4)
  const dying = alive(run).find((m) => m.hp < maxHp(run, m.id) * 0.22)
  if (member.cooldown === 0) {
    if ((role === 'cleric' || role === 'druid') && hurt.length)
      return { kind: 'skill' }
    if (
      role === 'guardian' &&
      (living.length > 1 || living.some((e) => e.boss))
    )
      return { kind: 'skill' }
    if (
      ['warrior', 'ranger', 'mage', 'alchemist'].includes(role) &&
      living.length > 1
    )
      return { kind: 'skill' }
    if (
      [
        'paladin',
        'rogue',
        'warlock',
        'monk',
        'necromancer',
        'scholar',
        'bard',
        'artificer',
      ].includes(role)
    )
      return { kind: 'skill', target: weakest.uid }
    if (living.some((e) => e.boss))
      return { kind: 'skill', target: weakest.uid }
  }
  if (dying && run.potions > 0) return { kind: 'potion', target: dying.id }
  return { kind: 'attack', target: weakest.uid }
}

// ── Rewards and leaving a room ──────────────────────────────────────────

function gainGold(run: RunState, amount: number) {
  run.gold = Math.max(0, run.gold + amount)
  run.peakGold = Math.max(run.peakGold, run.gold)
  if (run.gold >= HOARD_GOLD) addMoment(run, 'treasure-hoard')
}

function finishRoom(run: RunState) {
  run.puzzle = null
  run.treasure = null
  run.camp = null
  if (run.ending) return
  if (run.loot) {
    run.phase = 'loot'
    return
  }
  proceed(run)
}

function proceed(run: RunState) {
  const wasBoss = run.room?.kind === 'boss'
  run.room = null
  if (!wasBoss) {
    run.depth += 1
    run.phase = 'map'
    return
  }
  if (run.cleanLayer) run.cleanLayers += 1
  if (run.layer === LAYERS.length - 1) {
    run.phase = 'finale'
    return
  }
  run.layer += 1
  enterLayer(run)
}

export function equipLoot(run: RunState, memberId: string | null) {
  if (run.phase !== 'loot' || !run.loot) return
  const loot = item(run.loot)
  const member = memberId ? run.party.find((m) => m.id === memberId) : null
  if (member) {
    if (member.item) gainGold(run, 15)
    const before = maxHp(run, member.id)
    member.item = loot.id
    const after = maxHp(run, member.id)
    if (after > before && !member.down) member.hp += after - before
    member.hp = Math.min(member.hp, maxHp(run, member.id))
    note(run, 'good', `${nameOf(run, member.id)} takes the ${loot.name}.`)
  } else {
    gainGold(run, 12 * (loot.layer + 1))
    note(run, 'info', `You sell the ${loot.name}.`)
  }
  run.loot = null
  proceed(run)
}

// ── Puzzles ──────────────────────────────────────────────────────────────

const RUNE_NEIGHBOURS = (i: number) =>
  [i, i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 !== 2 ? i + 1 : -1].filter(
    (n) => n >= 0 && n < 9,
  )

function toggleRunes(lit: boolean[], i: number) {
  for (const n of RUNE_NEIGHBOURS(i)) lit[n] = !lit[n]
}

/** The fewest presses that light every rune (3x3 Lights Out always has one). */
export function runeSolution(lit: readonly boolean[]): number[] {
  let best: number[] | null = null
  for (let mask = 0; mask < 512; mask++) {
    const board = [...lit]
    const presses: number[] = []
    for (let i = 0; i < 9; i++)
      if (mask & (1 << i)) {
        toggleRunes(board, i)
        presses.push(i)
      }
    if (board.every(Boolean) && (!best || presses.length < best.length))
      best = presses
  }
  return best ?? []
}

export function puzzleHintAvailable(run: RunState): boolean {
  const ids = partyIds(run)
  if (hasSynergyEffect(ids, 'puzzleHint')) return true
  if (ids.some((id) => character(id).role === 'scholar')) return true
  const wits = alive(run).reduce((s, m) => s + stat(run, m.id, 'wit'), 0)
  return wits >= 24 + run.layer * 8
}

function startPuzzle(run: RunState) {
  const kinds: PuzzleKind[] = ['riddle', 'runes', 'sequence', 'scales']
  const kind = pick(run, kinds)
  const hint = puzzleHintAvailable(run)
  run.phase = 'puzzle'
  if (kind === 'riddle') {
    const unused = RIDDLES.filter((r) => !run.riddlesUsed.includes(r.id))
    const riddle = pick(run, unused.length ? unused : RIDDLES)
    run.riddlesUsed.push(riddle.id)
    const options = shuffle(run, [riddle.answer, ...riddle.wrong])
    const removed = hint
      ? (riddle.wrong.find((w) => options.includes(w)) ?? null)
      : null
    run.puzzle = { kind, hint, riddle: { id: riddle.id, options, removed } }
  } else if (kind === 'runes') {
    const lit = Array(9).fill(true) as boolean[]
    const presses = 3 + run.layer
    for (let i = 0; i < presses; i++)
      toggleRunes(lit, Math.floor(nextRandom(run) * 9))
    if (lit.every(Boolean)) toggleRunes(lit, 4)
    run.puzzle = {
      kind,
      hint,
      runes: { lit, moves: 0, limit: 8 + run.layer * 2 },
    }
  } else if (kind === 'sequence') {
    const glyphs = Array.from({ length: 4 + run.layer }, () =>
      Math.floor(nextRandom(run) * 6),
    )
    run.puzzle = {
      kind,
      hint,
      sequence: { glyphs, entered: [], shows: hint ? 2 : 1 },
    }
  } else {
    const weights = Array.from(
      { length: 6 },
      () => 1 + Math.floor(nextRandom(run) * 9),
    )
    const chosen = shuffle(run, [0, 1, 2, 3, 4, 5]).slice(0, 3)
    const target = chosen.reduce((s, i) => s + weights[i]!, 0)
    run.puzzle = {
      kind,
      hint,
      scales: { weights, target, picked: [], hinted: hint ? chosen[0]! : null },
    }
  }
  note(run, 'info', 'A sealed door, and a puzzle carved into it.')
}

export const RIDDLE_BY_ID = new Map(RIDDLES.map((r) => [r.id, r]))

export function answerRiddle(run: RunState, answer: string) {
  const p = run.puzzle
  if (run.phase !== 'puzzle' || !p?.riddle) return
  solvePuzzle(run, RIDDLE_BY_ID.get(p.riddle.id)!.answer === answer)
}

export function pressRune(run: RunState, index: number) {
  const runes = run.puzzle?.runes
  if (run.phase !== 'puzzle' || !runes) return
  toggleRunes(runes.lit, index)
  runes.moves += 1
  if (runes.lit.every(Boolean)) solvePuzzle(run, true)
  else if (runes.moves >= runes.limit) solvePuzzle(run, false)
}

export function useSequenceShow(run: RunState) {
  const seq = run.puzzle?.sequence
  if (seq && seq.shows > 0) seq.shows -= 1
}

export function pressGlyph(run: RunState, glyph: number) {
  const seq = run.puzzle?.sequence
  if (run.phase !== 'puzzle' || !seq) return
  const expected = seq.glyphs[seq.entered.length]
  seq.entered.push(glyph)
  if (glyph !== expected) solvePuzzle(run, false)
  else if (seq.entered.length === seq.glyphs.length) solvePuzzle(run, true)
}

export function toggleWeight(run: RunState, index: number) {
  const scales = run.puzzle?.scales
  if (run.phase !== 'puzzle' || !scales) return
  scales.picked = scales.picked.includes(index)
    ? scales.picked.filter((i) => i !== index)
    : [...scales.picked, index]
}

export function weighScales(run: RunState) {
  const scales = run.puzzle?.scales
  if (run.phase !== 'puzzle' || !scales) return
  const sum = scales.picked.reduce((s, i) => s + scales.weights[i]!, 0)
  solvePuzzle(run, sum === scales.target)
}

export function leavePuzzle(run: RunState) {
  if (run.phase !== 'puzzle') return
  note(run, 'info', 'You leave the sealed door sealed.')
  finishRoom(run)
}

function solvePuzzle(run: RunState, solved: boolean) {
  if (solved) {
    run.puzzlesSolved += 1
    addMoment(run, 'puzzle-solved')
    const gold = 15 * (run.layer + 1)
    gainGold(run, gold)
    note(run, 'good', `The seal breaks. ${gold} gold inside.`)
    if (nextRandom(run) < 0.35) run.loot = pick(run, LOOT_TABLE[run.layer]!)
  } else {
    run.puzzlesFailed += 1
    note(run, 'bad', 'Wrong! The trap fires.')
    hurtAll(run, 0.15)
  }
  finishRoom(run)
}

function hurtAll(run: RunState, fraction: number) {
  for (const m of alive(run))
    m.hp = Math.max(1, m.hp - Math.round(maxHp(run, m.id) * fraction))
}

function healAll(run: RunState, fraction: number) {
  for (const m of alive(run)) heal(run, m, maxHp(run, m.id) * fraction)
}

// ── Treasure ─────────────────────────────────────────────────────────────

function startTreasure(run: RunState) {
  const ids = partyIds(run)
  const sensed =
    ids.some((id) => ['rogue', 'artificer'].includes(character(id).role)) ||
    hasSynergyEffect(ids, 'trapSense')
  const roll = nextRandom(run)
  run.treasure = {
    mimic: roll < 0.18,
    trap: roll >= 0.18 && roll < 0.4,
    sensed,
  }
  run.phase = 'treasure'
  run.chests += 1
  note(run, 'info', 'A treasure chest, bound in iron.')
}

export type TreasureChoice = 'open' | 'disarm' | 'fight' | 'leave'

export function treasureChoices(run: RunState): TreasureChoice[] {
  const t = run.treasure
  if (!t) return []
  if (!t.sensed) return ['open', 'leave']
  if (t.mimic) return ['fight', 'leave']
  if (t.trap) return ['disarm', 'leave']
  return ['open', 'leave']
}

export function openTreasure(run: RunState, choice: TreasureChoice) {
  const t = run.treasure
  if (run.phase !== 'treasure' || !t) return
  if (choice === 'leave') {
    note(run, 'info', 'You leave the chest where it sits.')
    finishRoom(run)
    return
  }
  if (t.mimic) {
    run.treasure = null
    note(
      run,
      'bad',
      choice === 'fight' ? 'You kick the mimic awake.' : 'The chest has teeth!',
    )
    startFight(run, ['mimic'], { mimic: true })
    return
  }
  if (t.trap && choice !== 'disarm') {
    note(run, 'bad', 'A needle trap fires!')
    hurtAll(run, 0.12)
  } else if (t.trap) note(run, 'good', 'The trap clicks harmlessly.')
  const hunters = hasSynergyEffect(partyIds(run), 'gold')
  const gold = Math.round(
    20 * (run.layer + 1) * (hunters ? 1.5 : 1) * (0.8 + nextRandom(run) * 0.4),
  )
  gainGold(run, gold)
  note(run, 'good', `${gold} gold inside.`)
  if (nextRandom(run) < 0.4) run.loot = pick(run, LOOT_TABLE[run.layer]!)
  else if (nextRandom(run) < 0.5) {
    run.potions += 1
    note(run, 'good', 'And a healing potion.')
  }
  finishRoom(run)
}

// ── Choice rooms ─────────────────────────────────────────────────────────

function startChoice(run: RunState, id: string) {
  const ev = event(id)
  if (id.startsWith('fairy-')) run.flags[`court-met-${id.slice(6)}`] = true
  run.phase = 'choice'
  if (!run.seenEvents.includes(id)) run.seenEvents.push(id)
  if (ev.moment) addMoment(run, ev.moment)
  if (ev.reveal) addReveal(run, ev.reveal)
}

export function currentEvent(run: RunState) {
  return run.room?.event ? event(run.room.event) : null
}

export function optionLock(run: RunState, option: EventOption): string | null {
  const r = option.requires
  if (!r) return null
  const ids = partyIds(run)
  if (r.role && !ids.some((id) => r.role!.includes(character(id).role)))
    return `Needs a ${r.role.map((x) => ROLES[x].label).join(' or ')}`
  if (r.synergy && !activeSynergies(ids).some((s) => s.id === r.synergy))
    return 'Needs holy and dark together'
  if (r.flag && !run.flags[r.flag]) return 'Something you have not done yet'
  if (r.gold && run.gold < r.gold) return `Needs ${r.gold} gold`
  if (r.potion && run.potions < r.potion) return 'Needs a potion'
  return null
}

function applyEffects(run: RunState, fx: Effects) {
  if (fx.gold) gainGold(run, fx.gold)
  if (fx.heal) healAll(run, fx.heal)
  if (fx.hurt) hurtAll(run, fx.hurt)
  if (fx.flag) run.flags[fx.flag] = true
  if (fx.potion) run.potions = Math.max(0, run.potions + fx.potion)
  if (fx.reveal) run.flags.revealNext = true
  if (fx.mercy) run.mercy += fx.mercy
  if (fx.deepen) run.deepening += fx.deepen
  if (fx.affinityAll)
    for (const id of run.companions) changeAffinity(run, id, fx.affinityAll)
  if (fx.boon) for (const key of STAT_KEYS) run.boons[key] += fx.boon[key] ?? 0
  if (fx.item)
    run.loot =
      fx.item === 'random' ? pick(run, LOOT_TABLE[run.layer]!) : fx.item
}

function changeAffinity(run: RunState, id: string, delta: number) {
  run.affinity[id] = Math.max(0, Math.min(10, (run.affinity[id] ?? 0) + delta))
}

export function rollAbilityCheck(
  run: RunState,
  skill: StatKey,
  dc: number,
): { die: number; modifier: number; total: number; success: boolean } {
  const members = alive(run)
  const best = members.length
    ? Math.max(...members.map((member) => stat(run, member.id, skill)))
    : 0
  const modifier = Math.max(0, Math.floor(best / 4))
  const die = 1 + Math.floor(nextRandom(run) * 20)
  const total = die + modifier
  return { die, modifier, total, success: total >= dc }
}

// A roll always uses the current run's RNG, including failed negotiations.
// Saving and resuming preserves exactly the same outcome.
export function chooseOption(run: RunState, optionId: string) {
  const ev = currentEvent(run)
  if (run.phase !== 'choice' || !ev) return
  const option = ev.options.find((o) => o.id === optionId)
  if (!option || optionLock(run, option)) return
  run.notices = []
  run.choices.push(`${ev.id}:${option.id}`)
  if (option.check) {
    const check = rollAbilityCheck(run, option.check.stat, option.check.dc)
    const code = `${ev.id}:${option.id}:${check.total >= option.check.dc ? 'passed' : 'failed'}`
    run.flags[code] = true
    applyEffects(run, check.success ? option.check.win : option.check.lose)
    note(
      run,
      check.success ? 'good' : 'bad',
      `d20 ${check.die} + ${check.modifier} ${option.check.stat.toUpperCase()} = ${check.total} vs ${option.check.dc}. ${check.success ? option.check.winText : option.check.loseText}`,
    )
    if (check.success && ev.id.startsWith('fairy-')) {
      const deity = courtDeity(ev.id.slice(6))
      const choice = option.id as CourtChoiceKey
      const link = deity?.choices[choice]?.revealLink
      if (link) addReveal(run, link)
    }
  } else if (option.gamble) {
    const win = nextRandom(run) < option.gamble.chance
    applyEffects(run, win ? option.gamble.win : option.gamble.lose)
    note(
      run,
      win ? 'good' : 'bad',
      win ? option.gamble.winText : option.gamble.loseText,
    )
  } else {
    applyEffects(run, option.effects)
    note(run, 'info', option.result)
  }
  if (option.tag) {
    const liked: string[] = []
    const disliked: string[] = []
    for (const id of run.companions) {
      const c = character(id)
      if (c.likes.includes(option.tag)) {
        changeAffinity(run, id, 1)
        liked.push(shortName(c))
      } else if (c.dislikes === option.tag) {
        changeAffinity(run, id, -1)
        disliked.push(shortName(c))
      }
    }
    if (liked.length)
      note(
        run,
        'heart',
        `${liked.join(' and ')} ${liked.length > 1 ? 'approve' : 'approves'}.`,
      )
    if (disliked.length)
      note(
        run,
        'bad',
        `${disliked.join(' and ')} ${disliked.length > 1 ? 'disapprove' : 'disapproves'}.`,
      )
  }
  finishRoom(run)
}

// ── Campfire ─────────────────────────────────────────────────────────────

function startCamp(run: RunState) {
  const full = hasSynergyEffect(partyIds(run), 'fullRest')
  for (const m of run.party) {
    if (m.down) {
      m.down = false
      m.hp = Math.round(maxHp(run, m.id) * 0.3)
    }
    m.poison = 0
    heal(run, m, maxHp(run, m.id) * (full ? 1 : 0.4))
  }
  run.camp = { talks: 2 }
  run.phase = 'camp'
  addMoment(run, 'campfire')
  note(
    run,
    'good',
    full
      ? 'The Green Circle tends every wound. Everyone is whole again.'
      : 'The fire is warm. Wounds close a little.',
  )
}

export type CampOption =
  | { kind: 'talk'; id: string; label: string; line: string }
  | { kind: 'support'; key: string; label: string; line: string }
  | { kind: 'romance'; id: string; label: string; line: string }
  | { kind: 'oath'; id: string; label: string; line: string }
  | { kind: 'shop'; label: string; line: string }

export const POTION_PRICE = 35

export function talkLine(run: RunState, id: string): string {
  const c = character(id)
  const a = run.affinity[id] ?? 0
  if (a >= 4) return c.secret
  return c.blurb
}

export function campOptions(run: RunState): CampOption[] {
  if (run.phase !== 'camp' || !run.camp) return []
  const options: CampOption[] = []
  if (run.gold >= POTION_PRICE)
    options.push({
      kind: 'shop',
      label: `Buy a potion (${POTION_PRICE} gold)`,
      line: 'Ottoline the Undermerchant always seems to be at the next fire over.',
    })
  if (run.camp.talks <= 0) return options
  for (const id of run.companions) {
    const c = character(id)
    const a = run.affinity[id] ?? 0
    const member = run.party.find((m) => m.id === id)
    if (member?.down) continue
    if (a >= 8 && !run.partners.includes(id) && !run.oaths.includes(id)) {
      if (canRomance(run.hero, id, run.companions)) {
        if (!c.partner || !run.partners.includes(c.partner))
          options.push({
            kind: 'romance',
            id,
            label: `Walk with ${shortName(c)}`,
            line: c.heart,
          })
      } else
        options.push({
          kind: 'oath',
          id,
          label: `Swear an oath with ${shortName(c)}`,
          line: c.heart,
        })
    }
    options.push({
      kind: 'talk',
      id,
      label: `Talk with ${shortName(c)}`,
      line: a >= 4 ? 'They have something to tell you.' : 'Get to know them.',
    })
  }
  for (const s of activeSupports(partyIds(run))) {
    const key = pairKey(s.a, s.b)
    if ((run.bonds[key] ?? 0) >= 1) continue
    if (run.party.some((m) => (m.id === s.a || m.id === s.b) && m.down))
      continue
    options.push({
      kind: 'support',
      key,
      label: `${s.name}: ${nameOf(run, s.a)} and ${nameOf(run, s.b)}`,
      line: s.scene,
    })
  }
  return options
}

export function campAction(run: RunState, option: CampOption): string {
  if (run.phase !== 'camp' || !run.camp) return ''
  run.notices = []
  if (option.kind === 'shop') {
    if (run.gold < POTION_PRICE) return ''
    run.gold -= POTION_PRICE
    run.potions += 1
    note(run, 'good', 'Ottoline sells you a potion and a wink.')
    return option.line
  }
  if (run.camp.talks <= 0) return ''
  run.camp.talks -= 1
  const warm = hasSynergyEffect(partyIds(run), 'warmth') ? 1 : 0
  let line: string
  if (option.kind === 'talk') {
    line = talkLine(run, option.id)
    changeAffinity(run, option.id, 2 + warm)
    note(run, 'heart', `${nameOf(run, option.id)}: ${line}`)
  } else if (option.kind === 'support') {
    const [a, b] = option.key.split('+') as [string, string]
    const s = supportFor(a, b)!
    run.bonds[option.key] = 1
    for (const id of [a, b])
      if (run.companions.includes(id)) changeAffinity(run, id, 1)
    line = s.scene
    note(run, 'heart', `${s.name}. ${line}`)
    const moment = SUPPORT_MOMENTS[option.key]
    if (moment) addMoment(run, moment)
  } else if (option.kind === 'romance') {
    const c = character(option.id)
    const together = c.poly && c.partner ? [option.id, c.partner] : [option.id]
    for (const id of together)
      if (!run.partners.includes(id)) run.partners.push(id)
    for (const id of together) run.affinity[id] = 10
    addMoment(run, romanceMoment(option.id))
    line = c.heart
    note(run, 'heart', line)
  } else {
    const c = character(option.id)
    run.oaths.push(option.id)
    line = c.heart
    note(run, 'heart', line)
  }
  if (run.camp.talks <= 0)
    note(run, 'info', 'The fire burns low. Time to move on.')
  return line
}

export function leaveCamp(run: RunState) {
  if (run.phase !== 'camp') return
  finishRoom(run)
}

// ── Finale and endings ───────────────────────────────────────────────────

export const GILDED_GOLD = 600

export type FinaleOption = { ending: EndingId; label: string; hint: string }

export function finaleOptions(run: RunState): FinaleOption[] {
  const ids = partyIds(run)
  const holy = ids.some((id) =>
    ['cleric', 'paladin'].includes(character(id).role),
  )
  const options: FinaleOption[] = [
    {
      ending: 'delver',
      label: 'Take the Deepheart home',
      hint: 'The treasure you came for',
    },
  ]
  if (run.flags.crown)
    options.push({
      ending: 'usurper',
      label: 'Sit upon the empty throne',
      hint: 'The crown still fits',
    })
  if (run.flags.lichpact)
    options.push({
      ending: 'lichbound',
      label: 'Honour Vesper’s pact',
      hint: 'You made a promise',
    })
  if (run.flags.spirit && run.flags.seed)
    options.push({
      ending: 'dawnbringer',
      label: 'Plant the dawn',
      hint: 'The seed and the spirit, together',
    })
  if (run.mercy >= 3 || (run.mercy >= 2 && holy))
    options.push({
      ending: 'redemption',
      label: 'Give the king his heart back',
      hint: 'Mercy, all the way down',
    })
  if (run.flags.collapse)
    options.push({
      ending: 'sealed',
      label: 'Pull the keystone',
      hint: 'Bury it all',
    })
  if (run.gold >= GILDED_GOLD)
    options.push({
      ending: 'gilded',
      label: 'Sell it to the Undermerchant',
      hint: `You have ${run.gold} gold and good instincts`,
    })
  const partner = run.partners.find(
    (id) => !run.party.find((m) => m.id === id)?.down,
  )
  if (partner)
    options.push({
      ending: 'hearthbound',
      label: `Leave it. Take ${nameOf(run, partner)}’s hand`,
      hint: 'You found something better',
    })
  return options
}

export function chooseEnding(run: RunState, ending: EndingId) {
  if (run.phase !== 'finale') return
  if (!finaleOptions(run).some((o) => o.ending === ending)) return
  if (ending === 'gilded') addReveal(run, 'undermerchant')
  if (
    ending === 'redemption' ||
    ending === 'delver' ||
    ending === 'dawnbringer'
  )
    addReveal(run, 'heart-alive')
  const knownDeities = COURT_DEITIES.filter(
    (deity) => run.flags[`court-met-${deity.id}`],
  )
  if (knownDeities.length) {
    run.pendingEnding = ending
    run.courtSelected = null
    run.phase = 'court'
    note(run, 'info', 'A last invitation arrives: the courts wish to speak.')
  } else endRun(run, ending)
}

export type CourtOption = { id: string; label: string; hint: string }

export function courtOptions(run: RunState): CourtOption[] {
  if (run.phase !== 'court') return []
  if (!run.courtSelected)
    return [
      ...COURT_DEITIES.filter(
        (deity) => run.flags[`court-met-${deity.id}`],
      ).map((deity) => ({
        id: `audience:${deity.id}`,
        label: deity.name,
        hint: deity.epithet,
      })),
      {
        id: 'skip',
        label: 'Leave the nobles to argue',
        hint: 'End the delve on your own terms',
      },
    ]
  const deity = courtDeity(run.courtSelected)
  if (!deity) return [{ id: 'skip', label: 'Leave the court', hint: '' }]
  return [
    ...COURT_CHOICE_KEYS.map((choice) => ({
      id: `resolve:${choice}`,
      label: deity.choices[choice].label,
      hint: `d20 + ${deity.choices[choice].stat.toUpperCase()} vs ${deity.choices[choice].dc}`,
    })),
    {
      id: 'back',
      label: 'Speak to another patron',
      hint: 'Choose another audience',
    },
    {
      id: 'skip',
      label: 'Refuse every offer',
      hint: 'Finish without a court bargain',
    },
  ]
}

export function chooseCourtOption(run: RunState, id: string) {
  if (run.phase !== 'court' || !run.pendingEnding) return
  if (id === 'skip') {
    endRun(run, run.pendingEnding)
    return
  }
  if (id === 'back') {
    run.courtSelected = null
    return
  }
  if (id.startsWith('audience:')) {
    const deityId = id.slice('audience:'.length)
    if (!run.flags[`court-met-${deityId}`] || !courtDeity(deityId)) return
    run.courtSelected = deityId
    return
  }
  if (!id.startsWith('resolve:') || !run.courtSelected) return
  const choice = id.slice('resolve:'.length) as CourtChoiceKey
  if (!COURT_CHOICE_KEYS.includes(choice)) return
  const deity = courtDeity(run.courtSelected)
  if (!deity || !run.flags[`court-met-${deity.id}`]) return
  const option = deity.choices[choice]
  const check = rollAbilityCheck(run, option.stat, option.dc)
  const epilogue = check.success ? option.epilogue : option.failure
  run.courtOutcome = {
    deity: deity.id,
    path: choice,
    ...check,
    target: option.dc,
    epilogue,
  }
  addReveal(
    run,
    `court-ending-${deity.id}-${choice}-${check.success ? 'success' : 'failure'}`,
  )
  addReveal(run, `court-immortality-${deity.id}`)
  if (check.success) addReveal(run, option.revealLink)
  note(
    run,
    check.success ? 'good' : 'bad',
    `${deity.name}: d20 ${check.die} + ${check.modifier} = ${check.total} vs ${option.dc}. ${epilogue}`,
  )
  endRun(run, run.pendingEnding)
}

function endRun(run: RunState, ending: EndingId) {
  run.ending = ending
  run.phase = 'ended'
  run.combat = null
  note(run, ending === 'fallen' ? 'bad' : 'good', ENDING_TEXT[ending].title)
}

export function endingText(
  run: RunState,
): { title: string; text: string; romance: string; court: string } | null {
  if (!run.ending) return null
  const e = ENDING_TEXT[run.ending]
  const partner = run.partners[0]
  const names = run.partners.map((id) => nameOf(run, id)).join(' and ')
  return {
    title: e.title,
    text: e.text,
    romance: partner ? e.romance.replace('{partner}', names) : '',
    court: run.courtOutcome
      ? `${courtDeity(run.courtOutcome.deity)?.name ?? 'The court'}: ${run.courtOutcome.epilogue}`
      : '',
  }
}

export function partyHealth(run: RunState): number {
  const total = run.party.reduce((s, m) => s + maxHp(run, m.id), 0)
  return Math.round((run.party.reduce((s, m) => s + m.hp, 0) / total) * 100)
}

export function depthMeter(run: RunState): number {
  return run.layer * DEPTHS_PER_LAYER + run.depth
}

/** Plays a whole run with the Auto choices: the seeded test harness. */
export function autoplay(
  run: RunState,
  policy: {
    door?: (run: RunState, doors: Room[]) => number
    option?: (run: RunState, options: EventOption[]) => string
    ending?: (run: RunState, options: FinaleOption[]) => EndingId
  } = {},
  maxSteps = 4000,
): RunState {
  for (let step = 0; step < maxSteps && run.phase !== 'ended'; step++) {
    switch (run.phase) {
      case 'map': {
        const list = doors(run)
        chooseDoor(run, policy.door ? policy.door(run, list) : 0)
        break
      }
      case 'fight':
        act(run, autoAction(run))
        break
      case 'puzzle': {
        const p = run.puzzle!
        if (p.riddle) answerRiddle(run, RIDDLE_BY_ID.get(p.riddle.id)!.answer)
        else if (p.runes) pressRune(run, runeSolution(p.runes.lit)[0] ?? 4)
        else if (p.sequence)
          pressGlyph(run, p.sequence.glyphs[p.sequence.entered.length]!)
        else if (p.scales) {
          const s = p.scales
          const want = subsetFor(s.weights, s.target)
          s.picked = want
          weighScales(run)
        }
        break
      }
      case 'treasure':
        openTreasure(run, treasureChoices(run)[0]!)
        break
      case 'choice': {
        const ev = currentEvent(run)!
        const open = ev.options.filter((o) => !optionLock(run, o))
        chooseOption(
          run,
          policy.option ? policy.option(run, open) : open[0]!.id,
        )
        break
      }
      case 'camp': {
        const options = campOptions(run)
        const talks = options.filter((o) => o.kind !== 'shop')
        const shop =
          run.potions < 3 ? options.find((o) => o.kind === 'shop') : undefined
        const best =
          shop ??
          talks.find((o) => o.kind === 'romance') ??
          talks.find((o) => o.kind === 'support') ??
          talks[0]
        if (best) campAction(run, best)
        else leaveCamp(run)
        break
      }
      case 'loot': {
        const holder = run.party.find((m) => !m.item) ?? null
        equipLoot(run, holder?.id ?? null)
        break
      }
      case 'finale': {
        const options = finaleOptions(run)
        chooseEnding(
          run,
          policy.ending
            ? policy.ending(run, options)
            : options[options.length - 1]!.ending,
        )
        break
      }
      case 'court':
        chooseCourtOption(run, 'skip')
        break
    }
  }
  return run
}

export function subsetFor(weights: number[], target: number): number[] {
  for (let mask = 1; mask < 1 << weights.length; mask++) {
    let sum = 0
    const picked: number[] = []
    for (let i = 0; i < weights.length; i++)
      if (mask & (1 << i)) {
        sum += weights[i]!
        picked.push(i)
      }
    if (sum === target) return picked
  }
  return []
}

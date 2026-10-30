export type Color = 'red' | 'blue' | 'purple' | 'green' | 'gold'
export type TeamId =
  'catgirls' | 'bloodfairies' | 'ironjaw' | 'riot' | 'undertow' | 'exchange'
export type ModeId = 'blackout' | 'gridiron' | 'bloodrush'
export type CardKind = 'creature' | 'spell' | 'trap' | 'equipment'
export type Side = 'player' | 'enemy'

export interface Team {
  id: TeamId
  name: string
  color: Color
  district: string
  motto: string
  hook: string
  insignia: string
  creatures: [string, string, string]
  special: [string, string, string]
}

export interface Card {
  id: string
  name: string
  kind: CardKind
  team: TeamId
  cost: number
  hp?: number
  attack?: number
  armor?: number
  ap?: number
  effect?: 'zap' | 'heal' | 'chaos' | 'snare' | 'armor' | 'boost'
  text: string
  symbol: string
}

export interface Fighter {
  id: number
  cardId: string
  side: Side
  x: number
  y: number
  hp: number
  attack: number
  armor: number
  ap: number
  maxAp: number
  hidden: boolean
  carryingFlag: boolean
}

export interface Trap {
  x: number
  y: number
  side: Side
  damage: number
}

export interface MatchState {
  mode: ModeId
  width: number
  height: number
  round: number
  mana: number
  score: [number, number]
  seed: number
  nextId: number
  teamId: TeamId
  foeId: TeamId
  units: Fighter[]
  traps: Trap[]
  bossHp: number
  flag: { x: number; y: number }
  victor: Side | 'draw' | null
  log: string[]
}

export const MODES: {
  id: ModeId
  title: string
  subtitle: string
  size: string
  cadence: string
  detail: string
}[] = [
  {
    id: 'blackout',
    title: 'BLACKOUT',
    subtitle: 'Hidden army · Stratego test',
    size: '8 × 8',
    cadence: 'TURN-BASED',
    detail:
      'Four fighters deployed face-down on each side. Reveal by moving, uncover the enemy, and steal the flag.',
  },
  {
    id: 'gridiron',
    title: 'MEATBALL',
    subtitle: 'Lane battle · football test',
    size: '12 × 6',
    cadence: 'TURN-BASED',
    detail:
      'Spend growing mana to deploy runners into six lanes. Push through the defense and score at the far end.',
  },
  {
    id: 'bloodrush',
    title: 'BLOODRUSH',
    subtitle: 'Wave battle · real-time test',
    size: '14 × 6',
    cadence: 'REAL-TIME',
    detail:
      'Launch units and special cards while both teams advance on a live clock. First to three touchdowns wins.',
  },
]

export const TEAMS: Team[] = [
  {
    id: 'catgirls',
    name: 'GENE RIOT CATGIRLS',
    color: 'blue',
    district: 'CHIMERA HEIGHTS',
    motto: 'Nine lives. Zero patents.',
    hook: 'Escaped genetic experiments who turned their old laboratory into a neighborhood sanctuary. Ambushes and tactical regeneration.',
    insignia: '✦',
    creatures: ['lynx', 'mau', 'chimera'],
    special: ['pounce', 'scentmine', 'reknit'],
  },
  {
    id: 'bloodfairies',
    name: 'PUNK BLOODFAIRIES',
    color: 'purple',
    district: 'NEEDLE ALLEY',
    motto: 'Small wings. Big knives.',
    hook: 'A riotous crew of tiny blood-magic punks who treat the megacity as one very loud mosh pit. Cheap swarms and surprise strikes.',
    insignia: '❋',
    creatures: ['sprite', 'razor', 'queen'],
    special: ['mosh', 'bloodwire', 'spurs'],
  },
  {
    id: 'ironjaw',
    name: 'IRONJAW CHROME OGRES',
    color: 'green',
    district: 'THE FOUNDRY',
    motto: 'More chrome. More teeth.',
    hook: 'Industrial-size cybernetic ogres fighting for freedom from the factories that built their bodies. Armor, hardware and bulldozing.',
    insignia: '⬡',
    creatures: ['scrapper', 'bulldozer', 'juggernaut'],
    special: ['overclock', 'shocktrap', 'plating'],
  },
  {
    id: 'riot',
    name: 'RIOT SAINTS',
    color: 'red',
    district: 'REDLINE RIOT',
    motto: 'Make it explode twice.',
    hook: 'Joyfully irresponsible demolition gladiators in a city where nobody has read the fire code. High-risk chaos cards.',
    insignia: '✸',
    creatures: ['rat', 'firebrand', 'bomber'],
    special: ['firestorm', 'badluck', 'fuse'],
  },
  {
    id: 'undertow',
    name: 'UNDERTOW INTELLIGENCE',
    color: 'blue',
    district: 'THE UNDERTOW',
    motto: 'We already saw you.',
    hook: 'Sewer spies, surveillance witches and amphibious informants who rig every intersection before a fight begins.',
    insignia: '◈',
    creatures: ['watcher', 'frogtrooper', 'oracle'],
    special: ['blackout', 'tripwire', 'visor'],
  },
  {
    id: 'exchange',
    name: 'MEAT EXCHANGE',
    color: 'gold',
    district: 'CROWN MARKET',
    motto: 'Terms and conditions apply.',
    hook: 'Gold-toothed arena monopolists who buy muscle, sell favors and collect battlefield debts.',
    insignia: '◆',
    creatures: ['collector', 'broker', 'mogul'],
    special: ['collection', 'debttrap', 'contract'],
  },
]

export const CARDS: Card[] = [
  {
    id: 'lynx',
    name: 'Neon Lynx',
    kind: 'creature',
    team: 'catgirls',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    text: 'Fast prototype scout.',
    symbol: '✦',
  },
  {
    id: 'mau',
    name: 'Mau-77',
    kind: 'creature',
    team: 'catgirls',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Designer-claw enforcer.',
    symbol: '◉',
  },
  {
    id: 'chimera',
    name: 'Madame Chimera',
    kind: 'creature',
    team: 'catgirls',
    cost: 4,
    hp: 5,
    attack: 2,
    armor: 1,
    ap: 2,
    text: 'Nine life signatures.',
    symbol: '✹',
  },
  {
    id: 'pounce',
    name: 'Catnip Overdrive',
    kind: 'spell',
    team: 'catgirls',
    cost: 2,
    effect: 'boost',
    text: 'Grant a friendly fighter 2 extra AP.',
    symbol: '⚡',
  },
  {
    id: 'scentmine',
    name: 'Scent Mine',
    kind: 'trap',
    team: 'catgirls',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'reknit',
    name: 'Reknit Serum',
    kind: 'spell',
    team: 'catgirls',
    cost: 1,
    effect: 'heal',
    text: 'Restore two HP.',
    symbol: '✚',
  },
  {
    id: 'sprite',
    name: 'Bloodsprite',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 1,
    hp: 1,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Small, mean and loud.',
    symbol: '❋',
  },
  {
    id: 'razor',
    name: 'Razorwing',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 2,
    hp: 2,
    attack: 2,
    armor: 0,
    ap: 3,
    text: 'Moves in a blur.',
    symbol: '✣',
  },
  {
    id: 'queen',
    name: 'Queen Safety Pin',
    kind: 'creature',
    team: 'bloodfairies',
    cost: 4,
    hp: 4,
    attack: 3,
    armor: 0,
    ap: 2,
    text: 'Union leader of the damned.',
    symbol: '✷',
  },
  {
    id: 'mosh',
    name: 'Moshpit Massacre',
    kind: 'spell',
    team: 'bloodfairies',
    cost: 2,
    effect: 'zap',
    text: 'Deal 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'bloodwire',
    name: 'Bloodwire',
    kind: 'trap',
    team: 'bloodfairies',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'spurs',
    name: 'Razor Spurs',
    kind: 'equipment',
    team: 'bloodfairies',
    cost: 2,
    effect: 'boost',
    text: 'Grant a fighter 2 AP.',
    symbol: '✧',
  },
  {
    id: 'scrapper',
    name: 'Chrome Scrapper',
    kind: 'creature',
    team: 'ironjaw',
    cost: 1,
    hp: 3,
    attack: 1,
    armor: 1,
    ap: 1,
    text: 'Scrap-metal fist fighter.',
    symbol: '⬡',
  },
  {
    id: 'bulldozer',
    name: 'Bulld-Ogre',
    kind: 'creature',
    team: 'ironjaw',
    cost: 3,
    hp: 5,
    attack: 2,
    armor: 1,
    ap: 1,
    text: 'Armored wallbreaker.',
    symbol: '▣',
  },
  {
    id: 'juggernaut',
    name: 'Maw-9000',
    kind: 'creature',
    team: 'ironjaw',
    cost: 5,
    hp: 7,
    attack: 3,
    armor: 2,
    ap: 1,
    text: 'A tank with opinions.',
    symbol: '⬢',
  },
  {
    id: 'overclock',
    name: 'Overclock Core',
    kind: 'spell',
    team: 'ironjaw',
    cost: 2,
    effect: 'boost',
    text: 'Grant a fighter 2 AP.',
    symbol: '⚡',
  },
  {
    id: 'shocktrap',
    name: 'Shock Plate',
    kind: 'trap',
    team: 'ironjaw',
    cost: 2,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'plating',
    name: 'Foundry Plating',
    kind: 'equipment',
    team: 'ironjaw',
    cost: 2,
    effect: 'armor',
    text: 'Give a fighter +1 armor.',
    symbol: '⬟',
  },
  {
    id: 'rat',
    name: 'Riot Rat',
    kind: 'creature',
    team: 'riot',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    text: 'All teeth, no planning.',
    symbol: '✸',
  },
  {
    id: 'firebrand',
    name: 'Firebrand',
    kind: 'creature',
    team: 'riot',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Carries six lit fuses.',
    symbol: '✴',
  },
  {
    id: 'bomber',
    name: 'Grand Detonator',
    kind: 'creature',
    team: 'riot',
    cost: 4,
    hp: 4,
    attack: 3,
    armor: 0,
    ap: 1,
    text: 'Makes the stadium shake.',
    symbol: '✺',
  },
  {
    id: 'firestorm',
    name: 'Accidental Firestorm',
    kind: 'spell',
    team: 'riot',
    cost: 2,
    effect: 'chaos',
    text: 'Deal 1–3 damage, seeded.',
    symbol: '⚡',
  },
  {
    id: 'badluck',
    name: 'Whoops Grenade',
    kind: 'trap',
    team: 'riot',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'fuse',
    name: 'Illegal Booster',
    kind: 'equipment',
    team: 'riot',
    cost: 2,
    effect: 'boost',
    text: 'Grant a fighter 2 AP.',
    symbol: '✧',
  },
  {
    id: 'watcher',
    name: 'Sewer Watcher',
    kind: 'creature',
    team: 'undertow',
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 2,
    text: 'Knows every drain.',
    symbol: '◈',
  },
  {
    id: 'frogtrooper',
    name: 'Frog Trooper',
    kind: 'creature',
    team: 'undertow',
    cost: 2,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    text: 'Silent wet boots.',
    symbol: '◉',
  },
  {
    id: 'oracle',
    name: 'Drowned Oracle',
    kind: 'creature',
    team: 'undertow',
    cost: 4,
    hp: 4,
    attack: 3,
    armor: 1,
    ap: 1,
    text: 'Sees tomorrow’s ambush.',
    symbol: '◉',
  },
  {
    id: 'blackout',
    name: 'Signal Blackout',
    kind: 'spell',
    team: 'undertow',
    cost: 2,
    effect: 'zap',
    text: 'Deal 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'tripwire',
    name: 'Tripwire',
    kind: 'trap',
    team: 'undertow',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'visor',
    name: 'Spyglass Visor',
    kind: 'equipment',
    team: 'undertow',
    cost: 2,
    effect: 'armor',
    text: 'Give a fighter +1 armor.',
    symbol: '✧',
  },
  {
    id: 'collector',
    name: 'Debt Collector',
    kind: 'creature',
    team: 'exchange',
    cost: 1,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 1,
    text: 'Interest compounds daily.',
    symbol: '◆',
  },
  {
    id: 'broker',
    name: 'Flesh Broker',
    kind: 'creature',
    team: 'exchange',
    cost: 3,
    hp: 4,
    attack: 2,
    armor: 1,
    ap: 1,
    text: 'Premium collections agent.',
    symbol: '◇',
  },
  {
    id: 'mogul',
    name: 'The Meat Mogul',
    kind: 'creature',
    team: 'exchange',
    cost: 5,
    hp: 6,
    attack: 3,
    armor: 1,
    ap: 1,
    text: 'Owns the arena.',
    symbol: '◈',
  },
  {
    id: 'collection',
    name: 'Hostile Collection',
    kind: 'spell',
    team: 'exchange',
    cost: 2,
    effect: 'zap',
    text: 'Deal 2 damage to an enemy.',
    symbol: '⚡',
  },
  {
    id: 'debttrap',
    name: 'Hidden Fees',
    kind: 'trap',
    team: 'exchange',
    cost: 1,
    effect: 'snare',
    text: 'Hidden square trap, 2 damage.',
    symbol: '◇',
  },
  {
    id: 'contract',
    name: 'Iron Contract',
    kind: 'equipment',
    team: 'exchange',
    cost: 2,
    effect: 'armor',
    text: 'Give a fighter +1 armor.',
    symbol: '⬟',
  },
]

export const DISTRICTS = [
  {
    id: 'pitworks',
    name: 'THE PITWORKS',
    x: 49,
    y: 62,
    summary: 'Arenas and training bouts',
    team: 'riot' as TeamId,
  },
  {
    id: 'chimera',
    name: 'CHIMERA HEIGHTS',
    x: 27,
    y: 25,
    summary: 'Gene-lab catgirl uprising',
    team: 'catgirls' as TeamId,
  },
  {
    id: 'needles',
    name: 'NEEDLE ALLEY',
    x: 72,
    y: 33,
    summary: 'Punk bloodfairy rooftops',
    team: 'bloodfairies' as TeamId,
  },
  {
    id: 'foundry',
    name: 'THE FOUNDRY',
    x: 18,
    y: 70,
    summary: 'Cyber-ogre resistance',
    team: 'ironjaw' as TeamId,
  },
  {
    id: 'undertow',
    name: 'THE UNDERTOW',
    x: 44,
    y: 86,
    summary: 'Blue espionage tunnels',
    team: 'undertow' as TeamId,
  },
  {
    id: 'crown',
    name: 'CROWN MARKET',
    x: 80,
    y: 73,
    summary: 'Meat shop and contracts',
    team: 'exchange' as TeamId,
  },
  {
    id: 'redline',
    name: 'REDLINE RIOT',
    x: 62,
    y: 17,
    summary: 'Chaotic street gauntlets',
    team: 'riot' as TeamId,
  },
]

export function cardById(id: string): Card {
  const found = CARDS.find((card) => card.id === id)
  if (!found) throw new Error('Unknown Slime City card: ' + id)
  return found
}

export function teamById(id: TeamId): Team {
  const found = TEAMS.find((team) => team.id === id)
  if (!found) throw new Error('Unknown Slime City team: ' + id)
  return found
}

export function legalNeighbor(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
}

export function unitAt(
  state: MatchState,
  x: number,
  y: number,
): Fighter | undefined {
  return state.units.find((unit) => unit.hp > 0 && unit.x === x && unit.y === y)
}

function copy(state: MatchState): MatchState {
  return {
    ...state,
    score: [...state.score],
    flag: { ...state.flag },
    units: state.units.map((u) => ({ ...u })),
    traps: state.traps.map((t) => ({ ...t })),
    log: [...state.log],
  }
}

function message(state: MatchState, line: string): void {
  state.log = [line, ...state.log].slice(0, 5)
}

function addFighter(
  state: MatchState,
  cardId: string,
  side: Side,
  x: number,
  y: number,
  hidden = false,
): void {
  const card = cardById(cardId)
  state.units.push({
    id: state.nextId++,
    cardId,
    side,
    x,
    y,
    hp: card.hp || 2,
    attack: card.attack || 1,
    armor: card.armor || 0,
    ap: card.ap || 1,
    maxAp: card.ap || 1,
    hidden,
    carryingFlag: false,
  })
}

export function createMatch(
  mode: ModeId,
  teamId: TeamId,
  foeId: TeamId = 'ironjaw',
): MatchState {
  const m = MODES.find((item) => item.id === mode)
  if (!m) throw new Error('Unknown Slime City match mode')
  const dimensions = m.size.split(' × ')
  const width = Number(dimensions[0]!)
  const height = Number(dimensions[1]!)
  const state: MatchState = {
    mode,
    width,
    height,
    round: 1,
    mana: 1,
    score: [0, 0],
    seed: 4817,
    nextId: 1,
    teamId,
    foeId: foeId === teamId ? 'riot' : foeId,
    units: [],
    traps: [],
    bossHp: 6,
    flag: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
    victor: null,
    log: ['Arena loaded. Choose a fighter or special.'],
  }
  if (mode === 'blackout') {
    for (let i = 0; i < 4; i++) {
      const y = 1 + i
      addFighter(
        state,
        teamById(teamId).creatures[i % 3]!,
        'player',
        1,
        y,
        true,
      )
      addFighter(
        state,
        teamById(state.foeId).creatures[i % 3]!,
        'enemy',
        width - 2,
        y,
        true,
      )
    }
  } else {
    addFighter(state, teamById(teamId).creatures[0]!, 'player', 0, 2)
    addFighter(
      state,
      teamById(state.foeId).creatures[0]!,
      'enemy',
      width - 1,
      3,
    )
  }
  return state
}

export function deploy(
  state: MatchState,
  cardId: string,
  x: number,
  y: number,
): MatchState {
  const card = cardById(cardId)
  if (state.victor || card.team !== state.teamId || card.cost > state.mana)
    return state
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return state
  const next = copy(state)
  const target = unitAt(next, x, y)
  if (card.kind === 'creature') {
    if (target || (next.mode === 'blackout' ? x > 1 : x !== 0)) return state
    addFighter(next, cardId, 'player', x, y, next.mode === 'blackout')
  } else if (card.kind === 'trap') {
    if (
      next.traps.some((trap) => trap.x === x && trap.y === y) ||
      (next.mode !== 'blackout' && x === 0)
    )
      return state
    next.traps.push({ x, y, side: 'player', damage: 2 })
  } else if (
    card.effect === 'heal' ||
    card.kind === 'equipment' ||
    card.effect === 'boost'
  ) {
    if (!target || target.side !== 'player') return state
    if (card.effect === 'heal') target.hp += 2
    else if (card.effect === 'armor') target.armor += 1
    else target.ap += 2
  } else {
    if (!target || target.side !== 'enemy') return state
    const damage =
      card.effect === 'chaos'
        ? 1 + ((next.seed + next.round + target.id) % 3)
        : 2
    target.hp -= damage
    target.hidden = false
  }
  next.mana -= card.cost
  next.units = next.units.filter((unit) => unit.hp > 0)
  message(next, card.name + ' played for ' + card.cost + ' mana.')
  return next
}

export function reveal(state: MatchState, id: number): MatchState {
  if (state.victor) return state
  const next = copy(state)
  const unit = next.units.find(
    (fighter) => fighter.id === id && fighter.side === 'player',
  )
  if (!unit || !unit.hidden) return state
  unit.hidden = false
  message(next, cardById(unit.cardId).name + ' unmasked.')
  return next
}

export function move(
  state: MatchState,
  id: number,
  x: number,
  y: number,
): MatchState {
  if (
    state.victor ||
    state.mode !== 'blackout' ||
    x < 0 ||
    y < 0 ||
    x >= state.width ||
    y >= state.height ||
    unitAt(state, x, y)
  )
    return state
  const next = copy(state)
  const unit = next.units.find((u) => u.id === id && u.side === 'player')
  if (!unit || unit.ap < 1 || !legalNeighbor(unit, { x, y })) return state
  unit.x = x
  unit.y = y
  unit.ap--
  unit.hidden = false
  triggerTraps(next)
  handleFlag(next)
  message(next, cardById(unit.cardId).name + ' moved one square.')
  return next
}

function moveAutomatic(state: MatchState, side: Side): void {
  const units = state.units
    .filter((u) => u.side === side && u.hp > 0)
    .sort((a, b) => a.id - b.id)
  for (const unit of units) {
    if (state.mode === 'blackout' && side === 'player') continue
    const targets = state.units.filter((u) => u.side !== side && u.hp > 0)
    let candidates: { x: number; y: number }[] = []
    if (state.mode === 'blackout') {
      const target = [...targets].sort(
        (a, b) =>
          Math.abs(unit.x - a.x) +
          Math.abs(unit.y - a.y) -
          Math.abs(unit.x - b.x) -
          Math.abs(unit.y - b.y),
      )[0]
      if (target) {
        const dx = Math.sign(target.x - unit.x)
        const dy = Math.sign(target.y - unit.y)
        candidates = [
          { x: unit.x + dx, y: unit.y },
          { x: unit.x, y: unit.y + dy },
        ]
      }
    } else {
      candidates = [{ x: unit.x + (side === 'player' ? 1 : -1), y: unit.y }]
    }
    for (const cell of candidates) {
      if (
        cell.x < 0 ||
        cell.x >= state.width ||
        cell.y < 0 ||
        cell.y >= state.height ||
        unitAt(state, cell.x, cell.y)
      )
        continue
      unit.x = cell.x
      unit.y = cell.y
      if (state.mode === 'blackout') unit.hidden = false
      break
    }
  }
}

function triggerTraps(state: MatchState): void {
  const remaining: Trap[] = []
  for (const trap of state.traps) {
    const victim = unitAt(state, trap.x, trap.y)
    if (victim && victim.side !== trap.side) {
      victim.hp -= trap.damage
      victim.hidden = false
      message(state, 'A hidden trap explodes for ' + trap.damage + '!')
    } else remaining.push(trap)
  }
  state.traps = remaining
  state.units = state.units.filter((u) => u.hp > 0)
}

function handleFlag(state: MatchState): void {
  if (state.mode !== 'blackout') return
  const carrier = state.units.find((unit) => unit.carryingFlag)
  if (!carrier) {
    const claimant = unitAt(state, state.flag.x, state.flag.y)
    if (claimant && !claimant.hidden) {
      claimant.carryingFlag = true
      message(state, 'The flag is captured! Return to your base.')
    }
  } else if (
    (carrier.side === 'player' && carrier.x <= 1) ||
    (carrier.side === 'enemy' && carrier.x >= state.width - 2)
  ) {
    state.victor = carrier.side
    message(state, 'FLAG RUN! The ' + carrier.side + ' side wins.')
  }
}

function doCombat(state: MatchState): void {
  const damage = new Map<number, number>()
  for (const fighter of state.units) {
    if (fighter.hidden || fighter.hp <= 0) continue
    const neighbors = state.units.filter(
      (other) =>
        other.side !== fighter.side &&
        other.hp > 0 &&
        legalNeighbor(fighter, other),
    )
    if (neighbors.length) {
      const victim = [...neighbors].sort((a, b) => a.id - b.id)[0]
      if (!victim) continue
      damage.set(
        victim.id,
        (damage.get(victim.id) || 0) +
          Math.max(0, fighter.attack - victim.armor),
      )
      fighter.hidden = false
      victim.hidden = false
    }
  }
  if (damage.size) {
    for (const unit of state.units) unit.hp -= damage.get(unit.id) || 0
    message(state, damage.size + ' fighters took simultaneous damage.')
  }
  state.units = state.units.filter((u) => u.hp > 0)
}

export function advance(state: MatchState): MatchState {
  if (state.victor) return state
  const next = copy(state)
  moveAutomatic(next, 'enemy')
  if (next.mode !== 'blackout') moveAutomatic(next, 'player')
  triggerTraps(next)
  doCombat(next)
  handleFlag(next)
  if (next.mode !== 'blackout') {
    for (const unit of [...next.units]) {
      if (unit.side === 'player' && unit.x === next.width - 1) next.score[0]++
      if (unit.side === 'enemy' && unit.x === 0) next.score[1]++
    }
    next.units = next.units.filter(
      (u) => u.x !== (u.side === 'player' ? next.width - 1 : 0),
    )
    if (next.score[0] >= 3 || next.score[1] >= 3)
      next.victor =
        next.score[0] === next.score[1]
          ? 'draw'
          : next.score[0] > next.score[1]
            ? 'player'
            : 'enemy'
    if (next.round % 2 === 0 && !next.victor) {
      const y = (next.seed + next.round) % next.height
      if (!unitAt(next, next.width - 1, y))
        addFighter(
          next,
          teamById(next.foeId).creatures[(next.round / 2) % 3]!,
          'enemy',
          next.width - 1,
          y,
        )
    }
  } else if (next.round > 4) {
    const alivePlayer = next.units.some((u) => u.side === 'player')
    const aliveEnemy = next.units.some((u) => u.side === 'enemy')
    if (!alivePlayer || !aliveEnemy)
      next.victor =
        alivePlayer === aliveEnemy ? 'draw' : alivePlayer ? 'player' : 'enemy'
  }
  if (!next.victor) {
    next.round++
    next.mana = Math.min(10, next.round)
    for (const unit of next.units) unit.ap = unit.maxAp
    message(
      next,
      'Round ' + next.round + ' · ' + next.mana + ' mana available.',
    )
  } else message(next, next.victor.toUpperCase() + ' WINS THE PIT.')
  return next
}

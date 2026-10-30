// Slime City overworld (conductor slime-city t-007, first slice): streets
// between the seven districts, a named rival in each, one street decision
// per district that changes that rival's bout, and standing/heat that open
// or close the city. Pure and deterministic; the store keeps it for the
// session only (no Meat, cards or saves are awarded).
import type { MatchState, ModeId, TeamId } from './prototypes'

export type DistrictId =
  | 'pitworks'
  | 'chimera'
  | 'needles'
  | 'foundry'
  | 'undertow'
  | 'crown'
  | 'redline'

/** Adjustments one decision makes to a rival bout. All optional. */
export interface BoutTerms {
  playerMana?: number
  enemyMana?: number
  /** Added to every starting rival fighter's armor. */
  enemyArmor?: number
  /** Added to every starting player fighter's max and current HP. */
  playerHp?: number
  /** Rival fighters removed from the starting line (BLACKOUT only). */
  fewerRivals?: number
  /** Change to the round or tick limit. */
  rounds?: number
  /** The rival starts with a trap armed in the middle of the field. */
  rivalTrap?: boolean
}

export interface StreetChoice {
  id: string
  label: string
  /** What the player is told will happen, in plain words. */
  outcome: string
  standing: number
  heat: number
  terms: BoutTerms
}

export interface Rival {
  name: string
  title: string
  team: TeamId
  mode: ModeId
  taunt: string
}

export interface DistrictPlan {
  id: DistrictId
  street: string
  rival: Rival
  scene: string
  choices: [StreetChoice, StreetChoice]
  /** Other districts this one must stand with before its gate opens. */
  gate?: { standing?: number; cleared?: number; reason: string }
}

/** Streets are two-way; travel only along them. */
export const STREETS: [DistrictId, DistrictId, string][] = [
  ['pitworks', 'chimera', 'Splice Avenue'],
  ['pitworks', 'foundry', 'Slag Causeway'],
  ['pitworks', 'undertow', 'The Long Drain'],
  ['pitworks', 'redline', 'Fuse Street'],
  ['chimera', 'redline', 'Hiss Row'],
  ['redline', 'needles', 'Spike Stair'],
  ['needles', 'crown', 'Gilt Gate'],
  ['foundry', 'undertow', 'Coolant Culvert'],
  ['undertow', 'crown', 'Ledger Sewer'],
]

export interface StreetStory {
  title: string
  scene: string
  choices: [StreetChoice, StreetChoice]
}

/** Every road has a one-time authored encounter on its first crossing. */
export const STREET_STORIES: Record<string, StreetStory> = {
  'Splice Avenue': {
    title: 'THE RUNAWAY AMBULANCE',
    scene: 'A stolen ambulance full of experimental serum slides toward a cordon of corporate gene-hunters. A pair of catgirls wave you into the crossfire.',
    choices: [
      { id: 'splice-smuggle', label: 'Drive the serum to safety', outcome: 'The escapees will remember. Your next neighborhood fight gains +1 HP, but the hunters put out your face (+1 heat).', standing: 1, heat: 1, terms: { playerHp: 1 } },
      { id: 'splice-decoy', label: 'Release the decoy drones', outcome: 'The guards scatter, thinning their field defenses, but the fugitives mistrust the tactic (−1 standing).', standing: -1, heat: 0, terms: { enemyArmor: -1 } },
    ],
  },
  'Slag Causeway': {
    title: 'THE PICKET LINE',
    scene: 'Chrome ogre workers link arms across the furnace bridge. Their bosses send a payroll drone with an offer of easy credits and no witnesses.',
    choices: [
      { id: 'slag-union', label: 'Protect the strikers', outcome: 'One worker loans you an extra opening mana. The factory identifies you as a troublemaker (+1 heat).', standing: 1, heat: 1, terms: { playerMana: 1 } },
      { id: 'slag-payroll', label: 'Deliver the owners’ message', outcome: 'A private mechanic patches your starters (+1 HP). You lose the workers’ trust (−2 standing).', standing: -2, heat: -1, terms: { playerHp: 1 } },
    ],
  },
  'The Long Drain': {
    title: 'THE WHISPER TAX',
    scene: 'Under the road, a frog courier opens a grate and offers a genuine spy map. From the dark behind him, something asks who sent you.',
    choices: [
      { id: 'drain-protect', label: 'Hide the courier', outcome: 'The spies owe you a favor: +1 opening mana. Somebody reports the exchange (+1 heat).', standing: 1, heat: 1, terms: { playerMana: 1 } },
      { id: 'drain-trace', label: 'Follow the second voice', outcome: 'You spot where the ambush lies, but the city’s informants mark you as reckless.', standing: -1, heat: 0, terms: { enemyArmor: -1 } },
    ],
  },
  'Fuse Street': {
    title: 'THE LAST FIVE SECONDS',
    scene: 'A countdown has been painted on the street. The Riot Saints call it performance art. The tram full of passengers approaching calls it something else.',
    choices: [
      { id: 'fuse-evacuate', label: 'Clear the tram', outcome: 'The passengers survive, and one grateful medic reinforces your team (+1 HP).', standing: 1, heat: 0, terms: { playerHp: 1 } },
      { id: 'fuse-rewire', label: 'Turn the blast into a spectacle', outcome: 'Everyone runs to watch; enemy equipment gets wrecked (−1 armor), and the authorities give chase (+2 heat).', standing: 1, heat: 2, terms: { enemyArmor: -1 } },
    ],
  },
  'Hiss Row': {
    title: 'THE CLONE IN THE WINDOW',
    scene: 'A glass-front shop displays an identical copy of a missing catgirl. A Riot Saint offers to break the locks while the alarm is sleeping.',
    choices: [
      { id: 'hiss-rescue', label: 'Free the copy', outcome: 'A grateful clone shares illegal tactical upgrades (+1 opening mana). The lab sends patrols (+1 heat).', standing: 1, heat: 1, terms: { playerMana: 1 } },
      { id: 'hiss-bargain', label: 'Blackmail the lab instead', outcome: 'Their guards sabotage their own plating (−1 rival armor), but the local crew hates the bargain.', standing: -2, heat: 0, terms: { enemyArmor: -1 } },
    ],
  },
  'Spike Stair': {
    title: 'THE ROOFTOP FEEDBACK',
    scene: 'Bloodfairies have wired the entire staircase into a giant electric instrument. The first chord is about to short out a crowded apartment block.',
    choices: [
      { id: 'spike-protect', label: 'Ground the live wire', outcome: 'The fairies call you a hero (+2 standing), then turn up their volume in the next bout (+1 rival mana).', standing: 2, heat: 1, terms: { enemyMana: 1 } },
      { id: 'spike-steal', label: 'Pocket their amplifier', outcome: 'You can fight with an extra mana, but the punk crowd boos your entrance (−1 standing).', standing: -1, heat: 0, terms: { playerMana: 1 } },
    ],
  },
  'Gilt Gate': {
    title: 'THE DEBT PARADE',
    scene: 'A procession of debtors carries enormous gold receipts past the market gates. The collector has a pen that writes signatures by itself.',
    choices: [
      { id: 'gilt-unmask', label: 'Expose the forged signatures', outcome: 'The street cheers (+2 standing), and the Exchange sends more guards after you (+2 heat).', standing: 2, heat: 2, terms: { enemyMana: 1 } },
      { id: 'gilt-bribe', label: 'Buy the collector’s silence', outcome: 'You get a stronger opening hand (+2 mana) while the neighborhood learns who paid (−1 standing).', standing: -1, heat: 0, terms: { playerMana: 2 } },
    ],
  },
  'Coolant Culvert': {
    title: 'THE FLOODGATE MUTINY',
    scene: 'Toxic coolant rises around a stranded ogre mechanic. The emergency valve can save her, or wash the rival patrol off its feet.',
    choices: [
      { id: 'coolant-save', label: 'Lift the mechanic to safety', outcome: 'She reinforces your starters (+1 HP) and the workers spread your name (+1 standing).', standing: 1, heat: 1, terms: { playerHp: 1 } },
      { id: 'coolant-flush', label: 'Flood the patrol corridor', outcome: 'Enemy armor corrodes (−1 armor), but the Foundry crews call it a betrayal (−1 standing).', standing: -1, heat: 0, terms: { enemyArmor: -1 } },
    ],
  },
  'Ledger Sewer': {
    title: 'THE UNDERGROUND AUDIT',
    scene: 'A sewer bookmaker offers proof that the city’s poorest residents owe debts to people who died years ago. A gold-helmeted auditor is already on the stairs.',
    choices: [
      { id: 'ledger-publish', label: 'Broadcast the ledger', outcome: 'Families rally behind you (+2 standing), and the Exchange puts a price on your head (+2 heat).', standing: 2, heat: 2, terms: { playerMana: 1 } },
      { id: 'ledger-trade', label: 'Trade it for safe passage', outcome: 'Your next opening squad gets protective gear (+1 HP), but no citizen sees the evidence (−1 standing).', standing: -1, heat: 0, terms: { playerHp: 1 } },
    ],
  },
}

export function streetStory(city: CityState): StreetStory | null {
  return city.pendingStreet ? (STREET_STORIES[city.pendingStreet] ?? null) : null
}

export const CITY_PLAN: Record<DistrictId, DistrictPlan> = {
  pitworks: {
    id: 'pitworks',
    street: 'Arena Ring Road',
    scene:
      'The Pitworks bookmakers chalk a bracket on the wall: beat three district champions and the Grand Pit opens.',
    rival: {
      name: 'Grandmaster Gutterball',
      title: 'Undefeated keeper of the Grand Pit',
      team: 'exchange',
      mode: 'blackout',
      taunt: 'Three wins and you can stand in my shadow.',
    },
    choices: [
      {
        id: 'pit-crowd',
        label: 'Play to the crowd',
        outcome: 'The stands love you: start your bout with 1 extra mana.',
        standing: 1,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'pit-scout',
        label: 'Scout the Grandmaster',
        outcome: 'You learn the pit: the bout runs 4 rounds longer.',
        standing: 0,
        heat: 0,
        terms: { rounds: 4 },
      },
    ],
    gate: { cleared: 3, reason: 'Beat three district champions first.' },
  },
  chimera: {
    id: 'chimera',
    street: 'Splice Avenue',
    scene:
      'A lab alarm wails over Chimera Heights. Escaped catgirls are hiding a crate of reknit serum from the guards.',
    rival: {
      name: 'Calico Nine',
      title: 'Ninth-life sentinel of the Gene Riot',
      team: 'catgirls',
      mode: 'blackout',
      taunt: 'You have one life. Spend it carefully.',
    },
    choices: [
      {
        id: 'chimera-serum',
        label: 'Help hide the serum',
        outcome:
          'The Gene Riot owes you: your starting fighters get +1 HP, but the lab marks your face (+1 heat).',
        standing: 1,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'chimera-guards',
        label: 'Tip off the lab guards',
        outcome:
          'The guards thin the sentinels (Calico starts one fighter short), and the district will not forget it.',
        standing: -2,
        heat: -1,
        terms: { fewerRivals: 1 },
      },
    ],
  },
  needles: {
    id: 'needles',
    street: 'Spike Stair',
    scene:
      'A rooftop mosh in Needle Alley spills into the street. The Bloodfairies want a headliner; the landlords want quiet.',
    rival: {
      name: 'Mx. Thimble Vex',
      title: 'Razorwing captain of Needle Alley',
      team: 'bloodfairies',
      mode: 'bloodrush',
      taunt: 'Keep up or get stitched.',
    },
    choices: [
      {
        id: 'needles-headline',
        label: 'Headline the mosh',
        outcome:
          'The swarm respects you, but they come at you fresh: Thimble starts with 2 extra mana.',
        standing: 2,
        heat: 1,
        terms: { enemyMana: 2 },
      },
      {
        id: 'needles-landlords',
        label: 'Take the landlords’ bribe',
        outcome:
          'You start with 2 extra mana. The fairies boo you off the roof.',
        standing: -1,
        heat: 0,
        terms: { playerMana: 2 },
      },
    ],
    gate: { standing: 1, reason: 'Make one friend in the city first.' },
  },
  foundry: {
    id: 'foundry',
    street: 'Slag Causeway',
    scene:
      'The Foundry whistle blows a strike. Ironjaw ogres block the gates while the owners hire scabs.',
    rival: {
      name: 'Forewoman Rivet',
      title: 'Strike boss of the Ironjaw line',
      team: 'ironjaw',
      mode: 'gridiron',
      taunt: 'Nobody crosses this picket. Nobody.',
    },
    choices: [
      {
        id: 'foundry-picket',
        label: 'Join the picket',
        outcome:
          'Rivet salutes you and still fights hard, but her plating is half-forged (rival armor −1).',
        standing: 1,
        heat: 1,
        terms: { enemyArmor: -1 },
      },
      {
        id: 'foundry-scab',
        label: 'Cross the line for the owners',
        outcome:
          'The owners pay in mana (+1), and Rivet bolts on extra chrome (+1 armor).',
        standing: -2,
        heat: -1,
        terms: { playerMana: 1, enemyArmor: 1 },
      },
    ],
  },
  undertow: {
    id: 'undertow',
    street: 'The Long Drain',
    scene:
      'In the Undertow every grate has an ear. An informant offers you the map of tonight’s tripwires, for a price.',
    rival: {
      name: 'The Drain Oracle',
      title: 'Spymaster of Undertow Intelligence',
      team: 'undertow',
      mode: 'blackout',
      taunt: 'I watched you choose. I know where you’ll step.',
    },
    choices: [
      {
        id: 'undertow-buy',
        label: 'Buy the tripwire map',
        outcome:
          'No surprise trap waits for you, and the spies note a paying customer (+1 heat).',
        standing: 0,
        heat: 1,
        terms: {},
      },
      {
        id: 'undertow-refuse',
        label: 'Refuse and walk in blind',
        outcome:
          'The Oracle respects nerve, but a trap is already armed mid-field.',
        standing: 1,
        heat: 0,
        terms: { rivalTrap: true },
      },
    ],
  },
  crown: {
    id: 'crown',
    street: 'Gilt Gate',
    scene:
      'Crown Market sells everything, including your debts. Auditor Gilt offers a contract with very small print.',
    rival: {
      name: 'Auditor Prime Gilt',
      title: 'Collections chief of the Meat Exchange',
      team: 'exchange',
      mode: 'gridiron',
      taunt: 'Your losses have already been invoiced.',
    },
    choices: [
      {
        id: 'crown-sign',
        label: 'Sign the contract',
        outcome:
          'Start with 3 extra mana. The Exchange now holds your paper (+2 heat).',
        standing: 0,
        heat: 2,
        terms: { playerMana: 3 },
      },
      {
        id: 'crown-burn',
        label: 'Burn the contract in public',
        outcome:
          'The market cheers and the Auditor is furious: her opening runners carry +1 armor.',
        standing: 2,
        heat: 1,
        terms: { enemyArmor: 1 },
      },
    ],
    gate: { standing: 3, reason: 'The Gilt Gate opens for 3 standing.' },
  },
  redline: {
    id: 'redline',
    street: 'Fuse Street',
    scene:
      'Redline Riot is rigging a block party with illegal fireworks. The Riot Saints want a partner for the grand finale.',
    rival: {
      name: 'Saint Kaboom',
      title: 'Patron saint of bad ideas',
      team: 'riot',
      mode: 'bloodrush',
      taunt: 'Stand closer. It’s safer. Probably.',
    },
    choices: [
      {
        id: 'redline-light',
        label: 'Light the finale',
        outcome:
          'Glorious. Everybody comes out a little singed: the bout is 30 ticks shorter.',
        standing: 1,
        heat: 1,
        terms: { rounds: -30 },
      },
      {
        id: 'redline-defuse',
        label: 'Quietly defuse it',
        outcome:
          'You keep your eyebrows (+1 HP to your starters); the Saints call you a wet blanket.',
        standing: -1,
        heat: -1,
        terms: { playerHp: 1 },
      },
    ],
  },
}

export interface CityState {
  location: DistrictId
  nights: number
  standing: Record<DistrictId, number>
  heat: number
  choices: Partial<Record<DistrictId, string>>
  streetChoices: Record<string, string>
  streetTerms: Partial<Record<DistrictId, BoutTerms>>
  pendingStreet: string | null
  cleared: DistrictId[]
  losses: number
  log: string[]
}

export const HEAT_LIMIT = 3

const IDS = Object.keys(CITY_PLAN) as DistrictId[]

export function createCity(): CityState {
  return {
    location: 'pitworks',
    nights: 0,
    standing: Object.fromEntries(IDS.map((id) => [id, 0])) as Record<
      DistrictId,
      number
    >,
    heat: 0,
    choices: {},
    streetChoices: {},
    streetTerms: {},
    pendingStreet: null,
    cleared: [],
    losses: 0,
    log: ['You arrive in the Pitworks with a deck and no reputation.'],
  }
}

function copyCity(city: CityState): CityState {
  return {
    ...city,
    standing: { ...city.standing },
    choices: { ...city.choices },
    streetChoices: { ...city.streetChoices },
    streetTerms: Object.fromEntries(Object.entries(city.streetTerms).map(([id, terms]) => [id, { ...terms }])),
    cleared: [...city.cleared],
    log: [...city.log],
  }
}

function note(city: CityState, line: string): void {
  city.log = [line, ...city.log].slice(0, 30)
}

/** Reputation across the city; selling out one district costs you overall. */
export function totalStanding(city: CityState): number {
  return IDS.reduce((sum, id) => sum + city.standing[id], 0)
}

export function streetsFrom(id: DistrictId): {
  to: DistrictId
  street: string
}[] {
  return STREETS.flatMap(([a, b, street]) =>
    a === id ? [{ to: b, street }] : b === id ? [{ to: a, street }] : [],
  )
}

/** Why a district is closed right now, or null when it is open. */
export function gateReason(city: CityState, id: DistrictId): string | null {
  const gate = CITY_PLAN[id].gate
  if (!gate) return null
  if (gate.standing !== undefined && totalStanding(city) < gate.standing)
    return gate.reason
  if (gate.cleared !== undefined && city.cleared.length < gate.cleared)
    return gate.reason
  return null
}

/** Why this district's rival will not fight you now, or null. */
export function boutBlocked(city: CityState, id: DistrictId): string | null {
  if (city.pendingStreet) return 'Settle the street encounter first.'
  if (city.cleared.includes(id)) return 'Already beaten.'
  return gateReason(city, id)
}

/** Walk one street to a neighbouring district. */
export function travel(city: CityState, to: DistrictId): CityState {
  if (city.pendingStreet) return city
  const route = streetsFrom(city.location).find((s) => s.to === to)
  if (!route) return city
  const next = copyCity(city)
  next.location = to
  next.nights++
  if (!next.streetChoices[route.street]) next.pendingStreet = route.street
  note(
    next,
    'You take ' +
      route.street +
      ' to ' +
      CITY_PLAN[to].rival.title +
      '’s turf.',
  )
  return next
}

/** Make this district's street decision. Each district decides once. */
export function decide(city: CityState, choiceId: string): CityState {
  const plan = CITY_PLAN[city.location]
  const choice = plan.choices.find((c) => c.id === choiceId)
  if (!choice || city.choices[city.location] || city.pendingStreet) return city
  if (gateReason(city, city.location)) return city
  const next = copyCity(city)
  next.choices[city.location] = choice.id
  next.standing[city.location] += choice.standing
  next.heat = Math.max(0, next.heat + choice.heat)
  note(next, choice.label + ': ' + choice.outcome)
  return next
}

function mergeTerms(a: BoutTerms, b: BoutTerms): BoutTerms {
  const result = { ...a }
  for (const key of ['playerMana', 'enemyMana', 'enemyArmor', 'playerHp', 'fewerRivals', 'rounds'] as const) {
    if (b[key] !== undefined) result[key] = (a[key] ?? 0) + b[key]
  }
  if (a.rivalTrap || b.rivalTrap) result.rivalTrap = true
  return result
}

/** Resolve the first-crossing story before walking or fighting again. */
export function decideStreet(city: CityState, choiceId: string): CityState {
  const street = city.pendingStreet
  if (!street || city.streetChoices[street]) return city
  const choice = STREET_STORIES[street]?.choices.find((c) => c.id === choiceId)
  if (!choice) return city
  const next = copyCity(city)
  next.pendingStreet = null
  next.streetChoices[street] = choiceId
  next.standing[next.location] += choice.standing
  next.heat = Math.max(0, next.heat + choice.heat)
  next.streetTerms[next.location] = mergeTerms(next.streetTerms[next.location] ?? {}, choice.terms)
  note(next, STREET_STORIES[street]!.title + ': ' + choice.outcome)
  return next
}

export function chosen(
  city: CityState,
  id: DistrictId,
): StreetChoice | undefined {
  return CITY_PLAN[id].choices.find((c) => c.id === city.choices[id])
}

/** Terms for this district's rival bout, including citywide heat. */
export function boutTerms(city: CityState, id: DistrictId): BoutTerms {
  const terms = mergeTerms(chosen(city, id)?.terms ?? {}, city.streetTerms[id] ?? {})
  // Too much heat: Meat Exchange enforcers bankroll every rival.
  if (city.heat >= HEAT_LIMIT) terms.enemyMana = (terms.enemyMana ?? 0) + 1
  return terms
}

/** Apply bout terms to a freshly created match (pure: returns a copy). */
export function applyTerms(match: MatchState, terms: BoutTerms): MatchState {
  const next: MatchState = {
    ...match,
    units: match.units.map((u) => ({ ...u })),
    traps: match.traps.map((t) => ({ ...t })),
    log: [...match.log],
  }
  next.mana = Math.max(0, next.mana + (terms.playerMana ?? 0))
  next.enemyMana = Math.max(0, next.enemyMana + (terms.enemyMana ?? 0))
  next.maxRounds = Math.max(8, next.maxRounds + (terms.rounds ?? 0))
  for (const u of next.units) {
    if (u.side === 'enemy' && terms.enemyArmor)
      u.armor = Math.max(0, u.armor + terms.enemyArmor)
    if (u.side === 'player' && terms.playerHp) {
      u.maxHp += terms.playerHp
      u.hp += terms.playerHp
    }
  }
  if (terms.fewerRivals && next.mode === 'blackout') {
    const rivals = next.units.filter((u) => u.side === 'enemy')
    const drop = new Set(
      rivals
        .slice(0, Math.min(terms.fewerRivals, rivals.length - 1))
        .map((u) => u.id),
    )
    next.units = next.units.filter((u) => !drop.has(u.id))
  }
  if (terms.rivalTrap) {
    const x = Math.floor(next.width / 2)
    const y = Math.floor(next.height / 2)
    if (!next.traps.some((t) => t.side === 'enemy'))
      next.traps.push({ x, y, side: 'enemy', damage: 2 })
  }
  next.log = ['District terms applied.', ...next.log]
  return next
}

/** Record a finished rival bout and its consequences. */
export function recordBout(
  city: CityState,
  id: DistrictId,
  result: 'player' | 'enemy' | 'draw',
): CityState {
  if (city.cleared.includes(id)) return city
  const next = copyCity(city)
  const rival = CITY_PLAN[id].rival.name
  if (result === 'player') {
    next.cleared.push(id)
    next.standing[id] += 1
    note(next, 'You beat ' + rival + '. ' + CITY_PLAN[id].street + ' is yours.')
  } else if (result === 'enemy') {
    next.losses++
    next.heat++
    note(next, rival + ' beats you. Word spreads (+1 heat).')
  } else note(next, 'You and ' + rival + ' fight to a standstill.')
  return next
}

/** The city campaign is won by beating the Grand Pit's keeper. */
export function cityWon(city: CityState): boolean {
  return city.cleared.includes('pitworks')
}

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

/** Where each rival faction can be confronted in the seven-district city. */
export const CAMPAIGN_DISTRICTS: Record<TeamId, DistrictId> = {
  catgirls: 'chimera',
  bloodfairies: 'needles',
  ironjaw: 'foundry',
  riot: 'redline',
  undertow: 'undertow',
  exchange: 'crown',
}

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
    scene:
      'A stolen ambulance full of experimental serum slides toward a cordon of corporate gene-hunters. A pair of catgirls wave you into the crossfire.',
    choices: [
      {
        id: 'splice-smuggle',
        label: 'Drive the serum to safety',
        outcome:
          'The escapees will remember. Your next neighborhood fight gains +1 HP, but the hunters put out your face (+1 heat).',
        standing: 1,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'splice-decoy',
        label: 'Release the decoy drones',
        outcome:
          'The guards scatter, thinning their field defenses, but the fugitives mistrust the tactic (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  'Slag Causeway': {
    title: 'THE PICKET LINE',
    scene:
      'Chrome ogre workers link arms across the furnace bridge. Their bosses send a payroll drone with an offer of easy credits and no witnesses.',
    choices: [
      {
        id: 'slag-union',
        label: 'Protect the strikers',
        outcome:
          'One worker loans you an extra opening mana. The factory identifies you as a troublemaker (+1 heat).',
        standing: 1,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'slag-payroll',
        label: 'Deliver the owners’ message',
        outcome:
          'A private mechanic patches your starters (+1 HP). You lose the workers’ trust (−2 standing).',
        standing: -2,
        heat: -1,
        terms: { playerHp: 1 },
      },
    ],
  },
  'The Long Drain': {
    title: 'THE WHISPER TAX',
    scene:
      'Under the road, a frog courier opens a grate and offers a genuine spy map. From the dark behind him, something asks who sent you.',
    choices: [
      {
        id: 'drain-protect',
        label: 'Hide the courier',
        outcome:
          'The spies owe you a favor: +1 opening mana. Somebody reports the exchange (+1 heat).',
        standing: 1,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'drain-trace',
        label: 'Follow the second voice',
        outcome:
          'You spot where the ambush lies, but the city’s informants mark you as reckless.',
        standing: -1,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  'Fuse Street': {
    title: 'THE LAST FIVE SECONDS',
    scene:
      'A countdown has been painted on the street. The Riot Saints call it performance art. The tram full of passengers approaching calls it something else.',
    choices: [
      {
        id: 'fuse-evacuate',
        label: 'Clear the tram',
        outcome:
          'The passengers survive, and one grateful medic reinforces your team (+1 HP).',
        standing: 1,
        heat: 0,
        terms: { playerHp: 1 },
      },
      {
        id: 'fuse-rewire',
        label: 'Turn the blast into a spectacle',
        outcome:
          'Everyone runs to watch; enemy equipment gets wrecked (−1 armor), and the authorities give chase (+2 heat).',
        standing: 1,
        heat: 2,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  'Hiss Row': {
    title: 'THE CLONE IN THE WINDOW',
    scene:
      'A glass-front shop displays an identical copy of a missing catgirl. A Riot Saint offers to break the locks while the alarm is sleeping.',
    choices: [
      {
        id: 'hiss-rescue',
        label: 'Free the copy',
        outcome:
          'A grateful clone shares illegal tactical upgrades (+1 opening mana). The lab sends patrols (+1 heat).',
        standing: 1,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'hiss-bargain',
        label: 'Blackmail the lab instead',
        outcome:
          'Their guards sabotage their own plating (−1 rival armor), but the local crew hates the bargain.',
        standing: -2,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  'Spike Stair': {
    title: 'THE ROOFTOP FEEDBACK',
    scene:
      'Bloodfairies have wired the entire staircase into a giant electric instrument. The first chord is about to short out a crowded apartment block.',
    choices: [
      {
        id: 'spike-protect',
        label: 'Ground the live wire',
        outcome:
          'The fairies call you a hero (+2 standing), then turn up their volume in the next bout (+1 rival mana).',
        standing: 2,
        heat: 1,
        terms: { enemyMana: 1 },
      },
      {
        id: 'spike-steal',
        label: 'Pocket their amplifier',
        outcome:
          'You can fight with an extra mana, but the punk crowd boos your entrance (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { playerMana: 1 },
      },
    ],
  },
  'Gilt Gate': {
    title: 'THE DEBT PARADE',
    scene:
      'A procession of debtors carries enormous gold receipts past the market gates. The collector has a pen that writes signatures by itself.',
    choices: [
      {
        id: 'gilt-unmask',
        label: 'Expose the forged signatures',
        outcome:
          'The street cheers (+2 standing), and the Exchange sends more guards after you (+2 heat).',
        standing: 2,
        heat: 2,
        terms: { enemyMana: 1 },
      },
      {
        id: 'gilt-bribe',
        label: 'Buy the collector’s silence',
        outcome:
          'You get a stronger opening hand (+2 mana) while the neighborhood learns who paid (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { playerMana: 2 },
      },
    ],
  },
  'Coolant Culvert': {
    title: 'THE FLOODGATE MUTINY',
    scene:
      'Toxic coolant rises around a stranded ogre mechanic. The emergency valve can save her, or wash the rival patrol off its feet.',
    choices: [
      {
        id: 'coolant-save',
        label: 'Lift the mechanic to safety',
        outcome:
          'She reinforces your starters (+1 HP) and the workers spread your name (+1 standing).',
        standing: 1,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'coolant-flush',
        label: 'Flood the patrol corridor',
        outcome:
          'Enemy armor corrodes (−1 armor), but the Foundry crews call it a betrayal (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  'Ledger Sewer': {
    title: 'THE UNDERGROUND AUDIT',
    scene:
      'A sewer bookmaker offers proof that the city’s poorest residents owe debts to people who died years ago. A gold-helmeted auditor is already on the stairs.',
    choices: [
      {
        id: 'ledger-publish',
        label: 'Broadcast the ledger',
        outcome:
          'Families rally behind you (+2 standing), and the Exchange puts a price on your head (+2 heat).',
        standing: 2,
        heat: 2,
        terms: { playerMana: 1 },
      },
      {
        id: 'ledger-trade',
        label: 'Trade it for safe passage',
        outcome:
          'Your next opening squad gets protective gear (+1 HP), but no citizen sees the evidence (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { playerHp: 1 },
      },
    ],
  },
}

/** A district championship has a human consequence, not merely a cleared badge. */
export const CHAMPION_AFTERMATH: Record<DistrictId, StreetStory> = {
  pitworks: {
    title: 'THE CROWN IS MADE OF TEETH',
    scene:
      'Gutterball drops the city crown at your feet. The arena crowd chants for a ruler; the maintenance crews chant for a door they can finally open.',
    choices: [
      {
        id: 'pit-open',
        label: 'Open the gates to everyone',
        outcome:
          'Workers run the arena (+2 standing). The old owners send collectors (+1 heat). Your encore crew gains +1 HP.',
        standing: 2,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'pit-crown',
        label: 'Auction the crown to the stands',
        outcome:
          'The crowd laughs until the landlords recognize you (−1 standing, −1 heat). Your encore begins with +1 mana.',
        standing: -1,
        heat: -1,
        terms: { playerMana: 1 },
      },
    ],
  },
  chimera: {
    title: 'THE LAB DOORS ARE STILL LOCKED',
    scene:
      'The Gene Riot champion falls. Behind the cheering comes a quieter noise: engineered siblings calling from behind the clinic shutters.',
    choices: [
      {
        id: 'chimera-free',
        label: 'Break the locks',
        outcome:
          'Families reunite (+2 standing), the gene-hunters return (+1 heat), and a medic gives your encore fighters +1 HP.',
        standing: 2,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'chimera-files',
        label: 'Steal the experiment records',
        outcome:
          'You get the lab security codes (enemy −1 armor in the encore), but abandon the captives (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  needles: {
    title: 'THE AFTERPARTY NEEDS A HOME',
    scene:
      'The Bloodfairies have won back their stage and lost their last safe roof. A demolition drone hovers over the dance floor.',
    choices: [
      {
        id: 'needles-roof',
        label: 'Stand between the drone and the dancers',
        outcome:
          'The district joins your side (+2 standing), and the demolition firm marks you (+1 heat). Your encore starts with +1 mana.',
        standing: 2,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'needles-stage',
        label: 'Hijack the drone for a light show',
        outcome:
          'The crowd gets a glorious finale; city brokers buy your silence (−1 standing, −1 heat). Enemy encore armor falls by 1.',
        standing: -1,
        heat: -1,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  foundry: {
    title: 'THE FURNACES KEEP BURNING',
    scene:
      'Ironjaw’s machines are yours to stop or restart. Workers in heatproof aprons wait to learn who now owns their shifts.',
    choices: [
      {
        id: 'foundry-coop',
        label: 'Hand the keys to the workers',
        outcome:
          'Union crews rebuild your armor (+2 standing, +1 HP in the encore). Management retaliates (+1 heat).',
        standing: 2,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'foundry-scrap',
        label: 'Sell the chrome to pay the debts',
        outcome:
          'Creditors back off (−1 heat), but the workers feel sold out (−1 standing). Your encore starts with +1 mana.',
        standing: -1,
        heat: -1,
        terms: { playerMana: 1 },
      },
    ],
  },
  undertow: {
    title: 'THE SPIES LEFT THEIR NAMES BEHIND',
    scene:
      'The sewer intelligence vault unlocks. Its files name everyone who ever hid a fugitive in this city, including people who trusted you.',
    choices: [
      {
        id: 'undertow-burn',
        label: 'Burn the files in the canal',
        outcome:
          'The neighborhoods trust you (+2 standing). The spies know it was you (+1 heat). Your encore begins with +1 mana.',
        standing: 2,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'undertow-keep',
        label: 'Keep one secret weapon',
        outcome:
          'You learn the defenses (enemy −1 armor in the encore), but your silence costs trust (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  crown: {
    title: 'EVERY RECEIPT IS A HOSTAGE',
    scene:
      'The Meat Exchange’s vault is full of contracts signed by people who never got to read them. The debt clock still ticks.',
    choices: [
      {
        id: 'crown-forgive',
        label: 'Cancel the neighborhoods’ debts',
        outcome:
          'You gain +2 standing and a loyal medic (+1 HP in the encore), but the owners launch a manhunt (+2 heat).',
        standing: 2,
        heat: 2,
        terms: { playerHp: 1 },
      },
      {
        id: 'crown-broker',
        label: 'Trade the debt book for protection',
        outcome:
          'The collectors leave you alone (−2 heat). The streets see the betrayal (−2 standing). Your encore starts with +1 mana.',
        standing: -2,
        heat: -2,
        terms: { playerMana: 1 },
      },
    ],
  },
  redline: {
    title: 'THE RIOT HAS NO EXIT',
    scene:
      'The Riot Saints leave you their detonator and a tram full of terrified witnesses. The cameras have already begun to roll.',
    choices: [
      {
        id: 'redline-disarm',
        label: 'Cut the fuse and lead everyone out',
        outcome:
          'The city cheers (+2 standing) and the bomb makers come after you (+1 heat). Encore fighters gain +1 HP.',
        standing: 2,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'redline-broadcast',
        label: 'Broadcast the villains’ confession',
        outcome:
          'The authorities lower your heat (−1), but the witnesses accuse you of using them (−1 standing). Enemy encore armor drops by 1.',
        standing: -1,
        heat: -1,
        terms: { enemyArmor: -1 },
      },
    ],
  },
}

export function championAftermath(city: CityState): StreetStory | null {
  return city.pendingAftermath
    ? CHAMPION_AFTERMATH[city.pendingAftermath]
    : null
}

export interface CivicCrisis extends StreetStory {
  id: string
  afterChampions: number
}

/** The city's response escalates after two, four and six championship wins. */
export const CIVIC_CRISES: [CivicCrisis, CivicCrisis, CivicCrisis] = [
  {
    id: 'broadcast',
    afterChampions: 2,
    title: 'THE CITY IS WATCHING',
    scene:
      'Every stolen billboard lights up with a masked announcer: the Meat Exchange has declared your victories a public safety threat. The slums are listening. So are the debt collectors.',
    choices: [
      {
        id: 'broadcast-truth',
        label: 'Hijack the signal and expose the rigged fights',
        outcome:
          'The neighborhoods trust you (+2 standing). The Exchange sends hunters (+1 heat). Your city battles start with +1 mana.',
        standing: 2,
        heat: 1,
        terms: { playerMana: 1 },
      },
      {
        id: 'broadcast-deal',
        label: 'Accept the broadcaster’s protection contract',
        outcome:
          'The cameras leave you alone (−1 heat), but the people call you bought (−1 standing). Your city fighters gain +1 HP.',
        standing: -1,
        heat: -1,
        terms: { playerHp: 1 },
      },
    ],
  },
  {
    id: 'strike',
    afterChampions: 4,
    title: 'THE CITYWIDE WALKOUT',
    scene:
      'Four fallen champions are enough. Chrome ogres shut the furnaces, catgirl medics walk off the lab floors, and bloodfairy couriers refuse the corporate routes. Who gets your support?',
    choices: [
      {
        id: 'strike-solidarity',
        label: 'Protect the workers’ relief caravans',
        outcome:
          'The alliance grows (+2 standing). Bosses put your name on every gate (+1 heat). Your city fighters gain +1 HP.',
        standing: 2,
        heat: 1,
        terms: { playerHp: 1 },
      },
      {
        id: 'strike-corridors',
        label: 'Trade convoy access for tactical maps',
        outcome:
          'Your next rivals are exposed (−1 enemy armor in city battles), but the districts lose confidence (−1 standing).',
        standing: -1,
        heat: 0,
        terms: { enemyArmor: -1 },
      },
    ],
  },
  {
    id: 'grid',
    afterChampions: 6,
    title: 'THE LAST LIGHT IN SLIME CITY',
    scene:
      'With six champions beaten, the Exchange cuts power to every district except the Grand Pit. Neon towers go dark. The crown is waiting, but the city still needs electricity.',
    choices: [
      {
        id: 'grid-neighborhoods',
        label: 'Return the stolen current to the streets',
        outcome:
          'The city answers your call (+2 standing, +2 heat). You gain +1 opening mana in city battles as crews share generators.',
        standing: 2,
        heat: 2,
        terms: { playerMana: 1 },
      },
      {
        id: 'grid-arena',
        label: 'Feed the power into the Grand Pit',
        outcome:
          'The Exchange lowers the heat (−2), but the districts remember the blackout (−2 standing). Your city fighters gain +2 HP.',
        standing: -2,
        heat: -2,
        terms: { playerHp: 2 },
      },
    ],
  },
]

/** Only one civic crisis is active; street and championship scenes go first. */
export function cityCrisis(city: CityState): CivicCrisis | null {
  if (city.pendingStreet || city.pendingAftermath) return null
  return (
    CIVIC_CRISES.find(
      (crisis) =>
        city.cleared.length >= crisis.afterChampions &&
        !city.crisisChoices[crisis.id],
    ) ?? null
  )
}

export function decideCrisis(city: CityState, choiceId: string): CityState {
  const crisis = cityCrisis(city)
  const choice = crisis?.choices.find((entry) => entry.id === choiceId)
  if (!crisis || !choice) return city
  const next = copyCity(city)
  next.crisisChoices[crisis.id] = choice.id
  next.standing[next.location] += choice.standing
  next.heat = Math.max(0, next.heat + choice.heat)
  next.crisisTerms = mergeTerms(next.crisisTerms, choice.terms)
  note(next, crisis.title + ': ' + choice.outcome)
  return next
}

export function streetStory(city: CityState): StreetStory | null {
  return city.pendingStreet
    ? (STREET_STORIES[city.pendingStreet] ?? null)
    : null
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

/** Post-champion Blackout battles. These are session-local city stories, not
 * server-issued reward matches: they can never mint XP, Meat or cards. */
export interface CityContract {
  title: string
  briefing: string
  opponent: string
  team: TeamId
  terms: BoutTerms
  victory: string
  failure: string
  standing: number
  heat: number
}

export const CITY_CONTRACTS: Record<DistrictId, CityContract> = {
  pitworks: {
    title: 'THE LAST BELL',
    briefing:
      'The Grandmaster was only the doorman. A second Exchange squad owns the arena lights and demands one final bout in the dark.',
    opponent: 'The Night Shift',
    team: 'exchange',
    terms: { enemyMana: 2, playerMana: 1 },
    victory:
      'You cut the arena power contract. The city cheers and the debt collectors retreat.',
    failure:
      'The house keeps its lights on, and sends your name to collections.',
    standing: 3,
    heat: -2,
  },
  chimera: {
    title: 'THE DUPLICATE CLAUSE',
    briefing:
      'The lab has manufactured a replacement for Calico Nine. The clone is ordered to hunt down the originals before sunrise.',
    opponent: 'Copycat Zero',
    team: 'catgirls',
    terms: { enemyMana: 1, rounds: -2 },
    victory:
      'The clone chooses a name of her own. Chimera Heights becomes a little harder to own.',
    failure:
      'Gene hunters collect another sample and put your crew on their list.',
    standing: 2,
    heat: 0,
  },
  needles: {
    title: 'STITCH THE SKY',
    briefing:
      'A punk bloodfairy pirate choir is stealing the roof of the neighborhood, tile by tile. The chorus wants a fight.',
    opponent: 'Razorwing Choir',
    team: 'bloodfairies',
    terms: { enemyMana: 2, playerHp: 1 },
    victory:
      'The roofs stay put. The fairies dedicate their loudest song to you.',
    failure: 'The stolen rooftops become a new floating police checkpoint.',
    standing: 2,
    heat: -1,
  },
  foundry: {
    title: 'OVERTIME SHIFT',
    briefing:
      'Management has fitted the night crew with experimental riot plating. Forewoman Rivet asks you to help shut the line down.',
    opponent: 'The Steel Payroll',
    team: 'ironjaw',
    terms: { enemyArmor: 1, playerMana: 1 },
    victory:
      'The furnace workers reclaim the night shift and retire the armored payroll drones.',
    failure: 'Another shift clocks in beneath a corporate lockout.',
    standing: 2,
    heat: 0,
  },
  undertow: {
    title: 'FALSE FLAG FREQUENCY',
    briefing:
      'Someone is broadcasting orders in your voice through the drains. The Oracle offers one chance to silence the forgery.',
    opponent: 'The Echo Office',
    team: 'undertow',
    terms: { rivalTrap: true, playerMana: 1 },
    victory:
      'The surveillance feed goes silent. The neighborhood finally hears itself.',
    failure: 'The Echo Office records your tactics for tomorrow.',
    standing: 2,
    heat: -1,
  },
  crown: {
    title: 'THE LAST RECEIPT',
    briefing:
      'A contract written on human skin declares the whole market overdue. The Exchange sends its final auditors to collect.',
    opponent: 'The Liquidators',
    team: 'exchange',
    terms: { enemyMana: 2, playerHp: 1 },
    victory:
      'Every forged debt is torn up. The market starts remembering who actually owns it.',
    failure: 'A new interest charge appears next to your name.',
    standing: 2,
    heat: -2,
  },
  redline: {
    title: 'FIVE SECOND FUSE',
    briefing:
      'A Riot Saints splinter group has wired an entire block into a dare. The clock starts when you deploy.',
    opponent: 'The Unlicensed Finale',
    team: 'riot',
    terms: { rounds: -4, enemyMana: 1 },
    victory:
      'The crowd survives the show and chants your name through a siren chorus.',
    failure: 'The Saints sell footage of the catastrophe to every rival.',
    standing: 2,
    heat: 1,
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
  pendingAftermath: DistrictId | null
  aftermathChoices: Partial<Record<DistrictId, string>>
  crisisChoices: Record<string, string>
  crisisTerms: BoutTerms
  finaleChoice: string | null
  cleared: DistrictId[]
  contracts: DistrictId[]
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
    pendingAftermath: null,
    aftermathChoices: {},
    crisisChoices: {},
    crisisTerms: {},
    finaleChoice: null,
    cleared: [],
    contracts: [],
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
    aftermathChoices: { ...city.aftermathChoices },
    crisisChoices: { ...city.crisisChoices },
    crisisTerms: { ...city.crisisTerms },
    streetTerms: Object.fromEntries(
      Object.entries(city.streetTerms).map(([id, terms]) => [id, { ...terms }]),
    ),
    cleared: [...city.cleared],
    contracts: [...city.contracts],
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

/** Shortest navigable route on the nine two-way streets, with stable tie-breaking. */
export function cityRoute(
  from: DistrictId,
  to: DistrictId,
): { from: DistrictId; to: DistrictId; street: string }[] {
  if (from === to) return []
  const seen = new Set<DistrictId>([from])
  const queue: {
    at: DistrictId
    path: { from: DistrictId; to: DistrictId; street: string }[]
  }[] = [{ at: from, path: [] }]
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!
    for (const step of streetsFrom(current.at)) {
      if (seen.has(step.to)) continue
      const path = [
        ...current.path,
        { from: current.at, to: step.to, street: step.street },
      ]
      if (step.to === to) return path
      seen.add(step.to)
      queue.push({ at: step.to, path })
    }
  }
  return []
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
  if (city.pendingAftermath) return 'Resolve the champion aftermath first.'
  if (cityCrisis(city)) return 'Resolve the citywide crisis first.'
  if (cityFinale(city)) return 'Choose the fate of the Grand Pit first.'
  if (city.cleared.includes(id)) return 'Already beaten.'
  return gateReason(city, id)
}

/** A cleared district unlocks a single optional encore. Unresolved streets block it. */
export function contractBlocked(
  city: CityState,
  id: DistrictId,
): string | null {
  if (city.pendingStreet) return 'Settle the street encounter first.'
  if (city.pendingAftermath) return 'Resolve the champion aftermath first.'
  if (cityCrisis(city)) return 'Resolve the citywide crisis first.'
  if (cityFinale(city)) return 'Choose the fate of the Grand Pit first.'
  if (city.location !== id)
    return 'Walk to the district to accept its contract.'
  if (!city.cleared.includes(id)) return 'Beat the district champion first.'
  if (city.contracts.includes(id)) return 'Contract completed.'
  return null
}

/** District choices, street effects and contract difficulty all apply. */
export function contractTerms(city: CityState, id: DistrictId): BoutTerms {
  return mergeTerms(boutTerms(city, id), CITY_CONTRACTS[id].terms)
}

/** Walk one street to a neighbouring district. */
export function travel(city: CityState, to: DistrictId): CityState {
  if (
    city.pendingStreet ||
    city.pendingAftermath ||
    cityCrisis(city) ||
    cityFinale(city)
  )
    return city
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
  if (
    !choice ||
    city.choices[city.location] ||
    city.pendingStreet ||
    city.pendingAftermath
  )
    return city
  if (gateReason(city, city.location) || cityCrisis(city)) return city
  const next = copyCity(city)
  next.choices[city.location] = choice.id
  next.standing[city.location] += choice.standing
  next.heat = Math.max(0, next.heat + choice.heat)
  note(next, choice.label + ': ' + choice.outcome)
  return next
}

function mergeTerms(a: BoutTerms, b: BoutTerms): BoutTerms {
  const result = { ...a }
  for (const key of [
    'playerMana',
    'enemyMana',
    'enemyArmor',
    'playerHp',
    'fewerRivals',
    'rounds',
  ] as const) {
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
  next.streetTerms[next.location] = mergeTerms(
    next.streetTerms[next.location] ?? {},
    choice.terms,
  )
  note(next, STREET_STORIES[street]!.title + ': ' + choice.outcome)
  return next
}

/** The first championship victory opens one irreversible-in-session decision. */
export function decideAftermath(city: CityState, choiceId: string): CityState {
  const id = city.pendingAftermath
  if (!id || city.aftermathChoices[id]) return city
  const story = CHAMPION_AFTERMATH[id]
  const choice = story.choices.find((entry) => entry.id === choiceId)
  if (!choice) return city
  const next = copyCity(city)
  next.pendingAftermath = null
  next.aftermathChoices[id] = choiceId
  next.standing[id] += choice.standing
  next.heat = Math.max(0, next.heat + choice.heat)
  next.streetTerms[id] = mergeTerms(next.streetTerms[id] ?? {}, choice.terms)
  note(next, story.title + ': ' + choice.outcome)
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
  const terms = mergeTerms(
    city.crisisTerms,
    mergeTerms(chosen(city, id)?.terms ?? {}, city.streetTerms[id] ?? {}),
  )
  // Too much heat: Meat Exchange enforcers bankroll every rival.
  if (city.heat >= HEAT_LIMIT) terms.enemyMana = (terms.enemyMana ?? 0) + 1
  return terms
}

/**
 * A faction story battle launched FROM its district inherits the actual city
 * consequences. Launching from STORY remains a quick-start with only the
 * chosen chapter approach. This is a reversible playtest rule, not XP/Meat.
 */
export function storyMissionTerms(
  city: CityState,
  id: DistrictId,
  approach: BoutTerms,
): BoutTerms {
  return mergeTerms(approach, boutTerms(city, id))
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
  next.scenarioBonus = {
    playerHp: (next.scenarioBonus?.playerHp ?? 0) + (terms.playerHp ?? 0),
    enemyArmor: (next.scenarioBonus?.enemyArmor ?? 0) + (terms.enemyArmor ?? 0),
    fewerRivals:
      (next.scenarioBonus?.fewerRivals ?? 0) + (terms.fewerRivals ?? 0),
  }
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
    next.pendingAftermath = id
    next.standing[id] += 1
    note(next, 'You beat ' + rival + '. ' + CITY_PLAN[id].street + ' is yours.')
  } else if (result === 'enemy') {
    next.losses++
    next.heat++
    note(next, rival + ' beats you. Word spreads (+1 heat).')
  } else note(next, 'You and ' + rival + ' fight to a standstill.')
  return next
}

/** Record optional contract outcomes once; failed attempts can be replayed. */
export function recordContract(
  city: CityState,
  id: DistrictId,
  result: 'player' | 'enemy' | 'draw',
): CityState {
  if (contractBlocked(city, id)) return city
  const contract = CITY_CONTRACTS[id]
  const next = copyCity(city)
  if (result === 'player') {
    next.contracts.push(id)
    next.standing[id] += contract.standing
    next.heat = Math.max(0, next.heat + contract.heat)
    note(next, contract.title + ': ' + contract.victory)
  } else if (result === 'enemy') {
    next.losses++
    next.heat++
    note(next, contract.title + ': ' + contract.failure + ' (+1 heat)')
  } else note(next, contract.title + ': A draw. The contract stays open.')
  return next
}

export interface CityFinale {
  title: string
  scene: string
  choices: [StreetChoice, StreetChoice]
}

export interface CityEpilogue {
  title: string
  scene: string
  legacy: string
}

/** The winning city run deserves a final decision, not just a boolean. */
export const CITY_FINALE: CityFinale = {
  title: 'WHO OWNS THE PIT?',
  scene:
    'The keeper falls. Behind the Grand Pit throne are the deeds to every street, lab and furnace in Slime City. The Meat Exchange demands a new boss. The people outside the arena demand something stranger: a choice.',
  choices: [
    {
      id: 'pit-charter',
      label: 'Hand the keys to the neighborhoods',
      outcome:
        'A council of districts takes the city (+2 standing, −1 heat). Every future city bout gains +1 fighter HP.',
      standing: 2,
      heat: -1,
      terms: { playerHp: 1 },
    },
    {
      id: 'pit-crown',
      label: 'Take the throne and rewrite the rules yourself',
      outcome:
        'You become the new pit boss (+1 standing, +1 heat). Your remaining city fights start with +1 mana.',
      standing: 1,
      heat: 1,
      terms: { playerMana: 1 },
    },
  ],
}

/** Victory first resolves its champion aftermath and any newly triggered crisis. */
export function cityFinale(city: CityState): CityFinale | null {
  if (
    !cityWon(city) ||
    city.finaleChoice ||
    city.pendingStreet ||
    city.pendingAftermath ||
    cityCrisis(city)
  )
    return null
  return CITY_FINALE
}

export function decideFinale(city: CityState, choiceId: string): CityState {
  if (!cityFinale(city)) return city
  const choice = CITY_FINALE.choices.find((entry) => entry.id === choiceId)
  if (!choice) return city
  const next = copyCity(city)
  next.finaleChoice = choice.id
  next.standing.pitworks += choice.standing
  next.heat = Math.max(0, next.heat + choice.heat)
  next.crisisTerms = mergeTerms(next.crisisTerms, choice.terms)
  note(next, CITY_FINALE.title + ': ' + choice.outcome)
  return next
}

/** The ending remembers which citywide alliances the player actually made. */
export function cityEpilogue(city: CityState): CityEpilogue | null {
  if (!city.finaleChoice) return null
  const neighborhoodChoices = [
    'broadcast-truth',
    'strike-solidarity',
    'grid-neighborhoods',
  ].filter((choice) =>
    Object.values(city.crisisChoices).includes(choice),
  ).length
  const neighborhoods =
    neighborhoodChoices >= 2
      ? 'The neighborhoods have already learned to trust one another. They refuse to surrender their new solidarity.'
      : 'The neighborhoods are divided after the fighting. A fragile coalition must learn to trust itself.'
  return city.finaleChoice === 'pit-charter'
    ? {
        title: 'THE CITY THAT REFUSED A CROWN',
        scene:
          'You tear up the arena title deeds. Chimera clinics, bloodfairy couriers, ogre welders, spies and rioters all send delegates to a city council. The Meat Exchange can no longer sell streets by the kilogram.',
        legacy: neighborhoods,
      }
    : {
        title: 'LONG LIVE THE NEW PIT BOSS',
        scene:
          'You seize the control desk and turn the coliseum lights on every corrupt syndicate in town. The throne is yours, but a city ruled by one fighter has to live with that fighter’s next decision.',
        legacy: neighborhoods,
      }
}

/** The city campaign is won by beating the Grand Pit's keeper. */
export function cityWon(city: CityState): boolean {
  return city.cleared.includes('pitworks')
}

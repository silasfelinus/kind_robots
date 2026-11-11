// Campaign set pieces (conductor slime-city t-009): "a faction color is NOT a
// story". Every chapter of every crew campaign is fought on a battlefield
// built for that chapter's scene, with its own objective, before the
// conviction/cunning terms and any earned favor are added on top. The battlefield
// is board setup on the ordinary BLACKOUT engine (bases, round clock,
// pre-placed fighters, traps, mana, a giant beast) plus two engine hooks for
// the HOLD OUT bell and the HEIST vault. TURF story bouts have no bases or
// fighters to rebuild, so they play as written and the battlefield is not applied.
import {
  autoBattle,
  BASE_HP,
  cardById,
  placeFighter,
  seededHash,
  type MatchState,
  type Side,
  type Stance,
  type TeamId,
} from './prototypes'

/**
 * SMASH: the ordinary pit, on a rebuilt field. HEIST: the rival base cannot
 * be damaged, so carry their flag home before the bell. HOLD OUT: survive to
 * the bell with your base standing. BEAST: land the killing blow on the giant
 * in the arena.
 */
export type FieldObjective = 'smash' | 'heist' | 'holdout' | 'beast'

/** Columns count from your base (0) to the rival's (9); rows 0-5 from the top. */
export interface FieldFighter {
  side: Side
  card: string
  col: number
  row: number
  stance?: Stance
}

export interface FieldTrap {
  side: Side
  col: number
  row: number
  damage: number
  roots?: boolean
  debt?: number
}

export interface CampaignBattlefield {
  /** Short board name, e.g. "THE PAPER CATGIRL". */
  title: string
  objective: FieldObjective
  /** One or two in-world sentences: why this field looks the way it does. */
  briefing: string
  /** Absolute starting base HP (16 is standard). */
  bases?: Partial<Record<Side, number>>
  /** Absolute round limit (30 is standard). */
  rounds?: number
  fighters?: FieldFighter[]
  traps?: FieldTrap[]
  /** Starting mana added per side (may be negative; never below zero). */
  mana?: Partial<Record<Side, number>>
  /** BEAST: the giant standing in the middle of the arena. */
  beast?: {
    name: string
    hp: number
    attack: number
    armor: number
    /** Column it stands in (default: one of the two central columns). */
    col?: number
  }
}

export const OBJECTIVE_LABELS: Record<FieldObjective, string> = {
  smash: 'SMASH THE BASE',
  heist: 'HEIST · CARRY THEIR FLAG HOME',
  holdout: 'HOLD OUT · SURVIVE TO THE BELL',
  beast: 'BEAST · LAND THE KILLING BLOW',
}

export const OBJECTIVE_GOALS: Record<FieldObjective, string> = {
  smash:
    'Smash the rival base or carry their flag home. At the round limit the healthier base wins.',
  heist:
    'Their base cannot be damaged. Carry their flag back to your base before the round limit, or the bell goes to them.',
  holdout:
    'Keep your base standing until the round limit. If it still stands at the bell with your flag out of rival hands, you win.',
  beast:
    'Land the killing blow on the beast before the rival does. Smashing a base or a flag run still ends the bout.',
}

const ally = (card: string, col: number, row: number, stance?: Stance) =>
  ({ side: 'player', card, col, row, ...(stance ? { stance } : {}) }) as const
const rival = (card: string, col: number, row: number, stance?: Stance) =>
  ({ side: 'enemy', card, col, row, ...(stance ? { stance } : {}) }) as const
const mine = (
  side: Side,
  col: number,
  row: number,
  damage: number,
  extra: { roots?: boolean; debt?: number } = {},
): FieldTrap => ({ side, col, row, damage, ...extra })

/**
 * One authored battlefield per chapter, in chapter order. A crew with an
 * empty list fights its chapters on the standard field until it is written.
 */
export const CAMPAIGN_BATTLEFIELDS: Record<
  TeamId,
  readonly CampaignBattlefield[]
> = {
  catgirls: [
    {
      title: 'SAFEHOUSE ON CAMERA',
      objective: 'smash',
      briefing:
        'A Sewer Watcher is already halfway up the drain with its lens out. Calico Nine laid scent mines across the safehouse stoop before you arrived: one sniff and every camera in the gutter goes blurry.',
      fighters: [rival('watcher', 6, 2)],
      traps: [mine('player', 3, 2, 2), mine('player', 3, 3, 2)],
    },
    {
      title: 'THE PRINTING FLOOR',
      objective: 'smash',
      briefing:
        'The mold prints one last body before you cut the power. She climbs out dripping, blinks at Calico Nine and asks which side owns her. Nobody, sister. Grab a wrench. The forge walls are bolted double and the floor is wired with shock plates.',
      bases: { enemy: 20 },
      fighters: [ally('calico', 4, 2), rival('welder', 8, 3, 'defend')],
      traps: [mine('enemy', 5, 1, 2), mine('enemy', 5, 4, 2)],
    },
    {
      title: 'THE PAPER CATGIRL',
      objective: 'beast',
      briefing:
        'A forty-foot papier-mache catgirl wobbles down the boulevard, smiling, with a fuse where her tail should be. Whoever tears her down first decides which way the blast points: at the crowd, or at the gene bank gate.',
      beast: { name: 'The Paper Catgirl', hp: 14, attack: 3, armor: 0 },
    },
    {
      title: 'THE COURTHOUSE STEPS',
      objective: 'holdout',
      briefing:
        'Court is in session for ten rounds. The fairies want their blood-contracts out of the evidence and they brought the whole mosh to the steps. Keep the courthouse doors standing and every testimony stays whole.',
      rounds: 10,
      fighters: [rival('sprite', 6, 1), rival('sprite', 6, 4)],
    },
    {
      title: 'THE MIDNIGHT AUCTION',
      objective: 'heist',
      briefing:
        'The last page of the ledger sits behind the auctioneer, in a vault rated for the end of the world. Nobody is smashing that before midnight. Snatch the page (their flag) and run it home before the hammer falls. Mind the hidden fees on the auction floor.',
      rounds: 24,
      traps: [
        mine('enemy', 4, 1, 1, { debt: 1 }),
        mine('enemy', 5, 4, 1, { debt: 1 }),
      ],
    },
  ],
  bloodfairies: [
    {
      title: 'THE MUSIC HALL',
      objective: 'holdout',
      briefing:
        'The Anarkissed parked a wrecking ball outside a sold-out show and the audience refuses to leave mid-set. One pogo brat is already moshing at the stage door, and a whole Riot demolition crew is rolling up the street. Keep the hall standing until the encore and the wrecking ball becomes a stage prop.',
      rounds: 14,
      fighters: [
        ally('pogo', 1, 2, 'defend'),
        rival('firebrand', 6, 1),
        rival('kaboom', 6, 3),
        rival('firebrand', 6, 5),
      ],
      traps: [mine('enemy', 3, 1, 2), mine('enemy', 3, 4, 2)],
    },
    {
      title: 'THE COLLECTION JARS',
      objective: 'heist',
      briefing:
        'Your wounded are labelled and jarred somewhere behind the clinic doors, and the walls are lab-grade. Do not knock. Grab the jars (their flag) and fly them home before the surgeons finish their paperwork.',
      rounds: 24,
    },
    {
      title: 'DEAD AIR',
      objective: 'smash',
      briefing:
        'The sewer vents hum a note that folds fairy wings flat. Four vents stand in no-man’s-land, and each one roots the first wing to cross it. The transmitter behind them is cheap municipal tin, and so is the squat you are defending. Get anyone through the hum and their tin pops first.',
      bases: { player: 12, enemy: 12 },
      traps: [
        mine('enemy', 4, 1, 1, { roots: true }),
        mine('enemy', 4, 2, 1, { roots: true }),
        mine('enemy', 4, 3, 1, { roots: true }),
        mine('enemy', 4, 4, 1, { roots: true }),
      ],
    },
    {
      title: 'THE TURNSTILE',
      objective: 'beast',
      briefing:
        'The bosses bolted a three-story turnstile to the middle of the sky bridge. It charges by the wingbeat and swings at anyone who will not pay. Whoever breaks it first decides whether the bridge is a road or a racket.',
      beast: { name: 'The Turnstile', hp: 16, attack: 2, armor: 2 },
    },
    {
      title: 'THE MOONLIGHT DEED',
      objective: 'smash',
      briefing:
        'Every tenant on every roof came down for this one. The Meat Mogul himself guards the deeds, sitting on the paperwork in the corner of the deed office like an egg. Three of your neighbors are already in the street.',
      rounds: 24,
      fighters: [
        ally('sprite', 2, 1),
        ally('razor', 2, 3),
        ally('razor', 2, 5),
        rival('mogul', 9, 0, 'defend'),
      ],
    },
  ],
  ironjaw: [
    {
      title: 'THE PICKET LINE',
      objective: 'holdout',
      briefing:
        'The strike assembly votes for twelve rounds and the hall has to stand until every hand is counted. The Exchange sent two repo goblins to break up the meeting and invoice the chairs.',
      rounds: 12,
      fighters: [
        ally('scrapper', 1, 2, 'defend'),
        rival('repo', 6, 1),
        rival('repo', 6, 4),
      ],
    },
    {
      title: 'SIX YEARS OVERTIME',
      objective: 'smash',
      briefing:
        'The rewritten shift clock says your crew gets sixteen rounds, not one more. The strike fund pays a round of back wages up front. The Undertow strung tripwires between you and their clock tower, but the tower is spy plywood and good intentions, and six unpaid years have worn your own hall just as thin.',
      bases: { player: 10, enemy: 10 },
      rounds: 16,
      mana: { player: 1 },
      traps: [
        mine('enemy', 5, 2, 1, { roots: true }),
        mine('enemy', 5, 3, 1, { roots: true }),
      ],
    },
    {
      title: 'THE FURNACE CONTROLS',
      objective: 'smash',
      briefing:
        'Saint Kaboom’s crew packed the corridor with grenades and sent two Glitter Rats sprinting at your line with their tails lit. A Spark Welder stays on the emergency furnace controls, because somebody has to.',
      fighters: [
        ally('welder', 1, 2, 'defend'),
        rival('rat', 5, 1),
        rival('rat', 5, 4),
      ],
      traps: [mine('enemy', 3, 2, 2), mine('enemy', 3, 3, 2)],
    },
    {
      title: 'THE PATENT PRESS',
      objective: 'beast',
      briefing:
        'The prototype scanner has gone haywire: a three-ton patent press is stomping through your side of the lab, stamping PROPERTY OF THE EXCHANGE on anything with a pulse. Whoever smashes it first decides who reads the blueprint.',
      beast: { name: 'The Patent Press', hp: 20, attack: 3, armor: 0, col: 1 },
    },
    {
      title: 'COUNT EVERY WORKER',
      objective: 'smash',
      briefing:
        'Thimble’s choir has taken the rafters, and a Bloodsprite holds the catwalk above them singing the roll call. Their perch is scaffolding and your generator room is held together with union stickers. Restart the line, and count the fairies too.',
      bases: { player: 12, enemy: 12 },
      rounds: 24,
      fighters: [rival('sprite', 8, 2, 'defend')],
    },
  ],
  riot: [
    {
      title: 'THE IMPOUND LOT',
      objective: 'heist',
      briefing:
        'Ironjaw security towed the parade stage into an impound lot with walls you could park a city on. Steal the stage back (their flag) before the tow fees compound.',
      rounds: 28,
    },
    {
      title: 'INTEREST PER EXPLOSION',
      objective: 'smash',
      briefing:
        'The Exchange fronted you three mana worth of fireworks, no questions asked. The questions are buried in the field: four hidden-fee mines that charge interest on every Anarkissed performer who steps on one.',
      mana: { player: 3 },
      traps: [
        mine('enemy', 4, 0, 1, { debt: 1 }),
        mine('enemy', 4, 3, 1, { debt: 1 }),
        mine('enemy', 5, 2, 1, { debt: 1 }),
        mine('enemy', 5, 5, 1, { debt: 1 }),
      ],
    },
    {
      title: 'THE WALL OF SOUND',
      objective: 'beast',
      briefing:
        'Thimble wheeled a twelve-amp speaker tower right up to your side of the square and cranked it into feedback so loud it started swinging back. Whoever blows the speakers first headlines the festival.',
      beast: { name: 'The Wall of Sound', hp: 18, attack: 3, armor: 2, col: 3 },
    },
    {
      title: 'THE AMBUSH ROUTE',
      objective: 'smash',
      briefing:
        'The fake parade map leads straight through five Undertow tripwires. A Frog Trooper waits at the end of it. Saint Kaboom’s solution is to send two Glitter Rats ahead to find the wires the loud way.',
      fighters: [
        ally('rat', 2, 1),
        ally('rat', 2, 4),
        rival('frogtrooper', 7, 2),
      ],
      traps: [
        mine('enemy', 3, 1, 1, { roots: true }),
        mine('enemy', 4, 4, 1, { roots: true }),
        mine('enemy', 5, 2, 1, { roots: true }),
        mine('enemy', 6, 3, 1, { roots: true }),
        mine('enemy', 4, 0, 1, { roots: true }),
      ],
    },
    {
      title: 'THE SHOW MUST GO ON',
      objective: 'holdout',
      briefing:
        'The fireworks launch at the bell. Gene Riot medics are storming the stage to stop the show until the clinic next door is safe, and two of their fastest are already running. Keep the stage standing for twelve rounds.',
      rounds: 12,
      fighters: [rival('lynx', 6, 1), rival('lynx', 6, 4)],
    },
  ],
  undertow: [
    {
      title: 'THE TUNNEL ESCORT',
      objective: 'holdout',
      briefing:
        'The witness hides in your listening post until the tunnel train arrives in twelve rounds. Two Gene Riot scouts want her back where they can protect her. Every approach already has one of your tripwires on it.',
      rounds: 12,
      fighters: [rival('lynx', 6, 2), rival('lynx', 6, 3)],
      traps: [
        mine('player', 3, 1, 1, { roots: true }),
        mine('player', 3, 4, 1, { roots: true }),
        mine('player', 4, 2, 1, { roots: true }),
      ],
    },
    {
      title: 'ROOFTOP TRANSMITTERS',
      objective: 'smash',
      briefing:
        'The fairies built their pirate transmitter out of gaffer tape and stolen antennae, so it falls fast. Your own drain listening post is not much sturdier. Two Bloodsprites are already circling the drains, and your leech grates wait under the gutters.',
      bases: { player: 12, enemy: 12 },
      fighters: [rival('sprite', 6, 1), rival('sprite', 6, 4)],
      traps: [mine('player', 4, 1, 2), mine('player', 4, 4, 2)],
    },
    {
      title: 'THE EAR AUCTION',
      objective: 'heist',
      briefing:
        'The ledger of ears is locked in the Exchange auction house, and an Eel Courier is waiting at your door with the plumbing plans. Steal the ledger (their flag) before the gavel. The brokers seeded the floor with hidden fees.',
      fighters: [ally('eel', 1, 2, 'defend')],
      traps: [mine('enemy', 5, 3, 1, { debt: 1 })],
    },
    {
      title: 'THE COMMAND MAST',
      objective: 'beast',
      briefing:
        'A broadcast mast on tank treads rolls into the yard, shouting orders into every lizard helmet. Topple it and the static stops. Whoever topples it gets to say the first free word.',
      beast: { name: 'The Command Mast', hp: 18, attack: 2, armor: 2 },
    },
    {
      title: 'PIRATE RADIO',
      objective: 'smash',
      briefing:
        'The concert goes live at the bell. Two Glitter Rats are crowd-surfing toward your transmitter with lit tails while the false Oracle broadcasts from theirs. Both antennae are rigged with fireworks: whichever falls first loses the signal.',
      bases: { player: 14, enemy: 14 },
      rounds: 20,
      fighters: [rival('rat', 6, 2), rival('rat', 6, 3)],
      traps: [
        mine('player', 4, 2, 1, { roots: true }),
        mine('player', 4, 3, 1, { roots: true }),
      ],
    },
  ],
  exchange: [
    {
      title: 'THE RUINED BANK',
      objective: 'smash',
      briefing:
        'Half the bank is already rubble, and the Anarkissed are back for the other half: a Glitter Rat is sprinting at the vault with its tail lit. The vault still stands. So does Gilt.',
      fighters: [rival('rat', 6, 3)],
    },
    {
      title: 'THE BOARDROOM',
      objective: 'holdout',
      briefing:
        'The directors give Gilt twelve rounds to settle the strike before they sell the factory for parts. Keep the boardroom standing. The strikers are coming up the stairs one very heavy footstep at a time.',
      rounds: 12,
      fighters: [rival('bulldozer', 6, 2), rival('welder', 6, 4)],
    },
    {
      title: 'THE ARCHIVE',
      objective: 'heist',
      briefing:
        'Every contract the Exchange ever forged sits in a flooded vault under the Undertow, behind walls of wet concrete and gossip. Carry the archive (their flag) up the drain before the Oracle changes her mind.',
      traps: [mine('enemy', 6, 2, 1, { roots: true })],
    },
    {
      title: 'THE NOTARY ENGINE',
      objective: 'beast',
      briefing:
        'The Exchange’s oldest machine wakes in the square outside Gilt’s own office: a two-story notary engine that stamps OWNED on anything that breathes. Gilt can let it finish its work or break it first. So can the Gene Riot.',
      beast: { name: 'The Notary Engine', hp: 22, attack: 3, armor: 0, col: 1 },
    },
    {
      title: 'THE GOLD SEAL',
      objective: 'heist',
      briefing:
        'The bloodfairies nailed the stolen gold seal to their flagpole and declared every rooftop debt cancelled. You cannot foreclose on a roof that flies. Bring the seal home (their flag) and decide what it stamps.',
      rounds: 28,
    },
  ],
}

/** The authored set piece for one chapter, if that crew has one. */
export function campaignBattlefield(
  team: TeamId,
  chapterIndex: number,
): CampaignBattlefield | null {
  return CAMPAIGN_BATTLEFIELDS[team][chapterIndex] ?? null
}

/**
 * Build the chapter's battlefield on a fresh (already termed) match. Pure:
 * returns a copy. Only the arena formats have bases and fighters to rebuild;
 * any other format comes back unchanged.
 */
export function applyBattlefield(
  match: MatchState,
  field: CampaignBattlefield,
): MatchState {
  if (!autoBattle(match) || match.round !== 1 || match.victor) return match
  const next: MatchState = {
    ...match,
    units: match.units.map((u) => ({ ...u })),
    traps: match.traps.map((t) => ({ ...t })),
    bases: { ...match.bases },
    log: [...match.log],
  }
  const col = (c: number) => Math.max(0, Math.min(next.width - 1, c))
  const row = (r: number) => Math.max(0, Math.min(next.height - 1, r))
  if (field.bases?.player) next.bases.player = field.bases.player
  if (field.bases?.enemy) next.bases.enemy = field.bases.enemy
  if (field.rounds) next.maxRounds = field.rounds
  if (field.mana?.player) next.mana = Math.max(0, next.mana + field.mana.player)
  if (field.mana?.enemy)
    next.enemyMana = Math.max(0, next.enemyMana + field.mana.enemy)
  if (field.objective === 'holdout') next.holdout = true
  if (field.objective === 'heist') next.heist = true
  if (field.beast) {
    // One of the four central squares, rotated by the seed like the flags.
    next.monster = {
      x:
        field.beast.col !== undefined
          ? col(field.beast.col)
          : next.width / 2 - 1 + (seededHash(next.seed, 7) % 2),
      y: next.height / 2 - 1 + (seededHash(next.seed, 8) % 2),
      hp: field.beast.hp,
      maxHp: field.beast.hp,
      attack: field.beast.attack,
      armor: field.beast.armor,
    }
  }
  for (const trap of field.traps ?? []) {
    const x = col(trap.col)
    const y = row(trap.row)
    if (next.traps.some((t) => t.x === x && t.y === y)) continue
    next.traps.push({
      x,
      y,
      side: trap.side,
      damage: trap.damage,
      set: true,
      ...(trap.roots ? { roots: true } : {}),
      ...(trap.debt ? { debt: trap.debt } : {}),
    })
  }
  for (const fighter of field.fighters ?? [])
    placeFighter(
      next,
      fighter.card,
      fighter.side,
      col(fighter.col),
      row(fighter.row),
      {
        stance: fighter.stance,
        veteran: true,
      },
    )
  next.log = [
    field.title + ': ' + OBJECTIVE_LABELS[field.objective] + '.',
    ...next.log,
  ]
  return next
}

/** Plain-words rules for a field, generated from the same data it applies. */
export function describeBattlefield(field: CampaignBattlefield): string[] {
  const lines = [OBJECTIVE_GOALS[field.objective]]
  const standard = BASE_HP.blackout
  if (field.bases?.player && field.bases.player !== standard)
    lines.push('Your base starts at ' + field.bases.player + ' HP.')
  if (field.bases?.enemy && field.bases.enemy !== standard)
    lines.push('Their base starts at ' + field.bases.enemy + ' HP.')
  if (field.rounds) lines.push('Round limit ' + field.rounds + '.')
  if (field.mana?.player)
    lines.push('You start with ' + signed(field.mana.player) + ' mana.')
  if (field.mana?.enemy)
    lines.push('They start with ' + signed(field.mana.enemy) + ' mana.')
  for (const side of ['player', 'enemy'] as Side[]) {
    const here = (field.fighters ?? []).filter((f) => f.side === side)
    if (!here.length) continue
    lines.push(
      (side === 'player'
        ? 'Already fighting for you: '
        : 'Already on their side: ') +
        here
          .map(
            (f) =>
              cardById(f.card).name +
              (f.stance === 'defend' ? ' (on DEFEND)' : ''),
          )
          .join(', ') +
        '. They can strike in round one.',
    )
  }
  for (const side of ['player', 'enemy'] as Side[]) {
    const here = (field.traps ?? []).filter((t) => t.side === side)
    if (!here.length) continue
    const effects = [...new Set(here.map(trapText))].join('; ')
    lines.push(
      (side === 'player'
        ? 'Your armed traps in no-man’s-land: '
        : 'Hidden rival traps in no-man’s-land: ') +
        here.length +
        ' (' +
        effects +
        ').',
    )
  }
  if (field.beast)
    lines.push(
      field.beast.name +
        ' stands ' +
        (field.beast.col !== undefined && field.beast.col < 4
          ? 'on your side of the arena'
          : 'in the middle of the arena') +
        ': ' +
        field.beast.hp +
        ' HP, ' +
        field.beast.attack +
        ' attack, ' +
        field.beast.armor +
        ' armor. It swats anyone beside it.',
    )
  return lines
}

function trapText(trap: FieldTrap): string {
  return (
    trap.damage +
    ' damage' +
    (trap.roots ? ', roots' : '') +
    (trap.debt ? ', ' + trap.debt + ' mana debt' : '')
  )
}

function signed(value: number): string {
  return (value > 0 ? '+' : '') + value
}

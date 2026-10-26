import type { AudienceDef } from './types'

/**
 * First Bell recruitment: nobody is silently assigned to the emperor.
 * A seed picks one independent visitor and one of two authored arguments.
 * Either rival may be chosen for free, or the ruler can purchase two posts
 * at the painful price of nearly the entire opening treasury.
 */
export const COURT_ONBOARDING_FLAG = 'court-onboarding-v1'
export const RANDOM_ARRIVALS = [
  'd01-flint-arrives',
  'd01-ash-arrives',
  'd01-nera-arrives',
  'd01-pip-arrives',
] as const
export const FIRST_BELL_RIVAL_BARGAIN = 110
export const RIVAL_ARGUMENTS = [
  'd01-ford-dispute',
  'd01-tunnel-dispute',
] as const
export const COURT_RECRUITMENT_IDS = [
  'd01-kiyo-arrives',
  ...RANDOM_ARRIVALS,
  ...RIVAL_ARGUMENTS,
]

export const FIRST_BELL_AUDIENCES: readonly AudienceDef[] = [
  {
    id: 'd01-kiyo-arrives',
    title: 'A Physician at the Gate',
    speaker: 'Kiyo',
    npc: 'F003',
    lines: [
      'Before the first petitioner, a physician in a travel-stained coat comes to the throne with a medicine case and a sleeping child on her hip. She gives her name as Kiyo. The boy is Zuzu. He has slept through three border inspections and half his mother’s worries.',
      '“There are sick people outside this wall, Majesty. I can treat them. The gate watch says I need an imperial seal to open a surgery here.”',
      {
        who: 'Young Komodo',
        npc: 'young-komodo',
        text: 'A court physician is not a luxury. Not with the roads we have. We will need her before the week is out.',
      },
      'Kiyo sets down her case. It makes a heavier sound than something so small should make. “I won’t leave a patient because the right signature is late.”',
    ],
    options: [
      {
        id: 'appoint',
        label: 'Give Kiyo the seal and a place at court.',
        effects: { recruit: ['F003'], local: { yard: 1 } },
        response:
          'Kiyo takes the seal without kneeling. “Then I’ll start with the people waiting outside.” Zuzu wakes long enough to wave at Komodo.',
      },
    ],
  },
  {
    id: 'd01-flint-arrives',
    title: 'A Duchess Without a Duchy',
    speaker: 'Duchess Flint',
    npc: 'F004',
    lines: [
      'A refugee advocate comes to court carrying a child’s patched shawl. Her title is Duchess Flint. Nobody can name her duchy, and she does not ask them to.',
      '“The freehold camp sends me. Your new law names refugees as guests, but the watch has been counting them as debts. I can stop the argument before it becomes a funeral.”',
      'She puts the shawl on the petitioner’s rail. “A little girl slept under that at the gate. The guard says there was no room. There was room for his horse.”',
    ],
    options: [
      {
        id: 'appoint',
        label: 'Ask Flint to stay and hold the watch to its promises.',
        effects: { recruit: ['F004'], local: { yard: 1, 'gate-watch': -1 } },
        response:
          '“I will make enemies in your name,” Flint says. “I would rather make fewer in mine. We’ll see which is needed.”',
      },
    ],
  },
  {
    id: 'd01-ash-arrives',
    title: 'A Letter With No Address',
    speaker: 'Ash Quill',
    npc: 'F007',
    lines: [
      'A Saltroad courier comes up the hall with a satchel full of other people’s sealed letters. Ash Quill lays one on the rail, face down.',
      '“Saltroad gave me a route and no wages. There are names on these letters that have been dead for years. Somebody keeps paying to have them delivered.”',
      'Ash taps the unopened letter. “A crown needs to know which roads still work. I know the roads that have stopped admitting they exist.”',
    ],
    options: [
      {
        id: 'appoint',
        label: 'Put Ash on the imperial roads, with a wage and protection.',
        effects: { recruit: ['F007'], affinity: { saltroad: 2 } },
        response:
          'Ash pockets the letter again. “I’ll find where it belongs. If the address is a grave, I’ll tell you who bought the flowers.”',
      },
    ],
  },
  {
    id: 'd01-nera-arrives',
    title: 'The Weather Is Not for Sale',
    speaker: 'Nera Gale',
    npc: 'F006',
    lines: [
      'Nera Gale comes through the gate without a weather token. She holds an empty forecast cylinder, scratched where the Conclave seal used to be.',
      '“Rain does not belong to the highest bidder, Majesty. I kept copies of the instruments. The elders are looking for the missing pages.”',
      'She could read the tower’s reports, but the Conclave would know where to find her. Nera waits to see whether this court sells her out.',
    ],
    options: [
      {
        id: 'appoint',
        label: 'Offer Nera shelter and a place beside the court’s weather charts.',
        effects: { recruit: ['F006'], affinity: { 'storm-crows': -2 }, local: { lamplight: 1 } },
        response: 'Nera lays her cylinder on the table. “Then our forecasts belong to the people who need them.”',
      },
    ],
  },
  {
    id: 'd01-pip-arrives',
    title: 'A Page That Does Not Belong',
    speaker: 'Pip Thread',
    npc: 'F005',
    lines: [
      'Pip Thread carries three ledgers to the rail, none bound in the same leather. The archivist points to a page with a perfect copy of the royal seal.',
      '“One of these ledgers was rewritten. I can remember the old entries. I cannot prove who changed them without access to your records.”',
      'The court could gain a meticulous reader, but the Hollow Bell office will resent anyone who searches its accounts.',
    ],
    options: [
      {
        id: 'appoint',
        label: 'Give Pip access to the Archive and a desk at court.',
        effects: { recruit: ['F005'], local: { lamplight: 1 }, affinity: { 'hollow-bell': -1 } },
        response: 'Pip opens the oldest ledger. “I remember this page,” they say. “It was not here yesterday.”',
      },
    ],
  },
  {
    id: 'd01-ford-dispute',
    title: 'The Road or the Bridge',
    speaker: 'Rook Bramble and Saffron Kett',
    npc: 'F001',
    lines: [
      'Rook Bramble, an outrider with mud to the elbows, has dragged a battered bridge pin into the throne room. Saffron Kett, a machinist, follows carrying the rest of the bridge.',
      '“You can cross the east ford without a bridge,” Rook says. “I’ve carried wounded people through it.”',
      '“And you lost two wagons,” Saffron says. “I found their wheels downstream. A map won’t hold the next one up.”',
      'They came together because neither trusts the other to explain the problem. Rook offers the roads and a scout’s speed. Saffron offers repairs, a workshop, and enemies inside the Jackalwire Pack. Neither will work under the other.',
      {
        who: 'Young Komodo',
        npc: 'young-komodo',
        text: 'There is one funded post, Majesty. We could keep both, but two commissions and separate wages would eat almost the entire treasury.',
      },
    ],
    options: [
      {
        id: 'rook',
        label:
          'Appoint Rook as outrider. Saffron must take her tools elsewhere.',
        effects: {
          recruit: ['F001'],
          flags: ['court-excluded:F002'],
          affinity: { freeholds: 2, jackalwire: -2 },
        },
        response:
          'Rook takes the dispatch badge. Saffron leaves the broken pin on the rail. “When that road collapses, tell them whose idea it was.”',
      },
      {
        id: 'saffron',
        label: 'Appoint Saffron as engineer. Rook rides beyond your borders.',
        effects: {
          recruit: ['F002'],
          flags: ['court-excluded:F001'],
          affinity: { jackalwire: 2, freeholds: -2 },
        },
        response:
          'Saffron carries the pin away like a trophy. Rook gives the ruler a short salute and leaves before the doors have finished opening.',
      },
      {
        id: 'both',
        label: 'Commission both Rook and Saffron, with separate commands. Spend 110 brass.',
        requires: { cost: FIRST_BELL_RIVAL_BARGAIN },
        effects: { recruit: ['F001', 'F002'], flags: ['first-bell-both-ford'], local: { ledger: -1 } },
        response: 'The treasury doors open. Rook takes the road command; Saffron takes the bridge works. Neither salutes the other. The court has both talents and scarcely enough brass left to pay for breakfast.',
      },
    ],
  },
  {
    id: 'd01-tunnel-dispute',
    title: 'Who Owns the Last Sack?',
    speaker: 'Bram Coil and Keel Understone',
    npc: 'F008',
    lines: [
      'Bram Coil, a quartermaster, has counted the tower’s grain twice. Keel Understone, a tunnel surveyor, has counted the mouths waiting under the city.',
      '“A hungry garrison is no garrison,” Bram says, gripping the last sealed grain sack.',
      '“There are children beneath our floor,” Keel says. “You can hear them through the air shafts. They cannot eat the inventory.”',
      'Bram can keep an army fed and make a hard ration last. Keel knows the mole roads and the people who live under them. The pair refuse to share the court post: each believes the other will sacrifice people the crown cannot see.',
      {
        who: 'Young Komodo',
        npc: 'young-komodo',
        text: 'They disagree about who counts, Majesty. One posting costs us nothing; two commissions would leave the treasury barely breathing.',
      },
    ],
    options: [
      {
        id: 'bram',
        label: 'Give Bram the stores. Keel leaves with the tunnels unmapped.',
        effects: {
          recruit: ['F008'],
          flags: ['court-excluded:F009'],
          local: { ledger: 2, yard: -1 },
        },
        response:
          'Bram ties the sack shut. Keel looks at the flour dust on their hands. “Remember those children when you write the next tally.”',
      },
      {
        id: 'keel',
        label: 'Give Keel the maps. Bram takes his accounts to another banner.',
        effects: {
          recruit: ['F009'],
          flags: ['court-excluded:F008'],
          affinity: { moles: 3 },
          local: { ledger: -1, yard: 2 },
        },
        response:
          'Keel puts the grain sack on a cart bound for the lower tunnels. Bram writes the weight in his notebook before he goes. He does not look back.',
      },
      {
        id: 'both',
        label: 'Fund Bram’s stores and Keel’s tunnel mission separately. Spend 110 brass.',
        requires: { cost: FIRST_BELL_RIVAL_BARGAIN },
        effects: { recruit: ['F008', 'F009'], flags: ['first-bell-both-tunnels'], local: { ledger: -1, yard: 1 } },
        response: 'The court counts out almost every coin. Bram agrees to ration the garrison while Keel brings food to the tunnels. Their argument does not end, but neither can walk away from the people waiting.',
      },
    ],
  },
]

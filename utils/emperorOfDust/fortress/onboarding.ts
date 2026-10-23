import type { AudienceDef } from './types'

/**
 * First Bell recruitment: nobody is silently assigned to the emperor.
 * A seed picks one independent visitor and one of two authored arguments.
 * The ruler can settle an argument in favor of ONE applicant, never both.
 */
export const COURT_ONBOARDING_FLAG = 'court-onboarding-v1'
export const RANDOM_ARRIVALS = ['d01-flint-arrives', 'd01-ash-arrives'] as const
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
        text: 'One place at the dispatch table, Majesty. The one you send away will remember who got it.',
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
        text: 'They disagree about who counts, Majesty. This is a question the throne will keep answering.',
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
    ],
  },
]

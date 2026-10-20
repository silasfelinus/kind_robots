import type { AudienceDef, DayDef, KingdomFactionId, QuestDef } from './types'

// Act V, Days 41-50, "The Hideout" (conductor DAY-PLAN.md): the court on the
// run after Young Komodo's betrayal. The hideout (engine selectHideout, flag
// `hideout:<id>`) decides who sets terms on Day 42 and which host quest goes
// on the wall; Day 49 decides whose peace it is, and Day 50's last dispatch
// decides whether the horror under the Abbey sleeps. endings.ts reads the
// result. Endings never name who later destroys Hollow Bell (Book One).

const VELLUM = { name: 'Keeper Vellum', npc: 'abelard-vellum' }

export const ACT_FIVE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d41-stragglers',
    title: 'Find the Stragglers',
    summary:
      'Half the court scattered when the fortress fell. Some are hiding in ditches between here and the tower. Bring them in before the plum riders find them.',
    region: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'urgent'],
    rewards: {
      success: {
        local: { yard: 3, 'gate-watch': 2 },
        flags: ['stragglers-found'],
      },
      partial: { local: { yard: 1 } },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3, 'gate-watch': -2 } },
    outcomes: {
      success:
        'Eleven cooks, four guards and a very angry goat came in out of the dark. The Yard is cooking again.',
      partial: 'A few came in. The rest had already chosen other roads.',
      failure:
        'The ditches were empty, or the people in them did not want to be found.',
      expired:
        'Nobody went looking. The stragglers stopped believing anyone would.',
    },
  },
  // Day 42: one host quest per hideout, posted by accepting the host's terms.
  {
    id: 'q-d42-tunnel-props',
    title: 'Shore Up the Tunnels',
    summary:
      'Granny Umber’s price for shelter: help prop the long tunnel before the badlands drop it on everyone.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 1,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tunnels', 'repair'],
    rewards: {
      success: { affinity: { moles: 10 }, strength: { moles: 1 } },
      failure: { affinity: { moles: -5 } },
    },
    expired: { affinity: { moles: -10 } },
    outcomes: {
      success:
        'The props hold. Granny Umber knocks on one and listens, satisfied.',
      failure: 'A section came down. Nobody was under it, this time.',
      expired: 'The Moles propped it themselves, and said so, often.',
    },
  },
  {
    id: 'q-d42-crow-watch',
    title: 'Stand the Crow Watch',
    summary:
      'Elder Corvane wants the court’s eyes on the ledges at night. Every crow will be watching the Abbey road. So will you.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['weather', 'tracking'],
    rewards: {
      success: {
        affinity: { 'storm-crows': 10 },
        flags: ['abbey-road-watched'],
      },
      failure: { affinity: { 'storm-crows': -5 } },
    },
    expired: { affinity: { 'storm-crows': -10 } },
    outcomes: {
      success:
        'Three nights on the ledges. On the third, a line of lanterns went up the Abbey road and none came down.',
      failure:
        'The watch fell asleep. The crows did not, and they told Corvane.',
      expired: 'The crows stood the watch alone, and noted it.',
    },
  },
  {
    id: 'q-d42-bell-water',
    title: 'Water for the Bell',
    summary:
      'Hollow Bell is sheltering the court in its chapel cellars and running out of water. The aqueduct needs hands.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': 10 },
        strength: { 'hollow-bell': 1 },
      },
      failure: { affinity: { 'hollow-bell': -5 } },
    },
    expired: { affinity: { 'hollow-bell': -10 } },
    outcomes: {
      success:
        'The aqueduct runs. Mara Reedbell rings the chapel bell once, very quietly, for the court.',
      failure: 'The leak beat the party. The town is rationing again.',
      expired:
        'The town carried water by hand and did not complain where you could hear.',
    },
  },
  {
    id: 'q-d42-wagon-wheels',
    title: 'Wheels for the Wagon Circle',
    summary:
      'Gristle Vane will hide the court among the painted wagons, if the court helps him keep them rolling.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { jackalwire: 10 },
        strength: { jackalwire: 1 },
      },
      failure: { affinity: { jackalwire: -5 } },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'Every wagon rolls. Vane paints a tiny crown on the axle of his own.',
      failure: 'Two wagons are still on blocks, and Vane is counting.',
      expired: 'The Pack fixed its own wheels and raised its prices.',
    },
  },
  {
    id: 'q-d42-caravan-guard',
    title: 'Ride With the Caravan',
    summary:
      'The safest place in the kingdom is the one that never stops moving. Oriel Saltmarsh wants guards for the night road.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['defense'],
    rewards: {
      success: {
        brass: 20,
        affinity: { saltroad: 10 },
        strength: { saltroad: 1 },
      },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { affinity: { saltroad: -10 } },
    outcomes: {
      success:
        'The caravan made the salt flats by dawn without losing a wheel or a guest.',
      failure: 'Riders took two wagons on the night road.',
      expired: 'Oriel hired guards elsewhere, at a price she mentions daily.',
    },
  },
  {
    id: 'q-d42-barn-harvest',
    title: 'Bring In the Harvest',
    summary:
      'Hester Plowright hides the court in her root cellar. In exchange, the court brings in the last field before the riders burn it.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['urgent'],
    rewards: {
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
      },
      failure: { affinity: { freeholds: -5 } },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'The field is in. Hester gives every reaper an egg, warm, as if it were a medal.',
      failure: 'Half the field burned before the sheaves were up.',
      expired:
        'Hester and her sister brought it in alone, which took all night.',
    },
  },
  {
    id: 'q-d42-rail-salvage',
    title: 'Salvage for the Station',
    summary:
      'Jinx Coupler shelters the court in the collapsed rail station, and wants the court’s help stripping an engine before anyone else does.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['repair', 'tunnels'],
    rewards: {
      success: {
        brass: 15,
        affinity: { rustline: 10 },
        strength: { rustline: 1 },
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: { affinity: { rustline: -10 } },
    outcomes: {
      success:
        'The engine is stripped to the bolts. Jinx keeps the shiniest ones.',
      failure: 'Someone else got to the engine first.',
      expired: 'Jinx stripped it alone, slowly and resentfully.',
    },
  },
  {
    id: 'q-d42-cave-forage',
    title: 'Forage for the Cave',
    summary:
      'Nobody is sheltering the court. A handful of revolutionaries and a cold cave are what is left. Find food.',
    region: 'storm-crow-heights',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 4 },
    requirements: [
      { stat: 'wits', band: 'low' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tracking'],
    rewards: {
      success: { local: { yard: 3 }, flags: ['cave-fed'] },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3 } },
    outcomes: {
      success:
        'Roots, a snared hare and a sack of someone’s abandoned flour. Tonight, nobody is hungry.',
      failure: 'The hills were bare. The cave ate the last of the bread.',
      expired: 'Nobody went. The cave went to sleep hungry.',
    },
  },
  {
    id: 'q-d44-komodo-bargain',
    title: 'What Komodo Bought',
    summary:
      'Komodo traded the fortress for something. Find out what, from the ledgers he left behind and the people he left them with.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['records', 'tracking'],
    rewards: {
      success: {
        local: { lamplight: 3 },
        affinity: { abbey: -10 },
        flags: ['komodo-bargain-known'],
      },
      partial: { flags: ['komodo-bargain-known'] },
      failure: { affinity: { abbey: -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'It is all in his own neat hand. The Abbess promised that what sleeps under the Abbey would sleep through every life now living, if the throne were handed to her order and the payments continued. Komodo wrote the price in the margin and underlined it twice: “Cheaper than war.”',
      partial:
        'The party found one page: the Abbess’s promise, and Komodo’s note beside it. “Cheaper than war.” The rest had been burned.',
      failure: 'The ledgers were gone, and so was everyone who had held them.',
      expired: 'Nobody asked. Komodo’s reasons went unread.',
    },
  },
  {
    id: 'q-d46-well-that-spoke',
    title: 'The Well That Spoke',
    summary:
      'There is a dry well halfway up the mission road that the pilgrims say answers back. It runs down toward the Abbey crypt. Find the way through.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'lore', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tunnels', 'records'],
    rewards: {
      success: { local: { lamplight: 2 }, flags: ['crypt-path-found'] },
      partial: { flags: ['crypt-path-found'] },
      failure: { affinity: { abbey: -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'The well does speak. It only repeats what you say, a heartbeat late, in a voice nearly like yours. Forty steps down there is a door with no lock on this side. The party marked the way.',
      partial:
        'The party marked the way to the door and came back up very fast. Nobody will say what the well said back.',
      failure: 'The rope came back up without the bucket and without the knot.',
      expired:
        'Nobody went down. At night the well can be heard from the road.',
    },
  },
  {
    id: 'q-d48-bell-clapper',
    title: 'The Bell’s Lost Clapper',
    summary:
      'The Silent Bell has no clapper because someone took it, long ago, to stop it ringing. The Archive thinks it knows where. Bring it home.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'mid', hidden: true },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tracking', 'records'],
    rewards: {
      triumph: {
        affinity: { 'mire-mothers': 10 },
        flags: [
          'clapper-recovered',
          'relic-eye-earned',
          'relic-hourglass-earned',
        ],
      },
      success: {
        affinity: { 'mire-mothers': 5 },
        flags: ['clapper-recovered'],
      },
      failure: { affinity: { 'mire-mothers': -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The clapper was sunk in the deepest pool of the Mirefen, wrapped in prayer cloth older than the Abbey. The Mire Mothers kept it there on purpose, and gave it up on purpose. Beside it lay older treasures, and the court came home with those too.',
      success:
        'The clapper was sunk in the deepest pool of the Mirefen, wrapped in prayer cloth older than the Abbey. It is heavy, and it hums when nobody is touching it.',
      failure: 'The fen kept it. The fen keeps most things.',
      expired: 'Nobody went. The clapper stayed in the fen.',
    },
  },
  {
    id: 'q-d50-last-dispatch',
    title: 'The Last Dispatch',
    summary:
      'The Abbess has called down whatever sleeps beneath her crypt. Go to the Abbey, face her, and put it back to sleep. Everyone who goes knows they may not come back.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'lore', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense', 'urgent'],
    rewards: {
      triumph: { flags: ['horror-sealed', 'abbess-unmasked'] },
      success: { flags: ['horror-sealed'] },
      partial: { flags: ['horror-sealed'] },
      failure: { flags: ['horror-wakes'] },
    },
    expired: { flags: ['horror-wakes'] },
    outcomes: {
      triumph:
        'The Abbess smiled at the party until the very end, and the thing under the floor stopped keeping time. The crypt door is shut, and the party carried her habit out for everyone to see.',
      success:
        'The crypt door is shut. Whatever was keeping time beneath the floor has stopped. The Abbess is gone, and the sisters will not say where.',
      partial:
        'The door is shut, barely, and the party came home fewer and older.',
      failure:
        'The party came back up the stair without closing the door. Behind them, the singing has not stopped.',
      expired: 'Nobody went to the Abbey. Nobody had to. It came to everyone.',
    },
  },
  {
    id: 'q-d50-crypt-path',
    title: 'The Way Through the Well',
    summary:
      'The well on the mission road runs to the crypt’s back door. A small party can reach the Abbess before she knows anyone is coming.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tunnels'],
    rewards: {
      triumph: { flags: ['horror-sealed', 'abbess-unmasked'] },
      success: { flags: ['horror-sealed'] },
      failure: { flags: ['horror-wakes'] },
    },
    expired: {},
    outcomes: {
      triumph:
        'They came up through the floor behind the Abbess while she was still singing. The crypt is shut, and the sisters scattered at dawn.',
      success: 'The back door led to the right room. The crypt is shut.',
      failure:
        'The well led somewhere. It was not the crypt, and the party came back with nothing to say.',
      expired: 'Nobody took the well road.',
    },
  },
  {
    id: 'q-d50-ring-the-bell',
    title: 'Ring the Silent Bell',
    summary:
      'The clapper is home. Carry it up the Abbey tower and ring the bell that has not rung in a hundred years. The Archive believes the sound is what sent the thing to sleep the first time.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: { flags: ['horror-sealed', 'bell-rung'] },
      success: { flags: ['horror-sealed', 'bell-rung'] },
      failure: { flags: ['horror-wakes'] },
    },
    expired: {},
    outcomes: {
      triumph:
        'The Silent Bell rang once, and every bell in the kingdom answered, down to the tin ones on goats. Under the Abbey, something turned over in its sleep and was still.',
      success:
        'The Silent Bell rang once. Under the Abbey, something went quiet.',
      failure:
        'The clapper struck, and the bell cracked down its whole length without a sound.',
      expired: 'The clapper stayed in its cloth. Nobody climbed the tower.',
    },
  },
]

/** Day 42's host terms, one audience per hideout (flag `hideout:<id>`). */
const hostTerms = (
  hideout: string,
  speaker: string,
  npc: string | undefined,
  /** The host faction; the nameless cave has none and feeds the Yard instead. */
  faction: KingdomFactionId | undefined,
  lines: string[],
  questId: string,
  acceptResponse: string,
): AudienceDef => ({
  id: `d42-terms-${hideout}`,
  title: 'Lost Without a Banner',
  speaker,
  ...(npc ? { npc } : {}),
  ...(faction ? { faction } : {}),
  requires: { flags: [`hideout:${hideout}`] },
  lines,
  options: [
    {
      id: 'accept',
      label: 'Accept the host’s terms.',
      effects: {
        ...(faction
          ? {
              affinity: { [faction]: 5 } as Partial<
                Record<KingdomFactionId, number>
              >,
            }
          : { local: { yard: 2 } }),
        flags: ['host-terms-accepted'],
      },
      response: acceptResponse,
      postsQuests: [questId],
    },
    {
      id: 'bargain',
      label: 'The crown still pays its own way.',
      requires: { cost: 30 },
      effects: { flags: ['host-terms-paid'] },
      response:
        'The brass changes hands. Your host looks at you differently afterwards: not more kindly, but more carefully.',
    },
  ],
})

export const ACT_FIVE_DAYS: readonly DayDef[] = [
  {
    day: 41,
    title: 'Ash Under the Grain',
    advisor: VELLUM,
    briefings: [
      {
        id: 'tower-taken',
        source: 'A Gate Watch runner',
        text: 'The tower flies the Abbey’s grey banner this morning.',
        truth: true,
      },
      {
        id: 'komodo-sorry',
        source: 'A Saltroad drover',
        text: 'Young Komodo has already sent a letter of apology.',
        truth: false,
      },
      {
        id: 'riders-out',
        source: 'The host’s lookouts',
        text: 'Plum riders are searching the roads around the tower.',
        truth: true,
      },
    ],
    komodo:
      'Majesty. I have read every report that came in overnight, slowly, twice. Young Komodo left you nothing but a seat at someone else’s fire. It is a start. The Archive has begun on smaller ones.',
    quests: ['q-d41-stragglers'],
    audiences: [
      {
        id: 'd41-roll-call',
        title: 'Who Came With You',
        speaker: 'The court in hiding',
        lines: [
          'Someone has lit a fire. Around it, in borrowed blankets, is what is left of an imperial court: a few followers, a few guards, a cook still holding a ladle.',
          'They are all looking at you. Nobody says “What now?” out loud.',
        ],
        options: [
          {
            id: 'speech',
            label: 'Tell them the truth: the crown is still here.',
            effects: {
              local: { yard: 2, 'gate-watch': 2 },
              flags: ['crown-in-exile'],
            },
            response:
              'It is not a good speech. It is short, and your voice cracks once. By the end, the cook has put down the ladle and is standing up.',
          },
          {
            id: 'count',
            label: 'Count the brass and the bread first.',
            effects: { local: { ledger: 2 } },
            response:
              'There is less than you hoped and more than you feared. Someone starts writing it down, out of habit.',
          },
        ],
      },
      {
        id: 'd41-archive-saved',
        title: 'The Books That Got Out',
        speaker: 'Keeper Abelard Vellum',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['archive-evacuated'] },
        lines: [
          'Keeper Vellum has carried the last crate the whole way himself. He opens it and takes out a ledger bound in Komodo’s brass-buttoned style.',
          '“His hand, Majesty. Every page. I matched it on the night. I am sorry I was not faster.”',
        ],
        options: [
          {
            id: 'read',
            label: 'Read it together, tonight.',
            effects: {
              local: { lamplight: 3 },
              flags: ['komodo-ledger-saved'],
            },
            response:
              'You read until the fire is embers. Komodo kept careful accounts of everything, including you.',
          },
        ],
      },
    ],
  },
  {
    day: 42,
    title: 'Lost Without a Banner',
    advisor: VELLUM,
    briefings: [
      {
        id: 'loyal-houses',
        source: 'A message from the tower',
        text: 'The Old Houses have refused to recognise the Abbess.',
        truth: false,
      },
      {
        id: 'host-terms',
        source: 'Your host',
        text: 'The people sheltering the court want to discuss terms.',
        truth: true,
      },
      {
        id: 'income-gone',
        source: 'The court’s purse',
        text: 'No taxes reached the court this morning.',
        truth: true,
      },
    ],
    komodo:
      'Every host has a price, Majesty, and the honest ones name it on the second day. I would pay it. A banner is only cloth until someone is willing to stand behind it.',
    quests: [],
    audiences: [
      hostTerms(
        'mole-tunnels',
        'Granny Umber of the Mole Revolutionaries',
        'granny-umber',
        'moles',
        [
          'Granny Umber has given you the driest chamber in the tunnels and a mug of something hot.',
          '“You can stay as long as you like, Majesty. But down here everybody digs. Even emperors.”',
        ],
        'q-d42-tunnel-props',
        '“Good,” says Granny Umber. “Mind the third prop. It sulks.”',
      ),
      hostTerms(
        'crow-cave',
        'Elder Corvane of the Storm Crows',
        'elder-corvane',
        'storm-crows',
        [
          'The cave smells of rain and feathers. Elder Corvane watches you from a ledge above the fire.',
          '“The Crows keep what they shelter. In return, the court keeps watch with us. The Abbey road needs more eyes.”',
        ],
        'q-d42-crow-watch',
        'Corvane nods once. “Clean,” he says. It is the warmest thing he has ever said to you.',
      ),
      hostTerms(
        'bell-cellars',
        'Mayor Mara Reedbell of Hollow Bell',
        'mara-reedbell',
        'hollow-bell',
        [
          'The cellars under the chapel are cool and crowded. Above, the town’s small bell is silent on your account.',
          'Mara Reedbell wipes her hands on her sash. “Stay. But this town gave its water to the war, and it needs the aqueduct running.”',
        ],
        'q-d42-bell-water',
        'Mara smiles for the first time in days. “Then you are welcome here, for as long as the Bell stands.”',
      ),
      hostTerms(
        'wagon-circle',
        'Captain Gristle Vane of the Jackalwire Pack',
        'gristle-vane',
        'jackalwire',
        [
          'The painted wagons have closed into a ring in the canyon, with the court’s blankets in the middle.',
          '“Nobody finds the Pack unless the Pack wants finding,” says Vane. “But a circle that stops rolling is a target.”',
        ],
        'q-d42-wagon-wheels',
        'Vane grins all his teeth. “An emperor with grease on his hands. The Pack will sing about it.”',
      ),
      hostTerms(
        'moving-caravan',
        'Oriel Saltmarsh of the Saltroad',
        'oriel-saltmarsh',
        'saltroad',
        [
          'The caravan never stops for more than an hour. The court sleeps in the salt wagons, under tarpaulins.',
          'Oriel Saltmarsh’s beak clacks once. “Nobody catches what keeps moving, Majesty. But the night road needs guards, and you brought some.”',
        ],
        'q-d42-caravan-guard',
        '“Splendid,” says Oriel. “We leave in twenty minutes. We always leave in twenty minutes.”',
      ),
      hostTerms(
        'freehold-barn',
        'Hester Plowright of the Border Freeholds',
        'hester-plowright',
        'freeholds',
        [
          'The root cellar smells of earth and apples. Hester has put a quilt on the throne, which is an apple crate.',
          '“You can hide here,” she says. “But the last field is still standing, and I am not losing it to riders on your account.”',
        ],
        'q-d42-barn-harvest',
        'Hester hands you a scythe as though it were a sceptre. “Before dawn,” she says.',
      ),
      hostTerms(
        'rail-station',
        'Jinx Coupler of the Rustline',
        'jinx-coupler',
        'rustline',
        [
          'The collapsed station is full of shining junk and the smell of oil. Jinx Coupler sorts bolts by the light of the court’s only lantern.',
          '“Stay as long as you like,” says Jinx. “There is an engine on the east siding nobody has stripped yet. Strip it with me.”',
        ],
        'q-d42-rail-salvage',
        'Jinx tosses you a wrench. “The shiny bolts are mine,” the magpie says. “All of them.”',
      ),
      hostTerms(
        'nameless-cave',
        'A handful of revolutionaries',
        undefined,
        undefined,
        [
          'Nobody came to shelter the court. Four Mole revolutionaries, a Freehold widow and a deserter from the Gate Watch found you instead, and brought you to a cold cave in the foothills.',
          '“We have no terms,” says the widow. “We have no food, either. That is the first problem.”',
        ],
        'q-d42-cave-forage',
        'The deserter laughs, and then the widow does, and then everyone. It is a terrible cave. It is yours.',
      ),
    ],
  },
  {
    day: 43,
    title: 'Defectors’ Hymn',
    advisor: VELLUM,
    briefings: [
      {
        id: 'watch-split',
        source: 'The host’s lookouts',
        text: 'Some of the Gate Watch rode out with Young Komodo on the last night.',
        truth: true,
      },
      {
        id: 'dunmark-dead',
        source: 'A frightened stablehand',
        text: 'Captain Dunmark died defending the gate.',
        truth: false,
      },
      {
        id: 'rider-coming',
        source: 'The host’s lookouts',
        text: 'A single rider in Gate Watch colours is coming in under a white rag.',
        truth: true,
      },
    ],
    komodo:
      'Not everyone who left with him chose him, Majesty. Some only chose the gate that was open. Hear the rider out before you decide which kind he is.',
    quests: [],
    audiences: [
      {
        id: 'd43-defector',
        title: 'Defectors’ Hymn',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Captain Dunmark’s coat is torn and his gorget is gone. He kneels in the dirt without being asked.',
          '“Half my Watch rode out on an order under your seal, Majesty. I rode with them to see where it led. It led to the Abbey. I came back. Some of them want to. They are waiting on the ridge for your answer.”',
        ],
        options: [
          {
            id: 'welcome',
            label: 'Bring them all in. Nobody is turned away tonight.',
            effects: {
              local: { 'gate-watch': 5 },
              flags: ['watch-returned'],
            },
            response:
              'Dunmark whistles once. Twenty-two guards come down off the ridge, slowly, and then all at once.',
          },
          {
            id: 'dunmark',
            label: 'Dunmark may stay. The others chose.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'Dunmark bows his head. He does not argue, but he walks up to the ridge alone to tell them.',
          },
          {
            id: 'turn',
            label: 'Send them back to the tower to open the gate from inside.',
            requires: { local: { 'gate-watch': 8 } },
            effects: {
              local: { 'gate-watch': 2 },
              flags: ['watch-inside-tower'],
            },
            response:
              'Dunmark’s eyes go very bright. “Yes, Majesty,” he says. “They will like that better than forgiveness.”',
          },
        ],
      },
    ],
  },
  {
    day: 44,
    title: 'The Crow’s Real Name',
    advisor: VELLUM,
    briefings: [
      {
        id: 'crows-letters',
        source: 'Elder Corvane',
        text: 'The Storm Crows watched the letters go up the mission road all year.',
        truth: true,
      },
      {
        id: 'ledger-left',
        source: 'A Lamplight clerk',
        text: 'Komodo left his working ledgers behind in the tower.',
        truth: true,
      },
      {
        id: 'komodo-coin',
        source: 'A tavern rumour',
        text: 'Young Komodo sold the throne for a cart of brass.',
        truth: false,
      },
    ],
    komodo:
      'He did not sell you for brass, Majesty. Nobody that careful sells anything for brass. Find out what he believed he was buying. It may matter more than what he sold.',
    quests: ['q-d44-komodo-bargain'],
    audiences: [
      {
        id: 'd44-crow-name',
        title: 'The Crow’s Real Name',
        speaker: 'Elder Corvane of the Storm Crows',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'Elder Corvane folds his wings and looks at you for a long time.',
          '“We had a name for your advisor, Majesty. All year. The crow who walks. He carried letters up the mission road at night, twice a week, and he never once looked up to see who was watching. We thought you knew.”',
        ],
        options: [
          {
            id: 'why',
            label: 'Why did the Crows not tell the throne?',
            effects: { affinity: { 'storm-crows': -5 } },
            response:
              '“Nobody asked,” says Corvane. “Crows answer questions. We do not volunteer.”',
          },
          {
            id: 'thanks',
            label: 'Thank him, and ask what else the Crows have seen.',
            effects: {
              affinity: { 'storm-crows': 5 },
              flags: ['crow-sightings'],
            },
            response:
              'Corvane tells you, at length. The Abbey has been receiving carts at night for eleven years.',
          },
        ],
      },
    ],
  },
  {
    day: 45,
    title: 'Aid to an Enemy',
    advisor: VELLUM,
    briefings: [
      {
        id: 'verge-fleeing',
        source: 'The host’s lookouts',
        text: 'The plum riders are pulling back from every road toward the Black Verge.',
        truth: true,
      },
      {
        id: 'verge-won',
        source: 'A Gate Watch rumour',
        text: 'The Black Verge Court has made peace with the Abbess.',
        truth: false,
      },
      {
        id: 'envoy-asks',
        source: 'A rider in plum',
        text: 'The Envoy of the Black Verge asks to speak to the emperor in hiding.',
        truth: true,
      },
    ],
    komodo:
      'The riders are running, Majesty, and riders who have been hunting you all month do not run from you. Something has frightened the Verge. I would very much like to know what.',
    quests: [],
    audiences: [
      {
        id: 'd45-envoy',
        title: 'Aid to an Enemy',
        speaker: 'The Envoy of the Black Verge',
        npc: 'the-verge-envoy',
        faction: 'black-verge',
        lines: [
          'The Envoy’s plum coat is muddy to the knee, and their white gloves are gone.',
          '“We bargained with the Abbess too, Majesty. For cures. We did not read the price. Now our manors are full of a singing nobody can stop. The Verge asks the crown it hunted for help.”',
        ],
        options: [
          {
            id: 'aid',
            label: 'Help them. The enemy beneath the Abbey is everyone’s.',
            effects: {
              affinity: { 'black-verge': 20 },
              strength: { 'black-verge': 1 },
              local: { 'old-houses': -2 },
              flags: ['verge-allied'],
            },
            response:
              'The Envoy bows lower than any courtier ever has. “The Verge does not forget a debt,” they say. “Of either kind.”',
          },
          {
            id: 'terms',
            label: 'Help them, if the riders leave the Ford for good.',
            requires: { affinity: { 'black-verge': 'wary' } },
            effects: {
              affinity: { 'black-verge': 5, freeholds: 10 },
              flags: ['verge-allied', 'ford-returned'],
            },
            response:
              'The Envoy closes their eyes. “The Ford,” they agree. “And the fields beside it.”',
          },
          {
            id: 'refuse',
            label: 'The Verge can sing.',
            effects: {
              affinity: { 'black-verge': -20, freeholds: 5 },
            },
            response:
              'The Envoy stands, very straight, and leaves without a word. Behind them, faintly, someone is humming.',
          },
        ],
      },
    ],
  },
  {
    day: 46,
    title: 'The Well That Spoke',
    advisor: VELLUM,
    briefings: [
      {
        id: 'well-water',
        source: 'A thirsty drover',
        text: 'The well has filled with clean water again.',
        truth: false,
      },
      {
        id: 'well-voice',
        source: 'Pilgrims on the mission road',
        text: 'The dry well on the mission road has started answering back.',
        truth: true,
      },
      {
        id: 'well-crypt',
        source: 'The Archive’s maps',
        text: 'The oldest maps show a passage from that well toward the Abbey crypt.',
        truth: true,
      },
    ],
    komodo:
      'A well that answers is a well that leads somewhere, Majesty. The old maps agree. I would send the people who read best in the dark.',
    quests: ['q-d46-well-that-spoke'],
    audiences: [
      {
        id: 'd46-reedlight',
        title: 'A Lantern From the Fen',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        lines: [
          'A heron in a green cloak steps out of the dark at the edge of the firelight, holding a lantern of green glass.',
          '“The Mothers have always known what sleeps under the Abbey, Majesty. We sank the bell’s clapper ourselves, long ago, so nobody could ring it the wrong way. Take the lantern. It burns down there.”',
        ],
        options: [
          {
            id: 'take',
            label: 'Take the lantern, and the Mothers’ help.',
            effects: {
              affinity: { 'mire-mothers': 10 },
              flags: ['reedlight-lantern'],
            },
            response:
              'Reedlight sets the lantern in your hands. It is warm, and it smells faintly of rain.',
          },
          {
            id: 'refuse',
            label: 'The crown has had enough of bargains with covens.',
            effects: { affinity: { 'mire-mothers': -10 } },
            response:
              'Reedlight tilts her long head. “Then find your way in the dark,” she says, not unkindly, and is gone.',
          },
        ],
      },
    ],
  },
  {
    day: 47,
    title: 'Oaths and Knives',
    advisor: VELLUM,
    briefings: [
      {
        id: 'quiet-night',
        source: 'The host’s lookouts',
        text: 'No riders on any road tonight.',
        truth: true,
      },
      {
        id: 'komodo-returning',
        source: 'A hopeful guard',
        text: 'Young Komodo has asked to come back.',
        truth: false,
      },
      {
        id: 'fires-lit',
        source: 'The camp',
        text: 'The court has lit one fire for everyone, for the first time since the tower.',
        truth: true,
      },
    ],
    komodo:
      'A quiet night, Majesty, and perhaps the last one. People will want to say things to you while they still can. Let them.',
    quests: [],
    audiences: [
      {
        id: 'd47-kiyo',
        title: 'A Letter for Later',
        speaker: 'Kiyo',
        requires: { follower: 'F003' },
        lines: [
          'Kiyo sits down beside you with her kettle and does not pour anything.',
          '“If it goes badly at the Abbey, I need someone to know about my boy. He is very small. He wants to be a hero and he cannot finish a cup of tea. He crossed the straits asleep in a basket and never knew we were afraid.”',
          '“I have written him a letter for when he is older. Will you keep it, Majesty? You are the only person I know with a vault.”',
        ],
        options: [
          {
            id: 'keep',
            label: 'Keep the letter safe.',
            effects: { flags: ['kiyo-letter-kept'] },
            response:
              'Kiyo hands you a small envelope with a beetle drawn on the front. “Do not read it,” she says. “It is mostly about beetles.”',
          },
          {
            id: 'home',
            label: 'Tell her to go home to him now, before the Abbey.',
            effects: { flags: ['kiyo-sent-home'] },
            response:
              'Kiyo looks at the fire for a long time. “Not yet,” she says. “Please, not yet. After.”',
          },
        ],
      },
      {
        id: 'd47-saffron',
        title: 'An Old Insignia',
        speaker: 'Saffron Kett',
        requires: { follower: 'F002' },
        lines: [
          'Saffron turns her welded Pack insignia over and over in her fingers.',
          '“Vane has asked me to come home, Majesty. To the Pack. He says the canyon needs a machinist more than a crown does. He might be right.”',
        ],
        options: [
          {
            id: 'stay',
            label: 'Ask her to stay until the end.',
            effects: { flags: ['saffron-stays'] },
            response:
              'Saffron pins the insignia back on her apron. “Until the end,” she agrees. “Then we argue about it.”',
          },
          {
            id: 'go',
            label:
              'Tell her to choose for herself. The crown will not hold her.',
            effects: {
              affinity: { jackalwire: 10 },
              flags: ['saffron-free'],
            },
            response:
              'Saffron laughs, surprised. “Then I choose to stay,” she says. “Because you asked like that.”',
          },
        ],
      },
    ],
  },
  {
    day: 48,
    title: 'The Bell’s Lost Clapper',
    advisor: VELLUM,
    briefings: [
      {
        id: 'clapper-fen',
        source: 'The Archive',
        text: 'The Silent Bell’s clapper was sunk in the Mirefen on purpose.',
        truth: true,
      },
      {
        id: 'abbey-singing',
        source: 'Every lookout',
        text: 'The singing from the Abbey can be heard from the Saltroad now.',
        truth: true,
      },
      {
        id: 'clapper-melted',
        source: 'A sister who fled the Abbey',
        text: 'The Abbess had the clapper melted down years ago.',
        truth: false,
      },
    ],
    komodo:
      'If a bell was silenced on purpose, Majesty, it was because somebody knew what its ringing could do. I find that I would like to hear it.',
    quests: ['q-d48-bell-clapper'],
    audiences: [
      {
        id: 'd48-mara',
        title: 'The Town’s Bell',
        speaker: 'Mayor Mara Reedbell of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Mara Reedbell has walked all night to reach the court.',
          '“Hollow Bell is named for a bell that was hollow, Majesty. Our grandmothers said the Abbey stole its voice. If you bring the clapper home, the town will ring for you. Whatever happens afterwards.”',
        ],
        options: [
          {
            id: 'promise',
            label: 'Promise the town its bell will ring again.',
            effects: {
              affinity: { 'hollow-bell': 10 },
              flags: ['bell-promised'],
            },
            response:
              'Mara takes your hand in both of hers. “Then we will ring it,” she says, “for as long as the Bell stands.”',
          },
          {
            id: 'honest',
            label: 'Promise only to try.',
            effects: { affinity: { 'hollow-bell': 3 } },
            response:
              'Mara nods slowly. “That is more than anyone else has promised,” she says.',
          },
        ],
      },
    ],
  },
  {
    day: 49,
    title: 'Whose Peace?',
    advisor: VELLUM,
    briefings: [
      {
        id: 'abbess-surrenders',
        source: 'A hopeful herald',
        text: 'The Abbess has offered to surrender the tower tomorrow.',
        truth: false,
      },
      {
        id: 'coalition-here',
        source: 'Your host',
        text: 'Every faction still standing has sent someone to the hideout.',
        truth: true,
      },
      {
        id: 'tomorrow',
        source: 'Every lookout',
        text: 'The singing under the Abbey will be loudest tomorrow night.',
        truth: true,
      },
    ],
    komodo:
      'Tomorrow is the Abbey, Majesty. Tonight is everything after it. Whoever you stand beside tonight will shape the kingdom you come back to, if you come back. Choose as if you will.',
    quests: [],
    audiences: [
      {
        id: 'd49-whose-peace',
        title: 'Whose Peace?',
        speaker: 'The coalition in hiding',
        lines: [
          'Around the fire sit envoys of everyone who is still on the map. Nobody has a chair. Everyone has an opinion.',
          'They all want the same thing from you: to know whose peace it will be, if there is one.',
        ],
        options: [
          {
            id: 'roads',
            label:
              'Open roads: every faction governs its own country, together.',
            effects: {
              affinity: { saltroad: 5, freeholds: 5 },
              flags: ['peace-roads'],
            },
            response:
              'There is a long, suspicious silence, and then Oriel Saltmarsh starts drafting a charter on the back of a salt manifest.',
          },
          {
            id: 'bell',
            label: 'A restored Bell: Hollow Bell at the heart of the kingdom.',
            requires: {
              flags: ['clapper-recovered'],
              affinity: { 'hollow-bell': 'friendly' },
            },
            effects: {
              affinity: { 'hollow-bell': 10 },
              flags: ['peace-bell'],
            },
            response:
              'Mara Reedbell stands up and does not know what to do with her hands. Everyone else, for once, agrees.',
          },
          {
            id: 'iron',
            label: 'An iron peace: the Gate Watch keeps order everywhere.',
            requires: { local: { 'gate-watch': 12 } },
            effects: {
              local: { 'gate-watch': 3, 'old-houses': 2 },
              affinity: { moles: -10 },
              flags: ['peace-iron'],
            },
            response:
              'Captain Dunmark salutes. Granny Umber does not. The fire gets noticeably colder on one side.',
          },
          {
            id: 'crows',
            label:
              'The Crows’ bargain: rain for the kingdom, at the Crows’ price.',
            requires: { affinity: { 'storm-crows': 'friendly' } },
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['peace-crows'],
            },
            response:
              'Elder Corvane spreads his wings over the fire, and for a moment the smoke goes sideways, like rain.',
          },
          {
            id: 'witchwater',
            label:
              'The Witchwater throne: the Mire Mothers sit beside the crown.',
            requires: { affinity: { 'mire-mothers': 'friendly' } },
            effects: {
              affinity: { 'mire-mothers': 10, abbey: -10 },
              flags: ['peace-witchwater'],
            },
            response:
              'Sister Reedlight bows her long neck. Somewhere far off in the fen, green lanterns go up one after another.',
          },
          {
            id: 'tunnels',
            label: 'Tunnels and councils: the Moles’ assemblies, everywhere.',
            requires: { affinity: { moles: 'friendly' } },
            effects: {
              affinity: { moles: 10 },
              local: { 'old-houses': -3 },
              flags: ['peace-tunnels'],
            },
            response:
              'Granny Umber bangs her cane on the ground three times. It means the motion carries, and also that she is delighted.',
          },
        ],
      },
    ],
  },
  {
    day: 50,
    title: 'The Last Dispatch',
    advisor: VELLUM,
    briefings: [
      {
        id: 'abbess-calls',
        source: 'Every lookout',
        text: 'Lanterns are moving up the Abbey tower. The Abbess is calling something up.',
        truth: true,
      },
      {
        id: 'komodo-there',
        source: 'Captain Dunmark',
        text: 'Young Komodo is at the Abbey, and he is trying to stop her.',
        truth: true,
      },
      {
        id: 'too-late',
        source: 'A despairing guard',
        text: 'It is already too late to do anything.',
        truth: false,
      },
    ],
    komodo:
      'It is not too late, Majesty. It is only late. Send who you trust most, by whichever road you have. I will be in the Archive, writing down everything, so that whatever happens, somebody remembers it properly.',
    quests: ['q-d50-last-dispatch'],
    audiences: [
      {
        id: 'd50-roads-in',
        title: 'The Roads In',
        speaker: 'The court in hiding',
        lines: [
          'Everyone who can still fight is at the fire. The roads to the Abbey are drawn in the dirt between them.',
          'The front door is the obvious way. There may be others, if the court has earned them.',
        ],
        options: [
          {
            id: 'front',
            label: 'The front door. Everyone together.',
            effects: {},
            response:
              'Nobody argues. Somebody starts handing out bread, which is the closest thing the court has to a war council.',
          },
          {
            id: 'well',
            label: 'Send a small party down the well road as well.',
            requires: { flags: ['crypt-path-found'] },
            effects: {},
            response:
              'The party ties ropes around their waists and does not look at the well for longer than they have to.',
            postsQuests: ['q-d50-crypt-path'],
          },
          {
            id: 'bell',
            label: 'Carry the clapper up the Abbey tower and ring the bell.',
            requires: { flags: ['clapper-recovered'] },
            effects: {},
            response:
              'The clapper hums in its cloth when you lift it. It is very heavy, and it is very nearly singing.',
            postsQuests: ['q-d50-ring-the-bell'],
          },
        ],
      },
    ],
  },
]

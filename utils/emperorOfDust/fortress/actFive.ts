import type {
  AudienceDef,
  AudienceOption,
  DayDef,
  KingdomFactionId,
  QuestDef,
  SceneLine,
} from './types'

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

type HostTerms = {
  hideout: string
  speaker: string
  npc?: string
  /** The host faction; the nameless cave has none and feeds the Yard instead. */
  faction?: KingdomFactionId
  lines: SceneLine[]
  questId: string
  accept: { label: string; response: string }
  /** The question that opens what the host is not saying about the terms. */
  ask: { label: string; response: string }
  truth: SceneLine[]
  /** Accept and bargain again, reworded once the truth is out. */
  acceptAgain: { label: string; response: string }
  bargainAgain: { label: string; response: string }
  /** Paths that only exist once the emperor has asked. */
  paths: AudienceOption[]
}

/** Day 42's host terms, one audience per hideout (flag `hideout:<id>`). */
const hostTerms = (host: HostTerms): AudienceDef => {
  const accept = (label: string, response: string): AudienceOption => ({
    id: 'accept',
    label,
    effects: {
      ...(host.faction
        ? {
            affinity: { [host.faction]: 5 } as Partial<
              Record<KingdomFactionId, number>
            >,
          }
        : { local: { yard: 2 } }),
      flags: ['host-terms-accepted'],
    },
    response,
    postsQuests: [host.questId],
  })
  const bargain = (label: string, response: string): AudienceOption => ({
    id: 'bargain',
    label,
    requires: { cost: 30 },
    effects: { flags: ['host-terms-paid'] },
    response,
  })
  return {
    id: `d42-terms-${host.hideout}`,
    title: 'Lost Without a Banner',
    speaker: host.speaker,
    ...(host.npc ? { npc: host.npc } : {}),
    ...(host.faction ? { faction: host.faction } : {}),
    requires: { flags: [`hideout:${host.hideout}`] },
    lines: host.lines,
    options: [
      accept(host.accept.label, host.accept.response),
      bargain(
        'The crown still pays its own way.',
        'The brass changes hands. Your host looks at you differently afterwards: not more kindly, but more carefully.',
      ),
      {
        id: 'ask',
        label: host.ask.label,
        effects: {},
        response: host.ask.response,
        next: 'price',
      },
    ],
    beats: [
      {
        id: 'price',
        lines: host.truth,
        options: [
          accept(host.acceptAgain.label, host.acceptAgain.response),
          bargain(host.bargainAgain.label, host.bargainAgain.response),
          ...host.paths,
        ],
      },
    ],
  }
}

const vellumSays = (text: string): SceneLine => ({
  who: 'Keeper Vellum',
  npc: 'abelard-vellum',
  text,
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
          'Someone has lit a fire. Around it, in borrowed blankets, is what is left of an imperial court: a few followers, a few guards, a cook still holding a ladle. The smoke goes up into a dark that does not belong to you.',
          'Nobody has unpacked. Bundles sit at people’s feet the way they sit at a waystation, ready to be picked up again in either direction.',
          'They are all looking at you. Nobody says “What now?” out loud.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'The cook with the ladle is Dunmore Ash, foreman of the Yard, who has never said more than he needed to. “Forty of the Yard came out through the kitchens with me, Majesty. Sixty did not. Somebody ought to say something, and it ought not to be me.”',
          },
          vellumSays(
            '“Whatever is said tonight, Majesty, I will write it down. I mention it only so that nobody is surprised later.”',
          ),
        ],
        options: [
          {
            id: 'ask-missing',
            label: 'Ask Dunmore about the sixty who stayed behind.',
            effects: {},
            response:
              'Dunmore lays the ladle across his knees, which for him is a speech in itself.',
            next: 'stayed',
          },
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
        beats: [
          {
            id: 'stayed',
            speaker: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            lines: [
              '“They are not traitors, Majesty. Most of them. The grey sisters came into the kitchens the first night with soup, hot, and blankets that did not smell of smoke. They said the tower would need cooks whoever sat in it.”',
              '“My sister is among them, and a boy I taught to bake. They will be feeding the Abbess’s guards by now. They will be very good at it.”',
              '“If the crown goes back, somebody will ask what to do with them. I would rather it was asked tonight, by the fire, than later, by a rope.”',
              {
                who: 'A Gate Watch sergeant',
                text: '“Soup is soup, Foreman. My lads came out over the wall with arrows in the air. Yours stayed for supper.”',
              },
              vellumSays(
                '“The record can hold either word, Majesty. Stayed, or turned. It cannot hold both, and it will keep whichever one you choose for a very long time.”',
              ),
            ],
            options: [
              {
                id: 'speech',
                label:
                  'Tell the fire the crown is still here, for those who came and those who could not.',
                effects: {
                  local: { yard: 2, 'gate-watch': 2 },
                  flags: ['crown-in-exile'],
                },
                response:
                  'It is not a good speech. It is short, and your voice cracks once. By the end Dunmore is standing up, and the sergeant, after a moment, stands up too.',
              },
              {
                id: 'count',
                label:
                  'Count the brass and the bread first. The sixty can wait.',
                effects: { local: { ledger: 2 } },
                response:
                  'There is less than you hoped and more than you feared. Dunmore says nothing at all, and goes back to stirring.',
              },
              {
                id: 'door-open',
                label:
                  'Send word to the tower kitchens: anyone who walks out will be fed here, no questions asked.',
                effects: {
                  local: { yard: 3, 'gate-watch': -2 },
                  flags: ['d41-kitchen-door-open'],
                },
                response:
                  'Dunmore writes the message himself, slowly, in flour on the back of a board, and a stablehand carries it off into the dark. The sergeant spits into the fire and says that is how spies get fed.',
              },
              {
                id: 'names',
                label:
                  'Have Vellum write down the name of everyone who stayed. The crown will decide later.',
                effects: {
                  local: { 'gate-watch': 2, lamplight: 1, yard: -3 },
                  flags: ['d41-stayers-listed'],
                },
                response:
                  'Vellum writes sixty names in his slow, even hand while Dunmore watches. The foreman does not ask to see the page. He does not hand you any more soup that night, either.',
              },
            ],
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
          'Keeper Vellum has carried the last crate the whole way himself. Mud to the knee, he sets it down by the fire as gently as if it were asleep, and opens it.',
          'Inside, packed in straw, are the Archive’s oldest maps, two hundred years of tax rolls, and one ledger bound in Komodo’s brass-buttoned style.',
          '“His hand, Majesty. Every page. I matched it on the night. I am sorry I was not faster.”',
          '“It is a working ledger. Payments, letters, names. Some of the names are at this fire.”',
        ],
        options: [
          {
            id: 'ask-names',
            label: 'Ask whose names are in it.',
            effects: {},
            response:
              'Vellum takes a very long time to choose the page. It is not the first page he turns to.',
            next: 'names',
          },
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
        beats: [
          {
            id: 'names',
            lines: [
              '“Lady Vask’s house took his money for two years and asked no questions. Factor Tallow lent against the Abbey’s credit, and he signed for it. There are payments to a sergeant of the Watch, a clerk of my own Archive, and a stablehand who is asleep twenty feet from you.”',
              '“And there is a column with your name at the top, Majesty. It is headed: What the emperor will forgive. He kept it current to the last week.”',
              '“A ledger like this is a weapon. I would like to put it on a shelf. I know that is not always what is done with weapons.”',
            ],
            options: [
              {
                id: 'read',
                label: 'Read it together, tonight, and keep it on the shelf.',
                effects: {
                  local: { lamplight: 3 },
                  flags: ['komodo-ledger-saved'],
                },
                response:
                  'You read until the fire is embers. Komodo kept careful accounts of everything, including you. The column about forgiveness is longer than you would have guessed.',
              },
              {
                id: 'publish',
                label:
                  'Copy the payments and send them to every faction. Let the kingdom see who was bought.',
                effects: {
                  local: { lamplight: 2, 'old-houses': -3, ledger: -2 },
                  affinity: { abbey: -5 },
                  flags: ['komodo-ledger-saved', 'd41-ledger-published'],
                },
                response:
                  'Vellum copies it himself, which takes all night. By the end of the week the stablehand is gone from the camp, and Lady Vask has written to say she was always the crown’s friend, in a hand that shakes.',
              },
              {
                id: 'burn',
                label:
                  'Burn it. The court cannot rebuild if everyone at the fire is a name in his book.',
                effects: {
                  local: { lamplight: -3, yard: 2, 'old-houses': 1 },
                  flags: ['d41-ledger-burned'],
                },
                response:
                  'Vellum does not stop you. He watches the pages curl, perfectly still, the archive keys silent at his belt, and afterwards he goes and sits alone at the edge of the firelight until dawn.',
              },
            ],
          },
        ],
      },
      {
        // Callback: the emperor let Komodo ride out on the crown's business (Day 40).
        id: 'd41-trusted-road',
        title: 'The Leave You Gave',
        speaker: 'Keeper Abelard Vellum',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['komodo-leave-granted'] },
        lines: [
          'Later, when most of the camp is asleep, Vellum comes and sits beside you with a sheaf of gate-logs he should not have been able to save.',
          '“I have been reading how it was done, Majesty. It was not clever. That is what I keep coming back to.”',
          '“He rode out with the crown’s leave. Every gate on the mission road opened for him, because you had told them he rode on the crown’s business. At the Abbey he gave the sisters your seal, and the sisters gave it to the tower guard, and the tower guard opened the doors to it. Nobody disobeyed anyone.”',
          '“I would like to know what I am to write. Whether it was trust that failed, or only him.”',
        ],
        options: [
          {
            id: 'ask-gate',
            label: 'Ask what Komodo said to the guard at the last gate.',
            effects: {},
            response:
              'Vellum finds the page without looking for it. He has read it many times.',
            next: 'last-gate',
          },
          {
            id: 'trust-stands',
            label:
              'Write that trust was not the mistake. The crown will go on trusting people.',
            effects: {
              local: { yard: 2, 'gate-watch': -1 },
              flags: ['d41-trust-kept'],
            },
            response:
              'Vellum writes it. Then he adds a line underneath, in smaller letters, and does not show you. That night a guard you hardly know is given the watch, and you sleep anyway.',
          },
          {
            id: 'two-hands',
            label:
              'Write that no order goes out again under one seal. Every command needs two hands.',
            effects: {
              local: { 'gate-watch': 2, lamplight: 1, yard: -2 },
              flags: ['d41-two-hands'],
            },
            response:
              '“Two hands,” Vellum repeats, and writes it. By noon the cook needs a countersignature for the flour. Nobody says it is a bad rule. Everybody says it slowly.',
          },
        ],
        beats: [
          {
            id: 'last-gate',
            lines: [
              '“That he was sorry for the hour. That the emperor would understand by morning. And he asked the guard’s name, and wrote it down.”',
              '“He was polite to every guard on that road, Majesty. I find that harder to forgive than the seal.”',
              '“There is a third thing I could write. Every order ever given under that seal was given by a hand we now know was his, at least some of the time. The land grants. The pardons. The Watch commissions. I could write that none of them stand.”',
            ],
            options: [
              {
                id: 'trust-stands',
                label:
                  'Write that trust was not the mistake. The crown will go on trusting people.',
                effects: {
                  local: { yard: 2, 'gate-watch': -1 },
                  flags: ['d41-trust-kept'],
                },
                response:
                  'Vellum writes it, and underlines it, which you have never seen him do. “It will be quoted against you,” he says. “I hope it is also quoted for you.”',
              },
              {
                id: 'two-hands',
                label: 'Write that every command needs two hands from now on.',
                effects: {
                  local: { 'gate-watch': 2, lamplight: 1, yard: -2 },
                  flags: ['d41-two-hands'],
                },
                response:
                  '“Two hands,” Vellum repeats, and writes it. By noon the cook needs a countersignature for the flour, and the Watch has started asking each other for theirs.',
              },
              {
                id: 'void-seal',
                label:
                  'Write that every order under the old seal is void, the good ones too.',
                effects: {
                  local: { lamplight: 2, 'old-houses': -3 },
                  flags: ['d41-seal-voided'],
                },
                response:
                  'Vellum writes it, very slowly, because he knows what it does. Every land grant the Old Houses hold under that seal is paper by morning. Lady Vask’s reply arrives within the week. It is two words long, and neither of them is polite.',
              },
            ],
          },
        ],
      },
      {
        // Callback: the emperor kept Komodo at court on the last night (Day 40).
        id: 'd41-midnight-gate',
        title: 'Who Opened the Gate',
        speaker: 'A young sentry of the Gate Watch',
        faction: 'gate-watch',
        requires: { flags: ['komodo-asked-to-stay'] },
        lines: [
          'A young sentry in a scorched Watch tabard has been sitting just outside the firelight all evening, not eating. When the camp goes quiet she comes and kneels, without being asked, the way people kneel when they have rehearsed it.',
          '“I had the gate at midnight, Majesty. The advisor came down to check it. He said you had asked him to stay, and he had stayed, and now he would like to see the road for a moment, for the air.”',
          '“He had the seal. He always had the seal. I lifted the bar for him, and when he went out, they came in.”',
          '“I have walked here to be judged. I would rather it was you than anyone.”',
        ],
        options: [
          {
            id: 'ask-words',
            label: 'Ask what Komodo said to her as he went out.',
            effects: {},
            response:
              'She swallows. She has clearly said the words to herself so often they no longer sound like words.',
            next: 'last-words',
          },
          {
            id: 'forgive',
            label:
              'Tell her the fault is the crown’s. You kept him by the fire yourself.',
            effects: {
              local: { 'gate-watch': -1, yard: 2 },
              flags: ['d41-crown-owns-the-gate'],
            },
            response:
              'She does not seem to understand at first. Then she puts her face in her hands. In the morning she is first up, splitting wood, and she does not stop all day.',
          },
          {
            id: 'judge',
            label:
              'She broke her watch. Strip her tabard in front of the fire.',
            effects: {
              local: { 'gate-watch': 2, yard: -2 },
              flags: ['d41-sentry-stripped'],
            },
            response:
              'The sergeant does it quickly, and not unkindly. She folds the tabard herself before she hands it over. Nobody at the fire looks at you for a while.',
          },
        ],
        beats: [
          {
            id: 'last-words',
            lines: [
              '“He said: tell the emperor I stayed, as asked. And then he said: lift it all the way, please, the horses are tall.”',
              '“He thanked me, Majesty. He always thanked the gate.”',
              {
                who: 'A Gate Watch sergeant',
                text: '“That was a sentence written in advance. He made you the messenger for his joke, girl. Majesty, the Watch will want somebody to answer for that gate, and it cannot be him.”',
              },
              vellumSays(
                '“It can be the record, Sergeant. The record can answer for a great deal, if it is allowed to say what happened.”',
              ),
            ],
            options: [
              {
                id: 'forgive',
                label:
                  'Tell her the fault is the crown’s. You asked him to stay.',
                effects: {
                  local: { 'gate-watch': -1, yard: 2 },
                  flags: ['d41-crown-owns-the-gate'],
                },
                response:
                  'The sergeant looks at you as if you had handed him a live coal. The sentry does not cry. In the morning she is first up, splitting wood, and she does not stop all day.',
              },
              {
                id: 'judge',
                label:
                  'She lifted the bar. Strip her tabard in front of the fire.',
                effects: {
                  local: { 'gate-watch': 2, yard: -2 },
                  flags: ['d41-sentry-stripped'],
                },
                response:
                  'The sergeant does it quickly, and not unkindly. She folds the tabard herself before she hands it over. Nobody at the fire looks at you for a while.',
              },
              {
                id: 'witness',
                label:
                  'Let her tell the whole camp what happened, word for word. Then let them decide.',
                effects: {
                  local: { lamplight: 2, 'gate-watch': -1 },
                  flags: ['d41-sentry-testified'],
                },
                response:
                  'She tells it standing, by the fire, twice, because the first time her voice goes. Afterwards nobody decides anything. A cook brings her a bowl, and she eats for the first time in three days.',
              },
            ],
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
      hostTerms({
        hideout: 'mole-tunnels',
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        lines: [
          'The tunnels smell of wet clay and lamp smoke. Notices for meetings are pinned to every prop: on wages, on water, on whether the meetings themselves are being held too often.',
          'Granny Umber has given you the driest chamber in the tunnels and a mug of something hot. She peers at you over her thick spectacles as though you were a motion she has not yet decided to second.',
          '“Twenty years we dug under your tower, Majesty. Twenty years we wanted it empty. Now it is empty, and the wrong people are sitting in it.”',
          '“You can stay as long as you like. But down here everybody digs. Even emperors.”',
          {
            who: 'A young Mole organiser',
            text: '“Some of us dug to bring the crown down, Granny. Not to tuck it in.”',
          },
        ],
        questId: 'q-d42-tunnel-props',
        accept: {
          label: 'Accept the host’s terms, and pick up a shovel.',
          response:
            '“Good,” says Granny Umber. “Mind the third prop. It sulks.”',
        },
        ask: {
          label: 'Ask how the assembly voted on sheltering the crown.',
          response:
            'Granny Umber taps her cane twice on the floor. The young organiser takes it as a cue to leave the chamber, and does.',
        },
        truth: [
          '“Thirty-one to thirty, Majesty. And the thirty-first was me, and I am old, and they know it.”',
          '“The thirty would have sent you up the mission road with a ribbon on. There is a price on your head in grey brass, and grey brass would feed every burrow in the badlands through the winter.”',
          '“So I did not win that vote on your account. I won it on mine. I told them a crown that owes the Moles is worth more than a crown the Abbess owns. Prove me right, or I lose the next one.”',
          vellumSays(
            '“They will want it in writing, Majesty. The Moles always want it in writing. I say so as someone who has read every one of their manifestos twice.”',
          ),
        ],
        acceptAgain: {
          label: 'Take up a shovel with the rest of them. Deeds first.',
          response:
            '“Deeds first,” Granny Umber agrees. “Mind the third prop. It sulks, and so do the thirty.”',
        },
        bargainAgain: {
          label:
            'Pay the burrows in brass, so the thirty have something besides your head.',
          response:
            'Granny Umber counts it into two exact piles, one for each side of the vote. “That will keep them arguing,” she says. “Arguing is how we keep our hands off people.”',
        },
        paths: [
          {
            id: 'sign-charter',
            label:
              'Sign the assembly’s charter: after the war, the crown answers to councils.',
            effects: {
              affinity: { moles: 10 },
              local: { 'old-houses': -3 },
              flags: ['d42-mole-charter-signed'],
            },
            response:
              'Granny Umber has the charter out of her vest before you finish the sentence. You sign it on a crate, by lamplight, and thirty-one votes become thirty-five by morning. Somewhere far above, Lady Vask will one day read a copy, and say nothing for a long time.',
          },
          {
            id: 'face-thirty',
            label:
              'Go down and face the thirty yourself, tonight, without guards.',
            effects: {
              affinity: { moles: 5 },
              local: { 'gate-watch': -2, yard: 1 },
              flags: ['d42-faced-the-thirty'],
            },
            response:
              'You stand in a chamber full of people who would sell you and tell them you know it. The first hour goes badly and the second goes better. When you come out, two of the thirty walk you back to your blanket, and do not say whether it was an escort or a guard.',
          },
        ],
      }),
      hostTerms({
        hideout: 'crow-cave',
        speaker: 'Elder Corvane of the Storm Crows',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'The cave smells of rain and feathers. Water runs down one wall into a stone basin, and the Crows drink from it in turn, by rank, without hurry.',
          'Elder Corvane watches you from a ledge above the fire. The copper chimes on his mantle are silent, which the younger crows treat as a weather warning.',
          '“The Crows keep what they shelter, Majesty. We have kept worse than an emperor, and better.”',
          '“In return, the court keeps watch with us. The Abbey road needs more eyes. Ours are old.”',
        ],
        questId: 'q-d42-crow-watch',
        accept: {
          label: 'Accept the host’s terms, and stand the watch.',
          response:
            'Corvane nods once. “Clean,” he says. It is the warmest thing he has ever said to you.',
        },
        ask: {
          label: 'Ask who else the Crows are keeping.',
          response:
            'Corvane looks at you for a long time, as Crows do before they answer a question nobody has asked them before.',
        },
        truth: [
          '“There is a sister of the Abbey in the next cave. A messenger. Grey robe, very polite. She came in out of the rain two nights before you did.”',
          '“The Crows keep what they shelter. Her, too. We do not take sides in a storm. We sell the rain to whoever is standing in the field.”',
          '“She has asked us where you are. We have not told her. We had not told you where she was, either, until now. That is what neutral means.”',
          vellumSays(
            '“A messenger knows the Abbey’s roads, Majesty. And she knows ours by now, I should think.”',
          ),
        ],
        acceptAgain: {
          label:
            'Keep the watch with the Crows, and leave their other guest alone.',
          response:
            'Corvane nods once. “Clean,” he says. That night you hear the sister singing in the next cave, very softly, and you do not go and look.',
        },
        bargainAgain: {
          label:
            'Pay the Conclave to keep its other guest quiet and its eyes on the road.',
          response:
            'The brass goes into the stone basin, which is apparently where the Crows keep brass. Corvane does not count it. He does not need to.',
        },
        paths: [
          {
            id: 'take-messenger',
            label:
              'Demand the Abbey’s messenger. Shelter does not cover spies.',
            effects: {
              affinity: { 'storm-crows': -10 },
              local: { 'gate-watch': 2 },
              flags: ['d42-abbey-messenger-taken'],
            },
            response:
              'Corvane does not stop you. He does not help, either. The sister comes quietly, smiling, and tells your guards the names of all their mothers. By morning the Crows have moved the court’s blankets to the draughty end of the cave.',
          },
          {
            id: 'send-word',
            label:
              'Let the messenger go home, carrying a letter from the crown to the Abbess.',
            effects: {
              affinity: { 'storm-crows': 5 },
              local: { 'gate-watch': -2 },
              flags: ['d42-letter-to-abbess'],
            },
            response:
              'You write four lines. The sister reads them, thanks you warmly, and walks out into the rain with your letter against her heart. Corvane watches her all the way down the mountain. “Bold,” he says. It is not clear that he means it kindly.',
          },
        ],
      }),
      hostTerms({
        hideout: 'bell-cellars',
        speaker: 'Mayor Mara Reedbell of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'The cellars under the chapel are cool and crowded: barrels of last year’s cider, the town’s records in oilcloth, and now an imperial court, sleeping between the casks.',
          'Above, the town’s small bell is silent on your account. The children have been told it is broken. They have been told not to tell anyone that it is not.',
          'Mara Reedbell comes down the stair with a lamp and wipes her hands on her mended sash.',
          '“Stay, Majesty. Hollow Bell has hidden worse things than a crown, and been ashamed of more of them. But this town gave its water to the war, and it needs the aqueduct running.”',
        ],
        questId: 'q-d42-bell-water',
        accept: {
          label: 'Accept the host’s terms, and send hands to the aqueduct.',
          response:
            'Mara smiles for the first time in days. “Then you are welcome here, for as long as the Bell stands.”',
        },
        ask: {
          label: 'Ask whether anyone else has asked the Bell for you.',
          response:
            'Mara sets the lamp on a cider barrel, and her hand stays on it, as if she needs it there.',
        },
        truth: [
          '“Sister Marrow came to the chapel door last night. Very kind. She brought a cask of the Abbey’s deep-well water, for the children.”',
          '“She said the Abbess would keep Hollow Bell in water for a hundred years, for the price of one guest in a cellar. She did not say which guest. She did not need to.”',
          '“I told her no. I have not told the council. If they hear that offer from anyone but me, Majesty, I will not be mayor by Thursday, and you will not be in this cellar by Friday.”',
          vellumSays(
            '“The Bell has taken that water before, Majesty. I think the mayor remembers what it cost better than any archive could.”',
          ),
        ],
        acceptAgain: {
          label: 'Keep her secret, and send hands to the aqueduct.',
          response:
            'Mara breathes out. “Then you are welcome here,” she says, “for as long as the Bell stands.” She pours the Abbey’s cask into the gutter herself, very slowly.',
        },
        bargainAgain: {
          label:
            'Pay the town for its trouble, so the next cask is easier to refuse.',
          response:
            'Mara puts the brass in the chapel box without counting it. “For the wards,” she says. “They will drink our own water, and they will not know why it tastes better.”',
        },
        paths: [
          {
            id: 'tell-council',
            label:
              'Tell the council about the Abbess’s offer yourself, tonight, and let them vote.',
            effects: {
              affinity: { 'hollow-bell': -5 },
              local: { lamplight: 2 },
              flags: ['d42-bell-council-told'],
            },
            response:
              'The council meets in the cellar, beside your blanket, because there is nowhere else. They vote eleven to four to keep you. Mara does not look at you once during the counting, and afterwards she climbs to the bell that is not broken, and does not ring it.',
          },
          {
            id: 'take-water',
            label:
              'Take the Abbey’s water for the children, and send Marrow nothing but thanks.',
            effects: {
              affinity: { 'hollow-bell': 5, abbey: 5 },
              local: { lamplight: -2 },
              flags: ['d42-abbey-water-taken'],
            },
            response:
              'The children drink it. It is very good water, cold and clean and faintly sweet. Mara watches them with her hands folded tight, and that evening Sister Marrow is seen at the edge of town, smiling, counting the cellar windows.',
          },
        ],
      }),
      hostTerms({
        hideout: 'wagon-circle',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'The painted wagons have closed into a ring in the canyon, wheel to wheel, with the court’s blankets in the middle like the yolk in an egg.',
          'Somebody is always playing something. Tonight it is a fiddle, badly, and a drum, well.',
          'Captain Gristle Vane sweeps down off a wagon roof in his greatcoat of feathers and bows so low his ear-chain rings.',
          '“Nobody finds the Pack unless the Pack wants finding, Majesty. But a circle that stops rolling is a target, and you are the most valuable thing we have ever parked.”',
        ],
        questId: 'q-d42-wagon-wheels',
        accept: {
          label: 'Accept the host’s terms, and get grease on your hands.',
          response:
            'Vane grins all his teeth. “An emperor with grease on his hands. The Pack will sing about it.”',
        },
        ask: {
          label: 'Ask what the Pack has been offered for you.',
          response:
            'Vane’s grin does not move at all. The drum stops, which is worse.',
        },
        truth: [
          '“A wagonload of grey brass. The southern tolls, forever, under the Abbess’s seal. And medicine, as much as the pups can drink, which is the part I had to think about.”',
          '“I said no, because I like you, and because a Pack that sells its guests sells nothing ever again. But I am a raider, Majesty, and the canyon is listening, and I would like something to tell it.”',
          '“What does the crown offer, when it has no tower?”',
          vellumSays(
            '“The tolls, Majesty, are the Saltroad’s grain and medicine. Whatever you promise him, somebody else will pay for it.”',
          ),
        ],
        acceptAgain: {
          label:
            'Offer what the crown has: hands, and grease, and a debt it will remember.',
          response:
            'Vane considers this, then roars with laughter. “An emperor with grease on his hands. The Pack will sing about it.” The drum starts again.',
        },
        bargainAgain: {
          label: 'Pay brass now, while the crown still has some.',
          response:
            'Vane bites a brass bit and pockets the rest. “Cash,” he says fondly. “Cash never asks what happens afterwards.”',
        },
        paths: [
          {
            id: 'promise-tolls',
            label:
              'Promise the Pack the southern toll bridge for good, after the war.',
            effects: {
              affinity: { jackalwire: 10, saltroad: -10 },
              flags: ['d42-pack-tolls-promised'],
            },
            response:
              'Vane has the promise painted on the side of his own wagon by morning, in letters a foot high. Somewhere on the Saltroad, a factor reading the night’s dispatches puts down her pen.',
          },
          {
            id: 'dare',
            label:
              'Tell him the crown will not be bid on. If the Pack wants to sell, let it sell.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { 'gate-watch': 2, yard: 1 },
              flags: ['d42-dared-the-pack'],
            },
            response:
              'The circle goes very quiet. Then Vane laughs, too loudly, and says nobody is selling anybody, and the fiddle starts up again. That night the court sleeps in shifts, and so, you notice, does the Pack.',
          },
        ],
      }),
      hostTerms({
        hideout: 'moving-caravan',
        speaker: 'Oriel Saltmarsh of the Saltroad',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'The caravan never stops for more than an hour. The court sleeps in the salt wagons under tarpaulins, rocking, with the smell of brine and wet canvas and somebody’s goat.',
          'Oriel Saltmarsh walks the length of the line twice an hour, counting wagons out loud. You are a wagon now. She counts you too.',
          '“Nobody catches what keeps moving, Majesty. But the night road needs guards, and you brought some.”',
          '“I will be plain. Every hour you ride with us is an hour the Abbess may decide the Saltroad is her enemy. I would like that hour to be worth it.”',
        ],
        questId: 'q-d42-caravan-guard',
        accept: {
          label: 'Accept the host’s terms, and ride guard on the night road.',
          response:
            '“Splendid,” says Oriel. “We leave in twenty minutes. We always leave in twenty minutes.”',
        },
        ask: {
          label: 'Ask what the back half of the caravan is carrying.',
          response:
            'Oriel’s beak clacks once, and she stops counting, which she has never done in front of you before.',
        },
        truth: [
          '“Medicine and grain in the front wagons. In the back six, sealed freight for the Abbey. Bolts of grey cloth, lamp oil, and crates I am paid very well not to open.”',
          '“The Abbey has paid on time for eleven years, Majesty. Nobody else has. Half my drivers eat because of those six wagons.”',
          '“So you are riding to war against the Abbess in a caravan making her deliveries. I thought you should know. I did not think you would like it.”',
          vellumSays(
            '“Eleven years, Majesty. Elder Corvane would give you the same number for the carts on the mission road.”',
          ),
        ],
        acceptAgain: {
          label:
            'Guard the whole caravan, the back six too. Drivers have to eat.',
          response:
            '“Splendid,” says Oriel, without any splendour at all. “We leave in twenty minutes. We always leave in twenty minutes.”',
        },
        bargainAgain: {
          label:
            'Pay the Saltroad to leave the back six at the next waystation.',
          response:
            'Oriel counts the brass as she counts everything, out loud. The six wagons stay behind at a waystation with a note. The caravan moves faster for it, and more quietly.',
        },
        paths: [
          {
            id: 'open-crates',
            label:
              'Open the Abbey’s crates tonight, and see what the Saltroad carries.',
            effects: {
              affinity: { saltroad: -5, abbey: -10 },
              local: { lamplight: 2 },
              flags: ['d42-abbey-crates-opened'],
            },
            response:
              'The crates hold small iron bed-frames, and a great many little grey blankets, all folded exactly the same. Oriel looks at them for a very long time. Then she has the six wagons burned on the salt flats, and does not speak to anyone until morning.',
          },
        ],
      }),
      hostTerms({
        hideout: 'freehold-barn',
        speaker: 'Hester Plowright of the Border Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        lines: [
          'The root cellar smells of earth and apples. Hester has put a quilt on the throne, which is an apple crate, and a jar of wildflowers beside it, which she will deny later.',
          'Through the cellar boards you can hear her sister’s hens, and above them, very far off, a rider’s horn.',
          'Hester Plowright stands at the foot of the ladder with her basket on her arm, planted like a fence post.',
          '“You can hide here,” she says. “But the last field is still standing, and I am not losing it to riders on your account.”',
        ],
        questId: 'q-d42-barn-harvest',
        accept: {
          label: 'Accept the host’s terms, and bring in the field.',
          response:
            'Hester hands you a scythe as though it were a sceptre. “Before dawn,” she says.',
        },
        ask: {
          label: 'Ask why riders would bother to burn one field.',
          response:
            'Hester sets the basket down. She counts the eggs in it before she answers, which is how you know she does not want to.',
        },
        truth: [
          '“They are not after the field, Majesty. They are after the barn with an emperor in the cellar. They burned the Pardoes’ hayricks yesterday, two farms over, and tied a grey ribbon on the gate.”',
          '“A ribbon on every gate until somebody talks. That is what they told the Pardoes. Nobody has talked. Nobody will. But the Freeholds count their grudges, and this one is being counted against you as well as them.”',
          '“So bring in my field. Then nobody can say the crown came here and only took.”',
          vellumSays(
            '“The Pardoes have four children, Majesty. I counted them at the gate this morning. I am sorry. I count things.”',
          ),
        ],
        acceptAgain: {
          label:
            'Bring in her field before dawn, and stand on it if the riders come.',
          response:
            'Hester hands you a scythe as though it were a sceptre. “Before dawn,” she says. “And if they come, stand where they can see the crown.”',
        },
        bargainAgain: {
          label:
            'Pay the Pardoes for their hayricks, so the grudge has a price on it.',
          response:
            'Hester takes the brass to the Pardoes herself. She comes back with a little less of it and a basket of eggs, which in the Freeholds is a receipt.',
        },
        paths: [
          {
            id: 'decoy',
            label:
              'Send the Watch to fire an empty barn on the far ridge, so the riders chase the smoke.',
            effects: {
              affinity: { freeholds: -5 },
              local: { 'gate-watch': 2 },
              flags: ['d42-decoy-barn'],
            },
            response:
              'It works. The riders ride east all night after a fire on the ridge, and the Pardoes sleep. Nobody tells you whose barn it was until morning, when Hester does, by name, twice.',
          },
          {
            id: 'ribbon',
            label:
              'Ride to the Pardoes’ gate yourself and take the ribbon down, in daylight.',
            effects: {
              affinity: { freeholds: 10 },
              local: { 'gate-watch': -2 },
              flags: ['d42-ribbon-taken-down'],
            },
            response:
              'You untie the ribbon with your own hands while the Pardoe children watch from the window. By noon every farm in the valley knows the emperor is somewhere near, and by dusk three of them have put out an extra bowl. So, you suspect, has somebody who will tell the riders.',
          },
        ],
      }),
      hostTerms({
        hideout: 'rail-station',
        speaker: 'Jinx Coupler of the Rustline',
        npc: 'jinx-coupler',
        faction: 'rustline',
        lines: [
          'The collapsed station is full of shining junk and the smell of oil. Rails run in through one wall and stop in the middle of the floor, as though the train simply got tired.',
          'Jinx Coupler sorts bolts by the light of the court’s only lantern, into heaps that make sense only to Jinx, humming to them.',
          '“Stay as long as you like, Majesty. Everything here is for sale except the roof, and the roof is only not for sale because it is mostly gone.”',
          '“There is an engine on the east siding nobody has stripped yet. Strip it with me. Fair shares, by which I mean my shares.”',
        ],
        questId: 'q-d42-rail-salvage',
        accept: {
          label: 'Accept the host’s terms, and pick up a wrench.',
          response:
            'Jinx tosses you a wrench. “The shiny bolts are mine,” the magpie says. “All of them.”',
        },
        ask: {
          label: 'Ask who the engine belonged to.',
          response:
            'Jinx holds a bolt up to the lantern, turns it, and does not look at you. “Belonged,” the magpie says. “Past tense. Good word.”',
        },
        truth: [
          '“Grey paint under the rust, Majesty. Abbey engine. It hauled the night carts up the mission road for years, until the line flooded.”',
          '“And there is a buyer for its parts already. Wears grey, pays in grey brass, asks very politely. They want it running again. I want to be paid. You see the difficulty.”',
          '“Strip it and sell it to them, and the court eats all winter. Strip it and keep it, and I am poorer and you are safer. You could even break it, if you like breaking things. I do not.”',
          vellumSays(
            '“If the Abbey wants a dead engine running again, Majesty, I should very much like to know what it means to carry.”',
          ),
        ],
        acceptAgain: {
          label: 'Strip it with Jinx, and keep every part out of grey hands.',
          response:
            'Jinx tosses you a wrench. “The shiny bolts are mine,” the magpie says. “All of them. The grey buyer can have the rust.”',
        },
        bargainAgain: {
          label: 'Pay Jinx for the parts, so nobody needs the grey buyer.',
          response:
            'Jinx weighs the brass in one claw and the engine in the other, and sighs. “You make a terrible customer,” they say. “You pay.”',
        },
        paths: [
          {
            id: 'sell-grey',
            label:
              'Sell the parts to the grey buyer. The court needs brass more than principles.',
            effects: {
              brass: 25,
              affinity: { rustline: 5, abbey: 5 },
              local: { lamplight: -2 },
              flags: ['d42-engine-sold-grey'],
            },
            response:
              'The buyer comes at dusk, with a smile and a cart. Jinx counts the brass three times. Two nights later, far off on the mission road, you hear an engine running that should not be able to run.',
          },
          {
            id: 'wreck',
            label:
              'Break it where it stands. Nothing goes up that road on it again.',
            effects: {
              affinity: { rustline: -10 },
              local: { 'gate-watch': 1, lamplight: 1 },
              flags: ['d42-engine-wrecked'],
            },
            response:
              'It takes all night and most of the court. Jinx watches with their coat bristling and every bottle cap rattling, and does not lift a claw. By morning the engine is scrap, and the magpie will not sell you so much as a nail for the rest of the week.',
          },
        ],
      }),
      hostTerms({
        hideout: 'nameless-cave',
        speaker: 'A handful of revolutionaries',
        lines: [
          'Nobody came to shelter the court. Four Mole revolutionaries, a Freehold widow and a deserter from the Gate Watch found you instead, on the road, and brought you to a cold cave in the foothills.',
          'The cave has one good wall, a spring that tastes of iron, and a painting of a horse on the ceiling that is older than anything else you own.',
          'The Moles argue in whispers about whether this counts as collaborating. The deserter will not take off his helmet. The widow takes charge, because somebody has to.',
          '“We have no terms,” says the widow. “We have no food, either. That is the first problem.”',
        ],
        questId: 'q-d42-cave-forage',
        accept: {
          label: 'Accept that there are no terms, and go and find food.',
          response:
            'The deserter laughs, and then the widow does, and then everyone. It is a terrible cave. It is yours.',
        },
        ask: {
          label: 'Ask the deserter why he left the Watch.',
          response:
            'The deserter takes off his helmet at last. He is younger than his voice.',
        },
        truth: [
          '“I was on the north wall the night it fell, Majesty. I saw them come in. I saw who opened the gate. I ran.”',
          '“I ran the wrong way, at first. Then I ran this way. These four found me in a ditch, and the widow said a deserter could carry as well as anyone.”',
          '“I am not asking for anything. I wanted you to know there is someone in this cave who ran, before you trust the rest of us.”',
          {
            who: 'The Freehold widow',
            text: '“He has carried more water than the Moles have, Majesty, and complained less. I would keep him. But it is your cave now.”',
          },
        ],
        acceptAgain: {
          label:
            'Find food first. Everyone in this cave forages, the deserter too.',
          response:
            'The deserter laughs, and then the widow does, and then everyone. It is a terrible cave. It is yours, and all of them are in it.',
        },
        bargainAgain: {
          label: 'Spend the crown’s brass on bread from the nearest farm.',
          response:
            'The widow goes down with the brass and comes back with bread, cheese, and the news that the farm will tell nobody, for now. “For now,” she says, “is the best price in the Freeholds.”',
        },
        paths: [
          {
            id: 'pardon',
            label:
              'Pardon him, out loud, so the Moles hear what a crown can still do.',
            effects: {
              local: { yard: 2, 'gate-watch': -2 },
              flags: ['d42-deserter-pardoned'],
            },
            response:
              'You say it in front of all six of them. The Moles stop arguing for a whole minute. The deserter does not thank you. He goes out and comes back with a bundle of firewood bigger than he is, and does it again, and again, until you tell him to stop.',
          },
          {
            id: 'send-away',
            label:
              'Send him away. A court with nothing left cannot afford one more who runs.',
            effects: {
              local: { 'gate-watch': 2, yard: -2 },
              flags: ['d42-deserter-sent-away'],
            },
            response:
              'He nods as though he expected it, puts his helmet back on, and walks out into the dark. The widow says nothing. In the morning one of the Moles is gone as well, and has taken the good blanket.',
          },
        ],
      }),
      {
        // Callback: the crown paid a Pack informant for the camp map (Day 1).
        id: 'd42-cage-wagon',
        title: 'The Ration Card',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { flags: ['hideout:wagon-circle', 'pack-camp-mapped'] },
        lines: [
          'Later, when the fiddle has stopped, Vane crouches by your blanket with something in his paw. It is an old ration card, soft with handling, with the Pack’s camp drawn on the back in charcoal.',
          '“Found this when your tower fell, Majesty. Pinned above the Gate Watch fire, all these years. Somebody drew our camp for the crown on the first day you sat in that chair.”',
          '“We know whose paw drew it. She is in the cage wagon. She still has a bandage on that paw, would you believe. Some things do not heal.”',
          '“So. Tell me she sold us on her own, and the Pack deals with its own the way the Pack does. Or tell me the crown paid her, and she is only a fool, and the debt is yours.”',
        ],
        options: [
          {
            id: 'confess',
            label: 'The crown paid her. The debt is the crown’s, not hers.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { yard: 1 },
              flags: ['d42-informant-spared'],
            },
            response:
              'Vane looks at you for a long moment, then at the ration card, then tears it in half. In the morning the cage wagon stands open and empty, and nobody in the circle hums when you walk past.',
          },
          {
            id: 'deny',
            label: 'The crown has never paid an informant in its life.',
            effects: {
              affinity: { jackalwire: 5 },
              local: { 'gate-watch': 1 },
              flags: ['d42-informant-denied'],
            },
            response:
              '“That is what I thought,” says Vane, and pats your knee, and goes. Before dawn the cage wagon rolls out of the circle with its curtains drawn. When it comes back it is empty, and nobody will tell you where it went.',
          },
          {
            id: 'buy',
            label:
              'Buy her out of the cage and out of the canyon, and let nobody say who paid whom.',
            requires: { cost: 25 },
            effects: { flags: ['d42-informant-bought'] },
            response:
              'Vane takes the brass without arguing, which is how you know he wanted a third answer too. She leaves at dawn on a Saltroad cart with her bandaged paw in her lap, and does not look back at you or at him.',
          },
        ],
      },
      {
        // Callback: the crown chose the Saltroad over Thistledown (Day 33).
        id: 'd42-thistledown',
        title: 'Thistledown’s Count',
        speaker: 'Hester Plowright of the Border Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        requires: { flags: ['hideout:freehold-barn', 'thistledown-abandoned'] },
        lines: [
          'Hester comes down the ladder after midnight with a lamp and a slate. On the slate is a list in chalk, in her square hand.',
          '“You chose the other road at noon on the thirty-third day, Majesty. I am not asking why. I know why. The Saltroad’s winter stock was worth more than one village, by anybody’s ledger.”',
          '“But this is what it cost. Eleven barns. Nine wells fouled. Two people, and you should know their names: Abel Tansy, who was seventy, and Cress Pardoe, who went back for the goats.”',
          '“I am hiding you anyway. I wanted you to know that I know what I am doing.”',
        ],
        options: [
          {
            id: 'names',
            label:
              'Say their names back to her, and ask what Thistledown needs.',
            effects: {
              affinity: { freeholds: 5 },
              flags: ['d42-thistledown-named'],
            },
            response:
              'You say them. Hester rubs the slate clean with her sleeve, slowly, and writes something new: seed, timber, a well-digger. “That,” she says. “When you have a crown again.”',
          },
          {
            id: 'repay',
            label:
              'Send what brass the court can spare to Thistledown, tonight.',
            requires: { cost: 30 },
            effects: {
              affinity: { freeholds: 5 },
              flags: ['d42-thistledown-repaid'],
            },
            response:
              'Hester counts it once and puts it in her basket under the eggs. “It does not buy back a barn,” she says. “It buys seed. That is more than the riders left.”',
          },
          {
            id: 'same-road',
            label: 'Tell her the truth: you would choose the same road again.',
            effects: {
              affinity: { freeholds: -10 },
              local: { ledger: 2 },
              flags: ['d42-thistledown-justified'],
            },
            response:
              'Hester looks at you a long time. “Honest,” she says. “I will give you honest.” She leaves you the lamp, which is generous, and does not come down the ladder again until the field is in.',
          },
        ],
      },
      {
        // Callback: the crown made only the mill families pay (Day 1).
        id: 'd42-mill-doors',
        title: 'The Mill Families',
        speaker: 'Mayor Mara Reedbell of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        requires: { flags: ['hideout:bell-cellars', 'mara-millers-levy'] },
        lines: [
          'The court has eaten bread from every oven in Hollow Bell but one. The mill families’ doors are shut, and their flour is going somewhere else.',
          'Mara brings the news down herself, with flour on her sleeve from the ward ovens.',
          '“They remember the order, Majesty. Your first morning. The mill families paid for my aqueduct, and the wards drank, and the crown took the blame, exactly as I asked it to.”',
          '“Now there is no crown to blame, only a guest in my cellar. They are selling their flour up the mission road, at the Abbey’s price, and telling everyone why.”',
        ],
        options: [
          {
            id: 'repay',
            label:
              'Repay the mill families their levy from the crown’s own purse.',
            requires: { cost: 25 },
            effects: {
              affinity: { 'hollow-bell': 3 },
              local: { 'old-houses': 2 },
              flags: ['d42-millers-repaid'],
            },
            response:
              'Mara takes the brass to the mill herself. The doors open by evening, the flour comes down the cellar stair, and the miller’s wife sends a note that says only: “Late.”',
          },
          {
            id: 'order',
            label:
              'Order them, as before, to sell to the town. The crown is still the crown.',
            effects: {
              affinity: { 'hollow-bell': 5 },
              local: { 'old-houses': -2, 'gate-watch': 1 },
              flags: ['d42-millers-ordered'],
            },
            response:
              'You write the order on the back of a cider label and seal it with a seal that may or may not mean anything any more. The millers obey it. Mara says that is either a good sign about the crown or a bad one about the millers.',
          },
          {
            id: 'free',
            label:
              'Let them sell where they like. The crown has given its last order to millers.',
            effects: {
              affinity: { 'hollow-bell': -5 },
              local: { ledger: 2 },
              flags: ['d42-millers-free'],
            },
            response:
              '“Free trade,” says Mara, the way other people name a disease. The flour goes up the mission road all week. So, you notice, do two of the miller’s sons.',
          },
        ],
      },
      {
        // Callback: the Yard paid for the rain covenant in bonded runners (Act II).
        id: 'd42-bonded-runners',
        title: 'The Third Runner',
        speaker: 'A runner bonded to the Conclave',
        faction: 'storm-crows',
        requires: { flags: ['hideout:crow-cave', 'covenant-paid-in-runners'] },
        lines: [
          'A young stoat in a Conclave sash brings you water in the morning, and stands there afterwards holding the bowl, not leaving.',
          '“You will not know me, Majesty. You sent three of us from the Yard to pay for the rain. I was the third.”',
          '“They treat us all right. They feed us. We run the high paths in the storms with letters, and two of us have fallen, and the Crows sang for them, which was decent of the Crows.”',
          '“The bond runs seven more years. I am not asking for anything. I only wanted the emperor to see one of us, once.”',
        ],
        options: [
          {
            id: 'thank',
            label: 'Thank her, and tell her the rain she paid for still falls.',
            effects: {
              affinity: { 'storm-crows': 5 },
              local: { yard: -2 },
              flags: ['d42-runner-thanked'],
            },
            response:
              'She nods, and takes the bowl, and goes. That afternoon you watch her run the high path in the rain with a satchel on her back, sure-footed as a goat, and you do not look away until she is gone.',
          },
          {
            id: 'redeem',
            label: 'Buy out her bond with whatever the crown has left.',
            requires: { cost: 30 },
            effects: {
              affinity: { 'storm-crows': -5 },
              local: { yard: 3 },
              flags: ['d42-runner-redeemed'],
            },
            response:
              'Corvane accepts the brass without comment and strikes one name from a slate. The runner does not cry. She sits by the court’s fire with the sash in her lap, and does not seem to know what to do with her hands.',
          },
          {
            id: 'ask-corvane',
            label:
              'Ask Corvane, as a guest, to shorten every Yard runner’s bond.',
            requires: { affinity: { 'storm-crows': 'friendly' } },
            effects: {
              affinity: { 'storm-crows': -10 },
              local: { yard: 2 },
              flags: ['d42-bonds-shortened'],
            },
            response:
              '“Two years,” says Corvane, after a long time. “For courtesy.” It is the most generous thing you have seen him do, and it costs more than brass: he does not offer to share the watch fire with you again.',
          },
        ],
      },
      {
        // Callback: the crown pardoned the Mole courier (Day 38).
        id: 'd42-the-courier',
        title: 'The Boy Who Carried Letters',
        speaker: 'The young Mole courier',
        faction: 'moles',
        requires: { flags: ['hideout:mole-tunnels', 'prisoner-pardoned'] },
        lines: [
          'The Mole who meets you at a tunnel mouth with a lantern is sixteen, blinking at even this much light, and you have seen him before: in chains, in your throne room, on the thirty-eighth day.',
          '“You pardoned me, Majesty. I told you the name and you let me go, and three days later he did exactly what I said he would.”',
          '“The sisters still think I am his runner. They do not know I am down here. If I went up the mission road tonight with a letter, they would open the gate for me, the way they always did.”',
          '“I could carry one more letter. Or I could stay down here and dig, and never carry anything again. Granny says it is your choice, because it is your war.”',
        ],
        options: [
          {
            id: 'keep',
            label: 'Keep him here. He has carried enough.',
            effects: {
              affinity: { moles: 5 },
              flags: ['d42-courier-kept'],
            },
            response:
              'The boy breathes out as though he has been holding it since the thirty-eighth day. Granny Umber hands him a shovel, which among the Moles is how you say welcome home.',
          },
          {
            id: 'send',
            label:
              'Send him up the mission road one last time, to see what the sisters are doing.',
            effects: {
              affinity: { moles: -5 },
              local: { lamplight: 2 },
              flags: ['d42-courier-sent'],
            },
            response:
              'He goes at dusk with a blank letter in a brass-buttoned envelope. He comes back two nights later with the Abbey kitchens drawn on his arm in soot, and does not sleep for a day, and will not say what he heard on the stair. Granny Umber does not speak to you until he does.',
          },
        ],
      },
      {
        // Callback: the crown left the Saltroad waystation to the riders (Day 33).
        id: 'd42-waystation-graves',
        title: 'The Waystation Drivers',
        speaker: 'Oriel Saltmarsh of the Saltroad',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        requires: { flags: ['hideout:moving-caravan', 'waystation-abandoned'] },
        lines: [
          'At the salt flats waystation the caravan stops for its hour. There is not much left of the waystation. Somebody has swept the yard anyway.',
          'Oriel walks you along the line of graves at the edge of the flats without saying anything, counting them, as she counts everything.',
          '“Twelve drivers held this yard on the thirty-third day, Majesty, waiting for the crown’s Watch. The crown went to Thistledown instead. I would have chosen the same, in your boots. Probably.”',
          '“Their families ride in the third wagon. They know who you are. They have not said a word to you, because I asked them not to. I am wondering whether to stop asking.”',
        ],
        options: [
          {
            id: 'face',
            label:
              'Go to the third wagon, and let them say whatever they want to say.',
            effects: {
              affinity: { saltroad: 5 },
              flags: ['d42-faced-the-drivers'],
            },
            response:
              'It takes most of the hour. A driver’s mother says the worst of it, and says it well. When the caravan moves again she rides on the box beside you, and does not speak, and does not move away.',
          },
          {
            id: 'pay',
            label: 'Pay the families a driver’s wage for the winter.',
            requires: { cost: 30 },
            effects: {
              affinity: { saltroad: 5 },
              flags: ['d42-drivers-paid'],
            },
            response:
              'Oriel counts the brass out to each family herself, out loud. Nobody thanks you. One of the children asks if you are the emperor, and when you say yes, asks why you are so small.',
          },
          {
            id: 'quiet',
            label: 'Ask Oriel to go on asking them to be quiet.',
            effects: {
              affinity: { saltroad: -5 },
              flags: ['d42-drivers-silenced'],
            },
            response:
              '“As you like,” says Oriel, and does. The third wagon stays quiet all the way across the salt. It is the loudest wagon in the caravan.',
          },
        ],
      },
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
          'The rider under the white rag is Captain Dunmark. His coat is torn, his gorget is gone, and his horse is lame in the off foreleg.',
          'He kneels in the dirt without being asked, which he has never done, not even on the day of the oath.',
          '“Half my Watch rode out on an order under your seal, Majesty. I rode with them to see where it led. It led to the Abbey. The sisters gave us supper and cots and very good blankets, and in the morning I counted us and we were fewer.”',
          '“I came back. Some of them want to. Twenty-two are waiting on the ridge for your answer, and they will see your answer from there, whatever it is.”',
          vellumSays(
            '“They obeyed the seal, Majesty. In law, they obeyed you. I mention it because someone at this fire is about to say they deserted, and it will not be quite true.”',
          ),
        ],
        options: [
          {
            id: 'ask-ridge',
            label:
              'Ask Dunmark which of the twenty-two knew what the order really was.',
            effects: {},
            response:
              'Dunmark looks up at the ridge, then back at you. “One,” he says. “Maybe two. I can name one.”',
            next: 'knew',
          },
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
          {
            id: 'oath',
            label:
              'Climb the ridge yourself and say the oath again: “I will never spend you cheaply.”',
            requires: { flags: ['oath-of-care'] },
            effects: {
              local: { 'gate-watch': 3, yard: -1 },
              flags: ['watch-returned', 'd43-oath-renewed'],
            },
            response:
              'You climb the ridge on foot. Twenty-two guards watch you come, and when you say it, some of them say it back without being asked, and one starts to cry and is very annoyed about it. They come down behind you in a line.',
          },
          {
            id: 'ask-escort',
            label:
              'Ask what he saw, riding at Komodo’s stirrup all the way to the Abbey.',
            requires: { flags: ['komodo-escorted'] },
            effects: {},
            response:
              'Dunmark’s jaw works. He has been waiting for this question since the gate, and he still does not have an answer ready.',
            next: 'escort',
          },
        ],
        beats: [
          {
            id: 'knew',
            lines: [
              '“Sergeant Holloway. Twenty years in the Watch, two medals, a daughter in the Yard. She read the order before the rest of us did, and she said nothing, and she rode out at the front.”',
              '“She is on the ridge with the others. She says she believed the advisor. She says the advisor had the seal, and the seal is the emperor. She may even mean it.”',
              '“If you take them all back, the Watch learns a sergeant can open the gate and be forgiven. If you send them all away, the Watch learns twenty-one honest fools were thrown out with her. I do not envy you, Majesty. I would like you to choose quickly.”',
              vellumSays(
                '“The Archive could look for her name in what he left behind, Captain. Given a week. I gather we do not have a week.”',
              ),
            ],
            options: [
              {
                id: 'welcome',
                label:
                  'Bring them all in, Holloway too. Nobody is turned away tonight.',
                effects: {
                  local: { 'gate-watch': 5 },
                  flags: ['watch-returned'],
                },
                response:
                  'Dunmark whistles once. Twenty-two guards come down off the ridge, slowly, and then all at once. Holloway comes last, and salutes you, and you return it, and Dunmark watches you both.',
              },
              {
                id: 'dunmark',
                label: 'Dunmark may stay. The others chose.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Dunmark bows his head. He does not argue, but he walks up to the ridge alone to tell them, and comes back alone, and sits apart from the fire for the rest of the night.',
              },
              {
                id: 'sift',
                label: 'Bring in the twenty-one. Holloway stays on the ridge.',
                effects: {
                  local: { 'gate-watch': 3, yard: -1 },
                  flags: ['watch-returned', 'd43-holloway-left'],
                },
                response:
                  'Dunmark goes up himself to tell her. From the fire you watch them stand together a long while, two grey shapes against the sky. Then twenty-one come down, and one walks away along the ridge toward nowhere in particular, and her daughter in the Yard does not come to supper.',
              },
              {
                id: 'trial',
                label:
                  'Bring them all in, and Holloway answers for the order before the whole Watch.',
                effects: {
                  local: { 'gate-watch': 3, lamplight: 1, yard: -2 },
                  flags: ['watch-returned', 'd43-holloway-tried'],
                },
                response:
                  'The trial is held at the fire, with a cook’s ladle for a gavel. Holloway answers every question. The Watch finds her guilty of believing a seal, and sentences her to carry water for the camp until the war is over, which she does, without a word, every day.',
              },
              {
                id: 'turn',
                label:
                  'Send them all back to the tower, Holloway first, to open the gate from inside.',
                requires: { local: { 'gate-watch': 8 } },
                effects: {
                  local: { 'gate-watch': 2 },
                  flags: ['watch-inside-tower'],
                },
                response:
                  'Dunmark’s eyes go very bright. “Holloway first,” he says. “Yes. She will understand that better than forgiveness, and so will they.”',
              },
            ],
          },
          {
            id: 'escort',
            lines: [
              '“You sent me with him, Majesty. Doubled the Watch and put me at his stirrup. I watched him all the way down the mission road. I have gone over every hour of it since.”',
              '“He talked about the price of oats. He asked after my mother. At the Abbey gate he thanked me for the company and said the emperor had been very thorough, and he went in, and the sisters closed the gate between us. Kindly.”',
              '“By the time I rode back the tower was flying grey. I was the escort. I escorted him to it.”',
              vellumSays(
                '“You did as you were ordered, Captain. So did he, in his way. That is the trouble with orders.”',
              ),
            ],
            options: [
              {
                id: 'absolve',
                label:
                  'Tell him the escort was the crown’s idea, not his failure, and bring his people home.',
                effects: {
                  local: { 'gate-watch': 5 },
                  flags: ['watch-returned', 'd43-dunmark-absolved'],
                },
                response:
                  'Dunmark stands. It takes him two tries. Then he whistles once, and twenty-two guards come down off the ridge, and he counts them in, out loud, every one, the way he could not count them at the Abbey.',
              },
              {
                id: 'demote',
                label:
                  'Tell him a captain who rides a whole day beside a traitor and sees nothing should not command.',
                effects: {
                  local: { 'gate-watch': 1, 'old-houses': 1 },
                  flags: ['watch-returned', 'd43-dunmark-demoted'],
                },
                response:
                  'He takes off his captain’s knot and puts it in your hand without a word. Then he walks up the ridge to bring the twenty-two down himself, as a sergeant, and they come, and none of them will look at you.',
              },
              {
                id: 'dunmark',
                label: 'Dunmark may stay. The others chose.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Dunmark bows his head. He walks up to the ridge alone to tell them, and does not tell you what he says.',
              },
            ],
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
          'Elder Corvane arrives at dawn on foot, which for a crow is a kind of formality. The younger crows who carried him wait up in the rocks.',
          'He folds his wings and looks at you for a long time, his clouded eyes moving over the court, the fire, and the empty place where an advisor used to stand.',
          '“We had a name for your advisor, Majesty. All year. The crow who walks.”',
          '“He carried letters up the mission road at night, twice a week, and he never once looked up to see who was watching. We thought you knew. We thought it was your errand.”',
        ],
        options: [
          {
            id: 'ask-carts',
            label:
              'Ask what else came down the mission road while the Crows were watching.',
            effects: {},
            response: 'Corvane’s copper chimes stir, though there is no wind.',
            next: 'carts',
          },
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
        beats: [
          {
            id: 'carts',
            lines: [
              '“Carts, Majesty. Eleven years of carts. Up full at night, grain and lamp oil and bolts of grey cloth. Down again before dawn, empty, or nearly.”',
              '“And twice a year, before the long rains, a cart went up with its cover tied down, and the sisters walked beside it singing, and it did not come down at all.”',
              '“The Crows sold the Abbey its rain all that time. Good rain, on time, for the deep well. We did not ask what the well was for. We answer questions. Nobody asked.”',
              vellumSays(
                '“Eleven years of rain and eleven years of carts, and the Conclave kept both ledgers. Majesty, the coalition will want to know which of its members sold the Abbess her water.”',
              ),
            ],
            options: [
              {
                id: 'why',
                label: 'Ask him, coldly, why the Crows never told the throne.',
                effects: { affinity: { 'storm-crows': -5 } },
                response:
                  '“Nobody asked,” says Corvane. “You are asking now. That is something. It is not enough, but it is something.”',
              },
              {
                id: 'thanks',
                label:
                  'Thank him for telling you now, and ask what else the Crows have seen.',
                effects: {
                  affinity: { 'storm-crows': 5 },
                  flags: ['crow-sightings'],
                },
                response:
                  'Corvane tells you, at length, in a voice like rain on slate. When he is finished Vellum has filled nine pages and asked for more ink.',
              },
              {
                id: 'confess',
                label:
                  'The Crows will say all of this before the coalition, in their own voice.',
                effects: {
                  affinity: { 'storm-crows': -10 },
                  local: { lamplight: 2 },
                  flags: ['crow-sightings', 'd44-crows-confess'],
                },
                response:
                  'Corvane is silent for a long time. “Crows do not confess,” he says at last. “But we answer questions. Ask me before the fire, and I will answer.” His chimes do not ring again for the rest of the day.',
              },
              {
                id: 'keep-secret',
                label:
                  'Keep the Crows’ part between this fire and the record. The coalition needs the Crows more than it needs this.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { lamplight: -2 },
                  flags: ['crow-sightings', 'd44-crow-secret-kept'],
                },
                response:
                  'Corvane bows, which you have never seen him do. Vellum writes something, and then, slowly, draws a line through it, and you have never seen him do that either.',
              },
            ],
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
          'The Envoy comes alone, on foot, leading a horse too tired to be ridden. Their plum coat is muddy to the knee, and their white gloves are gone. Their hands are very pale.',
          'The court goes quiet. Everyone at this fire has been hunted by plum riders this month. Some of them have lost people to plum riders.',
          '“We bargained with the Abbess too, Majesty. For cures, for the condition. We did not read the price.”',
          '“Now our manors are full of a singing nobody can stop. Our sick sit up in their beds at night, all together, and sing in a language none of us taught them. The Verge asks the crown it hunted for help.”',
          vellumSays(
            '“The riders who burned the Freehold farms this month were paid in Abbey cures, Majesty. Everyone at this fire knows it. The Envoy knows that we know.”',
          ),
        ],
        options: [
          {
            id: 'ask-singing',
            label: 'Ask the Envoy who is singing.',
            effects: {},
            response:
              'The Envoy is quiet a moment. Then they take a folded handkerchief from their coat, and unfold it, and there is nothing in it, and they fold it again.',
            next: 'singing',
          },
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
          {
            id: 'sable',
            label: 'Let Sable Thorne answer the Envoy.',
            requires: { follower: 'F016' },
            effects: {},
            response:
              'Sable rises from the far side of the fire. The Envoy sees them, and for the first time all evening forgets to stand straight.',
            next: 'sable',
          },
          {
            id: 'ask-sable',
            label:
              'Ask after Sable Thorne, whom the crown sent home to the Verge.',
            requires: { flags: ['sable-returned'] },
            effects: {},
            response: 'The Envoy’s pale hands fold together very tightly.',
            next: 'sent-home',
          },
        ],
        beats: [
          {
            id: 'singing',
            lines: [
              '“My sister. My sister’s children. Half the old families of the Verge, everyone who took the cure. They do not suffer, Majesty. That is the worst of it. They are perfectly happy, and they do not know us.”',
              '“The Abbess said the cure would take the hunger away. It did. It took everything else along with it, and gave it to something under her floor.”',
              '“I hunted you because she paid us to, in cures, for the ones who were not yet sick. I would do it again, for them. I am telling you so you know what you are helping, if you help.”',
              {
                who: 'A Freehold farmer at the fire',
                text: '“They burned the Pardoes’ ricks and the Tansy barn and laughed doing it. Let them sing.”',
              },
            ],
            options: [
              {
                id: 'aid',
                label:
                  'Help them. The enemy beneath the Abbey is everyone’s, and so are its victims.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  strength: { 'black-verge': 1 },
                  local: { 'old-houses': -2 },
                  flags: ['verge-allied'],
                },
                response:
                  'The Envoy bows lower than any courtier ever has. “The Verge does not forget a debt,” they say. “Of either kind.” The farmer gets up and leaves the fire.',
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
                  'The Envoy closes their eyes. “The Ford,” they agree. “And the fields beside it.” The farmer does not thank you, but he stays at the fire.',
              },
              {
                id: 'kneel',
                label:
                  'Help them, if the Envoy kneels at this fire and hears every Freeholder the riders burned.',
                effects: {
                  affinity: { 'black-verge': 5, freeholds: 5 },
                  local: { yard: 1 },
                  flags: ['verge-allied', 'd45-envoy-knelt'],
                },
                response:
                  'The Envoy kneels. It takes until midnight. Freeholders come up one at a time and say what was burned, and the Envoy repeats each thing back exactly, and does not ask anyone to forgive them. Nobody does. In the morning there are plum riders helping to roof a barn.',
              },
              {
                id: 'refuse',
                label: 'The Verge can sing.',
                effects: {
                  affinity: { 'black-verge': -20, freeholds: 5 },
                },
                response:
                  'The Envoy stands, very straight, and leaves without a word. The farmer claps once, alone. Behind the Envoy, faintly, someone is humming.',
              },
            ],
          },
          {
            id: 'sable',
            speaker: 'Sable Thorne',
            npc: 'F016',
            lines: [
              'Sable Thorne steps into the firelight with the posture of someone raised for a court, who left it. The court has never seen them this still.',
              '“Hello, Envoy. You came all this way to ask the crown for help. And for me, I suppose, while you were here.”',
              '“I left the Verge so nobody could press the condition on me. Now the condition sings in the houses I grew up in. I find I cannot leave that, either.”',
              '“Help them, Majesty. Not for the Envoy. For the ones in the beds. But make the Verge give me up first, in writing, tonight, while it needs you.”',
            ],
            options: [
              {
                id: 'sable-terms',
                label:
                  'Help them, on Sable’s terms: the Verge renounces every claim on Sable, in writing.',
                effects: {
                  affinity: { 'black-verge': 10 },
                  flags: ['verge-allied', 'd45-sable-released'],
                },
                response:
                  'The Envoy writes it with Vellum’s pen on Vellum’s paper, with a hand that does not shake at all. Sable reads it twice, folds it into their coat, and goes to stand alone at the edge of the light for a long time.',
              },
              {
                id: 'aid',
                label:
                  'Help them, without conditions. Sable’s freedom is not the Verge’s to sell.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  strength: { 'black-verge': 1 },
                  local: { 'old-houses': -2 },
                  flags: ['verge-allied'],
                },
                response:
                  'The Envoy bows. Sable looks at you, surprised, and then away. “That was either very kind,” they say, “or very careless with me. I will decide which later.”',
              },
              {
                id: 'refuse',
                label:
                  'Refuse. Sable owes the Verge nothing, and neither does the crown.',
                effects: {
                  affinity: { 'black-verge': -20, freeholds: 5 },
                },
                response:
                  'The Envoy leaves without a word. Sable watches them go, and does not thank you, and you hear them, much later, humming something under their breath that they stop the moment they notice.',
              },
            ],
          },
          {
            id: 'sent-home',
            lines: [
              '“You sent Sable home to us, Majesty, as we asked. We were grateful. We gave Sable the cure ourselves, the first month, so that they would never run again.”',
              '“Sable sings with the others now. Very well. They always had a good voice.”',
              vellumSays(
                '“The record shows the crown returned Sable on the Verge’s promise of their safety, Majesty. I can read you the promise, if you like. It is very well written.”',
              ),
            ],
            options: [
              {
                id: 'sable-first',
                label:
                  'Help them, and the first one the court brings out of the singing is Sable.',
                effects: {
                  affinity: { 'black-verge': 5 },
                  flags: ['verge-allied', 'd45-sable-first'],
                },
                response:
                  'The Envoy closes their eyes. “Yes,” they say. “If anyone can be brought out.” It is the first time you have heard the Verge admit there is something it cannot buy.',
              },
              {
                id: 'aid',
                label: 'Help them. The crown owes Sable that much, at least.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  strength: { 'black-verge': 1 },
                  local: { 'old-houses': -2 },
                  flags: ['verge-allied'],
                },
                response:
                  'The Envoy bows lower than any courtier ever has. “The Verge does not forget a debt,” they say. You find you are thinking of a different debt entirely.',
              },
              {
                id: 'refuse',
                label:
                  'The Verge kept its promise to Sable the way it keeps all of them. It can sing.',
                effects: {
                  affinity: { 'black-verge': -20, freeholds: 5 },
                },
                response:
                  'The Envoy stands, very straight, and leaves without a word. Behind them, faintly, someone is humming, in a good voice.',
              },
            ],
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
          'A heron in a green cloak steps out of the dark at the edge of the firelight, where nobody saw her coming, holding a lantern of green glass. The flame inside does not move when the wind does.',
          'Half the court reaches for something to throw. The other half has been to the Mirefen, and does not.',
          '“The Mothers have always known what sleeps under the Abbey, Majesty. Longer than there has been an Abbey. We sank the bell’s clapper ourselves, long ago, so nobody could ring it the wrong way.”',
          '“Take the lantern. It burns down there, where nothing else will. The well your people are going into speaks back, and it is good to carry a light that does not.”',
        ],
        options: [
          {
            id: 'ask-burns',
            label: 'Ask what the lantern burns on.',
            effects: {},
            response:
              'Reedlight smiles, and the lantern brightens a little, as though pleased to be asked.',
            next: 'price',
          },
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
          {
            id: 'umber',
            label:
              'Let Granny Umber speak to the witch standing in her tunnels.',
            requires: { flags: ['hideout:mole-tunnels'] },
            effects: {},
            response:
              'Somebody runs for Granny Umber. Nobody needs to explain why; the whole tunnel has gone quiet.',
            next: 'umber',
          },
          {
            id: 'ask-road',
            label:
              'Ask her about the lanterns that turned back on the Mirefen road, on your first day.',
            requires: { flags: ['mire-road-closed'] },
            effects: {},
            response:
              'Reedlight’s lantern dims, very slightly, for the first time since you have known her.',
            next: 'forty-one',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“A promise, Majesty. Not yours. Not yet. The flame was lit from one that was made a very long time ago, between the fen and whatever lies under the hill.”',
              '“Whoever carries it owes the fen one favour, later. A small one, usually. The Mothers decide what small means.”',
              '“Not every Mother agrees I should give it to you. Some would rather the Abbess woke her thing, and the crown burned, and the fen inherited the ashes. I am not one of them. You should know they exist.”',
              vellumSays(
                '“A debt with no sum written on it, Majesty. The Archive has a whole shelf of those. Most were paid in the end by somebody who never signed them.”',
              ),
            ],
            options: [
              {
                id: 'take',
                label: 'Take the lantern, and the favour that comes with it.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  flags: ['reedlight-lantern'],
                },
                response:
                  'Reedlight sets the lantern in your hands. It is warm, and it smells faintly of rain, and for a moment you can feel the fen counting you.',
              },
              {
                id: 'my-debt',
                label:
                  'Take the lantern, but the debt is the emperor’s alone. Not the court’s, and not the kingdom’s.',
                effects: {
                  affinity: { 'mire-mothers': 5 },
                  flags: ['reedlight-lantern', 'd46-debt-personal'],
                },
                response:
                  'Reedlight tilts her long head. “That is not how debts work,” she says, “but it is how emperors should talk.” The flame leans toward you, very slightly, and stays leaning.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse it. The crown will not owe the fen a favour nobody can name.',
                effects: { affinity: { 'mire-mothers': -10 } },
                response:
                  'Reedlight tilts her long head. “Then find your way in the dark,” she says, not unkindly. “It will be very dark.” And she is gone.',
              },
            ],
          },
          {
            id: 'umber',
            speaker: 'Granny Umber of the Mole Revolutionaries',
            npc: 'granny-umber',
            lines: [
              'Granny Umber comes up the tunnel with her cane, sees the heron, and stops so suddenly the lamp-boy behind her walks into her back.',
              '“Not in my tunnels. Two hundred years the Mothers have been flooding our burrows and calling it weather. They took the Silverbank cell in one night, with a song.”',
              {
                who: 'Sister Reedlight',
                npc: 'sister-reedlight',
                text: '“And the Moles have been digging under our fen for two hundred years and calling it politics, Granny. We could argue until the Abbess wakes. She would enjoy that very much.”',
              },
              '“She would,” says Granny Umber, after a long time. “That is the only reason I have not hit you with this cane.” She turns to you. “Your court, Majesty. Your call. Do we carry a witch’s light down a Mole’s road?”',
            ],
            options: [
              {
                id: 'take',
                label:
                  'Take the lantern. The thing under the Abbey is older than this feud.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  flags: ['reedlight-lantern'],
                },
                response:
                  'Reedlight sets the lantern in your hands. Granny Umber watches it pass between you and says nothing at all, which from her is a speech. That night the Moles post a guard on your chamber, and you are not sure which of your guests it is meant to protect.',
              },
              {
                id: 'truce',
                label:
                  'Ask them both for one night’s truce, and the lantern to light the Moles’ props as well as the well.',
                effects: {
                  affinity: { 'mire-mothers': 5, moles: 5 },
                  flags: ['reedlight-lantern', 'd46-fen-mole-truce'],
                },
                response:
                  'It takes an hour and a great deal of tea. In the end the green lantern hangs from the third prop, the one that sulks, and the Moles mutter, and nobody floods anybody, and for one night the tunnels are lit by the fen.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse it. Not in the tunnels that sheltered the crown.',
                effects: { affinity: { 'mire-mothers': -10 } },
                response:
                  'Reedlight bows to Granny Umber, not to you, and goes back up into the dark. Granny bangs her cane once, which means the matter is closed, and also that she is delighted.',
              },
            ],
          },
          {
            id: 'forty-one',
            lines: [
              '“You closed the road on your first day. Forty-one of us turned back into the fen at night, with the raiders on the ridge.”',
              '“Thirty-four came home. Seven did not. One of them was a reed-cutter with a broken leg, whom I had carried most of the way to your tower.”',
              '“I am not here to collect on that, Majesty. The thing under the Abbey does not care which roads anyone closed. But I wanted you to know the number. You were a new crown. You did not know us. Now you do.”',
            ],
            options: [
              {
                id: 'take',
                label: 'Take the lantern, and say the number back to her.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  flags: ['reedlight-lantern'],
                },
                response:
                  '“Seven,” you say. Reedlight sets the lantern in your hands. It is warm, and it smells faintly of rain, and it is heavier than it looks.',
              },
              {
                id: 'open-road',
                label:
                  'Take the lantern, and swear the Mirefen road will never be closed by this crown again.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['reedlight-lantern', 'd46-mire-road-sworn'],
                },
                response:
                  'Reedlight bows lower than she did on the first day. Behind her, out in the dark, seven green lights go up one after another, and hold, and go out.',
              },
              {
                id: 'refuse',
                label:
                  'Refuse it. The crown made its choice that day, and will not be shamed into another.',
                effects: { affinity: { 'mire-mothers': -10 } },
                response:
                  'Reedlight does not argue. She did not argue then, either. She walks back into the dark, and the lantern goes with her, and you find yourself counting, without meaning to, to forty-one.',
              },
            ],
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
          'The camp has lit one fire for everyone, for the first time since the tower. Kiyo sits down beside you with her kettle and does not pour anything, which is so unlike her that the people nearest go quiet.',
          '“If it goes badly at the Abbey, I need someone to know about my boy. He is very small. He wants to be a hero and he cannot finish a cup of tea.”',
          '“He crossed the straits asleep in a basket and never knew we were afraid. I should like him never to know it now, either.”',
          '“I have written him a letter for when he is older. Will you keep it, Majesty? You are the only person I know who used to have a vault. That will have to do.”',
        ],
        options: [
          {
            id: 'ask-boy',
            label: 'Ask her to tell you about him, while there is time.',
            effects: {},
            response:
              'Kiyo pours the tea after all, two cups, and puts one in your hands.',
            next: 'boy',
          },
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
        beats: [
          {
            id: 'boy',
            lines: [
              '“He collects beetles. Not to keep. He counts them and lets them go, and he is very upset if anyone steps on one, even by accident, even a horse.”',
              '“He thinks his mother sells tea. I do. He does not know I also sew up soldiers, by lamplight, with the same hands I pour with.”',
              '“If I do not come back, somebody will tell him I was brave. I would rather he heard that I was careful, and kind to beetles, and that I chose this. Will you tell him that? Not brave. Careful.”',
              vellumSays(
                '“The Archive could keep a copy of the letter, Kiyo. In case the vault does not survive the emperor.”',
              ),
              '“No copies,” says Kiyo, quite sharply, and then, more gently: “Thank you, Keeper. No copies. It is his.”',
            ],
            options: [
              {
                id: 'keep',
                label:
                  'Keep the letter safe, and promise to tell him: careful, not brave.',
                effects: { flags: ['kiyo-letter-kept'] },
                response:
                  'Kiyo hands you a small envelope with a beetle drawn on the front. “Do not read it,” she says. “It is mostly about beetles.” She drinks her tea. Her hands are steady now.',
              },
              {
                id: 'carry',
                label:
                  'Promise to carry it to him yourself, across the straits if need be, crown or no crown.',
                effects: {
                  local: { yard: 1 },
                  flags: ['kiyo-letter-kept', 'd47-letter-sworn'],
                },
                response:
                  '“You would cross the straits,” Kiyo says, “for a letter about beetles.” She considers you over her cup. “Yes. I think you would. That is why I asked you and not the Keeper.”',
              },
              {
                id: 'home',
                label: 'Tell her to go home to him now. Careful means alive.',
                effects: { flags: ['kiyo-sent-home'] },
                response:
                  'Kiyo looks at the fire for a long time. “That is not fair,” she says, “using my own word.” Then: “Not yet. Please, not yet. After.”',
              },
            ],
          },
        ],
      },
      {
        id: 'd47-saffron',
        title: 'An Old Insignia',
        speaker: 'Saffron Kett',
        requires: { follower: 'F002' },
        lines: [
          'Saffron Kett sits on an upturned crate at the edge of the firelight with a wrench in her lap that she is not using, turning her welded Pack insignia over and over in her fingers.',
          '“Vane has asked me to come home, Majesty. To the Pack. He sent a fiddler with the message, which is how the Pack says it means it.”',
          '“He says the canyon needs a machinist more than a crown does. The wagons are falling apart, and the pups are learning to fix them from someone who learned from me, badly.”',
          '“He might be right. I hate it when he is right. It does not happen often, and he is unbearable for weeks.”',
        ],
        options: [
          {
            id: 'ask-want',
            label: 'Ask what she wants, not what Vane wants.',
            effects: {},
            response:
              'Saffron stops turning the insignia. She looks at it as though it had asked her the question itself.',
            next: 'want',
          },
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
          {
            id: 'bridge',
            label:
              'Remind her that at the Two Bridges, the court let her choose the route.',
            requires: { flags: ['saffron-chose-route'] },
            effects: { flags: ['saffron-stays', 'd47-bridge-remembered'] },
            response:
              'Saffron goes quiet. “The trestle,” she says. “Nobody had ever let me choose a route before. Not the Pack. Not anyone.” She pins the insignia back on. “Until the end, then. Then the canyon, and I will build them a bridge that stays up.”',
          },
        ],
        beats: [
          {
            id: 'want',
            lines: [
              '“I want to finish something. I built bridges for this crown, and half of them burned. I mended engines, and the Abbey got one running anyway. I would like, once, to build a thing and see it still standing a year later.”',
              '“The Pack would let me. They would let me build anything, as long as it has wheels and somebody to rob at the end of it.”',
              '“And I want to see the Abbey door shut. I want both. Tomorrow I can have one.”',
            ],
            options: [
              {
                id: 'stay',
                label:
                  'Ask her to stay until the end. Then build whatever she likes.',
                effects: { flags: ['saffron-stays'] },
                response:
                  'Saffron pins the insignia back on her apron. “Until the end,” she agrees. “Then we argue about it. I warn you, I argue with drawings.”',
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
                  'Saffron laughs, surprised. “Then I choose to stay,” she says. “Because you asked like that. And then I choose the canyon. In that order.”',
              },
              {
                id: 'commission',
                label:
                  'Promise her the first thing the new crown builds is hers to design, wherever she chooses to live.',
                effects: {
                  local: { yard: 1, ledger: -1 },
                  flags: ['saffron-stays', 'd47-saffron-commission'],
                },
                response:
                  'Saffron laughs out loud, which startles the whole camp. “A commission,” she says. “From an emperor in a ditch.” She pins the insignia back on, beside the court’s badge, takes out a pencil, and does not put it down again all evening.',
              },
            ],
          },
        ],
      },
      {
        id: 'd47-letter-in-the-flour',
        title: 'A Letter in the Flour',
        speaker: 'Foreman Dunmore Ash of the Yard',
        npc: 'dunmore-ash',
        faction: 'yard',
        lines: [
          'Late, when the one fire has burned down to coals, Dunmore Ash comes to you holding one of his cooks by the collar. The cook is a thin young rabbit with flour to the elbows and a letter crumpled in his fist.',
          'Behind them, the Gate Watch sergeant who caught him is already explaining, loudly, to anyone awake.',
          '“He was going to leave it at the stone on the road, Majesty,” says Dunmore. “For the grey sisters. It says where we are. It says how many. He writes a good clear hand. I taught him his letters.”',
          '“I am asking you for nothing. I brought him because it is the law and I am the foreman. Do what the law says.”',
          {
            who: 'A Gate Watch sergeant',
            text: '“The law says one thing for a man who sells the camp, Majesty. Every soldier at this fire knows what. So does he.”',
          },
        ],
        options: [
          {
            id: 'ask-why',
            label: 'Ask the cook why.',
            effects: {},
            response:
              'The cook cannot get it out at first. Dunmore takes the letter from his fist and smooths it flat on his knee.',
            next: 'why',
          },
          {
            id: 'exile',
            label:
              'Take the Yard’s apron off him and send him down the road with nothing.',
            effects: {
              local: { 'gate-watch': 1, yard: -1 },
              flags: ['d47-cook-exiled'],
            },
            response:
              'He goes at first light, without his apron and without the letter. The sergeant follows him a mile to be sure he keeps walking. At the fork the cook takes the road toward the Abbey, and the sergeant comes back and says nothing about it.',
          },
          {
            id: 'example',
            label:
              'Make an example of him, at dawn, where the whole camp can see.',
            effects: {
              local: { 'gate-watch': 3, yard: -3 },
              flags: ['d47-cook-made-example'],
            },
            response:
              'Nobody sleeps. At dawn it is done, quickly, at the edge of the trees, and the camp is very quiet all day. Dunmore cooks breakfast for everyone with his own hands and does not eat any of it.',
          },
        ],
        beats: [
          {
            id: 'why',
            lines: [
              'On the back of the letter, smaller, in the same clear hand, something else is written. Dunmore reads it out, slowly, because he has to.',
              '“My mam and my sisters are in the tower kitchens. The sisters came to them and said they would be fed every day the emperor’s camp is found, and not fed any day it is not.”',
              '“It has been six days,” the cook says. “I can count. I am sorry. I am sorry. I would do it again.”',
              {
                who: 'A Gate Watch sergeant',
                text: '“Every man at this fire has someone in that tower, boy.”',
              },
              vellumSays(
                '“Then the sisters will have made this offer more than once, Majesty. He is only the one we caught.”',
              ),
            ],
            options: [
              {
                id: 'exile',
                label:
                  'Send him down the road with nothing. The camp cannot keep him.',
                effects: {
                  local: { 'gate-watch': 1, yard: -1 },
                  flags: ['d47-cook-exiled'],
                },
                response:
                  'He goes at first light, without his apron. At the fork he takes the road toward the tower, toward his mother, and nobody stops him, and nobody will say whether they hope he gets there.',
              },
              {
                id: 'example',
                label:
                  'Make an example of him. Every family in that tower is a lever, and the camp must see it does not work.',
                effects: {
                  local: { 'gate-watch': 3, yard: -3 },
                  flags: ['d47-cook-made-example'],
                },
                response:
                  'Nobody sleeps. At dawn it is done, quickly, at the edge of the trees. Nobody else leaves a letter at the stone. Nobody in the Yard sings while they work, either, for the rest of the war.',
              },
              {
                id: 'false-letter',
                label:
                  'Let him leave the letter, with the wrong valley written in it. His family eats; the sisters search the wrong hills.',
                effects: {
                  local: { yard: 2, 'gate-watch': -1 },
                  flags: ['d47-false-letter'],
                },
                response:
                  'Vellum rewrites it in the cook’s own hand, which takes him an hour and a sort of quiet pride. The letter goes to the stone at dawn. Three nights later lanterns are searching an empty valley far to the west, and nobody asks what the sisters will do when they find it empty.',
              },
              {
                id: 'mercy',
                label:
                  'Forgive him in front of the camp, and let everyone with family in the tower say so.',
                effects: {
                  local: { yard: 3, 'gate-watch': -3 },
                  flags: ['d47-cook-forgiven'],
                },
                response:
                  'You say it standing. The sergeant walks away from the fire and does not come back that night. But before dawn eleven people come to you one by one to say they have family in the tower, and that the sisters have spoken to them, and that they have not written anything. Yet.',
              },
            ],
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
          'Mara Reedbell has walked all night to reach the court, with her mayoral sash in her pocket so nobody on the road would know her, and her hand-bell muffled in a sock.',
          'She sits down on the ground by the fire without being asked, which a mayor never does, takes the sock off the bell, and holds it without ringing it.',
          '“Hollow Bell is named for a bell that was hollow, Majesty. The great one in the Abbey tower, that the town paid for when the town was young. Our grandmothers said the Abbey stole its voice.”',
          '“If you bring the clapper home, the town will ring for you. Whatever happens afterwards.”',
        ],
        options: [
          {
            id: 'ask-last',
            label:
              'Ask what her grandmothers said happened the last time it rang.',
            effects: {},
            response:
              'Mara turns the little bell over in her hands. “They said a great many things,” she says. “Grandmothers do. One of them I believe.”',
            next: 'last-ring',
          },
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
          {
            id: 'ask-page',
            label:
              'Ask whether the town ever learned about the page you burned for her.',
            requires: { flags: ['mara-protected'] },
            effects: {},
            response:
              'Mara is very still. Then she puts the hand-bell down in the dirt.',
            next: 'page',
          },
        ],
        beats: [
          {
            id: 'last-ring',
            lines: [
              '“It rang once, a hundred years ago, the night something under the Abbey turned over in its sleep. The whole valley felt it. Cups walked off tables.”',
              '“The ringer was a young woman from the Bell, my great-grandmother’s cousin. She climbed the tower and rang it until the thing was still. She did not come down. They found the rope, and her shoes at the top of the stair, neatly paired.”',
              '“Afterwards the Abbey took the clapper down, for safety, they said. And the Mothers took it from the Abbey and sank it. Everyone has been protecting everyone from that bell for a hundred years.”',
              vellumSays(
                '“The Archive has the same story, Majesty, with fewer shoes. It agrees on the part that matters. Somebody has to stand at the top and keep ringing.”',
              ),
            ],
            options: [
              {
                id: 'promise',
                label:
                  'Promise the town its bell will ring again, whatever it costs.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  flags: ['bell-promised'],
                },
                response:
                  'Mara takes your hand in both of hers. “Then we will ring it,” she says, “for as long as the Bell stands.” She does not ask who will climb. She does not have to.',
              },
              {
                id: 'not-theirs',
                label:
                  'Promise it will ring, and that nobody from Hollow Bell will be the one who climbs.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  flags: ['bell-promised', 'd48-no-bell-ringer'],
                },
                response:
                  'Mara looks at you for a long time. “Then who?” she asks. When you do not answer, she nods, as though that were an answer. “Then we will ring it for as long as the Bell stands. And we will know whose people climbed.”',
              },
              {
                id: 'honest',
                label:
                  'Promise only to try. You will not promise a stair like that.',
                effects: { affinity: { 'hollow-bell': 3 } },
                response:
                  'Mara nods slowly. “That is more than anyone else has promised,” she says. “And less than my grandmother’s cousin did. I think I like you better for it.”',
              },
            ],
          },
          {
            id: 'page',
            lines: [
              '“No. You burned it, and I let you, and the town never learned whose children paid for its water in the drought. They still think I am a good mayor. Some days I almost do.”',
              '“If that bell rings, Majesty, and people come up the hill to hear it, I want to stand in front of them first and tell them. I have wanted to for a long time. I need you to tell me not to, or to tell me to, because I cannot decide it by myself any more.”',
              vellumSays(
                '“There is no page any more, Mayor. There is only you. I find that is usually how the important records are kept.”',
              ),
            ],
            options: [
              {
                id: 'tell-them',
                label: 'Tell her to tell them, when the bell rings. All of it.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['bell-promised', 'd48-mara-will-confess'],
                },
                response:
                  'Mara picks the bell up again and wipes the dirt off it with her sleeve. “All of it,” she says. “Then they can decide whether they want it rung by me.” She walks home that night without the sock on the bell.',
              },
              {
                id: 'keep-ash',
                label:
                  'Tell her the page is ash, and should stay ash. The town needs a mayor more than a confession.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -2 },
                  flags: ['bell-promised', 'd48-mara-secret-kept'],
                },
                response:
                  'Mara nods, very slowly, the way she nodded the day the page burned. “Then we will ring it,” she says, “for as long as the Bell stands.” She does not sound as glad as she should.',
              },
              {
                id: 'honest',
                label:
                  'Tell her that is not the crown’s to decide, and promise only to try for the bell.',
                effects: { affinity: { 'hollow-bell': 3 } },
                response:
                  'Mara looks at you, and then laughs, a short, tired laugh. “No,” she says. “No, I suppose it never was.” She puts the sock back on the bell.',
              },
            ],
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
          'Around the fire sit envoys of everyone who is still on the map. Nobody has a chair. Everyone has an opinion. Several have brought their own supper, so as not to owe anybody for it.',
          'Oriel Saltmarsh has a charter half drafted on the back of a salt manifest. Granny Umber has one fully drafted, in her vest, in triplicate. Elder Corvane has nothing in his claws at all, which is how you know he came to bargain.',
          'Captain Dunmark stands behind your crate, where an advisor used to stand. Sister Reedlight has set her lantern on the ground between the Moles and the Crows, and everyone is very carefully not looking at it.',
          'They all want the same thing from you: to know whose peace it will be, if there is one.',
          vellumSays(
            '“Whatever you choose, Majesty, I will write it down tonight, in case there is nobody left tomorrow to remember it differently.”',
          ),
        ],
        options: [
          {
            id: 'ask-left-out',
            label:
              'Before you choose, ask each of them who their peace leaves out.',
            effects: {},
            response:
              'There is a long silence. Then everybody starts talking at once, which Vellum later records as “a frank exchange of views”.',
            next: 'left-out',
          },
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
        beats: [
          {
            id: 'left-out',
            lines: [
              {
                who: 'Granny Umber',
                npc: 'granny-umber',
                text: '“The Crows’ peace leaves out everybody who cannot pay for rain. Which is everybody I know.”',
              },
              {
                who: 'Elder Corvane',
                npc: 'elder-corvane',
                text: '“The Moles’ peace leaves out everybody with a harvest to bring in while the assembly is still debating the harvest.”',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“Open roads leave out whoever is standing on a road when the next riders come. The Watch’s peace keeps them alive. I will not pretend it keeps them happy.”',
              },
              {
                who: 'Sister Reedlight',
                npc: 'sister-reedlight',
                text: '“Every peace at this fire leaves out the fen. We are used to it. We would like, once, not to be.”',
              },
              {
                who: 'Mayor Mara Reedbell',
                npc: 'mara-reedbell',
                text: '“And the Bell’s peace puts one small town at the heart of everything, which is a great deal of weight for a town that has only just got its water back.”',
              },
              'Then they all look at you again, and it is worse, because now everyone knows exactly what everyone else is afraid of.',
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
                  'There is a long, suspicious silence. Dunmark looks at the road beyond the firelight. Then Oriel Saltmarsh starts drafting a charter on the back of a salt manifest.',
              },
              {
                id: 'bell',
                label: 'A restored Bell, and Hollow Bell carries the weight.',
                requires: {
                  flags: ['clapper-recovered'],
                  affinity: { 'hollow-bell': 'friendly' },
                },
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  flags: ['peace-bell'],
                },
                response:
                  'Mara Reedbell stands up and does not know what to do with her hands. Everyone else, for once, agrees, and Mara looks as though that frightens her more than the Abbess does.',
              },
              {
                id: 'iron',
                label: 'An iron peace. Alive is better than happy.',
                requires: { local: { 'gate-watch': 12 } },
                effects: {
                  local: { 'gate-watch': 3, 'old-houses': 2 },
                  affinity: { moles: -10 },
                  flags: ['peace-iron'],
                },
                response:
                  'Captain Dunmark salutes. Granny Umber does not. She folds her three charters back into her vest, one at a time, and the fire gets noticeably colder on her side.',
              },
              {
                id: 'crows',
                label:
                  'The Crows’ bargain. Rain for everyone, and the crown pays for those who cannot.',
                requires: { affinity: { 'storm-crows': 'friendly' } },
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['peace-crows'],
                },
                response:
                  'Elder Corvane spreads his wings over the fire, and for a moment the smoke goes sideways, like rain. Granny Umber mutters that she will believe it when it is wet.',
              },
              {
                id: 'witchwater',
                label:
                  'The Witchwater throne. This once, the fen is not left out.',
                requires: { affinity: { 'mire-mothers': 'friendly' } },
                effects: {
                  affinity: { 'mire-mothers': 10, abbey: -10 },
                  flags: ['peace-witchwater'],
                },
                response:
                  'Sister Reedlight bows her long neck very low. Somewhere far off in the fen, green lanterns go up one after another, and the Moles at the fire move, very slightly, away from them.',
              },
              {
                id: 'tunnels',
                label:
                  'Tunnels and councils. Let the harvest wait for the vote.',
                requires: { affinity: { moles: 'friendly' } },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -3 },
                  flags: ['peace-tunnels'],
                },
                response:
                  'Granny Umber bangs her cane on the ground three times. It means the motion carries, and also that she is delighted. Corvane says nothing, very loudly.',
              },
              {
                id: 'no-crown',
                label:
                  'Nobody’s peace: lay the crown down tonight, and let this fire govern.',
                effects: {
                  affinity: { moles: 5, freeholds: 5 },
                  local: { 'old-houses': -3, 'gate-watch': -2 },
                  flags: ['peace-roads', 'd49-crown-laid-down'],
                },
                response:
                  'Nobody speaks. Then Granny Umber laughs so hard she has to be helped up, and Dunmark takes off his gorget and does not know where to put it, and Oriel crosses out the word emperor on her manifest everywhere it appears. By morning there is a charter. Your name is on it once, at the bottom, with everybody else’s.',
              },
            ],
          },
        ],
      },
      {
        id: 'd49-the-record',
        title: 'What the Record Says',
        speaker: 'Keeper Abelard Vellum',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        lines: [
          'After the coalition has gone to its blankets, Vellum sits with you by the coals, with the Archive’s great book open on his knees and a pen he has not yet dipped.',
          '“Every emperor has an entry, Majesty. I write them the night before anything that may end a reign. It is a custom. Most emperors never learn it exists.”',
          '“Your predecessor’s says: Kept the tower. That is all. He was quite pleased with it.”',
          '“I should like to write yours tonight, while you can still tell me I have it wrong. What should it say you were?”',
        ],
        options: [
          {
            id: 'order',
            label: '“Kept the kingdom standing, whatever it cost.”',
            effects: {
              local: { 'gate-watch': 2, yard: -1 },
              flags: ['d49-record-order'],
            },
            response:
              'Vellum writes it in his slow, even hand. “Whatever it cost,” he repeats. “I will leave a little room underneath, Majesty, for the costs.”',
          },
          {
            id: 'promises',
            label:
              '“Kept the crown’s promises, and said so when it could not.”',
            effects: {
              local: { lamplight: 2, 'old-houses': -1 },
              flags: ['d49-record-promises'],
            },
            response:
              'Vellum writes it, and reads it back, and then, very slowly, smiles, which for him is dancing.',
          },
          {
            id: 'names',
            label: '“Write the names of the people at this fire instead.”',
            effects: {
              local: { yard: 2, 'old-houses': -2 },
              flags: ['d49-record-names'],
            },
            response:
              'It takes him until dawn, and he does not complain once. When he is finished your name is not on the page at all. He shows it to you, and you find you do not mind.',
          },
          {
            id: 'ask-komodo',
            label: 'Ask what he wrote for Young Komodo.',
            requires: { flags: ['komodo-bargain-known'] },
            effects: {},
            response:
              'Vellum turns back a great many pages, slowly, to one near the end that is not in his usual ink.',
            next: 'komodo-entry',
          },
        ],
        beats: [
          {
            id: 'komodo-entry',
            lines: [
              '“Advisors do not get entries, Majesty. I wrote one for him anyway, the night we learned what he bought. I am not proud of it.”',
              '“It says: Believed the price was worth paying. Paid it with other people’s lives and his own good name, and never once with his own life. Cheaper than war.”',
              '“He would say that last line was the whole of his argument. He would say it was correct. He may even be right, which is why I wrote it in ink.”',
            ],
            options: [
              {
                id: 'not-cheaper',
                label:
                  '“Write, under his, that the emperor did not think it was cheaper.”',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['d49-record-answers-komodo'],
                },
                response:
                  'Vellum writes it under Komodo’s entry, in the same ink. Then he closes the book very gently, as though it were asleep, and says that will do for tonight.',
              },
              {
                id: 'order',
                label:
                  '“Kept the kingdom standing, whatever it cost.” Under his, if you like.',
                effects: {
                  local: { 'gate-watch': 2, yard: -1 },
                  flags: ['d49-record-order'],
                },
                response:
                  'Vellum writes it, and then looks at the two entries side by side for a long time. “They rhyme, Majesty,” he says at last. “I am not sure you meant them to.”',
              },
              {
                id: 'names',
                label:
                  '“Write the names of the people at this fire instead. His too, at the end.”',
                effects: {
                  local: { yard: 2, 'old-houses': -2 },
                  flags: ['d49-record-names'],
                },
                response:
                  'It takes him until dawn. The last name on the page is Komodo’s, in small, careful letters. Vellum does not ask you why, and you could not have told him.',
              },
            ],
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
          'Everyone who can still fight is at the fire. The roads to the Abbey are drawn in the dirt between them with a stick, and every few minutes someone rubs one out and draws it again, a little differently, as though that would help.',
          'From the north, faintly, comes the singing. Everyone is pretending not to hear it.',
          'Captain Dunmark has a gorget on again, borrowed. Vellum has his book. Your host has brought out the last of the good food, which is how you know your host thinks this is the end too.',
          'The front door is the obvious way. There may be others, if the court has earned them.',
        ],
        options: [
          {
            id: 'ask-cost',
            label: 'Ask Dunmark and Vellum what each road will cost.',
            effects: {},
            response:
              'Dunmark and Vellum look at each other across the fire. In the end it is Dunmark who speaks first, because he is a soldier, and it is his job to say the bad thing first.',
            next: 'costs',
          },
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
        beats: [
          {
            id: 'costs',
            lines: [
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“The front door is where she expects us, Majesty. Half of us will be singing by the second courtyard. The other half might reach the crypt stair. I would still go. I wanted you to hear me say it plainly first.”',
              },
              vellumSays(
                '“The well is quieter, and narrower, and nobody who goes down it can come back up quickly. The bell is the oldest way. The Archive believes in it. The Archive is not the one climbing the tower.”',
              ),
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“Whichever road you choose, the people on it will want to hear it from you. Not from me. Not from the book.”',
              },
              'The fire cracks. Somebody at the edge of the light starts, very quietly, to count the people around it, and stops.',
            ],
            options: [
              {
                id: 'front',
                label:
                  'The front door. Everyone together, and nobody goes alone.',
                effects: {},
                response:
                  'Nobody argues. Somebody starts handing out bread, which is the closest thing the court has to a war council. Dunmark puts his hand on your shoulder, once, and takes it away again.',
              },
              {
                id: 'well',
                label: 'Send a small party down the well road as well.',
                requires: { flags: ['crypt-path-found'] },
                effects: {},
                response:
                  'The party ties ropes around their waists and does not look at the well for longer than they have to. Vellum writes down their names before they go, slowly, so that he gets every letter right.',
                postsQuests: ['q-d50-crypt-path'],
              },
              {
                id: 'bell',
                label:
                  'Carry the clapper up the Abbey tower and ring the bell.',
                requires: { flags: ['clapper-recovered'] },
                effects: {},
                response:
                  'The clapper hums in its cloth when you lift it. It is very heavy, and it is very nearly singing. Nobody asks who will be at the top of the stair. Everybody is thinking it.',
                postsQuests: ['q-d50-ring-the-bell'],
              },
              {
                id: 'every-road',
                label:
                  'Every road at once: the well, the tower and the front door, and the court spread thin across all three.',
                requires: { flags: ['crypt-path-found', 'clapper-recovered'] },
                effects: {
                  local: { 'gate-watch': -2 },
                  flags: ['d50-every-road'],
                },
                response:
                  'Dunmark draws three lines in the dirt and does not rub any of them out. The court divides itself in silence, a few here, a few there, and for a moment before they go everyone is looking at the people going the other ways, as if to remember their faces.',
                postsQuests: ['q-d50-crypt-path', 'q-d50-ring-the-bell'],
              },
            ],
          },
        ],
      },
      {
        id: 'd50-if-you-find-him',
        title: 'If You Find Him',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Before the parties leave, Dunmark finds you alone at the edge of the camp, where the singing is loudest.',
          '“My scouts saw him at the Abbey gate last night, Majesty. Young Komodo. No coat. He was arguing with the sisters, and they were smiling at him, and he was losing.”',
          '“If he is trying to stop her, he has left it very late. If we find him on the stair, the party will want to know what the crown wants done. I would rather they did not have to decide it in the dark.”',
          vellumSays(
            '“He kept careful accounts of everything, Captain. Including, I suspect, exactly how much he has to answer for. I should like him brought back to answer it.”',
          ),
        ],
        options: [
          {
            id: 'bring-back',
            label:
              'Bring him back alive, to answer for the tower in front of everyone he sold.',
            effects: {
              local: { lamplight: 2, 'gate-watch': -1 },
              flags: ['d50-komodo-to-answer'],
            },
            response:
              'Dunmark nods slowly. “Alive is harder,” he says. “I will tell them alive.” He goes to tell them, and you hear one of the party laugh, not kindly, and then stop.',
          },
          {
            id: 'leave-him',
            label: 'Leave him to the Abbess. He chose her.',
            effects: {
              local: { 'gate-watch': 2, lamplight: -1 },
              flags: ['d50-komodo-left'],
            },
            response:
              '“As you say,” says Dunmark, and you watch him decide not to argue. Later Vellum sits down beside you without a word, opens the great book to an empty page, and does not write anything on it for a long time.',
          },
          {
            id: 'let-him-fight',
            label:
              'If he is fighting her, let him fight. Whatever he was, tonight he is on the stair.',
            effects: {
              local: { 'gate-watch': -2, yard: 1 },
              flags: ['d50-komodo-spared'],
            },
            response:
              'Dunmark is quiet a long while. “He opened my gate,” he says. “He asked after my mother.” He goes to the party and tells them, and nobody argues, which is somehow worse than arguing.',
          },
          {
            id: 'message',
            label:
              'Give the party one message for him, if they find him: “It was not cheaper.”',
            requires: { flags: ['komodo-bargain-known'] },
            effects: {
              local: { lamplight: 2 },
              flags: ['d50-komodo-message'],
            },
            response:
              'Dunmark repeats it twice to be sure of it. Three of the party write it on their sleeves. Nobody asks you whether you want him alive or dead, and you realise, after they have gone, that you have not decided.',
          },
        ],
      },
    ],
  },
]

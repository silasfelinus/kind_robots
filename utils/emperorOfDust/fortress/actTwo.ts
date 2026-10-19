import type { DayDef, QuestDef } from './types'

// Act II, Days 11-20, "Rain Debt" (conductor DAY-PLAN.md): the Crow
// covenant and what it costs, the Mirefen, Saffron's old crew, the Rustline,
// the Mole manifesto, Hollow Bell's vote and the levy. Two Items of Power
// can be earned here: the Brass Hourglass (Day 14) and the Eye (Day 17).

export const ACT_TWO_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d12-mirefen-defense',
    title: 'Hold the Mirefen Edge',
    summary:
      'Raiders are camped at the edge of the Mirefen. Sister Reedlight asks the crown to drive them off before they reach the lantern-houses.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        affinity: { 'mire-mothers': 20 },
        strength: { jackalwire: -1, 'mire-mothers': 1 },
        recruitable: ['F015'],
      },
      success: {
        affinity: { 'mire-mothers': 15 },
        strength: { jackalwire: -1 },
        recruitable: ['F015'],
      },
      partial: { affinity: { 'mire-mothers': 5 } },
      failure: {
        affinity: { 'mire-mothers': -10 },
        strength: { 'mire-mothers': -1 },
      },
    },
    expired: { affinity: { 'mire-mothers': -10 } },
    outcomes: {
      triumph:
        'The raiders broke and ran. A young newt-witch with a green lantern walked the party home, and asked, quietly, whether the throne had room for a witch who disagreed with her elders.',
      success:
        'The camp is scattered. A newt-witch named Isolde thanks the party, then asks to speak with the emperor alone.',
      partial: 'The raiders pulled back, but not far.',
      failure:
        'The party was driven off. Lanterns burned in the fen all night, and not all of them were the Mothers’.',
      expired: 'No help came. The Mothers will not ask twice.',
    },
  },
  {
    id: 'q-d12-mirefen-cellars',
    title: 'What Is Under the Lantern-Houses',
    summary:
      'While the Mothers ask for soldiers, slip into the lantern-houses and see what they keep in the cellars.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'high', hidden: true },
    ],
    danger: 'mid',
    tags: ['records'],
    rewards: {
      success: {
        affinity: { 'mire-mothers': -10, moles: 5 },
        local: { lamplight: 3 },
        flags: ['mirefen-cellars-seen'],
      },
      failure: { affinity: { 'mire-mothers': -15 } },
    },
    expired: {},
    outcomes: {
      success:
        'The cellars are full of jars, labelled in a neat hand with dates and the names of villages. Some of the jars are very small. The party took the ledger and left the jars.',
      partial: 'The party saw the cellar door, and the lock, and left.',
      failure:
        'The Mothers caught the party on the stairs and smiled at them all the way out.',
      expired: 'Nobody went down.',
    },
  },
  {
    id: 'q-d13-water-engine',
    title: 'The Pack’s Water Engine',
    summary:
      'Saffron’s old bandmates have a broken water engine and a canyon full of thirsty raiders. Only Saffron knows how it was built.',
    region: 'jackalwire',
    faction: 'jackalwire',
    mustInclude: 'F002',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, 'hollow-bell': -5 },
        flags: ['talk-saffron-insignia', 'pack-engine-fixed'],
      },
      failure: { affinity: { jackalwire: -10 } },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'The engine runs. The Pack cheered Saffron like a returning captain, and she wept and then denied it. Hollow Bell’s stream is a little lower this week.',
      partial: 'The engine coughs and runs on alternate days.',
      failure: 'The engine exploded, gently. Nobody is speaking to anybody.',
      expired: 'The Pack waited, then stopped waiting.',
    },
  },
  {
    id: 'q-d13-engine-sabotage',
    title: 'Fix It to Fail',
    summary:
      'Repair the Pack’s water engine so that it breaks in a month, when the raiders are counting on it.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['repair', 'coercion'],
    rewards: {
      success: {
        strength: { jackalwire: -2 },
        affinity: { jackalwire: 5, 'hollow-bell': 5 },
        flags: ['engine-sabotaged'],
      },
      failure: {
        affinity: { jackalwire: -25 },
        flags: ['engine-sabotage-caught'],
      },
    },
    expired: {},
    outcomes: {
      success:
        'The engine runs beautifully. In a month it will not. Nobody in the canyon suspects a thing.',
      partial:
        'The engine runs. Whether it will fail on schedule is anyone’s guess.',
      failure:
        'Gristle Vane found the filed bolt himself. He kept it, and he will show it to people.',
      expired: 'The chance passed.',
    },
  },
  {
    id: 'q-d14-sick-courier',
    title: 'A Sick Courier',
    summary:
      'A Saltroad courier collapsed at the Eastern Ford with a fever and a satchel nobody is allowed to open. Reach them before the fever does.',
    region: 'east-ford',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['medicine', 'urgent'],
    rewards: {
      triumph: {
        affinity: { saltroad: 15 },
        recruitable: ['F007'],
        flags: ['courier-saved', 'relic-hourglass-earned'],
      },
      success: {
        affinity: { saltroad: 10 },
        recruitable: ['F007'],
        flags: ['courier-saved', 'relic-hourglass-earned'],
      },
      partial: { affinity: { saltroad: 3 }, flags: ['courier-saved'] },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { affinity: { saltroad: -10 } },
    outcomes: {
      triumph:
        'The courier, a fox called Ash Quill, sat up by evening and asked for their satchel. Inside was a small brass hourglass addressed to Young Komodo. Komodo let the court keep it, a little too quickly.',
      success:
        'Ash Quill will live. Their satchel held a brass hourglass addressed to Young Komodo; he waved it away and said the court should have it.',
      partial:
        'The courier lived, barely, and was carried home by caravan before anyone could ask questions.',
      failure: 'The fever won.',
      expired: 'Nobody came in time.',
    },
  },
  {
    id: 'q-d15-study-glass',
    title: 'Glass Feathers',
    summary:
      'The Rustline salvagers have brought a crate of old-world glass shaped like feathers. Study it before anyone sells it.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'none',
    tags: ['records'],
    rewards: {
      success: {
        affinity: { rustline: 10 },
        local: { lamplight: 3 },
        recruitable: ['F014'],
        flags: ['glass-feathers-studied'],
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: { affinity: { rustline: -5 } },
    outcomes: {
      success:
        'The feathers ring when struck, all on the same note as the Hollow Bell. The rat salvager who brought them, Pell, wants to know what the court learned, and whether the court is hiring.',
      partial: 'The feathers were catalogued. Nobody understands them.',
      failure: 'One feather cracked, and the salvagers took the rest home.',
      expired: 'The salvagers sold the crate in the market.',
    },
  },
  {
    id: 'q-d16-hidden-grain',
    title: 'Three Haystacks',
    summary:
      'Somebody is hiding grain in the middle of a drought. Three haystacks on the Freehold road are heavier than hay should be.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'high', hidden: true },
    ],
    danger: 'low',
    tags: ['records', 'tracking'],
    rewards: {
      success: {
        brass: 30,
        local: { yard: 3, 'old-houses': -2 },
        flags: ['grain-found'],
      },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'Two haystacks were full of grain sacks stamped with an Old House crest. The third was full of hay, and a very surprised goat.',
      partial: 'One haystack held grain. Its owner fled before questions.',
      failure: 'The haystacks were hay. Nobody believes it.',
      expired: 'The haystacks were moved in the night.',
    },
  },
  {
    id: 'q-d17-who-lies',
    title: 'Who Has Been Lying?',
    summary:
      'For two weeks some of the morning reports have been wrong in the same careful way. Trace the false reports to their source.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['records', 'forgery'],
    rewards: {
      triumph: {
        local: { lamplight: 4 },
        affinity: { 'storm-crows': 5 },
        flags: ['relic-eye-earned', 'false-reports-traced'],
      },
      success: {
        local: { lamplight: 3 },
        flags: ['relic-eye-earned', 'false-reports-traced'],
      },
      partial: { local: { lamplight: 1 } },
      failure: { affinity: { 'storm-crows': -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The false reports came through three runners and a Crow dead-drop, and the trail ended back at the fortress gate. In the dead-drop was a glass eye from an elder crow, long dead, that shows lies for what they are. The court has it now.',
      success:
        'The trail of false reports led through a Crow dead-drop to somewhere inside the fortress. In the dead-drop: a dead elder crow’s glass eye, which shows a lie for what it is.',
      partial: 'The trail went cold at the Crow dead-drop.',
      failure: 'The runners vanished before they could be followed.',
      expired: 'The reports kept coming, some of them wrong.',
    },
  },
  {
    id: 'q-d18-refugee-road',
    title: 'No Water for Strangers',
    summary:
      'Walk the turned-away refugees to the Hollow Bell wells and make sure they are let in.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': 5, freeholds: -3 },
        local: { yard: 2 },
        flags: ['refugees-sheltered'],
      },
      failure: { affinity: { 'hollow-bell': -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'Hollow Bell let them in. Mara Reedbell wrote every name in her ledger.',
      partial: 'Some were let in. Some were not.',
      failure:
        'The Bell’s gate stayed shut, and the party slept outside it with the refugees.',
      expired: 'The refugees went to the Abbey.',
    },
  },
  {
    id: 'q-d19-bell-speech',
    title: 'Speak to Hollow Bell',
    summary:
      'Hollow Bell votes tomorrow on whether to accept the crown’s protection. Someone has to make the case in the square.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'lore', band: 'low' },
    ],
    danger: 'none',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': 15 },
        strength: { 'hollow-bell': 1 },
        flags: ['bell-voted-yes'],
      },
      failure: {
        affinity: { 'hollow-bell': -10 },
        flags: ['bell-voted-no'],
      },
    },
    expired: { flags: ['bell-voted-no'] },
    outcomes: {
      success:
        'Hollow Bell voted yes, by eleven hands. The bell rang, and somebody was holding the rope.',
      partial:
        'The vote was tied. Mara Reedbell broke the tie and would not say which way.',
      failure: 'Hollow Bell voted no. Mara was very polite about it.',
      expired: 'Nobody spoke for the crown. Hollow Bell voted no.',
    },
  },
  {
    id: 'q-d20-ford-dam',
    title: 'Before the Rains',
    summary:
      'The rains are coming, by covenant or not. Shore up the old dam at the Eastern Ford before the river decides where to go.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
        flags: ['ford-dam-built'],
      },
      failure: {
        strength: { freeholds: -1 },
        flags: ['ford-flooded'],
      },
    },
    expired: { strength: { freeholds: -1 }, flags: ['ford-flooded'] },
    outcomes: {
      success:
        'The dam held. The map room has a new blue line where the reservoir will be.',
      partial: 'The dam held, mostly. The lower fields flooded.',
      failure: 'The dam failed and the Ford flooded two villages.',
      expired: 'Nobody shored it up. The Ford flooded.',
    },
  },
]

export const ACT_TWO_DAYS: readonly DayDef[] = [
  {
    day: 11,
    title: 'The Rainmaker',
    briefings: [
      {
        id: 'rustline-fires',
        source: 'Eastern outriders',
        text: 'Salvager fires are burning in the sunken rail yards, where the map shows nothing.',
        truth: true,
      },
      {
        id: 'bell-wells-full',
        source: 'A cheerful Hollow Bell carter',
        text: 'Hollow Bell’s wells are full again after a single night of rain.',
        truth: false,
      },
      {
        id: 'rainmaker',
        source: 'Storm Crow Heights',
        text: 'Elder Corvane himself has come down from the Heights with a covenant written on oilcloth.',
        truth: true,
      },
    ],
    komodo:
      'Nobody fills a well in one night, Your Majesty, least of all in this drought. Corvane does not come down from the Heights for small favors. Read the covenant twice; I would read it three times.',
    quests: [],
    audiences: [
      {
        id: 'd11-rainmaker',
        title: 'The Rainmaker',
        speaker: 'Elder Corvane of the Storm Crow Conclave',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'The fields are dying, young ruler. The Conclave can bring rain: a season of it, over every farm from the Ford to the Bell.',
          'In return, a covenant. The tower will lend the Conclave a service when the Conclave asks. Every covenant has a price; ours is merely written down.',
        ],
        options: [
          {
            id: 'covenant',
            label: 'Sign the rain covenant.',
            effects: {
              affinity: { 'storm-crows': 15, freeholds: 10 },
              local: { yard: 2 },
              strength: { 'storm-crows': 1 },
              flags: ['rain-covenant'],
            },
            response:
              'Corvane signs with a claw dipped in ink, and the first cloud appears over the Heights before he has finished.',
          },
          {
            id: 'one-season',
            label: 'Buy one season of rain outright, with brass.',
            requires: { cost: 40 },
            effects: {
              affinity: { 'storm-crows': 5, freeholds: 5 },
              local: { ledger: -2 },
            },
            response:
              'Corvane accepts the brass as one accepts a child’s drawing. The rain will come, briefly.',
          },
          {
            id: 'tamsin',
            label: 'Have Tamsin read the covenant aloud.',
            requires: { follower: 'F011' },
            effects: {
              affinity: { 'storm-crows': -5 },
              local: { lamplight: 2 },
              flags: ['bonded-runner-clause', 'talk-tamsin-bonds'],
            },
            response:
              'Tamsin reads it in a flat voice and stops at clause eleven: the service owed may be paid in runners. Corvane’s clouded eyes find her. “Little runner,” he says. “You came back.”',
          },
          {
            id: 'refuse',
            label: 'Refuse. The tower will not sell itself for weather.',
            effects: {
              affinity: { 'storm-crows': -10, freeholds: -5 },
              flags: ['no-rain'],
            },
            response:
              'Corvane folds the covenant away. The sky stays very clear.',
          },
        ],
      },
    ],
  },
  {
    day: 12,
    title: 'Lanterns at Mirefen',
    briefings: [
      {
        id: 'mirefen-raiders',
        source: 'Mirefen reed-cutters',
        text: 'A raider band is camped at the edge of the Mirefen, close to the lantern-houses.',
        truth: true,
      },
      {
        id: 'mothers-ask-moles',
        source: 'A Saltroad peddler',
        text: 'The Mire Mothers have asked the Moles for help against the raiders.',
        truth: false,
      },
      {
        id: 'lanterns-again',
        source: 'Hollow Bell night watch',
        text: 'Lanterns are moving through the empty fen again, in step.',
        truth: true,
      },
    ],
    komodo:
      'The Moles would sooner flood their own tunnels than help a fen-witch, Your Majesty. The raiders are real. Whether the Mothers have told you everything is another question.',
    quests: [],
    audiences: [
      {
        id: 'd12-mire-protection',
        title: 'Lanterns at Mirefen',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        lines: [
          'Raiders at the edge of the fen, Your Majesty, a stone’s throw from our lantern-houses. We have children there.',
          'We are only refugees. We would ask the crown’s protection, nothing else.',
        ],
        options: [
          {
            id: 'defend',
            label: 'Send a party to hold the Mirefen edge.',
            effects: {},
            response:
              'Sister Reedlight bows. Her lantern does not flicker at all.',
            postsQuests: ['q-d12-mirefen-defense'],
          },
          {
            id: 'investigate',
            label:
              'Promise protection, and send someone to see the lantern-houses’ cellars.',
            effects: {},
            response:
              '“You are so kind,” says Sister Reedlight, and for the first time her lantern flickers.',
            postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
          },
          {
            id: 'decline',
            label: 'The crown cannot spare anyone for the fen.',
            effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
            response:
              'Sister Reedlight leaves without a word. The Moles, somehow, hear about it by nightfall.',
          },
        ],
      },
    ],
  },
  {
    day: 13,
    title: 'The Saffron Deal',
    briefings: [
      {
        id: 'pack-thirsty',
        source: 'Jackalwire deserters',
        text: 'The Pack’s water engine broke a week ago and the canyon is drying out.',
        truth: true,
      },
      {
        id: 'saffron-letter',
        source: 'The barracks',
        text: 'Saffron Kett received a letter sealed with a painted feather.',
        truth: true,
      },
      {
        id: 'pack-surrender',
        source: 'A Gate Watch rumor',
        text: 'Gristle Vane is ready to surrender the canyon to the crown for water.',
        truth: false,
      },
    ],
    komodo:
      'Vane would sell his own coat before he surrendered anything, Your Majesty. But a thirsty Pack is a desperate Pack, and desperate people make deals. Ask Saffron what is in that letter.',
    quests: [],
    audiences: [
      {
        id: 'd13-saffron-deal',
        title: 'The Saffron Deal',
        speaker: 'Captain Gristle Vane and Saffron Kett',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { follower: 'F002' },
        lines: [
          'Our water engine is broken, Majesty, and only one person alive knows how it was built. She is standing beside you, pretending not to know me.',
          'Lend us Saffron for two days. We will remember the kindness. The Pack has a long memory for kindness, and a longer one for the other thing.',
        ],
        options: [
          {
            id: 'lend',
            label: 'Let Saffron go and fix it, if she chooses.',
            effects: {},
            response:
              'Saffron looks at you for a long moment, then at Vane. “Two days,” she says. “And I bring my own tools.”',
            postsQuests: ['q-d13-water-engine'],
          },
          {
            id: 'sabotage',
            label:
              'Agree, and quietly have the engine fixed to fail in a month.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'Vane is delighted. Saffron, who will not be the one doing the repair, does not need to know.',
            postsQuests: ['q-d13-engine-sabotage'],
          },
          {
            id: 'refuse',
            label: 'Refuse. Saffron serves the crown now.',
            effects: {
              affinity: { jackalwire: -10, 'hollow-bell': 3 },
            },
            response:
              'Vane bows deeply. Saffron does not look at either of you for the rest of the day.',
          },
        ],
      },
    ],
  },
  {
    day: 14,
    title: 'A Sick Courier',
    briefings: [
      {
        id: 'courier-down',
        source: 'Eastern Ford ferrymen',
        text: 'A Saltroad courier collapsed at the ford with a fever and a sealed satchel.',
        truth: true,
      },
      {
        id: 'archive-maps',
        source: 'The Lamplight Archive',
        text: 'The Archive’s old maps are crumbling faster than they can be copied.',
        truth: true,
      },
      {
        id: 'fever-plague',
        source: 'A frightened stablehand',
        text: 'The courier’s fever is a plague and half the ford has it.',
        truth: false,
      },
    ],
    komodo:
      'One courier is not a plague, Your Majesty, and a satchel nobody may open is more interesting than a fever. Send someone with steady hands.',
    quests: ['q-d14-sick-courier'],
    audiences: [
      {
        id: 'd14-archive-funds',
        title: 'Crumbling Maps',
        speaker: 'The Lamplight Archive',
        faction: 'lamplight',
        lines: [
          'The old maps are turning to dust in their cases, Majesty. Roads, wells and tunnels no living person remembers. Copying them costs ink, paper and time.',
        ],
        options: [
          {
            id: 'fund',
            label: 'Fund the copying.',
            requires: { cost: 20 },
            effects: { local: { lamplight: 4 }, flags: ['maps-copied'] },
            response: 'The scribes cheer, quietly, as scribes do.',
          },
          {
            id: 'decline',
            label: 'The crown needs its brass for the living.',
            effects: { local: { lamplight: -2 } },
            response: 'The Archive bows, and saves what it can on its own.',
          },
        ],
      },
      {
        id: 'd14-hollin',
        title: 'The Old Mapmaker',
        speaker: 'Hollin Moss of the Lamplight Archive',
        faction: 'lamplight',
        requires: { local: { lamplight: 12 } },
        lines: [
          'The Archive speaks well of the throne, Majesty, so I came to see it myself. I am old and I fly slowly, but I remember roads nobody else does.',
          'If the court has a bed for an owl, I would like to see some of those roads again before I die.',
        ],
        options: [
          {
            id: 'welcome',
            label: 'There is a bed for you, Hollin.',
            effects: { recruitable: ['F019'], local: { lamplight: 1 } },
            response:
              'Hollin blinks slowly, which in owls is a great deal of feeling.',
          },
          {
            id: 'archive',
            label: 'The Archive needs you more.',
            effects: { local: { lamplight: 2 } },
            response: '“Wisely said,” says Hollin, and flies home, slowly.',
          },
        ],
      },
    ],
  },
  {
    day: 15,
    title: 'Glass Feathers',
    briefings: [
      {
        id: 'salvagers-arrive',
        source: 'The Gate Watch',
        text: 'Rustline salvagers are at the gate with a crate of glass shaped like feathers.',
        truth: true,
      },
      {
        id: 'rustline-army',
        source: 'Lady Vask’s steward',
        text: 'The Rustline has an army of a thousand rats in the rail yards.',
        truth: false,
      },
      {
        id: 'glass-hums',
        source: 'Pell, a rat salvager',
        text: 'The glass hums when the Hollow Bell rings.',
        truth: true,
      },
    ],
    komodo:
      'A thousand rats would have eaten the rail yards bare, Your Majesty. The glass that hums is the story. Glass should not hum.',
    quests: [],
    audiences: [
      {
        id: 'd15-glass-feathers',
        title: 'Glass Feathers',
        speaker: 'Pell Quickmarrow of the Rustline',
        faction: 'rustline',
        lines: [
          'Old-world glass, Majesty. Shaped like feathers, and it does not break, and it hums when the Bell rings. I have a crate of it, and a price.',
          'The Ledger wants to buy it. The Archive wants to study it. I want to know which one the crown is.',
        ],
        options: [
          {
            id: 'study',
            label: 'Have the Archive study it before anyone sells it.',
            effects: {},
            response:
              'Pell grins. “The studying kind. Good. Selling is boring.”',
            postsQuests: ['q-d15-study-glass'],
          },
          {
            id: 'buy',
            label: 'Buy the crate for the treasury.',
            requires: { cost: 30 },
            effects: {
              affinity: { rustline: 10 },
              local: { ledger: 2 },
              items: ['surveyors-glass'],
              recruitable: ['F014'],
            },
            response:
              'Pell counts the brass and throws in a surveyor’s lens for free. “For the next crate,” he says.',
          },
          {
            id: 'send-away',
            label: 'Old-world relics bring trouble. Send them away.',
            effects: { affinity: { rustline: -10 }, local: { lamplight: -2 } },
            response:
              'Pell shrugs and wheels the crate toward the Ledger’s stalls.',
          },
        ],
      },
    ],
  },
  {
    day: 16,
    title: 'Three Haystacks',
    briefings: [
      {
        id: 'grain-missing',
        source: 'The Yard’s foreman',
        text: 'Grain is disappearing between the Freehold fields and the fortress.',
        truth: true,
      },
      {
        id: 'mice',
        source: 'Lady Vask’s steward',
        text: 'Mice have eaten the missing grain.',
        truth: false,
      },
      {
        id: 'heavy-hay',
        source: 'A Freehold carter',
        text: 'Three haystacks on the Freehold road are far too heavy for hay.',
        truth: true,
      },
    ],
    komodo:
      'Mice with an Old House steward to speak for them, Your Majesty. How fortunate for the mice.',
    quests: ['q-d16-hidden-grain'],
    audiences: [
      {
        id: 'd16-hoarders',
        title: 'Grain in a Drought',
        speaker: 'Foreman Dunmore Ash and Lady Ottoline Vask',
        npc: 'dunmore-ash',
        faction: 'yard',
        lines: [
          'The Yard is on half rations, Majesty, and the Old Houses’ granaries are full. Make them share.',
          'Lady Vask, beside him, is very calm. “The Old Houses saved their grain in good years. Is prudence a crime now?”',
        ],
        options: [
          {
            id: 'requisition',
            label: 'Requisition the Old Houses’ grain for the Yard.',
            effects: { local: { yard: 4, 'old-houses': -4 } },
            response: 'Dunmore nods once. Lady Vask writes something down.',
          },
          {
            id: 'buy',
            label: 'Buy the Old Houses’ surplus at a fair price.',
            requires: { cost: 25 },
            effects: { local: { yard: 2, 'old-houses': 1 } },
            response:
              'Everyone is slightly unhappy, which Komodo assures you is the mark of a fair deal.',
          },
          {
            id: 'leave',
            label: 'Prudence is not a crime.',
            effects: { local: { yard: -3, 'old-houses': 2 } },
            response:
              'Dunmore leaves without a word. The Yard is very quiet at supper.',
          },
        ],
      },
    ],
  },
  {
    day: 17,
    title: 'Midnight Choir',
    briefings: [
      {
        id: 'manifesto',
        source: 'The Gate Watch',
        text: 'A Mole manifesto was nailed to the fortress gate at midnight while someone sang below the walls.',
        truth: true,
      },
      {
        id: 'jackal-forgery',
        source: 'Young Komodo’s own runner',
        text: 'The manifesto is a Jackalwire forgery meant to turn the crown against the Moles.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'reports-wrong',
        source: 'The Lamplight Archive',
        text: 'Four of the last ten morning reports were wrong in the same careful way.',
        truth: true,
      },
    ],
    komodo:
      'I read it before you woke, Your Majesty. A Jackalwire forgery, I am almost sure of it. I would not dignify it with an audience. The Archive’s worry about the reports is, I think, scribes being scribes.',
    quests: ['q-d17-who-lies'],
    audiences: [
      {
        id: 'd17-manifesto',
        title: 'Midnight Choir',
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        lines: [
          'We did not come to burn your tower, young ruler. We came to tell you the burrows are drowning because your tax decree diverted the Ford.',
          'Give the burrows their water rights, or we will take them. We would rather you gave them.',
        ],
        options: [
          {
            id: 'meet',
            label: 'Open talks on the burrows’ water rights.',
            effects: {
              affinity: { moles: 15 },
              local: { 'old-houses': -2 },
              flags: ['mole-talks-opened'],
            },
            response:
              'Granny Umber squints at you through thick spectacles. “Talks,” she says. “We will see if they are worth the walk.”',
          },
          {
            id: 'arrest',
            label: 'Arrest the messenger for sedition.',
            effects: {
              affinity: { moles: -20 },
              local: { 'gate-watch': 2 },
              flags: ['mole-messenger-arrested'],
            },
            response:
              'The Watch takes Granny Umber away. She goes slowly, and she is smiling.',
          },
          {
            id: 'ignore',
            label: 'Take Komodo’s advice and ignore it.',
            effects: { affinity: { moles: -5 } },
            response:
              'Granny Umber is shown out. Komodo looks relieved, and then looks as if he wishes he had not.',
          },
        ],
      },
    ],
  },
  {
    day: 18,
    title: 'No Water for Strangers',
    briefings: [
      {
        id: 'wells-closed',
        source: 'Freehold reeves',
        text: 'The Freeholds have closed their wells to anyone without a Freehold token.',
        truth: true,
      },
      {
        id: 'fair',
        source: 'Saltroad drovers',
        text: 'A Saltroad fair is camped outside the fortress gate, with fire-jugglers.',
        truth: true,
      },
      {
        id: 'abbey-wells',
        source: 'A sister of the Abbey',
        text: 'The Abbey has a deep well and turns no stranger away.',
        truth: false,
      },
    ],
    komodo:
      'The Abbey’s well is shallower than its welcome, Your Majesty; I have seen it. The Freeholds closing their wells is real, and the Yard will take it badly.',
    quests: [],
    audiences: [
      {
        id: 'd18-strangers',
        title: 'No Water for Strangers',
        speaker: 'A Freehold reeve',
        faction: 'freeholds',
        lines: [
          'Our wells are low, Majesty, and every refugee on the road wants a cup. The Freeholds will water Freeholders. That is all we can do.',
        ],
        options: [
          {
            id: 'open-wells',
            label: 'Pay the Freeholds to open their wells to all.',
            requires: { cost: 15 },
            effects: {
              affinity: { freeholds: -5, 'hollow-bell': 5 },
              local: { yard: 2 },
              flags: ['wells-shared'],
            },
            response:
              'The reeve takes the brass, and the wells open, grudgingly.',
          },
          {
            id: 'freehold-rights',
            label: 'The Freeholds’ wells are theirs to keep.',
            effects: {
              affinity: { freeholds: 10 },
              local: { yard: -2 },
              flags: ['wells-closed'],
            },
            response:
              'The reeve bows deeply. The refugees on the road will hear about this.',
          },
          {
            id: 'escort',
            label: 'Walk the refugees to Hollow Bell instead.',
            effects: {},
            response:
              'The reeve looks relieved that it is someone else’s problem.',
            postsQuests: ['q-d18-refugee-road'],
          },
        ],
      },
      {
        id: 'd18-fair',
        title: 'The Saltroad Fair',
        speaker: 'Vesper Fanfare, fire-juggler',
        faction: 'saltroad',
        lines: [
          'Majesty! A whole fair at your gate: music, cider, three dancing goats and me. The Yard could use a night off. So could you, by the look of you.',
          'All we ask is the field outside the wall, and maybe a little brass for the lamps.',
        ],
        options: [
          {
            id: 'host',
            label: 'Host the fair, and pay for the lamps.',
            requires: { cost: 20 },
            effects: {
              affinity: { saltroad: 10 },
              local: { yard: 3 },
              recruitable: ['F018'],
            },
            response:
              'The fair is the best night the fortress has had. At the end of it, Vesper asks if the court ever needs someone who can talk to a crowd.',
          },
          {
            id: 'tax-fair',
            label: 'Let them stay, for a cut of the takings.',
            effects: { brass: 25, affinity: { saltroad: -5 } },
            response: 'The fair is smaller and quieter. Vesper juggles anyway.',
          },
          {
            id: 'decline',
            label: 'Not this week.',
            effects: { affinity: { saltroad: -3 }, local: { yard: -1 } },
            response: 'The fair packs up and rolls on toward Hollow Bell.',
          },
        ],
      },
    ],
  },
  {
    day: 19,
    title: 'Hollow Bell Votes',
    briefings: [
      {
        id: 'bell-vote',
        source: 'Mara Reedbell',
        text: 'Hollow Bell votes tomorrow on whether to accept the crown’s protection.',
        truth: true,
      },
      {
        id: 'abbey-campaign',
        source: 'Hollow Bell gossip',
        text: 'Abbey sisters have been visiting every house in the Bell, speaking against the crown.',
        truth: true,
      },
      {
        id: 'vote-fixed',
        source: 'An Old House cousin',
        text: 'The vote is already fixed; the mayor will vote however the Ledger pays her to.',
        truth: false,
      },
    ],
    komodo:
      'Mara Reedbell cannot be bought, Your Majesty; I have tried. That is what makes her dangerous. The Abbey canvassing door to door is new. I would like to know why the Abbess cares how Hollow Bell votes.',
    quests: [],
    audiences: [
      {
        id: 'd19-bell-vote',
        title: 'Hollow Bell Votes',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Hollow Bell votes tomorrow, Your Majesty, on whether to accept the crown’s protection. I will not tell you which way I lean.',
          'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
        ],
        options: [
          {
            id: 'garrison',
            label: 'Pledge a Gate Watch garrison to the Bell.',
            requires: { local: { 'gate-watch': 10 } },
            effects: {
              affinity: { 'hollow-bell': 20 },
              local: { 'gate-watch': -2 },
              strength: { 'hollow-bell': 1 },
              flags: ['bell-under-protection', 'bell-voted-yes'],
            },
            response:
              'Mara smiles, and writes a single word in her ledger. The Bell votes yes the next day.',
          },
          {
            id: 'water',
            label: 'Pledge the crown’s share of the covenant rain to the Bell.',
            requires: { flags: ['rain-covenant'] },
            effects: {
              affinity: { 'hollow-bell': 15, freeholds: -5 },
              flags: ['bell-voted-yes'],
            },
            response: '“Rain,” says Mara. “Now that is a promise you can see.”',
          },
          {
            id: 'speech',
            label: 'Send someone to make the crown’s case in the square.',
            effects: {},
            response:
              '“Make it a good one,” says Mara. “The sisters have been very busy.”',
            postsQuests: ['q-d19-bell-speech'],
          },
        ],
      },
    ],
  },
  {
    day: 20,
    title: 'The Levy',
    briefings: [
      {
        id: 'rains-coming',
        source: 'Storm Crow Heights',
        text: 'The rains will break over the Eastern Ford within two days.',
        truth: true,
      },
      {
        id: 'verge-riders',
        source: 'Far-border scouts',
        text: 'Riders in plum coats have been seen at the far border, where the map ends.',
        truth: true,
      },
      {
        id: 'pack-disbanded',
        source: 'A Saltroad drover',
        text: 'The Jackalwire Pack has disbanded and gone east.',
        truth: false,
      },
    ],
    komodo:
      'The Pack goes nowhere without Vane, Your Majesty, and Vane goes nowhere without his coat. The riders in plum are new. I do not know them, and I know most people.',
    quests: ['q-d20-ford-dam'],
    audiences: [
      {
        id: 'd20-levy',
        title: 'The Levy',
        speaker: 'Captain Ferro Dunmark and Lady Ottoline Vask',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'The Watch is thin, Majesty, and the borders are not. Riders at the far edge of the map. Raiders in the canyon. We need a levy, brass and bodies, before the season turns.',
          'Lady Vask adds, very reasonably, that a levy should of course fall on those with the least to lose.',
        ],
        options: [
          {
            id: 'levy-yard',
            label: 'Levy the Yard: brass and able bodies.',
            effects: {
              brass: 40,
              local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
              flags: ['levy-yard'],
            },
            response: 'Dunmark nods. Lady Vask smiles. The Yard does not.',
          },
          {
            id: 'levy-houses',
            label: 'Levy the Old Houses: they have the most to protect.',
            effects: {
              brass: 30,
              local: { 'old-houses': -5, yard: 2, 'gate-watch': 2 },
              flags: ['levy-houses'],
            },
            response:
              'Lady Vask’s smile vanishes entirely. Dunmark looks, for a moment, amused.',
          },
          {
            id: 'no-levy',
            label: 'No levy. The Watch will make do.',
            effects: { local: { 'gate-watch': -3, yard: 1 } },
            response:
              'Dunmark salutes, stiffly. “We will make do,” he says, “until we cannot.”',
          },
        ],
      },
      {
        id: 'd20-covenant-due',
        title: 'The Covenant Comes Due',
        speaker: 'Elder Corvane of the Storm Crow Conclave',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        requires: { flags: ['rain-covenant'] },
        lines: [
          'The rain came, young ruler, as promised. The Conclave now names its service: three runners from your court, to carry forecasts in the caves for a season.',
        ],
        options: [
          {
            id: 'pay-brass',
            label: 'Offer brass instead of runners.',
            requires: { cost: 50 },
            effects: {
              affinity: { 'storm-crows': -5 },
              clearFlags: ['rain-covenant'],
              flags: ['covenant-bought-out'],
            },
            response:
              'Corvane takes the brass with distaste. “The covenant said runners,” he says. “We will remember the substitution.”',
          },
          {
            id: 'send-runners',
            label: 'Send three volunteers from the Yard.',
            effects: {
              affinity: { 'storm-crows': 10 },
              local: { yard: -4 },
              clearFlags: ['rain-covenant'],
              flags: ['covenant-paid-in-runners'],
            },
            response:
              'Three young volunteers climb the Heights. The Yard does not forgive it quickly.',
          },
          {
            id: 'break',
            label: 'Break the covenant.',
            effects: {
              affinity: { 'storm-crows': -30 },
              strength: { 'storm-crows': -1 },
              clearFlags: ['rain-covenant'],
              flags: ['covenant-broken'],
            },
            response:
              'Corvane stands very still. Outside, the clear sky turns the colour of a bruise.',
          },
        ],
      },
    ],
  },
]

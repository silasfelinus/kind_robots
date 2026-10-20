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
        'The courier, a fennec called Ash Quill, sat up by evening and asked for their satchel. Inside was a small brass hourglass addressed to Young Komodo. Komodo let the court keep it, a little too quickly.',
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
          'The hall is hot enough that the court has stopped pretending otherwise. Fans click in the gallery. At the back, three Freehold reeves hold empty seed sacks folded over their arms like mourning bands. Then come the chimes: hundreds of tiny copper bells on an old crow’s mantle, ringing with each slow step up the carpet.',
          'Elder Corvane does not bow. He unrolls a length of oilcloth down the steps of the dais, and it goes on unrolling for rather longer than seems polite.',
          'The fields are dying, young ruler. The Conclave can bring rain: a season of it, over every farm from the Ford to the Bell.',
          'In return, a covenant. The tower will lend the Conclave a service when the Conclave asks. Every covenant has a price; ours is merely written down.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Elder has not come down from the Heights in my lifetime, Your Majesty. Whatever he wants, he wants it badly enough to walk.',
          },
        ],
        options: [
          {
            id: 'ask-service',
            label: 'Ask what kind of service the Conclave usually asks for.',
            effects: {},
            response:
              'The chimes on Corvane’s mantle go quiet all at once, as if every one of them were listening.',
            next: 'price',
          },
          {
            id: 'recall-clause-nine',
            label:
              'Tell him the court’s readers struck clause nine from his envoy’s last contract, and ask where it is hiding in this one.',
            requires: { flags: ['crow-contract-read'] },
            effects: {},
            response:
              'Corvane’s clouded eyes turn to you properly for the first time. “Ah,” he says. “The readers. I did wonder who they were.”',
            next: 'price',
          },
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
              'Corvane signs with a claw dipped in ink, and the first cloud appears over the Heights before he has finished. At the back of the hall, one of the reeves sits down on the floor.',
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
              'Corvane accepts the brass as one accepts a child’s drawing. The rain will come, briefly, and owe nobody anything when it goes.',
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
              'Corvane folds the covenant away, all of it, which takes a while. The reeves watch every fold. The sky stays very clear.',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“Small things,” says Corvane. “A runner to carry forecasts between the caves for a season. A field left fallow for our storm-glass. A bell rung at an hour of our choosing. Once, a long time ago, a name.” He lists them the way a cook lists salt and flour.',
              '“We do not hide the price, young ruler. We write it in a hand too old to hurry, and we wait for the signer to stop reading. Clause eleven. Read it if you like. Nobody likes it.”',
              '“The rain does not wait, though. It is gathering over the Heights as we speak. If the tower does not want it, the Conclave has other customers.”',
              {
                who: 'A Freehold reeve at the back of the hall',
                text: 'We’re eating our seed corn, Majesty. Whatever’s in clause eleven, it isn’t hunger.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has just told you the price, Your Majesty, so that when it comes due it will have been your choice. That is the whole art of the Conclave. I would still sign. A debt can be argued with. A dead field cannot.',
              },
            ],
            options: [
              {
                id: 'covenant',
                label:
                  'Sign it as written. The fields cannot wait for a kinder contract.',
                effects: {
                  affinity: { 'storm-crows': 15, freeholds: 10 },
                  local: { yard: 2 },
                  strength: { 'storm-crows': 1 },
                  flags: ['rain-covenant'],
                },
                response:
                  'You sign with your eyes open, which Corvane seems to enjoy. The first cloud appears over the Heights before the ink is dry, and the reeves at the back of the hall begin, very quietly, to weep.',
              },
              {
                id: 'one-season',
                label:
                  'Buy one season outright instead. No service, no clause eleven.',
                requires: { cost: 40 },
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { ledger: -2 },
                },
                response:
                  'Corvane weighs the purse and sighs, as if you had chosen the dull ending of a good story. The rain will come, briefly. The Ledger’s factor, in the gallery, writes down exactly how much it cost.',
              },
              {
                id: 'tamsin',
                label:
                  'Let Tamsin read clause eleven aloud, to the whole court.',
                requires: { follower: 'F011' },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { lamplight: 2 },
                  flags: ['bonded-runner-clause', 'talk-tamsin-bonds'],
                },
                response:
                  'Tamsin reads it in a flat voice: the service owed may be paid in runners, the season to be counted by the Conclave. Her hands are shaking by the end. Corvane’s clouded eyes find her. “Little runner,” he says. “You came back.”',
              },
              {
                id: 'refuse',
                label:
                  'Refuse. The tower will not sell its people for weather, even with its eyes open.',
                effects: {
                  affinity: { 'storm-crows': -10, freeholds: -5 },
                  flags: ['no-rain'],
                },
                response:
                  'Corvane rolls up his covenant, all of it. The reeves watch every turn. The sky stays very clear, and by evening every Freehold kitchen knows who kept it that way.',
              },
              {
                id: 'amend',
                label:
                  'Sign, but write in the margin in your own hand: no person of this court is ever payment.',
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { yard: 2, 'old-houses': -2 },
                  flags: ['rain-covenant', 'd11-no-runners-clause'],
                },
                response:
                  'Corvane reads the margin note, then initials it himself, which is somehow worse than if he had argued. “No persons,” he says. “The Conclave is flexible about the coin, young ruler. Never about the sum.” In the gallery, the Old Houses, who own most of the high pastures, begin to whisper.',
              },
            ],
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
          'Sister Reedlight comes up the carpet with fen mud to her knees and two small children holding the hem of her reed cloak, one on each side, as if she were a boat they had been told not to let drift. Her green lantern is lit. The flame inside it stands perfectly still.',
          'Raiders at the edge of the fen, Your Majesty, a stone’s throw from our lantern-houses. They came three nights ago with torches, and they have not left. We have children there.',
          'We are only refugees. We would ask the crown’s protection, nothing else.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The outriders count thirty blades at the fen’s edge, Your Majesty, so the raiders are real. What I cannot count is what the Mothers keep in those houses. Neither, I think, can anyone who has tried.',
          },
        ],
        options: [
          {
            id: 'ask-raiders',
            label:
              'Ask what raiders could want from a fen with no grain and no brass.',
            effects: {},
            response:
              'Sister Reedlight’s hands tighten, very slightly, on the two small heads at her side.',
            next: 'grievance',
          },
          {
            id: 'recall-road',
            label:
              'Ask why the Mothers would come back to a throne that closed the road on them.',
            requires: { flags: ['mire-road-closed'] },
            effects: {},
            response:
              'For the first time since you have known her, Sister Reedlight looks at you without smiling.',
            next: 'closed-road',
          },
          {
            id: 'recall-count',
            label:
              'Tell her the escort counted heads on the road that first night, and ask her to count again.',
            requires: { flags: ['mire-quiet-count'] },
            effects: {},
            response:
              '“You counted us,” she says pleasantly. “Of course you did.”',
            next: 'count',
          },
          {
            id: 'defend',
            label: 'Send a party to hold the Mirefen edge.',
            effects: {},
            response:
              'Sister Reedlight bows. The children copy her, a beat late. Her lantern does not flicker at all.',
            postsQuests: ['q-d12-mirefen-defense'],
          },
          {
            id: 'investigate',
            label:
              'Promise protection, and send someone to see the lantern-houses’ cellars.',
            effects: {},
            response:
              '“You are so kind,” says Sister Reedlight, and for the first time her lantern flickers. One of the children looks up at it, frightened, as if it has never done that before.',
            postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
          },
          {
            id: 'decline',
            label: 'The crown cannot spare anyone for the fen.',
            effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
            response:
              'Sister Reedlight leaves without a word, the children trotting to keep up. The Moles, somehow, hear about it by nightfall, and drink to the crown in three tunnels.',
          },
        ],
        beats: [
          {
            id: 'grievance',
            lines: [
              '“Raiders want bread and brass, Your Majesty, and the fen has neither.” Her voice does not change. “These want something else. They say the Mothers have something of theirs.”',
              '“They are from Sedgewick and Low Carrow, poor villages up the dry river. Grief has made them stupid. They walk the fen’s edge at night with torches, shouting names into the reeds.”',
              {
                who: 'A young newt at the back of the Mothers’ escort, holding a green lantern',
                text: 'Children’s names, Majesty. The same eleven, every night. I have learned them all.',
              },
              '“Hush,” says Sister Reedlight, without turning round. The young newt hushes.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Sedgewick and Low Carrow lost children to a fever two winters ago, Your Majesty, or so the Archive wrote at the time. Think hard before the crown becomes the one who finds out it was not a fever. Some doors, once opened, belong to whoever opened them.',
              },
            ],
            options: [
              {
                id: 'defend',
                label:
                  'Hold the fen edge anyway. Whatever was lost two winters ago, there are children in those houses now.',
                effects: {},
                response:
                  'Sister Reedlight bows low. “The fen remembers kindness.” Behind her, the young newt with the green lantern is still mouthing names.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'investigate',
                label:
                  'Hold the edge, and while the Mothers watch the raiders, send someone down into the cellars.',
                effects: {},
                response:
                  '“You are so kind,” says Sister Reedlight, and her lantern gutters as if a door had opened somewhere below it. The young newt meets your eyes and, very slightly, nods.',
                postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
              },
              {
                id: 'decline',
                label:
                  'Grief is not the crown’s quarrel, and neither is the fen. Send no one.',
                effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
                response:
                  'Sister Reedlight leaves without a word. The Moles hear about it by nightfall, and so, a little later, do the villages up the dry river.',
              },
              {
                id: 'hear-raiders',
                label:
                  'Send word to the camp: put down the torches, and the crown will hear their grievance at court. No party goes to the fen.',
                effects: {
                  affinity: { 'mire-mothers': -10 },
                  local: { lamplight: 2, 'gate-watch': -1 },
                  flags: ['d12-raiders-heard'],
                },
                response:
                  'Sister Reedlight gathers the children and goes. Two days later a carter from Low Carrow brings the crown eleven names, written large and careful by someone who had to learn letters to write them. That same night, every window in the lantern-houses goes dark at once.',
              },
            ],
          },
          {
            id: 'closed-road',
            lines: [
              '“You closed the road, Your Majesty, and forty-one lanterns turned back into the fen. Thirty-six came home. The raiders found the other five in the reeds.”',
              '“I have not come to ask what the tower owes the five. The Mothers have decided to forgive you, once. That is a rarer thing than rain.”',
              '“The raiders who found them are camped at our door now. I would like the people who closed the road to stand on it.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Forgiveness from the Mire Mothers, Your Majesty. I have never once heard of it being offered. I would very much like to know what it costs.',
              },
            ],
            options: [
              {
                id: 'defend',
                label: 'Stand on the road this time. Hold the Mirefen edge.',
                effects: {},
                response:
                  'Sister Reedlight inclines her head. “Then the forgiveness is spent,” she says, “and well spent.”',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'investigate',
                label:
                  'Hold the edge, and send someone to see what the Mothers keep in their cellars.',
                effects: {},
                response:
                  '“Kind,” she says, “and still careful.” Her lantern flickers. “Careful is how the five ended up in the reeds, Your Majesty. Be careful of careful.”',
                postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
              },
              {
                id: 'decline',
                label:
                  'The road was closed for a reason. The crown will not be shamed onto it.',
                effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
                response:
                  'Sister Reedlight looks at you for a long moment. “Then I withdraw the forgiveness,” she says, quite gently. “It was never meant for you anyway. It was meant for the five.”',
              },
              {
                id: 'apologize',
                label:
                  'Apologize before the whole court, pay blood-price to the five lanterns’ families, and hold the edge.',
                requires: { cost: 20 },
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { 'gate-watch': -2, 'old-houses': -1 },
                  flags: ['d12-road-apology'],
                },
                response:
                  'The hall goes very quiet. Captain Dunmark’s jaw sets: his Watch closed that road on your order, and now the crown has said in public that it was wrong. Sister Reedlight counts the brass slowly, in five piles. “The fen will remember this,” she says, and for once it does not sound like a threat.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
            ],
          },
          {
            id: 'count',
            lines: [
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Forty-one went into the fen that night, Your Majesty; our escort counted them at the reeds. Last night the reed-cutters counted the lit windows in the lantern-houses, one lantern to a soul, as is the Mothers’ custom. Forty-four.',
              },
              '“Babies are born, Your Majesty,” says Sister Reedlight. “Even in the fen.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Three, in ten days. A fertile fen.',
              },
              'Sister Reedlight smiles. The two children at her hem do not. One of them, you notice now, is not a newt at all, but a small, sleepy-eyed vole in a reed cloak much too big for him.',
              '“The raiders, Your Majesty,” she says. “Will the crown hold the edge, or will it go on counting?”',
            ],
            options: [
              {
                id: 'defend',
                label: 'Hold the edge. The counting can wait.',
                effects: {},
                response:
                  'Sister Reedlight bows. The little vole yawns enormously and is hushed.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'investigate',
                label:
                  'Hold the edge, and send someone down into the cellars to finish the count.',
                effects: {},
                response:
                  '“You are so kind,” says Sister Reedlight, “and so careful.” Her lantern flickers twice.',
                postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
              },
              {
                id: 'decline',
                label:
                  'Send no one. Forty-four lanterns can light their own way.',
                effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
                response:
                  'Sister Reedlight leaves. The little vole looks back at the throne the whole way down the hall.',
              },
              {
                id: 'ask-raiders',
                label: 'Ask what the raiders say the Mothers took.',
                effects: {},
                response:
                  '“You will hear it anyway,” she says. “Better from me.”',
                next: 'grievance',
              },
            ],
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
          'Captain Gristle Vane fills the doorway before he fills the hall: a hyena in a greatcoat of a hundred painted feathers, an ear-chain that jangles when he bows, and canyon dust in every seam. He bows to the throne. Then, more slowly, to the jackal standing at its shoulder.',
          'Our water engine is broken, Majesty, and only one person alive knows how it was built. She is standing beside you, pretending not to know me.',
          {
            who: 'Saffron Kett',
            npc: 'F002',
            text: 'I don’t know him.',
          },
          'Saffron says it to her toolkit, which she is holding in both arms like a shield.',
          'Lend us Saffron for two days. We will remember the kindness. The Pack has a long memory for kindness, and a longer one for the other thing.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The canyon has been dry a week, Your Majesty. A thirsty Pack goes looking for water, and the nearest water that is not in the canyon belongs to Hollow Bell.',
          },
        ],
        options: [
          {
            id: 'ask-engine',
            label: 'Ask Vane how the engine came to break.',
            effects: {},
            response:
              'Vane’s grin stays exactly where it is. His ear-chain stops jangling.',
            next: 'broken',
          },
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
              'Vane is delighted. Saffron, who will not be the one doing the repair, does not need to know. Komodo writes nothing down, which is how you know he heard.',
            postsQuests: ['q-d13-engine-sabotage'],
          },
          {
            id: 'refuse',
            label: 'Refuse. Saffron serves the crown now.',
            effects: {
              affinity: { jackalwire: -10, 'hollow-bell': 3 },
            },
            response:
              'Vane bows deeply, all his feathers whispering. Saffron does not look at either of you for the rest of the day.',
          },
          {
            id: 'medicine-debt',
            label:
              'Remind Vane who paid for the Pack’s dust-lung tincture, and ask a kindness back: share the engine’s water with Hollow Bell.',
            requires: { flags: ['pack-medicine'] },
            effects: {
              affinity: { jackalwire: -5, 'hollow-bell': 10 },
              flags: ['d13-water-shared'],
            },
            response:
              'Vane is quiet a long moment. “The pups at the bridge camp breathe because of you,” he says at last. “That buys a great deal. It buys this.” He spits in his palm and holds it out. Saffron makes a sound that might, in a better week, have been a laugh.',
            postsQuests: ['q-d13-water-engine'],
          },
        ],
        beats: [
          {
            id: 'broken',
            lines: [
              '“Broke? It was broken, Majesty. There is a difference. Somebody came down the canyon in the dark with a crowbar and knew exactly which pin to pull.”',
              '“The engine drinks from the same deep seam that feeds Hollow Bell’s stream. When it runs, their stream drops a hand’s width. When it stopped, their stream came back.” He shows every tooth. “I know who pulled the pin. So does their mayor. I have done nothing about it. Yet.”',
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: 'I built it to sip, not to gulp. You lot took the governor off the week I left, didn’t you. Of course somebody from the Bell came with a crowbar. I’d have come myself.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'So the question is which town goes thirsty, Your Majesty, and which one gets to call the other a thief. I would only point out that the Pack has wagons, and the Bell has a bell.',
              },
            ],
            options: [
              {
                id: 'lend',
                label:
                  'Let Saffron fix it, if she chooses. The canyon is thirstier tonight than the Bell.',
                effects: {},
                response:
                  'Saffron looks at you for a long moment, then at Vane. “Two days,” she says. “I bring my own tools, I put the governor back on, and if anyone takes it off again I come back for it.” Vane laughs. Nobody else does.',
                postsQuests: ['q-d13-water-engine'],
              },
              {
                id: 'sabotage',
                label:
                  'Agree, and quietly have it fixed to fail in a month, when the Bell will need its stream most.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Vane is delighted. Saffron, who will not be the one doing the repair, does not need to know, and does not look at you as she leaves. She knows the sound of a decision being kept from her.',
                postsQuests: ['q-d13-engine-sabotage'],
              },
              {
                id: 'refuse',
                label:
                  'Refuse. Saffron serves the crown now, and the canyon will have to find its own water.',
                effects: {
                  affinity: { jackalwire: -10, 'hollow-bell': 3 },
                },
                response:
                  'Vane bows deeply. Saffron does not look at either of you for the rest of the day, and that night the Yard hears her filing something in the dark of the workshop for hours.',
              },
              {
                id: 'warn-bell',
                label:
                  'Lend Saffron, but send word to Mara Reedbell first: the engine runs again, and her stream will drop.',
                effects: {
                  affinity: { 'hollow-bell': 5, jackalwire: -5 },
                  flags: ['d13-bell-warned'],
                },
                response:
                  'Vane’s smile thins. “You warned the people who broke it,” he says. “Kind. That gives them a week to fill their cisterns, and a week to find another crowbar.” Saffron is already packing her tools, and takes no side out loud.',
                postsQuests: ['q-d13-water-engine'],
              },
              {
                id: 'name-culprit',
                label:
                  'Ask Vane for the name of whoever held the crowbar, and promise the crown will judge them.',
                effects: {
                  affinity: { jackalwire: 5, 'hollow-bell': -10 },
                  local: { 'gate-watch': 1 },
                  flags: ['d13-bell-saboteur-named'],
                },
                response:
                  'Vane leans in and whispers it: a miller’s son from Hollow Bell, seventeen, who carried the crowbar because his mother’s wheel had stopped turning. A Watch rider leaves for the Bell within the hour. Mara Reedbell will hear the hooves before she hears the reason.',
              },
            ],
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
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        lines: [
          'A sloth in ink-dark robes takes a long, unhurried while to cross the throne room, and does not apologize for it.',
          '“The old maps are turning to dust in their cases, Majesty. Roads, wells and tunnels no living person remembers. Copying them costs ink, paper and time. Mostly time.”',
          '“I have brought one to show you.” He unrolls it on the step of the dais. A corner lifts away in the draught from the doors and drifts across the floor like a leaf. Nobody moves to catch it. “That,” says Keeper Vellum, “was the Eastern Ford, before the Ford moved.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Old maps are only paper, Your Majesty, until somebody needs to know where a tunnel goes. Then they are worth a war.',
          },
        ],
        options: [
          {
            id: 'ask-which',
            label: 'Ask which maps are crumbling first.',
            effects: {},
            response:
              'Keeper Vellum blinks, slowly. It is the most enthusiastic thing he has done since he arrived.',
            next: 'shelves',
          },
          {
            id: 'fund',
            label: 'Fund the copying.',
            requires: { cost: 20 },
            effects: { local: { lamplight: 4 }, flags: ['maps-copied'] },
            response:
              'The scribes cheer, quietly, as scribes do. Keeper Vellum nods once, which for him is dancing.',
          },
          {
            id: 'decline',
            label: 'The crown needs its brass for the living.',
            effects: { local: { lamplight: -2 } },
            response:
              'The Archive bows, and saves what it can on its own. The corner of the Ford is swept up with the morning dust.',
          },
        ],
        beats: [
          {
            id: 'shelves',
            lines: [
              '“The oldest crumble first, Majesty, and the oldest are the strangest. The tunnels under the Ford. The old road to the Abbey of the Silent Bell, and the plans of what stood on that hill before it was an Abbey.” He pauses for a long time, even for him. “Those last have been borrowed a great deal, lately. Always returned. Always a little more worn.”',
              '“The newest are the trade roads, and those the Ledger would gladly pay to copy, if it may keep the copies and sell the routes.”',
              {
                who: 'Factor Marisol Tallow',
                npc: 'marisol-tallow',
                text: 'Half the cost, Majesty, paid today, and the Archive keeps working. The Ledger asks only what anyone would: to own what it pays for.',
              },
              '“Paper does not care who owns it,” says Keeper Vellum. “I do.”',
            ],
            options: [
              {
                id: 'fund',
                label:
                  'Fund the copying from the treasury, and keep every copy in the Archive.',
                requires: { cost: 20 },
                effects: { local: { lamplight: 4 }, flags: ['maps-copied'] },
                response:
                  'The scribes cheer, quietly, as scribes do. Keeper Vellum nods once, which for him is dancing. Factor Tallow writes a very small note in a very small book.',
              },
              {
                id: 'decline',
                label:
                  'The crown needs its brass for the living. The dead roads can wait.',
                effects: { local: { lamplight: -2 } },
                response:
                  '“The dead roads have been waiting a long time,” says Keeper Vellum, and bows, and saves what he can on his own.',
              },
              {
                id: 'abbey-first',
                label:
                  'Fund it, but copy the Abbey road and the plans of that hill first, and lock the copies away.',
                requires: { cost: 20 },
                effects: {
                  local: { lamplight: 2 },
                  affinity: { abbey: -5 },
                  flags: ['maps-copied', 'd14-abbey-maps-first'],
                },
                response:
                  'Keeper Vellum looks at you over his spectacles for a long, slow moment. “Yes,” he says. “I think that is wise.” Two days later a sister in grey comes to the Archive asking, very politely, to borrow a map that is no longer on its shelf.',
              },
              {
                id: 'ledger-copies',
                label:
                  'Let the Ledger pay its half, and own the trade-road copies.',
                effects: {
                  local: { ledger: 2, lamplight: -1 },
                  affinity: { saltroad: -5 },
                  flags: ['d14-ledger-owns-roads'],
                },
                response:
                  'Factor Tallow pays on the spot. By the end of the week the Saltroad is buying copies of its own roads at a Ledger stall, and the oldest cases in the Archive, the ones nobody paid for, are a little emptier every morning.',
              },
            ],
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
          'An old owl comes in through a high window rather than the door, which takes him three attempts, and settles on the back of the petitioners’ bench with the dignity of someone pretending the first two attempts did not happen.',
          'The Archive speaks well of the throne, Majesty, so I came to see it myself. I am old and I fly slowly, but I remember roads nobody else does.',
          'If the court has a bed for an owl, I would like to see some of those roads again before I die.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Hollin Moss drew half the maps the Keeper is trying to save, Your Majesty. The other half he has in his head, which is the only copy.',
          },
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
            response:
              '“Wisely said,” says Hollin, and flies home, slowly, by the window.',
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
        speaker: 'Jinx Coupler of the Rustline',
        npc: 'jinx-coupler',
        faction: 'rustline',
        lines: [
          'A magpie in a coat sewn all over with bottle caps struts in ahead of a rat pushing a crate. “Jinx Coupler, Yardboss of the Rustline. That is Pell. He lifts things.”',
          '“Old-world glass, Majesty, shaped like feathers. It does not break, and it hums when the Bell rings. The Ledger wants to buy it. The Archive wants to study it. I want to know which one the crown is.”',
          {
            who: 'Pell Quickmarrow',
            npc: 'F014',
            text: 'Listen.',
          },
          'The rat flicks one feather with a claw. It rings, thin and sweet, and the whole hall holds its breath. Far to the east, so faint you might have imagined it, something answers.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Ledger’s factor has been waiting in the gallery since dawn, Your Majesty, with a purse. The Archive has been waiting since before dawn, without one.',
          },
        ],
        options: [
          {
            id: 'ask-found',
            label: 'Ask Jinx where in the rail yards the feathers were found.',
            effects: {},
            response:
              'Jinx glances at Pell. Pell studies the ceiling. It is the look of two people agreeing on how much a question is worth.',
            next: 'vault',
          },
          {
            id: 'study',
            label: 'Have the Archive study it before anyone sells it.',
            effects: {},
            response:
              'Jinx grins. “The studying kind. Good. Selling is boring.”',
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
              flags: ['rustline-crate-bought'],
            },
            response:
              'Jinx counts the brass, and Pell Quickmarrow throws in a surveyor’s lens for free. “For the next crate,” he says, and lingers at the gate looking at the barracks.',
          },
          {
            id: 'send-away',
            label: 'Old-world relics bring trouble. Send them away.',
            effects: { affinity: { rustline: -10 }, local: { lamplight: -2 } },
            response:
              'Jinx shrugs, and Pell wheels the crate toward the Ledger’s stalls. In the gallery, a purse is already open.',
          },
        ],
        beats: [
          {
            id: 'vault',
            lines: [
              '“Under the yards there is a car that never left the station. Sealed. Old-world sealed, Majesty, the kind that laughs at crowbars. It took Pell three nights to talk it open.”',
              {
                who: 'Pell Quickmarrow',
                npc: 'F014',
                text: 'Straw inside, packed like eggs. A hundred slots, maybe more. Ours were the last dozen. The rest were gone already, and the straw where they’d lain was fresh-crushed. Not a hundred years. A month.',
              },
              '“So somebody else knows the way in,” says Jinx, “and has been shopping. I don’t like being second. I like being unpaid even less, and the Yard has forty mouths and no harvest. Studying feeds nobody, Majesty.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Somebody has bought eighty-odd feathers of singing glass this month, Your Majesty, and nobody in this market has heard a whisper of it. That is the strangest thing I have heard all year.',
              },
            ],
            options: [
              {
                id: 'study',
                label:
                  'Have the Archive study these, and find out what the other eighty are for.',
                effects: {},
                response:
                  'Jinx sighs. “The studying kind.” They tap the crate with one claw. “Fine. Selling is boring. Starving is also boring, only slower.”',
                postsQuests: ['q-d15-study-glass'],
              },
              {
                id: 'buy',
                label:
                  'Buy the crate for the treasury, before the other buyer does.',
                requires: { cost: 30 },
                effects: {
                  affinity: { rustline: 10 },
                  local: { ledger: 2 },
                  items: ['surveyors-glass'],
                  recruitable: ['F014'],
                  flags: ['rustline-crate-bought'],
                },
                response:
                  'Jinx counts the brass twice, for luck. Pell throws in a surveyor’s lens for free. “For the next crate,” he says, “if there is one,” and lingers at the gate looking at the barracks.',
              },
              {
                id: 'send-away',
                label:
                  'Whoever is buying singing glass by the hundred, the crown wants no part of it. Send it away.',
                effects: {
                  affinity: { rustline: -10 },
                  local: { lamplight: -2 },
                },
                response:
                  'Jinx shrugs, and Pell wheels the crate toward the Ledger’s stalls. He looks back once, at the barracks, and then at you, as if he had expected better.',
              },
              {
                id: 'finders-fee',
                label:
                  'Have the Archive study them, and pay the Rustline a finder’s fee so the yard eats while the scholars think.',
                requires: { cost: 15 },
                effects: {
                  affinity: { rustline: 5 },
                  local: { ledger: -2 },
                },
                response:
                  'Jinx bites the coin, approves, and bows with a rattle of bottle caps. In the gallery, Factor Tallow closes her purse with a snap. The Ledger does not like being outbid by a crown that is not even buying.',
                postsQuests: ['q-d15-study-glass'],
              },
              {
                id: 'watch-car',
                label:
                  'Pay Jinx to reseal the old car and keep a hooded lantern on it, to see who comes back to shop.',
                requires: { cost: 20 },
                effects: {
                  affinity: { rustline: 5 },
                  local: { ledger: 1, lamplight: -1 },
                  flags: ['d15-vault-watched'],
                },
                response:
                  'Jinx takes the brass and, being Jinx, sells the crate to the Ledger on the way out anyway. But that night two Rustline lookouts settle into the rail yards with a hooded lantern and a whistle each, watching an empty car for somebody to come back for the rest.',
              },
            ],
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
          'Foreman Dunmore Ash comes up the carpet with an empty flour sack over one shoulder and drops it on the step of the dais. It makes almost no sound. Lady Ottoline Vask follows a pace behind, rings clicking on her wingtips, and regards the sack as if it were a dead bird someone had carried indoors.',
          'The Yard is on half rations, Majesty, and the Old Houses’ granaries are full. Make them share.',
          {
            who: 'Lady Ottoline Vask',
            npc: 'ottoline-vask',
            text: 'The Old Houses saved their grain in good years, Majesty, while others ate theirs. Is prudence a crime now?',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'There are three haystacks on the Freehold road too heavy for hay, Your Majesty. An Old House crest is a very easy thing to stencil, or a very hard thing to explain.',
          },
        ],
        options: [
          {
            id: 'ask-vask',
            label:
              'Ask Lady Vask what the Old Houses are saving the grain for.',
            effects: {},
            response: 'Lady Vask’s rings stop clicking.',
            next: 'spoken-for',
          },
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
          {
            id: 'council-vote',
            label:
              'Put it to the open council, where the Yard sits beside the Old Houses.',
            requires: { flags: ['open-council'] },
            effects: { local: { yard: 2, 'old-houses': -1, lamplight: 1 } },
            response:
              'The council argues until the lamps are lit, and the Yard eats half rations one more night while it does. In the end it splits the granaries down the middle, and both sides leave certain they were robbed. Dunmore picks his sack back up. It is not empty, quite.',
          },
        ],
        beats: [
          {
            id: 'spoken-for',
            lines: [
              '“Spoken for, Majesty.” Lady Vask smooths a feather that does not need smoothing. “A buyer at the far border pays three times the Ledger’s price, and has paid in advance. In silver, which is rare enough to be worth remarking.”',
              '“If the crown takes that grain, the Old Houses break a contract with people who do not, I am told, accept apologies. I would rather the Yard were hungry for a fortnight than that.”',
              '“A fortnight,” says Dunmore Ash. It is the only thing he says. He says it to the empty sack.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Which buyer, my lady?',
              },
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'One who pays in advance, Komodo, and asks very little about the grain.',
              },
            ],
            options: [
              {
                id: 'requisition',
                label:
                  'Requisition it anyway. Whoever the buyer is, the Yard eats first.',
                effects: { local: { yard: 4, 'old-houses': -4 } },
                response:
                  'Dunmore nods once and shoulders the sack. Lady Vask writes something down, and then, after a moment, writes something else beneath it, and underlines it twice.',
              },
              {
                id: 'buy',
                label:
                  'Buy the surplus at a fair price, so the Houses can repay their buyer.',
                requires: { cost: 25 },
                effects: { local: { yard: 2, 'old-houses': 1 } },
                response:
                  'Everyone is slightly unhappy, which Komodo assures you is the mark of a fair deal. Lady Vask sends the silver back east the next morning, with a letter nobody else is permitted to read.',
              },
              {
                id: 'leave',
                label: 'A contract is a contract. Prudence is not a crime.',
                effects: { local: { yard: -3, 'old-houses': 2 } },
                response:
                  'Dunmore leaves the sack where it lies. The Yard is very quiet at supper, and in the morning somebody has written PRUDENCE on the Old Houses’ granary door, in flour paste.',
              },
              {
                id: 'seize-silver',
                label:
                  'Requisition the grain, and seize the buyer’s silver for the treasury as well.',
                effects: {
                  brass: 20,
                  local: { yard: 2, 'old-houses': -3, ledger: -2 },
                  flags: ['d16-border-silver-seized'],
                },
                response:
                  'The silver is heavier than brass and colder, and the clerk who counts it complains of a chill all evening. Lady Vask says nothing at all. The Ledger sends a note asking what precedent the crown imagines it has set. The Yard eats, and does not ask where the grain was going.',
              },
            ],
          },
        ],
      },
      {
        id: 'd16-bandaged-paw',
        title: 'The Mapmaker Comes Back',
        speaker: 'A young hyena with a bandaged paw',
        faction: 'jackalwire',
        requires: { flags: ['pack-camp-mapped'] },
        lines: [
          'She comes to the postern at dawn, not the great doors, and the Watch nearly turns her away before someone recognizes the bandage. It is the same paw, in the same dirty cloth: the young hyena who sold the crown a map of the Pack’s camp on the back of a ration card.',
          'They know, Majesty. Somebody saw the card pinned over the Watch’s fire and knew my drawing. I can’t draw well. That’s how they knew.',
          'I’m not asking for much. A bed in the Yard. A different name. I’ll scrub pots.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The crown paid ten brass for that map, Your Majesty. It seems the price has gone up.',
          },
        ],
        options: [
          {
            id: 'ask-pack',
            label: 'Ask what the Pack will do if they find her.',
            effects: {},
            response:
              'She looks at her bandaged paw. Then she holds out the other one, which is also bandaged now.',
            next: 'offer',
          },
          {
            id: 'shelter',
            label: 'Give her a bed in the Yard, and a new name.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { yard: 1, 'gate-watch': 1 },
              flags: ['d16-informant-sheltered'],
            },
            response:
              'She sleeps eighteen hours in the Yard’s loft. The Pack learns where she is within the week, and Gristle Vane sends the crown a single painted feather, snapped in half.',
          },
          {
            id: 'pay-east',
            label:
              'Give her brass for the Saltroad and send her east, far from both of you.',
            requires: { cost: 10 },
            effects: {
              local: { 'gate-watch': -1 },
              flags: ['d16-informant-sent-east'],
            },
            response:
              'She takes the brass without counting it and is gone before the gate is fully open. The Watch grumbles that the crown has paid twice for the same map and lost the mapmaker.',
          },
          {
            id: 'turn-away',
            label:
              'The crown bought a map, not a hyena. Send her back to her own.',
            effects: {
              affinity: { jackalwire: 5 },
              local: { 'gate-watch': 1, yard: -2 },
              flags: ['d16-informant-returned'],
            },
            response:
              'She goes without arguing, which is the worst part. A week later the Gate Watch takes the ration card down from above their fire, and nobody says why.',
          },
        ],
        beats: [
          {
            id: 'offer',
            lines: [
              '“Same as they do to anyone who sells the camp. They don’t kill you. That’d be a waste. They walk you to the bridge and leave you on the far side of it, with no water.”',
              '“Or.” She swallows. “Or you send me back, and say I was your prisoner and got away. And I keep drawing. Better, this time. The Pack has a new camp now. I know where.”',
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'The Watch would like that map, Majesty. I won’t pretend otherwise. But it was her paw on the card last time, and it’ll be her neck on the next one.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It is a good offer, Your Majesty, and she knows it is a good offer, and she is perhaps fifteen. A spy who is caught twice is not left at a bridge.',
              },
            ],
            options: [
              {
                id: 'shelter',
                label:
                  'No more maps. Give her a bed in the Yard, and a new name.',
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { yard: 1, 'gate-watch': 1 },
                  flags: ['d16-informant-sheltered'],
                },
                response:
                  'She cries, briefly and furiously, and then asks where the pots are. The Pack learns where she is within the week, and Gristle Vane sends the crown a single painted feather, snapped in half.',
              },
              {
                id: 'pay-east',
                label: 'Give her brass for the Saltroad and send her east.',
                requires: { cost: 10 },
                effects: {
                  local: { 'gate-watch': -1 },
                  flags: ['d16-informant-sent-east'],
                },
                response:
                  'She looks almost disappointed, and then very young, and then she is gone east with the morning caravan. Dunmark watches her go and says nothing about the map he did not get.',
              },
              {
                id: 'turn-away',
                label:
                  'The crown will not be drawn into the Pack’s quarrels. Send her back to her own.',
                effects: {
                  affinity: { jackalwire: 5 },
                  local: { 'gate-watch': 1, yard: -2 },
                  flags: ['d16-informant-returned'],
                },
                response:
                  'She goes without arguing. That night the Yard hears that the crown sold its informant back to the people she informed on, and the kitchens serve supper in a silence you could cut.',
              },
              {
                id: 'spy',
                label:
                  'Accept. Send her back as the crown’s eyes in the Pack, and pay her well.',
                requires: { cost: 10 },
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d16-informant-spy'],
                },
                response:
                  'She goes back down the canyon road at dusk with brass sewn into her bandage. The new camp map arrives four days later, drawn much better. The one after that is late. The Watch pins them both above the fire and waits for the third.',
              },
            ],
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
          'Below the walls the singing has not stopped since midnight: a low, patient tune in many voices that comes up through the flagstones as much as through the windows. Granny Umber climbs the carpet on a cane of old pipe, mud to the knees of her quilted vest. Young Komodo is already holding the manifesto. Its wax seal is broken.',
          'We did not come to burn your tower, young ruler. We came to tell you the burrows are drowning because your tax decree diverted the Ford.',
          'Your runner told you the Ford tunnels were empty. Forty families live in those tunnels, and the water is at their beds.',
          'Give the burrows their water rights, or we will take them. We would rather you gave them.',
          {
            who: 'Captain Ferro Dunmark',
            npc: 'ferro-dunmark',
            text: '“Or we will take them,” Majesty. She said it in your hall, and her people sang it under your walls all night. If a Freeholder said that, I’d have him in irons by noon.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'It is long and it is angry, Your Majesty, and I am still nearly sure a Jackalwire hand helped write it. I would not keep her long.',
          },
        ],
        options: [
          {
            id: 'ask-seal',
            label: 'Ask Granny Umber who broke the seal.',
            effects: {},
            response:
              'Granny Umber squints at Komodo through her thick spectacles for a long moment before she answers you.',
            next: 'seal',
          },
          {
            id: 'ask-tunnels',
            label: 'Ask her about the forty families, and the runner’s report.',
            effects: {},
            response:
              'Granny Umber leans on her cane and lets out a breath that smells of wet earth. “Sit down, young ruler,” she says. “It is not a short answer.”',
            next: 'tunnels',
          },
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
          {
            id: 'honest-count',
            label:
              'Remind her the crown once counted the Mole ledger honestly, and offer the same now: a survey of the flooded burrows.',
            requires: { flags: ['mole-ledger-counted'] },
            effects: {
              affinity: { moles: 5 },
              local: { lamplight: 1, 'old-houses': -1 },
              flags: ['d17-burrows-surveyed'],
            },
            response:
              '“You counted honest once,” Granny Umber allows. “Most thrones only count what they are owed.” She taps her cane twice on the floor, and below the walls, the singing changes key.',
          },
        ],
        beats: [
          {
            id: 'seal',
            lines: [
              '“We sealed it with tallow and a thumbprint, mine,” says Granny Umber. “Your Watch took it off the gate whole. Somebody in your tower reads your mail before you do, young ruler.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'I did, Your Majesty. It is my work. I broke it to see whether it was poisoned. It was not, I am glad to say, only very long.',
              },
              '“And the second page?” says Granny Umber. “We nailed two pages to your gate. The second was the forty families, every name and every age, so the crown would know exactly who it was drowning.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'There was one page when I read it, Your Majesty.',
              },
              'He holds it out to you. There is one page. There are two nail holes at the top of it, and two more a hand lower, where a second sheet might have been pinned behind it.',
            ],
            options: [
              {
                id: 'meet',
                label:
                  'Open talks on the water rights, and ask her to bring the names herself.',
                effects: {
                  affinity: { moles: 15 },
                  local: { 'old-houses': -2 },
                  flags: ['mole-talks-opened'],
                },
                response:
                  '“Talks,” says Granny Umber. “We will see if they are worth the walk.” She does not look at Komodo again, very deliberately, all the way to the doors.',
              },
              {
                id: 'arrest',
                label:
                  'Arrest her for sedition. Whoever lost a page, a threat nailed to the gate is still a threat.',
                effects: {
                  affinity: { moles: -20 },
                  local: { 'gate-watch': 2 },
                  flags: ['mole-messenger-arrested'],
                },
                response:
                  'The Watch takes Granny Umber away. She goes slowly, and she is smiling, and as she passes Komodo she says something too quiet for you to hear. He does not answer it.',
              },
              {
                id: 'ignore',
                label:
                  'Take Komodo’s word. There was one page, and it was a forgery.',
                effects: { affinity: { moles: -5 } },
                response:
                  'Granny Umber is shown out. Komodo looks relieved, and then looks as if he wishes he had not. Below the walls, the singing stops all at once.',
              },
              {
                id: 'write-names',
                label:
                  'Ask her to write the forty names again, here, into the crown’s own ledger, before anything else is decided.',
                effects: {
                  affinity: { moles: 5 },
                  local: { lamplight: 2, 'gate-watch': -1 },
                  flags: ['d17-names-recorded'],
                },
                response:
                  'Granny Umber writes slowly, from memory, every name with the age beside it. It takes the rest of the morning, and the Watch fidgets at a revolutionary bent over the crown’s ledger. Komodo stands at your shoulder the whole time and reads each name as it is written. When she is done he offers, very kindly, to file the page himself.',
              },
            ],
          },
          {
            id: 'tunnels',
            lines: [
              '“Your runner went to the Ford, young ruler. He knocked on no doors. He looked down the old shaft at the river end, which has been flooded for twenty years, and went home to say the tunnels were empty.”',
              '“Your decree paid for a mill-race to turn the Old Houses’ wheels. The race turned the Ford, and the Ford turned into our ceilings. We sleep in shifts on the high shelves now, the children on top.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Then my runner was careless, Your Majesty, and I was careless to trust him. I will see to it.',
              },
              'He says it smoothly, and taps one claw on his ledger, twice, the way he does when he is working something out.',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'The race was paid for lawfully, Majesty. Close it, and the wheels stop, and the Old Houses will ask who pays for the Yard’s flour.',
              },
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
                  '“Talks,” says Granny Umber. “We will see if they are worth the walk. Mind they are quicker than the water.”',
              },
              {
                id: 'arrest',
                label:
                  'Arrest her for sedition. Drowned or not, she threatened the crown at its own gate.',
                effects: {
                  affinity: { moles: -20 },
                  local: { 'gate-watch': 2 },
                  flags: ['mole-messenger-arrested'],
                },
                response:
                  'The Watch takes Granny Umber away. She goes slowly, and she is smiling. “The water won’t wait in a cell,” she says to no one in particular.',
              },
              {
                id: 'ignore',
                label: 'Leave Komodo to see to his runner, and send her home.',
                effects: { affinity: { moles: -5 } },
                response:
                  'Granny Umber is shown out. Komodo looks relieved, and then looks as if he wishes he had not.',
              },
              {
                id: 'close-race',
                label:
                  'Close the mill-race tonight, before any talks, and let the Old Houses’ wheels stand idle.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -3, yard: -1 },
                  flags: ['d17-race-closed'],
                },
                response:
                  'The sluice comes down at moonrise. By morning the water in the burrows has dropped a hand’s width and the Old Houses’ mills are silent. The Yard, which buys its flour from those mills, will notice by the end of the week.',
              },
            ],
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
        speaker: 'Hester Plowright, reeve of the Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        lines: [
          'A broad speckled hen in a mud-hemmed skirt plants herself before the throne like a fence post.',
          '“Our wells are low, Majesty, and every refugee on the road wants a cup. The Freeholds will water Freeholders. That is all we can do.”',
          '“There’s a sign on every well-head now: Freehold token or nothing. I painted them myself. I didn’t enjoy it.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'Half the Yard walked here once without a token, Majesty.',
          },
          {
            who: 'Lady Ottoline Vask',
            npc: 'ottoline-vask',
            text: 'And the Old Houses do not open their cisterns to the road either, Foreman. A well is property, or nothing is.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'They are not arguing about the Freeholds, Your Majesty. They are arguing about each other, using the Freeholds. Whichever way you rule, one of them will be sure it was about them.',
          },
        ],
        options: [
          {
            id: 'ask-road',
            label: 'Ask who, exactly, is on the road.',
            effects: {},
            response:
              'Hester’s feathers settle, and then lift again. “All right,” she says. “Since you asked.”',
            next: 'road',
          },
          {
            id: 'ask-thistledown',
            label:
              'Ask whether the families burned out of Thistledown still count as Freeholders.',
            requires: { flags: ['thistledown-burned'] },
            effects: {},
            response:
              'Hester goes very still, the way a hen does when a hawk crosses the sun.',
            next: 'tokens',
          },
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
              'The reeve bows deeply. Dunmore Ash turns and walks out without being dismissed. The refugees on the road will hear about this.',
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
        beats: [
          {
            id: 'road',
            lines: [
              '“Mirefen folk, walking away from whatever the Mothers are doing. Pack deserters who left the canyon when the engine dried. A family of goats from the far border who won’t say what they’re running from. Forty, fifty a day.”',
              '“And since you asked, here’s the rest. My people sell the water we won’t give. A cup for a brass bit, at the back gates after dark. Somebody has to pay for the wells, Majesty, and it isn’t going to be the crown.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'So the wells are not closed, Your Majesty. They are priced. It is a very Freehold distinction.',
              },
            ],
            options: [
              {
                id: 'open-wells',
                label:
                  'Pay the Freeholds to open their wells to everyone, front gate and back.',
                requires: { cost: 15 },
                effects: {
                  affinity: { freeholds: -5, 'hollow-bell': 5 },
                  local: { yard: 2 },
                  flags: ['wells-shared'],
                },
                response:
                  'Hester takes the brass and the wells open, grudgingly. The back gates close the same night, since there is no profit in selling what is free, and a few Freeholders curse the crown over their empty cash-boxes.',
              },
              {
                id: 'freehold-rights',
                label:
                  'The Freeholds’ wells are theirs, and so is what they charge.',
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -2 },
                  flags: ['wells-closed'],
                },
                response:
                  'Hester bows deeply. Dunmore Ash turns and walks out without being dismissed, and the back gates do a very good trade that night.',
              },
              {
                id: 'escort',
                label:
                  'Walk the strangers to Hollow Bell instead, and let the Bell decide.',
                effects: {},
                response:
                  'Hester looks relieved that it is somebody else’s problem, and then ashamed of looking relieved.',
                postsQuests: ['q-d18-refugee-road'],
              },
              {
                id: 'ban-sales',
                label:
                  'Forbid the back-gate trade. If the wells are closed, they are closed to brass too.',
                effects: {
                  affinity: { freeholds: -10 },
                  local: { lamplight: 2, yard: -1 },
                  flags: ['d18-water-trade-banned'],
                },
                response:
                  'Hester’s feathers go up all at once. “Principled,” she says, as if it were a disease. The back gates close. That night the strangers who had a little brass have nothing to spend it on, and the ones who had none are no better off at all.',
              },
              {
                id: 'tax-sales',
                label:
                  'Let them sell, and send the crown its tenth of every cup.',
                effects: {
                  brass: 10,
                  affinity: { freeholds: 5 },
                  local: { yard: -2, ledger: 1 },
                  flags: ['d18-water-taxed'],
                },
                response:
                  'Hester looks at you for a long moment, then laughs, short and not kind. “A cup taxed twice,” she says. “Once by thirst.” By nightfall a crown clerk has set up a little table at the back gate.',
              },
            ],
          },
          {
            id: 'tokens',
            lines: [
              '“Their tokens burned with their houses, Majesty. Brass tokens melt, did you know that? I didn’t. Little puddles in the ash.”',
              '“The rule is token or nothing. If I make an exception for Thistledown, every stranger on the road is from Thistledown by tomorrow morning, and my own wells are dry by the end of the month. So I don’t. They sleep on the road with the rest. Some of them are my cousins.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She is not wrong about the morning, Your Majesty. People are very quick to learn where they are from.',
              },
            ],
            options: [
              {
                id: 'open-wells',
                label: 'Pay the Freeholds to open their wells to everyone.',
                requires: { cost: 15 },
                effects: {
                  affinity: { freeholds: -5, 'hollow-bell': 5 },
                  local: { yard: 2 },
                  flags: ['wells-shared'],
                },
                response:
                  'Hester takes the brass. “Then nobody needs a token,” she says, “and nobody needs to be from anywhere.” She does not seem sure whether that is a relief.',
              },
              {
                id: 'freehold-rights',
                label:
                  'A rule with exceptions is not a rule. The wells stay closed.',
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -2 },
                  flags: ['wells-closed'],
                },
                response:
                  'Hester bows deeply, and when she straightens her eyes are wet. “Thank you, Majesty,” she says. “I couldn’t have said it to them myself.”',
              },
              {
                id: 'escort',
                label: 'Walk Thistledown and the rest to Hollow Bell.',
                effects: {},
                response:
                  '“Mara will write every one of them down,” says Hester. “At least somebody will.”',
                postsQuests: ['q-d18-refugee-road'],
              },
              {
                id: 'crown-tokens',
                label:
                  'Issue Thistledown’s families new tokens under the crown’s seal, and let the crown answer for any forgeries.',
                effects: {
                  affinity: { freeholds: -5 },
                  local: { lamplight: 1, yard: 2 },
                  flags: ['d18-crown-tokens'],
                },
                response:
                  'Hester takes the sealed tokens between two fingers as if they were still warm. “The crown deciding who is a Freeholder,” she says. “My grandmother would have spat.” But she hands them out herself, by name, and does not count how many.',
              },
            ],
          },
        ],
      },
      {
        id: 'd18-fair',
        title: 'The Saltroad Fair',
        speaker: 'Vesper Fanfare, fire-juggler',
        faction: 'saltroad',
        lines: [
          'You can hear the fair before you see it: a fiddle, a drum, three goats objecting to something. Vesper Fanfare cartwheels the last few yards of the carpet, lands in a bow, and is still holding a lit torch in each hand, which the Watch notices.',
          'Majesty! A whole fair at your gate: music, cider, three dancing goats and me. The Yard could use a night off. So could you, by the look of you.',
          'All we ask is the field outside the wall, and maybe a little brass for the lamps.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Half the Yard is already on the wall watching the jugglers, Your Majesty. A fair is a cheap way to buy a good mood, and an expensive way to spend water in a drought.',
          },
        ],
        options: [
          {
            id: 'ask-cider',
            label: 'Ask where a fair finds water for cider in a drought.',
            effects: {},
            response:
              'Vesper juggles the two torches once, thoughtfully, before she answers.',
            next: 'cider',
          },
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
            response:
              'The fair packs up and rolls on toward Hollow Bell. The Yard watches it go from the wall.',
          },
        ],
        beats: [
          {
            id: 'cider',
            lines: [
              '“Same place as anyone, Majesty. The Freehold back gates, after dark, a brass bit a cup.” She catches both torches. “Don’t look at me like that. I only juggle. The cider-master pays.”',
              '“Forty barrels of it. People on the road can smell it from a mile off. Some of them come to watch the show, and some of them come to look at the barrels.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'The Yard hasn’t had a night off since the coronation, Majesty.',
              },
              'He does not say whether he thinks it should have one.',
            ],
            options: [
              {
                id: 'host',
                label: 'Host the fair, cider and all, and pay for the lamps.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: 10 },
                  local: { yard: 3 },
                  recruitable: ['F018'],
                },
                response:
                  'The fair is the best night the fortress has had, and the road outside smells of apples until dawn. At the end of it, Vesper asks if the court ever needs someone who can talk to a crowd.',
              },
              {
                id: 'tax-fair',
                label:
                  'Let them stay, for a cut of the takings, cider included.',
                effects: { brass: 25, affinity: { saltroad: -5 } },
                response:
                  'The fair is smaller and quieter, and the cider dearer. Vesper juggles anyway, and pointedly drops a torch in front of the crown’s tax clerk.',
              },
              {
                id: 'decline',
                label: 'Not this week, and not with the road this thirsty.',
                effects: { affinity: { saltroad: -3 }, local: { yard: -1 } },
                response:
                  'The fair packs up and rolls on toward Hollow Bell, forty barrels sloshing. The Yard watches it go from the wall.',
              },
              {
                id: 'barrels-to-road',
                label:
                  'Host the fair, on condition that half its water barrels go out to the strangers on the road.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: -5 },
                  local: { yard: 2, lamplight: 1 },
                  flags: ['d18-fair-water-shared'],
                },
                response:
                  'The cider-master protests loudly, and then less loudly. The fair is drier than it meant to be and louder to make up for it. At midnight Vesper takes her torches out to the road and juggles for the people drinking the fair’s water, which nobody paid her to do.',
              },
            ],
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
          'Mara Reedbell has ridden through the night and looks it. Her mayoral sash is mended in three places, her ledger is chained to her belt, and for once she does not open it. The hand-bell on its cord at her hip gives a small, nervous ring with every step, until she puts a hoof over it.',
          'Hollow Bell votes tomorrow, Your Majesty, on whether to accept the crown’s protection. I will not tell you which way I lean.',
          'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
          '“The sisters from the Abbey have knocked on every door in the Bell this week. They bring soup. They are very good at soup.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She has just told you the three reasons she will accept, Your Majesty. Mara does not usually show her ledger. I would take that as a compliment, and as a warning.',
          },
        ],
        options: [
          {
            id: 'ask-abbey',
            label: 'Ask what the Abbey’s sisters are promising at the doors.',
            effects: {},
            response:
              'Mara glances toward the doors of the hall, as if a sister in grey might be standing in them.',
            next: 'sisters',
          },
          {
            id: 'ask-millers',
            label: 'Ask how the mill families mean to vote.',
            requires: { flags: ['mara-millers-levy'] },
            effects: {},
            response: 'Mara laughs, once, with no pleasure in it at all.',
            next: 'millers',
          },
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
            response:
              '“Rain,” says Mara. “Now that is a promise you can see.” Somewhere in the Freeholds, a reeve does the arithmetic and does not like it.',
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
        beats: [
          {
            id: 'sisters',
            lines: [
              '“Care,” says Mara. “That is their word. If Hollow Bell stays free of the crown, the Abbey will take every orphan in the Bell into its care. Every one. Lessons, beds, warm meals.” She pauses. “They know exactly how many orphans we have. I never told them.”',
              '“And here is what I will not say in the square, Your Majesty, so I will say it to you. I want the crown’s protection. I cannot be seen to want it, or the Bell will vote against me to prove it is still free.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Abbey has done a great deal of good, Your Majesty. I would be careful about standing in a square and saying otherwise with nothing in your hands.',
              },
            ],
            options: [
              {
                id: 'garrison',
                label:
                  'Pledge a Gate Watch garrison. Soldiers at the gate are a promise the sisters cannot match.',
                requires: { local: { 'gate-watch': 10 } },
                effects: {
                  affinity: { 'hollow-bell': 20 },
                  local: { 'gate-watch': -2 },
                  strength: { 'hollow-bell': 1 },
                  flags: ['bell-under-protection', 'bell-voted-yes'],
                },
                response:
                  'Mara smiles, and writes a single word in her ledger. The Bell votes yes the next day. The sisters are seen leaving by the north road, still carrying their soup.',
              },
              {
                id: 'water',
                label:
                  'Pledge the crown’s share of the covenant rain to the Bell.',
                requires: { flags: ['rain-covenant'] },
                effects: {
                  affinity: { 'hollow-bell': 15, freeholds: -5 },
                  flags: ['bell-voted-yes'],
                },
                response:
                  '“Rain,” says Mara. “Soup is very good, but rain is better.” The Bell votes yes. Some of the Freeholds, who were counting on that rain, vote with their feet.',
              },
              {
                id: 'speech',
                label:
                  'Send someone to make the crown’s case in the square, and leave the Abbey out of it.',
                effects: {},
                response:
                  '“Make it a good one,” says Mara. “The soup is very good.”',
                postsQuests: ['q-d19-bell-speech'],
              },
              {
                id: 'question-abbey',
                label:
                  'Send someone to make the crown’s case, and to ask the sisters, before the whole square, how they know the number.',
                effects: {
                  affinity: { abbey: -10, 'hollow-bell': 5 },
                  local: { lamplight: 1 },
                  flags: ['d19-abbey-questioned'],
                },
                response:
                  'Mara writes a single line in her ledger and closes it. “That will not make you friends,” she says. Komodo, at your shoulder, says nothing for the rest of the audience, which for him is a great deal of nothing.',
                postsQuests: ['q-d19-bell-speech'],
              },
              {
                id: 'ask-coldbrooks',
                label:
                  'Have the crown’s speaker ask the sisters, before the whole square, when Wenna Coldbrook may visit her children.',
                requires: { flags: ['abbey-took-coldbrook-children'] },
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  local: { yard: 1 },
                  flags: ['d19-coldbrooks-asked'],
                },
                response:
                  'It is asked at noon, in the square, loudly. A sister in grey answers at once and warmly: very soon, once the little ones are settled. The square hears the word settled, and some people who had been nodding stop.',
                postsQuests: ['q-d19-bell-speech'],
              },
            ],
          },
          {
            id: 'millers',
            lines: [
              '“As one family, Your Majesty. Against. Your levy made sure of that.” She does not sound sorry. “The mill families have never been so united in their lives. They hold eleven hands, and the Bell is decided by fewer.”',
              '“They have sent word, very politely, through me, that they would vote yes for a crown that repealed its unjust levy. They know I signed nothing. They know I asked you to.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'There it is again, Your Majesty: the blame, coming round to be paid for. Repeal the levy and you buy eleven hands with the poor wards’ water. Keep it, and you may lose the Bell for keeping your word.',
              },
            ],
            options: [
              {
                id: 'garrison',
                label:
                  'Pledge a garrison, and let the millers count soldiers instead.',
                requires: { local: { 'gate-watch': 10 } },
                effects: {
                  affinity: { 'hollow-bell': 20 },
                  local: { 'gate-watch': -2 },
                  strength: { 'hollow-bell': 1 },
                  flags: ['bell-under-protection', 'bell-voted-yes'],
                },
                response:
                  'Mara writes a single word in her ledger. The Bell votes yes by more than eleven hands, and the mill families, outvoted, go home and grind nothing for a day out of spite.',
              },
              {
                id: 'water',
                label:
                  'Pledge the crown’s share of the covenant rain instead. Let the millers argue with rain.',
                requires: { flags: ['rain-covenant'] },
                effects: {
                  affinity: { 'hollow-bell': 15, freeholds: -5 },
                  flags: ['bell-voted-yes'],
                },
                response:
                  '“Rain,” says Mara. “Even a miller cannot vote against rain.” The Bell votes yes without the mill families, and the levy stands. In the Freeholds, a reeve does the arithmetic and does not like it.',
              },
              {
                id: 'speech',
                label:
                  'The levy stands. Make the crown’s case in the square and win without them.',
                effects: {},
                response:
                  '“Then make it a very good speech,” says Mara, and for the first time this morning she smiles. “The wards will be listening. They are the ones you kept your word to.”',
                postsQuests: ['q-d19-bell-speech'],
              },
              {
                id: 'repeal-levy',
                label:
                  'Repeal the millers’ levy, in exchange for their eleven hands.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  local: { 'old-houses': 2, yard: -2 },
                  flags: ['d19-millers-levy-repealed', 'bell-voted-yes'],
                },
                response:
                  'The mill families vote yes the next day, as one, and the bell rings. Mara does not ring it. She sends the repeal back with her own signature beside yours, and a note in the margin: “Now we both did it.”',
              },
            ],
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
          'Captain Ferro Dunmark brings a list instead of a speech: names down one side, gaps down the other, and the gaps are longer. He reads it at attention. Lady Ottoline Vask waits through the whole thing with her head inclined, as if listening to music she has heard before.',
          'The Watch is thin, Majesty, and the borders are not. Riders at the far edge of the map. Raiders in the canyon. We need a levy, brass and bodies, before the season turns.',
          {
            who: 'Lady Ottoline Vask',
            npc: 'ottoline-vask',
            text: 'A levy should of course fall on those with the least to lose, Majesty. That is simply arithmetic.',
          },
          'From the back of the hall, Foreman Dunmore Ash repeats it slowly: “The least to lose.” Nobody laughs.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Rain on the Ford in two days, Your Majesty, riders on the border, and a Watch that cannot cover both. Somebody will pay for this levy. The only question in the room is who gets to call it fair.',
          },
        ],
        options: [
          {
            id: 'ask-riders',
            label: 'Ask Dunmark what the riders in plum actually did.',
            effects: {},
            response:
              'Dunmark folds the list away. “Nothing,” he says. “That is what I did not like.”',
            next: 'plum',
          },
          {
            id: 'ask-oath',
            label:
              'Ask Dunmark whether a levy of untrained Yard hands is spending the Watch cheaply.',
            requires: { flags: ['oath-of-care'] },
            effects: {},
            response:
              'Dunmark looks at you for a long moment. “You remember,” he says. “Good.”',
            next: 'oath',
          },
          {
            id: 'levy-yard',
            label: 'Levy the Yard: brass and able bodies.',
            effects: {
              brass: 40,
              local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
              flags: ['levy-yard'],
            },
            response:
              'Dunmark nods. Lady Vask smiles. The Yard does not, and Dunmore Ash leaves before the order is read.',
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
          {
            id: 'levy-ledger',
            label:
              'Levy the Ledger. The market charter has made its counting-tables rich.',
            requires: { flags: ['market-charter'] },
            effects: {
              brass: 25,
              local: { ledger: -3, 'gate-watch': 2, yard: 1 },
              flags: ['d20-levy-ledger'],
            },
            response:
              'Factor Tallow is sent for, and arrives with the charter already open at the clause she expects you to read. You read a different one. She pays, and smiles, and by evening the interest on every Yard loan in the market has risen by exactly the amount of the levy.',
          },
        ],
        beats: [
          {
            id: 'plum',
            lines: [
              '“They came to the far gate at dusk. Six riders, coats the colour of a bruise, white gloves. They did not draw. They asked my sergeant, very civil, whether a black leopard with good manners had passed this way.”',
              '“When he said no, one of them took off a glove and gave it to him. A gift, she said, for his trouble.” Dunmark sets a white glove on the step of the dais. It is spotless. “My sergeant has been sick since.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'The Black Verge Court, Majesty. The Old Houses have traded with them for years. They are perfectly civilized, and they pay in silver.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'I did not know them this morning, Your Majesty. I find I know them a little now, and I do not like how much better my lady Vask does.',
              },
            ],
            options: [
              {
                id: 'levy-yard',
                label:
                  'Levy the Yard. The border needs bodies, and the Yard has them.',
                effects: {
                  brass: 40,
                  local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
                  flags: ['levy-yard'],
                },
                response:
                  'Dunmark nods. Lady Vask smiles. The Yard does not. That night the white glove is burned in the Watch’s fire, and nobody admits to doing it.',
              },
              {
                id: 'levy-houses',
                label:
                  'Levy the Old Houses. If they trade with the Verge, they can pay to guard against it.',
                effects: {
                  brass: 30,
                  local: { 'old-houses': -5, yard: 2, 'gate-watch': 2 },
                  flags: ['levy-houses'],
                },
                response:
                  'Lady Vask’s smile vanishes entirely. Dunmark looks, for a moment, amused, and then looks at the glove again and is not.',
              },
              {
                id: 'no-levy',
                label: 'No levy. The Watch will make do, glove or no glove.',
                effects: { local: { 'gate-watch': -3, yard: 1 } },
                response:
                  'Dunmark salutes, stiffly, and takes the glove away with him in a pair of tongs. “We will make do,” he says, “until we cannot.”',
              },
              {
                id: 'answer-verge',
                label:
                  'No levy yet. Send the glove back to the border with a letter: the crown shelters whom it pleases.',
                effects: {
                  affinity: { 'black-verge': -10 },
                  local: { 'gate-watch': 1, 'old-houses': -2 },
                  flags: ['d20-verge-answered'],
                },
                response:
                  'The letter goes out at dawn with the glove folded inside it. No answer comes. Lady Vask leaves court early, and the Old Houses’ couriers ride east all night.',
              },
            ],
          },
          {
            id: 'oath',
            lines: [
              '“You swore you would never spend us cheaply, Majesty. I hold you to it, as I said I would.”',
              '“A levy of Yard hands gives me bodies, not soldiers. They will stand at the far gate in borrowed coats, and the first rider in plum who takes off a glove will spend them for you. That is cheap. I know what cheap looks like. I have buried it.”',
              '“Give me brass to train volunteers, or give me nothing and I will make do. But do not give me conscripts and call it keeping your word.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'Volunteers cost money, Captain. Conscripts are free. I had thought soldiers understood arithmetic.',
              },
            ],
            options: [
              {
                id: 'levy-yard',
                label: 'Levy the Yard anyway. An oath does not man a wall.',
                effects: {
                  brass: 40,
                  local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
                  flags: ['levy-yard'],
                },
                response:
                  'Dunmark is silent a long moment. Then he takes the list back, salutes exactly as regulation requires, and leaves. The Watch hears about the oath by supper, and so does the Yard.',
              },
              {
                id: 'levy-houses',
                label:
                  'Levy the Old Houses’ brass, not the Yard’s bodies, and let the Captain hire who he trusts.',
                effects: {
                  brass: 30,
                  local: { 'old-houses': -5, yard: 2, 'gate-watch': 2 },
                  flags: ['levy-houses'],
                },
                response:
                  'Lady Vask’s rings click once on the arm of her chair. Dunmark looks, for a moment, very nearly happy.',
              },
              {
                id: 'no-levy',
                label: 'No levy. The Watch will make do, and the oath stands.',
                effects: { local: { 'gate-watch': -3, yard: 1 } },
                response:
                  'Dunmark salutes. “We will make do,” he says, “until we cannot. And when we cannot, Majesty, I will come and tell you so to your face.”',
              },
              {
                id: 'volunteers',
                label:
                  'Pay a bounty for volunteers out of the treasury, and train them properly.',
                requires: { cost: 30 },
                effects: {
                  local: { 'gate-watch': 3, yard: 1 },
                  flags: ['d20-volunteer-bounty'],
                },
                response:
                  'Dunmark salutes, and this time it is not stiff. Forty come forward from the Yard by nightfall, and twelve of the Old Houses’ younger sons, which Lady Vask did not expect and does not enjoy.',
              },
            ],
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
          'The rain arrived three days ago, as promised. It is still falling, soft and steady over every farm from the Ford to the Bell, and the whole fortress smells of wet dust and green. Elder Corvane walks up the carpet completely dry. His chimes are silent.',
          'The rain came, young ruler, as promised. The Conclave now names its service: three runners from your court, to carry forecasts in the caves for a season.',
          '“Young ones, if you please. The caves are narrow, and old legs are slow on the ladders.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He is not asking, Your Majesty. Those are terms. They were terms when you signed them.',
          },
        ],
        options: [
          {
            id: 'ask-season',
            label: 'Ask how long a Conclave season lasts.',
            effects: {},
            response:
              'Corvane tilts his head, the way birds do when a question is more interesting than the one asking it.',
            next: 'season',
          },
          {
            id: 'clause-eleven',
            label:
              'Ask about clause eleven, the one Tamsin read aloud: whether the runners ever come home.',
            requires: { flags: ['bonded-runner-clause'] },
            effects: {},
            response:
              'Corvane turns his clouded eyes toward the gallery, as if looking for a small gecko he remembers. “Ah,” he says. “She told you.”',
            next: 'season',
          },
          {
            id: 'hold-margin',
            label:
              'Hold Corvane to the margin note in your own hand: no person of this court is payment.',
            requires: { flags: ['d11-no-runners-clause'] },
            effects: {},
            response:
              '“So it says,” Corvane agrees. “Your hand. My initials. The Conclave is flexible about the coin.”',
            next: 'land',
          },
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
              'Corvane stands very still. Outside, the soft rain stops all at once, and the sky turns the colour of a bruise.',
          },
        ],
        beats: [
          {
            id: 'season',
            lines: [
              '“A season is as long as the weather it pays for,” says Corvane. “This was a generous rain.”',
              '“The last runner who left us served nine years for a single summer, and was very well fed. We are not cruel, young ruler. We are exact.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'The Yard has three already asking to go, Majesty. Orphans. They think it’s an adventure.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Nine years for three months of rain, Your Majesty. I have seen worse loans at the Ledger, but not many, and none of them were children.',
              },
            ],
            options: [
              {
                id: 'pay-brass',
                label:
                  'Pay in brass, and keep every child on this side of the Heights.',
                requires: { cost: 50 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-bought-out'],
                },
                response:
                  'Corvane takes the brass with distaste and counts it twice. “The covenant said runners,” he says. “We will remember the substitution.” The three orphans in the Yard are bitterly disappointed.',
              },
              {
                id: 'send-runners',
                label: 'Send the three Yard volunteers. They asked to go.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -4 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners'],
                },
                response:
                  'Three young volunteers climb the Heights in borrowed boots, waving. The Yard waves back. It does not forgive the crown quickly, and it will forgive it less every year they are not home.',
              },
              {
                id: 'break',
                label: 'Break the covenant. Nine years is not a season.',
                effects: {
                  affinity: { 'storm-crows': -30 },
                  strength: { 'storm-crows': -1 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-broken'],
                },
                response:
                  'Corvane stands very still. Outside, the soft rain stops all at once, and the sky turns the colour of a bruise.',
              },
              {
                id: 'fixed-term',
                label:
                  'Send the volunteers, but only with a term in writing: one season, counted by the tower’s calendar, not the Conclave’s.',
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { yard: -2 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners', 'd20-runners-term-fixed'],
                },
                response:
                  'Corvane writes the term himself, in a hand so old it is hard to read, and signs it. “Three months,” he says. “By your calendar.” He does not say what the tower’s calendar will be worth to the Conclave when the three months are up.',
              },
              {
                id: 'court-runners',
                label:
                  'Send three from the court’s own households instead: clerks’ children, and the Old Houses’ younger sons.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { 'old-houses': -3, yard: 2 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners', 'd20-court-runners'],
                },
                response:
                  'Lady Vask’s nephew is the second name read out. She does not move at all. Corvane looks the three over like fruit at a market and seems, if anything, pleased. “Well fed,” he says. For once, the Yard says nothing against the crown.',
              },
            ],
          },
          {
            id: 'land',
            lines: [
              '“No persons.” Corvane spreads his wings a little, which in a crow his age is almost a shrug. “So the Conclave takes land instead. The high pastures above the Ford, for our storm-glass. The rain came from there. It may as well be paid there.”',
              '“The Freeholds graze their herds on those pastures. They will have to graze them somewhere else. That was never in your margin.”',
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'Those pastures are three hundred head of goat and every Freehold child’s milk, Majesty. You wrote that margin note. You never asked us what it was worth.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'You read it with your eyes open, Your Majesty. So did he. He simply read further.',
              },
            ],
            options: [
              {
                id: 'pay-brass',
                label:
                  'Buy the pastures back with brass, and keep both the margin and the land.',
                requires: { cost: 50 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-bought-out'],
                },
                response:
                  'Corvane takes the brass with distaste. “The covenant said a service,” he says. “We will remember the substitution.” Hester Plowright, who had been holding her breath, lets it out.',
              },
              {
                id: 'send-runners',
                label:
                  'Waive your own margin note, and send three volunteers from the Yard after all.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -4 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners'],
                },
                response:
                  'Corvane says nothing at all, which is his way of saying a great deal. Three young volunteers climb the Heights. The Yard does not forgive it quickly, and Hester Plowright, whose goats keep their pasture, cannot quite meet the Yard’s eyes for a month.',
              },
              {
                id: 'break',
                label:
                  'Break the covenant. The Conclave read further than it was entitled to.',
                effects: {
                  affinity: { 'storm-crows': -30 },
                  strength: { 'storm-crows': -1 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-broken'],
                },
                response:
                  'Corvane stands very still. Outside, the soft rain stops all at once, and the sky over the high pastures turns the colour of a bruise.',
              },
              {
                id: 'cede-pastures',
                label:
                  'Cede the high pastures. The tower promised no persons, and it keeps its promises.',
                effects: {
                  affinity: { 'storm-crows': 10, freeholds: -10 },
                  clearFlags: ['rain-covenant'],
                  flags: ['d20-pastures-ceded'],
                },
                response:
                  'Corvane bows, for the first time. By morning the Freehold herds are coming down off the high pastures in long, bleating lines, and tall glass vanes are going up where they grazed, ringing in the wind.',
              },
            ],
          },
        ],
      },
    ],
  },
]

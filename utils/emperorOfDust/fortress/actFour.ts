import type { DayDef, QuestDef } from './types'

// Act IV, Days 31-40, "The Long Table" (conductor DAY-PLAN.md): open faction
// war, the coalition that will decide the Act V hideout, and Young Komodo's
// clues tightening until his Day 40 betrayal (which the engine fires at the
// dawn of Day 41). Every [K] beat must read innocently now and damningly
// later. What lies under the Abbey stays off-screen (WORLD-GUIDE.md).

export const ACT_FOUR_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d31-iron-rain',
    title: 'Iron Rain at the Ford',
    summary:
      'Riders in plum are trying to take the Eastern Ford, and the Freehold militia cannot hold it alone. This is a war, not a chore: send people who can come home hurt.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense', 'urgent'],
    rewards: {
      triumph: {
        affinity: { freeholds: 15 },
        strength: { freeholds: 1, 'black-verge': -1 },
        local: { 'gate-watch': 2 },
        flags: ['ford-held'],
      },
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
        flags: ['ford-held'],
      },
      partial: { affinity: { freeholds: 3 } },
      failure: {
        affinity: { freeholds: -5 },
        strength: { freeholds: -1 },
        flags: ['ford-lost'],
      },
    },
    expired: {
      affinity: { freeholds: -10 },
      strength: { freeholds: -1 },
      flags: ['ford-lost'],
    },
    outcomes: {
      triumph:
        'The plum riders broke on the far bank and did not come back across. The Freeholds are already calling it the Iron Rain, after the arrows.',
      success:
        'The Ford held. Nobody who fought there will call it a victory, but the farms behind it are still standing.',
      partial:
        'The riders pulled back at dusk. They took two fields with them, and they will be back for more.',
      failure:
        'The Ford fell. The Freehold militia is camped in the tower’s outer court now, counting who is missing.',
      expired:
        'Nobody rode to the Ford. The Freeholds held it for one night alone, and then they did not.',
    },
  },
  {
    id: 'q-d33-thistledown',
    title: 'Wolves at Noon: Thistledown',
    summary:
      'Plum riders were seen above Thistledown at first light, and they attack at midday when the farmers are in the fields. Get there before noon.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'urgent'],
    rewards: {
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
        flags: ['thistledown-defended'],
      },
      failure: {
        affinity: { freeholds: -5 },
        strength: { freeholds: -1 },
      },
    },
    expired: {
      affinity: { freeholds: -10 },
      strength: { freeholds: -1 },
      flags: ['thistledown-abandoned'],
    },
    outcomes: {
      success:
        'The riders came over the ridge at noon and found the fields full of people with pitchforks and the crown’s colours. They did not stay.',
      partial:
        'Thistledown lost a barn and kept its people. Hester Plowright counted heads twice to be sure.',
      failure:
        'The party was late, and Thistledown paid for it in barns and seed grain.',
      expired:
        'The crown chose the other road. Thistledown will remember which one.',
    },
  },
  {
    id: 'q-d33-waystation',
    title: 'Wolves at Noon: the Saltroad Stop',
    summary:
      'The same riders are circling the Saltroad waystation at the salt flats, where a caravan is resting with half the Saltroad’s winter stock. Get there before noon.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'urgent'],
    rewards: {
      success: {
        brass: 25,
        affinity: { saltroad: 10 },
        strength: { saltroad: 1 },
        flags: ['waystation-defended'],
      },
      failure: {
        affinity: { saltroad: -5 },
        strength: { saltroad: -1 },
      },
    },
    expired: {
      affinity: { saltroad: -10 },
      strength: { saltroad: -1 },
      flags: ['waystation-abandoned'],
    },
    outcomes: {
      success:
        'The caravan rolled out at dusk with every crate. Oriel Saltmarsh’s factor paid the party in brass and in salt, which on the Saltroad means the same thing.',
      partial:
        'The caravan escaped with half its stock. The waystation did not escape at all.',
      failure:
        'The party arrived to smoke. The caravan scattered into the salt flats.',
      expired:
        'The crown chose the other road. The Saltroad will remember which one.',
    },
  },
  {
    id: 'q-d35-trestle',
    title: 'Hold Saffron’s Trestle',
    summary:
      'The trestle bridge over the Jackalwire canyon is the last road south that the war has not cut. Saffron Kett welded half of it. Hold it, or it burns.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'high' },
    ],
    danger: 'high',
    tags: ['defense', 'repair'],
    rewards: {
      success: {
        affinity: { jackalwire: 10 },
        strength: { jackalwire: 1 },
        flags: ['trestle-held'],
      },
      failure: {
        affinity: { jackalwire: -5 },
        strength: { jackalwire: -1 },
        flags: ['trestle-burned'],
      },
    },
    expired: {
      strength: { jackalwire: -1 },
      flags: ['trestle-burned'],
    },
    outcomes: {
      success:
        'The trestle stands. The Pack’s wagons rolled across it all night, and somebody painted the crown’s colours on the first span.',
      partial:
        'The trestle held, but it groans now. Nobody heavy should cross it twice.',
      failure:
        'The trestle burned. From the canyon rim it looked like a long orange comb, and then like nothing.',
      expired: 'Nobody came. The trestle burned at midnight.',
    },
  },
  {
    id: 'q-d35-tunnel',
    title: 'Hold the Mole Tunnel',
    summary:
      'The Moles’ long tunnel under the badlands runs all the way to the fen’s edge. Hold its mouth and the war has a road underneath it.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'tunnels'],
    rewards: {
      success: {
        affinity: { moles: 10 },
        strength: { moles: 1 },
        flags: ['tunnel-held'],
      },
      failure: {
        affinity: { moles: -5 },
        strength: { moles: -1 },
        flags: ['tunnel-collapsed'],
      },
    },
    expired: {
      strength: { moles: -1 },
      flags: ['tunnel-collapsed'],
    },
    outcomes: {
      success:
        'The tunnel mouth held. Granny Umber sent a jar of honey and a note that said only: “Good. Again tomorrow.”',
      partial: 'The tunnel held, but the riders know where it is now.',
      failure:
        'The Moles brought the tunnel down themselves rather than lose it. A whole road, gone under the badlands.',
      expired: 'Nobody came. The Moles brought their own roof down.',
    },
  },
  {
    id: 'q-d36-bell-rehearsal',
    title: 'The Silent Bell Rehearsal',
    summary:
      'Tonight the Abbey holds a rehearsal for a bell that has no clapper. Everyone will be in the chapel. Get into the cellars below it and bring back proof of what is down there.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'high' },
      { stat: 'lore', band: 'high', hidden: true },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tracking', 'records'],
    rewards: {
      triumph: {
        affinity: { 'hollow-bell': 10, freeholds: 5 },
        local: { lamplight: 3 },
        flags: ['abbey-crypt-evidence', 'abbey-crypt-ledger'],
      },
      success: {
        affinity: { 'hollow-bell': 5 },
        local: { lamplight: 2 },
        flags: ['abbey-crypt-evidence'],
      },
      partial: { flags: ['abbey-crypt-heard'] },
      failure: {
        affinity: { abbey: -10 },
        flags: ['rehearsal-caught'],
      },
    },
    expired: { flags: ['abbey-crypt-heard'] },
    outcomes: {
      triumph:
        'Under the chapel there is a door older than the Abbey, and in front of it a row of small shoes set out neatly, toes to the wall. The party brought back one shoe and the sisters’ tally book. The tally has a column for every family that gave a child, and a second column headed “Paid.”',
      success:
        'Under the chapel there is a door older than the Abbey, and in front of it a row of small shoes set out neatly, toes to the wall. The party brought one back. Nobody at court can stop looking at it.',
      partial:
        'The party never reached the cellars. They only heard the rehearsal: a whole choir singing toward the floor, and something under the floor keeping time.',
      failure:
        'Sister Marrow found them on the cellar stair and walked them out with a lamp, very kindly. She asked after the emperor’s health three times.',
      expired:
        'Nobody went. From the tower, the court heard the rehearsal anyway, faintly, all night.',
    },
  },
]

export const ACT_FOUR_DAYS: readonly DayDef[] = [
  {
    day: 31,
    title: 'Iron Rain',
    briefings: [
      {
        id: 'crows-stop-war',
        source: 'A Storm Crow messenger',
        text: 'The Crows will bring a storm that stops the war at the Ford.',
        truth: false,
      },
      {
        id: 'ford-attacked',
        source: 'Freehold riders',
        text: 'Riders in plum crossed toward the Eastern Ford before dawn.',
        truth: true,
      },
      {
        id: 'watch-thin',
        source: 'The Gate Watch',
        text: 'Half the Gate Watch is already on the walls and has not slept.',
        truth: true,
      },
    ],
    komodo:
      'Nobody stops a war with weather, Your Majesty, not even the Crows. This one will be paid for in people. Send the ones who can carry the bill.',
    quests: ['q-d31-iron-rain'],
    audiences: [
      {
        id: 'd31-muster',
        title: 'The Muster',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Captain Dunmark comes up the carpet still buckling his dented gorget. A Freehold rider limps at his elbow, a young ewe in a mud-brown coat with the broken shaft of an arrow tied off against her arm. Nobody has thought to give her a chair, and she would not take one.',
          '“The Ford is under arrows, Majesty, and the Freeholds are asking for the Gate Watch by name.”',
          {
            who: 'A Freehold rider',
            text: 'Plum coats, good horses, and they don’t take prisoners, Majesty. They take fields. Every hour we stand here, they are another farm closer to your tower.',
          },
          '“I can march half my people to the Ford by noon. The tower will be thin behind them. Your call. I would rather it was not mine.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Pack would ride for brass, Your Majesty, and the Rustline would wall the Ford for less. Neither of them loves the Freeholds. That is rather the point of hiring them. Nobody weeps for a mercenary.',
          },
        ],
        options: [
          {
            id: 'ask-walls',
            label: 'Ask Dunmark who would be left on the walls.',
            effects: {},
            response:
              'Dunmark glances at the rider, then at the long windows, and lowers his voice, which for a wolf of his size is mostly a courtesy.',
            next: 'walls',
          },
          {
            id: 'march',
            label: 'March the Watch to the Ford.',
            effects: {
              affinity: { freeholds: 10 },
              strength: { freeholds: 1 },
              local: { 'gate-watch': -2 },
              flags: ['watch-marched'],
            },
            response:
              'Dunmark salutes and is gone before the echo is. By noon the tower walls are very quiet.',
          },
          {
            id: 'hold',
            label: 'The Watch stays on the walls.',
            effects: {
              affinity: { freeholds: -5 },
              local: { 'gate-watch': 2 },
            },
            response:
              '“Walls it is,” says Dunmark, and looks out at the smoke over the Ford for a long moment. The rider leaves without asking permission.',
          },
          {
            id: 'pack',
            label: 'Hire the Pack to ride to the Ford instead.',
            requires: { cost: 30, affinity: { jackalwire: 'neutral' } },
            effects: {
              affinity: { jackalwire: 5 },
              strength: { freeholds: 1 },
              flags: ['pack-hired-ford'],
            },
            response:
              'The Pack rides out whooping. The Freeholds will be grateful and appalled in roughly equal parts.',
          },
          {
            id: 'rustline',
            label: 'Pay the Rustline to barricade the Ford with scrap.',
            requires: { cost: 20, affinity: { rustline: 'neutral' } },
            effects: {
              affinity: { rustline: 10 },
              strength: { freeholds: 1 },
              flags: ['rustline-barricades'],
            },
            response:
              'By noon the Ford is walled with rusted boxcars. The magpies charge by the boxcar, and they are worth it.',
          },
        ],
        beats: [
          {
            id: 'walls',
            lines: [
              '“Recruits, Majesty. Twenty of them, and the youngest is fifteen. The Yard’s night porters, if you ask them nicely. Fourteen of the porters have held a spear, and two of those held it the right way round.”',
              '“The plum riders are not coming for the tower. Not today. But a tower that empties its walls every time a farm burns is a tower somebody, some day, will burn a farm to empty.”',
              {
                who: 'A Freehold rider',
                text: 'The last crown kept its soldiers home, Majesty. Hester Plowright buried eleven of ours that summer, and she still writes to the tower every year on the day, to remind it.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'March them, Your Majesty. Nobody has attacked these walls in forty years, and the Ford is being attacked this morning. An empty wall is only a wall. An empty Ford is a kingdom with a hole in it.',
              },
            ],
            options: [
              {
                id: 'march',
                label: 'March the whole Watch. The walls can wait.',
                effects: {
                  affinity: { freeholds: 10 },
                  strength: { freeholds: 1 },
                  local: { 'gate-watch': -2 },
                  flags: ['watch-marched'],
                },
                response:
                  'Dunmark salutes and is gone before the echo is. The rider runs after him, arm and all. By noon the tower walls are very quiet, and Komodo walks along them alone, as if measuring something.',
              },
              {
                id: 'hold',
                label:
                  'The Watch stays on the walls. The Freeholds hold alone.',
                effects: {
                  affinity: { freeholds: -5 },
                  local: { 'gate-watch': 2 },
                },
                response:
                  '“Walls it is,” says Dunmark. The rider looks at you as if memorising your face for Hester’s next letter, and leaves.',
              },
              {
                id: 'pack',
                label: 'Hire the Pack. Let raiders bleed for farmers.',
                requires: { cost: 30, affinity: { jackalwire: 'neutral' } },
                effects: {
                  affinity: { jackalwire: 5 },
                  strength: { freeholds: 1 },
                  flags: ['pack-hired-ford'],
                },
                response:
                  'The Pack rides out whooping. The rider watches them go with her good hand on her knife, and the Freeholds will be grateful and appalled in roughly equal parts.',
              },
              {
                id: 'rustline',
                label: 'Pay the Rustline to wall the Ford with scrap.',
                requires: { cost: 20, affinity: { rustline: 'neutral' } },
                effects: {
                  affinity: { rustline: 10 },
                  strength: { freeholds: 1 },
                  flags: ['rustline-barricades'],
                },
                response:
                  'By noon the Ford is walled with rusted boxcars. The magpies charge by the boxcar, and they are worth it, and nobody from the tower has to go.',
              },
              {
                id: 'volunteers',
                label:
                  'You swore never to spend the Watch cheaply. Ask for volunteers, and let the rest hold the walls.',
                requires: { flags: ['oath-of-care'] },
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d31-watch-volunteers'],
                },
                response:
                  'Dunmark repeats your oath to the yard, word for word. Thirty-one step forward. The youngest are first, because the young always are, and Dunmark sends four of them back to the walls without explaining why. The rider counts the rest and says nothing, which is its own kind of answer.',
              },
              {
                id: 'porters',
                label:
                  'March the Watch, and put the Yard’s porters on the walls tonight.',
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'gate-watch': -1, yard: -3 },
                  flags: ['d31-porters-on-walls'],
                },
                response:
                  'By dusk the walls are lined with porters in flour-white aprons, holding kitchen spits like pikes. Foreman Ash walks the length of them twice and does not speak to the throne for a week.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 32,
    title: 'A Name in the Ledger',
    briefings: [
      {
        id: 'archive-late',
        source: 'The Lamplight Archive',
        text: 'The Archive’s lamps burned until dawn, and the Keeper has asked for an audience.',
        truth: true,
      },
      {
        id: 'ledger-audited',
        source: 'Young Komodo’s runner',
        text: 'The crown’s accounts were checked last month and every page is in order.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'oil-shortage',
        source: 'The Yard',
        text: 'The Yard has run short of lamp oil, though the oil bills are higher than ever.',
        truth: true,
      },
    ],
    komodo:
      'Every ledger has a page that does not add up, Your Majesty. Most of them are mine, and most of those are rounding. Let the Keeper have his audience. He so rarely asks.',
    quests: [],
    audiences: [
      {
        id: 'd32-ledger-page',
        title: 'A Name in the Ledger',
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        lines: [
          'Keeper Vellum lays a single page on the arm of the throne, very slowly, and smooths it flat. It takes him the better part of a minute. Nobody in the hall hurries him. The court learned long ago that hurrying him only makes him slower.',
          '“Lamp oil, Majesty. The crown has paid for enough oil this year to light the Saltroad end to end. It was all delivered up the mission road. The Abbey uses candles.”',
          '“The entries are in a careful hand. The court’s own hand. I have not yet matched it, and I thought you should decide whether I do.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Eleven clerks keep the court’s hand, Keeper, and I keep the clerks. I can have every one of them write out the word oil for you by supper. Left hand and right, if you like.',
          },
          'The Keeper blinks at him once, very slowly, which is how a sloth says a great many things at the same time.',
        ],
        options: [
          {
            id: 'ask-oil',
            label: 'Ask the Keeper what that much oil could possibly be for.',
            effects: {},
            response:
              'Vellum considers the question for long enough that a page in the gallery yawns, and is elbowed.',
            next: 'oil',
          },
          {
            id: 'match',
            label: 'Match the hand, quietly.',
            effects: { local: { lamplight: 2 }, flags: ['ledger-page-kept'] },
            response:
              'Vellum nods once. “Quietly is the only speed I have, Majesty.” The page goes back into his sleeve.',
          },
          {
            id: 'hollin',
            label: 'Ask Hollin to read it tonight.',
            requires: { follower: 'F019' },
            effects: {
              local: { lamplight: 3 },
              flags: ['ledger-page-kept', 'ledger-hand-studied'],
            },
            response:
              'Hollin turns the page under the lamp until midnight. “Left-handed,” the owl says at last. “Taps the pen before every number, the way some people tap a claw.”',
          },
          {
            id: 'komodo',
            label: 'Give the page to Young Komodo to explain.',
            effects: {
              local: { lamplight: -2 },
              flags: ['ledger-page-to-komodo'],
            },
            response:
              'Komodo reads it, laughs, and thanks the Keeper for his diligence. “A clerk who cannot tell oil from wax, Your Majesty. I will have it corrected.” He tucks the page into his own ledger.',
          },
          {
            id: 'burn',
            label: 'Burn it. The court cannot afford a scandal now.',
            effects: {
              local: { ledger: 2, lamplight: -3 },
              flags: ['ledger-page-burned'],
            },
            response:
              'Vellum watches the page curl in the brazier. “The Archive remembers what it burns, Majesty,” he says. “It is a terrible habit.”',
          },
        ],
        beats: [
          {
            id: 'oil',
            lines: [
              '“Light, Majesty, is what oil is for. A great deal of light, for a long time, somewhere very dark. A cellar. A road nobody walks by day. A room that is meant to look empty from outside.”',
              '“And the Yard has run short, which the Foreman tells me has never happened in his lifetime. So the oil is not here, and it is not in the Abbey’s chapel. It is somewhere in between, burning.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Or a clerk wrote oil where he meant wax, Your Majesty, and the Abbey’s candles were bought with the crown’s charity. I approved the charity myself. It is exactly the sort of thing you would have approved.',
              },
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'My ovens have been dark two nights, Majesty. Whatever it was, it was not wax.',
              },
            ],
            options: [
              {
                id: 'match',
                label: 'Match the hand, quietly, and tell no one.',
                effects: {
                  local: { lamplight: 2 },
                  flags: ['ledger-page-kept'],
                },
                response:
                  'Vellum nods once. “Quietly is the only speed I have, Majesty.” The page goes back into his sleeve, and the Foreman goes back to his dark ovens.',
              },
              {
                id: 'hollin',
                label: 'Ask Hollin to read the hand tonight.',
                requires: { follower: 'F019' },
                effects: {
                  local: { lamplight: 3 },
                  flags: ['ledger-page-kept', 'ledger-hand-studied'],
                },
                response:
                  'Hollin turns the page under the lamp until midnight. “Left-handed,” the owl says at last. “Taps the pen before every number, the way some people tap a claw.”',
              },
              {
                id: 'komodo',
                label: 'Let Young Komodo take the page and correct his clerk.',
                effects: {
                  local: { lamplight: -2 },
                  flags: ['ledger-page-to-komodo'],
                },
                response:
                  '“Thank you, Your Majesty.” Komodo folds the page once, precisely, and tucks it into his own ledger. Vellum watches it go the way a farmer watches a hawk take a chick.',
              },
              {
                id: 'burn',
                label: 'Burn it. A war is no time for a scandal.',
                effects: {
                  local: { ledger: 2, lamplight: -3 },
                  flags: ['ledger-page-burned'],
                },
                response:
                  'Vellum watches the page curl in the brazier. “The Archive remembers what it burns, Majesty,” he says. “It is a terrible habit.” Foreman Ash watches too, and remembers it in a different way.',
              },
              {
                id: 'count-barrels',
                label:
                  'Send the Yard up the mission road to count every barrel the crown paid for.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { yard: 2 },
                  flags: ['d32-barrels-counted'],
                },
                response:
                  'Foreman Ash takes six porters and a tally stick. They come back after dark with a number: forty barrels stacked behind the Abbey woodshed, every one empty and scrubbed clean. Sister Marrow gave them lemonade, and asked after the emperor’s health.',
              },
              {
                id: 'same-hand',
                label:
                  'Ask whether this is the same careful hand that wrote the false morning reports.',
                requires: { flags: ['false-reports-traced'] },
                effects: {
                  local: { lamplight: 2 },
                  flags: ['ledger-page-kept', 'd32-same-careful-hand'],
                },
                response:
                  'Vellum is quiet for a very long time. “I had hoped you would not ask that, Majesty, because I think I know the answer and I have not yet proved it.” The page goes back into his sleeve. Across the hall, Komodo laughs at something a clerk has said, a moment after everyone else.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 33,
    title: 'Wolves at Noon',
    briefings: [
      {
        id: 'riders-thistledown',
        source: 'Thistledown',
        text: 'Plum riders are watching the Thistledown fields from the ridge.',
        truth: true,
      },
      {
        id: 'riders-waystation',
        source: 'A Saltroad drover',
        text: 'More riders are circling the waystation on the salt flats.',
        truth: true,
      },
      {
        id: 'one-band',
        source: 'A Gate Watch scout',
        text: 'It is one band of riders, and it can only strike one place.',
        truth: false,
      },
    ],
    komodo:
      'Two bands, Your Majesty, both striking at noon, which is when farmers are in the fields and drovers are at lunch. Someone has studied us. Choose which place the crown can afford to lose.',
    quests: ['q-d33-thistledown', 'q-d33-waystation'],
    audiences: [
      {
        id: 'd33-both-roads',
        title: 'Both Roads',
        speaker: 'Hester Plowright of the Border Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        lines: [
          'A hen in a mud-heavy skirt marches straight up to the throne, egg basket and all, and does not curtsey. Her reeve’s chain is on crooked. She has ridden through the night and dressed on the horse.',
          '“The Saltroad has guards and money and a hundred wagons. Thistledown has me and my sister and the goats. You know who needs you more, Majesty. Say it out loud.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'There is a Saltroad drover in the gallery, Your Majesty, who would very much like to say something and is too polite. I mention it only so that nobody can say afterwards that he was not here.',
          },
        ],
        options: [
          {
            id: 'ask-noon',
            label: 'Ask Hester how the riders knew to strike at noon.',
            effects: {},
            response:
              'Hester blinks, as if nobody had asked her a question in years instead of an answer, and puts the basket down.',
            next: 'studied',
          },
          {
            id: 'thistledown',
            label: 'Promise Thistledown the crown’s best.',
            effects: {
              affinity: { freeholds: 10, saltroad: -5 },
              flags: ['promised-thistledown'],
            },
            response:
              'Hester nods hard, as if she had made the decision herself. “Before noon,” she says. “Not a minute after.”',
          },
          {
            id: 'saltroad',
            label: 'The Saltroad’s stock feeds the whole kingdom this winter.',
            effects: {
              affinity: { freeholds: -10, saltroad: 5 },
              local: { ledger: 1 },
              flags: ['promised-waystation'],
            },
            response:
              'Hester picks up her basket. “Then I hope the kingdom enjoys its winter,” she says, and leaves.',
          },
          {
            id: 'watch',
            label:
              'Send the Gate Watch to Thistledown, and the court to the Saltroad.',
            requires: { local: { 'gate-watch': 12 } },
            effects: {
              affinity: { freeholds: 5 },
              strength: { freeholds: 1 },
              local: { 'gate-watch': -3 },
            },
            response:
              'Captain Dunmark groans in the doorway, and then goes to find his boots. Hester looks almost satisfied.',
          },
          {
            id: 'not-twice',
            label:
              'Thistledown burned once while the crown watched. Tell Hester it will not burn twice.',
            requires: { flags: ['thistledown-burned'] },
            effects: {
              affinity: { freeholds: 10, saltroad: -10 },
              local: { 'gate-watch': -1 },
              flags: ['d33-not-twice'],
            },
            response:
              'Hester’s chin comes up. “I was there the first time,” she says. “I counted the barns. I will count them again tomorrow, Majesty, and I will write to you with the number.” In the gallery, the Saltroad drover quietly gets up and leaves.',
          },
        ],
        beats: [
          {
            id: 'studied',
            lines: [
              '“Because noon is when Thistledown eats. Always has. Anybody who has sat at our table knows it, and we have fed half the kingdom at that table, including some of your court.”',
              '“So they know. Now you know. The riders are still on the ridge, Majesty, and knowing doesn’t move them.”',
              {
                who: 'A Saltroad drover',
                text: 'Begging the reeve’s pardon. The waystation isn’t a warehouse, Majesty. Forty drovers’ families are wintering in the salt-house this week. They don’t have goats. They have us, and we have the stock, and the stock is how they eat till spring.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Both true, Your Majesty. That is the trouble with true things. They never agree to share.',
              },
            ],
            options: [
              {
                id: 'thistledown',
                label: 'Promise Thistledown the crown’s best. Say it out loud.',
                effects: {
                  affinity: { freeholds: 10, saltroad: -5 },
                  flags: ['promised-thistledown'],
                },
                response:
                  'Hester nods hard, as if she had made the decision herself. “Before noon,” she says. “Not a minute after.” The drover sits down again, slowly, and looks at his hands.',
              },
              {
                id: 'saltroad',
                label:
                  'The salt-house first. Forty families outweigh one village.',
                effects: {
                  affinity: { freeholds: -10, saltroad: 5 },
                  local: { ledger: 1 },
                  flags: ['promised-waystation'],
                },
                response:
                  'Hester picks up her basket. “Forty families,” she says. “Thistledown is ninety. But we only have the one road, so I suppose we don’t count.” She leaves without bowing.',
              },
              {
                id: 'watch',
                label:
                  'Send the Gate Watch to Thistledown, and the court to the Saltroad.',
                requires: { local: { 'gate-watch': 12 } },
                effects: {
                  affinity: { freeholds: 5 },
                  strength: { freeholds: 1 },
                  local: { 'gate-watch': -3 },
                },
                response:
                  'Captain Dunmark groans in the doorway, and then goes to find his boots. Hester looks almost satisfied, and the drover very nearly smiles.',
              },
              {
                id: 'salt-house',
                label:
                  'Bring the drovers’ families into the tower’s outer court. The stock takes its chances.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: 10 },
                  local: { yard: -2, 'old-houses': -1 },
                  flags: ['d33-drovers-sheltered'],
                },
                response:
                  'By nightfall forty families are bedding down in the outer court with salt-sacks for pillows. Foreman Ash counts the bowls twice and says nothing. Lady Vask says a great deal, most of it about the smell. Hester leaves before anyone can ask her what she thinks.',
              },
              {
                id: 'night-fields',
                label:
                  'Tell Thistledown to work its fields by night, and send the crown’s best to the salt flats.',
                effects: {
                  affinity: { freeholds: -5, saltroad: 5 },
                  local: { ledger: 1 },
                  flags: ['d33-fields-by-night'],
                },
                response:
                  'Hester stares at you. “By night,” she says. “With what lamps, Majesty? Your Yard cannot find a drop of oil.” That night Thistledown brings in its harvest by starlight, and by the light of the riders’ campfires on the ridge.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 34,
    title: 'A Storm Crow Debt',
    briefings: [
      {
        id: 'crows-gather',
        source: 'The Heights',
        text: 'Every Storm Crow roost has emptied toward the tower overnight.',
        truth: true,
      },
      {
        id: 'covenant-due',
        source: 'Elder Corvane’s herald',
        text: 'The rain covenant falls due at noon today.',
        truth: true,
      },
      {
        id: 'covenant-forgiven',
        source: 'A hopeful farmer',
        text: 'The Crows will forgive the rain debt because of the war.',
        truth: false,
      },
    ],
    komodo:
      'Crows forgive nothing, Your Majesty. It is the thing I most admire about them. Whatever was promised for the rain, they have come to collect it.',
    quests: [],
    audiences: [
      {
        id: 'd34-crow-debt',
        title: 'A Storm Crow Debt',
        speaker: 'Elder Corvane of the Storm Crows',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'Elder Corvane perches on the back of the empty petitioners’ bench and folds his wings like a closed umbrella. Every window in the hall has a crow on its sill this morning, and every crow is facing the throne.',
          '“The rain was lent, Majesty. The fields drank it. Now the rain is owed. We do not take back rain, so we take something else.”',
          '“Brass, if you have it. Hands, if you do not. The Conclave is not particular about the shape of a debt, only that it is paid in full, and in daylight.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Crows keep two ledgers, Your Majesty: what is owed, and who was late. You do not want to be in the second one. Nobody has ever got out of it.',
          },
        ],
        options: [
          {
            id: 'ask-else',
            label:
              'Ask what “something else” would be, if the crown has no brass to spare.',
            effects: {},
            response:
              'Corvane’s copper chimes stir, though there is no wind in the hall.',
            next: 'something-else',
          },
          {
            id: 'ask-runners',
            label:
              'Ask after the three Yard volunteers the crown sent up the Heights last season.',
            requires: { flags: ['covenant-paid-in-runners'] },
            effects: {},
            response:
              '“Two came home,” Corvane says. “One stayed. She says the caves are quieter than your Yard. We did not ask her to say so.” He tilts his head. “We rarely have to.”',
            next: 'something-else',
          },
          {
            id: 'tamsin',
            label: 'Let Tamsin Gutterwing answer him.',
            requires: { follower: 'F011' },
            effects: {},
            response:
              'Tamsin steps out from behind the throne before you have finished saying her name, as if she had been waiting there for eleven years.',
            next: 'tamsin-answers',
          },
          {
            id: 'brass',
            label: 'Pay the debt in brass.',
            requires: { cost: 60 },
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['crow-debt-paid'],
            },
            response:
              'Corvane counts every coin twice, which takes a long time, and then nods. “Clean,” he says. “We like clean.”',
          },
          {
            id: 'runners',
            label: 'Lend the Crows runners for the season.',
            effects: {
              affinity: { 'storm-crows': 15 },
              local: { yard: -3 },
              flags: ['crow-debt-paid', 'runners-lent'],
            },
            response:
              'The Yard sends six of its fastest. Corvane looks them over like fruit at a market. “These will do,” he says.',
          },
          {
            id: 'favor',
            label: 'Call in the favor the Crows already owe the crown.',
            requires: { flags: ['crow-favor-owed'] },
            effects: {
              affinity: { 'storm-crows': -5 },
              clearFlags: ['crow-favor-owed'],
              flags: ['crow-debt-paid'],
            },
            response:
              'Corvane’s feathers lift and settle. “Paid with our own coin,” he says. “Clever. We will remember clever.”',
          },
          {
            id: 'refuse',
            label: 'The crown is at war. The debt will wait.',
            effects: {
              affinity: { 'storm-crows': -20 },
              strength: { 'storm-crows': 1 },
              flags: ['crow-debt-defaulted'],
            },
            response:
              'Corvane rises without a word. That night every crow on the Heights faces the tower, and none of them sleep.',
          },
        ],
        beats: [
          {
            id: 'something-else',
            lines: [
              '“Runners, as before. Young ones, quick ones. Six for a season, and we feed them well.”',
              '“Or water. Rain lent is water owed. Sign the Ford’s water rights to the Conclave for a generation, and the debt is clean, and nobody climbs the Heights who does not wish to.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Ford’s water is what the Moles have wanted since the midnight choir, Your Majesty, and the Freeholds have drunk it since before there was a crown. Corvane knows that. It is why he asked for it.',
              },
              'Corvane does not deny it. He only waits, the way weather waits.',
            ],
            options: [
              {
                id: 'brass',
                label: 'Pay in brass, and let nobody climb the Heights.',
                requires: { cost: 60 },
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['crow-debt-paid'],
                },
                response:
                  'Corvane counts every coin twice, which takes a long time, and then nods. “Clean,” he says. “We like clean.” The treasury is lighter by a war’s worth of arrows.',
              },
              {
                id: 'runners',
                label: 'Send six runners from the Yard. Children of the tower.',
                effects: {
                  affinity: { 'storm-crows': 15 },
                  local: { yard: -3 },
                  flags: ['crow-debt-paid', 'runners-lent'],
                },
                response:
                  'The Yard sends six of its fastest. Corvane looks them over like fruit at a market, and picks the youngest first. Their mothers stand in the Yard gate until the last of them is out of sight.',
              },
              {
                id: 'favor',
                label:
                  'Neither. Call in the favor the Crows already owe the crown.',
                requires: { flags: ['crow-favor-owed'] },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['crow-favor-owed'],
                  flags: ['crow-debt-paid'],
                },
                response:
                  'Corvane’s feathers lift and settle. “Paid with our own coin,” he says. “Clever. We will remember clever.” The crow on the nearest sill turns its back on the throne.',
              },
              {
                id: 'refuse',
                label: 'Neither water nor children. The debt will wait.',
                effects: {
                  affinity: { 'storm-crows': -20 },
                  strength: { 'storm-crows': 1 },
                  flags: ['crow-debt-defaulted'],
                },
                response:
                  'Corvane rises without a word. That night every crow on the Heights faces the tower, and none of them sleep, and neither, much, do you.',
              },
              {
                id: 'ford-rights',
                label: 'Sign the Ford’s water rights over to the Conclave.',
                effects: {
                  affinity: { 'storm-crows': 15, freeholds: -10, moles: -5 },
                  flags: ['d34-ford-water-signed'],
                },
                response:
                  'Corvane signs with a claw dipped in ink. By evening there is a crow on every sluice gate along the Ford, and the Freehold farmers are learning to ask them politely for their own water.',
              },
            ],
          },
          {
            id: 'tamsin-answers',
            speaker: 'Tamsin Gutterwing',
            npc: 'F011',
            lines: [
              '“Six runners for a season. That is what they said about me, Majesty. I was seven. I ran for the Conclave for eleven seasons.”',
              '“You don’t run messages. You run whatever is in the bag, and you don’t look in the bag, and if you come back without it you don’t come back.”',
              {
                who: 'Elder Corvane',
                npc: 'elder-corvane',
                text: 'And you ran well, little runner. You ran very well. That is why we remember your name.',
              },
              '“They remember all our names. That is the whole trouble with them.”',
            ],
            options: [
              {
                id: 'brass',
                label: 'Pay in brass. Not one runner climbs the Heights.',
                requires: { cost: 60 },
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['crow-debt-paid'],
                },
                response:
                  'Corvane counts every coin twice, and then nods. “Clean,” he says, and then, to Tamsin, more quietly: “You bought them dear, little runner.” “Not me,” says Tamsin. “The crown.”',
              },
              {
                id: 'refuse',
                label: 'The crown is at war, and the debt will wait.',
                effects: {
                  affinity: { 'storm-crows': -20 },
                  strength: { 'storm-crows': 1 },
                  flags: ['crow-debt-defaulted'],
                },
                response:
                  'Corvane rises without a word. Tamsin watches the crows leave the sills one by one, and says, to nobody, “They will come back for it. They always come back for it.”',
              },
              {
                id: 'wages',
                label:
                  'Lend runners on Tamsin’s terms: wages, their own names on every bag, and home by first frost.',
                requires: { cost: 20 },
                effects: {
                  affinity: { 'storm-crows': 5 },
                  local: { yard: 1 },
                  flags: ['d34-runners-on-wages'],
                },
                response:
                  'Corvane looks at Tamsin for a long time. “Wages,” he says, as if the word tasted of tin. “Very well. Once.” Tamsin does not smile, but she stops holding her tail so stiffly.',
              },
            ],
          },
        ],
      },
      {
        id: 'd34-outer-court',
        title: 'Militia in the Outer Court',
        speaker: 'A Freehold militia sergeant',
        faction: 'freeholds',
        requires: { flags: ['ford-lost'] },
        lines: [
          'The Freehold militia has been camped in the tower’s outer court since the Ford fell. Their sergeant is a stout old ram with a bandaged eye, and he brings his whole company up the carpet with him in the smell of his coat: smoke, wet wool, and wounds that need cleaning.',
          '“We lost the Ford, Majesty. You know that. Thirty-one of us came back, and we have eaten the Yard’s bread for two days, and the Foreman has started counting it at us.”',
          '“We can go back and take it again, if the crown arms us. Or we can go home, what is left of home. Or we can stay, and the Yard can keep counting.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'The Yard has bread for the tower, Majesty. It does not have bread for the tower and a war.',
          },
        ],
        options: [
          {
            id: 'feed',
            label: 'Keep feeding them. The crown lost the Ford beside them.',
            requires: { cost: 20 },
            effects: {
              affinity: { freeholds: 10 },
              local: { yard: -2 },
              flags: ['d34-militia-fed'],
            },
            response:
              'The sergeant salutes with the hand that still works. Foreman Ash bakes until midnight, and you can hear the oven doors from the throne room, one slam at a time.',
          },
          {
            id: 'arm',
            label:
              'Arm them from the tower’s stores and send them back to the Ford.',
            effects: {
              affinity: { freeholds: 5 },
              local: { 'gate-watch': -2 },
              flags: ['d34-militia-rearmed'],
            },
            response:
              'They march at dawn with the Watch’s spare spears and the Watch’s spare helmets. Captain Dunmark stands in the armoury doorway and looks at the empty racks for a long time.',
          },
          {
            id: 'home',
            label: 'Send them home. The outer court is not a camp.',
            effects: {
              affinity: { freeholds: -10 },
              local: { yard: 2, 'gate-watch': 1 },
              flags: ['d34-militia-sent-home'],
            },
            response:
              'They go quietly, which is worse. By evening the outer court is swept and empty, and somebody has scratched the Ford’s name into the gatepost at about the height of a child.',
          },
        ],
      },
    ],
  },
  {
    day: 35,
    title: 'Two Bridges',
    briefings: [
      {
        id: 'routes-cut',
        source: 'The map room',
        text: 'The war has cut every road south except two: the canyon trestle and the Mole tunnel.',
        truth: true,
      },
      {
        id: 'riders-moving',
        source: 'Jackalwire outriders',
        text: 'Plum riders are moving on both routes at once.',
        truth: true,
      },
      {
        id: 'both-hold',
        source: 'A Saltroad factor',
        text: 'The court has enough people to hold both routes for a week.',
        truth: false,
      },
    ],
    komodo:
      'Two roads, Your Majesty, and the court can hold one. Whichever survives is the road you will be using later. I would choose as if your life depended on it.',
    quests: [],
    audiences: [
      {
        id: 'd35-two-bridges',
        title: 'Two Bridges',
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        lines: [
          'Granny Umber taps her pipe-cane on the throne room floor, as if checking it for hollows. She has brought mud from both ends of her tunnel on her boots, and she has not wiped them.',
          '“Saffron’s trestle or my tunnel, Majesty. Not both. The trestle is quicker. The tunnel is hidden. One of them will still be there when you need a way out, and one will not.”',
          '“Saffron Kett welded that trestle. My grandmother dug that tunnel. You will break somebody’s heart today, young ruler, so try to break it on purpose.”',
        ],
        options: [
          {
            id: 'trestle',
            label: 'Hold the trestle.',
            effects: {
              affinity: { jackalwire: 5, moles: -5 },
              flags: ['route-trestle'],
            },
            response:
              'Granny Umber sighs through her star of a nose. “Quick roads,” she says. “Everybody always wants the quick roads.”',
            postsQuests: ['q-d35-trestle'],
          },
          {
            id: 'tunnel',
            label: 'Hold the tunnel.',
            effects: {
              affinity: { moles: 10, jackalwire: -5 },
              flags: ['route-tunnel'],
            },
            response:
              '“Good,” says Granny Umber. “Bring a lamp, and do not sneeze near the props.”',
            postsQuests: ['q-d35-tunnel'],
          },
          {
            id: 'saffron',
            label: 'Let Saffron Kett choose.',
            requires: { follower: 'F002' },
            effects: {
              affinity: { jackalwire: 10 },
              flags: ['route-trestle', 'saffron-chose-route'],
            },
            response:
              'Saffron does not hesitate. “The trestle. I know every weld in it, and I know which ones will hold.” Granny Umber shrugs, which on a mole is mostly elbows.',
            postsQuests: ['q-d35-trestle'],
          },
          {
            id: 'ask-way-out',
            label: 'Ask her what she means by a way out.',
            effects: {},
            response:
              'Granny Umber peers at you over her spectacles. Then, for the first time in all her visits, she sits down on the step of the dais as if she means to stay a while.',
            next: 'way-out',
          },
        ],
        beats: [
          {
            id: 'way-out',
            lines: [
              '“I have watched three crowns go, young ruler. They don’t fall at the start of a war. They fall at the end of one, when everybody is tired, and somebody close to the throne has decided they know better.”',
              '“When yours goes, and I hope it won’t, you will want a road nobody at this court has walked. Everybody knows the trestle. Only Moles know the tunnel. And now you.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Granny Umber is very kind to plan your escape, Your Majesty. I had thought that was my job. For what it is worth, I would take the trestle. A tunnel has only two ends, and someone is always standing at one of them.',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'Whichever you choose, Majesty, the Watch would rather nobody at this court knew which. A road is only secret until somebody writes it down.',
              },
            ],
            options: [
              {
                id: 'trestle',
                label: 'Hold the trestle. Quick roads save lives too.',
                effects: {
                  affinity: { jackalwire: 5, moles: -5 },
                  flags: ['route-trestle'],
                },
                response:
                  'Granny Umber sighs through her star of a nose. “Quick roads,” she says. “Everybody always wants the quick roads, and everybody always knows where they go.”',
                postsQuests: ['q-d35-trestle'],
              },
              {
                id: 'tunnel',
                label: 'Hold the tunnel. The road nobody knows.',
                effects: {
                  affinity: { moles: 10, jackalwire: -5 },
                  flags: ['route-tunnel'],
                },
                response:
                  '“Good,” says Granny Umber, getting up one joint at a time. “Bring a lamp, and do not sneeze near the props.” Komodo writes something down, and then, carefully, crosses it out.',
                postsQuests: ['q-d35-tunnel'],
              },
              {
                id: 'saffron',
                label: 'Let Saffron Kett choose. It is her bridge.',
                requires: { follower: 'F002' },
                effects: {
                  affinity: { jackalwire: 10 },
                  flags: ['route-trestle', 'saffron-chose-route'],
                },
                response:
                  'Saffron does not hesitate. “The trestle. I know every weld in it, and I know which ones will hold.” Granny Umber shrugs, which on a mole is mostly elbows, and says, “Then I hope you never need to leave in a hurry.”',
                postsQuests: ['q-d35-trestle'],
              },
              {
                id: 'secret-tunnel',
                label:
                  'Hold the tunnel, and let the court believe you chose the trestle. Your advisor too.',
                effects: {
                  affinity: { moles: 10, jackalwire: -5 },
                  flags: ['route-tunnel', 'd35-tunnel-secret'],
                },
                response:
                  'You say “the trestle” aloud, for the whole hall to hear, and Komodo writes it down. Granny Umber does not blink. Later, at the postern, she presses a lump of tunnel chalk into your hand and says, “Good. Now forget you know where it goes.”',
                postsQuests: ['q-d35-tunnel'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 36,
    title: 'The Silent Bell Rehearsal',
    briefings: [
      {
        id: 'rehearsal-tonight',
        source: 'A pilgrim on the mission road',
        text: 'The Abbey holds a rehearsal tonight, and every sister will be in the chapel.',
        truth: true,
      },
      {
        id: 'bell-clapper',
        source: 'Sister Marrow',
        text: 'The Abbey has finally found its bell’s lost clapper.',
        truth: false,
      },
      {
        id: 'cellar-door',
        source: 'Brother Teodor’s old letters',
        text: 'There is a cellar under the chapel that the sisters never mention.',
        truth: true,
      },
    ],
    komodo:
      'A rehearsal for a bell that cannot ring, Your Majesty. I would not go. I would not send anyone I liked. But I am a coward about cellars, and you are the emperor.',
    quests: ['q-d36-bell-rehearsal'],
    audiences: [
      {
        id: 'd36-invitation',
        title: 'An Invitation',
        speaker: 'Sister Marrow of the Abbey of the Silent Bell',
        npc: 'sister-marrow',
        faction: 'abbey',
        lines: [
          'A white goat in grey brings a card, hand-lettered, sealed with candle wax. She crosses the whole hall without making a sound on the boards, and stops exactly where petitioners are meant to stop, which nobody ever does.',
          '“The Abbess would be honoured if the emperor attended tonight’s rehearsal. There is a seat at the front. There is always a seat at the front.”',
          '“The children have practised for weeks. They have such sweet voices. They sing toward the floor, the way the Abbess taught them, so that the floor will learn the tune.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A seat at the front is a great honour, Your Majesty. It is also the seat furthest from the door.',
          },
        ],
        options: [
          {
            id: 'ask-performance',
            label: 'Ask what the rehearsal is rehearsing for.',
            effects: {},
            response:
              'Sister Marrow’s smile does not change at all. It is a very good smile. It has had a great deal of practice.',
            next: 'performance',
          },
          {
            id: 'teodor',
            label: 'Let Brother Teodor answer his old sister.',
            requires: { follower: 'F012' },
            effects: {},
            response:
              'Teodor comes forward with his hands folded in his sleeves, the way the Abbey taught him, and then, deliberately, unfolds them.',
            next: 'teodor',
          },
          {
            id: 'accept',
            label: 'Accept, and sit at the front.',
            effects: { affinity: { abbey: 10 }, flags: ['rehearsal-attended'] },
            response:
              'Sister Marrow smiles so warmly that the throne room feels briefly too hot. “She will be so glad,” she says.',
          },
          {
            id: 'decline',
            label: 'Decline, with thanks. The war keeps the emperor home.',
            effects: { affinity: { abbey: -5 } },
            response:
              '“Of course,” says Sister Marrow. “Another time. There will be other rehearsals, until there is a performance.”',
          },
          {
            id: 'evidence',
            label:
              'Show her the tracks on the mission road and ask where they lead.',
            requires: { flags: ['mission-road-tracks'] },
            effects: {
              affinity: { abbey: -10, freeholds: 5 },
              flags: ['abbey-confronted'],
            },
            response:
              'Sister Marrow looks at the drawing of the small footprints for a long time. “They lead to lessons, Majesty,” she says, and her voice does not change at all.',
          },
          {
            id: 'coldbrook',
            label:
              'Ask whether the Coldbrook children will be singing tonight.',
            requires: { flags: ['abbey-took-coldbrook-children'] },
            effects: {
              affinity: { abbey: -5, freeholds: 5 },
              flags: ['d36-coldbrook-asked'],
            },
            response:
              '“All of them,” says Sister Marrow. “They have the sweetest voices.” She tilts her head. “Their mother may visit, of course, once they are settled.” It is word for word what she said on the eighth day, as if she keeps only the one sentence for mothers.',
          },
        ],
        beats: [
          {
            id: 'performance',
            lines: [
              '“For the performance, Majesty. There is always a performance, in the end. The bell will ring, and everyone who has ever been kind to the Abbey will be there to hear it.”',
              '“The bell has no clapper,” says someone in the gallery. Sister Marrow turns toward the voice and smiles at it until it stops.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'If the emperor is busy with the war tonight, Sister, I could sit at the front in the crown’s place. I am a coward about cellars, but chapels I can manage.',
              },
              '“Oh, would you?” says Sister Marrow, and for the first time she sounds truly pleased. “She is so very fond of you.”',
            ],
            options: [
              {
                id: 'accept',
                label:
                  'Accept for yourself. The emperor will sit at the front.',
                effects: {
                  affinity: { abbey: 10 },
                  flags: ['rehearsal-attended'],
                },
                response:
                  'Sister Marrow smiles so warmly that the throne room feels briefly too hot. “She will be so glad,” she says. Komodo looks at the floor, as if listening for a tune.',
              },
              {
                id: 'decline',
                label: 'Decline. Nobody from this court sits at the front.',
                effects: { affinity: { abbey: -5 } },
                response:
                  '“Of course,” says Sister Marrow. “Another time. There will be other rehearsals, until there is a performance.” She bows to Komodo on her way out, a little deeper than she bowed to you.',
              },
              {
                id: 'evidence',
                label:
                  'Show her the tracks on the mission road, and ask whether the children walk them to lessons.',
                requires: { flags: ['mission-road-tracks'] },
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  flags: ['abbey-confronted'],
                },
                response:
                  'Sister Marrow looks at the drawing of the small footprints for a long time. “They lead to lessons, Majesty,” she says, and her voice does not change at all. Komodo, very quietly, withdraws his offer to attend.',
              },
              {
                id: 'send-komodo',
                label:
                  'Send Young Komodo to the rehearsal in the crown’s place.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['d36-komodo-at-rehearsal'],
                },
                response:
                  '“I will take notes,” says Komodo, and he goes up the mission road at dusk with his ledger under his arm. He comes back after midnight smelling of candle wax. His notes, when you ask for them, are very thorough and say nothing at all.',
              },
              {
                id: 'decoy',
                label:
                  'Accept, and sit at the front, so every sister watches the emperor and not the cellar stair.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { lamplight: 1 },
                  flags: ['rehearsal-attended', 'd36-emperor-decoy'],
                },
                response:
                  'You sit at the front for three hours while a choir of children sings toward the floor. The Abbess holds your hand through all of it. Her hand is warm. You do not let go first, because letting go first would be noticed.',
              },
            ],
          },
          {
            id: 'teodor',
            speaker: 'Brother Teodor Lull',
            npc: 'F012',
            lines: [
              '“Sister Marrow. You have grown taller, or I have grown rounder. Both, I expect.”',
              {
                who: 'Sister Marrow',
                npc: 'sister-marrow',
                text: 'Brother Teodor. We pray for you every evening. The Abbess keeps your letters in a box beside her bed, and reads them when she cannot sleep.',
              },
              'Teodor turns his broad, mild face to the throne. “I served soup in that chapel for six years, Majesty. The rehearsal is not for the bell. It never was. Whatever you do tonight, do not sit at the front.”',
              {
                who: 'Sister Marrow',
                npc: 'sister-marrow',
                text: 'Brother Teodor was always so imaginative. It is why we love his letters.',
              },
            ],
            options: [
              {
                id: 'accept',
                label: 'Accept anyway. The emperor will not be frightened off.',
                effects: {
                  affinity: { abbey: 10 },
                  flags: ['rehearsal-attended'],
                },
                response:
                  'Sister Marrow smiles so warmly that the throne room feels briefly too hot. “She will be so glad,” she says. Teodor closes his eyes and does not open them until she has gone.',
              },
              {
                id: 'decline',
                label: 'Decline for the whole court. Nobody sits at the front.',
                effects: { affinity: { abbey: -5 } },
                response:
                  'Teodor lets out a breath he seems to have held for six years. “Of course,” says Sister Marrow. “Another time. There will be other rehearsals, until there is a performance.”',
              },
              {
                id: 'teodor-goes',
                label:
                  'Let Teodor go in the emperor’s place, and keep the sisters’ eyes on the front row.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['d36-teodor-at-rehearsal'],
                },
                response:
                  'Teodor nods as though he had expected it. “I will sing flat on purpose,” he says. “It is the one thing in that chapel they cannot bear.” Sister Marrow takes his arm at the door, very gently, the way you take the arm of someone who might run.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 37,
    title: 'The Market That Closed',
    briefings: [
      {
        id: 'stalls-shut',
        source: 'The market court',
        text: 'Half the Ledger’s stalls did not open this morning.',
        truth: true,
      },
      {
        id: 'ledger-abbey',
        source: 'Young Komodo’s runner',
        text: 'The Ledger has never lent a single coin to the Abbey.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'loans-called',
        source: 'Factor Tallow’s clerk',
        text: 'The Ledger is calling in its loans across the kingdom.',
        truth: true,
      },
    ],
    komodo:
      'Merchants close their stalls when they can smell the end of something, Your Majesty. Usually it is the end of credit. Factor Tallow will want to be paid, or to be promised something better than payment.',
    quests: [],
    audiences: [
      {
        id: 'd37-market-closed',
        title: 'The Market That Closed',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Factor Tallow taps a clipboard against her palm, very fast, like a small brass clock. Through the long windows behind her the market court is half shuttered, and the stallholders stand in their doorways with their arms folded, waiting to see what the throne will do.',
          '“The Ledger is not lending into a war it cannot price, Majesty. Pay down what the crown owes, or give me something worth more than brass, and the stalls open tomorrow.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Ledger has priced worse wars than this one, Factor. It is not the war that frightens you. It is not knowing who will be paying for it afterwards.',
          },
          'Tallow does not look at him. “Your advisor is very clever, Majesty,” she says. “He is nearly always right about prices.”',
        ],
        options: [
          {
            id: 'ask-books',
            label:
              'Ask the Factor who else owes the Ledger, besides the crown.',
            effects: {},
            response:
              'The clipboard stops tapping. Tallow looks at you as if you had asked a merchant how she feels: something nobody has ever paid her to answer.',
            next: 'books',
          },
          {
            id: 'pay',
            label: 'Pay down the crown’s debt.',
            requires: { cost: 50 },
            effects: {
              local: { ledger: 4 },
              clearFlags: ['ledger-crisis'],
              flags: ['ledger-paid'],
            },
            response:
              'Tallow counts the brass without looking at it, which is how you know she is good. “Tomorrow,” she says. “Early.”',
          },
          {
            id: 'monopoly',
            label: 'Give the Ledger the Saltroad salt licence.',
            effects: {
              local: { ledger: 3 },
              affinity: { saltroad: -15 },
              flags: ['ledger-monopoly'],
            },
            response:
              'Tallow’s whiskers twitch. “Now that,” she says, “is worth more than brass.” Somewhere on the Saltroad, a pelican will be very angry by supper.',
          },
          {
            id: 'rustline',
            label: 'Buy from the Rustline salvagers instead.',
            requires: { affinity: { rustline: 'neutral' } },
            effects: {
              local: { ledger: -3 },
              affinity: { rustline: 15 },
              flags: ['rustline-market'],
            },
            response:
              'Tallow laughs out loud. By evening the empty stalls are full of magpies selling bolts, glass and engine parts at prices nobody can follow.',
          },
          {
            id: 'refuse',
            label: 'The crown will not be priced by merchants.',
            effects: { local: { ledger: -5 }, flags: ['ledger-closed'] },
            response:
              '“Then the crown can shop elsewhere,” says Tallow, and leaves her clipboard behind so that you can see the sums.',
          },
        ],
        beats: [
          {
            id: 'books',
            lines: [
              '“Everyone owes the Ledger, Majesty. The Saltroad. The Old Houses. Hollow Bell, twice over. The Abbey—”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Abbey has never borrowed a coin from the Ledger, Factor. They are a charity. Nobody lends to a charity. It is what makes it a charity.',
              },
              'Tallow’s pen stops a hair above the page. “As your advisor says,” she says, and writes nothing. “I keep my clients’ confidences, Majesty. Some of my clients sit closer to the throne than I do.”',
              'She lets that lie on the floor between you for exactly as long as it takes Komodo to start talking about grain.',
            ],
            options: [
              {
                id: 'pay',
                label: 'Pay down the debt in brass, and keep it simple.',
                requires: { cost: 50 },
                effects: {
                  local: { ledger: 4 },
                  clearFlags: ['ledger-crisis'],
                  flags: ['ledger-paid'],
                },
                response:
                  'Tallow counts the brass without looking at it. “Tomorrow,” she says. “Early.” At the door she pauses, as if she might say something else about the Abbey, and then does not.',
              },
              {
                id: 'monopoly',
                label: 'Give the Ledger the Saltroad salt licence.',
                effects: {
                  local: { ledger: 3 },
                  affinity: { saltroad: -15 },
                  flags: ['ledger-monopoly'],
                },
                response:
                  'Tallow’s whiskers twitch. “Now that,” she says, “is worth more than brass.” Somewhere on the Saltroad, a pelican will be very angry by supper.',
              },
              {
                id: 'rustline',
                label: 'Let the Rustline fill the empty stalls instead.',
                requires: { affinity: { rustline: 'neutral' } },
                effects: {
                  local: { ledger: -3 },
                  affinity: { rustline: 15 },
                  flags: ['rustline-market'],
                },
                response:
                  'Tallow laughs out loud. By evening the empty stalls are full of magpies selling bolts, glass and engine parts at prices nobody can follow.',
              },
              {
                id: 'refuse',
                label:
                  'The crown will not be priced by merchants, or by hints.',
                effects: { local: { ledger: -5 }, flags: ['ledger-closed'] },
                response:
                  '“Then the crown can shop elsewhere,” says Tallow, and leaves her clipboard behind so that you can see the sums. One line has been scratched out so hard the pen went through the page.',
              },
              {
                id: 'read-debts',
                label:
                  'Ask to read the Ledger’s book of the crown’s debts, every line, here and now.',
                effects: {
                  local: { ledger: -2, lamplight: 2 },
                  flags: ['d37-crown-debts-read'],
                },
                response:
                  'Tallow hands it over the way someone hands over a knife, blade first. The crown’s debts run to nine pages. Page six is lamp oil, on credit, delivered up the mission road, in a careful hand that leaves a small dot before every number, as if the pen had tapped there first.',
              },
              {
                id: 'houses',
                label: 'Let the Old Houses stand surety for the crown’s debt.',
                effects: {
                  local: { ledger: 2, 'old-houses': 3, yard: -2 },
                  flags: ['d37-houses-surety'],
                },
                response:
                  'Lady Vask signs the surety without reading it, which means she read it last night. “The Old Houses are always glad to help the crown,” she says, “and to be remembered for it at the table.” The Yard hears about it by supper, and does not like the sound of it.',
              },
            ],
          },
        ],
      },
      {
        id: 'd37-dark-yard',
        title: 'The Dark Yard',
        speaker: 'Foreman Dunmore Ash of the Yard',
        npc: 'dunmore-ash',
        faction: 'yard',
        requires: { flags: ['ledger-page-burned'] },
        lines: [
          'Foreman Ash comes up the carpet with a cold lamp in each hand and sets them down on the step of the dais, one, two, like a verdict.',
          '“The ovens are out, Majesty. The lamps are out. The Yard has baked by candle for five nights, and it is the Abbey that sells the candles.”',
          '“Keeper Vellum says somebody has been buying oil in the crown’s name, and none of it came here. He also says the page that proved it went into your brazier.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A clerical error, Foreman, and an embarrassing one. The crown chose not to shame a good clerk in a hard season. I would have chosen the same.',
          },
        ],
        options: [
          {
            id: 'truth',
            label:
              'Tell him the truth: the crown burned the page to keep a scandal out of the war.',
            effects: {
              local: { yard: 2, 'old-houses': -2 },
              flags: ['d37-burn-admitted'],
            },
            response:
              'Ash looks at you for a long time. “Thank you for saying it,” he says. “The Yard can work in the dark. It does not like being lied to in it.” He leaves the lamps where they are.',
          },
          {
            id: 'oil',
            label:
              'Buy the Yard a winter’s oil from the Saltroad, at the crown’s expense.',
            requires: { cost: 25 },
            effects: {
              local: { yard: 3 },
              affinity: { saltroad: 5 },
              flags: ['d37-yard-oil-bought'],
            },
            response:
              'The barrels come up the road by evening. The Yard lights every lamp it owns and leaves them burning all night, as if daring someone to come and count them.',
          },
          {
            id: 'silence',
            label: 'The crown does not answer to the Yard for its paperwork.',
            effects: {
              local: { yard: -3, 'old-houses': 2 },
              flags: ['d37-yard-silenced'],
            },
            response:
              'Ash picks up his lamps. In the gallery, a member of the Old Houses murmurs “quite right”, and the Foreman hears it, and so, by nightfall, does everyone who works for him.',
          },
        ],
      },
    ],
  },
  {
    day: 38,
    title: 'A Pardon for a Thief',
    briefings: [
      {
        id: 'satchel-grain',
        source: 'A Yard porter',
        text: 'The satchel was full of stolen grain.',
        truth: false,
      },
      {
        id: 'mole-caught',
        source: 'The Gate Watch',
        text: 'A young Mole was caught leaving the tower before dawn with a satchel.',
        truth: true,
      },
      {
        id: 'satchel-letters',
        source: 'Captain Dunmark',
        text: 'The satchel held sealed letters, with the seals already broken and pressed back.',
        truth: true,
      },
    ],
    komodo:
      'A thief with letters, Your Majesty. Thieves always say they were carrying something for somebody important. Let me talk to him. I am very good with frightened people.',
    quests: [],
    audiences: [
      {
        id: 'd38-pardon',
        title: 'A Pardon for a Thief',
        speaker: 'Captain Ferro Dunmark and a Mole prisoner',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Dunmark brings in a young Mole in chains, blinking at the light. He cannot be more than sixteen. He has been crying and has stopped, and wiped his face on his chains, so there is rust on his cheek.',
          '“I didn’t steal them. I carry them,” the Mole says. “Up the mission road at night, twice a week, for a year. I know who gives them to me. Pardon me and I’ll say the name.”',
          'Young Komodo has come down from the gallery, which he never does for thieves, and stands at the foot of the dais with his ledger under his arm. The boy keeps his eyes on the floor whenever Komodo speaks, as frightened people do.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Let me talk to him, Your Majesty. I am very good with frightened people. They can tell that I am frightened too.',
          },
        ],
        options: [
          {
            id: 'ask-letters',
            label: 'Ask Dunmark what was in the letters.',
            effects: {},
            response:
              'Dunmark empties the satchel onto the step of the dais. Every seal has been lifted with a warm knife and pressed back, very neatly, by someone who has done it many times.',
            next: 'letters',
          },
          {
            id: 'gran',
            label:
              'He has Granny Umber’s squint. Ask whether the crown once arrested his grandmother.',
            requires: { flags: ['mole-messenger-arrested'] },
            effects: {},
            response:
              '“You did,” the boy says, to the floor. “Gran says you’ll be fair. She says that about everybody, the first time.” Dunmark, very quietly, empties the satchel onto the step.',
            next: 'letters',
          },
          {
            id: 'lumen',
            label: 'Let Lumen Shale read the room while he talks.',
            requires: { follower: 'F010' },
            effects: {},
            response:
              'Lumen comes to stand beside the throne and says nothing at all for a while, which is how she does it.',
            next: 'lumen',
          },
          {
            id: 'pardon',
            label: 'Pardon him, and hear the name.',
            effects: {
              affinity: { moles: 10 },
              local: { 'gate-watch': -3 },
              flags: ['prisoner-pardoned'],
            },
            response:
              'The Mole leans close and whispers: “The one with the ledger. Under his arm, always.” Then he is gone through the gate. Half the court carries a ledger.',
          },
          {
            id: 'keep',
            label: 'He stays in the cells until he talks for free.',
            effects: {
              affinity: { moles: -10 },
              local: { 'gate-watch': 3 },
              flags: ['prisoner-kept'],
            },
            response:
              'The Mole goes back down the stairs. In the morning his cell is empty, and the lock has not been forced.',
          },
          {
            id: 'komodo',
            label: 'Let Young Komodo question him.',
            effects: { flags: ['prisoner-to-komodo'] },
            response:
              'Komodo takes the boy gently by the elbow and talks to him all the way down the stairs. By evening, Komodo reports with real regret, the prisoner has escaped.',
          },
        ],
        beats: [
          {
            id: 'letters',
            lines: [
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'Shipping lists, Majesty. Grain counts. And these: the Watch rosters. Which gate, which night, how many on the wall. My rosters, copied out fair by someone with a much better hand than mine.',
              },
              '“I can’t read, Majesty,” the boy says. “I just carry. Up the mission road and back. They give me supper at the top.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Rosters go out to the Freehold posts every week, Captain. That is what rosters are for. It would be stranger if nobody carried them.',
              },
              '“Not up the mission road, they don’t,” says Dunmark.',
            ],
            options: [
              {
                id: 'pardon',
                label: 'Pardon him, and hear the name.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -3 },
                  flags: ['prisoner-pardoned'],
                },
                response:
                  'The Mole leans close and whispers: “The one with the ledger. Under his arm, always.” Then he is gone through the gate. Half the court carries a ledger. You find yourself counting them anyway.',
              },
              {
                id: 'keep',
                label: 'He stays in the cells until he talks for free.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 3 },
                  flags: ['prisoner-kept'],
                },
                response:
                  'The Mole goes back down the stairs. In the morning his cell is empty, and the lock has not been forced.',
              },
              {
                id: 'komodo',
                label: 'Let Young Komodo question him, gently.',
                effects: { flags: ['prisoner-to-komodo'] },
                response:
                  'Komodo takes the boy gently by the elbow and talks to him all the way down the stairs. By evening, Komodo reports with real regret, the prisoner has escaped. The rosters have gone with him.',
              },
              {
                id: 'name-in-court',
                label:
                  'Pardon him, but only once he says the name in front of the whole court.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d38-named-in-court'],
                },
                response:
                  'The boy looks up at the gallery, at all the ledgers and all the coats. “I don’t know his name,” he whispers. “He has brass buttons.” Factor Tallow puts a hand flat over her waistcoat. So do several others. Then the boy is gone through the gate, and the court spends the evening looking at one another’s buttons.',
              },
              {
                id: 'rosters',
                label:
                  'Rewrite every watch roster tonight, and tell no one the new ones.',
                effects: {
                  local: { 'gate-watch': 2, ledger: -1 },
                  flags: ['d38-rosters-changed'],
                },
                response:
                  'Dunmark rewrites the rosters himself, by candle, and the boy goes back to the cells to wait. Near midnight Komodo looks into the guardroom to ask for a copy “for the ledger”. Dunmark looks at him for a long moment and says the ink is still wet.',
              },
            ],
          },
          {
            id: 'lumen',
            speaker: 'Lumen Shale',
            npc: 'F010',
            lines: [
              'The prairie dog stands up very straight beside the throne, the way her people do at the mouth of a burrow, and watches the room instead of the boy.',
              '“He isn’t lying, Majesty. And he isn’t afraid of the Watch. He’s afraid of somebody standing behind you, and he is trying very hard not to look at them.”',
              '“Clear the hall and he’ll talk. Keep it full, and he’ll say whatever keeps him alive.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A great many people are standing behind you, Your Majesty. It is where a court stands. It is rather the point of a throne.',
              },
            ],
            options: [
              {
                id: 'pardon',
                label:
                  'Pardon him here, in front of everyone, and hear the name.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -3 },
                  flags: ['prisoner-pardoned'],
                },
                response:
                  'The Mole leans close and whispers: “The one with the ledger. Under his arm, always.” Then he is gone through the gate. Lumen watches the whole court at once, and does not say which of them flinched.',
              },
              {
                id: 'keep',
                label: 'He stays in the cells until he talks for free.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 3 },
                  flags: ['prisoner-kept'],
                },
                response:
                  'The Mole goes back down the stairs. “Somebody will come for him tonight,” Lumen says. In the morning his cell is empty, and the lock has not been forced.',
              },
              {
                id: 'komodo',
                label: 'Let Young Komodo question him.',
                effects: { flags: ['prisoner-to-komodo'] },
                response:
                  'Komodo takes the boy gently by the elbow. Lumen steps aside to let them pass, and keeps her eyes on the boy’s face all the way to the stairs. By evening, Komodo reports with real regret, the prisoner has escaped.',
              },
              {
                id: 'clear-hall',
                label: 'Clear the hall. Everyone out, the advisor too.',
                effects: { flags: ['d38-hall-cleared'] },
                response:
                  'It takes a while. Komodo goes last, with a bow and a small, rueful smile, and the doors close behind him on the sound of his claw tapping the ledger, once.',
                next: 'alone',
              },
            ],
          },
          {
            id: 'alone',
            lines: [
              'With the hall empty, the boy talks to the floor in a rush, as if the words had been waiting at the top of a stair.',
              '“He’s kind. He bought me boots. He said the letters were for keeping people safe, and that one day a great many people would be kept safe all at once, and I would be glad I helped.”',
              '“He has a ledger, under his arm, always. And he taps on it when he’s thinking. Like this.” The boy taps two fingers on the chain at his wrist, once, twice, and then stops, because he has seen your face.',
            ],
            options: [
              {
                id: 'pardon',
                label: 'Pardon him, and let him go alone.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -3 },
                  flags: ['prisoner-pardoned'],
                },
                response:
                  'You unlock the chains yourself. The boy is out of the postern before Dunmark can find him a coat, and he does not look back at the tower once.',
              },
              {
                id: 'keep',
                label:
                  'He stays in the cells, where the crown can find him again.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 3 },
                  flags: ['prisoner-kept'],
                },
                response:
                  'The Mole goes back down the stairs without a word. In the morning his cell is empty, and the lock has not been forced.',
              },
              {
                id: 'escort-home',
                label:
                  'Pardon him, and send him home to the burrows tonight with an escort he can trust.',
                requires: { cost: 10 },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['d38-boy-escorted'],
                },
                response:
                  'Dunmark takes him himself, by the back stair and the tunnel road, with two of the Watch walking behind. At the burrow mouth the boy turns and says something to the captain that Dunmark will not repeat to you, not even when you order him to.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 39,
    title: 'Saltroad Congress',
    briefings: [
      {
        id: 'congress-called',
        source: 'Oriel Saltmarsh',
        text: 'Every kingdom faction has agreed to meet at one table tonight.',
        truth: true,
      },
      {
        id: 'seating-done',
        source: 'The steward',
        text: 'Young Komodo has drawn up the seating himself.',
        truth: true,
      },
      {
        id: 'verge-absent',
        source: 'A Saltroad herald',
        text: 'The Black Verge Court has refused to send anyone.',
        truth: false,
      },
    ],
    komodo:
      'I have seated everyone where they will be most comfortable, Your Majesty. It took all night. The only chair I could not place was yours, so I left it at the head, where it has always been.',
    quests: [],
    audiences: [
      {
        id: 'd39-congress',
        title: 'Saltroad Congress',
        speaker: 'Oriel Saltmarsh of the Saltroad',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'The long table runs the length of the throne room. Every banner on the map has a chair at it, even the plum one. Candles in tall Abbey sticks march down its middle, a gift, and the light they give is very even and very still.',
          'Young Komodo stands at the far end with a seating chart, ticking off each guest as they sit, like the host of a wedding nobody quite wanted.',
          'Oriel Saltmarsh rises, beak first. “Majesty, your advisor has seated the Abbess at your right hand and the Moles by the door. Before we begin: is that where the crown wants them?”',
        ],
        options: [
          {
            id: 'ask-seating',
            label: 'Ask Komodo to explain his seating to the table.',
            effects: {},
            response:
              'Komodo rises at once, as if he had been hoping someone would ask, and taps the chart with one claw.',
            next: 'seating',
          },
          {
            id: 'keep',
            label: 'Keep Komodo’s seating.',
            effects: {
              affinity: { abbey: 10, moles: -5 },
              flags: ['congress-komodo-seating'],
            },
            response:
              'The Abbess settles in at your right hand and pats your sleeve. Komodo, at the end of the table, writes something down.',
          },
          {
            id: 'reseat',
            label: 'Move the Moles and the Freeholds up to the throne.',
            effects: {
              affinity: { moles: 10, freeholds: 5, abbey: -10 },
              flags: ['congress-reseated'],
            },
            response:
              'Chairs scrape. Granny Umber sits beside the throne and looks delighted. Komodo’s claw taps his ledger twice and stops.',
          },
          {
            id: 'shoe',
            label:
              'Set the small shoe from the Abbey cellar in front of the Abbess.',
            requires: { flags: ['abbey-crypt-evidence'] },
            effects: {
              affinity: { abbey: -20, 'hollow-bell': 10, freeholds: 10 },
              strength: { abbey: -1 },
              flags: ['abbess-shamed'],
            },
            response:
              'The whole table goes silent. The Abbess looks at the shoe, and then at you, and smiles exactly as warmly as before. Komodo is the first to look away.',
          },
          {
            id: 'front',
            label: 'Ask the table for a common front against the plum riders.',
            effects: {
              affinity: { 'black-verge': -10, saltroad: 5, freeholds: 5 },
              flags: ['congress-common-front'],
            },
            response:
              'Most of the table agrees, loudly. The Envoy of the Black Verge agrees too, softly, which is worse.',
          },
          {
            id: 'waystation',
            label:
              'Before anything else, answer Oriel for the waystation the crown let burn.',
            requires: { flags: ['waystation-abandoned'] },
            effects: {
              affinity: { saltroad: 10, freeholds: -5 },
              local: { 'old-houses': -1 },
              flags: ['d39-waystation-answered'],
            },
            response:
              'You say it plainly, in front of everyone: the crown chose, and the Saltroad paid. Oriel’s beak opens and closes. “Nobody has ever said that to me at a table,” she says. Across from her, Hester Plowright folds her arms and studies the ceiling.',
          },
          {
            id: 'thistledown',
            label:
              'Before anything else, stand and answer Hester for Thistledown.',
            requires: { flags: ['thistledown-abandoned'] },
            effects: {
              affinity: { freeholds: 10, saltroad: -5 },
              local: { 'old-houses': -1 },
              flags: ['d39-thistledown-answered'],
            },
            response:
              'Hester Plowright hears you out with her basket on her knees. When you finish she says, “Barns can be rebuilt,” and then, “Seed grain can’t,” and then nothing at all. Oriel Saltmarsh counts something on her feathers under the table.',
          },
        ],
        beats: [
          {
            id: 'seating',
            speaker: 'Young Komodo',
            npc: 'young-komodo',
            lines: [
              '“The Abbess at your right hand, Your Majesty, because she feeds more mouths than anyone at this table, and a hungry kingdom should be able to see who feeds it.”',
              '“The Moles by the door, because Granny Umber asked to sit near a way out, and I respect a guest who plans ahead. The plum chair beside Lady Vask, because she is the only one of us who can bore an envoy into peace.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'I shall take that as a compliment, Master Komodo. I take most of what you say as a compliment. It saves time.',
              },
              {
                who: 'Oriel Saltmarsh',
                npc: 'oriel-saltmarsh',
                text: 'And the chair at the foot, advisor? There is one more chair at this table than there are guests.',
              },
              '“That one,” says Komodo, “is for whoever does not come.” He smiles round the table, and sits down in the chair beside it.',
            ],
            options: [
              {
                id: 'keep',
                label:
                  'Keep Komodo’s seating. He has thought about it more than anyone.',
                effects: {
                  affinity: { abbey: 10, moles: -5 },
                  flags: ['congress-komodo-seating'],
                },
                response:
                  'The Abbess settles in at your right hand and pats your sleeve. Komodo, at the end of the table, writes something down, and underlines it.',
              },
              {
                id: 'reseat',
                label: 'Move the Moles and the Freeholds up to the throne.',
                effects: {
                  affinity: { moles: 10, freeholds: 5, abbey: -10 },
                  flags: ['congress-reseated'],
                },
                response:
                  'Chairs scrape. Granny Umber sits beside the throne and looks delighted. The Abbess takes the chair by the door without a word. Komodo’s claw taps his ledger twice and stops.',
              },
              {
                id: 'shoe',
                label:
                  'Set the small shoe from the Abbey cellar in front of the Abbess.',
                requires: { flags: ['abbey-crypt-evidence'] },
                effects: {
                  affinity: { abbey: -20, 'hollow-bell': 10, freeholds: 10 },
                  strength: { abbey: -1 },
                  flags: ['abbess-shamed'],
                },
                response:
                  'The whole table goes silent. The Abbess looks at the shoe, and then at you, and smiles exactly as warmly as before. Komodo is the first to look away.',
              },
              {
                id: 'front',
                label:
                  'Ask the table for a common front against the plum riders.',
                effects: {
                  affinity: { 'black-verge': -10, saltroad: 5, freeholds: 5 },
                  flags: ['congress-common-front'],
                },
                response:
                  'Most of the table agrees, loudly. The Envoy of the Black Verge agrees too, softly, which is worse. Komodo writes the Envoy’s answer down word for word.',
              },
              {
                id: 'vask-chairs',
                label:
                  'Let Lady Vask chair the table, and the Old Houses speak first.',
                effects: {
                  affinity: { moles: -5 },
                  local: { 'old-houses': 3, yard: -2 },
                  flags: ['d39-vask-chairs'],
                },
                response:
                  'Lady Vask takes the chair as if it had always been hers. She runs the table beautifully, and by midnight every faction has agreed to something, and none of them can quite remember agreeing. Komodo, beside the empty chair, applauds.',
              },
              {
                id: 'crown-at-foot',
                label:
                  'Leave the head of the table empty, and take the empty chair at the foot yourself.',
                effects: {
                  affinity: { freeholds: 5, abbey: -5 },
                  local: { 'old-houses': -2, yard: 2 },
                  flags: ['d39-crown-at-foot'],
                },
                response:
                  'The table goes very quiet as you sit down at the foot, between Komodo and a Mole. Hester Plowright laughs out loud. The Abbess, alone now at the head beside the empty throne, folds her hands and waits. Komodo does not look at you for the rest of the night.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 40,
    title: 'The Keep’s Empty Chairs',
    briefings: [
      {
        id: 'watch-reassigned',
        source: 'Captain Dunmark',
        text: 'Half the night watch was reassigned to the mission road by an order under the crown’s seal.',
        truth: true,
      },
      {
        id: 'roads-quiet',
        source: 'Young Komodo’s runner',
        text: 'The roads to the Abbey are quiet tonight.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'chairs-empty',
        source: 'The steward',
        text: 'Several chairs at the long table were left empty after the Congress.',
        truth: true,
      },
    ],
    komodo:
      'Whatever happens, Your Majesty, remember that I always told you the price of things. Nearly always. Tonight I would like to ride to the Saltroad and settle some accounts, if the emperor allows.',
    quests: [],
    audiences: [
      {
        id: 'd40-sealed-order',
        title: 'An Order Under Seal',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'The long table from the Congress still stands. A few chairs are pushed back, cups half full, as if the guests stepped out a moment ago and decided not to return. Captain Dunmark walks past every one of them with a folded order in his fist.',
          '“Half my night watch has orders to stand on the mission road tonight, Majesty. To guard pilgrims, it says. For the Abbey’s rehearsal.”',
          '“It is under your seal. I have served three crowns, and I know a seal from a stamp. I do not remember you telling me.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'You signed forty orders the day of the Congress, Your Majesty. I brought them in a stack. That one was the thirty-first. The pilgrims asked for an escort, and the roads are quiet tonight, so it seemed a small thing to give.',
          },
        ],
        options: [
          {
            id: 'ask-seal',
            label: 'Ask Dunmark who else touches the crown’s seal.',
            effects: {},
            response:
              'Dunmark does not look at Komodo. It is a very deliberate kind of not looking.',
            next: 'seal',
          },
          {
            id: 'recall',
            label: 'Recall the night watch to the walls.',
            effects: {
              local: { 'gate-watch': 2, 'old-houses': -2 },
              flags: ['d40-watch-recalled'],
            },
            response:
              'Dunmark tears the order in half, and then, after a moment’s thought, in half again. “I will write to the sisters,” Komodo says mildly. “They will understand. They always do.” In the gallery, Lady Vask remarks to nobody in particular that a seal used to mean something.',
          },
          {
            id: 'stand',
            label:
              'Let the order stand. The crown gave its word, even if it does not remember giving it.',
            effects: {
              local: { 'gate-watch': -2, 'old-houses': 2 },
              flags: ['d40-seal-order-stood'],
            },
            response:
              'Dunmark folds the order back along its creases and puts it inside his tabard, over his heart, like a thing he will want to show someone later.',
          },
        ],
        beats: [
          {
            id: 'seal',
            lines: [
              '“You, Majesty. The steward, to carry it from room to room. And whoever keeps the order box.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'That would be me, Captain. I keep the box. I keep most boxes. That is all an advisor is, in the end: a lizard with a great many boxes.',
              },
              '“At the gate on the tenth day, Majesty, you swore us something,” says Dunmark. “I am not asking you to swear it again. I am asking what it is worth tonight.”',
            ],
            options: [
              {
                id: 'recall',
                label:
                  'Recall the night watch. Every one of them, back on the walls.',
                effects: {
                  local: { 'gate-watch': 2, 'old-houses': -2 },
                  flags: ['d40-watch-recalled'],
                },
                response:
                  'Dunmark tears the order in half, and then in half again. “I will write to the sisters,” Komodo says mildly. “They will understand.” He watches the pieces fall as if he were reading them.',
              },
              {
                id: 'stand',
                label:
                  'Let it stand. Komodo has never sealed a wrong order yet.',
                effects: {
                  local: { 'gate-watch': -2, 'old-houses': 2 },
                  flags: ['d40-seal-order-stood'],
                },
                response:
                  '“As the emperor says.” Dunmark folds the order back along its creases and puts it inside his tabard, over his heart. Komodo thanks you, warmly, and you notice that he does not thank Dunmark.',
              },
              {
                id: 'own-eyes',
                label:
                  'Order that nothing leaves the tower under seal tonight unless the emperor has read it.',
                effects: {
                  local: { 'gate-watch': 1, ledger: -2 },
                  flags: ['d40-seals-checked'],
                },
                response:
                  '“Very wise,” says Komodo at once. “I will bring you everything.” At midnight he brings a stack of papers as tall as his ledger: grain chits, a wedding licence, a dog’s name for the Yard’s register. Every one of them is exactly what it says.',
              },
            ],
          },
        ],
      },
      {
        id: 'd40-archive',
        title: 'The Archive’s Request',
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['ledger-page-kept'] },
        lines: [
          'On an ordinary day it takes Keeper Vellum most of an hour to cross the hall. Today he arrives before the herald has finished, with his ring of archive keys clutched tight in one hand so that they will not ring.',
          '“I have matched the hand, Majesty. I would rather not say it in this room. I would like leave to move the Archive’s most important books out of the tower tonight. Tonight, Majesty.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Moving books in the dark, Keeper? Take the good lanterns from the Yard. I will sign for the oil.',
          },
        ],
        options: [
          {
            id: 'ask-name',
            label: 'Ask him, quietly, to say whose hand it is.',
            effects: {},
            response:
              'Vellum looks past your shoulder at the doorway for a long, slow moment, which for him is a very long moment indeed.',
            next: 'name',
          },
          {
            id: 'evacuate',
            label: 'Move the books tonight.',
            effects: { local: { lamplight: 3 }, flags: ['archive-evacuated'] },
            response:
              'By midnight a line of Lamplight clerks is carrying crates down the back stair. Vellum carries the last one himself, and does not explain.',
          },
          {
            id: 'morning',
            label: 'It can wait until morning.',
            effects: { local: { lamplight: -2 } },
            response:
              'Vellum closes his eyes for a long moment. “As the emperor wishes,” he says. “I will sleep in the Archive tonight.”',
          },
        ],
        beats: [
          {
            id: 'name',
            lines: [
              '“Not in this room, Majesty. Rooms have doors, and doors have people standing in them.”',
              '“I will tell you this much, because it is not a name. The hand that wrote the oil is the hand that wrote forty orders for the crown’s seal this month. I have copies of them all. They are very beautiful. Whoever wrote them was proud of their sevens.”',
              '“I would like to take the books, and the copies, somewhere that does not have this room in it. Tonight.”',
            ],
            options: [
              {
                id: 'evacuate',
                label: 'Move the books tonight, and the copies with them.',
                effects: {
                  local: { lamplight: 3 },
                  flags: ['archive-evacuated'],
                },
                response:
                  'Vellum bows, which takes a while, and is gone. By midnight a line of Lamplight clerks is carrying crates down the back stair. The last crate is the copies. He carries it himself.',
              },
              {
                id: 'morning',
                label: 'It can wait until morning.',
                effects: { local: { lamplight: -2 } },
                response:
                  'Vellum closes his eyes for a long moment. “As the emperor wishes,” he says. “I will sleep in the Archive tonight, with the door locked, and the lamps out.”',
              },
              {
                id: 'sealed-name',
                label:
                  'Keep the books here. Ask him instead to write the name down, seal it, and give it to you.',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['d40-vellum-sealed-name'],
                },
                response:
                  'Vellum writes one word on the back of an archive slip, very slowly, folds it twice and presses his thumb into the wax. “Read it when you are alone, Majesty,” he says. You are not alone again all evening.',
              },
            ],
          },
        ],
      },
      {
        id: 'd40-quiet-word',
        title: 'A Quiet Word',
        speaker: 'Young Komodo',
        npc: 'young-komodo',
        lines: [
          'By evening the long table has been carried away, all but a few chairs nobody claimed. The lamps along the hall have been trimmed low to save oil.',
          'Young Komodo waits until the throne room is empty. He has his ledger under his arm and his coat buttoned to the throat.',
          'He does not come up the carpet the way petitioners do. He comes up the side, along the wall, the way he has every evening for forty days, and stops at the foot of the dais with one claw resting on the ledger’s spine.',
          '“Forty days, Your Majesty. I have liked them more than I expected to. I should like to ride out tonight on the crown’s business, and I should like you not to wait up.”',
          '“The Saltroad accounts. Nothing that would interest a throne. A few promises that came due all at once, the way promises do.”',
        ],
        options: [
          {
            id: 'sit',
            label: 'Come down from the throne and sit beside him on the step.',
            effects: {},
            response:
              'He looks at the step as if it might be a trick, and then sits, carefully, with the ledger across his knees. Up close he smells of ink and road dust and, very faintly, of candle wax.',
            next: 'step',
          },
          {
            id: 'accounts',
            label:
              'Ask which accounts need settling on the Saltroad after dark.',
            effects: {},
            response:
              'Komodo smiles. “The kind that are cheaper to settle in the dark, Your Majesty. Most of them are.” His claw taps the ledger once.',
            next: 'accounts',
          },
          {
            id: 'leave',
            label: 'Go. The crown trusts you.',
            effects: { flags: ['komodo-leave-granted'] },
            response:
              'Komodo bows lower than he has ever bowed. At the door he stops, taps his claw on the ledger once, twice, and does not write anything down.',
          },
          {
            id: 'stay',
            label: 'Stay. The court needs its advisor tonight.',
            effects: { flags: ['komodo-asked-to-stay'] },
            response:
              '“Of course,” says Komodo, and smiles, and stays. He is wonderful company all evening. At midnight he excuses himself to check the gate.',
          },
          {
            id: 'escort',
            label: 'Double the Gate Watch, and send them with him.',
            requires: { local: { 'gate-watch': 10 } },
            effects: {
              local: { 'gate-watch': -2 },
              flags: ['komodo-escorted', 'gate-doubled'],
            },
            response:
              'Komodo looks at the doubled watch for a long, quiet moment. “Thorough,” he says. “I taught you that.” Captain Dunmark rides out beside him.',
          },
        ],
        beats: [
          {
            id: 'step',
            lines: [
              '“On your first morning, a mayor came up that carpet before the herald had finished your name, and I thought: this one will be eaten by the end of the week. I was wrong. I am almost never wrong about prices, Your Majesty. I was wrong about you.”',
              '“You kept asking what things cost. Not in brass. In people. Nobody had asked me that in years. I had stopped asking it myself.”',
              'Far off, up the mission road, the Abbey is rehearsing again. It reaches the tower less as a sound than as a pressure, the way weather does before it breaks. Tonight it does not sound much like a rehearsal.',
              '“May I ask you something? Not as your advisor. As whatever I am when the hall is empty.”',
            ],
            options: [
              {
                id: 'ask',
                label: '“Ask.”',
                effects: {},
                response:
                  'He nods, and for a long while does not ask anything at all.',
                next: 'question',
              },
              {
                id: 'beds',
                label:
                  'Ask him first whether he ever learned where the Abbey’s children go.',
                effects: {},
                response:
                  'Komodo looks at the empty petitioners’ bench for a long time. “I told you to ask that, on the eighth day. Not today, perhaps, I said.” He turns a page of the ledger without reading it. “I have been asking every day since. I found out. Ask me tomorrow what it cost.”',
                next: 'question',
              },
              {
                id: 'coldbrook',
                label:
                  'Ask whether he thinks the Coldbrook children are happy at the Abbey.',
                requires: { flags: ['abbey-took-coldbrook-children'] },
                effects: {},
                response:
                  '“Warm beds,” Komodo says. “Lessons.” He says it in Sister Marrow’s voice, very exactly, and then seems to hear himself, and stops.',
                next: 'question',
              },
            ],
          },
          {
            id: 'accounts',
            lines: [
              '“Oriel Saltmarsh’s factor holds three of the crown’s notes, and a fourth that is, technically, mine. A caravan master on the salt flats owes the court eleven barrels of lamp oil that I would very much like to see before winter. That sort of thing.”',
              'He says it lightly, and fluently, and he does not open the ledger to check a single figure. In forty days you have never once heard him quote a number without opening the ledger first.',
              '“The roads are quiet tonight. I made sure of it. I will be back before anyone misses me, and if anyone does, tell them I went to count barrels. Nobody ever follows a lizard who is counting barrels.”',
            ],
            options: [
              {
                id: 'leave',
                label: 'Then go and count your barrels. The crown trusts you.',
                effects: { flags: ['komodo-leave-granted'] },
                response:
                  'Komodo bows lower than he has ever bowed. At the door he stops, taps his claw on the ledger once, twice, and does not write anything down.',
              },
              {
                id: 'trust',
                label:
                  'Accept it. Accounts are his business, and he has never failed them.',
                effects: {},
                response:
                  '“Never,” Komodo agrees. “Not once. I am very proud of that.” For a moment he sounds as if it hurts.',
                next: 'question',
              },
              {
                id: 'roads',
                label:
                  'Tell him Dunmark says half the night watch was sent up the mission road under the crown’s seal.',
                effects: {},
                response:
                  '“Pilgrims,” says Komodo at once. “For the rehearsal. You signed it with the rest. The roads are quiet tonight, Your Majesty, because I asked for them to be.” It is a perfectly good answer. He has had it ready.',
                next: 'question',
              },
              {
                id: 'oil',
                label:
                  'Ask whether the clerk who could not tell oil from wax was ever corrected.',
                requires: { flags: ['ledger-page-to-komodo'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“Corrected,” Komodo repeats. He opens the ledger at last, to a page near the back, and there is the Keeper’s page, folded exactly where he tucked it on the thirty-second day. He looks at it as if it had arrived there on its own.',
                next: 'cornered',
              },
              {
                id: 'hand',
                label:
                  'Tell him what Hollin saw in the oil entries: left-handed, and a tap of the pen before every number.',
                requires: { flags: ['ledger-hand-studied'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  'Komodo’s claw is resting on the ledger. It is his left. He looks down at it, and very slowly lifts it away, and does not put it back.',
                next: 'cornered',
              },
              {
                id: 'boy',
                label:
                  'Repeat what the Mole boy whispered at the gate: the one with the ledger, under his arm, always.',
                requires: { flags: ['prisoner-pardoned'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“Half the court carries a ledger,” Komodo says, which is what you told yourself on the thirty-eighth day. Then, more quietly: “But you did not tell anyone else what he said. You told me.”',
                next: 'cornered',
              },
              {
                id: 'escaped',
                label:
                  'Ask how the Mole boy got out of a locked cell on the night you gave him to Komodo.',
                requires: { flags: ['prisoner-to-komodo'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“I said I was sorry about that,” Komodo says. “I was. I am.” He does not say that he does not know how.',
                next: 'cornered',
              },
              {
                id: 'reports',
                label:
                  'Remind him that the morning reports were once wrong in the same careful way, and the Archive never found the runner.',
                requires: { flags: ['false-reports-traced'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“Runners,” says Komodo. “They will say anything for a bowl of soup.” He says it to the ledger, not to you.',
                next: 'cornered',
              },
            ],
          },
          {
            id: 'question',
            lines: [
              'Komodo is quiet for a while. When he speaks again it is not about accounts, or the war, or anything on the map.',
              '“Suppose a physician came to court. A good one. Suppose she told you the kingdom had a sickness in it, low down, older than this tower, older than the Bell. And suppose the only cure was for the crown to be set down.”',
              '“Not broken. Not stolen. Set down, gently, by someone who loved it, so that the thing underneath would have no reason to come up and take it.”',
              '“Would you want to be asked first? Or would you rather someone who loved you simply did it, and let you hate them for the rest of your life?”',
              'His claw is not tapping. For the first time in forty days, it is perfectly still.',
            ],
            options: [
              {
                id: 'ask-me',
                label: '“Ask me. A crown that is not asked is only a hat.”',
                effects: { flags: ['d40-komodo-told-ask'] },
                response:
                  'Komodo laughs, a real laugh, startled out of him. “Only a hat,” he says. “I will write that down.” He does not write it down.',
                next: 'door',
              },
              {
                id: 'do-it',
                label: '“Let them do it. That is what love is for, sometimes.”',
                effects: { flags: ['d40-komodo-told-do-it'] },
                response:
                  'Komodo closes his eyes. “Thank you,” he says, so softly that you are not certain it was meant for you to hear.',
                next: 'door',
              },
              {
                id: 'no-cure',
                label: '“There is no such cure. Only people who sell it.”',
                effects: { flags: ['d40-komodo-told-no-cure'] },
                response:
                  '“That is what I would have said,” Komodo says, “forty days ago.” He smiles at you as if you had passed a test he hoped you would fail, or failed one he hoped you would pass. You cannot tell which.',
                next: 'door',
              },
              {
                id: 'who',
                label: '“Who is the physician, Komodo?”',
                effects: { flags: ['d40-komodo-asked-who'] },
                response:
                  '“Oh, nobody,” he says. “A hypothetical. I collect them. You would be amazed how little a hypothetical costs to keep, Your Majesty. Almost nothing, right up until the day it doesn’t.”',
                next: 'door',
              },
            ],
          },
          {
            id: 'cornered',
            lines: [
              'Komodo shuts the ledger. Not hard. He has never in forty days done anything hard. He simply closes it, folds his hands on the cover, and looks at you with a cold, still attention you have only ever seen him turn on other people.',
              '“You have been counting, Your Majesty. Good. I taught you that. I am, believe it or not, very proud of you.”',
              '“I am going to say something now, and I would like you to remember that I said it. Everything I have done in this court, I have done for this court. Some of it you would thank me for. Some of it you would not. Ask me tomorrow which is which.”',
              '“Tonight I would only like to ride to the Saltroad, and count some barrels.”',
            ],
            options: [
              {
                id: 'tomorrow',
                label: 'Then you will ask him tomorrow.',
                effects: { flags: ['d40-komodo-asked-tomorrow'] },
                response:
                  '“Tomorrow,” he agrees, and his voice catches on the word, just slightly, like a coat on a nail.',
                next: 'door',
              },
              {
                id: 'now',
                label: 'Ask him now, and wait however long it takes.',
                effects: { flags: ['d40-komodo-pressed'] },
                response:
                  'You wait. The lamps gutter. At last Komodo says, “I have never once lied to you about the price of anything.” It is true, as far as you know. It is also not an answer.',
                next: 'door',
              },
              {
                id: 'mercy',
                label:
                  'Tell him that whatever it is, you would rather hear it from him than from anyone else.',
                effects: { flags: ['d40-komodo-offered-mercy'] },
                response:
                  'For a moment you think he will tell you. His mouth opens. Then the sound from the mission road, the bell that has no clapper, does something that is not quite a sound, and he shuts it again. “From me,” he says. “Yes. You will.”',
                next: 'door',
              },
            ],
          },
          {
            id: 'door',
            lines: [
              'Komodo stands, brushes the dust of the step from his coat, and fastens the top button, which was already fastened.',
              '“Some advice, Your Majesty, since it is the last thing I am good for tonight. Whoever your friends are on the map this evening, those are your walls tomorrow. Choose the ones with roofs.”',
              '“Keep the Keeper close. He is slow, and slow things survive. And if you ever hear a bell that has no clapper, do not go toward it. Whatever it sounds like. Whoever is calling.”',
              '“There. That is all the free advice in the tower. The rest has a price, and I have already paid it.”',
            ],
            options: [
              {
                id: 'leave',
                label: 'Let him go. The crown trusts him.',
                effects: { flags: ['komodo-leave-granted'] },
                response:
                  'Komodo bows lower than he has ever bowed. At the door he stops, taps his claw on the ledger once, twice, and does not write anything down.',
              },
              {
                id: 'stay',
                label: 'Ask him to stay. The court needs its advisor tonight.',
                effects: { flags: ['komodo-asked-to-stay'] },
                response:
                  '“Of course,” says Komodo, and smiles, and stays. He is wonderful company all evening, funnier than you have ever heard him. At midnight he excuses himself to check the gate.',
              },
              {
                id: 'escort',
                label:
                  'Let him go, with Captain Dunmark and a doubled watch beside him.',
                requires: { local: { 'gate-watch': 10 } },
                effects: {
                  local: { 'gate-watch': -2 },
                  flags: ['komodo-escorted', 'gate-doubled'],
                },
                response:
                  'Komodo looks at the doubled watch for a long, quiet moment. “Thorough,” he says. “I taught you that.” Captain Dunmark rides out beside him, and does not take his eyes off the ledger.',
              },
              {
                id: 'friend',
                label:
                  'Tell him he has been a friend, and that you meant every day of it.',
                effects: { flags: ['d40-komodo-called-friend'] },
                response:
                  'Komodo stands very still in the lamplight. “So have you,” he says. “That was never the problem.” He bows, and goes, and at the door he does not look back, which in forty days he has never once failed to do.',
              },
              {
                id: 'follow',
                label:
                  'Let him go, and ask Rook Bramble to follow at a distance.',
                requires: { follower: 'F001' },
                effects: { flags: ['d40-komodo-followed'] },
                response:
                  'Rook is out of the postern before Komodo reaches the stables. Near midnight the hare comes back alone, ears flat. “He took the Saltroad fork,” Rook says. “Then he got down and led his horse back across the scrub to the mission road, walking in the old ruts so his own would lie. He knew someone would be reading them. I think he hoped it was me.”',
              },
              {
                id: 'cell',
                label:
                  'Have the Watch hold him in the cells until morning, friend or not.',
                effects: { flags: ['d40-komodo-held'] },
                response:
                  'Komodo does not argue. He goes down the stair between two of Dunmark’s people, chatting about the weather, his ledger tucked under his arm. At the bottom he asks the guard, kindly, which cell the Mole boy had.',
              },
            ],
          },
        ],
      },
    ],
  },
]

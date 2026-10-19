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
          'The Ford is under arrows, Majesty, and the Freeholds are asking for the Gate Watch by name.',
          'I can march half my people to the Ford by noon. The tower will be thin behind them. Your call. I would rather it was not mine.',
        ],
        options: [
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
              '“Walls it is,” says Dunmark, and looks out at the smoke over the Ford for a long moment.',
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
          'Keeper Vellum lays a single page on the arm of the throne, very slowly, and smooths it flat.',
          '“Lamp oil, Majesty. The crown has paid for enough oil this year to light the Saltroad end to end. It was all delivered up the mission road. The Abbey uses candles.”',
          '“The entries are in a careful hand. The court’s own hand. I have not yet matched it, and I thought you should decide whether I do.”',
        ],
        options: [
          {
            id: 'match',
            label: 'Match the hand, quietly.',
            effects: {
              local: { lamplight: 2 },
              flags: ['ledger-page-kept'],
            },
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
          'A hen in a mud-heavy skirt marches straight up to the throne, egg basket and all, and does not curtsey.',
          '“The Saltroad has guards and money and a hundred wagons. Thistledown has me and my sister and the goats. You know who needs you more, Majesty. Say it out loud.”',
        ],
        options: [
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
          'Elder Corvane perches on the back of the empty petitioners’ bench and folds his wings like a closed umbrella.',
          '“The rain was lent, Majesty. The fields drank it. Now the rain is owed. We do not take back rain, so we take something else.”',
        ],
        options: [
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
          'Granny Umber taps her pipe-cane on the throne room floor, as if checking it for hollows.',
          '“Saffron’s trestle or my tunnel, Majesty. Not both. The trestle is quicker. The tunnel is hidden. One of them will still be there when you need a way out, and one will not.”',
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
          'A white goat in grey brings a card, hand-lettered, sealed with candle wax.',
          '“The Abbess would be honoured if the emperor attended tonight’s rehearsal. There is a seat at the front. There is always a seat at the front.”',
        ],
        options: [
          {
            id: 'accept',
            label: 'Accept, and sit at the front.',
            effects: {
              affinity: { abbey: 10 },
              flags: ['rehearsal-attended'],
            },
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
          'Factor Tallow taps a clipboard against her palm, very fast, like a small brass clock.',
          '“The Ledger is not lending into a war it cannot price, Majesty. Pay down what the crown owes, or give me something worth more than brass, and the stalls open tomorrow.”',
        ],
        options: [
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
            id: 'refuse',
            label: 'The crown will not be priced by merchants.',
            effects: {
              local: { ledger: -5 },
              flags: ['ledger-closed'],
            },
            response:
              '“Then the crown can shop elsewhere,” says Tallow, and leaves her clipboard behind so that you can see the sums.',
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
          'Dunmark brings in a young Mole in chains, blinking at the light. He cannot be more than sixteen.',
          '“I didn’t steal them. I carry them,” the Mole says. “Up the mission road at night, twice a week, for a year. I know who gives them to me. Pardon me and I’ll say the name.”',
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
          'The long table runs the length of the throne room. Every banner on the map has a chair at it, even the plum one.',
          'Oriel Saltmarsh rises, beak first. “Majesty, your advisor has seated the Abbess at your right hand and the Moles by the door. Before we begin: is that where the crown wants them?”',
        ],
        options: [
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
        id: 'd40-quiet-word',
        title: 'A Quiet Word',
        speaker: 'Young Komodo',
        npc: 'young-komodo',
        lines: [
          'Young Komodo waits until the throne room is empty. He has his ledger under his arm and his coat buttoned to the throat.',
          '“Forty days, Your Majesty. I have liked them more than I expected to. I should like to ride out tonight on the crown’s business, and I should like you not to wait up.”',
        ],
        options: [
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
      },
      {
        id: 'd40-archive',
        title: 'The Archive’s Request',
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['ledger-page-kept'] },
        lines: [
          'Keeper Vellum arrives faster than anyone has ever seen him move.',
          '“I have matched the hand, Majesty. I would rather not say it in this room. I would like leave to move the Archive’s most important books out of the tower tonight. Tonight, Majesty.”',
        ],
        options: [
          {
            id: 'evacuate',
            label: 'Move the books tonight.',
            effects: {
              local: { lamplight: 3 },
              flags: ['archive-evacuated'],
            },
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
      },
    ],
  },
]

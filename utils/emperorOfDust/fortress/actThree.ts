import type { DayDef, QuestDef } from './types'

// Act III, Days 21-30, "Kind Roads" (conductor DAY-PLAN.md): the Black
// Verge at the border, the mission road, the Abbess at court, Flint's trial,
// Mara's secret page and the terms of shelter before the faction wars
// resolve on the map. Harm to children stays off-screen: neat empty cots,
// tracks that only lead in, a door kept locked (WORLD-GUIDE.md).

export const ACT_THREE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d22-ford-bodies',
    title: 'Bodies at the Ford',
    summary:
      'Three travellers were pulled from the Eastern Ford at dawn. The Old Houses are already blaming the Moles. Find out who they were before someone hangs the wrong people.',
    region: 'east-ford',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['tracking', 'records', 'medicine'],
    rewards: {
      success: {
        affinity: { moles: 10 },
        local: { lamplight: 2 },
        flags: ['ford-bodies-identified'],
      },
      partial: { flags: ['ford-bodies-identified'] },
      failure: {
        affinity: { moles: -15 },
        local: { 'old-houses': 2 },
        flags: ['moles-blamed'],
      },
    },
    expired: {
      affinity: { moles: -10 },
      flags: ['moles-blamed'],
    },
    outcomes: {
      success:
        'They were not Moles and not killed by Moles. Each carried a mission-road travel token, the kind the Abbey gives to families it sends home. None of them had been sent home.',
      partial:
        'The travellers carried mission-road tokens. That is all anyone could learn before the river took them back.',
      failure:
        'The party came back with nothing, and the Old Houses filled the silence: the Moles did it. The burrows will not forget.',
      expired: 'Nobody looked closely. The Moles were blamed by suppertime.',
    },
  },
  {
    id: 'q-d23-blue-lantern',
    title: 'Follow the Blue Lantern',
    summary:
      'A blue lantern moves along the old rail line every third night. Smugglers, the Ledger says. Follow it and see where it goes.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'high' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'tunnels'],
    rewards: {
      triumph: {
        brass: 35,
        affinity: { rustline: 10 },
        flags: ['blue-lantern-route'],
      },
      success: {
        brass: 20,
        affinity: { rustline: 5 },
        flags: ['blue-lantern-route'],
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The blue lantern led to a Rustline cache of medicine and old-world glass, and a smuggler who was very happy to share rather than hang.',
      success:
        'The lantern carries medicine past the Ledger’s tolls to the Freehold farms. The court now knows the route, and so does its purse.',
      partial: 'The lantern went underground and the party did not follow.',
      failure: 'The lantern went out, and the party walked home in the dark.',
      expired: 'The lantern moved on to another line.',
    },
  },
  {
    id: 'q-d24-mission-road',
    title: 'The Mission Road',
    summary:
      'A Freehold mother last saw her son on the mission road, walking toward the Abbey with a sister in grey. Walk it and see what the road remembers.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking'],
    rewards: {
      success: {
        local: { lamplight: 2 },
        affinity: { freeholds: 5 },
        flags: ['mission-road-tracks'],
      },
      failure: { affinity: { abbey: -5 } },
    },
    expired: { affinity: { freeholds: -5 } },
    outcomes: {
      success:
        'The road was swept clean, but not well enough. There are small footprints going toward the Abbey gate, many of them, and none coming back.',
      partial: 'The road had been swept that morning. Very carefully.',
      failure:
        'Two sisters in grey met the party on the road and walked them, kindly, all the way home.',
      expired: 'Nobody walked the road. The mother stopped coming to court.',
    },
  },
  {
    id: 'q-d24-coldbrook-visit',
    title: 'A Visit to the Children',
    summary:
      'Wenna Coldbrook has not been allowed to see the children she gave to the Abbey. Go with her and insist.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { abbey: -10, freeholds: 10 },
        flags: ['coldbrook-visit', 'abbey-cots-empty'],
      },
      failure: { affinity: { abbey: -5 } },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'Sister Marrow showed them the dormitory: four neat cots, made tight, with nothing under the blankets. “They are at lessons,” she said. They were not at lessons.',
      partial: 'The gate stayed closed. A sister promised a visit next week.',
      failure: 'The sisters were so sorry, but the children were sleeping.',
      expired: 'Wenna went alone. She has not come back.',
    },
  },
  {
    id: 'q-d26-dry-well',
    title: 'A Friendly Raid',
    summary:
      'Gristle Vane asks for help against a worse band: the jackals of the dry well, who take people, not goats.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, freeholds: 5 },
        strength: { jackalwire: 1 },
        flags: ['dry-well-cleared'],
      },
      failure: {
        affinity: { jackalwire: -5 },
        strength: { freeholds: -1 },
      },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'The dry-well jackals are scattered. Vane threw a feast, and this time nobody brought knives.',
      partial:
        'The jackals pulled back to the dry well. They will come out again.',
      failure:
        'The dry well held, and two Freehold farms were emptied that night.',
      expired: 'Vane fought alone, and lost wagons.',
    },
  },
  {
    id: 'q-d27-flint-evidence',
    title: 'The Case Against Flint',
    summary:
      'The Old Houses say Duchess Flint has been passing grain to the Moles. Read the ledgers before the court passes judgment.',
    region: 'hollow-bell',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [{ stat: 'wits', band: 'high' }],
    danger: 'none',
    tags: ['records'],
    rewards: {
      success: {
        local: { lamplight: 3, 'old-houses': -2 },
        flags: ['flint-cleared'],
      },
      failure: { flags: ['flint-doubted'] },
    },
    expired: { flags: ['flint-doubted'] },
    outcomes: {
      success:
        'The grain went to the Moles, yes: from the Old Houses’ own granary, sold at three times the market price. Flint had been trying to stop it.',
      partial:
        'The ledgers are muddled. Nobody is cleared, nobody is condemned.',
      failure: 'The ledgers say what the Old Houses wanted them to say.',
      expired: 'The court never read the ledgers.',
    },
  },
  {
    id: 'q-d28-rot-cure',
    title: 'Charms Against Rot',
    summary:
      'The Black Verge envoys offer a cure for the grain rot spreading in the Yard’s stores. Test it before anyone eats it.',
    region: 'black-verge',
    faction: 'black-verge',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['medicine'],
    rewards: {
      success: {
        local: { yard: 3 },
        affinity: { 'black-verge': 5 },
        flags: ['verge-cure-tested'],
      },
      failure: {
        local: { yard: -3 },
        flags: ['verge-cure-tainted'],
      },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'The charm works on rot. It also leaves the grain faintly cold to the touch, always. The Yard eats it anyway.',
      partial: 'The charm slowed the rot. Nobody likes the taste.',
      failure:
        'The cure did something to the testers’ dreams. They will not say what.',
      expired: 'The rot spread through another storeroom.',
    },
  },
  {
    id: 'q-d30-hold-the-line',
    title: 'Hold the Border Line',
    summary:
      'War is coming between the factions, and the map will change tomorrow. Stand with the weakest of the court’s friends.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        strength: { freeholds: 2, saltroad: 1 },
        affinity: { freeholds: 10, saltroad: 5 },
      },
      success: {
        strength: { freeholds: 1, saltroad: 1 },
        affinity: { freeholds: 5 },
      },
      failure: { strength: { freeholds: -1 } },
    },
    expired: { strength: { freeholds: -1 } },
    outcomes: {
      triumph: 'The line held, and two other factions noticed who held it.',
      success: 'The line held.',
      partial: 'The line bent and held, just.',
      failure: 'The line broke, and the Freeholds paid for it.',
      expired: 'Nobody stood on the line.',
    },
  },
]

export const ACT_THREE_DAYS: readonly DayDef[] = [
  {
    day: 21,
    title: 'A Captain’s Promise',
    briefings: [
      {
        id: 'verge-banners',
        source: 'The map room',
        text: 'A new banner hangs at the far border: the Black Verge Court.',
        truth: true,
      },
      {
        id: 'vane-offer',
        source: 'A Jackalwire runner',
        text: 'Gristle Vane wants to talk alliance, against the riders in plum.',
        truth: true,
      },
      {
        id: 'verge-peaceful',
        source: 'A travelling preacher',
        text: 'The Black Verge Court has sent word that it wants nothing but trade.',
        truth: false,
      },
    ],
    komodo:
      'Courts that want only trade do not send riders before merchants, Your Majesty. Vane wanting an alliance is the most honest thing he has ever done: he is afraid.',
    quests: [],
    audiences: [
      {
        id: 'd21-captains-promise',
        title: 'A Captain’s Promise',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'You have seen the plum riders, Majesty. So have I. They came through the canyon at night and did not stop to rob anybody, which is the most frightening thing I have ever seen a raider do.',
          'The Pack will stand with the tower against them. For a price, naturally. I am frightened, not reformed.',
        ],
        options: [
          {
            id: 'alliance',
            label: 'An alliance, on the Pack’s terms.',
            effects: {
              affinity: { jackalwire: 20, freeholds: -10 },
              strength: { jackalwire: 1 },
              flags: ['pack-alliance'],
            },
            response:
              'Vane spits in his palm and holds it out. It is, apparently, a great honor.',
          },
          {
            id: 'truce',
            label: 'An alliance, if the Pack stops raiding the Freeholds.',
            requires: { affinity: { jackalwire: 'neutral' } },
            effects: {
              affinity: { jackalwire: 10, freeholds: 5 },
              flags: ['pack-truce'],
            },
            response:
              'Vane winces as if you had asked for his coat. “For a season,” he says. “Then we talk again.”',
          },
          {
            id: 'refuse',
            label: 'The crown does not ally with raiders.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { 'old-houses': 2 },
            },
            response:
              'Vane bows. “Then I hope the plum riders feel the same about crowns.”',
          },
        ],
      },
    ],
  },
  {
    day: 22,
    title: 'Bodies at the Ford',
    briefings: [
      {
        id: 'ford-bodies',
        source: 'Eastern Ford ferrymen',
        text: 'Three travellers were pulled from the Ford at dawn.',
        truth: true,
      },
      {
        id: 'mole-knives',
        source: 'Lady Vask’s steward',
        text: 'The travellers were killed with Mole digging knives.',
        truth: false,
      },
      {
        id: 'tokens',
        source: 'A ferry boy',
        text: 'Each of the dead wore a little wooden token on a string.',
        truth: true,
      },
    ],
    komodo:
      'The Old Houses would blame the Moles for the weather if it helped them, Your Majesty. Find out who those travellers were. Quickly, before the Moles find out they are being blamed.',
    quests: ['q-d22-ford-bodies'],
    audiences: [
      {
        id: 'd22-blame',
        title: 'Justice for the Ford',
        speaker: 'Lady Ottoline Vask of the Old Houses',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        lines: [
          'Three dead at the Ford, Majesty, and the Mole tunnels run right beneath it. The Old Houses ask for justice, which in this case means arrests.',
        ],
        options: [
          {
            id: 'blame',
            label: 'Arrest the Mole cell nearest the Ford.',
            effects: {
              affinity: { moles: -15 },
              local: { 'old-houses': 3 },
              flags: ['moles-blamed'],
            },
            response:
              'Lady Vask inclines her head. The Moles will hear of it before the arrests are made.',
          },
          {
            id: 'evidence',
            label: 'Nobody is arrested until the court knows who died.',
            effects: { local: { 'old-houses': -2, lamplight: 1 } },
            response:
              '“How judicious,” says Lady Vask, in the tone others use for “how unfortunate.”',
          },
        ],
      },
    ],
  },
  {
    day: 23,
    title: 'The Blue Lantern',
    briefings: [
      {
        id: 'blue-lantern',
        source: 'The Ledger’s factor',
        text: 'A blue lantern moves along the old rail line every third night: smugglers.',
        truth: true,
      },
      {
        id: 'medicine-cheap',
        source: 'Freehold reeves',
        text: 'Medicine is suddenly cheap on the Freehold farms.',
        truth: true,
      },
      {
        id: 'lantern-ghost',
        source: 'A rail-yard child',
        text: 'The blue lantern is carried by a ghost with no feet.',
        truth: false,
      },
    ],
    komodo:
      'Ghosts do not lower the price of medicine, Your Majesty. Somebody is moving goods past the Ledger’s tolls, and the Ledger is very upset about it, which tells you something about the tolls.',
    quests: ['q-d23-blue-lantern'],
    audiences: [
      {
        id: 'd23-smugglers',
        title: 'Smugglers on the Rail Line',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Someone is moving medicine past our tolls, Majesty. It is theft, from the crown as much as from the Ledger.',
          'License the route to the Ledger and the crown takes a fifth. Or shut it down. Either way, it must not stay free.',
        ],
        options: [
          {
            id: 'license',
            label: 'License the route to the Ledger.',
            effects: {
              brass: 20,
              local: { ledger: 3 },
              affinity: { freeholds: -5 },
              flags: ['rail-route-licensed'],
            },
            response:
              'Factor Tallow produces a license she had, by remarkable luck, already drafted.',
          },
          {
            id: 'free',
            label: 'Medicine should be cheap. Leave the route alone.',
            effects: {
              local: { ledger: -3, yard: 1 },
              affinity: { freeholds: 5 },
            },
            response: 'Factor Tallow writes something down in a different ink.',
          },
        ],
      },
    ],
  },
  {
    day: 24,
    title: 'The Mother’s Petition',
    briefings: [
      {
        id: 'missing-boy',
        source: 'A Freehold mother',
        text: 'Her son walked toward the Abbey with a sister in grey three weeks ago and has not written.',
        truth: true,
      },
      {
        id: 'abbey-letters',
        source: 'A sister of the Abbey',
        text: 'Every child at the Abbey writes home on the first of the month.',
        truth: false,
      },
      {
        id: 'notices',
        source: 'Hollow Bell’s notice board',
        text: 'Hollow Bell’s notice board has eleven notices for missing children.',
        truth: true,
      },
    ],
    komodo:
      'Eleven notices is a great many for one town, Your Majesty. I would not accuse anybody. I would walk the road.',
    quests: [],
    audiences: [
      {
        id: 'd24-mothers-petition',
        title: 'The Mother’s Petition',
        speaker: 'A Freehold mother',
        faction: 'freeholds',
        lines: [
          'My boy went to the Abbey with a sister in grey, Majesty. They said he would have lessons and three meals and write home every month.',
          'He has not written. They say he is well. They will not let me see him.',
        ],
        options: [
          {
            id: 'search',
            label: 'Send someone to walk the mission road.',
            effects: {},
            response:
              'She does not thank you. She sits down on the throne-room step and waits.',
            postsQuests: ['q-d24-mission-road'],
          },
          {
            id: 'ask-abbey',
            label: 'Write to the Abbess and ask, politely.',
            effects: {
              affinity: { abbey: 5 },
              flags: ['asked-abbey-politely'],
            },
            response:
              'The Abbess writes back the same day, in a lovely hand: the boy is happy, well, and very busy with his lessons.',
          },
        ],
      },
      {
        id: 'd24-coldbrook',
        title: 'Wenna Comes Back',
        speaker: 'Wenna Coldbrook',
        faction: 'freeholds',
        requires: { flags: ['abbey-took-coldbrook-children'] },
        lines: [
          'You told me I could visit, Majesty. Sister Marrow said so too. I have been to the gate four times.',
          'They are always at lessons. Or sleeping. Or at prayer. I only want to see their faces.',
        ],
        options: [
          {
            id: 'go-with-her',
            label: 'Send someone with her, and insist on the visit.',
            effects: {},
            response:
              'Wenna holds the baby, the only one she kept, very tight.',
            postsQuests: ['q-d24-coldbrook-visit'],
          },
          {
            id: 'trust',
            label: 'The Abbey has its rules. Be patient.',
            effects: {
              affinity: { abbey: 5, freeholds: -10 },
              flags: ['wenna-turned-away'],
            },
            response:
              'Wenna leaves without a word, and does not come to court again.',
          },
        ],
      },
    ],
  },
  {
    day: 25,
    title: 'A Visitor from the Mission',
    briefings: [
      {
        id: 'abbess-coming',
        source: 'The Gate Watch',
        text: 'The Abbess herself is on the road to the fortress, on foot, with two sisters.',
        truth: true,
      },
      {
        id: 'abbey-census',
        source: 'Young Komodo’s own runner',
        text: 'The Abbey’s census lists every child by name, and every child is accounted for.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'abbess-gift',
        source: 'The kitchens',
        text: 'The Abbess sent ahead a cartload of bread for the Yard.',
        truth: true,
      },
    ],
    komodo:
      'I have seen the Abbey’s census myself, Your Majesty; it is very thorough. She is a remarkable woman. I hope the court will receive her warmly. We need friends who feed people.',
    quests: [],
    audiences: [
      {
        id: 'd25-the-abbess',
        title: 'A Visitor from the Mission',
        speaker: 'The Abbess',
        npc: 'the-abbess',
        faction: 'abbey',
        lines: [
          'What a fine court, Your Majesty, and what a fine young advisor. Young Komodo has been such a friend to the mission.',
          'I walked here to say only this: the wasteland is cruel to little ones, and the Abbey takes them in. We ask nothing but to be left to our work.',
        ],
        options: [
          {
            id: 'honor',
            label: 'Honor the Abbess before the court.',
            effects: {
              affinity: { abbey: 15 },
              local: { yard: 2 },
              flags: ['abbess-honored'],
            },
            response:
              'The Abbess smiles, warm and patient. Komodo bows lower than he bows to you.',
          },
          {
            id: 'tracks',
            label: 'Ask her about the tracks on the mission road.',
            requires: { flags: ['mission-road-tracks'] },
            effects: {
              affinity: { abbey: -10 },
              local: { lamplight: 2 },
              flags: ['abbess-questioned'],
            },
            response:
              'The Abbess does not stop smiling. “Children run to us, Your Majesty. They do not run away.” Behind her, Komodo has gone very still.',
          },
          {
            id: 'cots',
            label: 'Ask her why the Coldbrook children’s cots were empty.',
            requires: { flags: ['abbey-cots-empty'] },
            effects: {
              affinity: { abbey: -15, freeholds: 5 },
              flags: ['abbess-questioned', 'abbess-warned'],
            },
            response:
              'For one moment the smile is gone, and the face beneath it is perfectly flat. Then it is back. “Lessons,” says the Abbess. “Such busy children.”',
          },
          {
            id: 'tax',
            label: 'The Abbey has never paid the crown’s tithe. It will now.',
            effects: {
              brass: 30,
              affinity: { abbey: -15 },
            },
            response:
              'The Abbess pays at once, in brass, from a purse that does not seem to empty.',
          },
        ],
      },
    ],
  },
  {
    day: 26,
    title: 'A Friendly Raid',
    briefings: [
      {
        id: 'dry-well',
        source: 'Jackalwire runners',
        text: 'The jackals of the dry well are raiding Freehold farms and taking people, not goats.',
        truth: true,
      },
      {
        id: 'mole-truce',
        source: 'Granny Umber’s cell',
        text: 'The Mole cells will talk truce, if the talks the crown opened were meant.',
        truth: true,
      },
      {
        id: 'vane-dead',
        source: 'A gleeful Old House cousin',
        text: 'Gristle Vane was killed by his own lieutenants last night.',
        truth: false,
      },
    ],
    komodo:
      'Vane will die old and in bed, Your Majesty, out of spite. The dry-well jackals are another thing: nobody bargains with them.',
    quests: [],
    audiences: [
      {
        id: 'd26-friendly-raid',
        title: 'A Friendly Raid',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'The dry-well jackals are taking people, Majesty, not goats. Even raiders have rules. Help the Pack clear them out.',
        ],
        options: [
          {
            id: 'help',
            label: 'Ride with the Pack against the dry well.',
            effects: {},
            response:
              'Vane grins with every tooth. “Bring the big one. The rhino, if you have her.”',
            postsQuests: ['q-d26-dry-well'],
          },
          {
            id: 'decline',
            label: 'The Pack can handle its own kind.',
            effects: { affinity: { jackalwire: -10 } },
            response: '“Our own kind,” Vane repeats. He does not smile.',
          },
        ],
      },
      {
        id: 'd26-mole-truce',
        title: 'A Genuine Truce',
        speaker: 'Keel Understone, surveyor of the Mole cells',
        faction: 'moles',
        requires: {
          flags: ['mole-talks-opened'],
          affinity: { moles: 'wary' },
        },
        lines: [
          'Granny Umber sent me. The talks you opened were real, so the cells will meet you halfway: water rights for the burrows, and the cells stand down.',
          'I came myself because I wanted to see if the crown would keep its word. If it does, I would work for it. Against the witches, anyway.',
        ],
        options: [
          {
            id: 'truce',
            label: 'Grant the burrows their water rights.',
            effects: {
              affinity: { moles: 20 },
              local: { 'old-houses': -3 },
              strength: { moles: 1 },
              recruitable: ['F009'],
              flags: ['mole-truce'],
            },
            response:
              'Keel nods once, the way surveyors nod at a wall that will hold. “Then I will stay a while,” they say.',
          },
          {
            id: 'half',
            label: 'Half the water now, the rest next season.',
            effects: {
              affinity: { moles: 5 },
              flags: ['mole-half-truce'],
            },
            response:
              '“Half a wall,” says Keel, “is a very good way to get wet.” They leave.',
          },
        ],
      },
    ],
  },
  {
    day: 27,
    title: 'The Trial of Flint',
    briefings: [
      {
        id: 'flint-accused',
        source: 'The Old Houses',
        text: 'The Old Houses accuse Duchess Flint of passing crown grain to the Moles.',
        truth: true,
      },
      {
        id: 'flint-confessed',
        source: 'An Old House steward',
        text: 'Duchess Flint has already confessed.',
        truth: false,
      },
      {
        id: 'grain-sold',
        source: 'The Lamplight Archive',
        text: 'Someone sold grain to the Mole burrows at three times the market price.',
        truth: true,
      },
    ],
    komodo:
      'Flint would rather be boiled than confess to something she did not do, Your Majesty. Grain sold at three times the price is not charity. Somebody profited. It was not a tortoise.',
    quests: [],
    audiences: [
      {
        id: 'd27-trial',
        title: 'The Trial of Flint',
        speaker: 'Lady Ottoline Vask and Duchess Flint',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        requires: { follower: 'F004' },
        lines: [
          'The Old Houses accuse your follower of theft from the crown, Majesty. Grain, to the Moles. We ask for judgment.',
          'Flint says nothing in her own defense, only: “Read the ledgers.”',
        ],
        options: [
          {
            id: 'acquit',
            label: 'Acquit her on her word.',
            effects: {
              local: { 'old-houses': -4 },
              affinity: { moles: 5 },
              flags: ['flint-acquitted'],
            },
            response: 'Flint bows slowly. Lady Vask does not.',
          },
          {
            id: 'investigate',
            label: 'Read the ledgers first.',
            effects: {},
            response:
              '“Good,” says Flint. It is the most she has said all day.',
            postsQuests: ['q-d27-flint-evidence'],
          },
          {
            id: 'censure',
            label: 'Censure her, to keep the Old Houses quiet.',
            effects: {
              local: { 'old-houses': 4 },
              flags: ['flint-censured'],
            },
            response:
              'Flint accepts the censure without a word. She will remember it. So will the barracks.',
          },
        ],
      },
    ],
  },
  {
    day: 28,
    title: 'Charms Against Rot',
    briefings: [
      {
        id: 'rot',
        source: 'The Yard’s foreman',
        text: 'Grain rot is spreading through the Yard’s storerooms.',
        truth: true,
      },
      {
        id: 'verge-envoy',
        source: 'The Gate Watch',
        text: 'An envoy of the Black Verge Court waits at the gate in white gloves.',
        truth: true,
      },
      {
        id: 'verge-vampires',
        source: 'Tavern talk',
        text: 'Everyone in the Black Verge Court is a vampire.',
        truth: false,
      },
    ],
    komodo:
      'Some of them carry a condition, Your Majesty; not all, and not all the same one. What matters is that they never offer anything for free. Ask what the cure costs before you ask what it cures.',
    quests: [],
    audiences: [
      {
        id: 'd28-verge-envoy',
        title: 'Charms Against Rot',
        speaker: 'The Envoy of the Black Verge',
        npc: 'the-verge-envoy',
        faction: 'black-verge',
        lines: [
          'The Court has heard of your rot, Majesty. We have charms against it. A gift, between neighbours.',
          'There is one small thing. A courtier of ours has wandered from home, a black leopard with lovely manners. If they come to your gate, we would like them back.',
        ],
        options: [
          {
            id: 'accept',
            label: 'Accept the charms, and the condition.',
            effects: {
              affinity: { 'black-verge': 15 },
              local: { yard: 3 },
              strength: { 'black-verge': 1 },
              flags: ['verge-cures-accepted', 'promised-sable'],
            },
            response:
              'The envoy bows. “The Court never forgets a neighbour.” It sounds like a threat.',
          },
          {
            id: 'test',
            label: 'Accept the charms to test them first. Promise nothing.',
            effects: { affinity: { 'black-verge': 5 } },
            response: 'The envoy smiles. “Prudent.” The gloves stay on.',
            postsQuests: ['q-d28-rot-cure'],
          },
          {
            id: 'refuse',
            label: 'The crown will deal with its own rot.',
            effects: { affinity: { 'black-verge': -10 }, local: { yard: -2 } },
            response:
              'The envoy removes one glove, finger by finger, and leaves.',
          },
        ],
      },
      {
        id: 'd28-defector',
        title: 'A Plum Coat at the Gate',
        speaker: 'Sable Thorne',
        faction: 'black-verge',
        lines: [
          'I had hoped to arrive before my former colleagues, Majesty. I see I am late. I am asking for sanctuary, with impeccable manners.',
          'If you send me back, I will go. But I would very much rather not.',
        ],
        options: [
          {
            id: 'sanctuary',
            label: 'Grant sanctuary, openly.',
            effects: {
              affinity: { 'black-verge': -15 },
              recruitable: ['F016'],
              flags: ['sable-sheltered'],
            },
            response:
              'Sable bows, perfectly. The envoy, across the yard, watches without blinking.',
          },
          {
            id: 'hide',
            label: 'Hide Sable in the barracks and say nothing.',
            requires: { cost: 20 },
            effects: {
              affinity: { 'black-verge': -5 },
              recruitable: ['F016'],
              flags: ['sable-hidden'],
            },
            response:
              'The Watch is paid to forget a plum coat. Most of them do.',
          },
          {
            id: 'return',
            label: 'Return Sable to the envoy.',
            effects: {
              affinity: { 'black-verge': 20 },
              flags: ['sable-returned'],
            },
            response:
              'Sable does not argue. They walk to the envoy with their head high, and do not look back.',
          },
        ],
      },
    ],
  },
  {
    day: 29,
    title: 'The Mayor’s Secret',
    briefings: [
      {
        id: 'missing-page',
        source: 'The Lamplight Archive',
        text: 'A page has been cut from Hollow Bell’s town ledger, the year the drought began.',
        truth: true,
      },
      {
        id: 'mole-forgery',
        source: 'Young Komodo’s own runner',
        text: 'The cut page is a Mole forgery meant to ruin Mayor Reedbell.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'bell-water',
        source: 'Hollow Bell carters',
        text: 'Hollow Bell had water through the worst of the drought, when nobody else did.',
        truth: true,
      },
    ],
    komodo:
      'A forgery, Your Majesty, I am nearly sure; the Moles have every reason to ruin Mara. I would leave that page alone. Some ledgers are better closed.',
    quests: [],
    audiences: [
      {
        id: 'd29-mayors-secret',
        title: 'The Mayor’s Secret',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'You have heard about the page, Your Majesty. Of course you have.',
          'Hollow Bell had water when nobody else did. Water costs something. I paid it. I would pay it again. Do what you like with that.',
        ],
        options: [
          {
            id: 'pip',
            label: 'Let Pip read the page aloud.',
            requires: { follower: 'F005' },
            effects: {
              affinity: { abbey: -10, 'hollow-bell': -5 },
              local: { lamplight: 3 },
              flags: ['talk-pip-ledger', 'bell-abbey-ledger'],
            },
            response:
              'Pip reads it in a small, steady voice: water from the Abbey’s deep well, every season, in exchange for “the names of the town’s unclaimed children”. Mara does not look away.',
          },
          {
            id: 'expose',
            label: 'Expose the page to Hollow Bell.',
            effects: {
              affinity: { 'hollow-bell': -15 },
              local: { lamplight: 4 },
              flags: ['mara-exposed'],
            },
            response:
              'Mara nods as if she had expected nothing else. “They will choose another mayor,” she says. “They should.”',
          },
          {
            id: 'protect',
            label: 'Burn the page. The Bell needs its mayor.',
            effects: {
              affinity: { 'hollow-bell': 10 },
              local: { lamplight: -3 },
              flags: ['mara-protected'],
            },
            response:
              'Mara watches the page burn and says nothing at all. Komodo looks very relieved.',
          },
          {
            id: 'bargain',
            label: 'Keep the page, and Mara’s debt to the crown.',
            effects: {
              brass: 20,
              affinity: { 'hollow-bell': 5 },
              flags: ['mara-owes-crown'],
            },
            response: '“A debt,” says Mara. “Well. I know how those work.”',
          },
        ],
      },
    ],
  },
  {
    day: 30,
    title: 'Terms of Shelter',
    briefings: [
      {
        id: 'war-coming',
        source: 'Every runner at once',
        text: 'Three factions are mustering at once. The map will change by tomorrow.',
        truth: true,
      },
      {
        id: 'freeholds-weak',
        source: 'Freehold reeves',
        text: 'The Freeholds cannot hold their border alone.',
        truth: true,
      },
      {
        id: 'peace-signed',
        source: 'A hopeful herald',
        text: 'The factions have signed a peace at the Saltroad.',
        truth: false,
      },
    ],
    komodo:
      'No one has signed anything, Your Majesty. Tomorrow some banners on the map will be smaller, and some may be gone. Choose who shelters under the crown tonight.',
    quests: ['q-d30-hold-the-line'],
    audiences: [
      {
        id: 'd30-terms',
        title: 'Terms of Shelter',
        speaker: 'Envoys of three factions',
        faction: 'saltroad',
        lines: [
          'The Freeholds, the Saltroad and the Moles have each sent an envoy. Each asks the same thing: if the war comes to us tonight, will the crown open its gates?',
          'The fortress can shelter one of them properly. The others will have to fend for themselves.',
        ],
        options: [
          {
            id: 'freeholds',
            label: 'Shelter the Freeholds.',
            effects: {
              affinity: { freeholds: 10 },
              strength: { freeholds: 1 },
              flags: ['sheltered-freeholds'],
            },
            response:
              'The Freehold envoy weeps openly. The other two leave without a word.',
          },
          {
            id: 'saltroad',
            label: 'Shelter the Saltroad.',
            effects: {
              affinity: { saltroad: 10 },
              strength: { saltroad: 1 },
              local: { ledger: 2 },
              flags: ['sheltered-saltroad'],
            },
            response:
              'Oriel Saltmarsh’s envoy bows. The caravans roll in by midnight.',
          },
          {
            id: 'moles',
            label: 'Shelter the Moles.',
            requires: { affinity: { moles: 'neutral' } },
            effects: {
              affinity: { moles: 15 },
              strength: { moles: 1 },
              local: { 'old-houses': -3 },
              flags: ['sheltered-moles'],
            },
            response:
              'The Mole envoy blinks up at the gate, as if he had never once expected it to open.',
          },
        ],
      },
    ],
  },
]

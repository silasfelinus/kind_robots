import type { DayDef, QuestDef } from './types'

// Act I, Days 5-10 (conductor DAY-PLAN.md): the toll comes due, the first
// secret revealed, Komodo's first lie of his own, the Abbey's first offer,
// the first lethal quest, and the Gate Watch's oath before the map changes.

export const ACT_ONE_LATE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d05-toll-standoff',
    title: 'Hold the Toll Bridge',
    summary:
      'Captain Gristle Vane’s wagons are back at the southern bridge. Hold it open for the Saltroad carts without starting a war.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    tags: ['defense'],
    rewards: {
      triumph: {
        brass: 20,
        affinity: { saltroad: 15, jackalwire: -5 },
        local: { 'gate-watch': 3 },
        strength: { jackalwire: -1 },
      },
      success: {
        brass: 10,
        affinity: { saltroad: 10, jackalwire: -10 },
        local: { 'gate-watch': 2 },
      },
      partial: { affinity: { saltroad: 3, jackalwire: -5 } },
      failure: {
        affinity: { saltroad: -5, jackalwire: -5 },
        local: { 'gate-watch': -2 },
      },
    },
    expired: { affinity: { saltroad: -5 } },
    outcomes: {
      triumph:
        'The bridge stayed open for two days and the Pack went home with nothing but a sore opinion of the tower.',
      success:
        'The carts crossed. Gristle Vane watched every one of them and counted.',
      partial: 'Half the carts crossed before the wagons closed ranks again.',
      failure: 'The Pack held the bridge and laughed about it all night.',
      expired: 'Nobody went. The Saltroad carts took the long road again.',
    },
  },
  {
    id: 'q-d05-saltroad-escort',
    title: 'Raiders for Hire',
    summary:
      'Pay the Jackalwire to guard the Saltroad carts they used to rob. Someone has to make sure they actually do it.',
    region: 'saltroad',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, saltroad: 5 },
        flags: ['jackalwire-escort-pact'],
      },
      failure: { affinity: { saltroad: -10 }, brass: -10 },
    },
    expired: { affinity: { jackalwire: -5 } },
    outcomes: {
      success:
        'The Pack guarded the carts, and only ate one goat that was not theirs. The Saltroad calls that a pact.',
      partial: 'The carts arrived. Some of the cargo did not.',
      failure:
        'The escort vanished on the second night, along with three crates.',
      expired: 'The offer went stale. The Pack took it as an insult.',
    },
  },
  {
    id: 'q-d06-empty-stable',
    title: 'The Empty Stable',
    summary:
      'Every mount in the fortress stable is gone: the gate was opened from the inside, a horse came back lame, and the stablehands are not talking.',
    region: 'east-ford',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'low' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    // Each starter has a secret that fits one of these: this quest is where
    // the court first learns what its followers are hiding.
    tags: ['tracking', 'repair', 'medicine', 'negotiation'],
    rewards: {
      success: {
        brass: 10,
        local: { yard: 2, 'gate-watch': 1 },
        flags: ['stable-recovered'],
      },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3, 'gate-watch': -1 } },
    outcomes: {
      success:
        'The mounts were found grazing two valleys over. The stable gate’s latch was filed through, carefully, by someone who knew the fortress.',
      partial: 'Most of the mounts came home. The latch is still a mystery.',
      failure: 'The trail went cold at the ford.',
      expired: 'The court rode nowhere for a week and the Yard noticed.',
    },
  },
  {
    id: 'q-d07-crow-favor',
    title: 'The Crows’ Errand',
    summary:
      'The Conclave’s price for its storm warning: carry a sealed parcel to the Mirefen and do not open it.',
    region: 'mirefen',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['weather'],
    rewards: {
      success: {
        affinity: { 'storm-crows': 15, 'mire-mothers': -5 },
        flags: ['crow-parcel-delivered'],
        recruitable: ['F006'],
      },
      failure: { affinity: { 'storm-crows': -10 } },
    },
    expired: { affinity: { 'storm-crows': -10 } },
    outcomes: {
      success:
        'The parcel was delivered to a witch who did not seem surprised. It ticked, faintly, the whole way. A Storm Crow who had followed the courier asks to see the emperor about what was inside.',
      partial:
        'The parcel arrived damp. The Crows are not pleased, or not saying.',
      failure:
        'The parcel was lost in the reeds. Something in the reeds kept it.',
      expired: 'The Crows took back their warning, word by word.',
    },
  },
  {
    id: 'q-d08-escort-to-bell',
    title: 'A Family of Five',
    summary:
      'Walk a Freehold family to Hollow Bell, past the raider scouts, and see them settled with someone who will not lose track of them.',
    region: 'hollow-bell',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    rewards: {
      success: {
        affinity: { freeholds: 10, 'hollow-bell': 5 },
        flags: ['family-of-five-safe'],
      },
      failure: {
        affinity: { freeholds: -5 },
        flags: ['family-of-five-scattered'],
      },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'The family is lodged above the Hollow Bell bakery. The youngest gave the escort a drawing of a horse that is mostly legs.',
      partial: 'The family arrived, tired and frightened, missing their cart.',
      failure:
        'Raider scouts scattered the family on the road. Four were found by nightfall. Searchers are still looking for the fifth.',
      expired: 'Nobody came for them. The family went to the Abbey after all.',
    },
  },
  {
    id: 'q-d09-iron-convoy',
    title: 'Iron on the Road',
    summary:
      'A Saltroad convoy of salvaged iron must cross the rail canyon at night. Three bands want it. Whoever goes may not all come back.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense'],
    rewards: {
      triumph: {
        brass: 60,
        affinity: { saltroad: 15 },
        local: { 'gate-watch': 3, ledger: 2 },
        items: ['old-road-crowbar'],
      },
      success: {
        brass: 40,
        affinity: { saltroad: 10 },
        local: { 'gate-watch': 2 },
      },
      partial: { brass: 15, affinity: { saltroad: 3 } },
      failure: {
        affinity: { saltroad: -10 },
        local: { 'gate-watch': -3 },
        strength: { saltroad: -1 },
      },
    },
    expired: { affinity: { saltroad: -10 }, strength: { saltroad: -1 } },
    outcomes: {
      triumph:
        'The convoy crossed at dawn with every wagon. The caravan master pressed a salvaged crowbar on the escort as a keepsake.',
      success: 'The iron reached the far side. The escort did not sleep.',
      partial: 'Two wagons in five made it across.',
      failure: 'The canyon took the convoy, and not only the iron.',
      expired: 'The convoy went without an escort. It did not arrive.',
    },
  },
  {
    id: 'q-d10-freehold-raid',
    title: 'Smoke Over Thistledown',
    summary:
      'The Jackalwire are raiding Thistledown, the largest Freehold village. Whatever happens there will be on the map tomorrow.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        affinity: { freeholds: 20 },
        strength: { freeholds: 2, jackalwire: -2 },
        local: { 'gate-watch': 2 },
        flags: ['thistledown-held'],
        recruitable: ['F017'],
      },
      success: {
        affinity: { freeholds: 15 },
        strength: { freeholds: 1, jackalwire: -1 },
        flags: ['thistledown-held'],
        recruitable: ['F017'],
      },
      partial: {
        affinity: { freeholds: 5 },
        strength: { freeholds: -1 },
        recruitable: ['F017'],
      },
      failure: {
        affinity: { freeholds: -5 },
        strength: { freeholds: -2, jackalwire: 1 },
        flags: ['thistledown-burned'],
        recruitable: ['F017'],
      },
    },
    expired: {
      affinity: { freeholds: -15 },
      strength: { freeholds: -2, jackalwire: 1 },
      flags: ['thistledown-burned'],
      recruitable: ['F017'],
    },
    outcomes: {
      triumph:
        'Thistledown held, and the raiders were chased past the canyon mouth. The Freeholds will remember who came.',
      success: 'Thistledown held. Its granary did not.',
      partial: 'The raiders left with half the village’s stores.',
      failure:
        'Thistledown burned. Its people walked to the Eastern Ford with what they could carry.',
      expired:
        'No one went. Thistledown burned, and the Freeholds will remember that too.',
    },
  },
]

export const ACT_ONE_LATE_DAYS: readonly DayDef[] = [
  {
    day: 5,
    title: 'Raider’s Toll',
    briefings: [
      {
        id: 'vane-back',
        source: 'Saltroad cart-drivers',
        text: 'Gristle Vane’s painted wagons are back at the southern bridge, twice as many as before.',
        truth: true,
      },
      {
        id: 'yard-wages',
        source: 'The Yard’s foreman',
        text: 'The kitchens have three days of flour left at current wages.',
        truth: true,
      },
      {
        id: 'vane-retired',
        source: 'A Jackalwire deserter, for a fee',
        text: 'Gristle Vane has retired and the Pack is choosing a new captain by song.',
        truth: false,
      },
    ],
    komodo:
      'A deserter who sells news by the word has every reason to sell good news. Vane is back, Your Majesty, and Vane has never retired from anything.',
    quests: [],
    audiences: [
      {
        id: 'd05-toll',
        title: 'The Toll Comes Due',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { notFlags: ['feast-armed'] },
        lines: [
          'Your Majesty! We met at the bridge. I am the one with the excellent coat.',
          'The toll is thirty brass a week now. Prices rise. Or you could hire us to guard the carts we would otherwise be robbing. Or you could try to hold the bridge. I would enjoy watching that.',
        ],
        options: [
          {
            id: 'pay',
            label: 'Pay the toll. Thirty brass, this week only.',
            requires: { cost: 30 },
            effects: {
              affinity: { jackalwire: 10, saltroad: 5 },
              local: { ledger: -2 },
              flags: ['paid-vane-twice'],
            },
            response:
              'Vane bows so low his feathers sweep the floor. “This week only. Of course.”',
          },
          {
            id: 'hire',
            label: 'Hire the Pack to guard the Saltroad carts instead.',
            requires: { affinity: { jackalwire: 'wary' } },
            effects: {},
            response:
              'Vane looks, for a moment, honestly surprised. “Paid to do nothing to the carts. How restful.”',
            postsQuests: ['q-d05-saltroad-escort'],
          },
          {
            id: 'hold',
            label: 'Send a party to hold the bridge open.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'Vane grins with every tooth. “Bring snacks. It may take a while.”',
            postsQuests: ['q-d05-toll-standoff'],
          },
        ],
      },
      {
        id: 'd05-toll-grudge',
        title: 'The Toll Comes Due',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { flags: ['feast-armed'] },
        lines: [
          'You came to our feast with knives in the bread carts, Your Majesty. We noticed.',
          'The toll is fifty brass now. That is the price of an insult. Pay it, or hold the bridge yourself.',
        ],
        options: [
          {
            id: 'pay',
            label: 'Pay fifty brass and call it settled.',
            requires: { cost: 50 },
            effects: {
              affinity: { jackalwire: 15 },
              local: { ledger: -3 },
              clearFlags: ['feast-armed'],
            },
            response: 'Vane counts it twice. “Settled. For now.”',
          },
          {
            id: 'hold',
            label: 'Send a party to hold the bridge open.',
            effects: { affinity: { jackalwire: -5 } },
            response: '“Good,” says Vane. “I was hoping you’d say that.”',
            postsQuests: ['q-d05-toll-standoff'],
          },
        ],
      },
      {
        id: 'd05-flour',
        title: 'Three Days of Flour',
        speaker: 'The Yard’s foreman',
        faction: 'yard',
        lines: [
          'Three days of flour, Majesty. After that the ovens go cold and the Yard goes hungry, and a hungry Yard is a loud Yard.',
        ],
        options: [
          {
            id: 'buy',
            label: 'Buy flour from the Saltroad at their price.',
            requires: { cost: 20 },
            effects: {
              local: { yard: 3 },
              affinity: { saltroad: 5 },
              recruitable: ['F008'],
            },
            response:
              'The foreman nods once. That is a lot, from him. The buffalo who drove the flour cart counts every sack twice, and asks whether the crown needs someone who can count.',
          },
          {
            id: 'ration',
            label: 'Ration the bread until the next caravan.',
            effects: { local: { yard: -3, 'old-houses': 1 } },
            response: 'The foreman says nothing at all, which is worse.',
          },
          {
            id: 'old-houses',
            label: 'Ask the Old Houses to open their private stores.',
            requires: { local: { 'old-houses': 8 } },
            effects: {
              local: { yard: 3, 'old-houses': -3 },
              recruitable: ['F008'],
            },
            response:
              'The Old Houses open their larders, very slowly, as if they are being robbed politely. Their quartermaster, a buffalo with a ration abacus, stays behind to ask about work.',
          },
        ],
      },
    ],
  },
  {
    day: 6,
    title: 'The Empty Stable',
    briefings: [
      {
        id: 'stable-empty',
        source: 'The stablemaster',
        text: 'Every mount in the fortress stable was gone at dawn.',
        truth: true,
      },
      {
        id: 'stable-latch',
        source: 'A Gate Watch sentry',
        text: 'The stable gate was opened from the inside.',
        truth: true,
      },
      {
        id: 'stable-ghost',
        source: 'The kitchen boys',
        text: 'The old emperor’s ghost rode them all out at midnight.',
        truth: false,
      },
    ],
    komodo:
      'There is no ghost, Your Majesty, there is a latch. Send someone who notices things, and watch closely what they notice. You learn a great deal about people on a day like this.',
    quests: ['q-d06-empty-stable'],
    audiences: [
      {
        id: 'd06-market-charter',
        title: 'A Charter for the Market',
        speaker: 'The Ledger’s factor',
        faction: 'ledger',
        lines: [
          'The fortress market grew on its own, Majesty: three stalls became twelve. Twelve stalls need rules, or the strongest stall makes them.',
          'The Ledger would write those rules for you. For a small consideration.',
        ],
        options: [
          {
            id: 'charter',
            label: 'Grant the Ledger a market charter.',
            effects: {
              brass: 10,
              local: { ledger: 4, yard: -1 },
              flags: ['market-charter'],
            },
            response:
              'The factor produces a charter she had, by remarkable luck, already drafted.',
          },
          {
            id: 'yard-first',
            label: 'Give the Yard first pick of every stall.',
            effects: { local: { yard: 3, ledger: -2 } },
            response: 'The factor writes that down too, in a different ink.',
          },
          {
            id: 'archive-rules',
            label:
              'Have the Lamplight Archive write fair rules, posted on the gate.',
            requires: { local: { lamplight: 9 } },
            effects: { local: { lamplight: 2, ledger: 1, yard: 1 } },
            response:
              'Nobody gets everything. The rules are very long and very fair.',
          },
        ],
      },
    ],
  },
  {
    day: 7,
    title: 'A Crow’s Warning',
    briefings: [
      {
        id: 'crow-storm',
        source: 'A Storm Crow envoy',
        text: 'A dust storm will cross the Eastern Ford in three days.',
        truth: true,
      },
      {
        id: 'mole-tunnels-empty',
        source: 'Young Komodo’s own runner',
        text: 'The old Mole tunnels under the Eastern Ford collapsed years ago and are empty.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'freehold-harvest',
        source: 'Freehold reeves',
        text: 'The Freehold harvest is in the fields and will not be in for a week.',
        truth: true,
      },
    ],
    komodo:
      'My own runner checked the Ford tunnels himself, Your Majesty; I would not waste a party there. The Crow’s storm is a different matter. The Conclave never warns anyone for free.',
    quests: [],
    audiences: [
      {
        id: 'd07-crow-warning',
        title: 'A Crow’s Warning',
        speaker: 'A Storm Crow envoy',
        faction: 'storm-crows',
        lines: [
          'A storm is coming to the Eastern Ford, Your Majesty. Three days. The Freeholds’ harvest is still in the fields.',
          'The Conclave tells you this as a courtesy. The rest of the forecast, the hour and the path, costs a small errand.',
        ],
        options: [
          {
            id: 'errand',
            label: 'Accept the errand. Carry the Conclave’s parcel.',
            effects: {
              affinity: { freeholds: 5 },
              flags: ['crow-forecast-day10'],
              recruitable: ['F011'],
            },
            response:
              'The envoy hands over a sealed parcel wrapped in oilcloth. It is heavier than it looks. The gecko runner who carried it up the mountain does not leave with him.',
            postsQuests: ['q-d07-crow-favor'],
          },
          {
            id: 'pay',
            label: 'Pay for the forecast in brass instead.',
            requires: { cost: 25 },
            effects: {
              affinity: { freeholds: 5, 'storm-crows': -3 },
              flags: ['crow-forecast-day10'],
            },
            response:
              'The envoy takes the brass with visible distaste. Brass, his look says, is for people without imagination.',
          },
          {
            id: 'warn-freeholds',
            label:
              'Warn the Freeholds with what we already know, and owe nothing.',
            effects: { affinity: { freeholds: 3, 'storm-crows': -5 } },
            response:
              '“A third of a forecast,” says the envoy, “is worse than none.” He may be right.',
          },
        ],
      },
      {
        id: 'd07-old-houses',
        title: 'A Seat at Court',
        speaker: 'Lady Ottoline Vask of the Old Houses',
        faction: 'old-houses',
        lines: [
          'The Old Houses backed this throne when it was a heap of salvage, Majesty. We would like a seat on the court’s council to show for it.',
        ],
        options: [
          {
            id: 'seat',
            label: 'Give the Old Houses a council seat.',
            effects: {
              local: { 'old-houses': 4, yard: -2 },
              flags: ['old-houses-council-seat'],
            },
            response:
              'Lady Vask inclines her head exactly as far as gratitude requires.',
          },
          {
            id: 'seat-for-all',
            label: 'A seat, yes, and one for the Yard as well.',
            effects: {
              local: { 'old-houses': 1, yard: 3 },
              flags: ['open-council'],
            },
            response:
              'Lady Vask’s smile is very thin. “How democratic,” she says, as if it were a disease.',
          },
          {
            id: 'refuse',
            label: 'The council stays as it is.',
            effects: { local: { 'old-houses': -3 } },
            response: 'Lady Vask leaves without looking back. People notice.',
          },
        ],
      },
    ],
  },
  {
    day: 8,
    title: 'A Family of Five',
    briefings: [
      {
        id: 'freehold-refugees',
        source: 'The Gate Watch',
        text: 'A Freehold family of five is sleeping in the fortress gatehouse.',
        truth: true,
      },
      {
        id: 'abbey-beds',
        source: 'A sister of the Abbey',
        text: 'The Abbey has forty empty beds and warm meals for any child who needs one.',
        truth: true,
      },
      {
        id: 'raiders-gone',
        source: 'A tired Freehold reeve',
        text: 'The raider scouts have left the Freehold roads for the season.',
        truth: false,
      },
    ],
    komodo:
      'Forty empty beds is a great many for an orphanage that takes in every child it finds, Your Majesty. I would ask where the children go. Not today, perhaps. But I would ask.',
    quests: [],
    audiences: [
      {
        id: 'd08-family',
        title: 'A Family of Five',
        speaker: 'Wenna Coldbrook and Sister Marrow',
        npc: 'sister-marrow',
        faction: 'abbey',
        lines: [
          'Wenna Coldbrook stands with three children behind her and a baby on her hip. Their farm is ash. Beside her, an otter in grey Abbey robes smiles with great patience.',
          '“The Abbey would gladly take the little ones,” says Sister Marrow. “Warm beds. Lessons. Their mother may visit, of course, once they are settled.”',
        ],
        options: [
          {
            id: 'abbey',
            label: 'Let the Abbey take the children in.',
            effects: {
              affinity: { abbey: 10, freeholds: 3 },
              flags: ['abbey-took-coldbrook-children'],
            },
            response:
              'Sister Marrow gathers the children with practiced hands. Wenna watches them go and does not cry until the gate closes.',
          },
          {
            id: 'yard',
            label: 'House the whole family in the fortress Yard.',
            requires: { cost: 15 },
            effects: {
              local: { yard: 2 },
              affinity: { freeholds: 8, abbey: -3 },
              flags: ['coldbrooks-in-yard'],
              recruitable: ['F012'],
            },
            response:
              'Wenna holds the baby very tight. Sister Marrow’s smile does not move, and then she is gone. A young otter in a novice’s robe stays behind, and asks whether the Yard needs a cook.',
          },
          {
            id: 'escort',
            label: 'Send an escort to see them settled in Hollow Bell.',
            effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
            response:
              '“Of course,” says Sister Marrow. “The road is so dangerous for little ones.” Her novice, Brother Teodor, does not follow her out.',
            postsQuests: ['q-d08-escort-to-bell'],
          },
        ],
      },
      {
        id: 'd08-ledger-loan',
        title: 'An Offer of Credit',
        speaker: 'The Ledger’s factor',
        faction: 'ledger',
        lines: [
          'The Ledger would extend the crown a line of credit, Majesty. Forty brass now, a little more later. Every throne needs a friend at the counting table.',
        ],
        options: [
          {
            id: 'accept',
            label: 'Take the forty brass.',
            effects: {
              brass: 40,
              local: { ledger: 2 },
              flags: ['ledger-credit'],
            },
            response:
              'The factor writes the debt in a very small, very permanent hand.',
          },
          {
            id: 'decline',
            label: 'Decline politely. The crown pays its own way.',
            effects: { local: { ledger: -1, lamplight: 1 } },
            response: 'The factor closes her book. “Another time.”',
          },
        ],
      },
    ],
  },
  {
    day: 9,
    title: 'Iron on the Road',
    briefings: [
      {
        id: 'iron-convoy',
        source: 'Oriel Saltmarsh, caravan master',
        text: 'A convoy of salvaged iron will try the rail canyon tonight.',
        truth: true,
      },
      {
        id: 'three-bands',
        source: 'Rail canyon scouts',
        text: 'Three separate raider bands are camped above the canyon road.',
        truth: true,
      },
      {
        id: 'iron-cursed',
        source: 'A Saltroad fortune-teller',
        text: 'The iron was dug from a grave and anyone who guards it will die within the year.',
        truth: false,
      },
    ],
    komodo:
      'You will see a mark on this one’s posting, Your Majesty: lethal. It means what it says. Most quests cost a sprain and a week in bed. This one can cost a friend. Send strong people, or send nobody, but do not send them without knowing.',
    quests: ['q-d09-iron-convoy'],
    audiences: [
      {
        id: 'd09-convoy',
        title: 'Iron on the Road',
        speaker: 'Oriel Saltmarsh, caravan master',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'I have nine wagons of old-world iron and a canyon full of people who want it. My drivers will go tonight with or without an escort.',
          'The posting is on your board. If you would rather not risk your own, there are other swords for hire.',
        ],
        options: [
          {
            id: 'our-own',
            label: 'Our own will go. Check the board.',
            effects: { affinity: { saltroad: 3 } },
            response:
              'Oriel nods. “Then I will tell my drivers to sleep a little.”',
          },
          {
            id: 'hire-pack',
            label: 'Hire the Jackalwire to ride with the convoy instead.',
            requires: {
              cost: 25,
              affinity: { jackalwire: 'neutral' },
            },
            effects: {
              affinity: { saltroad: 5, jackalwire: 5 },
              flags: ['pack-guarded-iron'],
            },
            response:
              'Oriel looks at you for a long moment. “Wolves to guard the sheep. Bold. It may even work.”',
          },
          {
            id: 'not-ours',
            label: 'The crown cannot spare anyone tonight.',
            effects: { affinity: { saltroad: -3 } },
            response:
              'Oriel shrugs. “Then pray for my drivers. Somebody should.”',
          },
        ],
      },
      {
        id: 'd09-kitchens',
        title: 'The Kitchens Send Their Cook',
        speaker: 'Juniper Slate of the Yard',
        faction: 'yard',
        requires: { local: { yard: 12 } },
        lines: [
          'The Yard is behind the throne, Majesty, which means the kitchens are, which means me. I want to see what the court eats on the road.',
          'I can cook, I can bandage and I can tell you what the Yard says when you are not listening. Mostly that last one.',
        ],
        options: [
          {
            id: 'welcome',
            label: 'Bring Juniper into the barracks.',
            requires: { cost: 5 },
            effects: { recruit: ['F020'], local: { yard: 1 } },
            response:
              'Juniper salutes with a wooden spoon and is already rearranging the barracks pantry.',
          },
          {
            id: 'kitchens',
            label: 'The kitchens need you more than the road does.',
            effects: { local: { yard: 1 }, recruitable: ['F020'] },
            response:
              '“Fair,” says Juniper. “Ask again when the soup is better.”',
          },
        ],
      },
    ],
  },
  {
    day: 10,
    title: 'Oath of the Gate',
    briefings: [
      {
        id: 'thistledown',
        source: 'A rider from Thistledown',
        text: 'Jackalwire raiders are at the edge of Thistledown, the largest Freehold village.',
        truth: true,
      },
      {
        id: 'watch-oath',
        source: 'Captain Ferro Dunmark',
        text: 'The Gate Watch will swear its oath to the crown at noon.',
        truth: true,
      },
      {
        id: 'east-quiet',
        source: 'A Saltroad peddler',
        text: 'Nothing has moved in the sunken rail yards to the east for a hundred years.',
        truth: false,
      },
    ],
    komodo:
      'Something always moves in the east, Your Majesty; the crows have been watching it for a week. But today is the Watch’s day, and Thistledown’s. Whatever happens at that village will be on the map tomorrow.',
    quests: ['q-d10-freehold-raid'],
    audiences: [
      {
        id: 'd10-oath',
        title: 'Oath of the Gate',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'The Gate Watch is ready to swear, Majesty. Every one of them. They want to know what you swear back.',
          'Soldiers will die for a crown. They would rather know it will not spend them like brass.',
        ],
        options: [
          {
            id: 'care',
            label: '“I will never spend you cheaply.”',
            effects: {
              local: { 'gate-watch': 5, 'old-houses': -1 },
              flags: ['oath-of-care'],
              recruitable: ['F013'],
            },
            response:
              'Dunmark looks at you a long time, then nods. “They’ll hold you to that. So will I.” A rhino at the end of the line asks to serve the crown closer than the gate.',
          },
          {
            id: 'crown',
            label: '“You belong to the crown, before all else.”',
            effects: {
              local: { 'gate-watch': 2, 'old-houses': 3, yard: -2 },
              flags: ['oath-of-crown'],
            },
            response:
              'The Watch swears. It is loud and correct and nobody smiles.',
          },
          {
            id: 'bonus',
            label: 'Words are cheap. Pay every sworn guard a bonus.',
            requires: { cost: 30 },
            effects: {
              local: { 'gate-watch': 6, ledger: -1 },
              recruitable: ['F013'],
            },
            response:
              'The cheer is real. Whether the loyalty is, time will tell.',
          },
        ],
      },
    ],
  },
]
